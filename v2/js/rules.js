/*
 * rules.js — Call of Cthulhu d20 rules data and pure calculation engine.
 *
 * Every table here cites the printed page of the core rulebook it comes from
 * (PDF page = printed page + 2; see docs/rulebook/). The engine is pure: each
 * function takes a character object and returns derived values, so it can be
 * unit-tested in Node (tests/rules.test.js) and shared by every UI design.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./catalog.js"));
  else root.CoC = factory(root.CoCCatalog);
})(typeof self !== "undefined" ? self : this, function (catalogRows) {
  "use strict";

  const SCHEMA_VERSION = 2;
  const ABILITIES = ["Str", "Dex", "Con", "Int", "Wis", "Cha"];
  const ABILITY_NAMES = {
    Str: "Strength", Dex: "Dexterity", Con: "Constitution",
    Int: "Intelligence", Wis: "Wisdom", Cha: "Charisma",
  };

  // ---------------------------------------------------------------------------
  // Skills — Table 2-1 (p.18). untrained: usable with 0 ranks. acp: armor check
  // penalty applies (Table 2-1 †† marks: Balance, Climb, Escape Artist, Hide,
  // Jump, Move Silently, Swim, Tumble; the p.94 armor sidebar omits Swim — we
  // follow Table 2-1). specialty: each specialty is a separate skill (p.16).
  // ---------------------------------------------------------------------------
  const SKILLS = [
    { name: "Animal Empathy", ability: "Cha", untrained: false, desc: "Calm, befriend or influence animals." },
    { name: "Appraise", ability: "Int", untrained: true, desc: "Estimate the value and authenticity of objects." },
    { name: "Balance", ability: "Dex", untrained: true, acp: true, desc: "Keep your footing on narrow or unstable surfaces." },
    { name: "Bluff", ability: "Cha", untrained: true, desc: "Lie convincingly, feint, or pass hidden messages. Opposed by Sense Motive." },
    { name: "Climb", ability: "Str", untrained: true, acp: true, desc: "Scale walls, cliffs, ropes and other vertical surfaces." },
    { name: "Computer Use", ability: "Int", untrained: true, desc: "Operate computers, search databases, defeat security." },
    { name: "Concentration", ability: "Con", untrained: true, desc: "Stay focused under distraction, injury or while casting." },
    { name: "Craft", ability: "Int", untrained: false, specialty: true, desc: "Create or repair items in a chosen craft (GM may allow some untrained)." },
    { name: "Cthulhu Mythos", ability: null, untrained: false, mythos: true, desc: "Forbidden knowledge. No key ability, no maximum rank; cannot be bought with skill points — gained only through play. Each rank lowers maximum Sanity by 1." },
    { name: "Demolitions", ability: "Int", untrained: false, desc: "Set, defuse and judge explosives." },
    { name: "Diplomacy", ability: "Cha", untrained: true, desc: "Negotiate, persuade and smooth over social situations." },
    { name: "Disable Device", ability: "Int", untrained: false, desc: "Disarm traps, jam locks, sabotage mechanisms." },
    { name: "Disguise", ability: "Cha", untrained: true, desc: "Change your appearance or impersonate someone." },
    { name: "Drive", ability: "Dex", untrained: true, desc: "Drive cars and similar vehicles in difficult situations." },
    { name: "Escape Artist", ability: "Dex", untrained: true, acp: true, desc: "Slip bonds, manacles and grapples; squeeze through tight spaces." },
    { name: "Forgery", ability: "Int", untrained: true, desc: "Create or detect forged documents." },
    { name: "Gather Information", ability: "Cha", untrained: true, desc: "Pick up rumours and news by talking to people." },
    { name: "Handle Animal", ability: "Cha", untrained: false, desc: "Train and direct domesticated animals." },
    { name: "Heal", ability: "Wis", untrained: true, desc: "First aid, long-term care, stabilise the dying, treat poison and disease." },
    { name: "Hide", ability: "Dex", untrained: true, acp: true, desc: "Avoid being seen. Opposed by Spot." },
    { name: "Innuendo", ability: "Wis", untrained: true, desc: "Send and understand hidden messages in conversation." },
    { name: "Intimidate", ability: "Cha", untrained: true, desc: "Frighten or coerce someone into cooperating." },
    { name: "Jump", ability: "Str", untrained: true, acp: true, desc: "Leap distances and heights." },
    { name: "Knowledge", ability: "Int", untrained: false, specialty: true, desc: "Expertise in a chosen field (history, occult, medicine…)." },
    { name: "Listen", ability: "Wis", untrained: true, desc: "Hear approaching enemies, whispers, sounds behind doors. Opposed by Move Silently." },
    { name: "Move Silently", ability: "Dex", untrained: true, acp: true, desc: "Move without being heard. Opposed by Listen." },
    { name: "Open Lock", ability: "Dex", untrained: false, desc: "Pick locks." },
    { name: "Operate Heavy Machinery", ability: "Dex", untrained: false, desc: "Operate cranes, bulldozers, tractors and other large machines." },
    { name: "Performance", ability: "Cha", untrained: false, specialty: true, desc: "Perform in a chosen form (GM may allow some untrained)." },
    { name: "Pilot", ability: "Dex", untrained: false, desc: "Fly aircraft." },
    { name: "Psychic Focus", ability: "Wis", untrained: false, desc: "Channel and control psychic feats." },
    { name: "Psychoanalysis", ability: "Wis", untrained: false, desc: "Treat mental illness; restore Sanity (never above starting Sanity)." },
    { name: "Read Lips", ability: "Int", untrained: false, desc: "Understand speech by watching lips." },
    { name: "Repair", ability: "Int", untrained: false, desc: "Fix mechanical and electrical devices." },
    { name: "Research", ability: "Int", untrained: true, desc: "Find information in libraries, archives and records." },
    { name: "Ride", ability: "Dex", untrained: true, desc: "Ride horses and other mounts." },
    { name: "Search", ability: "Int", untrained: true, desc: "Find hidden doors, clues, small details by careful examination." },
    { name: "Sense Motive", ability: "Wis", untrained: true, desc: "Detect lies and hidden intentions. Opposed by Bluff." },
    { name: "Sleight of Hand", ability: "Dex", untrained: false, desc: "Pick pockets, palm objects, perform tricks." },
    { name: "Speak Other Language", ability: "Int", untrained: false, specialty: true, desc: "Each rank/specialty is one additional language." },
    { name: "Spellcraft", ability: "Int", untrained: false, desc: "Identify spells and magical effects." },
    { name: "Spot", ability: "Wis", untrained: true, desc: "Notice things at a glance. Opposed by Hide." },
    { name: "Swim", ability: "Str", untrained: true, acp: true, desc: "Swim and stay afloat." },
    { name: "Tumble", ability: "Dex", untrained: false, acp: true, desc: "Roll, dive and avoid attacks of opportunity." },
    { name: "Use Rope", ability: "Dex", untrained: true, desc: "Tie knots, bind prisoners, secure grappling hooks." },
    { name: "Wilderness Lore", ability: "Wis", untrained: true, desc: "Survive outdoors, navigate, follow tracks (with Track)." },
  ];
  const SKILL_BY_NAME = Object.fromEntries(SKILLS.map((s) => [s.name, s]));

  // Synergy — Table 2-4 (p.22): 5+ ranks grant +2.
  const SYNERGIES = [
    { from: "Animal Empathy", to: ["Handle Animal"] },
    { from: "Bluff", to: ["Intimidate", "Sleight of Hand"] },
    { from: "Handle Animal", to: ["Ride"] },
    { from: "Knowledge (medicine)", to: ["Heal"] },
    { from: "Knowledge (psychology)", to: ["Psychoanalysis"] },
    { from: "Sense Motive", to: ["Diplomacy"] },
    { from: "Tumble", to: ["Balance", "Jump"] },
  ];

  // ---------------------------------------------------------------------------
  // Profession templates (p.12-13) and income modifiers — Table 1-13 (p.15).
  // "*" in a skill id = player picks the specialty ("any one").
  // ---------------------------------------------------------------------------
  const PROFESSIONS = [
    { name: "Agent", moneyMod: -1, core: ["Bluff", "Computer Use", "Forgery", "Gather Information", "Hide", "Innuendo", "Move Silently", "Open Lock", "Sense Motive"] },
    { name: "Antiquarian", moneyMod: -1, core: ["Appraise", "Forgery", "Gather Information", "Knowledge (history)", "Knowledge (*)", "Knowledge (*)", "Knowledge (*)", "Research", "Speak Other Language (*)"] },
    { name: "Archaeologist", moneyMod: 0, core: ["Appraise", "Climb", "Knowledge (archaeology)", "Knowledge (history)", "Knowledge (*)", "Research", "Search", "Speak Other Language (*)", "Spot"] },
    { name: "Artist/Musician", moneyMod: -2, core: ["Bluff", "Craft (*)", "Diplomacy", "Innuendo", "Knowledge (art)", "Listen", "Performance (*)", "Sense Motive", "Spot"] },
    { name: "Blue-Collar Worker", moneyMod: -1, core: ["Climb", "Craft (*)", "Disable Device", "Drive", "Gather Information", "Operate Heavy Machinery", "Repair", "Spot", "Use Rope"] },
    { name: "Criminal", moneyMod: -1, core: ["Bluff", "Disable Device", "Escape Artist", "Forgery", "Hide", "Innuendo", "Move Silently", "Open Lock", "Sleight of Hand"] },
    { name: "Detective", moneyMod: -1, core: ["Gather Information", "Hide", "Intimidate", "Listen", "Move Silently", "Open Lock", "Search", "Sense Motive", "Spot"] },
    { name: "Dilettante", moneyMod: 1, core: ["Diplomacy", "Drive", "Gather Information", "Innuendo", "Knowledge (art)", "Knowledge (local: *)", "Pilot", "Ride", "Speak Other Language (*)"] },
    { name: "Doctor/Nurse", moneyMod: 2, core: ["Computer Use", "Diplomacy", "Heal", "Knowledge (biology)", "Knowledge (medicine)", "Knowledge (*)", "Listen", "Research", "Spot"] },
    { name: "Parapsychologist", moneyMod: -2, core: ["Bluff", "Gather Information", "Knowledge (history)", "Knowledge (occult)", "Knowledge (religion)", "Listen", "Search", "Sense Motive", "Spot"] },
    { name: "Priest/Clergyman", moneyMod: -1, core: ["Concentration", "Diplomacy", "Knowledge (religion)", "Knowledge (*)", "Knowledge (*)", "Listen", "Sense Motive", "Speak Other Language (*)", "Spot"] },
    { name: "Professor", moneyMod: 0, core: ["Concentration", "Diplomacy", "Gather Information", "Knowledge (*)", "Knowledge (*)", "Knowledge (*)", "Research", "Speak Other Language (*)", "Spot"] },
    { name: "Psychologist", moneyMod: 0, core: ["Bluff", "Diplomacy", "Gather Information", "Heal", "Knowledge (medicine)", "Knowledge (psychology)", "Psychoanalysis", "Research", "Sense Motive"] },
    { name: "Soldier", moneyMod: -2, core: ["Climb", "Hide", "Jump", "Listen", "Move Silently", "Spot", "Swim", "Use Rope", "Wilderness Lore"] },
    { name: "Technician", moneyMod: 2, core: ["Computer Use", "Craft (*)", "Disable Device", "Knowledge (*)", "Open Lock", "Operate Heavy Machinery", "Repair", "Research", "Search"] },
    { name: "White-Collar Worker", moneyMod: 1, core: ["Bluff", "Computer Use", "Diplomacy", "Forgery", "Intimidate", "Knowledge (*)", "Listen", "Sense Motive", "Spot"] },
    { name: "Writer/Reporter", moneyMod: -1, core: ["Craft (photography)", "Craft (writing)", "Diplomacy", "Gather Information", "Innuendo", "Knowledge (*)", "Knowledge (*)", "Research", "Sense Motive"] },
  ];
  const PROFESSION_BY_NAME = Object.fromEntries(PROFESSIONS.map((p) => [p.name, p]));

  // Starting money and income — Table 1-14 (p.15).
  const ERAS = {
    "1901-1920": { label: "1901–1920", savings: 1000, income: 500 },
    "1921-1940": { label: "1921–1940", savings: 2000, income: 1000 },
    "1941-1960": { label: "1941–1960", savings: 4000, income: 4000 },
    "1961-1980": { label: "1961–1980", savings: 4000, income: 8000 },
    "1981+": { label: "1981–2000+", savings: 6000, income: 10000 },
  };

  // Aging — Table 1-11 (p.13). Effects are cumulative; scores cannot drop below 1.
  const AGING = [
    { key: "young", label: "Adult (under 50)", minAge: 0, physical: 0, mental: 0 },
    { key: "middle", label: "Middle age (50+)", minAge: 50, physical: -1, mental: 1 },
    { key: "old", label: "Old (65+)", minAge: 65, physical: -3, mental: 2 },
    { key: "venerable", label: "Venerable (80+)", minAge: 80, physical: -6, mental: 3 },
  ];

  // Weapon proficiency categories (p.43).
  const WEAPON_CATEGORIES = {
    melee: "Melee weapon", thrown: "Thrown weapon", pistol: "Pistol", rifle: "Rifle (incl. automatic rifles)",
    shotgun: "Shotgun", smg: "Submachine gun", primitive: "Primitive ranged (bows, slings)", unarmed: "Unarmed (no proficiency needed)",
  };
  const RANGED_CATEGORIES = ["thrown", "pistol", "rifle", "shotgun", "smg", "primitive"];
  // Weapon Finesse eligible weapons (p.42-43).
  const FINESSE_WEAPONS = ["Knife (any)", "Rapier/foil", "Hatchet", "Brass knuckles", "Unarmed strike"];

  // ---------------------------------------------------------------------------
  // Feats — Table 3-1 (p.39) & 3-2 (p.43), benefits p.39-45.
  // prereq: { abil:{Dex:13}, feats:[...], bab:n, proficient:true }
  // fx: mechanical effects the engine applies automatically.
  // choice: what the player must pick; multi: can be taken more than once;
  // stack: repeated picks stack.
  // ---------------------------------------------------------------------------
  const FEATS = [
    { name: "Acrobatic", fx: { skills: { Jump: 2, Tumble: 2 } }, text: "+2 Jump and Tumble checks." },
    { name: "Alertness", fx: { skills: { Listen: 2, Spot: 2 } }, text: "+2 Listen and Spot checks." },
    { name: "Ambidexterity", prereq: { abil: { Dex: 15 } }, text: "Ignore off-hand penalties (normally −4)." },
    { name: "Animal Affinity", fx: { skills: { "Handle Animal": 2, Ride: 2 } }, text: "+2 Handle Animal and Ride checks." },
    { name: "Athletic", fx: { skills: { Climb: 2, Swim: 2 } }, text: "+2 Climb and Swim checks." },
    { name: "Blind-Fight", text: "In melee, reroll a concealment miss chance once; poor visibility only reduces speed to ¾." },
    { name: "Cautious", fx: { skills: { Demolitions: 2, "Disable Device": 2 } }, text: "+2 Demolitions and Disable Device checks." },
    { name: "Combat Casting", text: "+4 Concentration to cast a spell defensively." },
    { name: "Dodge", prereq: { abil: { Dex: 13 } }, text: "+1 dodge AC against one designated opponent per round." },
    { name: "Mobility", prereq: { abil: { Dex: 13 }, feats: ["Dodge"] }, text: "You don't have to stop moving when adjacent to an opponent; move normally while adjacent." },
    { name: "Spring Attack", prereq: { abil: { Dex: 13 }, feats: ["Dodge", "Mobility"], bab: 4 }, text: "Move before and after a melee attack (total ≤ speed)." },
    { name: "Drive-By Attack", text: "No −2 penalty firing from a moving vehicle." },
    { name: "Endurance", text: "+4 on checks for extended physical actions (running, swimming, holding breath)." },
    { name: "Expertise", prereq: { abil: { Int: 13 } }, text: "On an attack/full attack, trade up to −5 attack (max BAB) for the same dodge AC bonus; melee or ranged." },
    { name: "Gearhead", fx: { skills: { "Computer Use": 2, Repair: 2 } }, text: "+2 Computer Use and Repair checks." },
    { name: "Great Fortitude", fx: { saves: { fort: 2 } }, text: "+2 Fortitude saves." },
    { name: "Improved Critical", prereq: { bab: 8, proficient: true }, choice: "weapon", multi: true, text: "Double the threat range of one chosen weapon." },
    { name: "Improved Initiative", fx: { init: 4 }, text: "+4 initiative." },
    { name: "Iron Will", fx: { saves: { will: 2 } }, text: "+2 Will saves." },
    { name: "Lightning Reflexes", fx: { saves: { ref: 2 } }, text: "+2 Reflex saves." },
    { name: "Martial Artist", text: "Unarmed strike deals 1d4 normal damage (instead of 1d3 subdual)." },
    { name: "Nimble", fx: { skills: { "Escape Artist": 2, "Sleight of Hand": 2 } }, text: "+2 Escape Artist and Sleight of Hand checks." },
    { name: "Persuasive", fx: { skills: { Bluff: 2, Intimidate: 2 } }, text: "+2 Bluff and Intimidate checks." },
    { name: "Point Blank Shot", text: "+1 attack and damage with ranged weapons within 30 ft." },
    { name: "Far Shot", prereq: { feats: ["Point Blank Shot"] }, text: "Projectile range increment ×1.5; thrown ×2." },
    { name: "Precise Shot", prereq: { feats: ["Point Blank Shot"] }, text: "No −4 penalty shooting into melee." },
    { name: "Rapid Shot", prereq: { abil: { Dex: 13 }, feats: ["Point Blank Shot"] }, text: "One extra ranged attack per round at highest BAB; all attacks −2 (full-round action)." },
    { name: "Multishot", prereq: { abil: { Dex: 13 }, feats: ["Point Blank Shot", "Rapid Shot"] }, text: "Firearm full-attack penalty reduced by 2: autofire −4 (normally −6), multifire −2 (normally −4), standard −4 (normally −6; p.81 and Table 5-12)." },
    { name: "Shot on the Run", prereq: { abil: { Dex: 13 }, feats: ["Point Blank Shot", "Dodge", "Mobility"] }, text: "Move before and after a ranged attack (total ≤ speed)." },
    { name: "Rolling Shot", prereq: { abil: { Dex: 13 }, feats: ["Point Blank Shot", "Shot on the Run", "Dodge", "Mobility"] }, text: "+2 dodge AC vs ranged attacks in a round you attack at range and move 20+ ft." },
    { name: "Power Attack", prereq: { abil: { Str: 13 } }, text: "Trade melee attack bonus for equal melee damage (max BAB)." },
    { name: "Cleave", prereq: { abil: { Str: 13 }, feats: ["Power Attack"] }, text: "Extra melee attack after dropping a foe (once per round)." },
    { name: "Quick Draw", prereq: { bab: 1 }, text: "Draw or holster a weapon as a free action." },
    { name: "Run", text: "Run at ×5 speed (normally ×4); running jumps +¼ distance." },
    { name: "Sharp-Eyed", fx: { skills: { Search: 2, "Sense Motive": 2 } }, text: "+2 Search and Sense Motive checks." },
    { name: "Skill Emphasis", choice: "skill", multi: true, text: "+3 on checks with one chosen skill." },
    { name: "Stealthy", fx: { skills: { Hide: 2, "Move Silently": 2 } }, text: "+2 Hide and Move Silently checks." },
    { name: "Toughness", fx: { hp: 3 }, multi: true, stack: true, text: "+3 hit points (stacks)." },
    { name: "Track", text: "Find and follow tracks with Wilderness Lore." },
    { name: "Trustworthy", fx: { skills: { Diplomacy: 2, "Gather Information": 2 } }, text: "+2 Diplomacy and Gather Information checks." },
    { name: "Two-Weapon Fighting", text: "Two-weapon penalties reduced by 2 (normally −6 primary / −10 off hand)." },
    { name: "Wealth", multi: true, stack: true, text: "Windfall equal to starting savings; income modifier +2 (stacks)." },
    { name: "Weapon Finesse", prereq: { bab: 1, proficient: true }, choice: "finesse", multi: true, text: "Use Dex instead of Str on attack rolls with one chosen light weapon." },
    { name: "Weapon Focus", prereq: { bab: 1, proficient: true }, choice: "weapon", multi: true, text: "+1 attack with one chosen weapon." },
    { name: "Weapon Proficiency", choice: "category", multi: true, text: "No −4 nonproficiency penalty with one weapon category." },
    // Psychic feats — Table 3-2 (p.43), costs p.43-45.
    { name: "Sensitive", psychic: true, prereq: { abil: { Cha: 15 } }, text: "Sense the supernatural (the GM tells you when); prerequisite for all psychic feats. Cost: none." },
    { name: "Biofeedback Trance", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "Enter a death-like trance (full-round). Cost: none." },
    { name: "Remote Viewing", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive", "Biofeedback Trance"] }, text: "View distant places from a trance (Psychic Focus, full-round). Cost: 1d4 Sanity + 1 Wis damage; 1 Sanity if it fails." },
    { name: "Dowsing", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "Follow psychic or magical trails (Psychic Focus DC 15, free action). Cost: 1 Sanity + 1 Wis damage; 1 Sanity if it fails." },
    { name: "Mind Reading", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "Read surface thoughts (Psychic Focus DC 15–40 by distance, full-round). Cost: 1d3 Sanity + 1 Wis damage; 1 Sanity if it fails." },
    { name: "Mind Probe", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive", "Mind Reading"] }, text: "Learn an answer from a target's mind within 30 ft (Psychic Focus, full-round). Cost: 1d4 Sanity + 1 Wis damage; 1 Sanity if it fails." },
    { name: "Psychokinesis", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "Move up to 5 lb at 30 ft (full-round). Cost: 1d4 Sanity + 1 Wis damage, +1 Sanity and 1 Wis per extra minute; 1 Sanity if it fails." },
    { name: "Psychometry", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "Read an object's history (Psychic Focus DC 15, full-round). Cost: 1d4 Sanity + 1 Wis damage (the vision may cost more); 1 Sanity if it fails." },
    { name: "Second Sight", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "See things others cannot (GM announces). Cost: none beyond Sanity for what you see." },
    { name: "Telepathy", psychic: true, prereq: { abil: { Cha: 15 }, feats: ["Sensitive"] }, text: "Send thoughts to a target (Psychic Focus DC 15–40 by distance, full-round). Cost: 1d4 Sanity + 1 Wis damage; 1 Sanity if it fails." },
  ];
  const FEAT_BY_NAME = Object.fromEntries(FEATS.map((f) => [f.name, f]));

  // Generic armor — Table 6-4 (p.95). Bullet-resistant vests give only +1 vs
  // claws and vs rounds they are not rated for. No max Dex in CoC d20; ACP applies
  // to the ACP skills and to attack rolls (p.94 sidebar).
  const ARMOR = [
    { name: "None", bonus: 0, acp: 0, cost: "" },
    { name: "Bullet resistant vest", bonus: 4, acp: -1, cost: "$299.95", note: "+1 only vs claws, knives, arrows, rifle and large-calibre rounds" },
    { name: "Reinforced vest", bonus: 5, acp: -2, cost: "$439.95", note: "+1 only vs claws and calibres above 7.62×51mm" },
    { name: "Flak vest", bonus: 6, acp: -3, cost: "$2,000", note: "+1 only vs claws (GM)" },
    { name: "Flak armor (body armor)", bonus: 7, acp: -4, cost: "$4,000", note: "+1 only vs claws (GM)" },
  ];

  // Weapon presets — Table 6-1 (p.94) & Table 6-3 (p.95).
  const WEAPON_PRESETS = [
    { name: "Unarmed strike", category: "unarmed", damage: "1d3 subdual", critical: "×2", range: "" },
    { name: "Brass knuckles", category: "melee", damage: "1d3", critical: "×2", range: "", weight: 0.5 },
    { name: "Knife, steak", category: "melee", damage: "1d3", critical: "×2", range: "", weight: 0.5 },
    { name: "Razor, straight", category: "melee", damage: "1d3", critical: "×2", range: "", weight: 0.5 },
    { name: "Stiletto/Switchblade", category: "melee", damage: "1d3", critical: "19-20/×2", range: "", weight: 0.75 },
    { name: "Knife, commando", category: "melee", damage: "1d4", critical: "19-20/×2", range: "10 ft", weight: 1 },
    { name: "Knife, hunting", category: "melee", damage: "1d4", critical: "19-20/×2", range: "10 ft", weight: 2.5 },
    { name: "Knife, combat", category: "melee", damage: "1d4", critical: "19-20/×2", range: "10 ft", weight: 2.5 },
    { name: "Sap", category: "melee", damage: "1d6 subdual", critical: "×2", range: "", weight: 3 },
    { name: "Pocketknife or scalpel", category: "melee", damage: "1d3", critical: "×2", range: "", weight: 0.5 },
    { name: "Cleaver", category: "melee", damage: "1d4", critical: "19-20/×2", range: "5 ft", weight: 1 },
    { name: "Butcher knife", category: "melee", damage: "1d4", critical: "19-20/×2", range: "5 ft", weight: 1 },
    { name: "Folding shovel/entrenching tool", category: "melee", damage: "1d4", critical: "×2", range: "", weight: 2.5 },
    { name: "Gun butt, pistol", category: "melee", damage: "1d4", critical: "×2", range: "", weight: 2 },
    { name: "Knife, kukri", category: "melee", damage: "1d4", critical: "18-20/×2", range: "10 ft", weight: 3 },
    { name: "Hatchet or tomahawk", category: "melee", damage: "1d6", critical: "×3", range: "10 ft", weight: 3.5 },
    { name: "Croquet mallet", category: "melee", damage: "1d4", critical: "×2", range: "", weight: 2.5 },
    { name: "Nightstick or billy club", category: "melee", damage: "1d4", critical: "×2", range: "", weight: 1.5 },
    { name: "Fencing foil", category: "melee", damage: "1d4", critical: "18-20/×2", range: "", weight: 2.5 },
    { name: "Bayonet, hand-held", category: "melee", damage: "1d4", critical: "19-20/×2", range: "", weight: 2.5 },
    { name: "Crowbar, tire iron or poker", category: "melee", damage: "1d6", critical: "×2", range: "", weight: 3 },
    { name: "Pick or pickaxe", category: "melee", damage: "1d6", critical: "×4", range: "", weight: 6 },
    { name: "Machete", category: "melee", damage: "1d6", critical: "19-20/×2", range: "", weight: 2.5 },
    { name: "Rapier", category: "melee", damage: "1d6", critical: "18-20/×2", range: "", weight: 3 },
    { name: "Saber, cavalry", category: "melee", damage: "1d6", critical: "18-20/×2", range: "", weight: 3 },
    { name: "Bat, baseball or cricket", category: "melee", damage: "1d6", critical: "×2", range: "", weight: 3, twoHanded: true },
    { name: "Bayonet, fixed to rifle", category: "melee", damage: "1d6", critical: "19-20/×2", range: "", weight: 11.5, twoHanded: true },
    { name: "Gun butt, rifle or shotgun", category: "melee", damage: "1d6", critical: "×2", range: "", weight: 9, twoHanded: true },
    { name: "Shovel or spade", category: "melee", damage: "1d6", critical: "×2", range: "", weight: 4, twoHanded: true },
    { name: "Axe, wood or fire", category: "melee", damage: "1d8", critical: "×3", range: "", weight: 6, twoHanded: true },
    { name: "Handgun (9mm)", category: "pistol", damage: "1d10", critical: "×3", range: "20 ft", capacity: 9, rof: "Multifire" },
    { name: "Rifle (.30-06 bolt-action)", category: "rifle", damage: "2d10", critical: "×3", range: "200 ft", capacity: 4, rof: "Standard" },
    { name: "Shotgun (12-gauge pump)", category: "shotgun", damage: "3d6/2d6/1d6 by increment", critical: "×3", range: "50 ft", capacity: 5, rof: "Standard" },
    { name: "Submachine gun (9×19mm)", category: "smg", damage: "1d10", critical: "×3", range: "25 ft", capacity: 30, rof: "Autofire" },
  ];

  // Specific firearms — Table 6-5 (p.98-99), verified against the page images
  // (docs/rulebook/EXTRACTION_REVIEW.md §2.18). Where a gun is listed in several
  // calibers, each calibre's damage is shown in the name. Shotguns are omitted
  // because their damage comes from Table 6-8, which has not been verified;
  // use the generic shotgun from Table 6-3.
  const SPECIFIC_FIREARMS = [
    // [name, category, damage, capacity, range ft, rate of fire, critical]
    ["Remington Double Derringer (.41 RF)", "pistol", "1d8", 2, 5, "Multifire"],
    ["Colt Single Action Army (.45 Colt)", "pistol", "2d8", 6, 20, "Standard"],
    ["Colt Single Action Army (.40/.41 Colt)", "pistol", "1d10", 6, 20, "Standard"],
    ["Colt M1877 \"Lightning\" (.38 Colt)", "pistol", "1d10", 6, 20, "Multifire"],
    ["Colt M1877 \"Thunderer\" (.41 Colt)", "pistol", "1d10", 6, 20, "Multifire"],
    ["Webley Mark I (.455)", "pistol", "2d8", 6, 20, "Standard/Multifire"],
    ["Mauser M1896 \"Broomhandle\"", "pistol", "1d10", 10, 20, "Multifire"],
    ["P08 Luger (9×19mm)", "pistol", "1d10", 8, 20, "Multifire"],
    ["Colt M1911 (.45 ACP)", "pistol", "2d8", 7, 20, "Multifire"],
    ["Colt M1917 Revolver (.45 ACP)", "pistol", "2d8", 6, 20, "Multifire"],
    ["S&W M1917 Revolver (.45 ACP)", "pistol", "2d8", 6, 20, "Multifire"],
    ["Astra M1921 (9mm)", "pistol", "1d10", 8, 20, "Multifire"],
    ["Walther PPK (.32 ACP)", "pistol", "1d8", 7, 20, "Multifire"],
    ["Walther PPK (.380 ACP)", "pistol", "1d10", 7, 20, "Multifire"],
    ["Browning GP35 High-Power (9×19mm)", "pistol", "1d10", 13, 20, "Multifire"],
    ["Walther P38 (9×19mm)", "pistol", "1d10", 8, 20, "Multifire"],
    ["Colt Python (.357 Magnum)", "pistol", "2d6", 6, 20, "Multifire"],
    ["Ruger Blackhawk (.357 Magnum)", "pistol", "2d6", 6, 20, "Standard"],
    ["Ruger Blackhawk (.44 Magnum / .45 Colt)", "pistol", "2d8", 6, 20, "Standard"],
    ["H&K P9 (9×19mm)", "pistol", "1d10", 9, 20, "Multifire"],
    ["SIG-Sauer P225 (9×19mm)", "pistol", "1d10", 8, 20, "Multifire"],
    ["Beretta M92 (9×19mm)", "pistol", "1d10", 15, 20, "Multifire"],
    ["Ruger Redhawk (.44 Magnum)", "pistol", "2d8", 6, 20, "Multifire"],
    ["IMI Desert Eagle (.357/.41)", "pistol", "2d6", 9, 20, "Multifire"],
    ["IMI Desert Eagle (.44 Magnum)", "pistol", "2d8", 7, 20, "Multifire"],
    ["IMI Desert Eagle (.50 AE)", "pistol", "2d10", 7, 20, "Multifire"],
    ["Glock 17 (9×19mm)", "pistol", "1d10", 17, 20, "Multifire"],
    ["Colt Delta Elite (10mm)", "pistol", "1d10", 8, 20, "Multifire"],
    ["Mosin-Nagant M1891 (7.62×54mm)", "rifle", "2d10", 5, 200, "Standard"],
    ["Mannlicher-Carcano M1891 Carbine", "rifle", "2d8", 6, 175, "Standard"],
    ["Winchester M1894 (.32-40/.25-35)", "rifle", "2d6", 8, 200, "Standard"],
    ["Winchester M1894 (.30-30/.38-55)", "rifle", "2d10", 8, 200, "Standard"],
    ["Lee-Enfield Mk I (.303)", "rifle", "2d10", 6, 175, "Standard"],
    ["Mauser M1898 (7.92×57mm)", "rifle", "2d10", 5, 200, "Standard"],
    ["Springfield M1903", "rifle", "2d10", 5, 175, "Standard"],
    ["Lee-Enfield Mk III (.303)", "rifle", "2d10", 10, 200, "Standard"],
    ["M1 Garand (.30-06)", "rifle", "2d10", 8, 200, "Multifire"],
    ["Springfield M1903A4 Sniper (.30-06)", "rifle", "2d10", 5, 200, "Standard"],
    ["Lee-Enfield No. 5 Jungle Carbine", "rifle", "2d10", 10, 175, "Standard"],
    ["Ruger Mini-14 (5.56×45mm)", "rifle", "2d6", 30, 200, "Multifire"],
    ["M21 Sniper (7.62×51mm)", "rifle", "2d10", 20, 200, "Multifire"],
    ["Barrett Light Fifty M82A1", "rifle", "2d12", 11, 200, "Multifire", "×4"],
    ["FR-F2 Sniper (7.62×51mm)", "rifle", "2d10", 10, 200, "Standard"],
    ["Ruger M77 Mk II Police (7.62×51mm)", "rifle", "2d10", 4, 200, "Standard"],
    ["M1918 BAR (.30-06)", "rifle", "2d10", 20, 200, "Autofire"],
    ["AK-47 (7.62×39mm)", "rifle", "2d6", 30, 150, "Autofire"],
    ["FN FAL (7.62×51mm)", "rifle", "2d10", 20, 200, "Autofire"],
    ["M-14 (7.62×51mm)", "rifle", "2d10", 20, 200, "Autofire"],
    ["H&K G3 (7.62×51mm)", "rifle", "2d6", 20, 200, "Autofire"],
    ["Colt M-16A1 (5.56×45mm)", "rifle", "2d6", 30, 200, "Autofire"],
    ["Galil (5.56×45mm)", "rifle", "2d6", 35, 200, "Autofire"],
    ["Steyr AUG (5.56×45mm)", "rifle", "2d6", 30, 200, "Autofire"],
    ["Enfield L85A1 (5.56×45mm)", "rifle", "2d6", 30, 200, "Autofire"],
    ["Thompson M1921 (.45 ACP)", "smg", "2d8", 20, 30, "Autofire"],
    ["Sten Mk I (9×19mm)", "smg", "1d10", 32, 25, "Autofire"],
    ["M3 \"Grease Gun\" (.45 ACP)", "smg", "2d8", 30, 30, "Autofire"],
    ["Uzi (9×19mm)", "smg", "1d10", 32, 25, "Autofire"],
    ["Sterling L2A1 (9×19mm)", "smg", "1d10", 34, 30, "Autofire"],
    ["vz61 Skorpion (.32 ACP)", "smg", "1d8", 20, 20, "Autofire"],
    ["H&K MP5 (9×19mm)", "smg", "1d10", 30, 25, "Autofire"],
  ].map(([name, category, damage, capacity, range, rof, critical]) => ({ name, category, damage, critical: critical || "×3", range: `${range} ft`, capacity, rof, source: "Table 6-5" }));
  WEAPON_PRESETS.push(...SPECIFIC_FIREARMS);

  // Shotgun damage by gauge — Table 6-8 (p.107), checked against the page image.
  // Buckshot/birdshot list damage for the 1st, 2nd and further range increments.
  const SHOTGUN_DAMAGE = {
    "10-gauge": { buckshot: "3d8/2d8/1d8", birdshot: "3d4/2d4/1d4", slug: "2d10", critical: "×3" },
    "12-gauge": { buckshot: "3d6/2d6/1d6", birdshot: "3d3/2d3/1d3", slug: "2d10", critical: "×4" },
    "16-gauge": { buckshot: "3d6/2d6/1d6", birdshot: "2d3/2d3/1d3", slug: "2d10", critical: "×3" },
    "20-gauge": { buckshot: "2d6/1d6/1d4", birdshot: "2d3/1d3/1d2", slug: "2d8", critical: "×3" },
    "28-gauge": { buckshot: "2d4/1d4/1d3", birdshot: "2d2/1d2/1", slug: "2d6", critical: "×3" },
    ".410": { buckshot: "1d8/1d3/1d2", birdshot: "1d4/1/1", slug: "1d10", critical: "×3" },
  };
  // Specific shotguns — Table 6-5 (p.99): [name, gauge, capacity, rate of fire]. Range 50 ft.
  const SPECIFIC_SHOTGUNS = [
    ["Winchester M1897", "12-gauge", 5, "Standard"], ["Winchester M1897 Trench", "12-gauge", 5, "Standard"],
    ["Winchester M1897 Riot", "12-gauge", 4, "Standard"], ["Browning Auto-5", "12-gauge", 4, "Multifire"],
    ["Winchester M1912", "12-gauge", 5, "Standard"], ["Ithaca Model 37", "12-gauge", 4, "Standard"],
    ["Winchester Model 24", "12-gauge", 2, "Multifire"], ["Browning Auto-5 Light", "12-gauge", 5, "Multifire"],
    ["Remington Model 11A", "12-gauge", 5, "Multifire"], ["Remington Model 11R", "12-gauge", 5, "Multifire"],
    ["Winchester Model 1400", "12-gauge", 2, "Multifire"], ["Franchi SPAS-12", "12-gauge", 7, "Multifire"],
    ["Mossberg M590", "12-gauge", 6, "Standard"], ["Beretta 686 Onyx", "12-gauge", 2, "Multifire"],
    ["Beretta M3P", "12-gauge", 5, "Multifire"],
  ].map(([name, gauge, capacity, rof]) => ({
    name: `${name} (${gauge}, buckshot)`, category: "shotgun", damage: SHOTGUN_DAMAGE[gauge].buckshot,
    critical: SHOTGUN_DAMAGE[gauge].critical, range: "50 ft", capacity, rof, source: "Table 6-5",
    notes: `Slug ${SHOTGUN_DAMAGE[gauge].slug}; birdshot ${SHOTGUN_DAMAGE[gauge].birdshot} (Table 6-8)`,
  }));
  WEAPON_PRESETS.push(...SPECIFIC_SHOTGUNS);

  // Reference tables for play, checked against the page images.
  const HEIGHT_WEIGHT = { // Table 1-12 (p.14)
    male: { baseIn: 58, heightDice: "2d10", baseLb: 120, weightDice: "2d4" },
    female: { baseIn: 53, heightDice: "2d10", baseLb: 85, weightDice: "2d4" },
  };
  const DC_EXAMPLES = [ // Table 2-2 (p.19)
    ["Very easy", 0, "Notice something in plain sight", "Spot"], ["Easy", 5, "Climb a knotted rope", "Climb"],
    ["Average", 10, "Hear a security guard approaching", "Listen"], ["Tough", 15, "Disarm an explosive device", "Demolitions"],
    ["Challenging", 20, "Track an escaped madman on a rainy night", "Wilderness Lore (and the Track feat)"],
    ["Formidable", 25, "Break into a secure computer system", "Computer Use"], ["Heroic", 30, "Leap across a 30-foot chasm", "Jump"],
  ];
  const ABILITY_CHECK_EXAMPLES = [ // Table 2-5 (p.23)
    ["Breaking open a jammed or locked door", "Str"], ["Threading a needle", "Dex"], ["Holding your breath", "Con"],
    ["Navigating a maze", "Int"], ["Remembering to lock a door", "Wis"], ["Getting yourself singled out in a crowd", "Cha"],
  ];
  const ATTACK_MODIFIERS = [ // Table 5-4 (p.72); † defender loses any Dex bonus to AC
    ["Attacker flanking defender", "+2", "—"], ["Attacker on higher ground", "+1", "+0"],
    ["Attacker prone", "−4", "— (firearms usable prone; bows are not)"], ["Attacker invisible", "+2†", "+2†"],
    ["Defender sitting or kneeling", "+2", "See cover"], ["Defender prone", "+4", "See cover"],
    ["Defender cowering or stunned", "+2†", "+2†"], ["Defender climbing", "+2†", "+2†"],
    ["Defender surprised or flat-footed", "+0†", "+0†"], ["Defender running", "+0†", "−2†"],
    ["Defender grappling (attacker not)", "+0†", "+0† (roll which grappler you hit)"], ["Defender pinned", "+4†", "−4†"],
    ["Defender helpless", "+4 (Dex treated as 0)", "Dex treated as 0; coup de grace possible"],
  ];
  const TWO_WEAPON = [ // Table 5-1 (p.67): primary hand / off hand
    ["Normal penalties", "−6", "−10"], ["Off-hand weapon is light", "−4", "−8"], ["Ambidexterity feat", "−6", "−6"],
    ["Two-Weapon Fighting feat", "−4", "−8"], ["Off-hand light + Ambidexterity", "−4", "−4"],
    ["Off-hand light + Two-Weapon Fighting", "−2", "−6"], ["Ambidexterity + Two-Weapon Fighting", "−4", "−4"],
    ["Off-hand light + Ambidexterity + Two-Weapon Fighting", "−2", "−2"],
  ];
  const COVER = [ // Table 5-5 (p.72)
    ["One-quarter", "+2", "+1"], ["One-half", "+4", "+2"], ["Three-quarters", "+7", "+3"],
    ["Nine-tenths", "+10", "+4 (half damage if save fails, none if it succeeds)"], ["Total", "Can't be attacked", "—"],
  ];
  const CONCEALMENT = [ // Table 5-6 (p.73): miss chance
    ["One-quarter", "10%", "Light fog; moderate darkness; light foliage"], ["One-half", "20%", "Dense fog at 5 ft."],
    ["Three-quarters", "30%", "Dense foliage"], ["Nine-tenths", "40%", "Near total darkness"],
    ["Total", "50% and must guess the target's location", "Defender invisible; attacker blind; total darkness; dense fog at 10 ft."],
  ];
  /** Roll height and weight on Table 1-12. The same height roll multiplies the weight roll. */
  function rollHeightWeight(gender, rng = Math.random) {
    const g = /^f/i.test(String(gender || "")) ? HEIGHT_WEIGHT.female : HEIGHT_WEIGHT.male;
    const h = rollExpr(g.heightDice, rng).total;
    const w = rollExpr(g.weightDice, rng).total;
    const inches = g.baseIn + h;
    return { height: `${Math.floor(inches / 12)} ft. ${inches % 12} in.`, weight: `${g.baseLb + h * w} lb.`, heightRoll: h, weightRoll: w };
  }

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  const toInt = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
  const toNum = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const abilityMod = (score) => Math.floor((score - 10) / 2);
  const rollDie = (sides, rng = Math.random) => Math.floor(rng() * sides) + 1;
  const uid = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function skillBase(id) { return String(id).replace(/\s*\(.*\)\s*$/, "").trim(); }
  function skillSpecialty(id) { const m = String(id).match(/\((.*)\)\s*$/); return m ? m[1].trim() : ""; }
  function skillDef(id) { return SKILL_BY_NAME[skillBase(id)] || null; }

  // ---------------------------------------------------------------------------
  // Progressions — Tables 1-8, 1-9, 1-10 (p.10-11)
  // ---------------------------------------------------------------------------
  function baseAttackBonus(level, option) {
    const L = Math.max(1, toInt(level, 1));
    return option === "offense" ? L - Math.floor(L / 4) : Math.floor(L / 2);
  }
  /** Iterative attacks at −5 while the bonus stays above 0 (+6/+1, +11/+6/+1). */
  function attackSequence(bab) {
    const seq = [bab];
    for (let b = bab - 5; b > 0; b -= 5) seq.push(b);
    return seq;
  }
  function baseSave(level, good) {
    const L = Math.max(1, toInt(level, 1));
    return good ? 2 + Math.floor(L / 2) : Math.floor(L / 3);
  }
  function goodSaveCount(option) { return option === "offense" ? 1 : 2; }
  function coreMaxRanks(level) { return toInt(level, 1) + 3; }
  function noncoreMaxRanks(level) { return (toInt(level, 1) + 3) / 2; }
  function featSlots(c) {
    const L = toInt(c.level, 1);
    let n = 2 + Math.floor(L / 3);                       // p.11: two at 1st, +1 at 3,6,9…
    if (offenseBonusFeat(c)) n += 1;                     // p.15: Offense option's extra Weapon Proficiency
    return n;
  }
  /**
   * p.15 states the Offense option's extra Weapon Proficiency inside the Defense
   * Bonus variant box. By default it comes with that variant; a table can choose
   * to grant it always (options.offenseWeaponProficiency).
   */
  function offenseBonusFeat(c) {
    const o = c.options || {};
    return c.attackOption === "offense" && !!(o.defenseBonus || o.offenseWeaponProficiency);
  }
  /** XP needed to reach a level — Table 1-10 (p.11): 1,000 × L × (L−1) / 2. */
  function xpForLevel(level) { const L = Math.max(1, toInt(level, 1)); return 1000 * L * (L - 1) / 2; }
  function abilityIncreaseLevels(level) {
    const out = [];
    for (let l = 4; l <= toInt(level, 1); l += 4) out.push(l);
    return out;
  }
  // Variant: Table 1-15 (p.15) defense bonus by level.
  function defenseBonus(level, option) {
    const L = Math.max(1, toInt(level, 1));
    return (option === "defense" ? 2 : 0) + Math.floor(L / 5);
  }

  // ---------------------------------------------------------------------------
  // Character model
  // ---------------------------------------------------------------------------
  function agingCategory(age) {
    const a = toInt(age, 0);
    let cat = AGING[0];
    for (const g of AGING) if (a >= g.minAge) cat = g;
    return cat;
  }

  function newCharacter(overrides = {}) {
    const now = new Date().toISOString();
    const c = {
      schemaVersion: SCHEMA_VERSION,
      id: uid(),
      name: "", player: "", gender: "", age: 30, height: "", weight: "", era: "1921-1940",
      profession: "Professor",
      level: 1,
      attackOption: "defense",
      goodSaves: ["will", "ref"],
      abilities: { Str: 10, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 }, // as rolled (before aging/increases)
      abilityDamage: { Str: 0, Dex: 0, Con: 0, Int: 0, Wis: 0, Cha: 0 },   // temporary damage during play
      levelLog: [{ level: 1, intMod: null, hpRoll: null, abilityIncrease: null }],
      coreSkills: [],          // 12 skill ids: 9 from the template (specialties filled) + 3 of player's choice
      skills: {},              // id -> { ranks, misc }
      mythos: 0,               // Cthulhu Mythos ranks (never bought with skill points)
      feats: [],               // [{ name, choice }]
      hp: { current: null, subdual: 0, stable: false },
      sanity: { current: null, hourStart: null, hourLoss: 0, insanity: "sane", mythosInsanities: 0, log: [] },
      money: { roll: null, cash: null, notes: "" },
      armor: "None",
      weapons: [],
      equipment: [],
      notes: "", sessionNotes: "",
      options: { defenseBonus: false, offenseWeaponProficiency: false, unmasteredMagic: false, noNonproficiencyPenalty: false },
      abilityDrain: {},        // permanent ability loss from spells (p.128): lowers the score for good
      spells: [],              // spells known (Ch. 7)
      tomes: [],               // Mythos tomes being read or already read (p.119-122)
      armorWeight: 0,          // lb, entered by the player (Table 6-4 lists no weights)
      levelLogArchive: {},     // level -> entry removed by lowering the level, restored on raising it
      xp: 0,                   // experience points (Table 1-10)
      alerts: [],              // rule alerts shown on the play screen until dismissed
      conditions: [],          // keys from CONDITIONS (p.91)
      encounter: null,         // { round, init } while a combat is being tracked
      rev: 0,                  // save revision, used to detect edits from another tab
      log: [],
      created: now, updated: now,
    };
    return Object.assign(c, overrides);
  }

  // Equipment for sale at character creation: the rulebook's price lists,
  // kept in catalog.js (Tables 6-2, 6-4, 6-9 to 6-12 and pp.114–117).
  const CATALOG = catalogRows || [];

  // ---------------------------------------------------------------------------
  // Specialties offered for the "any one" skills. Players may still enter any
  // other specialty their GM allows ("Other…").
  // ---------------------------------------------------------------------------
  const SPECIALTIES = {
    // The standard fields of study (p.32). "local" takes a place, e.g. "local: Arkham".
    Knowledge: ["accounting", "anthropology", "archaeology", "architecture", "art", "astronomy", "biology", "chemistry",
      "electronics", "engineering", "geography", "geology", "history", "law", "mathematics", "medicine", "meteorology",
      "occult", "philosophy", "physics", "psychology", "religion", "streetwise"],
    // The most common specialties (p.27).
    Craft: ["carpentry", "chemistry", "clockwork", "electronics", "gunsmith", "photography", "sculpting", "songwriting", "writing"],
    // Specializations named on p.33; each instrument is its own skill.
    Performance: ["acting", "dancing", "singing", "stage magic", "storytelling", "performance art", "piano", "guitar", "saxophone"],
    // Common scenario languages (p.36), plus the classical languages of many Mythos tomes.
    "Speak Other Language": ["Arabic", "Chinese", "French", "German", "Greek", "Latin", "Spanish"],
  };

  // ---------------------------------------------------------------------------
  // Magic (Ch. 7). Spells cost only Sanity and ability damage — there are no
  // magic points (p.126). Damage is temporary unless marked permanent ("drain").
  // ---------------------------------------------------------------------------
  /**
   * Read a spell's Cost line as printed, e.g. "4 Str damage and 1d3 Sanity points",
   * "2 Con drain (permanent) and 3d6 Sanity points", "2 Str + 2 Wis damage".
   * Returns { abilities: [{ ability, amount, permanent }], sanity: "1d3" | null }.
   */
  function parseSpellCost(text) {
    const out = { abilities: [], sanity: null };
    for (const seg of String(text || "").split(/\s+and\s+|[,;]/i)) {
      if (/sanity/i.test(seg)) {
        const m = seg.match(/(\d*d\d+(?:\s*[+-]\s*\d+)?|\d+)/i);
        if (m) out.sanity = m[1].replace(/\s+/g, "");
        continue;
      }
      const permanent = /drain|permanent/i.test(seg);
      for (const m of seg.matchAll(/(\d*d\d+(?:\s*[+-]\s*\d+)?|\d+)\s*(Str|Dex|Con|Int|Wis|Cha)\b/gi)) {
        const ability = m[2][0].toUpperCase() + m[2].slice(1, 3).toLowerCase();
        out.abilities.push({ ability, amount: m[1].replace(/\s+/g, ""), permanent });
      }
    }
    return out;
  }
  /** Saving throw DC against your spells: 15 + Intelligence bonus (p.127). */
  function spellSaveDC(c) { return 15 + Math.max(0, mods(c).Int); }
  /** Tome study check bonus: level + Int modifier + earlier study checks with it (p.119). */
  function tomeStudyBonus(c, tome) { return toInt(c.level, 1) + mods(c).Int + Math.max(0, toInt(tome && tome.studyChecks, 0)); }

  // ---------------------------------------------------------------------------
  // Conditions — Character Condition Summary (p.91). Effects the sheet applies:
  // str/dex: effective ability penalty; attack/melee: attack-roll penalty;
  // init: initiative; zero: abilities whose effective score is 0; loseDex: no positive Dex bonus to AC; helpless: Dex
  // modifier to AC counts as −5; halfSpeed. When effects can't combine, the
  // most severe applies (p.91), so ability penalties don't stack.
  // Disabled, staggered and unconscious come from hit points, not this list.
  // ---------------------------------------------------------------------------
  const CONDITIONS = [
    { key: "blinded", name: "Blinded", loseDex: true, halfSpeed: true, text: "Everything has full concealment (50% miss chance); enemies get +2 to hit; half speed; −4 on most Str- and Dex-based skills; no Spot checks or reading." },
    { key: "cowering", name: "Cowering", loseDex: true, text: "Frozen in fear: no actions; foes get +2 to hit." },
    { key: "deafened", name: "Deafened", init: -4, text: "−4 initiative; 20% spell failure with verbal components; no Listen checks." },
    { key: "entangled", name: "Entangled", attack: -2, dex: -4, halfSpeed: true, text: "−2 attacks, −4 effective Dex; half speed (none if anchored), no running or charging; casting needs Concentration DC 15." },
    { key: "exhausted", name: "Exhausted", str: -6, dex: -6, halfSpeed: true, text: "Half speed, −6 effective Str and Dex. 1 hour of complete rest → fatigued." },
    { key: "fatigued", name: "Fatigued", str: -2, dex: -2, text: "Can't run or charge, −2 effective Str and Dex. 8 hours of complete rest ends it." },
    { key: "flatFooted", name: "Flat-footed", loseDex: true, text: "Hasn't acted yet this combat: loses Dex bonus to AC." },
    { key: "grappled", name: "Grappled", loseDex: true, text: "Can't move, cast, fire a ranged weapon or use more than a barehanded attack or a Tiny/Small weapon; loses Dex bonus to AC against others." },
    { key: "helpless", name: "Helpless", helpless: true, text: "Bound, asleep, paralyzed or unconscious: melee attacks against you get +4; coup de grace possible; Dex counts as 0 (−5 to AC)." },
    { key: "nauseated", name: "Nauseated", text: "Can't attack, cast or concentrate; only a single move action per turn." },
    { key: "paralyzed", name: "Paralyzed", helpless: true, zero: ["Str", "Dex"], text: "Rigid and helpless; effective Str and Dex 0, but purely mental actions are possible." },
    { key: "prone", name: "Prone", melee: -4, text: "−4 melee attacks (firearms unaffected). Foes get +4 in melee, −4 at range. Standing is a move action." },
    { key: "stunned", name: "Stunned", loseDex: true, text: "No actions; loses Dex bonus to AC; attackers get +2; drops anything held." },
  ];
  const CONDITION_BY_KEY = Object.fromEntries(CONDITIONS.map((x) => [x.key, x]));
  /** Combined effects of the character's conditions. */
  function conditionEffects(c) {
    const list = (c.conditions || []).map((k) => CONDITION_BY_KEY[k]).filter(Boolean);
    const min = (k) => Math.min(0, ...list.map((x) => x[k] || 0));
    return {
      list, str: min("str"), dex: min("dex"), attack: min("attack"), melee: min("melee"), init: min("init"),
      zero: [...new Set(list.flatMap((x) => x.zero || []))],
      loseDex: list.some((x) => x.loseDex || x.helpless), helpless: list.some((x) => x.helpless), halfSpeed: list.some((x) => x.halfSpeed),
    };
  }

  /** Effective ability scores: rolled + aging + level increases − damage (min 1 before damage) − condition penalties. */
  function abilityScores(c) {
    const aging = agingCategory(c.age);
    const inc = {};
    for (const e of c.levelLog || []) if (e && e.abilityIncrease) inc[e.abilityIncrease] = (inc[e.abilityIncrease] || 0) + 1;
    const out = {};
    const cond = conditionEffects(c);
    for (const a of ABILITIES) {
      const base = toInt(c.abilities && c.abilities[a], 10);
      const ageMod = ["Str", "Dex", "Con"].includes(a) ? aging.physical : aging.mental;
      const drained = Math.max(0, toInt(c.abilityDrain && c.abilityDrain[a], 0));
      const permanent = Math.max(0, Math.max(1, base + ageMod + (inc[a] || 0)) - drained);
      const dmg = Math.max(0, toInt(c.abilityDamage && c.abilityDamage[a], 0));
      const condition = a === "Str" ? cond.str : a === "Dex" ? cond.dex : 0;
      const score = cond.zero.includes(a) ? 0 : Math.max(0, permanent - dmg + condition);
      out[a] = { base, ageMod, increases: inc[a] || 0, drained, permanent, damage: dmg, condition, score, mod: abilityMod(score) };
    }
    return out;
  }
  function mods(c) { const s = abilityScores(c); return Object.fromEntries(ABILITIES.map((a) => [a, s[a].mod])); }

  function featCount(c, name) { return (c.feats || []).filter((f) => f.name === name).length; }
  function hasFeat(c, name, choice) {
    return (c.feats || []).some((f) => f.name === name && (choice === undefined || (f.choice || "") === choice));
  }

  // ---------------------------------------------------------------------------
  // Saves, attack, defense
  // ---------------------------------------------------------------------------
  function saves(c) {
    const m = mods(c);
    const good = new Set(c.goodSaves || []);
    const featBonus = { fort: 0, ref: 0, will: 0 };
    for (const f of c.feats || []) {
      const d = FEAT_BY_NAME[f.name];
      if (d && d.fx && d.fx.saves) for (const k in d.fx.saves) featBonus[k] += d.fx.saves[k];
    }
    const make = (key, abil) => {
      const base = baseSave(c.level, good.has(key));
      return { base, ability: m[abil], feat: featBonus[key], total: base + m[abil] + featBonus[key], good: good.has(key) };
    };
    return { fort: make("fort", "Con"), ref: make("ref", "Dex"), will: make("will", "Wis") };
  }

  function armorDef(c) { return ARMOR.find((a) => a.name === c.armor) || ARMOR[0]; }

  function combat(c) {
    const m = mods(c);
    const bab = baseAttackBonus(c.level, c.attackOption);
    const armor = armorDef(c);
    const defBonus = c.options && c.options.defenseBonus ? defenseBonus(c.level, c.attackOption) : 0;
    const cond = conditionEffects(c);
    // Conditions (p.91): helpless counts Dex as 0 (−5); others lose only a positive Dex bonus.
    const dexAC = cond.helpless ? -5 : cond.loseDex ? Math.min(0, m.Dex) : m.Dex;
    const ac = 10 + dexAC + armor.bonus + defBonus;
    const initFeat = featCount(c, "Improved Initiative") ? 4 : 0;
    return {
      bab, sequence: attackSequence(bab),
      melee: bab + m.Str + cond.attack + cond.melee, ranged: bab + m.Dex + cond.attack,
      ac, acParts: { base: 10, dex: dexAC, armor: armor.bonus, defense: defBonus },
      flatFooted: ac - Math.max(0, dexAC), touch: 10 + dexAC + defBonus,
      init: m.Dex + initFeat + cond.init, initParts: { dex: m.Dex, feat: initFeat, condition: cond.init },
      speed: cond.halfSpeed ? 15 : 30, armor, acp: armor.acp,
      conditions: cond,
    };
  }

  /**
   * Attack penalty for a weapon the character isn't proficient with: −4 (p.43),
   * or 0 under the optional house rule that waives it. The house rule doesn't
   * make the character proficient, so feats that require proficiency still do.
   */
  function nonproficiencyPenalty(c, weapon) {
    return isProficient(c, weapon) || (c.options && c.options.noNonproficiencyPenalty) ? 0 : -4;
  }
  /** Weapon categories the character carries weapons in but isn't proficient with: [{ category, label, weapons }]. */
  function nonproficientWeapons(c) {
    const out = [];
    if (c.options && c.options.noNonproficiencyPenalty) return out;   // house rule: no −4 to warn about
    for (const w of c.weapons || []) {
      if (isProficient(c, w)) continue;
      let g = out.find((x) => x.category === w.category);
      if (!g) out.push(g = { category: w.category, label: WEAPON_CATEGORIES[w.category] || w.category, weapons: [] });
      g.weapons.push(w.name);
    }
    return out;
  }

  function isProficient(c, weapon) {
    if (!weapon || weapon.category === "unarmed") return true;
    return hasFeat(c, "Weapon Proficiency", weapon.category);
  }

  function parseDamage(dmg) {
    const m = String(dmg || "").match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    return m ? { n: +m[1], d: +m[2], bonus: m[3] ? (m[3] === "-" ? -1 : 1) * +m[4] : 0 } : null;
  }

  function threatRange(critical, improved) {
    const m = String(critical || "").match(/^(\d+)-20/);
    const low = m ? +m[1] : 20;
    const width = 21 - low;
    return improved ? 21 - width * 2 : low;
  }

  function weaponAttack(c, weapon) {
    const m = mods(c);
    const cb = combat(c);
    const ranged = RANGED_CATEGORIES.includes(weapon.category);
    const finesse = !ranged && (c.feats || []).some((f) => f.name === "Weapon Finesse" && f.choice && weapon.finesseAs === f.choice);
    const abil = ranged ? "Dex" : finesse ? "Dex" : "Str";
    const prof = nonproficiencyPenalty(c, weapon);
    const chosen = (f) => f.choice && (f.choice === weapon.id || f.choice === weapon.name);
    const focus = (c.feats || []).some((f) => f.name === "Weapon Focus" && chosen(f)) ? 1 : 0;
    const acp = cb.acp; // armor check penalty also applies to attack rolls (p.94)
    const cond = cb.conditions.attack + (ranged ? 0 : cb.conditions.melee);
    const bonus = cb.bab + m[abil] + prof + focus + acp + cond;
    const seq = cb.sequence.map((b) => b + m[abil] + prof + focus + acp + cond);
    let dmgBonus = 0;
    if (!ranged && weapon.category !== "thrown") dmgBonus = weapon.twoHanded ? Math.floor(m.Str * 1.5) : m.Str;
    if (weapon.category === "thrown") dmgBonus = m.Str;
    if (weapon.category === "unarmed" && hasFeat(c, "Martial Artist")) weapon = Object.assign({}, weapon, { damage: "1d4" });
    const improved = (c.feats || []).some((f) => f.name === "Improved Critical" && chosen(f));
    const threat = threatRange(weapon.critical, improved);
    const mult = (String(weapon.critical || "").match(/[×x](\d)/) || [0, 2])[1];
    return {
      ranged, ability: abil, bonus, sequence: seq,
      parts: { bab: cb.bab, ability: m[abil], nonproficient: prof, focus, armor: acp, condition: cond },
      damage: weapon.damage, damageBonus: dmgBonus,
      critical: `${threat < 20 ? threat + "-20" : "20"}/×${mult}`, threat, multiplier: +mult,
      pointBlank: ranged && hasFeat(c, "Point Blank Shot"),
      fullAttack: ["pistol", "rifle", "shotgun", "smg"].includes(weapon.category) ? {
        normal: firearmFullAttack(seq, weapon.rof, { multishot: hasFeat(c, "Multishot") }),
        rapid: hasFeat(c, "Rapid Shot") ? firearmFullAttack(seq, weapon.rof, { rapid: true, multishot: hasFeat(c, "Multishot") }) : null,
      } : null,
    };
  }

  /**
   * Firearm full attack — p.80-81 and Table 5-12. As a full-round action a firearm
   * gets extra attacks at the highest base attack bonus, and every attack takes a
   * penalty: standard 1 extra at −6, multifire 1 extra at −4, autofire 2 extra at
   * −6 (3 bullets each). Rapid Shot adds one more extra attack and −2; Multishot
   * reduces the penalty by 2. `bonuses` is the normal attack sequence including
   * ability and other modifiers. Returns null for non-firearms.
   */
  function firearmFullAttack(bonuses, rof, { rapid = false, multishot = false } = {}) {
    const r = String(rof || "").toLowerCase();
    const mode = r.includes("autofire") ? "autofire" : r.includes("multifire") ? "multifire" : r.includes("standard") ? "standard" : null;
    if (!mode) return null;
    let extra = mode === "autofire" ? 2 : 1;
    let penalty = mode === "multifire" ? 4 : 6;
    if (rapid) { extra += 1; penalty += 2; }
    if (multishot) penalty -= 2;
    const [first, ...rest] = bonuses;
    const seq = Array(1 + extra).fill(first - penalty).concat(rest.map((b) => b - penalty));
    return { mode, sequence: seq, penalty, bulletsPerAttack: mode === "autofire" ? 3 : 1 };
  }

  // ---------------------------------------------------------------------------
  // Hit points (p.11) and states (p.68-69)
  // ---------------------------------------------------------------------------
  function hitPoints(c) {
    const con = mods(c).Con;
    const first = Math.max(1, 6 + con);
    const perLevel = [];
    for (const e of (c.levelLog || []).slice(1)) {
      const roll = toInt(e && e.hpRoll, 0);
      perLevel.push(roll > 0 ? Math.max(1, roll + con) : null);
    }
    const missing = perLevel.filter((v) => v === null).length;
    const toughness = featCount(c, "Toughness") * 3;
    const max = first + perLevel.reduce((s, v) => s + (v || 0), 0) + toughness;
    return { max, first, perLevel, toughness, conMod: con, missingRolls: missing };
  }
  function hpState(current) {
    const hp = toInt(current, 0);
    if (hp <= -10) return { key: "dead", label: "Dead", note: "−10 or lower: dead." };
    if (hp < 0) return { key: "dying", label: "Dying", note: "Unconscious; loses 1 HP per round unless stabilized (Heal DC 15 or 10% chance each round)." };
    if (hp === 0) return { key: "disabled", label: "Disabled", note: "Only one move or attack action per turn; a strenuous action costs 1 HP." };
    return { key: "ok", label: "Fighting fit", note: "" };
  }

  // ---------------------------------------------------------------------------
  // Sanity (p.46-51)
  // ---------------------------------------------------------------------------
  function sanity(c) {
    const wis = abilityScores(c).Wis;
    const starting = wis.permanent * 5;                 // 5 × Wisdom score
    const mythosRanks = Math.max(0, toInt(c.mythos, 0));
    const mythosBonus = toInt(c.skills && c.skills["Cthulhu Mythos"] && c.skills["Cthulhu Mythos"].misc, 0);
    const mythos = Math.max(0, mythosRanks + mythosBonus); // Mythos modifier: ranks + any bonuses (no key ability)
    const max = 99 - mythos;                            // 99 − Cthulhu Mythos modifier (p.47)
    const current = c.sanity && c.sanity.current !== null && c.sanity.current !== undefined ? toInt(c.sanity.current, starting) : Math.min(starting, max);
    const hourStart = c.sanity && c.sanity.hourStart !== null && c.sanity.hourStart !== undefined ? toInt(c.sanity.hourStart) : current;
    const hourLoss = Math.max(0, toInt(c.sanity && c.sanity.hourLoss, 0));
    return {
      starting, max, current, mythos, mythosRanks, mythosBonus,
      tempThreshold: Math.ceil(wis.permanent / 2),          // loss ≥ ½ Wis in one roll → Sanity check or temporary insanity
      hourStart, hourLoss, indefiniteThreshold: Math.max(1, Math.ceil(hourStart * 0.2)), // lose 20% of current Sanity within 1 hour
      state: sanityState(current),
    };
  }
  function sanityState(current) {
    const s = toInt(current, 0);
    if (s <= -10) return { key: "permanent", label: "Permanently insane", note: "−10 or lower: the character becomes an NPC." };
    if (s <= 0) return { key: "slide", label: "Slipping into madness", note: "At 0 or below: lose 1 Sanity per round until −10 unless stabilized (Psychoanalysis)." };
    return { key: "ok", label: "Sane", note: "" };
  }
  /**
   * Apply a Sanity loss. Returns { character, triggers[] } without mutating the input.
   * Triggers: "temporary" (loss ≥ ½ Wis in one roll → GM calls for a Sanity check),
   * "indefinite" (≥20% of current Sanity lost this game hour), "zero", "permanent".
   */
  function loseSanity(c, amount, reason = "") {
    const n = Math.max(0, toInt(amount, 0));
    const s = sanity(c);
    const next = clone(c);
    const hourLoss = s.hourLoss + n;
    next.sanity = Object.assign({}, next.sanity, { current: s.current - n, hourStart: s.hourStart, hourLoss });
    next.sanity.log = [...(next.sanity.log || []), { t: new Date().toISOString(), delta: -n, reason }].slice(-200);
    const triggers = [];
    if (n > 0 && n >= s.tempThreshold) triggers.push("temporary");
    if (n > 0 && s.hourLoss < s.indefiniteThreshold && hourLoss >= s.indefiniteThreshold) triggers.push("indefinite");
    const after = s.current - n;
    if (after <= -10) triggers.push("permanent");
    else if (after <= 0 && s.current > 0) triggers.push("zero");
    return { character: next, triggers };
  }
  /** Gain Sanity. source: "level" (cap at max), "therapy" (cap at starting), "other" (cap at max). */
  function gainSanity(c, amount, source = "other", reason = "") {
    const n = Math.max(0, toInt(amount, 0));
    const s = sanity(c);
    const cap = source === "therapy" ? Math.max(s.current, Math.min(s.starting, s.max)) : s.max;
    const value = Math.min(cap, s.current + n);
    const next = clone(c);
    next.sanity = Object.assign({}, next.sanity, { current: value });
    next.sanity.log = [...(next.sanity.log || []), { t: new Date().toISOString(), delta: value - s.current, reason: reason || source }].slice(-200);
    return next;
  }
  /** Start a new game hour for the indefinite-insanity tracker. */
  function newSanityHour(c) {
    const next = clone(c);
    const s = sanity(c);
    next.sanity = Object.assign({}, next.sanity, { hourStart: s.current, hourLoss: 0 });
    return next;
  }
  /** Mythos-related insanity: +2 ranks the first time, +1 each later time (p.50). */
  function mythosInsanity(c) {
    const next = clone(c);
    const count = toInt(next.sanity && next.sanity.mythosInsanities, 0);
    next.mythos = toInt(next.mythos, 0) + (count === 0 ? 2 : 1);
    next.sanity = Object.assign({}, next.sanity, { mythosInsanities: count + 1 });
    const s = sanity(next);
    if (s.current > s.max) next.sanity.current = s.max;
    return next;
  }

  /** Total gear carried or worn, in lb (weapons, equipment × quantity, armor). */
  function gearWeight(c) {
    let w = toNum(c.armorWeight, 0);
    for (const x of c.weapons || []) w += toNum(x.weight, 0);
    for (const x of c.equipment || []) w += toNum(x.weight, 0) * Math.max(0, toNum(x.qty, 1));
    return Math.round(w * 10) / 10;
  }

  // ---------------------------------------------------------------------------
  // Skills (p.16-22)
  // ---------------------------------------------------------------------------
  function templateCore(professionName) {
    const p = PROFESSION_BY_NAME[professionName];
    return p ? p.core.slice() : [];
  }
  function isCore(c, id) { return (c.coreSkills || []).includes(id); }

  function skillPoints(c) {
    // Temporary Int damage does not reduce skill points (p.63): use the permanent score.
    const m = { Int: abilityMod(abilityScores(c).Int.permanent) };
    const perLevel = (c.levelLog || []).map((e, i) => {
      const intMod = e && e.intMod !== null && e.intMod !== undefined ? toInt(e.intMod) : m.Int;
      const base = Math.max(1, 8 + intMod);
      return i === 0 ? base * 4 : base;                // ×4 at 1st level (p.16)
    });
    const available = perLevel.reduce((s, v) => s + v, 0);
    let spent = 0;
    for (const [id, data] of Object.entries(c.skills || {})) {
      const def = skillDef(id);
      if (!def || def.mythos) continue;
      const r = Math.max(0, toNum(data && data.ranks, 0));
      spent += isCore(c, id) ? r : r * 2;              // core 1 pt/rank; noncore 1 pt/½ rank
    }
    return { available, spent, remaining: available - spent, perLevel };
  }

  /** All skill rows to display: every non-specialty skill plus any specialty that is core or has ranks. */
  function skillIds(c) {
    const ids = new Set();
    for (const s of SKILLS) if (!s.specialty) ids.add(s.name);
    for (const id of c.coreSkills || []) if (!String(id).includes("*")) ids.add(id);
    for (const id of Object.keys(c.skills || {})) ids.add(id);
    return [...ids].filter((id) => skillDef(id)).sort((a, b) => a.localeCompare(b));
  }

  function skillTable(c) {
    const m = mods(c);
    const level = toInt(c.level, 1);
    const cb = combat(c);
    const featSkill = {};
    for (const f of c.feats || []) {
      const d = FEAT_BY_NAME[f.name];
      if (!d) continue;
      if (d.fx && d.fx.skills) for (const k in d.fx.skills) featSkill[k] = Math.max(featSkill[k] || 0, d.fx.skills[k]);
    }
    const emphasis = new Set((c.feats || []).filter((f) => f.name === "Skill Emphasis" && f.choice).map((f) => f.choice));
    const synergy = {};
    for (const syn of SYNERGIES) {
      const ranks = syn.from === "Cthulhu Mythos" ? toInt(c.mythos) : toNum(c.skills && c.skills[syn.from] && c.skills[syn.from].ranks, 0);
      if (Math.floor(ranks) >= 5) for (const t of syn.to) synergy[t] = 2;
    }
    return skillIds(c).map((id) => {
      const def = skillDef(id);
      const base = skillBase(id);
      const data = (c.skills && c.skills[id]) || {};
      const core = isCore(c, id);
      const ranks = def.mythos ? Math.max(0, toInt(c.mythos)) : Math.max(0, toNum(data.ranks, 0));
      const effRanks = Math.floor(ranks);               // half ranks don't improve checks
      const abil = def.ability ? m[def.ability] : 0;
      const misc = toInt(data.misc, 0);
      const feat = (featSkill[id] || featSkill[base] || 0);
      const emph = emphasis.has(id) ? 3 : 0;
      const syn = synergy[id] || 0;
      const acp = def.acp ? cb.acp : 0;
      const gear = base === "Swim" ? -Math.floor(gearWeight(c) / 5) : 0; // Swim: −1 per 5 lb of gear (p.37)
      const total = effRanks + abil + misc + feat + emph + syn + acp + gear;
      const usable = def.untrained || effRanks > 0;
      return {
        id, base, specialty: skillSpecialty(id), def, core, ranks, effRanks, ability: def.ability,
        parts: { ranks: effRanks, ability: abil, misc, feat, emphasis: emph, synergy: syn, armor: acp, gear },
        total, usable,
        max: def.mythos ? Infinity : core ? coreMaxRanks(level) : noncoreMaxRanks(level),
        cost: def.mythos ? 0 : core ? ranks : ranks * 2,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Money (p.15, Wealth p.42)
  // ---------------------------------------------------------------------------
  /** Cash on hand: the amount entered, or the starting money (Tables 1-13, 1-14) until one is entered. */
  function cashOnHand(c) {
    if (c.money && c.money.cash !== null && c.money.cash !== undefined) return toNum(c.money.cash, 0);
    const m = money(c);
    return m.rolled ? m.startingTotal : null;
  }
  /**
   * The rulebook price of a catalog item for the character's era. The price
   * tables give a 1920s and a 2000s column (Tables 6-2, 6-9 to 6-11): eras up to
   * 1940 use the 1920s price, 1981+ the 2000s price. 1941–1980 has no printed
   * price, so the player enters what the GM allows. Returns { price, basis }.
   */
  function catalogPrice(item, era) {
    if (!item) return { price: null, basis: null };
    if (era === "1901-1920" || era === "1921-1940") return { price: item.p1920 ?? null, basis: item.p1920 == null ? "not sold in the 1920s" : "1920s price" };
    if (era === "1981+") return { price: item.p2000 ?? null, basis: item.p2000 == null ? "no 2000s price" : "2000s price" };
    return { price: null, basis: "no price printed for this era" };
  }

  function money(c) {
    const era = ERAS[c.era] || ERAS["1921-1940"];
    const prof = PROFESSION_BY_NAME[c.profession];
    const roll = c.money && c.money.roll ? toInt(c.money.roll) : null;
    const wealth = featCount(c, "Wealth");
    if (!roll) return { rolled: false, era, wealth };
    const mult = Math.max(1, roll + (prof ? prof.moneyMod : 0));
    const incomeMult = Math.max(1, roll + (prof ? prof.moneyMod : 0) + 2 * wealth);
    const savings = mult * era.savings;
    return { rolled: true, roll, mult, savings, windfall: savings * wealth, startingTotal: savings * (1 + wealth), income: incomeMult * era.income, era, wealth };
  }

  // ---------------------------------------------------------------------------
  // Validation — creation & level-up rules. Each issue: { level:"error"|"warn", msg }
  // ---------------------------------------------------------------------------
  function featPrereqIssues(c, feat) {
    const d = FEAT_BY_NAME[feat.name];
    const out = [];
    if (!d) return [`Unknown feat "${feat.name}"`];
    const p = d.prereq || {};
    const scores = abilityScores(c);
    for (const a in p.abil || {}) if (scores[a].permanent < p.abil[a]) out.push(`${d.name} needs ${a} ${p.abil[a]}+`);
    for (const f of p.feats || []) if (!hasFeat(c, f)) out.push(`${d.name} needs ${f}`);
    if (p.bab && baseAttackBonus(c.level, c.attackOption) < p.bab) out.push(`${d.name} needs base attack +${p.bab}`);
    if (d.choice && !feat.choice) out.push(`${d.name}: choose a ${d.choice}`);
    if (feat.choice && d.choice === "weapon") {
      const w = (c.weapons || []).find((x) => x.id === feat.choice || x.name === feat.choice);
      if (!w) out.push(`${d.name}: pick one of your weapons (the chosen weapon is gone)`);
      else if (p.proficient && !isProficient(c, w)) out.push(`${d.name} (${w.name}) needs Weapon Proficiency (${WEAPON_CATEGORIES[w.category] || w.category})`);
    }
    if (feat.choice && d.choice === "skill" && !skillIds(c).includes(feat.choice)) out.push(`${d.name}: "${feat.choice}" is no longer one of your skills`);
    return out;
  }

  function validate(c, { creation = true } = {}) {
    const issues = [];
    const err = (msg, step) => issues.push({ level: "error", msg, step });
    const warn = (msg, step) => issues.push({ level: "warn", msg, step });
    if (!String(c.name || "").trim()) err("Character needs a name.", "basics");
    for (const a of ABILITIES) {
      const v = toInt(c.abilities && c.abilities[a], NaN);
      if (!Number.isFinite(v) || v < 3 || v > 18) warn(`${ABILITY_NAMES[a]} ${c.abilities && c.abilities[a]} is outside the 3–18 rolled range.`, "abilities");
    }
    // Saves (Tables 1-8/1-9)
    const need = goodSaveCount(c.attackOption);
    const got = (c.goodSaves || []).length;
    if (got !== need) err(`${c.attackOption === "offense" ? "Offense" : "Defense"} option needs exactly ${need} good save${need > 1 ? "s" : ""} (have ${got}).`, "basics");
    // Core skills: 9 template + 3 choice = 12 (p.11)
    const core = c.coreSkills || [];
    if (core.length !== 12) err(`Choose 12 core skills (have ${core.length}): the 9 template skills plus 3 of your choice.`, "skills");
    if (core.some((id) => String(id).includes("*"))) err("Pick a specialty for every \"any one\" template skill.", "skills");
    if (core.includes("Cthulhu Mythos")) err("Cthulhu Mythos can never be a core skill.", "skills");
    const dups = [...new Set(core.filter((id, i) => core.indexOf(id) !== i))];
    if (dups.length) err(`Core skills must all be different: ${dups.join(", ")} is chosen twice${dups.some((x) => x.includes("*")) ? " (fill in the specialties)" : ""}.`, "skills");
    const tmpl = templateCore(c.profession).filter((id) => !id.includes("*"));
    const missingTmpl = tmpl.filter((id) => !core.includes(id));
    if (missingTmpl.length) warn(`Template core skill(s) swapped out: ${missingTmpl.join(", ")} (needs GM approval, p.11).`, "skills");
    // Skill points and maximum ranks
    const sp = skillPoints(c);
    if (sp.remaining < 0) err(`Skill points overspent by ${-sp.remaining}.`, "skills");
    else if (sp.remaining > 0 && creation) warn(`${sp.remaining} skill point${sp.remaining > 1 ? "s" : ""} unspent (all points must be spent, p.18).`, "skills");
    for (const row of skillTable(c)) {
      if (row.def.mythos) continue;
      if (row.ranks > row.max) err(`${row.id}: ${row.ranks} ranks exceeds the ${row.core ? "core" : "noncore"} maximum of ${row.max}.`, "skills");
      if (row.core && row.ranks % 1 !== 0) err(`${row.id}: core skills take whole ranks.`, "skills");
      if (!row.core && (row.ranks * 2) % 1 !== 0) err(`${row.id}: noncore ranks go in ½ steps.`, "skills");
    }
    if (creation && toInt(c.mythos) > 0) warn("Starting characters cannot have Cthulhu Mythos ranks (p.18); ranks come from play.", "basics");
    // Feats
    const slots = featSlots(c);
    if ((c.feats || []).length > slots) err(`Too many feats: ${c.feats.length} of ${slots}.`, "feats");
    else if ((c.feats || []).length < slots && creation) warn(`${slots - c.feats.length} feat slot(s) unused.`, "feats");
    const seen = new Set();
    for (const f of c.feats || []) {
      const d = FEAT_BY_NAME[f.name];
      const key = f.name + "|" + (f.choice || "");
      if (d && !d.multi && seen.has(f.name)) err(`${f.name} can only be taken once.`, "feats");
      if (d && d.multi && !d.stack && seen.has(key)) err(`${f.name} (${f.choice}) taken twice — pick a different ${d.choice}.`, "feats", "feats");
      seen.add(f.name); seen.add(key);
      for (const m of featPrereqIssues(c, f)) err(m, "feats");
    }
    if (offenseBonusFeat(c) && !hasFeat(c, "Weapon Proficiency")) warn("The Offense option's bonus feat must be a Weapon Proficiency (p.15) — pick one.", "feats");
    // Weapons the character can't use without the −4 nonproficiency penalty (p.43).
    for (const g of nonproficientWeapons(c)) warn(`Not proficient with ${g.label.toLowerCase()} (${g.weapons.join(", ")}): attacks are at −4 until you take Weapon Proficiency (${g.label.toLowerCase()}) (p.43).`, "feats");
    // Level log
    const L = toInt(c.level, 1);
    if ((c.levelLog || []).length !== L) err(`Level history has ${(c.levelLog || []).length} entries for level ${L}.`, "basics");
    const hp = hitPoints(c);
    if (hp.missingRolls) warn(`${hp.missingRolls} hit-die roll(s) missing (1d6 per level after 1st).`, "hp");
    for (const l of abilityIncreaseLevels(L)) {
      const e = (c.levelLog || [])[l - 1];
      if (!e || !e.abilityIncrease) warn(`Level ${l}: choose an ability score to increase.`, "abilities");
    }
    if (!money(c).rolled) warn("Starting money not rolled yet.", "hp");
    const cash = cashOnHand(c);
    if (cash !== null && cash < 0) err(`Spent $${(-cash).toFixed(2)} more than the cash on hand.`, "gear");
    return issues;
  }

  /** Bring levelLog in line with c.level (adds/removes entries). */
  function syncLevelLog(c) {
    const next = clone(c);
    const L = Math.max(1, Math.min(20, toInt(next.level, 1)));
    next.level = L;
    // Entries above the new level are archived, so lowering the level and raising
    // it again brings back the recorded hit-die rolls and ability increases.
    const archive = Object.assign({}, next.levelLogArchive || {});
    const full = next.levelLog || [];
    full.slice(L).forEach((e, i) => { if (e) archive[L + i + 1] = e; });
    const log = full.slice(0, L);
    while (log.length < L) {
      const lvl = log.length + 1;
      log.push(archive[lvl] ? Object.assign({}, archive[lvl]) : { level: lvl, intMod: null, hpRoll: null, abilityIncrease: null });
      delete archive[lvl];
    }
    next.levelLogArchive = archive;
    log.forEach((e, i) => { e.level = i + 1; if (i === 0) e.hpRoll = null; if ((i + 1) % 4 !== 0) e.abilityIncrease = null; });
    next.levelLog = log;
    return next;
  }

  /** Snapshot int modifier at each level (call when finishing creation or a level-up). */
  function lockIntMods(c, fromLevel = 1) {
    const next = clone(c);
    // Int at a level = permanent Int counting only increases gained up to that level.
    next.levelLog = (next.levelLog || []).map((e, i) => {
      if (i + 1 < fromLevel && e.intMod !== null && e.intMod !== undefined) return e;
      const partial = Object.assign({}, next, { levelLog: next.levelLog.slice(0, i + 1), abilityDamage: {} });
      return Object.assign({}, e, { intMod: abilityScores(partial).Int.mod });
    });
    return next;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** Normalise a stored/imported character (fills missing fields, upgrades schema). */
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const numOrNull = (v) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);
  const str = (v, max = 2000) => (v === null || v === undefined ? "" : String(v).slice(0, max));
  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

  /**
   * Normalise a stored or imported character: fill missing fields, upgrade the
   * schema, and coerce every field to its expected type so hostile or malformed
   * files can't inject markup or crash the views.
   */
  function normalize(raw) {
    const base = newCharacter();
    const src = isObj(raw) ? clone(raw) : {};
    delete src.__proto__; delete src.constructor; delete src.prototype;
    const c = Object.assign(base, src);
    if (!ID_RE.test(String(c.id || ""))) c.id = uid();
    for (const k of ["name", "player", "gender", "height", "weight", "notes", "sessionNotes"]) c[k] = str(c[k], k.endsWith("otes") ? 20000 : 200);
    c.age = Math.max(0, Math.min(200, toInt(c.age, 30)));
    if (!PROFESSION_BY_NAME[c.profession]) c.profession = "Professor";
    if (!ERAS[c.era]) c.era = "1921-1940";
    if (c.attackOption !== "offense") c.attackOption = "defense";
    if (!ARMOR.some((a) => a.name === c.armor)) c.armor = "None";
    c.level = Math.max(1, Math.min(20, toInt(c.level, 1)));
    c.mythos = Math.max(0, toInt(c.mythos, 0));
    c.armorWeight = Math.max(0, toNum(c.armorWeight, 0));
    const abil = isObj(c.abilities) ? c.abilities : {};
    const dmg = isObj(c.abilityDamage) ? c.abilityDamage : {};
    c.abilities = {}; c.abilityDamage = {};
    for (const a of ABILITIES) { c.abilities[a] = toInt(abil[a], 10); c.abilityDamage[a] = Math.max(0, toInt(dmg[a], 0)); }
    const san = isObj(c.sanity) ? c.sanity : {};
    c.sanity = Object.assign(newCharacter().sanity, {
      current: numOrNull(san.current), hourStart: numOrNull(san.hourStart), hourLoss: Math.max(0, toInt(san.hourLoss, 0)),
      insanity: ["sane", "temporary", "indefinite", "permanent"].includes(san.insanity) ? san.insanity : "sane",
      mythosInsanities: Math.max(0, toInt(san.mythosInsanities, 0)),
      log: Array.isArray(san.log) ? san.log.filter(isObj).slice(-200).map((l) => ({ t: str(l.t, 40), delta: toInt(l.delta, 0), reason: str(l.reason, 200) })) : [],
    });
    const hp = isObj(c.hp) ? c.hp : {};
    c.hp = { current: numOrNull(hp.current), subdual: Math.max(0, toInt(hp.subdual, 0)), stable: !!hp.stable };
    const money = isObj(c.money) ? c.money : {};
    const roll = toInt(money.roll, 0);
    c.money = { roll: roll >= 1 && roll <= 6 ? roll : null, cash: numOrNull(money.cash), notes: str(money.notes, 500) };
    const opt = isObj(c.options) ? c.options : {};
    c.options = { defenseBonus: !!opt.defenseBonus, offenseWeaponProficiency: !!opt.offenseWeaponProficiency, unmasteredMagic: !!opt.unmasteredMagic, noNonproficiencyPenalty: !!opt.noNonproficiencyPenalty };
    const arr = (v) => (Array.isArray(v) ? v : []);
    c.goodSaves = [...new Set(arr(c.goodSaves).filter((k) => ["fort", "ref", "will"].includes(k)))];
    c.coreSkills = arr(c.coreSkills).filter((x) => typeof x === "string").map((x) => str(x, 120)).slice(0, 12);
    c.feats = arr(c.feats).filter((f) => isObj(f) && FEAT_BY_NAME[f.name]).map((f) => ({ name: f.name, choice: f.choice === null || f.choice === undefined || f.choice === "" ? null : str(f.choice, 120) }));
    c.weapons = arr(c.weapons).filter(isObj).map((w) => ({
      id: ID_RE.test(String(w.id || "")) ? String(w.id) : uid(), name: str(w.name, 120) || "Weapon",
      category: WEAPON_CATEGORIES[w.category] ? w.category : "melee", damage: str(w.damage, 60), critical: str(w.critical, 20) || "×2",
      range: str(w.range, 30), rof: str(w.rof, 30), notes: str(w.notes, 300), finesseAs: FINESSE_WEAPONS.includes(w.finesseAs) ? w.finesseAs : "",
      twoHanded: !!w.twoHanded, capacity: numOrNull(w.capacity) === null ? null : Math.max(0, toInt(w.capacity)),
      ammo: numOrNull(w.ammo) === null ? null : Math.max(0, toInt(w.ammo)), weight: Math.max(0, toNum(w.weight, 0)),
      equipped: w.equipped !== false,   // ready to use; unequipped weapons are carried but not in the attack list
      cost: numOrNull(w.cost) === null ? null : Math.max(0, Math.round(toNum(w.cost, 0) * 100) / 100),   // paid at creation
    }));
    for (const w of c.weapons) if (w.capacity !== null && w.ammo !== null && w.ammo > w.capacity) w.ammo = w.capacity;
    c.equipment = arr(c.equipment).filter(isObj).map((e) => ({
      id: ID_RE.test(String(e.id || "")) ? String(e.id) : uid(), name: str(e.name, 200), qty: Math.max(1, toInt(e.qty, 1)),
      weight: Math.max(0, toNum(e.weight, 0)), notes: str(e.notes, 300),
      cost: numOrNull(e.cost) === null ? null : Math.max(0, Math.round(toNum(e.cost, 0) * 100) / 100),   // paid at creation
    }));
    c.log = arr(c.log).filter(isObj).slice(0, 60).map((l) => ({ t: str(l.t, 40), text: str(l.text, 300) }));
    const skills = isObj(c.skills) ? c.skills : {};
    c.skills = {};
    for (const [id, v] of Object.entries(skills)) {
      if (!skillDef(id) || !isObj(v)) continue;
      c.skills[str(id, 120)] = { ranks: Math.max(0, Math.min(40, toNum(v.ranks, 0))), misc: toInt(v.misc, 0) };
    }
    const lvlEntry = (e, i) => ({
      level: i + 1, intMod: numOrNull(e && e.intMod), hpRoll: (() => { const r = toInt(e && e.hpRoll, 0); return r >= 1 && r <= 6 ? r : null; })(),
      abilityIncrease: e && ABILITIES.includes(e.abilityIncrease) ? e.abilityIncrease : null,
    });
    c.levelLog = arr(c.levelLog).map((e, i) => lvlEntry(isObj(e) ? e : {}, i));
    const archive = isObj(c.levelLogArchive) ? c.levelLogArchive : {};
    c.levelLogArchive = {};
    for (const [k, e] of Object.entries(archive)) { const n = toInt(k, 0); if (n >= 2 && n <= 20 && isObj(e)) c.levelLogArchive[n] = lvlEntry(e, n - 1); }
    for (const k of ["created", "updated"]) c[k] = str(c[k], 40) || new Date().toISOString();
    c.rev = Math.max(0, toInt(c.rev, 0));
    c.xp = Math.max(0, toInt(c.xp, 0));
    const ALERT_ACTIONS = ["", "roll-temp-insanity", "roll-indef-insanity"];
    c.alerts = arr(c.alerts).filter(isObj).slice(0, 6).map((a) => ({
      kind: a.kind === "danger" ? "danger" : "warn", title: str(a.title, 200), text: str(a.text, 600),
      action: ALERT_ACTIONS.includes(a.action) ? a.action : "",
    }));
    const drain = isObj(c.abilityDrain) ? c.abilityDrain : {};
    c.abilityDrain = {};
    for (const a of ABILITIES) c.abilityDrain[a] = Math.max(0, toInt(drain[a], 0));
    c.spells = arr(c.spells).filter(isObj).slice(0, 200).map((sp) => ({
      id: ID_RE.test(String(sp.id || "")) ? sp.id : uid(), name: str(sp.name, 120) || "Spell", cost: str(sp.cost, 200),
      castingTime: str(sp.castingTime, 80), range: str(sp.range, 80), duration: str(sp.duration, 80), save: str(sp.save, 80),
      components: str(sp.components, 40), notes: str(sp.notes, 2000), casts: Math.max(0, toInt(sp.casts, 0)),
    }));
    c.tomes = arr(c.tomes).filter(isObj).slice(0, 100).map((t) => ({
      id: ID_RE.test(String(t.id || "")) ? t.id : uid(), name: str(t.name, 160) || "Tome", language: str(t.language, 80),
      exam: str(t.exam, 60), dc: Math.max(1, Math.min(60, toInt(t.dc, 20))),
      sanityInitial: str(t.sanityInitial, 30), sanityComplete: str(t.sanityComplete, 30), mythos: Math.max(0, Math.min(20, toInt(t.mythos, 0))),
      spells: str(t.spells, 1000), status: ["unread", "examining", "read"].includes(t.status) ? t.status : "unread",
      initialDone: !!t.initialDone, studyChecks: Math.max(0, toInt(t.studyChecks, 0)), notes: str(t.notes, 2000),
    }));
    c.conditions = [...new Set(arr(c.conditions).filter((k) => CONDITION_BY_KEY[k]))];
    const enc = isObj(c.encounter) ? c.encounter : null;
    c.encounter = enc ? { round: Math.max(1, Math.min(9999, toInt(enc.round, 1))), init: numOrNull(enc.init) } : null;
    c.schemaVersion = SCHEMA_VERSION;
    const out = syncLevelLog(c);
    // Current Sanity can never exceed maximum Sanity (p.50).
    const s = sanity(out);
    if (out.sanity.current !== null && out.sanity.current > s.max) out.sanity.current = s.max;
    return out;
  }

  /** What an ability score of 0 means (p.62). Ability scores never drop below 0. */
  const ABILITY_ZERO = {
    Str: "Strength 0: cannot move at all; lies helpless on the ground.",
    Dex: "Dexterity 0: cannot move at all; stands motionless, rigid and helpless.",
    Con: "Constitution 0: the character is dead.",
    Int: "Intelligence 0: cannot think; helpless and unconscious in a comalike stupor.",
    Wis: "Wisdom 0: helpless, withdrawn into a deep sleep filled with nightmares.",
    Cha: "Charisma 0: helpless, withdrawn into a catatonic, comalike stupor.",
  };
  const UNARMED = { id: "unarmed", name: "Unarmed strike", category: "unarmed", damage: "1d3 subdual", critical: "×2", range: "" };

  /** Full derived sheet in one call — what every UI design renders from. */
  function derive(c) {
    const scores = abilityScores(c);
    const hp = hitPoints(c);
    const current = c.hp && c.hp.current !== null && c.hp.current !== undefined ? toInt(c.hp.current, hp.max) : hp.max;
    return {
      scores, saves: saves(c), combat: combat(c), hp: Object.assign({}, hp, { current, state: hpState(current), subdual: toInt(c.hp && c.hp.subdual, 0) }),
      sanity: sanity(c), skills: skillTable(c), skillPoints: skillPoints(c), featSlots: featSlots(c),
      money: money(c), aging: agingCategory(c.age), gearWeight: gearWeight(c),
      weapons: (c.weapons || []).map((w) => Object.assign({ weapon: w }, weaponAttack(c, w))),
      unarmed: Object.assign({ weapon: UNARMED }, weaponAttack(c, UNARMED)),
      abilityZero: ABILITIES.filter((a) => scores[a].permanent - scores[a].damage <= 0).map((a) => ({ ability: a, text: ABILITY_ZERO[a], dead: a === "Con" })),
      xp: { current: toInt(c.xp, 0), level: xpForLevel(c.level), next: c.level >= 20 ? null : xpForLevel(toInt(c.level, 1) + 1) },
      profession: PROFESSION_BY_NAME[c.profession] || null,
    };
  }

  // ---------------------------------------------------------------------------
  // Insanity tables (p.48-50), transcribed from the page images.
  // ---------------------------------------------------------------------------
  const SANITY_LOSS_EXAMPLES = [ // p.48: successful check cost / failed check cost
    ["0/1d2", "Surprised to find mangled animal carcass"], ["0/1d3", "Surprised to find human corpse"],
    ["0/1d3", "Surprised to find human body part"], ["0/1d4", "Finding a stream flowing with blood"],
    ["1/1d4+1", "Finding a mangled human corpse"], ["0/1d6", "Awakening trapped in a coffin"],
    ["0/1d6", "Witnessing a friend's violent death"], ["0/1d6", "Seeing a ghoul"],
    ["1/1d6+1", "Meeting someone you know to be dead"], ["0/1d10", "Undergoing severe torture"],
    ["1/1d10", "Seeing a corpse rise from its grave"], ["2/2d10+1", "Seeing a gigantic severed head fall from the sky"],
    ["1d10/1d100", "Seeing Great Cthulhu"],
  ];
  const TEMP_INSANITY_DURATION = [ // Table 4-1 (d10)
    { max: 7, type: "short", label: "Short temporary insanity", duration: "1d10+4 rounds" },
    { max: 10, type: "long", label: "Longer temporary insanity", duration: "1d10×10 hours" },
  ];
  const SHORT_TEMP_INSANITY = [ // Table 4-2 (d%), lasts 1d10+4 rounds
    [20, "Character faints (can be awakened by vigorous action taking one round)"],
    [30, "Character has a screaming fit"],
    [40, "Character flees in panic"],
    [50, "Character shows physical hysterics or emotional outburst (laughing, crying, and so on)"],
    [55, "Character babbles in incoherent rapid speech or in logorrhea (a torrent of coherent speech)"],
    [60, "Character gripped by intense phobia, perhaps rooting her to the spot"],
    [65, "Character becomes homicidal, dealing harm on nearest person as efficiently as possible"],
    [70, "Character has hallucinations or delusions (details at the discretion of the GM)"],
    [75, "Character gripped with echopraxia or echolalia (saying or doing whatever those around him say or do)"],
    [80, "Character gripped with strange or deviant eating desire (dirt, slime, cannibalism, and so on)"],
    [90, "Character falls into a stupor (assumes fetal position, oblivious to events around her)"],
    [99, "Character becomes catatonic (can stand but has no will or interest; may be led or forced to simple actions but takes no independent action)"],
    [100, "Roll on Table 4-3: Long-Term Temporary Insanity Effects"],
  ];
  const LONG_TEMP_INSANITY = [ // Table 4-3 (d%), lasts 1d10×10 hours
    [10, "Character performs compulsive rituals (washing hands constantly, praying, walking in a particular rhythm, never stepping on cracks, constantly checking to see if gun is loaded, and so on)"],
    [20, "Character has hallucinations or delusions (details at the discretion of the GM)"],
    [30, "Character becomes paranoid"],
    [40, "Character gripped with severe phobia (refuses to approach object of phobia except on successful Will save, DC 20)"],
    [45, "Character has strange sexual desires (exhibitionism, nymphomania or satyriasis, teratophilia, necrophilia, and so on)"],
    [55, "Character develops an attachment to a \"lucky charm\" (embraces object, type of object, or person as a safety blanket) and cannot function without it"],
    [65, "Character develops psychosomatic blindness, deafness, or the loss of the use of a limb or limbs"],
    [75, "Character has uncontrollable tics or tremors (−4 penalty to all attack rolls, checks, and saves except those purely mental in nature)"],
    [85, "Character has amnesia (memories of intimates usually lost first; Knowledge skills useless)"],
    [90, "Character has bouts of reactive psychosis (incoherence, delusions, aberrant behavior, and/or hallucinations)"],
    [95, "Character loses ability to communicate via speech or writing"],
    [100, "Character becomes catatonic (can stand but has no will or interest; may be led or forced into simple actions but takes no independent action)"],
  ];
  const INDEFINITE_INSANITY = [ // Table 4-4 (d%), lasts 1d6 game months
    [15, "Anxiety Disorders (includes severe phobias)"],
    [25, "Dissociative Disorders (amnesia, multiple personalities)"],
    [30, "Eating Disorders (anorexia, bulimia)"],
    [35, "Impulse Control Disorders (compulsions)"],
    [45, "Mood Disorders (manic/depressive)"],
    [50, "Personality Disorders (various neuroses)"],
    [55, "Psychosexual Disorders (sadism, nymphomania)"],
    [70, "Schizophrenia/Psychotic Disorders (delusions, hallucinations, paranoia, catatonia)"],
    [80, "Sleep Disorders (night terrors, sleepwalking)"],
    [85, "Somatoform Disorders (psychosomatic conditions)"],
    [95, "Substance Abuse Disorder (alcoholic, drug addict)"],
    [100, "Other Disorders (megalomania, quixotism, panzaism)"],
  ];
  /** Look up a d% (1-100; "00" = 100) on one of the tables above. */
  function lookup(table, roll) { return (table.find(([max]) => roll <= max) || table[table.length - 1])[1]; }

  /** Roll an expression such as "3", "1d6+1", "d10", "2d10+1", "1d100". */
  function rollExpr(expr, rng = Math.random) {
    const e = String(expr || "").trim().replace(/\s+/g, "").replace(/d%/i, "1d100");
    if (/^-?\d+$/.test(e)) return { total: +e, rolls: [] };
    const m = e.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!m) return null;
    const n = +(m[1] || 1), sides = +m[2], bonus = +(m[3] || 0);
    const rolls = Array.from({ length: n }, () => rollDie(sides, rng));
    return { total: Math.max(0, rolls.reduce((a, b) => a + b, 0) + bonus), rolls, bonus };
  }
  /**
   * General dice roller: "3d6+2", "1d20+1d4-1", "d%", "2d10". Up to 100 dice of
   * up to 1000 sides. Returns { total, detail, terms } or null if unreadable.
   */
  function rollDiceExpr(expr, rng = Math.random) {
    const e = String(expr || "").toLowerCase().replace(/\s+/g, "").replace(/d%/g, "d100");
    if (!e || e.length > 60 || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(e)) return null;
    const terms = [];
    let dice = 0;
    for (const [, sign, body] of e.matchAll(/([+-]?)(\d*d\d+|\d+)/g)) {
      const k = sign === "-" ? -1 : 1;
      const m = body.match(/^(\d*)d(\d+)$/);
      if (!m) { terms.push({ text: sign + body, rolls: [], value: k * +body }); continue; }
      const n = +(m[1] || 1), sides = +m[2];
      dice += n;
      if (n < 1 || sides < 2 || sides > 1000 || dice > 100) return null;
      const rolls = Array.from({ length: n }, () => rollDie(sides, rng));
      terms.push({ text: sign + body, rolls, value: k * rolls.reduce((a, b) => a + b, 0) });
    }
    const total = terms.reduce((a, t) => a + t.value, 0);
    const detail = terms.map((t, i) => `${i && t.value >= 0 ? "+ " : t.value < 0 ? "− " : ""}${t.rolls.length ? `${t.text.replace(/^[+-]/, "")} [${t.rolls.join(", ")}]` : Math.abs(t.value)}`).join(" ");
    return { total, detail, terms };
  }

  /** Parse Sanity loss notation "success/failure", e.g. "0/1d6" or "1/1d4+1". */
  function parseSanityLoss(text) {
    const parts = String(text || "").split("/").map((x) => x.trim());
    if (parts.length !== 2 || !rollExpr(parts[0], () => 0) || !rollExpr(parts[1], () => 0)) return null;
    return { success: parts[0], failure: parts[1] };
  }
  /** Sanity check (d% ≤ current Sanity) and the resulting loss (p.46-48). */
  function sanityCheck(c, notation, rng = Math.random) {
    const loss = parseSanityLoss(notation);
    if (!loss) return null;
    const current = sanity(c).current;
    const roll = rollDie(100, rng);
    const success = roll <= current;
    const amount = rollExpr(success ? loss.success : loss.failure, rng);
    return { roll, current, success, expr: success ? loss.success : loss.failure, amount: amount.total, dice: amount.rolls, bonus: amount.bonus || 0 };
  }
  /** Roll temporary insanity: Table 4-1 for duration, then 4-2 or 4-3 for the effect. */
  function rollTemporaryInsanity(rng = Math.random) {
    const d10 = rollDie(10, rng);
    const kind = TEMP_INSANITY_DURATION.find((r) => d10 <= r.max);
    let pct = rollDie(100, rng);
    let table = kind.type === "short" ? SHORT_TEMP_INSANITY : LONG_TEMP_INSANITY;
    let effect = lookup(table, pct);
    let rerolled = null;
    if (kind.type === "short" && pct === 100) { rerolled = rollDie(100, rng); effect = lookup(LONG_TEMP_INSANITY, rerolled); }
    const length = kind.type === "short" ? `${rollExpr("1d10+4", rng).total} rounds` : `${rollDie(10, rng) * 10} hours`;
    return { d10, kind: kind.label, duration: kind.duration, length, roll: pct, rerolled, effect };
  }
  /** Roll indefinite insanity on Table 4-4; it lasts 1d6 game months (p.49). */
  function rollIndefiniteInsanity(rng = Math.random) {
    const pct = rollDie(100, rng);
    return { roll: pct, disorder: lookup(INDEFINITE_INSANITY, pct), months: rollDie(6, rng) };
  }

  /** Worked example used by v2/DESIGNS.md and the tests (3rd-level Professor, age 52). */
  function sampleCharacter() {
    const c = newCharacter({
      name: "Dr. Kristof Lehmann (sample)", gender: "M", age: 52, era: "1921-1940", profession: "Professor", level: 3,
      attackOption: "defense", goodSaves: ["ref", "will"],
      abilities: { Str: 10, Dex: 12, Con: 13, Int: 15, Wis: 14, Cha: 11 },
      coreSkills: ["Concentration", "Diplomacy", "Gather Information", "Knowledge (history)", "Knowledge (occult)", "Knowledge (archaeology)", "Research", "Speak Other Language (Latin)", "Spot", "Listen", "Search", "Heal"],
      skills: {
        "Knowledge (occult)": { ranks: 6 }, "Knowledge (history)": { ranks: 6 }, "Knowledge (archaeology)": { ranks: 5 }, Research: { ranks: 6 },
        Spot: { ranks: 6 }, Listen: { ranks: 6 }, "Speak Other Language (Latin)": { ranks: 4 }, Search: { ranks: 6 }, Heal: { ranks: 4 },
        Concentration: { ranks: 4 }, Diplomacy: { ranks: 4 }, "Gather Information": { ranks: 3 }, Drive: { ranks: 3 },
      },
      feats: [{ name: "Alertness" }, { name: "Weapon Proficiency", choice: "pistol" }, { name: "Iron Will" }],
      money: { roll: 4, cash: null, notes: "" },
      weapons: [{ id: uid(), name: "Handgun (9mm)", category: "pistol", damage: "1d10", critical: "×3", range: "20 ft", capacity: 9, ammo: 9, rof: "Multifire", weight: 2 }],
      equipment: [{ id: uid(), name: "Flashlight", qty: 1, weight: 1 }, { id: uid(), name: "Notebook & pencil", qty: 1, weight: 0.5 }, { id: uid(), name: "First aid kit", qty: 1, weight: 3 }],
      notes: "Assistant professor of history. Sample character for checking the sheet's numbers.",
    });
    c.levelLog = [{ level: 1, intMod: null, hpRoll: null }, { level: 2, intMod: null, hpRoll: 4 }, { level: 3, intMod: null, hpRoll: 3 }];
    return lockIntMods(normalize(c), 1);
  }

  return {
    SCHEMA_VERSION, ABILITIES, ABILITY_NAMES, SKILLS, SKILL_BY_NAME, SYNERGIES, PROFESSIONS, PROFESSION_BY_NAME,
    ERAS, AGING, FEATS, FEAT_BY_NAME, ARMOR, WEAPON_PRESETS, WEAPON_CATEGORIES, RANGED_CATEGORIES, FINESSE_WEAPONS,
    toInt, toNum, fmt, abilityMod, rollDie, uid, clone,
    skillBase, skillSpecialty, skillDef,
    baseAttackBonus, attackSequence, baseSave, goodSaveCount, coreMaxRanks, noncoreMaxRanks, featSlots,
    abilityIncreaseLevels, defenseBonus, agingCategory, xpForLevel, offenseBonusFeat, gearWeight, sampleCharacter,
    SANITY_LOSS_EXAMPLES, TEMP_INSANITY_DURATION, SHORT_TEMP_INSANITY, LONG_TEMP_INSANITY, INDEFINITE_INSANITY,
    firearmFullAttack, lookup, rollExpr, rollDiceExpr, SPECIALTIES, CATALOG, catalogPrice, cashOnHand, parseSpellCost, spellSaveDC, tomeStudyBonus, CONDITIONS, CONDITION_BY_KEY, conditionEffects, parseSanityLoss, sanityCheck, rollTemporaryInsanity, rollIndefiniteInsanity,
    SHOTGUN_DAMAGE, TWO_WEAPON, HEIGHT_WEIGHT, DC_EXAMPLES, ABILITY_CHECK_EXAMPLES, ATTACK_MODIFIERS, COVER, CONCEALMENT, rollHeightWeight,
    newCharacter, normalize, abilityScores, mods, saves, combat, isProficient, nonproficiencyPenalty, nonproficientWeapons, weaponAttack, threatRange, parseDamage,
    hitPoints, hpState, sanity, sanityState, loseSanity, gainSanity, newSanityHour, mythosInsanity,
    templateCore, isCore, skillPoints, skillIds, skillTable, money, hasFeat, featCount, featPrereqIssues,
    validate, syncLevelLog, lockIntMods, derive,
  };
});
