# Moodbridge 心桥

Moodbridge 心桥是一个中文 AI 情绪陪伴与心理风险提示助手。它用于帮助用户表达、整理和记录情绪，并在后续阶段提供心理风险提示。

本项目不是医疗诊断工具，不能替代医生、心理咨询师或紧急救援服务。

## 阶段 1：项目骨架

- Next.js + TypeScript + Tailwind CSS + App Router
- 首页、聊天页、心情记录页、隐私与免责声明页
- 简单中文导航栏
- 暂不实现登录

## 阶段 3：模型 API 接入

- 服务端聊天 API 路由：`/api/chat`
- 模型 API Key 只从服务端环境变量读取
- 前端不包含真实 API Key
- 聊天记录只保存在当前页面状态中，不写入数据库
- 系统提示词限制助手为非医疗性质的中文情绪支持助手

## 阶段 5：心情记录

- 使用 Prisma + SQLite
- 只保存用户主动提交的心情记录
- 不保存完整聊天原文
- 支持新增、查看最近记录、删除记录
- 使用最近 7 天或 30 天趋势图辅助自我观察

## 环境变量

创建 `.env.local`，填入服务端变量：

```bash
MODEL_API_KEY=your_model_api_key_here
MODEL_API_BASE_URL=https://api.openai.com/v1/chat/completions
MODEL_NAME=gpt-4o-mini
DATABASE_URL=file:./dev.db
```

不要把 `.env.local` 提交到版本库。

## 本地运行

```bash
npm install
DATABASE_URL=file:./dev.db npx prisma migrate status
npm run dev
```

打开 http://localhost:3000 查看页面。

## 检查

```bash
npm run lint
npm run build
npm run test:risk
```

## 心情记录验证

启动开发服务器后打开首页或 `/mood`，新增一条心情记录，确认它出现在“最近记录”中，并观察趋势图是否更新。点击记录右侧“删除”可验证删除功能。

如需确认数据库迁移状态：

```bash
DATABASE_URL=file:./dev.db npx prisma migrate status
```

## 安全边界

- 不进行医疗诊断
- 不提供药物建议
- 不长期保存完整对话
- 不暴露 API 密钥或其他敏感信息
