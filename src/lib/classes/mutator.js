// ── MUTATOR CLASS ─────────────────────────────────────────────────────────────
// A warrior of flesh and will, bending their own body into living weapons,
// armor, and tools of survival.

export const MUTATOR = {
  id: 'mutator',
  name: 'Mutator',
  hitDie: 10,
  primaryAbility: 'constitution',
  savingThrows: ['constitution', 'intelligence'],
  armorProficiencies: ['Light armor', 'Medium armor', 'Shields'],
  weaponProficiencies: ['Simple weapons', 'Martial weapons'],
  toolProficiencies: ["Herbalism kit", "Poisoner's kit"],
  skillChoices: {
    count: 2,
    options: ['Medicine', 'Survival', 'Athletics', 'Investigation'],
  },

  // ── Progression table ───────────────────────────────────────────────────────
  // biomass: resource used to activate mutations
  // bioshocks: resource used to bioshock (enhance) active mutations
  // mutationsKnown: how many mutations the character knows
  progression: [
    { level:1,  profBonus:2, biomass:1,  bioshocks:0, mutationsKnown:2,  features:['unsettling-visage','mutations'] },
    { level:2,  profBonus:2, biomass:1,  bioshocks:1, mutationsKnown:2,  features:['bioshock','tool-for-the-job'] },
    { level:3,  profBonus:2, biomass:2,  bioshocks:1, mutationsKnown:3,  features:['evolution'] },
    { level:4,  profBonus:2, biomass:2,  bioshocks:1, mutationsKnown:3,  features:['asi'] },
    { level:5,  profBonus:3, biomass:3,  bioshocks:2, mutationsKnown:4,  features:['extra-attack'] },
    { level:6,  profBonus:3, biomass:3,  bioshocks:2, mutationsKnown:4,  features:['evolution-feature'] },
    { level:7,  profBonus:3, biomass:4,  bioshocks:2, mutationsKnown:5,  features:['mutated-strike'] },
    { level:8,  profBonus:3, biomass:4,  bioshocks:3, mutationsKnown:5,  features:['asi'] },
    { level:9,  profBonus:4, biomass:5,  bioshocks:3, mutationsKnown:6,  features:['adaptable-form'] },
    { level:10, profBonus:4, biomass:5,  bioshocks:3, mutationsKnown:6,  features:['evolution-feature'] },
    { level:11, profBonus:4, biomass:6,  bioshocks:3, mutationsKnown:7,  features:['organic-fortitude'] },
    { level:12, profBonus:4, biomass:6,  bioshocks:5, mutationsKnown:7,  features:['asi'] },
    { level:13, profBonus:5, biomass:7,  bioshocks:5, mutationsKnown:8,  features:['reflexive-blow'] },
    { level:14, profBonus:5, biomass:8,  bioshocks:5, mutationsKnown:8,  features:['evolution-feature'] },
    { level:15, profBonus:5, biomass:8,  bioshocks:5, mutationsKnown:10, features:['resistant-sinews'] },
    { level:16, profBonus:5, biomass:8,  bioshocks:8, mutationsKnown:10, features:['asi'] },
    { level:17, profBonus:6, biomass:10, bioshocks:8, mutationsKnown:10, features:['biomantic-apex'] },
    { level:18, profBonus:6, biomass:10, bioshocks:8, mutationsKnown:12, features:['evolution-feature'] },
    { level:19, profBonus:6, biomass:12, bioshocks:8, mutationsKnown:12, features:['asi'] },
    { level:20, profBonus:6, biomass:12, bioshocks:10, mutationsKnown:12, features:['transcendant-mutation'] },
  ],

  // ── Base class features ─────────────────────────────────────────────────────
  features: {
    'unsettling-visage': {
      id: 'unsettling-visage',
      name: 'Unsettling Visage',
      level: 1,
      description: 'The marks of your art dot your body and make you radiate an aura of unease. You gain proficiency with Intimidation. If you already have proficiency you gain expertise instead.',
    },
    'mutations': {
      id: 'mutations',
      name: 'Mutations',
      level: 1,
      description: 'Your proficiency with biomancy lets you apply various mutations to your own body. At 1st level you gain two mutations of your choice. You gain additional mutations as shown in the Mutations Known column of the mutator table. At 1st level you gain 1 biomass. You gain additional biomass as shown in the Biomass column. You must use a biomass to activate a mutation. Biomass resets on a short rest. At 1st level you may only have one mutation active at a time; this increases to two at 5th level and three at 10th level. At the start of a long rest you may replace one known mutation with one you do not currently know.',
    },
    'bioshock': {
      id: 'bioshock',
      name: 'Bioshock',
      level: 2,
      description: 'Your prowess with biomancy allows you to enhance your mutations. You may only have one mutation bioshocked at a time. You gain 1 bioshock that replenishes on a long rest. You gain additional bioshocks as shown in the Bioshocks column. When you bioshock a mutation it gains the enhanced effect described in that mutation\'s entry.',
    },
    'tool-for-the-job': {
      id: 'tool-for-the-job',
      name: 'The Tool for the Job',
      level: 2,
      description: 'You can create and shape your biomass into whatever you need to get the job done. You do not require proficiency with a tool set to use it, and you gain advantage on rolls made with tools you do have proficiency with.',
    },
    'evolution': {
      id: 'evolution',
      name: 'Evolution',
      level: 3,
      description: 'Your biomantical powers have evolved into a heightened state. Choose Predator, Arcanist, or Ghoul. Your choice grants features at 3rd level and again at 6th, 10th, 14th, and 18th level.',
    },
    'extra-attack': {
      id: 'extra-attack',
      name: 'Extra Attack',
      level: 5,
      description: 'Beginning at 5th level, you can attack twice instead of once when you take the Attack action.',
    },
    'mutated-strike': {
      id: 'mutated-strike',
      name: 'Mutated Strike',
      level: 7,
      description: 'Starting at 7th level, when you make an attack with a mutated weapon you may add your proficiency bonus to the attack roll twice, and your Constitution modifier to the damage.',
    },
    'adaptable-form': {
      id: 'adaptable-form',
      name: 'Adaptable Form',
      level: 9,
      description: 'At 9th level, at the beginning of a short rest you may choose one mutation you know and replace it with another you do not currently know. Additionally at the start of a long rest you may choose up to three mutations you know to replace with mutations you do not currently know.',
    },
    'organic-fortitude': {
      id: 'organic-fortitude',
      name: 'Organic Fortitude',
      level: 11,
      description: 'Beginning at 11th level, once per short rest when you fail a saving throw before knowing the outcome you may reroll; you must take the new roll. Additionally when hit by an attack you can use a reaction to shift your body into something more suited to the attack, reducing it by your Constitution modifier + your Intelligence modifier. You can do this a number of times equal to your proficiency bonus per long rest.',
    },
    'reflexive-blow': {
      id: 'reflexive-blow',
      name: 'Reflexive Blow',
      level: 13,
      description: 'Starting at 13th level, once per short rest when hit by an attack your body reflexively shoots out tentacles, spikes, or another form of attack as a reaction, dealing 1d10 (2d10 at 17th level) slashing/piercing/or bludgeoning damage to the attacker.',
    },
    'resistant-sinews': {
      id: 'resistant-sinews',
      name: 'Resistant Sinews',
      level: 15,
      description: 'Starting at 15th level, you gain resistance to a damage type of your choosing. You may switch this damage type on a long rest. Additionally once per long rest when you are reduced to 0 hit points but not killed outright you can drop to 1 hit point instead, and at the start of your next three turns you regain hit points equal to your Constitution modifier.',
    },
    'biomantic-apex': {
      id: 'biomantic-apex',
      name: 'Biomantic Apex',
      level: 17,
      description: 'Beginning at 17th level, at the start of a long rest you may choose one mutation you know and activate it permanently until the start of your next long rest. This mutation does not require a biomass and does not count against your mutations active. You may choose to bioshock this mutation; it counts against your active bioshocked mutations and requires the usage of one bioshock.',
    },
    'transcendant-mutation': {
      id: 'transcendant-mutation',
      name: 'Transcendant Mutation',
      level: 20,
      description: 'At 20th level, once per long rest you activate as many mutations of your choosing that you know as if bioshocked on yourself at once for up to a minute. During this time if you are downed these mutations end instead and you regain 4d10 hit points.',
    },
  },

  // ── Evolutions (subclasses) ─────────────────────────────────────────────────
  evolutions: {

    // ── PREDATOR ──────────────────────────────────────────────────────────────
    'predator': {
      id: 'predator',
      name: 'Predator',
      level: 3,
      description: 'Mutators who evolve into Predators have studied the movement and adaptation of wild beasts, gaining the ability to alter themselves to emulate such beasts.',
      features: {
        'overclock': {
          id: 'overclock',
          name: 'Overclock',
          level: 3,
          description: 'At 3rd level, you may take 1d4 necrotic damage to be able to use your Bioshock feature on another mutation at one time. This damage increases by an extra 1d4 necrotic damage per mutations bioshocked after 2 (e.g. to bioshock a third mutation you sustain 2d4 necrotic damage, to bioshock a fourth you would sustain 3d4 necrotic damage).',
        },
        'primal-infusion': {
          id: 'primal-infusion',
          name: 'Primal Infusion',
          level: 3,
          description: 'Additionally at 3rd level, when you hit with an attack you can imbue it with your very flesh, adding an additional 1d8 necrotic damage. This feature can be used a number of times equal to your Constitution modifier per long rest.',
        },
        'predatorial-mutations': {
          id: 'predatorial-mutations',
          name: 'Predatorial Mutations',
          level: 6,
          description: 'Starting at 6th level, you can now learn mutations available only to evolved Predator mutators. These mutations are detailed at the end of the mutations section.',
        },
        'hunters-instincts': {
          id: 'hunters-instincts',
          name: 'Hunter\'s Instincts',
          level: 10,
          description: 'Starting at 10th level, you gain advantage on attacks against creatures you have already damaged on that same turn. Additionally you gain advantage on all checks to track or locate a creature, and other creatures have disadvantage on checks to track or locate you.',
        },
        'endurable-overclock': {
          id: 'endurable-overclock',
          name: 'Endurable Overclock',
          level: 14,
          description: 'Starting at 14th level, when you sustain damage from your Overclock feature, reduce it by your Constitution modifier (minimum 1).',
        },
        'apex-mutation': {
          id: 'apex-mutation',
          name: 'Apex Mutation',
          level: 18,
          description: 'Starting at 18th level, as an action your body rapidly morphs and becomes beast-like, large claws grow on your hands, a long tail tipped in a bone spike grows from your waist, gills form on your neck, and brilliant leathery wings of flesh explode from your back. You gain the effects of all four predatorial mutations (Slit Gills, Flesh Wings, Feral Claws, and Spinal Tail) at the same time. This feature can be used once per short rest.',
        },
      },
    },

    // ── ARCANIST ──────────────────────────────────────────────────────────────
    'arcanist': {
      id: 'arcanist',
      name: 'Arcanist',
      level: 3,
      description: 'Mutators that evolve into Arcanists have learnt how to mould the arcane weave around them to their advantages just as easily as flesh.',
      spellcasting: {
        ability: 'intelligence',
        // Arcanist spellcasting table — spells known and slots per level
        // Slots columns: 1st, 2nd, 3rd, 4th
        table: [
          { mutatorLevel:3,  cantripsKnown:2, spellsKnown:3,  s1:2, s2:0, s3:0, s4:0 },
          { mutatorLevel:4,  cantripsKnown:2, spellsKnown:4,  s1:3, s2:0, s3:0, s4:0 },
          { mutatorLevel:5,  cantripsKnown:2, spellsKnown:4,  s1:3, s2:0, s3:0, s4:0 },
          { mutatorLevel:6,  cantripsKnown:2, spellsKnown:4,  s1:3, s2:0, s3:0, s4:0 },
          { mutatorLevel:7,  cantripsKnown:2, spellsKnown:5,  s1:4, s2:2, s3:0, s4:0 },
          { mutatorLevel:8,  cantripsKnown:2, spellsKnown:6,  s1:4, s2:2, s3:0, s4:0 },
          { mutatorLevel:9,  cantripsKnown:2, spellsKnown:6,  s1:4, s2:2, s3:0, s4:0 },
          { mutatorLevel:10, cantripsKnown:2, spellsKnown:7,  s1:4, s2:3, s3:0, s4:0 },
          { mutatorLevel:11, cantripsKnown:3, spellsKnown:8,  s1:4, s2:3, s3:0, s4:0 },
          { mutatorLevel:12, cantripsKnown:3, spellsKnown:8,  s1:4, s2:3, s3:0, s4:0 },
          { mutatorLevel:13, cantripsKnown:3, spellsKnown:9,  s1:4, s2:3, s3:2, s4:0 },
          { mutatorLevel:14, cantripsKnown:3, spellsKnown:10, s1:4, s2:3, s3:2, s4:0 },
          { mutatorLevel:15, cantripsKnown:3, spellsKnown:10, s1:4, s2:3, s3:2, s4:0 },
          { mutatorLevel:16, cantripsKnown:3, spellsKnown:11, s1:4, s2:3, s3:3, s4:0 },
          { mutatorLevel:17, cantripsKnown:3, spellsKnown:11, s1:4, s2:3, s3:3, s4:1 },
          { mutatorLevel:18, cantripsKnown:3, spellsKnown:11, s1:4, s2:3, s3:3, s4:1 },
          { mutatorLevel:19, cantripsKnown:3, spellsKnown:12, s1:4, s2:3, s3:3, s4:1 },
          { mutatorLevel:20, cantripsKnown:3, spellsKnown:13, s1:4, s2:3, s3:3, s4:2 },
        ],
      },
      features: {
        'arcanist-spellcasting': {
          id: 'arcanist-spellcasting',
          name: 'Spellcasting',
          level: 3,
          description: 'At 3rd level you augment your martial prowess with the ability to cast spells (wizard spell list, transmutation only). You learn 2 cantrips and 3 1st-level transmutation spells. Spellcasting ability is Intelligence. Spell save DC = 8 + proficiency bonus + Intelligence modifier. Spell attack modifier = proficiency bonus + Intelligence modifier. You learn additional wizard cantrips at 10th level. Spells Known follows the Arcanist Spellcasting table. You can replace one known spell when you gain a level. Spell slots are restored on a long rest.',
        },
        'weave-clot': {
          id: 'weave-clot',
          name: 'Weave Clot',
          level: 3,
          description: 'Additionally at 3rd level, when a spell is cast within 10 feet you can expend a reaction to force the caster to roll a saving throw against your spell save DC. On a fail the spell that was attempted to cast is nullified. You can use this feature a number of times equal to your Intelligence modifier per long rest.',
        },
        'arcane-mutations': {
          id: 'arcane-mutations',
          name: 'Arcane Mutations',
          level: 6,
          description: 'Starting at 6th level, you can now learn mutations available only to evolved Arcanist mutators. These mutations are detailed at the end of the mutations section.',
        },
        'spell-sacs': {
          id: 'spell-sacs',
          name: 'Spell Sacs',
          level: 10,
          description: 'Starting at 10th level, when a spell is nullified by your Weave Clot you can activate this feature as a reaction and store the spell in a sac of specialised flesh, as a bonus action until the end of your next turn you can cast that spell once. You cannot store more than one spell at a time.',
        },
        'arcane-parasite': {
          id: 'arcane-parasite',
          name: 'Arcane Parasite',
          level: 14,
          description: 'Starting at 14th level, when you capture a spell with your Spell Sacs feature, rather than casting it yourself you may instead use your action to absorb the spell and regain a spell slot no higher than half of the original spell\'s level rounded down (minimum 1).',
        },
        'arcane-backlash': {
          id: 'arcane-backlash',
          name: 'Arcane Backlash',
          level: 18,
          description: 'Starting at 18th level, when you nullify a spell with your Weave Clot feature you may expend a reaction to cast a spell of 2nd level or lower on the original caster.',
        },
      },
    },

    // ── GHOUL ─────────────────────────────────────────────────────────────────
    'ghoul': {
      id: 'ghoul',
      name: 'Ghoul',
      level: 3,
      description: 'Mutators that evolve into Ghouls have embraced the necrotic and corrupt nature of their biomancy, allowing them to mold others\' flesh into their mutations just as easily as their own.',
      features: {
        'biomantic-touch': {
          id: 'biomantic-touch',
          name: 'Biomantic Touch',
          level: 3,
          description: 'At 3rd level, you can use an action to touch a creature and apply one of your known mutations to them. This overrides the normal action cost of the mutation. Unwilling creatures must make a Constitution saving throw with a DC equal to 8 + your proficiency bonus + your Intelligence modifier. If the mutation you attempt to apply is bioshocked, you may add your Constitution modifier to the DC.',
        },
        'corrupted-vitality': {
          id: 'corrupted-vitality',
          name: 'Corrupted Vitality',
          level: 3,
          description: 'Additionally at 3rd level, when you successfully hit a mutated creature you gain 1d8 temporary hit points. At 10th level these hit points are increased to 1d10. These temporary hit points replace other temporary hit points you may have already had.',
        },
        'corrupted-mutations': {
          id: 'corrupted-mutations',
          name: 'Corrupted Mutations',
          level: 6,
          description: 'Starting at 6th level, you can now learn mutations available only to evolved Ghoul mutators. These mutations are detailed at the end of the mutations section.',
        },
        'embellished-leech': {
          id: 'embellished-leech',
          name: 'Embellished Leech',
          level: 10,
          description: 'Starting at 10th level, you can expend a Bioshock to gain an extra 1d8 temporary hit points when your Corrupted Vitality feature is activated.',
        },
        'destructive-touch': {
          id: 'destructive-touch',
          name: 'Destructive Touch',
          level: 14,
          description: 'Starting at 14th level, when you use your Biomantic Touch the target also takes 1d10 + your Constitution modifier necrotic damage. If they succeed their saving throw against Biomantic Touch then this damage is halved.',
        },
        'complete-control': {
          id: 'complete-control',
          name: 'Complete Control',
          level: 18,
          description: 'Starting at 18th level, when you successfully apply a mutation to another creature with your Biomantic Touch feature, they fall under your influence and bend to your will. On your turn you may expend your reaction to move them up to half their movement speed and your bonus action to make them take the Attack action on a creature of your choice. On each of the mutated target\'s turns they may reroll the initial saving throw in an attempt to break free of your control and the mutation placed on them. This effect lasts for 5 turns or the duration of the mutation, whichever is shorter. This feature can be used a number of times equal to your Intelligence modifier per long rest.',
        },
      },
    },
  },

  // ── Base mutations (available to all Mutators) ──────────────────────────────
  mutations: {
    'bone-blade': {
      id: 'bone-blade',
      name: 'Bone Blade',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '1 minute',
      description: 'A melee weapon of your choosing sprouts from your arm or hand. You have proficiency with it, it uses your Constitution modifier to hit rather than Strength or Dexterity, and deals 1d4 damage (1d6 at 6th level, 1d8 at 12th level) plus a damage bonus equal to 1d4 (1d6 at 6th, 1d8 at 12th).',
      bioshock: 'The weapon\'s extra damage is 1d6 (1d8 at 6th level, 1d10 at 12th level) instead.',
    },
    'bone-bow': {
      id: 'bone-bow',
      name: 'Bone Bow',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '1 minute',
      description: 'A ranged weapon of your choosing forms from bone and flesh on your arm or hand. You have proficiency with it, it uses your Constitution modifier to hit, and deals 1d4 damage (1d6 at 6th level, 1d8 at 12th level) plus a damage bonus equal to 1d4 (1d6 at 6th, 1d8 at 12th).',
      bioshock: 'The weapon\'s extra damage is 1d6 (1d8 at 6th level, 1d10 at 12th level) instead.',
    },
    'toughened-hide': {
      id: 'toughened-hide',
      name: 'Toughened Hide',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '3 turns',
      description: 'Your skin hardens and turns leathery. Your armor class is increased by 1.',
      bioshock: 'Your armor class instead increases by 2 and the mutation lasts for 5 turns.',
    },
    'mobile-muscles': {
      id: 'mobile-muscles',
      name: 'Mobile Muscles',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '3 turns',
      description: 'Your legs grow and strengthen, increasing your movement speed by 5ft.',
      bioshock: 'Your movement speed increases by 15ft and the mutation lasts for 5 turns instead.',
    },
    'tendon-hook': {
      id: 'tendon-hook',
      name: 'Tendon Hook',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '5 turns',
      description: 'A long rope of sinewy flesh with a hook made of bone extends from your forearm (reach 15ft). You can use it to pull yourself towards an object or creature (5ft) or pull an object or creature 5ft towards you. Unwilling creatures make a Constitution save DC 8 + proficiency + Constitution modifier.',
      bioshock: 'The hook can reach 30ft. You can be pulled 10ft towards a creature, or creatures can be pulled 10ft towards you.',
    },
    'chameleon-skin': {
      id: 'chameleon-skin',
      name: 'Chameleon Skin',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '1 minute',
      description: 'Your skin shifts and changes color to match your surroundings. You gain advantage on Stealth checks for 1 minute.',
      bioshock: 'You gain the effects of the Invisibility spell for 1 minute instead.',
    },
    'mirroring-face': {
      id: 'mirroring-face',
      name: 'Mirroring Face',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: 'Indefinite',
      description: 'Your body morphs into a humanoid that is not more than one size larger or smaller than you. You may choose your appearance, but if morphing into someone you have seen in the last day you perfectly mimic their appearance and voice (insight check to see through). Can last indefinitely, but you are automatically recognised if you use another mutation.',
      bioshock: 'You may morph into a humanoid up to 2 sizes larger or smaller, and others cannot make the insight check to notice who you truly are.',
    },
    'echoing-membrane': {
      id: 'echoing-membrane',
      name: 'Echoing Membrane',
      prerequisite: null,
      evolutionLocked: null,
      activation: 'bonus action',
      duration: '5 turns',
      description: 'A thin membrane forms around your neck, amplifying your voice to be heard up to 40ft. Creatures within 5ft who hear your voice take 1d4 thunder damage.',
      bioshock: 'Your voice can be heard up to 70ft. Creatures within 10ft who hear your voice take 1d6 thunder damage instead.',
    },
    'bone-eruption': {
      id: 'bone-eruption',
      name: 'Bone Eruption',
      prerequisite: 'Level 3',
      evolutionLocked: null,
      activation: 'action',
      duration: 'Instantaneous',
      description: 'Spikes of bone erupt from your body in a 5ft radius. All creatures in range must make a Dexterity saving throw (DC 8 + proficiency + Constitution modifier). On a fail they take 1d10 + Constitution modifier piercing damage. On a save they take half.',
      bioshock: 'No save required. All creatures in range automatically take 1d10 + Constitution modifier piercing damage.',
    },
    'serrated-maw': {
      id: 'serrated-maw',
      name: 'Serrated Maw',
      prerequisite: 'Level 3',
      evolutionLocked: null,
      activation: 'action',
      duration: '3 turns',
      description: 'A monstrous mouth opens on your body. As a bonus action the maw can lash out at a creature within 10ft to grapple it. A grappled creature takes 1d4 slashing damage every turn while grappled.',
      bioshock: 'The tongue can reach 15ft. Grappled creatures take 1d6 slashing damage every turn while grappled and the mutation lasts for 5 turns.',
    },
    'rib-maelstrom': {
      id: 'rib-maelstrom',
      name: 'Rib Maelstrom',
      prerequisite: 'Level 3',
      evolutionLocked: null,
      activation: 'action',
      duration: '3 turns',
      description: 'Your ribs enlarge and burst from your chest spinning wildly in a 5ft radius. All creatures in the radius must make a Dexterity saving throw (DC 8 + proficiency + Constitution modifier). On a fail they take 1d6 + Constitution modifier bludgeoning damage; on a success they take half.',
      bioshock: 'No save required. All creatures in the range take 1d6 + Constitution modifier bludgeoning damage and the mutation lasts for 5 turns.',
    },
    'metabolic-overdrive': {
      id: 'metabolic-overdrive',
      name: 'Metabolic Overdrive',
      prerequisite: 'Level 9',
      evolutionLocked: null,
      activation: 'reaction (on initiative roll)',
      duration: 'Instantaneous',
      description: 'Your metabolism jumps to unprecedented speeds. You gain an additional action on your first turn of combat. You can only use this action to Dash, Dodge, or use the Help action. This mutation is instantaneous.',
      bioshock: 'You can use the additional action to take the Attack action, but you can only make a single attack.',
    },
    'sympathetic-sinew': {
      id: 'sympathetic-sinew',
      name: 'Sympathetic Sinew',
      prerequisite: 'Level 9',
      evolutionLocked: null,
      activation: 'reaction (ally takes damage within 30ft)',
      duration: 'Instantaneous',
      description: 'Fibrous tendrils briefly connect you to a nearby ally. You both take half the damage they would have taken (rounded down), and they take the other half. If this damage would reduce you to 0 hit points, this mutation fails and has no effect.',
      bioshock: 'The ally takes no damage and you still take half the damage they would have taken (rounded down).',
    },
    'adrenaline-surge': {
      id: 'adrenaline-surge',
      name: 'Adrenaline Surge',
      prerequisite: 'Level 14',
      evolutionLocked: null,
      activation: 'reaction (fall below half HP)',
      duration: 'Instantaneous',
      description: 'Adrenaline floods your body. You regain 1d6 + Constitution modifier hit points and may immediately take an action (Attack action limited to a single attack). Instantaneous and dissipates after its effects conclude. Once per combat encounter.',
      bioshock: 'You regain 1d10 + Constitution modifier hit points and can make 2 attacks if you take the Attack action.',
    },
    'permeable-membrane': {
      id: 'permeable-membrane',
      name: 'Permeable Membrane',
      prerequisite: 'Level 14',
      evolutionLocked: null,
      activation: 'reaction (hit by ranged attack)',
      duration: 'Instantaneous',
      description: 'A thin permeable membrane forms on your body causing the ranged attack to pass through. You take half the damage you would have taken from the attack. Instantaneous, dissipates once effects are over, cannot be activated when hit by a critical attack.',
      bioshock: 'You redirect the attack at another creature, preserving the attack and damage rolls of the original attack instead.',
    },
  },

  // ── Evolution-locked mutations ──────────────────────────────────────────────
  // Predator
  predatorMutations: {
    'slit-gills': {
      id: 'slit-gills',
      name: 'Slit Gills',
      prerequisite: 'Level 6, Predator Evolution',
      activation: 'bonus action',
      duration: '1 minute',
      description: 'Slits open on your neck and form gills as well as your fingers and toes growing with flesh connecting them, creating webbed limbs. You gain a swim speed of 25ft and can breathe underwater.',
      bioshock: 'You gain a swim speed of 40ft and can also move underwater as if it were normal terrain.',
    },
    'flesh-wings': {
      id: 'flesh-wings',
      name: 'Flesh Wings',
      prerequisite: 'Level 6, Predator Evolution',
      activation: 'bonus action',
      duration: '1 minute',
      description: 'Large leathery wings burst from your back. You gain a fly speed of 10ft and can use a bonus action to make creatures within a 5ft cone make a Strength saving throw (DC 8 + proficiency + Constitution modifier). On a fail they are pushed back 5ft.',
      bioshock: 'You gain a fly speed of 20ft and the cone range increases to 10ft.',
    },
    'feral-claws': {
      id: 'feral-claws',
      name: 'Feral Claws',
      prerequisite: 'Level 6, Predator Evolution',
      activation: 'bonus action',
      duration: '1 minute',
      description: 'Muscle extends out of your hands forming long bone claws. You gain a burrowing speed of 10ft and can make an attack with the claws when you take the attack action. Claws have a to-hit bonus equal to proficiency + Strength or Dexterity modifier (whichever is higher), dealing 1d12 + Constitution modifier slashing damage.',
      bioshock: 'You gain a burrowing speed of 20ft and can add your proficiency bonus to the attack roll twice.',
    },
    'spinal-tail': {
      id: 'spinal-tail',
      name: 'Spinal Tail',
      prerequisite: 'Level 6, Predator Evolution',
      activation: 'bonus action',
      duration: '1 minute',
      description: 'Your spine elongates and bursts from your back in a long tipped tail. You gain a climbing speed of 25ft and can make an attack against a creature within 5ft (to-hit bonus equal to proficiency, dealing 1d4 + Constitution modifier piercing damage).',
      bioshock: 'You gain a climbing speed of 40ft and the tail deals 1d6 + Constitution modifier piercing damage instead.',
    },
  },

  // Arcanist
  arcanistMutations: {
    'runic-marrow': {
      id: 'runic-marrow',
      name: 'Runic Marrow',
      prerequisite: 'Level 6, Arcanist Evolution',
      activation: 'reaction (hit by a spell)',
      duration: '1 round (3 rounds bioshocked)',
      description: 'Runes etch into your bones and glow brightly. You gain resistance to the damage type dealt or condition applied by the spell for 1 round.',
      bioshock: 'The mutation lasts for 3 rounds instead.',
    },
    'redirecting-carapace': {
      id: 'redirecting-carapace',
      name: 'Redirecting Carapace',
      prerequisite: 'Level 6, Arcanist Evolution',
      activation: 'bonus action',
      duration: '3 rounds (5 rounds bioshocked)',
      description: 'Your skin hardens into a shimmering exoskeleton. You gain resistance to force damage and whenever you succeed on a saving throw against a spell you do not take damage if it would have dealt damage, as well as using up to 10ft of your movement to teleport.',
      bioshock: 'You do not use your own movement to carry out the teleport and the mutation lasts for 5 rounds.',
    },
    'thaumic-tumors': {
      id: 'thaumic-tumors',
      name: 'Thaumic Tumors',
      prerequisite: 'Level 6, Arcanist Evolution',
      activation: 'bonus action',
      duration: '3 turns (5 turns bioshocked)',
      description: 'Large purple tumors sprout along your body. When a creature within 5ft casts a spell, a tumor ruptures and the caster must make a Constitution saving throw (DC 8 + proficiency + Constitution modifier). On a fail they take 1d6 necrotic damage.',
      bioshock: 'The range increases to 10ft. A failed save yields 1d8 necrotic damage and the mutation lasts for 5 turns.',
    },
    'internal-terror': {
      id: 'internal-terror',
      name: 'Internal Terror',
      prerequisite: 'Level 6, Ghoul Evolution',
      activation: 'action',
      duration: '1 round (3 rounds bioshocked)',
      description: 'The neurons in your brain show you visions of your greatest fear and your muscles contract and tighten rigidly. You are frightened and stunned for 1 round.',
      bioshock: 'This mutation lasts for 3 rounds instead.',
    },
  },

  // Ghoul
  ghoulMutations: {
    'flesh-rot': {
      id: 'flesh-rot',
      name: 'Flesh Rot',
      prerequisite: 'Level 6, Ghoul Evolution',
      activation: 'action',
      duration: '3 rounds (5 rounds bioshocked)',
      description: 'Your flesh begins decaying and falling from your bone. You gain disadvantage on all Charisma checks and vulnerability to all physical damage.',
      bioshock: 'Your movement speed is decreased by 5ft and the mutation lasts for 5 rounds.',
    },
    'cyst-burst': {
      id: 'cyst-burst',
      name: 'Cyst Burst',
      prerequisite: 'Level 6, Ghoul Evolution',
      activation: 'bonus action',
      duration: 'Instantaneous',
      description: 'Large putrid cysts bubble along your body then burst. You take 6d4 necrotic damage and cannot regain hit points until the end of your next turn.',
      bioshock: 'You take 8d4 necrotic damage instead.',
    },
  },
};

// ── Helper functions ──────────────────────────────────────────────────────────

export function getMutatorProgression(level) {
  return MUTATOR.progression.find(p => p.level === level);
}

export function getMutatorUnlockedFeatures(level, evolutionId) {
  const base = Object.values(MUTATOR.features).filter(f => f.level <= level);
  const evoFeatures = evolutionId && level >= 3
    ? Object.values(MUTATOR.evolutions[evolutionId]?.features || {}).filter(f => f.level <= level)
    : [];
  return [...base, ...evoFeatures];
}

// Returns all mutations available to this character (base + evolution-locked if qualified)
export function getAvailableMutations(level, evolutionId) {
  const base = Object.values(MUTATOR.mutations).filter(m => {
    if (!m.prerequisite) return true;
    const lvlMatch = m.prerequisite.match(/Level (\d+)/);
    return lvlMatch ? level >= parseInt(lvlMatch[1]) : true;
  });

  const evoMutations = [];
  if (evolutionId === 'predator' && level >= 6) {
    evoMutations.push(...Object.values(MUTATOR.predatorMutations));
  }
  if (evolutionId === 'arcanist' && level >= 6) {
    evoMutations.push(...Object.values(MUTATOR.arcanistMutations));
  }
  if (evolutionId === 'ghoul' && level >= 6) {
    evoMutations.push(...Object.values(MUTATOR.ghoulMutations));
  }

  return [...base, ...evoMutations];
}

export function getMutatorSpellSlots(level, evolutionId) {
  if (evolutionId !== 'arcanist' || level < 3) return null;
  return MUTATOR.evolutions.arcanist.spellcasting.table.find(r => r.mutatorLevel === level) || null;
}

// Max active mutations at once
export function getMaxActiveMutations(level) {
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}

export default MUTATOR;
