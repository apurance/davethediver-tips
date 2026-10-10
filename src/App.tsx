import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App as AntApp,
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Drawer,
  Empty,
  Input,
  InputNumber,
  List,
  Menu,
  Modal,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Slider,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import type { InputRef } from "antd";
import {
  ArrowRightOutlined,
  BookOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  ExportOutlined,
  FileSearchOutlined,
  HeartFilled,
  HeartOutlined,
  MenuOutlined,
  SearchOutlined,
  ShopOutlined,
  StarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { calculateMenu, calculateSupply } from "./calculations";
import {
  articles,
  dailyTasks,
  phases,
  recipes,
  sections,
  sources,
} from "./data";
import type { Article, Phase, Recipe, SectionId } from "./data";

const number = (n: number) =>
  n.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
const icons = [
  <DashboardOutlined />,
  <CompassOutlined />,
  <ThunderboltOutlined />,
  <ShopOutlined />,
  <TeamOutlined />,
  <ExperimentOutlined />,
  <ThunderboltOutlined />,
  <CalendarOutlined />,
  <StarOutlined />,
  <ExportOutlined />,
  <ToolOutlined />,
  <FileSearchOutlined />,
];
function readSaved<T>(key: string, initial: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : initial;
  } catch {
    return initial;
  }
}
function useSaved<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readSaved(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode still supports in-session use. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
function SourceLinks({ ids }: { ids: string[] }) {
  return (
    <div className="source-links">
      <FileSearchOutlined />
      <span>依据</span>
      {ids.map((id) => {
        const s = sources.find((v) => v.id === id);
        return s ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer">
            {s.name}
            <ExportOutlined />
          </a>
        ) : null;
      })}
    </div>
  );
}
function OceanArt() {
  return (
    <svg
      className="ocean-art"
      viewBox="0 0 470 300"
      role="img"
      aria-label="蓝洞深度示意插画，非真实游戏地图"
    >
      <defs>
        <linearGradient id="ocean" x2="0" y2="1">
          <stop stopColor="#1c8fa0" />
          <stop offset="1" stopColor="#10354f" />
        </linearGradient>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#fff" opacity=".12" />
        </pattern>
      </defs>
      <rect width="470" height="300" rx="14" fill="url(#ocean)" />
      <rect width="470" height="300" fill="url(#dots)" />
      {[60, 145, 230].map((y, i) => (
        <g key={y}>
          <path
            d={`M28 ${y} H437`}
            stroke="white"
            strokeDasharray="4 7"
            opacity=".17"
          />
          <text
            x="388"
            y={y - 10}
            fill="#b9dde3"
            fontSize="11"
            fontFamily="monospace"
          >
            {["0–50 M", "50–130 M", "130 M+"][i]}
          </text>
        </g>
      ))}
      <path
        d="M0 35 Q38 10 65 42 L65 177 Q50 185 42 217 L0 217Z"
        fill="#123e55"
      />
      <path
        d="M470 15 L421 15 L416 53 L403 53 L403 95 L435 95 L435 137 L418 137 L418 253 L470 253Z"
        fill="#123e55"
      />
      <path
        d="M0 300 L0 266 Q54 248 91 274 Q149 245 202 275 Q239 245 294 272 Q357 258 397 274 L470 258 L470 300Z"
        fill="#0d2e44"
      />
      <g fill="none" stroke="#74cad0" strokeWidth="1" opacity=".4">
        <circle cx="235" cy="145" r="56" />
        <circle cx="235" cy="145" r="87" />
        <path d="M235 44V248M128 145H341" strokeDasharray="4 6" />
      </g>
      <g transform="translate(231 135) rotate(-18)">
        <ellipse cx="0" cy="0" rx="21" ry="14" fill="#f2ca65" />
        <circle cx="24" cy="-6" r="12" fill="#f8deb0" />
        <rect x="23" y="-12" width="12" height="10" rx="3" fill="#174858" />
        <rect x="-20" y="-16" width="28" height="10" rx="4" fill="#d9eff0" />
        <path
          d="M-15 8L-34 16L-46 9M-12 4L-34 -1L-47 -12"
          stroke="#f2ca65"
          strokeWidth="8"
          fill="none"
        />
        <path
          d="M12 7L29 13L40 8"
          stroke="#f8deb0"
          strokeWidth="5"
          fill="none"
        />
      </g>
      {[
        [110, 80, 1],
        [342, 111, 0.75],
        [155, 217, 0.8],
        [323, 224, 1.3],
      ].map(([x, y, s], i) => (
        <g
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          fill={i === 3 ? "#f2ca65" : "#76c9d2"}
          opacity=".85"
        >
          <path d="M-20 0 Q0 -17 24 0 Q0 16 -20 0 L-33 -10 L-33 10Z" />
          <circle cx="15" cy="-2" r="2" fill="#164653" />
        </g>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M${70 + i * 9} 281 q-12 -20 0 -36 q12 -15 0 -28`}
          fill="none"
          stroke="#4c9297"
          strokeWidth="5"
        />
      ))}
      <text x="28" y="28" fill="#d1edf0" fontSize="10" letterSpacing="2">
        BLUE HOLE / DEPTH STUDY
      </text>
      <text x="310" y="285" fill="#9fc6ce" fontSize="9">
        示意插画 · 非坐标地图
      </text>
    </svg>
  );
}
function FlowDiagram() {
  const items = [
    ["潜水捕获", "目标鱼 · 材料"],
    ["稳定供应", "养殖 · 农场 · 派遣"],
    ["菜单销售", "份数 × 单价"],
    ["再投资", "装备 · 员工 · 扩容"],
  ];
  return (
    <div className="flow" aria-label="潜水、供应、销售、投资经济循环">
      {items.map(([title, sub], i) => (
        <div className="flow-step" key={title}>
          <span className="flow-number">0{i + 1}</span>
          <strong>{title}</strong>
          <small>{sub}</small>
          {i < 3 && <ArrowRightOutlined className="flow-arrow" />}
        </div>
      ))}
    </div>
  );
}
function ArticleCard({
  article,
  saved,
  toggle,
  compact = false,
}: {
  article: Article;
  saved: boolean;
  toggle: () => void;
  compact?: boolean;
}) {
  return (
    <Card
      className="article-card"
      title={
        <div className="article-title">
          <span>{article.title}</span>
          <Tooltip title={saved ? "取消收藏" : "收藏这条攻略"}>
            <Button
              type="text"
              size="small"
              aria-label={`${saved ? "取消收藏" : "收藏"}：${article.title}`}
              icon={
                saved ? (
                  <HeartFilled style={{ color: "#087f8c" }} />
                ) : (
                  <HeartOutlined />
                )
              }
              onClick={toggle}
            />
          </Tooltip>
        </div>
      }
    >
      <Space size={4} wrap>
        <Tag color="cyan">{article.badge}</Tag>
        {article.phases.map((p) => (
          <Tag key={p}>{phases[p]}</Tag>
        ))}
      </Space>
      <p className="article-lead">{article.lead}</p>
      {compact ? (
        <p>{article.steps[0]}</p>
      ) : (
        <ol className="article-steps">
          {article.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      <div className="guide-tip">
        <BulbOutlined />
        <span>{article.tip}</span>
      </div>
      <SourceLinks ids={article.sources} />
    </Card>
  );
}
function DailyChecklist() {
  const [checks, setChecks] = useSaved<string[]>("bluehole.checks.v1", []);
  return (
    <Card
      title="今天该做什么"
      extra={
        <Popconfirm
          title="开始新的一天，清空已完成项？"
          onConfirm={() => setChecks([])}
          okText="清空"
          cancelText="取消"
        >
          <Button type="text" size="small">
            重置
          </Button>
        </Popconfirm>
      }
    >
      <div className="check-progress">
        <span>
          本地保存 · {checks.length} / {dailyTasks.length}
        </span>
        <Progress
          percent={Math.round((checks.length / dailyTasks.length) * 100)}
          size="small"
          showInfo={false}
        />
      </div>
      {dailyTasks.map((task) => (
        <div
          className={`task ${checks.includes(task.id) ? "task-done" : ""}`}
          key={task.id}
        >
          <Checkbox
            checked={checks.includes(task.id)}
            onChange={(e) =>
              setChecks(
                e.target.checked
                  ? [...checks, task.id]
                  : checks.filter((v) => v !== task.id),
              )
            }
          >
            <span className="task-time">{task.time}</span>
            <strong>{task.title}</strong>
            <span className="task-desc">{task.desc}</span>
          </Checkbox>
        </div>
      ))}
    </Card>
  );
}
function RecipeSection({
  phase,
  onPlan,
}: {
  phase: string;
  onPlan: (id: string) => void;
}) {
  const [kind, setKind] = useState("all");
  const [compare, setCompare] = useState<string[]>(["tropical", "crimson"]);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const data = recipes.filter(
    (r) =>
      (phase === "all" || r.phase === phase) &&
      (kind === "all" ||
        (kind === "multiple"
          ? r.servings > 1
          : kind === "taste"
            ? r.taste >= 375
            : r.ingredients.length === 1)),
  );
  return (
    <>
      <div className="inline-toolbar">
        <span>代表性菜谱 · 数值均为 Lv.10</span>
        <Select
          aria-label="筛选菜谱类型"
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: "全部用途" },
            { value: "multiple", label: "多份主菜" },
            { value: "taste", label: "钻石美味候选" },
            { value: "simple", label: "单一原料" },
          ]}
        />
      </div>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        scroll={{ x: 1000 }}
        columns={[
          {
            title: "料理 / 用途",
            dataIndex: "name",
            fixed: "left",
            width: 210,
            render: (_: unknown, r: Recipe) => (
              <Button
                type="link"
                className="recipe-link"
                onClick={() => setDetail(r)}
              >
                <strong>{r.name}</strong>
                <small>{r.role}</small>
              </Button>
            ),
          },
          {
            title: "单份售价",
            dataIndex: "max",
            sorter: (a, b) => a.max - b.max,
            render: (v) => <b>{number(v)} G</b>,
          },
          {
            title: "每批盘数",
            dataIndex: "servings",
            render: (v) => <Tag color="cyan">{v} 盘</Tag>,
          },
          {
            title: "整批销售额",
            key: "batch",
            sorter: (a, b) => a.max * a.servings - b.max * b.servings,
            render: (_, r) => `${number(r.max * r.servings)} G`,
          },
          {
            title: "美味",
            dataIndex: "taste",
            render: (v) => (
              <span className={v >= 375 ? "taste-pass" : ""}>
                {v}
                {v >= 375 ? " ✓" : ""}
              </span>
            ),
          },
          {
            title: "每批原料",
            key: "ingredients",
            width: 250,
            render: (_, r) => (
              <div className="ingredient-mini">
                {r.ingredients.map(([n, q]) => (
                  <span key={n}>
                    {n} ×{q}
                  </span>
                ))}
              </div>
            ),
          },
          {
            title: "备菜",
            key: "action",
            render: (_, r) => (
              <Button size="small" onClick={() => onPlan(r.id)}>
                计算
              </Button>
            ),
          },
        ]}
      />
      <div className="section-heading">
        <div>
          <span className="eyebrow">COMPARE THE TRADE-OFFS</span>
          <h2>高售价，也要看供应成本</h2>
        </div>
        <Select
          mode="multiple"
          maxCount={4}
          aria-label="选择要对比的料理"
          value={compare}
          onChange={setCompare}
          className="compare-select"
          options={recipes.map((r) => ({ value: r.id, label: r.name }))}
        />
      </div>
      <Card>
        <div
          className="bar-chart"
          role="img"
          aria-label="所选菜谱满级单份售价比较"
        >
          {recipes
            .filter((r) => compare.includes(r.id))
            .map((r) => (
              <div className="bar-row" key={r.id}>
                <span>{r.name}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(r.max / 1700) * 100}%` }}
                  />
                </div>
                <b>{number(r.max)} G</b>
                <small>{r.servings} 盘 / 批</small>
              </div>
            ))}
        </div>
        {compare.length === 0 && (
          <Empty description="选择一到四道料理开始对比" />
        )}
        <p className="muted">
          这里只比较满级单份售价。整批盘数、稀缺调料、培育时间和农田占用需要一起考虑。
        </p>
      </Card>
      <Modal
        open={!!detail}
        title={detail?.name}
        onCancel={() => setDetail(null)}
        footer={
          detail ? (
            <Button
              type="primary"
              onClick={() => {
                onPlan(detail.id);
                setDetail(null);
              }}
            >
              用这道菜计算备货
            </Button>
          ) : null
        }
        width={650}
      >
        {detail && (
          <>
            <p className="mono muted">{detail.en}</p>
            <Tag color="cyan">{detail.role}</Tag>
            <p>
              <strong>解锁：</strong>
              {detail.unlock}
            </p>
            <p>
              <strong>限制：</strong>
              {detail.constraint}
            </p>
            <p>
              <strong>一批用料：</strong>
              {detail.ingredients.map(([n, q]) => `${n} ×${q}`).join("、")}
            </p>
            <Alert
              type="info"
              showIcon
              title="研究解锁与料理强化是两件事"
              description="先解锁并研究菜谱，再消耗原料提升菜谱等级。每批原料消耗与升级原料消耗也不同。"
            />
            <Table
              size="small"
              rowKey="level"
              pagination={false}
              dataSource={detail.prices.map((price, i) => ({
                level: i + 1,
                price,
                portions: detail.portions[i],
              }))}
              columns={[
                { title: "等级", dataIndex: "level" },
                { title: "单份售价 G", dataIndex: "price" },
                { title: "每批盘数", dataIndex: "portions" },
              ]}
            />
            <SourceLinks ids={[detail.source]} />
          </>
        )}
      </Modal>
    </>
  );
}
function CrewPlanner() {
  const [mode, setMode] = useState("easy");
  const easy = mode === "easy";
  const rows = [
    {
      role: "主店 · 大厅",
      crew: easy ? "El Niño + Raptor" : "El Niño + Drae",
      why: easy
        ? "饮料、清洁、鸡尾酒、芥末技能覆盖"
        : "清洁与鸡尾酒服务；Dave 手动补芥末",
    },
    {
      role: "主店 · 厨房",
      crew: "Maki + Yone / James",
      why: "速度不足先烹饪；够快后再考虑额外料理技能",
    },
    {
      role: "分店 · 经理",
      crew: easy ? "Drae" : "Kyoko / Raul",
      why: easy
        ? "旧版 Lv.10 食材等级 9，Lv.14 人气 5★"
        : "旧版 Kyoko Lv.18+ / Raul Lv.20；看实际人气",
    },
    {
      role: "分店 · 大厅",
      crew: easy ? "Billy + Kyoko / Itsuki" : "Billy + Raptor",
      why: easy
        ? "经理补综合服务，员工负责清洁与饮料"
        : "清洁、鸡尾酒与芥末由技能补齐",
    },
    {
      role: "分店 · 厨房",
      crew: "James / Raul / Yusuke / Charlie",
      why: "从剩余人员中选两人；满足速度，再比较增产",
    },
    {
      role: "派遣 · 调料",
      crew: "Davina + Masayoshi",
      why: "优先高采购与派遣技能，按主菜缺料选择目标",
    },
  ];
  return (
    <Card
      className="crew-card"
      title="两家店，一起配队"
      extra={<TeamOutlined />}
    >
      <Segmented
        block
        options={[
          { value: "easy", label: "省操作方案" },
          { value: "manual", label: "手动补芥末方案" },
        ]}
        value={mode}
        onChange={(v) => setMode(String(v))}
      />
      <p className="muted">
        {easy
          ? "适合希望省心经营的玩家。低等级和高客流下，Dave 仍需补漏。"
          : "适合成熟存档且愿意操作的玩家。先有合适的分店经理，再把 Drae 调回主店。"}
      </p>
      <Table
        rowKey="role"
        pagination={false}
        size="middle"
        scroll={{ x: 650 }}
        dataSource={rows}
        columns={[
          { title: "岗位", dataIndex: "role", width: 130 },
          { title: "推荐人员", dataIndex: "crew", width: 230 },
          { title: "选择条件", dataIndex: "why" },
        ]}
      />
      <Alert
        showIcon
        type="info"
        title="技能需要解锁，属性需要等级"
        description="这两套是社区实测方案，并非每个补丁下的唯一最优。换经理后看分店的食材等级与人气；同一员工不能同时出现在两家店。"
      />
      <SourceLinks ids={["staff", "staffFull"]} />
    </Card>
  );
}
function Calculators({
  selected,
  setSelected,
}: {
  selected: string;
  setSelected: (v: string) => void;
}) {
  const recipe = recipes.find((r) => r.id === selected) || recipes[2];
  const [level, setLevel] = useState(10);
  const [customers, setCustomers] = useState(45);
  const [branch, setBranch] = useState(0);
  const [served, setServed] = useState(100);
  const [cost, setCost] = useState(0);
  const [premium, setPremium] = useState(0);
  const [multiplier, setMultiplier] = useState(2);
  const [supply, setSupply] = useState<Record<string, number>>({});
  const price = recipe.prices[level - 1],
    portions = recipe.portions[level - 1];
  const { actual, mainBatches, branchBatches, batches, bonus, revenue, waste } =
    calculateMenu({
      customers,
      branch,
      served,
      price,
      portions,
      premium,
      multiplier,
      cost,
    });
  const supplyResult = calculateSupply(recipe.ingredients, supply, portions);
  const supplyPlates = supplyResult.plates;
  return (
    <Tabs
      items={[
        {
          key: "menu",
          label: "备菜与收入",
          children: (
            <div className="calculator-grid">
              <Card title="设定今晚的营业计划">
                <div className="form-field">
                  <label>主菜</label>
                  <Select
                    aria-label="计算主菜"
                    value={recipe.id}
                    onChange={setSelected}
                    options={recipes.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                  />
                </div>
                <div className="form-field">
                  <label>菜谱等级 · Lv.{level}</label>
                  <Slider min={1} max={10} value={level} onChange={setLevel} />
                </div>
                <div className="form-pair">
                  <div className="form-field">
                    <label>主店预计顾客</label>
                    <InputNumber
                      precision={0}
                      aria-label="主店预计顾客"
                      min={0}
                      max={200}
                      value={customers}
                      onChange={(v) => setCustomers(v ?? 0)}
                    />
                  </div>
                  <div className="form-field">
                    <label>分店预计顾客</label>
                    <InputNumber
                      precision={0}
                      aria-label="分店预计顾客"
                      min={0}
                      max={200}
                      value={branch}
                      onChange={(v) => setBranch(v ?? 0)}
                    />
                  </div>
                </div>
                <Space wrap>
                  <Button size="small" onClick={() => setCustomers(28)}>
                    主店金级参考 28
                  </Button>
                  <Button size="small" onClick={() => setCustomers(36)}>
                    白金参考 36
                  </Button>
                  <Button size="small" onClick={() => setCustomers(45)}>
                    钻石参考 45
                  </Button>
                </Space>
                <p className="muted small">
                  参考值来自社区常态客流记录；夜潜、活动与服务表现会改变结果，请按自己的营业记录填写。
                </p>
                <div className="form-field">
                  <label>预计成功服务率 · {served}%</label>
                  <Slider
                    min={0}
                    max={100}
                    value={served}
                    onChange={setServed}
                  />
                </div>
                <div className="form-pair">
                  <div className="form-field">
                    <label>享受主题加成的顾客</label>
                    <InputNumber
                      precision={0}
                      aria-label="享受主题加成的顾客"
                      min={0}
                      max={400}
                      value={premium}
                      onChange={(v) => setPremium(v ?? 0)}
                    />
                  </div>
                  <div className="form-field">
                    <label>加成倍率</label>
                    <InputNumber
                      precision={1}
                      aria-label="加成倍率"
                      min={1}
                      max={5}
                      step={0.1}
                      value={multiplier}
                      onChange={(v) => setMultiplier(v ?? 1)}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>工资、经营费与采购成本总计 / G</label>
                  <InputNumber
                    precision={0}
                    aria-label="成本总计"
                    min={0}
                    value={cost}
                    onChange={(v) => setCost(v ?? 0)}
                    step={100}
                  />
                </div>
              </Card>
              <div>
                <Card className="calc-result" title="你的备货方案">
                  <div className="stats-pair">
                    <Statistic
                      title="需准备的批次"
                      value={batches}
                      suffix="批"
                    />
                    <Statistic
                      title="理论料理收入"
                      value={revenue}
                      suffix="G"
                    />
                  </div>
                  <Divider />
                  <div className="result-lines">
                    <p>
                      Lv.{level} · 每份 <strong>{number(price)} G</strong> ·
                      每批 <strong>{portions} 盘</strong>
                    </p>
                    <p>
                      预计卖出 <strong>{actual} 盘</strong>，其中加成{" "}
                      <strong>{bonus} 盘</strong>
                    </p>
                    <p>
                      主店 <strong>{mainBatches} 批</strong>，分店{" "}
                      <strong>{branchBatches} 批</strong>
                    </p>
                    <p>
                      整批备菜剩余 <strong>{waste} 盘</strong>（各店分别取整）
                    </p>
                    <p>
                      扣自填成本后{" "}
                      <strong
                        className={revenue - cost < 0 ? "negative" : "positive"}
                      >
                        {number(revenue - cost)} G
                      </strong>
                    </p>
                  </div>
                  <Divider />
                  <h3>合计原料需求</h3>
                  {recipe.ingredients.map(([n, q]) => (
                    <div className="ingredient-total" key={n}>
                      <span>{n}</span>
                      <strong>{q * batches}</strong>
                    </div>
                  ))}
                  <p className="muted small">
                    不含升级原料、额外料理技能随机增产、饮料、小费与其他菜收入。两店均用同一道菜，成功顾客均购买一盘。服务率是计划参数，不是游戏固定概率。
                  </p>
                </Card>
                <Alert
                  type="warning"
                  showIcon
                  title="自动补菜可能再追加尾批"
                  description="这里计算手动整批备菜。临近打烊时开启自动补菜，可能额外消耗一批原料；套餐少备一批，再用单份寿司补尾可降低浪费。"
                />
                <SourceLinks ids={[recipe.source, "auto", "reference"]} />
              </div>
            </div>
          ),
        },
        {
          key: "supply",
          label: "日产供给瓶颈",
          children: (
            <div className="calculator-grid">
              <Card title="把实际出货量填进来">
                <div className="form-field">
                  <label>规划菜谱</label>
                  <Select
                    aria-label="供给规划菜谱"
                    value={recipe.id}
                    onChange={setSelected}
                    options={recipes.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                  />
                </div>
                <div className="form-field">
                  <label>菜谱等级 · Lv.{level}</label>
                  <Slider min={1} max={10} value={level} onChange={setLevel} />
                </div>
                <p className="muted">
                  填写每天可用于料理的原料数量，已经扣除保留种鱼与任务库存。使用几天的平均值，繁殖不会每天完全相同。
                </p>
                {recipe.ingredients.map(([n]) => (
                  <div className="form-field" key={n}>
                    <label>{n} · 每日可出货</label>
                    <InputNumber
                      precision={0}
                      aria-label={`${n}每日可出货`}
                      min={0}
                      value={supply[n] ?? 0}
                      onChange={(v) => setSupply({ ...supply, [n]: v ?? 0 })}
                    />
                  </div>
                ))}
              </Card>
              <Card title="可持续销售能力">
                <Statistic
                  title="由最短缺原料决定"
                  value={supplyPlates}
                  suffix="盘 / 日"
                />
                <Divider />
                {recipe.ingredients.map(([n, q]) => (
                  <div className="supply-row" key={n}>
                    <span>{n}</span>
                    <Progress
                      percent={
                        supplyResult.maximum > 0
                          ? Math.min(
                              100,
                              ((Math.floor((supply[n] ?? 0) / q) * portions) /
                                supplyResult.maximum) *
                                100,
                            )
                          : 0
                      }
                      showInfo={false}
                    />
                    <strong>
                      {Math.floor((supply[n] ?? 0) / q) * portions} 盘
                    </strong>
                  </div>
                ))}
                <p>
                  日常两店需求 <strong>{customers + branch} 盘</strong>。
                  {supplyPlates >= customers + branch
                    ? "当前输入供给可覆盖计划客流。"
                    : `还差 ${customers + branch - supplyPlates} 盘，应补瓶颈原料或加入第二道主菜。`}
                </p>
                <Alert
                  type="info"
                  showIcon
                  title="供给计算不是繁殖模拟"
                  description="以你实际日产出为输入，没有假设每种鱼固定繁殖概率。一次性库存可以应急，但不等于长期可持续。"
                />
              </Card>
            </div>
          ),
        },
        {
          key: "investment",
          label: "菜谱升级回本",
          children: <InvestmentCalculator recipe={recipe} />,
        },
      ]}
    />
  );
}
function InvestmentCalculator({ recipe }: { recipe: Recipe }) {
  const [oldLevel, setOld] = useState(5);
  const [newLevel, setNew] = useState(10);
  const [sales, setSales] = useState(45);
  const [investment, setInvestment] = useState(10000);
  const gain = recipe.prices[newLevel - 1] - recipe.prices[oldLevel - 1],
    daily = gain * sales;
  return (
    <Card title={`${recipe.name} · 升级回本估算`}>
      <div className="form-pair">
        <div className="form-field">
          <label>原等级</label>
          <InputNumber
            precision={0}
            aria-label="原等级"
            min={1}
            max={10}
            value={oldLevel}
            onChange={(v) => setOld(Math.max(1, Math.min(10, v ?? 1)))}
          />
        </div>
        <div className="form-field">
          <label>目标等级</label>
          <InputNumber
            precision={0}
            aria-label="目标等级"
            min={1}
            max={10}
            value={newLevel}
            onChange={(v) => setNew(Math.max(1, Math.min(10, v ?? 1)))}
          />
        </div>
        <div className="form-field">
          <label>每天实际销量 / 盘</label>
          <InputNumber
            precision={0}
            aria-label="每天实际销量"
            min={0}
            value={sales}
            onChange={(v) => setSales(v ?? 0)}
          />
        </div>
        <div className="form-field">
          <label>升级材料的机会成本 / G</label>
          <InputNumber
            precision={0}
            aria-label="升级机会成本"
            min={0}
            value={investment}
            onChange={(v) => setInvestment(v ?? 0)}
          />
        </div>
      </div>
      <div className="stats-pair">
        <Statistic title="每盘售价增加" value={gain} suffix="G" />
        <Statistic title="同销量下每日增加" value={daily} suffix="G" />
        <Statistic
          title="理论回本时间"
          value={daily > 0 ? number(investment / daily) : "无法回本"}
          suffix={daily > 0 ? "日" : undefined}
        />
      </div>
      <p className="muted">
        机会成本由你填写：升级消耗的原料本可拿去做菜或留库存。这里只计算售价增量，不含份数增多、销量改变、材料采购与营业费用变化；目标等级不高于原等级时不计算正向回本。
      </p>
      <SourceLinks ids={[recipe.source]} />
    </Card>
  );
}

export default function App() {
  return (
    <AntApp>
      <GuideApp />
    </AntApp>
  );
}
function GuideApp() {
  const [page, setPage] = useState<SectionId>(() => {
    const id = location.hash.slice(1);
    return sections.some((s) => s.id === id) ? (id as SectionId) : "overview";
  });
  const [phase, setPhase] = useSaved<string>("bluehole.phase.v1", "all");
  const [spoilers, setSpoilers] = useSaved<boolean>(
    "bluehole.spoilers.v1",
    false,
  );
  const [saved, setSaved] = useSaved<string[]>("bluehole.bookmarks.v1", []);
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [calcRecipe, setCalcRecipe] = useState("tropical");
  const searchRef = useRef<InputRef>(null);
  const navigate = (id: SectionId) => {
    setPage(id);
    location.hash = id;
    setQuery("");
    setSavedOnly(false);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const hash = () => {
      const id = location.hash.slice(1);
      if (sections.some((s) => s.id === id)) setPage(id as SectionId);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setQuery("");
    };
    window.addEventListener("hashchange", hash);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("keydown", key);
    };
  }, []);
  const toggle = (id: string) =>
    setSaved(
      saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id],
    );
  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          (phase === "all" || a.phases.includes(phase as Phase)) &&
          (spoilers || !a.spoiler) &&
          (!savedOnly || saved.includes(a.id)) &&
          (!query.trim() ||
            `${a.title} ${a.lead} ${a.steps.join(" ")} ${a.tip}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())),
      ),
    [phase, spoilers, savedOnly, saved, query],
  );
  const active = sections.find((s) => s.id === page)!;
  const searchMode = !!query.trim() || savedOnly;
  const matchedRecipes = recipes.filter(
    (r) =>
      !savedOnly &&
      !!query.trim() &&
      (phase === "all" || r.phase === phase) &&
      `${r.name} ${r.en} ${r.role} ${r.unlock} ${r.ingredients.map(([n]) => n).join(" ")}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const plan = (id: string) => {
    setCalcRecipe(id);
    navigate("tools");
  };
  const sidebar = (
    <>
      <div className="brand">
        <div className="brand-symbol">
          <CompassOutlined />
        </div>
        <div>
          <strong>BLUE HOLE</strong>
          <span>深蓝攻略手册</span>
        </div>
      </div>
      <div className="nav-caption">DAVE THE DIVER / FIELD NOTES</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={searchMode ? [] : [page]}
        items={sections.map((s, i) => ({
          key: s.id,
          icon: icons[i],
          label: s.title,
        }))}
        onClick={({ key }) => navigate(key as SectionId)}
      />
      <div className="sidebar-bottom">
        <span className="status-dot" /> LOCAL FIELD GUIDE
        <p>
          研究整理 · 2026.10.09
          <br />
          本体攻略 + 扩展附录
        </p>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      <Drawer
        title="深蓝攻略目录"
        placement="left"
        open={mobile}
        onClose={() => setMobile(false)}
        styles={{ body: { padding: 0, background: "#102e43" } }}
      >
        {sidebar}
      </Drawer>
      <div className="workspace">
        <header className="topbar">
          <Button
            className="mobile-menu"
            aria-label="打开导航目录"
            icon={<MenuOutlined />}
            onClick={() => setMobile(true)}
          />
          <div className="breadcrumb">
            攻略手册 <span>/</span> {searchMode ? "检索结果" : active.title}
          </div>
          <Input
            ref={searchRef}
            aria-label="搜索攻略"
            className="global-search"
            placeholder="搜索菜谱、员工、装备…"
            prefix={<SearchOutlined />}
            suffix={<kbd>Ctrl K</kbd>}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Tooltip title="只看收藏的攻略">
            <Button
              type={savedOnly ? "primary" : "text"}
              icon={<HeartOutlined />}
              aria-label="查看收藏"
              onClick={() => {
                setSavedOnly(!savedOnly);
                setQuery("");
              }}
            >
              <Badge count={saved.length} size="small" color="#087f8c">
                <span className="save-label">收藏</span>
              </Badge>
            </Button>
          </Tooltip>
        </header>
        <main>
          <div className="page-controls">
            <Space size={8} wrap>
              <Tag variant="filled" color="cyan">
                本体为主
              </Tag>
              <span className="muted small">资料核对 2026.10.09</span>
            </Space>
            <Space>
              <span className="muted small">Boss 身份与打法剧透</span>
              <Switch
                aria-label="显示Boss剧透"
                checked={spoilers}
                onChange={setSpoilers}
                size="small"
              />
            </Space>
          </div>
          {!searchMode && page === "overview" ? (
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
                    text: "热带套餐稳定经营，绯红鱼卷释放农田与调料。",
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
          ) : (
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
                            满级每盘 <strong>{number(r.max)} G</strong>，每批{" "}
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
          )}
          <footer>
            <span className="mono">BLUE HOLE / FIELD NOTES</span>
            <span>非官方攻略 · 本地保存收藏与清单 · 数据来源可查</span>
            <Button size="small" type="text" onClick={() => window.print()}>
              打印当前页
            </Button>
          </footer>
        </main>
      </div>
    </div>
  );
}
function PhaseFilter({
  phase,
  setPhase,
}: {
  phase: string;
  setPhase: (v: string) => void;
}) {
  return (
    <Segmented
      aria-label="适用阶段筛选"
      value={phase}
      onChange={(v) => setPhase(String(v))}
      options={[
        { value: "all", label: "全部阶段" },
        ...Object.entries(phases).map(([value, label]) => ({ value, label })),
      ]}
    />
  );
}
function SourcesPage() {
  return (
    <>
      <Alert
        showIcon
        type="info"
        title="依据与推荐分开阅读"
        description="官方页面用于核对发布与内容范围；Wiki、社区实测用于玩法数据；组合、优先级与日程是本文据此给出的建议。没有对所有平台和补丁进行实机验证，不承诺唯一全局最优。"
      />
      <Collapse
        className="methodology"
        defaultActiveKey={["scope"]}
        items={[
          {
            key: "scope",
            label: "版本、译名与“最优”定义",
            children: (
              <>
                <p>
                  检索整理日期：2026-10-09。本体完整玩法为主，丛林为可执行附录；未宣称覆盖所有联动的全收集或全部新料理。中文名仅用于阅读，容易混淆的鱼和员工保留英文名。
                </p>
                <p>
                  本文把最优拆为：省操作、稳定持续收入、活捉效率、推进速度和收集便利。推荐取决于已解锁内容、材料与员工等级；数值表使用代表性菜谱，非全量游戏数据库。
                </p>
                <p>
                  员工经理的等级门槛基于旧版实测，换人后以游戏显示确认。绯红鱼卷的美味值在部分旧网站有冲突，本页采用与现行
                  Wiki 汇总一致的 258；其他关键价格和份数交叉核对。
                </p>
              </>
            ),
          },
          {
            key: "calc",
            label: "计算器公式与限制",
            children: (
              <>
                <p>
                  预计销量 = floor(主店客流 × 服务率) + floor(分店客流 ×
                  服务率)。各店批次数单独按销量 / 每批盘数向上取整，原料 =
                  总批次数 × 每批用量。
                </p>
                <p>
                  料理收入 = 实际盘数 × 单份价 + 加成盘数 × 单份价 × (倍率 −
                  1)。加成盘数不超过实际盘数；总收入不包含饮料、小费或随机增产。扣成本后的数值只扣除你填写的成本。
                </p>
                <p>
                  可持续盘数 = min(floor(各原料日产出 / 每批用量)) ×
                  每批盘数。它是供给瓶颈模型，不是游戏繁殖概率模型。
                </p>
              </>
            ),
          },
          {
            key: "storage",
            label: "本地数据与离线使用",
            children: (
              <p>
                收藏、阶段筛选、剧透偏好和清单存储在当前浏览器
                localStorage。没有账号或上传请求；应用正常使用不需要实时网络。打开来源链接仍需联网。清理浏览器站点数据会清除这些记录，计算盘数不自动保存。
              </p>
            ),
          },
        ]}
      />
      <List
        className="source-list"
        dataSource={sources}
        renderItem={(s, i) => (
          <List.Item>
            <div className="source-item">
              <span className="source-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <Space wrap>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <strong>{s.name}</strong> <ExportOutlined />
                  </a>
                  <Tag>{s.type}</Tag>
                </Space>
                <p>{s.note}</p>
              </div>
            </div>
          </List.Item>
        )}
      />
      <p className="muted">
        CJ Bot 员工指南的可读镜像：
        <a
          href="https://steamsolo.com/guide/staff-hiring-training-and-arrangement-dave-the-diver/"
          target="_blank"
          rel="noreferrer"
        >
          SteamSolo
        </a>
        。所有正文均为中文归纳与建议，未复制整篇原文；插画为原创示意
        SVG，不是游戏地图。
      </p>
      <SourceLinks ids={["official", "jungle"]} />
    </>
  );
}
