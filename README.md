# BLUE HOLE · 潜水员戴夫中文攻略

在本地运行的中文玩法手册，React + TypeScript + Vite + **Ant Design 6**。界面控件采用组件库；海洋插画、供需循环与售价图使用 SVG / div。未部署网站。

## 运行

需要 Node.js 22.12+（推荐 24）和 pnpm。

```powershell
cd D:\source\daifu
pnpm install
pnpm dev
```

打开 http://127.0.0.1:5173/ 。首次交付时依赖已经安装。

```powershell
pnpm build    # TypeScript 检查并构建到 dist
pnpm preview  # 查看生产构建
pnpm test     # 使用 Node 内置 test runner 验证经营模型（Node 22.18+）
```

## 内容与功能

- 35 条攻略：推进、潜水、武器饰品、菜谱、员工分店、养殖农场、重点 Boss、活动、图鉴小游戏、DLC。
- 7 道代表菜谱的各等级售价、份数、原料、解锁和限制；排序、用途筛选、对比与详情。
- 省操作 / 手动补芥末两套人员搭配。
- 两店分别取整的备菜需求、加成与成本估算、日产瓶颈、升级机会成本回本计算器。
- 全文搜索（Ctrl+K）、阶段筛选、Boss 剧透开关、收藏、日常清单与打印。
- 收藏、清单和偏好保存于浏览器 localStorage，不发送给服务器；计算参数仅保留本次会话。
- 桌面侧栏、移动目录抽屉与响应式卡片。表格在手机上可横向滚动。
- React Router 路由：`/` 概览、`/recipes` 菜谱、`/staff` 员工、`/tools` 计算器等专题；`/search?q=关键词` 搜索、`/bookmarks` 收藏。菜谱备货链接如 `/tools?recipe=tropical` 可刷新或分享，旧 `/#recipes` 链接自动跳转到新地址。

## 部署路由

使用 Browser History 路由。Vite 开发和预览服务支持直接打开、刷新子页面；部署到静态服务器时，需要将不存在的文件路径回退到 `index.html`，并保留真实静态资源请求。例如 Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 调研范围

检索日期 **2026-10-09**。本体经营与采集为主，In the Jungle / DREDGE 为单独附录。关键数据链接和 37 项资料见页面“资料与方法”。官方消息、Wiki 数值、社区经验和本文建议分别标注。

不是全量菜谱数据库、逐个任务的全收集流程或所有平台最新补丁的实机测试。“最优”按省操作、稳定供给、捕获效率等不同目标给出，附解锁条件和替代方案。经理等级门槛来源于旧版社区测试，需要核对当前游戏显示。姓名、物种可能因译本不同，保留容易混淆的英文名。

## 修改内容

- `src/data.ts`：攻略、资料、菜谱数据与清单。
- `src/App.tsx`：共享布局与路由出口。
- `src/routing/routes.tsx`：路由表，专题页、搜索、收藏与 404。
- `src/pages/`：各路由页面。
- `src/components/`：布局与功能组件。
- `src/hooks/`：路由导航、搜索、收藏、本地保存与共享页面状态。
- `src/calculations.ts`：经营与供给计算逻辑。
- `src/styles.css`：布局、主题、手机与打印样式。
- `.superdesign/overview.html`：已确认的设计参考，不是运行页面。

页面不调用实时外部 API，不加载外部字体或图像。安装依赖后可在断网环境阅读，资料链接仍需联网。非官方项目，与 MINTROCKET 无关联。
