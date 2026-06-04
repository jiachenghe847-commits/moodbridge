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
            本项目只提供非诊断性的风险提示，不判断用户是否患有心理或医学疾病，
            不提供患病概率、治疗方案或药物建议。PHQ-9、GAD-7 等自评问卷只能帮助自我了解和专业沟通，
            问卷结果也不是诊断。
          </p>
          <p className="mt-2">
            本项目不替代医生、心理咨询师或紧急救援。若你正在经历紧急危险、
            自伤或伤害他人的冲动，请立即联系 110 / 120 或身边可信任的人。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-stone-950">隐私原则</h2>
          <p className="mt-2">
            当前阶段的聊天内容只保存在页面状态中，不写入数据库。模型密钥只存在于服务端环境变量中，
            前端代码不应包含或暴露真实密钥。
          </p>
        </div>
      </section>
    </div>
  );
}
