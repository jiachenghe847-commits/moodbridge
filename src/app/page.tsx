import Link from "next/link";
import { ChatPanel } from "../components/ChatPanel";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 py-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <p className="text-sm font-medium text-teal-700">Moodbridge 心桥</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            中文 AI 情绪陪伴与心理风险提示助手
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-700">
            心桥面向中文用户，帮助整理情绪，并在有限对话中识别潜在风险线索，给出非诊断性的风险提示与自评、筛查引导。
            它不是医疗诊断工具，不能替代医生、心理咨询师或紧急救援服务。
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">当前范围</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
            <li>聊天页通过服务端 API 调用模型。</li>
            <li>风险提示与聊天回复分离，结果只表示潜在风险可能。</li>
            <li>PHQ-9/GAD-7 可站内填写，其他授权不清量表只提供外链或准备清单。</li>
            <li>自伤、自杀或他伤线索优先触发危机提示。</li>
            <li>暂不实现登录。</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          className="rounded-lg border border-teal-200 bg-teal-50 p-5 text-teal-950 shadow-sm transition hover:border-teal-500 hover:bg-teal-100"
          href="/screeners"
        >
          <p className="text-sm font-medium">自评与筛查</p>
          <h2 className="mt-2 text-xl font-semibold">筛查中心</h2>
          <p className="mt-2 text-sm leading-6">
            查看 PHQ-9、GAD-7、ADHD、ASD、OCD、学习与发育相关入口，获得非诊断性报告。
          </p>
        </Link>
        <Link
          className="rounded-lg border border-stone-200 bg-white p-5 text-stone-800 shadow-sm transition hover:border-teal-300 hover:bg-stone-50"
          href="/mood"
        >
          <p className="text-sm font-medium text-teal-700">心情记录</p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            记录每日状态
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            保存你主动提交的心情记录，用于自我观察，不构成心理诊断。
          </p>
        </Link>
      </section>

      <section>
        <ChatPanel compact />
      </section>
    </div>
  );
}
