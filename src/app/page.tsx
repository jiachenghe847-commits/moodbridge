import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium text-teal-700">Moodbridge 心桥</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl">
            中文 AI 情绪陪伴与心理风险提示助手
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-700">
            心桥面向中文用户，帮助整理情绪、记录状态，并在出现明显心理风险信号时给出温和提示与求助建议。
            它不是医疗诊断工具，不能替代医生、心理咨询师或紧急救援服务。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="rounded-md bg-stone-950 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800"
            >
              进入聊天页
            </Link>
            <Link
              href="/mood"
              className="rounded-md border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800 hover:bg-white"
            >
              记录心情
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">阶段 1 范围</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
            <li>已建立页面骨架与中文导航。</li>
            <li>暂不接入模型 API。</li>
            <li>暂不创建数据库。</li>
            <li>暂不实现登录。</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["陪伴", "用中文表达情绪，获得结构化的回应空间。"],
          ["记录", "保留轻量心情记录入口，为后续趋势视图做准备。"],
          ["提示", "面向风险信号做安全边界提醒，而不是做诊断。"],
        ].map(([title, description]) => (
          <article
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            key={title}
          >
            <h2 className="font-semibold text-stone-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
