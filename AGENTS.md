# AGENTS.md

面向参与 Moodbridge 心桥 开发的 AI 编码助手与协作者。

## 项目定位

Moodbridge 心桥是中文 AI 情绪陪伴与心理风险提示助手，不是医疗诊断工具。

## 安全要求

- 不诊断用户的心理或医学状况。
- 不提供药物建议，包括药物名称、剂量、停药或换药指导。
- 不长期保存完整对话；后续如需记录，应优先保存最小化、结构化、可删除的数据。
- 不暴露密钥；真实 API Key 只能放在本地或部署平台的安全环境变量中，不能提交到仓库。
- 每次修改后运行检查，至少执行 `npm run lint` 或 `npm run build`。

## 当前阶段限制

- 模型 API Key 只能从服务端环境变量读取。
- 前端代码不得包含或暴露真实 API Key。
- 暂不新增数据库或数据表（现有 Prisma + SQLite 仅用于 `MoodEntry`，见下方注）。
- 暂不实现登录。
- 注：仓库已包含 Prisma + SQLite 的 `MoodEntry` 心情记录表（无用户字段）。当前没有登录与用户隔离，文档不得声称数据“私密”或“受保护”；未经明确要求不要修改认证、数据模式或安全边界。

## 目录

- `src/app/` – 页面（首页、`chat`、`mood`、`screeners`、`privacy`）与 `api/` 路由（chat、risk、risk-assess、screener-report、mood）
- `src/lib/` – 风险分类、筛查、心情记录工具与 Prisma 客户端
- `src/components/` – UI 组件
- `prisma/` – schema 与迁移
- `tests/` – `risk`、`screeners` 单元测试
- `Dockerfile`、`docker-compose.yml`、`Caddyfile` – 容器部署配置

## 运行与检查

见 `README.md`。常用：`npm run dev`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run test:risk`。

## 完成标准

- 相关检查通过（或如实说明未运行及原因）。
- 文档与实际代码、路径一致；不夸大隐私或安全能力。
