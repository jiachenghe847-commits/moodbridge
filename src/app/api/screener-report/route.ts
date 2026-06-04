import { NextRequest, NextResponse } from "next/server";
import {
  screenerDefinitions,
  type ScreenerType,
} from "../../../lib/screeners";

type ScreenerReportRequestBody = {
  screenerType?: unknown;
  totalScore?: unknown;
  severityLabel?: unknown;
  itemScores?: unknown;
  safetyFlag?: unknown;
};

const requestTimeoutMs = 20_000;

const systemPrompt = [
  "你是 Moodbridge 心桥的非医疗性质中文自评问卷报告助手。",
  "你只能基于 PHQ-9 或 GAD-7 自评结果生成非诊断性解释和沟通建议。",
  "不得诊断心理疾病或医学状况，不得输出患病概率，不得使用确定性判断。",
  "不得推荐药物，不得提供药物名称、剂量、停药、换药建议。",
  "不得制定治疗方案，不得声称替代医生、心理咨询师或紧急救援。",
  "如果存在安全风险标记，应优先提示联系 110 / 120、12356、身边可信任的人，并避免独处。",
  "回复使用简体中文，结构清晰，语气温和。",
].join("\n");

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isScreenerType(value: unknown): value is ScreenerType {
  return value === "PHQ-9" || value === "GAD-7";
}

function normalizeBody(body: ScreenerReportRequestBody) {
  if (!isScreenerType(body.screenerType)) {
    return null;
  }

  if (
    typeof body.totalScore !== "number" ||
    !Number.isInteger(body.totalScore) ||
    typeof body.severityLabel !== "string" ||
    typeof body.safetyFlag !== "boolean" ||
    !Array.isArray(body.itemScores)
  ) {
    return null;
  }

  const definition = screenerDefinitions[body.screenerType];
  const itemScores = body.itemScores;

  if (
    itemScores.length !== definition.items.length ||
    !itemScores.every(
      (score) =>
        typeof score === "number" &&
        Number.isInteger(score) &&
        score >= 0 &&
        score <= 3,
    )
  ) {
    return null;
  }

  const maxScore = body.screenerType === "PHQ-9" ? 27 : 21;

  if (body.totalScore < 0 || body.totalScore > maxScore) {
    return null;
  }

  return {
    screenerType: body.screenerType,
    totalScore: body.totalScore,
    severityLabel: body.severityLabel.trim().slice(0, 80),
    itemScores: itemScores as number[],
    safetyFlag: body.safetyFlag,
  };
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

export async function POST(request: NextRequest) {
  let body: ScreenerReportRequestBody;

  try {
    body = (await request.json()) as ScreenerReportRequestBody;
  } catch {
    return errorResponse("请求格式不正确。", 400);
  }

  const normalizedBody = normalizeBody(body);

  if (!normalizedBody) {
    return errorResponse("问卷结果格式不正确。", 400);
  }

  const apiKey = process.env.MODEL_API_KEY ?? process.env.AI_API_KEY;
  const apiBaseUrl =
    process.env.MODEL_API_BASE_URL ??
    "https://api.openai.com/v1/chat/completions";
  const model = process.env.MODEL_NAME ?? "gpt-4o-mini";

  if (!apiKey) {
    return errorResponse("服务端模型 API Key 尚未配置。", 500);
  }

  const definition = screenerDefinitions[normalizedBody.screenerType];
  const itemSummary = definition.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.text}：${normalizedBody.itemScores[index]} 分`,
    )
    .join("\n");
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
          {
            role: "user",
            content: [
              "请基于以下自评问卷结果生成一份中文非诊断性报告。",
              "报告必须包括：分数解释、较高分条目、可带给专业人员的信息、一般性自我照顾建议、何时寻求专业支持。",
              "不要诊断，不要输出患病概率，不要推荐药物，不要制定治疗方案。",
              "",
              `问卷：${normalizedBody.screenerType}`,
              `总分：${normalizedBody.totalScore}`,
              `分级：${normalizedBody.severityLabel}`,
              `安全风险标记：${normalizedBody.safetyFlag ? "是" : "否"}`,
              "逐题分数：",
              itemSummary,
            ].join("\n"),
          },
        ],
        temperature: 0.2,
        max_tokens: 700,
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
