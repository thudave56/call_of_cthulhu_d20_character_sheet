# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based character sheet application for the Call of Cthulhu d20 system. It's a static HTML/CSS/JavaScript application with no build process or external dependencies. The application runs entirely in the browser and uses localStorage for character persistence.

## How to Run

Simply open `index.html` in a web browser. No build step, server, or package manager is required.

## Architecture

### Core Files

- **index.html** - Main HTML structure defining the character sheet layout with sections for character info, ability scores, skills, feats, derived statistics, and save/load functionality
- **script.js** - All application logic including:
  - Character data models (abilities, skills, professions, feats)
  - d20 rule calculations (ability modifiers, saving throws, attack bonuses, sanity)
  - DOM manipulation and event handling
  - localStorage persistence layer
- **style.css** - Styling with CSS Grid layout for responsive design

### Data Flow

1. On page load, `window.addEventListener("DOMContentLoaded")` triggers initialization:
   - Populates abilities table (script.js:381)
   - Populates skills table (script.js:398)
   - Populates profession dropdown (script.js:418)
   - Populates feats checkboxes (script.js:452)
   - Loads saved characters list (script.js:473)
   - Attaches all event handlers (script.js:488)
   - Runs initial calculations via `updateAll()` (script.js:888)

2. User input triggers automatic recalculations:
   - Ability score changes → recalculate modifiers → update saves, skills, sanity
   - Level changes → update base attack bonus and saving throws
   - Feat selections → apply bonuses to saves, HP, and skills
   - Skill ranks in "Cthulhu Mythos" → reduce maximum sanity (99 minus ranks)

3. Save/Load uses localStorage:
   - All characters stored in single object keyed by character name
   - Storage key: `"cocd20_characters"`
   - Character state includes all form values, abilities, skills, and feat selections

### d20 Rule Implementation

The application implements Call of Cthulhu d20 specific rules:

- **Ability Modifiers**: Standard d20 formula: `floor((score - 10) / 2)` (script.js:544)
- **Saving Throws** (script.js:596):
  - Good saves: `2 + floor(level / 2)`
  - Bad saves: `floor(level / 3)`
  - Attack option determines number of good saves (offense=1, defense=2)
- **Base Attack Bonus** (script.js:637):
  - Offense option: full level
  - Defense option: half level (rounded down)
  - Multiple attacks at -5 increments when base attack exceeds thresholds
- **Sanity System** (script.js:675):
  - Starting sanity: Wisdom score × 5
  - Maximum sanity: 99 − Cthulhu Mythos skill ranks
  - 20% threshold calculated for temporary insanity checks
- **Starting Money** (script.js:657): `(1d6 + profession modifier) × era base amount`

### Profession System

16 professions defined in `professions` array (script.js:76-315), each with:
- Money modifier (-1 to +2)
- Core skills array (6 skills that are profession-appropriate)
- Description text

Profession core skills are visually highlighted in the skills table with `.profession-skill` class.

### Feat System

33 feats defined in `feats` array (script.js:318-353). Some feats provide mechanical bonuses:
- **Save bonuses**: Great Fortitude, Iron Will, Lightning Reflexes (+2 to respective save)
- **HP bonus**: Toughness (+3 HP)
- **Skill bonuses**: Various feats grant +2 to specific skills (e.g., Alertness → Listen/Spot)

Feat bonuses are gathered by `getFeatBonuses()` (script.js:697) and applied during calculations.

## Key Implementation Details

- **No ability modifier for Cthulhu Mythos**: This skill has `ability: null` and uses only ranks + misc bonuses (script.js:35)
- **Attack option enforcement**: The UI automatically limits good save selections based on chosen attack option (script.js:596-615)
- **Real-time calculations**: All derived statistics update immediately on input change
- **Profession info display**: Core skills and description shown when profession selected (script.js:441)
- **LocalStorage persistence**: Characters stored as JSON with character name as key (script.js:762-811)

## Testing

This is a client-side only application. To test:
1. Open index.html in a browser
2. Manually test character creation workflow
3. Verify calculations match d20 rules
4. Test save/load/delete functionality
5. Check localStorage in browser DevTools

## Common Modifications

When modifying game mechanics:
- Ability modifiers: `updateAbilityMods()` (script.js:544)
- Saving throws: `computeSaves()` (script.js:596)
- Base attack: `computeBaseAttack()` (script.js:637)
- Sanity: `updateSanity()` (script.js:675)
- Skill totals: `updateSkillsTotals()` (script.js:727)

When adding new content:
- New skills: Add to `skills` array (script.js:26)
- New feats: Add to `feats` array (script.js:318)
- New professions: Add to `professions` array (script.js:76)
