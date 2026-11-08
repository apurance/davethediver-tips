import { getEntity, name } from "./catalog.ts";
import type { FishEntity, RecipeEntity } from "./catalog.ts";
import { partyNames } from "./events.ts";
import { Region } from "./regions.ts";

export const stores = ["main", "branch"] as const;
export type Store = typeof stores[number];
export const storeNames = { main: "主店", branch: "分店" };
export const partyIds = Object.keys(partyNames);
export const maxAllocationBatches = 9999;
interface DishRow { id: string; recipeId: string }
interface LegacyDishAllocation extends DishRow { servings: number; batchServings: number | null }
export interface BatchDishAllocation extends DishRow { batches: number | null; legacyServings?: number }
export type DishAllocation = LegacyDishAllocation | BatchDishAllocation;
export interface MenuAllocation { inheritDaily: boolean; dishes: DishAllocation[] }
export type StoreMenus = Record<Store, MenuAllocation>;
export interface AllocationPlan {
  version: 1;
  days: number;
  occurrences: Record<string, number>;
  daily: StoreMenus;
  dailyReserve: string[];
  parties: Record<string, StoreMenus>;
}
const emptyMenus = (inheritDaily: boolean): StoreMenus => ({
  main: { inheritDaily, dishes: [] }, branch: { inheritDaily, dishes: [] },
});
export function createAllocationPlan(): AllocationPlan {
  return { version: 1, days: 40, occurrences: Object.fromEntries(partyIds.map(id => [id, 1])),
    daily: emptyMenus(false), dailyReserve: [],
    parties: Object.fromEntries(partyIds.map(id => [id, emptyMenus(false)])) };
}
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
function readMenus(value: unknown, inherit: boolean): StoreMenus {
  const result = emptyMenus(false);
  if (!value || typeof value !== "object") return result;
  for (const store of stores) {
    const slot = (value as Partial<StoreMenus>)[store];
    if (!slot || typeof slot !== "object") continue;
    result[store].inheritDaily = inherit && slot.inheritDaily === true;
    if (!Array.isArray(slot.dishes)) continue;
    const ids = new Set<string>();
    result[store].dishes = slot.dishes.flatMap((row, index): DishAllocation[] => {
      if (!row || typeof row.id !== "string" || typeof row.recipeId !== "string") return [];
      const { recipeId } = row;
        let id = row.id;
        while (!id || ids.has(id)) id = `${id}-${store}-${index}`;
      let dish: DishAllocation;
      if ("batches" in row) {
        if (integer(row.batches, 0, maxAllocationBatches)) dish = { id, recipeId, batches: row.batches };
        else if (row.batches === null && integer(row.legacyServings, 1, 9999)) dish = { id, recipeId, batches: null, legacyServings: row.legacyServings };
        else return [];
      } else {
        if (!integer(row.servings, 0, 9999) || (row.batchServings !== null && !integer(row.batchServings, 1, 999))) return [];
        dish = { id, recipeId, servings: row.servings, batchServings: row.batchServings };
      }
        ids.add(id);
      return [dish];
      });
  }
  return result;
}
/** Validate persisted data before it reaches controls or arithmetic. */
export function restoreAllocationPlan(value: unknown): AllocationPlan {
  const result = createAllocationPlan();
  if (!value || typeof value !== "object" || (value as AllocationPlan).version !== 1) return result;
  const saved = value as Omit<AllocationPlan, "dailyReserve"> & { dailyReserve?: string[] | Partial<Record<Store, string[]>> };
  if (integer(saved.days, 1, 3650)) result.days = saved.days;
  result.daily = readMenus(saved.daily, false);
  const reserve = saved.dailyReserve;
  const recipes = Array.isArray(reserve) ? reserve : stores.flatMap(store => {
    const oldRecipes = reserve?.[store];
    return Array.isArray(oldRecipes) ? oldRecipes : [];
  });
  result.dailyReserve = [...new Set(recipes.filter(id => typeof id === "string" && id.trim() !== ""))];
  for (const id of partyIds) {
    result.parties[id] = readMenus(saved.parties?.[id], true);
    if (integer(saved.occurrences?.[id], 0, 3650)) result.occurrences[id] = saved.occurrences[id];
  }
  return result;
}
export function defaultBatchServings(recipe: RecipeEntity): number | null {
  const count = recipe.stats.maxServings;
  return count != null && integer(count, 1, 999) ? count : null;
}
export function recipeBatchServings(recipeId: string): number | null {
  const recipe = getEntity(recipeId);
  return recipe?.type === "recipe" ? defaultBatchServings(recipe) : null;
}
export function menuBatches(dishes: DishAllocation[]): BatchDishAllocation[] {
  const legacyTotals = new Map<string, number>();
  return dishes.map(row => {
    if ("batches" in row) return row;
    const { id, recipeId, servings } = row;
    if (servings === 0) return { id, recipeId, batches: 0 };
    const perBatch = recipeBatchServings(recipeId);
    if (perBatch === null) return { id, recipeId, batches: null, legacyServings: servings };
    // Old menus rounded the combined servings for each recipe once per store.
    const previous = legacyTotals.get(recipeId) ?? 0;
    const total = previous + servings;
    legacyTotals.set(recipeId, total);
    return { id, recipeId, batches: Math.ceil(total / perBatch) - Math.ceil(previous / perBatch) };
  });
}
export function menuOutput(dishes: DishAllocation[]): { servings: number; incomplete: boolean } {
  let servings = 0;
  let incomplete = false;
  for (const { recipeId, batches } of menuBatches(dishes)) {
    if (batches === 0) continue;
    const perBatch = recipeBatchServings(recipeId);
    if (batches === null || perBatch === null) incomplete = true;
    else servings += batches * perBatch;
  }
  return { servings, incomplete };
}
export function resolvedMenu(plan: AllocationPlan, scenario: string, store: Store): DishAllocation[] {
  if (scenario === "daily") return plan.daily[store].dishes;
  const slot = plan.parties[scenario]?.[store];
  return !slot || slot.inheritDaily ? plan.daily[store].dishes : slot.dishes;
}
export interface MaterialDemand { id: string; main: number; branch: number; total: number }
export interface DemandResult { rows: MaterialDemand[]; warnings: string[] }

export function dailyReserveMaterials(plan: AllocationPlan) {
  const materialIds = new Set<string>();
  const missingRecipes: string[] = [];
  for (const id of plan.dailyReserve) {
    const recipe = getEntity(id);
    if (recipe?.type !== "recipe" || recipe.ingredients.length === 0) {
      missingRecipes.push(id);
      continue;
    }
    for (const { ingredientId } of recipe.ingredients) materialIds.add(ingredientId);
  }
  return { materialIds, missingRecipes };
}

export function menuDemand(dishes: DishAllocation[], context: string): { amounts: Map<string, number>; warnings: string[] } {
  const amounts = new Map<string, number>();
  const warnings: string[] = [];
  for (const row of menuBatches(dishes)) {
    if (row.batches === 0) continue;
    if (!row.recipeId) { warnings.push(`${context}：还有菜品未选择。`); continue; }
    const recipe = getEntity(row.recipeId);
    if (!recipe || recipe.type !== "recipe") { warnings.push(`${context}：菜谱 ${name(row.recipeId)} 已失效，请重新选择。`); continue; }
    if (!integer(row.batches, 1, maxAllocationBatches)) { warnings.push(`${context} · ${name(recipe.id)}：请填写有效的制作批数。`); continue; }
    if (!recipe.ingredients.length) warnings.push(`${context} · ${name(recipe.id)}：配方缺失，尚未计入用料。`);
    for (const ingredient of recipe.ingredients) {
      if (ingredient.quantity === null || !Number.isFinite(ingredient.quantity) || ingredient.quantity < 0) {
        warnings.push(`${context} · ${name(recipe.id)}：${name(ingredient.ingredientId)} 的配方数量缺失，合计不完整。`);
        continue;
      }
      amounts.set(ingredient.ingredientId, (amounts.get(ingredient.ingredientId) ?? 0) + row.batches * ingredient.quantity);
    }
  }
  return { amounts, warnings };
}
export function scheduleDays(plan: AllocationPlan) {
  const partyDays = partyIds.reduce((sum, id) => sum + plan.occurrences[id], 0);
  return { partyDays, normalDays: plan.days - partyDays,
    valid: integer(plan.days, 1, 3650) && partyIds.every(id => integer(plan.occurrences[id], 0, 3650)) && partyDays <= plan.days };
}
export function calculateDemand(plan: AllocationPlan, view: "service" | "average" | "cycle", scenario = "daily"): DemandResult {
  const schedule = scheduleDays(plan);
  if (view !== "service" && !schedule.valid) return { rows: [], warnings: ["派对总次数不能超过规划天数；每晚最多计一次派对。请调整周期后查看折算结果。"] };
  const scenarios: [string, number][] = view === "service" ? [[scenario, 1]] :
    [["daily", schedule.normalDays], ...partyIds.map(id => [id, plan.occurrences[id]] as [string, number])];
  const rows = new Map<string, MaterialDemand>();
  const warnings = new Set<string>();
  for (const [key, count] of scenarios) {
    if (count === 0) continue;
    for (const store of stores) {
      const result = menuDemand(resolvedMenu(plan, key, store), `${key === "daily" ? "日常" : partyNames[key]} · ${storeNames[store]}`);
      result.warnings.forEach(warning => warnings.add(warning));
      for (const [id, amount] of result.amounts) {
        const row = rows.get(id) ?? { id, main: 0, branch: 0, total: 0 };
        row[store] += amount * count / (view === "average" ? plan.days : 1);
        row.total = row.main + row.branch;
        rows.set(id, row);
      }
    }
  }
  return { rows: [...rows.values()].filter(row => row.total > 0).sort((a, b) => name(a.id).localeCompare(name(b.id), "zh-CN")), warnings: [...warnings] };
}

export const poolNames: Record<string, string> = {
  shallow: "0–50 米 · 浅水池", medium: "50–130 米 · 中层池", deep: "130–250 米 · 深水池",
  passage: "冰河通道池", glacial: "冰河区域池", vents: "热泉区域池", night: "夜潜池",
  external: "特殊来源／鱼池归属待确认",
};
const regionPools: Partial<Record<Region, string>> = {
  [Region.BlueHoleShallows]: "shallow", [Region.BlueHoleMediumDepth]: "medium", [Region.LimestoneCave]: "medium",
  [Region.Shipwreck]: "medium", [Region.BlueHoleDepths]: "deep", [Region.GlacierPassage]: "passage",
  [Region.GlacialArea]: "glacial", [Region.GlacialAreaDungeon1]: "glacial", [Region.GlacialAreaDungeon3]: "glacial",
  [Region.HydrothermalVents]: "vents",
};
export function fishPool(fish: FishEntity): string {
  const pools = [...new Set(fish.region.map(region => regionPools[region]).filter(Boolean))];
  if (pools.length !== 1) return "external";
  return fish.facets.time === "time/b77ea2b347b8" ? "night" : pools[0]!;
}
export function materialSource(id: string): { group: string; fishIds: string[]; note?: string } {
  const entity = getEntity(id);
  if (entity?.type === "fish") return { group: fishPool(entity), fishIds: [id] };
  if (entity?.type === "ingredient" && entity.relatedFish.length) {
    // Special cuts, heads and interchangeable seahorses must not be treated as generic fish meat.
    return { group: "external", fishIds: entity.relatedFish,
      note: /tuna-(chutoro|ootoro)$/.test(id) ? "金枪鱼特殊部位：需捕捞确认，不按普通养殖鱼肉换算。" : "特殊产物：按材料备货，不能直接用整鱼产肉量换算。" };
  }
  const ingredientType = entity?.type === "ingredient" ? entity.ingredientType : undefined;
  return { group: ingredientType ?? "ingredients", fishIds: [] };
}
