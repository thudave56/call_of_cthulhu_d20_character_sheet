/*
 * app.js — routing, state, the character list, the creation/level-up editor
 * and the play-mode actions shared by every design (see designs.js).
 *
 * Routes (hash based, so browser back/forward works):
 *   #/                 character list
 *   #/new              create a character
 *   #/edit/<id>/<step> edit / level up
 *   #/play/<id>        play the character in the chosen design
 */
(function () {
  "use strict";
  const C = window.CoC;
  const S = window.Store;
  const D = window.Designs;
  const $app = document.getElementById("app");
  const $nav = document.getElementById("topnav");

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const fmt = C.fmt;
  // Sample entries from Chapter 7, to start from or copy the format of.
  const SPELL_PRESETS = [
    { name: "Animal Form", components: "V", cost: "4 Int damage and 1d8 Sanity points", castingTime: "1 action", range: "Personal", duration: "1 hour/level (D)", save: "", notes: "p.130" },
    { name: "Fist of Yog-Sothoth", components: "S", cost: "2 Str damage and 1d6 Sanity points", castingTime: "1 action", range: "Medium (100 ft. + 10 ft./level)", duration: "Instantaneous", save: "Ref half", notes: "Force. p.142" },
    { name: "Mindblast", components: "S", cost: "4 Str damage and 1d3 Sanity points", castingTime: "1 action", range: "Close (25 ft. + 5 ft./2 levels)", duration: "1 hour", save: "Will negates", notes: "Mind-Affecting. p.146" },
  ];
  const TOME_PRESETS = [
    { name: "Necronomicon (Latin, Olaus Wormius)", language: "Latin", exam: "2d10 weeks", dc: 24, sanityInitial: "1d10", sanityComplete: "2d10", mythos: 2, spells: "3d6 spells", notes: "p.121" },
    { name: "The Sussex Manuscript", language: "English", exam: "1d8 weeks", dc: 20, sanityInitial: "1d3", sanityComplete: "1d6", mythos: 1, spells: "1d6 spells", notes: "p.121" },
  ];
  const STEPS = [
    { key: "basics", label: "Basics" },
    { key: "abilities", label: "Abilities" },
    { key: "skills", label: "Skills" },
    { key: "feats", label: "Feats" },
    { key: "hp", label: "HP & Money" },
    { key: "gear", label: "Gear" },
    { key: "magic", label: "Magic" },
    { key: "review", label: "Review" },
  ];

  const state = { ch: null, dirty: false, route: { view: "list" }, saveTimer: null, design: S.getPref("design", "tracker"), pocketTab: "vitals", skillFilter: "", skillMode: "all", featFilter: "", featAvailable: false, banners: [], undo: null };

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  function toast(html, ms = 4000) {
    const t = document.getElementById("toast");
    t.innerHTML = html;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }
  function pushLog(ch, text) {
    ch.log = [{ t: new Date().toISOString(), text }, ...(ch.log || [])].slice(0, 60);
  }
  /** Save the open character if it has unsaved changes (debounced unless immediate). */
  function persist(immediate = false) {
    clearTimeout(state.saveTimer);
    const run = () => {
      if (!state.ch || !state.dirty) return;
      const res = S.save(state.ch);
      if (res.conflict) {
        // Another tab saved a newer version: keep it rather than overwrite it.
        state.dirty = false;
        if (res.character) state.ch = res.character;
        toast("This character was changed in another tab. Showing the newer version; your last change here was not saved.", 7000);
        render();
        return;
      }
      state.dirty = false;
      state.ch.rev = res.character.rev;
      state.ch.updated = res.character.updated;
      if (res.failed) toast("⚠ Couldn't save: this browser's storage is full or blocked. Export your character to keep it.", 7000);
      else if (!res.persisted) toast("⚠ This browser is not keeping data (private mode?). Export your character to keep it.");
      const el = document.getElementById("saveState");
      if (el) el.textContent = "Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    if (immediate) run(); else state.saveTimer = setTimeout(run, 300);
  }
  /**
   * Mutate the current character, re-normalise, save and re-render. Pass
   * `undo: "label"` to let the player take this change back with Undo. Any other
   * change clears Undo (so it can never roll back a newer edit), except log-only
   * updates such as rolls, which pass `logOnly: true`.
   */
  function update(fn, { render: doRender = true, undo = null, logOnly = false } = {}) {
    const before = state.ch;
    const next = C.clone(state.ch);
    const result = fn(next);
    state.ch = C.normalize(result || next);
    if (undo) state.undo = { ch: before, label: undo };
    else if (!logOnly) state.undo = null;
    state.dirty = true;
    persist();
    if (doRender) render();
  }
  function undoLast() {
    const u = state.undo;
    if (!u || !state.ch || u.ch.id !== state.ch.id) { state.undo = null; render(); toast("Nothing to undo: there's been a newer change."); return; }
    const restored = C.clone(u.ch);
    restored.rev = state.ch.rev;   // a newer save of our own, not a conflict
    // Rolls made since stay in the log; only the labelled change is taken back.
    restored.log = state.ch.log;
    pushLog(restored, `Undid: ${u.label}`);
    state.ch = restored;
    state.undo = null;
    state.dirty = true;
    persist();
    render();
    toast(`Undid: ${esc(u.label)}`);
  }
  /**
   * Roll d20 + mod. Only attack rolls treat natural results specially: a natural 1
   * always misses, a natural 20 always hits, and a roll in the weapon's threat
   * range is a possible critical (p.66). Skill checks get no automatic success or
   * failure (p.19), and the rulebook gives none for saves or ability checks.
   */
  function rollD20(mod, label, opts = {}) {
    const r = C.rollDie(20);
    const total = r + mod;
    let tag = "", note = "";
    if (opts.attack) {
      const threat = opts.threat || 20;
      if (r === 1) { tag = ' <span class="nat nat1">natural 1 — automatic miss</span>'; note = " — nat 1, miss"; }
      else if (r >= threat) { tag = ` <span class="nat nat20">${r === 20 ? "natural 20 — hits; " : ""}critical threat: roll again to confirm</span>`; note = ` — ${r === 20 ? "nat 20, hit, " : ""}threat`; }
    }
    toast(`<strong>${esc(label)}</strong><br><span class="roll-big">${total}</span> <span class="muted">(d20 ${r} ${fmt(mod)})</span>${tag}`);
    update((ch) => { pushLog(ch, `${label}: ${total} (d20 ${r} ${fmt(mod)})${note}`); if (opts.spend) opts.spend(ch); }, { render: state.route.view === "play", undo: opts.spend ? label : null, logOnly: !opts.spend });
    return total;
  }
  function rollDice(expr) {
    const p = C.parseDamage(expr);
    if (!p) return null;
    let sum = 0; const rolls = [];
    for (let i = 0; i < p.n; i++) { const r = C.rollDie(p.d); rolls.push(r); sum += r; }
    return { total: sum + p.bonus, rolls, bonus: p.bonus };
  }
  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function confirmDialog(html, okLabel = "OK") {
    return new Promise((resolve) => {
      const dlg = document.getElementById("dialog");
      dlg.innerHTML = `<form method="dialog" class="dialog-body">${html}<div class="dialog-actions"><button value="cancel" class="btn ghost">Cancel</button><button value="ok" class="btn primary">${esc(okLabel)}</button></div></form>`;
      dlg.onclose = () => resolve(dlg.returnValue === "ok");
      dlg.showModal();
    });
  }

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------
  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) return { view: "list" };
    if (parts[0] === "new") return { view: "new" };
    let id = "";
    try { id = decodeURIComponent(parts[1] || ""); } catch (e) { id = ""; }
    if (parts[0] === "edit" && id) return { view: "edit", id, step: parts[2] || "basics" };
    if (parts[0] === "play" && id) return { view: "play", id };
    return { view: "list" };
  }
  function go(hash) { if (location.hash === hash) onRoute(); else location.hash = hash; }
  function onRoute() {
    const r = parseRoute();
    if (r.view === "new") {
      const ch = C.newCharacter();
      ch.coreSkills = C.templateCore(ch.profession);
      persist(true);
      state.ch = C.normalize(ch);
      state.dirty = false;   // not saved until the first edit, so abandoned drafts don't pile up
      state.undo = null;
      state.banners = [];
      history.replaceState(null, "", `#/edit/${state.ch.id}/basics`);
      state.route = { view: "edit", id: state.ch.id, step: "basics" };
    } else if (r.view === "edit" || r.view === "play") {
      if (!state.ch || state.ch.id !== r.id) {
        persist(true);
        state.ch = S.load(r.id);
        state.dirty = false;
        state.undo = null;
        state.banners = [];
        if (!state.ch) { toast("That character isn't saved in this browser."); go("#/"); return; }
      }
      S.rememberLast(r.id);
      state.route = r;
    } else {
      persist(true);
      state.route = r;
    }
    render();
    window.scrollTo(0, 0);
    // Move focus to the new screen's heading so keyboard and screen-reader users land on it.
    const h = $app.querySelector("h1[tabindex], .route-focus");
    if (h) h.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  // Attributes that identify a control across re-renders, so focus can be put back.
  const FOCUS_KEYS = ["action", "bind", "live", "filter", "i", "id", "k", "a", "level", "slot", "v", "n", "mode", "name"];
  function focusSelector(el) {
    if (!el || el === document.body || !$app.contains(el) && !$nav.contains(el)) return null;
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = FOCUS_KEYS.filter((k) => el.dataset[k] !== undefined).map((k) => `[data-${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${CSS.escape(el.dataset[k])}"]`);
    return parts.length ? el.tagName.toLowerCase() + parts.join("") : null;
  }
  /**
   * Render now, or — while a change event is being handled — just after it, so
   * a Tab press has already moved focus to the next field and we can keep it there.
   */
  let deferRender = false, renderQueued = false;
  function render() {
    if (deferRender) { if (!renderQueued) { renderQueued = true; setTimeout(() => { renderQueued = false; renderNow(); }, 0); } return; }
    renderNow();
  }
  function renderNow() {
    const active = document.activeElement;
    const sel = focusSelector(active);
    const caret = active && typeof active.selectionStart === "number" ? [active.selectionStart, active.selectionEnd] : null;
    const scrollY = window.scrollY;
    paint();
    if (!sel) return;
    const again = document.querySelector(sel);
    if (again && again !== document.activeElement) {
      again.focus({ preventScroll: true });
      if (caret) { try { again.setSelectionRange(caret[0], caret[1]); } catch (e) { /* number inputs */ } }
      window.scrollTo(0, scrollY);
    }
  }
  function paint() {
    const r = state.route;
    document.body.dataset.view = r.view;
    document.body.dataset.design = r.view === "play" ? state.design : "";
    renderNav();
    if (r.view === "list") $app.innerHTML = renderList();
    else if (r.view === "edit") $app.innerHTML = renderEditor(r.step);
    else if (r.view === "play") $app.innerHTML = D.render(state.design, state.ch, C.derive(state.ch), ctx());
    document.title = (state.ch && r.view !== "list" ? (state.ch.name || "New investigator") + " — " : "") + "Investigator Sheets";
  }
  function ctx() { return { esc, fmt, C, state, banners: state.banners }; }

  function renderNav() {
    const r = state.route;
    const id = state.ch && state.ch.id;
    // The layout menu is on every page; the choice is saved (cookie + localStorage)
    // and used whenever a character is played.
    const layouts = D.list.map((d) => `<option value="${d.key}" ${d.key === state.design ? "selected" : ""} title="${esc(d.blurb)}">${esc(d.name)}</option>`).join("");
    const layoutMenu = `<label class="layout-menu" title="Choose how the play screen is laid out"><span class="layout-lbl">Layout</span><select data-action="design" aria-label="Layout preference">${layouts}</select></label>`;
    const charLinks = r.view === "list" || !id ? "" : `
      <a class="navlink ${r.view === "edit" ? "active" : ""}" href="#/edit/${id}/${r.step || "basics"}">Edit</a>
      <a class="navlink ${r.view === "play" ? "active" : ""}" href="#/play/${id}">Play</a>`;
    $nav.innerHTML = `${charLinks}
      ${layoutMenu}
      ${r.view === "play" ? `<button class="btn small ghost" data-action="print" title="Print this sheet (always uses the Classic Sheet layout)">Print</button>` : ""}
      <span class="save-state" id="saveState" aria-live="polite"></span>`;
  }

  // ---------------------------------------------------------------------------
  // Character list
  // ---------------------------------------------------------------------------
  function renderList() {
    const items = S.list();
    const last = S.lastOpened();
    const legacy = S.legacyStatus();
    const cards = items.map((e) => {
      const hpPct = e.hpMax > 0 ? Math.max(0, Math.min(100, (e.hp / e.hpMax) * 100)) : 0;
      const sanPct = e.sanMax > 0 ? Math.max(0, Math.min(100, (e.san / e.sanMax) * 100)) : 0;
      return `<article class="char-card ${e.id === last ? "is-last" : ""}">
        <a class="char-main" href="#/play/${esc(e.id)}">
          <h3>${esc(e.name)}</h3>
          <p class="muted">Level ${esc(e.level)} ${esc(e.profession)} · ${esc((C.ERAS[e.era] || {}).label || e.era)}</p>
          <div class="mini-bars">
            <div class="mini"><span>HP ${esc(e.hp)}/${esc(e.hpMax)}</span><i style="width:${hpPct}%" class="hp"></i></div>
            <div class="mini"><span>SAN ${esc(e.san)}/${esc(e.sanMax)}</span><i style="width:${sanPct}%" class="san"></i></div>
          </div>
          ${e.id === last ? '<span class="badge">Last played</span>' : ""}
        </a>
        <div class="char-actions">
          <a class="btn small" href="#/play/${esc(e.id)}">Play</a>
          <a class="btn small ghost" href="#/edit/${esc(e.id)}/basics">Edit</a>
          <button class="btn small ghost" data-action="dup" data-id="${esc(e.id)}">Duplicate</button>
          <button class="btn small ghost" data-action="export-one" data-id="${esc(e.id)}">Export</button>
          <button class="btn small danger ghost" data-action="delete" data-id="${esc(e.id)}">Delete</button>
        </div>
      </article>`;
    }).join("");
    return `<section class="list-view">
      <div class="list-head">
        <div>
          <h1 tabindex="-1">Your investigators</h1>
          <p class="muted">Saved in this browser${S.persistent() ? "" : " — <strong>storage is unavailable, export to keep your work</strong>"}. They stay here between visits; export a file to move them to another device.</p>
        </div>
        <div class="list-buttons">
          <a class="btn primary" href="#/new">+ New investigator</a>
          <button class="btn ghost" data-action="import">Import file</button>
          <button class="btn ghost" data-action="sample" title="Adds the worked example from the rulebook-check document">Add sample</button>
          ${items.length ? '<button class="btn ghost" data-action="export-all">Export all</button>' : ""}
          ${legacy.names.length ? `<button class="btn ghost" data-action="legacy-import" title="Copy characters saved by the original sheet in this browser">Copy from original sheet${legacy.pending.length ? ` (${legacy.pending.length} new)` : ""}</button>` : ""}
        </div>
      </div>
      ${items.length ? `<div class="card-grid">${cards}</div>` : `<div class="empty"><p>No investigators yet.</p><p class="muted">Create one, or import a <code>.json</code> file exported from this or the original sheet.</p></div>`}
      <p class="muted small">Rules: Call of Cthulhu d20 core rulebook. You can still open <a href="../index.html?v1">the original sheet (v1)</a>.</p>
    </section>`;
  }

  // ---------------------------------------------------------------------------
  // Editor
  // ---------------------------------------------------------------------------
  function stepNav(current, issues) {
    const id = state.ch.id;
    const badge = (key) => {
      if (key === "review" || key === "magic") return "";
      const mine = issues.filter((x) => x.step === key);
      const errs = mine.filter((x) => x.level === "error").length;
      if (errs) return ` <span class="step-badge bad" title="${errs} rule problem${errs > 1 ? "s" : ""}">${errs}</span>`;
      if (mine.length) return ` <span class="step-badge warn" title="${mine.length} reminder${mine.length > 1 ? "s" : ""}">${mine.length}</span>`;
      return ' <span class="step-badge ok" aria-label="no problems">✓</span>';
    };
    return `<ol class="steps">${STEPS.map((s, i) => `<li><a href="#/edit/${id}/${s.key}" class="${s.key === current ? "current" : ""}" ${s.key === current ? 'aria-current="step"' : ""}><span class="num">${i + 1}</span>${s.label}${badge(s.key)}</a></li>`).join("")}</ol>`;
  }
  /** Problems for the current step (the Review step lists them all). */
  function issuesPanel(all, step) {
    const issues = step === "review" ? all : all.filter((x) => x.step === step);
    const elsewhere = all.length - issues.length;
    const more = elsewhere ? ` <span class="muted">${elsewhere} more on other steps (see the step numbers above).</span>` : "";
    if (!issues.length) return `<div class="issues ok">✓ ${step === "review" ? "This character follows the creation rules." : "Nothing to fix on this step."}${more}</div>`;
    const errs = issues.filter((i) => i.level === "error");
    const warns = issues.filter((i) => i.level === "warn");
    return `<details class="issues" ${errs.length ? "open" : ""}><summary>${errs.length ? `<span class="bad">${errs.length} rule problem${errs.length > 1 ? "s" : ""}</span>` : ""} ${warns.length ? `<span class="warn">${warns.length} reminder${warns.length > 1 ? "s" : ""}</span>` : ""}</summary>
      <ul>${errs.map((i) => `<li class="bad">${esc(i.msg)}</li>`).join("")}${warns.map((i) => `<li class="warn">${esc(i.msg)}</li>`).join("")}</ul>${more ? `<p>${more}</p>` : ""}</details>`;
  }
  function renderEditor(step) {
    const ch = state.ch;
    const d = C.derive(ch);
    const issues = C.validate(ch, { creation: true });
    const idx = STEPS.findIndex((s) => s.key === step);
    const prev = STEPS[idx - 1], next = STEPS[idx + 1];
    const body = ({ basics: edBasics, abilities: edAbilities, skills: edSkills, feats: edFeats, hp: edHpMoney, gear: edGear, magic: edMagic, review: edReview }[step] || edBasics)(ch, d, issues);
    return `<section class="editor">
      <div class="editor-head">
        <h1 tabindex="-1">${esc(ch.name || "New investigator")} <span class="muted">· Level ${ch.level} ${esc(ch.profession)}</span></h1>
        ${stepNav(idx >= 0 ? step : "basics", issues)}
      </div>
      ${state.banners.length ? `<div class="banner">${state.banners.map(esc).join("<br>")} <button class="btn small ghost" data-action="clear-banners">Dismiss</button></div>` : ""}
      ${issuesPanel(issues, idx >= 0 ? step : "basics")}
      <div class="editor-body">${body}</div>
      <div class="editor-foot">
        ${prev ? `<a class="btn ghost" href="#/edit/${ch.id}/${prev.key}">← ${prev.label}</a>` : "<span></span>"}
        ${next ? `<a class="btn primary" href="#/edit/${ch.id}/${next.key}">${next.label} →</a>` : `<a class="btn primary" href="#/play/${ch.id}">Play this character →</a>`}
      </div>
    </section>`;
  }

  const field = (label, html, hint = "") => `<label class="field"><span class="lbl">${label}</span>${html}${hint ? `<span class="hint">${hint}</span>` : ""}</label>`;
  const inp = (path, value, attrs = "") => `<input data-bind="${path}" value="${esc(value)}" ${attrs} />`;

  function edBasics(ch, d) {
    const profs = C.PROFESSIONS.map((p) => `<option ${p.name === ch.profession ? "selected" : ""}>${esc(p.name)}</option>`).join("");
    const eras = Object.entries(C.ERAS).map(([k, v]) => `<option value="${k}" ${k === ch.era ? "selected" : ""}>${esc(v.label)}</option>`).join("");
    const need = C.goodSaveCount(ch.attackOption);
    const saveBox = (k, label) => `<label class="check"><input type="checkbox" data-action="good-save" value="${k}" ${ch.goodSaves.includes(k) ? "checked" : ""}/> ${label}</label>`;
    return `<div class="grid2">
      ${field("Character name", inp("name", ch.name, 'required autocomplete="off"'))}
      ${field("Player", inp("player", ch.player, 'autocomplete="off"'))}
      ${field("Age", inp("age", ch.age, 'type="number" min="15" max="120"'), `Aging: ${esc(d.aging.label)}${d.aging.physical ? ` — ${d.aging.physical} Str/Dex/Con, +${d.aging.mental} Int/Wis/Cha (Table 1-11)` : ""}`)}
      ${field("Gender", inp("gender", ch.gender, 'autocomplete="off"'))}
      <div class="field"><span class="lbl">Height &amp; weight</span><div class="row" style="margin:0">${inp("height", ch.height || "", 'placeholder="5 ft. 10 in." aria-label="Height" style="width:8em"')}${inp("weight", ch.weight || "", 'placeholder="180 lb." aria-label="Weight" style="width:7em"')}<button class="btn small ghost" data-action="roll-height-weight" title="Table 1-12: base + 2d10 in.; weight base + (that roll × 2d4) lb.">Roll (Table 1-12)</button></div></div>
      ${field("Era", `<select data-bind="era">${eras}</select>`, "Sets starting money and income (Table 1-14).")}
      ${field("Profession", `<select data-action="profession">${profs}</select>`, `Income modifier ${fmt(C.PROFESSION_BY_NAME[ch.profession].moneyMod)} (Table 1-13). Changing profession replaces the 9 template core skills (you'll be asked first).`)}
      ${field("Level", inp("level", ch.level, 'type="number" min="1" max="20"'), "To advance a character in play, use Level up on the play screen.")}
      ${field("Experience points", inp("xp", ch.xp, 'type="number" min="0" step="50"'), d.xp.next === null ? "20th level is the highest." : `Level ${ch.level + 1} at ${d.xp.next.toLocaleString()} XP (Table 1-10, p.11).${d.xp.current >= d.xp.next ? " <strong>Enough to level up.</strong>" : ""}`)}
      ${field("Attack option", `<select data-action="attack-option"><option value="defense" ${ch.attackOption === "defense" ? "selected" : ""}>Defense — 2 good saves, BAB +0 at 1st</option><option value="offense" ${ch.attackOption === "offense" ? "selected" : ""}>Offense — 1 good save, BAB +1 at 1st</option></select>`, "Tables 1-8 / 1-9.")}
    </div>
    <fieldset class="field"><legend class="lbl">Good saves — choose exactly ${need}</legend>
      <div class="row">${saveBox("fort", "Fortitude")}${saveBox("ref", "Reflex")}${saveBox("will", "Will")}</div>
    </fieldset>
    <fieldset class="field"><legend class="lbl">Optional rules</legend>
      <label class="check"><input type="checkbox" data-action="opt-defense" ${ch.options.defenseBonus ? "checked" : ""}/> Variant: Defense bonus by level (Table 1-15, p.15) — adds to AC; Offense characters also get a bonus Weapon Proficiency feat.</label>
      <label class="check"><input type="checkbox" data-action="opt-offense-wp" ${ch.options.offenseWeaponProficiency ? "checked" : ""}/> House rule: give Offense characters the bonus Weapon Proficiency even without the variant. (As written, p.15 grants it as part of the Defense Bonus variant, to balance that variant.)</label>
    </fieldset>
    ${field("Cthulhu Mythos ranks", inp("mythos", ch.mythos, 'type="number" min="0"'), "Never bought with skill points: starts at 0 and rises through play (Mythos insanity, tomes). Maximum Sanity = 99 − Mythos ranks − any Mythos bonus (misc).")}
    ${field("Background & description", `<textarea data-bind="notes" rows="4">${esc(ch.notes)}</textarea>`)}`;
  }

  function edAbilities(ch, d) {
    const rows = C.ABILITIES.map((a) => {
      const s = d.scores[a];
      return `<tr>
        <th scope="row">${C.ABILITY_NAMES[a]}</th>
        <td><input type="number" min="1" max="25" data-bind="abilities.${a}" value="${esc(ch.abilities[a])}" aria-label="${C.ABILITY_NAMES[a]} rolled score" /></td>
        <td class="num">${s.ageMod ? fmt(s.ageMod) : "—"}</td>
        <td class="num">${s.increases ? "+" + s.increases : "—"}</td>
        <td class="num strong">${s.permanent}</td>
        <td class="num strong">${fmt(C.abilityMod(s.permanent))}</td>
      </tr>`;
    }).join("");
    const mods = C.ABILITIES.map((a) => C.abilityMod(d.scores[a].permanent));
    const total = mods.reduce((x, y) => x + y, 0);
    const highest = Math.max(...C.ABILITIES.map((a) => C.toInt(ch.abilities[a])));
    const reroll = total <= 0 || highest <= 13;
    return `<p class="muted">Roll 4d6 and drop the lowest die for each score, then assign them (p.6). Aging and level increases are applied automatically.</p>
      <div class="row"><button class="btn" data-action="roll-abilities">Roll 4d6 (drop lowest) ×6</button></div>
      <div class="table-wrap"><table class="abil-table"><thead><tr><th>Ability</th><th>Rolled</th><th>Aging</th><th>Level +</th><th>Score</th><th>Mod</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="${reroll ? "warn" : "ok"}">Total modifiers ${fmt(total)}, highest rolled score ${highest}. ${reroll ? "These scores are too low — you may reroll all six (total modifiers ≤ 0 or highest ≤ 13, p.6)." : "Scores are acceptable."}</p>
      ${C.abilityIncreaseLevels(ch.level).length ? `<h3>Ability increases (one point at levels ${C.abilityIncreaseLevels(ch.level).join(", ")})</h3>
      <div class="row">${C.abilityIncreaseLevels(ch.level).map((l) => field(`Level ${l}`, `<select data-action="ability-increase" data-level="${l}"><option value="">— choose —</option>${C.ABILITIES.map((a) => `<option ${ch.levelLog[l - 1].abilityIncrease === a ? "selected" : ""}>${a}</option>`).join("")}</select>`)).join("")}</div>` : ""}`;
  }

  function edSkills(ch, d) {
    const tmpl = C.templateCore(ch.profession);
    // Template slots with specialty pickers
    const slotHtml = tmpl.map((t, i) => {
      if (!t.includes("*")) return `<li>${esc(t)}</li>`;
      const base = C.skillBase(t);
      const prefix = t.includes("local:") ? "local: " : "";
      const current = ch.coreSkills[i] && !ch.coreSkills[i].includes("*") ? C.skillSpecialty(ch.coreSkills[i]).replace(/^local:\s*/, "") : "";
      return `<li>${esc(base)} (${prefix}<input class="spec" data-action="core-spec" data-slot="${i}" value="${esc(current)}" placeholder="${prefix ? "city" : "specialty"}" aria-label="${esc(base)} specialty" />)</li>`;
    }).join("");
    const extra = ch.coreSkills.slice(9);
    const options = (sel) => `<option value="">— choose —</option>` + C.SKILLS.filter((s) => !s.mythos).map((s) => `<option value="${esc(s.name)}" ${sel && C.skillBase(sel) === s.name ? "selected" : ""}>${esc(s.name)}</option>`).join("");
    const extraHtml = [0, 1, 2].map((i) => {
      const id = extra[i] || "";
      const def = id ? C.skillDef(id) : null;
      return `<div class="extra-core"><select data-action="extra-core" data-i="${i}" aria-label="Extra core skill ${i + 1}">${options(id)}</select>${def && def.specialty ? `<input class="spec" data-action="extra-spec" data-i="${i}" value="${esc(C.skillSpecialty(id) === "*" ? "" : C.skillSpecialty(id))}" placeholder="specialty" aria-label="Extra core skill ${i + 1} specialty" />` : ""}</div>`;
    }).join("");
    const sp = d.skillPoints;
    const rows = d.skills.filter((r) => !r.def.mythos).map((r) => `<tr class="${r.core ? "core" : ""}">
        <th scope="row">${esc(r.id)}${r.def.untrained ? "" : ' <span class="tag" title="Trained only — needs at least 1 rank">T</span>'}${r.def.acp ? ' <span class="tag" title="Armor check penalty applies">A</span>' : ""}</th>
        <td>${r.core ? "Core" : "—"}</td>
        <td><input type="number" min="0" max="${r.max}" step="${r.core ? 1 : 0.5}" data-action="ranks" data-id="${esc(r.id)}" value="${r.ranks || ""}" placeholder="0" aria-label="${esc(r.id)} ranks" /></td>
        <td class="num">${r.max}</td>
        <td class="num">${r.cost || ""}</td>
        <td class="num">${r.ability ? fmt(r.parts.ability) : "—"}</td>
        <td><input type="number" data-action="misc" data-id="${esc(r.id)}" value="${C.toInt((ch.skills[r.id] || {}).misc) || ""}" placeholder="0" aria-label="${esc(r.id)} misc" /></td>
        <td class="num strong" title="${esc(breakdown(r))}">${fmt(r.total)}</td>
      </tr>`).join("");
    return `<div class="grid2">
      <div><h3>Template core skills (${esc(ch.profession)})</h3><ol class="tmpl">${slotHtml}</ol></div>
      <div><h3>+ three core skills of your choice</h3>${extraHtml}
        <p class="hint">Core skills cost 1 point per rank (max level + 3). All other skills cost 1 point per ½ rank (max half that); half ranks don't add to checks. Cthulhu Mythos can't be bought — it comes from play.</p></div>
    </div>
    <div class="sp-tracker ${sp.remaining < 0 ? "bad" : sp.remaining === 0 ? "ok" : ""}">Skill points: <strong>${sp.spent}</strong> / ${sp.available} spent · ${sp.remaining >= 0 ? sp.remaining + " left" : -sp.remaining + " over!"} <span class="muted">(${sp.perLevel.join(" + ")})</span></div>
    <div class="row"><label class="field inline"><span class="lbl">Add a specialty skill</span><select id="addSpecBase">${C.SKILLS.filter((s) => s.specialty).map((s) => `<option>${s.name}</option>`).join("")}</select><input id="addSpecName" placeholder="e.g. occult, French, painting" /><button class="btn small" data-action="add-spec">Add</button></label></div>
    <div class="table-wrap"><table class="skill-edit"><thead><tr><th>Skill</th><th>Core</th><th>Ranks</th><th>Max</th><th>Cost</th><th>Abil</th><th>Misc</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function breakdown(r) {
    const p = r.parts; const out = [`${p.ranks} ranks`];
    if (r.ability) out.push(`${fmt(p.ability)} ${r.ability}`);
    if (p.feat) out.push(`${fmt(p.feat)} feat`); if (p.emphasis) out.push(`+3 Skill Emphasis`);
    if (p.synergy) out.push(`+2 synergy`); if (p.armor) out.push(`${p.armor} armor`); if (p.gear) out.push(`${p.gear} gear weight`); if (p.misc) out.push(`${fmt(p.misc)} misc`);
    return out.join(", ");
  }

  function choiceInput(f, i, ch) {
    const def = C.FEAT_BY_NAME[f.name];
    if (!def || !def.choice) return "";
    let opts = [];
    if (def.choice === "category") opts = Object.entries(C.WEAPON_CATEGORIES).filter(([k]) => k !== "unarmed").map(([k, v]) => [k, v]);
    else if (def.choice === "finesse") opts = C.FINESSE_WEAPONS.map((w) => [w, w]);
    else if (def.choice === "weapon") {
      // Weapon feats follow one specific weapon you own (by id, so renaming it keeps the feat).
      opts = (ch.weapons || []).map((w) => [w.id, w.name]);
      if (f.choice && !opts.some(([v]) => v === f.choice)) {
        const byName = (ch.weapons || []).find((w) => w.name === f.choice);
        opts.unshift([f.choice, byName ? `${f.choice} (old link — re-pick)` : `${f.choice} (no longer carried)`]);
      }
      if (!opts.length) return `<span class="hint">Add a weapon on the Gear step first.</span>`;
    }
    else if (def.choice === "skill") opts = C.skillIds(ch).filter((id) => id !== "Cthulhu Mythos").map((s) => [s, s]);
    return `<select data-action="feat-choice" data-i="${i}" aria-label="${esc(f.name)} choice"><option value="">— choose ${def.choice} —</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${f.choice === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  }
  function edFeats(ch, d) {
    const chosen = ch.feats.map((f, i) => {
      const probs = C.featPrereqIssues(ch, f);
      return `<li class="${probs.length ? "bad" : ""}"><strong>${esc(f.name)}</strong> ${choiceInput(f, i, ch)} <button class="btn small ghost" data-action="feat-remove" data-i="${i}" aria-label="Remove ${esc(f.name)}">Remove</button>
        <div class="hint">${esc(C.FEAT_BY_NAME[f.name] ? C.FEAT_BY_NAME[f.name].text : "")}</div>${probs.length ? `<div class="bad small">${probs.map(esc).join("; ")}</div>` : ""}</li>`;
    }).join("");
    const q = state.featFilter.trim().toLowerCase();
    let shown = 0;
    const avail = C.FEATS.map((f) => {
      const taken = C.hasFeat(ch, f.name);
      const probs = C.featPrereqIssues(ch, { name: f.name, choice: "x" }).filter((m) => !/choose a|pick one of your weapons|no longer one of your skills/.test(m));
      const disabled = (taken && !f.multi) || probs.length > 0;
      if (q && !(f.name + " " + f.text).toLowerCase().includes(q)) return "";
      if (state.featAvailable && disabled) return "";
      shown++;
      const pre = f.prereq ? [...Object.entries(f.prereq.abil || {}).map(([a, v]) => `${a} ${v}+`), ...(f.prereq.feats || []), ...(f.prereq.bab ? [`BAB +${f.prereq.bab}`] : []), ...(f.prereq.proficient ? ["proficient"] : [])].join(", ") : "";
      return `<li class="${disabled ? "dim" : ""}"><button class="btn small" data-action="feat-add" data-name="${esc(f.name)}" ${disabled ? "disabled" : ""}>Add</button> <strong>${esc(f.name)}</strong>${f.psychic ? ' <span class="tag">Psychic</span>' : ""}${f.multi ? ' <span class="tag" title="Can be taken more than once">×</span>' : ""}
        <span class="hint">${esc(f.text)}${pre ? ` <em>Requires: ${esc(pre)}.</em>` : ""}${probs.length ? ` <span class="bad">(${probs.map(esc).join("; ")})</span>` : ""}</span></li>`;
    }).join("");
    return `<div class="sp-tracker ${ch.feats.length > d.featSlots ? "bad" : ch.feats.length === d.featSlots ? "ok" : ""}">Feats: <strong>${ch.feats.length}</strong> / ${d.featSlots} <span class="muted">(2 at 1st level, +1 at every level divisible by 3${C.offenseBonusFeat(ch) ? ", +1 bonus Weapon Proficiency for the Offense option" : ""})</span></div>
      <p class="hint">No character is proficient with weapons by default: without the right Weapon Proficiency feat, attacks take −4 (p.43). Psychic feats need GM approval.</p>
      <h3>Your feats</h3><ul class="feat-list chosen">${chosen || '<li class="muted">None yet.</li>'}</ul>
      <h3>Available feats</h3>
      <div class="row feat-controls"><input type="search" data-filter="feat" value="${esc(state.featFilter)}" placeholder="Search feats…" aria-label="Search feats" /><label class="check"><input type="checkbox" data-action="feat-available" ${state.featAvailable ? "checked" : ""}/> Only feats I can take now</label></div>
      <ul class="feat-list">${avail || ""}${shown ? "" : '<li class="muted">No feats match.</li>'}</ul>`;
  }

  function edHpMoney(ch, d) {
    const hp = d.hp;
    const lv = ch.levelLog.slice(1).map((e, i) => `<tr><th scope="row">Level ${i + 2}</th>
      <td><input type="number" min="1" max="6" data-action="hp-roll" data-level="${i + 2}" value="${esc(e.hpRoll || "")}" placeholder="1d6" aria-label="Level ${i + 2} hit die" /></td>
      <td class="num">${hp.perLevel[i] !== null ? "+" + hp.perLevel[i] : "—"}</td>
      <td><button class="btn small ghost" data-action="hp-roll-die" data-level="${i + 2}">Roll</button></td></tr>`).join("");
    const m = d.money;
    return `<h3>Hit points</h3>
      <p>1st level: 6 ${fmt(hp.conMod)} Con = <strong>${hp.first}</strong>. Each later level: 1d6 + Con (minimum 1).${hp.toughness ? ` Toughness: +${hp.toughness}.` : ""} <strong>Maximum: ${hp.max}</strong></p>
      ${lv ? `<div class="table-wrap"><table class="small-table"><thead><tr><th></th><th>d6 roll</th><th>HP gained</th><th></th></tr></thead><tbody>${lv}</tbody></table></div>` : ""}
      <h3>Money (Tables 1-13, 1-14)</h3>
      ${m.rolled ? `<p>Roll ${m.roll} ${fmt(C.PROFESSION_BY_NAME[ch.profession].moneyMod)} (${esc(ch.profession)}) = ×${m.mult} → savings <strong>$${m.savings.toLocaleString()}</strong>, yearly income <strong>$${m.income.toLocaleString()}</strong>${m.wealth ? `, Wealth windfall $${m.windfall.toLocaleString()}` : ""}.</p>` : `<p class="warn">Not rolled yet.</p>`}
      <div class="row">
        <button class="btn" data-action="money-roll">${m.rolled ? "Re-roll" : "Roll"} 1d6</button>
        ${field("…or enter the d6 you rolled", `<input type="number" min="1" max="6" data-action="money-set" value="${m.rolled ? m.roll : ""}" />`)}
        ${field("Cash on hand ($)", `<input type="number" min="0" step="0.01" data-bind="money.cash" value="${esc(ch.money.cash ?? "")}" placeholder="${m.rolled ? m.startingTotal : ""}" />`)}
      </div>`;
  }

  function edGear(ch, d) {
    const weapons = d.weapons.map((w, i) => `<tr>
      <td><input data-action="weapon" data-i="${i}" data-k="name" value="${esc(w.weapon.name)}" aria-label="Weapon name" /></td>
      <td><select data-action="weapon" data-i="${i}" data-k="category" aria-label="Category">${Object.entries(C.WEAPON_CATEGORIES).map(([k, v]) => `<option value="${k}" ${w.weapon.category === k ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></td>
      <td><input data-action="weapon" data-i="${i}" data-k="damage" value="${esc(w.weapon.damage)}" size="8" aria-label="Damage" /></td>
      <td><input data-action="weapon" data-i="${i}" data-k="critical" value="${esc(w.weapon.critical)}" size="7" aria-label="Critical" /></td>
      <td><input data-action="weapon" data-i="${i}" data-k="range" value="${esc(w.weapon.range || "")}" size="6" aria-label="Range" /></td>
      <td><input type="number" data-action="weapon" data-i="${i}" data-k="capacity" value="${esc(w.weapon.capacity || "")}" style="width:4em" aria-label="Capacity" /></td>
      <td><input type="number" min="0" step="0.5" data-action="weapon" data-i="${i}" data-k="weight" value="${esc(w.weapon.weight ?? "")}" style="width:4em" aria-label="Weight (lb)" /></td>
      <td>${w.ranged ? "" : `<label class="check"><input type="checkbox" data-action="weapon-check" data-i="${i}" data-k="twoHanded" ${w.weapon.twoHanded ? "checked" : ""}/> 2H</label>`}
          ${!w.ranged && w.weapon.category === "melee" ? `<select data-action="weapon" data-i="${i}" data-k="finesseAs" aria-label="Weapon Finesse group"><option value="">no finesse</option>${C.FINESSE_WEAPONS.map((f) => `<option ${w.weapon.finesseAs === f ? "selected" : ""}>${esc(f)}</option>`).join("")}</select>` : ""}</td>
      <td class="num strong">${fmt(w.bonus)}${C.isProficient(ch, w.weapon) ? "" : ' <span class="bad" title="Not proficient: −4">!</span>'}</td>
      <td><button class="btn small ghost" data-action="weapon-remove" data-i="${i}" aria-label="Remove weapon">✕</button></td></tr>`).join("");
    const items = ch.equipment.map((e, i) => `<tr><td><input data-action="item" data-i="${i}" data-k="name" value="${esc(e.name)}" aria-label="Item" /></td><td><input type="number" min="0" data-action="item" data-i="${i}" data-k="qty" value="${esc(e.qty ?? 1)}" style="width:4em" aria-label="Quantity" /></td><td><input type="number" min="0" step="0.5" data-action="item" data-i="${i}" data-k="weight" value="${esc(e.weight ?? "")}" style="width:4em" aria-label="Weight each (lb)" /></td><td><input data-action="item" data-i="${i}" data-k="notes" value="${esc(e.notes || "")}" aria-label="Notes" /></td><td><button class="btn small ghost" data-action="item-remove" data-i="${i}" aria-label="Remove item">✕</button></td></tr>`).join("");
    return `<h3>Armor (Table 6-4)</h3>
      ${field("Worn armor", `<select data-bind="armor">${C.ARMOR.map((a) => `<option ${a.name === ch.armor ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select>`, `AC ${d.combat.ac} (10 ${fmt(d.combat.acParts.dex)} Dex + ${d.combat.acParts.armor} armor${d.combat.acParts.defense ? ` + ${d.combat.acParts.defense} defense bonus` : ""}). ${d.combat.armor.note ? esc(d.combat.armor.note) + ". " : ""}${d.combat.acp ? `Armor check penalty ${d.combat.acp} to Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Swim, Tumble and attack rolls.` : ""}`)}
      ${field("Armor weight (lb)", `<input type="number" min="0" step="0.5" data-bind="armorWeight" value="${esc(ch.armorWeight || "")}" />`, "Table 6-4 gives no weights; enter your own if your GM tracks them.")}
      <p class="hint">Gear carried or worn: <strong>${d.gearWeight} lb</strong>. The rulebook has no carrying-capacity table for investigators; the only weight rule is Swim: −1 per 5 lb of gear (p.37), applied automatically (${Math.floor(d.gearWeight / 5) ? "−" + Math.floor(d.gearWeight / 5) : "no penalty"}).</p>
      <h3>Weapons</h3>
      <div class="row"><select id="weaponPreset" aria-label="Weapon preset">${[["Melee (Table 6-1)", (w) => w.category === "melee" || w.category === "unarmed"], ["Generic firearms (Table 6-3)", (w) => w.category !== "melee" && w.category !== "unarmed" && !w.source], ["Specific firearms (Table 6-5)", (w) => w.source === "Table 6-5"]].map(([label, f]) => `<optgroup label="${label}">${C.WEAPON_PRESETS.map((w, i) => [w, i]).filter(([w]) => f(w)).map(([w, i]) => `<option value="${i}">${esc(w.name)} (${esc(w.damage)})</option>`).join("")}</optgroup>`).join("")}</select><button class="btn small" data-action="weapon-add">Add weapon</button><button class="btn small ghost" data-action="weapon-add-custom">Add custom</button></div>
      ${weapons ? `<div class="table-wrap"><table class="gear-table"><thead><tr><th>Name</th><th>Category</th><th>Damage</th><th>Crit</th><th>Range</th><th>Cap.</th><th>lb</th><th></th><th>Attack</th><th></th></tr></thead><tbody>${weapons}</tbody></table></div>` : '<p class="muted">No weapons.</p>'}
      <h3>Equipment</h3>
      <div class="row"><input id="itemName" placeholder="Flashlight, notebook, camera…" aria-label="New item" /><button class="btn small" data-action="item-add">Add item</button></div>
      ${items ? `<div class="table-wrap"><table class="gear-table"><thead><tr><th>Item</th><th>Qty</th><th>lb each</th><th>Notes</th><th></th></tr></thead><tbody>${items}</tbody></table></div>` : ""}`;
  }

  function edMagic(ch, d) {
    const cell = (kind, i, k, v, attrs = "") => `<td><input data-action="${kind}" data-i="${i}" data-k="${k}" value="${esc(v ?? "")}" aria-label="${k}" ${attrs} /></td>`;
    const spells = ch.spells.map((sp, i) => `<tr>${cell("spell", i, "name", sp.name)}${cell("spell", i, "cost", sp.cost, 'placeholder="2 Str damage and 1d6 Sanity points" size="28"')}${cell("spell", i, "components", sp.components, 'size="4"')}${cell("spell", i, "castingTime", sp.castingTime, 'size="8"')}${cell("spell", i, "range", sp.range, 'size="10"')}${cell("spell", i, "duration", sp.duration, 'size="10"')}${cell("spell", i, "save", sp.save, 'size="8"')}${cell("spell", i, "notes", sp.notes)}
      <td class="small">${(() => { const c = C.parseSpellCost(sp.cost); return c.abilities.length || c.sanity ? esc([...c.abilities.map((a) => `${a.amount} ${a.ability}${a.permanent ? " drain" : ""}`), c.sanity ? `${c.sanity} SAN` : ""].filter(Boolean).join(", ")) : '<span class="warn">not read</span>'; })()}</td>
      <td><button class="btn small ghost" data-action="spell-remove" data-i="${i}" aria-label="Remove spell">✕</button></td></tr>`).join("");
    const tomes = ch.tomes.map((t, i) => `<tr>${cell("tome", i, "name", t.name)}${cell("tome", i, "language", t.language, 'size="8"')}${cell("tome", i, "exam", t.exam, 'size="9" placeholder="1d8 weeks"')}${cell("tome", i, "dc", t.dc, 'type="number" min="1" max="60" style="width:4em"')}${cell("tome", i, "sanityInitial", t.sanityInitial, 'size="5" placeholder="1d3"')}${cell("tome", i, "sanityComplete", t.sanityComplete, 'size="5" placeholder="1d6"')}${cell("tome", i, "mythos", t.mythos, 'type="number" min="0" max="20" style="width:3.5em"')}${cell("tome", i, "spells", t.spells, 'size="12"')}
      <td><select data-action="tome" data-i="${i}" data-k="status" aria-label="Status">${[["unread", "Unread"], ["examining", "Studying"], ["read", "Read"]].map(([k, l]) => `<option value="${k}" ${t.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></td>
      <td><button class="btn small ghost" data-action="tome-remove" data-i="${i}" aria-label="Remove tome">✕</button></td></tr>`).join("");
    const drain = C.ABILITIES.map((a) => `<label class="field inline"><span class="lbl">${a}</span><input type="number" min="0" data-bind="abilityDrain.${a}" value="${esc(ch.abilityDrain[a] || "")}" placeholder="0" style="width:4em" aria-label="${C.ABILITY_NAMES[a]} permanent drain" /></label>`).join("");
    return `<p class="muted">Investigators rarely start with magic. Spells cost Sanity and ability damage; there are no magic points (p.126). Enter costs as printed, e.g. <code>4 Str damage and 1d3 Sanity points</code> or <code>2 Con drain (permanent) and 3d6 Sanity points</code>, and the play screen pays them when you cast.</p>
      <label class="check"><input type="checkbox" data-action="opt-unmastered" ${ch.options.unmasteredMagic ? "checked" : ""}/> Variant: Unmastered Magic (p.151) — every casting needs an Int check (DC 15); a failure rolls d% for a mishap.</label>
      <h3>Spells known</h3>
      <div class="row"><select id="spellPreset" aria-label="Spell to add"><option value="">Blank spell</option>${SPELL_PRESETS.map((sp, i) => `<option value="${i}">${esc(sp.name)} (${esc(sp.notes.replace(/.*(p\.\d+)/, "$1"))})</option>`).join("")}</select><button class="btn small" data-action="spell-add">Add spell</button></div>
      ${spells ? `<div class="table-wrap"><table class="gear-table"><thead><tr><th>Spell</th><th>Cost</th><th>Comp.</th><th>Time</th><th>Range</th><th>Duration</th><th>Save</th><th>Notes</th><th>Read as</th><th></th></tr></thead><tbody>${spells}</tbody></table></div>` : '<p class="muted">No spells.</p>'}
      <h3>Mythos tomes</h3>
      <div class="row"><select id="tomePreset" aria-label="Tome to add"><option value="">Blank tome</option>${TOME_PRESETS.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join("")}</select><button class="btn small" data-action="tome-add">Add tome</button></div>
      ${tomes ? `<div class="table-wrap"><table class="gear-table"><thead><tr><th>Tome</th><th>Language</th><th>Exam. period</th><th>DC</th><th>SAN initial</th><th>SAN completion</th><th>Mythos +</th><th>Spells</th><th>Status</th><th></th></tr></thead><tbody>${tomes}</tbody></table></div>` : '<p class="muted">No tomes.</p>'}
      <p class="hint">Reading a tome: initial contact costs its initial Sanity; each Examination Period ends with a study check, 1d20 + level + Int modifier + earlier checks against the DC; finishing costs the completion Sanity and adds its Cthulhu Mythos ranks (p.119-121). The play screen rolls all of this.</p>
      <h3>Permanent ability drain</h3><p class="hint">Some spells drain abilities permanently ("drain" or "permanent" in the cost). Casting records it automatically; correct it here.</p><div class="row">${drain}</div>`;
  }

  function edReview(ch, d, issues) {
    return `<p>${issues.filter((i) => i.level === "error").length ? "Fix the rule problems listed above, then start playing." : "Everything checks out. You can come back and edit at any time."}</p>
      <div class="review-grid">${D.summaryBlock(ch, d, ctx())}</div>
      <div class="row"><a class="btn primary" href="#/play/${ch.id}">Play this character →</a><button class="btn ghost" data-action="export-one" data-id="${ch.id}">Export file</button></div>`;
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  function setPath(obj, path, value) {
    const keys = path.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] = o[keys[i]] || {};
    o[keys[keys.length - 1]] = value;
  }
  function numOrStr(el) { return el.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value; }

  function levelUp() {
    const ch = state.ch;
    if (ch.level >= 20) return toast("Already 20th level.");
    const newLevel = ch.level + 1;
    const hpRoll = C.rollDie(6);
    const sanGain = C.rollDie(6);
    update((c) => {
      c.level = newLevel;
      const synced = C.syncLevelLog(c);
      synced.levelLog[newLevel - 1].hpRoll = hpRoll;
      const locked = C.lockIntMods(synced, newLevel);
      const withSan = C.gainSanity(locked, sanGain, "level", `Level ${newLevel}: +1d6 (${sanGain})`);
      const hpBefore = C.hitPoints(c).max;
      const hpAfter = C.hitPoints(withSan).max;
      if (withSan.hp.current !== null) withSan.hp.current = C.toInt(withSan.hp.current) + (hpAfter - hpBefore);
      pushLog(withSan, `Reached level ${newLevel}: HP +${hpAfter - hpBefore} (d6 ${hpRoll}), Sanity +${sanGain}`);
      return withSan;
    }, { render: false });
    const d = C.derive(state.ch);
    const todo = [`Level ${newLevel}! Hit die 1d6 = ${hpRoll}; Sanity +${sanGain} (up to maximum).`, `Spend ${d.skillPoints.remaining} new skill point(s) on the Skills step.`];
    if (newLevel % 3 === 0) todo.push("You gain a feat — pick it on the Feats step.");
    if (newLevel % 4 === 0) todo.push("Increase one ability score by 1 on the Abilities step.");
    state.banners = todo;
    go(`#/edit/${ch.id}/skills`);
  }

  function handleClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "button" && el.type !== "checkbox")) return;
    if (el.tagName === "INPUT" && el.type === "checkbox") return; // handled on change
    const a = el.dataset.action;
    const i = el.dataset.i !== undefined ? +el.dataset.i : null;
    switch (a) {
      case "print": window.print(); break;
      case "undo": undoLast(); break;
      case "clear-banners": state.banners = []; render(); break;
      case "import": document.getElementById("importFile").click(); break;
      case "sample": { const c = S.save(C.sampleCharacter(), { force: true }).character; toast(`Added ${esc(c.name)}.`); render(); break; }
      case "legacy-import": {
        const st = S.legacyStatus();
        const copy = (all) => { const got = S.importLegacy({ all }); render(); toast(`Copied ${got.length} character${got.length === 1 ? "" : "s"} from the original sheet. Each one's Background notes list what to check.`, 7000); };
        if (st.pending.length) copy(false);
        else confirmDialog(`<h2>Copy again?</h2><p>All ${st.names.length} original-sheet character${st.names.length === 1 ? " has" : "s have"} been copied already. Copy ${st.names.length === 1 ? "it" : "them"} again as new entries?</p>`, "Copy again").then((ok) => ok && copy(true));
        break;
      }
      case "export-all": download(`investigators-${new Date().toISOString().slice(0, 10)}.json`, S.exportData()); break;
      case "export-one": { const c = S.load(el.dataset.id); if (c) download(`${(c.name || "investigator").replace(/[^\w-]+/g, "_")}.json`, S.exportData([c.id])); break; }
      case "dup": S.duplicate(el.dataset.id); render(); toast("Duplicated."); break;
      case "delete": {
        const entry = S.list().find((x) => x.id === el.dataset.id);
        confirmDialog(`<h2>Delete ${esc(entry ? entry.name : "character")}?</h2><p>This removes it from this browser. Export it first if you might want it back.</p>`, "Delete").then((ok) => { if (ok) { S.remove(el.dataset.id); if (state.ch && state.ch.id === el.dataset.id) state.ch = null; render(); } });
        break;
      }
      case "roll-abilities": {
        const rolls = C.ABILITIES.map(() => { const d4 = [1, 2, 3, 4].map(() => C.rollDie(6)).sort((x, y) => x - y); return d4[1] + d4[2] + d4[3]; });
        update((c) => { C.ABILITIES.forEach((ab, k) => { c.abilities[ab] = rolls[k]; }); pushLog(c, `Rolled abilities: ${rolls.join(", ")}`); });
        toast(`Rolled: ${rolls.join(", ")} — swap scores between abilities by editing the numbers.`);
        break;
      }
      case "add-spec": {
        const base = document.getElementById("addSpecBase").value;
        const name = document.getElementById("addSpecName").value.trim();
        if (!name) return toast("Type a specialty name first.");
        update((c) => { c.skills[`${base} (${name})`] = c.skills[`${base} (${name})`] || { ranks: 0, misc: 0 }; });
        break;
      }
      case "feat-add": update((c) => { c.feats.push({ name: el.dataset.name }); }); break;
      case "feat-remove": update((c) => { c.feats.splice(i, 1); }); break;
      case "hp-roll-die": { const l = +el.dataset.level; const r = C.rollDie(6); update((c) => { c.levelLog[l - 1].hpRoll = r; }); toast(`Level ${l} hit die: ${r}`); break; }
      case "roll-height-weight": {
        const r = C.rollHeightWeight(state.ch.gender);
        update((c) => { c.height = r.height; c.weight = r.weight; });
        toast(`${r.height}, ${r.weight} <span class="muted">(2d10 = ${r.heightRoll}, 2d4 = ${r.weightRoll}; uses the ${/^f/i.test(state.ch.gender || "") ? "female" : "male"} row)</span>`);
        break;
      }
      case "money-roll": { const r = C.rollDie(6); update((c) => { c.money.roll = r; }); toast(`Money roll: ${r}`); break; }
      case "weapon-add": { const p = C.WEAPON_PRESETS[+document.getElementById("weaponPreset").value]; update((c) => { c.weapons.push(Object.assign({ id: C.uid(), ammo: p.capacity || null }, C.clone(p))); }); break; }
      case "weapon-add-custom": update((c) => { c.weapons.push({ id: C.uid(), name: "New weapon", category: "melee", damage: "1d6", critical: "×2", range: "" }); }); break;
      case "weapon-remove": update((c) => { c.weapons.splice(i, 1); }); break;
      case "item-add": { const n = document.getElementById("itemName").value.trim(); if (n) update((c) => { c.equipment.push({ id: C.uid(), name: n, qty: 1, notes: "" }); }); break; }
      case "item-remove": update((c) => { c.equipment.splice(i, 1); }); break;
      case "spell-add": { const v = document.getElementById("spellPreset").value; const p = v === "" ? { name: "New spell", cost: "" } : SPELL_PRESETS[+v]; update((c) => { c.spells.push(Object.assign({ id: C.uid() }, C.clone(p))); }); break; }
      case "spell-remove": update((c) => { c.spells.splice(i, 1); }); break;
      case "tome-add": { const v = document.getElementById("tomePreset").value; const p = v === "" ? { name: "New tome", dc: 20 } : TOME_PRESETS[+v]; update((c) => { c.tomes.push(Object.assign({ id: C.uid() }, C.clone(p))); }); break; }
      case "tome-remove": update((c) => { c.tomes.splice(i, 1); }); break;
      case "level-up":
        confirmDialog(`<h2>Level up to ${state.ch.level + 1}?</h2><p>This rolls your hit die (1d6 + Con) and adds 1d6 Sanity (p.51), then takes you to spend skill points${(state.ch.level + 1) % 3 === 0 ? ", choose a feat" : ""}${(state.ch.level + 1) % 4 === 0 ? " and raise an ability" : ""}.</p>`, "Level up").then((ok) => ok && levelUp());
        break;
      default: D.handleAction && D.handleAction(a, el, api);
    }
  }

  function handleChange(e) {
    deferRender = true;
    try { onChange(e); } finally { deferRender = false; }
  }
  /** Skill Emphasis follows a renamed specialty skill. */
  function renameSkillChoice(c, from, to) {
    if (!from || from === to) return;
    for (const f of c.feats) if (f.name === "Skill Emphasis" && f.choice === from) f.choice = to;
  }
  function onChange(e) {
    const el = e.target;
    // Values typed straight onto the sheet are saved as you type; refresh the view once editing ends.
    if (el.dataset.live === "hp-current" || el.dataset.live === "san-current" || el.dataset.live === "xp") { render(); return; }
    if (el.dataset.bind) {
      // A blank or invalid Level is ignored, so clearing the field can't wipe level history.
      if (el.dataset.bind === "level" && !(parseInt(el.value, 10) >= 1)) { render(); return; }
      update((c) => {
        setPath(c, el.dataset.bind, numOrStr(el));
        if (el.dataset.bind === "level") return C.lockIntMods(C.syncLevelLog(c), 1);
        if (el.dataset.bind.startsWith("abilities.") && state.route.view === "edit") return C.lockIntMods(c, 1);
        return c;
      }, { render: !(el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text")) || el.dataset.bind === "name" });
      return;
    }
    const a = el.dataset.action;
    if (!a) return;
    const i = el.dataset.i !== undefined ? +el.dataset.i : null;
    switch (a) {
      case "design": {
        state.design = el.value;
        S.setPref("design", el.value);
        render();
        if (state.route.view !== "play") toast(`Layout set to <strong>${esc((D.list.find((d) => d.key === el.value) || {}).name || el.value)}</strong>. Characters open in this layout when you press Play.`);
        break;
      }
      case "profession": {
        const to = el.value;
        const from = state.ch.profession;
        if (to === from) break;
        // Keep the 3 core skills the player chose; only the 9 template skills change.
        const change = () => update((c) => {
          const extra = c.coreSkills.slice(9);
          c.profession = to;
          c.coreSkills = C.templateCore(to).concat(extra);
        }, { undo: "Change profession" });
        const tmpl = C.templateCore(from).filter((id) => !id.includes("*"));
        const ranked = state.ch.coreSkills.slice(0, 9).filter((id) => C.toInt((state.ch.skills[id] || {}).ranks) > 0 && !C.templateCore(to).includes(id));
        if (!tmpl.length && !ranked.length) { change(); break; }
        confirmDialog(`<h2>Change profession to ${esc(to)}?</h2><p>The 9 template core skills will become the ${esc(to)} template. Your 3 chosen core skills stay.</p>${ranked.length ? `<p class="warn">These skills have ranks and will stop being core, so their ranks may exceed the noncore maximum: ${ranked.map(esc).join(", ")}.</p>` : ""}`, "Change profession").then((ok) => { if (ok) change(); else render(); });
        break;
      }
      case "feat-available": state.featAvailable = el.checked; render(); break;
      case "attack-option": update((c) => { c.attackOption = el.value; const need = C.goodSaveCount(el.value); c.goodSaves = c.goodSaves.slice(0, need); }); break;
      case "good-save": update((c) => {
        // Keep the most recent picks; ticking one too many drops the oldest.
        const list = c.goodSaves.filter((k) => k !== el.value);
        if (el.checked) list.push(el.value);
        while (list.length > C.goodSaveCount(c.attackOption)) list.shift();
        c.goodSaves = list;
      }); break;
      case "opt-defense": update((c) => { c.options.defenseBonus = el.checked; }); break;
      case "opt-offense-wp": update((c) => { c.options.offenseWeaponProficiency = el.checked; }); break;
      case "opt-unmastered": update((c) => { c.options.unmasteredMagic = el.checked; }); break;
      case "spell": case "tome": update((c) => { const k = el.dataset.k; c[a === "spell" ? "spells" : "tomes"][i][k] = el.type === "number" ? (el.value === "" ? 0 : +el.value) : el.value; }); break;
      case "ability-increase": update((c) => { c.levelLog[+el.dataset.level - 1].abilityIncrease = el.value || null; return C.lockIntMods(c, +el.dataset.level); }); break;
      case "core-spec": update((c) => {
        const slot = +el.dataset.slot; const t = C.templateCore(c.profession)[slot];
        const val = el.value.trim();
        const old = c.coreSkills[slot];
        c.coreSkills[slot] = val ? t.replace("*", val) : t;
        if (old && c.skills[old] && old !== c.coreSkills[slot] && !old.includes("*")) { c.skills[c.coreSkills[slot]] = c.skills[old]; delete c.skills[old]; }
        if (old && !old.includes("*") && !c.coreSkills[slot].includes("*")) renameSkillChoice(c, old, c.coreSkills[slot]);
      }); break;
      case "extra-core": case "extra-spec": update((c) => {
        const core = c.coreSkills.slice(0, 9);
        while (core.length < 9) core.push(C.templateCore(c.profession)[core.length]);
        const extra = c.coreSkills.slice(9);
        const old = extra[i];
        if (a === "extra-core") extra[i] = el.value; else extra[i] = `${C.skillBase(extra[i])} (${el.value.trim() || "*"})`;
        if (a === "extra-spec" && old && !old.includes("*")) {
          if (c.skills[old] && !c.skills[extra[i]]) { c.skills[extra[i]] = c.skills[old]; delete c.skills[old]; }
          renameSkillChoice(c, old, extra[i]);
        }
        if (C.skillDef(extra[i]) && C.skillDef(extra[i]).specialty && !/\(/.test(extra[i])) extra[i] = `${extra[i]} (*)`;
        c.coreSkills = core.concat(extra.filter(Boolean));
      }); break;
      case "ranks": case "misc": update((c) => {
        const id = el.dataset.id;
        c.skills[id] = c.skills[id] || { ranks: 0, misc: 0 };
        c.skills[id][a] = el.value === "" ? 0 : Number(el.value);
      }); break;
      case "feat-choice": update((c) => { c.feats[i].choice = el.value || null; }); break;
      case "hp-roll": update((c) => { c.levelLog[+el.dataset.level - 1].hpRoll = el.value ? Math.max(1, Math.min(6, +el.value)) : null; }); break;
      case "money-set": update((c) => { c.money.roll = el.value ? Math.max(1, Math.min(6, +el.value)) : null; }); break;
      case "weapon": update((c) => { const k = el.dataset.k; c.weapons[i][k] = el.type === "number" ? (el.value === "" ? null : +el.value) : el.value; }); break;
      case "weapon-check": update((c) => { c.weapons[i][el.dataset.k] = el.checked; }); break;
      case "item": update((c) => { const k = el.dataset.k; c.equipment[i][k] = el.type === "number" ? +el.value : el.value; }, { render: el.type === "number" }); break;
      default: D.handleChange && D.handleChange(a, el, api);
    }
  }

  // API handed to designs.js for play-mode actions.
  const api = { update, render, toast, rollD20, rollDice, pushLog, confirmDialog, state, esc, levelUp, undoLast };

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  let featTimer = null;
  document.addEventListener("click", handleClick);
  // Enter in an amount box presses that panel's main button (Damage, Lose, Roll check).
  document.addEventListener("keydown", (e) => {
    const el = e.target;
    if (e.key !== "Enter" || !el.dataset || !el.dataset.enter) return;
    e.preventDefault();
    const panel = el.closest(".panel") || document;
    const btn = panel.querySelector(`button[data-action="${el.dataset.enter}"]:not([data-n])`);
    if (btn) btn.click();
  });
  document.addEventListener("change", handleChange);
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.live && D.handleInput) { D.handleInput(el.dataset.live, el, api); return; }
    if (el.dataset.filter === "feat") {
      state.featFilter = el.value;
      clearTimeout(featTimer);
      featTimer = setTimeout(render, 150);   // render() keeps focus and the caret in the box
      return;
    }
    // Text fields save as you type (the change event re-renders when you leave the field).
    if (el.dataset.bind && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text"))) {
      update((c) => { setPath(c, el.dataset.bind, el.value); }, { render: false });
    }
  });
  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const got = S.importData(text);
        const n = got.imported.length;
        toast(`Imported ${n} character${n === 1 ? "" : "s"}.${got.skipped ? ` Skipped ${got.skipped} unreadable record${got.skipped === 1 ? "" : "s"}.` : ""}`);
      } catch (err) {
        toast("Couldn't import that file: " + esc(err instanceof SyntaxError ? "it isn't valid JSON." : err.message));
      } finally { render(); }
    });
    e.target.value = "";
  });
  // Whatever design is on screen, print the record-sheet layout.
  window.addEventListener("beforeprint", () => {
    if (state.route.view !== "play" || state.design === "sheet") return;
    $app.innerHTML = D.render("sheet", state.ch, C.derive(state.ch), ctx());
    document.body.dataset.design = "sheet";
  });
  window.addEventListener("afterprint", () => { if (state.route.view === "play") render(); });
  window.addEventListener("hashchange", onRoute);
  window.addEventListener("beforeunload", () => persist(true));
  // Keep tabs in step: reload a character saved or deleted in another tab.
  window.addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith("cocd20v2:")) return;
    if (state.ch && e.key === "cocd20v2:char:" + state.ch.id) {
      if (e.newValue === null) { state.ch = null; state.dirty = false; toast("This character was deleted in another tab."); go("#/"); return; }
      if (!state.dirty) { const fresh = S.load(state.ch.id); if (fresh) { state.ch = fresh; render(); } }
    } else if (e.key === "cocd20v2:index" && state.route.view === "list") render();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(true); });

  // The top bar wraps on narrow screens; Pocket's sticky vitals sit just below it.
  const $top = document.querySelector(".topbar");
  const setTopbarHeight = () => document.documentElement.style.setProperty("--topbar-h", ($top ? $top.offsetHeight : 52) + "px");
  if ($top && window.ResizeObserver) new ResizeObserver(setTopbarHeight).observe($top);
  setTopbarHeight();

  const migrated = S.importLegacyOnce();
  if (migrated.length) setTimeout(() => toast(`Copied ${migrated.length} character(s) from the original sheet. Each one's Background notes list what to check.`, 7000), 300);
  if (!location.hash && S.lastOpened() && S.load(S.lastOpened())) history.replaceState(null, "", "#/");
  onRoute();
  window.App = api;
})();
