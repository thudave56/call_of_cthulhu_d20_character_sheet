/*
 * store.js — saved characters for this browser.
 *
 * Each character lives in its own localStorage entry (`cocd20v2:char:<id>`) so
 * one bad record can't take the rest with it. A small index (`cocd20v2:index`)
 * powers the character list. Cookies remember the last character opened and
 * the chosen play design, so returning to the page picks up where you left off.
 * localStorage is used for the data itself because cookies are limited to ~4 KB.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"));
  else root.Store = factory(root.CoC);
})(typeof self !== "undefined" ? self : this, function (CoC) {
  "use strict";

  const PREFIX = "cocd20v2:";
  const INDEX_KEY = PREFIX + "index";
  const LEGACY_KEY = "cocd20_characters";
  const LEGACY_DONE_KEY = PREFIX + "legacyImported";        // set by older versions: "everything copied once"
  const LEGACY_NAMES_KEY = PREFIX + "legacyImportedNames";  // names already copied, so later v1 characters are picked up

  // Legacy (v1) array orders, used to translate index-based saves.
  const LEGACY_FEATS = "Acrobatic|Alertness|Ambidexterity|Animal Affinity|Athletic|Blind-Fight|Cautious|Combat Casting|Dodge|Mobility|Spring Attack|Drive-By Attack|Endurance|Expertise|Gearhead|Great Fortitude|Improved Critical|Improved Initiative|Iron Will|Lightning Reflexes|Martial Artist|Nimble|Persuasive|Point Blank Shot|Far Shot|Precise Shot|Rapid Shot|Multishot|Shot on the Run|Rolling Shot|Power Attack|Cleave|Quick Draw|Run|Sharp-Eyed|Skill Emphasis|Stealthy|Toughness|Track|Trustworthy|Two-Weapon Fighting|Wealth|Weapon Finesse|Sensitive|Biofeedback Trance|Remote Viewing|Dowsing|Mind Reading|Mind Probe|Psychokinesis|Psychometry|Second Sight|Telepathy".split("|");
  const LEGACY_SKILLS = "Animal Empathy|Appraise|Balance|Bluff|Climb|Computer Use|Concentration|Craft|Cthulhu Mythos|Demolitions|Diplomacy|Disguise|Drive|Escape Artist|Forgery|Gather Information|Handle Animal|Heal|Hide|Innuendo|Intimidate|Jump|Knowledge|Listen|Move Silently|Open Lock|Operate Heavy Machinery|Performance|Pilot|Psychic Focus|Psychoanalysis|Read Lips|Repair|Research|Ride|Search|Sense Motive|Sleight of Hand|Spellcraft|Spot|Swim|Tumble|Use Rope|Wilderness Lore".split("|");

  let storage = null;
  try { storage = root_localStorage(); } catch (e) { storage = null; }
  const memory = {};
  function root_localStorage() { const ls = (typeof localStorage !== "undefined") ? localStorage : null; if (ls) { ls.setItem(PREFIX + "probe", "1"); ls.removeItem(PREFIX + "probe"); } return ls; }
  const get = (k) => { try { return storage ? storage.getItem(k) : (k in memory ? memory[k] : null); } catch (e) { return memory[k] ?? null; } };
  const set = (k, v) => { try { if (storage) storage.setItem(k, v); else memory[k] = v; return true; } catch (e) { memory[k] = v; return false; } };
  const del = (k) => { try { if (storage) storage.removeItem(k); } catch (e) { /* ignore */ } delete memory[k]; };
  const persistent = () => !!storage;

  // --- cookies -------------------------------------------------------------
  function setCookie(name, value, days = 365) {
    if (typeof document === "undefined") return;
    try { document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${days * 86400}; path=/; SameSite=Lax`; } catch (e) { /* ignore */ }
  }
  function getCookie(name) {
    if (typeof document === "undefined") return null;
    const m = document.cookie.split("; ").find((p) => p.startsWith(name + "="));
    return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
  }

  // --- index ---------------------------------------------------------------
  function readIndex() {
    try { const v = JSON.parse(get(INDEX_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function writeIndex(idx) { set(INDEX_KEY, JSON.stringify(idx)); }
  function summary(c) {
    const d = CoC.derive(c);
    return {
      id: c.id, name: c.name || "Unnamed investigator", profession: c.profession, level: c.level, era: c.era,
      hp: d.hp.current, hpMax: d.hp.max, san: d.sanity.current, sanMax: d.sanity.max, updated: c.updated,
    };
  }

  function list() {
    return readIndex().sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  }
  function load(id) {
    try { const raw = JSON.parse(get(PREFIX + "char:" + id) || "null"); return raw ? CoC.normalize(raw) : null; } catch (e) { return null; }
  }
  function storedRev(id) {
    try { const raw = JSON.parse(get(PREFIX + "char:" + id) || "null"); return raw ? (parseInt(raw.rev, 10) || 0) : null; } catch (e) { return null; }
  }
  /**
   * Save a character. Each save bumps `rev`; a save based on an older revision
   * than the stored one (an edit made in another tab) is refused with
   * { conflict: true } so newer work is never overwritten. Pass { force: true }
   * for new records (imports, duplicates).
   */
  function save(c, { force = false } = {}) {
    const ch = CoC.normalize(c);
    const current = storedRev(ch.id);
    if (!force && current !== null && current > (parseInt(c.rev, 10) || 0)) return { conflict: true, character: load(ch.id) };
    ch.rev = (current || 0) + 1;
    ch.updated = new Date().toISOString();
    const ok = set(PREFIX + "char:" + ch.id, JSON.stringify(ch));
    const idx = readIndex().filter((e) => e.id !== ch.id);
    idx.push(summary(ch));
    if (ok) writeIndex(idx);
    return { character: ch, persisted: ok && persistent(), failed: !ok };
  }
  function remove(id) {
    del(PREFIX + "char:" + id);
    writeIndex(readIndex().filter((e) => e.id !== id));
    if (getCookie("cocd20_last") === id) setCookie("cocd20_last", "", -1);
  }
  function duplicate(id) {
    const c = load(id);
    if (!c) return null;
    const copy = CoC.clone(c);
    copy.id = CoC.uid();
    copy.name = (c.name || "Investigator") + " (copy)";
    copy.created = new Date().toISOString();
    copy.rev = 0;
    return save(copy, { force: true }).character;
  }

  function rememberLast(id) { setCookie("cocd20_last", id); set(PREFIX + "last", id); }
  function lastOpened() { return getCookie("cocd20_last") || get(PREFIX + "last"); }
  function setPref(name, value) { setCookie("cocd20_" + name, value); set(PREFIX + "pref:" + name, value); }
  function getPref(name, fallback) { return getCookie("cocd20_" + name) || get(PREFIX + "pref:" + name) || fallback; }

  // --- import / export -----------------------------------------------------
  function exportData(ids) {
    const chars = (ids || list().map((e) => e.id)).map(load).filter(Boolean);
    return JSON.stringify({ format: "cocd20-characters", schemaVersion: CoC.SCHEMA_VERSION, exported: new Date().toISOString(), characters: chars }, null, 2);
  }
  /**
   * Accepts v2 bundles, single v2 characters, and v1 exports. Every record is
   * checked before anything is saved, so a bad file imports nothing.
   * Returns { imported: [...characters], skipped: number }.
   */
  function importData(text) {
    if (String(text).length > 5 * 1024 * 1024) throw new Error("File is larger than 5 MB.");
    const data = JSON.parse(text);
    let raws = [];
    if (data && data.format === "cocd20-characters" && Array.isArray(data.characters)) raws = data.characters;
    else if (data && data.character && data.characterName) raws = [fromLegacy(String(data.characterName), data.character)];
    else if (data && data.schemaVersion && data.abilities) raws = [data];
    else throw new Error("Not a character file.");
    const used = new Set(list().map((e) => e.id));
    const ready = [];
    let skipped = 0;
    for (const raw of raws) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) { skipped++; continue; }
      let c;
      try { c = CoC.normalize(raw); CoC.derive(c); } catch (e) { skipped++; continue; }
      if (used.has(c.id)) c.id = CoC.uid();  // never overwrite an existing or earlier record
      used.add(c.id);
      c.rev = 0;
      ready.push(c);
    }
    if (!ready.length) throw new Error("No usable characters in that file.");
    return { imported: ready.map((c) => save(c, { force: true }).character), skipped };
  }

  /**
   * Convert a v1 (original sheet) character to the v2 model. Returns the
   * character with `migrationNotes` (things a player should check) in its notes.
   */
  function fromLegacy(name, old) {
    const review = [];
    const prof = CoC.PROFESSIONS[parseInt(old.profession, 10)] || CoC.PROFESSIONS[0];
    const c = CoC.newCharacter({
      name, player: old.playerName || "", gender: old.gender || "", age: parseInt(old.age, 10) || 30,
      era: CoC.ERAS[old.era] ? old.era : "1921-1940", profession: prof.name,
      level: parseInt(old.level, 10) || 1, attackOption: old.attackOption === "offense" ? "offense" : "defense",
    });
    c.goodSaves = ["fort", "ref", "will"].filter((k) => old.goodSaves && old.goodSaves[k]);
    for (const a of CoC.ABILITIES) c.abilities[a] = parseInt(old.abilities && old.abilities[a], 10) || 10;
    // Skills: v1 had a single Knowledge/Craft/Performance row; keep ranks under a "(general)" specialty.
    const customCore = [];
    for (const s of old.skills || []) {
      const base = LEGACY_SKILLS[parseInt(s.index, 10)];
      if (!base) continue;
      const def = CoC.SKILL_BY_NAME[base];
      const id = def && def.specialty ? `${base} (general)` : base;
      const ranks = parseFloat(s.ranks) || 0;
      if (base === "Cthulhu Mythos") { c.mythos = ranks; continue; }
      if (ranks || parseInt(s.misc, 10)) c.skills[id] = { ranks, misc: parseInt(s.misc, 10) || 0 };
      if (s.isCustomCore) customCore.push(id);
    }
    // Template "any one" slots take the matching "(general)" skill, so its ranks stay core.
    const tmpl = CoC.templateCore(prof.name);
    const used = new Set();
    const core = tmpl.map((t) => {
      if (!t.includes("*")) return t;
      const general = `${CoC.skillBase(t)} (general)`;
      if (!c.skills[general] || t.includes("local:") || used.has(general) || tmpl.includes(general)) return t;
      used.add(general);
      return general;
    });
    if (core.some((t) => t.includes("*"))) review.push("pick the specialty for each \"any one\" template skill (Skills step)");
    if (Object.keys(c.skills).some((id) => id.endsWith("(general)"))) review.push("Knowledge, Craft, Performance and similar ranks were merged into \"(general)\"; rename them to real specialties");
    const extra = customCore.filter((id) => !core.includes(id)).slice(0, 3);
    c.coreSkills = core.concat(extra);
    if (extra.length < 3) review.push(`choose ${3 - extra.length} more core skill${extra.length === 2 ? "" : "s"} of your own (Skills step)`);
    c.feats = (old.feats || []).map((i) => LEGACY_FEATS[parseInt(i, 10)]).filter(Boolean).map((n) => ({ name: n }));
    if (c.feats.some((f) => (CoC.FEAT_BY_NAME[f.name] || {}).choice)) review.push("choose the weapon, category or skill for feats that need one (Feats step)");
    c.hp.current = old.currentHP === "" || old.currentHP === undefined ? null : parseInt(old.currentHP, 10);
    c.sanity.current = old.currentSanity === "" || old.currentSanity === undefined ? null : parseInt(old.currentSanity, 10);
    if (["temporary", "indefinite", "permanent"].includes(old.insanityState)) c.sanity.insanity = old.insanityState;
    // Armor: v1 used its own presets; v2 uses Table 6-4. Keep the closest match by AC bonus.
    const arm = old.armor || {};
    const bonus = parseInt(arm.bonus, 10) || 0;
    if (bonus > 0) {
      const match = CoC.ARMOR.filter((a) => a.bonus > 0).reduce((best, a) => (Math.abs(a.bonus - bonus) < Math.abs(best.bonus - bonus) ? a : best));
      if (match.bonus === bonus) c.armor = match.name;
      else review.push(`armor "${arm.name || arm.preset || "armor"}" (+${bonus}) isn't in Table 6-4; pick the right armor on the Gear step`);
    }
    c.armorWeight = parseFloat(arm.weight) || 0;
    if (old.shield && parseInt(old.shield.bonus, 10)) review.push(`the rulebook has no shields; "${old.shield.name || "shield"}" was not copied`);
    c.weapons = (old.weapons || []).map((w) => ({ id: CoC.uid(), name: w.name || "Weapon", category: w.type === "ranged" ? "pistol" : "melee", damage: w.damage || "", critical: w.critical || "×2", range: w.range || "", weight: parseFloat(w.weight) || 0 }));
    if (c.weapons.some((w) => w.category === "pistol")) review.push("ranged weapons were copied as pistols; set the right category, capacity and rate of fire (Gear step)");
    c.equipment = (old.equipment || []).map((e) => ({ id: CoC.uid(), name: e.name || "", qty: parseInt(e.quantity, 10) || 1, weight: parseFloat(e.weight) || 0, notes: e.notes || "" }));
    c.money.cash = old.currentMoney ? parseFloat(old.currentMoney) : null;
    c.sessionNotes = old.sessionNotes || "";
    review.push("re-enter the hit-die roll for each level and the starting-money roll (HP & Money step)");
    c.notes = `Copied from the original sheet. To check: ${review.join("; ")}.`;
    // Skill points at each level use the Intelligence at that time (p.16): fix them now.
    return CoC.lockIntMods(CoC.normalize(c), 1);
  }

  function legacyCharacters() {
    try { const v = JSON.parse(get(LEGACY_KEY) || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch (e) { return {}; }
  }
  function copiedNames() {
    try { const v = JSON.parse(get(LEGACY_NAMES_KEY) || "null"); if (Array.isArray(v)) return v; } catch (e) { /* fall through */ }
    // Older versions copied everything once and only stored a timestamp.
    return get(LEGACY_DONE_KEY) ? Object.keys(legacyCharacters()) : [];
  }
  /** Names of original-sheet characters in this browser, and which are not copied yet. */
  function legacyStatus() {
    const names = Object.keys(legacyCharacters());
    const done = new Set(copiedNames());
    return { names, pending: names.filter((n) => !done.has(n)) };
  }
  /**
   * Copy characters saved by the original sheet (they are left untouched).
   * By default only ones not copied before; { all: true } copies them all again.
   */
  function importLegacy({ all = false } = {}) {
    const old = legacyCharacters();
    const done = new Set(copiedNames());
    const out = [];
    for (const [name, data] of Object.entries(old)) {
      if (!all && done.has(name)) continue;
      try { out.push(save(fromLegacy(name, data || {}), { force: true }).character); done.add(name); } catch (e) { /* skip bad record */ }
    }
    set(LEGACY_NAMES_KEY, JSON.stringify([...done]));
    return out;
  }
  function importLegacyOnce() { return importLegacy(); }

  return { list, load, save, remove, duplicate, exportData, importData, fromLegacy, importLegacy, importLegacyOnce, legacyStatus, rememberLast, lastOpened, setPref, getPref, persistent };
});
