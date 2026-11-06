import { Card, Empty, Tabs } from "antd";
import { useState } from "react";
import { CatalogSection } from "../components/CatalogSection";
import { database } from "../catalog";
import type { SectionId } from "../data";
import { ArticleCard } from "../components/ArticleCard";
import { CrewPlanner } from "../components/CrewPlanner";
import { FlowDiagram } from "../components/FlowDiagram";
import { PageHeading } from "../components/PageHeading";
import { RecipeSection } from "../components/RecipeSection";
import { useGuideContext } from "../hooks/useGuideContext";

export function SectionPage({ section: page }: { section: SectionId }) {
  const { phase, filtered, saved, toggle } = useGuideContext();
  const [tab, setTab] = useState("database");
  const hasDatabase = page === "recipes" || page === "staff";
  const showGuide = !hasDatabase || tab === "guide";
  return (
    <>
      <PageHeading filter={showGuide} />
      {hasDatabase && <Tabs activeKey={tab} onChange={setTab} items={[
        { key: "database", label: `全部${page === "recipes" ? "食谱" : "员工"} · ${page === "recipes" ? database.recipes.length : database.staff.length}` },
        { key: "guide", label: page === "recipes" ? "经营建议与对比" : "配队与分店建议" },
      ]} />}
      {hasDatabase && tab === "database" && <CatalogSection key={page} type={page === "recipes" ? "recipe" : "staff"} />}
      {showGuide && page === "recipes" && (
        <RecipeSection phase={phase} />
      )}
      {showGuide && page === "staff" && <CrewPlanner />}
      {page === "progression" && (
        <Card className="timeline-card">
          <FlowDiagram />
          <p className="muted">
            下方按阶段给出推进路线。解锁由任务进度驱动，游戏天数会因玩法不同而变化。
          </p>
        </Card>
      )}
      {showGuide && <div className="article-grid detail-articles">
        {filtered
          .filter((a) => a.section === page)
          .map((a) => (
            <ArticleCard
              key={a.id}
              article={a}
              saved={saved.includes(a.id)}
              toggle={() => toggle(a.id)}
            />
          ))}
      </div>}
      {showGuide && !filtered.some((a) => a.section === page) && (
        <Empty description="此阶段没有可见条目，请切换全部阶段。" />
      )}
    </>
  );
}
