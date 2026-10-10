import { recipes } from "../../data";
import { useState } from "react";
import { calculateMenu, calculateSupply } from "../../calculations";
import {
  Tabs,
  Card,
  Select,
  Slider,
  InputNumber,
  Space,
  Button,
  Statistic,
  Divider,
  Alert,
  Progress,
} from "antd";
import { formatNumber } from "../../utils/formatNumber";
import { SourceLinks } from "../SourceLinks";
import { InvestmentCalculator } from "./InvestmentCalculator";

export function Calculators({
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
                      Lv.{level} · 每份 <strong>{formatNumber(price)} G</strong> ·
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
                        {formatNumber(revenue - cost)} G
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
