"use client";

import { useMemo, useState } from "react";
import {
  createScreenerResult,
  screenerDefinitions,
  screenerOptions,
  type ScreenerResult,
  type ScreenerType,
} from "../lib/screeners";

type ReportState = {
  isLoading: boolean;
  text: string;
  error: string;
};

const initialReportState: ReportState = {
  isLoading: false,
  text: "",
  error: "",
};

function createInitialScores(type: ScreenerType) {
  return Array<number | null>(screenerDefinitions[type].items.length).fill(null);
}

function SafetyNotice() {
  return (
    <section className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-950 shadow-sm">
      <h2 className="font-semibold">需要立即关注的安全提醒</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>本产品不能提供紧急救援或医疗诊断。</li>
        <li>可拨打 12356 寻求心理援助。</li>
        <li>如存在立即危险，请联系 110 或 120。</li>
        <li>请尽快联系身边可信任的人，避免独处。</li>
      </ol>
    </section>
  );
}

function LocalResultCard({ result }: { result: ScreenerResult }) {
  const maxScore = result.screenerType === "PHQ-9" ? 27 : 21;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-700">
            {result.screenerType} 结果
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            {result.totalScore} / {maxScore}
          </h2>
        </div>
        <span className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700">
          {result.severityLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        这个分数只表示过去两周相关体验的自评频率，不是诊断，也不能说明你是否患有某种疾病。
        如果分数较高、状态持续影响生活，建议联系精神心理科、心理咨询师或其他专业人员进一步评估。
      </p>
    </section>
  );
}

export function ScreenerPanel() {
  const [screenerType, setScreenerType] = useState<ScreenerType>("PHQ-9");
  const [scores, setScores] = useState<Array<number | null>>(
    createInitialScores("PHQ-9"),
  );
  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [report, setReport] = useState<ReportState>(initialReportState);

  const definition = screenerDefinitions[screenerType];
  const isComplete = scores.every((score) => score !== null);
  const answeredCount = scores.filter((score) => score !== null).length;

  const highScoreItems = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.itemScores
      .map((score, index) => ({
        score,
        text: definition.items[index]?.text ?? "",
      }))
      .filter((item) => item.score >= 2);
  }, [definition.items, result]);

  function handleTypeChange(nextType: ScreenerType) {
    setScreenerType(nextType);
    setScores(createInitialScores(nextType));
    setResult(null);
    setReport(initialReportState);
  }

  function handleScoreChange(index: number, value: number) {
    setScores((currentScores) =>
      currentScores.map((score, currentIndex) =>
        currentIndex === index ? value : score,
      ),
    );
    setResult(null);
    setReport(initialReportState);
  }

  async function requestReport(nextResult: ScreenerResult) {
    setReport({ isLoading: true, text: "", error: "" });

    try {
      const response = await fetch("/api/screener-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextResult),
      });
      const data = (await response.json().catch(() => null)) as
        | { report?: unknown; error?: unknown }
        | null;

      if (!response.ok || typeof data?.report !== "string") {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "AI 报告暂时不可用。",
        );
      }

      setReport({ isLoading: false, text: data.report, error: "" });
    } catch (error) {
      setReport({
        isLoading: false,
        text: "",
        error:
          error instanceof Error
            ? error.message
            : "AI 报告暂时不可用，但本地分数仍可参考。",
      });
    }
  }

  function handleSubmit() {
    if (!isComplete) {
      return;
    }

    const itemScores = scores.map((score) => Number(score));
    const nextResult = createScreenerResult(screenerType, itemScores);

    setResult(nextResult);
    void requestReport(nextResult);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-medium text-teal-700">自评问卷</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
            PHQ-9 / GAD-7 自评
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
            请回顾过去两周的体验。问卷结果仅用于自我了解和专业沟通，不构成心理或医学诊断。
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        本页面不会保存问卷结果、逐题回答或 AI 报告。AI 报告只分析本次问卷分数，不读取完整聊天记录。
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["PHQ-9", "GAD-7"] as const).map((type) => (
          <button
            className={`rounded-lg border p-4 text-left transition ${
              screenerType === type
                ? "border-teal-700 bg-teal-50 text-teal-950"
                : "border-stone-200 bg-white text-stone-800 hover:border-teal-500"
            }`}
            key={type}
            onClick={() => handleTypeChange(type)}
            type="button"
          >
            <span className="text-base font-semibold">
              {screenerDefinitions[type].title}
            </span>
            <span className="mt-2 block text-sm leading-6">
              {screenerDefinitions[type].description}
            </span>
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              {definition.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {definition.description}
            </p>
          </div>
          <span className="w-fit rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600">
            {answeredCount} / {definition.items.length}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {definition.items.map((item, index) => (
            <div
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
              key={item.id}
            >
              <p className="text-sm font-medium leading-6 text-stone-950">
                {index + 1}. {item.text}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {screenerOptions.map((option) => {
                  const isSelected = scores[index] === option.value;

                  return (
                    <button
                      className={`min-h-11 rounded-md border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-stone-300 bg-white text-stone-700 hover:border-teal-600"
                      }`}
                      key={option.value}
                      onClick={() => handleScoreChange(index, option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          className="mt-5 w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
          disabled={!isComplete}
          onClick={handleSubmit}
          type="button"
        >
          {isComplete ? "查看结果并生成 AI 报告" : "请先完成所有题目"}
        </button>
      </section>

      {result?.safetyFlag ? <SafetyNotice /> : null}

      {result ? (
        <div className="space-y-4">
          <LocalResultCard result={result} />

          {highScoreItems.length > 0 ? (
            <section className="rounded-lg border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700 shadow-sm">
              <h2 className="font-semibold text-stone-950">较高分条目</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {highScoreItems.map((item) => (
                  <li key={item.text}>
                    {item.text}：{item.score} 分
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-stone-950">AI 非诊断性报告</h2>
            {report.isLoading ? (
              <p className="mt-3 text-sm text-stone-600">正在生成报告...</p>
            ) : null}
            {report.error ? (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                {report.error} 本地分数和固定说明仍可参考。
              </p>
            ) : null}
            {report.text ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                {report.text}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
