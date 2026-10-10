import { useState } from "react";
import type { Recipe } from "../data";
import { recipes } from "../data";
import { Select, Table, Button, Tag, Card, Empty, Modal, Alert } from "antd";
import { formatNumber } from "../utils/formatNumber";
import { SourceLinks } from "./SourceLinks";

export function RecipeSection({
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
            render: (v) => <b>{formatNumber(v)} G</b>,
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
            render: (_, r) => `${formatNumber(r.max * r.servings)} G`,
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
                <b>{formatNumber(r.max)} G</b>
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
