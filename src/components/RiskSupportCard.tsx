export function RiskSupportCard() {
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
