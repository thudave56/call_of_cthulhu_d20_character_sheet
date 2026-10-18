# Project review: areas of improvement (after v2 launch)

_Review date: 2026-10-18 · Scope: the live site (v1 original + v2 Investigator Sheets), `v2/` code, repo and deployment. Method: code read with probes against `rules.js`/`store.js`, browser testing at 390/768/1366 px in light and dark mode, print to PDF, and a smoke test of the live GitHub Pages site. No code was changed._

What works well: no console errors on any normal path, fast rendering (3–8 ms per action, even for a level-20 character with 26 weapons), every input labelled, and contrast passing almost everywhere. The 33 rules tests pass, and printing from any layout produces a 2-page sheet. The items below are what's left.

Priority: **P0** fix first (legal, data loss or security) · **P1** noticeably better play at the table · **P2** rules and feature gaps · **P3** platform and housekeeping.

---

## P0: fix first

| # | Area | Problem | Suggested fix |
|---|---|---|---|
| 1 | **Copyright** | The public repo and the live site serve the full commercial rulebook: `docs/*.pdf` (80 MB), `docs/Rulebook_Split/`, `docs/content.pdf`. They also serve the text extraction added during this work (`docs/rulebook/rulebook.md`, `rulebook_layout.txt`). All of it is downloadable from `thudave56.github.io/…/docs/`. It also makes the repo about 80 MB and slows every Pages build. | Remove the PDFs and the full-text extraction from the repo, and keep them locally or in a private repo. Keep only `EXTRACTION_REVIEW.md` (short transcribed tables with page citations). Removing them from past commits as well needs a history rewrite and a force-push to `main`, which is your call. |
| 2 | **Data loss: multiple tabs** | Every route change, tab switch and page close saves the open character, even when nothing changed (`app.js:131,138,624-625`), with no conflict check (`store.js:64-72`). Two tabs on the same character: the stale tab overwrites the other tab's edits. It can also resurrect a character deleted in another tab, and it re-sorts the list by "last viewed". | Only save when there are unsaved changes. Store a revision number and refuse or warn on a stale write. Listen for `storage` events to reload. |
| 3 | **Data loss: level history** | Clearing the Level field resets the character to level 1 and deletes every hit-die roll and ability increase (`app.js:447`, `rules.js:915`). Lowering the level and raising it again also loses them. Raising the level in Basics gives no HP or Sanity. | Ignore a blank level, confirm before lowering it, and keep removed entries so they come back. Send level increases through the Level up flow. |
| 4 | **Data loss: text fields** | Text fields only save when you leave the field. Typing a name and reloading straight away loses it, contrary to DESIGNS.md ("saved ~0.3 s after every change"). | Debounce `input` events for `data-bind` text fields. |
| 5 | **Security: imported files** | `normalize()` doesn't clean nested fields, and two templates print them without escaping: the hit-die value (`app.js:390`) and weapon ammo/capacity (`designs.js:143`). A crafted `.json` runs script when opened. Ids are also printed unescaped in links. | Escape both templates. Convert numeric fields to numbers in `normalize`. Reissue ids that don't match `/^[\w-]+$/`. |
| 6 | **Import robustness** | A `null` inside `feats`, `weapons` or `levelLog` makes the import throw after earlier characters were already saved. The list doesn't refresh, and the bad character stays in the list but never opens. An unknown profession crashes the editor (`app.js:273,398`). An id containing `/`, `"` or `%` can never be opened (`parseRoute` doesn't decode it). Duplicate ids within one file overwrite each other. | Drop non-object array entries, fall back to a valid profession, check every record before saving any, track ids already used in the file, decode route ids, and re-render in a `finally`. |

## P1: play at the table

| # | Problem | Suggested fix |
|---|---|---|
| 7 | **Keyboard focus is lost after every action.** Each change re-renders the whole page (`app.js:59,153`), so focus returns to the top after typing a rank, pressing Tab, rolling a skill or clicking Damage. This hurts keyboard and screen-reader users and makes typing ranks in a row slow. | Restore focus by `data-*` key after rendering, as the skill search already does (`designs.js:500`), or update only the rows that changed. |
| 8 | **Weapons are fiddly.** Firing takes three clicks: attack, damage, then a 26 px "−" for ammo. Autofire doesn't use 3 rounds. There's no critical-damage helper. The weapons table scrolls sideways in Pocket (390 px) and in Table Tracker, hiding Crit, Ammo and Reload. | Make each weapon a card with large Attack (spends ammo; autofire 3), Damage, Crit damage (×multiplier) and Reload buttons. |
| 9 | **No undo.** Using Heal to reverse mistaken damage also clears subdual damage and marks the character stable (`designs.js:414`). | Add "Undo last change" in the toast and log, based on a snapshot taken before each change. |
| 10 | **Entering amounts is slow.** Damage and Sanity loss take three steps, and pressing Enter in the amount box does nothing. | Make the amount row a form so Enter submits it, and add −1/−5 quick buttons. |
| 11 | **Alerts don't stay with the character.** The Dying, temporary-insanity and indefinite-insanity alerts are kept in memory only (`designs.js:19`). They vanish on reload and carry over to the next character opened. | Save alerts on the character and clear them when switching characters. |
| 12 | **Roll history is hard to see.** The result toast lasts 4 s and covers the weapons panel. The log is at the bottom of Table Tracker and inside Pocket › Notes. | Pin a "last 3 rolls" strip by the vitals and move the toast clear of the panels. |
| 13 | **Creating a character is noisy.** Every step lists every rule problem, so Basics already complains about skills and feats. Picking Knowledge as an extra core skill shows a literal `*` as its specialty. "Core skills must all be different" doesn't say which skills. The 55 feats have no search, and unavailable feats are faded to 2.5:1 contrast. | Show problems for the current step only, with a ✓ or a count on each step tab. Name the clashing skills. Add a feat filter and an "available only" toggle, and keep text contrast at 4.5:1 or better. |
| 14 | **Changing profession or renaming loses choices.** Changing profession resets all 12 core skills without asking, and the existing ranks then exceed the noncore maximum. Renaming a specialty or weapon orphans Skill Emphasis, Weapon Focus and Improved Critical. Weapon feats are keyed by name, so every weapon with that name benefits. | Confirm before changing profession and keep the 3 extra core skills. Key weapon feats to the weapon's id. Flag feat choices that point to nothing. |
| 15 | **Small screens.** Between 601 and about 700 px the Pocket vitals strip sits under the wrapped top bar (`app.css:283`). Most play controls are under 40 px (`.btn.small` is 32 px). | Use a CSS variable for the top-bar height, and make tap targets at least 44 px in Pocket. |
| 16 | **Accessibility details.** Focus isn't moved when you change screens, and there's no skip link. On Classic Sheet, screen readers announce the ability and weapon buttons as just "9" or "+1". Motion isn't reduced for users who ask for it. `--ok` on `--ok-bg` is 4.38:1. | Move focus to the heading on each route change, add aria-labels ("Roll Strength check, −1"), honour `prefers-reduced-motion`, and darken `--ok`. |
| 17 | **Print.** Long notes are clipped to about 6 lines (a textarea). Empty notes print the placeholder text. Ammo prints capacity rather than rounds left. Many specialties spill a few rows onto an extra page. | Print notes as text, add a pencil grid for Sanity loss, and fit the skill table into one column on page 1. |

## P2: rules and feature gaps

| # | Gap | Notes |
|---|---|---|
| 18 | **No XP tracking** | Table 1-10 (p.11) levels by XP; the sheet only has a Level up button. Add an XP field with the next-level threshold, and have Level up use it. |
| 19 | **No magic: spells or tomes** | Ch. 7 (Magic) covers spells known, casting costs (Sanity plus ability damage), Spellcraft and studying tomes. Investigators who read Mythos tomes have nowhere to record spells, study progress or costs. |
| 20 | **Ability damage rules** | Temporary Int loss must not reduce skill points (p.63), but the sheet applies it when the Int modifier wasn't locked: every migrated character, and abilities set with the Roll button. 40 points drop to 28. Con 0 is dead, and any other ability at 0 is helpless or unconscious (p.62); nothing flags this. |
| 21 | **Sanity above maximum** | Raising Cthulhu Mythos ranks in the editor leaves current Sanity above the new maximum (80/69). Cap current Sanity at the maximum. |
| 22 | **Conditions and dice** | There's no tracker for conditions (stunned, prone, flat-footed, grappled; the attack-modifier table lists them), no general dice roller ("3d6+2"), no initiative or round counter, and no structured NPC or clue notes. |
| 23 | **Unarmed line** | It leaves out the armor check penalty and Str damage, and only appears when the character has no weapons. |
| 24 | **Migration from v1 drops data without saying so** | Armor, insanity state and extra core skills are lost. Intelligence at each level isn't locked. Knowledge and Craft ranks land on noncore "(general)" rows over the maximum. The copy runs once, so characters created in v1 afterwards are never picked up. Add an "Import from original sheet" button and list what needs review. |

## P3: platform and housekeeping

| # | Item | Suggested fix |
|---|---|---|
| 25 | **Which version is the default** | New visitors land on v1, which still has every defect in `REVIEW_FINDINGS.md` (e.g. Sanity reset on load, gameplay saves showing +0). Either make v2 the default, or retire v1 behind the Version switch. |
| 26 | **Offline use** | Game tables often have poor Wi-Fi. A web manifest plus a small service worker would let players install the sheet and use it offline, since the app is already all static files. |
| 27 | **Tests** | All 33 tests cover `rules.js`; `store.js` and `app.js` have none. Add store tests for imports, migration and round-trips, plus engine tests for lowering then raising the level and for capping Sanity. Add a Playwright smoke test (create → play → reload) to CI. |
| 28 | **Stale docs** | The v1 sections of `README.md` (16 professions, wrong rules) and `.github/copilot-instructions.md` describe the old app. Update or trim them. |
| 29 | **Smaller issues** | <ul><li>Every visit to `#/new` saves a blank character.</li><li>Added specialty rows can't be removed.</li><li>Level up is offered at level 20.</li><li>Item quantity can be 0, and capacity can drop below current ammo.</li><li>A storage-quota error is reported as "private mode?".</li><li>Cookies use `path=/` on a shared github.io domain and duplicate localStorage; consider dropping them or scoping them to the project path.</li><li>Script tags aren't versioned, so a cached mix of old and new files is possible right after a deploy.</li><li>Every save runs the full calculations, and `validate` repeats work; fine at this size.</li></ul> |

---

## Suggested order

1. **P0 #1** (remove the rulebook). This needs your decision on rewriting history.
2. **P0 #2–6** as one "data safety" change, with store tests (#27).
3. **P1 #7–12**: focus, weapon cards, undo, Enter-to-apply, alerts that stay with the character, roll strip. These have the most effect at the table.
4. **P2 #18–21**: XP, ability-0 states, Sanity cap. Then decide whether magic (#19) is in scope for your campaigns.
5. **P3 #25–26**: make v2 the default, then add offline support.
