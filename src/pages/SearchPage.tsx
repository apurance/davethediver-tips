import { Empty } from "antd";
import { ArticleCard } from "../components/ArticleCard";
import { PageHeading } from "../components/PageHeading";
import { useGuideContext } from "../hooks/useGuideContext";
import { CatalogSearchResults } from "../components/CatalogSearchResults";

export function SearchPage() {
  const { query, savedOnly, filtered, matchedCatalog, saved, toggle } = useGuideContext();
  if (!savedOnly && !query.trim()) {
    return (
      <>
        <PageHeading
          eyebrow="SEARCH THE FIELD NOTES"
          title="搜索攻略"
          description="输入食谱、食材、鱼类、员工或装备名称，查找数据库和适用攻略。"
          filter
        />
        <Empty description="输入关键词开始搜索" />
      </>
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="SEARCH THE FIELD NOTES"
        title={savedOnly ? "我的收藏" : `搜索「${query.trim()}」`}
        description={`找到 ${matchedCatalog.length} 条数据库记录、${filtered.length} 条适用攻略。阶段筛选和剧透开关仅影响攻略。`}
        filter
      />
      {matchedCatalog.length > 0 && <CatalogSearchResults key={query} entries={matchedCatalog} />}
      {filtered.length ? (
        <div className="article-grid">
          {filtered.map((a) => (
            <ArticleCard
              key={a.id}
              article={a}
              saved={saved.includes(a.id)}
              toggle={() => toggle(a.id)}
            />
          ))}
        </div>
      ) : matchedCatalog.length === 0 ? (
        <Empty
          description={
            savedOnly
              ? "还没有符合筛选条件的收藏，点击攻略卡片上的爱心保存。"
              : "没有匹配结果，试试英文名、较短关键词，或选择全部阶段。"
          }
        />
      ) : null}
    </>
  );
}
