/*
 * designs.js — the three play-mode designs and the play actions they share.
 *
 * Every design renders from the same derived sheet (CoC.derive) and uses the
 * same building blocks, so the numbers are identical whichever one you pick:
 *   tracker — "Table Tracker": dashboard for a laptop/tablet at the table
 *   sheet   — "Classic Sheet": a record-sheet layout that also prints cleanly
 *   pocket  — "Pocket": phone-first, big touch targets, tabbed
 */
(function () {
  "use strict";
  const C = window.CoC;

  const list = [
    { key: "tracker", name: "Table Tracker", blurb: "Dashboard for a laptop or tablet." },
    { key: "sheet", name: "Classic Sheet", blurb: "Record-sheet layout; prints cleanly." },
    { key: "pocket", name: "Pocket", blurb: "Phone-first with big buttons and tabs." },
  ];
  const playAlerts = [];

  const SAVE_NAMES = { fort: "Fortitude", ref: "Reflex", will: "Will" };
  const pct = (v, max) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);

  // ---------------------------------------------------------------------------
  // Building blocks
  // ---------------------------------------------------------------------------
  function header(ch, d, x) {
    const { esc } = x;
    return `<div class="play-header">
      <div>
        <h1>${esc(ch.name || "Unnamed investigator")}</h1>
        <p class="muted">Level ${ch.level} ${esc(ch.profession)} · ${esc((C.ERAS[ch.era] || {}).label || "")} · ${ch.attackOption === "offense" ? "Offense" : "Defense"} option${ch.player ? " · played by " + esc(ch.player) : ""}</p>
      </div>
      <div class="play-header-actions no-print">
        <button class="btn small" data-action="level-up">Level up</button>
      </div>
    </div>`;
  }

  function alertsBlock(x) {
    if (!playAlerts.length) return "";
    return `<div class="play-alerts" role="alert">${playAlerts.map((a, i) => `<div class="alert ${a.kind}"><span>${a.html}</span><button class="btn small ghost" data-action="alert-dismiss" data-i="${i}" aria-label="Dismiss">✕</button></div>`).join("")}</div>`;
  }

  function hpBlock(ch, d, x, opts = {}) {
    const hp = d.hp;
    const state = hp.state;
    return `<section class="panel vital hp state-${state.key}" aria-label="Hit points">
      <div class="vital-head"><h2>Hit Points</h2><span class="state-badge">${state.label}</span></div>
      <div class="vital-num"><span class="cur">${hp.current}</span><span class="sep">/</span><span class="max">${hp.max}</span>${hp.subdual ? `<span class="subdual" title="Subdual damage">${hp.subdual} subdual</span>` : ""}</div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${hp.max}" aria-valuenow="${hp.current}"><i style="width:${pct(hp.current, hp.max)}%"></i></div>
      ${state.note ? `<p class="state-note">${ch.hp.stable && state.key === "dying" ? "Stable: unconscious but no longer losing HP. Each hour, 10% chance to wake (disabled)." : state.note}</p>` : ""}
      ${state.key === "dying" && !ch.hp.stable ? `<div class="row no-print"><button class="btn small" data-action="hp-stabilize" title="End of each round: d10, on a 1 the character stabilizes; otherwise lose 1 HP (p.69)">10% roll (end of round)</button><button class="btn small ghost" data-action="hp-stable" title="A successful Heal check (DC 15) stabilizes a dying character">Stabilized (Heal DC 15)</button></div>` : ""}
      ${hp.subdual && hp.subdual >= hp.current && hp.current > 0 ? `<p class="state-note">Subdual damage ≥ current HP: ${hp.subdual === hp.current ? "staggered" : "unconscious"}.</p>` : ""}
      <div class="amount-row no-print">
        <label class="sr-only" for="hpAmt-${opts.id || "a"}">Amount</label>
        <input class="amt" id="hpAmt-${opts.id || "a"}" type="number" min="0" inputmode="numeric" placeholder="0" />
        <button class="btn danger" data-action="hp-damage">Damage</button>
        <button class="btn ok" data-action="hp-heal">Heal</button>
        ${opts.compact ? "" : `<button class="btn ghost small" data-action="hp-subdual" title="Subdual (nonlethal) damage">Subdual</button>`}
        <button class="btn ghost small" data-action="hp-rest" title="Natural healing: 1 HP per character level per day of rest (p.69)">Rest a day</button>
      </div>
      ${opts.compact ? "" : `<p class="hint">Max = 6 ${x.fmt(hp.conMod)} at 1st${hp.perLevel.length ? " + hit dice" : ""}${hp.toughness ? ` + ${hp.toughness} Toughness` : ""}. 0 HP disabled · −1 to −9 dying · −10 dead.</p>`}
    </section>`;
  }

  function sanityBlock(ch, d, x, opts = {}) {
    const s = d.sanity;
    const { esc } = x;
    return `<section class="panel vital san state-${s.state.key}" aria-label="Sanity">
      <div class="vital-head"><h2>Sanity</h2><span class="state-badge">${esc(ch.sanity.insanity !== "sane" ? { temporary: "Temporarily insane", indefinite: "Indefinitely insane", permanent: "Permanently insane" }[ch.sanity.insanity] : s.state.label)}</span></div>
      <div class="vital-num"><span class="cur">${s.current}</span><span class="sep">/</span><span class="max">${s.max}</span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${s.max}" aria-valuenow="${s.current}"><i style="width:${pct(s.current, s.max)}%"></i></div>
      <dl class="san-facts">
        <div><dt>Starting</dt><dd>${s.starting}</dd></div>
        <div><dt>Mythos</dt><dd>${s.mythos}</dd></div>
        <div><dt title="Losing this much in one roll forces a Sanity check (temporary insanity on a failure)">½ Wis</dt><dd>${s.tempThreshold}</dd></div>
        <div><dt title="Losing this much within one game hour causes indefinite insanity">This hour</dt><dd class="${s.hourLoss >= s.indefiniteThreshold ? "bad" : ""}">${s.hourLoss}/${s.indefiniteThreshold}</dd></div>
      </dl>
      ${s.state.note ? `<p class="state-note">${s.state.note}</p>` : ""}
      <div class="amount-row no-print">
        <label class="sr-only" for="sanAmt-${opts.id || "a"}">Amount</label>
        <input class="amt" id="sanAmt-${opts.id || "a"}" type="number" min="0" inputmode="numeric" placeholder="0" />
        <button class="btn danger" data-action="san-lose">Lose</button>
        <button class="btn ok" data-action="san-gain" title="Gain Sanity (capped at maximum)">Gain</button>
        ${opts.compact ? "" : `<button class="btn ghost small" data-action="san-therapy" title="Psychoanalysis: cannot raise Sanity above starting Sanity">Therapy</button>`}
      </div>
      <div class="row no-print">
        <button class="btn small" data-action="san-check">Sanity check (d%)</button>
        <button class="btn small ghost" data-action="san-hour" title="Start a new in-game hour for the 20% indefinite-insanity tracker">New hour</button>
        ${opts.compact ? "" : `<button class="btn small ghost" data-action="san-mythos" title="First Mythos-related insanity +2 Cthulhu Mythos ranks, then +1 each time (p.50)">Mythos insanity</button>`}
        <label class="field inline"><span class="sr-only">Insanity state</span><select data-action="insanity" aria-label="Insanity state">${["sane", "temporary", "indefinite", "permanent"].map((k) => `<option value="${k}" ${ch.sanity.insanity === k ? "selected" : ""}>${{ sane: "Sane", temporary: "Temporary insanity", indefinite: "Indefinite insanity", permanent: "Permanent insanity" }[k]}</option>`).join("")}</select></label>
      </div>
    </section>`;
  }

  function abilitiesBlock(ch, d, x, opts = {}) {
    return `<section class="panel abilities" aria-label="Abilities"><h2>Abilities</h2>
      <div class="abil-grid">${C.ABILITIES.map((a) => {
        const s = d.scores[a];
        return `<div class="abil ${s.damage ? "damaged" : ""}">
          <button class="abil-btn" data-action="roll-ability" data-a="${a}" title="Roll a ${C.ABILITY_NAMES[a]} check">
            <span class="abil-name">${a}</span><span class="abil-mod">${x.fmt(s.mod)}</span><span class="abil-score">${s.score}${s.damage ? `<small> (${s.permanent})</small>` : ""}</span>
          </button>
          ${opts.noDamage ? "" : `<div class="abil-dmg no-print" title="Temporary ability damage (recovers 1 point per day)"><button class="mini-btn" data-action="abil-dmg" data-a="${a}" data-v="1" aria-label="Damage ${a}">−</button><span>${s.damage ? "−" + s.damage : "dmg"}</span><button class="mini-btn" data-action="abil-dmg" data-a="${a}" data-v="-1" aria-label="Restore ${a}">+</button></div>`}
        </div>`;
      }).join("")}</div></section>`;
  }

  function combatBlock(ch, d, x) {
    const cb = d.combat;
    const sv = d.saves;
    const saveBtn = (k) => `<button class="stat-btn" data-action="roll-save" data-k="${k}" title="${SAVE_NAMES[k]}: base ${sv[k].base} (${sv[k].good ? "good" : "bad"}) ${x.fmt(sv[k].ability)} ability${sv[k].feat ? ` +${sv[k].feat} feat` : ""}"><span class="lbl">${SAVE_NAMES[k]}</span><span class="val">${x.fmt(sv[k].total)}</span></button>`;
    return `<section class="panel combat" aria-label="Combat">
      <h2>Combat</h2>
      <div class="stat-row">
        <div class="stat" title="10 ${x.fmt(cb.acParts.dex)} Dex + ${cb.acParts.armor} armor${cb.acParts.defense ? ` + ${cb.acParts.defense} defense` : ""}"><span class="lbl">AC</span><span class="val">${cb.ac}</span><span class="sub">touch ${cb.touch} · flat ${cb.flatFooted}</span></div>
        <button class="stat-btn" data-action="roll-init" title="Dex ${x.fmt(cb.initParts.dex)}${cb.initParts.feat ? " + 4 Improved Initiative" : ""}"><span class="lbl">Initiative</span><span class="val">${x.fmt(cb.init)}</span></button>
        <div class="stat"><span class="lbl">Base attack</span><span class="val">${cb.sequence.map(x.fmt).join("/")}</span></div>
        <div class="stat"><span class="lbl">Speed</span><span class="val">${cb.speed} ft</span></div>
      </div>
      <div class="stat-row saves">${saveBtn("fort")}${saveBtn("ref")}${saveBtn("will")}</div>
      <div class="stat-row">
        <button class="stat-btn" data-action="roll-attack-basic" data-k="melee"><span class="lbl">Melee</span><span class="val">${x.fmt(cb.melee + cb.acp)}</span></button>
        <button class="stat-btn" data-action="roll-attack-basic" data-k="ranged"><span class="lbl">Ranged</span><span class="val">${x.fmt(cb.ranged + cb.acp)}</span></button>
        <div class="stat"><span class="lbl">Armor</span><span class="val small">${x.esc(cb.armor.name)}</span>${cb.acp ? `<span class="sub">check ${cb.acp}</span>` : ""}</div>
      </div>
    </section>`;
  }

  function weaponsBlock(ch, d, x, opts = {}) {
    const { esc, fmt } = x;
    if (!d.weapons.length) return `<section class="panel weapons" aria-label="Weapons"><h2>Weapons</h2><p class="muted">No weapons. Add them on the Gear step of Edit. Unarmed: ${fmt(d.combat.melee)} for ${C.hasFeat(ch, "Martial Artist") ? "1d4" : "1d3 subdual"}.</p></section>`;
    const rows = d.weapons.map((w, i) => {
      const wp = w.weapon;
      const prof = C.isProficient(ch, wp);
      const ammo = wp.capacity ? `<span class="ammo no-print"><button class="mini-btn" data-action="ammo" data-i="${i}" data-v="-1" aria-label="Fire one">−</button><span>${wp.ammo ?? wp.capacity}/${wp.capacity}</span><button class="mini-btn" data-action="ammo" data-i="${i}" data-v="reload" aria-label="Reload">⟳</button></span><span class="print-only">${wp.capacity} rds</span>` : "";
      return `<tr>
        <th scope="row">${esc(wp.name)}${prof ? "" : ' <span class="bad" title="Not proficient: −4 included">(−4 nonprof.)</span>'}${opts.compact && (wp.range || wp.rof) ? `<br><small class="muted">${esc([wp.range, wp.rof].filter(Boolean).join(" · "))}</small>` : ""}</th>
        <td class="num"><button class="roll-link" data-action="roll-attack" data-i="${i}" title="BAB ${fmt(w.parts.bab)} ${fmt(w.parts.ability)} ${w.ability}${w.parts.focus ? " +1 focus" : ""}${w.parts.armor ? ` ${w.parts.armor} armor` : ""}${w.parts.nonproficient ? " −4 nonproficient" : ""}">${w.sequence.map(fmt).join("/")}</button></td>
        <td><button class="roll-link" data-action="roll-damage" data-i="${i}">${esc(wp.damage)}${w.damageBonus ? " " + fmt(w.damageBonus) : ""}</button></td>
        <td>${esc(w.critical)}</td>
        ${opts.compact ? "" : `<td>${esc(wp.range || "—")}${wp.rof ? `<br><small>${esc(wp.rof)}</small>` : ""}</td>`}
        <td>${ammo}</td>
      </tr>`;
    }).join("");
    const pbs = C.hasFeat(ch, "Point Blank Shot") ? `<p class="hint">Point Blank Shot: +1 attack and damage with ranged weapons within 30 ft (not included).</p>` : "";
    return `<section class="panel weapons" aria-label="Weapons"><h2>Weapons</h2>
      <div class="table-wrap"><table class="wtable"><thead><tr><th>Weapon</th><th>Attack</th><th>Damage</th><th>Crit</th>${opts.compact ? "" : "<th>Range</th>"}<th>Ammo</th></tr></thead><tbody>${rows}</tbody></table></div>${pbs}</section>`;
  }

  function skillsBlock(ch, d, x, opts = {}) {
    const { esc, fmt, state } = x;
    const q = (state.skillFilter || "").toLowerCase();
    const mode = state.skillMode || "all";
    let rows = d.skills.slice();
    if (mode === "trained") rows = rows.filter((r) => r.effRanks > 0 || r.core);
    if (mode === "usable") rows = rows.filter((r) => r.usable);
    if (q) rows = rows.filter((r) => r.id.toLowerCase().includes(q));
    const items = rows.map((r) => {
      const title = `${r.id}: ${r.parts.ranks} ranks${r.ability ? ` ${fmt(r.parts.ability)} ${r.ability}` : ""}${r.parts.feat ? ` ${fmt(r.parts.feat)} feat` : ""}${r.parts.emphasis ? " +3 emphasis" : ""}${r.parts.synergy ? " +2 synergy" : ""}${r.parts.armor ? ` ${r.parts.armor} armor` : ""}${r.parts.gear ? ` ${r.parts.gear} gear weight` : ""}${r.parts.misc ? ` ${fmt(r.parts.misc)} misc` : ""}${r.usable ? "" : " — trained only, cannot be used untrained"}`;
      return opts.table
        ? `<tr class="${r.core ? "core" : ""} ${r.usable ? "" : "unusable"}"><td class="c">${r.core ? "●" : ""}</td><th scope="row"><button class="roll-link" data-action="roll-skill" data-id="${esc(r.id)}" ${r.usable ? "" : "disabled"} title="${esc(title)}">${esc(r.id)}</button>${r.def.untrained ? "" : "<sup>T</sup>"}${r.def.acp ? "<sup>A</sup>" : ""}</th><td class="num strong">${r.usable ? fmt(r.total) : "—"}</td><td class="num">${r.ranks || ""}</td><td>${r.ability || "—"}</td><td class="num">${r.ability ? fmt(r.parts.ability) : ""}</td><td class="num">${(r.parts.misc + r.parts.feat + r.parts.emphasis + r.parts.synergy + r.parts.armor + r.parts.gear) || ""}</td></tr>`
        : `<li class="${r.core ? "core" : ""} ${r.usable ? "" : "unusable"}"><button class="skill-btn" data-action="roll-skill" data-id="${esc(r.id)}" ${r.usable ? "" : "disabled"} title="${esc(title)}"><span class="sk-name">${esc(r.id)}</span><span class="sk-total">${r.usable ? fmt(r.total) : "—"}</span></button></li>`;
    }).join("");
    const controls = opts.noControls ? "" : `<div class="skill-controls no-print">
        <input type="search" placeholder="Find a skill…" value="${esc(state.skillFilter || "")}" data-live="skill-filter" aria-label="Find a skill" />
        <div class="seg" role="group" aria-label="Show">${[["all", "All"], ["usable", "Usable"], ["trained", "Trained"]].map(([k, l]) => `<button class="seg-btn ${mode === k ? "on" : ""}" data-action="skill-mode" data-k="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div>
      </div>`;
    const body = opts.table
      ? `<div class="table-wrap"><table class="stable"><thead><tr><th title="Core skill">C</th><th>Skill</th><th>Total</th><th>Ranks</th><th>Key</th><th>Abil</th><th>Misc</th></tr></thead><tbody>${items}</tbody></table></div><p class="hint">● core skill · T trained only · A armor check penalty applies</p>`
      : `<ul class="skill-list">${items || '<li class="muted">No matching skills.</li>'}</ul><p class="hint">Tap a skill to roll d20 + total. Core skills are marked; greyed skills can't be used untrained.</p>`;
    return `<section class="panel skills" aria-label="Skills"><h2>Skills</h2>${controls}${body}</section>`;
  }

  function featsBlock(ch, d, x) {
    const { esc } = x;
    if (!ch.feats.length) return `<section class="panel feats"><h2>Feats</h2><p class="muted">None.</p></section>`;
    return `<section class="panel feats" aria-label="Feats"><h2>Feats</h2><ul class="feat-summary">${ch.feats.map((f) => {
      const def = C.FEAT_BY_NAME[f.name];
      return `<li><strong>${esc(f.name)}${f.choice ? ` (${esc(C.WEAPON_CATEGORIES[f.choice] || f.choice)})` : ""}</strong> — <span>${esc(def ? def.text : "")}</span></li>`;
    }).join("")}</ul></section>`;
  }

  function gearBlock(ch, d, x) {
    const { esc } = x;
    const m = d.money;
    return `<section class="panel gear" aria-label="Equipment"><h2>Equipment & Money</h2>
      ${ch.equipment.length ? `<ul class="gear-list">${ch.equipment.map((e) => `<li>${esc(e.name)}${e.qty > 1 ? ` ×${e.qty}` : ""}${e.notes ? ` <span class="muted">— ${esc(e.notes)}</span>` : ""}</li>`).join("")}</ul>` : '<p class="muted">No equipment listed.</p>'}
      <div class="money-row">
        <label class="field inline"><span class="lbl">Cash $</span><input type="number" step="0.01" data-live="cash" value="${esc(ch.money.cash ?? (m.rolled ? m.startingTotal : ""))}" aria-label="Cash on hand" /></label>
        ${m.rolled ? `<span class="muted">Savings $${m.savings.toLocaleString()} · income $${m.income.toLocaleString()}/yr</span>` : ""}
      </div></section>`;
  }

  function notesBlock(ch, d, x) {
    return `<section class="panel notes" aria-label="Session notes"><h2>Session notes</h2>
      <textarea data-live="session-notes" rows="6" placeholder="Clues, contacts, names, places…" aria-label="Session notes">${x.esc(ch.sessionNotes || "")}</textarea></section>`;
  }

  function logBlock(ch, d, x) {
    const items = (ch.log || []).slice(0, 15).map((l) => `<li><time>${new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> ${x.esc(l.text)}</li>`).join("");
    return `<section class="panel log no-print" aria-label="Roll log"><h2>Log</h2>${items ? `<ol class="log-list">${items}</ol><button class="btn small ghost" data-action="clear-log">Clear log</button>` : '<p class="muted">Rolls and changes appear here.</p>'}</section>`;
  }

  /** Compact read-only summary (used by the editor's Review step). */
  function summaryBlock(ch, d, x) {
    return abilitiesBlock(ch, d, x, { noDamage: true }) + combatBlock(ch, d, x) + weaponsBlock(ch, d, x) + featsBlock(ch, d, x)
      + `<section class="panel"><h2>Vitals</h2><p>HP <strong>${d.hp.max}</strong> · Sanity <strong>${d.sanity.current}</strong> (max ${d.sanity.max}) · ${d.money.rolled ? `Savings $${d.money.savings.toLocaleString()}` : "money not rolled"}</p></section>`
      + skillsBlock(ch, d, x, { table: true, noControls: true });
  }

  // ---------------------------------------------------------------------------
  // Designs
  // ---------------------------------------------------------------------------
  function tracker(ch, d, x) {
    return `<div class="design-tracker">
      ${header(ch, d, x)}${alertsBlock(x)}
      <div class="tracker-grid">
        <div class="col vitals-col">${hpBlock(ch, d, x, { id: "t" })}${sanityBlock(ch, d, x, { id: "t" })}</div>
        <div class="col combat-col">${combatBlock(ch, d, x)}${weaponsBlock(ch, d, x, { compact: true })}${abilitiesBlock(ch, d, x)}</div>
        <div class="col skills-col">${skillsBlock(ch, d, x)}</div>
      </div>
      <div class="tracker-bottom">${featsBlock(ch, d, x)}${gearBlock(ch, d, x)}${notesBlock(ch, d, x)}${logBlock(ch, d, x)}</div>
    </div>`;
  }

  function sheet(ch, d, x) {
    const { esc, fmt } = x;
    const box = (label, value) => `<div class="box"><span class="box-lbl">${label}</span><span class="box-val">${value}</span></div>`;
    const abilRows = C.ABILITIES.map((a) => {
      const s = d.scores[a];
      return `<tr><th scope="row">${C.ABILITY_NAMES[a].toUpperCase()}</th><td class="num strong"><button class="roll-link" data-action="roll-ability" data-a="${a}">${s.permanent}</button></td><td class="num strong">${fmt(C.abilityMod(s.permanent))}</td><td class="num">${s.damage ? s.score : ""}</td><td class="num">${s.damage ? fmt(s.mod) : ""}</td></tr>`;
    }).join("");
    const sv = d.saves;
    const saveRow = (k, abil) => `<tr><th scope="row"><button class="roll-link" data-action="roll-save" data-k="${k}">${SAVE_NAMES[k].toUpperCase()}</button></th><td class="num strong">${fmt(sv[k].total)}</td><td class="num">${sv[k].base}${sv[k].good ? "*" : ""}</td><td class="num">${fmt(sv[k].ability)} ${abil}</td><td class="num">${sv[k].feat || ""}</td></tr>`;
    const hpTrack = Array.from({ length: Math.min(d.hp.max, 60) }, (_, i) => `<i class="${i < d.hp.current ? "" : "gone"}"></i>`).join("");
    const san = d.sanity;
    return `<div class="design-sheet">
      <div class="sheet-page">
        <div class="sheet-title"><h1>${esc(ch.name || "Unnamed investigator")}</h1><span>CALL OF CTHULHU d20 · CHARACTER RECORD</span></div>
        <div class="sheet-ident">
          ${box("Player", esc(ch.player || "—"))}${box("Profession", esc(ch.profession))}${box("Level", ch.level)}${box("Era", esc((C.ERAS[ch.era] || {}).label || ""))}
          ${box("Age", esc(ch.age))}${box("Gender", esc(ch.gender || "—"))}${box("Option", ch.attackOption === "offense" ? "Offense" : "Defense")}${box("Speed", "30 ft")}
        </div>
        ${alertsBlock(x)}
        <div class="sheet-cols">
          <div class="sheet-left">
            <table class="sheet-table"><caption>Abilities</caption><thead><tr><th></th><th>Score</th><th>Mod</th><th>Temp</th><th>Temp mod</th></tr></thead><tbody>${abilRows}</tbody></table>
            <table class="sheet-table"><caption>Saving throws</caption><thead><tr><th></th><th>Total</th><th>Base</th><th>Ability</th><th>Feat</th></tr></thead><tbody>${saveRow("fort", "Con")}${saveRow("ref", "Dex")}${saveRow("will", "Wis")}</tbody></table>
            <p class="hint">* good save</p>
            <div class="sheet-boxes">
              ${box("Armor class", `${d.combat.ac}<small> touch ${d.combat.touch} · flat ${d.combat.flatFooted}</small>`)}
              ${box("Initiative", `<button class="roll-link" data-action="roll-init">${fmt(d.combat.init)}</button>`)}
              ${box("Base attack", d.combat.sequence.map(fmt).join("/"))}
              ${box("Melee / Ranged", `${fmt(d.combat.melee + d.combat.acp)} / ${fmt(d.combat.ranged + d.combat.acp)}`)}
            </div>
            <div class="sheet-hp">
              <div class="sheet-hp-head"><strong>HIT POINTS</strong> <span>max ${d.hp.max}</span> <span>current <input type="number" class="sheet-inline" data-live="hp-current" value="${d.hp.current}" aria-label="Current hit points" /></span> <span class="state-badge state-${d.hp.state.key}">${d.hp.state.label}</span></div>
              <div class="hp-track" aria-hidden="true">${hpTrack}</div>
              <p class="hint">0 disabled · −1 to −9 dying · −10 dead</p>
            </div>
            <div class="sheet-san">
              <div class="sheet-hp-head"><strong>SANITY</strong> <span>current <input type="number" class="sheet-inline" data-live="san-current" value="${san.current}" aria-label="Current Sanity" /></span> <span>max ${san.max}</span> <span>starting ${san.starting}</span></div>
              <p class="small">Mythos ${san.mythos} · ½ Wis ${san.tempThreshold} (one roll → Sanity check) · 20% this hour: ${san.hourLoss}/${san.indefiniteThreshold} → indefinite</p>
              <div class="row no-print"><button class="btn small" data-action="san-check">Sanity check (d%)</button><button class="btn small ghost" data-action="san-hour">New hour</button></div>
            </div>
          </div>
          <div class="sheet-right">
            ${skillsBlock(ch, d, x, { table: true, noControls: true })}
          </div>
        </div>
      </div>
      <div class="sheet-page">
        ${weaponsBlock(ch, d, x)}
        ${featsBlock(ch, d, x)}
        ${gearBlock(ch, d, x)}
        ${notesBlock(ch, d, x)}
        <div class="no-print sheet-vitals">${hpBlock(ch, d, x, { id: "s" })}${sanityBlock(ch, d, x, { id: "s" })}</div>
      </div>
    </div>`;
  }

  function pocket(ch, d, x) {
    const tab = x.state.pocketTab || "vitals";
    const tabs = [["vitals", "Vitals"], ["skills", "Skills"], ["combat", "Combat"], ["gear", "Gear"], ["notes", "Notes"]];
    const body = {
      vitals: hpBlock(ch, d, x, { id: "p", compact: false }) + sanityBlock(ch, d, x, { id: "p", compact: false }) + abilitiesBlock(ch, d, x),
      skills: skillsBlock(ch, d, x),
      combat: combatBlock(ch, d, x) + weaponsBlock(ch, d, x, { compact: true }),
      gear: gearBlock(ch, d, x) + featsBlock(ch, d, x),
      notes: notesBlock(ch, d, x) + logBlock(ch, d, x),
    }[tab];
    return `<div class="design-pocket">
      <div class="pocket-top">
        <div class="pocket-name"><strong>${x.esc(ch.name || "Investigator")}</strong> <span class="muted">L${ch.level} ${x.esc(ch.profession)}</span></div>
        <div class="pocket-vitals">
          <button class="pv hp state-${d.hp.state.key}" data-action="pocket-tab" data-k="vitals"><span>HP</span><strong>${d.hp.current}</strong><small>/${d.hp.max}</small></button>
          <button class="pv san state-${d.sanity.state.key}" data-action="pocket-tab" data-k="vitals"><span>SAN</span><strong>${d.sanity.current}</strong><small>/${d.sanity.max}</small></button>
          <div class="pv"><span>AC</span><strong>${d.combat.ac}</strong></div>
          <button class="pv" data-action="roll-init"><span>INIT</span><strong>${x.fmt(d.combat.init)}</strong></button>
        </div>
      </div>
      ${alertsBlock(x)}
      <div class="pocket-body">${body}</div>
      <div class="pocket-actions"><button class="btn small ghost" data-action="level-up">Level up</button></div>
      <nav class="pocket-tabs" aria-label="Sections">${tabs.map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-action="pocket-tab" data-k="${k}" aria-current="${tab === k ? "page" : "false"}">${l}</button>`).join("")}</nav>
    </div>`;
  }

  function render(key, ch, d, x) {
    const fn = { tracker, sheet, pocket }[key] || tracker;
    return fn(ch, d, x);
  }

  // ---------------------------------------------------------------------------
  // Play actions
  // ---------------------------------------------------------------------------
  function amount(el) {
    const panel = el.closest(".panel") || document;
    const input = panel.querySelector("input.amt");
    const v = input ? parseInt(input.value, 10) : NaN;
    return Number.isFinite(v) && v > 0 ? v : 0;
  }
  function addAlert(kind, html) { playAlerts.unshift({ kind, html }); if (playAlerts.length > 4) playAlerts.pop(); }

  function handleAction(a, el, api) {
    const ch = api.state.ch;
    if (!ch) return;
    const d = C.derive(ch);
    const i = el.dataset.i !== undefined ? +el.dataset.i : null;
    switch (a) {
      case "pocket-tab": api.state.pocketTab = el.dataset.k; api.render(); window.scrollTo(0, 0); break;
      case "skill-mode": api.state.skillMode = el.dataset.k; api.render(); break;
      case "alert-dismiss": playAlerts.splice(i, 1); api.render(); break;
      case "clear-log": api.update((c) => { c.log = []; }); break;
      case "roll-skill": { const r = d.skills.find((s) => s.id === el.dataset.id); if (r) api.rollD20(r.total, r.id); break; }
      case "roll-save": api.rollD20(d.saves[el.dataset.k].total, SAVE_NAMES[el.dataset.k] + " save"); break;
      case "roll-init": api.rollD20(d.combat.init, "Initiative"); break;
      case "roll-ability": api.rollD20(d.scores[el.dataset.a].mod, C.ABILITY_NAMES[el.dataset.a] + " check"); break;
      case "roll-attack-basic": api.rollD20(el.dataset.k === "melee" ? d.combat.melee + d.combat.acp : d.combat.ranged + d.combat.acp, el.dataset.k === "melee" ? "Melee attack" : "Ranged attack"); break;
      case "roll-attack": {
        const w = d.weapons[i];
        const total = api.rollD20(w.bonus, `${w.weapon.name} attack`);
        break;
      }
      case "roll-damage": {
        const w = d.weapons[i];
        const r = api.rollDice(w.weapon.damage);
        if (!r) { api.toast(`Roll ${api.esc(w.weapon.damage)} by hand.`); break; }
        const total = Math.max(1, r.total + w.damageBonus);
        api.toast(`<strong>${api.esc(w.weapon.name)} damage</strong><br><span class="roll-big">${total}</span> <span class="muted">(${r.rolls.join("+")}${w.damageBonus ? " " + C.fmt(w.damageBonus) : ""})</span>`);
        api.update((c) => api.pushLog(c, `${w.weapon.name} damage: ${total}`));
        break;
      }
      case "ammo": api.update((c) => {
        const w = c.weapons[i];
        const cur = w.ammo ?? w.capacity;
        w.ammo = el.dataset.v === "reload" ? w.capacity : Math.max(0, cur - 1);
      }); break;
      case "abil-dmg": api.update((c) => {
        const ab = el.dataset.a;
        c.abilityDamage[ab] = Math.max(0, C.toInt(c.abilityDamage[ab]) + C.toInt(el.dataset.v));
      }); break;
      case "hp-damage": case "hp-heal": case "hp-subdual": {
        const n = amount(el);
        if (!n) { api.toast("Enter an amount first."); break; }
        api.update((c) => {
          const before = d.hp.current;
          if (a === "hp-damage") { c.hp.current = before - n; c.hp.stable = false; }
          else if (a === "hp-heal") { c.hp.current = Math.min(d.hp.max, before + n); c.hp.subdual = Math.max(0, C.toInt(c.hp.subdual) - n); if (before < 0) c.hp.stable = true; }
          else c.hp.subdual = C.toInt(c.hp.subdual) + n;
          api.pushLog(c, a === "hp-damage" ? `Took ${n} damage (${before} → ${c.hp.current})` : a === "hp-heal" ? `Healed ${n} (${before} → ${c.hp.current})` : `Took ${n} subdual damage`);
          const st = C.hpState(c.hp.current);
          if (a === "hp-damage" && st.key !== "ok") addAlert(st.key === "dead" ? "danger" : "warn", `<strong>${st.label}.</strong> ${st.note}`);
        });
        break;
      }
      case "hp-stabilize": {
        const r = C.rollDie(10);
        api.update((c) => {
          if (r === 1) { c.hp.stable = true; api.pushLog(c, "10% roll: 1 — stabilized"); }
          else { c.hp.current = d.hp.current - 1; api.pushLog(c, `10% roll: ${r} — lost 1 HP (${d.hp.current} → ${c.hp.current})`); }
          if (C.hpState(c.hp.current).key === "dead") addAlert("danger", "<strong>Dead.</strong> Hit points reached −10.");
        });
        api.toast(r === 1 ? "<strong>10% roll: 1</strong><br>Stabilized." : `<strong>10% roll: ${r}</strong><br>Lost 1 HP.`);
        break;
      }
      case "hp-stable": api.update((c) => { c.hp.stable = true; api.pushLog(c, "Stabilized"); }); break;
      case "hp-rest": api.update((c) => {
        const gain = C.toInt(c.level, 1);
        c.hp.current = Math.min(d.hp.max, d.hp.current + gain);
        c.hp.subdual = 0;
        api.pushLog(c, `Rested a day: +${c.hp.current - d.hp.current} HP`);
      }); break;
      case "san-lose": {
        const n = amount(el);
        if (!n) { api.toast("Enter an amount first."); break; }
        const res = C.loseSanity(ch, n, "");
        const s = C.sanity(res.character);
        for (const t of res.triggers) {
          if (t === "temporary") addAlert("warn", `<strong>Lost ${n} in one roll (≥ ½ Wis = ${d.sanity.tempThreshold}).</strong> The GM calls for a Sanity check: on a failure the investigator goes temporarily insane (Table 4-1).`);
          if (t === "indefinite") addAlert("danger", `<strong>Lost ${s.hourLoss} Sanity this hour (≥ 20% = ${s.indefiniteThreshold}).</strong> The investigator goes indefinitely insane (Table 4-4) when the GM judges it.`);
          if (t === "zero") addAlert("danger", `<strong>Sanity at ${s.current}.</strong> The character loses 1 more Sanity each round until −10 unless stabilized with Psychoanalysis.`);
          if (t === "permanent") addAlert("danger", `<strong>Sanity −10 or lower: permanent insanity.</strong> The character becomes an NPC.`);
        }
        api.update(() => { const c = res.character; api.pushLog(c, `Lost ${n} Sanity (${d.sanity.current} → ${s.current})`); if (res.triggers.includes("permanent")) c.sanity.insanity = "permanent"; return c; });
        break;
      }
      case "san-gain": case "san-therapy": {
        const n = amount(el);
        if (!n) { api.toast("Enter an amount first."); break; }
        api.update(() => { const c = C.gainSanity(ch, n, a === "san-therapy" ? "therapy" : "other"); api.pushLog(c, `${a === "san-therapy" ? "Therapy" : "Gained"}: Sanity ${d.sanity.current} → ${C.sanity(c).current}`); return c; });
        break;
      }
      case "san-check": {
        const r = C.rollDie(100);
        const ok = r <= d.sanity.current;
        api.toast(`<strong>Sanity check</strong><br><span class="roll-big">${r}</span> vs ${d.sanity.current} — <strong class="${ok ? "ok" : "bad"}">${ok ? "success (lose the smaller amount)" : "failure (lose the larger amount)"}</strong>`, 6000);
        api.update((c) => api.pushLog(c, `Sanity check: ${r} vs ${d.sanity.current} — ${ok ? "success" : "failure"}`));
        break;
      }
      case "san-hour": api.update(() => { const c = C.newSanityHour(ch); api.pushLog(c, "New game hour (20% tracker reset)"); return c; }); api.toast("New game hour — the 20% indefinite-insanity tracker starts again."); break;
      case "san-mythos":
        api.confirmDialog(`<h2>Mythos-related insanity</h2><p>The first time an investigator goes insane from a Mythos encounter they gain 2 ranks of Cthulhu Mythos; each later episode adds 1 (p.50). Maximum Sanity drops to match.</p>`, "Add Mythos ranks").then((ok) => {
          if (ok) api.update(() => { const c = C.mythosInsanity(ch); api.pushLog(c, `Mythos insanity: Cthulhu Mythos now ${c.mythos}`); return c; });
        });
        break;
      default: break;
    }
  }

  function handleChange(a, el, api) {
    if (a === "insanity") api.update((c) => { c.sanity.insanity = el.value; api.pushLog(c, `Insanity state: ${el.value}`); });
  }

  let liveTimer = null;
  function handleInput(key, el, api) {
    if (key === "skill-filter") {
      api.state.skillFilter = el.value;
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => {
        const pos = el.selectionStart;
        api.render();
        const again = document.querySelector('[data-live="skill-filter"]');
        if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
      }, 150);
      return;
    }
    const apply = {
      "session-notes": (c) => { c.sessionNotes = el.value; },
      cash: (c) => { c.money.cash = el.value === "" ? null : Number(el.value); },
      "hp-current": (c) => { c.hp.current = el.value === "" ? null : Number(el.value); },
      "san-current": (c) => { c.sanity.current = el.value === "" ? null : Number(el.value); },
    }[key];
    if (apply) api.update(apply, { render: false });
  }

  window.Designs = { list, render, handleAction, handleChange, handleInput, summaryBlock };
})();
