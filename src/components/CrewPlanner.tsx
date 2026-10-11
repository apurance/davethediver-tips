import { useState } from "react";
import { Card, Segmented, Table, Alert } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { SourceLinks } from "./SourceLinks";
import { EntityLink } from "./EntityLink";

export function CrewPlanner() {
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
          { title: "推荐人员", dataIndex: "crew", width: 230, render: (crew: string) => <>{crew.split(/ (\+|\/) /).map((part, index) => part === "+" || part === "/" ? <span key={index}> {part} </span> : <EntityLink key={index} id={`staff/${part === "El Niño" ? "el-nino" : part.toLowerCase()}`} />)}</> },
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
