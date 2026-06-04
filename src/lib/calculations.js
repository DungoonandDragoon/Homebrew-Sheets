import { getProgression } from './classes/outlaw.js';

export function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Get proficiency bonus for a given level (works for any class)
export function profBonus(level) {
  return Math.ceil(level / 4) + 1;
}

// Calculate all derived stats for an Outlaw character
export function deriveStats(character) {
  const {
    level, abilities, classId, archetypeId,
    skillProficiencies = [], expertises = [],
    saveProficiencies = [], equippedArmor, equippedShield,
    feats = [], speciesTraits = [], customBonuses = {},
  } = character;

  const prof = profBonus(level);
  const mods = {
    strength:     abilityMod(abilities.strength),
    dexterity:    abilityMod(abilities.dexterity),
    constitution: abilityMod(abilities.constitution),
    intelligence: abilityMod(abilities.intelligence),
    wisdom:       abilityMod(abilities.wisdom),
    charisma:     abilityMod(abilities.charisma),
  };

  // Aggregate feat/effect bonuses stored on data
  const featAcBonus       = character.featAcBonus       || 0;
  const featInitBonus     = character.featInitBonus     || 0;
  const featSpeedBonus    = character.featSpeedBonus    || 0;
  const damageResistances = character.damageResistances || [];
  const conditionImmunities = character.conditionImmunities || [];

  // Also fold in skill expertise granted by feats (in addition to class expertises)
  const allExpertises = [...(expertises || []), ...(character.featExpertise || [])];

  // Initiative: Outlaw adds Int mod (min +1) via Gunfighter's Instinct
  let initiativeBonus = mods.dexterity;
  if (classId === 'outlaw' && level >= 1) {
    const intBonus = Math.max(1, mods.intelligence);
    initiativeBonus = mods.dexterity + intBonus;
  }
  initiativeBonus += (customBonuses.initiative || 0) + featInitBonus;

  // AC calculation based on equipped armor
  let ac = 10 + mods.dexterity; // unarmored
  if (equippedArmor) {
    const armor = equippedArmor;
    if (armor.armorType === 'light') {
      ac = armor.baseAC + mods.dexterity;
    } else if (armor.armorType === 'medium') {
      ac = armor.baseAC + Math.min(2, mods.dexterity);
    } else if (armor.armorType === 'heavy') {
      ac = armor.baseAC;
    } else if (armor.armorType === 'natural') {
      ac = armor.baseAC + mods.dexterity;
    }
  }
  if (equippedShield) ac += 2;
  ac += (customBonuses.ac || 0) + featAcBonus;

  // Saving throws
  const saves = {};
  const allAbilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
  for (const ab of allAbilities) {
    const isProficient = saveProficiencies.includes(ab);
    saves[ab] = mods[ab] + (isProficient ? prof : 0) + (customBonuses[`save_${ab}`] || 0);
  }

  // Skills
  const SKILL_ABILITY = {
    acrobatics: 'dexterity', animalHandling: 'wisdom', arcana: 'intelligence',
    athletics: 'strength', deception: 'charisma', history: 'intelligence',
    insight: 'wisdom', intimidation: 'charisma', investigation: 'intelligence',
    medicine: 'wisdom', nature: 'intelligence', perception: 'wisdom',
    performance: 'charisma', persuasion: 'charisma', religion: 'intelligence',
    sleightOfHand: 'dexterity', stealth: 'dexterity', survival: 'wisdom',
  };
  const skills = {};
  for (const [skill, ability] of Object.entries(SKILL_ABILITY)) {
    const isProficient = skillProficiencies.includes(skill);
    const isExpert = allExpertises.includes(skill);
    const multiplier = isExpert ? 2 : isProficient ? 1 : 0;
    skills[skill] = mods[ability] + multiplier * prof + (customBonuses[`skill_${skill}`] || 0);
  }

  // Passive perception
  const passivePerception = 10 + skills.perception;

  // Spellcasting DC and attack bonus
  let spellSaveDC = null;
  let spellAttackBonus = null;
  if (classId === 'outlaw' && archetypeId === 'arcane-artillerist' && level >= 3) {
    spellSaveDC = 8 + prof + mods.intelligence;
    spellAttackBonus = prof + mods.intelligence;
  }

  // Trick Shot DC for Gunslinger
  let trickShotDC = null;
  if (classId === 'outlaw' && archetypeId === 'gunslinger' && level >= 3) {
    trickShotDC = 8 + prof + mods.dexterity;
  }

  // Called Shot DC
  let calledShotDC = null;
  if (classId === 'outlaw' && level >= 13) {
    calledShotDC = 8 + prof + mods.dexterity;
  }

  // Runic barrel / arcane overload save DC (Con-based for arcane artillerist)
  // Uses spell save DC (Int-based) — same as spellSaveDC
  // Suppressing fire DC (Dex-based) — same as trickShotDC formula
  const suppressingFireDC = 8 + prof + mods.dexterity;
  // Showstopper DC (Gunslinger level 15) — same as trickShotDC
  const showstopperDC = trickShotDC;

  // Mutator DCs — Constitution + proficiency based
  let mutationSaveDC = null;
  let mutatorSpellSaveDC = null;
  let mutatorSpellAttackBonus = null;
  if (classId === 'mutator') {
    mutationSaveDC = 8 + prof + mods.constitution;
    if (archetypeId === 'arcanist' && level >= 3) {
      mutatorSpellSaveDC      = 8 + prof + mods.intelligence;
      mutatorSpellAttackBonus = prof + mods.intelligence;
    }
  }

  // Nerve dice info
  let nerveDice = null;
  if (classId === 'outlaw' && level >= 2) {
    const row = getProgression(level);
    nerveDice = { max: row.nerveDiceCount, dieSize: row.nerveDieSize };
  }

  // Reckless fusillade uses for Desperado
  let recklessFusillade = null;
  if (classId === 'outlaw' && archetypeId === 'desperado' && level >= 3) {
    recklessFusillade = { max: prof };
  }

  // Speed — base 30, modified by feats
  const speed = 30 + featSpeedBonus + (customBonuses.speed || 0);

  return {
    prof, mods, initiativeBonus, ac, saves, skills,
    passivePerception, spellSaveDC, spellAttackBonus,
    trickShotDC, calledShotDC, suppressingFireDC, showstopperDC, nerveDice, recklessFusillade,
    speed, damageResistances, conditionImmunities,
    mutationSaveDC, mutatorSpellSaveDC, mutatorSpellAttackBonus,
  };
}

// Calculate attack roll and damage for a weapon
export function weaponAttack(weapon, character, derived) {
  const { mods, prof } = derived;
  const { abilities, level, classId, archetypeId } = character;

  let attackBonus = 0;
  let damageBonus = 0;
  let damageBonus2 = null; // for two-ability damage (Calculated Eye)

  if (weapon.weaponType === 'firearm' || weapon.weaponType === 'ranged') {
    attackBonus = mods.dexterity + prof;
    damageBonus = mods.dexterity;
  } else if (weapon.finesse) {
    const best = Math.max(mods.strength, mods.dexterity);
    attackBonus = best + prof;
    damageBonus = best;
  } else if (weapon.ranged) {
    attackBonus = mods.dexterity + prof;
    damageBonus = mods.dexterity;
  } else {
    attackBonus = mods.strength + prof;
    damageBonus = mods.strength;
  }

  // Mutated Strike: add prof to attack twice (Mutator level 7+)
  if (classId === 'mutator' && level >= 7 && weapon.mutated) {
    attackBonus += prof;
    damageBonus += mods.constitution;
  }

  // Calculated Eye (Outlaw 6+): can use Int for damage on firearms
  if (classId === 'outlaw' && level >= 6 && weapon.weaponType === 'firearm') {
    damageBonus2 = mods.intelligence; // alternate shown as tooltip
  }

  // Custom attack bonus from feats/items
  attackBonus += (weapon.attackBonus || 0);
  damageBonus += (weapon.damageBonus || 0);

  return { attackBonus, damageBonus, damageBonus2 };
}

// Steady Hands misfire reduction
export function getMisfireScore(weapon, character) {
  if (!weapon.misfireScore) return null;
  let score = weapon.misfireScore;
  if (character.classId === 'outlaw' && character.level >= 9) score = Math.max(1, score - 1);
  return score;
}

// Max HP calculation
export function maxHP(character) {
  const { level, abilities, hitDieOverride, manualHP, classHitDie } = character;
  if (manualHP) return manualHP;
  const hitDie = hitDieOverride || classHitDie || 10; // default d10
  const conMod = abilityMod(abilities.constitution);
  // First level: max + con mod. Each subsequent: average (round up) + con mod
  const avg = Math.ceil(hitDie / 2) + 1;
  return (hitDie + conMod) + (level - 1) * (avg + conMod);
}

// Short rest nerve dice recovery
export function shortRestNerveDiceRecovery(character) {
  const { level, classId } = character;
  if (classId !== 'outlaw') return 0;
  if (level >= 14) return 2; // Nerve Recovery
  if (level >= 20) return 999; // The Legend: all
  return 0;
}

export const SKILL_LABELS = {
  acrobatics: 'Acrobatics', animalHandling: 'Animal handling',
  arcana: 'Arcana', athletics: 'Athletics', deception: 'Deception',
  history: 'History', insight: 'Insight', intimidation: 'Intimidation',
  investigation: 'Investigation', medicine: 'Medicine', nature: 'Nature',
  perception: 'Perception', performance: 'Performance', persuasion: 'Persuasion',
  religion: 'Religion', sleightOfHand: 'Sleight of hand', stealth: 'Stealth',
  survival: 'Survival',
};

export const SKILL_ABILITY_LABELS = {
  acrobatics: 'Dex', animalHandling: 'Wis', arcana: 'Int',
  athletics: 'Str', deception: 'Cha', history: 'Int',
  insight: 'Wis', intimidation: 'Cha', investigation: 'Int',
  medicine: 'Wis', nature: 'Int', perception: 'Wis',
  performance: 'Cha', persuasion: 'Cha', religion: 'Int',
  sleightOfHand: 'Dex', stealth: 'Dex', survival: 'Wis',
};

export const ABILITY_LABELS = {
  strength: 'Strength', dexterity: 'Dexterity', constitution: 'Constitution',
  intelligence: 'Intelligence', wisdom: 'Wisdom', charisma: 'Charisma',
};

export const CONDITIONS = [
  'Blinded','Charmed','Deafened','Exhaustion','Frightened',
  'Grappled','Incapacitated','Invisible','Paralyzed','Petrified',
  'Poisoned','Prone','Restrained','Stunned','Unconscious',
];
