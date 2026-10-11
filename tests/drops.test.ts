import test from "node:test";
import assert from "node:assert/strict";
import { catalog, getEntity } from "../src/catalog.ts";
import { getDisplayFacts } from "../src/facts.ts";

test("drops use individual top-level text or entity items with no source fact or comma tokens", () => {
  let count = 0;
  for (const entity of catalog) {
    assert.ok(!entity.facts.some(fact => fact.labelId === "field/drops"), entity.id);
    assert.ok(!getDisplayFacts(entity).some(fact => fact.labelId === "field/drops"), entity.id);
    if (entity.type !== "fish" || !entity.drops) continue;
    count++;
    assert.ok(entity.drops.length > 0, entity.id);
    for (const drop of entity.drops) {
      const keys = Object.keys(drop);
      assert.equal(keys.length, 1, entity.id);
      assert.ok(keys[0] === "text" || keys[0] === "entityId", entity.id);
      if (drop.entityId !== undefined) {
        assert.ok(getEntity(drop.entityId), `${entity.id} -> ${drop.entityId}`);
      } else {
        assert.equal(typeof drop.text, "string", entity.id);
        assert.ok(drop.text!.trim().length > 0 && !/[,，]/.test(drop.text!), entity.id);
      }
    }
  }
  assert.ok(count > 0);
});

test("split drops preserve existing links and link matching meat ingredients", () => {
  const porbeagle = getEntity("fish/porbeagle-shark");
  assert.ok(porbeagle?.type === "fish");
  assert.deepEqual(porbeagle.drops, [
    { entityId: "ingredient/meat-porbeagle-shark" },
    { text: "Porbeagle Shark Tooth" },
  ]);
  const whitetip = getEntity("fish/whitetip-reefshark");
  assert.ok(whitetip?.type === "fish");
  assert.deepEqual(whitetip.drops, [
    { text: "Whitetip Reefshark Tooth" },
    { entityId: "ingredient/whitetip-reefshark-head" },
    { entityId: "ingredient/whitetip-reefshark-meat" },
  ]);
  for (const [id, ingredientId] of [
    ["fish/zebra-shark", "ingredient/meat-zebra-shark"],
    ["fish/sailfish", "ingredient/meat-sail-fish"],
    ["fish/long-nose-saw-shark", "ingredient/meat-long-nose-saw-shark"],
  ]) {
    const fish = getEntity(id);
    assert.ok(fish?.type === "fish");
    assert.ok(fish.drops?.some(drop => drop.entityId === ingredientId), id);
  }
});
