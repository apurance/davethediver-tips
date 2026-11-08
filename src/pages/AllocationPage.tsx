import { useMemo, useState } from "react";
import { Alert, Button, Card, Collapse, Empty, Input, InputNumber, Modal, Popconfirm, Segmented, Select, Space, Switch, Table, Tag } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { database, getEntity, name, searchable } from "../catalog";
import { matchesParty, partyNames } from "../events";
import { EntityLink } from "../components/EntityLink";
import { PageHeading } from "../components/PageHeading";
import { useSaved } from "../hooks/useSaved";
import { calculateDemand, createAllocationPlan, defaultBatchServings, materialSource, poolNames, resolvedMenu, scheduleDays, storeNames, stores, partyIds } from "../allocation";
import { addAllocationPlan, createAllocationPlans, removeAllocationPlan, restoreAllocationPlans, updateAllocationPlan } from "../allocationPlans";
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
  const fieldPrefix = `${scenario === "daily" ? "日常供应" : partyNames[scenario]}${storeNames[store]}`;
  function change(dishes: DishAllocation[], inheritDaily = slot.inheritDaily) {
    const next = { inheritDaily, dishes };
    update(scenario === "daily" ? { ...plan, daily: { ...plan.daily, [store]: next } } :
      { ...plan, parties: { ...plan.parties, [scenario]: { ...plan.parties[scenario], [store]: next } } });
  }
  function edit(id: string, patch: Partial<DishAllocation>) { change(slot.dishes.map(row => row.id === id ? { ...row, ...patch } : row)); }
  const total = rows.reduce((sum, row) => sum + row.servings, 0);
  const options = recipeOptions.filter(option => !onlyParty || scenario === "daily" || matchesParty(getEntity(option.value)!, scenario));
  return <Card className="allocation-menu" title={<Space><span>{storeNames[store]}</span><Tag>{total} 份／晚</Tag></Space>}
    extra={scenario !== "daily" && <Space size="small"><span className="small">沿用日常</span><Switch aria-label={`${fieldPrefix}沿用日常`} checked={inherited}
      onChange={checked => change(slot.dishes, checked)} /></Space>}>
    {inherited ? <p className="muted">自动使用{storeNames[store]}日常菜单。关闭“沿用日常”后可单独配置此派对。</p> :
      scenario !== "daily" && <div className="allocation-filter"><Switch size="small" checked={onlyParty} onChange={setOnlyParty} aria-label={`${fieldPrefix}仅显示派对菜`} /><span>选菜时仅显示本派对菜谱</span></div>}
    {rows.length === 0 && <p className="muted small allocation-menu-empty">{inherited ? "日常尚未配置菜品" : "尚未分配菜品"}</p>}
    <div className="allocation-dishes">
      {rows.map((row, index) => {
        const recipe = getEntity(row.recipeId);
        const batchServings = recipe?.type === "recipe" ? defaultBatchServings(recipe) : null;
        const batches = batchServings ? Math.ceil(row.servings / batchServings) : null;
        return <div className="allocation-dish" key={row.id}>
          <div className="allocation-dish-row">
            {inherited ? <strong><EntityLink id={row.recipeId} /></strong> : <Select
              aria-label={`${fieldPrefix}菜品 ${index + 1}`} className="allocation-recipe-select" showSearch
              placeholder="搜索菜名或食材" value={row.recipeId || undefined}
              options={recipeOptions.filter(option => option.value === row.recipeId || (options.includes(option) && !rows.some(other => other.id !== row.id && other.recipeId === option.value)))}
              filterOption={(input, option) => !!option?.search.includes(input.toLocaleLowerCase().trim())}
              onChange={recipeId => {
                const recipe = getEntity(recipeId);
                edit(row.id, { recipeId, batchServings: recipe?.type === "recipe" ? defaultBatchServings(recipe) : null });
              }} />}
            <InputNumber className="allocation-servings" aria-label={`${fieldPrefix}菜品 ${index + 1}供应份数`} title="供应份数" suffix="份" min={0} max={9999} precision={0} value={row.servings} disabled={inherited}
              onChange={value => edit(row.id, { servings: bounded(value ?? 0, 0, 9999) })} />
            <span className="allocation-batch-inline" title={batchServings ? `满级每批 ${batchServings} 份，可供 ${batches! * batchServings} 份` : "满级出餐数据缺失"}>{batches === null ? "批次未知" : `${batches} 批 × ${batchServings} 份`}</span>
            {recipe && scenario !== "daily" && !matchesParty(recipe, scenario) && <span className="allocation-warning" title={`此菜未标记为${partyNames[scenario]}菜，仅供普通客人。`} aria-label="非本派对菜">!</span>}
            {!inherited && <Button type="text" danger icon={<DeleteOutlined />} aria-label={`删除${fieldPrefix}菜品 ${index + 1}`} onClick={() => change(slot.dishes.filter(item => item.id !== row.id))} />}
          </div>
        </div>;
      })}
    </div>
    {!inherited && <Button block type="dashed" aria-label={`${fieldPrefix}添加菜品`} icon={<PlusOutlined />} onClick={() => change([...slot.dishes, {
      id: globalThis.crypto?.randomUUID?.() ?? `dish-${Date.now()}-${Math.random().toString(36).slice(2)}`, recipeId: "", servings: 1, batchServings: null,
    }])}>添加菜品</Button>}
  </Card>;
}

export function AllocationPage() {
  const [saved, setSaved] = useSaved<unknown>("blue-hole-allocation-v1", createAllocationPlans());
  const library = useMemo(() => restoreAllocationPlans(saved), [saved]);
  const active = library.plans.find(entry => entry.id === library.activeId)!;
  const plan = active.plan;
  const updatePlan = (plan: AllocationPlan) => setSaved((current: unknown) => updateAllocationPlan(restoreAllocationPlans(current), active.id, plan));
  const [dialog, setDialog] = useState<"new" | "copy" | "rename" | null>(null);
  const [planName, setPlanName] = useState("");
  const nameError = !planName.trim() ? "请输入方案名称" : library.plans.some(entry => entry.name === planName.trim() && (dialog !== "rename" || entry.id !== active.id)) ? "已有同名方案，请换一个名称" : "";
  function openDialog(kind: "new" | "copy" | "rename") {
    let nextName = kind === "rename" ? active.name : kind === "copy" ? `${active.name} 副本`.slice(0, 58) : "新方案";
    const base = nextName;
    for (let i = 2; kind !== "rename" && library.plans.some(entry => entry.name === nextName); i++) nextName = `${base} ${i}`;
    setPlanName(nextName);
    setDialog(kind);
  }
  function saveDialog() {
    if (nameError) return;
    if (dialog === "rename") setSaved({ ...library, plans: library.plans.map(entry => entry.id === active.id ? { ...entry, name: planName.trim() } : entry) });
    else setSaved(addAllocationPlan(library, globalThis.crypto?.randomUUID?.() ?? `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`, planName, dialog === "copy" ? active.id : undefined));
    setDialog(null);
  }
  const [scenario, setScenario] = useState("daily");
  const [view, setView] = useState<"service" | "average" | "cycle">("average");
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
      <span>经营方案</span><Select aria-label="经营方案" className="allocation-scenario" value={active.id} options={library.plans.map(entry => ({ value: entry.id, label: entry.name }))}
        onChange={activeId => setSaved({ ...library, activeId })} />
      <Button onClick={() => openDialog("new")} icon={<PlusOutlined />}>新建方案</Button>
      <Button onClick={() => openDialog("copy")}>复制方案</Button>
      <Button onClick={() => openDialog("rename")}>重命名</Button>
      <span className="muted small">自动保存在此浏览器</span>
    </Space><Space wrap><Popconfirm title={`清空「${active.name}」的分配？`} description="仅重置当前方案的菜单和周期设置。" okText="清空" cancelText="取消" onConfirm={() => updatePlan(createAllocationPlan())}>
      <Button>重置当前方案</Button>
    </Popconfirm><Popconfirm title={`删除方案「${active.name}」？`} description="删除后不可恢复，其他方案不受影响。" okText="删除" cancelText="取消" onConfirm={() => setSaved(removeAllocationPlan(library, active.id))}>
      <Button danger disabled={library.plans.length <= 1}>删除方案</Button>
    </Popconfirm></Space></div>
    <Modal title={dialog === "rename" ? "重命名方案" : dialog === "copy" ? "复制当前方案" : "新建经营方案"} open={dialog !== null} onCancel={() => setDialog(null)} onOk={saveDialog} okText="保存" cancelText="取消" okButtonProps={{ disabled: !!nameError }}>
      <label>方案名称<Input aria-label="方案名称" maxLength={64} value={planName} onChange={event => setPlanName(event.target.value)} onPressEnter={saveDialog} /></label>
      {nameError && <p className="allocation-warning small">{nameError}</p>}
    </Modal>
    <p className="muted small">日常与全部派对可同时分配。新方案的派对默认独立配置，空菜单不计用料；需要时可手动开启“沿用日常”。统一按满级菜谱份数计算。每店分别向上取整制作批次，不计员工额外出餐或升级消耗。</p>
    <nav className="allocation-jump-links" aria-label="跳转菜单">{scenarioOptions.map(item => <a key={item.value} href={`#menu-${item.value}`}>{item.label}</a>)}<a href="#allocation-requirements">备货需求 ↓</a></nav>
    {scenarioOptions.map(item => <section className="allocation-section" id={`menu-${item.value}`} key={`${active.id}-${item.value}`} aria-labelledby={`heading-${item.value}`}>
      <div className="allocation-section-heading"><h2 id={`heading-${item.value}`}>{item.label}</h2><Button type="link" href="#allocation-requirements" onClick={() => { setScenario(item.value); setView("service"); }}>查看{item.label}单晚用料</Button></div>
      <div className="allocation-menus">{stores.map(store => <MenuEditor key={store} plan={plan} store={store} scenario={item.value} update={updatePlan} />)}</div>
    </section>)}

    <Collapse className="allocation-cycle" items={[{ key: "schedule", label: `日均折算设置 · ${plan.days} 天 / ${schedule.partyDays} 场派对 · 可调整假设`, children: <>
      <Alert type="info" showIcon title="40 天只是规划假设，不是固定轮回"
        description={<>旧版玩家记录为约每 5 天一次，首轮后派对随机；没有确认八类等概率或 40 天必定各来一次。默认用 40 天、各一次做长期预算，可按存档实测修改，剧情推进可能影响日期。<a href="https://steamcommunity.com/app/1868140/discussions/0/3806156942409507760/" target="_blank" rel="noreferrer">查看社区记录</a>。</>} />
      <label className="allocation-days">规划天数<InputNumber aria-label="规划天数" min={1} max={3650} precision={0} value={plan.days} onChange={value => { if (value !== null) updatePlan({ ...plan, days: bounded(value, 1, 3650) }); }} /></label>
      <div className="allocation-occurrences">{partyIds.map(id => <label key={id}>{partyNames[id]}（次）<InputNumber aria-label={`${partyNames[id]}次数`} min={0} max={3650} precision={0} value={plan.occurrences[id]}
        onChange={value => updatePlan({ ...plan, occurrences: { ...plan.occurrences, [id]: bounded(value ?? 0, 0, 3650) } })} /></label>)}</div>
      <p className="allocation-formula">日均材料 =［{Math.max(0, schedule.normalDays)} 个普通日 × 日常用量 ＋ Σ（各派对次数 × 该派对单晚用量）］÷ {plan.days} 天</p>
      <p className="muted small">派对默认使用独立菜单，空菜单不计用料，仅开启“沿用日常”时继承日常菜单；未发生的派对填 0。日均保留小数，单晚备货按完整批次计算。同一菜谱在一家店合并取整，两家店分别制作。</p>
    </> }]} />
    {!schedule.valid && <Alert type="error" showIcon title="派对总次数超过规划天数" description="请在日均折算设置中调整；当前单晚备货仍可查看。" />}
    <div className="allocation-results-heading" id="allocation-requirements"><div><span className="eyebrow">SUPPLY REQUIREMENTS</span><h2>{active.name} · 备货需求</h2></div>
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
