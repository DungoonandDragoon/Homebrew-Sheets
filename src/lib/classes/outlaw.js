// Suggested firearms from the Outlaw document. Used by the character creator,
// the Add Item list on the sheet, and the rules migration below.
export const OUTLAW_FIREARMS = [
  { id: 'pistol',      name: 'Pistol',       damage: '1d10', damageType: 'Piercing', weaponType: 'firearm', weaponCategory: 'martial', range: '30/90',  reload: 4, misfire: 1, detail: 'Light' },
  { id: 'hand-cannon', name: 'Hand cannon',  damage: '1d12', damageType: 'Piercing', weaponType: 'firearm', weaponCategory: 'martial', range: '20/60',  reload: 1, misfire: 2, detail: 'Two-handed' },
  { id: 'rifle',       name: 'Rifle',        damage: '1d12', damageType: 'Piercing', weaponType: 'firearm', weaponCategory: 'martial', range: '80/320', reload: 1, misfire: 1, detail: 'Two-handed' },
  { id: 'pepperbox',   name: 'Pepperbox',    damage: '1d10', damageType: 'Piercing', weaponType: 'firearm', weaponCategory: 'martial', range: '30/90',  reload: 6, misfire: 2, detail: 'Light' },
  { id: 'scatter-gun', name: 'Scatter gun',  damage: '2d6',  damageType: 'Piercing', weaponType: 'firearm', weaponCategory: 'martial', range: '15/30',  reload: 2, misfire: 2, detail: 'Two-handed. Each creature in a 15-foot cone makes a DC 13 Dexterity saving throw, taking full damage on a failure or half on a success.' },
];

export const OUTLAW = {
  id: 'outlaw',
  name: 'Outlaw',
  hitDie: 10,
  primaryAbility: 'dexterity',
  savingThrows: ['dexterity', 'intelligence'],
  armorProficiencies: ['Light armor', 'Medium armor'],
  weaponProficiencies: ['Simple weapons', 'Martial weapons', 'Firearms'],
  toolProficiencies: ["Tinker's tools"],
  skillChoices: {
    count: 3,
    options: ['Acrobatics','Athletics','Deception','History','Insight','Investigation','Perception','Persuasion','Sleight of Hand','Stealth','Survival'],
  },
  spellcasting: false,
  // Revised starting equipment (per the Outlaw document):
  //   (a) a pistol and 20 bullets or (b) any martial weapon and a hand crossbow with 20 bolts
  //   (a) leather armor or (b) a chain shirt
  //   (a) a dungeoneer's pack or (b) an explorer's pack
  //   Tinker's tools and 10 gp
  startingGold: 10,
  startingEquipment: {
    choices: [
      {
        id: 'weapons',
        label: 'Weapons',
        options: [
          { id: 'a', label: 'A) A pistol and 20 bullets', items: [
            { id: 'pistol', name: 'Pistol', quantity: 1, damage: '1d10', damageType: 'Piercing', weaponType: 'firearm', range: '30/90', reload: 4, misfire: 1, detail: 'Light' },
            { id: 'bullets', name: 'Bullets', quantity: 20, detail: 'Ammunition' },
          ]},
          // pickFromCategory + items: the player picks the martial weapon, and the
          // listed items (hand crossbow + bolts) are added alongside it.
          { id: 'b', label: 'B) Any martial weapon and a hand crossbow with 20 bolts', pickFromCategory: 'martial', items: [
            { id: 'hcrossbow', name: 'Hand crossbow', quantity: 1, damage: '1d6', damageType: 'Piercing', weaponType: 'ranged', range: '30/120' },
            { id: 'bolts', name: 'Crossbow bolts', quantity: 20, detail: 'Ammunition' },
          ]},
        ],
      },
      {
        id: 'armour',
        label: 'Armour',
        options: [
          { id: 'a', label: 'A) Leather armor', items: [{ id: 'leather', name: 'Leather armor', quantity: 1, baseAC: 11, armorType: 'light' }] },
          { id: 'b', label: 'B) A chain shirt', items: [{ id: 'chainshirt', name: 'Chain shirt', quantity: 1, baseAC: 13, armorType: 'medium' }] },
        ],
      },
      {
        id: 'pack',
        label: 'Adventuring pack',
        options: [
          { id: 'a', label: "A) A dungeoneer's pack", items: [{ id: 'dungeoneers', name: "Dungeoneer's pack", quantity: 1, detail: 'Pack' }] },
          { id: 'b', label: "B) An explorer's pack",  items: [{ id: 'explorers',   name: "Explorer's pack",  quantity: 1, detail: 'Pack' }] },
        ],
      },
    ],
    fixed: [
      { id: 'tinkers-tools', name: "Tinker's tools", quantity: 1, detail: 'Tool' },
    ],
  },

  // Level-by-level progression table
  progression: [
    { level:1,  profBonus:2, nerveDiceCount:2,  nerveDieSize:6,  features:['iron-nerve','gunfighters-instinct'] },
    { level:2,  profBonus:2, nerveDiceCount:3,  nerveDieSize:6,  features:['nerve-dice'] },
    { level:3,  profBonus:2, nerveDiceCount:3,  nerveDieSize:6,  features:['outlaw-archetype'] },
    { level:4,  profBonus:2, nerveDiceCount:4,  nerveDieSize:6,  features:['asi'] },
    { level:5,  profBonus:3, nerveDiceCount:4,  nerveDieSize:6,  features:['extra-attack'] },
    { level:6,  profBonus:3, nerveDiceCount:4,  nerveDieSize:6,  features:['calculated-eye'] },
    { level:7,  profBonus:3, nerveDiceCount:5,  nerveDieSize:6,  features:['archetype-feature'] },
    { level:8,  profBonus:3, nerveDiceCount:5,  nerveDieSize:6,  features:['asi'] },
    { level:9,  profBonus:4, nerveDiceCount:5,  nerveDieSize:6,  features:['steady-hands'] },
    { level:10, profBonus:4, nerveDiceCount:6,  nerveDieSize:6,  features:['archetype-feature'] },
    { level:11, profBonus:4, nerveDiceCount:6,  nerveDieSize:8,  features:['hardened-instincts'] },
    { level:12, profBonus:4, nerveDiceCount:6,  nerveDieSize:8,  features:['asi'] },
    { level:13, profBonus:5, nerveDiceCount:7,  nerveDieSize:8,  features:['called-shot'] },
    { level:14, profBonus:5, nerveDiceCount:7,  nerveDieSize:8,  features:['nerve-recovery'] },
    { level:15, profBonus:5, nerveDiceCount:7,  nerveDieSize:8,  features:['archetype-feature'] },
    { level:16, profBonus:5, nerveDiceCount:8,  nerveDieSize:8,  features:['asi'] },
    { level:17, profBonus:6, nerveDiceCount:8,  nerveDieSize:8,  features:['hair-trigger'] },
    { level:18, profBonus:6, nerveDiceCount:8,  nerveDieSize:8,  features:['archetype-feature'] },
    { level:19, profBonus:6, nerveDiceCount:9,  nerveDieSize:8,  features:['asi'] },
    { level:20, profBonus:6, nerveDiceCount:12, nerveDieSize:8,  features:['the-legend'] },
  ],

  // Base class features (all archetypes)
  features: {
    'iron-nerve': {
      id: 'iron-nerve',
      name: 'Iron nerve',
      level: 1,
      description: 'You have faced enough danger that fear no longer controls you. You are immune to the frightened condition. Additionally, being within 5 feet of a hostile creature does not impose disadvantage on your ranged attack rolls with firearms.',
      mechanical: [
        { type: 'condition-immunity', condition: 'frightened' },
      ],
    },
    'gunfighters-instinct': {
      id: 'gunfighters-instinct',
      name: "Gunfighter's instinct",
      level: 1,
      description: "When you suffer a misfire, you may use your bonus action to clear and reload the weapon rather than using your action. You may draw or stow a firearm as a free object interaction on your turn. You may add your Intelligence modifier (minimum +1) to initiative rolls. When you are surprised at the start of combat, you may still act during the surprise round, but you may only make a single firearm attack or take the Hide action during this round.",
      mechanical: [
        { type: 'initiative-bonus', ability: 'intelligence', minimum: 1 },
      ],
    },
    'nerve-dice': {
      id: 'nerve-dice',
      name: 'Nerve dice',
      level: 2,
      description: "You gain a pool of Nerve Dice (see the Outlaw table for the number and die size). They represent your composure and instinct under pressure. You regain all expended Nerve Dice when you finish a long rest. You also regain one expended Nerve Die whenever you reduce a hostile creature to 0 hit points with a firearm attack on your turn, so long as the triggering attack did not have a Nerve Die expended as part of it. You may use only one Nerve Die option per turn.",
    },
    'outlaw-archetype': {
      id: 'outlaw-archetype',
      name: 'Modus operandi',
      level: 3,
      description: 'You choose a modus operandi: the Arcane Artillerist, the Gunslinger, or the Desperado. Your archetype grants features at 3rd, 7th, 10th, 15th, and 18th level.',
    },
    'extra-attack': {
      id: 'extra-attack',
      name: 'Extra attack',
      level: 5,
      description: 'You can attack twice whenever you take the Attack action on your turn.',
    },
    'calculated-eye': {
      id: 'calculated-eye',
      name: 'Calculated eye',
      level: 6,
      description: "You have learned to see openings before they appear. Once per turn when you hit a creature with a firearm attack, you may use your Intelligence modifier instead of your Dexterity modifier for that attack's damage roll.",
    },
    'steady-hands': {
      id: 'steady-hands',
      name: 'Steady hands',
      level: 9,
      description: 'Reloading has become second nature. You may reload a firearm as a free object interaction once per turn. Additionally, reduce the misfire score of any firearm you wield by 1 (minimum 1).',
      mechanical: [
        { type: 'misfire-reduction', amount: 1 },
      ],
    },
    'hardened-instincts': {
      id: 'hardened-instincts',
      name: 'Hardened instincts',
      level: 11,
      description: 'Years of close calls have sharpened your instincts. Your Nerve Die size increases to a d8, as shown on the Outlaw table. Additionally, once per turn when you score a critical hit with a firearm, you regain one expended Nerve Die.',
    },
    'called-shot': {
      id: 'called-shot',
      name: 'Called shot',
      level: 13,
      description: 'When you hit a creature with a firearm attack, you may expend 2 Nerve Dice to force the target to make a Constitution saving throw (DC = 8 + your proficiency bonus + your Dexterity modifier). On a failure, one of the following effects applies (your choice): Hamstring (the target\'s speed is halved until the end of its next turn), Shell-Shocked (the target has disadvantage on attack rolls and cannot take reactions until the end of its next turn), or Disarm (the target drops one held object of your choice at its feet).',
    },
    'nerve-recovery': {
      id: 'nerve-recovery',
      name: 'Nerve recovery',
      level: 14,
      description: 'You have learned to recover your composure with only a moment to breathe. You regain 2 expended Nerve Dice when you finish a short rest.',
      mechanical: [
        { type: 'short-rest-nerve-dice', amount: 2 },
      ],
    },
    'hair-trigger': {
      id: 'hair-trigger',
      name: 'Hair trigger',
      level: 17,
      description: 'You have learned to recognize danger before it begins. When initiative is rolled and you are not surprised, you may immediately make one firearm attack before the first round begins. This attack resolves before any creature takes a turn.',
    },
    'the-legend': {
      id: 'the-legend',
      name: 'The legend',
      level: 20,
      description: "Your reputation has become as dangerous as your aim. Your Nerve Dice pool increases by 3, which is shown in the Nerve Dice column of the class table. You regain all expended Nerve Dice on a short or long rest. Additionally: (1) At the start of each combat, you act first regardless of initiative order. If another creature has a feature that would also cause it to act first, you and that creature roll initiative normally against each other to determine who goes between you, but you both go before everyone else. (2) When you reduce a creature to 0 hit points with a firearm attack, each hostile creature that can see you must make a Wisdom saving throw (DC = 8 + your proficiency bonus + your Dexterity modifier) or become frightened of you until the end of your next turn. A creature that succeeds is immune to this effect for 24 hours. (3) Once per turn when you expend one or more Nerve Dice for any reason, you may make one firearm attack as part of the same action, bonus action, or reaction that triggered the expenditure.",
    },
  },

  // Nerve Dice spend options (available at level 2+).
  //   roll: 'die'  -> the spent die (or dice) is rolled and the result is used (shown/sent to Discord)
  //   roll: null   -> the dice are only spent; nothing is rolled
  //   {DC} in a description is replaced with the character's live DC on the sheet.
  nerveDiceOptions: [
    {
      id: 'steady-shot',
      name: 'Steady shot',
      cost: 1,
      action: 'before an attack roll',
      description: 'Add your Nerve Die to the attack roll.',
      roll: 'die',
      rollUse: 'to the attack roll',
      levelRequired: 2,
    },
    {
      id: 'duck-and-weave',
      name: 'Duck and weave',
      cost: 1,
      action: 'reaction',
      description: 'When a creature you can see makes an attack against you, roll your Nerve Die and add the result to your AC against that attack, potentially causing it to miss.',
      roll: 'die',
      rollUse: 'to your AC against that attack',
      levelRequired: 2,
    },
    {
      id: 'covering-fire',
      name: 'Covering fire',
      cost: 2,
      action: 'action',
      description: "Choose a 10-foot radius area within your firearm's normal range. Until the start of your next turn, any creature that enters or attempts to leave the area must succeed on a Dexterity saving throw (DC {DC}) or have its speed reduced to 0 for the rest of its turn.",
      roll: null,
      levelRequired: 2,
    },
    {
      id: 'quick-draw',
      name: 'Quick draw',
      cost: 1,
      action: 'bonus action',
      description: "When a creature enters your firearm's normal range, expend 1 Nerve Die as a reaction to make one firearm attack against it.",
      roll: null,
      levelRequired: 2,
    },
  ],

  archetypes: {
    'arcane-artillerist': {
      id: 'arcane-artillerist',
      name: 'Arcane Artillerist',
      level: 3,
      spellcasting: {
        ability: 'intelligence',
        spellList: 'wizard',
        type: 'prepared',
        preparedFormula: { halfLevel: true, addAbility: 'intelligence' },
        cantrips: { start: 2, level10: 1 },
        slots: [
          { level:3,  s1:2, s2:0, s3:0, s4:0 },
          { level:4,  s1:3, s2:0, s3:0, s4:0 },
          { level:5,  s1:3, s2:0, s3:0, s4:0 },
          { level:6,  s1:3, s2:0, s3:0, s4:0 },
          { level:7,  s1:4, s2:2, s3:0, s4:0 },
          { level:8,  s1:4, s2:2, s3:0, s4:0 },
          { level:9,  s1:4, s2:2, s3:0, s4:0 },
          { level:10, s1:4, s2:3, s3:0, s4:0 },
          { level:11, s1:4, s2:3, s3:0, s4:0 },
          { level:12, s1:4, s2:3, s3:0, s4:0 },
          { level:13, s1:4, s2:3, s3:2, s4:0 },
          { level:14, s1:4, s2:3, s3:2, s4:0 },
          { level:15, s1:4, s2:3, s3:2, s4:0 },
          { level:16, s1:4, s2:3, s3:3, s4:0 },
          { level:17, s1:4, s2:3, s3:3, s4:0 },
          { level:18, s1:4, s2:3, s3:3, s4:0 },
          { level:19, s1:4, s2:3, s3:3, s4:1 },
          { level:20, s1:4, s2:3, s3:3, s4:1 },
        ],
      },
      features: {
        'enchanted-round': {
          id: 'enchanted-round',
          name: 'Enchanted round',
          level: 3,
          description: 'When you make a firearm attack you may expend a spell slot to deal additional force damage equal to 1d8 per level of the slot. Declare after seeing the attack roll but before the DM determines a hit.',
        },
        'runic-barrel': {
          id: 'runic-barrel',
          name: 'Runic barrel',
          level: 7,
          description: 'Over the course of a short or long rest, you may inscribe one of the following runes into a firearm you are holding. A firearm holds only one rune at a time. Flare Rune: attacks with this weapon deal an additional 1d6 fire damage and bypass fire resistance. Force Rune: attacks bypass resistance to physical damage and push the target 5 feet on a hit. Storm Rune: attacks deal an additional 1d6 lightning damage; on a hit, the target must succeed on a Constitution saving throw (DC equals your spell save DC) or lose its reaction until the start of its next turn. Void Rune: attacks deal necrotic damage instead of piercing; on a critical hit, the target cannot regain hit points until the start of your next turn.',
          hasActiveState: true,
          runeOptions: ['None','Flare','Force','Storm','Void'],
        },
        'spellcraft': {
          id: 'spellcraft',
          name: 'Spellcraft',
          level: 10,
          description: 'When you use your action to cast a cantrip, you may make one firearm attack as a bonus action.',
        },
        'arcane-overload': {
          id: 'arcane-overload',
          name: 'Arcane overload',
          level: 15,
          description: 'When you use Enchanted Round and the attack hits, you may expend one additional Nerve Die to trigger an Arcane Overload effect based on the rune currently inscribed on your firearm (no effect if no rune is inscribed). Flare Rune: the target makes a Constitution saving throw against your spell save DC or is blinded until the end of your next turn. Force Rune: Strength saving throw or knocked prone and pushed 10 feet away from you. Storm Rune: Constitution saving throw or loses concentration and cannot cast concentration spells until the end of your next turn. Void Rune: Constitution saving throw or gains one level of exhaustion.',
        },
        'spellshot': {
          id: 'spellshot',
          name: 'Spellshot',
          level: 18,
          description: 'When you hit a creature with a firearm attack, you may simultaneously cast a spell with a range of Touch on that creature. The hit counts as the required touch; no separate attack roll needed. Expend the spell slot as part of the same action.',
        },
      },
    },

    'gunslinger': {
      id: 'gunslinger',
      name: 'Gunslinger',
      level: 3,
      spellcasting: null,
      trickShots: {
        startCount: 3,
        additionalLevels: [7, 10, 15, 18],
        options: [
          { id:'ricochet',         name:'Ricochet',         cost:1, description:'This attack ignores half and three-quarters cover. May target a creature behind full cover if a hard surface is nearby (attack has disadvantage).' },
          { id:'disarming-shot',   name:'Disarming shot',   cost:1, description:'On a hit, the target makes a Strength saving throw or drops one held object at its feet.' },
          { id:'pinning-shot',     name:'Pinning shot',     cost:1, description:"On a hit, target makes a Strength saving throw or speed becomes 0 until end of its next turn." },
          { id:'double-tap',       name:'Double tap',       cost:1, description:'On a hit, roll damage dice twice and take the higher result.' },
          { id:'penetrating-shot', name:'Penetrating shot', cost:2, description:"This attack ignores the target's armor bonus to AC. Shields and natural armor still apply." },
          { id:'warning-shot',     name:'Warning shot',     cost:1, description:'No hit required. Target makes Wisdom saving throw or becomes frightened until end of its next turn.' },
          { id:'snapshot',         name:'Snapshot',         cost:2, description:"Reaction. When a creature within your firearm's normal range attacks an ally you can see, you may make one firearm attack against that creature as a reaction. Your attack resolves before theirs; if it deals damage, their attack roll has disadvantage." },
          { id:'glass-jaw',        name:'Glass jaw',        cost:3, description:'On a hit, attack deals maximum damage for weapon dice (no roll). Bonus damage still rolled.' },
          { id:'fan-the-hammer',   name:'Fan the hammer',   cost:2, description:'Make one additional firearm attack as part of the same Attack action. Both attacks this turn have disadvantage. Requires a firearm with a reload score of 4 or higher.' },
          { id:'shatter-shot',     name:'Shatter shot',     cost:3, description:'On a hit, target and each creature within 5 feet must make a Constitution saving throw or be stunned until end of your next turn. Triggering target has disadvantage on this save.' },
        ],
      },
      features: {
        'showmanship': {
          id: 'showmanship',
          name: 'Showmanship',
          level: 3,
          description: 'When you use a Trick Shot and the target fails its saving throw, you regain 1 expended Nerve Die. Once per turn.',
        },
        'signature-move': {
          id: 'signature-move',
          name: 'Signature move',
          level: 7,
          description: 'Choose one Trick Shot you know as your Signature Move. You may use it once per turn without expending a Nerve Die. If the Trick Shot requires two Nerve Dice to be expended, you only have to expend one. You may change your Signature Move on a long rest.',
          hasChoice: true,
        },
        'read-the-tell': {
          id: 'read-the-tell',
          name: 'Read the tell',
          level: 10,
          description: 'Once per turn when you hit a creature with a firearm attack, you may forgo the damage roll to learn one of: current HP, AC, damage vulnerabilities/immunities, or whether it is concentrating on a spell. Once you have read a creature this way you cannot do so again until it finishes a short or long rest.',
        },
        'showstopper': {
          id: 'showstopper',
          name: 'Showstopper',
          level: 15,
          description: 'A kill is no longer just a kill. It is a message. When you reduce a creature to 0 hit points using a Trick Shot, each hostile creature within 30 feet that witnessed it must make a Wisdom saving throw (DC = Trick Shot DC) or become frightened of you until the end of your next turn. Creatures that succeed are immune to this effect for 24 hours.',
        },
        'legendary-duel': {
          id: 'legendary-duel',
          name: 'Legendary duel',
          level: 18,
          description: 'Once per long rest, before initiative is rolled, declare a Legendary Duel against one creature you can see. Until the duel ends, you and the target roll initiative with advantage and all attacks between you are made with advantage. The first time either of you would be reduced to 0 HP during the duel, that creature drops to 1 HP instead (once per combatant).',
          maxUsesLongRest: 1,
        },
      },
    },

    'desperado': {
      id: 'desperado',
      name: 'Desperado',
      level: 3,
      spellcasting: null,
      nerveDiceOptions: [
        {
          id: 'into-the-fray',
          name: 'Into the fray',
          cost: 1,
          action: 'reaction',
          description: 'When a creature within 5 feet misses you with a melee attack, make one firearm attack against it.',
          roll: null,
          levelRequired: 7,
        },
        {
          id: 'unbreakable',
          name: 'Unbreakable',
          cost: 2,
          action: 'reaction',
          description: 'When you fail a save against being stunned, paralyzed, or incapacitated, spend 2 Nerve Dice to succeed instead. Once per round.',
          roll: null,
          levelRequired: 10,
        },
        {
          id: 'no-mercy',
          name: 'No mercy',
          cost: 1,
          action: 'free (on kill)',
          description: 'When you reduce a creature to 0 HP with a firearm attack, make one additional firearm attack against a different creature within range as part of the same action.',
          roll: null,
          levelRequired: 15,
        },
      ],
      features: {
        'reckless-fusillade': {
          id: 'reckless-fusillade',
          name: 'Reckless fusillade',
          level: 3,
          description: 'When you make your first firearm attack on your turn, you may declare a Reckless Fusillade. Until the start of your next turn, all your firearm attacks have advantage, but attack rolls against you also have advantage. Uses equal to proficiency bonus per long rest.',
          maxUsesProfBonus: true,
          resetOn: 'long',
        },
        'frontier-fortitude': {
          id: 'frontier-fortitude',
          name: 'Frontier fortitude',
          level: 3,
          description: 'At the start of each combat you gain temporary HP equal to your Outlaw level + Constitution modifier. When you use Reckless Fusillade, gain additional temporary HP equal to your proficiency bonus.',
        },
        'into-the-fray': {
          id: 'into-the-fray',
          name: 'Into the fray',
          level: 7,
          description: 'When a creature within 5 feet of you misses you with a melee attack, you may expend 1 Nerve Die to make a single firearm attack against it as a reaction.',
        },
        'blood-in-the-water': {
          id: 'blood-in-the-water',
          name: 'Blood in the water',
          level: 7,
          description: 'Your firearm attacks deal an additional 1d6 damage against creatures below half their hit point maximum. Increases to 1d8 at level 11.',
          mechanical: [
            { type: 'conditional-damage', condition: 'target-below-half-hp', dice:'1d6', level11:'1d8' },
          ],
        },
        'unbreakable': {
          id: 'unbreakable',
          name: 'Unbreakable',
          level: 10,
          description: 'When you fail a saving throw against being stunned, paralyzed, or incapacitated, you may expend 2 Nerve Dice to succeed instead. Once per round.',
        },
        'no-mercy': {
          id: 'no-mercy',
          name: 'No mercy',
          level: 15,
          description: 'When you reduce a creature to 0 HP with a firearm attack, you may expend 1 Nerve Die to immediately make one additional firearm attack against a different creature within range as part of the same action.',
        },
        'the-last-bullet': {
          id: 'the-last-bullet',
          name: 'The last bullet',
          level: 18,
          description: 'The closer you get to defeat, the harder you are to stop. While you have fewer hit points than half your maximum, your firearm attacks deal an additional 1d8 damage of the same type as the firearm and your Nerve Dice are treated as one size larger than shown on the table.',
        },
      },
    },
  },
};

// Helper: get the progression row for a given level
export function getProgression(level) {
  return OUTLAW.progression.find(p => p.level === level);
}

// Helper: get all features unlocked at or before a given level for a given archetype
export function getUnlockedFeatures(level, archetypeId) {
  const base = Object.values(OUTLAW.features).filter(f => f.level <= level);
  const archFeatures = archetypeId && level >= 3
    ? Object.values(OUTLAW.archetypes[archetypeId]?.features || {}).filter(f => f.level <= level)
    : [];
  return [...base, ...archFeatures];
}

// Helper: get spell slots for arcane artillerist at a given level
export function getSpellSlots(level) {
  if (level < 3) return null;
  const row = OUTLAW.archetypes['arcane-artillerist'].spellcasting.slots.find(s => s.level === level);
  return row || null;
}

// Helper: get trick shot count for gunslinger at a given level
export function getTrickShotCount(level) {
  if (level < 3) return 0;
  const { startCount, additionalLevels } = OUTLAW.archetypes.gunslinger.trickShots;
  return startCount + additionalLevels.filter(l => l <= level).length;
}

// Helper: Nerve Die cost of a Trick Shot when it is the Gunslinger's Signature Move.
// "Once per turn without expending a Nerve Die; if it requires two, only expend one"
// = the shot costs one die less than normal (never below 0).
export function signatureCost(baseCost) {
  return Math.max(0, baseCost - 1);
}

// Version of the Outlaw rules baked into saved characters. Bump this when a
// change needs to touch data already stored on existing characters.
export const OUTLAW_RULES_VERSION = 2;

// One-time, idempotent upgrade of an already-saved Outlaw character to the
// current rules. Class features, Nerve Dice options, trick shot costs and the
// Signature Move are all read live from this file, so existing characters pick
// those up automatically. What is stored on the character and needs updating:
// firearms in the inventory (Reload score, and Misfire/properties if missing).
// Returns true if anything changed (so the caller knows to save).
export function migrateOutlawCharacter(data, classId) {
  if (classId !== 'outlaw' || !data) return false;
  if ((data.outlawRulesVersion || 0) >= OUTLAW_RULES_VERSION) return false;
  (data.inventory || []).forEach(item => {
    if (item.weaponType !== 'firearm') return;
    const ref = OUTLAW_FIREARMS.find(f => f.name.toLowerCase() === String(item.name || '').trim().toLowerCase());
    if (!ref) return; // custom or legacy firearm (Musket, Blunderbuss…) — leave exactly as the player has it
    if (item.reload == null) item.reload = ref.reload;
    if (item.misfire == null && item.misfireScore == null) item.misfire = ref.misfire;
    if (!item.detail) item.detail = ref.detail;
  });
  data.outlawRulesVersion = OUTLAW_RULES_VERSION;
  return true;
}

// Helper: get nerve dice info for a level
export function getNerveDice(level) {
  const row = getProgression(level);
  return { count: row.nerveDiceCount, dieSize: row.nerveDieSize };
}

export default OUTLAW;
