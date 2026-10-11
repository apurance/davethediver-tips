import { Select, Table, Tag } from "antd";
import { useState } from "react";
import { entityTypes, name } from "../catalog";
import type { Entity, EntityType } from "../catalog";
import { EntityLink } from "./EntityLink";

export function CatalogSearchResults({ entries }: { entries: Entity[] }) {
  const [type, setType] = useState("all");
  return <div className="catalog-search-results">
    <div className="inline-toolbar"><h3>数据库 · {entries.length} 条</h3><Select aria-label="搜索结果类型" value={type} onChange={setType} options={[{ value: "all", label: "全部类型" }, ...Object.entries(entityTypes).map(([value, label]) => ({ value, label }))]} /></div>
    <Table rowKey="id" dataSource={entries.filter(e => type === "all" || e.type === type)} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 550 }} columns={[
      { title: "名称", key: "name", render: (_: unknown, e: Entity) => <strong><EntityLink id={e.id} /></strong> },
      { title: "英文名", dataIndex: "en" },
      { title: "类型", key: "type", render: (_: unknown, e: Entity) => <Tag color="cyan">{entityTypes[e.type as EntityType]}</Tag> },
      { title: "相关信息", key: "related", render: (_: unknown, e: Entity) => e.type === "recipe" ? e.ingredients?.map(i => name(i.ingredientId)).join("、") : e.type === "staff" ? e.skillIds?.map(name).join("、") : `${e.relatedIds.filter(id => id.startsWith("recipe/")).length} 道关联菜谱` },
    ]} />
  </div>;
}
