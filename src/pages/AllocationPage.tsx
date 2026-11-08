import { useMemo, useState } from "react";
import { Alert, Button, Card, Collapse, Empty, InputNumber, Popconfirm, Segmented, Select, Space, Switch, Table, Tag } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { database, getEntity, name, searchable } from "../catalog";
import { matchesParty, partyNames } from "../events";
import { EntityLink } from "../components/EntityLink";
import { PageHeading } from "../components/PageHeading";
import { useSaved } from "../hooks/useSaved";
import { calculateDemand, createAllocationPlan, defaultBatchServings, materialSource, poolNames, resolvedMenu, restoreAllocationPlan, scheduleDays, storeNames, stores, partyIds } from "../allocation";
import type { AllocationPlan, DishAllocation, MaterialDemand, Store } from "../allocation";
import "./allocation.css";

const format = (value: number) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 3 }).format(value);
const bounded = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.trunc(value)));
const recipeOptions = database.recipes.map(recipe => ({ value: recipe.id, label: name(recipe.id), search: searchable(recipe) }));
const scenarioOptions = [{ value: "daily", label: "日常供应" }, ...partyIds.map(value => ({ value, label: partyNames[value] }))];

function MenuEditor({ plan, store, scenario, update }: {
  plan: AllocationPlan; store: Store; scenario: string; update: (plan: AllocationPlan) => void;
}) {
  const slot = scenario === "daily" ? plan.daily[store] : plan.parties[scenario][store];
  const inherited = scenario !== "daily" && slot.inheritDaily;
  const rows = resolvedMenu(plan, scenario, store);
  const [onlyParty, setOnlyParty] = useState(true);
  function change(dishes: DishAllocation[], inheritDaily = slot.inheritDaily) {
    const next = { inheritDaily, dishes };
    update(scenario === "daily" ? { ...plan, daily: { ...plan.daily, [store]: next } } :
      { ...plan, parties: { ...plan.parties, [scenario]: { ...plan.parties[scenario], [store]: next } } });
  }
  function edit(id: string, patch: Partial<DishAllocation>) { change(slot.dishes.map(row => row.id === id ? { ...row, ...patch } : row)); }
  const total = rows.reduce((sum, row) => sum + row.servings, 0);
  const options = recipeOptions.filter(option => !onlyParty || scenario === "daily" || matchesParty(getEntity(option.value)!, scenario));
  return <Card className="allocation-menu" title={<Space><span>{storeNames[store]}</span><Tag>{total} 份／晚</Tag></Space>}
    extra={scenario !== "daily" && <Space size="small"><span className="small">沿用日常</span><Switch aria-label={`${storeNames[store]}沿用日常`} checked={inherited}
      onChange={checked => change(slot.dishes, checked)} /></Space>}>
    {inherited ? <p className="muted">自动使用{storeNames[store]}日常菜单。关闭“沿用日常”后可单独配置此派对。</p> :
      scenario !== "daily" && <div className="allocation-filter"><Switch size="small" checked={onlyParty} onChange={setOnlyParty} aria-label={`${storeNames[store]}仅显示派对菜`} /><span>选菜时仅显示本派对菜谱</span></div>}
    {rows.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={inherited ? "日常尚未配置菜品" : "添加菜品，开始安排供应"} />}
    <div className="allocation-dishes">
      {rows.map((row, index) => {
        const recipe = getEntity(row.recipeId);
        const batches = row.batchServings ? Math.ceil(row.servings / row.batchServings) : null;
        return <div className="allocation-dish" key={row.id}>
          <div className="allocation-dish-top">
            {inherited ? <strong><EntityLink id={row.recipeId} /></strong> : <Select
              aria-label={`${storeNames[store]}菜品 ${index + 1}`} className="allocation-recipe-select" showSearch
              placeholder="搜索菜名或食材" value={row.recipeId || undefined}
              options={recipeOptions.filter(option => option.value === row.recipeId || (options.includes(option) && !rows.some(other => other.id !== row.id && other.recipeId === option.value)))}
              filterOption={(input, option) => !!option?.search.includes(input.toLocaleLowerCase().trim())}
              onChange={recipeId => {
                const recipe = getEntity(recipeId);
                edit(row.id, { recipeId, batchServings: recipe?.type === "recipe" ? defaultBatchServings(recipe) : null });
              }} />}
            {!inherited && <Button type="text" danger icon={<DeleteOutlined />} aria-label={`删除${storeNames[store]}菜品 ${index + 1}`} onClick={() => change(slot.dishes.filter(item => item.id !== row.id))} />}
          </div>
          <div className="allocation-dish-fields">
            <label>供应份数<InputNumber aria-label={`${storeNames[store]}菜品 ${index + 1}供应份数`} min={0} max={9999} precision={0} value={row.servings} disabled={inherited}
              onChange={value => edit(row.id, { servings: bounded(value ?? 0, 0, 9999) })} /></label>
            <label>每批份数<InputNumber aria-label={`${storeNames[store]}菜品 ${index + 1}每批份数`} min={1} max={999} precision={0} value={row.batchServings} disabled={inherited}
              placeholder="请填写" onChange={value => edit(row.id, { batchServings: value === null ? null : bounded(value, 1, 999) })} /></label>
            <div className="allocation-batches"><strong>{batches === null ? "—" : batches}</strong><span>批次{batches !== null && row.batchServings ? ` · 可供 ${batches * row.batchServings} 份` : "待确认"}</span></div>
          </div>
          {recipe?.type === "recipe" && <div className="small muted">出餐参考：初始 {recipe.stats.baseServings ?? "未知"} ／满级 {recipe.stats.maxServings ?? "未知"} 份。<EntityLink id={recipe.id} /></div>}
          {recipe && scenario !== "daily" && !matchesParty(recipe, scenario) && <div className="allocation-warning small">此菜未标记为{partyNames[scenario]}菜，可作为普通客人用餐，派对客人需其他合适菜品。</div>}
        </div>;
      })}
    </div>
    {!inherited && <Button block type="dashed" icon={<PlusOutlined />} onClick={() => change([...slot.dishes, {
      id: globalThis.crypto?.randomUUID?.() ?? `dish-${Date.now()}-${Math.random().toString(36).slice(2)}`, recipeId: "", servings: 1, batchServings: null,
    }])}>添加菜品</Button>}
  </Card>;
}

export function AllocationPage() {
  const [saved, setSaved] = useSaved<unknown>("blue-hole-allocation-v1", createAllocationPlan());
  const plan = useMemo(() => restoreAllocationPlan(saved), [saved]);
  const [scenario, setScenario] = useState("daily");
  const [view, setView] = useState<"service" | "average" | "cycle">("service");
  const [grade, setGrade] = useState<"meat2" | "meat3">("meat2");
  const result = useMemo(() => calculateDemand(plan, view, scenario), [plan, view, scenario]);
  const schedule = scheduleDays(plan);
  const groups = [...Object.entries(poolNames), ["ingredients", "其他辅料"]].map(([id, title]) => ({
    id, title, rows: result.rows.filter(row => materialSource(row.id).group === id),
  })).filter(group => group.rows.length > 0);
  const timeUnit = view === "average" ? "／日均" : view === "cycle" ? "／周期" : "／晚";
  const columns = [
    { title: "鱼类／材料", dataIndex: "id", key: "id", render: (id: string) => {
      const source = materialSource(id);
      return <><EntityLink id={id} />{source.note && <div className="small muted">{source.note}</div>}
        {source.group === "external" && source.fishIds.length > 0 && <div className="small muted">来源：{source.fishIds.map((fishId, i) => <span key={fishId}>{i > 0 && "、"}<EntityLink id={fishId} /></span>)}</div>}</>;
    } },
    { title: `主店${timeUnit}`, dataIndex: "main", key: "main", width: 110, render: format },
    { title: `分店${timeUnit}`, dataIndex: "branch", key: "branch", width: 110, render: format },
    { title: `材料合计${timeUnit}`, dataIndex: "total", key: "total", width: 135, render: (v: number) => <strong>{format(v)}</strong> },
    { title: `折合鱼数${timeUnit}`, key: "fish", width: 175, render: (_: unknown, row: MaterialDemand) => {
      const fish = getEntity(row.id);
      if (fish?.type !== "fish") return <span className="muted">—</span>;
      const meat = fish.stats[grade];
      if (!meat || meat <= 0 || !Number.isFinite(meat)) return <span className="muted">产肉量待确认</span>;
      return <>{view === "average" ? `≈ ${format(row.total / meat)}` : Math.ceil(row.total / meat)} 条<div className="small muted">按 {meat} 材料／条估算</div></>;
    } },
  ];

  return <div className="allocation-page">
    <PageHeading title="经营分配" eyebrow="OPERATIONS PLANNER" description="安排两家店的日常与派对菜单，自动汇总鱼池需求和其他辅料。" />
    <div className="allocation-toolbar"><Space wrap>
      <Select aria-label="经营场景" className="allocation-scenario" value={scenario} options={scenarioOptions} onChange={setScenario} />
      <span className="muted small">自动保存在此浏览器</span>
    </Space><Popconfirm title="清空所有经营分配？" description="日常、派对菜单和周期设置都会重置。" okText="清空" cancelText="取消" onConfirm={() => setSaved(createAllocationPlan())}>
      <Button>重置方案</Button>
    </Popconfirm></div>
    <p className="muted small">填写希望供应的成品份数；每批份数默认采用满级菜谱，可按当前等级修改。每店分别向上取整制作批次，不计员工额外出餐或升级消耗。派对菜单替换当晚的日常菜单。</p>
    <div className="allocation-menus">{stores.map(store => <MenuEditor key={`${scenario}-${store}`} plan={plan} store={store} scenario={scenario} update={setSaved} />)}</div>

    <Collapse className="allocation-cycle" items={[{ key: "schedule", label: `日均折算设置 · ${plan.days} 天 / ${schedule.partyDays} 场派对 · 可调整假设`, children: <>
      <Alert type="info" showIcon title="40 天只是规划假设，不是固定轮回"
        description={<>旧版玩家记录为约每 5 天一次，首轮后派对随机；没有确认八类等概率或 40 天必定各来一次。默认用 40 天、各一次做长期预算，可按存档实测修改，剧情推进可能影响日期。<a href="https://steamcommunity.com/app/1868140/discussions/0/3806156942409507760/" target="_blank" rel="noreferrer">查看社区记录</a>。</>} />
      <label className="allocation-days">规划天数<InputNumber aria-label="规划天数" min={1} max={3650} precision={0} value={plan.days} onChange={value => { if (value !== null) setSaved({ ...plan, days: bounded(value, 1, 3650) }); }} /></label>
      <div className="allocation-occurrences">{partyIds.map(id => <label key={id}>{partyNames[id]}（次）<InputNumber aria-label={`${partyNames[id]}次数`} min={0} max={3650} precision={0} value={plan.occurrences[id]}
        onChange={value => setSaved({ ...plan, occurrences: { ...plan.occurrences, [id]: bounded(value ?? 0, 0, 3650) } })} /></label>)}</div>
      <p className="allocation-formula">日均材料 =［{Math.max(0, schedule.normalDays)} 个普通日 × 日常用量 ＋ Σ（各派对次数 × 该派对单晚用量）］÷ {plan.days} 天</p>
      <p className="muted small">未单独配置的店铺沿用日常；未发生的派对填 0。日均保留小数，单晚备货按完整批次计算。同一菜谱同一出餐数在一家店合并取整，两家店分别制作。</p>
    </> }]} />
    {!schedule.valid && <Alert type="error" showIcon title="派对总次数超过规划天数" description="请在日均折算设置中调整；当前单晚备货仍可查看。" />}
    <div className="allocation-results-heading"><div><span className="eyebrow">SUPPLY REQUIREMENTS</span><h2>备货需求</h2></div>
      <Segmented aria-label="备货统计范围" value={view} onChange={value => setView(value as typeof view)} options={[
        { value: "service", label: "当前单晚" }, { value: "average", label: "长期日均" }, { value: "cycle", label: "周期总量" },
      ]} />
    </div>
    <div className="allocation-toolbar"><p className="muted small">{view === "service" ? `${scenario === "daily" ? "日常" : partyNames[scenario]} · 两店当晚完整备货` : `${plan.days} 天全部日常及派对菜单 · ${view === "average" ? "长期平均需求，不保证随机派对前库存充足" : "规划周期总需求"}`}</p>
      <Select aria-label="鱼数换算品质" value={grade} onChange={setGrade} options={[{ value: "meat2", label: "鱼数参考：二星产肉量" }, { value: "meat3", label: "鱼数参考：三星产肉量" }]} /></div>
    {result.warnings.length > 0 && <Alert type="warning" showIcon title="有用料未能计算，以下合计不完整" description={<ul>{result.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>} />}
    {groups.length === 0 ? <Card><Empty description={result.warnings.length ? "请补齐上方缺失信息后查看需求" : "添加供应菜品后，这里会自动列出鱼类和辅料数量"} /></Card> :
      groups.map(group => <Card key={group.id} className="allocation-supply" title={<Space>{group.title}<Tag>{group.rows.length} 种</Tag></Space>}>
        <Table rowKey="id" size="small" pagination={false} dataSource={group.rows} columns={group.id === "ingredients" ? columns.slice(0, 4) : columns} scroll={{ x: group.id === "ingredients" ? 570 : 760 }} />
      </Card>)}
    <p className="muted small allocation-footnote">鱼类按本地栖息区域与夜行标签归组，特殊来源另列；分组不保证所有鱼都可养殖。材料合计是配方单位，折合鱼数采用图鉴产肉量作为参考，实际以鱼池出货为准，不代表需要保留的种鱼数量。不同部位不合并换算，繁殖数量与鱼池容量未纳入此表。</p>
  </div>;
}
