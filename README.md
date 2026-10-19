# Call of Cthulhu d20 Character Sheet

Character sheets for the **Call of Cthulhu d20** roleplaying game that run in the browser, with no server, build step or account.

**Live:** https://thudave56.github.io/call_of_cthulhu_d20_character_sheet/

The site opens **Investigator Sheets (v2)**, the rules-checked sheet in [`v2/`](v2/). The **original sheet (v1)** is still available: pick it from the **Version** bar at the top of any page, or add `?v1` to the address. Each browser remembers the choice.

## What v2 does

- **Saved characters, per browser.** Every change saves automatically. The character list shows HP and Sanity for each investigator and highlights the last one played. Export and import `.json` files to move characters between devices.
- **Guided creation** in steps: Basics, Abilities, Skills, Feats, HP & Money, Gear, Magic and Review. Each step lists only its own rule problems, and the step tabs show what still needs fixing.
- **Three play layouts**, chosen from the **Layout** menu at the top:
  - **Table Tracker**: a dashboard for a laptop or tablet.
  - **Classic Sheet**: a record-sheet layout that prints on two pages.
  - **Pocket**: phone-first, with big buttons and tabs.
- **At the table:**
  - Roll skills, saves, abilities, attacks, damage and crits.
  - Attacks spend ammo, and full attacks follow Table 5-12.
  - Take damage or Sanity loss with Enter or the −1/−5 buttons, and Undo the last change.
  - Track an encounter with initiative, rounds and conditions (p.91).
  - A dice roller handles expressions like `3d6+2`.
  - Equipment & Money edits on the play screen: add, rename or remove items, change quantities, spend or receive cash, and equip or put away weapons. Only equipped weapons appear in the attack list.
- **Sanity rules:**
  - Sanity checks with "success/failure" notation.
  - Automatic temporary, indefinite and permanent insanity alerts, with rolls on Tables 4-1 to 4-4.
  - Mythos insanity.
- **Magic:**
  - Spells are cast by paying their printed cost: Sanity plus ability damage or permanent drain.
  - Mythos tomes: initial contact, study checks, completion Sanity loss and Cthulhu Mythos ranks.
- **Advancement:** XP with the Table 1-10 thresholds, and a Level up button. Level up rolls the hit die and the 1d6 Sanity gain, then walks you through the new skill points, feats and ability increase.
- **Works offline** once it has been opened, and can be installed to a phone's home screen.

[v2/DESIGNS.md](v2/DESIGNS.md) describes the layouts and gives a worked sample to check the numbers by hand. It also maps every rule to its rulebook page, code and test, and explains how rulebook ambiguities are resolved.

## Run it locally

```sh
python3 -m http.server 8790
# open http://localhost:8790/v2/
```

Opening `v2/index.html` straight from disk also works. Only offline mode needs a server.

## Tests

```sh
node --test v2/tests/*.test.js          # rules engine and storage (no dependencies)

# Browser smoke test (needs Playwright and a running server):
npm install --no-save playwright && npx playwright install chromium
python3 -m http.server 8790 &
node v2/tests/browser/smoke.js
```

Both run in CI (`.github/workflows/rules-tests.yml`).

## Project layout

| Path | What it is |
|---|---|
| `v2/js/rules.js` | Rules engine: every table and calculation, no DOM. Unit-tested. |
| `v2/js/store.js` | Saving, export and import, and copying characters from v1. |
| `v2/js/app.js` | Routing, the character list, the editor, undo. |
| `v2/js/designs.js` | The three play layouts and the play actions they share. |
| `v2/css/app.css` | Styles, including print, dark mode and small screens. |
| `v2/sw.js`, `v2/manifest.webmanifest` | Offline support and install. |
| `version-switch.js` | The Version bar shared by v1 and v2. |
| `index.html`, `script.js`, `equipment_functions.js`, `style.css` | The original sheet (v1). Its old guide is in [docs/V1_README.md](docs/V1_README.md). |
| `docs/REVIEW_V2.md` | Review of v2 and the status of each item. |
| `docs/REVIEW_FINDINGS.md` | Defects found in v1. |

The rulebook itself is not in this repository. Rule references are to printed page numbers of the Call of Cthulhu d20 core rulebook.

## License

MIT.
