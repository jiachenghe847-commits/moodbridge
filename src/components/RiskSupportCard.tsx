import type { RiskAssessment, RiskLevel } from "../lib/risk";

type RiskSupportCardProps = {
  assessment: RiskAssessment;
};

type RiskCopy = {
  title: string;
  tone: string;
  label: string;
  message: string;
};

const riskCopy: Record<RiskLevel, RiskCopy> = {
  low: {
    title: "普通情绪支持",
    tone: "border-teal-200 bg-teal-50 text-teal-950",
    label: "低风险",
    message:
      "当前只看到一般情绪困扰或信息还不充分。可以先慢下来，继续描述发生了什么、身体有什么反应，以及此刻最需要什么支持。",
  },
  medium: {
    title: "建议持续关注",
    tone: "border-amber-200 bg-amber-50 text-amber-950",
    label: "中风险",
    message:
      "这些线索可能值得进一步关注。建议联系一位可信任的人获得支持，也可以完成标准化自评问卷，帮助自己更清楚地了解状态。",
  },
  high: {
    title: "需要尽快获得支持",
    tone: "border-red-300 bg-red-50 text-red-950",
    label: "高风险",
    message:
      "这些表达可能涉及较高安全风险。请尽快联系身边可信任的人，并考虑联系专业心理援助或医疗支持；可拨打 12356 寻求心理援助。",
  },
  emergency: {
    title: "紧急安全提醒",
    tone: "border-red-400 bg-red-100 text-red-950",
    label: "紧急风险",
    message:
      "如果你或他人正处在立即危险中，请马上联系 110 / 120 或身边可信任的人，并尽量不要独处。",
  },
};

const confidenceLabel = {
  low: "低",
  medium: "中",
  high: "高",
} as const;

function renderList(title: string, values: string[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-current/20 pt-3">
      <h3 className="text-xs font-semibold uppercase tracking-normal opacity-75">
        {title}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

export function RiskSupportCard({ assessment }: RiskSupportCardProps) {
  const copy = riskCopy[assessment.riskLevel];

  return (
    <section
      className={`rounded-lg border p-4 text-sm leading-6 shadow-sm ${copy.tone}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-current px-2 py-0.5 text-xs font-medium">
          {copy.label}
        </span>
        <span className="rounded-full border border-current/50 px-2 py-0.5 text-xs">
          置信度：{confidenceLabel[assessment.confidence]}
        </span>
        <h2 className="font-semibold">{copy.title}</h2>
      </div>

      <div className="mt-3 space-y-3">
        <p>{copy.message}</p>
        <p>{assessment.recommendedAction}</p>
        <p className="text-xs opacity-80">
          当前结果只是风险提示，不是诊断；问卷结果也不是诊断。本项目不替代医生、心理咨询师或紧急救援。
          如有紧急危险，请联系 110 / 120 或身边可信任的人。
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {renderList("识别到的线索", assessment.signals)}
        {renderList("建议补充的信息", assessment.missingInfo)}
        {renderList("建议自评问卷", assessment.suggestedScreeners)}
        {renderList("危机资源", assessment.crisisResources)}
      </div>

      {assessment.shouldAskFollowUp && assessment.followUpQuestion ? (
        <p className="mt-4 border-t border-current/20 pt-3 font-medium">
          可以继续补充：{assessment.followUpQuestion}
        </p>
      ) : null}
    </section>
  );
}
