export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">聊天</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">
          情绪陪伴对话
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-700">
          这里将用于与 AI 助手进行中文情绪陪伴对话。当前阶段只提供页面占位，
          不接入模型 API，也不会发送或保存真实对话内容。
        </p>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div className="rounded-lg bg-stone-100 p-4 text-sm leading-6 text-stone-700">
            你好，我是心桥。等模型接入后，我会帮助你梳理情绪，但不会做医疗诊断。
          </div>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">
              想说的话
            </span>
            <textarea
              className="mt-2 h-32 w-full resize-none rounded-md border border-stone-300 bg-stone-50 p-3 text-sm outline-none focus:border-teal-600"
              disabled
              placeholder="阶段 1 暂不开放输入"
            />
          </label>
          <button
            className="rounded-md bg-stone-300 px-4 py-2 text-sm font-medium text-stone-600"
            disabled
            type="button"
          >
            暂未接入
          </button>
        </div>
      </section>
    </div>
  );
}
