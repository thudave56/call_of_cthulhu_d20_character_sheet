/*
 * rules.js — Call of Cthulhu d20 rules data and pure calculation engine.
 *
 * Every table here cites the printed page of the core rulebook it comes from
 * (PDF page = printed page + 2; see docs/rulebook/). The engine is pure: each
 * function takes a character object and returns derived values, so it can be
 * unit-tested in Node (tests/rules.test.js) and shared by every UI design.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CoC = factory();
})(typeof self !== "undefined" ? self : this, function () {
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
    { name: "Multishot", prereq: { abil: { Dex: 13 }, feats: ["Point Blank Shot", "Rapid Shot"] }, text: "Autofire penalty −4 (normally −6); multifire penalty −2 (normally −4)." },
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
      name: "", player: "", gender: "", age: 30, era: "1921-1940",
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
      options: { defenseBonus: false, offenseWeaponProficiency: false },
      armorWeight: 0,          // lb, entered by the player (Table 6-4 lists no weights)
      log: [],
      created: now, updated: now,
    };
    return Object.assign(c, overrides);
  }

  /** Effective ability scores: rolled + aging + level increases − damage (min 1 before damage). */
  function abilityScores(c) {
    const aging = agingCategory(c.age);
    const inc = {};
    for (const e of c.levelLog || []) if (e && e.abilityIncrease) inc[e.abilityIncrease] = (inc[e.abilityIncrease] || 0) + 1;
    const out = {};
    for (const a of ABILITIES) {
      const base = toInt(c.abilities && c.abilities[a], 10);
      const ageMod = ["Str", "Dex", "Con"].includes(a) ? aging.physical : aging.mental;
      const permanent = Math.max(1, base + ageMod + (inc[a] || 0));
      const dmg = Math.max(0, toInt(c.abilityDamage && c.abilityDamage[a], 0));
      const score = Math.max(0, permanent - dmg);
      out[a] = { base, ageMod, increases: inc[a] || 0, permanent, damage: dmg, score, mod: abilityMod(score) };
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
    const ac = 10 + m.Dex + armor.bonus + defBonus;
    const initFeat = featCount(c, "Improved Initiative") ? 4 : 0;
    return {
      bab, sequence: attackSequence(bab),
      melee: bab + m.Str, ranged: bab + m.Dex,
      ac, acParts: { base: 10, dex: m.Dex, armor: armor.bonus, defense: defBonus },
      flatFooted: ac - Math.max(0, m.Dex), touch: 10 + m.Dex + defBonus,
      init: m.Dex + initFeat, initParts: { dex: m.Dex, feat: initFeat },
      speed: 30, armor, acp: armor.acp,
    };
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
    const prof = isProficient(c, weapon) ? 0 : -4;
    const focus = (c.feats || []).some((f) => f.name === "Weapon Focus" && f.choice && f.choice === weapon.name) ? 1 : 0;
    const acp = cb.acp; // armor check penalty also applies to attack rolls (p.94)
    const bonus = cb.bab + m[abil] + prof + focus + acp;
    const seq = cb.sequence.map((b) => b + m[abil] + prof + focus + acp);
    let dmgBonus = 0;
    if (!ranged && weapon.category !== "thrown") dmgBonus = weapon.twoHanded ? Math.floor(m.Str * 1.5) : m.Str;
    if (weapon.category === "thrown") dmgBonus = m.Str;
    if (weapon.category === "unarmed" && hasFeat(c, "Martial Artist")) weapon = Object.assign({}, weapon, { damage: "1d4" });
    const improved = (c.feats || []).some((f) => f.name === "Improved Critical" && f.choice === weapon.name);
    const threat = threatRange(weapon.critical, improved);
    const mult = (String(weapon.critical || "").match(/[×x](\d)/) || [0, 2])[1];
    return {
      ranged, ability: abil, bonus, sequence: seq,
      parts: { bab: cb.bab, ability: m[abil], nonproficient: prof, focus, armor: acp },
      damage: weapon.damage, damageBonus: dmgBonus,
      critical: `${threat < 20 ? threat + "-20" : "20"}/×${mult}`, threat, multiplier: +mult,
      pointBlank: ranged && hasFeat(c, "Point Blank Shot"),
    };
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
    const m = mods(c);
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
    if (p.proficient && feat.choice && d.choice === "weapon") {
      const w = (c.weapons || []).find((x) => x.name === feat.choice);
      if (w && !isProficient(c, w)) out.push(`${d.name} (${feat.choice}) needs Weapon Proficiency (${WEAPON_CATEGORIES[w.category] || w.category})`);
    }
    return out;
  }

  function validate(c, { creation = true } = {}) {
    const issues = [];
    const err = (msg) => issues.push({ level: "error", msg });
    const warn = (msg) => issues.push({ level: "warn", msg });
    if (!String(c.name || "").trim()) err("Character needs a name.");
    for (const a of ABILITIES) {
      const v = toInt(c.abilities && c.abilities[a], NaN);
      if (!Number.isFinite(v) || v < 3 || v > 18) warn(`${ABILITY_NAMES[a]} ${c.abilities && c.abilities[a]} is outside the 3–18 rolled range.`);
    }
    // Saves (Tables 1-8/1-9)
    const need = goodSaveCount(c.attackOption);
    const got = (c.goodSaves || []).length;
    if (got !== need) err(`${c.attackOption === "offense" ? "Offense" : "Defense"} option needs exactly ${need} good save${need > 1 ? "s" : ""} (have ${got}).`);
    // Core skills: 9 template + 3 choice = 12 (p.11)
    const core = c.coreSkills || [];
    if (core.length !== 12) err(`Choose 12 core skills (have ${core.length}): the 9 template skills plus 3 of your choice.`);
    if (core.some((id) => String(id).includes("*"))) err("Pick a specialty for every \"any one\" template skill.");
    if (core.includes("Cthulhu Mythos")) err("Cthulhu Mythos can never be a core skill.");
    if (new Set(core).size !== core.length) err("Core skills must all be different.");
    const tmpl = templateCore(c.profession).filter((id) => !id.includes("*"));
    const missingTmpl = tmpl.filter((id) => !core.includes(id));
    if (missingTmpl.length) warn(`Template core skill(s) swapped out: ${missingTmpl.join(", ")} (needs GM approval, p.11).`);
    // Skill points and maximum ranks
    const sp = skillPoints(c);
    if (sp.remaining < 0) err(`Skill points overspent by ${-sp.remaining}.`);
    else if (sp.remaining > 0 && creation) warn(`${sp.remaining} skill point${sp.remaining > 1 ? "s" : ""} unspent (all points must be spent, p.18).`);
    for (const row of skillTable(c)) {
      if (row.def.mythos) continue;
      if (row.ranks > row.max) err(`${row.id}: ${row.ranks} ranks exceeds the ${row.core ? "core" : "noncore"} maximum of ${row.max}.`);
      if (row.core && row.ranks % 1 !== 0) err(`${row.id}: core skills take whole ranks.`);
      if (!row.core && (row.ranks * 2) % 1 !== 0) err(`${row.id}: noncore ranks go in ½ steps.`);
    }
    if (creation && toInt(c.mythos) > 0) warn("Starting characters cannot have Cthulhu Mythos ranks (p.18); ranks come from play.");
    // Feats
    const slots = featSlots(c);
    if ((c.feats || []).length > slots) err(`Too many feats: ${c.feats.length} of ${slots}.`);
    else if ((c.feats || []).length < slots && creation) warn(`${slots - c.feats.length} feat slot(s) unused.`);
    const seen = new Set();
    for (const f of c.feats || []) {
      const d = FEAT_BY_NAME[f.name];
      const key = f.name + "|" + (f.choice || "");
      if (d && !d.multi && seen.has(f.name)) err(`${f.name} can only be taken once.`);
      if (d && d.multi && !d.stack && seen.has(key)) err(`${f.name} (${f.choice}) taken twice — pick a different ${d.choice}.`);
      seen.add(f.name); seen.add(key);
      for (const m of featPrereqIssues(c, f)) err(m);
    }
    if (offenseBonusFeat(c) && !hasFeat(c, "Weapon Proficiency")) warn("The Offense option's bonus feat must be a Weapon Proficiency (p.15) — pick one.");
    // Level log
    const L = toInt(c.level, 1);
    if ((c.levelLog || []).length !== L) err(`Level history has ${(c.levelLog || []).length} entries for level ${L}.`);
    const hp = hitPoints(c);
    if (hp.missingRolls) warn(`${hp.missingRolls} hit-die roll(s) missing (1d6 per level after 1st).`);
    for (const l of abilityIncreaseLevels(L)) {
      const e = (c.levelLog || [])[l - 1];
      if (!e || !e.abilityIncrease) warn(`Level ${l}: choose an ability score to increase.`);
    }
    if (!money(c).rolled) warn("Starting money not rolled yet.");
    return issues;
  }

  /** Bring levelLog in line with c.level (adds/removes entries). */
  function syncLevelLog(c) {
    const next = clone(c);
    const L = Math.max(1, Math.min(20, toInt(next.level, 1)));
    next.level = L;
    const log = (next.levelLog || []).slice(0, L);
    while (log.length < L) log.push({ level: log.length + 1, intMod: null, hpRoll: null, abilityIncrease: null });
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
  function normalize(raw) {
    const base = newCharacter();
    const c = Object.assign(base, clone(raw || {}));
    c.abilities = Object.assign({}, base.abilities, c.abilities || {});
    c.abilityDamage = Object.assign({ Str: 0, Dex: 0, Con: 0, Int: 0, Wis: 0, Cha: 0 }, c.abilityDamage || {});
    c.sanity = Object.assign(newCharacter().sanity, c.sanity || {});
    c.hp = Object.assign({ current: null, subdual: 0, stable: false }, c.hp || {});
    c.money = Object.assign({ roll: null, cash: null, notes: "" }, c.money || {});
    c.options = Object.assign({ defenseBonus: false, offenseWeaponProficiency: false }, c.options || {});
    for (const k of ["feats", "weapons", "equipment", "coreSkills", "goodSaves", "log"]) if (!Array.isArray(c[k])) c[k] = [];
    if (!c.skills || typeof c.skills !== "object") c.skills = {};
    c.schemaVersion = SCHEMA_VERSION;
    return syncLevelLog(c);
  }

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
      profession: PROFESSION_BY_NAME[c.profession] || null,
    };
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
    abilityIncreaseLevels, defenseBonus, agingCategory, offenseBonusFeat, gearWeight, sampleCharacter,
    newCharacter, normalize, abilityScores, mods, saves, combat, isProficient, weaponAttack, threatRange, parseDamage,
    hitPoints, hpState, sanity, sanityState, loseSanity, gainSanity, newSanityHour, mythosInsanity,
    templateCore, isCore, skillPoints, skillIds, skillTable, money, hasFeat, featCount, featPrereqIssues,
    validate, syncLevelLog, lockIntMods, derive,
  };
});
