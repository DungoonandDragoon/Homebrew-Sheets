// ── HEXER CLASS ───────────────────────────────────────────────────────────────
// Masters of arcane inscriptions, wielding cursed runes and forbidden sigils
// to weaken foes and bend the battlefield to their will.

export const HEXER = {
  id: 'hexer',
  name: 'Hexer',
  hitDie: 8,
  primaryAbility: 'intelligence',
  savingThrows: ['wisdom', 'intelligence'],
  armorProficiencies: ['Light armor'],
  weaponProficiencies: ['Simple weapons', 'Rapier', 'Scimitar', 'Shortsword', 'Hand crossbow'],
  toolProficiencies: ["Calligrapher's tools"],
  skillChoices: {
    count: 2,
    options: ['Sleight of Hand', 'Arcana', 'Insight', 'Medicine'],
  },

  startingEquipment: {
    choices: [
      {
        id: 'weapon',
        label: 'Weapon',
        options: [
          { id: 'a', label: 'A) A rapier', items: [{ id: 'rapier', name: 'Rapier', quantity: 1, damage: '1d8', damageType: 'Piercing', weaponType: 'melee', finesse: true }] },
          { id: 'b', label: 'B) A hand crossbow + 20 bolts', items: [
            { id: 'hcrossbow', name: 'Hand crossbow', quantity: 1, damage: '1d6', damageType: 'Piercing', weaponType: 'ranged', range: '30/120' },
            { id: 'bolts', name: 'Crossbow bolts', quantity: 20, detail: 'Ammunition' },
          ]},
        ],
      },
      {
        id: 'armour',
        label: 'Armour',
        options: [
          { id: 'a', label: 'A) Leather armor',         items: [{ id: 'leather',       name: 'Leather armor',    quantity: 1, baseAC: 11, armorType: 'light' }] },
          { id: 'b', label: 'B) Studded leather armor', items: [{ id: 'studdedleather', name: 'Studded leather', quantity: 1, baseAC: 12, armorType: 'light' }] },
        ],
      },
      {
        id: 'pack',
        label: 'Pack',
        options: [
          { id: 'a', label: "A) A scholar's pack",   items: [{ id: 'scholars',   name: "Scholar's pack",  quantity: 1, detail: 'Pack' }] },
          { id: 'b', label: "B) An explorer's pack", items: [{ id: 'explorers',  name: "Explorer's pack", quantity: 1, detail: 'Pack' }] },
        ],
      },
    ],
    fixed: [
      { id: 'calligraphy', name: "Calligrapher's tools", quantity: 1, detail: 'Tool' },
    ],
  },

  // ── Progression table ─────────────────────────────────────────────────────
  // sigils: resource to activate curses
  // cursesKnown: how many curses the character knows
  // Spell slots: s1–s5
  progression: [
    { level:1,  profBonus:2, sigils:2,  cursesKnown:3,  s1:0, s2:0, s3:0, s4:0, s5:0, features:['occult-brand','arcane-architect'] },
    { level:2,  profBonus:2, sigils:2,  cursesKnown:3,  s1:2, s2:0, s3:0, s4:0, s5:0, features:['malevolent-mark','innumerable-inscription','hexer-spellcasting'] },
    { level:3,  profBonus:2, sigils:3,  cursesKnown:4,  s1:3, s2:0, s3:0, s4:0, s5:0, features:['practical-rune','discipline'] },
    { level:4,  profBonus:2, sigils:3,  cursesKnown:4,  s1:3, s2:0, s3:0, s4:0, s5:0, features:['asi'] },
    { level:5,  profBonus:3, sigils:5,  cursesKnown:5,  s1:4, s2:2, s3:0, s4:0, s5:0, features:['extra-attack'] },
    { level:6,  profBonus:3, sigils:5,  cursesKnown:5,  s1:4, s2:2, s3:0, s4:0, s5:0, features:['reclamation'] },
    { level:7,  profBonus:3, sigils:5,  cursesKnown:6,  s1:4, s2:3, s3:0, s4:0, s5:0, features:['discipline-feature'] },
    { level:8,  profBonus:3, sigils:6,  cursesKnown:6,  s1:4, s2:3, s3:0, s4:0, s5:0, features:['asi'] },
    { level:9,  profBonus:4, sigils:6,  cursesKnown:7,  s1:4, s2:3, s3:2, s4:0, s5:0, features:[] },
    { level:10, profBonus:4, sigils:6,  cursesKnown:7,  s1:4, s2:3, s3:2, s4:0, s5:0, features:['enervating-sigil'] },
    { level:11, profBonus:4, sigils:8,  cursesKnown:8,  s1:4, s2:3, s3:3, s4:0, s5:0, features:['communicable-curse'] },
    { level:12, profBonus:4, sigils:8,  cursesKnown:8,  s1:4, s2:3, s3:3, s4:0, s5:0, features:['asi'] },
    { level:13, profBonus:5, sigils:8,  cursesKnown:9,  s1:4, s2:3, s3:3, s4:1, s5:0, features:[] },
    { level:14, profBonus:5, sigils:9,  cursesKnown:9,  s1:4, s2:3, s3:3, s4:1, s5:0, features:['malignant-mark'] },
    { level:15, profBonus:5, sigils:9,  cursesKnown:10, s1:4, s2:3, s3:3, s4:2, s5:0, features:['discipline-feature'] },
    { level:16, profBonus:5, sigils:9,  cursesKnown:10, s1:4, s2:3, s3:3, s4:2, s5:0, features:['asi'] },
    { level:17, profBonus:6, sigils:11, cursesKnown:11, s1:4, s2:3, s3:3, s4:3, s5:1, features:[] },
    { level:18, profBonus:6, sigils:11, cursesKnown:11, s1:4, s2:3, s3:3, s4:3, s5:1, features:['unbridled-torment'] },
    { level:19, profBonus:6, sigils:11, cursesKnown:12, s1:4, s2:3, s3:3, s4:3, s5:2, features:['asi'] },
    { level:20, profBonus:6, sigils:15, cursesKnown:12, s1:4, s2:3, s3:3, s4:3, s5:2, features:['discipline-feature'] },
  ],

  // ── Base class features ───────────────────────────────────────────────────
  features: {
    'occult-brand': {
      id: 'occult-brand',
      name: 'Occult Brand',
      level: 1,
      description: 'As an action, expend a number of Sigils (dependent on the curse) and touch a creature to etch a rune into them, afflicting them with a curse you know. A creature may be afflicted with curses up to your Intelligence modifier (minimum 1). Curse save DC = 8 + proficiency bonus + Intelligence modifier. Sigils replenish on a long rest. You know 3 curses at 1st level, gaining more as shown in the Curses Known column. You may switch one known curse for another on a long rest.',
    },
    'arcane-architect': {
      id: 'arcane-architect',
      name: 'Arcane Architect',
      level: 1,
      description: 'After constant work crafting arcane runes you have become deeply familiar with magic as a system. You gain advantage on all checks made to discern magical effects or see through illusions.',
    },
    'malevolent-mark': {
      id: 'malevolent-mark',
      name: 'Malevolent Mark',
      level: 2,
      description: 'You permanently sear an invisible rune into your own eye. As a bonus action, force a creature you can see within 30 feet to make a Wisdom saving throw against your curse save DC. On a failure, an arcane rune is etched into them for one hour. You may only have one mark at a time and may remove it freely at any time. While a creature is marked you always know their precise location (same plane) and may use Occult Brand on them without touch so long as you can see them. Usable a number of times equal to your Intelligence modifier per short rest (minimum 1). At level 14 (Malignant Mark) you also gain advantage on attacks against marked creatures and deal bonus force damage for each curse afflicting them.',
    },
    'innumerable-inscription': {
      id: 'innumerable-inscription',
      name: 'Innumerable Inscription',
      level: 2,
      description: 'As a bonus action, expend a spell slot to regain Sigils equal to the level of the slot expended.',
    },
    'hexer-spellcasting': {
      id: 'hexer-spellcasting',
      name: 'Spellcasting',
      level: 2,
      description: 'You prepare Hexer spells equal to your Intelligence modifier + half your Hexer level (rounded down, minimum 1). Spells must be of a level you have slots for. Prepared spells can be changed on a long rest. Spell save DC = 8 + proficiency + Intelligence modifier. Spell attack = proficiency + Intelligence modifier. You may use Calligrapher\'s tools as a spellcasting focus. Spell slots are restored on a long rest.',
    },
    'practical-rune': {
      id: 'practical-rune',
      name: 'Practical Rune',
      level: 3,
      description: 'As an action, take one minute to inscribe a rune with a mundane magical effect that triggers at a time of your choosing or when conditions you set are met (sound, smell, or other harmless sensory effect).',
    },
    'discipline': {
      id: 'discipline',
      name: 'Discipline',
      level: 3,
      description: 'Choose either the Runebriar or the Hellion. Your choice grants features at 3rd, 7th, 15th, and 20th level.',
    },
    'extra-attack': {
      id: 'extra-attack',
      name: 'Extra Attack',
      level: 5,
      description: 'When you take the Attack action you may make two attacks instead of one. Additionally you may replace one of these attacks with a curse from your Occult Brand feature, and you may benefit from Malevolent Mark while doing so.',
    },
    'reclamation': {
      id: 'reclamation',
      name: 'Reclamation',
      level: 6,
      description: 'When you kill a creature afflicted by one of your curses you regain one Sigil. From level 18 (Unbridled Torment) you may instead choose to spread one of the killed target\'s curses to another creature within 15 feet.',
    },
    'enervating-sigil': {
      id: 'enervating-sigil',
      name: 'Enervating Sigil',
      level: 10,
      description: 'The maximum number of curses a single creature may have afflicting them at one time increases by half your proficiency bonus (rounded down, minimum 1). Additionally, while a creature is afflicted by one of your cursed runes, you may once per turn give the target disadvantage on a saving throw to resist one of your curses or marks.',
    },
    'communicable-curse': {
      id: 'communicable-curse',
      name: 'Communicable Curse',
      level: 11,
      description: 'When you successfully curse a creature, you may choose up to half your proficiency bonus (rounded down, minimum 1) creatures within 15 feet of the original target. Those creatures make a Wisdom saving throw against your curse save DC. On a failure they are afflicted with the same curse. Usable a number of times equal to your Intelligence modifier per short rest.',
    },
    'malignant-mark': {
      id: 'malignant-mark',
      name: 'Malignant Mark',
      level: 14,
      description: 'The rune in your eye becomes uncontrollable in its power. While a creature is marked by Malevolent Mark you have advantage on all attacks against them. If the creature is also afflicted with one or more curses you deal an additional 1d4 force damage per curse afflicting them with each weapon attack against the creature (once per turn).',
    },
    'unbridled-torment': {
      id: 'unbridled-torment',
      name: 'Unbridled Torment',
      level: 18,
      description: 'When you benefit from Reclamation you may instead spread one curse afflicting the killed target to another creature within 15 feet. Additionally, when you inscribe a curse requiring a saving throw or attack roll you may expend additional Sigils equal to half the curse\'s Sigil cost (rounded up) to cause the attack to automatically hit or the save to automatically fail. Usable a number of times equal to your Intelligence modifier per long rest.',
    },
  },

  // ── Disciplines (subclasses) ──────────────────────────────────────────────
  disciplines: {

    // ── RUNEBRIAR ──────────────────────────────────────────────────────────
    'runebriar': {
      id: 'runebriar',
      name: 'Runebriar',
      level: 3,
      description: 'The Runebriar has chosen to master their body and mind so that as their power grows they may yet wield it. Runebriars train diligently in martial combat as preparation for both futures — one where they contain their abilities and one where they must survive without them.',
      features: {
        'bonus-proficiencies': {
          id: 'bonus-proficiencies',
          name: 'Bonus Proficiencies',
          level: 3,
          description: 'You gain proficiency with medium armor and all martial weapons if you did not already have them.',
        },
        'bountiful-mark': {
          id: 'bountiful-mark',
          name: 'Bountiful Mark',
          level: 3,
          description: 'You may mark an additional creature with your Malevolent Mark feature. The range at which you may mark a creature increases by 5 × your proficiency bonus feet.',
        },
        'curse-of-the-tortured-conduit': {
          id: 'curse-of-the-tortured-conduit',
          name: 'Curse of the Tortured Conduit',
          level: 7,
          description: 'You learn an additional curse that you always know and does not count toward your total curses known. This curse costs 1 Sigil to apply and must target a weapon you have equipped and are proficient in. The chosen weapon deals an additional 1d6 force damage and you regain hit points equal to the additional force damage dealt. This curse lasts for one short or long rest and may only be applied to one weapon at a time.',
        },
        'mastered-mark': {
          id: 'mastered-mark',
          name: 'Mastered Mark',
          level: 15,
          description: 'Your body has become strong enough to maintain a secondary rune in your remaining eye. You may mark one additional creature with Malevolent Mark. At 18th level the number of marks increases by one again. Additionally when you etch a curse into a marked creature and activate Communicable Curse, all other currently marked creatures may be selected regardless of range and have disadvantage on their saving throw.',
        },
        'perfected-body': {
          id: 'perfected-body',
          name: 'Perfected Body',
          level: 20,
          description: 'At the end of every long rest you inscribe your body with arcane runes and choose one: Bastion (+1 AC), Resilience (half proficiency in one non-proficient saving throw), Knowledge (proficiency in one skill you lack), or Vitality (+2×Intelligence modifier max HP). Additionally, once per turn when you kill a marked creature you regain HP equal to the number of curses afflicting them. Once per long rest when reduced to 0 HP with at least one marked creature, select a marked creature — they take (number of curses + 20) d10 force damage; you remain at 1 HP, or at half the damage dealt if that would drop them to 0.',
        },
      },
    },

    // ── HELLION ────────────────────────────────────────────────────────────
    'hellion': {
      id: 'hellion',
      name: 'Hellion',
      level: 3,
      description: 'The Hellion understands their power will never be controllable and submits fully to its chaos, choosing only to guide it rather than contain it.',
      features: {
        'arcane-release': {
          id: 'arcane-release',
          name: 'Arcane Release',
          level: 3,
          description: 'When inscribing a curse you may choose to release its arcane power fully and roll 1d10, augmenting the curse\'s effect: 1=Eruption (curse fails, both you and target make Dex save or take Xd6 force); 2=Leaping Curse (curse also hits one additional target within 15ft for free); 3=Rejected Host (curse hits a random different creature within 30ft instead); 4=Greed (cost reduced by 1d4 Sigils, minimum 0); 5=Overwhelmed (cost increased by 1d4 Sigils); 6=Intensified (save DC +1 if applicable); 7=Mirrored (you suffer the curse instead of the target); 8=Untethered (curse doesn\'t count toward the target\'s curse limit but retains all effects); 9=Chain (inscribe another known curse into the same target for half Sigil cost as part of the same action); 10=Swapped Save (a different random save type is used instead). Usable a number of times equal to your Intelligence modifier per short rest. From level 15 (Envigored Rune) you may also pay 5 HP to roll twice and choose which result to use.',
        },
        'curse-of-the-uncontained-chaos': {
          id: 'curse-of-the-uncontained-chaos',
          name: 'Curse of the Uncontained Chaos',
          level: 7,
          description: 'You learn an additional curse that always does not count toward your total curses known. This curse costs 3 Sigils to apply: select one other curse you know at random and inscribe it into the target for no additional Sigil cost. From 11th level, when you use Communicable Curse with this curse, select one additional target and all targets subtract 1d4 from their saving throw roll. When this curse spreads to additional targets, a different random known curse is selected for each.',
        },
        'envigored-rune': {
          id: 'envigored-rune',
          name: 'Envigored Rune',
          level: 15,
          description: 'Even when drained of Sigils, your curses demand release. You may attempt to inscribe a curse without enough Sigils — for every missing Sigil you take 10 force damage (cannot be reduced). Additionally when using Arcane Release you may sacrifice 5 hit points to roll the d10 twice and choose which result to use.',
        },
        'acme-anarch': {
          id: 'acme-anarch',
          name: 'Acme Anarch',
          level: 20,
          description: 'When using Arcane Release with uses remaining, roll the d10 four times and select two results. You may also use Arcane Release without any uses remaining. Once per long rest when reduced to 0 HP with at least one cursed target, you must remove every curse from every afflicted creature. You regain 5 HP per curse removed. For the next minute, all curses cost half their listed Sigil cost and every curse etched must roll on the Arcane Release table (roll once per curse, no choice).',
        },
      },
    },
  },

  // ── Curses ────────────────────────────────────────────────────────────────
  curses: {
    'betraying-allegiance': {
      id: 'betraying-allegiance',
      name: 'Curse of the Betraying Allegiance',
      sigilCost: 1,
      activation: 'action',
      saveType: 'Wisdom',
      duration: '1 minute',
      description: 'Etch this rune on a target\'s head and force a Wisdom saving throw. On a failure they are charmed by you for 1 minute. The target may repeat the save whenever it takes damage, ending the effect on a success.',
    },
    'bumbling-fool': {
      id: 'bumbling-fool',
      name: 'Curse of the Bumbling Fool',
      sigilCost: 3,
      activation: 'action',
      saveType: 'Intelligence',
      duration: '1 minute',
      description: 'Etch this rune anywhere on a target and force an Intelligence saving throw. On a failure, once per turn when the target rolls an attack roll, saving throw, or ability check you may impose disadvantage on the roll. The target may repeat the save at the end of each of their turns, ending the effect on a success.',
    },
    'calcified-form': {
      id: 'calcified-form',
      name: 'Curse of the Calcified Form',
      sigilCost: 6,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: 'Etch this rune into the target\'s chest and force a Constitution saving throw. On a failure their skin hardens and turns stony gray — they become Petrified for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.',
    },
    'cracked-shell': {
      id: 'cracked-shell',
      name: 'Curse of the Cracked Shell',
      sigilCost: 3,
      activation: 'bonus action',
      saveType: null,
      duration: 'Until triggered',
      description: 'Etch this rune anywhere on a target. The next attack you make against the target strikes the rune and deals an additional 2d6 force damage (3d6 at Hexer level 8, 4d6 at level 14).',
    },
    'eyes-wide-shut': {
      id: 'eyes-wide-shut',
      name: 'Curse of the Eyes Wide Shut',
      sigilCost: 2,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: 'Etch this rune into a target\'s eye and force a Constitution saving throw. On a failure, malevolent energy clouds their vision and blinds them for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.',
    },
    'exposed-bastion': {
      id: 'exposed-bastion',
      name: 'Curse of the Exposed Bastion',
      sigilCost: 4,
      activation: 'action',
      saveType: null,
      duration: '1 minute',
      description: 'Etch this rune into the target\'s chest. For 1 minute you score a critical hit on a natural 19 as well as a natural 20. At Hexer level 12 you also crit on a natural 18.',
    },
    'felled-oak': {
      id: 'felled-oak',
      name: 'Curse of the Felled Oak',
      sigilCost: 1,
      activation: 'action',
      saveType: null,
      duration: 'Until end of next turn',
      description: 'Etch this rune into a target\'s legs, stiffening them. The target is knocked Prone and cannot stand until the end of your next turn.',
    },
    'fouled-blood': {
      id: 'fouled-blood',
      name: 'Curse of the Fouled Blood',
      sigilCost: 2,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: 'Etch this rune anywhere on a target. Malignant energy seeps in forcing a Constitution saving throw. On a failure they become Poisoned for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.',
    },
    'frozen-will': {
      id: 'frozen-will',
      name: 'Curse of the Frozen Will',
      sigilCost: 8,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: 'Etch this rune anywhere on a target, gripping them by the soul. Force a Constitution saving throw. On a failure they become Paralyzed for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.',
    },
    'insurgent-insomnia': {
      id: 'insurgent-insomnia',
      name: 'Curse of the Insurgent Insomnia',
      sigilCost: 4,
      activation: 'action',
      saveType: 'Intelligence',
      duration: 'Permanent (until cured)',
      description: 'Etch this rune on a target\'s head and sap their energy, forcing an Intelligence saving throw. On a failure they gain one level of exhaustion. A single target may not gain more than 5 levels of exhaustion via this curse.',
    },
    'inverted-blade': {
      id: 'inverted-blade',
      name: 'Curse of the Inverted Blade',
      sigilCost: 8,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: 'Etch this rune on the target\'s hand or corresponding limb. For 1 minute, once per turn as a reaction when the target makes an attack, you may force a Constitution saving throw. On a failure the attack is turned against the target — they take half the damage the attack dealt.',
    },
    'lethargic-flesh': {
      id: 'lethargic-flesh',
      name: 'Curse of the Lethargic Flesh',
      sigilCost: 7,
      activation: 'bonus action',
      saveType: null,
      duration: 'Until pool depleted',
      description: 'Etch this rune into your own hand and imbue it with arcane energy. Roll a number of d12s equal to your Hexer level + 15 to create a pool. As an action you may touch a creature\'s head — if their current HP is equal to or lower than the remaining pool, subtract their HP from the pool and they fall Unconscious for 1 minute or until they take damage.',
    },
    'librarians-vow': {
      id: 'librarians-vow',
      name: "Curse of the Librarian's Vow",
      sigilCost: 3,
      activation: 'action',
      saveType: 'Wisdom',
      duration: '1 minute',
      description: "Etch this rune into a target's head. Force a Wisdom saving throw. On a failure they are Deafened and can no longer speak or make any noise. They also cannot cast spells with verbal components.",
    },
    'mind-maze': {
      id: 'mind-maze',
      name: 'Curse of the Mind Maze',
      sigilCost: 8,
      activation: 'action',
      saveType: 'Wisdom',
      duration: '1 minute',
      description: "Etch this rune into a target's head and blast their consciousness into a maze. Force a Wisdom saving throw. On a failure they are trapped for 1 minute — as a bonus action you may force them to move in any direction and may force one attack per turn. The target may repeat the save at the end of each of their turns, ending the effect on a success.",
    },
    'mocking-fate': {
      id: 'mocking-fate',
      name: 'Curse of the Mocking Fate',
      sigilCost: 4,
      activation: 'reaction (on a missed attack)',
      saveType: null,
      duration: 'Instantaneous',
      description: 'As a reaction when you miss an attack, etch this rune into your hand to guide and correct your aim. Make an additional attack against the same target as part of the same action. If it hits, it deals an additional 1d8 force damage.',
    },
    'panicked-paranoia': {
      id: 'panicked-paranoia',
      name: 'Curse of the Panicked Paranoia',
      sigilCost: 2,
      activation: 'action',
      saveType: 'Wisdom',
      duration: '1 minute',
      description: "Etch this rune into a target's head, draining them of courage. Force a Wisdom saving throw. On a failure they become Frightened of you for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.",
    },
    'seeping-vitality': {
      id: 'seeping-vitality',
      name: 'Curse of the Seeping Vitality',
      sigilCost: 6,
      activation: 'reaction (when a creature regains HP)',
      saveType: null,
      duration: 'Instantaneous',
      description: 'As a reaction when you see a creature regain hit points, etch this rune anywhere on your own body. A link of malignant energy connects you to the target, halving the hit points they regain. You gain temporary hit points equal to the amount taken away.',
    },
    'shattered-mind': {
      id: 'shattered-mind',
      name: 'Curse of the Shattered Mind',
      sigilCost: 6,
      activation: 'action',
      saveType: 'Intelligence',
      duration: '1 minute',
      description: "Etch this rune into a target's head, fracturing their concentration. Force an Intelligence saving throw. On a failure they become unable to concentrate on spells or effects for 1 minute and have disadvantage on Intelligence, Wisdom, and Charisma ability checks and saving throws. The target may repeat the save at the end of each of their turns, ending the effect on a success.",
    },
    'seized-conscious': {
      id: 'seized-conscious',
      name: 'Curse of the Seized Conscious',
      sigilCost: 4,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: "Etch this rune into a target's head and overload their mind. Force a Constitution saving throw. On a failure they become Stunned for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.",
    },
    'slack-puppet': {
      id: 'slack-puppet',
      name: 'Curse of the Slack Puppet',
      sigilCost: 6,
      activation: 'action',
      saveType: 'Constitution',
      duration: '1 minute',
      description: 'Etch this rune anywhere on a target and sever the connection between mind and muscle. Force a Constitution saving throw. On a failure they become Incapacitated for 1 minute and their speed becomes 0. The target may repeat the save at the end of each of their turns, ending the effect on a success.',
    },
    'tightened-sinew': {
      id: 'tightened-sinew',
      name: 'Curse of the Tightened Sinew',
      sigilCost: 1,
      activation: 'action',
      saveType: 'Strength',
      duration: '1 minute',
      description: "Etch this rune into a target's limbs, causing their muscles to painfully contract. Force a Strength saving throw. On a failure they become Restrained for 1 minute. The target may repeat the save at the end of each of their turns, ending the effect on a success.",
    },
  },

  // ── Spell list ─────────────────────────────────────────────────────────────
  spellList: {
    1: ['Bane','Bless','Cause Fear','Detect Magic','Hex',"Hunter's Mark",'Cure Wounds','Inflict Wounds','Sleep','Shield','Sanctuary','Expeditious Retreat','Command','Disguise Self','Illusory Script'],
    2: ['Arcane Lock','Knock','Barkskin','Warding Bond','Enlarge/Reduce','Mirror Image','Phantasmal Force','Enhance Ability','Darkvision','Invisibility'],
    3: ['Bestow Curse','Dispel Magic','Glyph of Warding','Haste','Vampiric Touch','Revivify','Fear','Magic Circle','Gaseous Form'],
    4: ['Arcane Eye','Confusion','Death Ward','Dominate Beast','Greater Invisibility','Phantasmal Killer','Polymorph','Stoneskin','Banishment'],
    5: ['Animate Objects','Awaken','Contagion','Dominate Person','Mislead','Modify Memory','Planar Binding','Telekinesis','Teleportation Circle'],
  },

  // Arcane Release d10 table for Hellion (displayed in UI)
  arcaneReleaseTable: [
    { roll: 1,  effect: 'Eruption — Curse fails and erupts. Both you and the target make a Dex save or take Xd6 force damage (X = Sigil cost of the curse), half on success.' },
    { roll: 2,  effect: 'Leaping Curse — Select one additional target within 15ft of the original. They are also afflicted by the same curse for no additional Sigil cost.' },
    { roll: 3,  effect: 'Rejected Host — The curse finds a preferable host. A different creature within 30ft is afflicted by the curse instead (your choice).' },
    { roll: 4,  effect: 'Greed — The curse costs 1d4 fewer Sigils to etch, to a minimum of zero.' },
    { roll: 5,  effect: 'Overwhelmed — The curse costs 1d4 additional Sigils to inscribe.' },
    { roll: 6,  effect: 'Intensified — If the curse requires a saving throw, the DC increases by 1. No effect otherwise.' },
    { roll: 7,  effect: 'Mirrored — You suffer the effects of the curse you were attempting to etch rather than your target.' },
    { roll: 8,  effect: "Untethered — The curse doesn't contribute to the target's curse limit but retains all effects as if it did." },
    { roll: 9,  effect: 'Chain — Select another curse you know and inscribe it into the same target for half the Sigil cost (minimum 1) as part of the same action.' },
    { roll: 10, effect: 'Swapped Save — Select another saving throw type at random. The target uses that instead. No effect if the curse has no save.' },
  ],
};

// ── Helper functions ──────────────────────────────────────────────────────────

export function getHexerProgression(level) {
  return HEXER.progression.find(p => p.level === level);
}

export function getHexerSpellSlots(level) {
  const row = getHexerProgression(level);
  if (!row || level < 2) return null;
  return { s1: row.s1, s2: row.s2, s3: row.s3, s4: row.s4, s5: row.s5 };
}

export function getHexerUnlockedFeatures(level, disciplineId) {
  const base = Object.values(HEXER.features).filter(f => f.level <= level);
  const discFeatures = disciplineId && level >= 3
    ? Object.values(HEXER.disciplines[disciplineId]?.features || {}).filter(f => f.level <= level)
    : [];
  return [...base, ...discFeatures].sort((a, b) => a.level - b.level);
}

// Returns curses the character can know based on level (all curses are always available to learn)
export function getAvailableCurses() {
  return Object.values(HEXER.curses);
}

// How many curses can be known at a given level
export function getCursesKnown(level) {
  return getHexerProgression(level)?.cursesKnown || 3;
}

// Sigils available at a given level
export function getSigils(level) {
  return getHexerProgression(level)?.sigils || 2;
}

// Max curses on one target = Int mod (min 1), +half prof bonus from level 10
export function getMaxCursesPerTarget(level, intMod, profBonus) {
  const base = Math.max(1, intMod);
  if (level >= 10) return base + Math.floor(profBonus / 2);
  return base;
}

export default HEXER;
