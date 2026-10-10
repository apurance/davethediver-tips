import { Card, Tag, Button, Empty } from "antd";
import { ArticleCard } from "../components/ArticleCard";
import { PageHeading } from "../components/PageHeading";
import { SourceLinks } from "../components/SourceLinks";
import { useGuideContext } from "../hooks/useGuideContext";
import { formatNumber } from "../utils/formatNumber";

export function SearchPage() {
  const { query, savedOnly, filtered, matchedRecipes, saved, toggle, plan } = useGuideContext();
  if (!savedOnly && !query.trim()) {
    return (
      <>
        <PageHeading
          eyebrow="SEARCH THE FIELD NOTES"
          title="搜索攻略"
          description="输入菜谱、员工或装备名称查找适用攻略。"
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
        description={`找到 ${filtered.length} 条适用攻略${matchedRecipes.length ? `、${matchedRecipes.length} 道菜谱` : ""}。阶段筛选和剧透开关会影响结果。`}
        filter
      />
      {matchedRecipes.length > 0 && (
        <div className="article-grid recipe-search-results">
          {matchedRecipes.map((r) => (
            <Card
              key={r.id}
              title={r.name}
              extra={<Tag color="cyan">菜谱</Tag>}
            >
              <p className="muted">
                {r.en} · {r.role}
              </p>
              <p>
                满级每盘 <strong>{formatNumber(r.max)} G</strong>，每批{" "}
                {r.servings} 盘。
              </p>
              <p>解锁：{r.unlock}</p>
              <p>{r.constraint}</p>
              <Button type="primary" onClick={() => plan(r.id)}>
                计算备货
              </Button>
              <SourceLinks ids={[r.source]} />
            </Card>
          ))}
        </div>
      )}
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
      ) : matchedRecipes.length === 0 ? (
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
