import { Calculators } from "../components/calculators/Calculators";
import { PageHeading } from "../components/PageHeading";
import { useGuideContext } from "../hooks/useGuideContext";

export function ToolsPage() {
  const { calcRecipe, setCalcRecipe } = useGuideContext();
  return (
    <>
      <PageHeading />
      <Calculators selected={calcRecipe} setSelected={setCalcRecipe} />
    </>
  );
}
