import { PhaseFilter } from "./PhaseFilter";
import { useGuideContext } from "../hooks/useGuideContext";

interface PageHeadingProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  filter?: boolean;
}

export function PageHeading({
  eyebrow,
  title,
  description,
  filter = false,
}: PageHeadingProps) {
  const { active, phase, setPhase } = useGuideContext();
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{eyebrow ?? active.en}</span>
        <h1>{title ?? active.title}</h1>
        <p>{description ?? active.desc}</p>
      </div>
      {filter && (
        <div className="detail-filter">
          <PhaseFilter phase={phase} setPhase={setPhase} />
          <span className="muted small">仅筛选适用阶段</span>
        </div>
      )}
    </>
  );
}
