# UX Analysis & Recommendations for Call of Cthulhu d20 Character Sheet

## Executive Summary

Based on research into Call of Cthulhu d20 gameplay mechanics and analysis of the current implementation, this document provides recommendations to improve both **character creation workflows** and **game-time usability**.

## Call of Cthulhu d20 Gameplay Context

### Key Gameplay Characteristics
1. **Investigation-Focused**: Players spend majority of time investigating mysteries, making skill checks, and uncovering clues
2. **Horror & Sanity**: Mental state tracking is critical - sanity loss is frequent and impactful
3. **Mortality**: Characters can die or go insane; tracking current HP and sanity is essential during sessions
4. **Skill-Based**: Success depends heavily on skill totals; players reference these constantly
5. **Combat Secondary**: When combat occurs, attack bonuses and saves are needed quickly
6. **Session Tracking**: Skills used during sessions may improve between adventures (experience)

### Two Primary Use Cases
1. **Character Creation Mode**: Building a new investigator (one-time, detail-oriented)
2. **Gameplay Mode**: Quick reference and value tracking during active sessions (frequent, speed-oriented)

---

## Current Implementation: Strengths

✅ **Automatic calculations** - All derived stats update in real-time
✅ **Visual profession highlighting** - Core skills are clearly marked
✅ **Comprehensive data model** - All necessary d20 mechanics are implemented
✅ **Persistence** - Save/load functionality works well
✅ **Mobile-friendly layout** - CSS Grid provides responsive design

---

## Current Implementation: UX Issues

### 1. **No Separation Between Creation and Gameplay Modes**
- All information is visible at once, creating cognitive overload
- During gameplay, players need quick HP/Sanity tracking and skill totals
- Character background info (age, gender, profession description) is irrelevant during sessions
- Feat descriptions clutter the interface but aren't needed after initial selection

### 2. **Critical Game-Time Information Buried**
- **Current HP** and **Current Sanity** are in the middle of the page
- These are the most frequently modified values during gameplay
- Sanity thresholds require scrolling to reference
- No visual warnings when approaching death (0 HP) or insanity (20% threshold)

### 3. **Skills Table is Dense and Difficult to Scan**
- 43 skills in a single long table with no grouping
- During gameplay, players search for specific skills repeatedly
- No favorites/frequently-used marking system
- Profession core skills are highlighted but this is only relevant during creation

### 4. **Character Creation Flow is Linear but Not Guided**
- No step-by-step wizard or progress indication
- Users may not know recommended order (profession → abilities → skills → feats)
- No validation (e.g., warning if skill points exceed allowed maximum)
- Profession description is helpful but money modifier explanation is minimal

### 5. **Missing Session Tracking Features**
- No way to mark skills as "used this session" (for experience/improvement)
- No damage/sanity loss quick-entry (must manually calculate and update)
- No temporary modifiers or conditions tracking
- No notes field for session-specific information

### 6. **Attack Bonus Information Incomplete**
- Shows base attack bonus but not actual attack rolls with ability modifiers
- Missing damage information entirely
- No weapon tracking or inventory

### 7. **Feats Display Issues**
- 33 feats shown as one long list with tiny checkboxes
- No grouping (combat vs. skills vs. saves)
- Descriptions only visible on hover (tooltip), not persistent
- Selected feats don't summarize their benefits prominently

### 8. **Money System Confusing**
- "Starting Funds" randomly generated on profession/era change
- No explanation of the (1d6 + modifier) × era base formula
- No current money tracking field

---

## Recommendations

### **PRIORITY 1: Implement Mode Switching**

Add a prominent toggle at the top of the page to switch between two modes:

#### **📋 Creation Mode** (Default for new characters)
Shows all fields with emphasis on decision-making:
- Character info section expanded
- Profession info and core skills prominent
- Feats list with full descriptions visible
- Money calculation explained
- Step-by-step guidance (optional)

#### **🎲 Gameplay Mode** (Default for loaded characters)
Optimized for quick reference and tracking:
- **Collapsed sections**: Character info, profession details, feat list
- **Prominent display**:
  - Current HP / Max HP (with visual health bar)
  - Current Sanity / Max Sanity (with color-coded warnings at 20% threshold)
  - Base attack bonus + ability modifier = total attack
- **Condensed skills table**: Show only skill name and total (hide ranks/misc columns)
- **Quick-modify controls**: +/- buttons next to HP and Sanity
- **Session tracking**: Checkboxes to mark skills used

### **PRIORITY 2: Reorganize Layout for Gameplay**

Create a new "Game Session" panel at the top (visible in Gameplay Mode):

```
┌─────────────────────────────────────────────────────┐
│  🎲 GAME SESSION                                    │
├──────────────┬──────────────┬───────────────────────┤
│  HP: 12/18   │ Sanity: 35/71│  Fort: +3  Ref: +2   │
│  [████░░] 67%│ [██████░] 49%│  Will: +6  BAB: +4   │
│  [-][+] Dmg  │ [-][+] Loss  │  Attack: +4 (Str +0) │
└──────────────┴──────────────┴───────────────────────┘
```

**Benefits:**
- One glance shows critical vitals
- Visual bars provide immediate status awareness
- Quick damage/sanity loss entry without scrolling
- Common die roll modifiers immediately accessible

### **PRIORITY 3: Enhance Skills Table**

#### Add filtering/grouping options:
- **Group by category**: Physical, Mental, Social, Technical, Combat
- **Show only profession skills** (toggle)
- **Search/filter box** to quickly find skills
- **Pin favorites** - let users mark 5-8 most-used skills to show at top

#### Gameplay mode optimizations:
- Hide "Ability", "Ranks", "Misc" columns (only show Total)
- Larger, easier-to-read totals
- Add skill check quick-roller (optional): Click skill → shows "Roll d20 + [total]"

#### Session tracking:
- Add "Used" checkbox column (toggleable)
- "Mark all unused" button to reset between sessions

### **PRIORITY 4: Improve Character Creation Flow**

#### Option A: Keep single-page, add guidance panel
Add a collapsible "Creation Guide" panel:
```
┌──────────────────────────────────────────┐
│ 📝 Character Creation Steps             │
├──────────────────────────────────────────┤
│ ✓ 1. Choose profession & era            │
│ ✓ 2. Select attack option & good saves  │
│ → 3. Set ability scores                  │
│   4. Distribute skill ranks              │
│   5. Select feats                        │
│   6. Set starting HP                     │
└──────────────────────────────────────────┘
```
Auto-checks off steps as completed.

#### Option B: Multi-step wizard (separate page/sections)
Create a guided workflow with "Next"/"Previous" buttons:
1. **Concept**: Name, profession, era, level → shows profession description & core skills
2. **Abilities**: Set scores → shows calculated modifiers
3. **Combat**: Attack option, good saves → shows saves & attack bonus
4. **Skills**: Distribute ranks with profession skills pre-highlighted
5. **Feats**: Select feats grouped by type
6. **Finalize**: Set HP, review summary, save

### **PRIORITY 5: Add Missing Gameplay Features**

#### Damage & Sanity Loss Quick Entry
Instead of manually editing current values:
```
┌─────────────────────────┐
│ Take Damage:  [5] [Apply] │
│ Sanity Loss:  [3] [Apply] │
└─────────────────────────┘
```
With undo button for misclicks.

#### Temporary Conditions/Modifiers
```
┌──────────────────────────────────────┐
│ Active Conditions:                   │
│ ☑ Prone (−4 to melee attack)        │
│ ☑ Shaken (−2 to attacks & saves)    │
│ [+ Add Condition]                    │
└──────────────────────────────────────┘
```

#### Session Notes
```
┌──────────────────────────────────────┐
│ Session Notes:                       │
│ [Text area for GM notes, clues,     │
│  important NPCs, etc.]              │
└──────────────────────────────────────┘
```

#### Combat Tracker
```
┌──────────────────────────────────────┐
│ Initiative: [+2]  Roll: [d20+2]     │
│ AC: 12  Touch AC: 12  Flat: 10      │
└──────────────────────────────────────┘
```

### **PRIORITY 6: Improve Visual Hierarchy**

#### Current HP / Sanity Warnings
- **Green** (>50%): Healthy
- **Yellow** (25-50%): Wounded/Stressed
- **Orange** (10-25%): Critical
- **Red** (<10%): Death/Insanity imminent

#### Sanity-Specific Warnings
- Show **20% threshold value prominently** (temporary insanity trigger)
- Visual indicator when below threshold
- Show max sanity reduction as Cthulhu Mythos increases

#### Information Density
- Use accordions/collapsible sections for verbose content
- Profession description can collapse after selection
- Feat list can show selected only (with "Edit feats" button)

### **PRIORITY 7: Enhance Feats Section**

#### Reorganize by category:
```
🎯 COMBAT FEATS
☐ Point Blank Shot  ☐ Precise Shot  ☐ Rapid Shot

🛡️ DEFENSE & SAVES
☑ Great Fortitude (+2 Fort saves)  ☐ Iron Will  ☐ Lightning Reflexes

💪 SKILL FEATS
☑ Alertness (+2 Listen, +2 Spot)  ☐ Athletic  ☐ Acrobatic

✨ SPECIAL
☐ Toughness (+3 HP)  ☐ Endurance  ☐ Run
```

#### Show selected feat bonuses prominently:
```
┌──────────────────────────────────────┐
│ Active Feat Bonuses:                 │
│ • +2 Fort saves (Great Fortitude)    │
│ • +2 Listen (Alertness)              │
│ • +2 Spot (Alertness)                │
└──────────────────────────────────────┘
```

### **PRIORITY 8: Money & Equipment**

#### Starting money improvements:
- Show the formula: `(1d6 + modifier) × base`
- Button: "Reroll starting money"
- Show profession modifier and era base explicitly

#### Add current money tracking:
```
┌──────────────────────────────────────┐
│ Starting: $12,000                    │
│ Current:  [________]                 │
└──────────────────────────────────────┘
```

#### Add basic equipment section (optional):
- Weapons (name, damage, attack bonus)
- Armor (AC bonus)
- Important gear (investigative tools, etc.)

---

## Implementation Priority Matrix

| Priority | Impact | Effort | Implement First |
|----------|--------|--------|----------------|
| Mode switching | HIGH | MEDIUM | ⭐ YES |
| Game session panel | HIGH | LOW | ⭐ YES |
| Skills filtering | MEDIUM | LOW | ⭐ YES |
| Visual health bars | HIGH | LOW | ⭐ YES |
| Quick damage entry | HIGH | LOW | ⭐ YES |
| Creation wizard | MEDIUM | HIGH | Later |
| Equipment tracking | LOW | MEDIUM | Later |
| Conditions tracker | MEDIUM | MEDIUM | Later |

---

## Mockup: Suggested Gameplay Mode Layout

```
┌─────────────────────────────────────────────────────┐
│ Call of Cthulhu d20 Character Sheet                │
│ [📋 Creation Mode] [🎲 Gameplay Mode] ← Toggle     │
├─────────────────────────────────────────────────────┤
│ INVESTIGATOR: John Blackwood  |  Detective, Lvl 3  │
├─────────────────────────────────────────────────────┤
│ 🎲 QUICK REFERENCE                                  │
│ ┌──────────┬──────────┬──────────────────────────┐ │
│ │ HP 14/18 │ SAN 35/71│ SAVES  Fort +5  Ref +3   │ │
│ │ [████░░] │ [█████░] │        Will +8           │ │
│ │ Dmg:[__] │ Loss:[__]│ ATTACK BAB +4  STR +1    │ │
│ │   [Apply]│  [Apply] │        Total: +5         │ │
│ └──────────┴──────────┴──────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 📊 ABILITY SCORES                                   │
│ Str 12(+1)  Dex 14(+2)  Con 13(+1)                │
│ Int 16(+3)  Wis 15(+2)  Cha 10(+0)                │
├─────────────────────────────────────────────────────┤
│ 🎯 SKILLS                    [Search: _____]  [⭐]  │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⭐ Gather Information  +9                       ││
│ │ ⭐ Spot                +8                       ││
│ │ ⭐ Search              +8                       ││
│ │ ⭐ Listen              +7                       ││
│ │ ──────────────────────────                     ││
│ │ [Show All Skills ▼]                            ││
│ └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│ ✨ FEATS & BONUSES       [Edit]                    │
│ • Great Fortitude • Alertness • Skill Focus(Search)│
│ Active: +2 Fort, +2 Listen, +2 Spot, +3 Search    │
├─────────────────────────────────────────────────────┤
│ 💰 MONEY  Current: $2,450                          │
├─────────────────────────────────────────────────────┤
│ 📝 SESSION NOTES                                    │
│ [Investigating disappearances at Arkham Hospital...] │
├─────────────────────────────────────────────────────┤
│ [▶ Show Character Details] [💾 Save] [📁 Load]     │
└─────────────────────────────────────────────────────┘
```

---

## Specific Code Changes Needed

### 1. Add mode toggle state
```javascript
let displayMode = 'creation'; // or 'gameplay'
```

### 2. CSS classes for conditional display
```css
.creation-only { display: block; }
.gameplay-only { display: none; }

body.gameplay-mode .creation-only { display: none; }
body.gameplay-mode .gameplay-only { display: block; }
```

### 3. Quick damage/sanity functions
```javascript
function applyDamage(amount) {
  const current = parseInt(document.getElementById("currentHP").value);
  document.getElementById("currentHP").value = Math.max(0, current - amount);
  updateHealthBar();
}
```

### 4. Health bar visualization
```javascript
function updateHealthBar() {
  const current = parseInt(document.getElementById("currentHP").value);
  const max = parseInt(document.getElementById("hitPoints").value);
  const percentage = (current / max) * 100;
  // Update progress bar and color based on percentage
}
```

### 5. Skills filtering
```javascript
function filterSkills(searchTerm) {
  document.querySelectorAll("#skillsBody tr").forEach(row => {
    const skillName = row.querySelector(".skill-name").textContent;
    row.style.display = skillName.toLowerCase().includes(searchTerm.toLowerCase())
      ? '' : 'none';
  });
}
```

---

## Conclusion

The current implementation has solid mechanics but needs **mode-aware UX** to serve both character creation and active gameplay. The highest-impact changes are:

1. ✅ **Mode toggle** (Creation vs. Gameplay)
2. ✅ **Game session panel** with vitals at top
3. ✅ **Visual health/sanity bars** with color coding
4. ✅ **Quick damage/loss entry**
5. ✅ **Skills filtering/favorites**

These changes respect the existing architecture while dramatically improving usability for both use cases.
