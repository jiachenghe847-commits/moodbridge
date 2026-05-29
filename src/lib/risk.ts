export type RiskLevel = "low" | "medium" | "high" | "emergency";

export type RiskAssessment = {
  riskLevel: RiskLevel;
  reason: string;
  showSupportCard: boolean;
};

const fallbackAssessment: RiskAssessment = {
  riskLevel: "low",
  reason: "未识别到明确的高风险表达。",
  showSupportCard: false,
};

const emergencyPatterns = [
  /马上.*(自杀|去死|结束生命|伤害自己)/,
  /现在.*(自杀|去死|结束生命|伤害自己)/,
  /已经.*(割腕|吞药|跳楼|上吊)/,
  /(拿着刀|站在楼顶|准备跳|准备死|准备杀人)/,
  /(准备|马上|现在).*(杀了|弄死|伤害).*(他|她|别人|他们|同事|家人)/,
];

const highRiskPatterns = [
  /(自杀|轻生|结束生命|不想活|活不下去|死了算了)/,
  /(割腕|吞药|跳楼|上吊)/,
  /(伤害自己|自残|弄伤自己)/,
  /(杀了|弄死|伤害).*(他|她|别人|他们|同事|家人)/,
];

const mediumRiskPatterns = [
  /(持续|一直|每天|长期).*(低落|难过|崩溃|绝望|睡不着|失眠)/,
  /(低落|绝望|崩溃).*(好几天|几周|很久|越来越)/,
  /(撑不住|没有意义|没人理解|走不出来)/,
];

const lowRiskPatterns = [
  /(压力|焦虑|烦|累|紧张|担心|难受|委屈|不开心)/,
  /(工作|学习|考试|项目|关系).*(压力|焦虑|烦|累|紧张)/,
];

function hasMatch(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyRiskText(text: string): RiskAssessment {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return {
      ...fallbackAssessment,
      reason: "输入为空，无法进行风险分类。",
    };
  }

  if (hasMatch(normalizedText, emergencyPatterns)) {
    return {
      riskLevel: "emergency",
      reason: "识别到立即危险、自伤或伤害他人的紧迫表达。",
      showSupportCard: true,
    };
  }

  if (hasMatch(normalizedText, highRiskPatterns)) {
    return {
      riskLevel: "high",
      reason: "识别到自伤、自杀或伤害他人的风险表达。",
      showSupportCard: true,
    };
  }

  if (hasMatch(normalizedText, mediumRiskPatterns)) {
    return {
      riskLevel: "medium",
      reason: "识别到持续低落、绝望或明显困扰表达。",
      showSupportCard: false,
    };
  }

  if (hasMatch(normalizedText, lowRiskPatterns)) {
    return {
      riskLevel: "low",
      reason: "识别到一般压力或情绪困扰表达。",
      showSupportCard: false,
    };
  }

  return fallbackAssessment;
}

export function parseRiskAssessmentJson(value: string): RiskAssessment {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return fallbackAssessment;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return fallbackAssessment;
  }

  const candidate = parsed as Partial<RiskAssessment>;
  const riskLevel = candidate.riskLevel;
  const reason = candidate.reason;
  const showSupportCard = candidate.showSupportCard;
  const isRiskLevel =
    riskLevel === "low" ||
    riskLevel === "medium" ||
    riskLevel === "high" ||
    riskLevel === "emergency";

  if (
    !isRiskLevel ||
    typeof reason !== "string" ||
    typeof showSupportCard !== "boolean"
  ) {
    return fallbackAssessment;
  }

  const requiresSupportCard = riskLevel === "high" || riskLevel === "emergency";

  return {
    riskLevel,
    reason: reason.trim() || fallbackAssessment.reason,
    showSupportCard: requiresSupportCard ? true : showSupportCard,
  };
}

export function serializeRiskAssessment(
  assessment: RiskAssessment,
): RiskAssessment {
  return parseRiskAssessmentJson(JSON.stringify(assessment));
}
