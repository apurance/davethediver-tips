import { createAllocationPlan, restoreAllocationPlan } from "./allocation.ts";
import type { AllocationPlan } from "./allocation.ts";

export interface NamedAllocationPlan { id: string; name: string; plan: AllocationPlan }
export interface AllocationPlans { version: 2; activeId: string; plans: NamedAllocationPlan[] }
export function createAllocationPlans(): AllocationPlans {
  return { version: 2, activeId: "default", plans: [{ id: "default", name: "方案 1", plan: createAllocationPlan() }] };
}
export function restoreAllocationPlans(value: unknown): AllocationPlans {
  const fallback = createAllocationPlans();
  if (!value || typeof value !== "object") return fallback;
  const saved = value as Partial<AllocationPlans>;
  // Preserve the previous single plan, including explicitly saved inheritance settings.
  if ((value as { version?: number }).version === 1) {
    fallback.plans[0].plan = restoreAllocationPlan(value);
    return fallback;
  }
  if (saved.version !== 2 || !Array.isArray(saved.plans)) return fallback;
  const ids = new Set<string>();
  const plans = saved.plans.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || !entry.id || ids.has(entry.id)) return [];
    ids.add(entry.id);
    return [{ id: entry.id, name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim().slice(0, 64) : `方案 ${index + 1}`,
      plan: restoreAllocationPlan(entry.plan) }];
  });
  if (!plans.length) return fallback;
  return { version: 2, activeId: plans.some(plan => plan.id === saved.activeId) ? saved.activeId! : plans[0].id, plans };
}
export function addAllocationPlan(library: AllocationPlans, id: string, name: string, sourceId?: string): AllocationPlans {
  if (!id || library.plans.some(entry => entry.id === id) || !name.trim()) return library;
  const source = library.plans.find(entry => entry.id === sourceId);
  return { ...library, activeId: id, plans: [...library.plans, { id, name: name.trim().slice(0, 64),
    plan: source ? structuredClone(source.plan) : createAllocationPlan() }] };
}
export function updateAllocationPlan(library: AllocationPlans, id: string, plan: AllocationPlan): AllocationPlans {
  return { ...library, plans: library.plans.map(entry => entry.id === id ? { ...entry, plan } : entry) };
}
export function removeAllocationPlan(library: AllocationPlans, id: string): AllocationPlans {
  if (library.plans.length <= 1) return library;
  const plans = library.plans.filter(entry => entry.id !== id);
  return { ...library, plans, activeId: library.activeId === id ? plans[0].id : library.activeId };
}
