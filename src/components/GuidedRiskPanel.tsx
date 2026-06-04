"use client";

import { useMemo, useState } from "react";
import type { RiskAssessment } from "../lib/risk";
import { RiskSupportCard } from "./RiskSupportCard";

type GuidedRiskStepId =
  | "concerns"
  | "duration"
  | "impact"
  | "safety"
  | "safety_details"
  | "follow_up";

type GuidedRiskAnswer = {
  stepId: string;
  label: string;
  selectedOptions: string[];
  note: string;
};

type GuidedRiskStep = {
  id: GuidedRiskStepId;
  label: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
  notePlaceholder: string;
};

type FlowStatus =
  | "idle"
  | "collecting"
  | "assessing"
  | "needs_more_info"
  | "completed"
  | "emergency";

const requestTimeoutMs = 25_000;

const steps: Record<GuidedRiskStepId, GuidedRiskStep> = {
  concerns: {
    id: "concerns",
    label: "主要困扰",
    question: "现在最困扰你的是什么？",
    options: ["低落", "焦虑", "愤怒", "疲惫", "压力", "人际/家庭", "其他"],
    allowMultiple: true,
    notePlaceholder: "可以补充发生了什么，或你最想被理解的部分。",
  },
  duration: {
    id: "duration",
    label: "持续时间",
    question: "这种状态大概持续了多久？",
    options: ["今天", "几天", "一两周", "更久", "不确定"],
    allowMultiple: false,
    notePlaceholder: "例如最近是否变重、是否反复出现。",
  },
  impact: {
    id: "impact",
    label: "影响程度",
    question: "它主要影响到了哪些方面？",
    options: ["睡眠", "饮食", "学习工作", "人际", "日常照顾", "影响不明显"],
    allowMultiple: true,
    notePlaceholder: "可以补充影响的程度，比如睡不着、吃不下、难以工作等。",
  },
  safety: {
    id: "safety",
    label: "安全问题",
    question: "现在是否出现自伤、自杀、伤害他人，或无法保证安全的想法？",
    options: ["没有", "有", "不确定", "正在发生"],
    allowMultiple: false,
    notePlaceholder: "如果愿意，可以补充你现在是否一个人、是否安全。",
  },
  safety_details: {
    id: "safety_details",
    label: "安全细节",
    question: "这些想法是否涉及具体计划、工具、时间、地点，或正在发生？",
    options: ["没有具体计划", "有具体计划", "有工具", "有时间/地点", "正在发生", "不确定"],
    allowMultiple: true,
    notePlaceholder: "如果有立即危险，请优先联系 110 / 120 或身边可信任的人。",
  },
  follow_up: {
    id: "follow_up",
    label: "补充信息",
    question: "为了更稳妥地提示风险，还需要补充一点信息。",
    options: ["已补充", "暂时不想说", "不确定"],
    allowMultiple: false,
    notePlaceholder: "请按上方提示补充你愿意说明的部分。",
  },
};

function createEmergencyAssessment(signal: string): RiskAssessment {
  return {
    riskLevel: "emergency",
    confidence: "high",
    signals: [signal],
    missingInfo: ["是否已经联系紧急服务或身边可信任的人"],
    shouldAskFollowUp: false,
    followUpQuestion: null,
    suggestedScreeners: [],
    recommendedAction:
      "这可能涉及立即安全风险。请立刻联系 110 / 120 或身边可信任的人，并尽量不要独处。",
    crisisResources: [
      "如有紧急危险，请立即联系 110 / 120。",
      "请尽快联系身边可信任的人，避免独处。",
      "可拨打 12356 寻求心理援助。",
    ],
  };
}

function normalizeRiskAssessment(value: unknown): RiskAssessment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Partial<RiskAssessment>;
  const riskLevel = candidate.riskLevel;
  const confidence = candidate.confidence;

  if (
    riskLevel !== "low" &&
    riskLevel !== "medium" &&
    riskLevel !== "high" &&
    riskLevel !== "emergency"
  ) {
    return null;
  }

  if (
    confidence !== "low" &&
    confidence !== "medium" &&
    confidence !== "high"
  ) {
    return null;
  }

  return {
    riskLevel,
    confidence,
    signals: normalizeStringArray(candidate.signals),
    missingInfo: normalizeStringArray(candidate.missingInfo),
    shouldAskFollowUp:
      typeof candidate.shouldAskFollowUp === "boolean"
        ? candidate.shouldAskFollowUp
        : false,
    followUpQuestion:
      typeof candidate.followUpQuestion === "string" &&
      candidate.followUpQuestion.trim()
        ? candidate.followUpQuestion.trim()
        : null,
    suggestedScreeners: normalizeStringArray(candidate.suggestedScreeners),
    recommendedAction:
      typeof candidate.recommendedAction === "string" &&
      candidate.recommendedAction.trim()
        ? candidate.recommendedAction.trim()
        : "当前结果只是风险提示，不是诊断。",
    crisisResources: normalizeStringArray(candidate.crisisResources),
  };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function answerHasImmediateDanger(answer: GuidedRiskAnswer) {
  const text = [...answer.selectedOptions, answer.note].join(" ");

  return /(正在发生|马上|立刻|现在|今晚|今天|楼顶|跳楼|割腕|吞药|刀|绳子|有工具|有时间\/地点|有具体计划)/.test(
    text,
  );
}

function answerNeedsSafetyDetails(answer: GuidedRiskAnswer) {
  return answer.selectedOptions.some(
    (option) =>
      option === "有" || option === "不确定" || option === "正在发生",
  );
}

function createSummary(answers: GuidedRiskAnswer[]) {
  const lines = ["用户主动完成风险引导。"];

  for (const answer of answers) {
    const selected = answer.selectedOptions.length
      ? answer.selectedOptions.join("、")
      : "未选择";
    const note = answer.note.trim() ? `；补充：${answer.note.trim()}` : "";

    lines.push(`${answer.label}：${selected}${note}`);
  }

  return lines.join("\n");
}

export function GuidedRiskPanel() {
  const [status, setStatus] = useState<FlowStatus>("idle");
  const [stepId, setStepId] = useState<GuidedRiskStepId>("concerns");
  const [answers, setAnswers] = useState<GuidedRiskAnswer[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentStep = steps[stepId];
  const canContinue = selectedOptions.length > 0 || note.trim().length > 0;

  const progressLabel = useMemo(() => {
    if (status === "idle") {
      return "未开始";
    }

    if (status === "assessing") {
      return "评估中";
    }

    if (status === "completed" || status === "emergency") {
      return "已完成";
    }

    return `${answers.length + 1} / 动态`;
  }, [answers.length, status]);

  function resetStepInput() {
    setSelectedOptions([]);
    setNote("");
  }

  function startFlow() {
    setStatus("collecting");
    setStepId("concerns");
    setAnswers([]);
    setAssessment(null);
    setErrorMessage("");
    resetStepInput();
  }

  function exitFlow() {
    setStatus("idle");
    setStepId("concerns");
    setAnswers([]);
    setAssessment(null);
    setErrorMessage("");
    resetStepInput();
  }

  function toggleOption(option: string) {
    if (currentStep.allowMultiple) {
      setSelectedOptions((current) =>
        current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current, option],
      );
      return;
    }

    setSelectedOptions((current) =>
      current.includes(option) ? [] : [option],
    );
  }

  function getNextStep(answer: GuidedRiskAnswer): GuidedRiskStepId | null {
    if (answer.stepId === "concerns") {
      return "duration";
    }

    if (answer.stepId === "duration") {
      return "impact";
    }

    if (answer.stepId === "impact") {
      return "safety";
    }

    if (answer.stepId === "safety") {
      return answerNeedsSafetyDetails(answer) ? "safety_details" : null;
    }

    return null;
  }

  async function assessAnswers(nextAnswers: GuidedRiskAnswer[]) {
    setStatus("assessing");
    setErrorMessage("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await fetch("/api/risk-assess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: createSummary(nextAnswers),
            },
          ],
        }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error("风险评估暂时不可用，请稍后再试。");
      }

      const nextAssessment = normalizeRiskAssessment(data);

      if (!nextAssessment) {
        throw new Error("风险评估结果格式不正确，请稍后再试。");
      }

      setAssessment(nextAssessment);

      if (
        nextAssessment.shouldAskFollowUp &&
        nextAssessment.followUpQuestion &&
        nextAssessment.riskLevel !== "high" &&
        nextAssessment.riskLevel !== "emergency"
      ) {
        setStatus("needs_more_info");
        setStepId("follow_up");
        resetStepInput();
        return;
      }

      setStatus(
        nextAssessment.riskLevel === "emergency" ? "emergency" : "completed",
      );
    } catch (error) {
      setStatus("collecting");
      setErrorMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "请求超时，请稍后再试。"
          : error instanceof Error
            ? error.message
            : "风险评估暂时不可用，请稍后再试。",
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function handleNext() {
    if (!canContinue || status === "assessing") {
      return;
    }

    const answer: GuidedRiskAnswer = {
      stepId,
      label: currentStep.label,
      selectedOptions,
      note: note.trim(),
    };
    const nextAnswers = [...answers, answer];

    setAnswers(nextAnswers);

    if (
      (answer.stepId === "safety" || answer.stepId === "safety_details") &&
      answerHasImmediateDanger(answer)
    ) {
      setAssessment(createEmergencyAssessment("用户在引导中表达立即安全风险。"));
      setStatus("emergency");
      resetStepInput();
      return;
    }

    if (answer.stepId === "follow_up") {
      void assessAnswers(nextAnswers);
      return;
    }

    const nextStep = getNextStep(answer);

    if (nextStep) {
      setStepId(nextStep);
      setStatus("collecting");
      resetStepInput();
      return;
    }

    void assessAnswers(nextAnswers);
  }

  function handleBack() {
    if (answers.length === 0 || status === "assessing") {
      return;
    }

    const previousAnswer = answers[answers.length - 1];

    setAnswers((current) => current.slice(0, -1));
    setStepId(previousAnswer.stepId as GuidedRiskStepId);
    setSelectedOptions(previousAnswer.selectedOptions);
    setNote(previousAnswer.note);
    setStatus("collecting");
    setErrorMessage("");
  }

  const displayedQuestion =
    status === "needs_more_info" && assessment?.followUpQuestion
      ? assessment.followUpQuestion
      : currentStep.question;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">风险引导</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-950">
            非诊断性风险提示流程
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            这是非诊断性的风险提示流程，不替代医生、心理咨询师或紧急救援。
          </p>
        </div>
        <span className="w-fit rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600">
          {progressLabel}
        </span>
      </div>

      {status === "idle" ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-6 text-stone-700">
            我会按步骤询问当前困扰、持续时间、影响程度和安全问题。你可以用快捷选项回答，也可以补充文字。
          </p>
          <button
            className="h-11 rounded-md bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800"
            onClick={startFlow}
            type="button"
          >
            开始风险引导
          </button>
        </div>
      ) : null}

      {status !== "idle" &&
      status !== "assessing" &&
      status !== "completed" &&
      status !== "emergency" ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-md bg-stone-50 p-4">
            <p className="text-xs font-medium text-stone-500">
              {currentStep.label}
            </p>
            <h3 className="mt-2 text-base font-semibold text-stone-950">
              {displayedQuestion}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentStep.options.map((option) => {
              const isSelected = selectedOptions.includes(option);

              return (
                <button
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:border-teal-600"
                  }`}
                  key={option}
                  onClick={() => toggleOption(option)}
                  type="button"
                >
                  {option}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              补充说明
            </span>
            <textarea
              className="mt-2 max-h-28 min-h-20 w-full resize-none rounded-md border border-stone-300 bg-white p-3 text-base leading-6 outline-none transition placeholder:text-stone-400 focus:border-teal-600"
              onChange={(event) => setNote(event.target.value)}
              placeholder={currentStep.notePlaceholder}
              value={note}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="h-10 rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={answers.length === 0}
              onClick={handleBack}
              type="button"
            >
              返回上一步
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="h-10 rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                onClick={exitFlow}
                type="button"
              >
                退出引导
              </button>
              <button
                className="h-10 rounded-md bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
                disabled={!canContinue}
                onClick={handleNext}
                type="button"
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {status === "assessing" ? (
        <div className="mt-4 rounded-md bg-stone-50 p-4 text-sm text-stone-700">
          正在生成非诊断性风险提示...
        </div>
      ) : null}

      {(status === "completed" || status === "emergency") && assessment ? (
        <div className="mt-4 space-y-4">
          <RiskSupportCard assessment={assessment} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              className="h-10 rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              onClick={startFlow}
              type="button"
            >
              重新引导
            </button>
            <button
              className="h-10 rounded-md bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800"
              onClick={exitFlow}
              type="button"
            >
              完成
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
