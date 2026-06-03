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
      description: 'You are immune to the frightened condition. Additionally, being within 5 feet of a hostile creature does not impose disadvantage on your ranged attack rolls with firearms.',
      mechanical: [
        { type: 'condition-immunity', condition: 'frightened' },
      ],
    },
    'gunfighters-instinct': {
      id: 'gunfighters-instinct',
      name: "Gunfighter's instinct",
      level: 1,
      description: "When you suffer a misfire, you may use your bonus action to clear and reload the weapon. You may draw or stow a firearm as a free object interaction. You may add your Intelligence modifier (minimum +1) to initiative rolls. When you are surprised, you may still act during the surprise round (one firearm attack or Hide action only).",
      mechanical: [
        { type: 'initiative-bonus', ability: 'intelligence', minimum: 1 },
      ],
    },
    'nerve-dice': {
      id: 'nerve-dice',
      name: 'Nerve dice',
      level: 2,
      description: "You gain a pool of Nerve Dice. You regain all expended Nerve Dice on a long rest. You also regain one expended Nerve Die whenever you reduce a hostile creature to 0 hit points with a firearm attack on your turn. You may use only one Nerve Die option per turn, except for Graze which may be used freely as your reaction.",
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
      description: 'Once per turn when you hit a creature with a firearm attack, you may use your Intelligence modifier instead of your Dexterity modifier for that attack\'s damage roll.',
    },
    'steady-hands': {
      id: 'steady-hands',
      name: 'Steady hands',
      level: 9,
      description: 'You may reload a firearm as a free object interaction once per turn. Additionally, reduce the misfire score of any firearm you wield by 1 (minimum 1).',
      mechanical: [
        { type: 'misfire-reduction', amount: 1 },
      ],
    },
    'hardened-instincts': {
      id: 'hardened-instincts',
      name: 'Hardened instincts',
      level: 11,
      description: 'Your Nerve Die size increases to a d8. Additionally, once per turn when you score a critical hit with a firearm, you regain one expended Nerve Die.',
    },
    'called-shot': {
      id: 'called-shot',
      name: 'Called shot',
      level: 13,
      description: 'When you hit a creature with a firearm attack you may expend 2 Nerve Dice to force the target to make a Constitution saving throw (DC = 8 + proficiency bonus + Dexterity modifier). On a failure, choose one: Hamstring (speed halved until end of next turn), Shell-Shocked (disadvantage on attacks, no reactions until end of next turn), or Disarm (drops one held object).',
      usesPerTurn: 1,
    },
    'nerve-recovery': {
      id: 'nerve-recovery',
      name: 'Nerve recovery',
      level: 14,
      description: 'You regain 2 expended Nerve Dice when you finish a short rest.',
      mechanical: [
        { type: 'short-rest-nerve-dice', amount: 2 },
      ],
    },
    'hair-trigger': {
      id: 'hair-trigger',
      name: 'Hair trigger',
      level: 17,
      description: 'When initiative is rolled and you are not surprised, you may immediately make one firearm attack before the first round begins. This attack resolves before any creature takes a turn.',
    },
    'the-legend': {
      id: 'the-legend',
      name: 'The legend',
      level: 20,
      description: "Your Nerve Dice pool increases by 3 (shown in table). You regain all expended Nerve Dice on a short or long rest. At the start of each combat, you act first regardless of initiative. When you reduce a creature to 0 HP with a firearm, hostile creatures that can see you must make a Wisdom saving throw (DC = 8 + proficiency + Dex mod) or become frightened until the end of your next turn. Once per turn when you expend one or more Nerve Dice, you may make one firearm attack as part of the same action, bonus action, or reaction.",
    },
  },

  // Nerve dice spend options (available at level 2+)
  nerveDiceOptions: [
    {
      id: 'quick-shot',
      name: 'Quick shot',
      cost: 1,
      action: 'bonus action',
      description: 'Make one firearm attack.',
      levelRequired: 2,
    },
    {
      id: 'graze',
      name: 'Graze',
      cost: 1,
      action: 'reaction',
      description: 'Reduce damage taken by the result of the die roll plus your Intelligence modifier.',
      roll: { dice: 1, die: 'nerveDie', addAbility: 'intelligence' },
      levelRequired: 2,
    },
    {
      id: 'suppressing-fire',
      name: 'Suppressing fire',
      cost: 2,
      action: 'action',
      description: 'Choose a 10-foot radius area within normal firearm range. Until start of next turn, creatures entering or leaving must succeed on a Dexterity saving throw (DC = 8 + proficiency + Dex mod) or have speed reduced to 0.',
      levelRequired: 2,
    },
    {
      id: 'in-plain-sight',
      name: 'In plain sight',
      cost: 1,
      action: 'bonus action',
      description: 'Take the Hide action.',
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
          description: 'Over a short or long rest, inscribe one rune into a firearm. One rune at a time. Flare Rune: +1d6 fire, bypasses fire resistance. Force Rune: bypasses physical resistance, pushes 5ft on hit. Storm Rune: +1d6 lightning, Con save or lose reaction until start of next turn. Void Rune: deals necrotic instead of piercing; crit prevents HP regain until start of your next turn.',
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
          description: 'When Enchanted Round hits, expend 1 Nerve Die to trigger an effect based on your current rune. Flare: Con save or blinded until end of next turn. Force: Str save or knocked prone and pushed 10ft. Storm: Con save or lose concentration and cannot cast concentration spells until end of next turn. Void: Con save or gain one exhaustion level.',
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
          { id:'penetrating-shot', name:'Penetrating shot', cost:1, description:"This attack ignores the target's armor bonus to AC. Shields and natural armor still apply." },
          { id:'warning-shot',     name:'Warning shot',     cost:1, description:'No hit required. Target makes Wisdom saving throw or becomes frightened until end of its next turn.' },
          { id:'snapshot',         name:'Snapshot',         cost:1, description:'Reaction. When a creature within normal range attacks an ally you can see, make one firearm attack. Your attack resolves first; if it deals damage their attack roll has disadvantage.' },
          { id:'glass-jaw',        name:'Glass jaw',        cost:2, description:'On a hit, attack deals maximum damage for weapon dice (no roll). Bonus damage still rolled.' },
          { id:'fan-the-hammer',   name:'Fan the hammer',   cost:2, description:'Make one additional firearm attack as part of the same Attack action. Both attacks this turn have disadvantage. Requires firearm with reload 4+.' },
          { id:'shatter-shot',     name:'Shatter shot',     cost:2, description:'On a hit, target and each creature within 5 feet must make a Constitution saving throw or be stunned until end of your next turn. Triggering target has disadvantage on this save.' },
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
          description: 'Choose one known Trick Shot as your Signature Move. Use it once per turn without expending a Nerve Die (2-die tricks cost 1 die instead). Change on a long rest.',
          hasChoice: true,
        },
        'read-the-tell': {
          id: 'read-the-tell',
          name: 'Read the tell',
          level: 10,
          description: 'Once per turn when you hit a creature with a firearm attack, you may forgo the damage roll to learn one of: current HP, AC, damage vulnerabilities/immunities, or whether it is concentrating on a spell. Once per creature per short or long rest.',
        },
        'showstopper': {
          id: 'showstopper',
          name: 'Showstopper',
          level: 15,
          description: 'When you reduce a creature to 0 HP using a Trick Shot, each hostile creature within 30 feet that witnessed it must make a Wisdom saving throw (DC = Trick Shot DC) or become frightened until the end of your next turn. Immune for 24 hours on a success.',
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
          levelRequired: 7,
        },
        {
          id: 'unbreakable',
          name: 'Unbreakable',
          cost: 2,
          action: 'reaction',
          description: 'When you fail a save against being stunned, paralyzed, or incapacitated, spend 2 Nerve Dice to succeed instead. Once per round.',
          levelRequired: 10,
        },
        {
          id: 'no-mercy',
          name: 'No mercy',
          cost: 1,
          action: 'free (on kill)',
          description: 'When you reduce a creature to 0 HP with a firearm attack, make one additional firearm attack against a different creature within range as part of the same action.',
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
          description: 'While you have fewer HP than half your maximum, your firearm attacks deal an additional 1d8 damage and your Nerve Dice are treated as one size larger than shown on the table.',
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

// Helper: get nerve dice info for a level
export function getNerveDice(level) {
  const row = getProgression(level);
  return { count: row.nerveDiceCount, dieSize: row.nerveDieSize };
}

export default OUTLAW;
