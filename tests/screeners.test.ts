import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateScreenerTotal,
  createScreenerResult,
  getScreenerSeverity,
  hasScreenerSafetyFlag,
  normalizeScreenerReportRequest,
  screenerDefinitions,
} from "../src/lib/screeners";

test("PHQ-9 总分计算正确", () => {
  const result = createScreenerResult("PHQ-9", [0, 1, 2, 3, 0, 1, 2, 3, 0]);

  assert.equal(result.totalScore, 12);
  assert.equal(calculateScreenerTotal(result.itemScores), 12);
});

test("GAD-7 总分计算正确", () => {
  const result = createScreenerResult("GAD-7", [0, 1, 2, 3, 0, 1, 2]);

  assert.equal(result.totalScore, 9);
  assert.equal(calculateScreenerTotal(result.itemScores), 9);
});

test("PHQ-9 分级边界正确", () => {
  assert.equal(getScreenerSeverity("PHQ-9", 4), "最低或无明显相关症状");
  assert.equal(getScreenerSeverity("PHQ-9", 5), "轻度相关症状");
  assert.equal(getScreenerSeverity("PHQ-9", 10), "中度相关症状");
  assert.equal(getScreenerSeverity("PHQ-9", 15), "中重度相关症状");
  assert.equal(getScreenerSeverity("PHQ-9", 20), "重度相关症状");
});

test("GAD-7 分级边界正确", () => {
  assert.equal(
    getScreenerSeverity("GAD-7", 4),
    "最低或无明显焦虑相关症状",
  );
  assert.equal(getScreenerSeverity("GAD-7", 5), "轻度焦虑相关症状");
  assert.equal(getScreenerSeverity("GAD-7", 10), "中度焦虑相关症状");
  assert.equal(getScreenerSeverity("GAD-7", 15), "重度焦虑相关症状");
});

test("PHQ-9 第 9 题大于 0 时触发安全提醒", () => {
  assert.equal(hasScreenerSafetyFlag("PHQ-9", [0, 0, 0, 0, 0, 0, 0, 0, 1]), true);
  assert.equal(hasScreenerSafetyFlag("PHQ-9", [3, 3, 3, 3, 3, 3, 3, 3, 0]), false);
  assert.equal(hasScreenerSafetyFlag("GAD-7", [3, 3, 3, 3, 3, 3, 3]), false);
});

test("注册表条目都有类别、适用人群和授权说明", () => {
  for (const definition of Object.values(screenerDefinitions)) {
    assert.ok(definition.category.length > 0);
    assert.ok(definition.audience.length > 0);
    assert.ok(definition.licenseNote.length > 0);
    assert.ok(definition.sourceUrl.startsWith("https://"));
  }
});

test("embedded 条目必须有题目和计分规则", () => {
  const embeddedDefinitions = Object.values(screenerDefinitions).filter(
    (definition) => definition.availability === "embedded",
  );

  assert.ok(embeddedDefinitions.length >= 2);

  for (const definition of embeddedDefinitions) {
    assert.ok(definition.items);
    assert.ok(definition.items.length > 0);
    assert.equal(
      createScreenerResult(
        definition.type,
        Array(definition.items.length).fill(0),
      ).totalScore,
      0,
    );
  }
});

test("external_link 条目不要求题目但必须有来源链接", () => {
  const externalDefinitions = Object.values(screenerDefinitions).filter(
    (definition) => definition.availability === "external_link",
  );

  assert.ok(externalDefinitions.length > 0);

  for (const definition of externalDefinitions) {
    assert.ok(definition.sourceUrl.startsWith("https://"));
    assert.ok(definition.manualScoreLabel);
  }
});

test("guidance_only 条目必须有结构化问题", () => {
  const guidanceDefinitions = Object.values(screenerDefinitions).filter(
    (definition) => definition.availability === "guidance_only",
  );

  assert.ok(guidanceDefinitions.length > 0);

  for (const definition of guidanceDefinitions) {
    assert.ok(definition.guidanceQuestions);
    assert.ok(definition.guidanceQuestions.length > 0);
  }
});

test("报告请求校验接受三类输入并拒绝非法值", () => {
  assert.equal(
    normalizeScreenerReportRequest({
      mode: "embedded_score",
      screenerType: "PHQ-9",
      totalScore: 3,
      severityLabel: "最低或无明显相关症状",
      itemScores: [0, 0, 0, 0, 0, 0, 0, 0, 3],
      safetyFlag: true,
    })?.mode,
    "embedded_score",
  );

  assert.equal(
    normalizeScreenerReportRequest({
      mode: "manual_score",
      screenerType: "ASRS-ADHD",
      totalScore: 5,
      severityLabel: "外部量表结果",
      safetyFlag: false,
    })?.mode,
    "manual_score",
  );

  assert.equal(
    normalizeScreenerReportRequest({
      mode: "guidance_summary",
      screenerType: "LEARNING-DISORDER",
      safetyFlag: false,
      guidanceSummary: "阅读和书写长期困难，影响作业和考试。",
    })?.mode,
    "guidance_summary",
  );

  assert.equal(
    normalizeScreenerReportRequest({
      mode: "embedded_score",
      screenerType: "UNKNOWN",
      totalScore: 1,
      severityLabel: "x",
      itemScores: [1],
      safetyFlag: false,
    }),
    null,
  );

  assert.equal(
    normalizeScreenerReportRequest({
      mode: "embedded_score",
      screenerType: "GAD-7",
      totalScore: 100,
      severityLabel: "越界",
      itemScores: [3, 3, 3, 3, 3, 3, 3],
      safetyFlag: false,
    }),
    null,
  );
});
