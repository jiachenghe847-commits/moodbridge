"use client";

import { useMemo, useState } from "react";
import {
  createScreenerResult,
  screenerCategories,
  screenerDefinitions,
  screenerOptions,
  type ScreenerAudience,
  type ScreenerDefinition,
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

function createInitialScores(definition: ScreenerDefinition) {
  return Array<number | null>(definition.items?.length ?? 0).fill(null);
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

function getMaxScore(result: ScreenerResult) {
  const definition = screenerDefinitions[result.screenerType];

  return definition.items ? definition.items.length * 3 : undefined;
}

function LocalResultCard({ result }: { result: ScreenerResult }) {
  const maxScore = getMaxScore(result);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-700">
            {result.screenerType} 结果
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            {result.totalScore}
            {maxScore ? ` / ${maxScore}` : ""}
          </h2>
        </div>
        <span className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700">
          {result.severityLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        这个结果只表示当前筛查或自评信息，不是诊断，也不能说明你是否患有某种疾病或障碍。
        如果状态持续影响生活、学习、工作或人际关系，建议联系相关专业人员进一步评估。
      </p>
    </section>
  );
}

function availabilityLabel(definition: ScreenerDefinition) {
  if (definition.availability === "embedded") {
    return "站内填写";
  }

  if (definition.availability === "external_link") {
    return "外部量表";
  }

  return "准备清单";
}

export function ScreenerPanel() {
  const allDefinitions = Object.values(screenerDefinitions);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [screenerType, setScreenerType] = useState<ScreenerType>("PHQ-9");
  const [scores, setScores] = useState<Array<number | null>>(
    createInitialScores(screenerDefinitions["PHQ-9"]),
  );
  const [manualScore, setManualScore] = useState("");
  const [manualLabel, setManualLabel] = useState("");
  const [guidanceSummary, setGuidanceSummary] = useState("");
  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [report, setReport] = useState<ReportState>(initialReportState);

  const definition = screenerDefinitions[screenerType];
  const visibleDefinitions =
    selectedCategory === "全部"
      ? allDefinitions
      : allDefinitions.filter((item) => item.category === selectedCategory);
  const isComplete = scores.every((score) => score !== null);
  const answeredCount = scores.filter((score) => score !== null).length;

  const highScoreItems = useMemo(() => {
    if (!result || !definition.items) {
      return [];
    }

    return result.itemScores
      .map((score, index) => ({
        score,
        text: definition.items?.[index]?.text ?? "",
      }))
      .filter((item) => item.score >= 2);
  }, [definition.items, result]);

  function resetOutputs() {
    setResult(null);
    setReport(initialReportState);
  }

  function handleTypeChange(nextType: ScreenerType) {
    const nextDefinition = screenerDefinitions[nextType];

    setScreenerType(nextType);
    setScores(createInitialScores(nextDefinition));
    setManualScore("");
    setManualLabel("");
    setGuidanceSummary("");
    resetOutputs();
  }

  function handleScoreChange(index: number, value: number) {
    setScores((currentScores) =>
      currentScores.map((score, currentIndex) =>
        currentIndex === index ? value : score,
      ),
    );
    resetOutputs();
  }

  async function requestReport(body: Record<string, unknown>) {
    setReport({ isLoading: true, text: "", error: "" });

    try {
      const response = await fetch("/api/screener-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
            : "AI 报告暂时不可用，但本地结果仍可参考。",
      });
    }
  }

  function handleEmbeddedSubmit() {
    if (!isComplete) {
      return;
    }

    const itemScores = scores.map((score) => Number(score));
    const nextResult = createScreenerResult(screenerType, itemScores);

    setResult(nextResult);
    void requestReport({
      mode: "embedded_score",
      ...nextResult,
      audience: definition.audience,
    });
  }

  function handleManualSubmit() {
    const parsedScore = Number(manualScore);

    if (!Number.isFinite(parsedScore) || parsedScore < 0) {
      setReport({
        isLoading: false,
        text: "",
        error: "请输入有效的非负分数或结果数值。",
      });
      return;
    }

    const roundedScore = Math.round(parsedScore);
    const label = manualLabel.trim() || "外部量表结果，需结合专业人员解释";
    const nextResult: ScreenerResult = {
      screenerType,
      totalScore: roundedScore,
      severityLabel: label,
      itemScores: [],
      safetyFlag: false,
    };

    setResult(nextResult);
    void requestReport({
      mode: "manual_score",
      screenerType,
      audience: definition.audience,
      totalScore: roundedScore,
      severityLabel: label,
      safetyFlag: false,
    });
  }

  function handleGuidanceSubmit() {
    if (guidanceSummary.trim().length < 5) {
      setReport({
        isLoading: false,
        text: "",
        error: "请先补充一些你希望整理的信息。",
      });
      return;
    }

    setResult(null);
    void requestReport({
      mode: "guidance_summary",
      screenerType,
      audience: definition.audience as ScreenerAudience,
      safetyFlag: false,
      guidanceSummary,
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-medium text-teal-700">自评与筛查</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
            自评与筛查中心
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
            这里提供非诊断性的自评、外部正式量表入口和就医准备清单。结果仅用于自我了解和专业沟通。
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        本页面不会保存筛查结果、逐题回答或 AI 报告。授权不清或临床专用量表不会在站内复刻题目。
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 text-sm">
        {["全部", ...screenerCategories].map((category) => (
          <button
            className={`shrink-0 rounded-full border px-3 py-2 transition ${
              selectedCategory === category
                ? "border-stone-950 bg-stone-950 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-teal-500"
            }`}
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        {visibleDefinitions.map((item) => (
          <button
            className={`rounded-lg border p-4 text-left transition ${
              screenerType === item.type
                ? "border-teal-700 bg-teal-50 text-teal-950"
                : "border-stone-200 bg-white text-stone-800 hover:border-teal-500"
            }`}
            key={item.type}
            onClick={() => handleTypeChange(item.type)}
            type="button"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-current px-2 py-0.5 text-xs">
                {item.category}
              </span>
              <span className="rounded-full border border-current/40 px-2 py-0.5 text-xs">
                {availabilityLabel(item)}
              </span>
            </div>
            <h2 className="mt-3 text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6">{item.description}</p>
          </button>
        ))}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              {availabilityLabel(definition)}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-950">
              {definition.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {definition.description}
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              适用对象：{definition.applicableAge}
            </p>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              授权说明：{definition.licenseNote}
            </p>
          </div>
          <a
            className="w-fit rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            href={definition.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            查看来源
          </a>
        </div>

        {definition.availability === "embedded" ? (
          <div className="mt-5 space-y-4">
            <span className="inline-flex rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600">
              {answeredCount} / {definition.items?.length ?? 0}
            </span>

            {definition.items?.map((item, index) => (
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

            <button
              className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              disabled={!isComplete}
              onClick={handleEmbeddedSubmit}
              type="button"
            >
              {isComplete ? "查看结果并生成 AI 报告" : "请先完成所有题目"}
            </button>
          </div>
        ) : null}

        {definition.availability === "external_link" ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              由于授权或临床使用限制，本站不复制该量表题目。你可以在官方或专业渠道完成后，把分数或结果摘要填在这里生成非诊断沟通报告。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-stone-800">
                  {definition.manualScoreLabel ?? "外部量表分数"}
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                  min={0}
                  onChange={(event) => {
                    setManualScore(event.target.value);
                    resetOutputs();
                  }}
                  placeholder="例如 6"
                  type="number"
                  value={manualScore}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-800">
                  结果标签或简短说明
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                  maxLength={100}
                  onChange={(event) => {
                    setManualLabel(event.target.value);
                    resetOutputs();
                  }}
                  placeholder="例如 筛查阳性/需进一步评估"
                  type="text"
                  value={manualLabel}
                />
              </label>
            </div>
            <button
              className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              disabled={!manualScore.trim()}
              onClick={handleManualSubmit}
              type="button"
            >
              生成非诊断性报告
            </button>
          </div>
        ) : null}

        {definition.availability === "guidance_only" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <h3 className="font-semibold text-stone-950">
                可准备的信息
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {definition.guidanceQuestions?.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-stone-800">
                整理你已知的信息
              </span>
              <textarea
                className="mt-2 min-h-32 w-full resize-y rounded-md border border-stone-300 bg-white p-3 text-sm leading-6 outline-none focus:border-teal-600"
                maxLength={2_000}
                onChange={(event) => {
                  setGuidanceSummary(event.target.value);
                  resetOutputs();
                }}
                placeholder="可以按上面的清单写下持续时间、影响场景、学校/工作反馈、既往评估和你最担心的问题。"
                value={guidanceSummary}
              />
            </label>
            <button
              className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              disabled={guidanceSummary.trim().length < 5}
              onClick={handleGuidanceSubmit}
              type="button"
            >
              整理就医沟通报告
            </button>
          </div>
        ) : null}
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
        </div>
      ) : null}

      {(report.isLoading || report.error || report.text) ? (
        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-stone-950">AI 非诊断性报告</h2>
          {report.isLoading ? (
            <p className="mt-3 text-sm text-stone-600">正在生成报告...</p>
          ) : null}
          {report.error ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              {report.error} 本地结果和固定说明仍可参考。
            </p>
          ) : null}
          {report.text ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {report.text}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
