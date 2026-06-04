import { NextRequest, NextResponse } from "next/server";
import {
  getRuleBasedRiskAssessment,
  mergeRiskAssessmentWithLocalSignals,
  parseRiskAssessmentJson,
  type RiskAssessment,
} from "../../../lib/risk";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type RiskAssessRequestBody = {
  message?: unknown;
  messages?: unknown;
};

type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const requestTimeoutMs = 20_000;
const maxMessages = 10;
const maxMessageLength = 1_200;

const systemPrompt = [
  "你是 Moodbridge 心桥的非诊断性心理风险提示分类器。",
  "只能根据有限中文对话识别潜在风险线索，不得诊断心理疾病，不得输出患病概率或确定性判断。",
  "不得推荐药物，不得给出治疗方案，不得替代医生、心理咨询师或紧急救援。",
  "如果信息不足，应降低 confidence，并在 missingInfo 和 followUpQuestion 中说明需要补充什么。",
  "自伤、自杀或伤害他人相关表达必须优先提示危机支持，而不是只推荐问卷。",
  "问卷只能作为自我了解和专业沟通前的参考，不能说问卷结果等同诊断。",
  "仅返回一个 JSON 对象，不要返回 Markdown、解释文字或代码块。",
  'JSON 字段必须为：{"riskLevel":"low | medium | high | emergency","confidence":"low | medium | high","signals":[],"missingInfo":[],"shouldAskFollowUp":true,"followUpQuestion":null,"suggestedScreeners":[],"recommendedAction":"","crisisResources":[]}',
].join("\n");

function isClientMessage(message: unknown): message is ClientMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<ClientMessage>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

function normalizeMessages(body: RiskAssessRequestBody): ClientMessage[] {
  if (Array.isArray(body.messages)) {
    return body.messages
      .filter(isClientMessage)
      .map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, maxMessageLength),
      }))
      .filter((message) => message.content.length > 0)
      .slice(-maxMessages);
  }

  if (typeof body.message === "string" && body.message.trim().length > 0) {
    return [
      {
        role: "user",
        content: body.message.trim().slice(0, maxMessageLength),
      },
    ];
  }

  return [];
}

function extractModelContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = candidate.choices?.[0]?.message?.content;

  return typeof content === "string" && content.trim().length > 0
    ? content.trim()
    : null;
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return "";
  }

  return trimmed.slice(start, end + 1);
}

function errorAssessment(message: string): RiskAssessment {
  return {
    riskLevel: "low",
    confidence: "low",
    signals: [],
    missingInfo: [],
    shouldAskFollowUp: false,
    followUpQuestion: null,
    suggestedScreeners: [],
    recommendedAction: message,
    crisisResources: [],
  };
}

function jsonResponse(assessment: RiskAssessment, status = 200) {
  return NextResponse.json(assessment, { status });
}

export async function POST(request: NextRequest) {
  let body: RiskAssessRequestBody;

  try {
    body = (await request.json()) as RiskAssessRequestBody;
  } catch {
    return jsonResponse(errorAssessment("请求格式不正确。"), 400);
  }

  const messages = normalizeMessages(body);
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return jsonResponse(errorAssessment("请输入需要评估的内容。"), 400);
  }

  const conversationText = messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const ruleAssessment = getRuleBasedRiskAssessment(conversationText);

  if (ruleAssessment) {
    return jsonResponse(ruleAssessment);
  }

  const apiKey = process.env.AI_API_KEY ?? process.env.MODEL_API_KEY;
  const apiBaseUrl =
    process.env.MODEL_API_BASE_URL ??
    "https://api.openai.com/v1/chat/completions";
  const model = process.env.MODEL_NAME ?? "gpt-4o-mini";

  if (!apiKey) {
    return jsonResponse(errorAssessment("服务端 AI_API_KEY 尚未配置。"), 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const modelMessages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        "请基于以下有限对话给出非诊断性的心理风险提示 JSON。",
        "不要判断用户是否患病，不要给出患病概率。",
        "若只看到低落、兴趣下降、无意义感，可建议 PHQ-9。",
        "若只看到焦虑、紧张、过度担心，可建议 GAD-7。",
        "若看到自伤、自杀或伤害他人表达，应优先提示危机支持。",
        "",
        conversationText,
      ].join("\n"),
    },
  ];

  try {
    const response = await fetch(apiBaseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: modelMessages,
        temperature: 0,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return jsonResponse(errorAssessment("模型服务暂时不可用，请稍后再试。"), 502);
    }

    const payload = await response.json();
    const content = extractModelContent(payload);

    if (!content) {
      return jsonResponse(errorAssessment("模型回复为空，请稍后再试。"), 502);
    }

    const parsed = parseRiskAssessmentJson(extractJsonObject(content));
    const merged = mergeRiskAssessmentWithLocalSignals(
      parsed,
      conversationText,
    );

    return jsonResponse(merged);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonResponse(errorAssessment("请求超时，请稍后再试。"), 504);
    }

    return jsonResponse(errorAssessment("接口请求失败，请稍后再试。"), 502);
  } finally {
    clearTimeout(timeout);
  }
}
