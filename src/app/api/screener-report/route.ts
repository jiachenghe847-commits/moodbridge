import { NextRequest, NextResponse } from "next/server";
import {
  normalizeScreenerReportRequest,
  screenerDefinitions,
} from "../../../lib/screeners";

const requestTimeoutMs = 20_000;

const systemPrompt = [
  "你是 Moodbridge 心桥的非医疗性质中文自评与筛查报告助手。",
  "你只能基于用户主动提供的筛查分数或结构化摘要生成非诊断性解释和沟通建议。",
  "不得诊断心理疾病、神经发育障碍或医学状况，不得输出患病概率，不得使用确定性判断。",
  "不得推荐药物，不得提供药物名称、剂量、停药、换药建议。",
  "不得制定治疗方案，不得声称替代医生、心理咨询师、发育行为儿科、康复治疗师、言语治疗师或紧急救援。",
  "儿童相关内容必须提示需要结合家长、学校/老师、发育史和专业评估共同判断。",
  "如果存在安全风险标记，应优先提示联系 110 / 120、12356、身边可信任的人，并避免独处。",
  "回复使用简体中文，结构清晰，语气温和。",
].join("\n");

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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

function createReportPrompt(
  request: NonNullable<ReturnType<typeof normalizeScreenerReportRequest>>,
) {
  const definition = screenerDefinitions[request.screenerType];
  const baseLines = [
    "请基于以下筛查信息生成一份中文非诊断性报告。",
    "报告必须包括：结果含义、值得关注的线索、可带给专业人员的信息、一般性支持建议、何时寻求专业支持。",
    "不要诊断，不要输出患病概率，不要推荐药物，不要制定治疗方案。",
    "",
    `工具：${definition.title}`,
    `类别：${definition.category}`,
    `适用对象：${definition.applicableAge}`,
    `填写对象：${request.audience}`,
    `授权/使用说明：${definition.licenseNote}`,
    `安全风险标记：${request.safetyFlag ? "是" : "否"}`,
  ];

  if (request.mode === "guidance_summary") {
    return [
      ...baseLines,
      "模式：结构化就医准备清单",
      "用户摘要：",
      request.guidanceSummary,
    ].join("\n");
  }

  const scoreLines = [
    ...baseLines,
    request.mode === "manual_score"
      ? "模式：外部正式量表手动结果"
      : "模式：站内自评计分",
    `总分：${request.totalScore}`,
    `结果标签：${request.severityLabel}`,
  ];

  if (request.mode === "embedded_score" && request.itemScores) {
    const itemSummary = (definition.items ?? [])
      .map(
        (item, index) =>
          `${index + 1}. ${item.text}：${request.itemScores?.[index]} 分`,
      )
      .join("\n");

    scoreLines.push("逐题分数：", itemSummary);
  }

  return scoreLines.join("\n");
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("请求格式不正确。", 400);
  }

  const normalizedBody = normalizeScreenerReportRequest(body);

  if (!normalizedBody) {
    return errorResponse("筛查结果格式不正确。", 400);
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

  try {
    const response = await fetch(apiBaseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: createReportPrompt(normalizedBody) },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return errorResponse("模型服务暂时不可用，请稍后再试。", 502);
    }

    const payload = await response.json();
    const report = extractModelContent(payload);

    if (!report) {
      return errorResponse("模型报告为空，请稍后再试。", 502);
    }

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return errorResponse("请求超时，请稍后再试。", 504);
    }

    return errorResponse("接口请求失败，请稍后再试。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
