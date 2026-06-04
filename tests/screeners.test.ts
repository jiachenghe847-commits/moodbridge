import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateScreenerTotal,
  createScreenerResult,
  getScreenerSeverity,
  hasScreenerSafetyFlag,
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
