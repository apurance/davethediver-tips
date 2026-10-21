# BLUE HOLE · 潜水员戴夫中文攻略

面向《潜水员戴夫》（DAVE THE DIVER）玩家的非官方中文攻略网站，整合玩法指南、食谱与鱼类图鉴、员工资料、深海地图和经营计算器。

**[在线体验 → davethediver-tips.pages.dev](https://davethediver-tips.pages.dev/)**

## 功能

- **玩法攻略**：推进与升级、捕鱼装备、养殖农场、Boss、派对、收集与扩展内容，可按游戏阶段筛选。
- **数据图鉴**：查询食谱、食材、鱼类和员工，通过关联链接查看用料、来源与用途。
- **深海地图**：两类地形、六套分布，支持标记筛选、缩放和 SVG 下载。
- **经营计算器**：估算两店备菜、供给瓶颈、成本与收益，以及升级回本。
- **搜索与收藏**：中英文搜索、攻略收藏、日常清单、Boss 剧透开关和打印。
- **响应式界面**：适配桌面与手机，收藏、清单和偏好保存在当前浏览器。

项目采用 React、TypeScript、Vite 和 Ant Design。所有攻略数据随应用打包，搜索和计算在浏览器内完成，无需后端或服务器数据库。

## 本地运行

需要 **Node.js 24**（最低 22.13）和 **pnpm 11.13.1**。

```sh
git clone https://github.com/apurance/davethediver-tips.git
cd davethediver-tips
pnpm install
pnpm dev
```

打开 [http://localhost:5173/](http://localhost:5173/)。局域网访问可使用 `pnpm dev --host`。

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm check` | TypeScript 检查 |
| `pnpm test` | 运行测试（Node.js 22.18+） |
| `pnpm build` | 检查类型并构建到 `dist/` |
| `pnpm preview` | 本地预览生产构建 |

环境配置、端口排查和中文输入检查见 [开发指南](docs/development.md)。

## 部署

正式站点由 **Cloudflare Pages** 托管，推送到本仓库的 `main` 分支后自动构建和部署。

项目可作为纯静态网站部署：执行 `pnpm build`，发布 `dist/`，并为前端路由配置 `index.html` 回退。Cloudflare 的版本设置及其他静态服务器配置见 [部署指南](docs/deployment.md)。

## 文档与贡献

| 文档 | 内容 |
| --- | --- |
| [使用说明](docs/usage.md) | 功能详情、页面地址与本地保存行为 |
| [开发指南](docs/development.md) | 环境、命令、目录结构与故障排查 |
| [部署指南](docs/deployment.md) | Cloudflare Pages 自动部署与静态路由配置 |
| [数据维护](docs/data-maintenance.md) | 中文译名、数据字段、关联规则与快照核对 |
| [数据来源与整理记录](docs/data-sources.md) | 资料范围、导入记录和数据清理历史 |

欢迎通过 [Issues](https://github.com/apurance/davethediver-tips/issues) 反馈问题或提交 Pull Request。数据纠错请尽量附上游戏版本、平台和可核对的来源；修改数据前请阅读维护文档。

## 资料说明

本项目与 MINTROCKET 无关联。攻略与数据库为人工整理的快照，不会自动跟随游戏更新；不同平台或版本的表现可能存在差异。主要数据来自 [davethediver.net](https://davethediver.net/zh-hans/database/)，其他资料及各条建议的依据可在站点的 [资料与方法](https://davethediver-tips.pages.dev/sources) 页面查看。
