import test from "node:test";
import assert from "node:assert/strict";
import { calculateMenu, calculateSupply } from "../src/calculations.ts";
const plan = {
  customers: 45,
  branch: 0,
  served: 100,
  price: 1387,
  portions: 9,
  premium: 0,
  multiplier: 2,
  cost: 0,
};
test("45 customers use five tropical batches and 62415 gold", () => {
  const r = calculateMenu(plan);
  assert.equal(r.batches, 5);
  assert.equal(r.waste, 0);
  assert.equal(r.revenue, 62415);
});
test("two stores round batches independently", () => {
  const r = calculateMenu({ ...plan, customers: 28, branch: 28 });
  assert.equal(r.batches, 8);
  assert.equal(r.waste, 16);
});
test("service counts round down per store and premium is capped", () => {
  const r = calculateMenu({
    ...plan,
    customers: 1,
    branch: 1,
    served: 50,
    premium: 200,
  });
  assert.equal(r.actual, 0);
  assert.equal(r.revenue, 0);
  assert.equal(r.batches, 0);
});
test("party premium and costs apply only once", () => {
  const r = calculateMenu({ ...plan, branch: 45, premium: 20, cost: 10000 });
  assert.equal(r.batches, 10);
  assert.equal(r.revenue, 152570);
  assert.equal(r.net, 142570);
});
test("zero sales still retain fixed costs", () => {
  const r = calculateMenu({ ...plan, served: 0, cost: 500 });
  assert.equal(r.net, -500);
  assert.equal(r.waste, 0);
});
test("lowest ingredient supply is the bottleneck", () => {
  const r = calculateSupply(
    [
      ["a", 3],
      ["b", 3],
      ["rice", 3],
    ],
    { a: 30, b: 12, rice: 15 },
    9,
  );
  assert.equal(r.plates, 36);
  assert.equal(r.maximum, 90);
});
test("missing supply prevents continued production", () =>
  assert.equal(
    calculateSupply(
      [
        ["a", 3],
        ["rice", 3],
      ],
      { a: 100 },
      9,
    ).plates,
    0,
  ));
