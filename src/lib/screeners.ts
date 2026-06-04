export type ScreenerType = "PHQ-9" | "GAD-7";

export type ScreenerOption = {
  label: string;
  value: 0 | 1 | 2 | 3;
};

export type ScreenerItem = {
  id: string;
  text: string;
};

export type ScreenerDefinition = {
  type: ScreenerType;
  title: string;
  description: string;
  sourceUrl: string;
  items: ScreenerItem[];
};

export type ScreenerResult = {
  screenerType: ScreenerType;
  totalScore: number;
  severityLabel: string;
  itemScores: number[];
  safetyFlag: boolean;
};

export const screenerOptions: ScreenerOption[] = [
  { label: "完全没有", value: 0 },
  { label: "几天", value: 1 },
  { label: "一半以上天数", value: 2 },
  { label: "几乎每天", value: 3 },
];

export const screenerDefinitions: Record<ScreenerType, ScreenerDefinition> = {
  "PHQ-9": {
    type: "PHQ-9",
    title: "PHQ-9 抑郁相关症状自评",
    description:
      "用于回顾过去两周低落心境、兴趣下降等相关体验的频率；结果只用于自我了解和专业沟通。",
    sourceUrl: "https://www.nih.gov/node/19946",
    items: [
      { id: "phq1", text: "做事时提不起劲或没有兴趣。" },
      { id: "phq2", text: "感到心情低落、沮丧或绝望。" },
      { id: "phq3", text: "入睡困难、睡不安稳或睡眠过多。" },
      { id: "phq4", text: "感觉疲倦或没有活力。" },
      { id: "phq5", text: "食欲不振或吃太多。" },
      { id: "phq6", text: "觉得自己很糟，或觉得自己让自己或家人失望。" },
      { id: "phq7", text: "难以集中注意力，例如看书、看电视或工作学习。" },
      { id: "phq8", text: "动作或说话慢到别人可能注意到，或相反地坐立不安、动来动去。" },
      { id: "phq9", text: "想到不如死掉，或用某种方式伤害自己。" },
    ],
  },
  "GAD-7": {
    type: "GAD-7",
    title: "GAD-7 焦虑相关症状自评",
    description:
      "用于回顾过去两周紧张、担心、坐立不安等相关体验的频率；结果只用于自我了解和专业沟通。",
    sourceUrl: "https://www.nih.gov/node/19876",
    items: [
      { id: "gad1", text: "感到紧张、焦虑或急切。" },
      { id: "gad2", text: "无法停止或控制担心。" },
      { id: "gad3", text: "对各种各样的事情担心过多。" },
      { id: "gad4", text: "很难放松下来。" },
      { id: "gad5", text: "坐立不安，以至于很难静坐。" },
      { id: "gad6", text: "变得容易烦恼或急躁。" },
      { id: "gad7", text: "感到害怕，好像会发生可怕的事情。" },
    ],
  },
};

export function calculateScreenerTotal(itemScores: number[]) {
  return itemScores.reduce((total, score) => total + score, 0);
}

export function getScreenerSeverity(
  screenerType: ScreenerType,
  totalScore: number,
) {
  if (screenerType === "PHQ-9") {
    if (totalScore <= 4) {
      return "最低或无明显相关症状";
    }

    if (totalScore <= 9) {
      return "轻度相关症状";
    }

    if (totalScore <= 14) {
      return "中度相关症状";
    }

    if (totalScore <= 19) {
      return "中重度相关症状";
    }

    return "重度相关症状";
  }

  if (totalScore <= 4) {
    return "最低或无明显焦虑相关症状";
  }

  if (totalScore <= 9) {
    return "轻度焦虑相关症状";
  }

  if (totalScore <= 14) {
    return "中度焦虑相关症状";
  }

  return "重度焦虑相关症状";
}

export function hasScreenerSafetyFlag(
  screenerType: ScreenerType,
  itemScores: number[],
) {
  return screenerType === "PHQ-9" && Number(itemScores[8]) > 0;
}

export function createScreenerResult(
  screenerType: ScreenerType,
  itemScores: number[],
): ScreenerResult {
  const totalScore = calculateScreenerTotal(itemScores);

  return {
    screenerType,
    totalScore,
    severityLabel: getScreenerSeverity(screenerType, totalScore),
    itemScores,
    safetyFlag: hasScreenerSafetyFlag(screenerType, itemScores),
  };
}
