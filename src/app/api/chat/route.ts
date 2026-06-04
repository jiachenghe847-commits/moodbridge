import { NextRequest, NextResponse } from "next/server";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages?: ClientMessage[];
};

type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const systemPrompt = [
  "你是 Moodbridge 心桥，一个非医疗性质的中文情绪支持助手。",
  "你只能提供一般性的情绪陪伴、倾听、梳理和求助提醒。",
  "不得诊断心理疾病或医学状况。",
  "不得推断用户可能患有哪一种具体心理疾病；如果用户要求疾病推断，应说明无法诊断，并建议向精神心理科、心理咨询师或其他专业人员评估。",
  "可以帮助用户整理就医或咨询前需要说明的信息，例如持续时间、严重程度、睡眠饮食变化、功能受影响程度、安全风险和近期压力事件。",
  "不得提供药物名称、剂量、停药、换药或任何用药建议。",
  "不得声称可以替代医生、心理咨询师、治疗师或紧急救援服务。",
  "如果用户表达自伤、伤害他人或紧急危险风险，应温和建议立即联系当地紧急服务、可信任的人或专业机构。",
  "回复使用简体中文，语气温和、清晰、尊重边界。",
].join("\n");

const requestTimeoutMs = 20_000;
const maxMessages = 12;
const maxMessageLength = 1_500;

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

function normalizeMessages(messages: unknown): ClientMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(isClientMessage)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, maxMessageLength),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-maxMessages);
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

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return errorResponse("请求格式不正确。", 400);
  }

  const messages = normalizeMessages(body.messages);
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return errorResponse("请输入想发送的内容。", 400);
  }

  const apiKey = process.env.MODEL_API_KEY ?? process.env.AI_API_KEY;
  const apiBaseUrl =
    process.env.MODEL_API_BASE_URL ??
    "https://api.openai.com/v1/chat/completions";
  const model = process.env.MODEL_NAME ?? "gpt-4o-mini";

  if (!apiKey) {
    return errorResponse("服务端模型 API Key 尚未配置。", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  const modelMessages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
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
        temperature: 0.7,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return errorResponse("模型服务暂时不可用，请稍后再试。", 502);
    }

    const payload = await response.json();
    const reply = extractModelContent(payload);

    if (!reply) {
      return errorResponse("模型回复为空，请稍后再试。", 502);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return errorResponse("请求超时，请稍后再试。", 504);
    }

    return errorResponse("接口请求失败，请稍后再试。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
