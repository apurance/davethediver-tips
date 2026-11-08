import test from "node:test";
import assert from "node:assert/strict";
import { calculateDemand, createAllocationPlan, resolvedMenu, restoreAllocationPlan } from "../src/allocation.ts";
import { addAllocationPlan, createAllocationPlans, removeAllocationPlan, restoreAllocationPlans, updateAllocationPlan } from "../src/allocationPlans.ts";

const dish = { id: "test", recipeId: "recipe/crimson-fish-roll", servings: 9, batchServings: 9 };
test("new and incomplete plans use independent party menus by default", () => {
  for (const plan of [createAllocationPlan(), restoreAllocationPlan({ version: 1 })]) {
    plan.daily.main.dishes = [dish];
    for (const [id, menus] of Object.entries(plan.parties)) {
      assert.equal(menus.main.inheritDaily, false);
      assert.equal(menus.branch.inheritDaily, false);
      assert.deepEqual(resolvedMenu(plan, id, "main"), []);
    }
    assert.equal(calculateDemand(plan, "cycle").rows.find(row => row.id === "fish/red-bream")?.total, 32 * 3);
  }
});

test("legacy plan migrates without losing dishes, cycle or explicit inheritance", () => {
  const legacy = createAllocationPlan();
  legacy.daily.main.dishes = [dish];
  legacy.days = 80;
  legacy.parties.shark.main.inheritDaily = true;
  legacy.parties.shrimp.branch.dishes = [{ ...dish, servings: 18 }];
  const library = restoreAllocationPlans(JSON.parse(JSON.stringify(legacy)));
  assert.equal(library.plans.length, 1);
  assert.deepEqual(library.plans[0].plan, legacy);
  assert.deepEqual(restoreAllocationPlans(JSON.parse(JSON.stringify(library))), library);
});

test("new, copied and edited plans remain independent and preserve selected plan after reload", () => {
  let library = createAllocationPlans();
  const original = library.plans[0].plan;
  original.daily.main.dishes = [{ ...dish }];
  library = addAllocationPlan(library, "copy", "方案副本", "default");
  library.plans[1].plan.daily.main.dishes[0].servings = 18;
  assert.equal(library.plans[0].plan.daily.main.dishes[0].servings, 9);
  const modified = structuredClone(library.plans[1].plan);
  modified.days = 60;
  library = updateAllocationPlan(library, "copy", modified);
  assert.equal(library.plans[0].plan.days, 40);
  assert.equal(library.plans[1].plan.days, 60);
  library = addAllocationPlan(library, "empty", "空白方案");
  assert.deepEqual(library.plans[2].plan.daily.main.dishes, []);
  assert.equal(library.activeId, "empty");
  library = { ...library, activeId: "copy" };
  assert.deepEqual(restoreAllocationPlans(JSON.parse(JSON.stringify(library))), library);
  assert.equal(calculateDemand(library.plans[0].plan, "service").rows[0].total, 3);
  assert.equal(calculateDemand(library.plans[1].plan, "service").rows[0].total, 6);
});

test("deleting a plan keeps other plans and never deletes the last plan", () => {
  let library = addAllocationPlan(createAllocationPlans(), "second", "第二方案");
  library = removeAllocationPlan(library, "second");
  assert.equal(library.activeId, "default");
  assert.equal(library.plans.length, 1);
  assert.deepEqual(removeAllocationPlan(library, "default"), library);
  library = addAllocationPlan(library, "third", "第三方案");
  assert.equal(removeAllocationPlan(library, "default").activeId, "third");
});

test("invalid saved libraries recover with valid selected IDs and unique plan IDs", () => {
  for (const value of [null, [], { version: 2, plans: [] }, { version: 2, plans: [null] }]) {
    assert.deepEqual(restoreAllocationPlans(value), createAllocationPlans());
  }
  const restored = restoreAllocationPlans({ version: 2, activeId: "missing", plans: [
    { id: "a", name: "", plan: null }, { id: "a", name: "duplicate" }, { id: "b", name: "B", plan: {} },
  ] });
  assert.equal(restored.plans.length, 2);
  assert.equal(restored.activeId, "a");
  assert.equal(restored.plans[0].name, "方案 1");
  assert.deepEqual(addAllocationPlan(restored, "a", "duplicate"), restored);
});
