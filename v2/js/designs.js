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
  // Buttons an alert may carry (alerts are saved on the character, so only these are allowed).
  const ALERT_BUTTONS = { "roll-temp-insanity": "Roll Tables 4-1 &amp; 4-2/4-3", "roll-indef-insanity": "Roll Table 4-4" };

  const SAVE_NAMES = { fort: "Fortitude", ref: "Reflex", will: "Will" };
  const pct = (v, max) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);

  // ---------------------------------------------------------------------------
  // Building blocks
  // ---------------------------------------------------------------------------
  function header(ch, d, x) {
    const { esc } = x;
    return `<div class="play-header">
      <div>
        <h1 tabindex="-1">${esc(ch.name || "Unnamed investigator")}</h1>
        <p class="muted">Level ${ch.level} ${esc(ch.profession)} · ${esc((C.ERAS[ch.era] || {}).label || "")} · ${ch.attackOption === "offense" ? "Offense" : "Defense"} option${ch.player ? " · played by " + esc(ch.player) : ""}</p>
      </div>
      <div class="play-header-actions no-print">${xpBox(ch, d, x)}${undoButton(x)}${ch.level < 20 ? `<button class="btn small" data-action="level-up">Level up</button>` : ""}</div>
    </div>${recentBlock(ch, x)}`;
  }

  /** XP with the next level's threshold (Table 1-10, p.11). */
  function xpBox(ch, d, x) {
    const xp = d.xp;
    const ready = xp.next !== null && xp.current >= xp.next;
    return `<label class="xp-box ${ready ? "ready" : ""}" title="${xp.next === null ? "20th level is the highest" : `Level ${ch.level + 1} at ${xp.next.toLocaleString()} XP (Table 1-10)`}"><span class="lbl">XP</span><input type="number" min="0" step="50" data-live="xp" value="${xp.current}" aria-label="Experience points" />${xp.next === null ? "" : `<span class="muted">/ ${xp.next.toLocaleString()}</span>`}${ready ? '<span class="badge">Level up!</span>' : ""}</label>`;
  }

  function undoButton(x) {
    const u = x.state.undo;
    return u ? `<button class="btn small ghost" data-action="undo" title="Undo: ${x.esc(u.label)}">↶ Undo <span class="undo-lbl">${x.esc(u.label)}</span></button>` : "";
  }

  /** The last three log entries, pinned where they can be seen (the toast fades). */
  function recentBlock(ch, x) {
    const items = (ch.log || []).slice(0, 3);
    if (!items.length) return "";
    return `<ol class="recent no-print" aria-label="Recent rolls and changes">${items.map((l, i) => `<li class="${i ? "" : "latest"}">${x.esc(l.text)}</li>`).join("")}</ol>`;
  }

  function alertsBlock(ch, d, x) {
    const { esc } = x;
    const zero = d.abilityZero.map((z) => `<div class="alert danger"><span><strong>${z.dead ? "Dead." : "Helpless."}</strong> ${esc(z.text)} <span class="muted">(p.62)</span></span></div>`).join("");
    const saved = (ch.alerts || []).map((a, i) => `<div class="alert ${a.kind}"><span><strong>${esc(a.title)}</strong> ${esc(a.text)}${ALERT_BUTTONS[a.action] ? ` <button class="btn small" data-action="${a.action}">${ALERT_BUTTONS[a.action]}</button>` : ""}</span><button class="btn small ghost" data-action="alert-dismiss" data-i="${i}" aria-label="Dismiss alert">✕</button></div>`).join("");
    return zero || saved ? `<div class="play-alerts" role="alert">${zero}${saved}</div>` : "";
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
        <input class="amt" id="hpAmt-${opts.id || "a"}" type="number" min="0" inputmode="numeric" placeholder="0" data-enter="hp-damage" />
        <button class="btn danger" data-action="hp-damage">Damage</button>
        <button class="btn danger ghost quick" data-action="hp-damage" data-n="1" aria-label="Take 1 damage">−1</button>
        <button class="btn danger ghost quick" data-action="hp-damage" data-n="5" aria-label="Take 5 damage">−5</button>
        <button class="btn ok" data-action="hp-heal">Heal</button>
        ${opts.compact ? "" : `<button class="btn ghost small" data-action="hp-subdual" title="Subdual (nonlethal) damage">Subdual</button>`}
        <button class="btn ghost small" data-action="hp-rest" title="Natural healing: 1 HP per character level per day of rest (p.69), and 1 point of each damaged ability (p.74)">Rest a day</button>
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
        <input class="amt" id="sanAmt-${opts.id || "a"}" type="number" min="0" inputmode="numeric" placeholder="0" data-enter="san-lose" />
        <button class="btn danger" data-action="san-lose">Lose</button>
        <button class="btn danger ghost quick" data-action="san-lose" data-n="1" aria-label="Lose 1 Sanity">−1</button>
        <button class="btn danger ghost quick" data-action="san-lose" data-n="5" aria-label="Lose 5 Sanity">−5</button>
        <button class="btn ok" data-action="san-gain" title="Gain Sanity (capped at maximum)">Gain</button>
        ${opts.compact ? "" : `<button class="btn ghost small" data-action="san-therapy" title="Psychoanalysis: cannot raise Sanity above starting Sanity">Therapy</button>`}
      </div>
      <div class="sanroll-row no-print">
        <label class="sr-only" for="sanRoll-${opts.id || "a"}">Sanity loss (success/failure)</label>
        <input class="sanroll" id="sanRoll-${opts.id || "a"}" list="sanExamples" placeholder="0/1d6" autocomplete="off" data-enter="san-roll" />
        <button class="btn" data-action="san-roll" title="Roll d% against current Sanity, then roll and apply the success or failure loss">Roll check &amp; apply</button>
        <datalist id="sanExamples">${C.SANITY_LOSS_EXAMPLES.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</datalist>
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
          <button class="abil-btn" data-action="roll-ability" data-a="${a}" title="Roll a ${C.ABILITY_NAMES[a]} check" aria-label="Roll ${C.ABILITY_NAMES[a]} check, ${x.fmt(s.mod)}">
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
        <div class="stat"><span class="lbl">Speed</span><span class="val">${cb.speed} ft</span>${cb.conditions.halfSpeed ? '<span class="sub">half (condition)</span>' : ""}</div>
      </div>
      <div class="stat-row saves">${saveBtn("fort")}${saveBtn("ref")}${saveBtn("will")}</div>
      <div class="stat-row">
        <button class="stat-btn" data-action="roll-attack-basic" data-k="melee"><span class="lbl">Melee</span><span class="val">${x.fmt(cb.melee + cb.acp)}</span></button>
        <button class="stat-btn" data-action="roll-attack-basic" data-k="ranged"><span class="lbl">Ranged</span><span class="val">${x.fmt(cb.ranged + cb.acp)}</span></button>
        <div class="stat"><span class="lbl">Armor</span><span class="val small">${x.esc(cb.armor.name)}</span>${cb.acp ? `<span class="sub">check ${cb.acp}</span>` : ""}</div>
      </div>
    </section>`;
  }

  /** Combat tracking: initiative and rounds, plus conditions (p.91). */
  function encounterBlock(ch, d, x) {
    const { esc } = x;
    const enc = ch.encounter;
    const on = new Set(ch.conditions);
    const chips = C.CONDITIONS.map((k) => `<button class="chip ${on.has(k.key) ? "on" : ""}" data-action="cond-toggle" data-k="${k.key}" aria-pressed="${on.has(k.key)}" title="${esc(k.text)}">${esc(k.name)}</button>`).join("");
    const active = d.combat.conditions.list;
    return `<section class="panel encounter no-print" aria-label="Encounter and conditions"><h2>Encounter</h2>
      ${enc ? `<div class="enc-row"><div class="enc-round"><span class="lbl">Round</span><strong>${enc.round}</strong></div><div class="enc-round"><span class="lbl">Initiative</span><strong>${enc.init ?? "—"}</strong></div>
        <button class="btn primary" data-action="enc-next">Next round</button><button class="btn ghost" data-action="enc-end">End combat</button></div>`
        : `<div class="enc-row"><button class="btn primary" data-action="enc-start" title="Rolls initiative (d20 ${x.fmt(d.combat.init)}) and marks you flat-footed until your first turn">Start combat</button><span class="muted small">Rolls initiative and counts rounds.</span></div>`}
      <h3 class="sub-h">Conditions</h3>
      <div class="chips" role="group" aria-label="Conditions">${chips}</div>
      ${active.length ? `<ul class="cond-list">${active.map((k) => `<li><strong>${esc(k.name)}:</strong> ${esc(k.text)}</li>`).join("")}</ul><p class="hint">Applied to the numbers on this sheet: ability penalties, attack penalties, initiative, speed and Dex to AC (Character Condition Summary, p.91).</p>` : ""}
    </section>`;
  }

  /** Spells known and Mythos tomes (Ch. 7). */
  function magicBlock(ch, d, x) {
    const { esc, fmt } = x;
    if (!ch.spells.length && !ch.tomes.length) return x.opts && x.opts.hideEmptyMagic ? "" : `<section class="panel magic no-print" aria-label="Magic"><h2>Magic</h2><p class="muted">No spells or tomes. Add them on the Magic step of Edit.</p></section>`;
    const drained = C.ABILITIES.filter((a) => d.scores[a].drained).map((a) => `${a} −${d.scores[a].drained}`);
    const spells = ch.spells.map((sp, i) => {
      const cost = C.parseSpellCost(sp.cost);
      return `<li class="spell"><div class="spell-head"><strong>${esc(sp.name)}</strong> <span class="muted small">${esc([sp.components, sp.castingTime, sp.range, sp.duration, sp.save].filter(Boolean).join(" · "))}</span></div>
        <div class="small">Cost: ${esc(sp.cost || "—")}${sp.casts ? ` <span class="muted">· cast ${sp.casts}×</span>` : ""}</div>${sp.notes ? `<div class="muted small">${esc(sp.notes)}</div>` : ""}
        <button class="btn small no-print" data-action="spell-cast" data-i="${i}" title="Pay the cost${cost.sanity ? `: ${esc(cost.sanity)} Sanity` : ""}${cost.abilities.length ? ` and ${esc(cost.abilities.map((c) => `${c.amount} ${c.ability}${c.permanent ? " drain" : ""}`).join(", "))}` : ""}">Cast</button></li>`;
    }).join("");
    const tomes = ch.tomes.map((t, i) => {
      const bonus = C.tomeStudyBonus(ch, t);
      const status = t.status === "read" ? "Read" : t.status === "examining" ? `Studying (${t.studyChecks} check${t.studyChecks === 1 ? "" : "s"} so far)` : "Unread";
      const btn = t.status === "read"
        ? `<button class="btn small" data-action="tome-consult" data-i="${i}" title="Spend 1d4 hours; Cthulhu Mythos check +${t.mythos} (p.120). No Sanity loss.">Consult</button>`
        : !t.initialDone
          ? `<button class="btn small" data-action="tome-open" data-i="${i}" title="Initial contact always risks Sanity (p.119)">Open it (Sanity ${esc(t.sanityInitial || "0")})</button>`
          : `<button class="btn small" data-action="tome-study" data-i="${i}" title="End of an Examination Period: 1d20 + level + Int + earlier checks vs DC ${t.dc} (p.119)">Study check (d20 ${fmt(bonus)} vs DC ${t.dc})</button>`;
      return `<li class="tome"><div class="spell-head"><strong>${esc(t.name)}</strong> <span class="muted small">${esc([t.language, t.exam && `${t.exam} per period`, `DC ${t.dc}`].filter(Boolean).join(" · "))}</span></div>
        <div class="small">${status} · Sanity ${esc(t.sanityInitial || "0")} initial, ${esc(t.sanityComplete || "0")} on completion · Cthulhu Mythos +${t.mythos}${t.spells ? ` · Spells: ${esc(t.spells)}` : ""}</div>
        <div class="no-print">${btn}</div></li>`;
    }).join("");
    return `<section class="panel magic" aria-label="Magic"><h2>Magic</h2>
      ${spells ? `<h3 class="sub-h">Spells known <span class="muted">· saves vs your spells DC ${C.spellSaveDC(ch)}</span></h3><ul class="spell-list">${spells}</ul>
      <p class="hint">Costs are paid when the casting completes (p.128). Damaged or distracted while casting: Concentration DC 15 + damage, or the spell is lost.${ch.options.unmasteredMagic ? " Unmastered Magic is on: each casting needs an Int check DC 15 (p.151)." : ""}</p>` : ""}
      ${tomes ? `<h3 class="sub-h">Tomes</h3><ul class="spell-list">${tomes}</ul><p class="hint">Not in your language? Speak Other Language DC 15 each week; a failure adds a week (p.119). Learning a spell from a read tome takes 1d3 weeks (p.129).</p>` : ""}
      ${drained.length ? `<p class="small"><strong>Permanent drain:</strong> ${drained.join(", ")}</p>` : ""}
    </section>`;
  }

  /** Free-form dice roller ("3d6+2", "d%"). */
  function diceBlock(ch, d, x) {
    const dice = ["d4", "d6", "d8", "d10", "d12", "d20", "d%"];
    return `<section class="panel dice no-print" aria-label="Dice roller"><h2>Dice</h2>
      <div class="dice-row"><label class="sr-only" for="diceExpr">Dice to roll</label><input id="diceExpr" class="dice-expr" placeholder="3d6+2" autocomplete="off" data-enter="dice-roll" value="${x.esc(x.state.diceExpr || "")}" /><button class="btn" data-action="dice-roll">Roll</button></div>
      <div class="dice-quick">${dice.map((k) => `<button class="btn ghost" data-action="dice-quick" data-v="${k}" aria-label="Roll ${k === "d%" ? "percentile dice" : "1" + k}">${k}</button>`).join("")}</div>
    </section>`;
  }

  /** Attack-bonus breakdown shown as a tooltip. */
  function attackTitle(w, fmt) {
    return `BAB ${fmt(w.parts.bab)} ${fmt(w.parts.ability)} ${w.ability}${w.parts.focus ? " +1 focus" : ""}${w.parts.armor ? ` ${w.parts.armor} armor` : ""}${w.parts.nonproficient ? " −4 nonproficient" : ""}${w.parts.condition ? ` ${w.parts.condition} conditions` : ""}`;
  }
  const rounds = (wp) => (wp.ammo ?? wp.capacity);

  /** Weapons as cards with large buttons (Table Tracker, Pocket). */
  function weaponCard(ch, w, i, x) {
    const { esc, fmt } = x;
    const wp = w.weapon;
    const prof = C.isProficient(ch, wp);
    const dmg = `${esc(wp.damage)}${w.damageBonus ? " " + fmt(w.damageBonus) : ""}`;
    const full = w.fullAttack && w.fullAttack.normal ? [["normal", w.fullAttack.normal, "Full attack"], ...(w.fullAttack.rapid ? [["rapid", w.fullAttack.rapid, "Full + Rapid Shot"]] : [])] : [];
    const fullBtns = full.map(([k, f, l]) => `<button class="btn ghost" data-action="fire-full" data-i="${i}" data-mode="${k}" title="Full-round action (p.80-81, Table 5-12)${f.bulletsPerAttack > 1 ? `: ${f.bulletsPerAttack} rounds per attack` : ""}">${l} <small>${f.sequence.map(fmt).join("/")}</small></button>`).join("");
    const empty = wp.capacity && !rounds(wp);
    return `<article class="wcard" aria-label="${esc(wp.name)}">
      <div class="wcard-head"><strong>${esc(wp.name)}</strong>${prof ? "" : ` <span class="bad" title="Not proficient: −4 included. Take the Weapon Proficiency (${esc(C.WEAPON_CATEGORIES[wp.category] || wp.category)}) feat to remove it (p.43).">−4 nonprof.</span>`} <span class="muted small">${esc([wp.range, wp.rof].filter(Boolean).join(" · "))}</span></div>
      <div class="wcard-stats muted small">Attack ${w.sequence.map(fmt).join("/")} · Damage ${dmg} · Crit ${esc(w.critical)}${wp.notes ? ` · ${esc(wp.notes)}` : ""}</div>
      <div class="wcard-btns">
        <button class="btn" data-action="roll-attack" data-i="${i}" title="${attackTitle(w, fmt)}${wp.capacity ? " — spends 1 round" : ""}" ${empty ? "disabled" : ""}>Attack ${fmt(w.bonus)}</button>
        <button class="btn" data-action="roll-damage" data-i="${i}">Damage ${dmg}</button>
        <button class="btn ghost" data-action="roll-crit" data-i="${i}" title="Confirmed critical: roll damage ×${w.multiplier} (p.66)">Crit ×${w.multiplier}</button>
        ${fullBtns}
      </div>
      ${wp.capacity ? `<div class="wcard-ammo"><span>Ammo <strong class="${empty ? "bad" : ""}">${esc(rounds(wp))}</strong>/${esc(wp.capacity)}</span><button class="btn ghost quick" data-action="ammo" data-i="${i}" data-v="-1" aria-label="Spend one round">−1</button><button class="btn" data-action="ammo" data-i="${i}" data-v="reload" title="Reloading to capacity is a full-round action">Reload</button></div>` : ""}
    </article>`;
  }

  function weaponsBlock(ch, d, x, opts = {}) {
    const { esc, fmt } = x;
    const stowed = d.weapons.filter((w) => !w.weapon.equipped).length;
    const pbs = (C.hasFeat(ch, "Point Blank Shot") ? `<p class="hint">Point Blank Shot: +1 attack and damage with ranged weapons within 30 ft (not included).</p>` : "")
      + (stowed ? `<p class="hint no-print">${stowed} weapon${stowed > 1 ? "s" : ""} carried but not equipped — equip ${stowed > 1 ? "them" : "it"} under Equipment &amp; Money.</p>` : "");
    if (opts.cards) {
      const cards = d.weapons.map((w, i) => (w.weapon.equipped ? weaponCard(ch, w, i, x) : "")).join("") + weaponCard(ch, d.unarmed, "u", x);
      return `<section class="panel weapons" aria-label="Weapons"><h2>Weapons</h2><div class="wcards">${cards}</div>${pbs}</section>`;
    }
    const all = d.weapons.map((w, i) => [w, i]).filter(([w]) => w.weapon.equipped).concat([[d.unarmed, "u"]]);
    const rows = all.map(([w, i]) => {
      const wp = w.weapon;
      const prof = C.isProficient(ch, wp);
      const ammo = wp.capacity ? `<span class="ammo no-print"><button class="mini-btn" data-action="ammo" data-i="${i}" data-v="-1" aria-label="Spend one round of ${esc(wp.name)}">−</button><span>${esc(rounds(wp))}/${esc(wp.capacity)}</span><button class="btn small ghost" data-action="ammo" data-i="${i}" data-v="reload" aria-label="Reload ${esc(wp.name)}">Reload</button></span><span class="print-only">${esc(rounds(wp))}/${esc(wp.capacity)} rds</span>` : "";
      return `<tr>
        <th scope="row">${esc(wp.name)}${prof ? "" : ` <span class="bad" title="Not proficient: −4 included. Take the Weapon Proficiency (${esc(C.WEAPON_CATEGORIES[wp.category] || wp.category)}) feat to remove it (p.43).">(−4 nonprof.)</span>`}${wp.notes ? `<br><small class="muted">${esc(wp.notes)}</small>` : ""}</th>
        <td class="num"><button class="roll-link" data-action="roll-attack" data-i="${i}" title="${attackTitle(w, fmt)}" aria-label="Roll ${esc(wp.name)} attack, ${fmt(w.bonus)}">${w.sequence.map(fmt).join("/")}</button></td>
        <td><button class="roll-link" data-action="roll-damage" data-i="${i}" aria-label="Roll ${esc(wp.name)} damage">${esc(wp.damage)}${w.damageBonus ? " " + fmt(w.damageBonus) : ""}</button></td>
        <td><button class="roll-link" data-action="roll-crit" data-i="${i}" title="Roll critical damage (×${w.multiplier})" aria-label="Roll ${esc(wp.name)} critical damage">${esc(w.critical)}</button></td>
        <td>${esc(wp.range || "—")}${wp.rof ? `<br><small>${esc(wp.rof)}</small>` : ""}</td>
        <td>${ammo}</td>
      </tr>`;
    }).join("");
    const fa = d.weapons.map((w, i) => [w, i]).filter(([w]) => w.weapon.equipped && w.fullAttack && w.fullAttack.normal).map(([w, i]) => {
      const f = w.fullAttack.normal, rp = w.fullAttack.rapid;
      return `<li><strong>${esc(w.weapon.name)}</strong> — <button class="roll-link" data-action="fire-full" data-i="${i}" data-mode="normal">full attack (${f.mode}): ${f.sequence.map(fmt).join("/")}</button>${rp ? `; <button class="roll-link" data-action="fire-full" data-i="${i}" data-mode="rapid">with Rapid Shot: ${rp.sequence.map(fmt).join("/")}</button>` : ""}${f.bulletsPerAttack > 1 ? " · 3 rounds per attack" : ""}</li>`;
    }).join("");
    const notes = (fa ? `<ul class="hint full-attacks">${fa}</ul><p class="hint">Firearm full attacks are a full-round action (p.80–81, Table 5-12). Reloading to capacity takes a full-round action.</p>` : "") + pbs;
    return `<section class="panel weapons" aria-label="Weapons"><h2>Weapons</h2>
      <div class="table-wrap"><table class="wtable"><thead><tr><th>Weapon</th><th>Attack</th><th>Damage</th><th>Crit</th><th>Range</th><th>Ammo</th></tr></thead><tbody>${rows}</tbody></table></div>${notes}</section>`;
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
      ? `<div class="table-wrap"><table class="stable"><thead><tr><th title="Core skill">C</th><th>Skill</th><th class="num">Total</th><th class="num">Ranks</th><th>Key</th><th class="num">Abil</th><th class="num">Misc</th></tr></thead><tbody>${items}</tbody></table></div><p class="hint">● core skill · T trained only · A armor check penalty applies</p>`
      : `<ul class="skill-list">${items || '<li class="muted">No matching skills.</li>'}</ul><p class="hint">Tap a skill to roll d20 + total. Core skills are marked; greyed skills can't be used untrained.</p>`;
    return `<section class="panel skills" aria-label="Skills"><h2>Skills</h2>${controls}${body}</section>`;
  }

  function featsBlock(ch, d, x) {
    const { esc } = x;
    if (!ch.feats.length) return `<section class="panel feats"><h2>Feats</h2><p class="muted">None.</p></section>`;
    return `<section class="panel feats" aria-label="Feats"><h2>Feats</h2><ul class="feat-summary">${ch.feats.map((f) => {
      const def = C.FEAT_BY_NAME[f.name];
      const w = def && def.choice === "weapon" ? ch.weapons.find((wp) => wp.id === f.choice) : null;
      const choice = w ? w.name : C.WEAPON_CATEGORIES[f.choice] || f.choice;
      return `<li><strong>${esc(f.name)}${f.choice ? ` (${esc(choice)})` : ""}</strong> — <span>${esc(def ? def.text : "")}</span></li>`;
    }).join("")}</ul></section>`;
  }

  /** Equipment and money, editable in play: add, rename, −/+ quantity, remove; spend or receive cash. */
  function gearBlock(ch, d, x) {
    const { esc } = x;
    const m = d.money;
    const cash = cashOnHand(ch, d);
    const items = ch.equipment.map((e, i) => `<li class="gear-item">
        <input class="gear-name no-print" data-action="gear-name" data-i="${i}" value="${esc(e.name)}" aria-label="Item name" />
        <span class="print-only">${esc(e.name)}${e.qty > 1 ? ` ×${e.qty}` : ""}</span>
        <span class="gear-qty no-print"><button class="mini-btn" data-action="gear-qty" data-i="${i}" data-v="-1" ${e.qty <= 1 ? "disabled" : ""} aria-label="One fewer ${esc(e.name)}">−</button><span aria-label="Quantity">${e.qty}</span><button class="mini-btn" data-action="gear-qty" data-i="${i}" data-v="1" aria-label="One more ${esc(e.name)}">+</button></span>
        <button class="mini-btn no-print" data-action="gear-remove" data-i="${i}" aria-label="Remove ${esc(e.name)}">✕</button>
        ${e.notes ? `<span class="muted small gear-notes">${esc(e.notes)}</span>` : ""}</li>`).join("");
    const weapons = ch.weapons.map((w, i) => `<li class="gear-item weapon-item ${w.equipped ? "is-equipped" : ""}">
        <span class="gear-wname">${esc(w.name)} <span class="muted small">${esc([w.damage, w.capacity ? `${w.ammo ?? w.capacity}/${w.capacity} rds` : ""].filter(Boolean).join(" · "))}</span></span>
        <span class="print-only">${w.equipped ? "(equipped)" : ""}</span>
        <button class="btn small ${w.equipped ? "primary" : "ghost"} no-print equip-btn" data-action="weapon-equip" data-i="${i}" aria-pressed="${w.equipped}" title="${w.equipped ? "Equipped: shown in the attack list. Tap to put it away." : "Carried but not ready. Tap to equip it."}">${w.equipped ? "Equipped" : "Equip"}</button></li>`).join("");
    return `<section class="panel gear" aria-label="Equipment and money"><h2>Equipment & Money</h2>
      <h3 class="sub-h">Weapons</h3>
      ${weapons ? `<ul class="gear-list editable">${weapons}</ul>` : '<p class="muted small">No weapons. Add them on the Gear step of Edit.</p>'}
      <h3 class="sub-h">Equipment</h3>
      ${items ? `<ul class="gear-list editable">${items}</ul>` : '<p class="muted">No equipment listed.</p>'}
      <div class="gear-add no-print"><label class="sr-only" for="gearNew">New item</label><input id="gearNew" placeholder="Add an item…" autocomplete="off" data-enter="gear-add" /><button class="btn small" data-action="gear-add">Add</button></div>
      <div class="money-row">
        <label class="field inline"><span class="lbl">Cash $</span><input type="number" step="0.01" data-live="cash" value="${esc(cash ?? "")}" aria-label="Cash on hand" /></label>
        ${m.rolled ? `<span class="muted">Savings $${m.savings.toLocaleString()} · income $${m.income.toLocaleString()}/yr</span>` : ""}
      </div>
      <div class="cash-row no-print"><label class="sr-only" for="cashAmt">Amount ($)</label><input id="cashAmt" class="cash-amt" type="number" min="0" step="0.01" inputmode="decimal" placeholder="$0.00" data-enter="cash-spend" />
        <button class="btn small danger" data-action="cash-spend">Spend</button><button class="btn small ok" data-action="cash-receive">Receive</button></div>
    </section>`;
  }
  /** Cash on hand: the amount entered, or the starting money (Tables 1-13, 1-14) until one is entered. */
  function cashOnHand(ch) { return C.cashOnHand(ch); }

  function notesBlock(ch, d, x) {
    return `<section class="panel notes" aria-label="Session notes"><h2>Session notes</h2>
      <textarea class="no-print" data-live="session-notes" rows="6" placeholder="Clues, contacts, names, places…" aria-label="Session notes">${x.esc(ch.sessionNotes || "")}</textarea>
      <div class="print-only print-notes">${x.esc(ch.sessionNotes || "")}</div></section>`;
  }

  function logBlock(ch, d, x) {
    const items = (ch.log || []).slice(0, 15).map((l) => `<li><time>${new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> ${x.esc(l.text)}</li>`).join("");
    return `<section class="panel log no-print" aria-label="Roll log"><h2>Log</h2>${items ? `<ol class="log-list">${items}</ol><button class="btn small ghost" data-action="clear-log">Clear log</button>` : '<p class="muted">Rolls and changes appear here.</p>'}</section>`;
  }

  function referenceBlock(ch, d, x) {
    const { esc } = x;
    const t = (head, rows) => `<div class="table-wrap"><table class="ref-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    return `<section class="panel reference no-print" aria-label="Rules reference"><h2>Quick reference</h2>
      <details><summary>Skill DCs (Table 2-2) and ability checks (Table 2-5)</summary>
        ${t(["Difficulty", "DC", "Example", "Skill"], C.DC_EXAMPLES)}
        <p class="hint">A natural 20 is not an automatic success on a skill check, and a natural 1 is not an automatic failure (p.19). With 10+ ranks, beating the DC by 20 is an extraordinary success (p.23).</p>
        ${t(["Task", "Ability"], C.ABILITY_CHECK_EXAMPLES)}</details>
      <details><summary>Attack modifiers (Table 5-4)</summary>${t(["Circumstance", "Melee", "Ranged"], C.ATTACK_MODIFIERS)}<p class="hint">† The defender loses any Dex bonus to AC. Attack rolls: a natural 1 always misses; a natural 20 always hits and threatens a critical (p.66).</p></details>
      <details><summary>Two-weapon fighting (Table 5-1)</summary>${t(["Circumstances", "Primary hand", "Off hand"], C.TWO_WEAPON)}<p class="hint">An unarmed strike always counts as light.</p></details>
      <details><summary>Cover (Table 5-5) and concealment (Table 5-6)</summary>${t(["Cover", "AC bonus", "Reflex bonus"], C.COVER)}${t(["Concealment", "Miss chance", "Example"], C.CONCEALMENT)}</details>
      <details><summary>Shotgun damage by gauge (Table 6-8)</summary>${t(["Gauge", "Buckshot*", "Birdshot*", "Slug", "Crit"], Object.entries(C.SHOTGUN_DAMAGE).map(([g, v]) => [g, v.buckshot, v.birdshot, v.slug, v.critical]))}<p class="hint">* First, second, and further range increments.</p></details>
    </section>`;
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
      ${header(ch, d, x)}${alertsBlock(ch, d, x)}
      <div class="tracker-grid">
        <div class="col vitals-col">${hpBlock(ch, d, x, { id: "t" })}${sanityBlock(ch, d, x, { id: "t" })}</div>
        <div class="col combat-col">${encounterBlock(ch, d, x)}${combatBlock(ch, d, x)}${weaponsBlock(ch, d, x, { cards: true })}${abilitiesBlock(ch, d, x)}</div>
        <div class="col skills-col">${skillsBlock(ch, d, x)}</div>
      </div>
      <div class="tracker-bottom">${diceBlock(ch, d, x)}${magicBlock(ch, d, x)}${featsBlock(ch, d, x)}${gearBlock(ch, d, x)}${notesBlock(ch, d, x)}${logBlock(ch, d, x)}</div>
      ${referenceBlock(ch, d, x)}
    </div>`;
  }

  function sheet(ch, d, x) {
    const { esc, fmt } = x;
    const box = (label, value) => `<div class="box"><span class="box-lbl">${label}</span><span class="box-val">${value}</span></div>`;
    const abilRows = C.ABILITIES.map((a) => {
      const s = d.scores[a];
      return `<tr><th scope="row">${C.ABILITY_NAMES[a].toUpperCase()}</th><td class="num strong"><button class="roll-link" data-action="roll-ability" data-a="${a}" aria-label="Roll ${C.ABILITY_NAMES[a]} check, ${fmt(s.mod)}">${s.permanent}</button></td><td class="num strong">${fmt(C.abilityMod(s.permanent))}</td><td class="num">${s.damage ? s.score : ""}</td><td class="num">${s.damage ? fmt(s.mod) : ""}</td></tr>`;
    }).join("");
    const sv = d.saves;
    const saveRow = (k, abil) => `<tr><th scope="row"><button class="roll-link" data-action="roll-save" data-k="${k}" aria-label="Roll ${SAVE_NAMES[k]} save, ${fmt(sv[k].total)}">${SAVE_NAMES[k].toUpperCase()}</button></th><td class="num strong">${fmt(sv[k].total)}</td><td class="num">${sv[k].base}${sv[k].good ? "*" : ""}</td><td class="num">${fmt(sv[k].ability)} ${abil}</td><td class="num">${sv[k].feat || ""}</td></tr>`;
    const hpTrack = Array.from({ length: Math.min(d.hp.max, 60) }, (_, i) => `<i class="${i < d.hp.current ? "" : "gone"}"></i>`).join("");
    const san = d.sanity;
    return `<div class="design-sheet">
      <div class="sheet-page">
        <div class="sheet-title"><h1 tabindex="-1">${esc(ch.name || "Unnamed investigator")}</h1><span>CALL OF CTHULHU d20 · CHARACTER RECORD</span></div>
        <div class="sheet-ident">
          ${box("Player", esc(ch.player || "—"))}${box("Profession", esc(ch.profession))}${box("Level", ch.level)}${box("Era", esc((C.ERAS[ch.era] || {}).label || ""))}
          ${box("Age", esc(ch.age))}${box("Gender / Ht / Wt", esc([ch.gender || "—", ch.height, ch.weight].filter(Boolean).join(" · ")))}${box("Option", ch.attackOption === "offense" ? "Offense" : "Defense")}${box("Speed", "30 ft")}
        </div>
        <div class="no-print sheet-tools">${xpBox(ch, d, x)}${undoButton(x)}${ch.level < 20 ? `<button class="btn small" data-action="level-up">Level up</button>` : ""}</div>
        ${recentBlock(ch, x)}${alertsBlock(ch, d, x)}
        <div class="sheet-cols">
          <div class="sheet-left">
            <table class="sheet-table"><caption>Abilities</caption><thead><tr><th></th><th>Score</th><th>Mod</th><th>Temp</th><th>Temp mod</th></tr></thead><tbody>${abilRows}</tbody></table>
            <table class="sheet-table"><caption>Saving throws</caption><thead><tr><th></th><th>Total</th><th>Base</th><th>Ability</th><th>Feat</th></tr></thead><tbody>${saveRow("fort", "Con")}${saveRow("ref", "Dex")}${saveRow("will", "Wis")}</tbody></table>
            <p class="hint">* good save</p>
            <div class="sheet-boxes">
              ${box("Armor class", `${d.combat.ac}<small> touch ${d.combat.touch} · flat ${d.combat.flatFooted}</small>`)}
              ${box("Initiative", `<button class="roll-link" data-action="roll-init" aria-label="Roll initiative, ${fmt(d.combat.init)}">${fmt(d.combat.init)}</button>`)}
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
        ${ch.spells.length || ch.tomes.length ? magicBlock(ch, d, x) : ""}
        ${gearBlock(ch, d, x)}
        ${notesBlock(ch, d, x)}
        <div class="no-print sheet-vitals">${hpBlock(ch, d, x, { id: "s" })}${sanityBlock(ch, d, x, { id: "s" })}${encounterBlock(ch, d, x)}${diceBlock(ch, d, x)}</div>
        ${referenceBlock(ch, d, x)}
      </div>
    </div>`;
  }

  function pocket(ch, d, x) {
    const tab = x.state.pocketTab || "vitals";
    const tabs = [["vitals", "Vitals"], ["skills", "Skills"], ["combat", "Combat"], ["gear", "Gear"], ["magic", "Magic"], ["notes", "Notes"]];
    const body = {
      vitals: hpBlock(ch, d, x, { id: "p", compact: false }) + sanityBlock(ch, d, x, { id: "p", compact: false }) + abilitiesBlock(ch, d, x),
      skills: skillsBlock(ch, d, x),
      combat: encounterBlock(ch, d, x) + combatBlock(ch, d, x) + weaponsBlock(ch, d, x, { cards: true }) + diceBlock(ch, d, x),
      gear: gearBlock(ch, d, x) + featsBlock(ch, d, x),
      magic: magicBlock(ch, d, x),
      notes: notesBlock(ch, d, x) + logBlock(ch, d, x) + referenceBlock(ch, d, x),
    }[tab];
    return `<div class="design-pocket">
      <div class="pocket-top">
        <div class="pocket-name"><strong tabindex="-1" class="route-focus">${x.esc(ch.name || "Investigator")}</strong> <span class="muted">L${ch.level} ${x.esc(ch.profession)}</span></div>
        <div class="pocket-vitals">
          <button class="pv hp state-${d.hp.state.key}" data-action="pocket-tab" data-k="vitals"><span>HP</span><strong>${d.hp.current}</strong><small>/${d.hp.max}</small></button>
          <button class="pv san state-${d.sanity.state.key}" data-action="pocket-tab" data-k="vitals"><span>SAN</span><strong>${d.sanity.current}</strong><small>/${d.sanity.max}</small></button>
          <div class="pv"><span>AC</span><strong>${d.combat.ac}</strong></div>
          ${ch.encounter ? `<button class="pv enc" data-action="pocket-tab" data-k="combat"><span>ROUND</span><strong>${ch.encounter.round}</strong></button>` : `<button class="pv" data-action="roll-init"><span>INIT</span><strong>${x.fmt(d.combat.init)}</strong></button>`}
        </div>
      </div>
      ${recentBlock(ch, x)}${alertsBlock(ch, d, x)}
      <div class="pocket-body">${body}</div>
      <div class="pocket-actions">${xpBox(ch, d, x)}${undoButton(x)}${ch.level < 20 ? `<button class="btn small ghost" data-action="level-up">Level up</button>` : ""}</div>
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
    if (el.dataset.n) return parseInt(el.dataset.n, 10) || 0;   // −1 / −5 quick buttons
    const panel = el.closest(".panel") || document;
    const input = panel.querySelector("input.amt");
    const v = input ? parseInt(input.value, 10) : NaN;
    return Number.isFinite(v) && v > 0 ? v : 0;
  }
  /** Add a rule alert to the character (newest first, at most 6 kept). */
  function addAlert(c, kind, title, text, action = "") {
    c.alerts = [{ kind, title, text, action }, ...(c.alerts || [])].slice(0, 6);
  }
  /** Remove the alert holding a given roll button once it has been used. */
  function dropAlert(c, action) { c.alerts = (c.alerts || []).filter((x) => x.action !== action); }
  /** A weapon row by index; "u" is the always-present unarmed strike. */
  function weaponAt(d, el) { return el.dataset.i === "u" ? d.unarmed : d.weapons[+el.dataset.i]; }

  /**
   * Apply a Sanity loss and raise the rule alerts it triggers (p.47-50).
   * opts.before / opts.after change the character in the same step (one Undo).
   */
  function applyLoss(ch, d, n, reason, api, opts = {}) {
    let start = ch;
    if (opts.before) { start = C.clone(ch); opts.before(start); }
    const res = C.loseSanity(start, n, reason);
    const s = C.sanity(res.character);
    api.update(() => {
      const c = res.character;
      if (opts.after) opts.after(c);
      for (const t of res.triggers) {
        if (t === "temporary") addAlert(c, "warn", `Lost ${n} in one roll (≥ ½ Wis = ${d.sanity.tempThreshold}).`, "The GM calls for a Sanity check: on a failure the investigator goes temporarily insane.", "roll-temp-insanity");
        if (t === "indefinite") addAlert(c, "danger", `Lost ${s.hourLoss} Sanity this hour (≥ 20% = ${s.indefiniteThreshold}).`, "The investigator goes indefinitely insane when the GM judges it.", "roll-indef-insanity");
        if (t === "zero") addAlert(c, "danger", `Sanity at ${s.current}.`, "The character loses 1 more Sanity each round until −10 unless stabilized with Psychoanalysis.");
        if (t === "permanent") addAlert(c, "danger", "Sanity −10 or lower: permanent insanity.", "The character becomes an NPC.");
      }
      if (n || !opts.before) api.pushLog(c, `Lost ${n} Sanity (${d.sanity.current} → ${s.current})${reason ? " — " + reason : ""}`);
      if (res.triggers.includes("permanent")) c.sanity.insanity = "permanent";
      return c;
    }, { undo: opts.undo || `Lost ${n} Sanity` });
  }

  /** Roll a damage expression `times` times (a confirmed critical multiplies the roll, p.66). */
  function rollWeaponDamage(w, times, api) {
    let total = 0; const parts = [];
    for (let k = 0; k < times; k++) {
      const r = api.rollDice(w.damage);
      if (!r) return null;
      const one = Math.max(1, r.total + w.damageBonus);
      total += one;
      parts.push(`${r.rolls.join("+")}${r.bonus ? " " + C.fmt(r.bonus) : ""}${w.damageBonus ? " " + C.fmt(w.damageBonus) : ""}`);
    }
    return { total, detail: parts.map((p) => `(${p})`).join(" + ") };
  }

  function handleAction(a, el, api) {
    const ch = api.state.ch;
    if (!ch) return;
    const d = C.derive(ch);
    const i = el.dataset.i !== undefined ? +el.dataset.i : null;
    switch (a) {
      case "enc-start": {
        const r = C.rollDie(20);
        const init = r + d.combat.init;
        api.toast(`<strong>Initiative</strong><br><span class="roll-big">${init}</span> <span class="muted">(d20 ${r} ${C.fmt(d.combat.init)})</span><br>Round 1 — flat-footed until your first turn.`);
        api.update((c) => {
          c.encounter = { round: 1, init };
          if (!c.conditions.includes("flatFooted")) c.conditions.push("flatFooted");
          api.pushLog(c, `Combat started: initiative ${init} (d20 ${r} ${C.fmt(d.combat.init)})`);
        }, { undo: "Start combat" });
        break;
      }
      case "enc-next": {
        const round = (ch.encounter ? ch.encounter.round : 0) + 1;
        api.update((c) => {
          c.encounter = Object.assign({}, c.encounter, { round });
          c.conditions = c.conditions.filter((k) => k !== "flatFooted");
          api.pushLog(c, `Round ${round}`);
        }, { undo: "Next round" });
        if (d.hp.state.key === "dying" && !ch.hp.stable) api.toast(`<strong>Round ${round}</strong><br>Dying: make the 10% roll on the Hit Points panel (p.69).`, 6000);
        else if (d.sanity.current <= 0 && d.sanity.current > -10) api.toast(`<strong>Round ${round}</strong><br>Sanity ${d.sanity.current}: lose 1 more Sanity this round unless stabilized (p.47).`, 6000);
        break;
      }
      case "enc-end": api.update((c) => {
        api.pushLog(c, `Combat ended after ${c.encounter ? c.encounter.round : 0} round(s)`);
        c.encounter = null;
        c.conditions = c.conditions.filter((k) => k !== "flatFooted");
      }, { undo: "End combat" }); break;
      case "cond-toggle": {
        const k = el.dataset.k;
        const def = C.CONDITION_BY_KEY[k];
        if (!def) break;
        const has = ch.conditions.includes(k);
        api.update((c) => {
          c.conditions = has ? c.conditions.filter((x) => x !== k) : c.conditions.concat(k);
          api.pushLog(c, `${has ? "No longer" : "Now"} ${def.name.toLowerCase()}`);
        }, { undo: `${def.name} ${has ? "off" : "on"}` });
        break;
      }
      case "dice-roll": case "dice-quick": {
        const input = document.getElementById("diceExpr");
        const expr = a === "dice-quick" ? (el.dataset.v === "d%" ? "d%" : "1" + el.dataset.v) : (input ? input.value : "");
        if (a === "dice-roll") api.state.diceExpr = expr;
        const r = C.rollDiceExpr(expr);
        if (!r) { api.toast("Type dice like 3d6+2, 1d20+1d4 or d%."); break; }
        api.toast(`<strong>${api.esc(expr)}</strong><br><span class="roll-big">${r.total}</span> <span class="muted">${api.esc(r.detail)}</span>`);
        api.update((c) => api.pushLog(c, `Rolled ${expr}: ${r.total} (${r.detail})`), { logOnly: true });
        break;
      }
      case "spell-cast": {
        const sp = ch.spells[i];
        if (!sp) break;
        const cost = C.parseSpellCost(sp.cost);
        const costText = [cost.abilities.map((c) => `${c.amount} ${c.ability} ${c.permanent ? "drain (permanent)" : "damage"}`).join(", "), cost.sanity && `${cost.sanity} Sanity`].filter(Boolean).join(" and ");
        api.confirmDialog(`<h2>Cast ${api.esc(sp.name)}?</h2><p>Cost: <strong>${api.esc(costText || sp.cost || "none listed")}</strong>. It is paid when the casting completes (p.128).</p>${cost.abilities.length || cost.sanity ? "" : '<p class="warn">The cost line couldn\'t be read; apply it by hand.</p>'}${ch.options.unmasteredMagic ? "<p>Unmastered Magic: an Int check (DC 15) is rolled first (p.151).</p>" : ""}`, "Cast").then((ok) => {
          if (!ok) return;
          const cur = api.state.ch;
          const dd = C.derive(cur);
          let mishap = "";
          if (cur.options.unmasteredMagic) {
            const r = C.rollDie(20), total = r + dd.scores.Int.mod;
            if (total < 15) {
              const p = C.rollDie(100);
              mishap = p <= 60 ? "works normally" : p <= 70 ? "has no effect, but the cost is paid" : p <= 95 ? "goes astray: random target, area or effect" : "goes astray, and a random character within 100 ft also pays the cost";
              mishap = `Int check ${total} (d20 ${r}) failed — d% ${p}: the spell ${mishap}.`;
            } else mishap = `Int check ${total} (d20 ${r}) succeeded.`;
          }
          const paid = cost.abilities.map((c) => { const r = C.rollDiceExpr(c.amount); return Object.assign({}, c, { n: r ? Math.max(0, r.total) : 0 }); });
          const san = cost.sanity ? C.rollDiceExpr(cost.sanity) : null;
          const n = san ? Math.max(0, san.total) : 0;
          const paidText = [paid.map((c) => `${c.n} ${c.ability}${c.permanent ? " drain" : ""}`).join(", "), cost.sanity && `${n} Sanity`].filter(Boolean).join(", ");
          api.toast(`<strong>Cast ${api.esc(sp.name)}</strong><br>Paid: ${api.esc(paidText || "nothing")}${mishap ? `<br>${api.esc(mishap)}` : ""}`, 8000);
          applyLoss(cur, dd, n, `cast ${sp.name}`, api, {
            undo: `Cast ${sp.name}`,
            before: (c) => {
              for (const p of paid) { const key = p.permanent ? "abilityDrain" : "abilityDamage"; c[key][p.ability] = C.toInt(c[key][p.ability]) + p.n; }
              c.spells[i].casts = C.toInt(c.spells[i].casts) + 1;
              api.pushLog(c, `Cast ${sp.name}: ${paidText || "no cost"}${mishap ? " — " + mishap : ""}`);
            },
          });
        });
        break;
      }
      case "tome-open": {
        const t = ch.tomes[i];
        const r = C.rollDiceExpr(t.sanityInitial || "0");
        const n = r ? Math.max(0, r.total) : 0;
        api.toast(`<strong>${api.esc(t.name)}: initial contact</strong><br>Lose <span class="roll-big">${n}</span> Sanity${r && r.terms.some((x) => x.rolls.length) ? ` <span class="muted">(${api.esc(r.detail)})</span>` : ""}. Examination begins: ${api.esc(t.exam || "see the tome")} per period.`, 7000);
        applyLoss(ch, d, n, `opened ${t.name}`, api, { undo: `Open ${t.name}`, before: (c) => { c.tomes[i].initialDone = true; c.tomes[i].status = "examining"; } });
        break;
      }
      case "tome-study": {
        const t = ch.tomes[i];
        const bonus = C.tomeStudyBonus(ch, t);
        const r = C.rollDie(20), total = r + bonus;
        if (total >= t.dc) {
          const loss = C.rollDiceExpr(t.sanityComplete || "0");
          const n = loss ? Math.max(0, loss.total) : 0;
          api.toast(`<strong>${api.esc(t.name)}: study check ${total}</strong> <span class="muted">(d20 ${r} ${C.fmt(bonus)} vs DC ${t.dc})</span><br>Read! Lose ${n} Sanity; Cthulhu Mythos +${t.mythos}. Its spells can now be learned (1d3 weeks each, p.129).`, 9000);
          applyLoss(ch, d, n, `finished ${t.name}`, api, {
            undo: `Finish ${t.name}`,
            before: (c) => { c.tomes[i].status = "read"; c.tomes[i].studyChecks += 1; },
            after: (c) => { c.mythos = C.toInt(c.mythos) + t.mythos; api.pushLog(c, `Finished ${t.name} (check ${total} vs DC ${t.dc}): Cthulhu Mythos +${t.mythos} → ${c.mythos}`); },
          });
        } else {
          api.toast(`<strong>${api.esc(t.name)}: study check ${total}</strong> <span class="muted">(d20 ${r} ${C.fmt(bonus)} vs DC ${t.dc})</span><br>Not yet. A Strange Event occurs (GM: Table 7-1, p.120), and another Examination Period begins with +1 to the next check.`, 9000);
          api.update((c) => { c.tomes[i].studyChecks += 1; api.pushLog(c, `${t.name}: study check ${total} vs DC ${t.dc} — failed (Strange Event)`); }, { undo: `Study ${t.name}` });
        }
        break;
      }
      case "tome-consult": {
        const t = ch.tomes[i];
        const row = d.skills.find((sk) => sk.id === "Cthulhu Mythos");
        api.rollD20((row ? row.total : C.toInt(ch.mythos)) + t.mythos, `Cthulhu Mythos (consulting ${t.name}, 1d4 hours)`);
        break;
      }
      case "weapon-equip": {
        const w = ch.weapons[i];
        api.update((c) => { c.weapons[i].equipped = !w.equipped; api.pushLog(c, `${w.equipped ? "Put away" : "Equipped"} ${w.name}`); }, { undo: `${w.equipped ? "Put away" : "Equip"} ${w.name}` });
        break;
      }
      case "gear-add": {
        const input = document.getElementById("gearNew");
        const name = input ? input.value.trim() : "";
        if (!name) { api.toast("Type the item's name first."); break; }
        api.update((c) => { c.equipment.push({ id: C.uid(), name, qty: 1, weight: 0, notes: "" }); api.pushLog(c, `Added ${name}`); }, { undo: `Add ${name}` });
        const again = document.getElementById("gearNew");
        if (again) { again.value = ""; again.focus(); }
        break;
      }
      case "gear-qty": api.update((c) => {
        const e = c.equipment[i];
        e.qty = Math.max(1, C.toInt(e.qty, 1) + C.toInt(el.dataset.v));
        api.pushLog(c, `${e.name}: ×${e.qty}`);
      }, { undo: `${ch.equipment[i].name} quantity` }); break;
      case "gear-remove": {
        const name = ch.equipment[i].name || "item";
        api.update((c) => { c.equipment.splice(i, 1); api.pushLog(c, `Removed ${name}`); }, { undo: `Remove ${name}` });
        api.toast(`Removed ${api.esc(name)}. Use Undo to bring it back.`);
        break;
      }
      case "cash-spend": case "cash-receive": {
        const input = document.getElementById("cashAmt");
        const n = input ? Math.round(parseFloat(input.value) * 100) / 100 : NaN;
        if (!(n > 0)) { api.toast("Enter an amount first."); break; }
        const before = cashOnHand(ch, d) || 0;
        const after = Math.round((before + (a === "cash-spend" ? -n : n)) * 100) / 100;
        const label = `${a === "cash-spend" ? "Spent" : "Received"} $${n.toFixed(2)}`;
        api.update((c) => { c.money.cash = after; api.pushLog(c, `${label} ($${before.toFixed(2)} → $${after.toFixed(2)})`); }, { undo: label });
        if (after < 0) api.toast(`Cash is now <strong>−$${Math.abs(after).toFixed(2)}</strong>.`);
        break;
      }
      case "pocket-tab": api.state.pocketTab = el.dataset.k; api.render(); window.scrollTo(0, 0); break;
      case "skill-mode": api.state.skillMode = el.dataset.k; api.render(); break;
      case "alert-dismiss": api.update((c) => { c.alerts.splice(i, 1); }); break;
      case "clear-log": api.update((c) => { c.log = []; }, { undo: "Clear log" }); break;
      case "roll-skill": { const r = d.skills.find((s) => s.id === el.dataset.id); if (r) api.rollD20(r.total, r.id); break; }
      case "roll-save": api.rollD20(d.saves[el.dataset.k].total, SAVE_NAMES[el.dataset.k] + " save"); break;
      case "roll-init": api.rollD20(d.combat.init, "Initiative"); break;
      case "roll-ability": api.rollD20(d.scores[el.dataset.a].mod, C.ABILITY_NAMES[el.dataset.a] + " check"); break;
      case "roll-attack-basic": api.rollD20(el.dataset.k === "melee" ? d.combat.melee + d.combat.acp : d.combat.ranged + d.combat.acp, el.dataset.k === "melee" ? "Melee attack" : "Ranged attack", { attack: true }); break;
      case "roll-attack": {
        const w = weaponAt(d, el);
        if (!w) break;
        const wp = w.weapon;
        if (wp.capacity && !rounds(wp)) { api.toast(`<strong>${api.esc(wp.name)} is empty.</strong> Reload first.`); break; }
        // A firearm attack spends a round (the roll and the spent round are logged together).
        api.rollD20(w.bonus, `${wp.name} attack`, { attack: true, threat: w.threat, spend: wp.capacity ? (c) => { c.weapons[i].ammo = rounds(c.weapons[i]) - 1; } : null });
        break;
      }
      case "fire-full": {
        const w = weaponAt(d, el);
        const f = w && w.fullAttack && w.fullAttack[el.dataset.mode];
        if (!f) break;
        const wp = w.weapon;
        const have = rounds(wp) || 0;
        const shots = Math.min(f.sequence.length, Math.floor(have / f.bulletsPerAttack));
        if (!shots) { api.toast(`<strong>${api.esc(wp.name)}</strong> needs ${f.bulletsPerAttack} round${f.bulletsPerAttack > 1 ? "s" : ""} per attack. Reload first.`); break; }
        const results = f.sequence.slice(0, shots).map((b) => {
          const r = C.rollDie(20);
          const tag = r === 1 ? " miss (nat 1)" : r >= w.threat ? (r === 20 ? " hit, threat (nat 20)" : " threat") : "";
          return { r, total: r + b, b, tag };
        });
        const spent = shots * f.bulletsPerAttack;
        api.toast(`<strong>${api.esc(wp.name)} full attack (${f.mode})</strong><br>${results.map((x) => `<span class="roll-big">${x.total}</span> <span class="muted">(d20 ${x.r} ${C.fmt(x.b)})</span>${x.tag ? ` <span class="nat">${x.tag}</span>` : ""}`).join("<br>")}<br><span class="muted">${spent} round${spent > 1 ? "s" : ""} spent${shots < f.sequence.length ? `; ammo ran out after ${shots} attack${shots > 1 ? "s" : ""}` : ""}</span>`, 8000);
        api.update((c) => {
          c.weapons[i].ammo = have - spent;
          api.pushLog(c, `${wp.name} full attack: ${results.map((x) => x.total + x.tag).join(", ")} (${spent} rds)`);
        }, { undo: `${wp.name} full attack` });
        break;
      }
      case "roll-damage": case "roll-crit": {
        const w = weaponAt(d, el);
        if (!w) break;
        const crit = a === "roll-crit";
        const r = rollWeaponDamage(w, crit ? w.multiplier : 1, api);
        if (!r) { api.toast(`Roll ${api.esc(w.weapon.damage)} by hand.`); break; }
        api.toast(`<strong>${api.esc(w.weapon.name)} ${crit ? `critical damage (×${w.multiplier})` : "damage"}</strong><br><span class="roll-big">${r.total}</span> <span class="muted">${r.detail}</span>`);
        api.update((c) => api.pushLog(c, `${w.weapon.name} ${crit ? "critical " : ""}damage: ${r.total}`), { logOnly: true });
        break;
      }
      case "ammo": api.update((c) => {
        const w = c.weapons[i];
        w.ammo = el.dataset.v === "reload" ? w.capacity : Math.max(0, rounds(w) - 1);
        if (el.dataset.v === "reload") api.pushLog(c, `Reloaded ${w.name} (${w.capacity} rds)`);
      }, { undo: el.dataset.v === "reload" ? "Reload" : "Spend round" }); break;
      case "abil-dmg": api.update((c) => {
        const ab = el.dataset.a;
        c.abilityDamage[ab] = Math.max(0, C.toInt(c.abilityDamage[ab]) + C.toInt(el.dataset.v));
      }, { undo: `${el.dataset.a} damage` }); break;
      case "hp-damage": case "hp-heal": case "hp-subdual": {
        const n = amount(el);
        if (!n) { api.toast("Enter an amount first."); break; }
        const label = a === "hp-damage" ? `Took ${n} damage` : a === "hp-heal" ? `Healed ${n}` : `Took ${n} subdual`;
        api.update((c) => {
          const before = d.hp.current;
          if (a === "hp-damage") { c.hp.current = before - n; c.hp.stable = false; }
          else if (a === "hp-heal") { c.hp.current = Math.min(d.hp.max, before + n); c.hp.subdual = Math.max(0, C.toInt(c.hp.subdual) - n); if (before < 0) c.hp.stable = true; }
          else c.hp.subdual = C.toInt(c.hp.subdual) + n;
          api.pushLog(c, a === "hp-subdual" ? label : `${label} (${before} → ${c.hp.current})`);
          const st = C.hpState(c.hp.current);
          if (a === "hp-damage" && st.key !== "ok" && st.key !== C.hpState(before).key) addAlert(c, st.key === "dead" ? "danger" : "warn", `${st.label}.`, st.note);
        }, { undo: label });
        const box = (el.closest(".panel") || document).querySelector("input.amt");
        if (box && !el.dataset.n) box.value = "";
        break;
      }
      case "hp-stabilize": {
        const r = C.rollDie(10);
        api.update((c) => {
          if (r === 1) { c.hp.stable = true; api.pushLog(c, "10% roll: 1 — stabilized"); }
          else { c.hp.current = d.hp.current - 1; api.pushLog(c, `10% roll: ${r} — lost 1 HP (${d.hp.current} → ${c.hp.current})`); }
          if (C.hpState(c.hp.current).key === "dead") addAlert(c, "danger", "Dead.", "Hit points reached −10.");
        }, { undo: "10% roll" });
        api.toast(r === 1 ? "<strong>10% roll: 1</strong><br>Stabilized." : `<strong>10% roll: ${r}</strong><br>Lost 1 HP.`);
        break;
      }
      case "hp-stable": api.update((c) => { c.hp.stable = true; api.pushLog(c, "Stabilized"); }, { undo: "Stabilized" }); break;
      case "hp-rest": api.update((c) => {
        const gain = C.toInt(c.level, 1);
        c.hp.current = Math.min(d.hp.max, d.hp.current + gain);
        c.hp.subdual = 0;
        // Ability damage returns 1 point per day of rest for each damaged ability (p.74); drain does not.
        const healed = C.ABILITIES.filter((ab) => c.abilityDamage[ab] > 0);
        healed.forEach((ab) => { c.abilityDamage[ab] -= 1; });
        api.pushLog(c, `Rested a day: +${c.hp.current - d.hp.current} HP${healed.length ? `, +1 ${healed.join(", ")}` : ""}`);
      }, { undo: "Rest a day" }); break;
      case "san-roll": {
        const input = (el.closest(".panel") || document).querySelector("input.sanroll");
        const notation = input ? input.value : "";
        const chk = C.sanityCheck(ch, notation);
        if (!chk) { api.toast("Enter the loss as success/failure, e.g. 0/1d6 or 1/1d4+1."); break; }
        api.toast(`<strong>Sanity check ${api.esc(notation)}</strong><br><span class="roll-big">${chk.roll}</span> vs ${chk.current} — <strong>${chk.success ? "success" : "failure"}</strong>: lose ${chk.amount}${chk.dice.length ? ` (${api.esc(chk.expr)}: ${chk.dice.join("+")}${chk.bonus ? " " + C.fmt(chk.bonus) : ""})` : ""}`, 7000);
        applyLoss(ch, d, chk.amount, `Sanity check ${notation}: d% ${chk.roll} vs ${chk.current}, ${chk.success ? "success" : "failure"}`, api);
        break;
      }
      case "roll-temp-insanity": {
        const r = C.rollTemporaryInsanity();
        api.update((c) => {
          dropAlert(c, "roll-temp-insanity");
          addAlert(c, "warn", `${r.kind}: ${r.length}`, `(Table 4-1 d10 ${r.d10}; ${r.duration}.) ${r.effect} (${r.kind.startsWith("Short") ? "Table 4-2" : "Table 4-3"} d% ${r.roll}${r.rerolled ? `, then Table 4-3 d% ${r.rerolled}` : ""})`);
          c.sanity.insanity = "temporary";
          api.pushLog(c, `Temporary insanity: ${r.length} — ${r.effect}`);
        }, { undo: "Temporary insanity roll" });
        break;
      }
      case "roll-indef-insanity": {
        const r = C.rollIndefiniteInsanity();
        api.update((c) => {
          dropAlert(c, "roll-indef-insanity");
          addAlert(c, "danger", `Indefinite insanity: ${r.months} game month${r.months > 1 ? "s" : ""}`, `(1d6.) ${r.disorder} (Table 4-4 d% ${r.roll}; the GM may choose instead)`);
          c.sanity.insanity = "indefinite";
          api.pushLog(c, `Indefinite insanity (${r.months} months): ${r.disorder}`);
        }, { undo: "Indefinite insanity roll" });
        break;
      }
      case "san-lose": {
        const n = amount(el);
        if (!n) { api.toast("Enter an amount first."); break; }
        applyLoss(ch, d, n, "", api);
        break;
      }
      case "san-gain": case "san-therapy": {
        const n = amount(el);
        if (!n) { api.toast("Enter an amount first."); break; }
        api.update(() => { const c = C.gainSanity(ch, n, a === "san-therapy" ? "therapy" : "other"); api.pushLog(c, `${a === "san-therapy" ? "Therapy" : "Gained"}: Sanity ${d.sanity.current} → ${C.sanity(c).current}`); return c; }, { undo: `Gained ${n} Sanity` });
        break;
      }
      case "san-check": {
        const r = C.rollDie(100);
        const ok = r <= d.sanity.current;
        api.toast(`<strong>Sanity check</strong><br><span class="roll-big">${r}</span> vs ${d.sanity.current} — <strong class="${ok ? "ok" : "bad"}">${ok ? "success (lose the smaller amount)" : "failure (lose the larger amount)"}</strong>`, 6000);
        api.update((c) => api.pushLog(c, `Sanity check: ${r} vs ${d.sanity.current} — ${ok ? "success" : "failure"}`), { logOnly: true });
        break;
      }
      case "san-hour": api.update(() => { const c = C.newSanityHour(ch); api.pushLog(c, "New game hour (20% tracker reset)"); return c; }, { undo: "New hour" }); api.toast("New game hour — the 20% indefinite-insanity tracker starts again."); break;
      case "san-mythos":
        api.confirmDialog(`<h2>Mythos-related insanity</h2><p>The first time an investigator goes insane from a Mythos encounter they gain 2 ranks of Cthulhu Mythos; each later episode adds 1 (p.50). Maximum Sanity drops to match.</p>`, "Add Mythos ranks").then((ok) => {
          if (ok) api.update(() => { const c = C.mythosInsanity(ch); api.pushLog(c, `Mythos insanity: Cthulhu Mythos now ${c.mythos}`); return c; }, { undo: "Mythos insanity" });
        });
        break;
      default: break;
    }
  }

  function handleChange(a, el, api) {
    if (a === "gear-name") {
      const i = +el.dataset.i;
      const name = el.value.trim();
      if (!name) { api.render(); return; }   // an item needs a name; put the old one back
      api.update((c) => { c.equipment[i].name = name; }, { undo: "Rename item" });
      return;
    }
    if (a === "insanity") api.update((c) => { c.sanity.insanity = el.value; api.pushLog(c, `Insanity state: ${el.value}`); }, { undo: "Insanity state" });
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
      xp: (c) => { c.xp = Math.max(0, parseInt(el.value, 10) || 0); },
    }[key];
    if (apply) api.update(apply, { render: false });
  }

  window.Designs = { list, render, handleAction, handleChange, handleInput, summaryBlock };
})();
