import test from "node:test";
import assert from "node:assert/strict";
import { getEntity } from "../src/catalog.ts";

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
