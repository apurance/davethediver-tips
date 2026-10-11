import { Select, Space, Table, Tag } from "antd";
import { CompositionInput } from "./CompositionInput";
import { useSearchParams } from "react-router";
import { database, entityTypes, name, searchable } from "../catalog";
import type { Entity, EntityType } from "../catalog";
import { EntityLink } from "./EntityLink";
import { formatNumber } from "../utils/formatNumber";

export const statText = (value: number | null | undefined, suffix = "") => value == null ? "未提供" : `${formatNumber(value)}${suffix}`;

export function CatalogSection({ type }: { type: EntityType }) {
  const [params, setParams] = useSearchParams();
  const term = params.get("name") ?? "";
  const region = type === "fish" ? params.get("region") ?? "all" : "all";
  const kind = type === "recipe" || type === "staff" ? params.get("kind") ?? "all" : "all";
  const set = (key: string, value: string) => setParams(current => {
    const next = new URLSearchParams(current);
    if (!value || value === "all") next.delete(key); else next.set(key, value);
    next.delete("page");
    return next;
  }, { replace: true });
  const entries = type === "recipe" ? database.recipes : type === "ingredient" ? database.ingredients : type === "fish" ? database.fish : database.staff;
  const data = entries.filter(e => searchable(e).includes(term.trim().toLocaleLowerCase()) &&
    (region === "all" || e.facets.region === region) &&
    (kind === "all" || (kind === "multiple" ? (e.stats.maxServings ?? 0) > 1 : kind === "simple" ? e.ingredients?.length === 1 : kind === "taste" ? (e.stats.maxTaste ?? 0) >= 375 : e.facets.tier === kind)));
  const columns = [
    { title: `${entityTypes[type]} / 英文名`, key: "name", width: 245, render: (_: unknown, e: Entity) => <div><strong><EntityLink id={e.id} /></strong><small className="catalog-en">{e.en}</small></div> },
    ...(type === "recipe" ? [
      { title: "基础售价", key: "basePrice", render: (_: unknown, e: Entity) => statText(e.stats.basePrice, " G"), sorter: (a: Entity, b: Entity) => (a.stats.basePrice ?? -1) - (b.stats.basePrice ?? -1) },
      { title: "满级售价", key: "maxPrice", render: (_: unknown, e: Entity) => statText(e.stats.maxPrice, " G"), sorter: (a: Entity, b: Entity) => (a.stats.maxPrice ?? -1) - (b.stats.maxPrice ?? -1) },
      { title: "满级口感 / 份数", key: "portions", render: (_: unknown, e: Entity) => `${statText(e.stats.maxTaste)} / ${statText(e.stats.maxServings)}` },
      { title: "每批用料", key: "ingredients", width: 290, render: (_: unknown, e: Entity) => <div className="ingredient-mini">{e.ingredients?.map((i, index) => <span key={`${i.ingredientId}-${index}`}><EntityLink id={i.ingredientId} /> ×{i.quantity ?? "?"}</span>)}</div> },
    ] : type === "staff" ? [
      ...[["maxCooking", "满级烹饪"], ["maxServing", "满级服务"], ["maxProcurement", "满级采购"], ["maxAppeal", "满级吸引力"]].map(([key, title]) => ({ title, key, render: (_: unknown, e: Entity) => statText(e.stats[key]), sorter: (a: Entity, b: Entity) => (a.stats[key] ?? -1) - (b.stats[key] ?? -1) })),
      { title: "技能", key: "skills", width: 230, render: (_: unknown, e: Entity) => e.skillIds?.length ? e.skillIds.map(id => <Tag key={id}>{name(id)}</Tag>) : "未提供" },
    ] : type === "fish" ? [
      { title: "区域 / 时段", key: "location", render: (_: unknown, e: Entity) => <>{e.facets.region ? name(e.facets.region) : "未提供"}<small className="catalog-en">{e.facets.time ? name(e.facets.time) : "未提供"}</small></> },
      { title: "等级", key: "rank", render: (_: unknown, e: Entity) => statText(e.stats.rank), sorter: (a: Entity, b: Entity) => (a.stats.rank ?? -1) - (b.stats.rank ?? -1) },
      { title: "重量", key: "weight", render: (_: unknown, e: Entity) => statText(e.stats.weight, " kg") },
      { title: "鱼肉 · 1 / 2 / 3 星", key: "meat", render: (_: unknown, e: Entity) => [1, 2, 3].map(i => statText(e.stats[`meat${i}`])).join(" / ") },
      { title: "关联菜谱", key: "recipes", render: (_: unknown, e: Entity) => `${e.relatedIds.filter(id => id.startsWith("recipe/")).length} 道` },
    ] : [
      { title: "来源鱼类", key: "fish", width: 260, render: (_: unknown, e: Entity) => e.fishIds?.length ? <Space wrap>{e.fishIds.map(id => <EntityLink key={id} id={id} />)}</Space> : "农场、派遣或其他来源" },
      { title: "可制作菜谱", key: "recipes", render: (_: unknown, e: Entity) => `${e.relatedIds.filter(id => id.startsWith("recipe/")).length} 道` },
    ]),
  ];
  return <div className="catalog-section">
    <div className="inline-toolbar catalog-toolbar">
      <CompositionInput aria-label={`搜索${entityTypes[type]}数据库`} placeholder="搜索中文名、英文名或原料…" allowClear value={term} onValueChange={value => set("name", value)} />
      {type === "recipe" && <Select aria-label="数据库菜谱筛选" value={kind} onChange={value => set("kind", value)} options={[
        { value: "all", label: "全部菜谱" }, { value: "multiple", label: "多份料理" }, { value: "simple", label: "单一原料" }, { value: "taste", label: "满级口感 ≥ 375" },
      ]} />}
      {type === "fish" && <Select aria-label="鱼类区域筛选" value={region} onChange={value => set("region", value)} options={[{ value: "all", label: "全部区域" }, ...[...new Set(entries.map(e => e.facets.region).filter((v): v is string => !!v))].map(value => ({ value, label: name(value) }))]} />}
      {type === "staff" && <Select aria-label="员工评级筛选" value={kind} onChange={value => set("kind", value)} options={[{ value: "all", label: "全部评级" }, ...[...new Set(entries.map(e => e.facets.tier).filter((v): v is string => !!v))].map(value => ({ value, label: name(value) }))]} />}
      <span className="muted small">{data.length} / {entries.length} 条</span>
    </div>
    <Table rowKey="id" dataSource={data} columns={columns} scroll={{ x: type === "recipe" || type === "staff" ? 1050 : 800 }}
      pagination={{ current: Math.max(1, Number(params.get("page")) || 1), pageSize: 20, showSizeChanger: false, onChange: page => setParams(current => { const next = new URLSearchParams(current); next.set("page", String(page)); return next; }, { replace: true }), showTotal: total => `共 ${total} 条` }}
      locale={{ emptyText: "没有匹配条目，请尝试英文名或清除筛选" }} />
    <p className="muted small">本地数据 · {database.metadata.importedAt} 导入 · 数值和译名沿用来源网站。点击名称查看详情；“未提供”及“?”表示来源缺少该项数据。</p>
  </div>;
}
