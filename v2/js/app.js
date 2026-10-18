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
  const STEPS = [
    { key: "basics", label: "Basics" },
    { key: "abilities", label: "Abilities" },
    { key: "skills", label: "Skills" },
    { key: "feats", label: "Feats" },
    { key: "hp", label: "HP & Money" },
    { key: "gear", label: "Gear" },
    { key: "review", label: "Review" },
  ];

  const state = { ch: null, route: { view: "list" }, saveTimer: null, design: S.getPref("design", "tracker"), pocketTab: "vitals", skillFilter: "", skillMode: "all", banners: [] };

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
  function persist(immediate = false) {
    clearTimeout(state.saveTimer);
    const run = () => {
      if (!state.ch) return;
      const res = S.save(state.ch);
      state.ch.updated = res.character.updated;
      if (!res.persisted) toast("⚠ This browser is not keeping data (private mode?). Export your character to keep it.");
      const el = document.getElementById("saveState");
      if (el) el.textContent = "Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    if (immediate) run(); else state.saveTimer = setTimeout(run, 300);
  }
  /** Mutate the current character, re-normalise, save and re-render. */
  function update(fn, { render: doRender = true } = {}) {
    const next = C.clone(state.ch);
    const result = fn(next);
    state.ch = C.normalize(result || next);
    persist();
    if (doRender) render();
  }
  function rollD20(mod, label) {
    const r = C.rollDie(20);
    const total = r + mod;
    const tag = r === 20 ? ' <span class="nat nat20">natural 20</span>' : r === 1 ? ' <span class="nat nat1">natural 1</span>' : "";
    toast(`<strong>${esc(label)}</strong><br><span class="roll-big">${total}</span> <span class="muted">(d20 ${r} ${fmt(mod)})</span>${tag}`);
    update((ch) => pushLog(ch, `${label}: ${total} (d20 ${r} ${fmt(mod)})${r === 20 ? " — nat 20" : r === 1 ? " — nat 1" : ""}`), { render: state.route.view === "play" });
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
    if (parts[0] === "edit" && parts[1]) return { view: "edit", id: parts[1], step: parts[2] || "basics" };
    if (parts[0] === "play" && parts[1]) return { view: "play", id: parts[1] };
    return { view: "list" };
  }
  function go(hash) { if (location.hash === hash) onRoute(); else location.hash = hash; }
  function onRoute() {
    const r = parseRoute();
    if (r.view === "new") {
      const ch = C.newCharacter();
      ch.coreSkills = C.templateCore(ch.profession);
      state.ch = C.normalize(ch);
      S.save(state.ch);
      history.replaceState(null, "", `#/edit/${state.ch.id}/basics`);
      state.route = { view: "edit", id: state.ch.id, step: "basics" };
    } else if (r.view === "edit" || r.view === "play") {
      if (!state.ch || state.ch.id !== r.id) {
        persist(true);
        state.ch = S.load(r.id);
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
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function render() {
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
    if (r.view === "list") { $nav.innerHTML = ""; return; }
    const id = state.ch && state.ch.id;
    const designs = D.list.map((d) => `<option value="${d.key}" ${d.key === state.design ? "selected" : ""}>${esc(d.name)}</option>`).join("");
    $nav.innerHTML = `
      <a class="navlink ${r.view === "edit" ? "active" : ""}" href="#/edit/${id}/${r.step || "basics"}">Edit</a>
      <a class="navlink ${r.view === "play" ? "active" : ""}" href="#/play/${id}">Play</a>
      ${r.view === "play" ? `<label class="design-pick"><span class="sr-only">Sheet design</span><select data-action="design" aria-label="Sheet design">${designs}</select></label>
      <button class="btn small ghost" data-action="print" title="Print this sheet">Print</button>` : ""}
      <span class="save-state" id="saveState" aria-live="polite"></span>`;
  }

  // ---------------------------------------------------------------------------
  // Character list
  // ---------------------------------------------------------------------------
  function renderList() {
    const items = S.list();
    const last = S.lastOpened();
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
          <h1>Your investigators</h1>
          <p class="muted">Saved in this browser${S.persistent() ? "" : " — <strong>storage is unavailable, export to keep your work</strong>"}. They stay here between visits; export a file to move them to another device.</p>
        </div>
        <div class="list-buttons">
          <a class="btn primary" href="#/new">+ New investigator</a>
          <button class="btn ghost" data-action="import">Import file</button>
          <button class="btn ghost" data-action="sample" title="Adds the worked example from the rulebook-check document">Add sample</button>
          ${items.length ? '<button class="btn ghost" data-action="export-all">Export all</button>' : ""}
        </div>
      </div>
      ${items.length ? `<div class="card-grid">${cards}</div>` : `<div class="empty"><p>No investigators yet.</p><p class="muted">Create one, or import a <code>.json</code> file exported from this or the original sheet.</p></div>`}
      <p class="muted small">Rules: Call of Cthulhu d20 core rulebook. The original sheet is still available at <a href="../index.html">../index.html</a>.</p>
    </section>`;
  }

  // ---------------------------------------------------------------------------
  // Editor
  // ---------------------------------------------------------------------------
  function stepNav(current) {
    const id = state.ch.id;
    return `<ol class="steps">${STEPS.map((s, i) => `<li><a href="#/edit/${id}/${s.key}" class="${s.key === current ? "current" : ""}"><span class="num">${i + 1}</span>${s.label}</a></li>`).join("")}</ol>`;
  }
  function issuesPanel(issues) {
    if (!issues.length) return `<div class="issues ok">✓ This character follows the creation rules.</div>`;
    const errs = issues.filter((i) => i.level === "error");
    const warns = issues.filter((i) => i.level === "warn");
    return `<details class="issues" ${errs.length ? "open" : ""}><summary>${errs.length ? `<span class="bad">${errs.length} rule problem${errs.length > 1 ? "s" : ""}</span>` : ""} ${warns.length ? `<span class="warn">${warns.length} reminder${warns.length > 1 ? "s" : ""}</span>` : ""}</summary>
      <ul>${errs.map((i) => `<li class="bad">${esc(i.msg)}</li>`).join("")}${warns.map((i) => `<li class="warn">${esc(i.msg)}</li>`).join("")}</ul></details>`;
  }
  function renderEditor(step) {
    const ch = state.ch;
    const d = C.derive(ch);
    const issues = C.validate(ch, { creation: true });
    const idx = STEPS.findIndex((s) => s.key === step);
    const prev = STEPS[idx - 1], next = STEPS[idx + 1];
    const body = ({ basics: edBasics, abilities: edAbilities, skills: edSkills, feats: edFeats, hp: edHpMoney, gear: edGear, review: edReview }[step] || edBasics)(ch, d, issues);
    return `<section class="editor">
      <div class="editor-head">
        <h1>${esc(ch.name || "New investigator")} <span class="muted">· Level ${ch.level} ${esc(ch.profession)}</span></h1>
        ${stepNav(step)}
      </div>
      ${state.banners.length ? `<div class="banner">${state.banners.map(esc).join("<br>")} <button class="btn small ghost" data-action="clear-banners">Dismiss</button></div>` : ""}
      ${issuesPanel(issues)}
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
      ${field("Era", `<select data-bind="era">${eras}</select>`, "Sets starting money and income (Table 1-14).")}
      ${field("Profession", `<select data-action="profession">${profs}</select>`, `Income modifier ${fmt(C.PROFESSION_BY_NAME[ch.profession].moneyMod)} (Table 1-13). Changing profession resets core skills.`)}
      ${field("Level", inp("level", ch.level, 'type="number" min="1" max="20"'), "To advance a character in play, use Level up on the play screen.")}
      ${field("Attack option", `<select data-action="attack-option"><option value="defense" ${ch.attackOption === "defense" ? "selected" : ""}>Defense — 2 good saves, BAB +0 at 1st</option><option value="offense" ${ch.attackOption === "offense" ? "selected" : ""}>Offense — 1 good save, BAB +1 at 1st</option></select>`, "Tables 1-8 / 1-9.")}
    </div>
    <fieldset class="field"><legend class="lbl">Good saves — choose exactly ${need}</legend>
      <div class="row">${saveBox("fort", "Fortitude")}${saveBox("ref", "Reflex")}${saveBox("will", "Will")}</div>
    </fieldset>
    <fieldset class="field"><legend class="lbl">Optional rules</legend>
      <label class="check"><input type="checkbox" data-action="opt-defense" ${ch.options.defenseBonus ? "checked" : ""}/> Variant: Defense bonus by level (Table 1-15, p.15) — adds to AC; Offense characters also get a bonus Weapon Proficiency feat.</label>
    </fieldset>
    ${field("Cthulhu Mythos ranks", inp("mythos", ch.mythos, 'type="number" min="0"'), "Never bought with skill points: starts at 0 and rises through play (Mythos insanity, tomes). Lowers maximum Sanity.")}
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
      return `<div class="extra-core"><select data-action="extra-core" data-i="${i}" aria-label="Extra core skill ${i + 1}">${options(id)}</select>${def && def.specialty ? `<input class="spec" data-action="extra-spec" data-i="${i}" value="${esc(C.skillSpecialty(id))}" placeholder="specialty" aria-label="Specialty" />` : ""}</div>`;
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
    if (p.synergy) out.push(`+2 synergy`); if (p.armor) out.push(`${p.armor} armor`); if (p.misc) out.push(`${fmt(p.misc)} misc`);
    return out.join(", ");
  }

  function choiceInput(f, i, ch) {
    const def = C.FEAT_BY_NAME[f.name];
    if (!def || !def.choice) return "";
    let opts = [];
    if (def.choice === "category") opts = Object.entries(C.WEAPON_CATEGORIES).filter(([k]) => k !== "unarmed").map(([k, v]) => [k, v]);
    else if (def.choice === "finesse") opts = C.FINESSE_WEAPONS.map((w) => [w, w]);
    else if (def.choice === "weapon") opts = [...new Set([...(ch.weapons || []).map((w) => w.name), ...C.WEAPON_PRESETS.map((w) => w.name)])].map((w) => [w, w]);
    else if (def.choice === "skill") opts = C.skillIds(ch).filter((id) => id !== "Cthulhu Mythos").map((s) => [s, s]);
    return `<select data-action="feat-choice" data-i="${i}" aria-label="${esc(f.name)} choice"><option value="">— choose ${def.choice} —</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${f.choice === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  }
  function edFeats(ch, d) {
    const chosen = ch.feats.map((f, i) => {
      const probs = C.featPrereqIssues(ch, f);
      return `<li class="${probs.length ? "bad" : ""}"><strong>${esc(f.name)}</strong> ${choiceInput(f, i, ch)} <button class="btn small ghost" data-action="feat-remove" data-i="${i}" aria-label="Remove ${esc(f.name)}">Remove</button>
        <div class="hint">${esc(C.FEAT_BY_NAME[f.name] ? C.FEAT_BY_NAME[f.name].text : "")}</div>${probs.length ? `<div class="bad small">${probs.map(esc).join("; ")}</div>` : ""}</li>`;
    }).join("");
    const avail = C.FEATS.map((f) => {
      const taken = C.hasFeat(ch, f.name);
      const probs = C.featPrereqIssues(ch, { name: f.name, choice: "x" }).filter((m) => !/choose a/.test(m));
      const disabled = (taken && !f.multi) || probs.length > 0;
      const pre = f.prereq ? [...Object.entries(f.prereq.abil || {}).map(([a, v]) => `${a} ${v}+`), ...(f.prereq.feats || []), ...(f.prereq.bab ? [`BAB +${f.prereq.bab}`] : []), ...(f.prereq.proficient ? ["proficient"] : [])].join(", ") : "";
      return `<li class="${disabled ? "dim" : ""}"><button class="btn small" data-action="feat-add" data-name="${esc(f.name)}" ${disabled ? "disabled" : ""}>Add</button> <strong>${esc(f.name)}</strong>${f.psychic ? ' <span class="tag">Psychic</span>' : ""}${f.multi ? ' <span class="tag" title="Can be taken more than once">×</span>' : ""}
        <span class="hint">${esc(f.text)}${pre ? ` <em>Requires: ${esc(pre)}.</em>` : ""}${probs.length ? ` <span class="bad">(${probs.map(esc).join("; ")})</span>` : ""}</span></li>`;
    }).join("");
    return `<div class="sp-tracker ${ch.feats.length > d.featSlots ? "bad" : ch.feats.length === d.featSlots ? "ok" : ""}">Feats: <strong>${ch.feats.length}</strong> / ${d.featSlots} <span class="muted">(2 at 1st level, +1 at every level divisible by 3${ch.options.defenseBonus && ch.attackOption === "offense" ? ", +1 bonus Weapon Proficiency (variant)" : ""})</span></div>
      <p class="hint">No character is proficient with weapons by default: without the right Weapon Proficiency feat, attacks take −4 (p.43). Psychic feats need GM approval.</p>
      <h3>Your feats</h3><ul class="feat-list chosen">${chosen || '<li class="muted">None yet.</li>'}</ul>
      <h3>Available feats</h3><ul class="feat-list">${avail}</ul>`;
  }

  function edHpMoney(ch, d) {
    const hp = d.hp;
    const lv = ch.levelLog.slice(1).map((e, i) => `<tr><th scope="row">Level ${i + 2}</th>
      <td><input type="number" min="1" max="6" data-action="hp-roll" data-level="${i + 2}" value="${e.hpRoll || ""}" placeholder="1d6" aria-label="Level ${i + 2} hit die" /></td>
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
      <td>${w.ranged ? "" : `<label class="check"><input type="checkbox" data-action="weapon-check" data-i="${i}" data-k="twoHanded" ${w.weapon.twoHanded ? "checked" : ""}/> 2H</label>`}
          ${!w.ranged && w.weapon.category === "melee" ? `<select data-action="weapon" data-i="${i}" data-k="finesseAs" aria-label="Weapon Finesse group"><option value="">no finesse</option>${C.FINESSE_WEAPONS.map((f) => `<option ${w.weapon.finesseAs === f ? "selected" : ""}>${esc(f)}</option>`).join("")}</select>` : ""}</td>
      <td class="num strong">${fmt(w.bonus)}${C.isProficient(ch, w.weapon) ? "" : ' <span class="bad" title="Not proficient: −4">!</span>'}</td>
      <td><button class="btn small ghost" data-action="weapon-remove" data-i="${i}" aria-label="Remove weapon">✕</button></td></tr>`).join("");
    const items = ch.equipment.map((e, i) => `<tr><td><input data-action="item" data-i="${i}" data-k="name" value="${esc(e.name)}" aria-label="Item" /></td><td><input type="number" min="0" data-action="item" data-i="${i}" data-k="qty" value="${esc(e.qty ?? 1)}" style="width:4em" aria-label="Quantity" /></td><td><input data-action="item" data-i="${i}" data-k="notes" value="${esc(e.notes || "")}" aria-label="Notes" /></td><td><button class="btn small ghost" data-action="item-remove" data-i="${i}" aria-label="Remove item">✕</button></td></tr>`).join("");
    return `<h3>Armor (Table 6-4)</h3>
      ${field("Worn armor", `<select data-bind="armor">${C.ARMOR.map((a) => `<option ${a.name === ch.armor ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select>`, `AC ${d.combat.ac} (10 ${fmt(d.combat.acParts.dex)} Dex + ${d.combat.acParts.armor} armor${d.combat.acParts.defense ? ` + ${d.combat.acParts.defense} defense bonus` : ""}). ${d.combat.armor.note ? esc(d.combat.armor.note) + ". " : ""}${d.combat.acp ? `Armor check penalty ${d.combat.acp} to Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Swim, Tumble and attack rolls.` : ""}`)}
      <h3>Weapons</h3>
      <div class="row"><select id="weaponPreset" aria-label="Weapon preset">${C.WEAPON_PRESETS.map((w, i) => `<option value="${i}">${esc(w.name)} (${esc(w.damage)})</option>`).join("")}</select><button class="btn small" data-action="weapon-add">Add weapon</button><button class="btn small ghost" data-action="weapon-add-custom">Add custom</button></div>
      ${weapons ? `<div class="table-wrap"><table class="gear-table"><thead><tr><th>Name</th><th>Category</th><th>Damage</th><th>Crit</th><th>Range</th><th>Cap.</th><th></th><th>Attack</th><th></th></tr></thead><tbody>${weapons}</tbody></table></div>` : '<p class="muted">No weapons.</p>'}
      <h3>Equipment</h3>
      <div class="row"><input id="itemName" placeholder="Flashlight, notebook, camera…" aria-label="New item" /><button class="btn small" data-action="item-add">Add item</button></div>
      ${items ? `<div class="table-wrap"><table class="gear-table"><thead><tr><th>Item</th><th>Qty</th><th>Notes</th><th></th></tr></thead><tbody>${items}</tbody></table></div>` : ""}`;
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
      case "clear-banners": state.banners = []; render(); break;
      case "import": document.getElementById("importFile").click(); break;
      case "sample": { const c = S.save(sampleCharacter()).character; toast(`Added ${esc(c.name)}.`); render(); break; }
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
      case "money-roll": { const r = C.rollDie(6); update((c) => { c.money.roll = r; }); toast(`Money roll: ${r}`); break; }
      case "weapon-add": { const p = C.WEAPON_PRESETS[+document.getElementById("weaponPreset").value]; update((c) => { c.weapons.push(Object.assign({ id: C.uid(), ammo: p.capacity || null }, C.clone(p))); }); break; }
      case "weapon-add-custom": update((c) => { c.weapons.push({ id: C.uid(), name: "New weapon", category: "melee", damage: "1d6", critical: "×2", range: "" }); }); break;
      case "weapon-remove": update((c) => { c.weapons.splice(i, 1); }); break;
      case "item-add": { const n = document.getElementById("itemName").value.trim(); if (n) update((c) => { c.equipment.push({ id: C.uid(), name: n, qty: 1, notes: "" }); }); break; }
      case "item-remove": update((c) => { c.equipment.splice(i, 1); }); break;
      case "level-up":
        confirmDialog(`<h2>Level up to ${state.ch.level + 1}?</h2><p>This rolls your hit die (1d6 + Con) and adds 1d6 Sanity (p.51), then takes you to spend skill points${(state.ch.level + 1) % 3 === 0 ? ", choose a feat" : ""}${(state.ch.level + 1) % 4 === 0 ? " and raise an ability" : ""}.</p>`, "Level up").then((ok) => ok && levelUp());
        break;
      default: D.handleAction && D.handleAction(a, el, api);
    }
  }

  function handleChange(e) {
    const el = e.target;
    // Values typed straight onto the sheet are saved as you type; refresh the view once editing ends.
    if (el.dataset.live === "hp-current" || el.dataset.live === "san-current") { render(); return; }
    if (el.dataset.bind) {
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
      case "design": state.design = el.value; S.setPref("design", el.value); render(); break;
      case "profession": update((c) => { c.profession = el.value; c.coreSkills = C.templateCore(el.value); }); break;
      case "attack-option": update((c) => { c.attackOption = el.value; const need = C.goodSaveCount(el.value); c.goodSaves = c.goodSaves.slice(0, need); }); break;
      case "good-save": update((c) => {
        // Keep the most recent picks; ticking one too many drops the oldest.
        const list = c.goodSaves.filter((k) => k !== el.value);
        if (el.checked) list.push(el.value);
        while (list.length > C.goodSaveCount(c.attackOption)) list.shift();
        c.goodSaves = list;
      }); break;
      case "opt-defense": update((c) => { c.options.defenseBonus = el.checked; }); break;
      case "ability-increase": update((c) => { c.levelLog[+el.dataset.level - 1].abilityIncrease = el.value || null; return C.lockIntMods(c, +el.dataset.level); }); break;
      case "core-spec": update((c) => {
        const slot = +el.dataset.slot; const t = C.templateCore(c.profession)[slot];
        const val = el.value.trim();
        const old = c.coreSkills[slot];
        c.coreSkills[slot] = val ? t.replace("*", val) : t;
        if (old && c.skills[old] && old !== c.coreSkills[slot] && !old.includes("*")) { c.skills[c.coreSkills[slot]] = c.skills[old]; delete c.skills[old]; }
      }); break;
      case "extra-core": case "extra-spec": update((c) => {
        const core = c.coreSkills.slice(0, 9);
        while (core.length < 9) core.push(C.templateCore(c.profession)[core.length]);
        const extra = c.coreSkills.slice(9);
        if (a === "extra-core") extra[i] = el.value; else extra[i] = `${C.skillBase(extra[i])} (${el.value.trim()})`;
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
      case "item": update((c) => { const k = el.dataset.k; c.equipment[i][k] = el.type === "number" ? +el.value : el.value; }, { render: false }); break;
      default: D.handleChange && D.handleChange(a, el, api);
    }
  }

  /** A fully built 3rd-level investigator whose numbers are worked by hand in v2/DESIGNS.md. */
  function sampleCharacter() {
    const c = C.newCharacter({
      name: "Dr. Kristof Lehmann (sample)", player: "", gender: "M", age: 52, era: "1921-1940", profession: "Professor", level: 3,
      attackOption: "defense", goodSaves: ["ref", "will"],
      abilities: { Str: 10, Dex: 12, Con: 13, Int: 15, Wis: 14, Cha: 11 },
      coreSkills: ["Concentration", "Diplomacy", "Gather Information", "Knowledge (history)", "Knowledge (occult)", "Knowledge (archaeology)", "Research", "Speak Other Language (Latin)", "Spot", "Listen", "Search", "Heal"],
      skills: {
        "Knowledge (occult)": { ranks: 6 }, "Knowledge (history)": { ranks: 6 }, "Knowledge (archaeology)": { ranks: 5 }, Research: { ranks: 6 },
        Spot: { ranks: 6 }, Listen: { ranks: 6 }, "Speak Other Language (Latin)": { ranks: 4 }, Search: { ranks: 6 }, Heal: { ranks: 4 },
        Concentration: { ranks: 4 }, Diplomacy: { ranks: 4 }, "Gather Information": { ranks: 3 }, Drive: { ranks: 3 },
      },
      feats: [{ name: "Alertness" }, { name: "Weapon Proficiency", choice: "pistol" }, { name: "Iron Will" }],
      money: { roll: 4, cash: null, notes: "" },
      armor: "None",
      weapons: [{ id: C.uid(), name: "Handgun (9mm)", category: "pistol", damage: "1d10", critical: "×3", range: "20 ft", capacity: 9, ammo: 9, rof: "Multifire" }],
      equipment: [{ id: C.uid(), name: "Flashlight", qty: 1 }, { id: C.uid(), name: "Notebook & pencil", qty: 1 }, { id: C.uid(), name: "First aid kit", qty: 1 }],
      notes: "Assistant professor of history. Sample character for checking the sheet's numbers.",
    });
    c.levelLog = [{ level: 1, intMod: null, hpRoll: null }, { level: 2, intMod: null, hpRoll: 4 }, { level: 3, intMod: null, hpRoll: 3 }];
    return C.lockIntMods(C.normalize(c), 1);
  }

  // API handed to designs.js for play-mode actions.
  const api = { update, render, toast, rollD20, rollDice, pushLog, confirmDialog, state, esc, levelUp };

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", (e) => { if (e.target.dataset.live && D.handleInput) D.handleInput(e.target.dataset.live, e.target, api); });
  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const got = S.importData(text);
        toast(`Imported ${got.length} character${got.length === 1 ? "" : "s"}.`);
        render();
      } catch (err) { toast("Couldn't read that file: " + esc(err.message)); }
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
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(true); });

  const migrated = S.importLegacyOnce();
  if (migrated.length) setTimeout(() => toast(`Copied ${migrated.length} character(s) from the original sheet. Review their skills and HP on the edit screen.`, 7000), 300);
  if (!location.hash && S.lastOpened() && S.load(S.lastOpened())) history.replaceState(null, "", "#/");
  onRoute();
  window.App = api;
})();
