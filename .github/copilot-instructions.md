# Call of Cthulhu d20 Character Sheet - AI Coding Agent Instructions

## Two versions — work in v2 unless asked otherwise

- **v2 (default, `v2/`)**: Investigator Sheets. The site root redirects here (see `version-switch.js`).
  - `v2/js/rules.js` is the rules engine. It is a pure UMD module with no DOM: every table and calculation lives here, with printed page references in comments.
  - Everything the UI shows comes from `CoC.derive(character)`. Stored data goes through `CoC.normalize()`, which coerces every field to its type, so new fields need a default in `newCharacter()` and a coercion line in `normalize()`.
  - `v2/js/store.js` handles saving: one localStorage key per character (`cocd20v2:char:<id>`), revision numbers that refuse stale saves, import/export, and copying characters from v1.
  - `v2/js/app.js` handles routing (`#/`, `#/edit/<id>/<step>`, `#/play/<id>`), the editor, undo, and focus-preserving re-renders.
  - `v2/js/designs.js` holds the three play layouts and their actions.
  - **Escape** every user-provided string with `esc()` in templates.
  - Tests: `node --test v2/tests/*.test.js` for the engine and storage, and `v2/tests/browser/smoke.js` (Playwright) in CI. Add a test with every rule change. `v2/DESIGNS.md` maps each rule to its page, code and test.
  - The rulebook PDF and its text extraction are local only and git-ignored. Never commit them.
- **v1 (original, repo root)**: the notes below describe it. It is kept for players who prefer it (`?v1`).


## v1: Project Architecture

This is a **client-side web application** for Call of Cthulhu d20 character management with **no build process, dependencies, or server**. Simply open `index.html` in a browser to run.

### Core File Structure
- **`index.html`** - Main character sheet layout with dual-mode UI (creation/gameplay)
- **`script.js`** - All application logic: d20 calculations, DOM manipulation, localStorage persistence
- **`equipment_functions.js`** - Equipment and combat system (weapons, armor, encumbrance)
- **`style.css`** - CSS Grid responsive layout with mode-specific styling

### Data Flow Pattern
1. **DOMContentLoaded** → populate tables → attach event handlers → `updateAll()`
2. **User input** → automatic recalculations → update dependent UI elements
3. **Save/Load** → localStorage with key `"cocd20_characters"` as single object

## d20 Rule Implementation Specifics

### Critical Calculations (script.js)
- **Ability modifiers**: `floor((score + age_modifier - 10) / 2)` (line ~544)
- **Saving throws**: Good saves = `2 + floor(level/2)`, Bad saves = `floor(level/3)` (line ~596)
- **Base attack**: Offense = full level, Defense = half level, with -5 iterative attacks (line ~637)
- **Sanity system**: Starting = WIS×5, Max = 99 - Cthulhu Mythos ranks (line ~675)

### Special Rule: Attack Option Enforcement
The UI automatically limits good save selections based on attack option (Offense=1 good save, Defense=2 good saves).

## Key Data Structures

### Skills Array (script.js:26-315)
Each skill: `{name, ability, trainedOnly, description}`. **Cthulhu Mythos has `ability: null`** (uses only ranks).

### Professions Array (script.js:76-315) 
Each profession: `{name, moneyMod, coreSkills[], description}`. Core skills auto-highlight in UI.

### Feats Array (script.js:318-353)
Some feats apply mechanical bonuses via `getFeatBonuses()` - check this function when adding new feats.

## Dual-Mode UI Architecture

### Mode Switching (script.js:2280+)
- **Creation Mode**: Full character building interface
- **Gameplay Mode**: Streamlined session tracking (HP/Sanity bars, quick reference)
- Toggle via `switchMode()` - shows/hides elements with `.creation-only`/`.gameplay-only` classes

### Equipment System (equipment_functions.js)
- Global arrays: `weapons[]`, `equipment[]`
- Auto-calculates attack bonuses (STR for melee, DEX for ranged)
- Encumbrance tracking affects movement

## Testing & Debugging

### Test Suite (test_suite.html)
Comprehensive automated testing covering all calculations. **Run tests after rule changes**.

### Debug Files
- `sanity_debug.html` - Sanity system testing
- `load_test_debug.html` - Save/load validation
- `diagnostic_test.html` - General diagnostics

## Development Patterns

### Adding New Content
- **Skills**: Add to `skills` array with proper ability mapping
- **Feats**: Add to `feats` array, update `getFeatBonuses()` if mechanical effect
- **Professions**: Add to `professions` array with 6-9 core skills

### Calculation Updates
All derived stats flow through `updateAll()` → `updateDerivedStats()`. Modify specific calculation functions:
- `updateAbilityMods()` for ability modifiers
- `computeSaves()` for saving throws
- `updateSanity()` for sanity calculations

### Event Handling
Use `addEventListener("input")` for real-time updates. All form inputs trigger immediate recalculation.

## localStorage Persistence

Characters stored as: `{characterName: {all_form_data, abilities, skills, feats, equipment}}`. 
Save/load functions: `saveCharacter()`, `loadCharacter()`, `deleteCharacter()` (script.js:762-811).

## UX Conventions

### Visual Hierarchy
- Use `.creation-only`/`.gameplay-only` classes for mode-specific content
- HP/Sanity use color-coded progress bars (green→yellow→orange→red)
- Profession core skills get `.profession-skill` highlighting

### Form Validation
Skill ranks validated against level+3 maximum. Equipment weight affects encumbrance calculations.

## Git Workflow

Currently on `feature/equipment-inventory` branch. Main development files are tracked; test files and debug utilities are untracked.