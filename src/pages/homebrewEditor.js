import { getAllHomebrew, saveHomebrew, deleteHomebrew } from '../lib/db.js';

const TYPES = ['feat','species','background','item'];

const EFFECT_TYPES = [
  { value:'stat-bonus',        label:'Ability score bonus (+X to specific stat)' },
  { value:'player-choice-stat',label:'Player choice: pick a stat to increase' },
  { value:'skill-proficiency', label:'Skill proficiency' },
  { value:'skill-expertise',   label:'Skill expertise' },
  { value:'save-proficiency',  label:'Saving throw proficiency' },
  { value:'ac-bonus',          label:'AC bonus' },
  { value:'initiative-bonus',  label:'Initiative bonus' },
  { value:'speed-bonus',       label:'Speed bonus' },
  { value:'damage-resistance', label:'Damage resistance' },
  { value:'condition-immunity',label:'Condition immunity' },
  { value:'limited-use',       label:'Limited use ability' },
  { value:'passive',           label:'Passive / flavour text' },
];

const ABILITIES = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
const SKILLS = ['Acrobatics','Animal handling','Arcana','Athletics','Deception','History',
  'Insight','Intimidation','Investigation','Medicine','Nature','Perception',
  'Performance','Persuasion','Religion','Sleight of hand','Stealth','Survival'];
const DAMAGES = ['Acid','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
const CONDITIONS = ['Blinded','Charmed','Deafened','Exhaustion','Frightened','Grappled','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned'];

export async function renderHomebrewEditor(container) {
  let items = [];
  let activeType = 'feat';
  let editingItem = null;

  async function load() {
    items = await getAllHomebrew();
  }

  function renderEffectRow(effect, idx) {
    const typeSelect = `<select class="form-select eff-type" data-idx="${idx}" style="flex:0 0 auto; width:auto;">
      ${EFFECT_TYPES.map(e => `<option value="${e.value}" ${effect.type===e.value?'selected':''}>${e.label}</option>`).join('')}
    </select>`;

    let detail = '';
    if (effect.type === 'stat-bonus') {
      detail = `<select class="form-select eff-detail" data-idx="${idx}" data-key="ability">
        ${ABILITIES.map(a => `<option value="${a}" ${effect.ability===a?'selected':''}>${a}</option>`).join('')}
      </select>
      <input class="form-input eff-detail" data-idx="${idx}" data-key="amount" type="number" value="${effect.amount||1}" style="width:70px;" placeholder="Amount" />`;
    } else if (effect.type === 'player-choice-stat') {
      detail = `
        <input class="form-input eff-detail" data-idx="${idx}" data-key="amount" type="number" value="${effect.amount||1}" style="width:70px;" placeholder="+amount" />
        <span style="font-size:0.82rem; color:var(--text-dim); margin-left:4px;">Player picks which ability when taking this feat</span>
      `;
    } else if (effect.type === 'skill-proficiency' || effect.type === 'skill-expertise') {
      detail = `<select class="form-select eff-detail" data-idx="${idx}" data-key="skill">
        ${SKILLS.map(s => `<option value="${s}" ${effect.skill===s?'selected':''}>${s}</option>`).join('')}
      </select>`;
    } else if (effect.type === 'save-proficiency') {
      detail = `<select class="form-select eff-detail" data-idx="${idx}" data-key="ability">
        ${ABILITIES.map(a => `<option value="${a}" ${effect.ability===a?'selected':''}>${a}</option>`).join('')}
      </select>`;
    } else if (['ac-bonus','initiative-bonus','speed-bonus'].includes(effect.type)) {
      detail = `<input class="form-input eff-detail" data-idx="${idx}" data-key="amount" type="number" value="${effect.amount||1}" style="width:70px;" placeholder="Amount" />`;
    } else if (effect.type === 'damage-resistance') {
      detail = `<select class="form-select eff-detail" data-idx="${idx}" data-key="damageType">
        ${DAMAGES.map(d => `<option value="${d}" ${effect.damageType===d?'selected':''}>${d}</option>`).join('')}
      </select>`;
    } else if (effect.type === 'condition-immunity') {
      detail = `<select class="form-select eff-detail" data-idx="${idx}" data-key="condition">
        ${CONDITIONS.map(c => `<option value="${c}" ${effect.condition===c?'selected':''}>${c}</option>`).join('')}
      </select>`;
    } else if (effect.type === 'limited-use') {
      detail = `
        <input class="form-input eff-detail" data-idx="${idx}" data-key="abilityName" value="${effect.abilityName||''}" placeholder="Ability name" style="flex:1;" />
        <input class="form-input eff-detail" data-idx="${idx}" data-key="uses" type="number" value="${effect.uses||1}" style="width:60px;" placeholder="Uses" />
        <select class="form-select eff-detail" data-idx="${idx}" data-key="recharge">
          <option value="short" ${effect.recharge==='short'?'selected':''}>Short rest</option>
          <option value="long" ${effect.recharge==='long'?'selected':''}>Long rest</option>
        </select>
        <input class="form-input eff-detail" data-idx="${idx}" data-key="description" value="${effect.description||''}" placeholder="Description" style="flex:2;" />
      `;
    } else {
      detail = `<input class="form-input eff-detail" data-idx="${idx}" data-key="description" value="${effect.description||''}" placeholder="Description / note" style="flex:1;" />`;
    }

    return `<div class="effect-row" data-idx="${idx}">
      ${typeSelect}
      ${detail}
      <button class="btn btn-sm btn-danger eff-remove" data-idx="${idx}">✕</button>
    </div>`;
  }

  function renderEditor() {
    const item = editingItem;
    const effects = item.data.effects || [];
    const isSpecies = activeType === 'species';
    const isBackground = activeType === 'background';

    return `
      <div class="card" style="margin-top:1.25rem;">
        <div class="card-title">${item.id ? 'Edit' : 'New'} ${activeType}</div>
        <div class="form-group">
          <label>Name</label>
          <input class="form-input" id="hb-name" value="${item.name||''}" placeholder="Name" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-textarea" id="hb-desc">${item.data.description||''}</textarea>
        </div>
        ${isSpecies ? `
          <div class="form-row cols-3">
            <div class="form-group">
              <label>Walking speed (ft)</label>
              <input class="form-input" type="number" id="hb-speed" value="${item.data.speed||30}" />
            </div>
            <div class="form-group">
              <label>Darkvision (ft, 0 = none)</label>
              <input class="form-input" type="number" id="hb-darkvision" value="${item.data.darkvision||0}" />
            </div>
            <div class="form-group">
              <label>Size</label>
              <select class="form-select" id="hb-size">
                ${['Tiny','Small','Medium','Large'].map(s=>`<option value="${s}" ${item.data.size===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        ` : ''}
        ${isBackground ? `
          <div class="form-group">
            <label>Skill proficiencies granted (comma-separated)</label>
            <input class="form-input" id="hb-bg-skills" value="${(item.data.skillProficiencies||[]).join(', ')}" placeholder="e.g. Stealth, Deception" />
          </div>
          <div class="form-group">
            <label>Tool / language proficiencies (comma-separated, optional)</label>
            <input class="form-input" id="hb-bg-tools" value="${(item.data.toolProficiencies||[]).join(', ')}" placeholder="e.g. Thieves' tools" />
          </div>
        ` : ''}
        ${activeType === 'item' ? `
          <div class="form-row cols-3">
            <div class="form-group">
              <label>Item type</label>
              <select class="form-select" id="hb-item-type">
                ${['weapon','armor','shield','potion','ring','wondrous','ammunition','gear'].map(t=>`<option value="${t}" ${item.data.itemType===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Damage (e.g. 1d8)</label>
              <input class="form-input" id="hb-damage" value="${item.data.damage||''}" placeholder="1d8" />
            </div>
            <div class="form-group">
              <label>Damage type</label>
              <select class="form-select" id="hb-dmg-type">
                <option value="">—</option>
                ${DAMAGES.map(d=>`<option value="${d}" ${item.data.damageType===d?'selected':''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Attack bonus (e.g. +1 for magic weapon)</label>
              <input class="form-input" type="number" id="hb-atk-bonus" value="${item.data.attackBonus||0}" />
            </div>
            <div class="form-group">
              <label>Damage bonus</label>
              <input class="form-input" type="number" id="hb-dmg-bonus" value="${item.data.damageBonus||0}" />
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Weapon type</label>
              <select class="form-select" id="hb-wpn-type">
                <option value="">—</option>
                ${['melee','ranged','firearm'].map(t=>`<option value="${t}" ${item.data.weaponType===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Misfire score (firearms, 0 = none)</label>
              <input class="form-input" type="number" id="hb-misfire" value="${item.data.misfireScore||0}" />
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Base AC (armor only)</label>
              <input class="form-input" type="number" id="hb-base-ac" value="${item.data.baseAC||0}" />
            </div>
            <div class="form-group">
              <label>Armor type (light/medium/heavy)</label>
              <select class="form-select" id="hb-armor-type">
                <option value="">—</option>
                ${['light','medium','heavy'].map(t=>`<option value="${t}" ${item.data.armorType===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Properties (comma-separated, e.g. finesse, light, thrown)</label>
            <input class="form-input" id="hb-props" value="${(item.data.properties||[]).join(', ')}" />
          </div>
        ` : ''}
        <div style="margin-top:0.75rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
            <div class="card-title" style="margin:0;">Mechanical effects</div>
            <button class="btn btn-sm" id="add-effect">+ Add effect</button>
          </div>
          <div id="effects-list">
            ${effects.map((e,i) => renderEffectRow(e,i)).join('')}
            ${effects.length === 0 ? '<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem 0;">No effects yet.</div>' : ''}
          </div>
        </div>
        <div style="display:flex; gap:0.75rem; margin-top:1.25rem;">
          <button class="btn" id="hb-cancel">Cancel</button>
          <button class="btn btn-gold" id="hb-save">Save ${activeType}</button>
        </div>
      </div>
    `;
  }

  function wireEffects(item) {
    document.getElementById('add-effect')?.addEventListener('click', () => {
      item.data.effects = item.data.effects || [];
      item.data.effects.push({ type: 'passive', description: '' });
      document.getElementById('effects-list').innerHTML = item.data.effects.map((e,i) => renderEffectRow(e,i)).join('');
      wireEffectRows(item);
    });
    wireEffectRows(item);
  }

  function wireEffectRows(item) {
    document.querySelectorAll('.eff-type').forEach(sel => {
      sel.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        item.data.effects[idx] = { type: e.target.value };
        document.getElementById('effects-list').innerHTML = item.data.effects.map((ef,i) => renderEffectRow(ef,i)).join('');
        wireEffectRows(item);
      });
    });
    document.querySelectorAll('.eff-detail').forEach(input => {
      input.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const key = e.target.dataset.key;
        item.data.effects[idx][key] = e.target.value;
      });
    });
    document.querySelectorAll('.eff-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        item.data.effects.splice(idx, 1);
        document.getElementById('effects-list').innerHTML = item.data.effects.map((ef,i) => renderEffectRow(ef,i)).join('');
        wireEffectRows(item);
      });
    });
  }

  async function fullRender() {
    const filtered = items.filter(i => i.type === activeType);
    const listHtml = filtered.length === 0
      ? '<div style="color:var(--text-muted); font-size:0.9rem; padding:1rem 0;">No homebrew ' + activeType + 's yet.</div>'
      : filtered.map(i => `
          <div class="hb-item">
            <div class="hb-item-name">${i.name}</div>
            <button class="btn btn-sm hb-edit" data-id="${i.id}">Edit</button>
            <button class="btn btn-sm btn-danger hb-del" data-id="${i.id}">Delete</button>
          </div>
        `).join('');

    container.innerHTML = `
      <div style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-family:var(--font-display); font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.25rem;">DM Tools</div>
          <div style="font-family:var(--font-display); font-size:1.3rem; color:var(--gold);">Homebrew Editor</div>
        </div>
        <button class="btn btn-gold" id="hb-new">+ New ${activeType}</button>
      </div>
      <div class="hb-type-tabs">
        ${TYPES.map(t => `<button class="btn ${activeType===t?'btn-gold':''} hb-tab" data-type="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}s</button>`).join('')}
      </div>
      <div class="card hb-item-list">${listHtml}</div>
      ${editingItem ? renderEditor() : ''}
    `;

    document.querySelectorAll('.hb-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeType = btn.dataset.type; editingItem = null; fullRender(); });
    });
    document.getElementById('hb-new')?.addEventListener('click', () => {
      editingItem = { name: '', type: activeType, data: { effects: [] } };
      fullRender();
    });
    document.querySelectorAll('.hb-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        editingItem = { ...items.find(i => i.id === btn.dataset.id) };
        editingItem.data = { ...(editingItem.data || {}), effects: editingItem.data?.effects || [] };
        fullRender();
      });
    });
    document.querySelectorAll('.hb-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this item?')) return;
        await deleteHomebrew(btn.dataset.id);
        items = items.filter(i => i.id !== btn.dataset.id);
        editingItem = null;
        fullRender();
      });
    });

    if (editingItem) {
      const item = editingItem;
      wireEffects(item);
      document.getElementById('hb-cancel')?.addEventListener('click', () => { editingItem = null; fullRender(); });
      document.getElementById('hb-save')?.addEventListener('click', async () => {
        item.name = document.getElementById('hb-name')?.value || '';
        item.data.description = document.getElementById('hb-desc')?.value || '';
        if (!item.name.trim()) { alert('Please enter a name.'); return; }
        if (activeType === 'species') {
          item.data.speed = parseInt(document.getElementById('hb-speed')?.value) || 30;
          item.data.darkvision = parseInt(document.getElementById('hb-darkvision')?.value) || 0;
          item.data.size = document.getElementById('hb-size')?.value;
        }
        if (activeType === 'background') {
          item.data.skillProficiencies = document.getElementById('hb-bg-skills')?.value.split(',').map(s=>s.trim()).filter(Boolean) || [];
          item.data.toolProficiencies = document.getElementById('hb-bg-tools')?.value.split(',').map(s=>s.trim()).filter(Boolean) || [];
        }
        if (activeType === 'item') {
          item.data.itemType = document.getElementById('hb-item-type')?.value;
          item.data.damage = document.getElementById('hb-damage')?.value;
          item.data.damageType = document.getElementById('hb-dmg-type')?.value;
          item.data.attackBonus = parseInt(document.getElementById('hb-atk-bonus')?.value) || 0;
          item.data.damageBonus = parseInt(document.getElementById('hb-dmg-bonus')?.value) || 0;
          item.data.weaponType = document.getElementById('hb-wpn-type')?.value;
          item.data.misfireScore = parseInt(document.getElementById('hb-misfire')?.value) || 0;
          item.data.baseAC = parseInt(document.getElementById('hb-base-ac')?.value) || 0;
          item.data.armorType = document.getElementById('hb-armor-type')?.value;
          item.data.properties = document.getElementById('hb-props')?.value.split(',').map(s=>s.trim()).filter(Boolean) || [];
        }
        try {
          const saved = await saveHomebrew({ ...item, type: activeType });
          if (item.id) {
            items = items.map(i => i.id === saved.id ? saved : i);
          } else {
            items.push(saved);
          }
          editingItem = null;
          fullRender();
        } catch (e) {
          alert('Error saving: ' + e.message);
        }
      });
    }
  }

  await load();
  await fullRender();
}
