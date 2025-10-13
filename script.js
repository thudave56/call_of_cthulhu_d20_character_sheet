/*
 * script.js
 *
 * This file contains the logic for the interactive Call of Cthulhu d20
 * character sheet. It populates the ability and skill tables, handles
 * automatic calculations (ability modifiers, saving throws, attack bonus,
 * sanity, etc.), applies feat effects, and provides simple localStorage
 * persistence so players can save and reload their investigators. The
 * calculations follow the rules extracted from the core rulebook and GM
 * screen【567432723370824†L3170-L3239】【878580011413210†L107-L120】.
 */

// Define the six abilities and their short names
const abilities = [
  { name: "Strength", short: "Str" },
  { name: "Dexterity", short: "Dex" },
  { name: "Constitution", short: "Con" },
  { name: "Intelligence", short: "Int" },
  { name: "Wisdom", short: "Wis" },
  { name: "Charisma", short: "Cha" },
];

// Define the list of skills and their key abilities
// Skills marked with † in the original sheet are subject to armour check
// penalties; this implementation does not handle armour so it is ignored.
// trainedOnly: true means the skill requires training (can't be used with 0 ranks)
const skills = [
  { name: "Animal Empathy", ability: "Cha", trainedOnly: false },
  { name: "Appraise", ability: "Int", trainedOnly: false },
  { name: "Balance", ability: "Dex", trainedOnly: false },
  { name: "Bluff", ability: "Cha", trainedOnly: false },
  { name: "Climb", ability: "Str", trainedOnly: false },
  { name: "Computer Use", ability: "Int", trainedOnly: false },
  { name: "Concentration", ability: "Con", trainedOnly: false },
  { name: "Craft", ability: "Int", trainedOnly: false },
  { name: "Cthulhu Mythos", ability: null, trainedOnly: true }, // treated as special; no ability modifier
  { name: "Demolitions", ability: "Int", trainedOnly: true },
  { name: "Diplomacy", ability: "Cha", trainedOnly: false },
  { name: "Disguise", ability: "Cha", trainedOnly: false },
  { name: "Drive", ability: "Dex", trainedOnly: false },
  { name: "Escape Artist", ability: "Dex", trainedOnly: false },
  { name: "Forgery", ability: "Int", trainedOnly: true },
  { name: "Gather Information", ability: "Cha", trainedOnly: false },
  { name: "Handle Animal", ability: "Cha", trainedOnly: false },
  { name: "Heal", ability: "Wis", trainedOnly: false },
  { name: "Hide", ability: "Dex", trainedOnly: false },
  { name: "Innuendo", ability: "Wis", trainedOnly: false },
  { name: "Intimidate", ability: "Cha", trainedOnly: false },
  { name: "Jump", ability: "Str", trainedOnly: false },
  { name: "Knowledge", ability: "Int", trainedOnly: true },
  { name: "Listen", ability: "Wis", trainedOnly: false },
  { name: "Move Silently", ability: "Dex", trainedOnly: false },
  { name: "Open Lock", ability: "Dex", trainedOnly: true },
  { name: "Operate Heavy Machinery", ability: "Dex", trainedOnly: false },
  { name: "Performance", ability: "Cha", trainedOnly: false },
  { name: "Pilot", ability: "Dex", trainedOnly: false },
  { name: "Psychic Focus", ability: "Wis", trainedOnly: true },
  { name: "Psychoanalysis", ability: "Wis", trainedOnly: true },
  { name: "Read Lips", ability: "Int", trainedOnly: true },
  { name: "Repair", ability: "Dex", trainedOnly: false },
  { name: "Research", ability: "Int", trainedOnly: false },
  { name: "Ride", ability: "Dex", trainedOnly: false },
  { name: "Search", ability: "Int", trainedOnly: false },
  { name: "Sense Motive", ability: "Wis", trainedOnly: false },
  { name: "Sleight of Hand", ability: "Dex", trainedOnly: true },
  { name: "Spellcraft", ability: "Int", trainedOnly: true },
  { name: "Spot", ability: "Wis", trainedOnly: false },
  { name: "Swim", ability: "Str", trainedOnly: false },
  { name: "Tumble", ability: "Dex", trainedOnly: true },
  { name: "Use Rope", ability: "Dex", trainedOnly: false },
  { name: "Wilderness Lore", ability: "Wis", trainedOnly: false },
];

// Profession templates drawn from the GM screen【878580011413210†L130-L209】.
// Each profession provides a money modifier and a list of core skills. We
// include an approximate set of core skills based on the official list.
const professions = [
  {
    name: "Agent",
    moneyMod: -1,
    coreSkills: [
      "Bluff [Cha]",
      "Computer Use [Cha]",
      "Forgery [Int]",
      "Gather Information [Cha]",
      "Hide [Dex]",
      "Innuendo [Wis]",
      "Move Silently [Dex]",
      "Open Lock [Dex]",
      "Sense Motive [Wis]",
    ],
    description:
      "Agents are trained operatives skilled at investigation and infiltration.",
  },
  {
    name: "Antiquarian",
    moneyMod: -1,
    coreSkills: [
      "Appraise [Int]",
      "Forgery [Int]",
      "Gather Information [Cha]",
      "Knowledge (history) [Int]",
      "Knowledge (any one) [Int]",
      "Knowledge (any one) [Int]",
      "Knowledge (any one) [Int]",
      "Research [Int]",
      "Speak Other Language [Int]",
    ],
    description:
      "Antiquarians are scholars of history and rare objects, versed in lore.",
  },
  {
    name: "Archaeologist",
    moneyMod: 0,
    coreSkills: [
      "Appraise [Int]",
      "Climb [Str]",
      "Knowledge (archeology) [Int]",
      "Knowledge (history) [Int]",
      "Knowledge (any one) [Int]",
      "Research [Int]",
      "Search [Int]",
      "Speak Other Language [Int]",
      "Spot [Wis]",
    ],
    description:
      "Archaeologists study ancient cultures and often find themselves in the field.",
  },
  {
    name: "Artist/Musician",
    moneyMod: 0,
    coreSkills: [
      "Bluff [Cha]",
      "Craft (any one) [Int]",
      "Diplomacy [Cha]",
      "Innuendo [Wis]",
      "Knowledge (art) [Int]",
      "Listen [Wis]",
      "Performance [Cha]",
      "Sense Motive [Wis]",
      "Spot [Wis]",
    ],
    description:
      "Artists and musicians create and perform works of art; they are charming and perceptive.",
  },
  {
    name: "Blue-Collar Worker",
    moneyMod: 0,
    coreSkills: [
      "Climb [Str]",
      "Craft (any one) [Int]",
      "Disable Device [Int]",
      "Drive [Dex]",
      "Gather Information [Cha]",
      "Operate Heavy Machinery [Dex]",
      "Repair [Int]",
      "Spot [Wis]",
      "Use Rope [Dex]",
    ],
    description:
      "Blue-collar workers perform manual labour and practical tasks.",
  },
  {
    name: "Criminal",
    moneyMod: -1,
    coreSkills: [
      "Bluff [Cha]",
      "Disable Device [Int]",
      "Escape Artist [Dex]",
      "Forgery [Int]",
      "Hide [Dex]",
      "Innuendo [Wis]",
      "Move Silently [Dex]",
      "Open Lock [Dex]",
      "Sleight of Hand [Dex]",
    ],
    description:
      "Criminals live outside the law and excel at stealth, deception and larceny.",
  },
  {
    name: "Detective",
    moneyMod: -1,
    coreSkills: [
      "Gather Information [Cha]",
      "Hide [Dex]",
      "Intimidate [Cha]",
      "Listen [Wis]",
      "Move Silently [Dex]",
      "Open Lock [Dex]",
      "Search [Int]",
      "Sense Motive [Wis]",
      "Spot [Wis]",
    ],
    description:
      "Detectives investigate crimes and track down perpetrators.",
  },
  {
    name: "Dilettante",
    moneyMod: 2,
    coreSkills: [
      "Diplomacy [Cha]",
      "Drive [Dex]",
      "Gather Information [Cha]",
      "Innuendo [Wis]",
      "Knowledge (art) [Int]",
      "Knowledge (local) [Int]",
      "Pilot [Dex]",
      "Ride [Dex]",
      "Speak Other Language [Int]",
    ],
    description:
      "Dilettantes are wealthy individuals who pursue a variety of interests.",
  },
  {
    name: "Doctor/Nurse",
    moneyMod: 0,
    coreSkills: [
      "Computer Use [Int]",
      "Diplomacy [Cha]",
      "Heal [Wis]",
      "Knowledge (biology) [Int]",
      "Knowledge (medicine) [Int]",
      "Knowledge (any one) [Int]",
      "Listen [Wis]",
      "Research [Int]",
      "Spot [Wis]",
    ],
    description:
      "Doctors and nurses practice medicine and provide care to the injured and sick.",
  },
  {
    name: "Parapsychologist",
    moneyMod: 0,
    coreSkills: [
      "Bluff [Cha]",
      "Gather Information [Cha]",
      "Knowledge (history) [Int]",
      "Knowledge (occult) [Int]",
      "Knowledge (religion) [Int]",
      "Listen [Wis]",
      "Search [Int]",
      "Sense Motive [Wis]",
      "Spot [Wis]",
    ],
    description:
      "Parapsychologists study the paranormal and the human mind.",
  },
  {
    name: "Priest/Clergyman",
    moneyMod: 0,
    coreSkills: [
      "Concentration [Con]",
      "Diplomacy [Cha]",
      "Knowledge (religion) [Int]",
      "Knowledge (any one) [Int]",
      "Knowledge (any one) [Int]",
      "Listen [Wis]",
      "Sense Motive [Wis]",
      "Speak Other Language [Int]",
      "Spot [Wis]",
    ],
    description:
      "Clergy members provide spiritual guidance and often have theological knowledge.",
  },
  {
    name: "Professor",
    moneyMod: 1,
    coreSkills: [
      "Concentration [Con]",
      "Diplomacy [Cha]",
      "Gather Information [Cha]",
      "Knowledge (any one) [Int]",
      "Knowledge (any one) [Int]",
      "Knowledge (any one) [Int]",
      "Research [Int]",
      "Speak Other Language [Int]",
      "Spot [Wis]",
    ],
    description:
      "Professors are academics who specialise in teaching and research.",
  },
  {
    name: "Psychologist",
    moneyMod: 0,
    coreSkills: [
      "Bluff [Cha]",
      "Diplomacy [Cha]",
      "Gather Information [Cha]",
      "Heal [Wis]",
      "Knowledge (medicine) [Int]",
      "Knowledge (psychology) [Int]",
      "Psychoanalysis [Wis]",
      "Research [Int]",
      "Sense Motive [Wis]",
    ],
    description:
      "Psychologists study human behaviour and treat mental illnesses.",
  },
  {
    name: "Soldier",
    moneyMod: -1,
    coreSkills: [
      "Climb [Str]",
      "Hide [Dex]",
      "Jump [Str]",
      "Listen [Wis]",
      "Move Silently [Dex]",
      "Spot [Wis]",
      "Swim [Str]",
      "Use Rope [Dex]",
      "Wilderness Lore [Wis]",
    ],
    description:
      "Soldiers are trained in combat and physical endurance.",
  },
  {
    name: "Technician",
    moneyMod: 0,
    coreSkills: [
      "Computer Use [Int]",
      "Craft (any one) [Int]",
      "Disable Device [Int]",
      "Knowledge (any one) [Int]",
      "Open Lock [Dex]",
      "Operate Heavy Machinery [Dex]",
      "Repair [Int]",
      "Research [Int]",
      "Search [Int]",
    ],
    description:
      "Technicians operate and maintain machinery and electronics.",
  },
  {
    name: "White-Collar Worker",
    moneyMod: 0,
    coreSkills: [
      "Bluff [Cha]",
      "Computer Use [Int]",
      "Diplomacy [Cha]",
      "Forgery [Int]",
      "Intimidate [Cha]",
      "Knowledge (any one) [Int]",
      "Listen [Wis]",
      "Sense Motive [Wis]",
      "Spot [Wis]",
    ],
    description:
      "White-collar workers are office employees skilled at administration and business.",
  },
  {
    name: "Writer/Reporter",
    moneyMod: 0,
    coreSkills: [
      "Craft (photography) [Int]",
      "Craft (writing) [Int]",
      "Diplomacy [Cha]",
      "Gather Information [Cha]",
      "Innuendo [Wis]",
      "Knowledge (any one) [Int]",
      "Knowledge (any one) [Int]",
      "Research [Int]",
      "Sense Motive [Wis]",
    ],
    description:
      "Writers and reporters craft stories and investigate leads.",
  },
];

// Define feats with their effects. Only a subset apply automatic bonuses.
const feats = [
  { name: "Acrobatic", skills: ["Jump", "Tumble"], description: "You are very agile. Benefit: +2 to Jump and Tumble checks" },
  { name: "Alertness", skills: ["Listen", "Spot"], description: "+2 to Listen and Spot checks" },
  { name: "Ambidexterity", description: "You are equally adept at using either hand. Prerequisite: Dex 15+. Benefit: You ignore all penalties for using an off hand. You are neither left-handed nor right-handed. Normal: Without this feat, a character who uses her off hand suffers a -4 penalty to attack rolls, ability checks, and skill checks. For example, if a right-handed character wields a weapon with her left hand, she suf￾fers a -4 penalty to attack rolls with that weapon. \n Special: This feat helps offset the penalty for fighting with two weapons. (Sec the Two-Weapon Fighting feat, below, and Table 5-1: Two￾Weapon Fighting Penalties, page 67.)" },
  { name: "Animal Affinity", skills: ["Handle Animal", "Ride"], description: "You are good with animals.  Benefit: +2 to Handle Animal and Ride checks" },
  { name: "Athletic", skills: ["Climb", "Swim"], description: "You have a knack for athletic endeavors.  Benefit: +2 to Climb and Swim checks" },
  { name: "Blind-Fight", description: "You know how to fight in melee without being able to see your foes. Benefit: In melee combat, every time you miss because of concealment (sec Table 5-6, page 73), you can rcroll your miss chance percentile roll once to sec if you actually hit. You take only half the usual penalty to speed for being unable to see. Dark￾ness an<l poor visibility in general reduce your speed to three-quarters normal, instead of one-half (sec Cover, page 72). " },
  { name: "Cautious", skills: ["Demolitions", "Disable Device"], description: "You are especially careful with tasks that may yield catastrpic results.  Benefit: +2 to Demolitions and Disable Device checks" },
  { name: "Cleave", description: "You can follow through with a powerful melee attack. Prerequisite: Str 13+, Power Attack. Benefit: If you deal an opponent enough damage to reduce its hit points to 0, you get an immediate extra melee attack against another opponent within your reach. You cannot take a 5-foot step before making this extra attack. The extra attack is with the same weapon and at the same bonus as the attack that dropped the previous opponent. You can use this ability once per round ." },
  { name: "Combat Casting", skills: ["Concentration"], description: "You are adept at casting spells in combat. Benefit: +4 to Concentration checks for defensive casting" },
  { name: "Dodge", description: "+1 dodge bonus to AC" },
  { name: "Endurance", description: "+4 on checks to avoid subdual damage" },
  { name: "Gearhead", skills: ["Computer Use", "Repair"], description: "+2 to Computer Use and Repair checks" },
  { name: "Great Fortitude", saves: { fort: 2 }, description: "+2 on Fortitude saves" },
  { name: "Improved Initiative", description: "+4 bonus to initiative" },
  { name: "Iron Will", saves: { will: 2 }, description: "+2 on Will saves" },
  { name: "Lightning Reflexes", saves: { ref: 2 }, description: "+2 on Reflex saves" },
  { name: "Martial Artist", description: "Improved unarmed attack damage" },
  { name: "Nimble", skills: ["Escape Artist", "Sleight of Hand"], description: "+2 to Escape Artist and Sleight of Hand checks" },
  { name: "Persuasive", skills: ["Bluff", "Intimidate"], description: "+2 to Bluff and Intimidate checks" },
  { name: "Point Blank Shot", description: "+1 attack and damage on ranged attacks within 30 ft." },
  { name: "Precise Shot", description: "No penalty for shooting into melee" },
  { name: "Rapid Shot", description: "Extra ranged attack at -2 penalty" },
  { name: "Power Attack", description: "Trade attack bonus for damage" },
  { name: "Cleave", description: "Extra attack after dropping opponent" },
  { name: "Quick Draw", description: "Draw weapon as a free action" },
  { name: "Run", description: "Run faster and longer" },
  { name: "Sharp-Eyed", skills: ["Spot", "Search"], description: "+2 to Spot and Search checks" },
  { name: "Skill Emphasis", description: "+3 bonus on one selected skill" },
  { name: "Stealthy", skills: ["Hide", "Move Silently"], description: "+2 to Hide and Move Silently checks" },
  { name: "Toughness", hp: 3, description: "+3 hit points" },
  { name: "Track", description: "Allows tracking using Wilderness Lore" },
  { name: "Trustworthy", skills: ["Diplomacy", "Gather Information"], description: "+2 to Diplomacy and Gather Information checks" },
  { name: "Two-Weapon Fighting", description: "Reduces penalties for dual wielding" },
  { name: "Weapon Finesse", description: "Use Dex instead of Str for attack rolls with light weapons" },
  { name: "Weapon Focus", description: "+1 bonus on attack rolls with selected weapon" },
];

// Money base amounts by era. The starting money is (1d6 + moneyMod) × base【878580011413210†L210-L224】.
const moneyBaseByEra = {
  "1901-1920": 1000,
  "1921-1940": 2000,
  "1941-1960": 4000,
  "1961-1980": 4000,
  "1981+": 6000,
};

// Synergy bonuses: Skills with 5+ ranks grant +2 to related skills (rulebook page 22, Table 2-4)
const synergyBonuses = {
  "Balance": ["Jump", "Tumble"],
  "Bluff": ["Diplomacy", "Intimidate", "Sleight of Hand"],
  "Climb": ["Use Rope"],
  "Craft": ["Appraise"],
  "Handle Animal": ["Ride"],
  "Jump": ["Tumble"],
  "Knowledge": ["Research"],
  "Sense Motive": ["Diplomacy"],
  "Tumble": ["Balance", "Jump"],
  "Use Rope": ["Climb", "Escape Artist"]
};

// Global state to store ability mods, selected feats, etc.
let abilityMods = {};

// Initialise the sheet on page load
window.addEventListener("DOMContentLoaded", () => {
  populateAbilities();
  populateSkills();
  populateProfessions();
  populateFeats();
  populateSavedCharacters();
  attachEventHandlers();
  updateAll();
});

/**
 * Populate the abilities table with input fields and modifier cells.
 */
function populateAbilities() {
  const tbody = document.getElementById("abilitiesBody");
  tbody.innerHTML = "";
  abilities.forEach((ability) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ability.name}</td>
      <td><input type="number" class="ability-score" data-ability="${ability.short}" min="1" value="10" /></td>
      <td class="ability-mod" data-ability="${ability.short}">0</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Populate the skills table with rows containing ranks, misc and total columns.
 */
function populateSkills() {
  const tbody = document.getElementById("skillsBody");
  tbody.innerHTML = "";
  skills.forEach((skill, index) => {
    const tr = document.createElement("tr");
    tr.dataset.skillIndex = index;

    // Add trained-only indicator
    const trainedIndicator = skill.trainedOnly ? '<span class="trained-only-badge" title="Trained Only: Requires at least 1 rank to use">⚠</span>' : '';

    tr.innerHTML = `
      <td class="skill-name">${skill.name}${trainedIndicator}</td>
      <td>${skill.ability || "—"}</td>
      <td class="core-skill-checkbox-cell">
        <input type="checkbox" class="skill-core-checkbox" data-skill-index="${index}" title="Mark as additional core skill for your profession" />
      </td>
      <td><input type="number" class="skill-ranks" min="0" placeholder="0" /></td>
      <td><input type="number" class="skill-misc" placeholder="0" /></td>
      <td class="skill-total">0</td>
    `;
    tbody.appendChild(tr);
  });

  // Add focus handlers to select all text on click
  document.querySelectorAll(".skill-ranks, .skill-misc").forEach((input) => {
    input.addEventListener("focus", function() {
      this.select();
    });
    input.addEventListener("click", function() {
      this.select();
    });
  });

  // Add validation for skill ranks to prevent exceeding limits
  document.querySelectorAll(".skill-ranks").forEach((input) => {
    input.addEventListener("input", function() {
      const newValue = parseInt(this.value) || 0;
      const level = parseInt(document.getElementById("level").value) || 1;
      const maxRanksPerSkill = level + 3;
      const totalAvailable = calculateTotalSkillPoints();
      const currentSpent = calculateSkillPointsSpent();

      // Check per-skill rank maximum (Level + 3)
      if (newValue > maxRanksPerSkill) {
        this.value = maxRanksPerSkill;
        alert(`Maximum skill ranks exceeded! At level ${level}, you can have at most ${maxRanksPerSkill} ranks in any skill (Level + 3).`);
        return;
      }

      // Check total skill points limit
      if (currentSpent > totalAvailable) {
        // Calculate how much we can set this field to without exceeding
        const otherSpent = currentSpent - newValue;
        const maxAllowed = Math.max(0, totalAvailable - otherSpent);

        // Only intervene if user is actively increasing beyond limit
        if (newValue > maxAllowed && newValue > (parseInt(this.getAttribute('data-previous-value')) || 0)) {
          this.value = maxAllowed;
          alert(`Skill point limit reached! You have ${totalAvailable} total skill points available (8 + Int modifier × level). You can only allocate ${maxAllowed} more ranks to this skill.`);
        }
      }

      // Store current value for next comparison
      this.setAttribute('data-previous-value', this.value);
    });
  });
}

/**
 * Populate the profession dropdown and attach change event to update core skills and money.
 */
function populateProfessions() {
  const select = document.getElementById("profession");
  select.innerHTML = "";
  professions.forEach((prof, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = prof.name;
    select.appendChild(option);
  });
  // Populate profession info on change
  select.addEventListener("change", () => {
    updateProfessionInfo();
    updateMoney();
    updateSkillsHighlight();
  });
  // Set default profession
  select.value = 0;
  updateProfessionInfo();
}

/**
 * Display information about the selected profession including its core skills and description.
 * Also auto-check the core skill checkboxes for the profession's pre-defined skills.
 */
function updateProfessionInfo() {
  const profIndex = parseInt(document.getElementById("profession").value);
  const prof = professions[profIndex];
  const infoDiv = document.getElementById("profession-info");
  const coreList = prof.coreSkills.map((s) => `<li>${s}</li>`).join("");
  infoDiv.innerHTML = `<p><strong>Core Skills:</strong></p><ul>${coreList}</ul><p style="font-style: italic; color: #666; margin-top: 0.5rem;">+ three more skills of your choice</p><p class="desc">${prof.description}</p>`;

  // Update core skill checkboxes: disable and check profession core skills
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const skill = skills[index];
    const coreCheckbox = row.querySelector(".skill-core-checkbox");

    if (prof.coreSkills.includes(skill.name)) {
      // Pre-defined profession skill: check and disable checkbox
      coreCheckbox.checked = true;
      coreCheckbox.disabled = true;
      coreCheckbox.title = "This is a pre-defined core skill for your profession";
    } else {
      // Not a pre-defined skill: enable checkbox for user selection
      coreCheckbox.disabled = false;
      coreCheckbox.title = "Mark as additional core skill for your profession";
    }
  });
}

/**
 * Populate the feats section with checkboxes. Selected feats impact saves, HP and skills.
 */
function populateFeats() {
  const container = document.getElementById("featsContainer");
  container.innerHTML = "";
  feats.forEach((feat, idx) => {
    const id = `feat_${idx}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.title = feat.description;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.dataset.featIndex = idx;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(feat.name));
    container.appendChild(label);
  });
}

/**
 * Populate the saved character select list from localStorage.
 */
function populateSavedCharacters() {
  const select = document.getElementById("characterSelect");
  select.innerHTML = "";
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  Object.keys(stored).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.appendChild(option);
  });
}

/**
 * Attach event handlers to various inputs for dynamic updates and storage actions.
 */
function attachEventHandlers() {
  // Ability score changes
  document.querySelectorAll(".ability-score").forEach((input) => {
    input.addEventListener("input", () => {
      updateAbilityMods();
      updateDerivedStats();
      updateSkillsTotals();
      updateSkillPointsTracker();
    });
  });
  // Level changes
  let previousLevel = parseInt(document.getElementById("level").value) || 1;
  document.getElementById("level").addEventListener("input", () => {
    const newLevel = parseInt(document.getElementById("level").value) || 1;

    // Check if level increased (character leveled up)
    if (newLevel > previousLevel) {
      applySanityGainOnLevelUp();
    }
    previousLevel = newLevel;

    updateDerivedStats();
    updateSkillPointsTracker();
    updateFeatCounter();
  });
  // HP changes - auto-set current HP to max HP if empty or 0
  document.getElementById("hitPoints").addEventListener("input", () => {
    const maxHP = parseInt(document.getElementById("hitPoints").value) || 0;
    const currentHPInput = document.getElementById("currentHP");
    const currentValue = parseInt(currentHPInput.value) || 0;
    // Only auto-set if current is 0 or empty
    if (currentValue === 0 || currentHPInput.value.trim() === "") {
      currentHPInput.value = maxHP;
    }
    updateGameplayPanel();
  });
  // Auto-calculate HP button
  document.getElementById("autoCalcHPBtn").addEventListener("click", () => {
    autoCalculateHP();
  });
  // Attack option changes
  document.getElementById("attackOption").addEventListener("change", () => {
    // Reset good save checkboxes
    document.getElementById("goodFort").checked = false;
    document.getElementById("goodRef").checked = false;
    document.getElementById("goodWill").checked = false;
    updateDerivedStats();
  });
  // Good save selections update derived stats
  ["goodFort", "goodRef", "goodWill"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      updateDerivedStats();
    });
  });
  // Era changes
  document.getElementById("era").addEventListener("change", () => {
    updateMoney();
  });
  // Age category changes
  document.getElementById("ageCategory").addEventListener("change", () => {
    updateAbilityMods();
    updateDerivedStats();
    updateSkillsTotals();
    updateSkillPointsTracker();
  });
  // Skill input changes
  document.querySelectorAll(".skill-ranks, .skill-misc").forEach((input) => {
    input.addEventListener("input", () => {
      updateSkillsTotals();
      updateDerivedStats();
      updateSkillPointsTracker();
    });
  });
  // Core skill checkbox changes
  document.querySelectorAll(".skill-core-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateSkillsTotals();
      updateSkillsHighlight();
    });
  });
  // Feat selections
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateDerivedStats();
      updateSkillsTotals();
      updateSelectedFeatsSummary();
      updateFeatCounter();
    });
  });
  // Save character
  document.getElementById("saveButton").addEventListener("click", () => saveCharacter());
  // Load character
  document.getElementById("loadButton").addEventListener("click", () => loadCharacter());
  // Delete character
  document.getElementById("deleteButton").addEventListener("click", () => deleteCharacter());
  // Ability score reroll checks
  document.getElementById("checkRerollBtn").addEventListener("click", () => checkIfRerollNeeded());
  document.getElementById("rerollAllBtn").addEventListener("click", () => rerollAllAbilities());
}

/**
 * Check if ability scores are too low and qualify for a reroll.
 * Per rulebook page 7: Reroll if total modifiers ≤ 0 OR highest score ≤ 13
 */
function checkIfRerollNeeded() {
  updateAbilityMods();

  let totalMods = 0;
  let highestScore = 0;
  let scores = [];

  document.querySelectorAll(".ability-score").forEach((input) => {
    const score = parseInt(input.value) || 10;
    const ability = input.dataset.ability;
    const mod = abilityMods[ability] || 0;

    totalMods += mod;
    highestScore = Math.max(highestScore, score);
    scores.push(score);
  });

  const messageDiv = document.getElementById("rerollMessage");

  if (totalMods <= 0 || highestScore <= 13) {
    messageDiv.innerHTML = `<strong>⚠️ Reroll Recommended!</strong><br>
      Total modifiers: ${totalMods >= 0 ? '+' : ''}${totalMods} ${totalMods <= 0 ? '(≤ 0)' : ''}<br>
      Highest score: ${highestScore} ${highestScore <= 13 ? '(≤ 13)' : ''}<br>
      <em>Per rulebook page 7, you may reroll all six scores.</em>`;
    messageDiv.className = "reroll-message warning";
  } else {
    messageDiv.innerHTML = `<strong>✓ Scores are acceptable!</strong><br>
      Total modifiers: ${totalMods >= 0 ? '+' : ''}${totalMods}<br>
      Highest score: ${highestScore}<br>
      <em>No reroll needed.</em>`;
    messageDiv.className = "reroll-message success";
  }
}

/**
 * Reroll all ability scores using 4d6 drop lowest method.
 */
function rerollAllAbilities() {
  if (!confirm("This will replace all current ability scores with new random rolls (4d6 drop lowest). Continue?")) {
    return;
  }

  document.querySelectorAll(".ability-score").forEach((input) => {
    const newScore = roll4d6DropLowest();
    input.value = newScore;
  });

  updateAbilityMods();
  updateDerivedStats();
  updateSkillsTotals();
  updateSkillPointsTracker();

  alert("All ability scores have been rerolled!");

  // Automatically check if another reroll is needed
  checkIfRerollNeeded();
}

/**
 * Roll 4d6 and drop the lowest die.
 * @returns {number} The sum of the three highest dice
 */
function roll4d6DropLowest() {
  const rolls = [];
  for (let i = 0; i < 4; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }
  rolls.sort((a, b) => a - b);
  // Drop the lowest (first element after sort) and sum the rest
  return rolls[1] + rolls[2] + rolls[3];
}

/**
 * Update ability modifiers based on current scores and age.
 * Modifier = floor((score + age modifier - 10) / 2).
 */
function updateAbilityMods() {
  abilityMods = {};
  const ageModifiers = getAgeModifiers();

  document.querySelectorAll(".ability-score").forEach((input) => {
    const baseScore = parseInt(input.value) || 0;
    const ability = input.dataset.ability;
    const ageMod = ageModifiers[ability] || 0;
    const adjustedScore = baseScore + ageMod;
    const mod = Math.floor((adjustedScore - 10) / 2);
    abilityMods[ability] = mod;
    const modCell = document.querySelector(`.ability-mod[data-ability='${ability}']`);
    if (modCell) modCell.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
  });

  updateAgeModifiersDisplay();
}

/**
 * Compute and update derived stats: base attack bonus, saves, sanity and HP.
 */
function updateDerivedStats() {
  const level = parseInt(document.getElementById("level").value) || 1;
  const attackOption = document.getElementById("attackOption").value;
  const goodSaves = {
    fort: document.getElementById("goodFort").checked,
    ref: document.getElementById("goodRef").checked,
    will: document.getElementById("goodWill").checked,
  };
  updateAbilityMods();
  const featBonuses = getFeatBonuses();
  // Compute saves
  const saves = computeSaves(level, attackOption, goodSaves, featBonuses);
  document.getElementById("fortSave").textContent = saves.fort;
  document.getElementById("refSave").textContent = saves.ref;
  document.getElementById("willSave").textContent = saves.will;
  // Compute base attack
  const baseAttackStr = computeBaseAttack(level, attackOption);
  document.getElementById("baseAttack").textContent = baseAttackStr;
  // Display HP bonus from feats without modifying the player's base HP value. If
  // the Toughness feat is selected, hpBonus will be +3; otherwise 0.
  const hpBonusNote = document.getElementById("hpBonusNote");
  const hpBonus = featBonuses.hp || 0;
  if (hpBonus > 0) {
    hpBonusNote.textContent = `Feat Bonus: +${hpBonus} HP (from Toughness)`;
  } else {
    hpBonusNote.textContent = "";
  }
  // Update HP calculation helper
  updateHPCalculation();
  // Sanity calculations
  updateSanity();
}

/**
 * Compute saving throws. Good saves use the progression 2 + floor(level / 2),
 * bad saves use floor(level / 3)【878580011413210†L107-L120】. Add relevant ability
 * modifiers and feat bonuses.
 * @returns {Object} {fort, ref, will}
 */
function computeSaves(level, attackOption, goodSaves, featBonuses) {
  function goodSaveValue() {
    return 2 + Math.floor(level / 2);
  }
  function badSaveValue() {
    return Math.floor(level / 3);
  }
  // Determine good save counts based on option: offense has 1 good save, defense has 2
  const desiredGoodCount = attackOption === "offense" ? 1 : 2;
  // Count selected good saves; enforce limit
  const selected = Object.values(goodSaves).filter(Boolean).length;
  if (selected > desiredGoodCount) {
    // If too many selected, deselect extras (starting from Will)
    ["will", "ref", "fort"].forEach((type) => {
      if (goodSaves[type] && Object.values(goodSaves).filter(Boolean).length > desiredGoodCount) {
        goodSaves[type] = false;
        document.getElementById(`good${capitalize(type)}`).checked = false;
      }
    });
  }
  // Compute each save
  const fortBase = goodSaves.fort ? goodSaveValue() : badSaveValue();
  const refBase = goodSaves.ref ? goodSaveValue() : badSaveValue();
  const willBase = goodSaves.will ? goodSaveValue() : badSaveValue();
  // Add ability modifiers
  const fort = fortBase + (abilityMods.Con || 0) + (featBonuses.saves?.fort || 0);
  const ref = refBase + (abilityMods.Dex || 0) + (featBonuses.saves?.ref || 0);
  const will = willBase + (abilityMods.Wis || 0) + (featBonuses.saves?.will || 0);
  return {
    fort: fort >= 0 ? `+${fort}` : `${fort}`,
    ref: ref >= 0 ? `+${ref}` : `${ref}`,
    will: will >= 0 ? `+${will}` : `${will}`,
  };
}

/**
 * Compute the base attack bonus string given level and option. Offense option uses
 * full level for attack bonus; Defense option uses half level【878580011413210†L107-L120】.
 * Second, third and fourth attacks occur at -5 increments when base attack
 * exceeds certain thresholds.
 */
function computeBaseAttack(level, attackOption) {
  let primary;
  if (attackOption === "offense") {
    primary = level;
  } else {
    primary = Math.floor(level / 2);
  }
  const attacks = [];
  if (primary > 0) attacks.push(primary);
  if (primary - 5 > 0) attacks.push(primary - 5);
  if (primary - 10 > 0) attacks.push(primary - 10);
  if (primary - 15 > 0) attacks.push(primary - 15);
  return attacks
    .map((val) => (val >= 0 ? `+${val}` : `${val}`))
    .join("/");
}

/**
 * Update the starting money display based on profession, money modifier and era.
 */
function updateMoney() {
  const profIndex = parseInt(document.getElementById("profession").value);
  const prof = professions[profIndex];
  const era = document.getElementById("era").value;
  const base = moneyBaseByEra[era] || 0;
  // Roll 1d6
  const roll = Math.floor(Math.random() * 6) + 1;
  let multiplier = roll + prof.moneyMod;
  if (multiplier < 1) multiplier = 1;
  const starting = multiplier * base;
  document.getElementById("startingMoney").textContent = `$${starting.toLocaleString()}`;
}

/**
 * Calculate recommended HP based on level and Constitution modifier.
 * 1st level: 6 (max d6) + Con mod
 * Subsequent levels: Average of 3.5 per level + Con mod
 * @returns {number} Calculated HP
 */
function calculateRecommendedHP() {
  const level = parseInt(document.getElementById("level").value) || 1;
  const conMod = abilityMods.Con || 0;
  const featBonuses = getFeatBonuses();
  const hpBonus = featBonuses.hp || 0;

  // First level: max d6 (6) + Con mod
  let hp = 6 + conMod;

  // Subsequent levels: average of 3.5 per level + Con mod per level
  if (level > 1) {
    hp += Math.floor((level - 1) * 3.5) + (conMod * (level - 1));
  }

  // Add feat bonuses
  hp += hpBonus;

  return Math.max(1, hp); // Minimum 1 HP
}

/**
 * Update HP calculation display showing recommended HP
 */
function updateHPCalculation() {
  const recommendedHP = calculateRecommendedHP();
  const level = parseInt(document.getElementById("level").value) || 1;
  const conMod = abilityMods.Con || 0;
  const conModText = conMod >= 0 ? `+${conMod}` : `${conMod}`;

  let calcText = `Recommended: <strong>${recommendedHP} HP</strong> `;
  if (level === 1) {
    calcText += `(6 + Con ${conModText})`;
  } else {
    calcText += `(6 + ${level - 1}×avg(d6) + ${level}×Con ${conModText})`;
  }

  document.getElementById("hpCalculation").innerHTML = calcText;
}

/**
 * Auto-calculate and set HP to recommended value
 */
function autoCalculateHP() {
  const recommendedHP = calculateRecommendedHP();
  document.getElementById("hitPoints").value = recommendedHP;
  document.getElementById("currentHP").value = recommendedHP;
  updateGameplayPanel();
}

/**
 * Calculate and update sanity values. Starting Sanity = Wisdom × 5 and maximum
 * sanity = 99 − Cthulhu Mythos skill ranks【567432723370824†L3170-L3239】. 20% sanity
 * threshold is 20% of current maximum (rounded down).
 * Auto-sets current sanity to starting sanity if empty.
 */
function updateSanity() {
  const wisScore = parseInt(document.querySelector(".ability-score[data-ability='Wis']").value) || 0;
  const startingSanity = wisScore * 5;
  // Find Cthulhu Mythos ranks
  let mythosRanks = 0;
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const skillName = row.querySelector(".skill-name").textContent;
    if (skillName === "Cthulhu Mythos") {
      mythosRanks = parseInt(row.querySelector(".skill-ranks").value) || 0;
    }
  });
  const maxSanity = 99 - mythosRanks;
  const twentyPercent = Math.floor(maxSanity * 0.2);
  document.getElementById("sanityStarting").textContent = startingSanity;
  document.getElementById("sanityMax").textContent = maxSanity;
  document.getElementById("sanity20").textContent = twentyPercent;

  // Auto-set current sanity to starting sanity if empty or 0
  const currentSanityInput = document.getElementById("currentSanity");
  const currentSanityValue = parseInt(currentSanityInput.value) || 0;
  // Only auto-set if current is 0 or empty
  if (currentSanityValue === 0 || currentSanityInput.value.trim() === "") {
    currentSanityInput.value = startingSanity;
  }
}

/**
 * Apply 1d6 Sanity gain when character levels up.
 * Per rulebook pages 50-51: Characters gain 1d6 Sanity points when gaining a level.
 */
function applySanityGainOnLevelUp() {
  const currentSanityInput = document.getElementById("currentSanity");
  const currentSanity = parseInt(currentSanityInput.value) || 0;
  const maxSanity = parseInt(document.getElementById("sanityMax").textContent) || 99;

  // Roll 1d6
  const sanityGain = Math.floor(Math.random() * 6) + 1;
  const newSanity = Math.min(maxSanity, currentSanity + sanityGain);

  currentSanityInput.value = newSanity;
  updateGameplayPanel();

  // Show notification
  alert(`Level Up! You gained ${sanityGain} Sanity points (rolled 1d6).\nCurrent Sanity: ${currentSanity} → ${newSanity}`);
}

/**
 * Gather selected feat bonuses for saves, HP and skills.
 * @returns {Object} e.g. { saves: { fort:2, ref:2, will:0 }, hp:3, skills: { Listen:2, Spot:2 } }
 */
function getFeatBonuses() {
  const bonuses = { saves: {}, skills: {}, hp: 0 };
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((cb) => {
    if (cb.checked) {
      const feat = feats[parseInt(cb.dataset.featIndex)];
      // Save bonuses
      if (feat.saves) {
        Object.keys(feat.saves).forEach((key) => {
          bonuses.saves[key] = (bonuses.saves[key] || 0) + feat.saves[key];
        });
      }
      // HP bonus
      if (feat.hp) {
        bonuses.hp += feat.hp;
      }
      // Skill bonuses
      if (feat.skills) {
        feat.skills.forEach((sk) => {
          bonuses.skills[sk] = (bonuses.skills[sk] || 0) + 2;
        });
      }
    }
  });
  return bonuses;
}

/**
 * Calculate synergy bonuses for all skills.
 * Skills with 5+ ranks grant +2 to related skills.
 * @returns {Object} Map of skill names to synergy bonuses
 */
function calculateSynergyBonuses() {
  const bonuses = {};

  // First pass: check which skills have 5+ ranks
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const skill = skills[index];
    const ranks = parseInt(row.querySelector(".skill-ranks").value) || 0;

    // If this skill has 5+ ranks and grants synergy bonuses
    if (ranks >= 5 && synergyBonuses[skill.name]) {
      synergyBonuses[skill.name].forEach((targetSkill) => {
        bonuses[targetSkill] = (bonuses[targetSkill] || 0) + 2;
      });
    }
  });

  return bonuses;
}

/**
 * Update the totals for all skills. Total = ranks + ability mod + misc + feat bonus + synergy bonus.
 * Also highlight profession core skills (both pre-defined and user-marked).
 */
function updateSkillsTotals() {
  const featBonuses = getFeatBonuses();
  const synergyBonuses = calculateSynergyBonuses();
  const prof = professions[parseInt(document.getElementById("profession").value)];

  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const skill = skills[index];
    // Determine base numbers
    const ranks = parseInt(row.querySelector(".skill-ranks").value) || 0;
    const misc = parseInt(row.querySelector(".skill-misc").value) || 0;
    const abilityCode = skill.ability;
    const abilityMod = abilityCode ? (abilityMods[abilityCode] || 0) : 0;
    const featBonus = featBonuses.skills[skill.name] || 0;
    const synergyBonus = synergyBonuses[skill.name] || 0;
    const total = ranks + misc + abilityMod + featBonus + synergyBonus;
    const totalCell = row.querySelector(".skill-total");
    totalCell.textContent = total >= 0 ? `+${total}` : `${total}`;

    // Add synergy indicator if applicable
    if (synergyBonus > 0) {
      totalCell.title = `Includes +${synergyBonus} synergy bonus`;
      totalCell.classList.add("has-synergy");
    } else {
      totalCell.title = "";
      totalCell.classList.remove("has-synergy");
    }

    // Highlight profession core skills (pre-defined OR user-marked as core)
    const coreCheckbox = row.querySelector(".skill-core-checkbox");
    const isUserMarkedCore = coreCheckbox && coreCheckbox.checked;
    const isProfessionCore = prof.coreSkills.includes(skill.name);

    if (isProfessionCore || isUserMarkedCore) {
      row.classList.add("profession-skill");
    } else {
      row.classList.remove("profession-skill");
    }
  });
}

/**
 * Highlight profession core skills when profession changes.
 */
function updateSkillsHighlight() {
  updateSkillsTotals();
}

/**
 * Save current character to localStorage. Characters are stored in a single
 * object keyed by the character's name.
 */
function saveCharacter() {
  updateAll();
  const name = document.getElementById("charName").value.trim();
  if (!name) {
    alert("Please enter a character name before saving.");
    return;
  }
  // Build character object
  const character = {
    playerName: document.getElementById("playerName").value,
    age: document.getElementById("age").value,
    ageCategory: document.getElementById("ageCategory").value,
    gender: document.getElementById("gender").value,
    profession: parseInt(document.getElementById("profession").value),
    level: document.getElementById("level").value,
    attackOption: document.getElementById("attackOption").value,
    goodSaves: {
      fort: document.getElementById("goodFort").checked,
      ref: document.getElementById("goodRef").checked,
      will: document.getElementById("goodWill").checked,
    },
    era: document.getElementById("era").value,
    hitPoints: document.getElementById("hitPoints").value,
    currentHP: document.getElementById("currentHP").value,
    currentSanity: document.getElementById("currentSanity").value,
    insanityState: document.getElementById("insanityState").value,
    abilities: {},
    skills: [],
    feats: [],
  };
  // Abilities
  document.querySelectorAll(".ability-score").forEach((input) => {
    character.abilities[input.dataset.ability] = input.value;
  });
  // Skills
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const ranks = row.querySelector(".skill-ranks").value;
    const misc = row.querySelector(".skill-misc").value;
    const coreCheckbox = row.querySelector(".skill-core-checkbox");
    const isCustomCore = coreCheckbox && coreCheckbox.checked && !coreCheckbox.disabled;
    character.skills.push({ index, ranks, misc, isCustomCore });
  });
  // Feats
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((cb) => {
    if (cb.checked) character.feats.push(parseInt(cb.dataset.featIndex));
  });
  // Load existing storage, update and save
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  stored[name] = character;
  localStorage.setItem("cocd20_characters", JSON.stringify(stored));
  populateSavedCharacters();
  alert(`Character '${name}' saved.`);
}

/**
 * Load the selected character from localStorage and populate fields. If no
 * character is selected, do nothing.
 */
function loadCharacter() {
  const select = document.getElementById("characterSelect");
  const name = select.value;
  if (!name) {
    alert("Select a character to load.");
    return;
  }
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  const character = stored[name];
  if (!character) return;
  document.getElementById("charName").value = name;
  document.getElementById("playerName").value = character.playerName;
  document.getElementById("age").value = character.age;
  document.getElementById("ageCategory").value = character.ageCategory || "young";
  document.getElementById("gender").value = character.gender;
  document.getElementById("profession").value = character.profession;
  updateProfessionInfo();
  document.getElementById("level").value = character.level;
  document.getElementById("attackOption").value = character.attackOption;
  document.getElementById("goodFort").checked = character.goodSaves.fort;
  document.getElementById("goodRef").checked = character.goodSaves.ref;
  document.getElementById("goodWill").checked = character.goodSaves.will;
  document.getElementById("era").value = character.era;
  document.getElementById("hitPoints").value = character.hitPoints;
  document.getElementById("currentHP").value = character.currentHP;
  document.getElementById("currentSanity").value = character.currentSanity;
  document.getElementById("insanityState").value = character.insanityState || "sane";
  // Abilities
  document.querySelectorAll(".ability-score").forEach((input) => {
    input.value = character.abilities[input.dataset.ability] || 10;
  });
  // Skills
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const data = character.skills.find((s) => parseInt(s.index) === index);
    if (data) {
      row.querySelector(".skill-ranks").value = data.ranks;
      row.querySelector(".skill-misc").value = data.misc;
      const coreCheckbox = row.querySelector(".skill-core-checkbox");
      if (coreCheckbox && !coreCheckbox.disabled && data.isCustomCore) {
        coreCheckbox.checked = true;
      }
    }
  });
  // Feats
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((cb) => {
    const idx = parseInt(cb.dataset.featIndex);
    cb.checked = character.feats.includes(idx);
  });
  updateAll();
  updateSelectedFeatsSummary();
  alert(`Character '${name}' loaded.`);
}

/**
 * Delete the selected character from storage.
 */
function deleteCharacter() {
  const select = document.getElementById("characterSelect");
  const name = select.value;
  if (!name) {
    alert("Select a character to delete.");
    return;
  }
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  if (stored[name]) {
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    delete stored[name];
    localStorage.setItem("cocd20_characters", JSON.stringify(stored));
    populateSavedCharacters();
    alert(`Character '${name}' deleted.`);
  }
}

/**
 * Update all calculated fields. Called after loading or saving characters and
 * when the page first loads.
 */
function updateAll() {
  updateAbilityMods();
  updateSkillsTotals();
  updateDerivedStats();
  updateMoney();
  updateSkillPointsTracker();
  updateFeatCounter();
  updateInsanityNotes();
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get age-based ability score modifiers based on age category.
 * Young Adult: No modifiers
 * Middle Age: -1 Str, Dex, Con; +1 Int, Wis, Cha
 * Old: -3 Str, Dex, Con; +2 Int, Wis, Cha
 * Venerable: -6 Str, Dex, Con; +3 Int, Wis, Cha
 * @returns {Object} Modifiers for each ability
 */
function getAgeModifiers() {
  const ageCategory = document.getElementById("ageCategory").value;
  const modifiers = {
    Str: 0, Dex: 0, Con: 0, Int: 0, Wis: 0, Cha: 0
  };

  switch (ageCategory) {
    case "middle":
      modifiers.Str = -1;
      modifiers.Dex = -1;
      modifiers.Con = -1;
      modifiers.Int = 1;
      modifiers.Wis = 1;
      modifiers.Cha = 1;
      break;
    case "old":
      modifiers.Str = -3;
      modifiers.Dex = -3;
      modifiers.Con = -3;
      modifiers.Int = 2;
      modifiers.Wis = 2;
      modifiers.Cha = 2;
      break;
    case "venerable":
      modifiers.Str = -6;
      modifiers.Dex = -6;
      modifiers.Con = -6;
      modifiers.Int = 3;
      modifiers.Wis = 3;
      modifiers.Cha = 3;
      break;
    default: // "young"
      // No modifiers
      break;
  }

  return modifiers;
}

/**
 * Update the age modifiers display note
 */
function updateAgeModifiersDisplay() {
  const ageCategory = document.getElementById("ageCategory").value;
  const noteDiv = document.getElementById("ageModifiersNote");

  if (ageCategory === "young") {
    noteDiv.classList.remove("active");
    noteDiv.innerHTML = "";
    return;
  }

  const modifiers = getAgeModifiers();
  let modText = [];

  if (modifiers.Str < 0) {
    modText.push(`<strong>Physical:</strong> ${modifiers.Str} Str, ${modifiers.Dex} Dex, ${modifiers.Con} Con`);
  }
  if (modifiers.Int > 0) {
    modText.push(`<strong>Mental:</strong> +${modifiers.Int} Int, +${modifiers.Wis} Wis, +${modifiers.Cha} Cha`);
  }

  noteDiv.innerHTML = `<strong>Age Modifiers Applied:</strong> ${modText.join(" | ")}`;
  noteDiv.classList.add("active");
}

/**
 * Calculate total available skill points based on level and Intelligence modifier.
 * Call of Cthulhu d20 uses 8 + Int modifier per level.
 * At 1st level, characters get 4× the normal amount (standard d20 rule).
 * Formula: (8 + Int) × 4 at 1st level, then (8 + Int) per additional level
 * Simplified: (8 + Int) × (level + 3)
 * @returns {number} Total skill points available
 */
function calculateTotalSkillPoints() {
  const level = parseInt(document.getElementById("level").value) || 1;
  const intMod = abilityMods.Int || 0;
  const basePoints = 8 + intMod;

  // 1st level gets 4x, subsequent levels get 1x
  // Total = (base × 4) + (base × (level - 1))
  // Simplified = base × (level + 3)
  return basePoints * (level + 3);
}

/**
 * Calculate total skill points spent by summing all skill ranks.
 * @returns {number} Total skill points spent
 */
function calculateSkillPointsSpent() {
  let total = 0;
  document.querySelectorAll(".skill-ranks").forEach((input) => {
    total += parseInt(input.value) || 0;
  });
  return total;
}

/**
 * Calculate total feats available based on level.
 * Characters get 2 feats at 1st level, then 1 more at 3rd, 6th, 9th, etc. (every 3 levels)
 * Per rulebook page 38: "Each character gets two feats when the character is created"
 * @returns {number} Total feats available
 */
function calculateTotalFeats() {
  const level = parseInt(document.getElementById("level").value) || 1;
  // 2 feats at 1st level, +1 at 3rd, 6th, 9th, 12th, 15th, 18th
  return 2 + Math.floor(level / 3);
}

/**
 * Update the feat counter display
 */
function updateFeatCounter() {
  const totalAvailable = calculateTotalFeats();
  const selectedCount = document.querySelectorAll("#featsContainer input[type=checkbox]:checked").length;

  document.getElementById("featCounterTotal").textContent = totalAvailable;
  document.getElementById("featCounterCurrent").textContent = selectedCount;

  const level = parseInt(document.getElementById("level").value) || 1;
  let noteText = `(2 at 1st level`;
  if (level >= 3) {
    noteText += `, +1 every 3 levels`;
  }
  noteText += `)`;
  document.getElementById("featCounterNote").textContent = noteText;

  const counterDiv = document.getElementById("featCounter");
  if (selectedCount > totalAvailable) {
    counterDiv.classList.add("over-limit");
  } else {
    counterDiv.classList.remove("over-limit");
  }
}

/**
 * Update the skill points tracker display with current/total and remaining.
 * Shows warning if over limit.
 */
function updateSkillPointsTracker() {
  const totalAvailable = calculateTotalSkillPoints();
  const spent = calculateSkillPointsSpent();
  const remaining = totalAvailable - spent;

  // Update display elements
  document.getElementById("skillPointsTotal").textContent = totalAvailable;
  document.getElementById("skillPointsUsed").textContent = spent;

  const remainingText = remaining >= 0 ? `(${remaining} remaining)` : `(${Math.abs(remaining)} over limit!)`;
  document.getElementById("skillPointsRemaining").textContent = remainingText;

  // Update styling based on whether over limit
  const tracker = document.getElementById("skillPointsTracker");
  if (remaining < 0) {
    tracker.classList.add("over-limit");
  } else {
    tracker.classList.remove("over-limit");
  }
}

/**
 * Validate skill points before allowing input. Returns false if would exceed limit.
 * @param {HTMLInputElement} input The skill ranks input field
 * @param {number} newValue The proposed new value
 * @returns {boolean} True if valid, false if would exceed limit
 */
function validateSkillPoints(input, newValue) {
  const totalAvailable = calculateTotalSkillPoints();
  const currentValue = parseInt(input.value) || 0;
  const spent = calculateSkillPointsSpent();
  const proposedSpent = spent - currentValue + newValue;

  return proposedSpent <= totalAvailable;
}

/**
 * Update the selected feats summary display showing all chosen feats and their benefits
 */
function updateSelectedFeatsSummary() {
  const selectedFeatsList = document.getElementById('selectedFeatsList');
  const selectedFeats = [];

  // Gather all selected feats
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((cb) => {
    if (cb.checked) {
      const feat = feats[parseInt(cb.dataset.featIndex)];
      selectedFeats.push(feat);
    }
  });

  // Clear the list
  selectedFeatsList.innerHTML = '';

  // If no feats selected, show message
  if (selectedFeats.length === 0) {
    selectedFeatsList.innerHTML = '<p class="no-feats-message">No feats selected yet. Select feats above to see their benefits here.</p>';
    return;
  }

  // Display each selected feat
  selectedFeats.forEach(feat => {
    const featItem = document.createElement('div');
    featItem.className = 'feat-item';

    // Feat name
    const featName = document.createElement('div');
    featName.className = 'feat-item-name';
    featName.textContent = feat.name;
    featItem.appendChild(featName);

    // Feat description
    const featDesc = document.createElement('div');
    featDesc.className = 'feat-item-description';
    featDesc.textContent = feat.description;
    featItem.appendChild(featDesc);

    // Bonuses section
    const bonusesDiv = document.createElement('div');
    bonusesDiv.className = 'feat-item-bonuses';
    const bonuses = [];

    // Save bonuses
    if (feat.saves) {
      Object.keys(feat.saves).forEach(saveType => {
        const bonus = feat.saves[saveType];
        const saveLabel = saveType === 'fort' ? 'Fortitude' :
                         saveType === 'ref' ? 'Reflex' : 'Will';
        bonuses.push(`<span class="feat-bonus save-bonus">+${bonus} ${saveLabel}</span>`);
      });
    }

    // HP bonus
    if (feat.hp) {
      bonuses.push(`<span class="feat-bonus hp-bonus">+${feat.hp} HP</span>`);
    }

    // Skill bonuses
    if (feat.skills) {
      feat.skills.forEach(skill => {
        bonuses.push(`<span class="feat-bonus skill-bonus">+2 ${skill}</span>`);
      });
    }

    if (bonuses.length > 0) {
      bonusesDiv.innerHTML = '<strong>Bonuses:</strong> ' + bonuses.join(' ');
      featItem.appendChild(bonusesDiv);
    }

    selectedFeatsList.appendChild(featItem);
  });
}

/*
 * ============================================================================
 * UX ENHANCEMENTS: Mode Switching, Gameplay Panel, Visual Bars, Skills Filter
 * ============================================================================
 */

// Track current display mode
let displayMode = 'creation'; // 'creation' or 'gameplay'

/**
 * Initialize mode toggle and gameplay features
 */
function initializeModeToggle() {
  const creationBtn = document.getElementById('creationModeBtn');
  const gameplayBtn = document.getElementById('gameplayModeBtn');

  creationBtn.addEventListener('click', () => switchMode('creation'));
  gameplayBtn.addEventListener('click', () => switchMode('gameplay'));

  // Initialize gameplay panel event handlers
  initializeGameplayPanel();

  // Initialize skills filtering
  initializeSkillsFiltering();
}

/**
 * Switch between creation and gameplay modes
 */
function switchMode(mode) {
  displayMode = mode;
  const body = document.body;
  const creationBtn = document.getElementById('creationModeBtn');
  const gameplayBtn = document.getElementById('gameplayModeBtn');

  if (mode === 'gameplay') {
    body.classList.add('gameplay-mode');
    creationBtn.classList.remove('active');
    gameplayBtn.classList.add('active');
    updateGameplayPanel();
  } else {
    body.classList.remove('gameplay-mode');
    gameplayBtn.classList.remove('active');
    creationBtn.classList.add('active');
  }
}

/**
 * Initialize the gameplay panel event handlers
 */
function initializeGameplayPanel() {
  // Damage/Heal buttons
  document.getElementById('applyDamageBtn').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('damageAmount').value) || 0;
    if (amount > 0) {
      applyDamage(amount);
      document.getElementById('damageAmount').value = 0;
    }
  });

  document.getElementById('healBtn').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('damageAmount').value) || 0;
    if (amount > 0) {
      healDamage(amount);
      document.getElementById('damageAmount').value = 0;
    }
  });

  // Sanity loss/restore buttons
  document.getElementById('applySanityLossBtn').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('sanityLossAmount').value) || 0;
    if (amount > 0) {
      applySanityLoss(amount);
      document.getElementById('sanityLossAmount').value = 0;
    }
  });

  document.getElementById('restoreSanityBtn').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('sanityLossAmount').value) || 0;
    if (amount > 0) {
      restoreSanity(amount);
      document.getElementById('sanityLossAmount').value = 0;
    }
  });

  // Update gameplay panel when HP or Sanity changes
  document.getElementById('currentHP').addEventListener('input', updateGameplayPanel);
  document.getElementById('hitPoints').addEventListener('input', updateGameplayPanel);
  document.getElementById('currentSanity').addEventListener('input', () => {
    updateGameplayPanel();
    checkInsanityStates();
  });
  // Insanity state changes
  document.getElementById('insanityState').addEventListener('change', updateInsanityNotes);
}

/**
 * Check for insanity state triggers based on Sanity loss.
 * Temporary: Lose ≥ Wisdom/2 in single roll
 * Indefinite: Lose ≥ 20% current Sanity in 1 hour
 * Permanent: Sanity ≤ -10
 */
function checkInsanityStates() {
  const currentSanity = parseInt(document.getElementById("currentSanity").value) || 0;
  const maxSanity = parseInt(document.getElementById("sanityMax").textContent) || 99;
  const wisScore = parseInt(document.querySelector(".ability-score[data-ability='Wis']").value) || 10;
  const currentState = document.getElementById("insanityState").value;

  // Check for permanent insanity
  if (currentSanity <= -10) {
    document.getElementById("insanityState").value = "permanent";
    updateInsanityNotes();
    alert("⚠️ PERMANENT INSANITY! Your character has reached -10 Sanity and is permanently insane. This character may need to become an NPC.");
    return;
  }

  // Always update insanity notes when sanity changes (to show/hide warnings)
  // Only do this if currently in "sane" state - don't override manual state selections
  if (currentState === "sane") {
    updateInsanityNotes();
  }
}

/**
 * Update insanity notes based on current state
 */
function updateInsanityNotes() {
  const state = document.getElementById("insanityState").value;
  const noteDiv = document.getElementById("insanityNote");
  const currentSanity = parseInt(document.getElementById("currentSanity").value) || 0;
  const maxSanity = parseInt(document.getElementById("sanityMax").textContent) || 99;
  const wisScore = parseInt(document.querySelector(".ability-score[data-ability='Wis']").value) || 10;
  const twentyPercent = Math.floor(maxSanity * 0.2);

  switch (state) {
    case "temporary":
      noteDiv.innerHTML = `<strong>Temporary Insanity</strong><br>
        <em>Triggered by: Losing ≥ ${Math.floor(wisScore/2)} Sanity in one roll</em><br>
        Duration: 1d10 rounds. GM determines specific phobia/disorder.<br>
        <span class="mythos-gain-note">Gain +2 Cthulhu Mythos on first Mythos-related temporary insanity.</span>`;
      noteDiv.className = "insanity-note warning";
      break;

    case "indefinite":
      noteDiv.innerHTML = `<strong>Indefinite Insanity</strong><br>
        <em>Triggered by: Losing ≥ ${Math.floor(maxSanity * 0.2)} Sanity in 1 hour</em><br>
        Duration: 1d6 months. Character unplayable during recovery.<br>
        <span class="mythos-gain-note">Gain +1 Cthulhu Mythos on each subsequent Mythos-related insanity.</span>`;
      noteDiv.className = "insanity-note critical";
      break;

    case "permanent":
      noteDiv.innerHTML = `<strong>Permanent Insanity</strong><br>
        <em>Triggered by: Sanity drops to -10 or below</em><br>
        Character is permanently insane and should become an NPC.`;
      noteDiv.className = "insanity-note danger";
      break;

    default: // sane
      if (currentSanity <= twentyPercent && currentSanity > 0) {
        noteDiv.innerHTML = `<strong>⚠️ Below 20% Threshold!</strong><br>
          Current: ${currentSanity} / Max: ${maxSanity} (${Math.round((currentSanity/maxSanity)*100)}%)<br>
          <em>Vulnerable to indefinite insanity if losing more Sanity rapidly.</em>`;
        noteDiv.className = "insanity-note warning";
      } else if (currentSanity > 0) {
        noteDiv.innerHTML = "";
        noteDiv.className = "insanity-note";
      } else {
        noteDiv.innerHTML = `<strong>⚠️ Zero Sanity!</strong><br>
          <em>Character is likely experiencing severe psychological trauma.</em>`;
        noteDiv.className = "insanity-note critical";
      }
      break;
  }
}

/**
 * Apply damage to current HP
 */
function applyDamage(amount) {
  const currentHPInput = document.getElementById('currentHP');
  const current = parseInt(currentHPInput.value) || 0;
  const newHP = Math.max(0, current - amount);
  currentHPInput.value = newHP;
  updateGameplayPanel();
}

/**
 * Heal HP
 */
function healDamage(amount) {
  const currentHPInput = document.getElementById('currentHP');
  const maxHP = parseInt(document.getElementById('hitPoints').value) || 0;
  const current = parseInt(currentHPInput.value) || 0;
  const newHP = Math.min(maxHP, current + amount);
  currentHPInput.value = newHP;
  updateGameplayPanel();
}

/**
 * Apply sanity loss
 */
function applySanityLoss(amount) {
  const currentSanityInput = document.getElementById('currentSanity');
  const current = parseInt(currentSanityInput.value) || 0;
  const newSanity = Math.max(0, current - amount);
  currentSanityInput.value = newSanity;
  updateGameplayPanel();
  updateSanity();
}

/**
 * Restore sanity
 */
function restoreSanity(amount) {
  const currentSanityInput = document.getElementById('currentSanity');
  const maxSanity = parseInt(document.getElementById('sanityMax').textContent) || 99;
  const current = parseInt(currentSanityInput.value) || 0;
  const newSanity = Math.min(maxSanity, current + amount);
  currentSanityInput.value = newSanity;
  updateGameplayPanel();
  updateSanity();
}

/**
 * Update the gameplay panel with current stats
 */
function updateGameplayPanel() {
  // Update HP display
  const currentHP = parseInt(document.getElementById('currentHP').value) || 0;
  const maxHP = parseInt(document.getElementById('hitPoints').value) || 0;

  document.getElementById('displayCurrentHP').textContent = currentHP;
  document.getElementById('displayMaxHP').textContent = maxHP;

  const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 100;
  document.getElementById('hpPercentage').textContent = `${Math.round(hpPercentage)}%`;

  // Update HP bar
  const hpBar = document.getElementById('hpBar');
  hpBar.style.width = `${hpPercentage}%`;
  hpBar.className = 'vital-bar';

  const hpCurrent = document.getElementById('displayCurrentHP');
  hpCurrent.className = 'vital-current';

  if (hpPercentage <= 25) {
    hpBar.classList.add('danger');
    hpCurrent.classList.add('danger');
  } else if (hpPercentage <= 50) {
    hpBar.classList.add('warning');
    hpCurrent.classList.add('warning');
  }

  // Update Sanity display
  const currentSanity = parseInt(document.getElementById('currentSanity').value) || 0;
  const maxSanity = parseInt(document.getElementById('sanityMax').textContent) || 99;
  const sanity20 = parseInt(document.getElementById('sanity20').textContent) || 0;

  document.getElementById('displayCurrentSanity').textContent = currentSanity;
  document.getElementById('displayMaxSanity').textContent = maxSanity;
  document.getElementById('displaySanity20').textContent = sanity20;

  const sanityPercentage = maxSanity > 0 ? (currentSanity / maxSanity) * 100 : 100;
  document.getElementById('sanityPercentage').textContent = `${Math.round(sanityPercentage)}%`;

  // Update Sanity bar
  const sanityBar = document.getElementById('sanityBar');
  sanityBar.style.width = `${sanityPercentage}%`;
  sanityBar.className = 'vital-bar sanity';

  const sanityCurrent = document.getElementById('displayCurrentSanity');
  sanityCurrent.className = 'vital-current';

  const thresholdDisplay = document.getElementById('sanityThresholdDisplay');
  thresholdDisplay.className = 'sanity-threshold';

  if (currentSanity <= sanity20) {
    sanityBar.classList.add('danger');
    sanityCurrent.classList.add('danger');
    thresholdDisplay.classList.add('below-threshold');
  } else if (sanityPercentage <= 50) {
    sanityBar.classList.add('warning');
    sanityCurrent.classList.add('warning');
  }

  // Update combat stats
  const baseAttackText = document.getElementById('baseAttack').textContent;
  document.getElementById('displayBaseAttack').textContent = baseAttackText;

  // Calculate melee and ranged attack
  const baseAttackValue = parseInt(baseAttackText.replace(/[^0-9-]/g, '')) || 0;
  const strMod = abilityMods.Str || 0;
  const dexMod = abilityMods.Dex || 0;

  const meleeAttack = baseAttackValue + strMod;
  const rangedAttack = baseAttackValue + dexMod;

  document.getElementById('displayMeleeAttack').textContent = formatBonus(meleeAttack);
  document.getElementById('displayRangedAttack').textContent = formatBonus(rangedAttack);

  // Update saves
  document.getElementById('displayFortSave').textContent = document.getElementById('fortSave').textContent;
  document.getElementById('displayRefSave').textContent = document.getElementById('refSave').textContent;
  document.getElementById('displayWillSave').textContent = document.getElementById('willSave').textContent;
}

/**
 * Format number as bonus string (+X or -X)
 */
function formatBonus(num) {
  return num >= 0 ? `+${num}` : `${num}`;
}

/**
 * Initialize skills filtering functionality
 */
function initializeSkillsFiltering() {
  const searchInput = document.getElementById('skillSearch');
  const showProfessionBtn = document.getElementById('showProfessionSkillsBtn');
  const showAllBtn = document.getElementById('showAllSkillsBtn');

  let currentFilter = 'all'; // 'all' or 'profession'

  // Search functionality
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    filterSkills(searchTerm, currentFilter);
  });

  // Show profession skills only
  showProfessionBtn.addEventListener('click', () => {
    currentFilter = 'profession';
    showProfessionBtn.classList.add('active');
    showAllBtn.classList.remove('active');
    filterSkills(searchInput.value.toLowerCase(), currentFilter);
  });

  // Show all skills
  showAllBtn.addEventListener('click', () => {
    currentFilter = 'all';
    showAllBtn.classList.add('active');
    showProfessionBtn.classList.remove('active');
    filterSkills(searchInput.value.toLowerCase(), currentFilter);
  });
}

/**
 * Filter skills table based on search term and filter type
 */
function filterSkills(searchTerm, filterType) {
  const rows = document.querySelectorAll('#skillsBody tr');
  const profIndex = parseInt(document.getElementById('profession').value);
  const prof = professions[profIndex];

  rows.forEach(row => {
    const skillName = row.querySelector('.skill-name').textContent;
    const isProfessionSkill = prof.coreSkills.includes(skillName);

    // Check if matches search
    const matchesSearch = searchTerm === '' || skillName.toLowerCase().includes(searchTerm);

    // Check if matches filter
    const matchesFilter = filterType === 'all' || (filterType === 'profession' && isProfessionSkill);

    // Show/hide row
    if (matchesSearch && matchesFilter) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

/**
 * Extended save character to include new fields
 */
const originalSaveCharacter = saveCharacter;
saveCharacter = function() {
  originalSaveCharacter.call(this);
  // The character object is already saved in the original function
  // But we need to add session notes and current money
  const name = document.getElementById("charName").value.trim();
  if (!name) return;

  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  if (stored[name]) {
    stored[name].sessionNotes = document.getElementById('sessionNotes').value;
    stored[name].currentMoney = document.getElementById('currentMoney').value;
    localStorage.setItem("cocd20_characters", JSON.stringify(stored));
  }
};

/**
 * Extended load character to include new fields
 */
const originalLoadCharacter = loadCharacter;
loadCharacter = function() {
  originalLoadCharacter.call(this);

  const select = document.getElementById("characterSelect");
  const name = select.value;
  if (!name) return;

  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  const character = stored[name];
  if (!character) return;

  document.getElementById('sessionNotes').value = character.sessionNotes || '';
  document.getElementById('currentMoney').value = character.currentMoney || '';

  updateGameplayPanel();
  updateSelectedFeatsSummary();
  updateInsanityNotes();
};

// Initialize mode toggle when page loads
window.addEventListener("DOMContentLoaded", () => {
  // Wait for original initialization to complete
  setTimeout(() => {
    initializeModeToggle();
    updateGameplayPanel();
  }, 100);
});
