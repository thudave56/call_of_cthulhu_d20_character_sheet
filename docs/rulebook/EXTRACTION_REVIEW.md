# Rulebook Extraction Review

Review of the two machine extractions against the scanned source PDF
(`docs/call-of-cthulhu-d20-core-rulebookpdf-3-pdf-free.pdf`):

- **MD** = `docs/rulebook/rulebook.md` (pdftotext reading-order mode)
- **LAYOUT** = `docs/rulebook/rulebook_layout.txt` (pdftotext `-layout` mode)

Page references are given as **PDF page (printed page)**. PDF page = printed page + 2.

## 1. Summary

### Coverage

The page images were rendered at 110 and 200 dpi and compared by eye with both extractions on these pages:

| Area | PDF pages (printed) | Checked against the image |
|---|---|---|
| Ch. 1 Character Creation | 8–17 (6–15) | All pages. Every table listed in the brief, the hit point rule, the reroll rule and all 17 profession templates |
| Ch. 2 Skills | 20 (18), 24 (22), 29 (27) | Table 2-1, skill point rules, Table 2-4 (synergy), the Cthulhu Mythos skill. Text only, no image: pages 18, 19 and 21 |
| Ch. 3 Feats | 41–47 (39–45) | Table 3-1, the benefit of every general feat, Table 3-2, the cost and DC tables of every psychic feat |
| Ch. 4 Sanity | 49–53 (47–51) | Starting and maximum Sanity, the Sanity Loss Examples, Tables 4-1, 4-2 (text only), 4-4, temporary, indefinite and permanent insanity, Mythos skill gain, Sanity gain on level up |
| Ch. 5 Combat | 63 (61), 71 (69) | Combat Basics (AC, initiative, attack rolls, hit point states), Disabled, Dying and Dead, stabilizing. Text only: page 66 (initiative) |
| Ch. 6 Equipment | 96–97 (94–95), 100–101 (98–99) | Tables 6-1, 6-2, 6-3, 6-4, 6-5 (all sections) and the armor prose |
| Prose spot checks | 160 (158), 228 (226) | Animated Corpse stat block, the GM chapter page with Table 10-1 |

### Overall quality

- **LAYOUT (`rulebook_layout.txt`) is the more reliable file for tables.** Rows are usually kept on one line, so most tables can be read correctly once the OCR typos are allowed for. The ones to know:
  - `l`/`I` read as `1`
  - `O` read as `0`
  - `S` read as `5`, so `+S`, `2S`, `SO` and `S.S6x4Smm` mean +5, 25, 50 and 5.56x45mm
  - `G` read as `6`, so `ldG` is 1d6 and `G lb.` is 6 lb.
  - `dl0` read as d10
  - footnote daggers garbled into `t`, `"J"`, `·1·` and `-j-`

  Its main weaknesses:
  - Em-dash ("—") cells are dropped, so values in sparse columns float.
  - A few multi-line rows break apart (Table 1-9, the shotgun capacities on Table 6-5).
  - Lists that wrap from one column to the next (the profession templates) look like orphans.
- **MD (`rulebook.md`) is not safe for any multi-column table.** Columns are emitted one after another and mixed in with the sidebar prose. As a result, on several tables a straight top-to-bottom reading pairs values with the wrong row or column:
  - Tables 1-10, 1-13, 1-14 and 1-15
  - Tables 3-1 and 6-4
  - The profession templates
  - Tables 6-1 and 6-5

  The prose paragraphs are generally fine apart from typos. Side-bar text is sometimes spliced into the middle of a sentence.
- Several minus signs and numbers are **missing or mangled in both files**:
  - The Middle Age row of Table 1-11 (the "−1" is lost).
  - Table 1-1: the score column is dropped from 6–7 onward.
  - Several shotgun capacities on Table 6-5 (LAYOUT only).
- **The source itself has a few problems** that are not extraction errors. They are listed in the Flagged for Review section below, for example the Agent template keys Computer Use to Cha.
- The rulebook has **no "Max Dex" column for armor and no character carrying-capacity or encumbrance table**. These should not be looked for in the text files.

---

## 2. Corrected rule tables (checked against the page images)

The tables below were transcribed from the page images. "—" means the cell is printed as an em dash in the book. ⚠ marks a value that is uncertain or wrong in the source. Each one is explained in the Flagged for Review section.

### 2.1 Ability scores: PDF 8–9 (printed 6–7)

- **Generation:** roll 4d6, drop the lowest die and total the three highest. Do this six times and assign the results to abilities in any order.
- **Rerolling option:** you may scrap all six scores and roll again if the scores are "too low". They are too low if **the total of all modifiers is 0 or less, or the highest score is 13 or lower.**
- "Each ability will have a modifier, ranging from −4 to +4 for starting characters."

**Table 1-1: Ability Modifiers** (PDF 9, printed 7)

| Score | Modifier |
|---|---|
| 1 | −5 |
| 2–3 | −4 |
| 4–5 | −3 |
| 6–7 | −2 |
| 8–9 | −1 |
| 10–11 | 0 |
| 12–13 | +1 |
| 14–15 | +2 |
| 16–17 | +3 |
| 18–19 | +4 |
| 20–21 | +5 |
| and so on | |

**Changing ability scores** (PDF 11, printed 9): add +1 to any one score at 4th level and at every fourth level after that (8th, 12th, 16th and 20th). Ability damage recovers at 1 point per day per damaged ability. Permanent drain cannot be restored by spells.

### 2.2 Table 1-8: Base Save and Base Attack Bonuses, Defense Option (PDF 12, printed 10)

Two "good" saves start at +2 and one "bad" save starts at +0. The three progressions are assigned to Fortitude, Reflex and Will in any order. Base attack bonus starts at +0.

| Level | Save Prog. 1 | Save Prog. 2 | Save Prog. 3 | Base Attack |
|---|---|---|---|---|
| 1st | +0 | +2 | +2 | +0 |
| 2nd | +0 | +3 | +3 | +1 |
| 3rd | +1 | +3 | +3 | +1 |
| 4th | +1 | +4 | +4 | +2 |
| 5th | +1 | +4 | +4 | +2 |
| 6th | +2 | +5 | +5 | +3 |
| 7th | +2 | +5 | +5 | +3 |
| 8th | +2 | +6 | +6 | +4 |
| 9th | +3 | +6 | +6 | +4 |
| 10th | +3 | +7 | +7 | +5 |
| 11th | +3 | +7 | +7 | +5 |
| 12th | +4 | +8 | +8 | +6/+1 |
| 13th | +4 | +8 | +8 | +6/+1 |
| 14th | +4 | +9 | +9 | +7/+2 |
| 15th | +5 | +9 | +9 | +7/+2 |
| 16th | +5 | +10 | +10 | +8/+3 |
| 17th | +5 | +10 | +10 | +8/+3 |
| 18th | +6 | +11 | +11 | +9/+4 |
| 19th | +6 | +11 | +11 | +9/+4 |
| 20th | +6 | +12 | +12 | +10/+5 |

### 2.3 Table 1-9: Base Save and Base Attack Bonuses, Offense Option (PDF 12, printed 10)

One "good" save starts at +2 and two "bad" saves start at +0. Base attack bonus starts at +1.

| Level | Save Prog. 1 | Save Prog. 2 | Save Prog. 3 | Base Attack |
|---|---|---|---|---|
| 1st | +0 | +0 | +2 | +1 |
| 2nd | +0 | +0 | +3 | +2 |
| 3rd | +1 | +1 | +3 | +3 |
| 4th | +1 | +1 | +4 | +3 |
| 5th | +1 | +1 | +4 | +4 |
| 6th | +2 | +2 | +5 | +5 |
| 7th | +2 | +2 | +5 | +6/+1 |
| 8th | +2 | +2 | +6 | +6/+1 |
| 9th | +3 | +3 | +6 | +7/+2 |
| 10th | +3 | +3 | +7 | +8/+3 |
| 11th | +3 | +3 | +7 | +9/+4 |
| 12th | +4 | +4 | +8 | +9/+4 |
| 13th | +4 | +4 | +8 | +10/+5 |
| 14th | +4 | +4 | +9 | +11/+6/+1 |
| 15th | +5 | +5 | +9 | +12/+7/+2 |
| 16th | +5 | +5 | +10 | +12/+7/+2 |
| 17th | +5 | +5 | +10 | +13/+8/+3 |
| 18th | +6 | +6 | +11 | +14/+9/+4 |
| 19th | +6 | +6 | +11 | +15/+10/+5 |
| 20th | +6 | +6 | +12 | +15/+10/+5 |

### 2.4 Table 1-10: Experience and Level-Dependent Benefits (PDF 13, printed 11)

| Level | XP | Core Skill Max Ranks | Noncore Skill Max Ranks | Feats | Ability Increases |
|---|---|---|---|---|---|
| 1st | 0 | 4 | 2 | 1st, 2nd | — |
| 2nd | 1,000 | 5 | 2 1/2 | — | — |
| 3rd | 3,000 | 6 | 3 | 3rd | — |
| 4th | 6,000 | 7 | 3 1/2 | — | 1st |
| 5th | 10,000 | 8 | 4 | — | — |
| 6th | 15,000 | 9 | 4 1/2 | 4th | — |
| 7th | 21,000 | 10 | 5 | — | — |
| 8th | 28,000 | 11 | 5 1/2 | — | 2nd |
| 9th | 36,000 | 12 | 6 | 5th | — |
| 10th | 45,000 | 13 | 6 1/2 | — | — |
| 11th | 55,000 | 14 | 7 | — | — |
| 12th | 66,000 | 15 | 7 1/2 | 6th | 3rd |
| 13th | 78,000 | 16 | 8 | — | — |
| 14th | 91,000 | 17 | 8 1/2 | — | — |
| 15th | 105,000 | 18 | 9 | 7th | — |
| 16th | 120,000 | 19 | 9 1/2 | — | 4th |
| 17th | 136,000 | 20 | 10 | — | — |
| 18th | 153,000 | 21 | 10 1/2 | 8th | — |
| 19th | 171,000 | 22 | 11 | — | — |
| 20th | 190,000 | 23 | 11 1/2 | — | 5th |

- Core skill max ranks = level + 3. Noncore max = half of that, with no rounding; a half rank gives no bonus.
- Core skills cost 1 skill point per rank. Noncore skills cost 2 points per rank, so 1 point buys a half rank.
- **Hit points** (PDF 13, printed 11): 1st level = **6 + Con modifier**. Each new level adds **1d6 + Con modifier**, minimum 1 hp per level ("If … result of 0 or less … add 1 … anyway").
- **Feats:** 2 at 1st level, then 1 at every level divisible by 3. **Ability increases:** +1 at every level divisible by 4.
- **Skill points** (PDF 18 and 20, printed 16 and 18): **8 + Int modifier** per level, minimum 1. At 1st level the total is multiplied by 4. Unspent points cannot be saved.
- **Core skills:** 12, which are the 9 template skills plus 3 of the player's choice.

### 2.5 Profession templates (PDF 14–15, printed 12–13)

Every template has 9 listed skills "+ three more of the player's choice", which makes 12 core skills. Key abilities are as printed in the book.

| Profession | Core skills [key ability] |
|---|---|
| Agent | Bluff [Cha], Computer Use [**Cha** ⚠], Forgery [Int], Gather Information [Cha], Hide [Dex], Innuendo [Wis], Move Silently [Dex], Open Lock [Dex], Sense Motive [Wis] |
| Antiquarian | Appraise [Int], Forgery [Int], Gather Information [Cha], Knowledge (history) [Int], Knowledge (any one) [Int] ×3, Research [Int], Speak Other Language [Int] |
| Archaeologist | Appraise [Int], Climb [Str], Knowledge (archaeology) [Int], Knowledge (history) [Int], Knowledge (any one) [Int], Research [Int], Search [Int], Speak Other Language [Int], Spot [Wis] |
| Artist/Musician | Bluff [Cha], Craft (any one) [Int], Diplomacy [Cha], Innuendo [Wis], Knowledge (art) [Int], Listen [Wis], Performance [Cha], Sense Motive [Wis], Spot [Wis] |
| Blue-Collar Worker | Climb [Str], Craft (any one) [Int], Disable Device [Int], Drive [Dex], Gather Information [Cha], Operate Heavy Machinery [Dex], Repair [Int], Spot [Wis], Use Rope [Dex] |
| Criminal | Bluff [Cha], Disable Device [Int], Escape Artist [Dex], Forgery [Int], Hide [Dex], Innuendo [Wis], Move Silently [Dex], Open Lock [Dex], Sleight of Hand [Dex] |
| Detective (police or PI) | Gather Information [Cha], Hide [Dex], Intimidate [Cha], Listen [Wis], Move Silently [Dex], Open Lock [Dex], Search [Int], Sense Motive [Wis], Spot [Wis] |
| Dilettante | Diplomacy [Cha], Drive [Dex], Gather Information [Cha], Innuendo [Wis], Knowledge (art) [Int], Knowledge (local\*) [Int], Pilot [Dex], Ride [Dex], Speak Other Language [Int]. \*Choose any one city. |
| Doctor/Nurse | Computer Use [Int], Diplomacy [Cha], Heal [Wis], Knowledge (biology) [Int], Knowledge (medicine) [Int], Knowledge (any one) [Int], Listen [Wis], Research [Int], Spot [Wis] |
| Parapsychologist | Bluff [Cha], Gather Information [Cha], Knowledge (history) [Int], Knowledge (occult) [Int], Knowledge (religion) [Int], Listen [Wis], Search [Int], Sense Motive [Wis], Spot [Wis] |
| Priest/Clergyman | Concentration [Con], Diplomacy [Cha], Knowledge (religion) [Int], Knowledge (any one) [Int] ×2, Listen [Wis], Sense Motive [Wis], Speak Other Language [Int], Spot [Wis] |
| Professor | Concentration [Con], Diplomacy [Cha], Gather Information [Cha], Knowledge (any one) [Int] ×3, Research [Int], Speak Other Language [Int], Spot [Wis] |
| Psychologist | Bluff [Cha], Diplomacy [Cha], Gather Information [Cha], Heal [Wis], Knowledge (medicine) [Int], Knowledge (psychology) [Int], Psychoanalysis [Wis], Research [Int], Sense Motive [Wis] |
| Soldier | Climb [Str], Hide [Dex], Jump [Str], Listen [Wis], Move Silently [Dex], Spot [Wis], Swim [Str], Use Rope [Dex], Wilderness Lore [Wis] |
| Technician | Computer Use [Int], Craft (any one) [Int], Disable Device [Int], Knowledge (any one) [Int], Open Lock [Dex], Operate Heavy Machinery [Dex], Repair [Int], Research [Int], Search [Int] |
| White-Collar Worker/Businessman | Bluff [Cha], Computer Use [Int], Diplomacy [Cha], Forgery [Int], Intimidate [Cha], Knowledge (any one) [Int], Listen [Wis], Sense Motive [Wis], Spot [Wis] |
| Writer/Reporter | Craft (photography) [Int], Craft (writing) [Int], Diplomacy [Cha], Gather Information [Cha], Innuendo [Wis], Knowledge (any one) [Int] ×2, Research [Int], Sense Motive [Wis] |

On the printed page the Archaeologist list starts at the bottom of column 1 and continues at the top of column 2. The Criminal list starts at the bottom of column 2 and continues at the top of column 3.

### 2.6 Table 1-11: Aging Effects (PDF 15, printed 13)

| Middle Age\* | Old\*\* | Venerable† | Maximum Age |
|---|---|---|---|
| 50 years | 65 years | 80 years | +3d10 years |

- \* −1 to Str, Con and Dex; +1 to Int, Wis and Cha.
- \*\* −2 to Str, Con and Dex; +1 to Int, Wis and Cha.
- † −3 to Str, Con and Dex; +1 to Int, Wis and Cha.

The steps are cumulative. At Old the total is −3 physical and +2 mental. At Venerable it is −6 physical and +3 mental. Aging cannot reduce a score below 1. Maximum age is 80 + 3d10, rolled secretly by the GM.

### 2.7 Table 1-13: Profession Modifiers to Income (PDF 17, printed 15)

| Profession | 1d6 modifier |
|---|---|
| Agent | −1 |
| Antiquarian | −1 |
| Archaeologist | 0 |
| Artist | −2 |
| Blue-collar worker | −1 |
| Criminal | −1 |
| Detective | −1 |
| Dilettante | +1 |
| Doctor | +2 |
| Technician | +2 |
| Parapsychologist | −2 |
| Priest | −1 |
| Professor | 0 |
| Psychologist | 0 |
| Soldier | −2 |
| White-collar worker | +1 |
| Writer | −1 |

### 2.8 Table 1-14: Starting Money and Income (PDF 17, printed 15)

| Era | Starting money (savings) | Yearly income |
|---|---|---|
| 1901 to 1920 | $1,000 | $500 |
| 1921 to 1940 | $2,000 | $1,000 |
| 1941 to 1960 | $4,000 | $4,000 |
| 1961 to 1980 | $4,000 | $8,000 |
| 1981 to 2000+ | $6,000 | $10,000 |

**Procedure:** roll 1d6 and add the Table 1-13 modifier, with a minimum result of 1. Multiply the result by both amounts. The Wealth feat adds +2 to the modifier and grants extra money equal to the starting savings.

### 2.9 Table 1-15: Defense Bonuses by Level, Variant (PDF 17, printed 15)

| Level | Defense Option | Offense Option |
|---|---|---|
| 1st–4th | +2 | +0 |
| 5th–9th | +3 | +1 |
| 10th–14th | +4 | +2 |
| 15th–19th | +5 | +3 |
| 20th | +6 | +4 |

The book prints every level 1st through 20th individually; the values are as grouped above. This variant applies only to investigators. In the variant, "an Offense Option character also receives an extra Weapon Proficiency feat at 1st level" (⚠ see the Flagged for Review section).

### 2.10 Table 2-1: Skills (PDF 20, printed 18)

| Skill | Untrained? | Key ability |
|---|---|---|
| Animal Empathy | No | Cha |
| Appraise | Yes | Int |
| Balance | Yes | Dex †† |
| Bluff | Yes | Cha |
| Climb | Yes | Str †† |
| Computer Use | Yes | Int |
| Concentration | Yes | Con |
| Craft\* | No\*\* | Int |
| Cthulhu Mythos † | No | — |
| Demolitions | No | Int |
| Diplomacy | Yes | Cha |
| Disable Device | No | Int |
| Disguise | Yes | Cha |
| Drive | Yes | Dex |
| Escape Artist | Yes | Dex †† |
| Forgery | Yes | Int |
| Gather Information | Yes | Cha |
| Handle Animal | No | Cha |
| Heal | Yes | Wis |
| Hide | Yes | Dex †† |
| Innuendo | Yes | Wis |
| Intimidate | Yes | Cha |
| Jump | Yes | Str †† |
| Knowledge\* | No | Int |
| Listen | Yes | Wis |
| Move Silently | Yes | Dex †† |
| Open Lock | No | Dex |
| Operate Heavy Machinery | No | Dex |
| Performance\* | No\*\* | Cha |
| Pilot | No | Dex |
| Psychic Focus | No | Wis |
| Psychoanalysis | No | Wis |
| Read Lips | No | Int |
| Repair | No | Int |
| Research | Yes | Int |
| Ride | Yes | Dex |
| Search | Yes | Int |
| Sense Motive | Yes | Wis |
| Sleight of Hand | No | Dex |
| Speak Other Language\* | No | Int |
| Spellcraft | No | Int |
| Spot | Yes | Wis |
| Swim | Yes | Str †† |
| Tumble | No | Dex †† |
| Use Rope | Yes | Dex |
| Wilderness Lore | Yes | Wis |

- \* Requires a specialization.
- \*\* At the GM's discretion, some specializations may be used untrained.
- † **Cannot be taken during character creation.** Cthulhu Mythos is the only skill with this marker.
- †† **Armor check penalties apply:** Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Swim and Tumble. These are the same 7 skills as the armor rules on PDF 96, plus Swim.

**Cthulhu Mythos** (PDF 29, printed 27):
- Key ability is "(NONE)".
- Ranks cannot be bought with skill points. They come only from tomes and Mythos experience.
- Each rank permanently reduces maximum Sanity by 1.
- It cannot be taken at creation or declared as a core skill.
- It has no maximum rank.

### 2.11 Table 2-4: Synergy Bonuses (PDF 24, printed 22)

Five or more ranks in the first skill give a +2 synergy bonus to the second.

| Five ranks in | +2 synergy to |
|---|---|
| Animal Empathy | Handle Animal |
| Bluff | Intimidate; Sleight of Hand |
| Handle Animal | Ride |
| Knowledge (medicine) | Heal |
| Knowledge (psychology) | Psychoanalysis |
| Sense Motive | Diplomacy |
| Tumble | Balance; Jump |

There is also a variant synergy check: a DC 15 check in one skill gives +2 on a related check.

### 2.12 Table 3-1: General Feats, with each benefit (PDF 41–45, printed 39–43)

| Feat | Prerequisite | Benefit (from the description) |
|---|---|---|
| Acrobatic | — | +2 aptitude on Jump and Tumble |
| Alertness | — | +2 aptitude on Listen and Spot |
| Ambidexterity | Dex 15+ | Ignore off-hand penalties (normally −4 to attack rolls, ability checks and skill checks with the off hand) |
| Animal Affinity | — | +2 aptitude on Handle Animal and Ride |
| Athletic | — | +2 aptitude on Climb and Swim |
| Blind-Fight | — | In melee, reroll a concealment miss chance once; speed in darkness is 3/4 instead of 1/2 |
| Cautious | — | +2 aptitude on Demolitions and Disable Device |
| Combat Casting | — | +4 on Concentration to cast defensively |
| Dodge | Dex 13+ | +1 dodge bonus to AC against one designated opponent |
| ↳ Mobility | Dex 13+, Dodge | Need not stop when moving adjacent to an opponent, and can move normally while adjacent |
| ↳ Spring Attack | Dex 13+, Dodge, Mobility, BAB +4 or higher | Move both before and after a melee attack (total ≤ speed) |
| Drive-By Attack | — | No penalty firing from a moving car (normally −2 circumstance) |
| Endurance | — | +4 competence on checks for extended physical actions (running, swimming, holding breath) |
| Expertise | Int 13+ | Take up to −5 on melee attacks and add the same (up to +5) to AC as a dodge bonus; cannot exceed BAB |
| Gearhead | — | +2 aptitude on Computer Use and Repair |
| Great Fortitude | — | +2 inherent bonus on Fortitude saves |
| Improved Critical\* | Proficient with weapon, BAB +8 or higher | Threat range doubled with the chosen weapon (19–20 becomes 17–20) |
| Improved Initiative | — | +4 inherent bonus on initiative |
| Iron Will | — | +2 inherent bonus on Will saves |
| Lightning Reflexes | — | +2 inherent bonus on Reflex saves |
| Martial Artist | — | Unarmed attack deals 1d4 normal damage (normally 1d3 subdual, or −4 to deal normal damage) |
| Nimble | — | +2 aptitude on Escape Artist and Sleight of Hand |
| Persuasive | — | +2 aptitude on Bluff and Intimidate |
| Point Blank Shot | — | +1 competence on ranged attack and damage within 30 ft |
| ↳ Far Shot | Point Blank Shot | Projectile range increment ×1.5; thrown range increment ×2 |
| ↳ Precise Shot | Point Blank Shot | No −4 penalty for shooting into melee |
| ↳ Rapid Shot | Dex 13+, Point Blank Shot | One extra ranged attack per round at the highest BAB; all attacks at −2; full-round action |
| ↳ Multishot | Dex 13+, Point Blank Shot, Rapid Shot | Autofire penalty −4 (normally −6) and multifire penalty −2 (normally −4) per attack |
| ↳ Shot on the Run | Dex 13+, Point Blank Shot, Dodge, Mobility | Move before and after a ranged attack |
| ↳ Rolling Shot | Dex 13+, Point Blank Shot, Shot on the Run, Dodge, Mobility | +2 dodge AC against ranged attacks when moving ≥ 20 ft and attacking at range in the same round |
| Power Attack | Str 13+ | Subtract a number from melee attacks and add it to melee damage (≤ BAB) |
| ↳ Cleave | Str 13+, Power Attack | Extra melee attack after dropping a foe, once per round, no 5-ft step |
| Quick Draw | BAB +1 or higher | Draw or holster as a free action |
| Run | — | Run at ×5 speed (normally ×4); running jump distance +1/4 |
| Sharp-Eyed | — | +2 aptitude on Search and Sense Motive |
| Skill Emphasis\* | — | +3 competence on one skill |
| Stealthy | — | +2 aptitude on Hide and Move Silently |
| Toughness† | — | +3 hit points (stacks) |
| Track | — | Track with Wilderness Lore. DC by surface: very soft 5, soft 10, firm 15, hard 25, plus condition modifiers |
| Trustworthy | — | +2 aptitude on Diplomacy and Gather Information |
| Two-Weapon Fighting | — | Two-weapon penalties reduced by 2 (normally −6 primary and −10 off hand); Ambidexterity reduces the off-hand penalty by a further 4 |
| Wealth† | — | Windfall equal to starting savings; income modifier +2 (stacks) |
| Weapon Finesse\* | Weapon Proficiency (for that weapon), BAB +1 or higher | Dex instead of Str on attack rolls with one of: any knife, rapier/foil, hatchet, brass knuckles, unarmed strike |
| Weapon Focus\* | Weapon Proficiency (for that weapon), BAB +1 or higher | +1 on attack rolls with the chosen weapon |
| Weapon Proficiency\* | — | No nonproficiency penalty (−4) for one category: melee, thrown, pistol, rifle (includes automatic rifles), shotgun or submachine gun |

- \* Can be taken more than once. The effects do not stack; each time it applies to a new skill or weapon.
- † Can be taken more than once. The effects stack.

**Track condition modifiers:**

| Condition | DC modifier |
|---|---|
| Every 3 targets in the group | −1 |
| Size: Fine | +8 |
| Size: Diminutive | +4 |
| Size: Tiny | +2 |
| Size: Small | +1 |
| Size: Medium | +0 |
| Size: Large | −1 |
| Size: Huge | −2 |
| Size: Gargantuan | −4 |
| Size: Colossal | −8 |
| Every 24 hours since the trail was made | +1 |
| Every hour of rain | +1 |
| Fresh snow | +10 |
| Overcast or moonless night (poor visibility) | +6 |
| Moonlight (poor visibility) | +3 |
| Fog or precipitation (poor visibility) | +3 |
| Target hides trail | +5 |

### 2.13 Table 3-2: Psychic Feats (PDF 45–47, printed 43–45)

Failed attempts cost 1 Sanity point for every feat that has a cost.

| Feat | Prerequisite | Action | Cost (success) |
|---|---|---|---|
| Sensitive | Cha 15+ | None | None |
| Biofeedback Trance | Cha 15+, Sensitive | Full-round to enter and full-round to leave | None |
| ↳ Remote Viewing | Cha 15+, Sensitive, Biofeedback Trance | Full-round | 1d4 SAN + 1 temporary Wis damage |
| Dowsing | Cha 15+, Sensitive | Free | 1 SAN + 1 temporary Wis damage |
| Mind Reading | Cha 15+, Sensitive | Full-round | 1d3 SAN + 1 temporary Wis damage |
| ↳ Mind Probe | Cha 15+, Sensitive, Mind Reading | Full-round | 1d4 SAN + 1 temporary Wis damage |
| Psychokinesis | Cha 15+, Sensitive | Full-round | 1d4 SAN + 1 temporary Wis damage, plus 1 SAN + 1 Wis per extra minute |
| Psychometry | Cha 15+, Sensitive | Full-round | 1d4 SAN + 1 temporary Wis damage (the vision may also cost Sanity) |
| Second Sight | Cha 15+, Sensitive | None | None (normal Sanity costs for what is seen) |
| Telepathy | Cha 15+, Sensitive | Full-round | 1d4 SAN + 1 temporary Wis damage |

**Psychic Focus DCs:**

- **Mind Reading:**
  - Base DC: touching 15; within 30 ft 20; 30 ft to 1 mile 25; 1–25 miles 30; 25–1,000 miles 35; over 1,000 miles 40.
  - Modifiers: well-known −2, acquainted +0, unknown +2, unwilling +5, target has Sensitive −5, target has Telepathy −5.
- **Mind Probe:**
  - Base DC: touching 20; within 30 ft 25.
  - Modifiers: well-known −2, acquainted +0, unknown +2, unwilling +5, target has Mind Reading +5, target has Mind Probe +5, guarded secret +10.
- **Telepathy:**
  - Base DC: the same distance DCs as Mind Reading (15/20/25/30/35/40).
  - Modifiers: well-known −2, acquainted +0, unknown +2, sleeping −5, target has Sensitive −5, target has Mind Reading −5.
- **Remote Viewing:**
  - Base DC: under 100 ft 15; 100 ft to 1 mile 20; 1–25 miles 25; 25–1,000 miles 30; over 1,000 miles 35.
  - Modifiers: well known +0, seen once +2, described but never seen +4, never seen or described +6, practically unimaginable +8.
- **Psychokinesis:** up to 5 lb at 30 ft. Fine-manipulation DCs: door 20, dial 25, knot 30, signature 35.
- **Psychometry and Dowsing:** DC 15.

### 2.14 Sanity (PDF 49–53, printed 47–51)

- **Starting Sanity** = Wis × 5. This is also the cap on Sanity restored by Psychoanalysis.
- **Maximum Sanity** = 99 − Cthulhu Mythos. The book says both "ranks and any bonuses" and "modifier"; see the Flagged for Review section. Current Sanity can never exceed it.
- **Sanity check:** roll d% and succeed on a result ≤ current Sanity. Losses are written "success/failure", for example 0/1d4.
- **Sanity 0:** lose 1 more point each round. **−10 = permanently, incurably insane** and the character becomes an NPC.
- **Temporary insanity:** losing Sanity **equal to half the Wisdom score or more from a single roll** triggers a Sanity check. Failure means temporary insanity. Duration is on Table 4-1.
  - Variant: if the loss exceeds the Wisdom score, go straight to Table 4-3.
- **Indefinite insanity:** losing **20% (one-fifth) or more of current Sanity within 1 hour**. It lasts **1d6 game months**. Recovery comes after 1d6 months; see Table 4-4.
- **Mythos gain:** the first Mythos-related insanity gives **+2 ranks** of Cthulhu Mythos. Each later Mythos-related temporary or indefinite insanity after a failed check gives **+1 rank**.
- **Level up:** each new level adds **+1d6 current Sanity**. This is not capped by starting Sanity, only by maximum Sanity.
- **Treatment:** private care, Psychoanalysis or medication rolls d% each month. 01–95 gives +1d3 Sanity.

**Table 4-1: Duration of Temporary Insanity**

| d10 | Type | Duration |
|---|---|---|
| 1–7 | Short temporary insanity | 1d10+4 rounds |
| 8–10 | Longer temporary insanity | 1d10×10 hours |

**Sanity Loss Examples**

| Loss | Situation |
|---|---|
| 0/1d2 | Mangled animal carcass |
| 0/1d3 | Human corpse |
| 0/1d3 | Human body part |
| 0/1d4 | Stream of blood |
| 1/1d4+1 | Mangled human corpse |
| 0/1d6 | Trapped in a coffin |
| 0/1d6 | Friend's violent death |
| 0/1d6 | Ghoul |
| 1/1d6+1 | Someone known to be dead |
| 0/1d10 | Severe torture |
| 1/d10 | Corpse rising from the grave |
| 2/2d10+1 | Gigantic severed head falling from the sky |
| 1d10/d% | Great Cthulhu |

**Table 4-4: Random Indefinite Insanity**

| d% | Disorder |
|---|---|
| 01–15 | Anxiety |
| 16–25 | Dissociative |
| 26–30 | Eating |
| 31–35 | Impulse Control |
| 36–45 | Mood |
| 46–50 | Personality |
| 51–55 | Psychosexual |
| 56–70 | Schizophrenia/Psychotic |
| 71–80 | Sleep |
| 81–85 | Somatoform |
| 86–95 | Substance Abuse |
| 96–00 | Other |

### 2.15 Combat basics (PDF 63 and 71, printed 61 and 69)

- **Armor Class** = 10 + Dex modifier + size modifier (+ armor bonus, if any).
- **Initiative** = 1d20 + Dex modifier (a Dexterity check). Improved Initiative adds +4.
- **Melee attack** = 1d20 + BAB + Str modifier + size modifier.
- **Ranged attack** = 1d20 + BAB + Dex modifier + size modifier + range penalty.
- **Damage:** add the Str modifier for melee and thrown weapons. Off hand adds ½ Str bonus; two-handed adds 1½ × Str bonus.
- **Nonproficient** with a weapon: −4 to attack.
- **Hit point states:**
  - **0 hp = disabled.** One move or attack action per round; strenuous activity costs 1 hp.
  - **−1 to −9 = dying.** Unconscious, lose 1 hp per round, 10% chance per round to stabilize. Once stable, 10% chance per hour to regain consciousness, otherwise lose 1 hp.
  - **−10 or lower = dead.**
- **Stabilize** with a Heal check (DC 15).
- **Natural healing:** 1 hp per character level per day of rest.

### 2.16 Table 6-1: Melee Weapons (PDF 96, printed 94)

| Weapon | Damage | Critical | Range inc. | Weight | Type |
|---|---|---|---|---|---|
| **Tiny** | | | | | |
| Brass knuckles | 1d3 | ×2 | — | 0.5 lb. | Bludgeoning |
| Knife, steak | 1d3 | ×2 | — | 0.5 lb. | Piercing |
| Razor, straight | 1d3 | ×2 | — | 0.5 lb. | Slashing |
| Stiletto/Switchblade | 1d3 | 19–20/×2 | — | 0.75 lb. | Piercing |
| Knife, commando | 1d4 | 19–20/×2 | 10 | 1 lb. | Piercing |
| Knife, hunting | 1d4 | 19–20/×2 | 10 | 2.5 lb. | Piercing |
| Knife, combat | 1d4 | 19–20/×2 | 10 | 2.5 lb. | Slashing |
| **Small** | | | | | |
| Sap | 1d6 subdual | ×2 | — | 3 lb. | Bludgeoning |
| Pocketknife or scalpel | 1d3 | ×2 | — | 0.5 lb. | Piercing |
| Cleaver | 1d4 | 19–20/×2 | 5 | 1 lb. | Piercing |
| Butcher knife | 1d4 | 19–20/×2 | 5 | 1 lb. | Piercing |
| Folding shovel or entrenching tool | 1d4 | ×2 | — | 2.5 lb. | Bludgeoning and slashing |
| Gun butt, pistol | 1d4 | ×2 | 5 | 2 lb. | Bludgeoning |
| Knife, kukri | 1d4 | 18–20/×2 | 10 | 3 lb. | Slashing |
| Hatchet or tomahawk | 1d6 | ×3 | 10 | 3.5 lb. | Slashing |
| Nunchaku\* | 1d6 | ×2 | — | 2 lb. | Bludgeoning |
| **Medium-size** | | | | | |
| Croquet mallet | 1d4 | ×2 | — | 2.5 lb. | Bludgeoning |
| Nightstick or billy club | 1d4 | ×2 | — | 1.5 lb. | Bludgeoning |
| Fencing foil | 1d4 | 18–20/×2 | — | 2.5 lb. | Piercing |
| Bayonet, hand-held | 1d4 | 19–20/×2 | — | 2.5 lb. | Piercing |
| Crowbar, tire iron or fireplace poker | 1d6 | ×2 | — | 3 lb. | Bludgeoning |
| Pick or pickaxe | 1d6 | ×4 | — | 6 lb. | Piercing |
| Machete | 1d6 | 19–20/×2 | — | 2.5 lb. | Slashing |
| Rapier | 1d6 | 18–20/×2 | — | 3 lb. | Piercing |
| Saber, cavalry | 1d6 | 18–20/×2 | — | 3 lb. | Slashing |
| **Large** | | | | | |
| Bat, baseball or cricket | 1d6 | ×2 | — | 3 lb. | Bludgeoning |
| Bayonet, fixed to rifle | 1d6 | 19–20/×2 | — | 11.5 lb. | Piercing and slashing |
| Gun butt, rifle or shotgun | 1d6 | ×2 | — | 9 lb. | Bludgeoning |
| Shovel or spade | 1d6 | ×2 | — | 4 lb. | Bludgeoning |
| Axe, wood or fire | 1d8 | ×3 | — | 6 lb. | Slashing |

\* Requires the Martial Arts feat to use. The book prints "Martial Arts"; the feat is named "Martial Artist" (⚠).

### 2.17 Table 6-3: Generic Firearms and Table 6-4: Generic Armor (PDF 97, printed 95)

| Weapon | Damage | Crit | Capacity | Range inc. | Rate of fire |
|---|---|---|---|---|---|
| Handgun (9mm) | 1d10 | ×3 | 9 | 20 ft. | Multifire |
| Rifle (.30-06 bolt-action) | 2d10 | ×3 | 4 | 200 ft. | Standard |
| Shotgun (12-gauge pump-action) | 3d6/2d6/1d6\* | ×3 | 5 | 50 ft. | Standard |
| Submachine gun (9×19mm selective fire) | 1d10 | ×3 | 30 | 25 ft. | Autofire |

All of these do piercing damage. \* Shotgun damage is by range increment, with no damage beyond the third increment.

| Armor | 2000s cost | Armor bonus | Armor check penalty |
|---|---|---|---|
| Bullet resistant vest | $299.95 | +4 | −1 |
| Reinforced vest | $439.95 | +5 | −2 |
| Flak vest | $2,000.00 | +6 | −3 |
| Flak armor (body armor) | $4,000.00 | +7 | −4 |

- **There is no Max Dex column** in this rulebook.
- The armor check penalty applies to Balance, Climb, Escape Artist, Hide, Move Silently, Jump and Tumble (PDF 96), **and also to attack rolls**.
- Special cases (PDF 96):
  - The bullet resistant vest is only +1 against high-velocity rifle rounds, larger-caliber handguns, arrows and knives.
  - The reinforced vest is only +1 against calibers larger than 7.62×51mm.
  - All vests are only +1 against creature claws.
- Armor is generally unavailable before the 1960s.

### 2.18 Table 6-5: Specific Firearms (PDF 100–101, printed 98–99)

Range is the range increment in feet. Footnote letters are omitted.

**Pistols**

| Weapon | Caliber | Damage | Crit | Action | Cap | Load | Range | Rate |
|---|---|---|---|---|---|---|---|---|
| Remington Double Derringer | .41 RF Short | 1d8 | ×3 | n/a | 2 | break | 5 | Multifire |
| Colt Single Action Army | .45 Colt Long / .40 or .41 Colt | 2d8 / 1d10 | ×3 | rev/S | 6 | side | 20 | Standard |
| Colt M1877 "Lightning" | .38 Colt | 1d10 | ×3 | rev/D | 6 | side | 20 | Multifire |
| Colt M1877 "Thunderer" | .41 Colt | 1d10 | ×3 | rev/D | 6 | side | 20 | Multifire |
| Webley Mark I | .455 Webley | 2d8 | ×3 | rev/S or rev/D | 6 | break | 20 | Standard / Multifire |
| Mauser M1896 "Broomhandle" | 7.62×25mm, 9×19mm / 9mm Mauser | 1d10 | ×3 | semi/S | 10 | mag or clip | 20 | Multifire |
| P08 Luger | 9×19mm | 1d10 | ×3 | semi/S | 8 | mag | 20 | Multifire |
| Colt M1911 | .45 ACP | 2d8 | ×3 | semi/S | 7 | mag | 20 | Multifire |
| Colt M1917 Revolver | .45 ACP | 2d8 | ×3 | rev/D | 6 | clip or side | 20 | Multifire |
| S&W M1917 Revolver | .45 ACP | 2d8 | ×3 | rev/D | 6 | clip or side | 20 | Multifire |
| Astra M1921 | 9×23mm, 9mm Steyr, 9×19mm (and others) | 1d10 | ×3 | semi/S | 8 | mag | 20 | Multifire |
| Walther PPK | .32 ACP / .380 ACP | 1d8 / 1d10 | ×3 | semi/D | 7 | mag | 20 | Multifire |
| Browning GP35 High-Power | 9×19mm | 1d10 | ×3 | semi/S | 13 | mag | 20 | Multifire |
| Walther P38 | 9×19mm | 1d10 | ×3 | semi/D | 8 | mag | 20 | Multifire |
| Colt Python | .357 Magnum | 2d6 | ×3 | rev/D | 6 | swing | 20 | Multifire |
| Ruger Blackhawk | .357 Mag / .44 Mag / .45 Colt Long | 2d6 / 2d8 / 2d8 | ×3 | rev/S | 6 | side | 20 | Standard |
| H&K P9 | 9×19mm | 1d10 | ×3 | semi/S | 9 | mag | 20 | Multifire |
| SIG-Sauer P225 | 9×19mm | 1d10 | ×3 | semi/D | 8 | mag | 20 | Multifire |
| Beretta M92 | 9×19mm | 1d10 | ×3 | semi/D | 15 | mag | 20 | Multifire |
| Ruger Redhawk | .44 Magnum | 2d8 | ×3 | rev/D | 6 | side | 20 | Multifire |
| IMI Desert Eagle | .357 / .41 / .44 / .50 AE | 2d6 / 2d6 / 2d8 / 2d10 | ×3 | semi/S | 9 / 8 / 7 / 7 | mag | 20 | Multifire |
| Glock 17 | 9×19mm | 1d10 | ×3 | semi/D | 17 | mag | 20 | Multifire |
| Colt Delta Elite | 10mm Auto | 1d10 | ×3 | semi/S | 8 | mag | 20 | Multifire |

**Rifles**

| Weapon | Caliber | Damage | Crit | Action | Cap | Load | Range | Rate |
|---|---|---|---|---|---|---|---|---|
| Mosin-Nagant M1891 | 7.62×54mm | 2d10 | ×3 | bolt | 5 | clip | 200 | Standard |
| Mannlicher-Carcano M1891 Carbine | 6.5×52.5mm | 2d8 | ×3 | bolt | 6 | clip | 175 | Standard |
| Winchester M1894 | .32-40, .25-35 / .30-30, .38-55 | 2d6 / 2d10 | ×3 | lever | 4 or 8 | side | 200 | Standard |
| Lee-Enfield Mk I | .303 British | 2d10 | ×3 | bolt | 6 | mag | 175 | Standard |
| Mauser M1898 | 7.92×57mm | 2d10 | ×3 | bolt | 5 | clip | 200 | Standard |
| Springfield M1903 | 7.92×57mm ⚠ | 2d10 | ×3 | bolt | 5 | clip | 175 | Standard |
| Lee-Enfield Mk III | .303 British | 2d10 | ×3 | bolt | 10 | mag | 200 | Standard |
| M1 Garand | .30-06 | 2d10 | ×3 | semi | 8 | clip | 200 | Multifire |
| Springfield M1903A4 Sniper | .30-06 | 2d10 | ×3 | bolt | 5 | clip | 200 | Standard |
| Lee-Enfield No. 5 Mk I Jungle Carbine | .303 British | 2d10 | ×3 | bolt | 10 | mag | 175 | Standard |
| Ruger Mini-14 | 5.56×45mm | 2d6 | ×3 | semi | 5, 10, 20 or 30 | mag | 200 | Multifire |
| M21 Sniper | 7.62×51mm | 2d10 | ×3 | semi | 20 | mag | 200 | Multifire |
| Barrett Light Fifty M82A1 | 12.7×99mm | 2d12 | **×4** | semi | 11 | mag | 200 | Multifire |
| FR-F2 Sniper | 7.62×51mm | 2d10 | ×3 | bolt | 10 | mag | 200 | Standard |
| Ruger M77 Mk II Police | 7.62×51mm / 5.56×45mm | 2d10 / 2d6 | ×3 | bolt | 4 | side | 200 | Standard |

**Automatic rifles** (all select fire, mag-fed, Autofire, ×3)

| Weapon | Caliber | Damage | Cap | Range |
|---|---|---|---|---|
| M1918 BAR | .30-06 | 2d10 | 20 | 200 |
| AK-47 | 7.62×39mm | 2d6 | 30 | **150** |
| FN FAL | 7.62×51mm | 2d10 | 20 | 200 |
| M-14 | 7.62×51mm | 2d10 | 20 | 200 |
| H&K G3 | 7.62×51mm | 2d6 | 20 | 200 |
| Colt M-16A1 | 5.56×45mm | 2d6 | 20 or 30 | 200 |
| Galil | 5.56×45mm | 2d6 | 35 or 50 | 200 |
| Steyr AUG | 5.56×45mm | 2d6 | 30 or 42 | 200 |
| Enfield L85A1 | 5.56×45mm | 2d6 | 30 | 200 |

**Submachine guns** (mag-fed, Autofire, ×3)

| Weapon | Caliber | Damage | Action | Cap | Range |
|---|---|---|---|---|---|
| Thompson M1921 | .45 ACP | 2d8 | select | 20, 30 or 50 (mag or drum) | 30 |
| Sten Mk I | 9×19mm | 1d10 | select | 32 | 25 |
| M3 "Grease Gun" | .45 ACP | 2d8 | auto | 30 | 30 |
| Uzi | 9×19mm | 1d10 | select | 25, 32 or 40 | 25 |
| Sterling L2A1 | 9×19mm | 1d10 | select | 34 | 30 |
| vz61 Skorpion | .32 ACP | 1d8 | select | 10 or 20 | 20 |
| H&K MP5 | 9×19mm | 1d10 | select | 15 or 30 | 25 |

**Shotguns** (damage by gauge: see Table 6-8, PDF 109, which was not checked in this review)

| Weapon | Gauge | Action | Cap | Load | Range | Rate |
|---|---|---|---|---|---|---|
| Winchester M1897 | 12g or 16g | pump | 5 | side | 50 | Standard |
| Winchester M1897 Trench | 12g | pump | 5 | side | 50 | Standard |
| Winchester M1897 Riot | 10g or 12g | lever | 4 | side | 50 | Standard |
| Browning Auto-5 | 12g or 16g | semi | 4 | side | 50 | Multifire |
| Winchester M1912 | 12g, 16g, 20g, 28g | pump | 5 | side | 50 | Standard |
| Ithaca Model 37 | 12g, 16g, 20g | pump | 4 | side | 50 | Standard |
| Winchester Model 24 | 12g, 16g or 20g | n/a | 2 | break | 50 | Multifire |
| Browning Auto-5 Light | 12g, 16g or 20g | semi | 5 | side | 50 | Multifire |
| Remington Model 11A | 12g, 16g or 20g | semi | 5 | side | 50 | Multifire |
| Remington Model 11R | 12g | semi | 5 | side | 50 | Multifire |
| Winchester Model 1400 | 12g, 16g or 20g | semi | 2 | side | 50 | Multifire |
| Franchi SPAS-12 | 12g | semi/pump | 7 | mag | 50 | Multifire |
| Mossberg M590 | 12g | pump | 6 | side | 50 | Standard |
| Beretta 686 Onyx | 12g, 20g or 28g | n/a | 2 | break | 50 | Multifire |
| Beretta M3P | 12g | semi | 5 | box | 50 | Multifire |

---

## 3. Discrepancies (ordered High → Low)

### High: a rule value is wrong, missing or scrambled so that a reader would take away the wrong rule

| # | PDF page (printed) | File(s) | Extracted text | What the PDF shows |
|---|---|---|---|---|
| H1 | 17 (15), Table 1-14 | MD | The rows are interleaved with the Background sidebar. Lines appear as `$4,000 / $4,000 / 1941 to 1960 / … / $8,000 / $4,000 / 1961 to 1980`, and the 1921–1940 savings value is printed before the era label. A naive read gives 1961–80 as savings $8,000, income $4,000. | 1961–1980: savings **$4,000**, income **$8,000**. All rows are as in §2.8. (LAYOUT is correct.) |
| H2 | 17 (15), Table 1-15 | MD | Values are swapped on several rows: `1st / +O / +2`, `3rd / +2` after `+O`, `8th / +1 / +3`, `13th / +2 / +4`, `14th / +2 / +4`, `16th / +3 / +S`, `18th / +3 / +S`, `19th / +3 / +S`. | Defense is always the larger value: 1st +2/+0 … 13th +4/+2 … 16th–19th +5/+3 (§2.9). |
| H3 | 13 (11), Table 1-10 | MD | All six columns are split up and mixed with the Bruce example prose. The Feats and Ability Increase entries cannot be matched to levels (for example `…1st, 2nd / 4 / 1st / 2 / 0`). | §2.4. LAYOUT is usable (see M1). |
| H4 | 41 (39), Table 3-1 | MD | Feat names are listed first. Prerequisites follow separately, with the em-dash cells dropped and feat descriptions in between (`Prerequisite / Dex 15+ / … / Dex 13+ / Dex 13+, Dodge / … / Int 13+ / … / Proficient with weapon…`). Prerequisites cannot be matched to feats. | §2.12. LAYOUT is correct apart from the dropped dashes. |
| H5 | 14–15 (12–13), profession templates | MD | Headings are separated from their skill lists. Examples: under **ANTIQUARIAN** come the Archaeologist continuation (`Knowledge (any one)…Spot`) and then the Criminal continuation (`Hide…Sleight of Hand`). The Antiquarian list (`Appraise, Forgery, … Speak Other Language`) appears under **BLUE·COLLAR WORKER**. On page 15, DOCTOR/PROFESSOR/TECHNICIAN and PARAPSYCHOLOGIST/PSYCHOLOGIST headings are stacked before their lists. | §2.5 |
| H6 | 97 (95), Table 6-4 | MD | `Bullet resistant vest / $299.95 / -1 / +4` and `Flak armor (body armor) / $4 ,000.00 / -4 / +7`: the bonus and penalty are in reversed order compared with the other rows. | Bullet resistant vest bonus **+4**, penalty **−1**. Flak armor bonus **+7**, penalty **−4**. |
| H7 | 96 (94), Table 6-1; 100–101 (98–99), Table 6-5 | MD | Columns are emitted one at a time (all names, then all ranges/weights/types, then damage/crit in separate blocks). Damage and crit cannot be matched to weapons. | §2.16 and §2.18. LAYOUT keeps the rows (apart from the OCR typos in M7 and M8). |
| H8 | 101 (99), Table 6-5 Shotguns | LAYOUT (MD also scrambled) | Capacity is **missing** for Winchester M1897 Trench, Winchester M1912, Browning Auto-5 Light, Remington Model 11A and Franchi SPAS-12. Other capacities read `s` (meaning 5). Range reads `so` (meaning 50). `lOg` means 10g. `Barella M3P` means Beretta M3P. | Trench **5**, M1912 **5**, Auto-5 Light **5**, 11A **5**, SPAS-12 **7**. M1897, 11R and M3P are 5. Range is 50 for all. |
| H9 | 15 (13), Table 1-11 footnotes | LAYOUT and MD | `,.,_,to Str, Con, and Dex; +l to Int, Wis, and Cha.` The **Middle Age penalty value is lost**, so nothing says it is −1. The Old and Venerable markers are garbled (`'°"''-2`, `-j"-3`). `+3dl 0 years`. | \*−1 Str/Con/Dex, +1 Int/Wis/Cha; \*\*−2/+1; †−3/+1; maximum age +3d10. |

### Medium: ambiguous or scrambled but recoverable

| # | PDF page (printed) | File(s) | Extracted text | What the PDF shows |
|---|---|---|---|---|
| M1 | 13 (11), Table 1-10 | LAYOUT | The "—" cells are dropped, so `1st` (Ability Increase, 4th-level row) sits where a Feat could be read. `101/2` is used for 10 1/2. The values are right but their columns depend only on position. | Feats on 1, 2, 3, 6, 9, 12, 15, 18. Ability increases on 4, 8, 12, 16, 20 (§2.4). |
| M2 | 12 (10), Table 1-9 | LAYOUT | From 2nd level on, the level labels and the value rows are on separate lines, mixed with the "LEVEL-DEPENDENT BENEFITS" sidebar (`2nd / 3rd / +O +1 / +0 +1 / +3 +2 / +3 +3`, then `6th` with its values on the next line, and so on). Values can easily be shifted by one row. MD keeps the four columns in order and is correct. | §2.3 |
| M3 | 9 (7), Table 1-1 | LAYOUT and MD | The score column stops after `4-5`. Modifiers −2…+5 have no scores, and "and so on" is lost. | 6–7 −2 … 20–21 +5 (§2.1). |
| M4 | 20 (18), Table 2-1 | LAYOUT and MD | The dagger markers are garbled: `Cthulhu Mythost`, `Dext·1·`, `Strt"J"`, `Dextt`, `Dex"J"t`, `Str"J"t`, `Dext ·1-`, `Str"i""i"`, `Dex·1--1-`, `No*'~`. **`Speak Other Language 1'`** looks like the single-dagger ("cannot be taken at creation") marker. The Cthulhu Mythos key ability "—" is dropped. | Speak Other Language has a **\*** (specialization) and **can** be taken at creation. Only Cthulhu Mythos has †. The †† (armor check) skills are Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Swim and Tumble. Performance and Craft are `No**`. |
| M5 | 17 (15), Table 1-15 | LAYOUT | `5th +3` and `6th +3` have no Offense value; the `+1 +1` floats on the lines below. `+S` is used for +5 at 16th–19th. | 5th and 6th Offense +1; 16th–19th Defense +5. |
| M6 | 17 (15), Table 1-13 | MD | Antiquarian's `-1` is merged into prose (`n ot.) A charac-1`). Detective's and Writer's `-1` are printed before their names. | §2.7. LAYOUT is correct. |
| M7 | 96 (94), Table 6-1 | LAYOUT | `ldG` (1d6), `1dG subdual`, `G lb.` (6 lb.), `l 9-20/x2`, `l 8-20/x2`. | 1d6, 6 lb., 19–20/×2, 18–20/×2 |
| M8 | 101 (99), Table 6-5 Automatic rifles and SMGs | LAYOUT | `S.S6x4Smm`, `7.62xSlmm`, `3S or SO`, `2S` (Sten, Uzi and MP5 range), `lS or 30` (MP5 cap), `SO or drum` (Thompson), `19S7`. `Autifire` is a typo in the source. | 5.56×45mm, 7.62×51mm, 35 or 50, 25, 15 or 30, 50, 1957 |
| M9 | 51 (49), indefinite insanity | MD | `If a ch aracter loses 20°/., (on eof coherent speech) fift h) … in l h o u r`: the rule is spliced into the Table 4-2 rows. | "loses 20% (one-fifth) or more of her current Sanity points in 1 hour … lasts 1d6 game months" |
| M10 | 50 (48), Sanity Loss Examples and the Insanity column | MD | The table rows are interleaved with the Insanity prose: `0/1 d6 / Awakening… / sanity, can be cured. The third, permanen t in0/1 d6`. Values are in the right order but hard to follow. | §2.14 |
| M11 | 96 (94), armor prose | LAYOUT and MD | Reinforced vest: `The armor bonus is +S`. | +5 |
| M12 | 9–11 (7–9), Tables 1-2 to 1-7 (average scores) | LAYOUT and MD | Rows are misaligned (`Child` with `4-5` on another line; `Fit person` after `12-13 +l`). The "—" rows (Incorporeal spirit, Plant, Mummy, Animated corpse) lose their values. Yithian Int is split as `13` / `+`. These are reference tables only. | Values as printed, for example Yithian Int 36–37 +13. |
| M13 | 228 (226) | MD | The "Awarding Experience" sidebar is spliced into the middle of sentences (`(It doesbut effective. The Gamemasrer has comn't take a roll…`). | Prose is intact on the page. |

### Low: cosmetic OCR typos (examples, not exhaustive)

| # | PDF page (printed) | File(s) | Extracted | Correct |
|---|---|---|---|---|
| L1 | throughout | both | `l`/`I`/`J` read as `1` (`l3`, `+l`, `ld20`, `Jd6`, `I hit point`, `-I to -9`), `O` read as `0` (`+O`), `dl0`/`dlO` read as d10 | 1, 0, d10 |
| L2 | 63 (61) | both | `10°/i,` and `IO'X,` | 10% |
| L3 | throughout | both | `arc`→are, `mclee`/`mclcc`→melee, `Gamcmastcr`, `sec`→see, `<l`→d (`<lying`) | — |
| L4 | headings | both | `STRENGTij`, `CONSTITVTION`, `CHARlSMA (CijA)`, `ACQVlRlNG`, `CTtJ·UUJV MVTHOS/`, `TABLES-..` (Table 6-4), `TAaLE ,6 -2`, `TABLE3-2` | — |
| L5 | 41 (39) | LAYOUT | Footnote marks: `Improved Critical''`, `Weapon Proficiency>'`, `Toughness-J-`, `Wealth-j-` | \* and † |
| L6 | 160 (158) | LAYOUT | `Cha J`, `5 ft.IS ft.`, `5/ +I`, `CR: I`, `l / ld6` | Cha 1, 5 ft./5 ft., 5/+1, CR 1, 1/1d6 |
| L7 | 15 (13) | both | `PROFESS.OR`, `[Im]` (Int), `[Wis1`, `[IntJ`, `{POLICE` | — |

---

## 4. Flagged for review

These are points I could not settle from the page images, or problems in the source rulebook itself rather than in the extraction.

1. **The Agent template keys Computer Use to Cha** (PDF 14, printed 12). The image clearly shows `Computer Use [Cha]`. Table 2-1 and every other template key Computer Use to **Int**. This looks like an error in the source. The app should probably use Int, but the team should decide.
2. **No carrying capacity or encumbrance table for characters was found.** I searched both extractions for "carry", "encumb" and "load", and checked the index on PDF 320–321. The only hits are animal stat blocks (horse/camel, PDF ~203). No light/medium/heavy load table for investigators appears in the parts of the rulebook I checked. I did not view every page image to confirm it is absent. If the app has an encumbrance table, it comes from another d20 source.
3. **Armor has no Max Dex column.** Table 6-4 (PDF 97) lists only cost, armor bonus and check penalty. Any max-Dex values in the app are not from this book.
4. **Maximum Sanity: ranks or modifier?** PDF 49 (printed 47) says "99 minus the modifier the character has in the Cthulhu Mythos skill. This number (99 minus Cthulhu Mythos ranks and any bonuses)…". The Sanity Points paragraph on the same page says "99 minus Cthulhu Mythos modifier". The example on PDF 52 uses ranks (99 − 3 ranks = 96). The source is ambiguous about whether bonuses count.
5. **The extra Weapon Proficiency for the Offense Option** is stated only inside the "Variant: Defense Bonus" sidebar (PDF 17): "To balance the two options, an Offense Option character also receives an extra Weapon Proficiency feat at 1st level." It is unclear whether this applies only when the variant is used. The placement suggests it does.
6. **Table 6-1 footnote "Requires Martial Arts feat"**: the feat is named "Martial Artist" in Table 3-1. This inconsistency is in the source.
7. **Springfield M1903 caliber is printed as 7.92×57mm** (PDF 100). Historically it is .30-06, but the book prints 7.92×57mm. It does not affect damage (2d10).
8. **Not checked against the image:** Table 1-12 (height and weight), Table 2-2 (DC examples), Table 2-5, Tables 4-2 and 4-3 (compared as text only; the d% bands looked consistent), Table 5-x combat tables apart from Combat Basics and Injury, Tables 6-6 to 6-12 (including shotgun damage, Table 6-8 on PDF 109), and all creature, spell and adventure chapters apart from the two spot-check pages. These should be treated as unchecked.

---

## 5. Addendum: further tables checked against the page images

These were checked while building v2 (`v2/js/rules.js`). They close most of the gaps in §4 item 8.

| Table | PDF page (printed) | Result |
|---|---|---|
| 1-12 Random Height and Weight | 16 (14) | Male 4 ft. 10 in. + 2d10 in., 120 lb. + (height roll × 2d4) lb.; female 4 ft. 5 in. + 2d10 in., 85 lb. + (height roll × 2d4) lb. ⚠ The example says Sam's 2d4 roll is 5 but computes 12 × 6 = 72 lb (an inconsistency in the source). |
| 2-2 DC Examples | 21 (19) | Very easy 0, easy 5, average 10, tough 15, challenging 20, formidable 25, heroic 30, with the examples as in `DC_EXAMPLES`. The same page says a natural 20/1 is **not** an automatic success/failure on skill checks. |
| 2-5 Ability Check Examples | 25 (23) | Jammed door Str, threading a needle Dex, holding your breath Con, navigating a maze Int, remembering to lock a door Wis, getting singled out in a crowd Cha. |
| 4-1 Duration of Temporary Insanity | 50 (48) | d10 1–7 short (1d10+4 rounds); 8–10 longer (1d10×10 hours). |
| 4-2 Short-Term Temporary Insanity | 51 (49) | 01–20, 21–30, 31–40, 41–50, 51–55, 56–60, 61–65, 66–70, 71–75, 76–80, 81–90, 91–99, 00 (roll on 4-3); text as in `SHORT_TEMP_INSANITY`. |
| 4-3 Long-Term Temporary Insanity | 51 (49) | 01–10, 11–20, 21–30, 31–40, 41–45, 46–55, 56–65, 66–75 (tics, −4), 76–85, 86–90, 91–95, 96–00; text as in `LONG_TEMP_INSANITY`. |
| 4-4 Random Indefinite Insanity | 52 (50) | Matches §2.14. |
| Sanity Loss Examples | 50 (48) | Matches §2.14. Great Cthulhu is 1d10/d%. |
| 5-4 Attack Roll Modifiers | 74 (72) | Values as in `ATTACK_MODIFIERS`, including the † (defender loses Dex bonus) and †† (grapple) marks. |
| 5-5 Cover | 74 (72) | ¼ +2/+1, ½ +4/+2, ¾ +7/+3, 9/10 +10/+4 (half damage on a failed save, none on a success), total: can't be attacked. |
| 5-6 Concealment | 75 (73) | ¼ 10%, ½ 20%, ¾ 30%, 9/10 40%, total 50% and must guess the location. Helpless defenders: +4 melee, Dex treated as 0 (modifier −5), coup de grace. |
| 5-1 Two-Weapon Fighting Penalties | 69 (67) | Normal −6/−10; light off-hand −4/−8; Ambidexterity −6/−6; Two-Weapon Fighting −4/−8; light + Ambidexterity −4/−4; light + TWF −2/−6; Ambidexterity + TWF −4/−4; all three −2/−2. |
| 5-12 Multiple Ranged Attacks | 82 (80), rules on 83 (81) | Standard: 1 extra attack, all at −6. Multifire: 1 extra, −4. Autofire: 2 extra, −6, 3 bullets each. Rapid Shot: +1 extra attack, −2. Multishot: penalty −2 lower, including standard fire (p.81), although the feat text on p.41 names only autofire and multifire. Spot-checked rows +0, +6/+1 and +10/+5 in all columns. Reload to capacity is a full-round action. |
| 6-8 Shotgun Damage | 109 (107) | 10g 3d8/2d8/1d8, 3d4/2d4/1d4, slug 2d10, ×3. 12g 3d6/2d6/1d6, 3d3/2d3/1d3, 2d10, **×4**. 16g 3d6/2d6/1d6, 2d3/2d3/1d3, 2d10, ×3. 20g 2d6/1d6/1d4, 2d3/1d3/1d2, 2d8, ×3. 28g 2d4/1d4/1d3, 2d2/1d2/1, 2d6, ×3. .410 1d8/1d3/1d2, 1d4/1/1, 1d10, ×3. |

Natural 20s and 1s: attack rolls always hit on a natural 20 (a threat) and always miss on a natural 1 (PDF 68, printed 66). A search of the text found no automatic-result rule for saving throws.
