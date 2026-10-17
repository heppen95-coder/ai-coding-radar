# Code Radar · AI 编码观察

中文 AI 编码资讯站，包含原文直达、分类搜索、每日归档和两日精选。纯静态网页，使用 Node.js 22 内置能力，无需安装依赖。

## 已实现

- 8 条首批中文资讯、6 条首期精选，每条有原文链接、发布日期和来源类型。
- 手机与桌面布局，关键词搜索、主题筛选、文章详情、日期筛选、往期精选。
- 每天北京时间 09:17 收集，按固定锚点每两天生成一期精选，跨月不重置。
- RSS/Atom、GitHub Releases、官方站点 sitemap 和可选 X API 采集。
- 新内容通过模型 API 整理为中文，失败时不发布英文或编造的摘要。
- 来源状态可见，历史内容永久保留；部署后无需电脑持续开机。

## 最快上线：GitHub Pages

1. 在 GitHub 创建一个公共仓库，例如 `ai-coding-radar`，默认分支使用 `main`。
2. 将本目录**所有文件和子目录**上传到仓库根目录，包括隐藏的 `.github/workflows/radar.yml`。不要上传上一级目录，也不要上传 dist 或凭证。
3. 打开仓库 Settings → Pages，Source 选择 **GitHub Actions**。
4. 打开 Actions → Collect and publish Code Radar → Run workflow。首次可关闭 Collect，先发布首批内容。
5. 成功后在 Settings → Pages 查看网址，通常为 `https://你的用户名.github.io/ai-coding-radar/`。

自动部署是公开网站，仓库中的资讯和源码也会公开。请仅上传本项目文件，不上传个人资料。

## 启用自动中文更新

仓库 Settings → Secrets and variables → Actions：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Secret | BIGMODEL_API_KEY | 智谱官方平台 API 密钥 |
| Variable（可选） | SUMMARY_MODEL | 默认为 glm-5.3；已有其他值请改为 glm-5.3 |
| Secret（可选） | X_BEARER_TOKEN | X 应用的公开数据读取 Token |

未配置模型密钥时，网页仍可发布初始内容；新消息不会自动生成中文摘要，任务会失败并保留状态。模型 API 与 X API 可能收费，网站托管免费不代表采集免费。X 每次请求最多读取 50 条，请按需要缩小账号列表。

配置好后手动运行一次 Collect，检查网站“消息来源”页和 Actions 日志。成功运行后每日定时任务才算实际验证完成。不要将密钥发在聊天或提交到仓库。

## 内容与来源

修改 `config.json` 管理来源、关键词、每轮最多摘要数量和两日周期锚点。

- 官方文章通过 sitemap 发现，使用页面内 `datePublished` / 发布时间；绝不把 sitemap 修改时间当成发布日期。
- sitemap 页面没有可识别发布日期或正文时会跳过；这是选择性采集，不保证覆盖官方站点全部内容。
- 社交动态使用 X recent search，只读取公开账号。未配置 Token 时不采集 X。
- 第一次仅处理最近 7 天，避免意外大量回填与摘要费用。
- 首期历史文章经过人工选入，因此包含超过 7 天的背景内容。
- 每日归档按原文北京时间日期；双日精选按新收录内容生成。
- API 摘要和相关性筛选可能出错，应定期抽查。文中效果数字需要保留“官方自报”等归属。
- GitHub 定时任务可能延迟；公共仓库长期无活动可能停用计划任务，需要在 Actions 重新启用。

## 本地运行

安装 Node.js 22 或更新版本，在此目录执行：

```sh
npm test
npm run build
npm run preview
```

访问 `http://127.0.0.1:4173`。关闭终端会停止本地预览，但不影响上线后的服务。

只测试公开来源，不调用摘要 API、不写内容：

```sh
node scripts/collect.mjs --dry-run
```

更新时通过环境变量传入凭证；脚本不会自动读取 `.env`。

## Cloudflare Pages（可选迁移）

已有 Cloudflare 账号时，可以新建 Pages 项目连接 GitHub 仓库，构建命令 `npm run build`，输出目录 `dist`。本项目不依赖服务端函数。

注意：GitHub Actions 使用内置 GITHUB_TOKEN 写入的提交通常不会触发其他 GitHub Actions，也不应假设会自动触发外部平台构建。若迁移到 Cloudflare，需在当前工作流中追加 Wrangler 直接部署步骤，并将 Cloudflare API Token 与 Account ID 放进 Secrets，不能只依靠提交触发。当前提供的工作流已经直接部署 GitHub Pages，不存在这个问题。

## 数据文件

新增免费 RSS 来源：Latent Space（AI 工程）、Hugging Face Blog（开源社区）、InfoQ AI（技术媒体）、MIT Technology Review AI（科技媒体）。只处理与既定主题有关的内容；媒体报道与官方公告分别标注。短订阅条目尝试读取公开正文，无法获取足够材料时由摘要筛选拒绝，不推断付费正文。每日六条处理名额中，社交原帖和不同媒体各预留最多两条，其余按时间排序补足。

侧栏数量按当前期刊、归档日期及搜索条件统计；切换“全部资讯”才显示全站范围数量。

- `data/items.json`：已发布的中文资讯。
- `data/editions.json`：各期精选引用的资讯 ID。
- `data/status.json`：采集时间、来源错误与启用状态。
- `public/`：网页；`scripts/`：采集、构建与检查逻辑。

当前交付状态：本地可构建；远程 GitHub 仓库、Pages 与自动任务需要在用户账号连接后启用。

## 智谱 GLM-5.3 摘要接入

当前默认直连 https://open.bigmodel.cn/api/paas/v4/chat/completions，使用 glm-5.3、thinking enabled 和 reasoning_effort low。仅发布完整的中文正文，不公开 reasoning_content。每条输出预算 8192 tokens（包含思考），超时 120 秒。

将官方密钥放入 GitHub Secrets 的 BIGMODEL_API_KEY；无需 OPENAI_API_KEY。如曾设置 SUMMARY_MODEL 为其他模型，请改成 glm-5.3 或删除该变量。使用普通模型 API 的计费与权限，不假设 Coding Plan 套餐可用于资讯摘要自动化。

接口及模型规则：https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3 。代码中的模拟测试不代表真实 API 已验证，需配置密钥后手动运行一次采集确认。

## 当前云端方式：OpenClaw + Coding Plan

免费社交来源使用 Bluesky public AppView，无需登录或社交平台密钥。config.json 的 bluesky 列表固定作者 DID（账号改名不影响原帖链接），当前包含 Simon Willison 与 Geoffrey Huntley。只采集作者自己的非回复帖子，附带链接预览作为上下文，不把转发当作作者原文。每日处理名额为社交原帖预留最多两条，其余继续处理博客和版本发布。中文摘要沿用已有 Coding Plan 额度；“免费”指社交数据接口。X 仍需单独配置凭证后才启用。

GitHub 工作流使用官方 openclaw@2026.10.4 CLI（Node.js 24），由真实 OpenClaw Agent 执行个人资讯整理。默认 zai/glm-5.3，智谱中国 Coding Plan 端点。每次最多6条，单条检查最多1条。未启用任何消息通道或对外代理服务。

密钥仍放 BIGMODEL_API_KEY，子进程通过 ZAI_API_KEY 使用；配置文件只包含环境变量引用，不保存密钥。Agent 工具全部禁用，不能读取仓库、执行命令或获取 GitHub Token。标准按量 API 模块保留供单独选择，当前云端选择 SUMMARY_BACKEND=openclaw。

官方支持说明：https://docs.bigmodel.cn/cn/coding-plan/tool/openclaw 。OpenClaw 使用套餐受到调度、额度和公平使用限制。真实验证结果以 Actions 和 data/status.json 为准。
