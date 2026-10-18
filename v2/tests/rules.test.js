// Run with: node --test v2/tests/*.test.js
// Expected values are transcribed from the Call of Cthulhu d20 core rulebook
// (printed page numbers in comments).
const test = require("node:test");
const assert = require("node:assert/strict");
const CoC = require("../js/rules.js");

const L = (n) => Array.from({ length: n }, (_, i) => i + 1);

test("Table 1-9 Offense base attack (p.10)", () => {
  const expected = [1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 15];
  assert.deepEqual(L(20).map((l) => CoC.baseAttackBonus(l, "offense")), expected);
});

test("Table 1-8 Defense base attack (p.10)", () => {
  const expected = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10];
  assert.deepEqual(L(20).map((l) => CoC.baseAttackBonus(l, "defense")), expected);
});

test("Iterative attacks (p.10)", () => {
  assert.deepEqual(CoC.attackSequence(6), [6, 1]);
  assert.deepEqual(CoC.attackSequence(5), [5]);
  assert.deepEqual(CoC.attackSequence(15), [15, 10, 5]);
  assert.deepEqual(CoC.attackSequence(0), [0]);
});

test("Save progressions (Tables 1-8/1-9)", () => {
  const good = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const bad = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
  assert.deepEqual(L(20).map((l) => CoC.baseSave(l, true)), good);
  assert.deepEqual(L(20).map((l) => CoC.baseSave(l, false)), bad);
  assert.equal(CoC.goodSaveCount("offense"), 1);
  assert.equal(CoC.goodSaveCount("defense"), 2);
});

test("Table 1-10 max ranks and feats (p.11)", () => {
  assert.equal(CoC.coreMaxRanks(1), 4);
  assert.equal(CoC.noncoreMaxRanks(1), 2);
  assert.equal(CoC.noncoreMaxRanks(2), 2.5);
  assert.equal(CoC.coreMaxRanks(20), 23);
  const feats = L(20).map((l) => CoC.featSlots({ level: l }));
  assert.deepEqual(feats.slice(0, 7), [2, 2, 3, 3, 3, 4, 4]);
  assert.equal(feats[17], 8);
  assert.deepEqual(CoC.abilityIncreaseLevels(20), [4, 8, 12, 16, 20]);
});

test("Variant defense bonus Table 1-15 (p.15)", () => {
  assert.equal(CoC.defenseBonus(1, "defense"), 2);
  assert.equal(CoC.defenseBonus(5, "defense"), 3);
  assert.equal(CoC.defenseBonus(20, "defense"), 6);
  assert.equal(CoC.defenseBonus(4, "offense"), 0);
  assert.equal(CoC.defenseBonus(10, "offense"), 2);
  assert.equal(CoC.defenseBonus(20, "offense"), 4);
  // Offense option gets a bonus Weapon Proficiency only under this variant
  assert.equal(CoC.featSlots({ level: 1, attackOption: "offense", options: { defenseBonus: true } }), 3);
  assert.equal(CoC.featSlots({ level: 1, attackOption: "offense", options: { defenseBonus: false } }), 2);
});

test("Aging Table 1-11 (p.13) is cumulative and floors at 1", () => {
  assert.equal(CoC.agingCategory(49).key, "young");
  assert.equal(CoC.agingCategory(50).key, "middle");
  assert.equal(CoC.agingCategory(65).key, "old");
  assert.equal(CoC.agingCategory(80).key, "venerable");
  const c = CoC.newCharacter({ age: 66, abilities: { Str: 3, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 } });
  const s = CoC.abilityScores(c);
  assert.equal(s.Str.permanent, 1);
  assert.equal(s.Dex.permanent, 7);
  assert.equal(s.Int.permanent, 12);
});

test("Money Tables 1-13/1-14 (p.15) — Dave's 1930s detective example", () => {
  const c = CoC.newCharacter({ profession: "Detective", era: "1921-1940", money: { roll: 5 } });
  const m = CoC.money(c);
  assert.equal(m.mult, 4);
  assert.equal(m.savings, 8000);
  assert.equal(m.income, 4000);
  const modern = CoC.money(Object.assign({}, c, { era: "1981+" }));
  assert.equal(modern.savings, 24000);
  assert.equal(modern.income, 40000);
  const wealthy = CoC.money(Object.assign({}, c, { feats: [{ name: "Wealth" }] }));
  assert.equal(wealthy.windfall, 8000);
  assert.equal(wealthy.income, 6000);
  const poor = CoC.money(CoC.newCharacter({ profession: "Soldier", money: { roll: 1 } }));
  assert.equal(poor.mult, 1); // minimum 1
});

test("Profession money modifiers (Table 1-13)", () => {
  const mods = Object.fromEntries(CoC.PROFESSIONS.map((p) => [p.name, p.moneyMod]));
  assert.deepEqual(mods, {
    Agent: -1, Antiquarian: -1, Archaeologist: 0, "Artist/Musician": -2, "Blue-Collar Worker": -1,
    Criminal: -1, Detective: -1, Dilettante: 1, "Doctor/Nurse": 2, Parapsychologist: -2,
    "Priest/Clergyman": -1, Professor: 0, Psychologist: 0, Soldier: -2, Technician: 2,
    "White-Collar Worker": 1, "Writer/Reporter": -1,
  });
  for (const p of CoC.PROFESSIONS) {
    assert.equal(p.core.length, 9, p.name);
    for (const id of p.core) assert.ok(CoC.skillDef(id), `${p.name}: ${id}`);
  }
});

test("Skill list Table 2-1 (p.18)", () => {
  assert.equal(CoC.SKILLS.length, 46);
  const trainedOnly = CoC.SKILLS.filter((s) => !s.untrained).map((s) => s.name).sort();
  assert.deepEqual(trainedOnly, [
    "Animal Empathy", "Craft", "Cthulhu Mythos", "Demolitions", "Disable Device", "Handle Animal", "Knowledge",
    "Open Lock", "Operate Heavy Machinery", "Performance", "Pilot", "Psychic Focus", "Psychoanalysis",
    "Read Lips", "Repair", "Sleight of Hand", "Speak Other Language", "Spellcraft", "Tumble",
  ]);
  assert.equal(CoC.SKILL_BY_NAME.Repair.ability, "Int");
  assert.equal(CoC.SKILL_BY_NAME.Forgery.untrained, true);
  const acp = CoC.SKILLS.filter((s) => s.acp).map((s) => s.name).sort();
  assert.deepEqual(acp, ["Balance", "Climb", "Escape Artist", "Hide", "Jump", "Move Silently", "Swim", "Tumble"]);
});

function professor() {
  return CoC.normalize({
    name: "Kristof", profession: "Professor", attackOption: "defense", goodSaves: ["will", "ref"],
    abilities: { Str: 10, Dex: 8, Con: 12, Int: 15, Wis: 14, Cha: 13 }, age: 30,
    coreSkills: ["Concentration", "Diplomacy", "Gather Information", "Knowledge (history)", "Knowledge (occult)",
      "Knowledge (local)", "Research", "Speak Other Language (Latin)", "Spot", "Hide", "Move Silently", "Knowledge (philosophy)"],
  });
}

test("Skill points (p.16-18): (8+Int)×4 at 1st, 8+Int per level, min 1", () => {
  const c = professor();
  assert.equal(CoC.skillPoints(c).available, 40); // Int 15 (+2): 10×4
  const dull = CoC.normalize({ abilities: { Int: 1 } }); // −5 → 3 per level
  assert.equal(CoC.skillPoints(dull).available, 12);
  const dumber = CoC.normalize({ abilities: { Int: 1 }, age: 20 });
  dumber.abilityDamage.Int = 0;
  const lv3 = CoC.syncLevelLog(Object.assign(CoC.clone(c), { level: 3 }));
  assert.equal(CoC.skillPoints(lv3).available, 60);
});

test("Core vs noncore costs and half ranks", () => {
  const c = professor();
  c.skills = { Research: { ranks: 4 }, Listen: { ranks: 1.5 } };
  const sp = CoC.skillPoints(c);
  assert.equal(sp.spent, 4 + 3);
  const listen = CoC.skillTable(c).find((r) => r.id === "Listen");
  assert.equal(listen.effRanks, 1);           // half rank gives no bonus
  assert.equal(listen.total, 1 + 2);          // Wis 14
  assert.equal(listen.max, 2);
  const issues = CoC.validate(Object.assign(CoC.clone(c), { skills: { Listen: { ranks: 2.5 } } }));
  assert.ok(issues.some((i) => /Listen.*exceeds/.test(i.msg)));
});

test("Synergy Table 2-4 (p.22)", () => {
  const c = professor();
  c.coreSkills = c.coreSkills.slice(0, 11).concat(["Sense Motive"]);
  c.level = 2; Object.assign(c, CoC.syncLevelLog(c));
  c.skills = { "Sense Motive": { ranks: 5 } };
  const rows = CoC.skillTable(c);
  assert.equal(rows.find((r) => r.id === "Diplomacy").parts.synergy, 2);
  assert.equal(rows.find((r) => r.id === "Spot").parts.synergy, 0);
});

test("Feat bonuses: aptitude, saves, Skill Emphasis, Improved Initiative, Toughness", () => {
  const c = professor();
  c.feats = [{ name: "Sharp-Eyed" }, { name: "Skill Emphasis", choice: "Research" }, { name: "Improved Initiative" }, { name: "Toughness" }, { name: "Iron Will" }];
  const rows = CoC.skillTable(c);
  assert.equal(rows.find((r) => r.id === "Sense Motive").parts.feat, 2);
  assert.equal(rows.find((r) => r.id === "Spot").parts.feat, 0);
  assert.equal(rows.find((r) => r.id === "Research").parts.emphasis, 3);
  assert.equal(CoC.combat(c).init, -1 + 4);
  assert.equal(CoC.hitPoints(c).max, 6 + 1 + 3);
  assert.equal(CoC.saves(c).will.total, 2 + 2 + 2);
});

test("Feat prerequisites are enforced", () => {
  const c = professor();
  c.feats = [{ name: "Mobility" }, { name: "Mind Reading" }];
  const msgs = CoC.validate(c).map((i) => i.msg).join("\n");
  assert.match(msgs, /Mobility needs Dex 13/);
  assert.match(msgs, /Mobility needs Dodge/);
  assert.match(msgs, /Mind Reading needs Cha 15/);
  assert.match(msgs, /Mind Reading needs Sensitive/);
});

test("Hit points (p.11): 6+Con, then 1d6+Con (min 1) per level", () => {
  const c = CoC.normalize({ level: 3, abilities: { Con: 6 } }); // −2
  c.levelLog[1].hpRoll = 1; c.levelLog[2].hpRoll = 6;
  const hp = CoC.hitPoints(c);
  assert.equal(hp.first, 4);
  assert.deepEqual(hp.perLevel, [1, 4]);
  assert.equal(hp.max, 9);
});

test("HP states (p.68-69)", () => {
  assert.equal(CoC.hpState(1).key, "ok");
  assert.equal(CoC.hpState(0).key, "disabled");
  assert.equal(CoC.hpState(-9).key, "dying");
  assert.equal(CoC.hpState(-10).key, "dead");
});

test("Sanity (p.46-51)", () => {
  let c = professor(); // Wis 14
  let s = CoC.sanity(c);
  assert.equal(s.starting, 70);
  assert.equal(s.max, 99);
  assert.equal(s.current, 70);
  assert.equal(s.tempThreshold, 7);
  assert.equal(s.indefiniteThreshold, 14);
  let r = CoC.loseSanity(c, 7, "ghoul");
  assert.deepEqual(r.triggers, ["temporary"]);
  r = CoC.loseSanity(r.character, 7, "corpse");
  assert.ok(r.triggers.includes("indefinite"));
  assert.equal(CoC.sanity(r.character).current, 56);
  c = CoC.newSanityHour(r.character);
  assert.equal(CoC.sanity(c).hourLoss, 0);
  r = CoC.loseSanity(c, 60);
  assert.ok(r.triggers.includes("zero"));
  assert.equal(CoC.sanity(r.character).current, -4); // not clamped at 0
  r = CoC.loseSanity(r.character, 6);
  assert.ok(r.triggers.includes("permanent"));
  // Mythos: +2 first insanity, +1 after; max drops accordingly
  c = CoC.mythosInsanity(professor());
  assert.equal(c.mythos, 2);
  assert.equal(CoC.sanity(c).max, 97);
  c = CoC.mythosInsanity(c);
  assert.equal(c.mythos, 3);
  // Therapy cannot exceed starting Sanity; level gain can exceed starting up to max
  c = professor(); c.sanity.current = 65;
  assert.equal(CoC.sanity(CoC.gainSanity(c, 10, "therapy")).current, 70);
  assert.equal(CoC.sanity(CoC.gainSanity(c, 40, "level")).current, 99);
});

test("Weapon attacks: proficiency, finesse, focus, armor penalty, iterative", () => {
  const c = professor();
  c.level = 7; Object.assign(c, CoC.syncLevelLog(c));
  c.attackOption = "offense"; c.goodSaves = ["will"];
  const pistol = { name: "Handgun (9mm)", category: "pistol", damage: "1d10", critical: "×3" };
  c.weapons = [pistol];
  let a = CoC.weaponAttack(c, pistol);
  assert.equal(a.bonus, 6 - 1 - 4);           // BAB 6, Dex −1, nonproficient −4
  assert.deepEqual(a.sequence, [1, -4]);
  c.feats = [{ name: "Weapon Proficiency", choice: "pistol" }, { name: "Weapon Focus", choice: "Handgun (9mm)" }];
  a = CoC.weaponAttack(c, pistol);
  assert.equal(a.bonus, 6 - 1 + 1);
  c.armor = "Flak vest";
  assert.equal(CoC.weaponAttack(c, pistol).bonus, 6 - 1 + 1 - 3);
  const knife = { name: "Knife, combat", category: "melee", damage: "1d4", critical: "19-20/×2", finesseAs: "Knife (any)" };
  c.armor = "None";
  c.feats.push({ name: "Weapon Proficiency", choice: "melee" }, { name: "Weapon Finesse", choice: "Knife (any)" }, { name: "Improved Critical", choice: "Knife, combat" });
  a = CoC.weaponAttack(c, knife);
  assert.equal(a.ability, "Dex");
  assert.equal(a.critical, "17-20/×2");
});

test("Armor Table 6-4 (p.95) and AC = 10 + Dex + armor", () => {
  const c = professor();
  c.armor = "Reinforced vest";
  const cb = CoC.combat(c);
  assert.equal(cb.ac, 10 - 1 + 5);
  assert.equal(cb.acp, -2);
  const hide = CoC.skillTable(c).find((r) => r.id === "Hide");
  assert.equal(hide.parts.armor, -2);
  const swim = CoC.skillTable(c).find((r) => r.id === "Swim");
  assert.equal(swim.parts.armor, -2); // Table 2-1 †† (the p.94 sidebar omits Swim)
  const spot = CoC.skillTable(c).find((r) => r.id === "Spot");
  assert.equal(spot.parts.armor, 0);
});

test("Creation validation catches the common mistakes", () => {
  const c = professor();
  c.goodSaves = ["will"];
  c.mythos = 1;
  const msgs = CoC.validate(c).map((i) => i.msg).join("\n");
  assert.match(msgs, /exactly 2 good saves/);
  assert.match(msgs, /Cthulhu Mythos/);
  assert.match(msgs, /skill points unspent/);
  assert.match(msgs, /feat slot/);
});

test("normalize() repairs partial data", () => {
  const c = CoC.normalize({ name: "X", level: 5 });
  assert.equal(c.levelLog.length, 5);
  assert.ok(Array.isArray(c.feats));
  assert.equal(c.schemaVersion, CoC.SCHEMA_VERSION);
});

test("Worked sample in v2/DESIGNS.md matches the hand calculation", () => {
  const c = CoC.sampleCharacter();
  const d = CoC.derive(c);
  const sc = Object.fromEntries(CoC.ABILITIES.map((a) => [a, [d.scores[a].permanent, d.scores[a].mod]]));
  assert.deepEqual(sc, { Str: [9, -1], Dex: [11, 0], Con: [12, 1], Int: [16, 3], Wis: [15, 2], Cha: [12, 1] });
  assert.deepEqual([d.skillPoints.available, d.skillPoints.spent], [66, 66]);
  assert.deepEqual([d.saves.fort.total, d.saves.ref.total, d.saves.will.total], [2, 3, 7]);
  assert.deepEqual(d.combat.sequence, [1]);
  assert.equal(d.combat.ac, 10);
  assert.equal(d.combat.init, 0);
  assert.equal(d.hp.max, 16);
  assert.deepEqual([d.sanity.starting, d.sanity.max, d.sanity.current, d.sanity.tempThreshold, d.sanity.indefiniteThreshold], [75, 99, 75, 8, 15]);
  assert.deepEqual([d.money.savings, d.money.income], [8000, 4000]);
  assert.equal(d.weapons[0].bonus, 1);
  const t = (id) => d.skills.find((r) => r.id === id).total;
  assert.equal(t("Spot"), 10);
  assert.equal(t("Knowledge (occult)"), 9);
  assert.equal(t("Drive"), 3);
  assert.equal(d.gearWeight, 6.5);
  assert.equal(t("Swim"), -2); // Str −1, gear 6.5 lb → −1
  assert.deepEqual(CoC.validate(c), []);
});

test("Swim: armor check penalty (p.37 header, Table 2-1) and −1 per 5 lb of gear (p.37)", () => {
  const c = CoC.sampleCharacter();
  c.equipment.push({ name: "Rope, 50 ft", qty: 1, weight: 10 });     // 16.5 lb → −3
  c.armor = "Bullet resistant vest";                                     // −1
  const swim = CoC.skillTable(c).find((r) => r.id === "Swim");
  assert.equal(swim.parts.gear, -3);
  assert.equal(swim.parts.armor, -1);
  assert.equal(swim.total, -1 - 3 - 1);
  assert.equal(CoC.skillTable(c).find((r) => r.id === "Climb").parts.gear, 0);
});

test("Maximum Sanity = 99 − Cthulhu Mythos modifier (ranks + any bonus) (p.47)", () => {
  const c = CoC.sampleCharacter();
  c.mythos = 3;
  assert.equal(CoC.sanity(c).max, 96);
  c.skills["Cthulhu Mythos"] = { ranks: 0, misc: 2 };
  assert.equal(CoC.sanity(c).max, 94);
  assert.equal(CoC.skillTable(c).find((r) => r.id === "Cthulhu Mythos").total, 5);
});

test("Key abilities come from Table 2-1 (Agent's printed 'Computer Use [Cha]' is a misprint)", () => {
  const c = CoC.normalize({ profession: "Agent", coreSkills: CoC.templateCore("Agent"), abilities: { Int: 16, Cha: 6 } });
  const cu = CoC.skillTable(c).find((r) => r.id === "Computer Use");
  assert.equal(cu.ability, "Int");
  assert.equal(cu.parts.ability, 3);
});

test("Offense bonus Weapon Proficiency: with the variant, or by table ruling", () => {
  const base = { level: 1, attackOption: "offense" };
  assert.equal(CoC.featSlots(Object.assign({}, base, { options: {} })), 2);
  assert.equal(CoC.featSlots(Object.assign({}, base, { options: { defenseBonus: true } })), 3);
  assert.equal(CoC.featSlots(Object.assign({}, base, { options: { offenseWeaponProficiency: true } })), 3);
  assert.equal(CoC.featSlots({ level: 1, attackOption: "defense", options: { offenseWeaponProficiency: true } }), 2);
});

test("Temporary insanity threshold is ≥ half the Wisdom score (odd Wis rounds up)", () => {
  const c = CoC.sampleCharacter(); // Wis 15 → 7.5, so a loss of 8
  assert.equal(CoC.loseSanity(c, 7).triggers.includes("temporary"), false);
  assert.equal(CoC.loseSanity(c, 8).triggers.includes("temporary"), true);
});

test("Insanity tables 4-1 to 4-4 and Sanity loss notation (p.48-50)", () => {
  assert.deepEqual(CoC.parseSanityLoss("1/1d4+1"), { success: "1", failure: "1d4+1" });
  assert.equal(CoC.parseSanityLoss("1d6"), null);
  assert.equal(CoC.rollExpr("2d10+1", () => 0.999).total, 21);
  assert.equal(CoC.rollExpr("1d100", () => 0).total, 1);
  assert.equal(CoC.lookup(CoC.SHORT_TEMP_INSANITY, 20), "Character faints (can be awakened by vigorous action taking one round)");
  assert.match(CoC.lookup(CoC.SHORT_TEMP_INSANITY, 100), /Table 4-3/);
  assert.match(CoC.lookup(CoC.LONG_TEMP_INSANITY, 70), /tics or tremors/);
  assert.match(CoC.lookup(CoC.INDEFINITE_INSANITY, 56), /Schizophrenia/);
  assert.match(CoC.lookup(CoC.INDEFINITE_INSANITY, 96), /Other Disorders/);
  // d10 1-7 short, 8-10 long (Table 4-1)
  const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };
  assert.equal(CoC.rollTemporaryInsanity(seq([0.65, 0.5, 0.5])).kind, "Short temporary insanity");   // d10 7
  assert.equal(CoC.rollTemporaryInsanity(seq([0.75, 0.5, 0.5])).kind, "Longer temporary insanity");  // d10 8
  // Sanity check: d% ≤ current Sanity succeeds and applies the success cost
  const c = CoC.sampleCharacter(); // Sanity 75
  const ok = CoC.sanityCheck(c, "1/1d6", seq([0.74, 0.0]));            // d% 75 → success, lose 1
  assert.deepEqual([ok.roll, ok.success, ok.amount], [75, true, 1]);
  const bad = CoC.sanityCheck(c, "0/1d6", seq([0.75, 0.999]));         // d% 76 → failure, 1d6 = 6
  assert.deepEqual([bad.roll, bad.success, bad.amount], [76, false, 6]);
});

test("Weapon presets: Table 6-1, 6-3 and 6-5 spot checks", () => {
  const w = (n) => CoC.WEAPON_PRESETS.find((x) => x.name === n);
  assert.deepEqual([w("Axe, wood or fire").damage, w("Axe, wood or fire").critical], ["1d8", "×3"]);
  assert.deepEqual([w("Knife, kukri").critical], ["18-20/×2"]);
  assert.deepEqual([w("Colt M1911 (.45 ACP)").damage, w("Colt M1911 (.45 ACP)").capacity], ["2d8", 7]);
  assert.deepEqual([w("Thompson M1921 (.45 ACP)").category, w("Thompson M1921 (.45 ACP)").rof], ["smg", "Autofire"]);
  assert.deepEqual([w("Barrett Light Fifty M82A1").critical, w("AK-47 (7.62×39mm)").range], ["×4", "150 ft"]);
  // Specific shotguns take their damage from Table 6-8 by gauge
  for (const w of CoC.WEAPON_PRESETS.filter((x) => x.source === "Table 6-5" && x.category === "shotgun")) {
    assert.equal(w.damage, CoC.SHOTGUN_DAMAGE["12-gauge"].buckshot, w.name);
  }
});

test("Reference tables: 1-12, 2-2, 5-5, 5-6, 6-8 (checked against page images)", () => {
  // Sam's example (p.14): 2d10 = 12 → 4 ft. 10 in. + 12 in. = 5 ft. 10 in.; weight 120 + 12 × 6 = 192 lb.
  const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };
  const r = CoC.rollHeightWeight("male", seq([0.5, 0.5, 0.5, 0.5])); // 2d10 → 6+6 = 12, 2d4 → 3+3 = 6
  assert.deepEqual([r.height, r.weight], ["5 ft. 10 in.", "192 lb."]);     // matches the book's Sam: 5'10", 192 lb.
  assert.equal(CoC.rollHeightWeight("Female", () => 0).height, "4 ft. 7 in.");
  assert.deepEqual(CoC.DC_EXAMPLES.map((x) => x[1]), [0, 5, 10, 15, 20, 25, 30]);
  assert.deepEqual(CoC.COVER.map((x) => x[1]).slice(0, 4), ["+2", "+4", "+7", "+10"]);
  assert.deepEqual(CoC.CONCEALMENT.map((x) => x[1]).slice(0, 4), ["10%", "20%", "30%", "40%"]);
  assert.deepEqual(CoC.SHOTGUN_DAMAGE["12-gauge"], { buckshot: "3d6/2d6/1d6", birdshot: "3d3/2d3/1d3", slug: "2d10", critical: "×4" });
  assert.equal(CoC.SHOTGUN_DAMAGE[".410"].birdshot, "1d4/1/1");
  const spas = CoC.WEAPON_PRESETS.find((w) => w.name.startsWith("Franchi SPAS-12"));
  assert.deepEqual([spas.capacity, spas.critical, spas.category], [7, "×4", "shotgun"]);
});
