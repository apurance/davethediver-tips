import test from "node:test";
import assert from "node:assert/strict";
import { calculateDemand, createAllocationPlan, defaultBatchServings, fishPool, materialSource, menuDemand, resolvedMenu, restoreAllocationPlan, scheduleDays } from "../src/allocation.ts";
import type { DishAllocation } from "../src/allocation.ts";
import { database, getEntity } from "../src/catalog.ts";

const dish = (recipeId = "recipe/crimson-fish-roll", servings = 9, batchServings: number | null = 9): DishAllocation => ({ id: recipeId, recipeId, servings, batchServings });
const amount = (result: ReturnType<typeof calculateDemand>, id: string) => result.rows.find(row => row.id === id);

test("multiple recipes accumulate shared fish and ingredients; kitchens round separately", () => {
  const plan = createAllocationPlan();
  plan.daily.main.dishes = [dish(undefined, 10), dish("recipe/tropical-fish-sushi-set", 1)];
  plan.daily.branch.dishes = [dish(undefined, 1)];
  const result = calculateDemand(plan, "service");
  assert.deepEqual(amount(result, "fish/red-bream"), { id: "fish/red-bream", main: 6, branch: 3, total: 9 });
  assert.equal(amount(result, "ingredient/rice")?.total, 3);
  assert.equal(result.warnings.length, 0);
});

test("duplicate recipes in one kitchen share a batch, zero portions do not consume materials", () => {
  const result = menuDemand([dish(undefined, 4), dish(undefined, 5), dish("recipe/tropical-fish-sushi-set", 0)], "test");
  assert.equal(result.amounts.get("fish/red-bream"), 3);
  assert.equal(result.amounts.has("ingredient/rice"), false);
});

test("party replaces daily only for customized shop, with precise daily averaging", () => {
  const plan = createAllocationPlan();
  for (const menus of Object.values(plan.parties)) for (const slot of Object.values(menus)) slot.inheritDaily = true;
  plan.daily.main.dishes = [dish()];
  plan.daily.branch.dishes = [dish()];
  plan.parties.shrimp.main = { inheritDaily: false, dishes: [dish("recipe/seasoned-waptia-fieldensis", 8, 7)] };
  const party = calculateDemand(plan, "service", "shrimp");
  assert.equal(amount(party, "fish/red-bream")?.main, 0);
  assert.equal(amount(party, "fish/red-bream")?.branch, 3);
  assert.equal(amount(party, "fish/waptia-fieldensis")?.total, 6);
  const cycle = calculateDemand(plan, "cycle");
  assert.equal(amount(cycle, "fish/red-bream")?.total, 237);
  assert.equal(amount(cycle, "ingredient/cucumber")?.total, 4);
  const average = calculateDemand(plan, "average");
  assert.ok(Math.abs(amount(average, "fish/red-bream")!.total - 237 / 40) < 1e-10);
  assert.equal(amount(average, "ingredient/cucumber")?.total, 0.1);
});

test("empty custom party means no supply; inherited party follows edits to daily", () => {
  const plan = createAllocationPlan();
  for (const menus of Object.values(plan.parties)) for (const slot of Object.values(menus)) slot.inheritDaily = true;
  plan.daily.main.dishes = [dish()];
  assert.deepEqual(resolvedMenu(plan, "shark", "main"), plan.daily.main.dishes);
  plan.parties.shark.main.inheritDaily = false;
  assert.deepEqual(resolvedMenu(plan, "shark", "main"), []);
  assert.equal(amount(calculateDemand(plan, "cycle"), "fish/red-bream")?.total, 117);
});

test("multi-party dish contributes once per event, never once per tag", () => {
  const plan = createAllocationPlan();
  for (const id of ["cucumber", "shrimp"]) plan.parties[id].main = { inheritDaily: false, dishes: [dish("recipe/seasoned-waptia-fieldensis", 7, 7)] };
  assert.equal(amount(calculateDemand(plan, "cycle"), "fish/waptia-fieldensis")?.total, 6);
});

test("invalid schedule blocks averages but leaves single night calculation available", () => {
  const plan = createAllocationPlan();
  plan.days = 2;
  plan.daily.main.dishes = [dish()];
  assert.equal(scheduleDays(plan).valid, false);
  assert.equal(calculateDemand(plan, "average").rows.length, 0);
  assert.equal(calculateDemand(plan, "cycle").warnings.length, 1);
  assert.equal(amount(calculateDemand(plan, "service"), "fish/red-bream")?.total, 3);
});

test("zero event counts and a one-day all-party horizon avoid phantom daily consumption", () => {
  const plan = createAllocationPlan();
  plan.days = 1;
  for (const id of Object.keys(plan.occurrences)) plan.occurrences[id] = 0;
  plan.occurrences.shark = 1;
  plan.daily.main.dishes = [dish("missing")];
  plan.parties.shark.main = { inheritDaily: false, dishes: [dish()] };
  const result = calculateDemand(plan, "average");
  assert.equal(amount(result, "fish/red-bream")?.total, 3);
  assert.equal(result.warnings.length, 0);
});

test("missing recipes warn while legacy batch sizes do not override max servings", () => {
  const result = menuDemand([dish("recipe/missing"), dish(undefined, 1, null), dish("", 1, null)], "test");
  assert.equal(result.amounts.get("fish/red-bream"), 3);
  assert.equal(result.warnings.length, 2);
  const recipe = database.recipes.find(recipe => recipe.ingredients.some(item => item.quantity === null));
  if (recipe) assert.ok(menuDemand([dish(recipe.id)], "test").warnings.length > 0);
});

test("pools distinguish nocturnal, depth, special cuts, DLC and ordinary ingredients", () => {
  assert.equal(materialSource("fish/waptia-fieldensis").group, "vents");
  assert.equal(materialSource("fish/moray-eel").group, "night");
  assert.equal(materialSource("fish/titan-triggerfish").group, "shallow");
  assert.equal(materialSource("fish/clown-frogfish").group, "medium");
  assert.equal(materialSource("fish/rhinochimaeridae").group, "deep");
  assert.equal(materialSource("fish/bloodskin-shark").group, "external");
  assert.equal(materialSource("ingredient/bluefin-tuna-chutoro").group, "external");
  assert.ok(materialSource("ingredient/bluefin-tuna-chutoro").note?.includes("特殊部位"));
  assert.equal(materialSource("ingredient/rice").group, "ingredients");
  const fish = getEntity("fish/titan-triggerfish");
  assert.ok(fish?.type === "fish");
  assert.equal(fishPool({ ...fish, region: [] }), "external");
});

test("saved data handles corruption and preserves selections and unique row keys", () => {
  assert.deepEqual(restoreAllocationPlan(null), createAllocationPlan());
  assert.deepEqual(restoreAllocationPlan({ version: 2 }), createAllocationPlan());
  const plan = createAllocationPlan();
  plan.daily.main.dishes = [dish(), dish(), dish(undefined, -1), dish(undefined, Infinity), dish(undefined, 1, null)];
  plan.days = NaN;
  const saved = restoreAllocationPlan(plan);
  assert.equal(saved.days, 40);
  assert.equal(saved.daily.main.dishes.length, 3);
  assert.equal(new Set(saved.daily.main.dishes.map(row => row.id)).size, 3);
  assert.equal(saved.daily.main.dishes[0].recipeId, "recipe/crimson-fish-roll");
  assert.deepEqual(restoreAllocationPlan(saved), saved);
  const recipe = database.recipes.find(recipe => recipe.id === "recipe/crimson-fish-roll")!;
  assert.equal(defaultBatchServings(recipe), 9);
  assert.equal(defaultBatchServings({ ...recipe, stats: {} }), null);
});


test("max servings override saved custom batch sizes and merge duplicate recipes", () => {
  const result = menuDemand([dish(undefined, 4, 1), dish(undefined, 5, 6)], "test");
  assert.equal(result.amounts.get("fish/red-bream"), 3);
  assert.equal(result.warnings.length, 0);
  assert.equal(menuDemand([dish(undefined, 10, 99)], "test").amounts.get("fish/red-bream"), 6);
});
