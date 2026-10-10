import { Segmented } from "antd";
import { phases } from "../data";

export function PhaseFilter({
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
