// Browser smoke test for Investigator Sheets (run in CI by .github/workflows/rules-tests.yml).
// Needs a static server on BASE_URL (default http://localhost:8790) and the `playwright` package.
// Run: python3 -m http.server 8790 & node v2/tests/browser/smoke.js
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = (process.env.BASE_URL || "http://localhost:8790") + "/v2/index.html";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const step = (name) => console.log("✓ " + name);

  await page.goto(BASE + "#/");
  await page.waitForSelector(".list-view");
  await page.click('[data-action="sample"]');
  await page.waitForSelector(".char-card");
  const id = await page.evaluate(() => Store.list()[0].id);
  step("list and sample character");

  // The worked sample in v2/DESIGNS.md: Fort +2, Ref +3, Will +7, HP 16, Sanity 75.
  for (const design of ["tracker", "sheet", "pocket"]) {
    await page.selectOption('[data-action="design"]', design);
    await page.goto(BASE + "#/play/" + id);
    await page.waitForSelector(`.design-${design}`);
    const d = await page.evaluate(() => { const x = CoC.derive(App.state.ch); return [x.saves.fort.total, x.saves.ref.total, x.saves.will.total, x.hp.max, x.sanity.current]; });
    assert.deepEqual(d, [2, 3, 7, 16, 75]);
  }
  step("all three layouts render the sample's numbers");

  await page.selectOption('[data-action="design"]', "tracker");
  await page.waitForSelector(".design-tracker");
  await page.fill("#hpAmt-t", "5");
  await page.press("#hpAmt-t", "Enter");
  await page.waitForFunction(() => CoC.derive(App.state.ch).hp.current === 11);
  await page.click('[data-action="undo"]');
  await page.waitForFunction(() => CoC.derive(App.state.ch).hp.current === 16);
  step("damage with Enter, then undo");

  // Rolls in between keep Undo available, and stay in the log.
  await page.click('.vital.hp [data-action="hp-damage"][data-n="5"]');
  await page.click('.design-tracker [data-action="roll-init"]');
  await page.click('[data-action="undo"]');
  await page.waitForFunction(() => CoC.derive(App.state.ch).hp.current === 16);
  assert.ok(await page.evaluate(() => App.state.ch.log.some((l) => l.text.startsWith("Initiative"))), "roll kept in the log");
  // Undo never rolls back a newer edit (here: notes typed after the damage).
  await page.click('.vital.hp [data-action="hp-damage"][data-n="1"]');
  await page.fill('[data-live="session-notes"]', "clue: the cellar");
  await page.click('[data-action="undo"]');
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => App.state.ch.sessionNotes), "clue: the cellar");
  assert.equal(await page.evaluate(() => CoC.derive(App.state.ch).hp.current), 15);
  step("undo keeps newer edits and rolls");

  await page.click('.wcard [data-action="roll-attack"]');
  await page.waitForFunction(() => App.state.ch.weapons[0].ammo === 8);
  step("attack spends a round");

  // Equipment & money: add, quantity, spend; weapons can be put away and equipped again.
  await page.fill("#gearNew", "Lantern");
  await page.press("#gearNew", "Enter");
  await page.waitForFunction(() => App.state.ch.equipment.some((e) => e.name === "Lantern"));
  const lantern = await page.evaluate(() => App.state.ch.equipment.findIndex((e) => e.name === "Lantern"));
  await page.click(`[data-action="gear-qty"][data-i="${lantern}"][data-v="1"]`);
  await page.waitForFunction((i) => App.state.ch.equipment[i].qty === 2, lantern);
  const cash0 = await page.evaluate(() => Number(document.querySelector('[data-live="cash"]').value));
  await page.fill("#cashAmt", "12.50");
  await page.press("#cashAmt", "Enter");
  await page.waitForFunction((c0) => Math.abs(App.state.ch.money.cash - (c0 - 12.5)) < 0.001, cash0);
  await page.click('[data-action="weapon-equip"][data-i="0"]');
  await page.waitForFunction(() => App.state.ch.weapons[0].equipped === false && !document.querySelector('.wcard [data-action="roll-attack"][data-i="0"]'));
  await page.click('[data-action="weapon-equip"][data-i="0"]');
  await page.waitForSelector('.wcard [data-action="roll-attack"][data-i="0"]');
  step("equipment, money and equipping weapons");

  await page.reload();
  await page.waitForSelector(".design-tracker");
  assert.equal(await page.evaluate(() => App.state.ch.weapons[0].ammo), 8);
  step("changes survive a reload");

  await page.goto(BASE + "#/new");
  await page.waitForSelector('[data-bind="name"]');
  await page.fill('[data-bind="name"]', "Smoke Test");
  await page.press('[data-bind="name"]', "Tab");
  for (const s of ["abilities", "skills", "feats", "hp", "gear", "magic", "review"]) {
    await page.click(`.steps a[href$="/${s}"]`);
    await page.waitForSelector(".editor-body");
  }
  step("editor steps open");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const design of ["tracker", "sheet", "pocket"]) {
    await page.selectOption('[data-action="design"]', design);
    await page.goto(BASE + "#/play/" + id);
    await page.waitForSelector(`.design-${design}`);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(width <= 390, `${design} overflows a 390px screen (${width}px)`);
  }
  step("no sideways scrolling at 390px");

  assert.deepEqual(errors, [], "console errors");
  step("no console errors");
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
