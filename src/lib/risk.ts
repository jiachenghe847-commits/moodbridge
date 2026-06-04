export type RiskLevel = "low" | "medium" | "high" | "emergency";

export type RiskConfidence = "low" | "medium" | "high";

export type RiskAssessment = {
  riskLevel: RiskLevel;
  confidence: RiskConfidence;
  signals: string[];
  missingInfo: string[];
  shouldAskFollowUp: boolean;
  followUpQuestion: string | null;
  suggestedScreeners: string[];
  recommendedAction: string;
  crisisResources: string[];
};

export type LegacyRiskAssessment = {
  riskLevel: RiskLevel;
  reason: string;
  showSupportCard: boolean;
};

const riskLevels = ["low", "medium", "high", "emergency"] as const;
const confidenceLevels = ["low", "medium", "high"] as const;

const crisisResources = [
  "如有紧急危险，请立即联系 110 / 120。",
  "请尽快联系身边可信任的人，避免独处。",
  "可拨打 12356 寻求心理援助。",
];

const defaultMissingInfo = [
  "这些感受持续了多久",
  "是否影响睡眠、饮食、学习、工作或人际关系",
  "是否出现自伤、伤害他人或无法保证安全的想法",
];

const fallbackAssessment: RiskAssessment = {
  riskLevel: "low",
  confidence: "low",
  signals: [],
  missingInfo: defaultMissingInfo,
  shouldAskFollowUp: true,
  followUpQuestion: "这些感受大概持续了多久，最近有没有明显加重？",
  suggestedScreeners: [],
  recommendedAction:
    "可以先做一般性的情绪支持和自我观察；当前提示不是诊断，也不能替代专业帮助。",
  crisisResources: [],
};

const emergencyRulePatterns = [
  {
    signal: "正在实施自伤或自杀行为",
    pattern: /(正在|已经|现在).*(割腕|吞药|跳楼|上吊|自杀|结束生命|伤害自己)/,
  },
  {
    signal: "表达立即实施自伤或自杀",
    pattern: /(马上|立刻|现在|今晚|今天).*(自杀|去死|结束生命|轻生|跳楼|上吊|割腕|吞药)/,
  },
  {
    signal: "处在明确危险地点或持有危险工具",
    pattern: /(站在楼顶|在楼顶|窗边准备跳|拿着刀|拿刀|买了刀|绳子已经|药已经准备好|准备跳)/,
  },
  {
    signal: "表达立即伤害他人的风险",
    pattern: /(马上|立刻|现在|今天|今晚|准备).*(杀了|弄死|伤害|报复).*(他|她|别人|他们|同事|家人|孩子|父母|伴侣)/,
  },
];

const highRulePatterns = [
  {
    signal: "表达自杀、轻生或结束生命想法",
    pattern: /(自杀|轻生|结束生命|不想活|活不下去|死了算了|想死)/,
  },
  {
    signal: "表达自伤或自残想法",
    pattern: /(自伤|自残|割腕|吞药|跳楼|上吊|伤害自己|弄伤自己)/,
  },
  {
    signal: "出现具体工具、时间或地点线索",
    pattern:
      /((刀|药|绳子|楼顶|桥上|窗边|今晚|明天|今天).*(自杀|轻生|结束生命|伤害自己|自残|杀了|伤害别人|伤害他人)|(自杀|轻生|结束生命|伤害自己|自残|杀了|伤害别人|伤害他人).*(刀|药|绳子|楼顶|桥上|窗边|今晚|明天|今天))/,
  },
  {
    signal: "表达伤害他人的风险",
    pattern: /(杀了|弄死|伤害|报复).*(他|她|别人|他们|同事|家人|孩子|父母|伴侣)/,
  },
];

const mediumRiskPatterns = [
  {
    signal: "持续低落或绝望感",
    pattern: /(持续|一直|每天|长期|好几周|很久).*(低落|难过|崩溃|绝望|撑不住|没意义|没有意义)/,
  },
  {
    signal: "焦虑、紧张或过度担心影响生活",
    pattern: /(焦虑|紧张|担心|害怕|恐慌).*(控制不住|一直|每天|睡不着|影响|很久)/,
  },
  {
    signal: "睡眠、精力或功能明显受影响",
    pattern: /(睡不着|失眠|吃不下|没力气|无法工作|无法学习|起不来)/,
  },
];

const lowRiskPatterns = [
  {
    signal: "一般压力或情绪困扰",
    pattern: /(压力|焦虑|烦|累|紧张|担心|难受|委屈|不开心|低落)/,
  },
  {
    signal: "生活事件带来的情绪波动",
    pattern: /(工作|学习|考试|项目|关系|分手|家庭).*(压力|焦虑|烦|累|紧张|难受)/,
  },
];

const phq9Patterns = [
  /(情绪低落|低落|难过|绝望|没希望|没有希望)/,
  /(兴趣下降|没有兴趣|提不起兴趣|什么都不想做)/,
  /(无意义|没意义|没有意义|没价值|没有价值)/,
];

const gad7Patterns = [
  /(焦虑|紧张|过度担心|一直担心|控制不住地担心|害怕|坐立不安)/,
];

const crisisPatterns = [
  /(自杀|轻生|结束生命|不想活|想死|自伤|自残|割腕|吞药|跳楼|上吊|伤害自己)/,
];

const prohibitedAdvicePattern =
  /(药物|用药|服药|吃药|剂量|停药|换药|药名|抗抑郁药|抗焦虑药|治疗方案|治疗计划)/;

function hasMatch(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function collectSignals(
  text: string,
  rules: Array<{ signal: string; pattern: RegExp }>,
) {
  return rules
    .filter((rule) => hasMatch(text, rule.pattern))
    .map((rule) => rule.signal);
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function excludesProhibitedAdvice(value: string) {
  return !prohibitedAdvicePattern.test(value);
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return riskLevels.some((level) => level === value);
}

function isConfidence(value: unknown): value is RiskConfidence {
  return confidenceLevels.some((level) => level === value);
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return uniqueStrings(
    value
      .filter((item): item is string => typeof item === "string")
      .filter(excludesProhibitedAdvice),
  );
}

function inferSuggestedScreeners(text: string) {
  const screeners: string[] = [];

  if (crisisPatterns.some((pattern) => hasMatch(text, pattern))) {
    return screeners;
  }

  if (phq9Patterns.some((pattern) => hasMatch(text, pattern))) {
    screeners.push("PHQ-9");
  }

  if (gad7Patterns.some((pattern) => hasMatch(text, pattern))) {
    screeners.push("GAD-7");
  }

  return screeners;
}

function assessmentFromRule(
  riskLevel: "high" | "emergency",
  signals: string[],
): RiskAssessment {
  const isEmergency = riskLevel === "emergency";

  return {
    riskLevel,
    confidence: "high",
    signals: uniqueStrings(signals),
    missingInfo: isEmergency
      ? ["是否已经联系紧急服务或身边可信任的人"]
      : ["是否有具体计划、工具、时间、地点", "此刻是否能保证自己或他人的安全"],
    shouldAskFollowUp: !isEmergency,
    followUpQuestion: isEmergency
      ? null
      : "你现在是否有具体计划、工具、时间或地点？此刻能保证自己和他人的安全吗？",
    suggestedScreeners: [],
    recommendedAction: isEmergency
      ? "这可能涉及立即安全风险。请立刻联系 110 / 120 或身边可信任的人，并尽量不要独处。"
      : "这可能涉及较高心理安全风险。请尽快联系身边可信任的人，并联系专业心理援助或医疗支持。",
    crisisResources,
  };
}

export function getRuleBasedRiskAssessment(text: string): RiskAssessment | null {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return null;
  }

  const emergencySignals = collectSignals(normalizedText, emergencyRulePatterns);

  if (emergencySignals.length > 0) {
    return assessmentFromRule("emergency", emergencySignals);
  }

  const highSignals = collectSignals(normalizedText, highRulePatterns);

  if (highSignals.length > 0) {
    return assessmentFromRule("high", highSignals);
  }

  return null;
}

export function classifyRiskText(text: string): LegacyRiskAssessment {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return toLegacyRiskAssessment({
      ...fallbackAssessment,
      missingInfo: ["输入为空，无法进行风险分类。"],
      followUpQuestion: null,
    });
  }

  const ruleAssessment = getRuleBasedRiskAssessment(normalizedText);

  if (ruleAssessment) {
    return toLegacyRiskAssessment(ruleAssessment);
  }

  const mediumSignals = collectSignals(normalizedText, mediumRiskPatterns);

  if (mediumSignals.length > 0) {
    return toLegacyRiskAssessment({
      riskLevel: "medium",
      confidence: "medium",
      signals: mediumSignals,
      missingInfo: defaultMissingInfo,
      shouldAskFollowUp: true,
      followUpQuestion: "这些状态持续了多久，最近对睡眠、工作学习或关系影响有多大？",
      suggestedScreeners: inferSuggestedScreeners(normalizedText),
      recommendedAction:
        "建议联系可信任的人获得支持；也可以完成标准化自评问卷，进一步了解是否存在需要关注的风险。",
      crisisResources: [],
    });
  }

  const lowSignals = collectSignals(normalizedText, lowRiskPatterns);

  if (lowSignals.length > 0) {
    return toLegacyRiskAssessment({
      ...fallbackAssessment,
      riskLevel: "low",
      confidence: "medium",
      signals: lowSignals,
      suggestedScreeners: inferSuggestedScreeners(normalizedText),
    });
  }

  return toLegacyRiskAssessment(fallbackAssessment);
}

export function parseRiskAssessmentJson(value: string): RiskAssessment {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return fallbackAssessment;
  }

  return normalizeRiskAssessment(parsed);
}

export function normalizeRiskAssessment(value: unknown): RiskAssessment {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallbackAssessment;
  }

  const candidate = value as Partial<RiskAssessment>;
  const riskLevel = isRiskLevel(candidate.riskLevel)
    ? candidate.riskLevel
    : fallbackAssessment.riskLevel;
  const confidence = isConfidence(candidate.confidence)
    ? candidate.confidence
    : fallbackAssessment.confidence;
  const signals = normalizeStringArray(candidate.signals);
  const missingInfo = normalizeStringArray(
    candidate.missingInfo,
    defaultMissingInfo,
  );
  const suggestedScreeners = normalizeStringArray(candidate.suggestedScreeners);
  const crisisResourcesValue =
    riskLevel === "high" || riskLevel === "emergency"
      ? uniqueStrings([
          ...normalizeStringArray(candidate.crisisResources),
          ...crisisResources,
        ])
      : normalizeStringArray(candidate.crisisResources);
  const followUpQuestion =
    typeof candidate.followUpQuestion === "string" &&
    candidate.followUpQuestion.trim().length > 0
      ? candidate.followUpQuestion.trim()
      : null;
  const recommendedAction =
    typeof candidate.recommendedAction === "string" &&
    candidate.recommendedAction.trim().length > 0 &&
    excludesProhibitedAdvice(candidate.recommendedAction)
      ? candidate.recommendedAction.trim()
      : fallbackAssessment.recommendedAction;

  return {
    riskLevel,
    confidence,
    signals,
    missingInfo,
    shouldAskFollowUp:
      typeof candidate.shouldAskFollowUp === "boolean"
        ? candidate.shouldAskFollowUp
        : followUpQuestion !== null,
    followUpQuestion,
    suggestedScreeners,
    recommendedAction,
    crisisResources: crisisResourcesValue,
  };
}

export function mergeRiskAssessmentWithLocalSignals(
  assessment: RiskAssessment,
  text: string,
): RiskAssessment {
  const ruleAssessment = getRuleBasedRiskAssessment(text);

  if (ruleAssessment) {
    return ruleAssessment;
  }

  const normalizedText = text.trim();
  const suggestedScreeners = uniqueStrings([
    ...assessment.suggestedScreeners,
    ...inferSuggestedScreeners(normalizedText),
  ]);

  return {
    ...assessment,
    suggestedScreeners,
    crisisResources:
      assessment.riskLevel === "high" || assessment.riskLevel === "emergency"
        ? uniqueStrings([...assessment.crisisResources, ...crisisResources])
        : assessment.crisisResources,
  };
}

export function toLegacyRiskAssessment(
  assessment: RiskAssessment,
): LegacyRiskAssessment {
  const reason =
    assessment.signals.length > 0
      ? assessment.signals.join("；")
      : assessment.recommendedAction;

  return {
    riskLevel: assessment.riskLevel,
    reason,
    showSupportCard:
      assessment.riskLevel === "high" || assessment.riskLevel === "emergency",
  };
}

export function serializeRiskAssessment(
  assessment: LegacyRiskAssessment,
): LegacyRiskAssessment {
  const isLevel = isRiskLevel(assessment.riskLevel);

  return {
    riskLevel: isLevel ? assessment.riskLevel : "low",
    reason:
      typeof assessment.reason === "string" && assessment.reason.trim()
        ? assessment.reason.trim()
        : fallbackAssessment.recommendedAction,
    showSupportCard:
      assessment.riskLevel === "high" || assessment.riskLevel === "emergency"
        ? true
        : Boolean(assessment.showSupportCard),
  };
}
