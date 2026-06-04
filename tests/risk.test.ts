import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRiskText,
  getRuleBasedRiskAssessment,
  parseRiskAssessmentJson,
} from "../src/lib/risk";

const cases = [
  {
    name: "普通压力",
    input: "最近工作压力很大，有点焦虑和累。",
    expectedRiskLevel: "low",
    expectedShowSupportCard: false,
  },
  {
    name: "持续低落",
    input: "我已经连续好几周很低落，每天都觉得撑不住。",
    expectedRiskLevel: "medium",
    expectedShowSupportCard: false,
  },
  {
    name: "自伤想法",
    input: "我最近总是想到自伤，觉得不想活了。",
    expectedRiskLevel: "high",
    expectedShowSupportCard: true,
  },
  {
    name: "立即危险",
    input: "我现在站在楼顶，准备跳下去。",
    expectedRiskLevel: "emergency",
    expectedShowSupportCard: true,
  },
  {
    name: "伤害他人表达",
    input: "我真的想要伤害别人，甚至想杀了他。",
    expectedRiskLevel: "high",
    expectedShowSupportCard: true,
  },
] as const;

for (const item of cases) {
  test(item.name, () => {
    const assessment = classifyRiskText(item.input);

    assert.equal(assessment.riskLevel, item.expectedRiskLevel);
    assert.equal(assessment.showSupportCard, item.expectedShowSupportCard);
    assert.equal(typeof assessment.reason, "string");
    assert.ok(assessment.reason.length > 0);
  });
}

test("严格解析非法 JSON 时返回低风险兜底", () => {
  const assessment = parseRiskAssessmentJson("{not json");

  assert.equal(assessment.riskLevel, "low");
  assert.equal(assessment.confidence, "low");
});

test("严格解析 high 或 emergency 时补充危机资源", () => {
  const assessment = parseRiskAssessmentJson(
    JSON.stringify({
      riskLevel: "high",
      confidence: "medium",
      signals: ["风险表达"],
      missingInfo: [],
      shouldAskFollowUp: false,
      followUpQuestion: null,
      suggestedScreeners: [],
      recommendedAction: "请尽快联系支持。",
      crisisResources: [],
    }),
  );

  assert.equal(assessment.riskLevel, "high");
  assert.ok(assessment.crisisResources.some((item) => item.includes("12356")));
});

test("明确计划和具体工具触发本地紧急规则", () => {
  const assessment = getRuleBasedRiskAssessment("我打算今晚吞药自杀。");

  assert.equal(assessment?.riskLevel, "emergency");
  assert.equal(assessment?.confidence, "high");
  assert.deepEqual(assessment?.suggestedScreeners, []);
});

test("普通时间词不单独触发本地高风险规则", () => {
  const assessment = getRuleBasedRiskAssessment("今晚我很焦虑，也睡不着。");

  assert.equal(assessment, null);
});

test("解析模型结果时过滤药物和治疗方案建议", () => {
  const assessment = parseRiskAssessmentJson(
    JSON.stringify({
      riskLevel: "medium",
      confidence: "medium",
      signals: ["焦虑紧张"],
      missingInfo: ["是否需要用药"],
      shouldAskFollowUp: true,
      followUpQuestion: "持续多久了？",
      suggestedScreeners: ["GAD-7"],
      recommendedAction: "建议制定治疗方案并服药。",
      crisisResources: [],
    }),
  );

  assert.deepEqual(assessment.missingInfo, []);
  assert.notEqual(assessment.recommendedAction, "建议制定治疗方案并服药。");
});
