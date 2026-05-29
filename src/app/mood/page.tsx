const moods = ["平静", "低落", "焦虑", "疲惫", "有希望"];

export default function MoodPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">心情记录</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">
          今天的状态
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-700">
          这里将用于记录每日心情和简单备注。当前阶段只建立界面骨架，
          不创建数据库，也不长期保存完整对话。
        </p>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-stone-950">选择一个接近的心情</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {moods.map((mood) => (
            <button
              className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700"
              disabled
              key={mood}
              type="button"
            >
              {mood}
            </button>
          ))}
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-stone-800">备注</span>
          <textarea
            className="mt-2 h-28 w-full resize-none rounded-md border border-stone-300 bg-stone-50 p-3 text-sm outline-none"
            disabled
            placeholder="阶段 1 暂不保存记录"
          />
        </label>
      </section>
    </div>
  );
}
