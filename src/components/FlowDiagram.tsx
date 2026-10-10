import { ArrowRightOutlined } from "@ant-design/icons";

export function FlowDiagram() {
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
