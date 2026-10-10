import type { Recipe } from "../../data";
import { useState } from "react";
import { Card, InputNumber, Statistic } from "antd";
import { formatNumber } from "../../utils/formatNumber";
import { SourceLinks } from "../SourceLinks";

export function InvestmentCalculator({ recipe }: { recipe: Recipe }) {
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
          value={daily > 0 ? formatNumber(investment / daily) : "无法回本"}
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
