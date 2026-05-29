export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">隐私与免责声明</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">
          使用边界
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-700">
          Moodbridge 心桥是中文 AI 情绪陪伴与心理风险提示助手，不是医疗诊断工具。
        </p>
      </div>

      <section className="space-y-5 rounded-lg border border-stone-200 bg-white p-5 leading-7 text-stone-700 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-950">免责声明</h2>
          <p className="mt-2">
            本项目不提供诊断、治疗方案或药物建议。若你正在经历紧急危险、
            自伤或伤害他人的冲动，请立即联系当地紧急服务或可信任的人。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-stone-950">隐私原则</h2>
          <p className="mt-2">
            当前阶段没有模型 API、数据库或登录系统。后续实现应避免长期保存完整对话，
            并确保密钥只存在于服务端环境变量中。
          </p>
        </div>
      </section>
    </div>
  );
}
