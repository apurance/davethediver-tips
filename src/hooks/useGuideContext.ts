import { useOutletContext } from "react-router";
import type { GuideState } from "./useGuideState";

export function useGuideContext() {
  return useOutletContext<GuideState>();
}
