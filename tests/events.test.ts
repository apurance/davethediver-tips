import test from "node:test";
import assert from "node:assert/strict";
import { database } from "../src/catalog.ts";
import { matchesParty, partyFilter, partyUrl } from "../src/events.ts";

test("multi-party recipes appear under each supported party", () => {
  const recipe = database.recipes.find(recipe => recipe.id === "recipe/seasoned-waptia-fieldensis")!;
  assert.ok(matchesParty(recipe, "cucumber"));
  assert.ok(matchesParty(recipe, "shrimp"));
  assert.equal(matchesParty(recipe, "shark"), false);
});

test("detail links round-trip to the party filter", () => {
  const url = new URL(partyUrl("lobster"), "https://example.test");
  assert.equal(url.pathname, "/recipes");
  assert.equal(partyFilter(url.searchParams.get("event")), "lobster");
  assert.equal(partyFilter("invalid"), "all");
  assert.equal(partyFilter(null), "all");
});

test("missing party tags are restored and no filter includes every recipe", () => {
  for (const [slug, party] of [["frilled-shark-sushi", "shark"], ["rhinochimaeridae-sushi", "shark"], ["stir-fried-habanero-lobster", "lobster"]]) {
    const recipe = database.recipes.find(recipe => recipe.id === `recipe/${slug}`)!;
    assert.ok(matchesParty(recipe, party));
  }
  assert.ok(database.recipes.every(recipe => matchesParty(recipe, "all")));
});
