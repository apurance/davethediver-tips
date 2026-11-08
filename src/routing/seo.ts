import { catalog, entityLists, entityPath, entityTypes, getEntity, name } from "../catalog.ts";
import type { EntityType } from "../catalog.ts";
import { sections } from "../data.ts";
import type { SectionId } from "../data.ts";
import { sectionPath } from "./paths.ts";

export const siteOrigin = "https://davethediver-tips.pages.dev";
const siteName = "潜水员戴夫中文攻略";

interface PageMetadata {
  title: string;
  description: string;
  canonicalPath?: string;
}

const home: PageMetadata = {
  title: `${siteName}与资料库 | BLUE HOLE`,
  description: "《潜水员戴夫》（DAVE THE DIVER）非官方中文攻略与资料库。查询食谱、食材、鱼类和员工图鉴，探索深海地图，使用备菜与餐厅经营计算器。",
  canonicalPath: "/",
};

const sectionSummaries: Record<Exclude<SectionId, "overview">, [string, string]> = {
  progression: ["新手推进与升级", "按游戏阶段查看主线推进、潜水装备升级和餐厅功能解锁建议。"],
  diving: ["捕鱼攻略与潜水装备", "了解捕鱼武器和潜水装备的选择，以及三星捕获和 Boss 战的准备方法。"],
  maps: ["蓝洞深海、冰河与热泉地图", "查看《潜水员戴夫》交互式地图，切换地形与布局，按鱼类、物资和设施筛选标记。"],
  recipes: ["食谱图鉴与菜谱攻略", "查询食谱用料、售价、口感和每批份数，比较基础与满级数据。"],
  allocation: ["经营分配与备货计算器", "安排寿司店和分店的日常与派对菜单，按鱼池汇总备货需求。"],
  ingredients: ["食材与鱼类图鉴", "查询食材来源、鱼类栖息区域和关联菜谱，按区域浏览图鉴。"],
  farm: ["养殖、鱼池与农场", "查看鱼池繁殖、农场供给和食材备货攻略，按产量规划餐厅菜单。"],
  staff: ["员工图鉴与分店经营", "查询员工技能、等级属性和工资，了解寿司店排班、采购与分店管理。"],
  collection: ["图鉴收集与小游戏", "按区域和时段规划 Marinca 图鉴收集，查看小游戏和其他收集建议。"],
  dlc: ["DLC、联动与版本攻略", "查看本体、联动内容及丛林扩展的玩法差异与攻略。"],
  sources: ["资料来源与整理方法", "查看攻略引用、游戏数据库来源和资料整理方法。"],
};

const entitySummaries: Record<EntityType, string> = {
  recipe: "的食谱用料、售价、口感和每批份数。",
  ingredient: "的食材来源及可制作的食谱。",
  fish: "的鱼类等级、出没区域、活动时段和关联食谱。",
  staff: "的员工技能、等级属性、雇佣费和工资。",
};

const nonIndexablePages = new Map([
  ["/search", metadata("站内搜索", "搜索攻略、食谱、食材、鱼类和员工。")],
  ["/bookmarks", metadata("我的收藏", "查看保存在当前浏览器的攻略。")],
]);
export const nonIndexablePaths = [...nonIndexablePages.keys()];
export const indexablePaths = [
  ...sections.map(({ id }) => sectionPath(id)),
  entityLists.fish,
  ...catalog.map(entityPath),
];

const notFoundMetadata: PageMetadata = {
  title: `页面未找到 | ${siteName}`,
  description: "这个地址没有对应的攻略或图鉴条目。",
};

function metadata(title: string, description: string, canonicalPath?: string): PageMetadata {
  return { title: `${title} | ${siteName}`, description, canonicalPath };
}

export function getPageMetadata(pathname: string): PageMetadata {
  let path: string;
  try {
    path = decodeURI(pathname).replace(/\/+$/, "") || "/";
  } catch {
    return notFoundMetadata;
  }
  const lowerPath = path.toLowerCase();
  if (lowerPath === "/" || lowerPath === "/overview") return home;
  const nonIndexablePage = nonIndexablePages.get(lowerPath);
  if (nonIndexablePage) return nonIndexablePage;
  if (lowerPath === entityLists.fish) {
    return metadata("鱼类图鉴", "按栖息区域查询鱼类等级、活动时段、掉落物和相关食谱。", entityLists.fish);
  }

  const section = sections.find(({ id }) => sectionPath(id) === lowerPath);
  if (section && section.id !== "overview") {
    return metadata(...sectionSummaries[section.id], lowerPath);
  }

  const [, list, slug, extra] = path.split("/");
  if (!slug || extra !== undefined) return notFoundMetadata;
  const type = (Object.keys(entityLists) as EntityType[]).find((key) => entityLists[key] === `/${list.toLowerCase()}`);
  const entity = type && getEntity(`${type}/${slug}`);
  if (entity) {
    const title = name(entity.id);
    const label = title === entity.en ? title : `${title}（${entity.en}）`;
    const hasNamesake = catalog.some((other) => other !== entity && other.type === entity.type && name(other.id) === title);
    return metadata(
      `${hasNamesake ? label : title} · ${entityTypes[entity.type]}`,
      `查看《潜水员戴夫》中${label}${entitySummaries[entity.type]}`,
      entityPath(entity),
    );
  }
  return notFoundMetadata;
}

export function escapeMarkup(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function renderPageMetadata({ title, description, canonicalPath }: PageMetadata) {
  const safeTitle = escapeMarkup(title);
  const safeDescription = escapeMarkup(description);
  const tags = [
    `<title data-page-seo>${safeTitle}</title>`,
    `<meta data-page-seo name="description" content="${safeDescription}" />`,
  ];
  if (canonicalPath) {
    const url = escapeMarkup(siteOrigin + canonicalPath);
    tags.push(
      `<link data-page-seo rel="canonical" href="${url}" />`,
      `<meta data-page-seo property="og:type" content="website" />`,
      `<meta data-page-seo property="og:site_name" content="${siteName}" />`,
      `<meta data-page-seo property="og:locale" content="zh_CN" />`,
      `<meta data-page-seo property="og:title" content="${safeTitle}" />`,
      `<meta data-page-seo property="og:description" content="${safeDescription}" />`,
      `<meta data-page-seo property="og:url" content="${url}" />`,
    );
  } else {
    tags.push('<meta data-page-seo name="robots" content="noindex" />');
  }
  return tags.join("\n    ");
}
