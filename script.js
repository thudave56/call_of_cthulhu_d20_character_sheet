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
const skills = [
  { name: "Animal Empathy", ability: "Cha" },
  { name: "Appraise", ability: "Int" },
  { name: "Balance", ability: "Dex" },
  { name: "Bluff", ability: "Cha" },
  { name: "Climb", ability: "Str" },
  { name: "Computer Use", ability: "Int" },
  { name: "Concentration", ability: "Con" },
  { name: "Craft", ability: "Int" },
  { name: "Cthulhu Mythos", ability: null }, // treated as special; no ability modifier
  { name: "Demolitions", ability: "Int" },
  { name: "Diplomacy", ability: "Cha" },
  { name: "Disguise", ability: "Cha" },
  { name: "Drive", ability: "Dex" },
  { name: "Escape Artist", ability: "Dex" },
  { name: "Forgery", ability: "Int" },
  { name: "Gather Information", ability: "Cha" },
  { name: "Handle Animal", ability: "Cha" },
  { name: "Heal", ability: "Wis" },
  { name: "Hide", ability: "Dex" },
  { name: "Innuendo", ability: "Wis" },
  { name: "Intimidate", ability: "Cha" },
  { name: "Jump", ability: "Str" },
  { name: "Knowledge", ability: "Int" },
  { name: "Listen", ability: "Wis" },
  { name: "Move Silently", ability: "Dex" },
  { name: "Open Lock", ability: "Dex" },
  { name: "Operate Heavy Machinery", ability: "Dex" },
  { name: "Performance", ability: "Cha" },
  { name: "Pilot", ability: "Dex" },
  { name: "Psychic Focus", ability: "Wis" },
  { name: "Psychoanalysis", ability: "Wis" },
  { name: "Read Lips", ability: "Int" },
  { name: "Repair", ability: "Dex" },
  { name: "Research", ability: "Int" },
  { name: "Ride", ability: "Dex" },
  { name: "Search", ability: "Int" },
  { name: "Sense Motive", ability: "Wis" },
  { name: "Sleight of Hand", ability: "Dex" },
  { name: "Spellcraft", ability: "Int" },
  { name: "Spot", ability: "Wis" },
  { name: "Swim", ability: "Str" },
  { name: "Tumble", ability: "Dex" },
  { name: "Use Rope", ability: "Dex" },
  { name: "Wilderness Lore", ability: "Wis" },
];

// Profession templates drawn from the GM screen【878580011413210†L130-L209】.
// Each profession provides a money modifier and a list of core skills. We
// include an approximate set of core skills based on the official list.
const professions = [
  {
    name: "Agent",
    moneyMod: -1,
    coreSkills: [
      "Bluff",
      "Computer Use",
      "Forgery",
      "Gather Information",
      "Hide",
      "Innuendo",
    ],
    description:
      "Agents are trained operatives skilled at investigation and infiltration.",
  },
  {
    name: "Antiquarian",
    moneyMod: -1,
    coreSkills: [
      "Appraise",
      "Forgery",
      "Gather Information",
      "Knowledge",
      "Knowledge",
      "Knowledge",
    ],
    description:
      "Antiquarians are scholars of history and rare objects, versed in lore.",
  },
  {
    name: "Archaeologist",
    moneyMod: 0,
    coreSkills: [
      "Appraise",
      "Climb",
      "Knowledge",
      "Knowledge",
      "Spot",
      "Search",
    ],
    description:
      "Archaeologists study ancient cultures and often find themselves in the field.",
  },
  {
    name: "Artist/Musician",
    moneyMod: 0,
    coreSkills: [
      "Bluff",
      "Craft",
      "Knowledge",
      "Performance",
      "Spot",
      "Diplomacy",
    ],
    description:
      "Artists and musicians create and perform works of art; they are charming and perceptive.",
  },
  {
    name: "Criminal",
    moneyMod: -1,
    coreSkills: [
      "Bluff",
      "Computer Use",
      "Forgery",
      "Hide",
      "Move Silently",
      "Open Lock",
    ],
    description:
      "Criminals live outside the law and excel at stealth, deception and larceny.",
  },
  {
    name: "Detective",
    moneyMod: -1,
    coreSkills: [
      "Gather Information",
      "Innuendo",
      "Intimidate",
      "Listen",
      "Search",
      "Spot",
    ],
    description:
      "Detectives investigate crimes and track down perpetrators.",
  },
  {
    name: "Dilettante",
    moneyMod: 2,
    coreSkills: [
      "Appraise",
      "Diplomacy",
      "Knowledge",
      "Knowledge",
      "Knowledge",
      "Performance",
    ],
    description:
      "Dilettantes are wealthy individuals who pursue a variety of interests.",
  },
  {
    name: "Parapsychologist",
    moneyMod: 0,
    coreSkills: [
      "Concentration",
      "Cthulhu Mythos",
      "Psychoanalysis",
      "Psychic Focus",
      "Research",
      "Sense Motive",
    ],
    description:
      "Parapsychologists study the paranormal and the human mind.",
  },
  {
    name: "Doctor/Nurse",
    moneyMod: 0,
    coreSkills: [
      "Heal",
      "Concentration",
      "Knowledge",
      "Diplomacy",
      "Sense Motive",
      "Research",
    ],
    description:
      "Doctors and nurses practice medicine and provide care to the injured and sick.",
  },
  {
    name: "Priest/Clergyman",
    moneyMod: 0,
    coreSkills: [
      "Concentration",
      "Diplomacy",
      "Knowledge",
      "Knowledge",
      "Sense Motive",
      "Psychoanalysis",
    ],
    description:
      "Clergy members provide spiritual guidance and often have theological knowledge.",
  },
  {
    name: "Professor",
    moneyMod: 1,
    coreSkills: [
      "Appraise",
      "Diplomacy",
      "Knowledge",
      "Knowledge",
      "Knowledge",
      "Research",
    ],
    description:
      "Professors are academics who specialise in teaching and research.",
  },
  {
    name: "Psychologist",
    moneyMod: 0,
    coreSkills: [
      "Diplomacy",
      "Sense Motive",
      "Psychoanalysis",
      "Concentration",
      "Research",
      "Knowledge",
    ],
    description:
      "Psychologists study human behaviour and treat mental illnesses.",
  },
  {
    name: "Soldier",
    moneyMod: -1,
    coreSkills: [
      "Climb",
      "Jump",
      "Spot",
      "Listen",
      "Swim",
      "Intimidate",
    ],
    description:
      "Soldiers are trained in combat and physical endurance.",
  },
  {
    name: "Technician",
    moneyMod: 0,
    coreSkills: [
      "Computer Use",
      "Repair",
      "Open Lock",
      "Craft",
      "Knowledge",
      "Search",
    ],
    description:
      "Technicians operate and maintain machinery and electronics.",
  },
  {
    name: "White-Collar Worker",
    moneyMod: 0,
    coreSkills: [
      "Appraise",
      "Computer Use",
      "Diplomacy",
      "Gather Information",
      "Knowledge",
      "Sense Motive",
    ],
    description:
      "White-collar workers are office employees skilled at administration and business.",
  },
  {
    name: "Writer/Reporter",
    moneyMod: 0,
    coreSkills: [
      "Bluff",
      "Diplomacy",
      "Gather Information",
      "Knowledge",
      "Knowledge",
      "Research",
    ],
    description:
      "Writers and reporters craft stories and investigate leads.",
  },
  {
    name: "Blue-Collar Worker",
    moneyMod: 0,
    coreSkills: [
      "Climb",
      "Jump",
      "Swim",
      "Listen",
      "Spot",
      "Repair",
    ],
    description:
      "Blue-collar workers perform manual labour and practical tasks.",
  },
];

// Define feats with their effects. Only a subset apply automatic bonuses.
const feats = [
  { name: "Acrobatic", skills: ["Balance", "Tumble"], description: "+2 to Balance and Tumble checks" },
  { name: "Alertness", skills: ["Listen", "Spot"], description: "+2 to Listen and Spot checks" },
  { name: "Ambidexterity", description: "Off-hand weapon suffers no penalty" },
  { name: "Animal Affinity", skills: ["Handle Animal", "Ride"], description: "+2 to Handle Animal and Ride checks" },
  { name: "Athletic", skills: ["Climb", "Swim"], description: "+2 to Climb and Swim checks" },
  { name: "Blind-Fight", description: "Improved fighting in darkness" },
  { name: "Cautious", skills: ["Demolitions", "Open Lock"], description: "+2 to Demolitions and Open Lock checks" },
  { name: "Combat Casting", skills: ["Concentration"], description: "+4 to Concentration checks for defensive casting" },
  { name: "Dodge", description: "+1 dodge bonus to AC" },
  { name: "Endurance", description: "+4 on checks to avoid subdual damage" },
  { name: "Gearhead", skills: ["Computer Use", "Repair"], description: "+2 to Computer Use and Repair checks" },
  { name: "Great Fortitude", saves: { fort: 2 }, description: "+2 on Fortitude saves" },
  { name: "Improved Initiative", description: "+4 bonus to initiative" },
  { name: "Iron Will", saves: { will: 2 }, description: "+2 on Will saves" },
  { name: "Lightning Reflexes", saves: { ref: 2 }, description: "+2 on Reflex saves" },
  { name: "Martial Artist", description: "Improved unarmed attack damage" },
  { name: "Nimble", skills: ["Escape Artist", "Sleight of Hand"], description: "+2 to Escape Artist and Sleight of Hand checks" },
  { name: "Persuasive", skills: ["Bluff", "Diplomacy"], description: "+2 to Bluff and Diplomacy checks" },
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
    tr.innerHTML = `
      <td class="skill-name">${skill.name}</td>
      <td>${skill.ability || "—"}</td>
      <td><input type="number" class="skill-ranks" min="0" value="0" /></td>
      <td><input type="number" class="skill-misc" value="0" /></td>
      <td class="skill-total">0</td>
    `;
    tbody.appendChild(tr);
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
 */
function updateProfessionInfo() {
  const profIndex = parseInt(document.getElementById("profession").value);
  const prof = professions[profIndex];
  const infoDiv = document.getElementById("profession-info");
  const coreList = prof.coreSkills.map((s) => `<li>${s}</li>`).join("");
  infoDiv.innerHTML = `<p><strong>Core Skills:</strong></p><ul>${coreList}</ul><p class="desc">${prof.description}</p>`;
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
    });
  });
  // Level changes
  document.getElementById("level").addEventListener("input", () => {
    updateDerivedStats();
  });
  // HP changes - auto-set current HP to max HP if empty
  document.getElementById("hitPoints").addEventListener("input", () => {
    const maxHP = parseInt(document.getElementById("hitPoints").value) || 0;
    const currentHPInput = document.getElementById("currentHP");
    if (!currentHPInput.value || currentHPInput.value === "0") {
      currentHPInput.value = maxHP;
    }
    updateGameplayPanel();
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
  // Skill input changes
  document.querySelectorAll(".skill-ranks, .skill-misc").forEach((input) => {
    input.addEventListener("input", () => {
      updateSkillsTotals();
      updateDerivedStats();
    });
  });
  // Feat selections
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateDerivedStats();
      updateSkillsTotals();
    });
  });
  // Save character
  document.getElementById("saveButton").addEventListener("click", () => saveCharacter());
  // Load character
  document.getElementById("loadButton").addEventListener("click", () => loadCharacter());
  // Delete character
  document.getElementById("deleteButton").addEventListener("click", () => deleteCharacter());
}

/**
 * Update ability modifiers based on current scores. Modifier = floor((score - 10) / 2).
 */
function updateAbilityMods() {
  abilityMods = {};
  document.querySelectorAll(".ability-score").forEach((input) => {
    const score = parseInt(input.value) || 0;
    const ability = input.dataset.ability;
    const mod = Math.floor((score - 10) / 2);
    abilityMods[ability] = mod;
    const modCell = document.querySelector(`.ability-mod[data-ability='${ability}']`);
    if (modCell) modCell.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
  });
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

  // Auto-set current sanity to starting sanity if empty
  const currentSanityInput = document.getElementById("currentSanity");
  if (!currentSanityInput.value || currentSanityInput.value === "0") {
    currentSanityInput.value = startingSanity;
  }
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
 * Update the totals for all skills. Total = ranks + ability mod + misc + feat bonus.
 * Also highlight profession core skills.
 */
function updateSkillsTotals() {
  const featBonuses = getFeatBonuses();
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
    const total = ranks + misc + abilityMod + featBonus;
    const totalCell = row.querySelector(".skill-total");
    totalCell.textContent = total >= 0 ? `+${total}` : `${total}`;
    // Highlight profession core skills
    if (prof.coreSkills.includes(skill.name)) {
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
    character.skills.push({ index, ranks, misc });
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
    }
  });
  // Feats
  document.querySelectorAll("#featsContainer input[type=checkbox]").forEach((cb) => {
    const idx = parseInt(cb.dataset.featIndex);
    cb.checked = character.feats.includes(idx);
  });
  updateAll();
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
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
  document.getElementById('currentSanity').addEventListener('input', updateGameplayPanel);
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
};

// Initialize mode toggle when page loads
window.addEventListener("DOMContentLoaded", () => {
  // Wait for original initialization to complete
  setTimeout(() => {
    initializeModeToggle();
    updateGameplayPanel();
  }, 100);
});
