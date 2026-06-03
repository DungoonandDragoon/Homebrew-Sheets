import { getCharacter, saveCharacter, getAllHomebrew } from '../lib/db.js';
import { deriveStats, maxHP, getMisfireScore, weaponAttack, shortRestNerveDiceRecovery,
         SKILL_LABELS, SKILL_ABILITY_LABELS, ABILITY_LABELS, CONDITIONS, formatMod } from '../lib/calculations.js';
import { OUTLAW, getProgression, getUnlockedFeatures, getNerveDice } from '../lib/classes/outlaw.js';
import { WIZARD_SPELLS } from '../lib/spells.js';
import { sendRollToDnDBeyond, rollDie, rollDice } from '../app.js';

let char = null;       // raw DB record
let data = null;       // char.data shorthand
let derived = null;    // computed stats
let homebrew = [];
let activeTab = 'core';
let saveTimer = null;
let userId = null;
let isDM = false;

function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveCharacter({ ...char, data }, userId);
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }, 1500);
}

function mutate(fn) {
  fn();
  derived = deriveStats(buildCharacterForCalc());
  scheduleAutoSave();
  renderSheetUI();}

function buildCharacterForCalc() {
  const inv = data.inventory || [];
  const armorItem = inv.find(i => i.id === data.equippedArmorId);
  const shieldItem = inv.find(i => i.id === data.equippedShieldId);
  return {
    level: char.level,
    abilities: data.abilities,
    classId: char.class_id,
    archetypeId: data.archetypeId,
    skillProficiencies: data.skillProficiencies || [],
    expertises: data.expertises || [],
    saveProficiencies: data.saveProficiencies || [],
    equippedArmor: armorItem || null,
    equippedShield: shieldItem || null,
    feats: data.feats || [],
    speciesTraits: data.speciesTraits || [],
    customBonuses: data.customBonuses || {},
  };
}

export async function renderSheet(container, characterId, uid, dm, navigate) {
  userId = uid;
  isDM = dm;

  container.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:3rem;">Loading character…</div>`;
  try {
    char = await getCharacter(characterId);
    data = char.data || {};
    homebrew = await getAllHomebrew();
    derived = deriveStats(buildCharacterForCalc());
  } catch (e) {
    container.innerHTML = `<div class="card"><p style="color:var(--red)">Error loading character: ${e.message}</p></div>`;
    return;
  }

  // Set nerve dice max on data for DM view
  if (char.level >= 2) {
    const nd = getNerveDice(char.level);
    data.nerveDiceMax = nd.count;
    if (data.nerveDiceCurrent === undefined) data.nerveDiceCurrent = nd.count;
  }

  renderSheetUI();
}

function renderSheetUI() {
  const container = document.getElementById('page-content');
  if (!container) return;

  const mhp = data.maxHPOverride || maxHP({ level: char.level, abilities: data.abilities, classId: char.class_id });
  const hp = data.currentHP ?? mhp;
  const hpPct = Math.max(0, Math.min(100, Math.round(hp / mhp * 100)));
  const hpClass = hpPct > 50 ? '' : hpPct > 25 ? ' low' : ' critical';
  const prog = getProgression(char.level);
  const archObj = data.archetypeId ? OUTLAW.archetypes[data.archetypeId] : null;

  const tabs = [
    { id:'core',     label:'Core' },
    { id:'combat',   label:'Combat & Rolls' },
    { id:'nerve',    label:'Nerve Dice' },
    { id:'features', label:'Features' },
    { id:'inventory',label:'Inventory' },
    ...(data.archetypeId === 'arcane-artillerist' ? [{ id:'spells', label:'Spells' }] : []),
    ...(data.archetypeId === 'gunslinger' && char.level >= 3 ? [{ id:'trickshots', label:'Trick Shots' }] : []),
    { id:'notes',    label:'Notes' },
    ...(isDM ? [{ id:'admin', label:'Admin (DM)' }] : []),
  ];

  container.innerHTML = `
    <!-- Header -->
    <div class="sheet-header">
      <div class="sheet-title-block">
        <div class="sheet-char-name">${char.name}</div>
        <div class="sheet-char-meta">Level ${char.level} ${char.class_id.charAt(0).toUpperCase()+char.class_id.slice(1)}${archObj ? ' · ' + archObj.name : ''} · ${data.speciesId || 'Unknown species'}</div>
        <div class="sheet-badges">
          <span class="badge">Prof +${derived.prof}</span>
          <span class="badge">Initiative ${formatMod(derived.initiativeBonus)}</span>
          <span class="badge">AC ${derived.ac}</span>
          ${derived.trickShotDC ? `<span class="badge badge-gold">Trick Shot DC ${derived.trickShotDC}</span>` : ''}
          ${derived.spellSaveDC ? `<span class="badge badge-gold">Spell DC ${derived.spellSaveDC}</span>` : ''}
        </div>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:flex-start;">
        ${!isDM ? `<button class="btn btn-sm" id="level-up-btn">Level up</button>` : ''}
        <button class="btn btn-sm btn-gold" id="save-btn">Save</button>
      </div>
    </div>

    <!-- HP banner -->
    <div class="card" style="margin-bottom:1rem;">
      <div style="display:flex; gap:1.5rem; align-items:flex-start; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <div class="card-title">Hit points</div>
          <div class="hp-display">
            <div class="hp-current">${hp}</div>
            <div class="hp-separator">/</div>
            <div class="hp-max">${mhp}</div>
            <div class="hp-temp">Temp: <strong>${data.tempHP || 0}</strong></div>
          </div>
          <div class="hp-bar"><div class="hp-bar-fill${hpClass}" style="width:${hpPct}%"></div></div>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn btn-sm" id="hp-dmg">Damage</button>
            <button class="btn btn-sm btn-gold" id="hp-heal">Heal</button>
            <button class="btn btn-sm" id="hp-temp">Set temp HP</button>
            <button class="btn btn-sm" id="hp-hitdie">Hit die (d${OUTLAW.hitDie || 10})</button>
          </div>
        </div>
        <div>
          <div class="card-title">Death saves</div>
          <div class="death-saves">
            <div class="ds-group">
              <label>Successes</label>
              <div class="ds-pips">
                ${[0,1,2].map(i => `<div class="ds-pip ${i < (data.deathSaves?.successes||0) ? 'success' : ''}" data-type="success" data-i="${i}"></div>`).join('')}
              </div>
            </div>
            <div class="ds-group">
              <label>Failures</label>
              <div class="ds-pips">
                ${[0,1,2].map(i => `<div class="ds-pip ${i < (data.deathSaves?.failures||0) ? 'fail' : ''}" data-type="fail" data-i="${i}"></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="card-title">Conditions</div>
          <div class="conditions">
            ${CONDITIONS.map(c => `<div class="condition-tag ${(data.conditions||[]).includes(c)?'active':''}" data-condition="${c}">${c}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      ${tabs.map(t => `<div class="tab ${activeTab===t.id?'active':''}" data-tab="${t.id}">${t.label}</div>`).join('')}
    </div>
    <div id="tab-content"></div>
  `;

  // Wire global buttons
  document.getElementById('save-btn')?.addEventListener('click', async () => {
    try {
      await saveCharacter({ ...char, data }, userId);
      showMsg('Saved!');
    } catch (e) { alert('Save failed: ' + e.message); }
  });

  document.getElementById('level-up-btn')?.addEventListener('click', () => showLevelUpModal());

  document.getElementById('hp-dmg')?.addEventListener('click', () => {
    const amt = parseInt(prompt('Damage amount?') || '0');
    if (!isNaN(amt) && amt > 0) mutate(() => {
      const temp = data.tempHP || 0;
      if (temp > 0) {
        // Drain temp HP first
        const tempUsed = Math.min(temp, amt);
        const remainder = amt - tempUsed;
        data.tempHP = temp - tempUsed;
        data.currentHP = Math.max(0, (data.currentHP ?? mhp) - remainder);
      } else {
        data.currentHP = Math.max(0, (data.currentHP ?? mhp) - amt);
      }
    });
  });
  document.getElementById('hp-heal')?.addEventListener('click', () => {
    const amt = parseInt(prompt('Heal amount?') || '0');
    if (!isNaN(amt) && amt > 0) mutate(() => { data.currentHP = Math.min(mhp, (data.currentHP ?? mhp) + amt); });
  });
  document.getElementById('hp-temp')?.addEventListener('click', () => {
    const amt = parseInt(prompt('Temp HP amount?') || '0');
    if (!isNaN(amt)) mutate(() => { data.tempHP = amt; });
  });
  document.getElementById('hp-hitdie')?.addEventListener('click', () => {
    const roll = rollDie(10) + derived.mods.constitution;
    const gained = Math.max(1, roll);
    mutate(() => { data.currentHP = Math.min(mhp, (data.currentHP ?? mhp) + gained); });
    sendRollToDnDBeyond('Hit die', gained, `1d10 + Con (${formatMod(derived.mods.constitution)})`, char.name);
  });

  // Death saves
  container.querySelectorAll('.ds-pip').forEach(pip => {
    pip.addEventListener('click', () => {
      mutate(() => {
        data.deathSaves = data.deathSaves || { successes: 0, failures: 0 };
        const type = pip.dataset.type;
        const i = parseInt(pip.dataset.i);
        if (type === 'success') data.deathSaves.successes = data.deathSaves.successes === i+1 ? i : i+1;
        else data.deathSaves.failures = data.deathSaves.failures === i+1 ? i : i+1;
      });
    });
  });

  // Conditions
  container.querySelectorAll('.condition-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      mutate(() => {
        data.conditions = data.conditions || [];
        const c = tag.dataset.condition;
        if (data.conditions.includes(c)) data.conditions = data.conditions.filter(x => x !== c);
        else data.conditions.push(c);
      });
    });
  });

  // Tabs
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => { activeTab = tab.dataset.tab; renderSheetUI(); });
  });

  // Render tab content
  const tc = document.getElementById('tab-content');
  if (activeTab === 'core') renderCoreTab(tc);
  else if (activeTab === 'combat') renderCombatTab(tc);
  else if (activeTab === 'nerve') renderNerveTab(tc);
  else if (activeTab === 'features') renderFeaturesTab(tc);
  else if (activeTab === 'inventory') renderInventoryTab(tc);
  else if (activeTab === 'spells') renderSpellsTab(tc);
  else if (activeTab === 'trickshots') renderTrickShotsTab(tc);
  else if (activeTab === 'notes') renderNotesTab(tc);
  else if (activeTab === 'admin') renderAdminTab(tc);
}

// ── CORE TAB ──────────────────────────────────────────────────────────────────
function renderCoreTab(tc) {
  tc.innerHTML = `
    <div class="grid-2" style="margin-bottom:1rem;">
      <div class="card">
        <div class="card-title">Ability scores</div>
        <div class="stat-grid">
          ${Object.entries(ABILITY_LABELS).map(([ab, label]) => `
            <div class="stat-box" style="cursor:pointer;" data-ab="${ab}" title="Roll ${label} check">
              <div class="stat-label">${label.substring(0,3)}</div>
              <div class="stat-mod">${formatMod(derived.mods[ab])}</div>
              <div class="stat-score">${data.abilities[ab]}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Saving throws</div>
        ${Object.entries(ABILITY_LABELS).map(([ab, label]) => {
          const isProficient = (data.saveProficiencies||[]).includes(ab);
          return `<div class="skill-row" data-roll="save" data-ab="${ab}">
            <div class="prof-pip ${isProficient?'proficient':''}"></div>
            <div class="skill-name">${label}</div>
            <div class="skill-mod">${formatMod(derived.saves[ab])}</div>
          </div>`;
        }).join('')}
        <div style="margin-top:0.75rem; font-size:0.8rem; color:var(--text-muted);">Passive Perception: ${derived.passivePerception}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Skills</div>
      <div class="skill-list">
        ${Object.entries(SKILL_LABELS).map(([key, label]) => {
          const isProficient = (data.skillProficiencies||[]).includes(key);
          const isExpert = (data.expertises||[]).includes(key);
          const ab = SKILL_ABILITY_LABELS[key];
          return `<div class="skill-row" data-roll="skill" data-skill="${key}">
            <div class="prof-pip ${isExpert?'expert':isProficient?'proficient':''}"></div>
            <div class="skill-name">${label}</div>
            <div class="skill-ability">${ab}</div>
            <div class="skill-mod">${formatMod(derived.skills[key])}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    ${renderFeatsCard()}
    ${renderProficienciesCard()}
  `;

  // Ability check rolls
  tc.querySelectorAll('.stat-box[data-ab]').forEach(box => {
    box.addEventListener('click', () => {
      const ab = box.dataset.ab;
      const roll = rollDie(20);
      const total = roll + derived.mods[ab];
      sendRollToDnDBeyond(`${ABILITY_LABELS[ab]} check`, total, `d20 (${roll}) ${formatMod(derived.mods[ab])}`, char.name);
    });
  });

  // Save rolls
  tc.querySelectorAll('[data-roll="save"]').forEach(row => {
    row.addEventListener('click', () => {
      const ab = row.dataset.ab;
      const roll = rollDie(20);
      const total = roll + derived.saves[ab];
      sendRollToDnDBeyond(`${ABILITY_LABELS[ab]} save`, total, `d20 (${roll}) ${formatMod(derived.saves[ab])}`, char.name);
    });
  });

  // Skill rolls
  tc.querySelectorAll('[data-roll="skill"]').forEach(row => {
    row.addEventListener('click', () => {
      const key = row.dataset.skill;
      const roll = rollDie(20);
      const total = roll + derived.skills[key];
      sendRollToDnDBeyond(`${SKILL_LABELS[key]}`, total, `d20 (${roll}) ${formatMod(derived.skills[key])}`, char.name);
    });
  });
}

function renderFeatsCard() {
  const feats = data.feats || [];
  if (feats.length === 0) return '';
  return `<div class="card" style="margin-top:1rem;">
    <div class="card-title">Feats & traits</div>
    ${feats.map(f => `
      <div class="feature-item">
        <div class="feature-name">${f.name}</div>
        <div class="feature-desc">${f.description || ''}</div>
      </div>
    `).join('')}
  </div>`;
}

function renderProficienciesCard() {
  const profs = data.proficiencies || {};
  const armor = profs.armor || 'Light armor, Medium armor, Shields';
  const weapons = profs.weapons || 'Simple weapons, Firearms, Hand crossbows, Shortswords';
  const tools = profs.tools || '—';
  const languages = ['Common', ...(data.chosenLanguages || [])].filter((v, i, a) => a.indexOf(v) === i);
  // Add species-granted fixed languages
  const speciesLanguages = {
    'elf': ['Elvish'], 'dwarf': ['Dwarvish'], 'halfling': ['Halfling'],
    'gnome': ['Gnomish'], 'half-orc': ['Orc'], 'tiefling': ['Infernal'],
    'dragonborn': ['Draconic'], 'half-elf': ['Elvish'],
  };
  const specLangs = speciesLanguages[data.speciesId] || [];
  const allLangs = [...new Set(['Common', ...specLangs, ...(data.chosenLanguages || [])])];

  return `<div class="card" style="margin-top:1rem;">
    <div class="card-title">Proficiencies</div>
    <div style="display:grid; gap:0.5rem; font-size:0.88rem;">
      <div><span style="color:var(--text-muted); font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.08em; text-transform:uppercase;">Armor</span><div style="color:var(--text); margin-top:0.2rem;">${armor}</div></div>
      <div><span style="color:var(--text-muted); font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.08em; text-transform:uppercase;">Weapons</span><div style="color:var(--text); margin-top:0.2rem;">${weapons}</div></div>
      <div><span style="color:var(--text-muted); font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.08em; text-transform:uppercase;">Tools</span><div style="color:var(--text); margin-top:0.2rem;">${tools}</div></div>
      <div><span style="color:var(--text-muted); font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.08em; text-transform:uppercase;">Languages</span><div style="color:var(--text); margin-top:0.2rem;">${allLangs.join(', ') || 'Common'}</div></div>
    </div>
  </div>`;
}

// ── COMBAT TAB ────────────────────────────────────────────────────────────────
function renderCombatTab(tc) {
  const inv = data.inventory || [];
  const equipped = inv.filter(i => i.equipped && (i.weaponType || i.damage));

  tc.innerHTML = `
    <div class="grid-2" style="margin-bottom:1rem;">
      <div class="combat-grid card" style="display:grid; grid-template-columns:repeat(4,1fr); gap:0.6rem;">
        <div class="combat-box"><div class="combat-val">${derived.ac}</div><div class="combat-label">Armor class</div></div>
        <div class="combat-box"><div class="combat-val">${formatMod(derived.initiativeBonus)}</div><div class="combat-label">Initiative</div></div>
        <div class="combat-box"><div class="combat-val">30ft</div><div class="combat-label">Speed</div></div>
        <div class="combat-box"><div class="combat-val">+${derived.prof}</div><div class="combat-label">Prof bonus</div></div>
      </div>
      <div class="card">
        <div class="card-title">Quick dice</div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          ${[4,6,8,10,12,20,100].map(d => `<button class="btn btn-sm quick-die" data-d="${d}">d${d}</button>`).join('')}
        </div>
        <button class="btn btn-sm" style="margin-top:0.5rem;" id="roll-init">Roll initiative</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div class="section-header">
        <div class="card-title" style="margin:0;">Attacks</div>
      </div>
      ${equipped.length === 0
        ? '<div style="color:var(--text-muted); font-size:0.9rem; padding:0.5rem 0;">No weapons equipped. Go to Inventory to equip weapons.</div>'
        : equipped.map(item => renderAttackRow(item)).join('')
      }
    </div>

    ${char.class_id === 'outlaw' && data.archetypeId === 'gunslinger' && char.level >= 3 ? renderTrickShotPanel() : ''}
    ${char.class_id === 'outlaw' && data.archetypeId === 'desperado' && char.level >= 3 ? renderDesperadoPanel() : ''}
    ${char.level >= 13 && char.class_id === 'outlaw' ? renderCalledShotPanel() : ''}
    ${data.archetypeId === 'arcane-artillerist' ? renderCombatSpellsPanel() : ''}
  `;

  tc.querySelectorAll('.quick-die').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = parseInt(btn.dataset.d);
      const roll = rollDie(d);
      sendRollToDnDBeyond(`d${d}`, roll, `d${d}`, char.name);
    });
  });

  document.getElementById('roll-init')?.addEventListener('click', () => {
    const roll = rollDie(20);
    const total = roll + derived.initiativeBonus;
    sendRollToDnDBeyond('Initiative', total, `d20 (${roll}) + ${derived.initiativeBonus}`, char.name);
  });

  tc.querySelectorAll('.attack-btn-hit').forEach(btn => {
    btn.addEventListener('click', () => {
      const bonus = parseInt(btn.dataset.bonus);
      const roll = rollDie(20);
      const total = roll + bonus;
      const isCrit = roll === 20;
      sendRollToDnDBeyond(`Attack${isCrit?' (CRIT!)':''}`, total, `d20 (${roll}) ${formatMod(bonus)}`, char.name);
    });
  });

  tc.querySelectorAll('.attack-btn-dmg').forEach(btn => {
    btn.addEventListener('click', () => {
      const formula = btn.dataset.formula;
      const bonus = parseInt(btn.dataset.bonus);
      const [count, sides] = formula.split('d').map(Number);
      const { total, rolls } = rollDice(count, sides);
      const finalTotal = total + bonus;
      sendRollToDnDBeyond('Damage', finalTotal, `${formula} (${rolls.join('+')}) ${formatMod(bonus)}`, char.name);
    });
  });

  // Trick shots
  tc.querySelectorAll('.trick-use').forEach(btn => {
    btn.addEventListener('click', () => {
      const cost = parseInt(btn.dataset.cost);
      const name = btn.dataset.name;
      if (cost > 0) {
        mutate(() => { data.nerveDiceCurrent = Math.max(0, (data.nerveDiceCurrent ?? 0) - cost); });
      }
      // Showmanship: if target fails save regain 1 ND — remind player
      showMsg(`${name} used! ${cost > 0 ? cost + ' Nerve ' + (cost === 1 ? 'Die' : 'Dice') + ' spent.' : 'Free (Signature).'} Roll to hit first, then declare.`);
    });
  });

  // Combat spell panel buttons
  tc.querySelectorAll('.spell-atk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const roll = rollDie(20);
      const total = roll + derived.spellAttackBonus;
      const isCrit = roll === 20;
      sendRollToDnDBeyond(`Spell attack${isCrit?' (CRIT!)':''}`, total, `d20 (${roll}) ${formatMod(derived.spellAttackBonus)}`, char.name);
    });
  });
  tc.querySelectorAll('.spell-dmg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const [count, sides] = btn.dataset.dice.split('d').map(Number);
      const { total, rolls } = rollDice(count, sides);
      sendRollToDnDBeyond('Spell damage', total, `${btn.dataset.dice} (${rolls.join('+')})`, char.name);
    });
  });
  tc.querySelectorAll('.spell-slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.level);
      const slotsRow = OUTLAW.archetypes['arcane-artillerist'].spellcasting.slots.find(r => r.level === char.level);
      const max = slotsRow?.[`s${level}`] || 0;
      mutate(() => {
        const used = (data.spellSlotsUsed || {})[level] || 0;
        data.spellSlotsUsed = { ...data.spellSlotsUsed, [level]: Math.min(max, used + 1) };
      });
      showMsg(`Level ${level} spell slot used.`);
    });
  });

  // Reckless fusillade
  document.getElementById('rf-use')?.addEventListener('click', () => {
    mutate(() => {
      data.recklessFusillade = data.recklessFusillade || { used: 0 };
      data.recklessFusillade.used = (data.recklessFusillade.used || 0) + 1;
      // Frontier Fortitude: gain temp HP equal to prof bonus on activation
      data.tempHP = (data.tempHP || 0) + derived.prof;
    });
    showMsg(`Reckless Fusillade active! All your attacks have advantage but so do attacks against you. Gained ${derived.prof} temp HP.`);
  });

  // Called shot
  tc.querySelectorAll('.called-shot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const effect = btn.dataset.effect;
      mutate(() => { data.nerveDiceCurrent = Math.max(0, (data.nerveDiceCurrent ?? 0) - 2); });
      showMsg(`Called Shot: ${effect}. Target makes Con save DC ${derived.calledShotDC}. 2 Nerve Dice spent.`);
    });
  });
}

function renderAttackRow(item) {
  const { attackBonus, damageBonus } = weaponAttack(item, buildCharacterForCalc(), derived);
  const misfire = getMisfireScore(item, buildCharacterForCalc());

  return `<div class="attack-row">
    <div>
      <div class="attack-name">${item.name}</div>
      <div class="attack-detail">${item.range ? `Range ${item.range}` : 'Melee'} · ${item.damage || '—'} ${item.damageType || ''}</div>
      ${misfire ? `<div class="attack-misfire">Misfire: ${misfire}+</div>` : ''}
    </div>
    <div class="attack-btns">
      <button class="btn btn-sm btn-gold attack-btn-hit" data-bonus="${attackBonus}">${formatMod(attackBonus)} to hit</button>
      <button class="btn btn-sm attack-btn-dmg" data-formula="${(item.damage||'1d4').split(' ')[0]}" data-bonus="${damageBonus}">
        ${item.damage || '1d4'} ${formatMod(damageBonus)}
      </button>
    </div>
  </div>`;
}

function renderCombatSpellsPanel() {
  const allSpells = WIZARD_SPELLS;
  const activeSpells = [
    ...(data.cantrips || []).map(id => allSpells.find(s => s.id === id)).filter(Boolean),
    ...(data.preparedSpells || []).map(id => allSpells.find(s => s.id === id)).filter(Boolean),
  ];
  // Only show spells that involve an attack roll or a saving throw
  const combatSpells = activeSpells.filter(s => {
    const d = s.description.toLowerCase();
    return d.includes('spell attack') || d.includes(' save') || d.includes('saving throw');
  });
  if (combatSpells.length === 0) return '';

  const slotsRow = OUTLAW.archetypes['arcane-artillerist'].spellcasting.slots.find(r => r.level === char.level);

  return `<div class="card" style="margin-bottom:1rem;">
    <div class="card-title">Spell attacks & saves · DC ${derived.spellSaveDC} · Atk ${formatMod(derived.spellAttackBonus)}</div>
    ${combatSpells.map(s => {
      const d = s.description.toLowerCase();
      const isAttack = d.includes('spell attack');
      const saveMatch = s.description.match(/\b(Str|Dex|Con|Int|Wis|Cha)\w* sav/i);
      const saveType = saveMatch ? saveMatch[0].replace(/sav.*/i, 'save').trim() : null;
      const dmgMatch = s.description.match(/\d+d\d+/);
      const dmgDice = dmgMatch ? dmgMatch[0] : null;
      const hasSlot = s.level > 0 && slotsRow && (slotsRow[`s${s.level}`] > 0);
      const slotUsed = s.level > 0 ? ((data.spellSlotsUsed || {})[s.level] || 0) >= (slotsRow?.[`s${s.level}`] || 0) : false;
      return `<div class="attack-row">
        <div>
          <div class="attack-name">${s.name} ${s.concentration ? '<span style="font-size:0.7rem;color:var(--blue);">Conc</span>' : ''}</div>
          <div class="attack-detail">${s.castTime} · ${s.range}${s.level > 0 ? ' · Level ' + s.level + ' slot' : ' · Cantrip'}</div>
          <div class="attack-detail" style="color:var(--text-dim); font-size:0.8rem;">${isAttack ? 'Spell attack roll' : saveType ? saveType + ' DC ' + derived.spellSaveDC : 'See description'}</div>
        </div>
        <div class="attack-btns">
          ${isAttack ? `<button class="btn btn-sm btn-gold spell-atk-btn" data-id="${s.id}" ${slotUsed?'disabled':''}>${formatMod(derived.spellAttackBonus)} to hit</button>` : ''}
          ${saveType ? `<span class="badge badge-gold" style="align-self:center;">DC ${derived.spellSaveDC} ${saveType}</span>` : ''}
          ${dmgDice ? `<button class="btn btn-sm spell-dmg-btn" data-dice="${dmgDice}" data-id="${s.id}" ${slotUsed?'disabled':''}>${dmgDice}</button>` : ''}
          ${s.level > 0 ? `<button class="btn btn-sm spell-slot-btn" data-level="${s.level}" ${slotUsed?'disabled':''}>Use slot</button>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderTrickShotPanel() {
  const known = data.selectedTrickShots || [];
  const sig = data.signatureMove;
  const options = OUTLAW.archetypes.gunslinger.trickShots.options.filter(s => known.includes(s.id));
  const nd = data.nerveDiceCurrent || 0;

  return `<div class="card" style="margin-bottom:1rem;">
    <div class="card-title">Trick shots · DC ${derived.trickShotDC}</div>
    ${options.map(s => {
      const isSig = s.id === sig;
      const cost = isSig ? Math.max(0, s.cost - 1) : s.cost;
      return `<div class="nerve-action">
        <div class="nerve-action-info">
          <div class="nerve-action-name">${s.name} ${isSig ? '<span style="font-size:0.72rem; color:var(--green); font-family:var(--font-display);">SIGNATURE</span>' : ''}</div>
          <div class="nerve-action-meta">${s.description}</div>
        </div>
        ${cost > 0 ? `<div class="nerve-cost">${cost} die</div>` : '<div class="nerve-cost" style="background:var(--green-dim); color:var(--green); border-color:var(--green);">Free 1/turn</div>'}
        <button class="btn btn-sm trick-use" data-cost="${cost}" data-name="${s.name}"
          ${nd < cost ? 'disabled' : ''}>Use</button>
      </div>`;
    }).join('')}
    ${sig ? '' : `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem;">Signature move unlocks at level 7. Set it in Features tab.</div>`}
  </div>`;
}

function renderDesperadoPanel() {
  const rf = data.recklessFusillade || { used: 0 };
  const max = derived.prof;
  return `<div class="card" style="margin-bottom:1rem;">
    <div class="card-title">Desperado</div>
    <div class="nerve-action">
      <div class="nerve-action-info">
        <div class="nerve-action-name">Reckless fusillade</div>
        <div class="nerve-action-meta">Attacks this turn have advantage, but so do attacks against you. Gain bonus temp HP equal to prof bonus.</div>
      </div>
      <div class="nerve-cost">${rf.used}/${max} used</div>
      <button class="btn btn-sm ${rf.used >= max ? '' : 'btn-gold'}" id="rf-use" ${rf.used >= max ? 'disabled' : ''}>Activate</button>
    </div>
  </div>`;
}

function renderCalledShotPanel() {
  const nd = data.nerveDiceCurrent || 0;
  return `<div class="card">
    <div class="card-title">Called shot · DC ${derived.calledShotDC}</div>
    <div style="font-size:0.9rem; color:var(--text-dim); margin-bottom:0.75rem;">On a hit, expend 2 Nerve Dice. Target makes Constitution save or suffers one effect of your choice.</div>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      ${['Hamstring (speed halved)','Shell-Shocked (disadv attacks, no reactions)','Disarm (drop held item)'].map(e => `
        <button class="btn btn-sm called-shot-btn" ${nd < 2 ? 'disabled' : ''} data-effect="${e}">${e.split(' ')[0]}</button>
      `).join('')}
    </div>
    ${nd < 2 ? '<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">Requires 2 Nerve Dice.</div>' : ''}
  </div>`;
}

// ── NERVE TAB ────────────────────────────────────────────────────────────────
function renderNerveTab(tc) {
  if (char.level < 2) {
    tc.innerHTML = `<div class="card"><div class="card-title">Nerve dice</div><p style="color:var(--text-dim);">Nerve Dice unlock at level 2.</p></div>`;
    return;
  }
  const nd = getNerveDice(char.level);
  const current = data.nerveDiceCurrent ?? nd.count;

  tc.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <div class="section-header">
        <div class="card-title" style="margin:0;">Nerve dice · d${nd.dieSize} · ${current} / ${nd.count} remaining</div>
        <button class="btn btn-sm" id="nd-regain-kill">Regain 1 (kill)</button>
      </div>
      <div class="nerve-pool" id="nerve-pool">
        ${Array.from({length: nd.count}, (_, i) => `
          <div class="nerve-die ${i >= current ? 'spent' : ''}" data-i="${i}">
            ${i < current ? `d${nd.dieSize}` : '·'}
          </div>
        `).join('')}
      </div>
      <div class="rest-row">
        <button class="btn" id="short-rest">☽ Short rest</button>
        <button class="btn btn-gold" id="long-rest">⚡ Long rest</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Spend nerve dice</div>
      ${(() => {
        const baseOptions = OUTLAW.nerveDiceOptions.filter(o => char.level >= o.levelRequired);
        const archOptions = (data.archetypeId && OUTLAW.archetypes[data.archetypeId]?.nerveDiceOptions || [])
          .filter(o => char.level >= o.levelRequired);
        return [...baseOptions, ...archOptions].map(o => {
            const suppDC = 8 + derived.prof + derived.mods.dexterity;
            let desc = o.description
              .replace('DC = 8 + proficiency + Dex mod', `DC ${suppDC}`)
              .replace('DC = 8 + proficiency bonus + Dex mod', `DC ${suppDC}`);
            return `
              <div class="nerve-action">
                <div class="nerve-action-info">
                  <div class="nerve-action-name">${o.name}</div>
                  <div class="nerve-action-meta">${o.action} · ${desc}</div>
                </div>
                <div class="nerve-cost">${o.cost} die</div>
                <button class="btn btn-sm nd-spend ${current < o.cost ? '' : 'btn-gold'}"
                  data-cost="${o.cost}" data-name="${o.name}" ${current < o.cost ? 'disabled' : ''}>Use</button>
              </div>
            `;
          }).join('');
      })()}
    </div>
  `;

  tc.querySelectorAll('.nerve-die:not(.spent)').forEach(die => {
    die.addEventListener('click', () => {
      mutate(() => { data.nerveDiceCurrent = Math.max(0, (data.nerveDiceCurrent ?? nd.count) - 1); });
    });
  });

  document.getElementById('nd-regain-kill')?.addEventListener('click', () => {
    mutate(() => { data.nerveDiceCurrent = Math.min(nd.count, (data.nerveDiceCurrent ?? 0) + 1); });
  });

  document.getElementById('short-rest')?.addEventListener('click', () => {
    const recovery = shortRestNerveDiceRecovery({ level: char.level, classId: char.class_id });
    mutate(() => { data.nerveDiceCurrent = Math.min(nd.count, (data.nerveDiceCurrent ?? 0) + recovery); });
    showMsg(recovery > 0 ? `Short rest: recovered ${recovery} Nerve Dice.` : 'Short rest complete. (Nerve Dice recover on long rest until level 14.)');
  });

  document.getElementById('long-rest')?.addEventListener('click', () => {
    mutate(() => {
      data.nerveDiceCurrent = nd.count;
      data.currentHP = data.maxHPOverride || maxHP({ level: char.level, abilities: data.abilities, classId: char.class_id });
      data.spellSlotsUsed = {};
      data.deathSaves = { successes: 0, failures: 0 };
      if (data.recklessFusillade) data.recklessFusillade.used = 0;
      if (data.legendaryDuel) data.legendaryDuel.used = false;
    });
    showMsg('Long rest complete. HP, Nerve Dice, and spell slots restored.');
  });

  tc.querySelectorAll('.nd-spend').forEach(btn => {
    btn.addEventListener('click', () => {
      const cost = parseInt(btn.dataset.cost);
      const name = btn.dataset.name;
      mutate(() => { data.nerveDiceCurrent = Math.max(0, (data.nerveDiceCurrent ?? 0) - cost); });
      // Roll all spent nerve dice and show result
      let totalRoll = 0;
      const rolls = [];
      for (let i = 0; i < cost; i++) {
        const r = rollDie(nd.dieSize);
        rolls.push(r);
        totalRoll += r;
      }
      const rollBreakdown = `${cost}d${nd.dieSize} (${rolls.join('+')})`;
      if (name === 'Graze') {
        const total = totalRoll + derived.mods.intelligence;
        sendRollToDnDBeyond('Graze (damage reduction)', total, `${rollBreakdown} + Int (${formatMod(derived.mods.intelligence)})`, char.name);
      } else {
        sendRollToDnDBeyond(`${name}`, totalRoll, rollBreakdown, char.name);
      }
    });
  });
}

// ── FEATURES TAB ──────────────────────────────────────────────────────────────
function renderFeaturesTab(tc) {
  // 1. Class features sorted by level
  const unlocked = getUnlockedFeatures(char.level, data.archetypeId)
    .sort((a, b) => a.level - b.level);

  // 2. Species traits from homebrew species data
  const speciesEntry = homebrew.find(h => h.type === 'species' && (`hb_${h.id}` === data.speciesId || h.id === data.speciesId));
  const speciesTraits = speciesEntry?.data?.effects?.filter(e => e.type === 'passive' || e.type === 'limited-use') || [];

  // 3. Feats taken (includes ASIs applied as feats)
  const feats = data.feats || [];

  let html = `<div class="card" style="margin-bottom:1rem;">
    <div class="card-title">Class features · Level ${char.level}</div>
    ${unlocked.length === 0 ? '<div style="color:var(--text-muted);">No features yet.</div>' : ''}
    ${unlocked.map(f => {
      // Inject live DCs into descriptions
      let desc = f.description;
      if (f.id === 'called-shot' || f.id === 'suppressing-fire') {
        desc = desc.replace(/DC = 8 \+ proficiency bonus \+ Dexterity modifier/g,
          `DC ${derived.calledShotDC || derived.trickShotDC || (8 + derived.prof + derived.mods.dexterity)}`);
        desc = desc.replace(/DC = 8 \+ proficiency \+ Dex mod/g,
          `DC ${8 + derived.prof + derived.mods.dexterity}`);
      }
      if (f.id === 'showstopper') {
        desc = desc.replace(/DC = Trick Shot DC/g, `DC ${derived.trickShotDC}`);
        desc = desc.replace(/Trick Shot DC\)/g, `Trick Shot DC ${derived.trickShotDC})`);
      }
      if (f.id === 'runic-barrel') {
        desc = desc.replace(/Con save/g, `Con save (DC ${derived.spellSaveDC})`);
      }
      if (f.id === 'arcane-overload') {
        desc = desc.replace(/Con save/g, `Con save (DC ${derived.spellSaveDC})`);
        desc = desc.replace(/Str save/g, `Str save (DC ${derived.spellSaveDC})`);
      }
      if (f.id === 'unbreakable') {
        desc = desc.replace(/spend 2 Nerve Dice to succeed/g,
          `spend 2 Nerve Dice to succeed (auto-success)`);
      }
      return `
        <div class="feature-item">
          <div class="feature-name">
            ${f.name}
            <span class="feature-level">Level ${f.level}</span>
          </div>
          <div class="feature-desc">${desc}</div>
        </div>
      `;
    }).join('')}
  </div>`;

  // Species features
  if (speciesEntry || data.speciesId) {
    const builtinSpeciesTraits = getBuiltinSpeciesTraits(data.speciesId);
    const allTraits = [...builtinSpeciesTraits, ...speciesTraits];
    if (allTraits.length > 0) {
      html += `<div class="card" style="margin-bottom:1rem;">
        <div class="card-title">Species traits · ${speciesEntry?.name || data.speciesId || ''}</div>
        ${allTraits.map(t => `
          <div class="feature-item">
            <div class="feature-name">${t.name || t.abilityName || 'Trait'}</div>
            <div class="feature-desc">${t.description || ''}</div>
          </div>
        `).join('')}
      </div>`;
    }
  }

  // Feats and ASIs
  if (feats.length > 0) {
    html += `<div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Feats & ability score improvements</div>
      ${feats.map(f => {
        // Show ASI effect inline if it has stat-bonus effects
        const asiEffects = (f.effects || []).filter(e => e.type === 'stat-bonus');
        const asiText = asiEffects.map(e => `+${e.amount} ${e.ability}`).join(', ');
        return `<div class="feature-item">
          <div class="feature-name">${f.name}</div>
          ${asiText ? `<div style="font-size:0.85rem; color:var(--gold); margin-bottom:0.25rem;">${asiText}</div>` : ''}
          <div class="feature-desc">${f.description || ''}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // Note: Signature move and trick shot selection are managed in the Trick Shots tab.

  // Language choices for species with free language picks
  const LANGUAGES = ['Abyssal','Aquan','Auran','Celestial','Common','Deep Speech','Draconic',
    'Druidic','Dwarvish','Elvish','Giant','Gnomish','Goblin','Gnoll','Halfling',
    'Ignan','Infernal','Orc','Primordial','Sylvan','Terran','Thieves Cant','Undercommon'];

  // How many free language choices does this species get?
  const languageChoiceCounts = {
    'human': 1,
    'half-elf': 1,
  };
  const langChoiceCount = languageChoiceCounts[data.speciesId] || 0;
  // Also check homebrew species for language-choice effects
  const hbSpeciesEntry = homebrew.find(h => h.type === 'species' && (`hb_${h.id}` === data.speciesId || h.id === data.speciesId));
  // Collect all language-choice effects from homebrew species, including their pool restrictions
  const hbLangEffects = hbSpeciesEntry?.data?.effects?.filter(e => e.type === 'language-choice') || [];
  const hbLangChoices = hbLangEffects.reduce((sum, e) => sum + (parseInt(e.count) || 1), 0);
  const totalLangChoices = langChoiceCount + hbLangChoices;

  // Build the allowed language pool: union of all language-choice effect allowedChoices,
  // or the full list if any effect has no restriction
  const hbLangPools = hbLangEffects.map(e => e.allowedChoices?.length ? e.allowedChoices : null);
  const builtinLangPool = langChoiceCount > 0 ? null : undefined; // built-in (human/half-elf) = any
  const anyUnrestricted = builtinLangPool === null || hbLangPools.some(p => p === null);
  const effectiveLangPool = anyUnrestricted
    ? LANGUAGES  // at least one grant is unrestricted → show all
    : [...new Set(hbLangPools.flat())]; // all grants restricted → union of allowed

  const chosenLangs = data.chosenLanguages || [];

  if (totalLangChoices > 0) {
    html += `<div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Species languages (${chosenLangs.length} / ${totalLangChoices} chosen)</div>
      <p style="font-size:0.85rem; color:var(--text-dim); margin-bottom:0.75rem;">
        Your species grants you ${totalLangChoices} additional language${totalLangChoices > 1 ? 's' : ''} of your choice.
        ${!anyUnrestricted ? '<span style="color:var(--gold);">Restricted to the options below.</span>' : ''}
      </p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">
        ${effectiveLangPool.map(lang => {
          const isChosen = chosenLangs.includes(lang);
          const canPick = isChosen || chosenLangs.length < totalLangChoices;
          return `<label style="display:flex; gap:0.5rem; align-items:center; padding:0.35rem 0.5rem;
            border-radius:var(--radius); cursor:pointer;
            background:${isChosen ? 'var(--gold-glow)' : 'transparent'};">
            <input type="checkbox" class="lang-pick" value="${lang}"
              ${isChosen ? 'checked' : ''} ${!canPick ? 'disabled' : ''} />
            <span style="font-size:0.88rem;">${lang}</span>
          </label>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Rune tracker for Arcane Artillerist
  if (data.archetypeId === 'arcane-artillerist' && char.level >= 7) {
    const dc = derived.spellSaveDC;
    const lvl15 = char.level >= 15;
    const runeDescs = {
      'None':  'No rune inscribed.',
      'Flare': '+1d6 fire damage, bypasses fire resistance.' + (lvl15 ? ' Arcane Overload: Con save DC ' + dc + ' or blinded until end of next turn.' : ''),
      'Force': 'Bypasses physical resistance, pushes 5ft on hit.' + (lvl15 ? ' Arcane Overload: Str save DC ' + dc + ' or knocked prone and pushed 10ft.' : ''),
      'Storm': '+1d6 lightning damage. Con save DC ' + dc + ' or lose reaction until start of next turn.' + (lvl15 ? ' Arcane Overload: Con save DC ' + dc + ' or lose concentration and cannot cast concentration spells until end of next turn.' : ''),
      'Void':  'Deals necrotic instead of piercing. On crit: prevents HP regain until start of your next turn.' + (lvl15 ? ' Arcane Overload: Con save DC ' + dc + ' or gain one exhaustion level.' : ''),
    };
    const activeRune = data.runeActive || 'None';
    html += `<div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Runic barrel · Save DC ${derived.spellSaveDC}</div>
      <div class="form-group">
        <label>Active rune</label>
        <select class="form-select" id="rune-picker">
          ${['None','Flare','Force','Storm','Void'].map(r => `<option value="${r}" ${activeRune===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div style="font-size:0.85rem; color:var(--text-dim); margin-top:0.4rem;">${runeDescs[activeRune]}</div>
    </div>`;
  }

  // ALL upcoming features (no slice limit)
  const allBaseFeatures = Object.values(OUTLAW.features);
  const allArchFeatures = data.archetypeId
    ? Object.values(OUTLAW.archetypes[data.archetypeId]?.features || {})
    : [];
  const upcoming = [...allBaseFeatures, ...allArchFeatures]
    .filter(f => f.level > char.level)
    .sort((a, b) => a.level - b.level);

  if (upcoming.length > 0) {
    html += `<div class="card">
      <div class="card-title">Upcoming features</div>
      ${upcoming.map(f => `
        <div class="feature-item" style="opacity:0.45;">
          <div class="feature-name">${f.name} <span class="feature-level">Level ${f.level}</span></div>
          <div class="feature-desc">${f.description}</div>
        </div>
      `).join('')}
    </div>`;
  }

  tc.innerHTML = html;

  document.getElementById('rune-picker')?.addEventListener('change', e => {
    mutate(() => { data.runeActive = e.target.value; });
  });

  // Language choices
  tc.querySelectorAll('.lang-pick').forEach(cb => {
    cb.addEventListener('change', () => {
      const lang = cb.value;
      mutate(() => {
        const langs = [...(data.chosenLanguages || [])];
        if (cb.checked) {
          if (!langs.includes(lang)) langs.push(lang);
        } else {
          const idx = langs.indexOf(lang);
          if (idx > -1) langs.splice(idx, 1);
        }
        data.chosenLanguages = langs;
      });
    });
  });
}

function getBuiltinSpeciesTraits(speciesId) {
  const map = {
    'human':      [
      { name: 'Ability score increase', description: '+1 to all six ability scores.' },
      { name: 'Extra language', description: 'You can speak, read, and write one extra language of your choice.' },
    ],
    'elf':        [
      { name: 'Ability score increase', description: '+2 Dexterity.' },
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Keen senses', description: 'Proficiency in the Perception skill.' },
      { name: 'Fey ancestry', description: 'Advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { name: 'Trance', description: 'You don\'t need to sleep. Instead, you meditate deeply for 4 hours a day. After resting this way, you gain the same benefit as a human does from 8 hours of sleep.' },
    ],
    'dwarf':      [
      { name: 'Ability score increase', description: '+2 Constitution.' },
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Dwarven resilience', description: 'Advantage on saving throws against poison, and resistance to poison damage.' },
      { name: 'Dwarven combat training', description: 'Proficiency with the battleaxe, handaxe, light hammer, and warhammer.' },
      { name: 'Tool proficiency', description: 'Proficiency with one type of artisan\'s tools of your choice.' },
      { name: 'Stonecunning', description: 'Whenever you make a History check related to the origin of stonework, you are considered proficient and add double your proficiency bonus.' },
    ],
    'halfling':   [
      { name: 'Ability score increase', description: '+2 Dexterity.' },
      { name: 'Lucky', description: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.' },
      { name: 'Brave', description: 'Advantage on saving throws against being frightened.' },
      { name: 'Halfling nimbleness', description: 'You can move through the space of any creature that is of a size larger than yours.' },
    ],
    'gnome':      [
      { name: 'Ability score increase', description: '+2 Intelligence.' },
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Gnome cunning', description: 'Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.' },
    ],
    'half-orc':   [
      { name: 'Ability score increase', description: '+2 Strength, +1 Constitution.' },
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Menacing', description: 'Proficiency in the Intimidation skill.' },
      { name: 'Relentless endurance', description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. Once you use this trait, you can\'t do so again until you finish a long rest.' },
      { name: 'Savage attacks', description: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.' },
    ],
    'tiefling':   [
      { name: 'Ability score increase', description: '+2 Charisma, +1 Intelligence.' },
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Hellish resistance', description: 'Resistance to fire damage.' },
      { name: 'Infernal legacy', description: 'You know the Thaumaturgy cantrip. At 3rd level, you can cast Hellish Rebuke as a 2nd-level spell once per long rest. At 5th level, you can cast Darkness once per long rest. Charisma is your spellcasting ability for these spells.' },
    ],
    'dragonborn': [
      { name: 'Ability score increase', description: '+2 Strength, +1 Charisma.' },
      { name: 'Draconic ancestry', description: 'You have draconic ancestry. Choose one dragon type to determine your damage type and breath weapon shape.' },
      { name: 'Breath weapon', description: 'You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type. Constitution is the save DC (8 + Con mod + proficiency bonus). You can use your breath weapon once per short or long rest.' },
      { name: 'Damage resistance', description: 'Resistance to the damage type associated with your draconic ancestry.' },
    ],
    'half-elf':   [
      { name: 'Ability score increase', description: '+2 Charisma, and +1 to two other ability scores of your choice.' },
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.' },
      { name: 'Fey ancestry', description: 'Advantage on saving throws against being charmed, and magic can\'t put you to sleep.' },
      { name: 'Skill versatility', description: 'Proficiency in two skills of your choice.' },
    ],
  };
  return map[speciesId] || [];
}

// ── INVENTORY TAB ────────────────────────────────────────────────────────────
function renderInventoryTab(tc) {
  const inv = data.inventory || [];
  const hbItems = homebrew.filter(h => h.type === 'item');

  tc.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <div class="section-header">
        <div class="card-title" style="margin:0;">Inventory</div>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-sm" id="add-item-builtin">+ Add item</button>
          <button class="btn btn-sm" id="add-item-custom">+ Custom</button>
        </div>
      </div>
      ${inv.length === 0
        ? '<div style="color:var(--text-muted); font-size:0.9rem; padding:0.5rem 0;">No items. Add items using the buttons above.</div>'
        : inv.map(item => renderInvRow(item)).join('')
      }
      <div class="currency-row">
        <div class="currency-item">
          <div class="currency-val"><input type="number" class="form-input" id="cur-gp" value="${data.currency?.gp||0}" style="width:60px; text-align:center;" /></div>
          <div class="currency-label">GP</div>
        </div>
        <div class="currency-item">
          <div class="currency-val"><input type="number" class="form-input" id="cur-sp" value="${data.currency?.sp||0}" style="width:60px; text-align:center;" /></div>
          <div class="currency-label">SP</div>
        </div>
        <div class="currency-item">
          <div class="currency-val"><input type="number" class="form-input" id="cur-cp" value="${data.currency?.cp||0}" style="width:60px; text-align:center;" /></div>
          <div class="currency-label">CP</div>
        </div>
      </div>
    </div>
  `;

  // Currency
  ['gp','sp','cp'].forEach(c => {
    document.getElementById(`cur-${c}`)?.addEventListener('change', e => {
      mutate(() => { data.currency = { ...(data.currency||{}), [c]: parseInt(e.target.value)||0 }; });
    });
  });

  // Equip toggles
  tc.querySelectorAll('.equip-toggle').forEach(tog => {
    tog.addEventListener('click', e => {
      e.stopPropagation();
      const itemId = tog.dataset.id;
      const type = tog.dataset.type; // weapon, armor, shield
      mutate(() => {
        const item = data.inventory.find(i => i.id === itemId);
        if (!item) return;
        if (type === 'armor') {
          data.equippedArmorId = data.equippedArmorId === itemId ? null : itemId;
          data.inventory.forEach(i => { if (i.armorType) i.equipped = i.id === data.equippedArmorId; });
        } else if (type === 'shield') {
          data.equippedShieldId = data.equippedShieldId === itemId ? null : itemId;
          data.inventory.forEach(i => { if (i.isShield) i.equipped = i.id === data.equippedShieldId; });
        } else {
          item.equipped = !item.equipped;
        }
      });
    });
  });

  // Delete items
  tc.querySelectorAll('.inv-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm('Remove item?')) return;
      mutate(() => { data.inventory = data.inventory.filter(i => i.id !== btn.dataset.id); });
    });
  });

  // Quantity change
  tc.querySelectorAll('.inv-qty-input').forEach(input => {
    input.addEventListener('change', e => {
      const id = input.dataset.id;
      mutate(() => {
        const item = data.inventory.find(i => i.id === id);
        if (item) item.quantity = parseInt(e.target.value) || 1;
      });
    });
  });

  document.getElementById('add-item-builtin')?.addEventListener('click', () => showAddItemModal(hbItems, false));
  document.getElementById('add-item-custom')?.addEventListener('click', () => showAddItemModal(hbItems, true));
}

function renderInvRow(item) {
  const isWeapon = item.weaponType || item.damage;
  const isArmor = item.armorType;
  const isShield = item.isShield;
  const equipType = isArmor ? 'armor' : isShield ? 'shield' : 'weapon';
  const isEquipped = isArmor ? item.id === data.equippedArmorId
    : isShield ? item.id === data.equippedShieldId
    : item.equipped;

  return `<div class="inv-row">
    ${(isWeapon || isArmor || isShield)
      ? `<div class="equip-toggle ${isEquipped?'equipped':''}" data-id="${item.id}" data-type="${equipType}" title="${isEquipped?'Unequip':'Equip'}"></div>`
      : `<div style="width:10px;"></div>`
    }
    <div style="flex:1;">
      <div class="inv-name">${item.name}</div>
      <div class="inv-detail">${item.detail || (isArmor ? `AC ${item.baseAC} (${item.armorType})` : item.damage ? `${item.damage} ${item.damageType||''}` : '')}</div>
    </div>
    <input type="number" class="form-input inv-qty-input" data-id="${item.id}" value="${item.quantity||1}" style="width:55px; text-align:center;" min="0" />
    <button class="btn btn-sm btn-danger inv-delete" data-id="${item.id}">✕</button>
  </div>`;
}

function showAddItemModal(hbItems, customMode) {
  const BUILTIN_ITEMS = [
    { id:'longsword',    name:'Longsword',     damage:'1d8', damageType:'Slashing', weaponType:'melee' },
    { id:'shortsword',   name:'Shortsword',    damage:'1d6', damageType:'Piercing', weaponType:'melee', finesse:true },
    { id:'dagger',       name:'Dagger',        damage:'1d4', damageType:'Piercing', weaponType:'melee', finesse:true },
    { id:'handaxe',      name:'Handaxe',       damage:'1d6', damageType:'Slashing', weaponType:'melee' },
    { id:'rapier',       name:'Rapier',        damage:'1d8', damageType:'Piercing', weaponType:'melee', finesse:true },
    { id:'greataxe',     name:'Greataxe',      damage:'1d12',damageType:'Slashing', weaponType:'melee' },
    { id:'greatsword',   name:'Greatsword',    damage:'2d6', damageType:'Slashing', weaponType:'melee' },
    { id:'hcrossbow',    name:'Hand crossbow', damage:'1d6', damageType:'Piercing', weaponType:'ranged', range:'30/120' },
    { id:'lcrossbow',    name:'Light crossbow',damage:'1d8', damageType:'Piercing', weaponType:'ranged', range:'80/320' },
    { id:'shortbow',     name:'Shortbow',      damage:'1d6', damageType:'Piercing', weaponType:'ranged', range:'80/320' },
    { id:'longbow',      name:'Longbow',       damage:'1d8', damageType:'Piercing', weaponType:'ranged', range:'150/600' },
    { id:'leather',      name:'Leather armor', baseAC:11, armorType:'light' },
    { id:'studdedleather',name:'Studded leather', baseAC:12, armorType:'light' },
    { id:'chainshirt',   name:'Chain shirt',   baseAC:13, armorType:'medium' },
    { id:'chainmail',    name:'Chain mail',    baseAC:16, armorType:'heavy' },
    { id:'platemail',    name:'Plate mail',    baseAC:18, armorType:'heavy' },
    { id:'shield',       name:'Shield',        isShield:true },
    { id:'arrows',       name:'Arrows',        detail:'Ammunition' },
    { id:'bolts',        name:'Crossbow bolts',detail:'Ammunition' },
    { id:'tinkers-tools',name:"Tinker's tools",detail:'Tool' },
    { id:'dungeoneers',  name:"Dungeoneer's pack", detail:'Pack' },
    { id:'explorers',    name:"Explorer's pack",   detail:'Pack' },
  ];
  const allItems = [
    ...BUILTIN_ITEMS,
    ...hbItems.map(h => ({ id:`hb_${h.id}`, name:h.name, ...h.data })),
  ];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = customMode ? `
    <div class="modal">
      <div class="modal-title">Add custom item</div>
      <div class="form-group"><label>Name</label><input class="form-input" id="ci-name" placeholder="Item name" /></div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Damage (e.g. 1d8)</label><input class="form-input" id="ci-dmg" placeholder="1d8" /></div>
        <div class="form-group"><label>Damage type</label>
          <select class="form-select" id="ci-dmgtype">
            <option value="">—</option>
            ${['Slashing','Piercing','Bludgeoning','Fire','Cold','Lightning','Acid','Poison','Necrotic','Radiant','Thunder','Psychic','Force'].map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Weapon type</label>
          <select class="form-select" id="ci-wpntype">
            <option value="">—</option><option value="melee">Melee</option><option value="ranged">Ranged</option><option value="firearm">Firearm</option>
          </select>
        </div>
        <div class="form-group"><label>Range (e.g. 30/120)</label><input class="form-input" id="ci-range" /></div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Attack bonus</label><input class="form-input" type="number" id="ci-atkbonus" value="0" /></div>
        <div class="form-group"><label>Damage bonus</label><input class="form-input" type="number" id="ci-dmgbonus" value="0" /></div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Armor type (if armor)</label>
          <select class="form-select" id="ci-armortype">
            <option value="">—</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option>
          </select>
        </div>
        <div class="form-group"><label>Base AC (if armor)</label><input class="form-input" type="number" id="ci-baseac" value="0" /></div>
      </div>
      <div class="form-group"><label>Extra damage dice (e.g. 1d6 fire for magic weapon)</label><input class="form-input" id="ci-extra" placeholder="1d6 Fire" /></div>
      <div class="form-group"><label>Notes / description</label><input class="form-input" id="ci-detail" placeholder="Optional details" /></div>
      <div class="modal-footer">
        <button class="btn" id="ci-cancel">Cancel</button>
        <button class="btn btn-gold" id="ci-add">Add item</button>
      </div>
    </div>
  ` : `
    <div class="modal">
      <div class="modal-title">Add item</div>
      <div style="max-height:400px; overflow-y:auto;">
        ${allItems.map(item => `
          <div class="dm-char-row add-item-row" data-id="${item.id}" style="cursor:pointer;">
            <div>
              <div class="dm-char-name">${item.name}</div>
              <div class="dm-char-meta">${item.damage ? item.damage + ' ' + (item.damageType||'') : item.baseAC ? 'AC ' + item.baseAC + ' (' + item.armorType + ')' : item.detail||''}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="modal-footer"><button class="btn" id="ai-cancel">Cancel</button></div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#ai-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#ci-cancel')?.addEventListener('click', () => overlay.remove());

  overlay.querySelectorAll('.add-item-row').forEach(row => {
    row.addEventListener('click', () => {
      const item = allItems.find(i => i.id === row.dataset.id);
      if (!item) return;
      mutate(() => {
        data.inventory = data.inventory || [];
        data.inventory.push({ ...item, id: `item_${Date.now()}`, quantity: 1, equipped: false });
      });
      overlay.remove();
    });
  });

  overlay.querySelector('#ci-add')?.addEventListener('click', () => {
    const name = document.getElementById('ci-name')?.value;
    if (!name) { alert('Enter item name'); return; }
    const newItem = {
      id: `item_${Date.now()}`,
      name,
      damage: document.getElementById('ci-dmg')?.value || null,
      damageType: document.getElementById('ci-dmgtype')?.value || null,
      weaponType: document.getElementById('ci-wpntype')?.value || null,
      range: document.getElementById('ci-range')?.value || null,
      attackBonus: parseInt(document.getElementById('ci-atkbonus')?.value) || 0,
      damageBonus: parseInt(document.getElementById('ci-dmgbonus')?.value) || 0,
      armorType: document.getElementById('ci-armortype')?.value || null,
      baseAC: parseInt(document.getElementById('ci-baseac')?.value) || 0,
      extraDamage: document.getElementById('ci-extra')?.value || null,
      detail: document.getElementById('ci-detail')?.value || null,
      quantity: 1,
      equipped: false,
    };
    mutate(() => { data.inventory = data.inventory || []; data.inventory.push(newItem); });
    overlay.remove();
  });
}

// ── SPELLS TAB ───────────────────────────────────────────────────────────────
function renderSpellsTab(tc) {
  if (data.archetypeId !== 'arcane-artillerist' || char.level < 3) {
    tc.innerHTML = `<div class="card"><p style="color:var(--text-dim)">Spellcasting not available for this character.</p></div>`;
    return;
  }

  const slotsRow = OUTLAW.archetypes['arcane-artillerist'].spellcasting.slots.find(s => s.level === char.level);
  const slotsUsed = data.spellSlotsUsed || {};
  const prepared = data.preparedSpells || [];
  const cantrips = data.cantrips || [];

  const slotLevels = slotsRow ? [1,2,3,4].filter(l => slotsRow[`s${l}`] > 0) : [];

  const slotPips = slotLevels.map(l => {
    const max = slotsRow[`s${l}`];
    const used = slotsUsed[l] || 0;
    return `<div class="slot-group">
      <div class="slot-label">Level ${l}</div>
      <div class="slot-pips">
        ${Array.from({length:max},(_,i) => `
          <div class="slot-pip ${i < (max-used) ? 'available' : 'used'}" data-level="${l}" data-i="${i}"></div>
        `).join('')}
      </div>
    </div>`;
  }).join('');

  const intMod = derived.mods.intelligence;
  const maxPrepared = Math.max(1, intMod + Math.floor(char.level / 2));

  const allSpells = WIZARD_SPELLS;
  const cantripList = allSpells.filter(s => s.level === 0);
  const leveledSpells = allSpells.filter(s => s.level > 0 && (slotsRow ? slotsRow[`s${s.level}`] > 0 : false));

  tc.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Spell slots</div>
      <div class="spell-slots">${slotPips}</div>
      <div style="font-size:0.85rem; color:var(--text-dim);">Spell save DC: <strong>${derived.spellSaveDC}</strong> · Spell attack: <strong>${formatMod(derived.spellAttackBonus)}</strong></div>
    </div>
    <div class="card" style="margin-bottom:1rem;">
      <div class="section-header">
        <div class="card-title" style="margin:0;">Cantrips (${cantrips.length} known)</div>
        <button class="btn btn-sm" id="manage-cantrips">Manage</button>
      </div>
      ${cantrips.map(sid => {
        const s = cantripList.find(x => x.id === sid);
        if (!s) return '';
        return `<div class="spell-row"><div class="spell-name">${s.name}</div><div class="spell-detail">${s.castTime} · ${s.range}</div><button class="btn btn-sm cast-btn" data-spell="${s.id}">Cast</button></div>`;
      }).join('') || '<div style="color:var(--text-muted); font-size:0.85rem;">No cantrips selected.</div>'}
    </div>
    <div class="card">
      <div class="section-header">
        <div class="card-title" style="margin:0;">Prepared spells (${prepared.length} / ${maxPrepared})</div>
        <button class="btn btn-sm" id="manage-spells">Manage prepared</button>
      </div>
      ${[1,2,3,4].map(l => {
        const group = leveledSpells.filter(s => s.level === l && prepared.includes(s.id));
        if (group.length === 0) return '';
        return `<div style="margin-bottom:0.75rem;">
          <div style="font-family:var(--font-display); font-size:0.62rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.25rem;">Level ${l}</div>
          ${group.map(s => `
            <div class="spell-row">
              <div class="spell-name">${s.name} ${s.concentration ? '<span class="spell-conc">C</span>' : ''}</div>
              <div class="spell-detail">${s.castTime} · ${s.range} · ${s.duration}</div>
              <button class="btn btn-sm cast-btn" data-spell="${s.id}" data-level="${s.level}">Cast</button>
            </div>
          `).join('')}
        </div>`;
      }).join('') || '<div style="color:var(--text-muted); font-size:0.85rem;">No spells prepared.</div>'}
    </div>
  `;

  // Slot pips
  tc.querySelectorAll('.slot-pip').forEach(pip => {
    pip.addEventListener('click', () => {
      const level = parseInt(pip.dataset.level);
      const max = slotsRow[`s${level}`];
      mutate(() => {
        const used = slotsUsed[level] || 0;
        if (pip.classList.contains('available')) {
          data.spellSlotsUsed = { ...slotsUsed, [level]: Math.min(max, used + 1) };
        } else {
          data.spellSlotsUsed = { ...slotsUsed, [level]: Math.max(0, used - 1) };
        }
      });
    });
  });

  document.getElementById('manage-cantrips')?.addEventListener('click', () => showSpellPicker(cantripList, cantrips, 0, char.level >= 10 ? 3 : 2));
  document.getElementById('manage-spells')?.addEventListener('click', () => showSpellPicker(leveledSpells, prepared, -1, maxPrepared));

  tc.querySelectorAll('.cast-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spell = allSpells.find(s => s.id === btn.dataset.spell);
      if (!spell) return;
      if (spell.level > 0) {
        const level = parseInt(prompt(`Cast at what spell level? (${spell.level}-4)`) || spell.level);
        if (!isNaN(level) && level >= spell.level) {
          mutate(() => { data.spellSlotsUsed = { ...data.spellSlotsUsed, [level]: Math.min(slotsRow[`s${level}`]||0, (data.spellSlotsUsed[level]||0)+1 ) }; });
          showMsg(`Casting ${spell.name} at level ${level}.`);
        }
      } else {
        showMsg(`Casting cantrip: ${spell.name}`);
      }
    });
  });
}

function showSpellPicker(spells, selected, filterLevel, max) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const grouped = filterLevel === 0
    ? { 'Cantrips': spells }
    : [1,2,3,4].reduce((acc, l) => {
        const g = spells.filter(s => s.level === l);
        if (g.length) acc[`Level ${l}`] = g;
        return acc;
      }, {});

  let cur = [...selected];

  overlay.innerHTML = `
    <div class="modal" style="max-width:640px;">
      <div class="modal-title">Select spells (max ${max})</div>
      <div style="max-height:450px; overflow-y:auto;">
        ${Object.entries(grouped).map(([label, sps]) => `
          <div style="margin-bottom:1rem;">
            <div style="font-family:var(--font-display); font-size:0.65rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.5rem;">${label}</div>
            ${sps.map(s => `
              <label style="display:flex; gap:0.75rem; padding:0.5rem; border-radius:var(--radius); cursor:pointer; border-bottom:1px solid var(--border);">
                <input type="checkbox" name="sp" value="${s.id}" ${cur.includes(s.id)?'checked':''} />
                <div>
                  <div style="font-size:0.9rem; font-weight:500;">${s.name} ${s.concentration?'<span style="color:var(--blue);font-size:0.75rem;">Conc</span>':''}</div>
                  <div style="font-size:0.8rem; color:var(--text-dim);">${s.castTime} · ${s.range} · ${s.duration} · ${s.description}</div>
                </div>
              </label>
            `).join('')}
          </div>
        `).join('')}
      </div>
      <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.75rem;">Selected: <span id="sp-count">${cur.length}</span> / ${max}</div>
      <div class="modal-footer">
        <button class="btn" id="sp-cancel">Cancel</button>
        <button class="btn btn-gold" id="sp-confirm">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('input[name="sp"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) cur.push(cb.value);
      else cur = cur.filter(s => s !== cb.value);
      if (cur.length > max) { cb.checked = false; cur = cur.filter(s => s !== cb.value); }
      overlay.querySelector('#sp-count').textContent = cur.length;
    });
  });

  overlay.querySelector('#sp-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#sp-confirm')?.addEventListener('click', () => {
    mutate(() => {
      if (filterLevel === 0) data.cantrips = cur;
      else data.preparedSpells = cur;
    });
    overlay.remove();
  });
}

// ── TRICK SHOTS TAB (Gunslinger only) ────────────────────────────────────────
function renderTrickShotsTab(tc) {
  const allShots = OUTLAW.archetypes.gunslinger.trickShots.options;
  const known = data.selectedTrickShots || [];
  const sig = data.signatureMove;
  const totalAllowed = (() => {
    const { startCount, additionalLevels } = OUTLAW.archetypes.gunslinger.trickShots;
    return startCount + additionalLevels.filter(l => l <= char.level).length;
  })();
  const nd = data.nerveDiceCurrent || 0;
  const ndMax = data.nerveDiceCurrent ?? 0;

  let html = `
    <div class="card" style="margin-bottom:1rem;">
      <div class="section-header">
        <div class="card-title" style="margin:0;">Known trick shots (${known.length} / ${totalAllowed})</div>
        <div style="font-size:0.85rem; color:var(--text-dim);">Trick Shot DC: <strong>${derived.trickShotDC}</strong></div>
      </div>
      <p style="font-size:0.85rem; color:var(--text-dim); margin-bottom:0.75rem;">Trick shots are declared after your attack roll but before damage is rolled.</p>
      <div style="display:flex; flex-direction:column; gap:0.4rem;">
        ${allShots.map(s => {
          const isKnown = known.includes(s.id);
          const isSig = sig === s.id;
          const effectiveCost = isSig ? Math.max(0, s.cost - 1) : s.cost;
          const canSelect = isKnown || known.length < totalAllowed;
          return `
            <div style="border:1px solid ${isKnown ? 'var(--gold-dim)' : 'var(--border)'}; border-radius:var(--radius); padding:0.6rem 0.75rem; background:${isKnown ? 'var(--gold-glow)' : 'var(--bg-raised)'};">
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <input type="checkbox" class="ts-select" data-id="${s.id}" ${isKnown ? 'checked' : ''} ${!canSelect ? 'disabled' : ''} />
                <div style="flex:1;">
                  <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <span style="font-weight:500;">${s.name}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${s.cost} Nerve ${s.cost === 1 ? 'Die' : 'Dice'}</span>
                    ${isSig ? '<span style="font-size:0.72rem; color:var(--green); font-family:var(--font-display); letter-spacing:0.08em;">SIGNATURE</span>' : ''}
                  </div>
                  <div style="font-size:0.83rem; color:var(--text-dim); margin-top:0.2rem;">${s.description}</div>
                  ${s.id === 'disarming-shot' || s.id === 'pinning-shot' ? `<div style="font-size:0.8rem; color:var(--gold); margin-top:0.2rem;">Strength save DC ${derived.trickShotDC}</div>` : ''}
                  ${s.id === 'warning-shot' ? `<div style="font-size:0.8rem; color:var(--gold); margin-top:0.2rem;">Wisdom save DC ${derived.trickShotDC}</div>` : ''}
                  ${s.id === 'shatter-shot' ? `<div style="font-size:0.8rem; color:var(--gold); margin-top:0.2rem;">Constitution save DC ${derived.trickShotDC} (target has disadvantage)</div>` : ''}
                </div>
                ${isKnown ? `<button class="btn btn-sm trick-use ${nd < effectiveCost ? '' : 'btn-gold'}"
                  data-cost="${effectiveCost}" data-name="${s.name}"
                  ${nd < effectiveCost ? 'disabled' : ''}>Use (${effectiveCost} die)</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>`;

  // Signature Move — checkboxes instead of dropdown
  if (char.level >= 7) {
    html += `
      <div class="card">
        <div class="card-title">Signature move</div>
        <p style="font-size:0.85rem; color:var(--text-dim); margin-bottom:0.75rem;">
          Your signature move costs 1 fewer Nerve Die (minimum 0). You can change it on a long rest.
        </p>
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${known.map(id => {
            const s = allShots.find(x => x.id === id);
            if (!s) return '';
            const isSig = sig === s.id;
            return `
              <label style="display:flex; gap:0.75rem; align-items:center; padding:0.5rem 0.75rem;
                border:1px solid ${isSig ? 'var(--green)' : 'var(--border)'};
                border-radius:var(--radius); background:${isSig ? 'rgba(74,222,128,0.08)' : 'var(--bg-raised)'};
                cursor:pointer;">
                <input type="radio" name="sig-radio" value="${s.id}" ${isSig ? 'checked' : ''} />
                <div style="flex:1;">
                  <div style="font-weight:500;">${s.name}</div>
                  <div style="font-size:0.8rem; color:var(--text-dim);">${s.cost} die → ${Math.max(0, s.cost - 1)} die as signature</div>
                </div>
                ${isSig ? '<span style="font-size:0.75rem; color:var(--green); font-family:var(--font-display);">ACTIVE</span>' : ''}
              </label>
            `;
          }).join('')}
          <label style="display:flex; gap:0.75rem; align-items:center; padding:0.5rem 0.75rem;
            border:1px solid ${!sig ? 'var(--text-muted)' : 'var(--border)'};
            border-radius:var(--radius); background:var(--bg-raised); cursor:pointer;">
            <input type="radio" name="sig-radio" value="" ${!sig ? 'checked' : ''} />
            <div style="color:var(--text-dim); font-size:0.9rem;">— None —</div>
          </label>
        </div>
      </div>`;
  }

  tc.innerHTML = html;

  // Trick shot selection checkboxes
  tc.querySelectorAll('.ts-select').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      mutate(() => {
        if (cb.checked) {
          if ((data.selectedTrickShots || []).length < totalAllowed) {
            data.selectedTrickShots = [...(data.selectedTrickShots || []), id];
          } else {
            cb.checked = false;
          }
        } else {
          data.selectedTrickShots = (data.selectedTrickShots || []).filter(s => s !== id);
          if (data.signatureMove === id) data.signatureMove = null;
        }
      });
    });
  });

  // Signature move radio
  tc.querySelectorAll('input[name="sig-radio"]').forEach(r => {
    r.addEventListener('change', e => {
      mutate(() => { data.signatureMove = e.target.value || null; });
    });
  });

  // Use buttons (same logic as combat tab trick shots)
  const ndData = getNerveDice(char.level);
  tc.querySelectorAll('.trick-use').forEach(btn => {
    btn.addEventListener('click', () => {
      const cost = parseInt(btn.dataset.cost);
      const name = btn.dataset.name;
      mutate(() => { data.nerveDiceCurrent = Math.max(0, (data.nerveDiceCurrent ?? 0) - cost); });
      let total = 0;
      const rolls = [];
      for (let i = 0; i < cost; i++) { const r = rollDie(ndData.dieSize); rolls.push(r); total += r; }
      if (cost > 0) sendRollToDnDBeyond(`Trick shot: ${name}`, total, `${cost}d${ndData.dieSize} (${rolls.join('+')})`, char.name);
      else showMsg(`${name} used — free this turn (Signature Move).`);
    });
  });
}

// ── NOTES TAB ────────────────────────────────────────────────────────────────
function renderNotesTab(tc) {
  tc.innerHTML = `
    <div class="card">
      <div class="card-title">Notes & backstory</div>
      <textarea class="notes-area" id="notes-input">${data.notes || ''}</textarea>
    </div>
  `;
  document.getElementById('notes-input')?.addEventListener('input', e => {
    data.notes = e.target.value;
    scheduleAutoSave();
  });
}

// ── ADMIN TAB (DM only) ───────────────────────────────────────────────────────
function renderAdminTab(tc) {
  tc.innerHTML = `
    <div class="card">
      <div class="card-title">DM: edit character</div>
      <div class="form-group">
        <label>Character name</label>
        <input class="form-input" id="admin-name" value="${char.name}" />
      </div>
      <div class="form-row cols-2">
        <div class="form-group">
          <label>Level</label>
          <select class="form-select" id="admin-level">
            ${Array.from({length:20},(_,i)=>i+1).map(l=>`<option value="${l}" ${char.level===l?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Override max HP (blank = auto)</label>
          <input class="form-input" type="number" id="admin-hp" value="${data.maxHPOverride||''}" placeholder="Auto" />
        </div>
      </div>
      <div class="form-row cols-6">
        ${Object.keys(data.abilities).map(ab => `
          <div class="form-group">
            <label>${ab.substring(0,3).toUpperCase()}</label>
            <input class="form-input" type="number" id="admin-ab-${ab}" value="${data.abilities[ab]}" min="1" max="30" />
          </div>
        `).join('')}
      </div>
      <button class="btn btn-gold" id="admin-save">Apply changes</button>
    </div>
    <div class="card" style="margin-top:1rem;">
      <div class="card-title">Proficiencies</div>
      <p style="font-size:0.85rem; color:var(--text-dim); margin-bottom:0.75rem;">Edit armor, weapon, tool, and other proficiencies shown on the Core tab. Leave blank to use the class defaults.</p>
      <div class="form-group">
        <label>Armor proficiencies</label>
        <input class="form-input" id="admin-prof-armor" value="${(data.proficiencies||{}).armor || ''}" placeholder="Light armor, Medium armor, Shields" />
      </div>
      <div class="form-group">
        <label>Weapon proficiencies</label>
        <input class="form-input" id="admin-prof-weapons" value="${(data.proficiencies||{}).weapons || ''}" placeholder="Simple weapons, Firearms, Hand crossbows, Shortswords" />
      </div>
      <div class="form-group">
        <label>Tool proficiencies</label>
        <input class="form-input" id="admin-prof-tools" value="${(data.proficiencies||{}).tools || ''}" placeholder="e.g. Thieves' tools, Herbalism kit" />
      </div>
      <div class="form-group">
        <label>Other proficiencies / notes</label>
        <input class="form-input" id="admin-prof-other" value="${(data.proficiencies||{}).other || ''}" placeholder="e.g. Vehicles (land)" />
      </div>
      <button class="btn btn-gold" id="admin-prof-save">Save proficiencies</button>
    </div>
    <div class="card" style="margin-top:1rem;">
      <div class="card-title">Add feat to character</div>
      ${renderAddFeatSection()}
    </div>
  `;

  document.getElementById('admin-save')?.addEventListener('click', async () => {
    mutate(() => {
      char.name = document.getElementById('admin-name')?.value || char.name;
      char.level = parseInt(document.getElementById('admin-level')?.value) || char.level;
      data.maxHPOverride = parseInt(document.getElementById('admin-hp')?.value) || null;
      Object.keys(data.abilities).forEach(ab => {
        const val = parseInt(document.getElementById(`admin-ab-${ab}`)?.value);
        if (!isNaN(val)) data.abilities[ab] = val;
      });
    });
    await saveCharacter({ ...char, data }, userId);
    showMsg('Changes saved.');
  });

  document.getElementById('admin-prof-save')?.addEventListener('click', async () => {
    mutate(() => {
      data.proficiencies = {
        armor:   document.getElementById('admin-prof-armor')?.value.trim() || null,
        weapons: document.getElementById('admin-prof-weapons')?.value.trim() || null,
        tools:   document.getElementById('admin-prof-tools')?.value.trim() || null,
        other:   document.getElementById('admin-prof-other')?.value.trim() || null,
      };
    });
    await saveCharacter({ ...char, data }, userId);
    showMsg('Proficiencies saved.');
  });

  wireAddFeat(tc);
}

function renderAddFeatSection() {
  const hbFeats = homebrew.filter(h => h.type === 'feat');
  return `
    <div class="form-group">
      <label>Select feat to add</label>
      <select class="form-select" id="feat-picker">
        <option value="">— Select feat —</option>
        ${hbFeats.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
      </select>
    </div>
    <button class="btn btn-sm" id="add-feat-btn">Add feat</button>
  `;
}

function wireAddFeat(tc) {
  tc.querySelector('#add-feat-btn')?.addEventListener('click', async () => {
    const featId = tc.querySelector('#feat-picker')?.value;
    if (!featId) return;
    const feat = homebrew.find(h => h.id === featId);
    if (!feat) return;

    const effects = feat.data?.effects || [];
    const choiceEffects = effects.filter(e => e.playerChoice);
    const resolvedChoices = {};

    // Prompt for each player-choice effect before applying
    for (let ei = 0; ei < effects.length; ei++) {
      const e = effects[ei];
      if (!e.playerChoice) continue;

      if (e.type === 'stat-bonus') {
        const amount = parseInt(e.amount || 1);
        const pool = e.allowedChoices?.length ? e.allowedChoices
          : ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
        const picked = await showStatPickerModal(
          feat.name + ' — Ability score', 1, amount,
          pool.filter(ab => (data.abilities[ab] || 10) < 20)
        );
        if (!picked) return;
        resolvedChoices[ei] = picked;

      } else if (e.type === 'skill-proficiency' || e.type === 'skill-expertise') {
        const pool = e.allowedChoices?.length ? e.allowedChoices
          : ['Acrobatics','Animal handling','Arcana','Athletics','Deception','History',
            'Insight','Intimidation','Investigation','Medicine','Nature','Perception',
            'Performance','Persuasion','Religion','Sleight of hand','Stealth','Survival'];
        const picked = await showGenericPickerModal(
          feat.name + ' — ' + (e.type === 'skill-expertise' ? 'Skill expertise' : 'Skill proficiency'),
          'Choose a skill:', pool, 1
        );
        if (!picked) return;
        resolvedChoices[ei] = picked;

      } else if (e.type === 'save-proficiency') {
        const pool = e.allowedChoices?.length ? e.allowedChoices
          : ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
        const picked = await showGenericPickerModal(
          feat.name + ' — Saving throw proficiency', 'Choose a saving throw:', pool, 1
        );
        if (!picked) return;
        resolvedChoices[ei] = picked;

      } else if (e.type === 'damage-resistance') {
        const pool = e.allowedChoices?.length ? e.allowedChoices
          : ['Acid','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
        const picked = await showGenericPickerModal(
          feat.name + ' — Damage resistance', 'Choose a damage type:', pool, 1
        );
        if (!picked) return;
        resolvedChoices[ei] = picked;
      }
    }

    mutate(() => {
      data.feats = data.feats || [];
      if (!data.feats.find(f => f.id === featId)) {
        data.feats.push({ id: featId, name: feat.name, description: feat.data?.description || '', effects });
      }
      applyFeatEffects(effects, resolvedChoices);
    });
    showMsg(`${feat.name} added.`);
  });
}

// ── Level up modal ────────────────────────────────────────────────────────────
function showLevelUpModal() {
  if (char.level >= 20) { showMsg('Already at max level!'); return; }
  const newLevel = char.level + 1;
  const newProg = getProgression(newLevel);
  const newFeatures = newProg.features.filter(f => f !== 'archetype-feature' && f !== 'asi');
  const isASI = newProg.features.includes('asi');
  const isArchetype = newProg.features.includes('archetype-feature');
  const availableFeats = homebrew.filter(h => h.type === 'feat');

  // For archetypes unlocked at this level
  let archetypeChoice = '';
  if (newLevel === 3 && !data.archetypeId) {
    const archetypes = Object.values(OUTLAW.archetypes);
    archetypeChoice = `
      <div style="padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius); margin-bottom:0.75rem;">
        <strong style="color:var(--gold)">Choose your archetype</strong>
        <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.4rem;">
          ${archetypes.map(a => `
            <label style="display:flex; gap:0.5rem; align-items:center; cursor:pointer;">
              <input type="radio" name="lvlup-archetype" value="${a.id}" />
              <span style="font-size:0.9rem;">${a.name}</span>
            </label>
          `).join('')}
        </div>
      </div>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">Level up to ${newLevel}!</div>
      <div style="font-size:0.9rem; color:var(--text-dim); margin-bottom:1rem;">
        <div><strong style="color:var(--gold)">Proficiency bonus:</strong> +${newProg.profBonus}</div>
        <div><strong style="color:var(--gold)">Nerve Dice:</strong> ${newProg.nerveDiceCount} × d${newProg.nerveDieSize}</div>
      </div>

      ${newFeatures.map(fid => {
        const f = OUTLAW.features[fid] || (data.archetypeId && OUTLAW.archetypes[data.archetypeId]?.features[fid]);
        return f ? `<div style="margin-bottom:0.75rem; padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius);">
          <div style="font-weight:600; margin-bottom:0.25rem; color:var(--gold);">${f.name}</div>
          <div style="font-size:0.85rem; color:var(--text-dim);">${f.description}</div>
        </div>` : '';
      }).join('')}

      ${archetypeChoice}

      ${isArchetype && data.archetypeId ? `<div style="padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius); margin-bottom:0.75rem;">
        <strong style="color:var(--gold)">New archetype feature: ${data.archetypeName}</strong>
        <div style="font-size:0.85rem; color:var(--text-dim); margin-top:0.25rem;">See the Features tab for your new ability.</div>
      </div>` : ''}

      ${isASI ? `
        <div style="padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius); margin-bottom:0.75rem;">
          <strong style="color:var(--gold)">Ability Score Improvement or Feat</strong>
          <div style="font-size:0.85rem; color:var(--text-dim); margin:0.5rem 0;">Choose a feat to take, or choose to increase an ability score by 2 (or two scores by 1 each).</div>
          <div style="margin-bottom:0.5rem;">
            <label style="display:flex; gap:0.5rem; align-items:center; cursor:pointer; margin-bottom:0.35rem;">
              <input type="radio" name="asi-choice" value="feat" id="asi-feat-radio" />
              <span style="font-size:0.9rem;">Take a feat</span>
            </label>
            <label style="display:flex; gap:0.5rem; align-items:center; cursor:pointer;">
              <input type="radio" name="asi-choice" value="asi" id="asi-asi-radio" checked />
              <span style="font-size:0.9rem;">Ability score improvement</span>
            </label>
          </div>
          <div id="asi-feat-section" style="display:none; margin-top:0.5rem;">
            <select class="form-select" id="asi-feat-picker">
              <option value="">— Select feat —</option>
              ${availableFeats.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
            </select>
            ${availableFeats.length === 0 ? '<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">No feats defined yet. The DM can add them in the Homebrew Editor.</div>' : ''}
          </div>
          <div id="asi-score-section" style="margin-top:0.5rem;">
            <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:0.5rem;">Current scores. Add +2 to one or +1 to two (max 20).</div>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.4rem;">
              ${Object.entries(data.abilities).map(([ab, val]) => `
                <div style="background:var(--bg-raised); border:1px solid var(--border); border-radius:var(--radius); padding:6px; text-align:center;">
                  <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">${ab.substring(0,3)}</div>
                  <div style="font-size:18px; font-weight:500;">${val}</div>
                  <div style="display:flex; gap:4px; justify-content:center; margin-top:4px;">
                    <button class="btn btn-sm asi-inc" data-ab="${ab}" data-val="${val}" style="padding:2px 8px;">+1</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <div id="asi-pending" style="font-size:0.85rem; color:var(--gold); margin-top:0.5rem;"></div>
          </div>
        </div>
      ` : ''}

      <div class="form-group" style="margin-top:0.75rem;">
        <label>HP gained (d10 roll — Con mod is applied automatically)</label>
        <div style="display:flex; gap:0.5rem;">
          <input class="form-input" type="number" id="lvlup-hp" placeholder="${Math.ceil(10/2)+1}" />
          <button class="btn btn-sm" id="roll-hp">Roll</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="lvlup-cancel">Cancel</button>
        <button class="btn btn-gold" id="lvlup-confirm">Level up!</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // ASI choice toggle
  let asiPending = {}; // { ability: delta }
  const TOTAL_POINTS = 2;

  function updateASIPending() {
    const total = Object.values(asiPending).reduce((s, v) => s + v, 0);
    const remaining = TOTAL_POINTS - total;
    const el = document.getElementById('asi-pending');
    if (el) el.textContent = remaining > 0 ? `Points remaining: ${remaining}` : 'Points assigned ✓';
  }

  overlay.querySelectorAll('input[name="asi-choice"]').forEach(r => {
    r.addEventListener('change', () => {
      const isFeat = document.getElementById('asi-feat-radio')?.checked;
      const featSection = document.getElementById('asi-feat-section');
      const scoreSection = document.getElementById('asi-score-section');
      if (featSection) featSection.style.display = isFeat ? 'block' : 'none';
      if (scoreSection) scoreSection.style.display = isFeat ? 'none' : 'block';
      asiPending = {};
    });
  });

  overlay.querySelectorAll('.asi-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const ab = btn.dataset.ab;
      const currentVal = data.abilities[ab] + (asiPending[ab] || 0);
      const total = Object.values(asiPending).reduce((s, v) => s + v, 0);
      if (currentVal >= 20) { showMsg('Cannot exceed 20 with an ASI.'); return; }
      if (total >= TOTAL_POINTS) { showMsg('Already assigned all points. Click a +1 on a different stat to reassign.'); return; }
      asiPending[ab] = (asiPending[ab] || 0) + 1;
      btn.closest('div[style*="text-align:center"]').querySelector('div[style*="font-size:18px"]').textContent = currentVal + 1;
      updateASIPending();
    });
  });

  document.getElementById('roll-hp')?.addEventListener('click', () => {
    const roll = rollDie(10);
    document.getElementById('lvlup-hp').value = Math.max(1, roll);
  });

  document.getElementById('lvlup-cancel')?.addEventListener('click', () => overlay.remove());

  document.getElementById('lvlup-confirm')?.addEventListener('click', async () => {
    // Validate archetype choice if needed
    if (newLevel === 3 && !data.archetypeId) {
      const chosen = overlay.querySelector('input[name="lvlup-archetype"]:checked')?.value;
      if (!chosen) { alert('Please choose an archetype.'); return; }
    }

    const hpGained = Math.max(1, parseInt(document.getElementById('lvlup-hp')?.value) || (Math.ceil(10/2)+1));
    const isFeatChoice = document.getElementById('asi-feat-radio')?.checked;
    const chosenFeatId = document.getElementById('asi-feat-picker')?.value;
    const chosenArchetype = overlay.querySelector('input[name="lvlup-archetype"]:checked')?.value;

    // If the chosen feat has any player-choice effects, prompt for each before applying
    if (isASI && isFeatChoice && chosenFeatId) {
      const feat = homebrew.find(h => h.id === chosenFeatId);
      const effects = feat?.data?.effects || [];
      const choiceEffects = effects.filter(e => e.playerChoice);

      if (choiceEffects.length > 0) {
        // Collect all choices before mutating state
        const resolvedChoices = {}; // effect index -> chosen value(s)
        for (let ei = 0; ei < effects.length; ei++) {
          const e = effects[ei];
          if (!e.playerChoice) continue;

          if (e.type === 'stat-bonus') {
            const amount = parseInt(e.amount || 1);
            const pool = e.allowedChoices?.length ? e.allowedChoices
              : ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
            const picked = await showStatPickerModal(
              feat.name + ' — Ability score',
              1, amount,
              pool.filter(ab => (data.abilities[ab] || 10) < 20)
            );
            if (!picked) return;
            resolvedChoices[ei] = picked;

          } else if (e.type === 'skill-proficiency' || e.type === 'skill-expertise') {
            const pool = e.allowedChoices?.length ? e.allowedChoices : null;
            const picked = await showGenericPickerModal(
              feat.name + ' — ' + (e.type === 'skill-expertise' ? 'Skill expertise' : 'Skill proficiency'),
              'Choose a skill:',
              pool || ['Acrobatics','Animal handling','Arcana','Athletics','Deception','History',
                'Insight','Intimidation','Investigation','Medicine','Nature','Perception',
                'Performance','Persuasion','Religion','Sleight of hand','Stealth','Survival'],
              1
            );
            if (!picked) return;
            resolvedChoices[ei] = picked;

          } else if (e.type === 'save-proficiency') {
            const pool = e.allowedChoices?.length ? e.allowedChoices
              : ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
            const picked = await showGenericPickerModal(
              feat.name + ' — Saving throw proficiency',
              'Choose a saving throw:',
              pool, 1
            );
            if (!picked) return;
            resolvedChoices[ei] = picked;

          } else if (e.type === 'damage-resistance') {
            const pool = e.allowedChoices?.length ? e.allowedChoices
              : ['Acid','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
            const picked = await showGenericPickerModal(
              feat.name + ' — Damage resistance',
              'Choose a damage type to be resistant to:',
              pool, 1
            );
            if (!picked) return;
            resolvedChoices[ei] = picked;
          }
        }

        mutate(() => {
          char.level = newLevel;
          data.currentHP = (data.currentHP ?? 0) + hpGained;
          data.maxHPOverride = null;
          data.nerveDiceCurrent = newProg.nerveDiceCount;
          if (chosenArchetype) { data.archetypeId = chosenArchetype; data.archetypeName = OUTLAW.archetypes[chosenArchetype]?.name || ''; }
          data.feats = data.feats || [];
          if (!data.feats.find(f => f.id === chosenFeatId)) {
            data.feats.push({ id: chosenFeatId, name: feat.name, description: feat.data?.description || '', effects: feat.data?.effects || [] });
          }
          applyFeatEffects(effects, resolvedChoices);
        });
        await saveCharacter({ ...char, data }, userId);
        overlay.remove();
        showMsg(`Leveled up to ${newLevel}! +${hpGained} HP.`);
        return;
      }
    }

    mutate(() => {
      char.level = newLevel;
      data.currentHP = (data.currentHP ?? 0) + hpGained;
      data.maxHPOverride = null;
      data.nerveDiceCurrent = newProg.nerveDiceCount;

      if (chosenArchetype) {
        data.archetypeId = chosenArchetype;
        data.archetypeName = OUTLAW.archetypes[chosenArchetype]?.name || '';
      }

      if (isASI) {
        if (isFeatChoice && chosenFeatId) {
          const feat = homebrew.find(h => h.id === chosenFeatId);
          if (feat) {
            data.feats = data.feats || [];
            if (!data.feats.find(f => f.id === chosenFeatId)) {
              data.feats.push({ id: chosenFeatId, name: feat.name, description: feat.data?.description || '', effects: feat.data?.effects || [] });
            }
            applyFeatEffects(feat.data?.effects || [], []);
          }
        } else {
          Object.entries(asiPending).forEach(([ab, delta]) => {
            data.abilities[ab] = Math.min(20, (data.abilities[ab] || 10) + delta);
          });
        }
      }
    });

    await saveCharacter({ ...char, data }, userId);
    overlay.remove();
    showMsg(`Leveled up to ${newLevel}! +${hpGained} HP.`);
  });
}

function showStatPickerModal(featName, numChoices, pointsPerChoice, pool) {
  return new Promise(resolve => {
    const ABILITIES_LIST = pool || ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
    let picked = [];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-title">${featName} — Choose ability score${numChoices > 1 ? 's' : ''}</div>
        <p style="font-size:0.88rem; color:var(--text-dim); margin-bottom:1rem;">
          Choose ${numChoices} ability score${numChoices > 1 ? 's' : ''} to increase by +${pointsPerChoice} each (max 20).
        </p>
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${ABILITIES_LIST.map(ab => `
            <label style="display:flex; gap:0.75rem; align-items:center; padding:0.5rem; border-radius:var(--radius); cursor:pointer; border:1px solid var(--border);">
              <input type="checkbox" name="stat-pick" value="${ab}" ${(data.abilities[ab]||10) >= 20 ? 'disabled' : ''} />
              <span style="flex:1;">${ab.charAt(0).toUpperCase()+ab.slice(1)}</span>
              <span style="color:var(--text-muted);">${data.abilities[ab]||10} → ${Math.min(20,(data.abilities[ab]||10)+pointsPerChoice)}</span>
            </label>
          `).join('')}
        </div>
        <div id="pick-count" style="font-size:0.85rem; color:var(--gold); margin-top:0.75rem;">Selected: 0 / ${numChoices}</div>
        <div class="modal-footer">
          <button class="btn" id="pick-cancel">Cancel</button>
          <button class="btn btn-gold" id="pick-confirm" disabled>Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('input[name="stat-pick"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) picked.push(cb.value);
        else picked = picked.filter(v => v !== cb.value);
        if (picked.length > numChoices) { cb.checked = false; picked = picked.filter(v => v !== cb.value); }
        modal.querySelector('#pick-count').textContent = `Selected: ${picked.length} / ${numChoices}`;
        modal.querySelector('#pick-confirm').disabled = picked.length !== numChoices;
      });
    });

    modal.querySelector('#pick-cancel').addEventListener('click', () => { modal.remove(); resolve(null); });
    modal.querySelector('#pick-confirm').addEventListener('click', () => { modal.remove(); resolve(picked); });
  });
}

// Generic single/multi picker — used for skill, save, and damage-resistance player choices
function showGenericPickerModal(title, prompt, options, numChoices) {
  return new Promise(resolve => {
    let picked = [];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-title">${title}</div>
        <p style="font-size:0.88rem; color:var(--text-dim); margin-bottom:1rem;">${prompt}</p>
        <div style="display:flex; flex-direction:column; gap:0.35rem;">
          ${options.map(opt => `
            <label style="display:flex; gap:0.75rem; align-items:center; padding:0.5rem;
              border-radius:var(--radius); cursor:pointer; border:1px solid var(--border);">
              <input type="${numChoices === 1 ? 'radio' : 'checkbox'}" name="gen-pick" value="${opt}" />
              <span style="text-transform:capitalize;">${opt}</span>
            </label>
          `).join('')}
        </div>
        <div id="gen-pick-count" style="font-size:0.85rem; color:var(--gold); margin-top:0.75rem;">
          ${numChoices > 1 ? 'Selected: 0 / ' + numChoices : ''}
        </div>
        <div class="modal-footer">
          <button class="btn" id="gen-pick-cancel">Cancel</button>
          <button class="btn btn-gold" id="gen-pick-confirm" ${numChoices === 1 ? '' : 'disabled'}>Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('input[name="gen-pick"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (numChoices === 1) {
          picked = [cb.value];
          modal.querySelector('#gen-pick-confirm').disabled = false;
        } else {
          if (cb.checked) picked.push(cb.value);
          else picked = picked.filter(v => v !== cb.value);
          if (picked.length > numChoices) { cb.checked = false; picked = picked.filter(v => v !== cb.value); }
          modal.querySelector('#gen-pick-count').textContent = 'Selected: ' + picked.length + ' / ' + numChoices;
          modal.querySelector('#gen-pick-confirm').disabled = picked.length !== numChoices;
        }
      });
    });
    modal.querySelector('#gen-pick-cancel').addEventListener('click', () => { modal.remove(); resolve(null); });
    modal.querySelector('#gen-pick-confirm').addEventListener('click', () => { modal.remove(); resolve(picked); });
  });
}

function applyFeatEffects(effects, resolvedChoices) {
  // resolvedChoices: object keyed by effect index -> array of chosen values
  // For backwards compatibility also accepts a plain array (old player-choice-stat path)
  const choicesMap = Array.isArray(resolvedChoices)
    ? {}  // legacy path — no longer used but safe
    : (resolvedChoices || {});

  effects.forEach((e, ei) => {
    const chosen = choicesMap[ei] || [];

    if (e.type === 'stat-bonus') {
      const amount = parseInt(e.amount || 1);
      if (e.playerChoice && chosen.length) {
        chosen.forEach(ab => {
          data.abilities[ab] = Math.min(20, (data.abilities[ab] || 10) + amount);
        });
      } else if (!e.playerChoice && e.ability) {
        data.abilities[e.ability] = Math.min(20, (data.abilities[e.ability] || 10) + amount);
      }
    }

    if (e.type === 'skill-proficiency') {
      const skillName = e.playerChoice ? chosen[0] : e.skill;
      if (skillName) {
        const camel = toCamelCase(skillName);
        data.skillProficiencies = data.skillProficiencies || [];
        if (!data.skillProficiencies.includes(camel)) data.skillProficiencies.push(camel);
      }
    }

    if (e.type === 'skill-expertise') {
      const skillName = e.playerChoice ? chosen[0] : e.skill;
      if (skillName) {
        const camel = toCamelCase(skillName);
        data.skillExpertise = data.skillExpertise || [];
        if (!data.skillExpertise.includes(camel)) data.skillExpertise.push(camel);
      }
    }

    if (e.type === 'save-proficiency') {
      const save = e.playerChoice ? chosen[0] : e.ability;
      if (save) {
        data.saveProficiencies = data.saveProficiencies || [];
        if (!data.saveProficiencies.includes(save)) data.saveProficiencies.push(save);
      }
    }

    if (e.type === 'damage-resistance') {
      const dmg = e.playerChoice ? chosen[0] : e.damageType;
      if (dmg) {
        data.damageResistances = data.damageResistances || [];
        if (!data.damageResistances.includes(dmg)) data.damageResistances.push(dmg);
      }
    }

    if (e.type === 'ac-bonus' && e.amount)         data.acBonus      = (data.acBonus || 0) + parseInt(e.amount);
    if (e.type === 'initiative-bonus' && e.amount)  data.initBonus    = (data.initBonus || 0) + parseInt(e.amount);
    if (e.type === 'speed-bonus' && e.amount)       data.speedBonus   = (data.speedBonus || 0) + parseInt(e.amount);
    if (e.type === 'condition-immunity' && e.condition) {
      data.conditionImmunities = data.conditionImmunities || [];
      if (!data.conditionImmunities.includes(e.condition)) data.conditionImmunities.push(e.condition);
    }
    // language-choice and passive/limited-use don't mutate abilities — they display on the sheet
  });
}

function toCamelCase(s) {
  return s.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase());
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showMsg(msg) {
  let el = document.getElementById('status-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'status-msg';
    el.style.cssText = 'position:fixed;bottom:1.5rem;left:1.5rem;background:var(--bg-card);border:1px solid var(--border-lit);border-radius:var(--radius);padding:0.6rem 1rem;font-size:0.85rem;z-index:998;transition:opacity 0.3s;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}
