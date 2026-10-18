# Investigator Sheets (v2): designs and rules check

v2 is a rebuilt Call of Cthulhu d20 character sheet that sits next to the original app, so the two can be deployed side by side as an A/B comparison.

| | Variant A (original) | Variant B (this) |
|---|---|---|
| Path | `/index.html` | `/v2/index.html` |
| Code | `script.js`, `equipment_functions.js` | `v2/js/rules.js` (rules), `store.js` (saving), `app.js` (list and editor), `designs.js` (play views) |
| Saved data | `localStorage["cocd20_characters"]` | `localStorage["cocd20v2:*"]`. On its first run, B copies A's characters once and leaves A's data untouched. |

Open `v2/index.html` in a browser; there is no build step. Run the rules tests with `node --test v2/tests/*.test.js`.

---

## Saving characters

- Each character is saved in this browser automatically, about 0.3 s after every change, so there is no Save button to forget.
- **Your investigators** (`#/`) lists every saved character with HP and Sanity bars. The one you played last is highlighted, and the page reopens on that list.
- **Cookies** remember the last character opened (`cocd20_last`) and the play design you chose (`cocd20_design`). The character data itself lives in `localStorage`, because cookies hold only about 4 KB.
- **Browser history** works: each screen has its own address (`#/play/<id>`, `#/edit/<id>/skills`), so Back/Forward and bookmarks behave as you'd expect.
- **Export / Import** moves characters between browsers or devices as a `.json` file, either one character or all of them. Import also accepts files exported from variant A.
- If the browser blocks storage (some private modes), the list says so and asks you to export.

## The three play designs

All three draw from the same calculated sheet (`CoC.derive`), so every number is identical whichever you choose. Switch with the design picker in the top bar; the choice is remembered. **Print always produces the Classic Sheet layout.**

### 1. Table Tracker: laptop or tablet at the table
![Table Tracker](docs/screens/design-1-tracker.png)

- Three columns: vitals (HP and Sanity with Damage/Heal/Lose/Gain), combat (AC, initiative, BAB, saves, weapons, abilities) and a searchable skill list.
- Tap any skill, save, ability, attack or damage entry to roll it. The result appears as a pop-up and in the log.
- Rule alerts appear at the top: dying, disabled, a Sanity check after losing ½ Wis, and 20%-per-hour indefinite insanity.

### 2. Classic Sheet: record-sheet layout that prints on two pages
![Classic Sheet](docs/screens/design-2-sheet.png)

Printed (Letter): [PDF](docs/screens/design-2-sheet-print.pdf) · ![page 1](docs/screens/design-2-print-page-1.png)

- Mirrors the official character record: identity boxes, abilities with temporary columns, saves with their base/ability/feat breakdown, AC/initiative/BAB, an HP box track, Sanity, and a full skill table (core ●, trained-only T, armor penalty A).
- Current HP and Sanity can be typed straight onto the sheet.
- Page 2 has weapons, feats, equipment, money and notes. The interactive HP and Sanity panels are hidden when printing.

### 3. Pocket: phone first
<img src="docs/screens/design-3-pocket-vitals.png" width="260"> <img src="docs/screens/design-3-pocket-skills.png" width="260"> <img src="docs/screens/design-3-pocket-combat.png" width="260">

- A sticky strip shows HP, SAN, AC and INIT at all times.
- Large touch buttons, and five tabs at the bottom: Vitals, Skills, Combat, Gear and Notes.
- No sideways scrolling at 390 px wide.

### Character list and editor
<img src="docs/screens/list.png" width="420"> <img src="docs/screens/editor-skills.png" width="420">

The editor is a seven-step wizard: Basics, Abilities, Skills, Feats, HP & Money, Gear and Review. Every step shows live rule validation: red for rule problems, amber for reminders. **Level up** (from the play screen) rolls the hit die and +1d6 Sanity, then sends you to spend the new skill points, pick a feat at levels divisible by 3, and raise an ability at levels divisible by 4.

---

## How to confirm accuracy: worked sample

Click **Add sample** on the character list. The sample is **Dr. Kristof Lehmann**: a 3rd-level Professor, Defense option, good Reflex and Will saves, age 52, 1921–40 era, Alertness, Weapon Proficiency (pistol) and Iron Will.

Each line below is worked by hand from the rulebook and should match the sheet exactly. The same values are asserted by the app, and the rules are covered by `v2/tests/rules.test.js`.

| What | Working (printed page) | Expected |
|---|---|---|
| Ability scores | Rolled 10/12/13/15/14/11. Age 52 is middle age: −1 Str/Dex/Con, +1 Int/Wis/Cha (p.13) | Str 9 (−1), Dex 11 (+0), Con 12 (+1), Int 16 (+3), Wis 15 (+2), Cha 12 (+1) |
| Skill points | (8+3)×4 at 1st, then 8+3 at each of 2nd and 3rd (p.16) | 44 + 11 + 11 = **66** |
| Max ranks | Core: level + 3; noncore: half that (p.11) | Core 6, noncore 3 |
| Saves | Good 2 + ⌊L/2⌋ = 3; bad ⌊L/3⌋ = 1 (Table 1-8) | Fort 1+1 = **+2**; Ref 3+0 = **+3**; Will 3+2+2 (Iron Will) = **+7** |
| Base attack | Defense option ⌊L/2⌋ (Table 1-8) | **+1** |
| AC / initiative | 10 + Dex, no armor; Dex for initiative (p.61) | **10** / **+0** |
| Hit points | 6+1 at 1st; hit dice 4 and 3, each +1 Con (p.11) | 7 + 5 + 4 = **16** |
| Sanity | 5 × Wis 15; max 99 − 0 Mythos (p.47) | Starting/current **75**, max **99** |
| Temporary insanity trigger | Losing ½ Wis in one roll | **8** |
| Indefinite insanity trigger | 20% of current Sanity in one hour (p.49) | **15** |
| Money | d6 roll 4 + Professor 0 = ×4; era 1921–40 $2,000 / $1,000 (Tables 1-13, 1-14) | Savings **$8,000**, income **$4,000/yr** |
| Pistol attack | BAB 1 + Dex 0, proficient (p.43) | **+1**, 1d10, ×3 |
| Spot | 6 ranks + 2 Wis + 2 Alertness | **+10** |
| Knowledge (occult) | 6 ranks + 3 Int | **+9** |
| Drive (noncore) | 3 ranks (costs 6 points) + 0 Dex | **+3** |

To exercise play mode: deal 17 damage and the sheet shows **−1, Dying**, with a 10% roll button. Deal 9 more and it shows **Dead** at −10. Lose 8 Sanity and an alert asks the GM for a Sanity check. Lose 15 within the same hour and the indefinite-insanity alert appears.

## Rules implemented and where to check them

| Rule | Source (printed page) | Code | Test |
|---|---|---|---|
| Ability modifier ⌊(score−10)/2⌋; reroll if total modifiers ≤ 0 or highest ≤ 13 | p.6–7 | `abilityMod`, editor Abilities step | — |
| Aging at 50/65/80, cumulative, minimum score 1 | Table 1-11, p.13 | `agingCategory`, `abilityScores` | ✓ |
| Defense/Offense saves and BAB, iterative attacks at −5 | Tables 1-8 and 1-9, p.10 | `baseSave`, `baseAttackBonus`, `attackSequence` | ✓ |
| Exactly 1 (Offense) or 2 (Defense) good saves | p.10 | `validate` | ✓ |
| Feats: 2 at 1st, +1 at levels divisible by 3; ability +1 at levels divisible by 4 | Table 1-10, p.11 | `featSlots`, `abilityIncreaseLevels` | ✓ |
| HP: 6 + Con, then 1d6 + Con per level (min 1); Toughness +3, stacks | p.11, p.42 | `hitPoints` | ✓ |
| HP states: 0 disabled, −1…−9 dying (10% roll each round), −10 dead; Heal DC 15 stabilizes; rest heals 1/level/day | p.69 | `hpState`, play actions | ✓ |
| 12 core skills (9 template + 3 choice); specialties are separate skills | p.11–13, p.16 | `templateCore`, `validate` | ✓ |
| Skill points (8+Int)×4, then 8+Int per level (min 1); core 1 pt/rank; noncore 1 pt per ½ rank; half ranks don't count | p.16–18 | `skillPoints`, `skillTable` | ✓ |
| Trained-only skills, key abilities, armor-penalty skills | Table 2-1, p.18 | `SKILLS` | ✓ |
| Synergy +2 at 5 ranks | Table 2-4, p.22 | `SYNERGIES` | ✓ |
| Cthulhu Mythos can't be bought, has no max, lowers max Sanity | p.18, p.27, p.47 | `mythos` field, `sanity` | ✓ |
| Feat prerequisites, choices, multi/stacking; aptitude bonuses don't stack | Tables 3-1, 3-2, p.39–45 | `FEATS`, `featPrereqIssues` | ✓ |
| Weapon Proficiency by category (nonproficient −4); Finesse, Focus, Improved Critical | p.40–43 | `weaponAttack` | ✓ |
| Armor: AC bonus and check penalty (to skills and attacks); no Max Dex | Table 6-4, p.94–95 | `ARMOR`, `combat` | ✓ |
| Weapon stats | Tables 6-1 and 6-3, p.94–95 | `WEAPON_PRESETS` | — |
| Sanity: start 5×Wis, max 99−Mythos, ½ Wis per roll → check, 20%/hour → indefinite, 0 → slide, −10 permanent, +1d6 per level (cap at max), therapy capped at starting, Mythos insanity +2 then +1 | p.47–51 | `sanity`, `loseSanity`, `gainSanity`, `mythosInsanity` | ✓ |
| Money: (1d6 + profession, min 1) × era; Wealth windfall and +2 income | Tables 1-13 and 1-14, p.15, p.42 | `money` | ✓ |
| Variant defense bonus (+ Offense bonus Weapon Proficiency) | Table 1-15, p.15 | `defenseBonus`, `featSlots` | ✓ |

## Calls that need your confirmation

The book is ambiguous or inconsistent on these points. Each one has a sensible default in the app, but please confirm or overrule:

1. **Armor check penalty on Swim.** Table 2-1 marks Swim ††, but the armor sidebar on p.94 lists 7 skills without it. *The app follows Table 2-1 and applies it to Swim.*
2. **The Offense option's extra Weapon Proficiency** appears only inside the Defense Bonus variant box (p.15). *The app grants it only when that variant is switched on.*
3. **Agent template: Computer Use [Cha]** (p.12). Everywhere else it is Int. *The app uses Int.*
4. **Maximum Sanity is "99 − Mythos ranks" or "99 − Mythos modifier".** *The app uses ranks*, as the book's worked example does.
5. **Encumbrance.** The rulebook has no carrying-capacity table for investigators, so *v2 does not invent load penalties*. Variant A's Str×3/×6/×10 thresholds are not from this book.
6. **Skill points after an Int increase.** These are not retroactive (p.9). *The app records the Int modifier at each level.* Characters made directly at a higher level use their current Int for every level.
7. **Temporary insanity threshold for an odd Wisdom.** "One-half her Wisdom score" is taken as rounded up (Wis 15 → 8).

## A/B deployment

- **GitHub Pages (simplest).** Serve the repository root. Players reach A at `/` and B at `/v2/`. Both keep their own storage keys, so testers can use both in the same browser.
- **Split by link.** Give half the table the A link and half the B link, and compare: time to build a character, errors the GM catches, and which design players keep using during a session.
- If B wins, point `/` at `v2/` (or move `v2/` to the root) and retire A. A's saved characters are already copied into B on first launch.
