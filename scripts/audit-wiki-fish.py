"""Audit a saved Fandom Fish page against the local snapshot; never edit the database.

Uses only the Python standard library. Accepts ordinary HTML or Chrome's saved
view-source HTML. The downloaded document is parsed as data, never executed.
"""

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import json
import re


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "rawdata/view-source_https___dave-the-diver.fandom.com_wiki_Fish.html"
WIKI = "https://dave-the-diver.fandom.com"


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.links = []

    def handle_data(self, data):
        self.parts.append(data)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("br", "p", "li"):
            self.parts.append(" ")
        if tag == "a" and attrs.get("href", "").startswith("/wiki/"):
            self.links.append({"title": attrs.get("title", ""), "url": WIKI + attrs["href"]})

    def text(self):
        return re.sub(r"\s+", " ", "".join(self.parts)).strip()


def cell(fragment):
    parser = TextParser()
    parser.feed(fragment)
    return parser


def normalize(value):
    return re.sub(r"[^a-z0-9]", "", value.lower().replace("&", "and"))


def normalize_drop(value):
    value = re.sub(r"^24px", "", value, flags=re.I)
    if value.lower().startswith("meat "):
        value = value[5:] + " Meat"
    return normalize(value)


def decode_source(raw):
    lines = re.findall(r'<td class="line-content">(.*?)</td>', raw, re.S)
    # Decode exactly one layer: entity-escaped source inside syntax-highlighting spans.
    if lines:
        return "\n".join(cell(line).text() for line in lines), True
    return raw, False


def extract_rows(source):
    section = None
    rows = []
    tables = []
    for match in re.finditer(r"<h2\b.*?</h2>|<table\b.*?</table>", source, re.S):
        fragment = match.group()
        if fragment.startswith("<h2"):
            heading = re.search(r'<span class="mw-headline"[^>]*>(.*?)</span>', fragment, re.S)
            section = cell(heading.group(1)).text() if heading else None
            continue
        if 'class="fandom-table sortable"' not in fragment:
            continue
        table_rows = list(re.finditer(r"<tr\b.*?</tr>", fragment, re.S))
        headers = [cell(x).text() for x in re.findall(r"<th\b[^>]*>(.*?)</th>", table_rows[0].group(), re.S)]
        required = {"Title", "Rank", "Weight", "Meat ★★★", "Drop(s)", "Recipe(s)"}
        if not required.issubset(headers) or section is None:
            raise ValueError(f"Unexpected table headers/section: {section}, {headers}")
        count = 0
        for row_match in table_rows[1:]:
            fragments = re.findall(r"<td\b[^>]*>(.*?)</td>", row_match.group(), re.S)
            if len(fragments) != len(headers):
                raise ValueError(f"Unexpected row width in {section}: {len(fragments)} != {len(headers)}")
            cells = dict(zip(headers, (cell(x) for x in fragments)))
            title_links = cells["Title"].links
            if len(title_links) != 1:
                raise ValueError(f"Expected one fish link: {cells['Title'].text()}")
            offset = match.start() + row_match.start()
            rows.append({
                "title": cells["Title"].text(),
                "url": title_links[0]["url"],
                "section": section,
                "sourceLine": source.count("\n", 0, offset) + 1,
                "cells": {key: value.text() for key, value in cells.items() if key != "Icon"},
                "recipes": cells["Recipe(s)"].links,
                "drops": cells["Drop(s)"].links,
            })
            count += 1
        tables.append({"section": section, "rows": count, "headers": headers})
    if len(tables) != 7 or not rows:
        raise ValueError(f"Expected the seven Fish tables, got {len(tables)}")
    return rows, tables


REGIONS = {
    "Blue Hole Shallows (0-50m)": "region/8c354854b261",
    "Blue Hole Medium Depth (50-130m)": "region/82a8f0e0b78d",
    "Blue Hole Depths (130-250m)": "region/721eb9e71c69",
    "Glacial Passage": "region/22dcf4d19351",
    "Glacier Zone": "region/glacial-area",
    "Hydrothermal Vents": "region/hydrothermal-vents",
    "Fog Coast": "region/a7a86e92fda1",
    "Black Cliff": "region/d3b15f5fc5e0",
    "Jellyfish Basin": "region/565a3a911b9e",
}
REGION_CHILDREN = {
    "region/8c354854b261": {"region/limestone-cave"},
    "region/82a8f0e0b78d": {"region/limestone-cave", "region/42a2a7652438"},
    "region/glacial-area": {"region/glacial-area-dungeon-1", "region/glacial-area-dungeon-3"},
}
TIME_NAMES = {"Day": "白天", "Night": "夜晚", "Day/Night": "全天", "Both": "全天"}


def audit(db, names, rows):
    by_id = {e["id"]: e for key in ("fish", "recipes", "ingredients", "staff") for e in db[key]}
    indexes = {}
    for key in ("fish", "recipes"):
        index = defaultdict(list)
        for entity in db[key]:
            index[normalize(entity["en"])].append(entity)
        if any(len(entities) != 1 for entities in index.values()):
            raise ValueError(f"Ambiguous normalized names in {key}")
        indexes[key] = {key: value[0] for key, value in index.items()}
    # Reviewed cross-source spellings, with explicit evidence in the report.
    mappings = {
        "fish": {"Qingmenodus": "fish/qingmendous"},
        "recipes": {
            "Clownfish Sushi": "recipe/clown-fish",
            "Comber Sushi": "recipe/comber",
            "Reef Triggerfish Sushi": "recipe/reef-triggerfish",
        },
    }
    for key, mapping in mappings.items():
        for title, entity_id in mapping.items():
            indexes[key][normalize(title)] = by_id[entity_id]

    result = {key: [] for key in (
        "missingFish", "identityConflicts", "numericDifferences", "timeDifferences", "regionDifferences",
        "missingRecipes", "wikiAssociationDifferences", "databaseOnlyAssociations", "dropDifferences",
        "danglingReferences", "asymmetricAssociations", "ingredientFishDifferences", "uncoveredFish",
    )}
    matched = set()
    checks = Counter()
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["title"]].append(row)
    for title, occurrences in grouped.items():
        fish = indexes["fish"].get(normalize(title))
        evidence = {"wikiTitle": title, "wikiUrl": occurrences[0]["url"], "sourceLines": [r["sourceLine"] for r in occurrences]}
        if fish is None:
            boss = all(r["cells"]["Rank"] == "99" for r in occurrences)
            result["missingFish"].append({**evidence, "boss": boss, "wikiRows": occurrences})
            slug = title.lower().replace(" ", "-")
            alias_id = "fish/" + slug
            target_id = db["aliases"].get(alias_id)
            if target_id:
                result["identityConflicts"].append({**evidence, "aliasId": alias_id, "targetId": target_id,
                    "targetName": by_id[target_id]["en"], "targetStats": by_id[target_id]["stats"]})
        else:
            matched.add(fish["id"])
            evidence["fishId"] = fish["id"]
            for row in occurrences:
                for column, stat in (("Rank", "rank"), ("Weight", "weight"), ("Meat ★★★", "meat3")):
                    value = row["cells"][column].removesuffix("kg")
                    if not re.fullmatch(r"\d+(\.\d+)?", value):
                        continue
                    checks[stat] += 1
                    value = float(value)
                    current = fish["stats"].get(stat)
                    if current != value:
                        issue = {**evidence, "field": stat, "database": current, "wiki": value}
                        if issue not in result["numericDifferences"]:
                            result["numericDifferences"].append(issue)
                if "Active Time" in row["cells"]:
                    raw_time = row["cells"]["Active Time"]
                    expected = TIME_NAMES.get(raw_time)
                    if expected is None:
                        raise ValueError(f"Unknown active time: {raw_time}")
                    checks["time"] += 1
                    current = names.get(fish["facets"].get("time"))
                    if current != expected:
                        issue = {**evidence, "database": current, "wiki": raw_time}
                        if issue not in result["timeDifferences"]:
                            result["timeDifferences"].append(issue)
            expected_regions = set()
            for row in occurrences:
                location = row["cells"].get("Location", row["section"])
                if location not in REGIONS:
                    raise ValueError(f"Unknown location: {location}")
                expected_regions.add(REGIONS[location])
            current_regions = set(fish.get("region", []))
            expanded = set(current_regions)
            if "region/blue-hole-0-130-meters" in expanded:
                expanded.update(("region/8c354854b261", "region/82a8f0e0b78d"))
            if expanded != expected_regions:
                missing = expected_regions - expanded
                detailed = {region for region in missing if REGION_CHILDREN.get(region, set()) & current_regions}
                # The broad combined region is semantically identical to the two Wiki rows.
                semantically_equal = expanded - {"region/blue-hole-0-130-meters"} == expected_regions
                if not semantically_equal:
                    result["regionDifferences"].append({**evidence, "database": sorted(current_regions),
                        "wiki": sorted(expected_regions), "narrowerDatabaseRegions": sorted(detailed),
                        "missingBroadRegions": sorted(missing - detailed),
                        "databaseOnlyRegions": sorted(current_regions - expected_regions)})

            wiki_drops = {normalize(d["title"]): d["title"] for row in occurrences for d in row["drops"]}
            db_drops = {}
            for drop in fish.get("drops", []):
                target = by_id.get(drop.get("entityId"))
                value = target["en"] if target else drop.get("text", "")
                if value:
                    db_drops[normalize(value)] = value
            if wiki_drops.keys() != db_drops.keys():
                wiki_semantic = {normalize_drop(v): v for v in wiki_drops.values()}
                db_semantic = {normalize_drop(v): v for v in db_drops.values()}
                result["dropDifferences"].append({**evidence,
                    "wikiOnly": sorted(wiki_drops[k] for k in wiki_drops.keys() - db_drops.keys()),
                    "databaseOnly": sorted(db_drops[k] for k in db_drops.keys() - wiki_drops.keys()),
                    "missingAfterNameNormalization": sorted(wiki_semantic[k] for k in wiki_semantic.keys() - db_semantic.keys()),
                    "databaseOnlyAfterNameNormalization": sorted(db_semantic[k] for k in db_semantic.keys() - wiki_semantic.keys()),
                    "displayArtifacts": [v for v in db_drops.values() if v.lower().startswith("24px")]})

        expected_recipes = set()
        unique_recipes = {link["title"]: link for row in occurrences for link in row["recipes"]}
        for recipe_title, link in unique_recipes.items():
            checks["wikiEdges"] += 1
            recipe = indexes["recipes"].get(normalize(recipe_title))
            if recipe is None:
                result["missingRecipes"].append({**evidence, "recipeTitle": recipe_title, "recipeUrl": link["url"]})
                continue
            expected_recipes.add(recipe["id"])
            if fish:
                checks["mappedEdges"] += 1
                if recipe["id"] not in fish["relatedRecipes"] or fish["id"] not in recipe["relatedFish"]:
                    result["wikiAssociationDifferences"].append({**evidence, "recipeId": recipe["id"],
                        "missingFishToRecipe": recipe["id"] not in fish["relatedRecipes"],
                        "missingRecipeToFish": fish["id"] not in recipe["relatedFish"]})
        if fish:
            for recipe_id in set(fish["relatedRecipes"]) - expected_recipes:
                result["databaseOnlyAssociations"].append({**evidence, "recipeId": recipe_id})

    def reference(owner, field, target_id, target_type):
        target = by_id.get(target_id)
        if target is None or target["type"] != target_type:
            result["danglingReferences"].append({"entityId": owner["id"], "field": field, "targetId": target_id})
        return target

    for entity in by_id.values():
        for fact in entity.get("facts", []):
            for value in fact["values"]:
                if "entityId" in value and value["entityId"] not in by_id:
                    result["danglingReferences"].append({"entityId": entity["id"], "field": fact["labelId"], "targetId": value["entityId"]})
        for field in ("drops", "acquisition-method"):
            values = entity.get(field, [])
            if isinstance(values, dict):
                values = [values]
            for value in values:
                if value.get("entityId") and value["entityId"] not in by_id:
                    result["danglingReferences"].append({"entityId": entity["id"], "field": field, "targetId": value["entityId"]})
        for field, target_type, back_field in (
            ("relatedRecipes", "recipe", "relatedFish" if entity["type"] == "fish" else None),
            ("relatedFish", "fish", "relatedRecipes" if entity["type"] == "recipe" else None),
            ("relatedIngredients", "ingredient", None), ("fishIds", "fish", None),
        ):
            for target_id in entity.get(field, []):
                target = reference(entity, field, target_id, target_type)
                if target and back_field and entity["id"] not in target[back_field]:
                    result["asymmetricAssociations"].append({"entityId": entity["id"], "field": field, "targetId": target_id})
        if entity["type"] == "recipe":
            derived = set()
            for ingredient in entity["ingredients"]:
                target = reference(entity, "ingredients", ingredient["ingredientId"], "ingredient")
                if target:
                    derived.update(target.get("fishIds", []))
            declared = set(entity["relatedFish"])
            if derived != declared:
                result["ingredientFishDifferences"].append({"recipeId": entity["id"],
                    "ingredientDerivedOnly": sorted(derived - declared), "declaredOnly": sorted(declared - derived),
                    "ingredients": [{"ingredientId": i["ingredientId"], "fishIds": by_id.get(i["ingredientId"], {}).get("fishIds", [])} for i in entity["ingredients"]]})
    for alias, target in db["aliases"].items():
        if target not in by_id:
            result["danglingReferences"].append({"entityId": alias, "field": "alias", "targetId": target})
    result["uncoveredFish"] = [{"fishId": f["id"], "en": f["en"]} for f in db["fish"] if f["id"] not in matched]
    result["summary"] = {
        "wikiRows": len(rows), "wikiUniqueFish": len(grouped), "databaseFish": len(db["fish"]),
        "databaseRecipes": len(db["recipes"]), "matchedFish": len(matched),
        "missingOrdinaryFish": sum(not f["boss"] for f in result["missingFish"]),
        "missingBossFish": sum(f["boss"] for f in result["missingFish"]),
        "uniqueMissingRecipes": len({r["recipeTitle"] for r in result["missingRecipes"]}),
        "checks": dict(checks), "issueCounts": {key: len(value) for key, value in result.items() if isinstance(value, list)},
    }
    result["reviewedNameMappings"] = mappings
    return result


def render_report(result, names, db):
    by_id = {e["id"]: e for key in ("fish", "recipes", "ingredients", "staff") for e in db[key]}
    def label(entity_id):
        entity = by_id.get(entity_id)
        return f"{names.get(entity['nameId'], entity['en'])} ({entity['en']})" if entity else names.get(entity_id, entity_id)
    def labels(ids):
        return "、".join(label(i) for i in ids) or "—"
    def fish_label(issue):
        return label(issue["fishId"]) if "fishId" in issue else issue["wikiTitle"]
    def table(headers, rows):
        lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
        lines.extend("| " + " | ".join(str(v).replace("|", "\\|").replace("\n", " ") for v in row) + " |" for row in rows)
        return lines + [""]
    s = result["summary"]
    p = result["provenance"]
    lines = ["# Wiki 鱼类与菜谱关联核对", "", f"核对日期：{p['auditedAt']}。仅核对并生成报告，未修改 database 或名称表。", "",
        f"依据：用户提供的 `{p['sourceFile']}`，Wiki revision `{p['wikiRevision']}`。原文件 SHA-256：`{p['sourceSha256']}`。网页作为数据读取，其中的脚本、编辑提示和其他指令均未执行。", "",
        "## 结论", "",
        f"Wiki 共 {s['wikiRows']} 行、{s['wikiUniqueFish']} 种鱼；同一物种跨区域重复 3 行。database 共 {s['databaseFish']} 条鱼、{s['databaseRecipes']} 道菜谱，匹配到 {s['matchedFish']} 种 Wiki 鱼。", "",
        "最需要修正的是 Bigeye Trevally 与 Bigeye Scad 的错误合并：Wiki 将两者分别列出，数值和菜谱不同；本地把前者别名指向后者，影响鱼类记录、食材来源及 Trevally Sandwich 关联。", "",
        f"另有 {len(result['numericDifferences'])} 处基础数值差异、{s['uniqueMissingRecipes']} 道缺失菜谱（3 道对应已匹配的鱼，1 道为 Bigeye Trevally Sushi）。活动时间、区域、掉落物的差异见下文。", "",
        f"在已映射的 {s['checks'].get('mappedEdges', 0)} 条 Wiki 鱼→菜谱关系中，双向链接缺失 {len(result['wikiAssociationDifferences'])} 条，数据库额外关系 {len(result['databaseOnlyAssociations'])} 条。全库鱼→菜谱 / 菜谱→鱼双向不一致 {len(result['asymmetricAssociations'])} 条，悬空实体引用 {len(result['danglingReferences'])} 条。双向一致只能证明结构一致，无法排除错误物种合并。", "",
        "## 物种误合并与缺失", ""]
    for issue in result["identityConflicts"]:
        lines.extend([f"- `{issue['aliasId']}` 被合并到 `{issue['targetId']}`（{issue['targetName']}）。Wiki 的 {issue['wikiTitle']} 证据见源文件还原后的第 {', '.join(map(str, issue['sourceLines']))} 行。"])
    lines.extend(["", "Bigeye Trevally 的 Wiki 数值为 rank=2、weight=3 kg、meat3=5；Bigeye Scad 为 rank=1、weight=0.6 kg、meat3=3。`ingredient/bigeye-trevally` 的 fishIds / relatedFish 却指向 `fish/bigeye-scad`。`recipe/trevally-sandwich` 使用该食材，但 relatedFish 仅有 Giant Trevally。`recipe/bigeye-trevally-sushi` 已列入 metadata.recipeCleanup.removedRecipeIds，当前记录缺失。应拆分物种并修复相关链路；该网页没有完整菜谱数值，不能据此填造售价、口味或全部食材数量。", ""])
    lines += table(["Wiki 缺失物种", "类型", "Wiki 关联菜谱"], ((f["wikiTitle"], "Boss（rank=99）" if f["boss"] else "普通鱼 / 错误合并", "、".join(dict.fromkeys(x["title"] for r in f["wikiRows"] for x in r["recipes"])) or "—") for f in result["missingFish"]))
    lines.extend(["Boss 的菜谱和食材多数已存在，但缺少独立 fish 实体，不能从鱼类图鉴完整跳转；这是覆盖范围差异，不代表 Boss 菜谱本身缺失。rank=99、weight=1 kg 等为该 Wiki 表的记录值，不应当作普通鱼的捕获参数自动补入。", "", "## 基础数值", ""])
    lines += table(["鱼类", "字段", "database", "Wiki"], ((fish_label(i), i["field"], i["database"], i["wiki"]) for i in result["numericDifferences"]))
    lines.extend([f"按 Wiki 列定义核对 rank、weight、meat3（仅三星肉量），比较次数分别为 {s['checks']['rank']}、{s['checks']['weight']}、{s['checks']['meat3']}，次数含跨区域重复行。rank 全部一致；两处差异均为重量。没有以三星肉量推算 meat1 / meat2。", "", "## 活动时间", ""])
    if result["timeDifferences"]:
        lines += table(["鱼类", "database", "Wiki"], ((fish_label(i), i["database"], i["wiki"]) for i in result["timeDifferences"]))
    else:
        lines.extend([f"核对 {s['checks']['time']} 行，全部一致。", ""])
    lines.extend(["将 Day / Night / Both 分别映射为白天 / 夜晚 / 全天。", "", "## Wiki 中存在但 database 缺失的菜谱", ""])
    lines += table(["鱼类", "菜谱", "处理建议"], ((fish_label(i), i["recipeTitle"], "拆分 Bigeye Trevally 后恢复" if i["recipeTitle"] == "Bigeye Trevally Sushi" else "新增待补全条目；本页仅证明存在及对应鱼类") for i in result["missingRecipes"]))
    lines.extend(["以下 3 个 Sushi 名称与本地无 Sushi 后缀的单鱼菜谱对应，本报告按同一条目比较关系，但不等于其数据完整：", ""])
    lines += table(["Wiki 名称", "本地条目", "依据"], ((title, entity_id, "同种鱼的单食材条目；Clownfish / Comber 已有 Sushi 别名，Reef Triggerfish 需人工确认名称") for title, entity_id in result["reviewedNameMappings"]["recipes"].items()))
    lines.extend(["Qingmenodus 暂按 `fish/qingmendous` 对照：rank=9、weight=6 kg、meat3=5 和 Qingmendous Sushi 一致，属于两份来源的拼写差异；未改稳定 ID。", "", "## 分布区域", "",
        "Wiki 的表标题通常是大区域；database 有遇难船、钟乳石窟、冰川洞穴等细分区域。细分区域与大区域的不同单列，不能直接判错。白对虾的 0–130 米视为等价于浅海 + 中层。Wiki 未覆盖的数据库区域不据此删除。", ""])
    lines += table(["鱼类", "database", "Wiki", "解释"], ((fish_label(i), labels(i["database"]), labels(i["wiki"]), "缺少大区域：" + labels(i["missingBroadRegions"]) if i["missingBroadRegions"] else "细分区域 / 来源覆盖不同，需确认范围") for i in result["regionDifferences"]))
    lines.extend(["## 掉落物文本与建模差异", "",
        "Wiki 的 Drop(s) 不保证列出普通食用肉；database 有些把普通肉也列入 drops，另一些仅保存特殊掉落。因此以下是字段集合差异，不全部属于错误。Wiki 未列出的掉落不自动删除；Wiki 列出的特殊素材缺失及 24px 前缀等显示污染值得修复。", ""])
    lines += table(["鱼类", "Wiki 独有掉落文本", "database 独有掉落文本", "性质"], ((fish_label(i), "、".join(i["wikiOnly"]) or "—", "、".join(i["databaseOnly"]) or "—", "缺少掉落声明" if i["missingAfterNameNormalization"] else "24px 显示污染" if i["displayArtifacts"] else "肉名顺序 / 拼写差异，实体存在") for i in result["dropDifferences"]))
    lines.extend(["肉名顺序和空格统一后，特殊素材缺失为 Pelican Eel Skin（鹈鹕鳗皮）与 Narwhal Tusk（独角鲸牙）；独角鲸的普通肉也未写入 drops，但 relatedIngredients 已有关联食用肉。两种金枪鱼的大腹肉文本含 `24px` 前缀，属于图标尺寸残留。", ""])
    lines.extend(["## 食材来源与菜谱 relatedFish 的内部差异", "",
        "根据 ingredients[].ingredientId → ingredient.fishIds 推导鱼类集合，与 recipe.relatedFish 比较。缺少食材 fishIds、海马 / 海龙通用食材、多物种同名来源、海藻误归鱼类等都可能造成差异。下表列出全部差异，不把推导结果自动当作权威。", ""])
    lines += table(["菜谱", "食材推导独有 fish", "relatedFish 独有 fish"], ((label(i["recipeId"]), labels(i["ingredientDerivedOnly"]), labels(i["declaredOnly"])) for i in result["ingredientFishDifferences"]))
    for key, title in (("wikiAssociationDifferences", "Wiki 映射后的关联差异"), ("databaseOnlyAssociations", "数据库额外菜谱关联"), ("danglingReferences", "悬空引用"), ("asymmetricAssociations", "双向关联不一致")):
        if result[key]:
            lines.extend([f"### {title}", "", "```json", json.dumps(result[key], ensure_ascii=False, indent=2), "```", ""])
    lines.extend(["## 核对边界与复现", "",
        f"database 另外 {len(result['uncoveredFish'])} 条 fish 未匹配到本页，清单保存在同名 JSON 的 uncoveredFish 中；包括其他 DLC / 来源中的独立记录，不能因本页未出现而删除。", "",
        "本页可核对等级、活动时间、重量、三星肉量、表级区域、掉落及鱼→菜谱存在关系；无法核对售价、体长、血量、伤害、一星 / 二星肉量、图鉴编号、完整菜谱食材 / 数量 / 价格 / 口味。养殖列 Breed rate、Cap/day、Density、Max tank、Reliable hold、Fish/day、Avg meat/day 已提取到 JSON 的 wikiRows，本地没有对应字段，未当作错误或自动写入。", "",
        "养殖区域与具体出现地点也可能不同；大区域核对不替代游戏内分布确认。所有差异均是用户提供的 Wiki 快照与本地数据的比较结果，未联网获取其他页面、未实机确认。", "",
        "运行 `python scripts/audit-wiki-fish.py` 可从原始附件重新生成本报告及 JSON。仅使用标准库，不安装依赖、不抓取网站、不写数据库。输出可用 `--output reports/wiki-fish-audit` 指定。JSON 包含原始行、源文件行号、指向 Wiki 单页的证据链接、逐项差异和完整未覆盖列表。", ""])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=ROOT / "reports/wiki-fish-audit")
    args = parser.parse_args()
    source_bytes = args.source.read_bytes()
    source, wrapped = decode_source(source_bytes.decode("utf-8"))
    rows, tables = extract_rows(source)
    database_bytes = (ROOT / "src/data/database.json").read_bytes()
    names_bytes = (ROOT / "src/data/names.zh-CN.json").read_bytes()
    db = json.loads(database_bytes)
    names = json.loads(names_bytes)
    result = audit(db, names, rows)
    revision = re.search(r'"wgRevisionId":(\d+)', source)
    result["provenance"] = {
        "auditedAt": datetime.now(timezone(timedelta(hours=8))).date().isoformat(),
        "sourceFile": args.source.name, "sourceSha256": sha256(source_bytes).hexdigest(),
        "databaseSha256": sha256(database_bytes).hexdigest(), "namesSha256": sha256(names_bytes).hexdigest(),
        "wikiRevision": int(revision.group(1)) if revision else None,
        "viewSourceWrapper": wrapped,
        "sourceLineMeaning": "Original view-source line-number value" if wrapped else "HTML file line number",
    }
    result["tables"] = tables
    result["wikiRows"] = rows
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.with_suffix(".json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output.with_suffix(".md").write_text(render_report(result, names, db), encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
