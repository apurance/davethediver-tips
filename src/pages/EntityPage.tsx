import { Alert, Breadcrumb, Card, Descriptions, Empty, Space, Table, Tag } from "antd";
import { Link, Navigate, useParams } from "react-router";
import { database, entityLists, entityPath, entityTypes, getEntity, name } from "../catalog";
import type { Entity, EntityType } from "../catalog";
import { formatFactValue, getDisplayFacts } from "../facts";
import type { DisplayFactValue } from "../facts";
import { EntityLink } from "../components/EntityLink";
import { statText } from "../components/CatalogSection";
import { PageHeading } from "../components/PageHeading";
import { recipes } from "../data";

function FactContent({ values, entity }: { values: DisplayFactValue[]; entity: Entity }) {
  return <>{values.map((value, index) => <span key={index}>{index > 0 ? " " : ""}{value.entityId ? <EntityLink id={value.entityId} /> : formatFactValue(value, entity, name)}</span>)}</>;
}

export function EntityPage({ type }: { type: EntityType }) {
  const { slug } = useParams();
  const requestedId = `${type}/${slug}`;
  const entity = getEntity(requestedId);
  if (!entity) return <><PageHeading title="条目未找到" description="该条目不存在，或链接中的名称有误。" /><Empty description="没有对应数据" /><Link to={entityLists[type]}>返回{entityTypes[type]}目录</Link></>;
  if (requestedId !== entity.id) return <Navigate replace to={entityPath(entity)} />;
  const strategy = recipes.find(recipe => recipe.entityId === entity.id);
  const related = entity.relatedIds.map(getEntity).filter(e => !!e);
  const summarized = type === "recipe" ? ["base-price", "base-selling-price", "sell-price", "base-taste", "taste", "base-servings", "max-price", "max-taste", "max-servings", "highest-sell-price", "highest-taste"] : type === "staff" ? ["base-cooking", "base-serving", "base-procurement", "base-appeal", "max-cooking", "max-serving", "max-procurement", "max-appeal", "cooking", "serving", "procurement", "appeal", "hiring-cost", "wage", "manager-rank", "tier", "special-skills"] : [];
  const facts = getDisplayFacts(entity).filter(f => !summarized.some(field => f.labelId === `field/${field}`));
  return <>
    <Breadcrumb items={[{ title: <Link to="/">概览</Link> }, { title: <Link to={entityLists[type]}>{entityTypes[type]}数据库</Link> }, { title: name(entity.id) }]} />
    <PageHeading eyebrow={`${entityTypes[type]} / ${entity.en}`} title={name(entity.id)} description={`本地资料 · ${database.metadata.importedAt} 导入`} />
    {entity.inferred && <Alert type="info" showIcon title="由菜谱用料建立的食材条目" description="来源网站未提供独立食材页，以下关联根据菜谱及鱼类记录整理。" />}
    {type === "recipe" && <Card title="售价、口感与份数" className="catalog-detail-card">
      <Table pagination={false} rowKey="level" size="small" dataSource={[
        { level: "基础", price: entity.stats.basePrice, taste: entity.stats.baseTaste, servings: entity.stats.baseServings },
        { level: "满级", price: entity.stats.maxPrice, taste: entity.stats.maxTaste, servings: entity.stats.maxServings },
      ]} columns={[
        { title: "等级", dataIndex: "level" }, { title: "每份售价", dataIndex: "price", render: v => statText(v, " G") },
        { title: "口感", dataIndex: "taste", render: v => statText(v) }, { title: "每批份数", dataIndex: "servings", render: v => statText(v) },
      ]} />
      <h3 className="catalog-subheading">每批用料</h3>
      {entity.ingredients?.length ? <div className="catalog-ingredients">{entity.ingredients.map((i, index) => <div key={`${i.ingredientId}-${index}`}><EntityLink id={i.ingredientId} /><strong>× {i.quantity ?? "未提供数量"}</strong></div>)}</div> : <Empty description="来源未提供用料" />}
      {strategy && <Link className="catalog-tab catalog-tab-active" to={`/tools?recipe=${strategy.id}`}>计算备货</Link>}
    </Card>}
    {type === "staff" && <Card title="员工属性" className="catalog-detail-card">
      <Space wrap className="catalog-skills">{entity.facets.tier && <Tag color="cyan">{name(entity.facets.tier)}</Tag>}{entity.skillIds?.map(id => <Tag key={id}>{name(id)}</Tag>)}</Space>
      <Table pagination={false} rowKey="level" scroll={{ x: 500 }} dataSource={[
        { level: "基础", cooking: entity.stats.baseCooking, serving: entity.stats.baseServing, procurement: entity.stats.baseProcurement, appeal: entity.stats.baseAppeal },
        { level: "满级", cooking: entity.stats.maxCooking, serving: entity.stats.maxServing, procurement: entity.stats.maxProcurement, appeal: entity.stats.maxAppeal },
      ]} columns={[
        { title: "等级", dataIndex: "level" }, ...[["cooking", "烹饪"], ["serving", "服务"], ["procurement", "采购"], ["appeal", "吸引力"]].map(([dataIndex, title]) => ({ dataIndex, title, render: (v: number | null) => statText(v) })),
      ]} />
      <p className="muted">雇佣费 {statText(entity.stats.hiringCost, " G")} · 工资 {statText(entity.stats.wage, " G")} · 满级经理等级 {statText(entity.stats.managerRank)}</p>
    </Card>}
    <Card title={type === "recipe" || type === "staff" ? "解锁与其他信息" : "游戏数据"} className="catalog-detail-card">
      {facts.length ? <Descriptions bordered column={1} size="small" items={facts.map((f, i) => ({ key: i, label: name(f.labelId), children: <FactContent values={f.values} entity={entity} /> }))} /> : <p className="muted">来源未提供其他独立属性数据。</p>}
    </Card>
    {(["ingredient", "fish", "recipe", "staff"] as EntityType[]).map(group => {
      const entries = related.filter(e => e.type === group);
      return entries.length ? <Card key={group} title={group === "recipe" ? `可制作食谱 · ${entries.length}` : `关联${entityTypes[group]} · ${entries.length}`} className="catalog-detail-card">
        <div className="catalog-related">{entries.map(e => <div key={e.id}><EntityLink id={e.id} /><small className="catalog-en">{e.en}</small></div>)}</div>
      </Card> : null;
    })}
    <p className="muted small">基础数值及中文名沿用来源网站；派生数值根据当前基础数据计算。来源：</p>
    <Space orientation="vertical">{entity.sourceUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">{index === 0 ? "查看原始条目" : `其他来源记录 ${index + 1}`}</a>)}{!entity.sourceUrls.length && <span className="muted">请参阅上方关联菜谱的来源。</span>}</Space>
    <p className="catalog-back"><Link to={entityLists[type]}>← 返回{entityTypes[type]}目录</Link></p>
  </>;
}
