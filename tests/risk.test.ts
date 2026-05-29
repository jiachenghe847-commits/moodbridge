import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRiskText,
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
  assert.equal(assessment.showSupportCard, false);
});

test("严格解析 high 或 emergency 时强制显示求助卡片", () => {
  const assessment = parseRiskAssessmentJson(
    JSON.stringify({
      riskLevel: "high",
      reason: "风险表达。",
      showSupportCard: false,
    }),
  );

  assert.equal(assessment.riskLevel, "high");
  assert.equal(assessment.showSupportCard, true);
});
