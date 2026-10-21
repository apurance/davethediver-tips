# 数据维护

[返回 README](../README.md)

## 修改中文名称

**所有数据库中文名称、技能名称及属性译文集中在 `src/data/names.zh-CN.json`。** 关联只保存稳定 ID，列表、详情、搜索、经营计算器和攻略引用均通过统一的 `name()` 获取显示名称；修改一次即可统一生效。数据 JSON 不保存中文名称副本。

例如修改这些键的值：

```json
{
  "recipe/tiger-shark-sushi": "虎鲨寿司",
  "ingredient/bluefin-tuna-akami": "蓝鳍金枪鱼赤身",
  "fish/tiger-shark": "虎鲨",
  "staff/billy": "比利"
}
```

## 实体关联与字段 ID

直接作为食材使用的鱼，菜谱的 `ingredients[].ingredientId` 直接引用 `fish/...`，不再建立同名食材副本；修改鱼名会同时更新用料显示。独立部位、通用食材和其他食材仍引用 `ingredient/...`。鱼类的 `relatedIngredients` 只保留独立食材，不包含自身；`relatedRecipes` 保留鱼类关联的菜谱。所有关联和详情链接直接使用当前条目的正式 ID。未提供中文名的食材保留英文，仍可在名称 JSON 中手动补译。攻略中针对系统的普通叙述属于正文，不是重复维护的名称表。

属性字段的 `labelId` 使用可读的英文语义键，例如 `field/base-procurement`（基础采购）、`field/related-recipes`（关联菜谱）和 `field/max-price`（满级价格）。字段 ID 固定，中文显示仍从名称 JSON 读取；手动改译名时无需修改数据引用。详情页的属性分类及菜谱关联检查也使用固定 ID，不依赖中文译文。

## 数值与派生属性

所有独立数值统一放在 `stats`，例如 `"length": 210`、`"health": 250`、`"dailyLimit": 1`、`"servingTime": 19`。数据不再逐项声明 `unitId`、`templateId` 或 `parameters`，前端根据统计键推断单位和显示模板；中文单位及模板仍集中在名称 JSON，例如 `unit/gold`、`unit/centimeter`、`template/daily-quantity`。不同商家的价格分别保存为 `purchasePriceOtto`、`purchasePriceJango` 等数值键；同价共用商家使用 `purchasePriceJangoAndMushroomer`。来源中的“购买金币”对应 `buyGoldOtto`、`buyGoldJango`，保留独立字段。员工的 `cooking` 等来源属性与 `maxCooking` 等满级属性也分别保存。`facts` 仅保留文本、名称和实体引用，`facets` 分类和 `skillIds` 技能由前端生成显示字段。Marinca 卡编号统一保存为 `stats.marincaCardNumber` 数值，忽略前导零。

`database.json` 不保存“每公斤价值”、员工基础 / 满级属性总和、关联菜谱数量，也不保存 `computed`、`stat` 等显示描述。前端的 `getDisplayFacts()` 根据基础数据追加：每公斤价值 = `stats.sellPrice / stats.weight`（显示最多一位小数）；员工总和 = 对应四项属性之和；菜谱数量 = 当前去重后的关联菜谱数。基础数据不齐或重量非正时不追加相应计算字段，零售价和零菜谱数量正常显示。来源鱼类的“关联菜谱”字段仍保留，作为已核对的独立关联依据。

## 共用食材与图鉴编号

14 种有编号的海马共用 `ingredient/seahorse`，各物种保留独立图鉴与属性，食材的 `relatedFish` 列出全部 14 种来源。炸海马、海马沙拉、海马烤串、海马乌冬面均使用该通用食材，四道菜谱与各海马、通用食材保持双向关联；不再使用泛称 `fish/seahorse` 或长吻海马专用食材占位。

杂草海龙、叶海龙、红宝石海龙共用 `ingredient/seadragon`，三种来源与海龙饭团保持双向关联；通用食材保留独立食材记录的售价、重量和等级，不再使用泛称 `fish/seadragon` 或重复的 `ingredient/seadragon-ingredient`。

鱼类只保留 `stats.marincaCardNumber`，例如 `"stats": { "marincaCardNumber": 16 }`，按整数显示且不添加千位分隔符。`encyclopediaNumber` 和 `fields` 已移除；没有 Marinca 编号的条目省略该统计键。腔棘鱼采用原 Marinca 编号 `913`，迁移前与图鉴编号 `0991` 的冲突及其他缺失情况曾记录在本地 `reports/review.md`；该报告未随仓库提交。`stats` 只保存数值或缺失值 `null`。

## 文本属性

需要翻译的单个文本属性统一放在 `facets`，值直接保存译名 ID，例如 `"gatheringSource": "text/660af5fdf8cd"`、`"knockbackResistance": "text/b5141d3d19e9"`。字段键按驼峰形式还原为 `field/gathering-source` 等译名键；已有的 `time` 仍对应 `field/active-time`。字段名和值均通过名称表显示，`null` 表示来源未提供。带 `entityId` 的链接及多值混合内容继续保留在 `facts`，以保留跳转目标和原有顺序。

## 区域列表与名称归一

鱼类位置按人工确认结果统一保存到顶层 `region`，区域筛选与详情共用该值，鱼类的 `location` 副本已全部删除。已确认的“浅海 / 蓝洞，0-50 米”使用后者；白对虾使用“蓝洞，0-130 米”，蓝鳍及黄鳍金枪鱼使用“蓝洞，0-50 米”，巨型笔石使用“热泉喷口”。Glacial Area / Glacier Zone（含大小写变体）统一为 `region/glacial-area`，英文采用 Glacial Area，中文为“冰川区域”。

Cargo Ship / shipwreck 已统一为 shipwreck，中文为“遇难船”；红石蟹、旗鱼、黑虎虾共用该区域，黑虎虾原有的“中层”已修正。Glacial Passage / Glacier Passage 已统一为 Glacier Passage，中文为“冰川通道”，对应 6 条鱼的独立位置副本已删除。

“深层水域”和“深海”统一使用“蓝洞，130-250 米”。Glacial Area Dungeon 1 / glacial 1 统一为 `region/glacial-area-dungeon-1`（第一冰川洞穴）；Vents / vents 与已有“热泉喷口”统一为 `region/hydrothermal-vents`（Hydrothermal Vents，热泉喷口）；已确认的 Limestone Cave / stalactite 统一为 `region/limestone-cave`（Limestone Cave，钟乳石窟）。

顶层 `region` 保存区域 ID 列表，例如 `"region": ["region/8c354854b261", "region/glacial-area"]`；未知区域使用空列表 `[]`。同一条鱼可以属于多个区域：区域筛选检查列表是否包含选中 ID，下拉选项合并所有列表并去重，列表、详情和搜索读取全部区域译名。原先的单个区域已包装为单元素列表，该迁移不新增分布信息；`facets` 仅保存单个译名 ID 或 `null`，区域列表独立于 `facets`。

已确认的“蓝洞，50-130 米 / 中层”及“中层水域 / 中层”使用“蓝洞，50-130 米”；“浅水区”合并到“蓝洞，0-50 米”，limestone 合并到“钟乳石窟”，旧区域 ID 已删除。白斑水母（White Spotted Jellyfish）的区域为“钟乳石窟”。Glacial Area Dungeon 3 / glacial 3 统一为 `region/glacial-area-dungeon-3`（第三冰川洞穴）。

fog coast、black cliff、jellyfish basin 分别译为“迷雾海岸”“黑色峭壁”“水母盆地”；Dredge Point01 A/B、Point02 A/B、Point03 A/B 分别合并到对应区域，避免同一区域在筛选中出现多个选项。

## 维护数据快照

直接维护 `src/data/` 中的 JSON，不再从来源网站重新抓取整份数据库。旧导入流程没有应用后续的去重、关联和译名清理规则，重新导入会覆盖人工修订；历史导入脚本也未包含在当前仓库中。应用运行时不抓取网站，也没有后端。

修改后运行 `pnpm test` 和 `pnpm build`，检查经营模型、字段显示和区域筛选。

### 历史工具：本地 Wiki 快照核对

该脚本和原始快照未包含在当前仓库中，以下保留历史流程说明，不属于克隆后的可执行步骤。

曾使用 `python scripts/audit-wiki-fish.py`，将 `rawdata/view-source_https___dave-the-diver.fandom.com_wiki_Fish.html` 与数据库比较，输出 `reports/wiki-fish-audit.md` 和同名 JSON。工具支持普通 HTML 和浏览器保存的“查看源代码”页面，仅使用 Python 标准库，不联网、不修改数据库；可用 `--source` 指定其他同结构快照，`--output` 指定报告路径前缀。

报告区分数值差异、物种误合并、缺失菜谱、鱼类与菜谱双向关联、食材来源链路以及区域和掉落物的写法差异。JSON 保留来源文件哈希、Wiki 版本、原始表格行及证据行号。本页没有完整菜谱用料和经营属性，不能据此核实或补造这些数值。

## 相关文档

- [数据来源与整理记录](data-sources.md)：导入时间、资料范围与历史清理规则。
- [开发指南](development.md)：目录说明、构建和中文输入检查。

