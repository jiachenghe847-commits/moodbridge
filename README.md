# Moodbridge 心桥

Moodbridge 心桥是一个中文 AI 情绪陪伴与心理风险提示助手。它用于帮助用户表达、整理和记录情绪，并在后续阶段提供心理风险提示。

本项目不是医疗诊断工具，不能替代医生、心理咨询师或紧急救援服务。

## 阶段 1：项目骨架

- Next.js + TypeScript + Tailwind CSS + App Router
- 首页、聊天页、心情记录页、隐私与免责声明页
- 简单中文导航栏
- 暂不接入模型 API
- 暂不创建数据库
- 暂不实现登录

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:3000 查看页面。

## 检查

```bash
npm run lint
npm run build
```

## 安全边界

- 不进行医疗诊断
- 不提供药物建议
- 不长期保存完整对话
- 不暴露 API 密钥或其他敏感信息
