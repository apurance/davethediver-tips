# 开发指南

[返回 README](../README.md)

## 环境与启动

需要 Node.js 22.13+（推荐 24）和 pnpm 11.13.1。

```powershell
git clone https://github.com/apurance/davethediver-tips.git
cd davethediver-tips
pnpm install
pnpm dev
```

启动后打开 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)。首次克隆以及依赖声明更新后，都需要执行 `pnpm install`。

局域网访问使用 `pnpm run dev --host`，末尾不需要再加 `--`。在原终端按 Ctrl+C 停止，等待命令提示符返回后再重新启动。

## 启动与端口排查

`pnpm-workspace.yaml` 禁止自动切换 pnpm 版本，并关闭运行脚本前的自动安装。否则，pnpm 版本不匹配或依赖检查设置变化时，`pnpm dev` 可能先联网下载 pnpm 或执行 `pnpm install`，表现为 Vite 启动前长时间没有输出。安装、更新依赖后显式运行 `pnpm install`；pnpm 版本不匹配时会立即提示错误。

开发端口固定为 5173，已被占用时会直接报错。若 Ctrl+C 后仍提示占用，在 PowerShell 中查看监听进程：

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | ForEach-Object {
  Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)" |
    Select-Object ProcessId, ParentProcessId, CommandLine
}
```

确认命令行指向本项目的 `node_modules` 下的 `vite` 后，使用 `Stop-Process -Id <上面查到的 ProcessId>` 终止该残留进程，再启动开发服务器。

## 检查与构建

```powershell
pnpm build    # TypeScript 检查并构建到 dist
pnpm preview  # 查看生产构建
pnpm test     # 使用 Node 内置 test runner 验证经营模型（Node 22.18+）
```

## 中文输入回归检查

启动开发服务器后，打开 `/tests/ime-regression.html` 并点击“运行测试”，可对五个搜索框运行中文组合输入事件回归检查，覆盖拼音选词、连续汉字、英文、清空、Escape 和页面返回。该检查模拟浏览器事件；系统输入法可在应用页面继续手动验证。

## 代码与数据目录

- `src/data.ts`：攻略、资料、代表菜谱的显示适配与清单。
- `src/data/database.json`：食谱、食材、鱼类、员工属性和稳定 ID 关联。
- `src/data/names.zh-CN.json`：中文名称和译文的唯一维护入口。
- `src/data/strategy-recipes.json`：七道代表菜谱的经营用途与已核对等级曲线。
- `src/catalog.ts`：统一名称读取、关联解析和数据库搜索。
- `src/facts.ts`：属性数值、单位、模板格式化与每公斤价值的运行时计算。
- `scripts/`：地图导出等辅助工具，不参与应用运行。
- `src/App.tsx`：共享布局与路由出口。
- `src/routing/routes.tsx`：路由表，专题页、搜索、收藏与 404。
- `src/pages/`：各路由页面。
- `src/components/`：布局与功能组件。
- `src/hooks/`：路由导航、搜索、收藏、本地保存与共享页面状态。
- `src/calculations.ts`：经营与供给计算逻辑。
- `src/styles.css`：布局、主题、手机与打印样式。
- `src/pages/MapsPage.tsx`、`src/components/DeepSeaMap.tsx`：深海地图交互及 SVG 渲染。
- `src/data/deep-sea-terrain.json`：两份共用地形，每份为 64 × 69 方格；`#` 为岩石、`.` 为水域、`p` 为原图紫色岩层。
- `src/data/deep-sea-markers.json`：六套示意坐标（单位为方格），独立于地形。来源为 CleverLab / 甜菜；本地参考原图位于 `rawdata/`，已被 Git 忽略，不参与应用运行或构建。
- `maps/`：九份独立 SVG；页面下载反映当前图层选择。地图数据直接维护 `src/data/deep-sea-*.json` 和 `src/data/glacial-*.json`；运行 `node scripts/export-deep-sea.mjs` 可重新导出九张完整地图，追加参数 `C` 可仅导出冰河＋热泉三张。`python -B scripts/trace-glacial.py` 使用 Pillow 和本地 `rawdata/` 第 14–16 张参考图重建冰河共用地形与手工核对的标记坐标；普通构建无需 Pillow 或参考图。
- `.superdesign/overview.html`：已确认的设计参考，不是运行页面。

## 部署

在线站点和 Cloudflare Pages 构建配置见 [部署指南](deployment.md)。数据变更约定见 [数据维护](data-maintenance.md)。
