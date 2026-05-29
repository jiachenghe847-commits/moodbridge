import { NextRequest, NextResponse } from "next/server";
import {
  classifyRiskText,
  serializeRiskAssessment,
} from "../../../lib/risk";

type RiskRequestBody = {
  message?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      riskLevel: "low",
      reason: message,
      showSupportCard: false,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  let body: RiskRequestBody;

  try {
    body = (await request.json()) as RiskRequestBody;
  } catch {
    return errorResponse("请求格式不正确。", 400);
  }

  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    return errorResponse("输入为空，无法进行风险分类。", 400);
  }

  const assessment = serializeRiskAssessment(classifyRiskText(body.message));

  return NextResponse.json(assessment);
}
