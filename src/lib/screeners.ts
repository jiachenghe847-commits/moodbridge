export type ScreenerAvailability =
  | "embedded"
  | "external_link"
  | "guidance_only";

export type ScreenerCategory =
  | "情绪与焦虑"
  | "ADHD"
  | "ASD"
  | "OCD"
  | "神经发育与学习"
  | "感觉与动作"
  | "抽动";

export type ScreenerAudience = "adult" | "child" | "caregiver";

export type ScreenerType =
  | "PHQ-9"
  | "GAD-7"
  | "ASRS-ADHD"
  | "VANDERBILT-ADHD"
  | "MCHAT-RF"
  | "AQ-ASD"
  | "YBOCS-OCD"
  | "SCARED-ANXIETY"
  | "DCDQ"
  | "LEARNING-DISORDER"
  | "INTELLECTUAL-DEVELOPMENT"
  | "LANGUAGE-COMMUNICATION"
  | "SOCIAL-PRAGMATIC"
  | "SENSORY-PROCESSING"
  | "TIC-TOURETTE";

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
  category: ScreenerCategory;
  audience: ScreenerAudience;
  availability: ScreenerAvailability;
  title: string;
  description: string;
  sourceUrl: string;
  licenseNote: string;
  applicableAge: string;
  items?: ScreenerItem[];
  guidanceQuestions?: string[];
  manualScoreLabel?: string;
  manualScoreMax?: number;
};

export type ScreenerResult = {
  screenerType: ScreenerType;
  totalScore: number;
  severityLabel: string;
  itemScores: number[];
  safetyFlag: boolean;
};

export type ScreenerReportMode =
  | "embedded_score"
  | "manual_score"
  | "guidance_summary";

export type NormalizedScreenerReportRequest = {
  mode: ScreenerReportMode;
  screenerType: ScreenerType;
  audience: ScreenerAudience;
  totalScore?: number;
  severityLabel?: string;
  itemScores?: number[];
  safetyFlag: boolean;
  guidanceSummary?: string;
};

type ScreenerReportRequestBody = {
  mode?: unknown;
  screenerType?: unknown;
  audience?: unknown;
  totalScore?: unknown;
  severityLabel?: unknown;
  itemScores?: unknown;
  safetyFlag?: unknown;
  guidanceSummary?: unknown;
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
    category: "情绪与焦虑",
    audience: "adult",
    availability: "embedded",
    title: "PHQ-9 抑郁相关症状自评",
    description:
      "用于回顾过去两周低落心境、兴趣下降等相关体验的频率；结果只用于自我了解和专业沟通。",
    sourceUrl: "https://www.nih.gov/node/19946",
    licenseNote: "NIH 页面标注 copyright 为 No，站内保留来源和非诊断边界。",
    applicableAge: "成年人及青少年需结合专业建议使用",
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
    category: "情绪与焦虑",
    audience: "adult",
    availability: "embedded",
    title: "GAD-7 焦虑相关症状自评",
    description:
      "用于回顾过去两周紧张、担心、坐立不安等相关体验的频率；结果只用于自我了解和专业沟通。",
    sourceUrl: "https://www.nih.gov/node/19876",
    licenseNote: "NIH 页面标注 copyright 为 No，站内保留来源和非诊断边界。",
    applicableAge: "成年人及青少年需结合专业建议使用",
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
  "ASRS-ADHD": {
    type: "ASRS-ADHD",
    category: "ADHD",
    audience: "adult",
    availability: "external_link",
    title: "成人 ADHD 自评量表 ASRS v1.1",
    description:
      "成人 ADHD 相关症状筛查候选工具。因授权状态需要进一步确认，站内不复制题目，可填写你在官方或临床渠道获得的总分/结果。",
    sourceUrl:
      "https://datashare.nida.nih.gov/instrument/adult-adhd-self-report-rating-scale",
    licenseNote: "版权和电子使用授权需确认；本项目不复刻量表题项。",
    applicableAge: "成年人",
    manualScoreLabel: "ASRS 筛查结果或总分",
  },
  "VANDERBILT-ADHD": {
    type: "VANDERBILT-ADHD",
    category: "ADHD",
    audience: "caregiver",
    availability: "external_link",
    title: "儿童 ADHD Vanderbilt 家长/教师评估表",
    description:
      "儿童 ADHD 评估常需要家长和教师信息。站内不复制题目，只提供来源和手动结果记录。",
    sourceUrl:
      "https://publications.aap.org/pediatriccare/resources/17510/Vanderbilt-Assessment-Scales",
    licenseNote: "属于专业工具资源，站内不复刻题项。",
    applicableAge: "儿童，由家长/照护者结合教师反馈使用",
    manualScoreLabel: "Vanderbilt 结果或医生给出的摘要",
  },
  "MCHAT-RF": {
    type: "MCHAT-RF",
    category: "ASD",
    audience: "caregiver",
    availability: "external_link",
    title: "M-CHAT-R/F 幼儿 ASD 筛查",
    description:
      "用于幼儿 ASD 风险筛查的正式工具，需遵守官网权限和版权声明。站内不复制题项。",
    sourceUrl: "https://www.mchatscreen.com/mchat-rf/",
    licenseNote: "必须遵守 M-CHAT-R/F 官网权限规则和版权声明。",
    applicableAge: "16-30 个月幼儿，由家长/照护者填写",
    manualScoreLabel: "M-CHAT-R/F 结果",
  },
  "AQ-ASD": {
    type: "AQ-ASD",
    category: "ASD",
    audience: "adult",
    availability: "external_link",
    title: "成人 ASD 相关量表候选",
    description:
      "成人 ASD 筛查量表如 AQ/RAADS 等存在授权和适用性差异，第一版不复制题目。",
    sourceUrl: "https://www.cdc.gov/autism/hcp/diagnosis/screening.html",
    licenseNote: "授权和中文版本适用性需逐项确认；站内不复刻题项。",
    applicableAge: "成年人",
    manualScoreLabel: "已完成量表的分数或结果摘要",
  },
  "YBOCS-OCD": {
    type: "YBOCS-OCD",
    category: "OCD",
    audience: "adult",
    availability: "external_link",
    title: "OCD 严重度量表候选",
    description:
      "Y-BOCS 等工具更偏临床访谈或专业评估，站内不复刻题项，可手动输入专业渠道获得的结果。",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3059660/",
    licenseNote: "临床量表授权和使用场景需确认；站内不复刻题项。",
    applicableAge: "成年人或儿童需由专业人员判断",
    manualScoreLabel: "OCD 量表分数或专业评估摘要",
  },
  "SCARED-ANXIETY": {
    type: "SCARED-ANXIETY",
    category: "情绪与焦虑",
    audience: "caregiver",
    availability: "external_link",
    title: "儿童/青少年焦虑筛查候选",
    description:
      "儿童焦虑筛查工具需要确认授权、版本和适用年龄；站内先提供入口和手动结果记录。",
    sourceUrl:
      "https://www.nimh.nih.gov/health/publications/anxiety-disorders",
    licenseNote: "授权和版本需确认；站内不复刻题项。",
    applicableAge: "儿童/青少年，由本人或照护者结合专业建议填写",
    manualScoreLabel: "儿童焦虑筛查分数或结果摘要",
  },
  DCDQ: {
    type: "DCDQ",
    category: "感觉与动作",
    audience: "caregiver",
    availability: "external_link",
    title: "DCDQ 发育性协调障碍筛查",
    description:
      "DCDQ 是儿童运动协调困难筛查工具，官网标明版权和翻译授权要求，站内不复制题项。",
    sourceUrl: "https://www.dcdq.ca/dcdq-07/",
    licenseNote: "官网标注 All Rights Reserved，并有翻译/改编权限要求。",
    applicableAge: "5-15 岁儿童，由家长/照护者填写",
    manualScoreLabel: "DCDQ 分数或结果摘要",
  },
  "LEARNING-DISORDER": {
    type: "LEARNING-DISORDER",
    category: "神经发育与学习",
    audience: "caregiver",
    availability: "guidance_only",
    title: "特定学习障碍准备清单",
    description:
      "用于整理阅读、书写、计算方面的长期困难和学校反馈，不能替代教育心理或医学评估。",
    sourceUrl:
      "https://www.nichd.nih.gov/health/topics/learning/conditioninfo",
    licenseNote: "非正式量表，为就医/评估沟通清单。",
    applicableAge: "儿童、青少年，也可用于成年人回顾学习史",
    guidanceQuestions: [
      "阅读、拼写、书写或计算中最明显的困难是什么？",
      "困难从什么时候开始，是否长期存在？",
      "学校成绩、作业、考试或日常学习受到哪些影响？",
      "是否有老师反馈、既往测评、干预或补课经历？",
    ],
  },
  "INTELLECTUAL-DEVELOPMENT": {
    type: "INTELLECTUAL-DEVELOPMENT",
    category: "神经发育与学习",
    audience: "caregiver",
    availability: "guidance_only",
    title: "智力发育/适应功能准备清单",
    description:
      "用于整理发育里程碑、学习能力和日常适应功能信息，正式判断需要专业评估。",
    sourceUrl:
      "https://www.nichd.nih.gov/health/topics/idds/conditioninfo",
    licenseNote: "非正式量表，为专业评估前准备清单。",
    applicableAge: "儿童/青少年为主，也可用于成年人既往发育史整理",
    guidanceQuestions: [
      "语言、运动、生活自理等发育里程碑是否明显晚于同龄人？",
      "学习新技能、理解规则、解决日常问题是否长期困难？",
      "穿衣、金钱、出行、安全意识等适应功能表现如何？",
      "是否做过智力、发育、教育心理或康复评估？",
    ],
  },
  "LANGUAGE-COMMUNICATION": {
    type: "LANGUAGE-COMMUNICATION",
    category: "神经发育与学习",
    audience: "caregiver",
    availability: "guidance_only",
    title: "沟通/语言困难准备清单",
    description:
      "用于整理语言理解、表达、发音、流畅度和沟通影响，不能替代言语语言评估。",
    sourceUrl: "https://www.nidcd.nih.gov/health/speech-and-language",
    licenseNote: "非正式量表，为言语语言评估前准备清单。",
    applicableAge: "儿童/青少年为主，也可用于成年人沟通困难整理",
    guidanceQuestions: [
      "主要困难在理解、表达、发音、流畅度还是词汇组织？",
      "这些困难从什么时候开始，是否影响学习、人际或工作？",
      "家庭、学校或社交场景中的表现是否不同？",
      "是否有听力检查、言语治疗或发育评估记录？",
    ],
  },
  "SOCIAL-PRAGMATIC": {
    type: "SOCIAL-PRAGMATIC",
    category: "ASD",
    audience: "caregiver",
    availability: "guidance_only",
    title: "社交语用沟通准备清单",
    description:
      "用于整理对话轮替、语境理解、隐喻玩笑、社交规则等困难，不用于诊断。",
    sourceUrl: "https://www.asha.org/public/speech/disorders/social-communication-disorder/",
    licenseNote: "非正式量表，为沟通评估前准备清单。",
    applicableAge: "儿童/青少年，也可用于成年人自我整理",
    guidanceQuestions: [
      "对话轮替、看场合说话、理解玩笑或隐含意思是否困难？",
      "是否影响交朋友、课堂互动、家庭沟通或工作协作？",
      "这些表现是否从小持续存在？",
      "是否伴随重复行为、固定兴趣或感官敏感等其他线索？",
    ],
  },
  "SENSORY-PROCESSING": {
    type: "SENSORY-PROCESSING",
    category: "感觉与动作",
    audience: "caregiver",
    availability: "guidance_only",
    title: "感觉处理困难准备清单",
    description:
      "用于整理声音、触觉、光线、气味、运动觉等敏感或寻求体验，不能替代专业评估。",
    sourceUrl: "https://www.cdc.gov/autism/signs-symptoms/index.html",
    licenseNote: "非正式量表，为专业评估前准备清单。",
    applicableAge: "儿童/青少年，也可用于成年人自我整理",
    guidanceQuestions: [
      "对声音、光线、触觉、气味、食物质地或运动是否特别敏感或寻求？",
      "这些反应是否影响上学、工作、社交、进食或睡眠？",
      "是否与情绪崩溃、逃避场所、重复行为或注意困难一起出现？",
      "哪些环境调整曾经有帮助？",
    ],
  },
  "TIC-TOURETTE": {
    type: "TIC-TOURETTE",
    category: "抽动",
    audience: "caregiver",
    availability: "guidance_only",
    title: "抽动/妥瑞相关准备清单",
    description:
      "用于整理运动抽动、发声抽动、持续时间和影响，正式判断需专业评估。",
    sourceUrl: "https://www.cdc.gov/tourette-syndrome/about/index.html",
    licenseNote: "非正式量表，为就医沟通清单。",
    applicableAge: "儿童/青少年为主，也可用于成年人",
    guidanceQuestions: [
      "是否有眨眼、耸肩、清嗓、发声等反复动作或声音？",
      "这些表现持续了多久，是否时轻时重？",
      "是否影响学习、社交、睡眠或造成疼痛/困扰？",
      "是否伴随强迫、注意困难、焦虑或压力加重？",
    ],
  },
};

export const screenerCategories = Array.from(
  new Set(Object.values(screenerDefinitions).map((item) => item.category)),
);

export function isScreenerType(value: unknown): value is ScreenerType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(screenerDefinitions, value)
  );
}

export function isScreenerAudience(value: unknown): value is ScreenerAudience {
  return value === "adult" || value === "child" || value === "caregiver";
}

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

  if (screenerType === "GAD-7") {
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

  return "需结合专业评估理解";
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

export function normalizeScreenerReportRequest(
  value: unknown,
): NormalizedScreenerReportRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as ScreenerReportRequestBody;
  const mode =
    body.mode === "manual_score" || body.mode === "guidance_summary"
      ? body.mode
      : "embedded_score";

  if (!isScreenerType(body.screenerType)) {
    return null;
  }

  const definition = screenerDefinitions[body.screenerType];
  const audience = isScreenerAudience(body.audience)
    ? body.audience
    : definition.audience;
  const safetyFlag =
    typeof body.safetyFlag === "boolean" ? body.safetyFlag : false;

  if (mode === "guidance_summary") {
    if (
      typeof body.guidanceSummary !== "string" ||
      body.guidanceSummary.trim().length < 5
    ) {
      return null;
    }

    return {
      mode,
      screenerType: body.screenerType,
      audience,
      safetyFlag,
      guidanceSummary: body.guidanceSummary.trim().slice(0, 2_000),
    };
  }

  if (
    typeof body.totalScore !== "number" ||
    !Number.isInteger(body.totalScore) ||
    typeof body.severityLabel !== "string"
  ) {
    return null;
  }

  const maxScore =
    mode === "embedded_score"
      ? (definition.items?.length ?? 0) * 3
      : definition.manualScoreMax;

  if (
    body.totalScore < 0 ||
    (typeof maxScore === "number" && body.totalScore > maxScore)
  ) {
    return null;
  }

  if (mode === "manual_score") {
    return {
      mode,
      screenerType: body.screenerType,
      audience,
      totalScore: body.totalScore,
      severityLabel: body.severityLabel.trim().slice(0, 100),
      safetyFlag,
    };
  }

  if (!Array.isArray(body.itemScores) || !definition.items) {
    return null;
  }

  if (
    body.itemScores.length !== definition.items.length ||
    !body.itemScores.every(
      (score) =>
        typeof score === "number" &&
        Number.isInteger(score) &&
        score >= 0 &&
        score <= 3,
    )
  ) {
    return null;
  }

  return {
    mode,
    screenerType: body.screenerType,
    audience,
    totalScore: body.totalScore,
    severityLabel: body.severityLabel.trim().slice(0, 100),
    itemScores: body.itemScores as number[],
    safetyFlag,
  };
}
