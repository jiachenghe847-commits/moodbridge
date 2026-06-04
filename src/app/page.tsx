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
            心桥面向中文用户，帮助整理情绪，并在有限对话中识别潜在风险线索，给出非诊断性的风险提示与自评问卷引导。
            它不是医疗诊断工具，不能替代医生、心理咨询师或紧急救援服务。
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">当前范围</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
            <li>聊天页通过服务端 API 调用模型。</li>
            <li>风险提示与聊天回复分离，结果只表示潜在风险可能。</li>
            <li>低落、兴趣下降、无意义感可引导 PHQ-9；焦虑、紧张、过度担心可引导 GAD-7。</li>
            <li>自伤、自杀或他伤线索优先触发危机提示。</li>
            <li>暂不实现登录。</li>
          </ul>
        </div>
      </section>

      <section>
        <ChatPanel compact />
      </section>
    </div>
  );
}
