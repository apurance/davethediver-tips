import { Alert, Card, Empty, Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import type { SectionId } from "../data";
import { ArticleCard } from "../components/ArticleCard";
import { CrewPlanner } from "../components/CrewPlanner";
import { FlowDiagram } from "../components/FlowDiagram";
import { PageHeading } from "../components/PageHeading";
import { RecipeSection } from "../components/RecipeSection";
import { useGuideContext } from "../hooks/useGuideContext";

export function SectionPage({ section: page }: { section: SectionId }) {
  const { phase, plan, spoilers, filtered, saved, toggle, navigate } = useGuideContext();
  return (
    <>
      <PageHeading filter />
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
  );
}
