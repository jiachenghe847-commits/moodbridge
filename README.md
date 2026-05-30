# Moodbridge 心桥

Moodbridge 心桥是一个中文 AI 情绪陪伴与心理风险提示助手。它帮助用户表达情绪、获得一般性支持、识别明显心理风险信号，并记录用户主动提交的心情记录。

本项目不是医疗诊断工具，不能替代医生、心理咨询师、治疗师或紧急救援服务。

## 功能范围

- 中文情绪陪伴聊天：通过服务端 API 调用模型，前端不接触模型 API Key。
- 风险识别：聊天回复与风险分类是两个独立逻辑；高风险或紧急风险会强制显示固定求助卡片。
- 心情记录：使用 Prisma + SQLite 保存用户主动提交的记录。
- 趋势图：使用 Recharts 展示最近 7 天或 30 天的情绪强度趋势。
- 页面：首页、聊天页、心情记录页、隐私与免责声明页。

## 安全边界

- 不进行疾病诊断。
- 不提供治疗方案。
- 不提供药物名称、剂量、停药或换药建议。
- 不声称替代专业人员。
- 如存在立即危险，应联系当地紧急服务、110、120 或身边可信任的人。

## 数据保存原则

- 不长期保存完整聊天原文。
- 聊天记录只保存在浏览器当前页面状态中，刷新后清空。
- 数据库只保存用户主动提交的心情记录：日期、情绪、强度和备注。
- 本地 SQLite 数据库文件 `prisma/dev.db` 不应提交到 Git。
- `.env.local` 和任何真实密钥不应提交到 Git。

## 环境变量

创建 `.env.local`，填入服务端变量：

```bash
MODEL_API_KEY=replace_with_server_side_api_key
MODEL_API_BASE_URL=https://your-model-provider.example/v1/chat/completions
MODEL_NAME=replace_with_model_name
DATABASE_URL=file:./dev.db
```

如果使用 OpenAI-compatible 接口，`MODEL_API_BASE_URL` 应指向兼容的 chat completions 地址。真实密钥只能放在服务端环境变量中，不要写成 `NEXT_PUBLIC_...`。

## 本地运行

```bash
npm install
DATABASE_URL=file:./dev.db npx prisma generate
DATABASE_URL=file:./dev.db npx prisma migrate deploy
npm run dev
```

打开终端显示的本地地址，例如 `http://localhost:3000`。

## 心情记录验证

打开首页或 `/mood`，新增一条心情记录，确认它出现在“最近记录”中，并观察趋势图是否更新。点击记录右侧“删除”可验证删除功能。

## 检查

```bash
npm run lint
npm run typecheck
npm run build
npm run test:risk
DATABASE_URL=file:./dev.db npx prisma migrate status
```

## 部署方式

部署到支持 Next.js 的平台时，需要配置服务端环境变量：

```bash
MODEL_API_KEY=replace_with_server_side_api_key
MODEL_API_BASE_URL=https://your-model-provider.example/v1/chat/completions
MODEL_NAME=replace_with_model_name
DATABASE_URL=file:./dev.db
```

SQLite 适合本地开发和单机原型。若部署到无持久磁盘或 serverless 环境，应改用托管数据库，并相应更新 `DATABASE_URL`。不要把本地 `prisma/dev.db` 上传到公开仓库。

推荐部署流程：

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

## 开源许可证

本项目使用 MIT License，见 [LICENSE](./LICENSE)。
