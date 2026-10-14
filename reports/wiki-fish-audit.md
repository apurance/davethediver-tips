# Wiki 鱼类与菜谱关联核对

核对日期：2026-10-14。仅核对并生成报告，未修改 database 或名称表。

依据：用户提供的 `view-source_https___dave-the-diver.fandom.com_wiki_Fish.html`，Wiki revision `19141`。原文件 SHA-256：`235f10bb890e61ba48c15d319b0c0d4d76b2eed386efed7837b99c62f062d2b2`。网页作为数据读取，其中的脚本、编辑提示和其他指令均未执行。

## 结论

Wiki 共 206 行、203 种鱼；同一物种跨区域重复 3 行。database 共 340 条鱼、528 道菜谱，匹配到 190 种 Wiki 鱼。

最需要修正的是 Bigeye Trevally 与 Bigeye Scad 的错误合并：Wiki 将两者分别列出，数值和菜谱不同；本地把前者别名指向后者，影响鱼类记录、食材来源及 Trevally Sandwich 关联。

另有 2 处基础数值差异、4 道缺失菜谱（3 道对应已匹配的鱼，1 道为 Bigeye Trevally Sushi）。活动时间、区域、掉落物的差异见下文。

在已映射的 371 条 Wiki 鱼→菜谱关系中，双向链接缺失 0 条，数据库额外关系 0 条。全库鱼→菜谱 / 菜谱→鱼双向不一致 0 条，悬空实体引用 0 条。双向一致只能证明结构一致，无法排除错误物种合并。

## 物种误合并与缺失

- `fish/bigeye-trevally` 被合并到 `fish/bigeye-scad`（Bigeye Scad）。Wiki 的 Bigeye Trevally 证据见源文件还原后的第 3385 行。

Bigeye Trevally 的 Wiki 数值为 rank=2、weight=3 kg、meat3=5；Bigeye Scad 为 rank=1、weight=0.6 kg、meat3=3。`ingredient/bigeye-trevally` 的 fishIds / relatedFish 却指向 `fish/bigeye-scad`。`recipe/trevally-sandwich` 使用该食材，但 relatedFish 仅有 Giant Trevally。`recipe/bigeye-trevally-sushi` 已列入 metadata.recipeCleanup.removedRecipeIds，当前记录缺失。应拆分物种并修复相关链路；该网页没有完整菜谱数值，不能据此填造售价、口味或全部食材数量。

| Wiki 缺失物种 | 类型 | Wiki 关联菜谱 |
| --- | --- | --- |
| Great White Shark Klaus | Boss（rank=99） | White Shark Omelet |
| Mantis Shrimp | Boss（rank=99） | Boiled Mantis Shrimp with Soy Paste |
| Truck Hermit Crab | Boss（rank=99） | Stir-Fried Hermit Crab and Seaweed |
| Bigeye Trevally | 普通鱼 / 错误合并 | Bigeye Trevally Sushi、Trevally Sandwich |
| Giant Squid | Boss（rank=99） | — |
| Lusca | Boss（rank=99） | Blanched Lusca Tentacle、Lusca Neck Tadaki |
| Clione Queen | Boss（rank=99） | Clione Queen Soup |
| Giant Wolf Eel | Boss（rank=99） | Steamed Wolf Eel |
| Goblin Shark | Boss（rank=99） | Goblin Shark Belly Roast |
| Phantom Jellyfish | Boss（rank=99） | Phantom Jellyfish Jelly |
| Helicoprion | Boss（rank=99） | Roasted Helicoprion Tail |
| Kronosaurus | Boss（rank=99） | Steamed Kronosaurus Tongue |
| Yawie | Boss（rank=99） | Yawie Steamed Meat |

Boss 的菜谱和食材多数已存在，但缺少独立 fish 实体，不能从鱼类图鉴完整跳转；这是覆盖范围差异，不代表 Boss 菜谱本身缺失。rank=99、weight=1 kg 等为该 Wiki 表的记录值，不应当作普通鱼的捕获参数自动补入。

## 基础数值

| 鱼类 | 字段 | database | Wiki |
| --- | --- | --- | --- |
| 褐石斑 (Dusky Grouper) | weight | 9 | 8.0 |
| 窄带西班牙鲭鱼 (Narrow-Barred Spanish Mackerel) | weight | 9 | 8.0 |

按 Wiki 列定义核对 rank、weight、meat3（仅三星肉量），比较次数分别为 193、193、159，次数含跨区域重复行。rank 全部一致；两处差异均为重量。没有以三星肉量推算 meat1 / meat2。

## 活动时间

核对 159 行，全部一致。

将 Day / Night / Both 分别映射为白天 / 夜晚 / 全天。

## Wiki 中存在但 database 缺失的菜谱

| 鱼类 | 菜谱 | 处理建议 |
| --- | --- | --- |
| 蓝鳍金枪鱼 (Bluefin Tuna) | Grilled Bluefin Tuna Skewers | 新增待补全条目；本页仅证明存在及对应鱼类 |
| 泰坦扳机鱼 (Titan Triggerfish) | Whole Grilled Titan Triggerfish | 新增待补全条目；本页仅证明存在及对应鱼类 |
| Bigeye Trevally | Bigeye Trevally Sushi | 拆分 Bigeye Trevally 后恢复 |
| 巨口鲨 (Megamouth Shark) | Grilled Megamouth Shark Cheek | 新增待补全条目；本页仅证明存在及对应鱼类 |

以下 3 个 Sushi 名称与本地无 Sushi 后缀的单鱼菜谱对应，本报告按同一条目比较关系，但不等于其数据完整：

| Wiki 名称 | 本地条目 | 依据 |
| --- | --- | --- |
| Clownfish Sushi | recipe/clown-fish | 同种鱼的单食材条目；Clownfish / Comber 已有 Sushi 别名，Reef Triggerfish 需人工确认名称 |
| Comber Sushi | recipe/comber | 同种鱼的单食材条目；Clownfish / Comber 已有 Sushi 别名，Reef Triggerfish 需人工确认名称 |
| Reef Triggerfish Sushi | recipe/reef-triggerfish | 同种鱼的单食材条目；Clownfish / Comber 已有 Sushi 别名，Reef Triggerfish 需人工确认名称 |

Qingmenodus 暂按 `fish/qingmendous` 对照：rank=9、weight=6 kg、meat3=5 和 Qingmendous Sushi 一致，属于两份来源的拼写差异；未改稳定 ID。

## 分布区域

Wiki 的表标题通常是大区域；database 有遇难船、钟乳石窟、冰川洞穴等细分区域。细分区域与大区域的不同单列，不能直接判错。白对虾的 0–130 米视为等价于浅海 + 中层。Wiki 未覆盖的数据库区域不据此删除。

| 鱼类 | database | Wiki | 解释 |
| --- | --- | --- | --- |
| 蓝鳍金枪鱼 (Bluefin Tuna) | 蓝洞，0-50 米 | 蓝洞，50-130 米、蓝洞，0-50 米 | 缺少大区域：蓝洞，50-130 米 |
| 黄鳍金枪鱼 (Yellowfin Tuna) | 蓝洞，0-50 米 | 蓝洞，50-130 米、蓝洞，0-50 米 | 缺少大区域：蓝洞，50-130 米 |
| 大西洋鮟鱇 (Atlantic Anglerfish) | 钟乳石窟 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 黑虎虾 (Black Tiger Shrimp) | 遇难船 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 旗鱼 (Sailfish) | 遇难船 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 红石蟹 (Sally Lightfoot Crab) | 遇难船 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 无沟双髻鲨 (Smooth Hammerhead) | 遇难船 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 澳洲斑点水母 (White Spotted Jellyfish) | 蓝洞，50-130 米、钟乳石窟 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 斑马海马 (Zebra Seahorse) | 钟乳石窟 | 蓝洞，50-130 米 | 细分区域 / 来源覆盖不同，需确认范围 |
| 阿拉斯加鳕鱼 (Alaska Pollock) | 第一冰川洞穴 | 冰川区域 | 细分区域 / 来源覆盖不同，需确认范围 |
| 北极望远镜鱼 (Arctic Telescope Fish) | 第一冰川洞穴 | 冰川区域 | 细分区域 / 来源覆盖不同，需确认范围 |
| 圆鳍鱼 (Lumpfish) | 第三冰川洞穴 | 冰川区域 | 细分区域 / 来源覆盖不同，需确认范围 |
| 短鼻刺鳗 (Snub-nosed Spiny Eel) | 第三冰川洞穴 | 冰川区域 | 细分区域 / 来源覆盖不同，需确认范围 |
| 奇虾 (Anomalocaris) | control room | 热泉喷口 | 缺少大区域：热泉喷口 |

## 掉落物文本与建模差异

Wiki 的 Drop(s) 不保证列出普通食用肉；database 有些把普通肉也列入 drops，另一些仅保存特殊掉落。因此以下是字段集合差异，不全部属于错误。Wiki 未列出的掉落不自动删除；Wiki 列出的特殊素材缺失及 24px 前缀等显示污染值得修复。

| 鱼类 | Wiki 独有掉落文本 | database 独有掉落文本 | 性质 |
| --- | --- | --- | --- |
| 乌翅真鲨 (Blacktip Reefshark) | Blacktip Shark Meat | meat Blacktip Shark | 肉名顺序 / 拼写差异，实体存在 |
| 蓝鳍金枪鱼 (Bluefin Tuna) | Bluefin Tuna Ootoro | 24pxBluefin Tuna Ootoro | 24px 显示污染 |
| 长尾鲨 (Thresher Shark) | Thresher Shark Meat | meat Thresher Shark | 肉名顺序 / 拼写差异，实体存在 |
| 黄鳍金枪鱼 (Yellowfin Tuna) | Yellowfin Tuna Ootoro | 24pxYellowfin Tuna Ootoro | 24px 显示污染 |
| 豹纹鲨 (Zebra Shark) | Zebra Shark Meat | meat Zebra Shark | 肉名顺序 / 拼写差异，实体存在 |
| 洪堡鱿鱼 (Humboldt Squid) | Humboldt Squid Meat | meat Humboldt Squid | 肉名顺序 / 拼写差异，实体存在 |
| 长鼻锯鲨 (Long Nose Saw Shark) | Longnose Sawshark Meat | meat Long Nose Saw Shark | 肉名顺序 / 拼写差异，实体存在 |
| 旗鱼 (Sailfish) | Sailfish Meat | meat Sail Fish | 肉名顺序 / 拼写差异，实体存在 |
| 虎鲨 (Tiger Shark) | Tiger Shark Meat | meat Tiger Shark | 肉名顺序 / 拼写差异，实体存在 |
| 皱鳃鲨 (Frilled Shark) | Frilled Shark Meat | meat Frilled Shark | 肉名顺序 / 拼写差异，实体存在 |
| 巨口鲨 (Megamouth Shark) | Megamouth Shark Meat | meat Megamouth Shark | 肉名顺序 / 拼写差异，实体存在 |
| 长吻银鲛 (Rhinochimaeridae) | Rhinochimaeridae Meat | meat Rhinochimaeridae | 肉名顺序 / 拼写差异，实体存在 |
| 鹈鹕鳗 (Pelican Eel) | Pelican Eel Skin | — | 缺少掉落声明 |
| 格陵兰睡鲨 (Greenland Shark) | Greenland Shark Meat | meat Greenland Shark | 肉名顺序 / 拼写差异，实体存在 |
| 独角鲸 (Narwhal) | Narwhal Meat、Narwhal Tusk | — | 缺少掉落声明 |
| 鼠鲨 (Porbeagle Shark) | Porbeagle Shark Meat | meat Porbeagle Shark | 肉名顺序 / 拼写差异，实体存在 |
| 邓氏鱼 (Dunkleosteus) | Dunkleosteus Meat | meat Dunkleosteus | 肉名顺序 / 拼写差异，实体存在 |
| 异刺鲨 (Xenacanthus) | Xenacanthus Meat | meat Xenacanthus | 肉名顺序 / 拼写差异，实体存在 |

肉名顺序和空格统一后，特殊素材缺失为 Pelican Eel Skin（鹈鹕鳗皮）与 Narwhal Tusk（独角鲸牙）；独角鲸的普通肉也未写入 drops，但 relatedIngredients 已有关联食用肉。两种金枪鱼的大腹肉文本含 `24px` 前缀，属于图标尺寸残留。

## 食材来源与菜谱 relatedFish 的内部差异

根据 ingredients[].ingredientId → ingredient.fishIds 推导鱼类集合，与 recipe.relatedFish 比较。缺少食材 fishIds、海马 / 海龙通用食材、多物种同名来源、海藻误归鱼类等都可能造成差异。下表列出全部差异，不把推导结果自动当作权威。

| 菜谱 | 食材推导独有 fish | relatedFish 独有 fish |
| --- | --- | --- |
| 海龙饭团 (Seadragon Onigiri) | — | 叶海龙 (Leafy Seadragon)、红宝石海龙 (Ruby Seadragon)、杂草海龙 (Weedy Seadragon) |
| 隆头鱼咖喱 (Wrasse Curry) | — | 地中海彩虹隆头鱼 (Mediterranean Rainbow Wrasse) |
| 炖炸白对虾 (Boiled and Deep-Fried White Shrimp) | — | 白对虾 (White Shrimp) |
| 鲨鱼唐扬 (Shark Karaage) | — | 乌翅真鲨 (Blacktip Reefshark) |
| 鲹三明治 (Trevally Sandwich) | 大眼鲹 (Bigeye Scad) | — |
| 乌翅真鲨寿司 (Blacktip Reefshark Sushi) | — | 乌翅真鲨 (Blacktip Reefshark) |
| 炸海马 (Fried Seahorses) | — | 大肚海马 (Big-Belly Seahorse)、冠海马 (Crowned Seahorse)、矮海马 (Dwarf Seahorse)、长颈鹿海马 (Giraffe Seahorse)、刺猬海马 (Hedgehog Seahorse)、贾亚卡尔海马 (Jayakar's Seahorse)、线纹海马 (Lined Seahorse)、太平洋海马 (Pacific Seahorse)、海马 (Seahorse)、刺海马 (Spiny Seahorse)、斑点海马 (Spotted Seahorse)、虎尾海马 (Tiger-Tail Seahorse)、白色海马 (White Seahorse)、斑马海马 (Zebra Seahorse) |
| 哥斯拉咖喱 (Godzilla vs. Ebirah Curry) | 海鳝 (Moray Eel) | — |
| 红纹龙虾寿司 (Red-banded Lobster Sushi) | — | 红带龙虾 (Red Bbanded Lobster) |
| 海马沙拉 (Seahorse Salad) | — | 大肚海马 (Big-Belly Seahorse)、冠海马 (Crowned Seahorse)、矮海马 (Dwarf Seahorse)、长颈鹿海马 (Giraffe Seahorse)、刺猬海马 (Hedgehog Seahorse)、贾亚卡尔海马 (Jayakar's Seahorse)、线纹海马 (Lined Seahorse)、太平洋海马 (Pacific Seahorse)、刺海马 (Spiny Seahorse)、斑点海马 (Spotted Seahorse)、虎尾海马 (Tiger-Tail Seahorse)、白色海马 (White Seahorse)、斑马海马 (Zebra Seahorse) |
| 海马乌冬面 (Seahorse Udon) | — | 大肚海马 (Big-Belly Seahorse)、冠海马 (Crowned Seahorse)、矮海马 (Dwarf Seahorse)、长颈鹿海马 (Giraffe Seahorse)、刺猬海马 (Hedgehog Seahorse)、贾亚卡尔海马 (Jayakar's Seahorse)、线纹海马 (Lined Seahorse)、太平洋海马 (Pacific Seahorse)、刺海马 (Spiny Seahorse)、斑点海马 (Spotted Seahorse)、虎尾海马 (Tiger-Tail Seahorse)、白色海马 (White Seahorse)、斑马海马 (Zebra Seahorse) |
| 灰鲭鲨寿司 (Shortfin Mako Sushi) | — | 灰鲭鲨 (Shortfin Mako) |
| 无沟双髻鲨寿司 (Smooth Hammerhead Sushi) | — | 无沟双髻鲨 (Smooth Hammerhead) |
| 白鲹茶泡饭 (White Trevally Kombu Ochazuke) | — | 缠绕藻 (Tangle) |
| 蓝斑鰧寿司 (Bluespotted Stargazer Sushi) | — | 瞻星鱼 (Stargazer) |
| 彩虹帽茶泡饭 (Rainbow Cap Pacific Fanfish Ochazuke) | — | 缠绕藻 (Tangle) |
| 海马烤串 (Seahorse Skewers) | — | 大肚海马 (Big-Belly Seahorse)、冠海马 (Crowned Seahorse)、矮海马 (Dwarf Seahorse)、长颈鹿海马 (Giraffe Seahorse)、刺猬海马 (Hedgehog Seahorse)、贾亚卡尔海马 (Jayakar's Seahorse)、线纹海马 (Lined Seahorse)、太平洋海马 (Pacific Seahorse)、刺海马 (Spiny Seahorse)、斑点海马 (Spotted Seahorse)、虎尾海马 (Tiger-Tail Seahorse)、白色海马 (White Seahorse)、斑马海马 (Zebra Seahorse) |
| 三头鳕鱼寿司 (Three-Headed Cod Sushi) | — | 三头鳕鱼 (Dredge Three Headed Cod) |
| 珊瑚鳞鲀 (Reef Triggerfish) | — | 泻湖鳞鲀 (Lagoon Triggerfish) |
| 小盾鳢汤 (Giant Snakehead Fin Soup) | — | 小盾鳢 (Giant Snakehead) |

## 核对边界与复现

database 另外 150 条 fish 未匹配到本页，清单保存在同名 JSON 的 uncoveredFish 中；包括其他 DLC / 来源中的独立记录，不能因本页未出现而删除。

本页可核对等级、活动时间、重量、三星肉量、表级区域、掉落及鱼→菜谱存在关系；无法核对售价、体长、血量、伤害、一星 / 二星肉量、图鉴编号、完整菜谱食材 / 数量 / 价格 / 口味。养殖列 Breed rate、Cap/day、Density、Max tank、Reliable hold、Fish/day、Avg meat/day 已提取到 JSON 的 wikiRows，本地没有对应字段，未当作错误或自动写入。

养殖区域与具体出现地点也可能不同；大区域核对不替代游戏内分布确认。所有差异均是用户提供的 Wiki 快照与本地数据的比较结果，未联网获取其他页面、未实机确认。

运行 `python scripts/audit-wiki-fish.py` 可从原始附件重新生成本报告及 JSON。仅使用标准库，不安装依赖、不抓取网站、不写数据库。输出可用 `--output reports/wiki-fish-audit` 指定。JSON 包含原始行、源文件行号、指向 Wiki 单页的证据链接、逐项差异和完整未覆盖列表。
