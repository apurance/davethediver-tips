import type { SectionId, Article } from "../data";
import { Space, Button, Card, Statistic, Divider, Alert } from "antd";
import {
  ArrowRightOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ShopOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  StarOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { OceanArt } from "../components/OceanArt";
import { PhaseFilter } from "../components/PhaseFilter";
import { articles, recipes } from "../data";
import { FlowDiagram } from "../components/FlowDiagram";
import { DailyChecklist } from "../components/DailyChecklist";
import { ArticleCard } from "../components/ArticleCard";

interface OverviewPageProps {
  phase: string;
  setPhase: (value: string) => void;
  navigate: (id: SectionId) => void;
  filtered: Article[];
  saved: string[];
  toggle: (id: string) => void;
}

export function OverviewPage({
  phase,
  setPhase,
  navigate,
  filtered,
  saved,
  toggle,
}: OverviewPageProps) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE BLUE HOLE FIELD GUIDE</span>
          <h1>
            白天探索蓝洞，
            <br />
            夜晚经营寿司店。
          </h1>
          <p>
            从第一次下潜，到两家店的稳定盈利。
            <br />
            把装备、人员与食材，配成一套好用的循环。
          </p>
          <Space wrap>
            <Button
              size="large"
              onClick={() => navigate("progression")}
              type="primary"
              className="hero-primary"
            >
              开始阅读 <ArrowRightOutlined />
            </Button>
            <Button
              size="large"
              className="hero-secondary"
              onClick={() => navigate("tools")}
            >
              规划今晚菜单
            </Button>
          </Space>
          <div className="hero-foot">
            <span /> 非官方中文攻略 · 推荐均附适用条件
          </div>
        </div>
        <OceanArt />
      </section>
      <div className="phase-panel">
        <div>
          <strong>从你的进度开始</strong>
          <span>筛选当前阶段适用的建议</span>
        </div>
        <PhaseFilter phase={phase} setPhase={setPhase} />
      </div>
      <div className="metric-grid">
        <Card>
          <Statistic title="子系统专题" value={10} suffix="类" />
          <small>从推进路线到扩展玩法</small>
        </Card>
        <Card>
          <Statistic
            title="可执行攻略"
            value={articles.length}
            suffix="条"
          />
          <small>每条都有条件、操作与依据</small>
        </Card>
        <Card>
          <Statistic
            title="代表性菜谱"
            value={recipes.length}
            suffix="道"
          />
          <small>各级售价 / 份数可查</small>
        </Card>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">OPTIMIZE YOUR EVERYDAY LOOP</span>
          <h2>各个系统，怎样搭配更顺手</h2>
        </div>
        <span className="muted small">按实际瓶颈选择下一步</span>
      </div>
      <div className="system-grid">
        {[
          {
            id: "diving",
            icon: <ThunderboltOutlined />,
            name: "捕鱼与装备",
            tag: "CAPTURE",
            text: "钢网抓鱼群，睡眠镖活捉大鱼。出发前先确定目标。",
            hint: "武器 · 饰品 · 捕获品质",
          },
          {
            id: "staff",
            icon: <TeamOutlined />,
            name: "餐厅与员工",
            tag: "OPERATIONS",
            text: "先覆盖饮料、清洁与芥末技能，再考虑极限属性。",
            hint: "两套配队 · 培训 · 分店",
          },
          {
            id: "recipes",
            icon: <ShopOutlined />,
            name: "菜谱与供应链",
            tag: "PROFIT",
            text: `${name("recipe/tropical-fish-sushi-set")}稳定经营，${name("recipe/crimson-fish-roll")}释放农田与调料。`,
            hint: "价格对比 · 批次数 · 回本",
          },
          {
            id: "farm",
            icon: <ExperimentOutlined />,
            name: "养殖与农场",
            tag: "SUPPLY",
            text: "目标种鱼至少留两条，日产量决定可持续菜单。",
            hint: "保种 · 农田 · 海藻 · 蟹笼",
          },
          {
            id: "events",
            icon: <CalendarOutlined />,
            name: "活动与任务",
            tag: "CALENDAR",
            text: "派对前倒排备货，VIP 请求优先打开新功能。",
            hint: "主题加成 · 原料安全库存",
          },
          {
            id: "collection",
            icon: <StarOutlined />,
            name: "图鉴与收集",
            tag: "DISCOVERY",
            text: "按区域、时段与捕获工具补缺，不盲目全图往返。",
            hint: "三星图鉴 · 海马 · 生态",
          },
        ].map((s) => (
          <Card className="system-card" key={s.id}>
            <div className="system-top">
              <span className="system-icon">{s.icon}</span>
              <span className="mono muted small">{s.tag}</span>
            </div>
            <h3>{s.name}</h3>
            <p>{s.text}</p>
            <div className="system-bottom">
              <span>{s.hint}</span>
              <Button
                type="text"
                aria-label={`阅读${s.name}`}
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(s.id as SectionId)}
              />
            </div>
          </Card>
        ))}
      </div>
      <div className="overview-bottom">
        <div>
          <div className="section-heading">
            <div>
              <span className="eyebrow">A SELF-SUSTAINING SYSTEM</span>
              <h2>让每次潜水，都有下一步</h2>
            </div>
          </div>
          <Card>
            <FlowDiagram />
            <Divider />
            <div className="loop-note">
              <BulbOutlined />
              <p>
                真正的最优解，是
                <strong>你能连续供货、顺利服务的组合</strong>
                。先补短板，再扩大客流；一次高额营业并不代表长期稳定。
              </p>
            </div>
          </Card>
          <Alert
            className="version-callout"
            type="info"
            showIcon
            title="已经进入丛林？请看独立扩展附录"
            description="In the Jungle 已于 2026 年 6 月发布。新地区的员工与供货机制需要另行规划。"
            action={
              <Button size="small" onClick={() => navigate("dlc")}>
                阅读附录
              </Button>
            }
          />
        </div>
        <DailyChecklist />
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">START WITH ONE CHANGE</span>
          <h2>当前阶段，先做好这一件事</h2>
        </div>
      </div>
      <div className="article-grid">
        {filtered
          .filter((a) => a.section === "progression")
          .slice(0, 2)
          .map((a) => (
            <ArticleCard
              key={a.id}
              article={a}
              compact
              saved={saved.includes(a.id)}
              toggle={() => toggle(a.id)}
            />
          ))}
      </div>
    </>
  );
}
import { name } from "../catalog";
