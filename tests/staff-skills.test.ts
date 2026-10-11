import test from "node:test";
import assert from "node:assert/strict";
import { database, getEntity, name, searchCatalog } from "../src/catalog.ts";

test("skill order, unlock levels and effects remain paired and searchable", () => {
  const billy = getEntity("staff/billy");
  assert.ok(billy?.type === "staff");
  assert.deepEqual(billy.skills.map(skill => skill.name), ["skill/83f6186b063d", "skill/9a14ac7d54e7"]);
  assert.deepEqual(billy.skills.map(skill => name(skill.name)), ["小费大师", "清洁大师"]);
  assert.match(name(billy.skills[0].description), /^3级解锁：.*小费/);
  assert.match(name(billy.skills[1].description), /^7级解锁：.*清理餐桌.*1\.5秒/);
  assert.ok(searchCatalog("自动清理餐桌", "staff").some(staff => staff.id === billy.id));

  const yasuto = getEntity("staff/yasuto");
  assert.ok(yasuto?.type === "staff");
  assert.equal(yasuto.skills.length, 2);
  assert.match(name(yasuto.skills[0].description), /^1级解锁：.*WebShooter/);
  assert.match(name(yasuto.skills[1].description), /^5级解锁：.*WebShooter/);
});

test("incomplete source skills retain the available half without invented data", () => {
  const missingNames = database.staff.filter(staff => staff.skills.some(skill => skill.name === "label/not-provided"));
  assert.deepEqual(missingNames.map(staff => staff.id).sort(), [
    "staff/longbottom", "staff/martin-tweed", "staff/mita", "staff/om-nom",
    "staff/rover", "staff/sato", "staff/udo", "staff/yasuto",
  ]);
  for (const staff of missingNames) {
    assert.equal(staff.skills.length, 2, staff.id);
    assert.ok(staff.skills.every(skill => skill.description !== "label/not-provided"), staff.id);
  }
  const missingDescriptions = database.staff.filter(staff => staff.skills.some(skill => skill.description === "label/not-provided"));
  assert.deepEqual(missingDescriptions.map(staff => staff.id).sort(), ["staff/cohh", "staff/maki"]);
  for (const staff of missingDescriptions) {
    assert.equal(staff.skills.length, 2, staff.id);
    assert.ok(staff.skills.every(skill => skill.name !== "label/not-provided"), staff.id);
  }
  const dave = getEntity("staff/dave-shirt");
  assert.ok(dave?.type === "staff");
  assert.deepEqual(dave.skills, []);
});
