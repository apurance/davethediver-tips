import type { GuideState } from "../hooks/useGuideState";
import { OverviewPage } from "./OverviewPage";
import { PhaseFilter } from "../components/PhaseFilter";
import { Card, Tag, Button, Empty, Alert } from "antd";
import { formatNumber } from "../utils/formatNumber";
import { SourceLinks } from "../components/SourceLinks";
import { ArticleCard } from "../components/ArticleCard";
import { SourcesPage } from "./SourcesPage";
import { Calculators } from "../components/calculators/Calculators";
import { RecipeSection } from "../components/RecipeSection";
import { CrewPlanner } from "../components/CrewPlanner";
import { FlowDiagram } from "../components/FlowDiagram";
import { ArrowRightOutlined } from "@ant-design/icons";

type GuideContentProps = Pick<
  GuideState,
  | "page"
  | "phase"
  | "setPhase"
  | "spoilers"
  | "saved"
  | "query"
  | "savedOnly"
  | "filtered"
  | "active"
  | "searchMode"
  | "matchedRecipes"
  | "plan"
  | "toggle"
  | "navigate"
  | "calcRecipe"
  | "setCalcRecipe"
>;

export function GuideContent({
  page,
  phase,
  setPhase,
  spoilers,
  saved,
  query,
  savedOnly,
  filtered,
  active,
  searchMode,
  matchedRecipes,
  plan,
  toggle,
  navigate,
  calcRecipe,
  setCalcRecipe,
}: GuideContentProps) {
  if (!searchMode && page === "overview") {
    return (
      <OverviewPage
        phase={phase}
        setPhase={setPhase}
        navigate={navigate}
        filtered={filtered}
        saved={saved}
        toggle={toggle}
      />
    );
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">
          {searchMode ? "SEARCH THE FIELD NOTES" : active.en}
        </span>
        <h1>
          {searchMode
            ? savedOnly
              ? "我的收藏"
              : `搜索「${query.trim()}」`
            : active.title}
        </h1>
        <p>
          {searchMode
            ? `找到 ${filtered.length} 条适用攻略${matchedRecipes.length ? `、${matchedRecipes.length} 道菜谱` : ""}。阶段筛选和剧透开关会影响结果。`
            : active.desc}
        </p>
      </div>
      {(searchMode || (page !== "sources" && page !== "tools")) && (
        <div className="detail-filter">
          <PhaseFilter phase={phase} setPhase={setPhase} />
          <span className="muted small">仅筛选适用阶段</span>
        </div>
      )}
      {searchMode ? (
        <>
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
      ) : page === "sources" ? (
        <SourcesPage />
      ) : page === "tools" ? (
        <Calculators
          selected={calcRecipe}
          setSelected={setCalcRecipe}
        />
      ) : (
        <>
          {page === "recipes" && (
            <RecipeSection phase={phase} onPlan={plan} />
          )}
          {page === "staff" && <CrewPlanner />}
          {page === "progression" && (
            <Card className="timeline-card">
              <FlowDiagram />
              <p className="muted">
                下方按阶段给出推进路线。解锁由任务进度驱动，游戏天数会因玩法不同而变化。
              </p>
            </Card>
          )}
          {page === "bosses" && !spoilers && (
            <Alert
              type="info"
              showIcon
              title="Boss 身份与具体打法已隐藏"
              description="打开右上角的剧透开关即可显示。开关只隐藏标记的 Boss 卡片，不屏蔽装备、地区和系统解锁信息。"
            />
          )}
          <div className="article-grid detail-articles">
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
          </div>
          {!filtered.some((a) => a.section === page) && (
            <Empty description="此阶段没有可见条目，请切换全部阶段或开启 Boss 剧透。" />
          )}
          {page === "farm" && (
            <Card title="供应是否跟得上？">
              <p>
                把养殖、农田与派遣的实际日产量输入计算器，找出最短缺的一种原料。
              </p>
              <Button type="primary" onClick={() => navigate("tools")}>
                打开供给计算器 <ArrowRightOutlined />
              </Button>
            </Card>
          )}
        </>
      )}
    </>
  );
}
