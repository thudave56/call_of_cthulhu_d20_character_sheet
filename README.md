# Call of Cthulhu d20 Character Sheet

A comprehensive, interactive web-based character sheet for the Call of Cthulhu d20 system. This application runs entirely in the browser with no server or build process required, featuring automatic calculations, character persistence, and dual modes for character creation and active gameplay.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Browser](https://img.shields.io/badge/browser-modern-orange)

## Features

- **Dual Mode Interface**
  - **Creation Mode**: Full character building with step-by-step guidance
  - **Gameplay Mode**: Streamlined session-ready interface with quick-access vitals and combat stats

- **Complete d20 Implementation**
  - Automatic calculation of ability modifiers, saves, and attack bonuses
  - Call of Cthulhu sanity system with Cthulhu Mythos skill integration
  - 16 profession templates with core skills highlighted
  - 33 feats with automatic mechanical bonuses
  - Comprehensive skill system with synergy bonuses

- **Equipment & Combat System**
  - Weapon management with automatic attack and damage calculations
  - Armor and shield presets with custom options
  - Encumbrance tracking with visual weight bars
  - Initiative and combat statistics

- **Character Management**
  - Character selection landing screen
  - Save/load characters using browser localStorage
  - Export/import characters as JSON files
  - Session notes and gameplay tracking

- **Enhanced User Experience**
  - Real-time calculations and validation
  - Visual progress tracking for character creation
  - Responsive design for desktop and mobile
  - Tooltips and descriptions for all skills and feats
  - Search and filter functionality for skills

## Quick Start

### Installation

No installation required! Simply:

1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. Start creating your investigator

### System Requirements

- A modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Approximately 2MB of localStorage for character data

## How to Use the Character Sheet

### Getting Started

When you first open the character sheet, you'll see the **Character Selection Screen**:

- **Create New Character**: Start building a fresh investigator
- **Import Character**: Load a character from a JSON file
- **Character Cards**: Select from previously saved characters

### Character Creation

The character creation process is organized into 5 steps, with a progress indicator at the top:

#### Step 1: Basics

Fill in your character's fundamental information:

1. **Character Name**: Your investigator's name
2. **Player Name**: Your name
3. **Age & Age Category**:
   - Young Adult (15-34): +1 to physical ability checks
   - Middle Age (35-52): No modifiers
   - Old (53-69): -1 to physical, +1 to mental ability checks
   - Venerable (70+): -2 to physical, +2 to mental ability checks
4. **Profession**: Choose from 16 professions (affects starting money and core skills)
   - Academic, Artist, Athlete, Criminal, Dilettante, Doctor, Engineer, Journalist, Laborer, Military, Occultist, Parapsychologist, Police, Priest, Private Investigator, Scientist
5. **Level**: Your character level (1-20)
6. **Attack Option**:
   - **Offense**: Higher attack bonus, 1 good save
   - **Defense**: Lower attack bonus, 2 good saves
7. **Era**: Choose your campaign setting (affects starting money)
   - 1901-1920, 1921-1940 (Classic), 1941-1960, 1961-1980, 1981+ (Modern)

**Example**: Creating Dr. Sarah Chen
```
Character Name: Sarah Chen
Player Name: Alex
Age: 42
Age Category: Middle Age
Gender: Female
Profession: Doctor
Level: 3
Attack Option: Defense
Era: 1981+
```

#### Step 2: Abilities

Set your six ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma):

- **Manual Entry**: Type scores directly (standard array: 15, 14, 13, 12, 10, 8)
- **Roll Abilities**: Click "Reroll All Abilities" to roll 4d6 (drop lowest)
- **Check Reroll**: Verify if your total qualifies for a reroll per d20 rules

The sheet automatically calculates ability modifiers using the formula: `(score - 10) / 2` (rounded down)

**Example**: Dr. Sarah Chen's Abilities
```
Strength:     10 (Mod: +0)  - Average physical strength
Dexterity:    12 (Mod: +1)  - Nimble hands for surgery
Constitution: 13 (Mod: +1)  - Good endurance from long shifts
Intelligence: 15 (Mod: +2)  - Highly educated medical professional
Wisdom:       14 (Mod: +2)  - Perceptive and experienced
Charisma:     11 (Mod: +0)  - Professional bedside manner
```

#### Step 3: Skills

Allocate skill ranks across 43 available skills:

- **Skill Points**: Calculated as `(8 + Int modifier) × (level + 3)` at 1st level, then `8 + Int modifier` per level
- **Core Skills**: Your profession's core skills are highlighted in blue
- **Skill Ranks**: Maximum ranks = Level + 3 for core skills, (Level + 3) / 2 for non-core
- **Search**: Use the search box to quickly find skills
- **Filter**: Toggle "Show Profession Skills Only" to focus on core skills

**Important Skills**:
- **Cthulhu Mythos**: Special skill with no ability modifier. Each rank reduces maximum Sanity by 1. Trained only!
- **Skills with Synergy**: 5+ ranks in certain skills grant +2 bonuses to related skills (e.g., Bluff → Diplomacy)

**Example**: Dr. Sarah Chen at Level 3
```
Skill Points: (8 + 2) × 4 = 40 points

Core Skills (Doctor):
- Concentration: 6 ranks (+7 total with Con mod)
- First Aid: 6 ranks (+8 total with Wis mod)
- Knowledge (medicine): 6 ranks (+8 total with Int mod)
- Profession (doctor): 6 ranks (+8 total with Wis mod)
- Spot: 6 ranks (+8 total with Wis mod)
- Treat Injury: 6 ranks (+8 total with Wis mod)

Other Skills:
- Listen: 3 ranks (+5 total)
- Search: 2 ranks (+4 total)
- Drive: 2 ranks (+3 total)
- Cthulhu Mythos: 1 rank (reduces max Sanity to 98)
```

#### Step 4: Feats

Select feats your character has earned:

- **Feat Progression**: 1 feat at 1st level, +1 every 3 levels (4th, 7th, 10th, etc.)
- **Automatic Bonuses**: Some feats apply automatic bonuses:
  - Great Fortitude: +2 Fortitude save
  - Iron Will: +2 Will save
  - Lightning Reflexes: +2 Reflex save
  - Toughness: +3 Hit Points
  - Skill Focus: +2 to selected skill
  - Alertness: +2 Listen and Spot
  - And many more...

- **Selected Feats Summary**: View all your selected feats with their benefits in the summary section

**Example**: Dr. Sarah Chen's Feats
```
Level 3 grants 1 feat:
✓ Iron Will - Provides +2 bonus to Will saves
  (Strong mental fortitude from medical training and exposure to trauma)
```

#### Step 5: Equipment

Equip your investigator with weapons, armor, and gear:

**Weapons**:
- Click "+ Add Weapon"
- Enter weapon name, type (Melee/Ranged), range, damage, critical range/multiplier
- Attack and damage bonuses calculated automatically
- Example: .38 Revolver (Ranged, Range: 50 ft, Damage: 2d6, Crit: 20/x2)

**Armor & Defense**:
- Choose from presets (leather jacket, kevlar vest, riot gear) or create custom armor
- AC = 10 + Dex modifier + armor bonus + shield bonus
- Track armor check penalties and max Dex bonus
- Example: Kevlar Vest (+3 AC, Max Dex: +5)

**Equipment & Gear**:
- Quick-add items using the text box
- Track quantity, weight, and special properties
- Common items: Flashlight, First Aid Kit, Smartphone, Notebook, Camera

**Encumbrance**:
- Visual weight bar shows light/medium/heavy loads
- Carrying capacity based on Strength score
- Movement and skill penalties for heavy loads

**Example**: Dr. Sarah Chen's Equipment
```
Weapons:
- .38 Special Revolver (2d6 damage, 50 ft range)
- Surgical Scalpel (1d4 damage, improvised weapon)

Armor:
- Leather Jacket (+1 AC)

Equipment:
- Medical Bag (5 lbs) - Contains surgical tools and medicine
- Flashlight (1 lb)
- Cell Phone (0.5 lbs)
- Notebook & Pen (1 lb)
- First Aid Kit (3 lbs)

Total Weight: 10.5 lbs (Light Load)
```

### Derived Statistics

These are calculated automatically throughout character creation:

#### Hit Points
- Formula: `1d6 + Con modifier` per level (minimum 1 per level)
- Click "Auto-Calculate" for average HP (4 + Con modifier per level)
- Toughness feat adds +3 HP
- Track current HP for damage tracking

#### Saving Throws
- **Good Saves**: `2 + floor(level / 2)` + ability modifier + feat bonuses
- **Bad Saves**: `floor(level / 3)` + ability modifier + feat bonuses
- Attack option determines which saves are good

#### Base Attack Bonus
- **Offense**: Full level (+3 at 3rd level)
- **Defense**: Half level (+1 at 3rd level)
- Multiple attacks shown at higher bonuses (e.g., +6/+1 at 6th level with offense)

#### Sanity
- **Starting Sanity**: Wisdom score × 5
- **Maximum Sanity**: 99 - Cthulhu Mythos ranks
- **20% Threshold**: One-fifth of starting Sanity (for temporary insanity checks)
- Track current Sanity for sanity loss during play

**Example**: Dr. Sarah Chen's Derived Stats
```
Hit Points: 18 (3d6 + 3, average roll)
Current HP: 18/18

Saving Throws (Defense option = 2 good saves):
- Fortitude: +3 (good) = 2 (base) + 1 (Con)
- Reflex: +2 (bad) = 1 (base) + 1 (Dex)
- Will: +6 (good) = 2 (base) + 2 (Wis) + 2 (Iron Will feat)

Base Attack Bonus: +1 (defense option, level 3)

Sanity:
- Starting: 70 (Wisdom 14 × 5)
- Maximum: 98 (99 - 1 Cthulhu Mythos rank)
- 20% Threshold: 14 (below this triggers temporary insanity check)
- Current: 70/98

Starting Money: $28,000 (1d6+2 [doctor bonus] × $5,000 [1981+ era])
```

### Saving Your Character

Once you've finished creating your character:

1. Click **"Save Character"** at the bottom
2. Your character is saved to browser localStorage
3. The character appears on the Character Selection Screen
4. Click **"Export to File"** to download a JSON backup

### Gameplay Mode

Switch to **Gameplay Mode** for active gaming sessions:

#### Gameplay Dashboard

The dashboard provides quick access to essential statistics:

**Vitals Panel**:
- **Hit Points**: Visual bar with current/max HP
  - Apply damage: Enter amount, click "Take Damage"
  - Heal: Enter amount, click "Heal"
  - Color-coded: Green (healthy), Yellow (wounded), Red (critical)

- **Sanity**: Current/max with 20% threshold
  - Apply sanity loss: Enter amount, click "Lose Sanity"
  - Restore sanity: Enter amount, click "Restore"
  - Insanity status indicator

**Combat Panel**:
- Armor Class (AC)
- Initiative modifier
- Speed
- Base Attack Bonus
- All three saving throws
- Equipped weapons list
- Armor and shield display
- Inventory summary

**Skills Panel**:
- Scrollable list of all skills with total modifiers
- Profession core skills highlighted
- Quick reference for skill checks

**Session Notes**:
- Text area for tracking investigation notes, clues, NPCs, and story progress
- Auto-saved with character

#### Making Skill Checks

When the GM calls for a skill check:

1. Find the skill in the Skills Panel or Derived Statistics section
2. Roll 1d20
3. Add the total modifier shown on the sheet
4. Compare to the DC (Difficulty Class) set by the GM

**Example Skill Check**:
```
GM: "Make a Spot check to notice the strange symbol on the wall."
Player: *rolls 1d20* → Result: 14
Player: "14 plus my Spot bonus of +8... that's 22 total."
GM: "The DC was 18. You notice an eldritch symbol carved into the stonework..."
```

#### Combat

During combat:

1. **Initiative**: Roll 1d20 + your Initiative modifier (shown in Combat Panel)
2. **Attack Rolls**: Roll 1d20 + Base Attack Bonus + Ability modifier + weapon bonuses
3. **Damage**: Roll weapon damage dice + ability modifier (Str for melee, none for firearms in d20 CoC)
4. **Armor Class**: Your AC is your defense against attacks
5. **Track Damage**: Use the HP panel to track damage taken

**Example Combat Round**:
```
Initiative: 1d20 + 1 (Dex) = 15

Dr. Chen's turn:
- Fires .38 Revolver at cultist
- Attack roll: 1d20 + 1 (BAB) + 1 (Dex) = 1d20 + 2
- Rolls: 16 + 2 = 18 → Hits! (Cultist AC 14)
- Damage: 2d6 = 9 damage

Cultist attacks Dr. Chen:
- Attack roll: 15 vs. Dr. Chen's AC 14
- Hits! Damage: 6 damage
- Update HP: 18 → 12 HP (click damage panel, enter 6, click "Take Damage")
```

#### Sanity System

Call of Cthulhu's signature mechanic:

**When You Encounter the Mythos**:
1. GM announces a Sanity check
2. Roll 1d20 + Will save modifier
3. If you succeed, you resist the horror
4. If you fail, GM tells you the Sanity loss (e.g., "Lose 1d6 Sanity")
5. Roll the dice and apply the loss using the Sanity panel

**Sanity Thresholds**:
- **Above 20% Threshold**: You're sane (though shaken)
- **Below 20% Threshold**: Risk of temporary insanity (roll Will save)
- **0 Sanity**: Permanent insanity (character unplayable)

**Cthulhu Mythos Knowledge**:
- As you learn forbidden lore, you gain Cthulhu Mythos ranks
- Each rank reduces your maximum Sanity by 1
- Higher Mythos knowledge = more vulnerable to madness

**Example Sanity Loss**:
```
GM: "You glimpse a horror beyond human comprehension. Make a Sanity check, DC 18."
Player: *rolls 1d20* → 12 + 6 (Will) = 18... exactly the DC!
GM: "You barely maintain composure. Good save!"

Later...
GM: "The ritual completes and the entity manifests. Sanity check, DC 25."
Player: *rolls* → 8 + 6 = 14. Failed!
GM: "Lose 1d10 Sanity."
Player: *rolls 1d10* → 7. "I lose 7 Sanity."
[Updates: Current Sanity: 70 → 63. Still above 20% threshold of 14.]
```

### Leveling Up

When your character gains a level:

1. Switch to **Creation Mode**
2. Update **Level** field in Character Information
3. Automatic updates:
   - Skill points increase by (8 + Int modifier)
   - Saving throws improve
   - Base attack bonus improves
   - Maximum skill ranks increase
4. If level is divisible by 3 (3rd, 6th, 9th...), select a new feat
5. Roll or auto-calculate new Hit Points
6. Allocate new skill points
7. **Save Character** when finished

**Example: Level 3 → Level 4**:
```
Changes:
- Skill Points: +10 (8 base + 2 Int)
- Fort Save: +3 → +4 (good save progression)
- Will Save: +6 → +7 (good save progression)
- BAB: +1 → +2 (defense option)
- New Feat: Select 4th level feat
- HP: Roll 1d6+1, add to total (or take average: 4)
```

## Advanced Features

### Profession Core Skills

Each profession has 6 core skills that define their expertise:

- Core skills are **highlighted in blue** in the skills table
- Core skills have **higher maximum ranks** (level + 3) vs non-core ((level + 3) / 2)
- Profession info displays when you select a profession

**Profession Examples**:
- **Doctor**: Concentration, First Aid, Knowledge (medicine), Profession (doctor), Spot, Treat Injury
- **Detective**: Diplomacy, Gather Information, Investigate, Knowledge (law), Search, Sense Motive
- **Scientist**: Computer Use, Craft (varies), Investigate, Knowledge (varies), Research, Search

### Synergy Bonuses

Some skills grant bonuses to others when you have 5+ ranks:

- **Bluff 5+**: +2 to Diplomacy, Intimidate, Sleight of Hand
- **Climb 5+**: +2 to Use Rope
- **Jump 5+**: +2 to Tumble
- **Knowledge (architecture) 5+**: +2 to Search
- **Search 5+**: +2 to Investigate
- **Tumble 5+**: +2 to Balance, Jump
- And many more (see skill descriptions)

Skills with synergy bonuses appear in **blue bold text** in the totals column.

### Age Categories

Age affects ability scores:

| Age Category | Age Range | Modifier |
|--------------|-----------|----------|
| Young Adult  | 15-34     | +1 to Strength, Dexterity, or Constitution checks |
| Middle Age   | 35-52     | No modifiers |
| Old          | 53-69     | -1 to Strength, Dexterity, Constitution; +1 to Intelligence, Wisdom, Charisma |
| Venerable    | 70+       | -2 to physical abilities; +2 to mental abilities |

The sheet displays age modifiers when applicable.

### Character Import/Export

**Exporting**:
1. Click **"Export to File"** button
2. Downloads `CharacterName.json` file
3. Store this as a backup or share with GM

**Importing**:
1. Click **"Import Character"** on Character Selection Screen
2. Select a `.json` file from your computer
3. Character loads immediately and is saved to localStorage

### Multiple Characters

The Character Selection Screen shows all saved characters:

- **Character Cards** display: Name, Level, Profession, HP, Sanity
- **Load Character**: Click a character card to load them
- **Delete Character**: Hover over card, click trash icon to delete
- **Duplicate Character** (if implemented): Create a copy with modified name

### Session Management

Use Session Notes to track:
- Investigation clues discovered
- NPC contacts and relationships
- Locations visited
- Mythos tomes found
- Story developments
- Personal character journal entries

Notes are saved automatically with your character.

## Tips for Players

### Character Creation Tips

1. **Match Concept to Mechanics**: Choose profession and skills that fit your investigator's background
2. **Balanced Party**: Coordinate with other players to cover essential skills (combat, investigation, social, knowledge)
3. **Wisdom is Critical**: High Wisdom means more starting Sanity—essential for survival
4. **Core Skills First**: Max out your profession core skills before branching out
5. **Sanity vs Mythos**: Taking Cthulhu Mythos early reduces maximum Sanity but provides crucial knowledge

### Gameplay Tips

1. **Save Frequently**: Use "Save Character" after each session
2. **Track Everything**: Use session notes to record important information
3. **Backup Characters**: Export characters to JSON files regularly
4. **Sanity Management**: Know your 20% threshold and avoid unnecessary risks
5. **Skill Specialization**: Focus on being excellent at a few skills rather than mediocre at many

### Investigation Tips

1. **Core Investigation Skills**: Search, Spot, Listen, Investigate, Knowledge skills
2. **Social Skills**: Diplomacy and Gather Information for interviewing witnesses
3. **Research**: Library Use for discovering historical information
4. **Occult Knowledge**: Occult Knowledge helps identify mystical elements (before Cthulhu Mythos)

## Technical Details

### Browser Compatibility

Tested and working on:
- Google Chrome 90+
- Mozilla Firefox 88+
- Safari 14+
- Microsoft Edge 90+

### Data Storage

- Characters stored in browser `localStorage`
- Storage key: `"cocd20_characters"`
- Format: JSON object with character name as key
- Typical character data: 5-10 KB
- Maximum capacity: ~5-10 MB (browser dependent)

### File Structure

```
call_of_cthulhu_d20_character_sheet/
├── index.html              # Main HTML structure
├── script.js               # Core application logic
├── equipment_functions.js  # Equipment and combat calculations
├── style.css              # Styling and responsive design
├── CLAUDE.md              # Development documentation
└── README.md              # This file
```

### Calculations Reference

**Ability Modifier**: `floor((ability_score - 10) / 2)`

**Saving Throws**:
- Good save: `2 + floor(level / 2)` + ability modifier + feat bonuses
- Bad save: `floor(level / 3)` + ability modifier + feat bonuses

**Base Attack Bonus**:
- Offense: level
- Defense: `floor(level / 2)`

**Skill Total**: ranks + ability modifier + feat bonuses + synergy bonuses + misc

**Skill Points**: `(8 + Int_modifier) × 4` at 1st level, then `8 + Int_modifier` per level

**Starting Sanity**: `Wisdom × 5`

**Maximum Sanity**: `99 - Cthulhu_Mythos_ranks`

**Armor Class**: `10 + Dex_modifier + armor_bonus + shield_bonus + misc`

## Troubleshooting

### Characters Not Saving

**Problem**: Saved characters disappear after closing browser
**Solution**:
- Check if browser is in private/incognito mode (localStorage disabled)
- Verify localStorage is enabled in browser settings
- Export characters to JSON files as backup

### Calculations Seem Wrong

**Problem**: Numbers don't match expectations
**Solution**:
- Verify ability scores are entered correctly
- Check that feat bonuses are applied (view Selected Feats Summary)
- Ensure level is set correctly
- Confirm attack option (offense vs defense) for saves and BAB
- Review synergy bonuses (5+ ranks in one skill affects others)

### Can't Add More Skill Ranks

**Problem**: Skill rank inputs are disabled
**Solution**:
- Check if you've exceeded maximum ranks (level + 3 for core, (level + 3) / 2 for non-core)
- Verify you haven't exceeded total skill points
- Some skills are "trained only" (Cthulhu Mythos, Demolitions, etc.) and require special permission

### Import Fails

**Problem**: JSON import doesn't work
**Solution**:
- Verify the file is a valid `.json` file exported from this sheet
- Check that the file hasn't been edited in a text editor (syntax errors)
- Try exporting a new character and importing it as a test

## Frequently Asked Questions

**Q: Can I use this for online play (Roll20, Foundry VTT)?**
A: Yes! Keep the sheet open in a browser tab during your virtual session. You can also export and share JSON files with your GM.

**Q: Does this work offline?**
A: Yes, once loaded. Download the files to your computer and open `index.html` locally. Characters save to your browser's localStorage.

**Q: Can I print my character sheet?**
A: Use your browser's Print function (Ctrl+P / Cmd+P). Recommend printing in Creation Mode for full details.

**Q: How do I add custom skills or feats?**
A: This requires editing `script.js`. Add new entries to the `skills` or `feats` arrays following the existing format.

**Q: What happens if I clear my browser data?**
A: All saved characters in localStorage will be deleted! Always export characters to JSON files as backup.

**Q: Can multiple people use this on the same computer?**
A: Yes, localStorage is per-browser. Each browser (Chrome, Firefox, etc.) has separate storage. Or export/import characters to switch between players.

**Q: Is this official?**
A: No, this is a fan-made tool for the Call of Cthulhu d20 system (published by Wizards of the Coast). This project is not affiliated with Chaosium or Wizards of the Coast.

**Q: What about the 7th edition percentile-based Call of Cthulhu?**
A: This sheet is specifically for the d20 version. For 7th edition (percentile/BRP system), you would need a different character sheet.

## Example Characters

### Example 1: Dr. Sarah Chen (Level 3 Doctor)

**Concept**: Emergency room doctor investigating strange medical cases

**Abilities**: Str 10, Dex 12, Con 13, Int 15, Wis 14, Cha 11
**Profession**: Doctor (Era: 1981+)
**Attack Option**: Defense
**Feats**: Iron Will

**Key Skills**: First Aid +8, Treat Injury +8, Knowledge (medicine) +8, Spot +8, Concentration +7, Listen +5

**Combat**: AC 14 (leather jacket), HP 18, .38 Special revolver
**Sanity**: 70/98 (1 rank Cthulhu Mythos)

**Background**: ER doctor who began seeing patterns in inexplicable injuries and illnesses. After saving a dying man who whispered forbidden words, Sarah began her reluctant investigation into the Mythos.

### Example 2: Detective Marcus Stone (Level 1 Private Investigator)

**Concept**: Hard-boiled private investigator in 1920s New York

**Abilities**: Str 13, Dex 14, Con 12, Int 11, Wis 15, Cha 10
**Profession**: Private Investigator (Era: 1921-1940)
**Attack Option**: Offense
**Feats**: Dodge

**Key Skills**: Investigate +5, Search +5, Gather Information +4, Sense Motive +6, Spot +6, Knowledge (law) +4

**Combat**: AC 15, HP 7, .45 Pistol and brass knuckles
**Sanity**: 75/99 (no Mythos knowledge yet)

**Background**: Former police detective turned PI. Handles missing persons cases in the seedy underbelly of Prohibition-era Manhattan. Stumbled onto something bigger than bootleggers...

### Example 3: Professor Eleanor Wright (Level 5 Academic)

**Concept**: University archaeologist and ancient languages expert

**Abilities**: Str 8, Dex 10, Con 11, Int 16, Wis 14, Cha 13
**Profession**: Academic (Era: 1901-1920)
**Attack Option**: Defense
**Feats**: Skill Focus (Knowledge: archaeology), Great Fortitude, Educated

**Key Skills**: Knowledge (archaeology) +13, Knowledge (history) +11, Research +12, Decipher Script +11, Speak Language (6 languages), Cthulhu Mythos +3

**Combat**: AC 10 (unarmored), HP 19, Walking stick (improvised club)
**Sanity**: 50/96 (3 ranks Cthulhu Mythos - deep exposure to forbidden texts)

**Background**: Respected academic specializing in pre-Columbian civilizations. Three decades of research into lost cities have revealed disturbing patterns. Knows too much to turn back now.

## Credits & License

**Created by**: Community contributor
**System**: Call of Cthulhu d20 (Wizards of the Coast)
**Original Game**: Call of Cthulhu by Chaosium Inc.
**Based on**: d20 System (Wizards of the Coast)

### License

This character sheet is a fan-made tool and is not officially licensed. Call of Cthulhu is a registered trademark of Chaosium Inc. The d20 System is a trademark of Wizards of the Coast.

This software is provided "as is" for personal, non-commercial use.

### Contributing

Found a bug? Have a feature request? Contributions are welcome!

1. Test thoroughly in your games
2. Document any issues you find
3. Share improvements to calculations or UI
4. Submit pull requests with clear descriptions

## Additional Resources

- **Call of Cthulhu d20 Core Rulebook**: Official rules and expanded options
- **d20 SRD**: Core d20 system rules reference
- **Chaosium**: Publishers of Call of Cthulhu RPG (non-d20 versions)
- **Yog-Sothoth.com**: Community forums and resources
- **Arkham Archive**: Adventure modules and scenarios

## Version History

**v1.0** (Current)
- Full character creation system
- Dual mode interface (Creation/Gameplay)
- Character selection landing screen
- Equipment and combat system
- Save/load with localStorage
- Export/import characters
- Session notes
- 43 skills, 16 professions, 33 feats
- Automatic calculations for all d20 mechanics
- Sanity system with Cthulhu Mythos integration
- Responsive design for mobile and desktop

---

**Ready to investigate the unknown?** Open `index.html` and create your first investigator!

*"The oldest and strongest emotion of mankind is fear, and the oldest and strongest kind of fear is fear of the unknown."* — H.P. Lovecraft
