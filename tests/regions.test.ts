import test from "node:test";
import assert from "node:assert/strict";
import { getEntity, name, searchable } from "../src/catalog.ts";
import { getRegions, matchesRegion } from "../src/regions.ts";
import { formatFactValue, getDisplayFacts } from "../src/facts.ts";

test("a fish with multiple regions can be filtered, displayed and searched in either region", () => {
  const original = getEntity("fish/zebra-shark")!;
  const shallow = "region/8c354854b261", glacier = "region/glacial-area";
  const fish = { ...original, region: [shallow, glacier] };
  const empty = { ...original, region: [] };
  const missing = { ...original, region: undefined };
  const source = JSON.stringify(fish);

  assert.equal(matchesRegion(fish, shallow), true);
  assert.equal(matchesRegion(fish, glacier), true);
  assert.equal(matchesRegion(fish, "region/limestone-cave"), false);
  assert.equal(matchesRegion(empty, glacier), false);
  assert.equal(matchesRegion(empty, "all"), true);
  assert.equal(matchesRegion(missing, glacier), false);
  assert.equal(matchesRegion(missing, "all"), true);
  assert.deepEqual(getRegions([fish, original, empty, missing]), [shallow, glacier]);

  const regions = getDisplayFacts(fish).filter(fact => fact.labelId === "field/region");
  assert.equal(regions.length, 1);
  assert.deepEqual(regions[0].values.map(value => formatFactValue(value, fish, name)), ["蓝洞，0-50 米", "冰川区域"]);
  assert.ok(!getDisplayFacts(empty).some(fact => fact.labelId === "field/region"));
  assert.ok(!getDisplayFacts(missing).some(fact => fact.labelId === "field/region"));
  assert.ok(searchable(fish).includes("蓝洞，0-50 米"));
  assert.ok(searchable(fish).includes("冰川区域"));
  assert.equal(JSON.stringify(fish), source);
  assert.deepEqual(original.region, [shallow]);
});
