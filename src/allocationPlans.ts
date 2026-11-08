import { createAllocationPlan, restoreAllocationPlan } from "./allocation.ts";
import type { AllocationPlan } from "./allocation.ts";

export interface AllocationPlanData { name: string; plan: AllocationPlan }
export interface NamedAllocationPlan extends AllocationPlanData { id: string }
export interface AllocationPlans { version: 2; activeId: string; plans: NamedAllocationPlan[] }
const exportFormat = "blue-hole-allocation-plan";

export function serializeAllocationPlan({ name, plan }: AllocationPlanData): string {
  return JSON.stringify({ format: exportFormat, version: 1, name, plan }, null, 2);
}

// Confirm the saved-data reader did not repair or discard any required plan fields.
function matchesRestoredData(input: unknown, restored: unknown): boolean {
  if (Array.isArray(restored)) {
    return Array.isArray(input) && input.length === restored.length &&
      restored.every((item, index) => matchesRestoredData(input[index], item));
  }
  if (restored !== null && typeof restored === "object") {
    if (input === null || typeof input !== "object" || Array.isArray(input)) return false;
    const data = input as Record<string, unknown>;
    return Object.entries(restored).every(([key, item]) => Object.hasOwn(data, key) && matchesRestoredData(data[key], item));
  }
  return input === restored;
}

export function parseAllocationPlanJson(text: string): AllocationPlanData {
  if (!text.trim()) throw new Error("请先复制或粘贴方案 JSON。");
  let input: unknown;
  try {
    input = JSON.parse(text.trim());
  } catch {
    throw new Error("JSON 格式有误，请检查内容是否复制完整。");
  }
  if (input === null || typeof input !== "object") throw new Error("请使用从经营分配导出的方案 JSON。");
  const data = input as { format?: unknown; version?: unknown; name?: unknown; plan?: unknown };
  if (data.format !== exportFormat) throw new Error("请使用从经营分配导出的方案 JSON。");
  if (data.version !== 1) throw new Error("此方案 JSON 的版本暂不支持。");
  if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 64) throw new Error("方案名称无效。");
  const plan = restoreAllocationPlan(data.plan);
  if (!matchesRestoredData(data.plan, plan)) throw new Error("方案数据不完整或含有无效字段。");
  return { name: data.name.trim(), plan };
}

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
function insertAllocationPlan(library: AllocationPlans, id: string, { name, plan }: AllocationPlanData): AllocationPlans {
  if (!id || library.plans.some(entry => entry.id === id) || !name.trim()) return library;
  return { ...library, activeId: id, plans: [...library.plans, { id, name: name.trim().slice(0, 64), plan }] };
}

export function addAllocationPlan(library: AllocationPlans, id: string, name: string, sourceId?: string): AllocationPlans {
  const source = library.plans.find(entry => entry.id === sourceId);
  return insertAllocationPlan(library, id, { name, plan: source ? structuredClone(source.plan) : createAllocationPlan() });
}

export function importAllocationPlan(library: AllocationPlans, id: string, data: AllocationPlanData): AllocationPlans {
  const existingNames = new Set(library.plans.map(entry => entry.name));
  let name = data.name;
  for (let index = 2; existingNames.has(name); index++) {
    const suffix = `（${index}）`;
    name = data.name.slice(0, 64 - suffix.length).trimEnd() + suffix;
  }
  return insertAllocationPlan(library, id, { ...data, name });
}
export function updateAllocationPlan(library: AllocationPlans, id: string, plan: AllocationPlan): AllocationPlans {
  return { ...library, plans: library.plans.map(entry => entry.id === id ? { ...entry, plan } : entry) };
}
export function removeAllocationPlan(library: AllocationPlans, id: string): AllocationPlans {
  if (library.plans.length <= 1) return library;
  const plans = library.plans.filter(entry => entry.id !== id);
  return { ...library, plans, activeId: library.activeId === id ? plans[0].id : library.activeId };
}
