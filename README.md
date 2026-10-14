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

启动开发服务器后，打开 `/tests/ime-regression.html` 并点击“运行测试”，可对五个搜索框运行中文组合输入事件回归检查，覆盖拼音选词、连续汉字、英文、清空、Escape 和页面返回。该检查模拟浏览器事件；系统输入法可在应用页面继续手动验证。

## 内容与功能

- 35 条攻略：推进、潜水、武器饰品、菜谱、员工分店、养殖农场、重点 Boss、活动、图鉴小游戏、DLC。
- 本地数据库：531 条食谱、442 条食材、343 条鱼类和 33 条员工记录。中英文搜索、排序、分页、菜谱用途 / 鱼类区域 / 员工评级筛选；详情保留来源链接和缺失值。
- 食谱 → 食材 → 来源鱼类，以及食材 / 鱼类 → 食谱的双向跳转；配队建议可打开员工详情。
- 7 道代表菜谱的已核对等级曲线、经营建议和备货计算；与数据库共用名称和关联条目。
- 省操作 / 手动补芥末两套人员搭配。
- 两店分别取整的备菜需求、加成与成本估算、日产瓶颈、升级机会成本回本计算器。
- 全文搜索（Ctrl+K）、阶段筛选、Boss 剧透开关、收藏、日常清单与打印。
- 收藏、清单和偏好保存于浏览器 localStorage，不发送给服务器；计算参数仅保留本次会话。
- 桌面侧栏、移动目录抽屉与响应式卡片。表格在手机上可横向滚动。
- React Router 路由：`/recipes` 食谱、`/ingredients` 食材、`/fish` 鱼类、`/staff` 员工。详情地址如 `/recipes/tiger-shark-sushi`、`/ingredients/tiger-shark-meat`、`/fish/tiger-shark`、`/staff/billy` 可直接打开、刷新和分享；来源网站的重复条目地址自动跳转到合并后的条目。
- `/search?q=关键词` 同时检索数据库和攻略，阶段筛选仅影响攻略；`/bookmarks` 为攻略收藏。`/tools?recipe=tropical` 保留原有备货链接，旧 `/#recipes` 链接自动跳转。
- `/maps` 深海 SVG 地图：A / B 两份方格地形，各有 01–03 三套道具与大鱼分布。可筛选九类标记、切换方格线和鱼名、放大地图，并下载含图例的独立 SVG。网址如 `/maps?type=B&layout=03` 可直接打开并在刷新后保留选择。

## 部署路由

使用 Browser History 路由。Vite 开发和预览服务支持直接打开、刷新子页面；部署到静态服务器时，需要将不存在的文件路径回退到 `index.html`，并保留真实静态资源请求。例如 Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 调研范围

检索日期 **2026-10-09**。本体经营与采集为主，In the Jungle / DREDGE 为单独附录。关键数据链接和 37 项资料见页面“资料与方法”。官方消息、Wiki 数值、社区经验和本文建议分别标注。

数据库于 **2026-10-11** 从 [davethediver.net](https://davethediver.net/zh-hans/database/) 的 1,312 个索引页导入，合并可确认重复项，将误归在鱼类目录的调料、农作物和鱼肉归入食材，排除矿石、猫粮、GYAO 等本次范围以外的记录。保留网站数值与译名，不将缺失数量当作一份，也不推算缺失的满级属性。该快照并不保证来源网站覆盖全部游戏内容。

根据游戏核对结果，以鱼类的“关联菜谱”字段为准，删除反向关联额外引入、且未被任何鱼的该字段收录的 65 道菜谱，同时清理链接、别名及对应译名。存在该字段的鱼，其“可制作食谱”与字段保持一致；被其他鱼收录的菜谱保留。字段缺失的鱼、蔬菜及 Boss 料理不因缺少鱼类声明而删除。清理依据及删除 ID 记录在 `database.json` 的 `metadata.recipeCleanup` 中。

攻略未对所有平台和补丁实机测试。“最优”按省操作、稳定供给、捕获效率等不同目标给出。经理门槛来源于旧版社区测试，需要核对当前游戏显示。

## 手动修改中文名称

**所有数据库中文名称、技能名称及属性译文集中在 `src/data/names.zh-CN.json`。** 关联只保存稳定 ID，列表、详情、搜索、经营计算器和攻略引用均通过统一的 `name()` 获取显示名称；修改一次即可统一生效。数据 JSON 不保存中文名称副本。

例如修改这些键的值：

```json
{
  "recipe/tiger-shark-sushi": "虎鲨寿司",
  "ingredient/tiger-shark-meat": "虎鲨肉",
  "fish/tiger-shark": "虎鲨",
  "staff/billy": "比利"
}
```

直接作为食材使用的鱼，其食材条目 `nameId` 指向对应鱼类名称，修改鱼名会同时更新用料显示。已合并的来源 ID 通过 `database.json` 中的 `aliases` 指向统一条目。未提供中文名的食材保留英文，仍可在名称 JSON 中手动补译。攻略中针对系统的普通叙述属于正文，不是重复维护的名称表。

属性字段的 `labelId` 使用可读的英文语义键，例如 `field/base-procurement`（基础采购）、`field/related-recipes`（关联菜谱）和 `field/max-price`（满级价格）。字段 ID 固定，中文显示仍从名称 JSON 读取；手动改译名时无需修改数据引用。详情页的属性分类及菜谱关联检查也使用固定 ID，不依赖中文译文。

所有独立数值统一放在 `stats`，例如 `"length": 210`、`"health": 250`、`"dailyLimit": 1`、`"servingTime": 19`。数据不再逐项声明 `unitId`、`templateId` 或 `parameters`，前端根据统计键推断单位和显示模板；中文单位及模板仍集中在名称 JSON，例如 `unit/gold`、`unit/centimeter`、`template/daily-quantity`。不同商家的价格分别保存为 `purchasePriceOtto`、`purchasePriceJango` 等数值键；同价共用商家使用 `purchasePriceJangoAndMushroomer`。来源中的“购买金币”对应 `buyGoldOtto`、`buyGoldJango`，保留独立字段。员工的 `cooking` 等来源属性与 `maxCooking` 等满级属性也分别保存。`facts` 仅保留文本、名称和实体引用，`facets` 分类和 `skillIds` 技能由前端生成显示字段。图鉴编号等标识保留字符串，避免丢失前导零。

`database.json` 不保存“每公斤价值”、员工基础 / 满级属性总和、关联菜谱数量，也不保存 `computed`、`stat` 等显示描述。前端的 `getDisplayFacts()` 根据基础数据追加：每公斤价值 = `stats.sellPrice / stats.weight`（显示最多一位小数）；员工总和 = 对应四项属性之和；菜谱数量 = 当前去重后的关联菜谱数。基础数据不齐或重量非正时不追加相应计算字段，零售价和零菜谱数量正常显示。来源鱼类的“关联菜谱”字段仍保留，作为已核对的独立关联依据。

无需翻译的字符串值放在可选的 `fields` 中，例如 `"fields": { "encyclopediaNumber": "0016", "marincaCardNumber": "16" }`；没有此类值的条目省略 `fields`。显示时将驼峰键转换为 `field/encyclopedia-number`、`field/marinca-card-number` 查询字段译名，值原样显示，保留前导零。两种编号尚未整体合并：忽略前导零后，腔棘鱼的图鉴编号 `0991` 与 Marinca 卡编号 `913` 仍不一致，现保留来源值。`stats` 继续只保存数值或缺失值 `null`。

需要翻译的单个文本属性统一放在 `facets`，值直接保存译名 ID，例如 `"gatheringSource": "text/660af5fdf8cd"`、`"knockbackResistance": "text/b5141d3d19e9"`。字段键按驼峰形式还原为 `field/gathering-source` 等译名键；已有的 `time` 仍对应 `field/active-time`。字段名和值均通过名称表显示，`null` 表示来源未提供。带 `entityId` 的链接及多值混合内容继续保留在 `facts`，以保留跳转目标和原有顺序。

鱼类位置按人工确认结果统一保存到顶层 `region`，区域筛选与详情共用该值，鱼类的 `location` 副本已全部删除。已确认的“浅海 / 蓝洞，0-50 米”使用后者；白对虾使用“蓝洞，0-130 米”，蓝鳍及黄鳍金枪鱼使用“蓝洞，0-50 米”，巨型笔石使用“热泉喷口”。Glacial Area / Glacier Zone（含大小写变体）统一为 `region/glacial-area`，英文采用 Glacial Area，中文为“冰川区域”。

Cargo Ship / shipwreck 已统一为 shipwreck，中文为“遇难船”；红石蟹、旗鱼、黑虎虾共用该区域，黑虎虾原有的“中层”已修正。Glacial Passage / Glacier Passage 已统一为 Glacier Passage，中文为“冰川通道”，对应 6 条鱼的独立位置副本已删除。

“深层水域”和“深海”统一使用“蓝洞，130-250 米”。Glacial Area Dungeon 1 / glacial 1 统一为 `region/glacial-area-dungeon-1`（第一冰川洞穴）；Vents / vents 与已有“热泉喷口”统一为 `region/hydrothermal-vents`（Hydrothermal Vents，热泉喷口）；已确认的 Limestone Cave / stalactite 统一为 `region/limestone-cave`（Limestone Cave，钟乳石窟）。

顶层 `region` 保存区域 ID 列表，例如 `"region": ["region/8c354854b261", "region/glacial-area"]`；未知区域使用空列表 `[]`。同一条鱼可以属于多个区域：区域筛选检查列表是否包含选中 ID，下拉选项合并所有列表并去重，列表、详情和搜索读取全部区域译名。当前单个区域已包装为单元素列表，本次不新增分布信息；`facets` 仅保存单个译名 ID 或 `null`，区域列表独立于 `facets`。

已确认的“蓝洞，50-130 米 / 中层”及“中层水域 / 中层”使用“蓝洞，50-130 米”；“浅水区”合并到“蓝洞，0-50 米”，limestone 合并到“钟乳石窟”，旧区域 ID 已删除。白斑水母（White Spotted Jellyfish）的区域为“钟乳石窟”。Glacial Area Dungeon 3 / glacial 3 统一为 `region/glacial-area-dungeon-3`（第三冰川洞穴）。

fog coast、black cliff、jellyfish basin 分别译为“迷雾海岸”“黑色峭壁”“水母盆地”；Dredge Point01 A/B、Point02 A/B、Point03 A/B 分别合并到对应区域，避免同一区域在筛选中出现多个选项。

## 维护数据快照

后续不再从该网站抓取此类数据，直接维护 `src/data/` 中的 JSON。旧导入脚本保留为历史工具，未加入本次清理规则，重新运行会覆盖清理结果。应用运行时不抓取网站，也没有后端。

修改后运行 `pnpm test` 和 `pnpm build`，检查经营模型、字段显示和区域筛选。

### 本地 Wiki 快照核对

运行 `python scripts/audit-wiki-fish.py`，将 `rawdata/view-source_https___dave-the-diver.fandom.com_wiki_Fish.html` 与当前数据库比较，输出 `reports/wiki-fish-audit.md` 和同名 JSON。支持普通 HTML 和浏览器保存的“查看源代码”页面，仅使用 Python 标准库，不联网、不修改数据库。可用 `--source` 指定其他同结构快照，`--output` 指定报告路径前缀。

报告区分数值差异、物种误合并、缺失菜谱、鱼类与菜谱双向关联、食材来源链路以及区域和掉落物的写法差异。JSON 保留来源文件哈希、Wiki 版本、原始表格行及证据行号。本页没有完整菜谱用料和经营属性，不能据此核实或补造这些数值。

## 修改内容

- `src/data.ts`：攻略、资料、代表菜谱的显示适配与清单。
- `src/data/database.json`：食谱、食材、鱼类、员工属性和稳定 ID 关联。
- `src/data/names.zh-CN.json`：中文名称和译文的唯一维护入口。
- `src/data/strategy-recipes.json`：七道代表菜谱的经营用途与已核对等级曲线。
- `src/catalog.ts`：统一名称读取、关联解析和数据库搜索。
- `src/facts.ts`：属性数值、单位、模板格式化与每公斤价值的运行时计算。
- `scripts/`：数据抓取与整理工具，不参与应用运行。
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
- `maps/`：六份独立 SVG；页面下载反映当前图层选择。地图数据直接维护 `src/data/deep-sea-*.json`；运行 `node scripts/export-deep-sea.mjs` 可根据当前 JSON 重新导出六张完整地图。
- `.superdesign/overview.html`：已确认的设计参考，不是运行页面。

页面不调用实时外部 API，不加载外部字体或图像。安装依赖后可在断网环境阅读，资料链接仍需联网。非官方项目，与 MINTROCKET 无关联。
