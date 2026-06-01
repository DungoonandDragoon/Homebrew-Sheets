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
  renderSheet();
}

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

  renderSheet();
}

function renderSheet() {
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
            <button class="btn btn-sm" id="hp-hitdie">Hit die (d${prog?.nerveDieSize || 10})</button>
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
    if (!isNaN(amt) && amt > 0) mutate(() => { data.currentHP = Math.max(0, (data.currentHP ?? mhp) - amt); });
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
    sendRollToDnDBeyond('Hit die', gained, `1d10 + Con (${formatMod(derived.mods.constitution)})`);
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
    tab.addEventListener('click', () => { activeTab = tab.dataset.tab; renderSheet(); });
  });

  // Render tab content
  const tc = document.getElementById('tab-content');
  if (activeTab === 'core') renderCoreTab(tc);
  else if (activeTab === 'combat') renderCombatTab(tc);
  else if (activeTab === 'nerve') renderNerveTab(tc);
  else if (activeTab === 'features') renderFeaturesTab(tc);
  else if (activeTab === 'inventory') renderInventoryTab(tc);
  else if (activeTab === 'spells') renderSpellsTab(tc);
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
  `;

  // Ability check rolls
  tc.querySelectorAll('.stat-box[data-ab]').forEach(box => {
    box.addEventListener('click', () => {
      const ab = box.dataset.ab;
      const roll = rollDie(20);
      const total = roll + derived.mods[ab];
      sendRollToDnDBeyond(`${ABILITY_LABELS[ab]} check`, total, `d20 (${roll}) ${formatMod(derived.mods[ab])}`);
    });
  });

  // Save rolls
  tc.querySelectorAll('[data-roll="save"]').forEach(row => {
    row.addEventListener('click', () => {
      const ab = row.dataset.ab;
      const roll = rollDie(20);
      const total = roll + derived.saves[ab];
      sendRollToDnDBeyond(`${ABILITY_LABELS[ab]} save`, total, `d20 (${roll}) ${formatMod(derived.saves[ab])}`);
    });
  });

  // Skill rolls
  tc.querySelectorAll('[data-roll="skill"]').forEach(row => {
    row.addEventListener('click', () => {
      const key = row.dataset.skill;
      const roll = rollDie(20);
      const total = roll + derived.skills[key];
      sendRollToDnDBeyond(`${SKILL_LABELS[key]}`, total, `d20 (${roll}) ${formatMod(derived.skills[key])}`);
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
  `;

  tc.querySelectorAll('.quick-die').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = parseInt(btn.dataset.d);
      const roll = rollDie(d);
      sendRollToDnDBeyond(`d${d}`, roll, `d${d}`);
    });
  });

  document.getElementById('roll-init')?.addEventListener('click', () => {
    const roll = rollDie(20);
    const total = roll + derived.initiativeBonus;
    sendRollToDnDBeyond('Initiative', total, `d20 (${roll}) + ${derived.initiativeBonus}`);
  });

  tc.querySelectorAll('.attack-btn-hit').forEach(btn => {
    btn.addEventListener('click', () => {
      const bonus = parseInt(btn.dataset.bonus);
      const roll = rollDie(20);
      const total = roll + bonus;
      const isCrit = roll === 20;
      sendRollToDnDBeyond(`Attack${isCrit?' (CRIT!)':''}`, total, `d20 (${roll}) ${formatMod(bonus)}`);
    });
  });

  tc.querySelectorAll('.attack-btn-dmg').forEach(btn => {
    btn.addEventListener('click', () => {
      const formula = btn.dataset.formula;
      const bonus = parseInt(btn.dataset.bonus);
      const [count, sides] = formula.split('d').map(Number);
      const { total, rolls } = rollDice(count, sides);
      const finalTotal = total + bonus;
      sendRollToDnDBeyond('Damage', finalTotal, `${formula} (${rolls.join('+')}) ${formatMod(bonus)}`);
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
      ${OUTLAW.nerveDiceOptions.filter(o => char.level >= o.levelRequired).map(o => `
        <div class="nerve-action">
          <div class="nerve-action-info">
            <div class="nerve-action-name">${o.name}</div>
            <div class="nerve-action-meta">${o.action} · ${o.description}</div>
          </div>
          <div class="nerve-cost">${o.cost} die</div>
          <button class="btn btn-sm nd-spend ${current < o.cost ? '' : 'btn-gold'}"
            data-cost="${o.cost}" data-name="${o.name}" ${current < o.cost ? 'disabled' : ''}>Use</button>
        </div>
      `).join('')}
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
      // Roll the nerve die for graze
      if (name === 'Graze') {
        const roll = rollDie(nd.dieSize);
        const total = roll + derived.mods.intelligence;
        sendRollToDnDBeyond('Graze (damage reduction)', total, `d${nd.dieSize} (${roll}) + Int (${formatMod(derived.mods.intelligence)})`);
      } else {
        showMsg(`${name} used. ${cost} Nerve ${cost === 1 ? 'Die' : 'Dice'} spent.`);
      }
    });
  });
}

// ── FEATURES TAB ──────────────────────────────────────────────────────────────
function renderFeaturesTab(tc) {
  const unlocked = getUnlockedFeatures(char.level, data.archetypeId);

  let html = `<div class="card" style="margin-bottom:1rem;">
    <div class="card-title">Class features · Level ${char.level}</div>
    ${unlocked.map(f => `
      <div class="feature-item">
        <div class="feature-name">
          ${f.name}
          <span class="feature-level">Level ${f.level}</span>
        </div>
        <div class="feature-desc">${f.description}</div>
      </div>
    `).join('')}
  </div>`;

  // Signature move picker for Gunslinger
  if (data.archetypeId === 'gunslinger' && char.level >= 7) {
    const known = data.selectedTrickShots || [];
    const shots = OUTLAW.archetypes.gunslinger.trickShots.options.filter(s => known.includes(s.id));
    html += `<div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Signature move</div>
      <div class="form-group">
        <label>Current signature move</label>
        <select class="form-select" id="sig-picker">
          <option value="">— None selected —</option>
          ${shots.map(s => `<option value="${s.id}" ${data.signatureMove===s.id?'selected':''}>${s.name} (${s.cost} die → ${Math.max(0,s.cost-1)} die)</option>`).join('')}
        </select>
      </div>
      <div style="font-size:0.85rem; color:var(--text-dim);">You can change your Signature Move on a long rest.</div>
    </div>`;
  }

  // Rune tracker for Arcane Artillerist
  if (data.archetypeId === 'arcane-artillerist' && char.level >= 7) {
    html += `<div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Runic barrel</div>
      <div class="form-group">
        <label>Active rune</label>
        <select class="form-select" id="rune-picker">
          ${['None','Flare','Force','Storm','Void'].map(r => `<option value="${r}" ${(data.runeActive||'None')===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
    </div>`;
  }

  // Upcoming features preview
  const upcoming = Object.values(OUTLAW.features).filter(f => f.level > char.level).slice(0,3);
  const archUpcoming = data.archetypeId
    ? Object.values(OUTLAW.archetypes[data.archetypeId]?.features || {}).filter(f => f.level > char.level).slice(0,3)
    : [];
  if (upcoming.length || archUpcoming.length) {
    html += `<div class="card">
      <div class="card-title">Upcoming features</div>
      ${[...upcoming, ...archUpcoming].map(f => `
        <div class="feature-item" style="opacity:0.5;">
          <div class="feature-name">${f.name} <span class="feature-level">Level ${f.level}</span></div>
          <div class="feature-desc">${f.description}</div>
        </div>
      `).join('')}
    </div>`;
  }

  tc.innerHTML = html;

  document.getElementById('sig-picker')?.addEventListener('change', e => {
    mutate(() => { data.signatureMove = e.target.value || null; });
  });
  document.getElementById('rune-picker')?.addEventListener('change', e => {
    mutate(() => { data.runeActive = e.target.value; });
  });
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
  tc.querySelector('#add-feat-btn')?.addEventListener('click', () => {
    const featId = tc.querySelector('#feat-picker')?.value;
    if (!featId) return;
    const feat = homebrew.find(h => h.id === featId);
    if (!feat) return;
    mutate(() => {
      data.feats = data.feats || [];
      if (!data.feats.find(f => f.id === featId)) {
        data.feats.push({ id: featId, name: feat.name, description: feat.data?.description || '', effects: feat.data?.effects || [] });
      }
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
      ${isASI ? `<div style="padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius); margin-bottom:0.75rem;"><strong style="color:var(--gold)">Ability Score Improvement</strong><br/><span style="font-size:0.85rem; color:var(--text-dim);">Apply your ASI in the Admin tab, or take a feat via the DM.</span></div>` : ''}
      ${isArchetype ? `<div style="padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius); margin-bottom:0.75rem;"><strong style="color:var(--gold)">Archetype feature</strong><br/><span style="font-size:0.85rem; color:var(--text-dim);">You gain a new ${data.archetypeName} feature. See Features tab.</span></div>` : ''}
      <div class="form-group" style="margin-top:0.75rem;">
        <label>Roll or enter new HP gained (d10 + Con mod ${formatMod(derived.mods.constitution)})</label>
        <div style="display:flex; gap:0.5rem;">
          <input class="form-input" type="number" id="lvlup-hp" placeholder="${Math.ceil(10/2)+1+derived.mods.constitution}" />
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

  document.getElementById('roll-hp')?.addEventListener('click', () => {
    const roll = rollDie(10) + derived.mods.constitution;
    document.getElementById('lvlup-hp').value = Math.max(1, roll);
  });

  document.getElementById('lvlup-cancel')?.addEventListener('click', () => overlay.remove());
  document.getElementById('lvlup-confirm')?.addEventListener('click', async () => {
    const hpGained = Math.max(1, parseInt(document.getElementById('lvlup-hp')?.value) || (Math.ceil(10/2)+1+derived.mods.constitution));
    mutate(() => {
      char.level = newLevel;
      data.currentHP = (data.currentHP ?? 0) + hpGained;
      data.maxHPOverride = null; // recalculate from new level
      data.nerveDiceCurrent = newProg.nerveDiceCount; // restore to new max
    });
    await saveCharacter({ ...char, data }, userId);
    overlay.remove();
    showMsg(`Leveled up to ${newLevel}! +${hpGained} HP.`);
  });
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
