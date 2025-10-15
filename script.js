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
  {
    name: "Animal Empathy",
    ability: "Cha",
    trainedOnly: false,
    description: "You can calm, befriend, or train domestic and wild animals. This skill allows you to influence an animal's behavior, handle a frightened mount, teach an animal tricks, or calm an aggressive creature. DC varies by task: calming an animal (DC 15-25), teaching a trick (DC 15), or handling an attack-trained animal (varies)."
  },
  {
    name: "Appraise",
    ability: "Int",
    trainedOnly: false,
    description: "You can estimate the value and authenticity of items. Use this skill to determine the monetary worth of art, antiques, gems, or unusual objects. A successful check (DC 12-20) provides an accurate estimate within 10% of actual value. This skill is essential for antiquarians and dealers in rare objects."
  },
  {
    name: "Balance",
    ability: "Dex",
    trainedOnly: false,
    description: "You can keep your footing on narrow, slippery, or unstable surfaces. Use this to walk on ledges, tightropes, ice, or shifting debris. DC varies by surface width and conditions. With 5+ ranks, you gain +2 synergy bonus to Jump and Tumble checks. Failure may result in falling."
  },
  {
    name: "Bluff",
    ability: "Cha",
    trainedOnly: false,
    description: "You can deceive others through lies, misdirection, or acting. Use this to tell convincing lies, create diversions, pass secret messages, or feint in combat. Opposed by target's Sense Motive. With 5+ ranks, gain +2 synergy bonus to Diplomacy, Intimidate, and Sleight of Hand. Critical for con artists and undercover agents."
  },
  {
    name: "Climb",
    ability: "Str",
    trainedOnly: false,
    description: "You can scale walls, cliffs, and other vertical surfaces. DC varies by surface: ladder (DC 0), rope (DC 5-15), rough wall (DC 15), smooth wall (DC 25). Failure by 5+ means you fall. With 5+ ranks, gain +2 synergy bonus to Use Rope checks. Essential for urban exploration and outdoor adventures."
  },
  {
    name: "Computer Use",
    ability: "Int",
    trainedOnly: false,
    description: "You can operate computers, search databases, hack systems, and write programs. Use this to find information online (DC 10-25), break into secured systems (DC 20-40), or recover deleted files. Higher DCs for encrypted or well-protected systems. Essential for modern-era investigators."
  },
  {
    name: "Concentration",
    ability: "Con",
    trainedOnly: false,
    description: "You can maintain focus under duress, particularly when casting spells or using psychic powers. Use this to cast defensively (DC 15 + spell level), maintain concentration when damaged, or resist distractions. Essential for spellcasters and psychics. Some feats (like Combat Casting) provide bonuses."
  },
  {
    name: "Craft",
    ability: "Int",
    trainedOnly: false,
    description: "You can create or repair objects in a specific craft (photography, writing, mechanics, etc.). Use this to create items, repair broken objects, or assess quality of craftsmanship. DC varies by complexity. With 5+ ranks, gain +2 synergy bonus to Appraise checks for items of your craft specialty."
  },
  {
    name: "Cthulhu Mythos",
    ability: null,
    trainedOnly: true,
    description: "You possess forbidden knowledge of alien entities, dark rituals, and cosmic horrors. This skill has no ability modifier—only ranks matter. Each rank reduces your maximum Sanity by 1 (max Sanity = 99 - ranks). Use this to identify monsters, recall occult lore, or decipher eldritch texts. Gaining ranks may require encountering the Mythos or studying forbidden tomes. High ranks = low Sanity."
  },
  {
    name: "Demolitions",
    ability: "Int",
    trainedOnly: true,
    description: "You can set, disarm, and work with explosives safely. Use this to plant bombs, calculate blast radii, disarm explosive traps, or identify explosive types. DC varies by complexity and stability. Failure when disarming may trigger the explosive. This skill requires training—you cannot attempt it untrained."
  },
  {
    name: "Diplomacy",
    ability: "Cha",
    trainedOnly: false,
    description: "You can negotiate, persuade, and influence others through tact and social grace. Use this to change attitudes (hostile to friendly), negotiate deals, or gather information from cooperative sources. With 5+ ranks from Bluff or Sense Motive, gain +2 synergy bonus. Essential for social characters and investigators."
  },
  {
    name: "Disguise",
    ability: "Cha",
    trainedOnly: false,
    description: "You can alter your appearance to appear as someone else or hide your identity. Use makeup, clothing, and mannerisms to change gender (+2 DC), race (+5 DC), or age category (+5 DC). Opposed by Spot checks. Takes 10 minutes to create. Useful for infiltration and undercover work."
  },
  {
    name: "Drive",
    ability: "Dex",
    trainedOnly: false,
    description: "You can operate ground vehicles including cars, trucks, and motorcycles. Use this for routine driving, evasive maneuvers (DC 15), high-speed chases, or controlling a vehicle in bad conditions. Failure may result in accidents or loss of control. Represents both skill and experience with vehicles."
  },
  {
    name: "Escape Artist",
    ability: "Dex",
    trainedOnly: false,
    description: "You can slip free from bonds, squeeze through tight spaces, or wriggle out of grapples. DC varies by restraint type: rope (DC 20), handcuffs (DC 30), masterwork manacles (DC 35). With 5+ ranks from Use Rope, gain +2 synergy bonus. Takes 1 minute or more depending on binding. Essential for captured investigators."
  },
  {
    name: "Forgery",
    ability: "Int",
    trainedOnly: true,
    description: "You can create false documents or detect forged items. Creating a forgery takes time proportional to the document's length. Your check is opposed by the reader's Forgery check. Simple documents (letter) are easier than complex ones (contracts, official papers with seals). With related Craft skill, may gain bonus. Requires training to attempt."
  },
  {
    name: "Gather Information",
    ability: "Cha",
    trainedOnly: false,
    description: "You can collect rumors, gossip, and information from local contacts and informants. Make a check after 1d4+1 hours of mingling. DC 10 for common knowledge, DC 15-25 for obscure or protected information. With 5+ ranks from Knowledge or Bluff, may gain +2 synergy bonus. Core skill for urban investigators."
  },
  {
    name: "Handle Animal",
    ability: "Cha",
    trainedOnly: false,
    description: "You can train, command, and work with domesticated animals. Use this to teach tricks, train for specific tasks (guard, attack, perform), or control a mount in combat. DC varies by task and animal intelligence. With 5+ ranks, gain +2 synergy bonus to Ride checks. Takes weeks to train an animal fully."
  },
  {
    name: "Heal",
    ability: "Wis",
    trainedOnly: false,
    description: "You can provide medical care and treat injuries. Use this for first aid (DC 15, restore 1 HP), treat wounds from Cthulhu Mythos creatures, treat poison or disease, perform surgery, or provide long-term care. Without a healer's kit, you take -2 penalty. Essential for keeping your party alive during investigations."
  },
  {
    name: "Hide",
    ability: "Dex",
    trainedOnly: false,
    description: "You can conceal yourself from observation. Opposed by observers' Spot checks. You need cover or concealment to attempt. Size modifier applies (Large -8, Tiny +8). With 5+ ranks from Move Silently, gain +2 synergy bonus. You must remain stationary or move at half speed. Essential for stealth and ambushes."
  },
  {
    name: "Innuendo",
    ability: "Wis",
    trainedOnly: false,
    description: "You can send and interpret hidden messages in seemingly normal conversation. Use this to communicate secretly in public or detect when others are doing so. Both parties roll Innuendo opposed by listeners' Sense Motive. Useful for passing information without alerting enemies or eavesdroppers."
  },
  {
    name: "Intimidate",
    ability: "Cha",
    trainedOnly: false,
    description: "You can frighten, coerce, or bully others through threats and force of personality. Opposed by target's level check or Intimidate. Success makes target shaken (-2 to attacks, saves, checks) for 1d6 rounds or longer. With 5+ ranks from Bluff, gain +2 synergy. Can demoralize foes in combat or extract information."
  },
  {
    name: "Jump",
    ability: "Str",
    trainedOnly: false,
    description: "You can leap across gaps or reach high places. DC equals distance in feet for long jump (running start) or 4× distance for standing jump. High jump DC = 4× height in feet. With 5+ ranks from Balance or Tumble, gain +2 synergy bonus. Run feat provides +4 after running start. Useful for chase scenes."
  },
  {
    name: "Knowledge",
    ability: "Int",
    trainedOnly: true,
    description: "You have studied a specific field (history, occult, medicine, etc.). Use this to recall facts about your specialty. DC 10 for common knowledge, DC 15-20 for uncommon, DC 25+ for rare or esoteric. With 5+ ranks, gain +2 synergy to Research checks. Must specify a specialty when taking ranks. Cannot use untrained."
  },
  {
    name: "Listen",
    ability: "Wis",
    trainedOnly: false,
    description: "You can hear faint sounds, detect creatures, or overhear conversations. Opposed by Move Silently or uses a DC (DC 0 for normal conversation, DC 10 for whisper, DC 15 through door). Distance and conditions modify DC. With 5+ ranks, +2 synergy to certain checks. Essential for detecting ambushes and eavesdropping."
  },
  {
    name: "Move Silently",
    ability: "Dex",
    trainedOnly: false,
    description: "You can move without making noise. Opposed by observers' Listen checks. Move at half speed or take -5 penalty for full speed. With 5+ ranks from Hide, gain +2 synergy bonus. Essential for stealth operations, sneaking past guards, or stalking creatures without alerting them."
  },
  {
    name: "Open Lock",
    ability: "Dex",
    trainedOnly: true,
    description: "You can pick locks and disable mechanical locking mechanisms. Requires thieves' tools. DC varies by lock quality: simple (DC 20), average (DC 25), good (DC 30), masterwork (DC 40). Takes 1 minute or more. Without proper tools, take -2 penalty or cannot attempt. Requires training to use."
  },
  {
    name: "Operate Heavy Machinery",
    ability: "Dex",
    trainedOnly: false,
    description: "You can operate large vehicles and equipment like bulldozers, cranes, forklifts, or construction equipment. DC 15 for routine operation, higher for complex maneuvers or emergency situations. Useful in industrial settings, construction sites, or when you need to move heavy objects."
  },
  {
    name: "Performance",
    ability: "Cha",
    trainedOnly: false,
    description: "You can entertain an audience through acting, singing, dancing, or playing an instrument. DC 10 for routine performance, DC 15 for memorable, DC 20+ for masterwork. Can earn money through performances. Also useful for creating distractions, going undercover as an entertainer, or impressing NPCs."
  },
  {
    name: "Pilot",
    ability: "Dex",
    trainedOnly: false,
    description: "You can operate aircraft including planes, helicopters, or other flying vehicles. DC 15 for routine flight, higher for difficult maneuvers, bad weather, or emergency landings. Failure may result in crashes. Different aircraft types may require separate specializations in your GM's campaign."
  },
  {
    name: "Psychic Focus",
    ability: "Wis",
    trainedOnly: true,
    description: "You can focus your mind to use psychic powers. Required for all psychic feats (Remote Viewing, Mind Reading, Psychokinesis, etc.). DC varies by specific power and circumstances. Each use typically costs Sanity points. Higher ranks increase chance of success with psychic abilities. Requires training—represents years of mental discipline."
  },
  {
    name: "Psychoanalysis",
    ability: "Wis",
    trainedOnly: true,
    description: "You can treat mental disorders and restore lost Sanity through therapy. Requires extended therapy sessions (weeks or months). Use this to help characters recover from insanity or regain lost Sanity points. DC varies by disorder severity. Essential for treating the psychological trauma common in Mythos investigations. Requires training."
  },
  {
    name: "Read Lips",
    ability: "Int",
    trainedOnly: true,
    description: "You can understand speech by watching a speaker's lips. Requires line of sight to the speaker's mouth. DC 15 for normal speech, higher for fast speech, distance, or obstructions. Can only understand languages you know. Useful for surveillance, spying on conversations through windows, or in loud environments. Requires training."
  },
  {
    name: "Repair",
    ability: "Dex",
    trainedOnly: false,
    description: "You can fix broken mechanical and electronic devices. DC varies by damage and complexity. Simple repairs (DC 10-15) take minutes. Complex repairs (DC 20-30) take hours. Can improvise repairs at +5 DC. Useful for fixing vehicles, weapons, locks, or other equipment during investigations."
  },
  {
    name: "Research",
    ability: "Int",
    trainedOnly: false,
    description: "You can find information in libraries, archives, databases, and records. DC varies by how obscure the information is. Takes 1d4 hours. With 5+ ranks from Knowledge, gain +2 synergy bonus. Essential for investigators researching clues, historical events, or background on suspects and locations."
  },
  {
    name: "Ride",
    ability: "Dex",
    trainedOnly: false,
    description: "You can control and ride horses or other mounts. DC 5 for routine riding, DC 15 for controlling frightened mount, DC 20 for combat riding or trick riding. With 5+ ranks from Handle Animal, gain +2 synergy. Useful in rural areas or historical settings where horses are common transportation."
  },
  {
    name: "Search",
    ability: "Int",
    trainedOnly: false,
    description: "You can find hidden objects, secret doors, traps, or clues. DC varies by concealment quality: simple hidden object (DC 10), well-hidden (DC 20), secret door (DC 20), trap (DC 20+). Takes 1 minute per 5-foot square. Essential for investigators finding evidence, detecting traps, or discovering hidden compartments."
  },
  {
    name: "Sense Motive",
    ability: "Wis",
    trainedOnly: false,
    description: "You can detect lies, gauge emotions, and read body language. Opposed by target's Bluff check or DC 20 to detect mental influence. Use this to tell if someone is lying, sense hostile intent, or determine if someone is under magical influence. With 5+ ranks, gain +2 synergy to Diplomacy. Critical for investigators."
  },
  {
    name: "Sleight of Hand",
    ability: "Dex",
    trainedOnly: true,
    description: "You can pick pockets, palm objects, or perform close-up magic. Opposed by observers' Spot checks. DC varies by object size and observer attention. Use to steal items, plant evidence, conceal weapons, or perform magic tricks. Requires training—represents years of manual dexterity practice."
  },
  {
    name: "Spellcraft",
    ability: "Int",
    trainedOnly: true,
    description: "You can identify spells, magic items, and magical effects. Use this to recognize spells being cast (DC 15 + spell level), identify magic items (DC varies), or understand magical writing. Essential for characters dealing with sorcery or studying magical tomes. Requires training in arcane lore."
  },
  {
    name: "Spot",
    ability: "Wis",
    trainedOnly: false,
    description: "You can notice details, see hidden creatures, or detect visual anomalies. Opposed by Hide checks or uses a DC for spotting objects (DC varies by distance and concealment). Use to notice ambushes, spot clues, read lips (with Read Lips skill), or see invisible creatures. With 5+ ranks, +2 synergy to certain checks."
  },
  {
    name: "Swim",
    ability: "Str",
    trainedOnly: false,
    description: "You can move through water effectively. DC 10 for calm water, DC 15 for rough water, DC 20 for stormy water. Failure by 5+ means you go underwater and must hold breath. Armor and encumbrance apply heavy penalties. Each hour of swimming requires a check. Essential for aquatic adventures or escaping floods."
  },
  {
    name: "Tumble",
    ability: "Dex",
    trainedOnly: true,
    description: "You can perform acrobatic stunts, rolls, and flips. Use this to avoid attacks of opportunity when moving through threatened squares (DC 15), reduce falling damage (DC 15, reduce 10 feet), or stand from prone as a free action (DC 25). With 5+ ranks, gain +2 synergy to Balance and Jump. Requires training."
  },
  {
    name: "Use Rope",
    ability: "Dex",
    trainedOnly: false,
    description: "You can tie knots, secure prisoners, or use ropes effectively. DC varies by task: secure binding (DC 15), special knot (DC 15-20), bind a struggling captive (opposed by Escape Artist). With 5+ ranks, gain +2 synergy to Climb and Escape Artist checks. Useful for climbing, restraining suspects, or creating makeshift solutions."
  },
  {
    name: "Wilderness Lore",
    ability: "Wis",
    trainedOnly: false,
    description: "You can survive in the wild, track creatures, and navigate natural terrain. Use this to follow tracks (with Track feat), avoid getting lost, find food and shelter, predict weather, or identify natural hazards. DC varies by task and conditions. Essential for outdoor adventures and rural investigations."
  },
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
      "Computer Use [Int]",
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
// Enhanced feat definitions with detailed descriptions
// fullDescription: Add detailed text from your Call of Cthulhu d20 rulebook here
// The description field contains factual mechanical information
// The fullDescription field is for you to paste rulebook flavor text

const feats = [
  // ======== GENERAL FEATS ========
  {
    name: "Acrobatic",
    prereqs: null,
    description: "You have exceptional coordination and balance. You gain a +2 bonus on all Jump checks and Tumble checks. This feat is particularly useful for characters who need to navigate difficult terrain or perform athletic maneuvers in combat.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Jump", "Tumble"],
    impactedSkills: ["Jump", "Tumble"]
  },
  {
    name: "Alertness",
    prereqs: null,
    description: "You are unusually alert and aware of your surroundings. You gain a +2 bonus on all Listen checks and Spot checks. This feat helps you notice hidden dangers, detect ambushes, and overhear important conversations.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Listen", "Spot"],
    impactedSkills: ["Listen", "Spot"]
  },
  {
    name: "Ambidexterity",
    prereqs: "Dex 15+",
    description: "You are equally proficient with both hands. When fighting with two weapons, your penalties on attack rolls are reduced. Specifically, your off-hand weapon penalty is reduced by 4 (from -4 to 0 for a light weapon, or from -8 to -4 for a medium weapon), and your primary hand penalty is reduced by 2 (from -6 to -4 normally). This feat is essential for effective two-weapon fighting.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Animal Affinity",
    prereqs: null,
    description: "You have a natural empathy and rapport with animals. You gain a +2 bonus on all Handle Animal checks and Ride checks. This feat is valuable for characters who work with horses, dogs, or other trained animals.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Handle Animal", "Ride"],
    impactedSkills: ["Handle Animal", "Ride"]
  },
  {
    name: "Athletic",
    prereqs: null,
    description: "You are physically fit and have trained your body for strength and endurance. You gain a +2 bonus on all Climb checks and Swim checks. This feat is useful for characters who frequently need to scale walls, swim across rivers, or engage in physical pursuits.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Climb", "Swim"],
    impactedSkills: ["Climb", "Swim"]
  },
  {
    name: "Blind-Fight",
    prereqs: null,
    description: "You are skilled at fighting in conditions of poor visibility. In melee combat, you do not lose your Dexterity bonus to AC against invisible attackers. You can reroll miss chances from concealment (but must take the second roll). You take only half the usual penalty for fighting in darkness. This feat is crucial when facing invisible enemies or fighting in supernatural darkness.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Cautious",
    prereqs: null,
    description: "You are careful and methodical in your approach to dangerous tasks. You gain a +2 bonus on all Demolitions checks and Disable Device checks. This feat represents steady hands and careful attention to detail when working with traps, explosives, and delicate mechanisms.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Demolitions", "Disable Device"],
    impactedSkills: ["Demolitions", "Disable Device"]
  },
  {
    name: "Combat Casting",
    prereqs: null,
    description: "You are skilled at casting spells in threatening situations. You gain a +4 bonus on Concentration checks made to cast a spell while on the defensive or while grappled. This feat is essential for spellcasters who expect to be in melee combat.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: ["Concentration"]
  },
  {
    name: "Dodge",
    prereqs: "Dex 13+",
    description: "You are adept at avoiding attacks. During your action, you designate a single opponent. You gain a +1 dodge bonus to Armor Class against attacks from that opponent. You can select a new opponent on any action. This is a dodge bonus and stacks with other bonuses to AC.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Mobility",
    prereqs: "Dex 13+, Dodge",
    description: "You are skilled at maneuvering in combat. You gain a +4 dodge bonus to Armor Class against attacks of opportunity provoked when you move out of or through a threatened square. This feat is valuable for mobile combatants who need to reposition frequently.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Spring Attack",
    prereqs: "Dex 13+, Dodge, Mobility, Base Attack +4",
    description: "You are trained in mobile melee tactics. When using an attack action, you can move both before and after your attack, provided your total movement doesn't exceed your speed. Moving in this way does not provoke an attack of opportunity from the defender you attack (though it may provoke from other nearby enemies). You must move at least 5 feet both before and after the attack.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Drive-By Attack",
    prereqs: null,
    description: "You are trained in making ranged attacks while driving a vehicle. When you are driving a vehicle and take an attack action with a ranged weapon, you may move both before and after the attack, provided your total movement does not exceed your vehicle's speed. Moving in this way does not provoke an attack of opportunity from the defender you attack.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Endurance",
    prereqs: null,
    description: "You have exceptional physical stamina. You gain a +4 bonus on checks to continue running, to avoid damage from starvation or thirst, to hold your breath, and to avoid damage from hot or cold environments. You can sleep in light or medium armor without becoming fatigued. This feat represents superior physical resilience.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Expertise",
    prereqs: "Int 13+",
    description: "You are trained in defensive fighting techniques. When you use the attack action or full attack action in melee, you can take a penalty of up to -5 on your attack roll and gain a dodge bonus to AC equal to the penalty. The bonus and penalty last until your next action. This feat allows you to trade offense for defense.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Gearhead",
    prereqs: null,
    description: "You are skilled with technology and mechanical devices. You gain a +2 bonus on all Computer Use checks and Repair checks. This feat is valuable for characters who work with electronics, computers, and machinery.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Computer Use", "Repair"],
    impactedSkills: ["Computer Use", "Repair"]
  },
  {
    name: "Great Fortitude",
    prereqs: null,
    description: "You have exceptional physical resilience and resistance to harm. You gain a +2 bonus on all Fortitude saving throws. This bonus can help you resist poison, disease, death effects, and physical afflictions.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    saves: { fort: 2 },
    impactedSkills: []
  },
  {
    name: "Improved Critical",
    prereqs: "Base Attack +8, Weapon Focus (chosen weapon)",
    description: "You have mastered the art of dealing critical hits with one chosen weapon. Your threat range with that weapon is doubled. For example, a weapon that normally threatens a critical on a roll of 20 now threatens on 19-20. A weapon that threatens on 19-20 now threatens on 17-20. This feat significantly increases your damage potential with your chosen weapon.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Improved Initiative",
    prereqs: null,
    description: "You have exceptional reflexes and react quickly in combat. You gain a +4 bonus on initiative checks. This feat helps ensure you act early in combat rounds, potentially allowing you to strike first or take cover before enemies can act.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Iron Will",
    prereqs: null,
    description: "You have exceptional mental fortitude and willpower. You gain a +2 bonus on all Will saving throws. This bonus helps you resist mind-affecting spells, fear effects, and mental assaults from supernatural entities.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    saves: { will: 2 },
    impactedSkills: []
  },
  {
    name: "Lightning Reflexes",
    prereqs: null,
    description: "You have exceptional agility and quick reflexes. You gain a +2 bonus on all Reflex saving throws. This bonus helps you dodge area effects, avoid traps, and react quickly to sudden dangers.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    saves: { ref: 2 },
    impactedSkills: []
  },
  {
    name: "Martial Artist",
    prereqs: null,
    description: "You are trained in unarmed combat techniques. Your unarmed strikes deal more damage than normal (1d6 for Medium characters, instead of 1d3), and you are considered armed even when unarmed (meaning you do not provoke attacks of opportunity when making unarmed strikes). This feat is essential for characters who fight without weapons.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Nimble",
    prereqs: null,
    description: "You are graceful and quick on your feet. You gain a +2 bonus on all Balance checks and Escape Artist checks. This feat is useful for characters who need to maintain footing on unstable surfaces or slip free from bonds and grapples.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Balance", "Escape Artist"],
    impactedSkills: ["Balance", "Escape Artist"]
  },
  {
    name: "Persuasive",
    prereqs: null,
    description: "You have a way with words and people. You gain a +2 bonus on all Bluff checks and Intimidate checks. This feat represents natural charisma and the ability to influence others through deception or force of personality.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Bluff", "Intimidate"],
    impactedSkills: ["Bluff", "Intimidate"]
  },
  {
    name: "Point Blank Shot",
    prereqs: null,
    description: "You are skilled at making precise ranged attacks at close range. You gain a +1 bonus on attack rolls and damage rolls with ranged weapons at ranges of up to 30 feet. This feat is the foundation for many ranged combat feat chains.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Far Shot",
    prereqs: "Point Blank Shot",
    description: "You are skilled at making ranged attacks at long distances. When you use a projectile weapon, its range increment increases by one-half (multiply by 1.5). For example, a rifle with a range increment of 80 feet has a range increment of 120 feet for you. This feat reduces range penalties for distant shots.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Precise Shot",
    prereqs: "Point Blank Shot",
    description: "You are skilled at firing into melee without hitting allies. You can shoot or throw ranged weapons at an opponent engaged in melee without suffering the standard -4 penalty. This feat is essential for ranged combatants supporting allies in close combat.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Rapid Shot",
    prereqs: "Dex 13+, Point Blank Shot",
    description: "You can make ranged attacks with exceptional speed. When using a full attack action with a ranged weapon, you can fire one additional attack, taking a -2 penalty on all attack rolls that round. This extra attack is at your highest attack bonus.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Multishot",
    prereqs: "Dex 17+, Rapid Shot, Base Attack +6",
    description: "You can fire multiple arrows or projectiles simultaneously. As a standard action, you may fire two arrows at a single target. Both arrows use the same attack roll (with a -4 penalty) to determine success and deal damage normally. For every 5 points of base attack bonus above +6, you may add one additional arrow, to a maximum of four at +16 base attack.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Shot on the Run",
    prereqs: "Dex 13+, Dodge, Mobility, Point Blank Shot, Base Attack +4",
    description: "You are highly mobile with ranged weapons. When using an attack action with a ranged weapon, you can move both before and after the attack, provided your total movement doesn't exceed your speed. This feat allows hit-and-run tactics with ranged weapons.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Rolling Shot",
    prereqs: null,
    description: "You can dive or roll while making ranged attacks. When you take a standard action to make a ranged attack, you can also move 5 feet and drop prone. This movement does not provoke attacks of opportunity. Being prone provides a +4 bonus to AC against ranged attacks but a -4 penalty to AC against melee attacks.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Power Attack",
    prereqs: "Str 13+",
    description: "You can make exceptionally deadly melee attacks by sacrificing accuracy for power. On your action, before making attack rolls for a round, you can choose to subtract a number from all melee attack rolls and add the same number to all melee damage rolls. The penalty and bonus last until your next turn. You cannot reduce your attack bonus below 0, and the maximum penalty/bonus is equal to your base attack bonus.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Cleave",
    prereqs: "Str 13+, Power Attack",
    description: "You can follow through with powerful melee attacks. If you deal enough damage to a creature to reduce it to 0 hit points or below, you get an immediate extra melee attack against another creature within reach. You can only use this ability once per round and cannot take a 5-foot step before making this extra attack.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Quick Draw",
    prereqs: "Base Attack +1",
    description: "You can draw weapons with startling speed. You can draw a weapon as a free action instead of a move action. You can draw a hidden weapon as a move action. If you have a base attack bonus of +1 or higher, you may throw weapons at your full normal rate of attacks.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Run",
    prereqs: null,
    description: "You are exceptionally fast. When running, you move five times your normal speed (if wearing light or no armor) instead of four times. You gain a +4 bonus on Jump checks made after a running start. This feat is useful for characters who need to cover ground quickly or make long jumps.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: ["Jump"]
  },
  {
    name: "Sharp-Eyed",
    prereqs: null,
    description: "You have keen vision and notice fine details. You gain a +2 bonus on all Spot checks and Search checks. This feat is valuable for investigators and scouts who need to find clues, detect hidden objects, or spot distant threats.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Spot", "Search"],
    impactedSkills: ["Spot", "Search"]
  },
  {
    name: "Skill Emphasis",
    prereqs: null,
    description: "You have exceptional talent with one particular skill. Choose one skill. You gain a +3 bonus on all checks with that skill. You can take this feat multiple times, selecting a different skill each time. This feat represents specialized training and natural aptitude.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: ["<chosen skill>"]
  },
  {
    name: "Stealthy",
    prereqs: null,
    description: "You are particularly good at avoiding detection. You gain a +2 bonus on all Hide checks and Move Silently checks. This feat is essential for scouts, thieves, and anyone who needs to avoid being seen or heard.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Hide", "Move Silently"],
    impactedSkills: ["Hide", "Move Silently"]
  },
  {
    name: "Toughness",
    prereqs: null,
    description: "You are tougher than normal. You gain +3 hit points. This feat represents exceptional physical resilience and hardiness. The bonus hit points are permanent and increase if you gain more levels.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    hp: 3,
    impactedSkills: []
  },
  {
    name: "Track",
    prereqs: null,
    description: "You can follow trails and track creatures or people. You can use the Wilderness Lore skill to track creatures. The DC varies based on surface (soft ground DC 5, hard ground DC 20) and conditions (rain, snow, tracking indoors, etc.). You gain information about the creature being tracked based on how much you beat the DC.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Wilderness Lore"],
    impactedSkills: ["Wilderness Lore"]
  },
  {
    name: "Trustworthy",
    prereqs: null,
    description: "You have an honest, trustworthy demeanor. You gain a +2 bonus on all Diplomacy checks and Gather Information checks. People are more inclined to believe you and share information with you. This feat is valuable for investigators and social characters.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    skills: ["Diplomacy", "Gather Information"],
    impactedSkills: ["Diplomacy", "Gather Information"]
  },
  {
    name: "Two-Weapon Fighting",
    prereqs: "Dex 15+",
    description: "You are skilled at fighting with a weapon in each hand. Your penalties for fighting with two weapons are reduced by 2 for each hand. Normally, fighting with two weapons incurs a -6 penalty with your primary hand and -10 with your off-hand. With this feat, these penalties are reduced to -4 and -8 respectively (or -2 and -6 if using a light weapon in your off-hand).",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Wealth",
    prereqs: null,
    description: "You have accumulated wealth and resources beyond your normal starting funds. You gain bonus savings equal to your starting savings amount (essentially doubling your starting money). Additionally, you gain a +2 modifier to income (if using income rules). This feat can be taken multiple times, and its effects stack.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },
  {
    name: "Weapon Finesse",
    prereqs: "Base Attack +1",
    description: "You are skilled at using agility rather than brute force in melee combat. With light weapons and certain other weapons (such as rapiers), you may use your Dexterity modifier instead of your Strength modifier on attack rolls. You still use your Strength modifier for damage rolls. This feat is valuable for agile fighters.",
    fullDescription: "", // Add rulebook text here
    type: "General",
    impactedSkills: []
  },

  // ======== PSYCHIC FEATS ========
  {
    name: "Sensitive",
    prereqs: "Cha 15+",
    description: "You possess latent psychic abilities and sensitivity to supernatural forces. This feat grants baseline psychic awareness and is the prerequisite for all other psychic feats. You may have occasional intuitions, hunches, or vague sensations of supernatural presence, as determined by the GM. This feat does not grant specific psychic powers by itself.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Varies (GM adjudication)",
    cost: "—",
    benefit: "Baseline psychic sensitivity; prerequisite for other psychic feats.",
    impactedSkills: []
  },
  {
    name: "Biofeedback Trance",
    prereqs: "Cha 15+, Sensitive",
    description: "You can enter a controlled trance state that grants enhanced control over your body's functions. Entering or exiting the trance requires a full-round action. While in the trance, you gain benefits such as reduced need for air, resistance to environmental conditions, enhanced healing, or other survival benefits as determined by the GM. The specific benefits and Sanity costs are described in the rulebook.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round to enter/exit",
    cost: "As described by GM",
    benefit: "Enter a controlled trance for survival and recovery benefits.",
    impactedSkills: []
  },
  {
    name: "Remote Viewing",
    prereqs: "Cha 15+, Sensitive, Biofeedback Trance",
    description: "While in a trance, you can project your perceptions to a distant location and perceive events there. This requires a full-round action and a successful Psychic Focus check. The DC varies based on range and familiarity with the location. Success costs 1d4 Sanity points and 1 point of temporary Wisdom damage. Failure costs 1 Sanity point. You perceive the location visually and aurally as if you were there, but cannot interact with anything.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round",
    cost: "1d4 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Perceive a distant place while in trance; DC varies by range/familiarity.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Dowsing",
    prereqs: "Cha 15+, Sensitive",
    description: "You can sense and follow patterns of psychic energy. As a free action, you can attempt to detect and track a specific person, object, or energy pattern by making a Psychic Focus check (DC 15). Success allows you to sense the direction and approximate distance to the target. This costs 1 Sanity point and 1 point of temporary Wisdom damage on success, or 1 Sanity on failure. You can track incorporeal, invisible, or otherwise hidden targets. You lose the trail if the target leaves your current plane of existence.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Free action to activate",
    cost: "1 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Follow a pattern or trail of psychic energy; lose trail if target leaves your plane.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Mind Reading",
    prereqs: "Cha 15+, Sensitive",
    description: "You can read the surface thoughts of a nearby target. This requires a full-round action and a Psychic Focus check. The DC varies based on circumstances (range, target's mental state, etc.). Success allows you to perceive the target's current surface thoughts and immediate mental state, costing 1d4 Sanity points and 1 point of temporary Wisdom damage. Failure costs 1 Sanity point. The target is not aware of being read unless you fail by 10 or more.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round",
    cost: "1d4 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Read surface thoughts of a target within range; DC by circumstances.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Mind Probe",
    prereqs: "Cha 15+, Sensitive, Mind Reading",
    description: "You can delve deep into a target's mind to extract specific information. This requires a full-round action and a Psychic Focus check against a DC modified by proximity, familiarity, the target's mental resistance, and how deeply buried the information is. The target must be within 30 feet. Success reveals the specific information you seek, costing 1d4 Sanity points and 1 point of temporary Wisdom damage. Failure costs 1 Sanity point. The target typically becomes aware they have been mentally invaded.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round",
    cost: "1d4 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Extract specific information from a target within 30 ft; DC by proximity/familiarity/resistance/secrecy.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Psychokinesis",
    prereqs: "Cha 15+, Sensitive",
    description: "You can move objects at a distance using mental force. Activating this power requires a full-round action and a Psychic Focus check. You can exert force equivalent to lifting with your Charisma score as Strength. Simple tasks (opening an unlocked door, pushing a button) have low DCs. Fine manipulation (picking a lock, writing) requires higher DCs. Success costs 1d4 Sanity points and 1 point of temporary Wisdom damage. Failure costs 1 Sanity point. The effect lasts as long as you concentrate.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round to activate",
    cost: "1d4 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Exert minor force at range; fine tasks require higher DCs.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Psychometry",
    prereqs: "Cha 15+, Sensitive",
    description: "You can read psychic impressions from objects. You must maintain physical contact with an object for 1 minute, then spend a full-round action and make a Psychic Focus check. Success reveals strong emotional or historical impressions associated with the object (determined by the GM), costing 1d4 Sanity points and 1 point of temporary Wisdom damage. Failure costs 1 Sanity point. Objects associated with traumatic or supernatural events provide clearer impressions.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round (after 1 minute of focus)",
    cost: "1d4 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Read strong impressions from an object; GM determines details.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Second Sight",
    prereqs: "Cha 15+, Sensitive",
    description: "You can perceive supernatural entities, energies, and auras that are normally invisible or hidden. This is a passive ability that may activate automatically in the presence of supernatural phenomena, though the GM may call for Psychic Focus checks in contested situations (such as an opposed check against a creature's Hide check or concealment effect). You do not suffer Sanity loss from this feat itself, but perceiving horrifying supernatural entities may trigger normal Sanity checks as appropriate.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Varies (often none; GM may call for checks)",
    cost: "— (but discoveries may trigger normal Sanity loss)",
    benefit: "Perceive hidden or invisible supernatural entities/energies.",
    impactedSkills: ["Psychic Focus"]
  },
  {
    name: "Telepathy",
    prereqs: "Cha 15+, Sensitive",
    description: "You can send mental messages to others. This requires a full-round action, line of sight to the target, and a Psychic Focus check (DC varies by circumstances and the target's mental state). Success allows you to send a brief mental message or image (approximately one sentence or one clear visual image), costing 1d4 Sanity points and 1 point of temporary Wisdom damage. Failure costs 1 Sanity point. The recipient perceives the message as a thought or mental image and knows it came from an external source.",
    fullDescription: "", // Add rulebook text here
    type: "Psychic",
    action: "Full-round",
    cost: "1d4 Sanity + 1 temporary Wis (success); 1 Sanity (failure)",
    benefit: "Send a short mental message or image to a target in sight.",
    impactedSkills: ["Psychic Focus"]
  }
];

/**
 * Extract base skill name from profession core skill string.
 * Profession skills may include ability notation like "Bluff [Cha]" or "Knowledge (history) [Int]".
 * This function strips the ability notation and specializations to get the base skill name.
 * @param {string} professionSkill - The profession skill string (e.g., "Bluff [Cha]" or "Knowledge (history) [Int]")
 * @returns {string} The base skill name (e.g., "Bluff" or "Knowledge")
 */
function getBaseSkillName(professionSkill) {
  // Remove ability notation in square brackets: "Bluff [Cha]" → "Bluff"
  const withoutAbility = professionSkill.replace(/\s*\[.*?\]\s*$/, '').trim();

  // For specialized skills like "Knowledge (history)" or "Craft (any one)", extract base skill "Knowledge" or "Craft"
  // Match everything before the first opening parenthesis
  const match = withoutAbility.match(/^([^(]+)/);
  return match ? match[1].trim() : withoutAbility;
}

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
  // Initialize equipment system if available
  if (typeof initializeEquipmentSystem === "function") {
    initializeEquipmentSystem();
  }
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

    // Escape quotes in description for HTML attribute
    const skillDescription = skill.description ? skill.description.replace(/"/g, '&quot;') : '';

    tr.innerHTML = `
      <td class="skill-name" title="${skillDescription}">${skill.name}${trainedIndicator}</td>
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
      const totalAvailable = calculateTotalSkillPoints();

      // Determine max ranks for this specific skill (core vs non-core)
      const row = this.closest("tr");
      const index = parseInt(row.dataset.skillIndex);
      const skill = skills[index];
      const prof = professions[parseInt(document.getElementById("profession").value)];

      // Check if this is a core skill
      const coreCheckbox = row.querySelector(".skill-core-checkbox");
      const isUserMarkedCore = coreCheckbox && coreCheckbox.checked;
      const isProfessionCore = prof.coreSkills.some(profSkill => {
        const baseSkillName = getBaseSkillName(profSkill);
        return baseSkillName === skill.name;
      });
      const isCoreSkill = isProfessionCore || isUserMarkedCore;

      // Core skills: level + 3, Non-core: (level + 3) / 2
      const maxRanksPerSkill = isCoreSkill ? (level + 3) : Math.floor((level + 3) / 2);

      // Check per-skill rank maximum
      if (newValue > maxRanksPerSkill) {
        this.value = maxRanksPerSkill;
        const skillType = isCoreSkill ? "core skill" : "non-core skill";
        alert(`Maximum skill ranks exceeded! At level ${level}, you can have at most ${maxRanksPerSkill} ranks in any ${skillType}. Core skills: Level + 3. Non-core skills: (Level + 3) / 2.`);
        return;
      }

      // Calculate what the total would be with this new value
      const previousValue = parseInt(this.getAttribute('data-previous-value')) || 0;
      const currentSpent = calculateSkillPointsSpent();
      const costOfPreviousValue = isCoreSkill ? previousValue : previousValue * 2;
      const costOfNewValue = isCoreSkill ? newValue : newValue * 2;
      
      // Debug: Let's recalculate without using previous value
      // This avoids issues with uninitialized data-previous-value
      const tempValue = this.value;
      this.value = 0; // Temporarily zero out this field
      const spentWithoutThisSkill = calculateSkillPointsSpent();
      this.value = tempValue; // Restore the temporary value
      
      const projectedTotal = spentWithoutThisSkill + costOfNewValue;

      // Check total skill points limit
      if (projectedTotal > totalAvailable) {
        // Calculate how much we can actually allocate
        const remainingPoints = totalAvailable - spentWithoutThisSkill;
        const maxRanks = isCoreSkill ? remainingPoints : Math.floor(remainingPoints / 2);
        
        this.value = Math.max(0, maxRanks);
        alert(`Skill point limit reached! You have ${totalAvailable} total skill points available (8 + Int modifier × level). You can only allocate ${Math.max(0, maxRanks)} ranks to this skill.`);
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
 * Count how many optional core skills are currently selected (not counting profession core skills)
 */
function countOptionalCoreSkills() {
  const profIndex = parseInt(document.getElementById("profession").value);
  if (isNaN(profIndex) || profIndex < 0 || profIndex >= professions.length) {
    return 0;
  }
  
  const prof = professions[profIndex];
  let optionalCount = 0;
  
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const skill = skills[index];
    const coreCheckbox = row.querySelector(".skill-core-checkbox");
    
    if (coreCheckbox && coreCheckbox.checked && !coreCheckbox.disabled) {
      // This is an optional core skill (checked but not disabled/pre-defined)
      optionalCount++;
    }
  });
  
  return optionalCount;
}

/**
 * Update the core skills selection limit display and validation
 */
function updateCoreSkillsLimit() {
  const optionalCount = countOptionalCoreSkills();
  const professionInfo = document.getElementById("profession-info");
  
  if (professionInfo) {
    // Update the text to show current selection count
    const limitText = professionInfo.querySelector('.core-skills-limit');
    if (limitText) {
      limitText.textContent = `+ three more skills of your choice (${optionalCount}/3 selected)`;
      if (optionalCount >= 3) {
        limitText.style.color = '#d32f2f';
        limitText.style.fontWeight = 'bold';
      } else {
        limitText.style.color = '#666';
        limitText.style.fontWeight = 'normal';
      }
    }
  }
  
  // Enable/disable unchecked optional core skill checkboxes based on limit
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const coreCheckbox = row.querySelector(".skill-core-checkbox");
    if (coreCheckbox && !coreCheckbox.disabled && !coreCheckbox.checked) {
      // This is an unchecked optional core skill
      coreCheckbox.disabled = optionalCount >= 3;
      if (optionalCount >= 3) {
        coreCheckbox.title = "Maximum of 3 optional core skills already selected";
      } else {
        coreCheckbox.title = "Mark as additional core skill for your profession";
      }
    }
  });
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
  infoDiv.innerHTML = `<p><strong>Core Skills:</strong></p><ul>${coreList}</ul><p class="core-skills-limit" style="font-style: italic; color: #666; margin-top: 0.5rem;">+ three more skills of your choice (0/3 selected)</p><p class="desc">${prof.description}</p>`;

  // Update core skill checkboxes: disable and check profession core skills
  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const skill = skills[index];
    const coreCheckbox = row.querySelector(".skill-core-checkbox");

    // Check if this skill matches any profession core skill (comparing base names)
    const isProfessionCoreSkill = prof.coreSkills.some(profSkill => {
      const baseSkillName = getBaseSkillName(profSkill);
      return baseSkillName === skill.name;
    });

    if (isProfessionCoreSkill) {
      // Pre-defined profession skill: check and disable checkbox
      coreCheckbox.checked = true;
      coreCheckbox.disabled = true;
      coreCheckbox.title = "This is a pre-defined core skill for your profession";
    } else {
      // Not a pre-defined skill: enable checkbox for user selection and uncheck it
      coreCheckbox.checked = false;
      coreCheckbox.disabled = false;
      coreCheckbox.title = "Mark as additional core skill for your profession";
    }
  });
  
  // Update the core skills limit display and validation
  updateCoreSkillsLimit();
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
    // Use fullDescription if available and not empty, otherwise fall back to description or benefit
    const tooltipText = (feat.fullDescription && feat.fullDescription.trim())
      ? feat.fullDescription
      : (feat.description || feat.benefit || "");
    label.title = tooltipText;
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
      updateCoreSkillsLimit();
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
  // Export character to file
  document.getElementById("exportButton").addEventListener("click", () => exportCharacterToFile());
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
    const skillName = row.querySelector(".skill-name").textContent.replace(/⚠/g, '').trim();
    if (skillName === "Cthulhu Mythos") {
      mythosRanks = parseInt(row.querySelector(".skill-ranks").value) || 0;
    }
  });
  const maxSanity = 99 - mythosRanks;
  const twentyPercent = Math.floor(maxSanity * 0.2);
  document.getElementById("sanityStarting").textContent = startingSanity;
  document.getElementById("sanityMax").textContent = maxSanity;
  document.getElementById("sanity20").textContent = twentyPercent;

  // Auto-sync current sanity based on mode
  const currentSanityInput = document.getElementById("currentSanity");
  const currentSanityValue = parseInt(currentSanityInput.value) || 0;
  
  // In creation mode, always sync current sanity to starting sanity
  // In gameplay mode, only auto-fill if empty or 0
  const isCreationMode = !document.body.classList.contains('gameplay-mode');
  
  if (isCreationMode) {
    // During character creation, always keep current sanity synced to starting sanity
    currentSanityInput.value = startingSanity;
  } else {
    // During gameplay, only auto-set if current is 0 or empty
    if (currentSanityValue === 0 || currentSanityInput.value.trim() === "") {
      currentSanityInput.value = startingSanity;
    }
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
  const professionElement = document.getElementById("profession");
  const professionIndex = professionElement ? parseInt(professionElement.value) : 0;
  const prof = professions[professionIndex] || professions[0]; // Default to first profession if invalid

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

    // Create detailed tooltip showing the math breakdown
    const tooltipParts = [];
    if (ranks > 0) tooltipParts.push(`${ranks} ranks`);
    if (misc !== 0) tooltipParts.push(`${misc >= 0 ? '+' : ''}${misc} misc`);
    if (abilityMod !== 0) tooltipParts.push(`${abilityMod >= 0 ? '+' : ''}${abilityMod} ${abilityCode} mod`);
    if (featBonus !== 0) tooltipParts.push(`${featBonus >= 0 ? '+' : ''}${featBonus} feat bonus`);
    if (synergyBonus !== 0) tooltipParts.push(`${synergyBonus >= 0 ? '+' : ''}${synergyBonus} synergy`);
    
    // If no components, show base calculation
    if (tooltipParts.length === 0) {
      tooltipParts.push('0 ranks', `${abilityMod >= 0 ? '+' : ''}${abilityMod} ${abilityCode} mod`);
    }
    
    const tooltipText = `${skill.name}: ${tooltipParts.join(' ')} = ${total >= 0 ? '+' : ''}${total}`;
    totalCell.title = tooltipText;

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

    // Check if this skill matches any profession core skill (comparing base names)
    const isProfessionCore = prof.coreSkills.some(profSkill => {
      const baseSkillName = getBaseSkillName(profSkill);
      return baseSkillName === skill.name;
    });

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
  updateSkillPointsTracker();
  updateCoreSkillsLimit();
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
  // Equipment
  character.weapons = weapons || [];
  character.equipment = equipment || [];
  character.armor = {
    preset: document.getElementById("armorPreset").value,
    name: document.getElementById("armorName").value,
    bonus: document.getElementById("armorBonus").value,
    maxDex: document.getElementById("armorMaxDex").value,
    checkPenalty: document.getElementById("armorCheckPenalty").value,
    weight: document.getElementById("armorWeight").value
  };
  character.shield = {
    preset: document.getElementById("shieldPreset").value,
    name: document.getElementById("shieldName").value,
    bonus: document.getElementById("shieldBonus").value,
    checkPenalty: document.getElementById("shieldCheckPenalty").value,
    weight: document.getElementById("shieldWeight").value
  };
  character.speed = document.getElementById("speed").value;
  character.currentMoney = document.getElementById("currentMoney").value;
  character.sessionNotes = document.getElementById("sessionNotes").value;
  // Load existing storage, update and save
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  stored[name] = character;
  localStorage.setItem("cocd20_characters", JSON.stringify(stored));
  populateSavedCharacters();
  alert(`Character '${name}' saved.`);
}

/**
 * Save character silently (without alert popup) for auto-save functionality
 */
function saveCharacterSilent() {
  updateAll();
  const name = document.getElementById("charName").value.trim();
  if (!name) {
    return; // Don't save if no name
  }
  // Build character object (same as saveCharacter but without alert)
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
  // Equipment
  character.weapons = weapons || [];
  character.equipment = equipment || [];
  character.armor = {
    preset: document.getElementById("armorPreset").value,
    name: document.getElementById("armorName").value,
    bonus: document.getElementById("armorBonus").value,
    maxDex: document.getElementById("armorMaxDex").value,
    checkPenalty: document.getElementById("armorCheckPenalty").value,
    weight: document.getElementById("armorWeight").value
  };
  character.shield = {
    preset: document.getElementById("shieldPreset").value,
    name: document.getElementById("shieldName").value,
    bonus: document.getElementById("shieldBonus").value,
    checkPenalty: document.getElementById("shieldCheckPenalty").value,
    weight: document.getElementById("shieldWeight").value
  };
  character.speed = document.getElementById("speed").value;
  character.currentMoney = document.getElementById("currentMoney").value;
  character.sessionNotes = document.getElementById("sessionNotes").value;
  // Load existing storage, update and save
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  stored[name] = character;
  localStorage.setItem("cocd20_characters", JSON.stringify(stored));
  populateSavedCharacters();
  // No alert for silent save
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
  // Equipment
  weapons = character.weapons || [];
  equipment = character.equipment || [];
  if (character.armor) {
    document.getElementById("armorPreset").value = character.armor.preset || "none";
    document.getElementById("armorName").value = character.armor.name || "";
    document.getElementById("armorBonus").value = character.armor.bonus || 0;
    document.getElementById("armorMaxDex").value = character.armor.maxDex || 99;
    document.getElementById("armorCheckPenalty").value = character.armor.checkPenalty || 0;
    document.getElementById("armorWeight").value = character.armor.weight || 0;
  }
  if (character.shield) {
    document.getElementById("shieldPreset").value = character.shield.preset || "none";
    document.getElementById("shieldName").value = character.shield.name || "";
    document.getElementById("shieldBonus").value = character.shield.bonus || 0;
    document.getElementById("shieldCheckPenalty").value = character.shield.checkPenalty || 0;
    document.getElementById("shieldWeight").value = character.shield.weight || 0;
  }
  document.getElementById("speed").value = character.speed || 30;
  document.getElementById("currentMoney").value = character.currentMoney || 0;
  document.getElementById("sessionNotes").value = character.sessionNotes || "";
  // Render equipment (if equipment system is initialized)
  if (typeof renderWeapons === "function") {
    renderWeapons();
    renderEquipment();
    updateArmorClass();
    updateInitiative();
    updateEncumbrance();
  }
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
 * Export the current character to a downloadable JSON file
 */
function exportCharacterToFile() {
  const name = document.getElementById("charName").value.trim();
  if (!name) {
    alert("Please enter a character name before exporting.");
    return;
  }
  
  // Use the silent save function to build the character object
  saveCharacterSilent();
  
  // Get the character data from localStorage
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  const character = stored[name];
  
  if (!character) {
    alert("Character not found. Please save the character first.");
    return;
  }
  
  // Add metadata to the export
  const exportData = {
    characterName: name,
    exportDate: new Date().toISOString(),
    appVersion: "Call of Cthulhu d20 Character Sheet v1.0",
    character: character
  };
  
  // Create and download the file
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_character.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert(`Character '${name}' exported successfully!`);
}

/**
 * Import a character from a JSON file
 */
function importCharacterFromFile() {
  const fileInput = document.getElementById('importFileInput');
  fileInput.click();
}

/**
 * Handle the file selection for import
 */
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.json')) {
    alert('Please select a valid JSON file.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importData = JSON.parse(e.target.result);
      
      // Validate the import data structure
      if (!importData.character || !importData.characterName) {
        alert('Invalid character file format.');
        return;
      }
      
      const characterName = importData.characterName;
      const characterData = importData.character;
      
      // Check if character already exists
      const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
      if (stored[characterName]) {
        if (!confirm(`A character named '${characterName}' already exists. Do you want to overwrite it?`)) {
          return;
        }
      }
      
      // Save the imported character
      stored[characterName] = characterData;
      localStorage.setItem("cocd20_characters", JSON.stringify(stored));
      
      alert(`Character '${characterName}' imported successfully!`);
      
      // Return to dashboard and refresh the character list
      showCharacterSelection();
      
    } catch (error) {
      alert('Error reading character file. Please ensure it is a valid character export.');
      console.error('Import error:', error);
    }
  };
  
  reader.readAsText(file);
  
  // Clear the file input for future use
  event.target.value = '';
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
  updateGameplayDashboard();
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
  const basePoints = Math.max(1, 8 + intMod); // Minimum 1 skill point per level

  // 1st level gets 4x, subsequent levels get 1x
  // Total = (base × 4) + (base × (level - 1))
  // Simplified = base × (level + 3)
  return basePoints * (level + 3);
}

/**
 * Calculate total skill points spent by summing all skill ranks.
 * Core skills: 1 point per rank
 * Non-core skills: 2 points per rank (1 point = 0.5 rank)
 * @returns {number} Total skill points spent
 */
function calculateSkillPointsSpent() {
  const prof = professions[parseInt(document.getElementById("profession").value)];
  let total = 0;

  document.querySelectorAll("#skillsBody tr").forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    const skill = skills[index];
    const ranksInput = row.querySelector(".skill-ranks");
    const ranks = parseInt(ranksInput.value) || 0;

    if (ranks > 0) {
      // Check if this is a core skill (profession core OR user-marked)
      const coreCheckbox = row.querySelector(".skill-core-checkbox");
      const isUserMarkedCore = coreCheckbox && coreCheckbox.checked;

      const isProfessionCore = prof.coreSkills.some(profSkill => {
        const baseSkillName = getBaseSkillName(profSkill);
        return baseSkillName === skill.name;
      });

      const isCoreSkill = isProfessionCore || isUserMarkedCore;

      // Core skills cost 1 point per rank, non-core cost 2 points per rank
      const cost = isCoreSkill ? ranks : ranks * 2;
      total += cost;
    }
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

  // Calculate detailed breakdown for tooltip
  const level = parseInt(document.getElementById("level").value) || 1;
  const intMod = abilityMods.Int || 0;
  const baseCalculated = 8 + intMod;
  const basePoints = Math.max(1, baseCalculated); // Minimum 1 skill point per level
  
  // Create detailed tooltip text
  let tooltipText = `Skill Points Calculation:
Base: 8 points
Intelligence Modifier: ${intMod >= 0 ? '+' + intMod : intMod} points`;

  if (baseCalculated < 1) {
    tooltipText += `
Raw Per Level: ${baseCalculated} (minimum 1)
Effective Per Level: ${basePoints} points`;
  } else {
    tooltipText += `
Per Level: ${basePoints} points`;
  }

  tooltipText += `
Formula: (8 + Int Mod) × (Level + 3), minimum 1 per level
Calculation: max(1, 8 + ${intMod}) × (${level} + 3) = ${basePoints} × ${level + 3} = ${totalAvailable} points`;

  // Update display elements
  const totalElement = document.getElementById("skillPointsTotal");
  totalElement.textContent = totalAvailable;
  totalElement.title = tooltipText;
  
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

    // Feat description - use fullDescription if available, otherwise description or benefit
    const featDesc = document.createElement('div');
    featDesc.className = 'feat-item-description';
    const descText = (feat.fullDescription && feat.fullDescription.trim())
      ? feat.fullDescription
      : (feat.description || feat.benefit || "");
    featDesc.textContent = descText;
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
  
  // Session notes save button
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  if (saveSessionBtn) {
    saveSessionBtn.addEventListener('click', () => {
      const charName = document.getElementById("charName").value.trim();
      if (charName) {
        saveCharacterSilent();
        
        // Provide visual feedback
        const originalText = saveSessionBtn.textContent;
        saveSessionBtn.textContent = '✅ Saved!';
        saveSessionBtn.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
          saveSessionBtn.textContent = originalText;
          saveSessionBtn.style.backgroundColor = '';
        }, 2000);
      } else {
        alert('Please enter a character name to save session notes.');
      }
    });
  }
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
  
  // Auto-save the character with updated HP (silent)
  const charName = document.getElementById("charName").value.trim();
  if (charName) {
    saveCharacterSilent();
  }
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
  
  // Auto-save the character with updated HP (silent)
  const charName = document.getElementById("charName").value.trim();
  if (charName) {
    saveCharacterSilent();
  }
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
  
  // Auto-save the character with updated Sanity (silent)
  const charName = document.getElementById("charName").value.trim();
  if (charName) {
    saveCharacterSilent();
  }
}

/**
 * Restore sanity
 */
function restoreSanity(amount) {
  const currentSanityInput = document.getElementById('currentSanity');
  const maxSanity = parseInt(document.getElementById('sanityMax')?.textContent) || 
                   parseInt(document.getElementById('sanityStarting')?.textContent) || 99;
  const current = parseInt(currentSanityInput.value) || 0;
  const newSanity = Math.min(maxSanity, current + amount);
  currentSanityInput.value = newSanity;
  updateGameplayPanel();
  updateSanity();
  
  // Auto-save the character with updated Sanity (silent)
  const charName = document.getElementById("charName").value.trim();
  if (charName) {
    saveCharacterSilent();
  }
}

/**
 * Update the gameplay panel with current stats
 */
function updateGameplayPanel() {
  // Update character name display in gameplay mode
  const characterName = document.getElementById('charName')?.value?.trim() || 'Unknown Character';
  const gameplayCharacterName = document.getElementById('gameplayCharacterName');
  if (gameplayCharacterName) {
    gameplayCharacterName.textContent = characterName;
  }

  // Update HP display
  const currentHP = parseInt(document.getElementById('currentHP')?.value) || 0;
  const maxHP = parseInt(document.getElementById('hitPoints')?.value) || 0;

  const displayCurrentHP = document.getElementById('displayCurrentHP');
  const displayMaxHP = document.getElementById('displayMaxHP');
  const hpPercentage = document.getElementById('hpPercentage');
  const hpBar = document.getElementById('hpBar');

  if (displayCurrentHP) displayCurrentHP.textContent = currentHP;
  if (displayMaxHP) displayMaxHP.textContent = maxHP;

  const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 100;
  if (hpPercentage) hpPercentage.textContent = `${Math.round(hpPercent)}%`;

  // Update HP bar
  if (hpBar) {
    hpBar.style.width = `${hpPercent}%`;
    hpBar.className = 'vital-bar'; // Reset classes first
    if (displayCurrentHP) displayCurrentHP.className = 'vital-current'; // Reset classes first
    
    if (hpPercent <= 25) {
      hpBar.classList.add('danger');
      if (displayCurrentHP) displayCurrentHP.classList.add('danger');
    } else if (hpPercent <= 50) {
      hpBar.classList.add('warning');
      if (displayCurrentHP) displayCurrentHP.classList.add('warning');
    }
  }

  // Update Sanity display
  const currentSanity = parseInt(document.getElementById('currentSanity')?.value) || 0;
  const maxSanity = parseInt(document.getElementById('sanityMax')?.textContent) || 
                   parseInt(document.getElementById('sanityStarting')?.textContent) || 99;
  
  const displayCurrentSanity = document.getElementById('displayCurrentSanity');
  const displayMaxSanity = document.getElementById('displayMaxSanity');
  const displaySanity20 = document.getElementById('displaySanity20');
  const sanityPercentageElement = document.getElementById('sanityPercentage');

  if (displayCurrentSanity) displayCurrentSanity.textContent = currentSanity;
  if (displayMaxSanity) displayMaxSanity.textContent = maxSanity;
  if (displaySanity20) displaySanity20.textContent = Math.floor(maxSanity * 0.2);

  const sanityPercent = maxSanity > 0 ? (currentSanity / maxSanity) * 100 : 100;
  if (sanityPercentageElement) sanityPercentageElement.textContent = `${Math.round(sanityPercent)}%`;

  // Update Sanity bar
  const sanityBar = document.getElementById('sanityBar');
  if (sanityBar) {
    sanityBar.style.width = `${sanityPercent}%`;
    sanityBar.className = 'vital-bar sanity-bar';
  }

  const sanityCurrent = document.getElementById('displayCurrentSanity');
  if (sanityCurrent) {
    sanityCurrent.className = 'vital-current';
  }

  const thresholdDisplay = document.getElementById('sanityThresholdDisplay');
  if (thresholdDisplay) {
    thresholdDisplay.className = 'sanity-threshold';
  }

  const sanity20Threshold = Math.floor(maxSanity * 0.2);
  if (currentSanity <= sanity20Threshold) {
    if (sanityBar) sanityBar.classList.add('danger');
    if (sanityCurrent) sanityCurrent.classList.add('danger');
    if (thresholdDisplay) thresholdDisplay.classList.add('below-threshold');
  } else if (sanityPercent <= 50) {
    if (sanityBar) sanityBar.classList.add('warning');
    if (sanityCurrent) sanityCurrent.classList.add('warning');
  }

  // Update combat stats
  const baseAttackElement = document.getElementById('baseAttackDisplay');
  const displayBaseAttack = document.getElementById('displayBaseAttack');
  if (baseAttackElement && displayBaseAttack) {
    displayBaseAttack.textContent = baseAttackElement.textContent;
  }

  // Calculate melee and ranged attack
  const baseAttackText = baseAttackElement?.textContent || '+0';
  const baseAttackValue = parseInt(baseAttackText.replace(/[^0-9-]/g, '')) || 0;
  const strMod = abilityMods.Str || 0;
  const dexMod = abilityMods.Dex || 0;

  const meleeAttack = baseAttackValue + strMod;
  const rangedAttack = baseAttackValue + dexMod;

  const displayMeleeAttack = document.getElementById('displayMeleeAttack');
  const displayRangedAttack = document.getElementById('displayRangedAttack');
  if (displayMeleeAttack) displayMeleeAttack.textContent = formatBonus(meleeAttack);
  if (displayRangedAttack) displayRangedAttack.textContent = formatBonus(rangedAttack);

  // Update saves
  const fortSaveElement = document.getElementById('fortSaveDisplay');
  const refSaveElement = document.getElementById('refSaveDisplay');
  const willSaveElement = document.getElementById('willSaveDisplay');
  
  const displayFortSave = document.getElementById('displayFortSave');
  const displayRefSave = document.getElementById('displayRefSave');
  const displayWillSave = document.getElementById('displayWillSave');
  
  if (fortSaveElement && displayFortSave) displayFortSave.textContent = fortSaveElement.textContent;
  if (refSaveElement && displayRefSave) displayRefSave.textContent = refSaveElement.textContent;
  if (willSaveElement && displayWillSave) displayWillSave.textContent = willSaveElement.textContent;
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
    const skillName = row.querySelector('.skill-name').textContent.replace(/⚠/g, '').trim();

    // Check if this skill matches any profession core skill (comparing base names)
    let isProfessionSkill = false;
    if (prof && prof.coreSkills) {
      isProfessionSkill = prof.coreSkills.some(profSkill => {
        const baseSkillName = getBaseSkillName(profSkill);
        return baseSkillName === skillName;
      });
    }
    
    // Also check if manually marked as core skill
    const coreCheckbox = row.querySelector('.skill-core-checkbox');
    const isUserMarkedCore = coreCheckbox && coreCheckbox.checked;
    const isCoreSkill = isProfessionSkill || isUserMarkedCore;

    // Check if matches search
    const matchesSearch = searchTerm === '' || skillName.toLowerCase().includes(searchTerm);

    // Check if matches filter
    const matchesFilter = filterType === 'all' || (filterType === 'profession' && isCoreSkill);

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

// =====================================
// ENHANCED DUAL MODE SYSTEM
// =====================================

let currentMode = 'creation'; // 'creation' or 'gameplay'
let creationProgress = {
  basics: false,
  abilities: false,
  skills: false,
  feats: false,
  equipment: false
};

function initializeDualModeSystem() {
  const creationModeBtn = document.getElementById('creationModeBtn');
  const gameplayModeBtn = document.getElementById('gameplayModeBtn');
  const modeSlider = document.getElementById('modeSlider');
  
  if (!creationModeBtn || !gameplayModeBtn) return;
  
  // Initialize mode toggle buttons
  creationModeBtn.addEventListener('click', function() {
    if (currentMode !== 'creation') {
      toggleMode();
    }
  });
  
  gameplayModeBtn.addEventListener('click', function() {
    if (currentMode !== 'gameplay') {
      toggleMode();
    }
  });
  
  // Initialize progress step navigation
  const progressSteps = document.querySelectorAll('.progress-step');
  progressSteps.forEach(step => {
    step.addEventListener('click', function() {
      if (currentMode === 'creation') {
        const stepName = this.dataset.step;
        navigateToStep(stepName);
      }
    });
  });
  
  // Initialize character quick info update
  updateCharacterQuickInfo();
  updateCreationProgress();
  updateGameplayDashboard();
  
  // Initialize gameplay panel event handlers
  initializeGameplayPanel();
  
  // Update displays every 2 seconds when in gameplay mode
  setInterval(() => {
    if (currentMode === 'gameplay') {
      updateGameplayDashboard();
    }
    updateCharacterQuickInfo();
  }, 2000);
}

function toggleMode() {
  currentMode = currentMode === 'creation' ? 'gameplay' : 'creation';
  
  const body = document.body;
  const creationModeBtn = document.getElementById('creationModeBtn');
  const gameplayModeBtn = document.getElementById('gameplayModeBtn');
  const modeSlider = document.getElementById('modeSlider');
  
  if (currentMode === 'gameplay') {
    body.classList.add('gameplay-mode');
    creationModeBtn.classList.remove('active');
    gameplayModeBtn.classList.add('active');
    if (modeSlider) {
      modeSlider.style.transform = 'translateX(100%)';
    }
    updateGameplayDashboard();
  } else {
    body.classList.remove('gameplay-mode');
    creationModeBtn.classList.add('active');
    gameplayModeBtn.classList.remove('active');
    if (modeSlider) {
      modeSlider.style.transform = 'translateX(0%)';
    }
    updateCreationProgress();
  }
  
  // Save mode preference
  localStorage.setItem('cocd20_currentMode', currentMode);
}

function navigateToStep(stepName) {
  const section = document.querySelector(`section[data-step="${stepName}"]`);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update active step
    document.querySelectorAll('.progress-step').forEach(step => {
      step.classList.remove('active');
    });
    
    const progressStep = document.querySelector(`.progress-step[data-step="${stepName}"]`);
    if (progressStep) {
      progressStep.classList.add('active');
    }
  }
}

function updateCharacterQuickInfo() {
  const elements = {
    level: document.getElementById('quickLevel'),
    profession: document.getElementById('quickProfession'),
    hp: document.getElementById('quickHP'),
    sanity: document.getElementById('quickSanity')
  };
  
  // Only update if all elements exist
  if (!elements.level || !elements.profession || !elements.hp || !elements.sanity) return;
  
  const level = document.getElementById('level')?.value || '1';
  const professionSelect = document.getElementById('profession');
  const profession = professionSelect?.selectedOptions[0]?.textContent || 'No Profession';
  const currentHP = document.getElementById('currentHP')?.value || '0';
  const maxHP = document.getElementById('totalHP')?.textContent || '0';
  const currentSanity = document.getElementById('currentSanity')?.value || '0';
  const maxSanity = document.getElementById('sanityMax')?.textContent || '0';
  
  elements.level.textContent = level;
  elements.profession.textContent = profession === 'No Profession' ? '—' : profession;
  elements.hp.textContent = `${currentHP}/${maxHP}`;
  elements.sanity.textContent = `${currentSanity}/${maxSanity}`;
}

function updateCreationProgress() {
  // Check completion of each step
  creationProgress.basics = checkBasicsComplete();
  creationProgress.abilities = checkAbilitiesComplete();
  creationProgress.skills = checkSkillsComplete();
  creationProgress.feats = checkFeatsComplete();
  creationProgress.equipment = checkEquipmentComplete();
  
  // Update visual progress indicators
  Object.keys(creationProgress).forEach(stepName => {
    const stepElement = document.querySelector(`.progress-step[data-step="${stepName}"]`);
    if (stepElement) {
      stepElement.classList.toggle('completed', creationProgress[stepName]);
    }
  });
  
  // Count total progress
  const completedSteps = Object.values(creationProgress).filter(Boolean).length;
  const totalSteps = Object.keys(creationProgress).length;
  
  // Update any progress indicators if they exist
  const progressText = document.getElementById('progressText');
  if (progressText) {
    progressText.textContent = `${completedSteps}/${totalSteps} Complete`;
  }
}

function checkBasicsComplete() {
  const charName = document.getElementById('charName')?.value;
  const profession = document.getElementById('profession')?.value;
  const level = document.getElementById('level')?.value;
  
  return !!(charName && profession && level);
}

function checkAbilitiesComplete() {
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  return abilities.every(ability => {
    const input = document.getElementById(ability);
    return input && input.value && parseInt(input.value) >= 3;
  });
}

function checkSkillsComplete() {
  // Check if player has allocated some skill points
  const skillInputs = document.querySelectorAll('#skillsTable input[type="number"]');
  return Array.from(skillInputs).some(input => input.value && parseInt(input.value) > 0);
}

function checkFeatsComplete() {
  // Feats are optional, so always return true
  // But we could check if they've selected at least one if desired
  return true;
}

function checkEquipmentComplete() {
  // Check if they have at least one weapon or piece of equipment
  const weapons = window.weapons || [];
  const equipment = window.equipment || [];
  return weapons.length > 0 || equipment.length > 0;
}

function updateGameplayDashboard() {
  // Update character name display in gameplay mode
  const characterName = document.getElementById('charName')?.value?.trim() || 'Unknown Character';
  const gameplayCharacterName = document.getElementById('gameplayCharacterName');
  if (gameplayCharacterName) {
    gameplayCharacterName.textContent = characterName;
  }
  
  updateVitalsDashboard();
  updateCombatDashboard();
  updateSkillsDashboard();
  updateSessionDashboard();
}

function updateVitalsDashboard() {
  // Update HP
  const currentHP = document.getElementById('currentHP')?.value || 0;
  const maxHP = document.getElementById('hitPoints')?.value || 0;
  
  const hpCurrentElement = document.getElementById('displayCurrentHP');
  const hpMaxElement = document.getElementById('displayMaxHP');
  const hpBar = document.getElementById('hpBar');
  const hpPercentage = document.getElementById('hpPercentage');
  
  if (hpCurrentElement && hpMaxElement) {
    hpCurrentElement.textContent = currentHP;
    hpMaxElement.textContent = maxHP;
    
    const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 100;
    if (hpBar) {
      hpBar.style.width = `${hpPercent}%`;
      hpBar.className = 'vital-bar'; // Reset classes first
      hpCurrentElement.className = 'vital-current'; // Reset classes first
      
      if (hpPercent <= 25) {
        hpBar.classList.add('danger');
        hpCurrentElement.classList.add('danger');
      } else if (hpPercent <= 50) {
        hpBar.classList.add('warning');
        hpCurrentElement.classList.add('warning');
      }
    }
    
    if (hpPercentage) {
      hpPercentage.textContent = `${Math.round(hpPercent)}%`;
    }
  }
  
  // Update Sanity
  const currentSanity = document.getElementById('currentSanity')?.value || 0;
  const maxSanity = document.getElementById('sanityMax')?.textContent || 
                   document.getElementById('sanityStarting')?.textContent || 99;
  
  const sanityCurrentElement = document.getElementById('displayCurrentSanity');
  const sanityMaxElement = document.getElementById('displayMaxSanity');
  const sanityBar = document.getElementById('sanityBar');
  const sanityPercentage = document.getElementById('sanityPercentage');
  const sanity20Element = document.getElementById('quickSanity20');
  
  if (sanityCurrentElement && sanityMaxElement) {
    sanityCurrentElement.textContent = currentSanity;
    sanityMaxElement.textContent = maxSanity;
    
    const sanity20Threshold = Math.floor(maxSanity * 0.2);
    if (sanity20Element) {
      sanity20Element.textContent = sanity20Threshold;
    }
    
    const sanityPercent = maxSanity > 0 ? (currentSanity / maxSanity) * 100 : 100;
    if (sanityBar) {
      sanityBar.style.width = `${sanityPercent}%`;
      sanityBar.className = 'vital-bar sanity-bar'; // Reset classes first
      sanityCurrentElement.className = 'vital-current'; // Reset classes first
      
      if (sanityPercent <= 25) {
        sanityBar.classList.add('danger');
        sanityCurrentElement.classList.add('danger');
      } else if (sanityPercent <= 50) {
        sanityBar.classList.add('warning');
        sanityCurrentElement.classList.add('warning');
      }
    }
    
    if (sanityPercentage) {
      sanityPercentage.textContent = `${Math.round(sanityPercent)}%`;
    }
  }
}

function updateCombatDashboard() {
  const elements = {
    ac: document.getElementById('quickAC'),
    initiative: document.getElementById('quickInit'),
    speed: document.getElementById('quickSpeed'),
    baseAttack: document.getElementById('quickBAB'),
    fortSave: document.getElementById('quickFort'),
    refSave: document.getElementById('quickRef'),
    willSave: document.getElementById('quickWill')
  };
  
  if (elements.ac) {
    const ac = document.getElementById('acValue')?.textContent || '10';
    elements.ac.textContent = ac;
  }
  
  if (elements.initiative) {
    const dexMod = abilityMods.Dex || 0;
    const initBonus = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
    elements.initiative.textContent = initBonus;
  }
  
  if (elements.speed) {
    const speed = document.getElementById('speed')?.value || '30';
    elements.speed.textContent = speed + ' ft';
  }
  
  if (elements.baseAttack) {
    const baseAttack = document.getElementById('baseAttackDisplay')?.textContent || '+0';
    elements.baseAttack.textContent = baseAttack;
  }
  
  if (elements.fortSave) {
    const fortSave = document.getElementById('fortSaveDisplay')?.textContent || '+0';
    elements.fortSave.textContent = fortSave;
  }
  
  if (elements.refSave) {
    const refSave = document.getElementById('refSaveDisplay')?.textContent || '+0';
    elements.refSave.textContent = refSave;
  }
  
  if (elements.willSave) {
    const willSave = document.getElementById('willSaveDisplay')?.textContent || '+0';
    elements.willSave.textContent = willSave;
  }
  
  // Update equipment display
  updateEquipmentDisplay();
}

/**
 * Update the equipment display in the gameplay combat panel
 */
function updateEquipmentDisplay() {
  const weaponsList = document.getElementById('quickWeaponsList');
  const armorList = document.getElementById('quickArmorList');
  const inventoryList = document.getElementById('quickInventoryList');
  
  // Update Weapons
  if (weaponsList && typeof weapons !== 'undefined' && weapons.length > 0) {
    weaponsList.innerHTML = '';
    weapons.forEach(weapon => {
      if (weapon && weapon.name) {
        const weaponItem = document.createElement('div');
        weaponItem.className = 'equipment-item';
        weaponItem.innerHTML = `
          <span class="equipment-name">${weapon.name}</span>
          <span class="equipment-details">(${weapon.damage} dmg)</span>
        `;
        weaponsList.appendChild(weaponItem);
      }
    });
  } else if (weaponsList) {
    weaponsList.innerHTML = '<span class="no-equipment">None equipped</span>';
  }
  
  // Update Armor
  if (armorList) {
    const armorName = document.getElementById('armorName')?.value;
    const armorBonus = document.getElementById('armorBonus')?.value;
    const shieldName = document.getElementById('shieldName')?.value;
    const shieldBonus = document.getElementById('shieldBonus')?.value;
    
    armorList.innerHTML = '';
    
    if (armorName && armorName.trim() && armorBonus && parseInt(armorBonus) > 0) {
      const armorItem = document.createElement('div');
      armorItem.className = 'equipment-item';
      armorItem.innerHTML = `
        <span class="equipment-name">${armorName}</span>
        <span class="equipment-details">(+${armorBonus} AC)</span>
      `;
      armorList.appendChild(armorItem);
    }
    
    if (shieldName && shieldName.trim() && shieldBonus && parseInt(shieldBonus) > 0) {
      const shieldItem = document.createElement('div');
      shieldItem.className = 'equipment-item';
      shieldItem.innerHTML = `
        <span class="equipment-name">${shieldName}</span>
        <span class="equipment-details">(+${shieldBonus} AC)</span>
      `;
      armorList.appendChild(shieldItem);
    }
    
    if (armorList.children.length === 0) {
      armorList.innerHTML = '<span class="no-equipment">Unarmored</span>';
    }
  }
  
  // Update Inventory
  if (inventoryList && typeof equipment !== 'undefined' && equipment.length > 0) {
    inventoryList.innerHTML = '';
    // Show first 3 items to avoid clutter
    equipment.slice(0, 3).forEach(item => {
      if (item && item.name) {
        const inventoryItem = document.createElement('div');
        inventoryItem.className = 'equipment-item';
        inventoryItem.innerHTML = `
          <span class="equipment-name">${item.name}</span>
          ${item.quantity > 1 ? `<span class="equipment-details">(x${item.quantity})</span>` : ''}
        `;
        inventoryList.appendChild(inventoryItem);
      }
    });
    
    if (equipment.length > 3) {
      const moreItem = document.createElement('div');
      moreItem.className = 'equipment-item more-items';
      moreItem.textContent = `... and ${equipment.length - 3} more items`;
      inventoryList.appendChild(moreItem);
    }
  } else if (inventoryList) {
    inventoryList.innerHTML = '<span class="no-equipment">Empty</span>';
  }
}

function updateSkillsDashboard() {
  const allSkillsContainer = document.getElementById('allSkillsList');
  if (!allSkillsContainer) {
    // Fallback to old container if new one doesn't exist yet
    const keySkillsContainer = document.getElementById('keySkillsList');
    if (!keySkillsContainer) return;
    
    // Clear and show message
    keySkillsContainer.innerHTML = '<div class="key-skill-item">Updating skills display...</div>';
    return;
  }
  
  // Clear previous skills
  allSkillsContainer.innerHTML = '';
  
  // Get all skills with their current bonuses
  const skillRows = document.querySelectorAll("#skillsBody tr");
  const skillsData = [];
  
  // Get profession core skills for comparison
  const professionSelect = document.getElementById('profession');
  let professionCoreSkills = [];
  if (professionSelect) {
    const professionIndex = parseInt(professionSelect.value);
    if (!isNaN(professionIndex) && professionIndex >= 0 && professionIndex < professions.length) {
      professionCoreSkills = professions[professionIndex].coreSkills || [];
    }
  }
  
  skillRows.forEach((row) => {
    const index = parseInt(row.dataset.skillIndex);
    if (isNaN(index) || !skills[index]) return;
    
    const skill = skills[index];
    const totalCell = row.querySelector('.skill-total');
    const total = totalCell ? totalCell.textContent : '+0';
    const ranksCell = row.querySelector('.skill-ranks');
    const ranks = ranksCell ? ranksCell.value : '0';
    
    // Check if it's a core skill (either user-selected or profession core)
    const coreCheckbox = row.querySelector('.skill-core-checkbox');
    const isUserCoreSkill = coreCheckbox && coreCheckbox.checked;
    
    // Check if it's a profession core skill
    const isProfessionCoreSkill = professionCoreSkills.some(profSkill => {
      const baseSkillName = getBaseSkillName(profSkill);
      return baseSkillName === skill.name;
    });
    
    const isCore = isUserCoreSkill || isProfessionCoreSkill;
    
    skillsData.push({
      name: skill.name,
      total: total,
      ranks: parseInt(ranks) || 0,
      isCore: isCore,
      isProfessionCore: isProfessionCoreSkill
    });
  });
  
  // Sort skills: core skills first, then by name
  skillsData.sort((a, b) => {
    if (a.isCore && !b.isCore) return -1;
    if (!a.isCore && b.isCore) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Create skill items
  skillsData.forEach(skillData => {
    const skillItem = document.createElement('div');
    skillItem.className = 'skill-item';
    if (skillData.isCore) {
      skillItem.classList.add('core-skill');
    }
    if (skillData.isProfessionCore) {
      skillItem.classList.add('profession-core');
    }
    
    const skillNameClass = skillData.isProfessionCore ? 'skill-name profession-skill' : 'skill-name';
    
    skillItem.innerHTML = `
      <span class="${skillNameClass}">${skillData.name}</span>
      <span class="skill-bonus">${skillData.total}</span>
      ${skillData.ranks > 0 ? `<span class="skill-ranks">(${skillData.ranks} ranks)</span>` : ''}
    `;
    
    allSkillsContainer.appendChild(skillItem);
  });
  
  if (skillsData.length === 0) {
    allSkillsContainer.innerHTML = '<div class="skill-item">No skills available</div>';
  }
}

function updateSessionDashboard() {
  // Session dashboard is mainly for notes and controls
  // The sessionNotes textarea is already in the dashboard panel
  // No additional sync needed as it's the same element
}

// =====================================
// CHARACTER SELECTION LANDING SCREEN
// =====================================

function initializeCharacterSelection() {
  populateCharacterCards();
  
  // Create new character button
  const createNewBtn = document.getElementById('createNewCharacterBtn');
  createNewBtn.addEventListener('click', function() {
    startNewCharacterCreation();
  });
  
  // Import character button
  const importBtn = document.getElementById('importCharacterBtn');
  importBtn.addEventListener('click', function() {
    importCharacterFromFile();
  });
  
  // File input for importing characters
  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', handleImportFile);
  }
  
  // Always show character selection/dashboard on load
  showCharacterSelection();
}

function populateCharacterCards() {
  const container = document.getElementById('characterCardsContainer');
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  const characterNames = Object.keys(stored);
  
  if (characterNames.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🕵️</div>
        <h3>No Characters Found</h3>
        <p>Create your first investigator to begin exploring the mysteries of the Cthulhu Mythos</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  characterNames.forEach(name => {
    const character = stored[name];
    const card = createCharacterCard(name, character);
    container.appendChild(card);
  });
}

function createCharacterCard(name, character) {
  const card = document.createElement('div');
  card.className = 'character-card';
  card.addEventListener('click', () => loadAndShowCharacter(name));
  
  // Calculate HP and Sanity values
  const level = parseInt(character.level) || 1;
  const conScore = parseInt(character.abilities?.con) || 10;
  const wisScore = parseInt(character.abilities?.wis) || 10;

  const currentHP = parseInt(character.currentHP) || 0;
  const maxHP = parseInt(character.hitPoints) || (conScore + level); // Use saved hitPoints or fallback calculation
  const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 100;

  const currentSanity = parseInt(character.currentSanity) || 0;
  // Calculate maximum sanity: 99 - Cthulhu Mythos ranks
  let mythosRanks = 0;
  if (character.skills && Array.isArray(character.skills)) {
    // Find Cthulhu Mythos skill in the skills array
    const mythosSkill = character.skills.find(skill => {
      const skillIndex = parseInt(skill.index);
      return skills[skillIndex] && skills[skillIndex].name === 'Cthulhu Mythos';
    });
    if (mythosSkill) {
      mythosRanks = parseInt(mythosSkill.ranks) || 0;
    }
  }
  const maxSanity = 99 - mythosRanks;
  const sanityPercent = maxSanity > 0 ? (currentSanity / maxSanity) * 100 : 100;
  
  // Determine bar colors
  const hpBarClass = hpPercent <= 25 ? 'danger' : hpPercent <= 50 ? 'warning' : '';
  const sanityBarClass = sanityPercent <= 25 ? 'danger' : sanityPercent <= 50 ? 'warning' : '';
  
  card.innerHTML = `
    <div class="character-actions">
      <button class="action-btn duplicate" title="Duplicate Character" onclick="event.stopPropagation(); duplicateCharacter('${name}')">
        📋
      </button>
      <button class="action-btn delete" title="Delete Character" onclick="event.stopPropagation(); confirmDeleteCharacter('${name}')">
        🗑️
      </button>
    </div>
    
    <div class="character-card-header">
      <h3 class="character-name">${name}</h3>
      <span class="character-level">Level ${level}</span>
    </div>
    
    <p class="character-profession">${getProfessionName(character.profession) || 'No Profession'}</p>
    
    <div class="character-stats">
      <div class="stat-item">
        <span class="stat-label">Hit Points</span>
        <div class="stat-value">${currentHP}/${maxHP}</div>
        <div class="stat-bar">
          <div class="stat-bar-fill ${hpBarClass}" style="width: ${Math.max(0, Math.min(100, hpPercent))}%"></div>
        </div>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">Sanity</span>
        <div class="stat-value">${currentSanity}/${maxSanity}</div>
        <div class="stat-bar">
          <div class="stat-bar-fill ${sanityBarClass}" style="width: ${Math.max(0, Math.min(100, sanityPercent))}%"></div>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

function getProfessionName(professionIndex) {
  const index = parseInt(professionIndex);
  if (isNaN(index) || index < 0 || index >= professions.length) {
    return 'No Profession';
  }
  return professions[index].name;
}

function loadAndShowCharacter(name) {
  // Load the character
  const select = document.getElementById("characterSelect");
  select.value = name;
  loadCharacter();
  
  // Hide character selection and show main app in gameplay mode
  hideCharacterSelection();
  
  // Ensure we're in gameplay mode
  if (!document.body.classList.contains('gameplay-mode')) {
    toggleMode();
  }
}

function startNewCharacterCreation() {
  // Clear all form fields for new character
  clearAllFormFields();
  
  // Hide character selection and show main app in creation mode
  hideCharacterSelection();
  
  // Ensure we're in creation mode
  if (document.body.classList.contains('gameplay-mode')) {
    toggleMode();
  }
}

function clearAllFormFields() {
  // Clear character info
  document.getElementById('charName').value = '';
  document.getElementById('playerName').value = '';
  document.getElementById('age').value = '';
  document.getElementById('ageCategory').value = 'young';
  document.getElementById('gender').value = '';
  document.getElementById('profession').value = '0'; // Set to first profession instead of empty
  document.getElementById('level').value = '1';
  document.getElementById('attackOption').value = 'offense';
  document.getElementById('era').value = '1921-1940';
  
  // Clear abilities
  document.querySelectorAll('.ability-score').forEach(input => {
    input.value = '';
  });
  
  // Clear skills
  document.querySelectorAll('.skill-ranks').forEach(input => {
    input.value = '';
  });
  
  // Clear feats
  document.querySelectorAll('#featsContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Clear current HP and Sanity
  document.getElementById('currentHP').value = '';
  document.getElementById('currentSanity').value = '';
  
  // Clear equipment
  if (typeof clearAllEquipment === 'function') {
    clearAllEquipment();
  }
  
  // Update all calculations
  updateAll();
}

function showCharacterSelection() {
  document.body.classList.add('show-character-selection');
  populateCharacterCards();
}

function hideCharacterSelection() {
  document.body.classList.remove('show-character-selection');
}

function shouldShowCharacterSelection() {
  // Show character selection if explicitly requested or if there are characters
  return localStorage.getItem('showCharacterSelection') === 'true';
}

function duplicateCharacter(name) {
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  const original = stored[name];
  
  if (!original) return;
  
  let copyNumber = 2;
  let copyName = `${name} (Copy)`;
  
  // Find available copy name
  while (stored[copyName]) {
    copyName = `${name} (Copy ${copyNumber})`;
    copyNumber++;
  }
  
  // Create copy
  stored[copyName] = JSON.parse(JSON.stringify(original));
  localStorage.setItem("cocd20_characters", JSON.stringify(stored));
  
  // Refresh cards
  populateCharacterCards();
  populateSavedCharacters(); // Update the dropdown too
}

function confirmDeleteCharacter(name) {
  if (confirm(`Are you sure you want to delete the character "${name}"? This action cannot be undone.`)) {
    deleteCharacterByName(name);
  }
}

function deleteCharacterByName(name) {
  const stored = JSON.parse(localStorage.getItem("cocd20_characters") || "{}");
  delete stored[name];
  localStorage.setItem("cocd20_characters", JSON.stringify(stored));
  
  // Refresh cards
  populateCharacterCards();
  populateSavedCharacters(); // Update the dropdown too
  
  // If no characters left, show empty state
  if (Object.keys(stored).length === 0) {
    populateCharacterCards();
  }
}

// Add "Back to Character Selection" functionality
function addBackToSelectionButton() {
  const modeToggle = document.querySelector('.mode-toggle-enhanced');
  if (modeToggle && !document.getElementById('backToSelectionBtn')) {
    // Create wrapper div if it doesn't exist
    let wrapper = modeToggle.parentElement.querySelector('.mode-controls-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'mode-controls-wrapper';
      modeToggle.parentElement.insertBefore(wrapper, modeToggle);
      wrapper.appendChild(modeToggle);
    }
    
    const backBtn = document.createElement('button');
    backBtn.id = 'backToSelectionBtn';
    backBtn.className = 'back-to-selection-btn';
    backBtn.innerHTML = '← Characters';
    backBtn.title = 'Back to Character Selection';
    backBtn.addEventListener('click', showCharacterSelection);
    
    // Insert before the mode toggle
    wrapper.insertBefore(backBtn, modeToggle);
  }
}

// Initialize mode toggle when page loads
window.addEventListener("DOMContentLoaded", () => {
  // Initialize character selection first
  initializeCharacterSelection();
  
  // Then initialize dual mode system
  setTimeout(() => {
    initializeDualModeSystem();
    
    // Add back button to header
    addBackToSelectionButton();
    
    // Restore saved mode if available and not in character selection
    const savedMode = localStorage.getItem('cocd20_currentMode');
    if (savedMode === 'gameplay' && !document.body.classList.contains('show-character-selection')) {
      toggleMode();
    }
  }, 100);
});
