# Character Sheet Review — Findings & Recommendations

_Review date: 2026-10-18 · Scope: `index.html`, `script.js`, `equipment_functions.js`, `style.css`, README, checked against the Call of Cthulhu d20 core rulebook (`docs/`). No code has been changed._

Page references are **printed** page numbers (PDF page = printed + 2). The verified rule tables used to check them are in `docs/rulebook/` (see `EXTRACTION_REVIEW.md` there for verified tables).

Severity: **S1** = the sheet shows a wrong number or loses data in normal use · **S2** = a rules error a GM would notice, or a broken feature · **S3** = minor, cosmetic, or cleanup.

---

## 1. Summary

The sheet is usable for a quick game, but several numbers players would read off it are wrong at the table:

- **Gameplay mode always shows Base Attack, Fort, Ref and Will as +0**, and the header shows HP as `x/0`, because it reads elements that don't exist.
- **Offense-option base attack is too high** (the sheet uses full level; the rulebook table is roughly ¾ level + 1).
- **Saved current Sanity is reset to Wis×5 every time a character is opened** from the selection screen.
- **Starting money is re-rolled on every save, load and recalculation.** It is never stored.
- **Weapon attack bonus becomes +61, +72 and so on once BAB has an iterative attack** (`"+6/+1"` is parsed as `61`).
- **Many data tables don't match the book:** 11 of 17 profession money modifiers, the synergy table, 8 trained-only flags, the aging thresholds, 3 feat bonuses, and 2 missing skills (Disable Device, Speak Other Language).
- **There is no print layout.** For "character sheets for a one-shot", this is the biggest gap.

---

## 2. Calculation defects (checked against the rulebook)

| # | Sev | Area | Current behaviour | Rulebook | Where |
|---|---|---|---|---|---|
| C1 | S1 | Base attack, Offense | `primary = level` (L1 +1, L4 +4, L20 +20) | Table 1-9 (p.10): 1,2,3,3,4,5,6,6,7,8,9,9,10,11,12,12,13,14,15,15 = `level − floor(level/4)` | `script.js:1704` |
| C2 | S2 | Base attack, Defense L1 | BAB 0 gives an empty string (blank on sheet) | Should show `+0` | `script.js:1710` |
| C3 | S1 | Weapon attack parse | `parseInt("+6/+1".replace(/[^0-9-]/g,""))` = **61** | BAB +6 → +6 | `equipment_functions.js:75`, `script.js:3060` |
| C4 | S2 | Good-save selection | Only extra boxes are unticked; picking **fewer** good saves than allowed is silently accepted (a Defense character can end up with 0 good saves) | Offense: exactly 1 good save; Defense: exactly 2 (Tables 1-8/1-9) | `script.js:1669-1680` |
| C5 | S2 | Aging | Categories labelled 15-34 / 35-52 / 53-69 / 70+ (D&D human ages). The age field isn't linked to the category. README says "+1 to physical checks". | Middle age **50**, Old **65**, Venerable **80** (Table 1-11, p.13). The cumulative modifiers (−1/+1, −3/+2, −6/+3) are right. | `index.html:283-288`, README |
| C6 | S2 | Aging applied to modifier only | Age adjustment changes the modifier but not the displayed score; it can push a score below 1 | Aging changes the **score**, minimum 1 | `script.js:1601-1617` |
| C7 | S2 | Starting Sanity | Uses raw Wis, ignoring age. Not capped by max (Wis 20 gives 100 against a max of 99). | Starting = 5×Wis; current Sanity can never exceed 99 − Mythos (p.47-51) | `script.js:1797-1808` |
| C8 | S1 | Starting money | `updateMoney()` rolls a new 1d6 on every `updateAll()` (save, load, profession change). Never saved. | Roll once: (1d6 + profession mod, min 1) × era amount (p.15) | `script.js:1722-1733`, `2365` |
| C9 | S1 | Profession money mods | 11 of 17 wrong | Table 1-13 (p.15): Artist **−2**, Blue-collar **−1**, Dilettante **+1**, Doctor **+2**, Parapsychologist **−2**, Priest **−1**, Professor **0**, Soldier **−2**, Technician **+2**, White-collar **+1**, Writer **−1** | `script.js:297-594` |
| C10 | S3 | Yearly income | Not shown | Table 1-14 gives yearly income per era alongside savings | — |
| C11 | S2 | HP (recommended) | `6 + Con + floor((L−1)×3.5) + Con×(L−1)`. Uses one shared minimum of 1. | Each level after 1st: 1d6 + Con, **minimum 1 per level** (p.11). Matters for Con-penalty characters. | `script.js:1741-1759` |
| C12 | S2 | Toughness | +3 only appears in "Recommended"; a typed Max HP never includes it. The note always says "from Toughness". | Toughness +3 HP, stackable | `script.js:1643-1645` |
| C13 | S1 | Skill list | **Disable Device** and **Speak Other Language** are missing. Profession core skills that use them never highlight, and Cautious's Disable Device bonus is lost. | Table 2-1 (p.18) | `script.js:27-295` |
| C14 | S2 | Trained-only flags | Animal Empathy, Craft, Handle Animal, Operate Heavy Machinery, Performance, Pilot, Repair are marked usable untrained; Forgery is marked trained-only | Table 2-1: the first seven are **No** (trained only); Forgery is **Yes** | `script.js:27-295` |
| C15 | S2 | Repair key ability | Dex | **Int** (Table 2-1; Blue-collar/Technician templates) | `script.js:~222` |
| C16 | S1 | Specialised skills | A single "Knowledge" row and a single "Craft" row. Antiquarian's 4 Knowledge core skills collapse into one row, so most of that profession's points have nowhere to go. Same for Perform, Speak Other Language, Craft. | Each specialty is a separate skill (p.16, William example) | `script.js:1078-1087`, data |
| C17 | S2 | Cthulhu Mythos at creation | Can be bought with skill points (2 pts/rank, noncore cap) | **Cannot** be bought at creation; never core; no max rank; gained only in play (p.11, p.18, p.27) | skill validation `script.js:1186-1246` |
| C18 | S2 | Synergy table | Balance→Jump/Tumble, Bluff→Diplomacy, Climb→Use Rope, Craft→Appraise, Jump→Tumble, Knowledge→Research, Use Rope→Climb/Escape Artist (D&D values) | Table 2-4 (p.22): Animal Empathy→Handle Animal; Bluff→Intimidate, Sleight of Hand; Handle Animal→Ride; Knowledge (medicine)→Heal; Knowledge (psychology)→Psychoanalysis; Sense Motive→Diplomacy; Tumble→Balance, Jump | `script.js:1098-1109`; skill descriptions repeat the wrong synergies |
| C19 | S3 | Noncore half ranks | Noncore ranks are whole numbers at 2 pts each, so an odd leftover point can't be spent | 1 pt = ½ rank; half ranks give no bonus (p.10, p.18). Acceptable simplification; the tracker should allow 0.5 steps. | `script.js:2478-2507` |
| C20 | S3 | Skill points at higher levels | `(8+Int)×(L+3)` uses the **current** Int for every level | Int increases aren't retroactive (p.9). Fine for a one-shot; note only. | `script.js:2461-2470` |
| C21 | S3 | Feat count | `2 + floor(L/3)` is correct. Going over the limit is only shown in red, not blocked. _(Correction: the Offense bonus Weapon Proficiency is part of the optional Defense Bonus variant on p.15, not the core rules.)_ | p.11, p.15 | `script.js:2515-2545` |
| C22 | S2 | Sanity gain on level-up | Rolls 1d6 on every `input` keystroke (typing "12" fires 1→12 with an alert). In creation mode the gain is then overwritten by C24. `previousLevel` isn't reset on load. | +1d6 current Sanity per level gained, up to max (p.50-51) | `script.js:1429-1442`, `1836-1850` |
| C23 | S2 | "20% threshold" concept | Shows a fixed 20% of **max** Sanity as a danger line | Indefinite insanity comes from losing **20% of current Sanity within 1 hour**. Temporary insanity is a Sanity check after losing ≥ ½ Wis in one roll. (p.47-48) | `script.js:1808`, `2849`, `3041`, `3466` |
| C24 | S1 | Sanity overwritten | In creation mode `updateSanity()` forces current = starting on every recalculation. `loadAndShowCharacter()` loads while still in creation mode, so **saved current Sanity is lost on open**. | — | `script.js:1817-1829`, `3865-3877` |
| C25 | S2 | Sanity/HP floors | Damage and Sanity loss are clamped at 0, so the dying (−1…−9), dead (−10) and Sanity slide to −10 states can't be represented. The −10 permanent-insanity check can never be reached from the buttons. | HP 0 disabled, −1…−9 dying, −10 dead (Ch.5 "Death, Dying"); Sanity at 0 slides 1/round to −10 = permanent (p.47) | `script.js:2899`, `2934`, `2826` |
| C26 | S2 | Initiative | Dex only; **Improved Initiative (+4) is never applied** | | `equipment_functions.js:342`, `script.js:3508` |
| C27 | S2 | Encumbrance | Thresholds Str×3/×6/×10 and an invented "max = Str×15". Speed isn't reduced at medium/heavy load. The load's max Dex and check penalty aren't applied to AC or skills. | d20 carrying-capacity table (non-linear; Str 10 = 33/66/100); medium/heavy load reduces speed 30→20 | `equipment_functions.js:374-452` |
| C28 | S2 | Armor check penalty | Recorded but never applied to skills (Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Swim ×2, Tumble) | Table 2-1 † markers | `script.js:24-25` comment |
| C29 | S3 | Armor/shield presets | Values invented (e.g. "Riot Gear +5") | Use the rulebook's armor table (see extraction review) | `equipment_functions.js:12-24` |
| C30 | S3 | Melee damage | Str bonus not shown on damage | d20: add Str to melee damage | `equipment_functions.js:100-103` |

### Feat findings (from the feat audit)

| # | Sev | Finding | Where |
|---|---|---|---|
| F1 | S2 | **Nimble** gives Balance/Escape Artist; the book says Escape Artist and **Sleight of Hand** (p.41) | `script.js:775` |
| F2 | S2 | **Sharp-Eyed** gives Spot/Search; the book says Search and **Sense Motive** (p.41) | `script.js:881` |
| F3 | S2 | **Track** adds +2 Wilderness Lore; it should add no bonus (p.42) | `script.js:916` |
| F4 | S2 | **Skill Emphasis** (+3 to a chosen skill) has no way to choose a skill, so it does nothing | `script.js:~890` |
| F5 | S2 | **Weapon Proficiency** and **Weapon Focus** are missing (p.43). Offense characters need the bonus Weapon Proficiency. | data |
| F6 | S2 | Prerequisites are never shown or enforced (e.g. psychic feats without Sensitive / Cha 15) | `script.js:1378-1398` |
| F7 | S3 | Prerequisite text wrong for Improved Critical, Multishot, Shot on the Run, Rolling Shot, Weapon Finesse | data |
| F8 | S3 | Several descriptions copied from D&D (Mobility, Expertise, Multishot, Rolling Shot, Quick Draw, Run, Weapon Finesse, Blind-Fight); Mind Reading cost should be 1d3 | data |
| F9 | S3 | Stackable feats (Toughness, Wealth, Skill Emphasis…) can only be taken once | `script.js:1378` |
| F10 | S2 | Saved feats are stored as **array indices**, so adding or reordering feats remaps every saved character. Store names. | `script.js:2033`, `2111`, `2193` |
| F11 | S3 | Feat summary hard-codes "+2" for every skill bonus | `script.js:2681` |

---

## 3. Functional / code defects

| # | Sev | Defect | Where |
|---|---|---|---|
| D1 | S1 | Gameplay **BAB, Fort, Ref, Will always "+0"**: reads `baseAttackDisplay`, `fortSaveDisplay`, `refSaveDisplay`, `willSaveDisplay`, which don't exist (real ids: `baseAttack`, `fortSave`, `refSave`, `willSave`) | `script.js:3520-3536`, `3052-3083` |
| D2 | S1 | Header quick-info HP shows `current/0`: reads `totalHP`, which doesn't exist (should be `hitPoints`) | `script.js:3331` |
| D3 | S1 | Load order: `renderWeapons/updateArmorClass/updateInitiative` run **before** `updateAll()`, so AC, initiative and weapon attacks use the **previous** character's modifiers and BAB | `script.js:2217-2224` |
| D4 | S1 | "Create New Character" leaks state from the last character. `clearAllEquipment()` doesn't exist, so weapons, armor and items carry over. Skill misc, custom core-skill ticks, good saves, Max HP, money, notes and insanity state aren't cleared. Abilities are set to blank, which reads as 0 (mod −5). | `script.js:3893-3931` |
| D5 | S2 | `initializeModeToggle()` is never called, so **skill search and the "Show Profession Skills" filter do nothing** (`initializeSkillsFiltering` is never wired) | `script.js:2706-2718` |
| D6 | S2 | Creation progress steps can never complete: `checkAbilitiesComplete` looks for ids `str`, `dex`…; `checkSkillsComplete` looks for `#skillsTable`. Neither exists. | `script.js:3376-3388` |
| D7 | S2 | Character card buttons use `onclick="duplicateCharacter('${name}')"`. A name with an apostrophe (O'Brien) breaks them, and names, weapon names and items are injected unescaped via `innerHTML`. That's an injection risk with imported JSON files. | `script.js:3820-3829`, `equipment_functions.js:84-118`, `213-224` |
| D8 | S2 | `saveCharacter` is monkey-patched (`originalSaveCharacter`), so it saves twice and the "saved" alert fires before the second write. `saveCharacter` and `saveCharacterSilent` are ~75 duplicated lines. | `script.js:1988-2140`, `3169-3206` |
| D9 | S2 | A `setInterval` every 2 s rebuilds the whole skills dashboard DOM and quick info, even when nothing changed | `script.js:3261-3266` |
| D10 | S2 | Skill-rank validation uses blocking `alert()` on every keystroke. Lowering the level doesn't re-check existing ranks or points. | `script.js:1186-1246`, `1430` |
| D11 | S3 | Import doesn't validate the shape of the file (a missing `feats` or `skills` throws on load). There's no schema version for future migrations. | `script.js:2305-2355`, `2193` |
| D12 | S3 | Skill total tooltip is computed and then overwritten (always blank or "synergy") | `script.js:1945-1955` |
| D13 | S3 | Dead and duplicate code: `switchMode`/`displayMode` duplicates `toggleMode`/`currentMode`; `validateSkillPoints`, `shouldShowCharacterSelection`, `impactedSkills`/`prereqs` are unused; two `DOMContentLoaded` handlers plus a 100 ms `setTimeout` init | various |
| D14 | S3 | The card fallback reads `character.abilities?.con` (lowercase) but keys are `Con` | `script.js:3791-3792` |
| D15 | S3 | Changing the age category doesn't refresh AC, initiative or weapon attack (those listeners only watch the ability inputs) | `equipment_functions.js:523-530` |
| D16 | S3 | Footer contains leftover citation tokens (`【567432723370824†L3170-L3239】`). The README and `.github/copilot-instructions.md` describe a different app (16 professions with other names, test files that don't exist, wrong BAB/feat/age rules). | `index.html:672-681`, README |

_Browser/runtime results: see section 6._

---

## 4. Layout & UX observations

- **No print stylesheet** (`style.css` has no `@media print`). For a one-shot, players need a paper sheet. The current screen layout prints buttons, empty dashboards, hidden-mode sections and long tooltips.
- Creation mode is one long scrolling page; the progress bar only scrolls, and its steps never show complete (D6).
- **Gameplay mode only shows the derived-stats block plus the dashboard.** Abilities aren't visible in gameplay mode, though they're needed for raw ability checks.
- Gameplay inventory shows only the first 3 items.
- Gameplay shows all 45 skills. Splitting them into trained/core skills and untrained-usable skills (with trained-only skills greyed out at 0 ranks) would read faster at the table.
- `alert()`/`confirm()`/`prompt()` are used heavily (rank limits, level-up, saves, item weight). That's disruptive on mobile; inline messages or toasts would be better.

---

## 5. Recommendations

### 5.1 For the upcoming one-shot (highest value, lowest risk)
1. **Fix the S1 items:** C1, C3, C8/C9, C13, C24, D1–D4. They are small, local edits.
2. **Add a print character sheet.** Either an `@media print` stylesheet or a dedicated "Print sheet" view that lays out a classic 1–2 page sheet (identity, abilities with mods, HP/Sanity boxes with dying/insanity tracks, saves, BAB/melee/ranged, AC/init/speed, weapons table, trained skills with totals, feats with one-line benefits, equipment, money). This is the deliverable players will actually hold.
3. **Pre-generated investigators:** use export/import JSON so the GM can build the party and hand out files or printouts.
4. **Correct the data tables** (professions money/core skills, skill list and flags, synergy, feats F1–F5) from the verified tables in `docs/rulebook/EXTRACTION_REVIEW.md`.

### 5.2 Structural (do as a second phase)
- **Split rules from UI:** move tables (skills, professions, feats, money, aging, progressions) into a `rules.js` data module, and calculations into pure functions (`baseAttack(level, option)`, `saves(...)`, `skillPoints(...)`). The UI should read from a single `character` state object instead of re-deriving state from DOM text (e.g. parsing `#baseAttack` text, which caused C3).
- **One save/load serializer** (removes D8 and fixes D3/D4 by rendering from state). Store feats by name and add a `schemaVersion`.
- **Specialised skills:** let the user add multiple Knowledge/Craft/Perform/Speak Other Language rows with a specialty text field. Profession templates list the specific specialties.
- **Unit tests** for the pure calculation functions (e.g. a small `node --test` file, no build step needed), with test tables taken straight from Tables 1-8, 1-9 and 1-10.
- **Escape all user strings** before `innerHTML`, or build DOM nodes with `textContent`.
- Replace the 2 s polling with event-driven updates.

### 5.3 A/B deployment suggestion
Since you'd like to compare before committing to a single fix:
- **A = current `main`** (unchanged) and **B = a branch with the fixes**, deployed side by side. With GitHub Pages, the simplest setup is one Pages site that publishes `main` at `/` and the fix branch at `/b/` via a small Actions workflow. A Netlify/Vercel branch-preview URL also works.
- Keep the **localStorage key compatible**, or have B read A's key and write its own (`cocd20_characters_v2`), so testers can open the same character in both without corrupting A's data. Feat-index storage (F10) makes this important: B should migrate on read, not write back to A's key.
- Suggested B scope: section 5.1 items 1–4 only, so the comparison isolates correctness and print. Structural work can be a later C.
- A side-by-side check: build 2–3 reference investigators by hand from the book, enter them in A and B, and compare against the expected numbers. The test tables from 5.2 can double as the expected values.

---

## 6. Browser test results (variant A)

These came from driving the original app in headless Chromium at desktop, tablet (768 px) and phone (390 px) widths. They confirm D1–D5, C3, C8, C24 and C25, and add:

| # | Sev | Defect | Where |
|---|---|---|---|
| B1 | S1 | **Losing all Sanity restores it to full.** `applySanityLoss` clamps at 0, then `updateSanity()` treats 0 as "empty" and refills it. | `script.js:2934`, `1826-1833` |
| B2 | S1 | Imported characters open the wrong character: the card click shows "Select a character to load", because the hidden dropdown isn't refreshed after import. | `script.js:2344`, `3865` |
| B3 | S1 | Names with an apostrophe throw on Duplicate/Delete, and the card opens instead | `script.js:3818-3823` |
| B4 | S2 | Take Damage / Heal / Lose / Restore buttons have invisible text (red on red, green on green); gameplay save values are white on white | `style.css:756-769`, `1578-1596`, `2146` |
| B5 | S2 | Phone: the page scrolls sideways (scrollWidth 635 at 390 px); skill Misc/Total columns are cut off; the header takes about 400 px | `style.css` |
| B6 | S2 | Printing gives 7 pages of raw form controls (creation) or 3 pages with invisible saves and clipped skills (gameplay) | no `@media print` |
| B7 | S2 | Accessibility: 157 of 236 inputs have no label; character cards and progress steps can't be reached by keyboard; icon buttons have no names | various |
| B8 | S3 | Sanity bar colour thresholds disagree (20% vs 25%), so the colour flips every 2 s | `script.js:3042`, `3474` |

## 7. Status

A rebuilt sheet in `v2/` addresses every item above. It does so as a separate variant (B), so the original (A) stays deployable for comparison. See `v2/DESIGNS.md` for the design review, a hand-worked sample character, the rule-by-rule checklist, and how each rulebook ambiguity is resolved (with the page that settles it). The calculations are covered by `node --test v2/tests/*.test.js`.
