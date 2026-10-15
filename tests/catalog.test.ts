import test from "node:test";
import assert from "node:assert/strict";
import { catalog, entityPath, getEntity, name } from "../src/catalog.ts";

test("catalog resolves current IDs and names without redirecting retired IDs", () => {
  const kajime = getEntity("ingredient/kajime");
  assert.ok(kajime);
  assert.equal(name(kajime.id), "甘苔");
  assert.equal(entityPath(kajime), "/ingredients/kajime");
  assert.equal(getEntity("fish/kajime"), undefined);
  assert.equal(getEntity("recipe/does-not-exist"), undefined);
});

test("all catalog relationships resolve directly to current entities", () => {
  function check(value: unknown, path: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => check(item, `${path}[${index}]`));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        if (key === "entityId" || key === "ingredientId") {
          assert.ok(typeof item === "string" && getEntity(item), `${path}.${key}: ${item}`);
        } else if (["relatedFish", "relatedRecipes", "relatedIngredients", "fishIds"].includes(key)) {
          for (const id of item as string[]) assert.ok(getEntity(id), `${path}.${key}: ${id}`);
        } else {
          check(item, `${path}.${key}`);
        }
      }
    }
  }
  for (const entity of catalog) check(entity, entity.id);
});
