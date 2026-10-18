// Run with: node --test v2/tests/*.test.js
// store.js falls back to in-memory storage when localStorage is absent (Node).
const test = require("node:test");
const assert = require("node:assert/strict");
const CoC = require("../js/rules.js");
const Store = require("../js/store.js");

const bundle = (characters) => JSON.stringify({ format: "cocd20-characters", schemaVersion: 2, characters });

test("save/load round-trip keeps the character and bumps the revision", () => {
  const c = CoC.sampleCharacter();
  const first = Store.save(c, { force: true }).character;
  assert.equal(first.rev, 1);
  const loaded = Store.load(first.id);
  assert.equal(loaded.name, c.name);
  assert.deepEqual(CoC.derive(loaded).saves.will.total, CoC.derive(c).saves.will.total);
  const second = Store.save(loaded).character;
  assert.equal(second.rev, 2);
  assert.ok(Store.list().some((e) => e.id === first.id));
});

test("a save based on an older revision is refused (edit from another tab)", () => {
  const saved = Store.save(CoC.sampleCharacter(), { force: true }).character; // rev 1
  const tabA = CoC.clone(saved);
  const tabB = CoC.clone(saved);
  tabB.notes = "edited in tab B";
  assert.equal(Store.save(tabB).character.rev, 2);
  tabA.notes = "stale edit in tab A";
  const res = Store.save(tabA);
  assert.equal(res.conflict, true);
  assert.equal(Store.load(saved.id).notes, "edited in tab B");
});

test("import: duplicate ids in one file both survive; null and junk entries are skipped", () => {
  const a = CoC.sampleCharacter(); a.id = "dupid"; a.name = "First";
  const b = CoC.sampleCharacter(); b.id = "dupid"; b.name = "Second";
  const res = Store.importData(bundle([a, null, 42, "x", b]));
  assert.equal(res.imported.length, 2);
  assert.equal(res.skipped, 3);
  const ids = res.imported.map((c) => c.id);
  assert.notEqual(ids[0], ids[1]);
  assert.deepEqual(res.imported.map((c) => c.name), ["First", "Second"]);
});

test("import: hostile strings are coerced, ids are sanitised, unknown values fall back", () => {
  const evil = '"><img src=x onerror=alert(1)>';
  const raw = CoC.sampleCharacter();
  Object.assign(raw, {
    id: 'bad"/id%',
    profession: "Necromancer",
    era: "3000 AD",
    armor: "Plate of Doom",
    levelLog: [{}, { hpRoll: evil }, null],
    weapons: [null, { name: "Gun", category: "pistol", capacity: evil, ammo: evil }],
    feats: [null, { name: "Not A Feat" }, { name: "Iron Will" }],
    equipment: [{ name: "Rope", qty: 0 }],
  });
  const [c] = Store.importData(bundle([raw])).imported;
  assert.match(c.id, /^[A-Za-z0-9_-]+$/);
  assert.equal(c.profession, "Professor");
  assert.equal(c.era, "1921-1940");
  assert.equal(c.armor, "None");
  assert.equal(c.levelLog[1].hpRoll, null);
  assert.equal(c.weapons.length, 1);
  assert.equal(c.weapons[0].capacity, null);
  assert.equal(c.weapons[0].ammo, null);
  assert.deepEqual(c.feats.map((f) => f.name), ["Iron Will"]);
  assert.equal(c.equipment[0].qty, 1);
  assert.doesNotThrow(() => CoC.derive(c));
});

test("import: a file with no usable characters is rejected and saves nothing", () => {
  const before = Store.list().length;
  assert.throws(() => Store.importData(bundle([null, 1])), /No usable characters/);
  assert.throws(() => Store.importData("{\"nope\":1}"), /Not a character file/);
  assert.equal(Store.list().length, before);
});

test("__proto__ keys in imported JSON don't pollute objects", () => {
  const raw = JSON.parse(JSON.stringify(CoC.sampleCharacter()));
  const text = bundle([raw]).replace('"name":', '"__proto__":{"polluted":true},"name":');
  Store.importData(text);
  assert.equal({}.polluted, undefined);
});

test("v1 migration maps profession, skills, Mythos, feats and vitals", () => {
  const c = Store.fromLegacy("Harvey O'Brien", {
    playerName: "Sam", age: "52", profession: 6, level: "2", attackOption: "offense",
    goodSaves: { fort: true }, era: "1921-1940", currentHP: "5", currentSanity: "40",
    abilities: { Str: "12", Dex: "14", Con: "11", Int: "13", Wis: "12", Cha: "10" },
    skills: [{ index: 39, ranks: "4" }, { index: 8, ranks: "1" }], feats: [1, 17],
  });
  assert.equal(c.profession, "Detective");
  assert.equal(c.skills.Spot.ranks, 4);
  assert.equal(c.mythos, 1);
  assert.deepEqual(c.feats.map((f) => f.name), ["Alertness", "Improved Initiative"]);
  assert.equal(c.hp.current, 5);
  assert.equal(c.sanity.current, 40);
  assert.deepEqual(c.goodSaves, ["fort"]);
});

test("lowering the level and raising it again keeps hit-die rolls and ability increases", () => {
  let c = CoC.normalize({ level: 5, abilities: { Con: 12 } });
  c.levelLog[1].hpRoll = 4; c.levelLog[4].hpRoll = 6; c.levelLog[3].abilityIncrease = "Int";
  c = CoC.syncLevelLog(Object.assign(CoC.clone(c), { level: 2 }));
  assert.equal(c.levelLog.length, 2);
  c = CoC.normalize(c);                 // survives a save/load
  c = CoC.syncLevelLog(Object.assign(CoC.clone(c), { level: 5 }));
  assert.equal(c.levelLog[1].hpRoll, 4);
  assert.equal(c.levelLog[4].hpRoll, 6);
  assert.equal(c.levelLog[3].abilityIncrease, "Int");
});

test("current Sanity is capped at maximum when Mythos rises (p.50)", () => {
  const c = CoC.sampleCharacter();     // 75 / 99
  c.sanity.current = 80;
  c.mythos = 30;                        // max 69
  assert.equal(CoC.normalize(c).sanity.current, 69);
});

test("temporary Int damage does not reduce skill points (p.63)", () => {
  const c = CoC.sampleCharacter();
  c.levelLog.forEach((e) => { e.intMod = null; });  // e.g. a migrated character
  const before = CoC.skillPoints(c).available;
  c.abilityDamage.Int = 6;
  assert.equal(CoC.skillPoints(c).available, before);
});
