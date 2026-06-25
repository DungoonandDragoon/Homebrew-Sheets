import { getAllHomebrew, saveHomebrew, deleteHomebrew } from '../lib/db.js';

const TYPES = ['feat', 'species', 'background', 'item'];

// Effect types — player-choice-stat removed; player choice is now a checkbox on any choosable effect
const EFFECT_TYPES = [
  { value: 'stat-bonus',          label: 'Ability score bonus' },
  { value: 'skill-proficiency',   label: 'Skill proficiency' },
  { value: 'skill-expertise',     label: 'Skill expertise' },
  { value: 'save-proficiency',    label: 'Saving throw proficiency' },
  { value: 'language-choice',     label: 'Language proficiency' },
  { value: 'ac-bonus',            label: 'AC bonus' },
  { value: 'initiative-bonus',    label: 'Initiative bonus' },
  { value: 'speed-bonus',         label: 'Speed bonus' },
  { value: 'damage-resistance',   label: 'Damage resistance' },
  { value: 'condition-immunity',  label: 'Condition immunity' },
  { value: 'limited-use',         label: 'Limited use ability' },
  { value: 'passive',             label: 'Passive / flavour text' },
];

// Which effect types support "player chooses" and what their option pools are
const PLAYER_CHOICE_POOLS = {
  'stat-bonus':        { label: 'Ability scores', options: ['strength','dexterity','constitution','intelligence','wisdom','charisma'] },
  'skill-proficiency': { label: 'Skills',          options: ['Acrobatics','Animal handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of hand','Stealth','Survival'] },
  'skill-expertise':   { label: 'Skills',          options: ['Acrobatics','Animal handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of hand','Stealth','Survival'] },
  'save-proficiency':  { label: 'Saving throws',   options: ['strength','dexterity','constitution','intelligence','wisdom','charisma'] },
  'damage-resistance': { label: 'Damage types',    options: ['Acid','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'] },
  'language-choice':   { label: 'Languages',       options: ['Abyssal','Aquan','Auran','Celestial','Common','Deep Speech','Draconic','Druidic','Dwarvish','Elvish','Giant','Gnomish','Goblin','Gnoll','Halfling','Ignan','Infernal','Orc','Primordial','Sylvan','Terran','Thieves Cant','Undercommon'] },
};

const ABILITIES   = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
const SKILLS      = ['Acrobatics','Animal handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of hand','Stealth','Survival'];
const DAMAGES     = ['Acid','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
const CONDITIONS  = ['Blinded','Charmed','Deafened','Exhaustion','Frightened','Grappled','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned'];
const LANGUAGES   = ['Abyssal','Aquan','Auran','Celestial','Common','Deep Speech','Draconic','Druidic','Dwarvish','Elvish','Giant','Gnomish','Goblin','Gnoll','Halfling','Ignan','Infernal','Orc','Primordial','Sylvan','Terran','Thieves Cant','Undercommon'];

export async function renderHomebrewEditor(container) {
  let items = [];
  let activeType = 'feat';
  let editingItem = null;

  async function load() {
    items = await getAllHomebrew();
  }

  // ── Effect row renderer ───────────────────────────────────────────────────
  function renderEffectRow(effect, idx, _ti, _ei, _si, _sti) {
    const typeSelect = `
      <select class="form-select eff-type" data-idx="${idx}" style="flex:0 0 auto; width:auto;">
        ${EFFECT_TYPES.map(e => `<option value="${e.value}" ${effect.type === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
      </select>`;

    const pool = PLAYER_CHOICE_POOLS[effect.type];
    const supportsChoice = !!pool;
    const isChoice = !!effect.playerChoice;

    // Build the "player choice" toggle + restriction UI when applicable
    let choiceUI = '';
    if (supportsChoice) {
      const allowedChoices = effect.allowedChoices || [];
      // Restriction checkboxes — only shown when playerChoice is checked
      const restrictionList = isChoice
        ? `<div class="choice-restrictions" data-idx="${idx}" style="margin-top:0.5rem; padding:0.5rem 0.75rem; background:var(--bg-raised); border-radius:var(--radius); border:1px solid var(--border);">
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem; font-family:var(--font-display); letter-spacing:0.05em; text-transform:uppercase;">
              Restrict options <span style="font-weight:400; text-transform:none; letter-spacing:0;">(leave all unchecked = any allowed)</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
              ${pool.options.map(opt => `
                <label style="display:flex; align-items:center; gap:0.3rem; font-size:0.82rem; padding:0.2rem 0.5rem;
                  border:1px solid ${allowedChoices.includes(opt) ? 'var(--gold-dim)' : 'var(--border)'};
                  border-radius:999px; background:${allowedChoices.includes(opt) ? 'var(--gold-glow)' : 'var(--bg-raised)'};
                  cursor:pointer; white-space:nowrap;">
                  <input type="checkbox" class="eff-restriction" data-idx="${idx}" value="${opt}"
                    ${allowedChoices.includes(opt) ? 'checked' : ''} />
                  ${opt}
                </label>
              `).join('')}
            </div>
          </div>`
        : '';

      choiceUI = `
        <div style="margin-top:0.4rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; cursor:pointer; color:var(--text-dim);">
            <input type="checkbox" class="eff-player-choice" data-idx="${idx}" ${isChoice ? 'checked' : ''} />
            <span>Player chooses ${pool.label.toLowerCase()} when this is applied</span>
          </label>
          ${restrictionList}
        </div>`;
    }

    // Build the fixed-value detail controls (hidden when playerChoice is on for the
    // types where the fixed target becomes irrelevant)
    let detail = '';
    const hideFixed = isChoice && ['stat-bonus', 'skill-proficiency', 'skill-expertise', 'save-proficiency', 'damage-resistance'].includes(effect.type);

    if (!hideFixed) {
      if (effect.type === 'stat-bonus') {
        detail = `
          <select class="form-select eff-detail" data-idx="${idx}" data-key="ability">
            ${ABILITIES.map(a => `<option value="${a}" ${effect.ability === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>`;
      } else if (effect.type === 'skill-proficiency' || effect.type === 'skill-expertise') {
        detail = `
          <select class="form-select eff-detail" data-idx="${idx}" data-key="skill">
            ${SKILLS.map(s => `<option value="${s}" ${effect.skill === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>`;
      } else if (effect.type === 'save-proficiency') {
        detail = `
          <select class="form-select eff-detail" data-idx="${idx}" data-key="ability">
            ${ABILITIES.map(a => `<option value="${a}" ${effect.ability === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>`;
      } else if (effect.type === 'damage-resistance') {
        detail = `
          <select class="form-select eff-detail" data-idx="${idx}" data-key="damageType">
            ${DAMAGES.map(d => `<option value="${d}" ${effect.damageType === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>`;
      }
    }

    // Types with no fixed target (always shown regardless of playerChoice)
    if (effect.type === 'language-choice') {
      // no fixed target — language choice is always player-driven
    } else if (['ac-bonus', 'initiative-bonus', 'speed-bonus'].includes(effect.type)) {
      detail = `
        <input class="form-input eff-detail" data-idx="${idx}" data-key="amount"
          type="number" value="${effect.amount || 1}" style="width:70px;" placeholder="Amount" />`;
    } else if (effect.type === 'condition-immunity') {
      detail = `
        <select class="form-select eff-detail" data-idx="${idx}" data-key="condition">
          ${CONDITIONS.map(c => `<option value="${c}" ${effect.condition === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>`;
    } else if (effect.type === 'limited-use') {
      detail = `
        <input class="form-input eff-detail" data-idx="${idx}" data-key="abilityName"
          value="${effect.abilityName || ''}" placeholder="Ability name" style="flex:1;" />
        <input class="form-input eff-detail" data-idx="${idx}" data-key="uses"
          type="number" value="${effect.uses || 1}" style="width:60px;" placeholder="Uses" />
        <select class="form-select eff-detail" data-idx="${idx}" data-key="recharge">
          <option value="short" ${effect.recharge === 'short' ? 'selected' : ''}>Short rest</option>
          <option value="long"  ${effect.recharge === 'long'  ? 'selected' : ''}>Long rest</option>
        </select>
        <input class="form-input eff-detail" data-idx="${idx}" data-key="description"
          value="${effect.description || ''}" placeholder="Description" style="flex:2;" />`;
    } else if (effect.type === 'passive') {
      detail = `
        <input class="form-input eff-detail" data-idx="${idx}" data-key="description"
          value="${effect.description || ''}" placeholder="Description / note" style="flex:1;" />`;
    }

    // Amount field — shown for stat-bonus and language-choice
    let amountField = '';
    if (effect.type === 'stat-bonus') {
      amountField = `
        <input class="form-input eff-detail" data-idx="${idx}" data-key="amount"
          type="number" value="${effect.amount || 1}" style="width:70px;" placeholder="+amt" />`;
    }
    if (effect.type === 'language-choice') {
      amountField = `
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--text-dim); margin-top:0.4rem;">
          <label>Number of languages the player picks:</label>
          <input class="form-input eff-detail" data-idx="${idx}" data-key="count"
            type="number" value="${effect.count || 1}" style="width:60px;" min="1" max="5" />
        </div>`;
    }

    return `
      <div class="effect-row" data-idx="${idx}" style="flex-direction:column; align-items:stretch; gap:0.4rem;">
        <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
          ${typeSelect}
          ${detail}
          ${amountField}
          <button class="btn btn-sm btn-danger eff-remove" data-idx="${idx}" style="margin-left:auto;">✕</button>
        </div>
        ${choiceUI}
      </div>`;
  }

  // ── Editor panel ──────────────────────────────────────────────────────────
  function renderEditor() {
    const item = editingItem;
    const effects = item.data.effects || [];
    const isSpecies    = activeType === 'species';
    const isBackground = activeType === 'background';
    const isItem       = activeType === 'item';

    return `
      <div class="card" style="margin-top:1.25rem;">
        <div class="card-title">${item.id ? 'Edit' : 'New'} ${activeType}</div>
        <div class="form-group">
          <label>Name</label>
          <input class="form-input" id="hb-name" value="${item.name || ''}" placeholder="Name" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-textarea" id="hb-desc">${item.data.description || ''}</textarea>
        </div>

        ${isSpecies ? `
          <div class="form-row cols-3">
            <div class="form-group">
              <label>Walking speed (ft)</label>
              <input class="form-input" type="number" id="hb-speed" value="${item.data.speed || 30}" />
            </div>
            <div class="form-group">
              <label>Darkvision (ft, 0 = none)</label>
              <input class="form-input" type="number" id="hb-darkvision" value="${item.data.darkvision || 0}" />
            </div>
            <div class="form-group">
              <label>Size</label>
              <select class="form-select" id="hb-size">
                ${['Tiny','Small','Medium','Large'].map(s => `<option value="${s}" ${item.data.size === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Named species traits (name + description + their own mechanical effects) -->
          <div style="margin-top:1rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
              <div class="card-title" style="margin:0;">Species traits</div>
              <button class="btn btn-sm" id="add-species-trait">+ Add trait</button>
            </div>
            <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.5rem;">Each trait has a name, description shown on the sheet, and optional mechanical effects applied automatically.</p>
            <div id="species-trait-list">
              ${renderSpeciesTraitList(item.data.speciesTraits || [])}
            </div>
          </div>

          <!-- Subspecies -->
          <div style="margin-top:1rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
              <div class="card-title" style="margin:0;">Subspecies (optional)</div>
              <button class="btn btn-sm" id="add-subspecies">+ Add subspecies</button>
            </div>
            <div id="subspecies-list">
              ${renderSubspeciesList(item.data.subspecies || [])}
            </div>
          </div>` : ''}

        ${isBackground ? `
          <div class="form-group">
            <label>Skill proficiencies granted (comma-separated)</label>
            <input class="form-input" id="hb-bg-skills"
              value="${(item.data.skillProficiencies || []).join(', ')}"
              placeholder="e.g. Stealth, Deception" />
          </div>
          <div class="form-group">
            <label>Tool / language proficiencies (comma-separated, optional)</label>
            <input class="form-input" id="hb-bg-tools"
              value="${(item.data.toolProficiencies || []).join(', ')}"
              placeholder="e.g. Thieves' tools" />
          </div>` : ''}

        ${isItem ? `
          <div class="form-row cols-3">
            <div class="form-group">
              <label>Item type</label>
              <select class="form-select" id="hb-item-type">
                ${['weapon','armor','shield','potion','ring','wondrous','ammunition','gear'].map(t => `<option value="${t}" ${item.data.itemType === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Damage (e.g. 1d8)</label>
              <input class="form-input" id="hb-damage" value="${item.data.damage || ''}" placeholder="1d8" />
            </div>
            <div class="form-group">
              <label>Damage type</label>
              <select class="form-select" id="hb-dmg-type">
                <option value="">—</option>
                ${DAMAGES.map(d => `<option value="${d}" ${item.data.damageType === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Attack bonus (e.g. +1 for magic weapon)</label>
              <input class="form-input" type="number" id="hb-atk-bonus" value="${item.data.attackBonus || 0}" />
            </div>
            <div class="form-group">
              <label>Damage bonus</label>
              <input class="form-input" type="number" id="hb-dmg-bonus" value="${item.data.damageBonus || 0}" />
            </div>
          </div>
          <div class="form-row cols-3">
            <div class="form-group">
              <label>Weapon type</label>
              <select class="form-select" id="hb-wpn-type">
                <option value="">—</option>
                ${['melee','ranged','firearm'].map(t => `<option value="${t}" ${item.data.weaponType === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Weapon category</label>
              <select class="form-select" id="hb-wpn-cat">
                <option value="">—</option>
                ${['simple','martial'].map(c => `<option value="${c}" ${item.data.weaponCategory === c ? 'selected' : ''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Misfire score (firearms, 0 = none)</label>
              <input class="form-input" type="number" id="hb-misfire" value="${item.data.misfireScore || 0}" />
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Range (e.g. 30/90 or 150/600)</label>
              <input class="form-input" id="hb-range" value="${item.data.range || ''}" placeholder="e.g. 30/90" />
            </div>
            <div class="form-group">
              <label>Finesse</label>
              <select class="form-select" id="hb-finesse">
                <option value="">No</option>
                <option value="true" ${item.data.finesse ? 'selected' : ''}>Yes</option>
              </select>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Base AC (armor only)</label>
              <input class="form-input" type="number" id="hb-base-ac" value="${item.data.baseAC || 0}" />
            </div>
            <div class="form-group">
              <label>Armor type</label>
              <select class="form-select" id="hb-armor-type">
                <option value="">—</option>
                ${['light','medium','heavy'].map(t => `<option value="${t}" ${item.data.armorType === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Properties (comma-separated, e.g. finesse, light, thrown)</label>
            <input class="form-input" id="hb-props" value="${(item.data.properties || []).join(', ')}" />
          </div>` : ''}

        <div style="margin-top:0.75rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
            <div class="card-title" style="margin:0;">Mechanical effects</div>
            <button class="btn btn-sm" id="add-effect">+ Add effect</button>
          </div>
          <div id="effects-list">
            ${effects.map((e, i) => renderEffectRow(e, i)).join('')}
            ${effects.length === 0
              ? '<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem 0;">No effects yet.</div>'
              : ''}
          </div>
        </div>

        <div style="display:flex; gap:0.75rem; margin-top:1.25rem;">
          <button class="btn" id="hb-cancel">Cancel</button>
          <button class="btn btn-gold" id="hb-save">Save ${activeType}</button>
        </div>
      </div>`;
  }

  // ── Species trait rendering helpers ───────────────────────────────────────
  function renderSpeciesTraitList(traits) {
    if (!traits.length) return '<div style="color:var(--text-muted); font-size:0.85rem;">No traits yet. Add one above.</div>';
    return traits.map((t, ti) => `
      <div class="effect-row st-row" data-ti="${ti}" style="flex-direction:column; border:1px solid var(--border); border-radius:var(--radius); padding:0.6rem 0.75rem; margin-bottom:0.5rem; background:var(--bg-raised);">
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.4rem;">
          <input class="form-input st-name" data-ti="${ti}" value="${t.name || ''}" placeholder="Trait name (e.g. Darkvision)" style="flex:1; font-weight:500;" />
          <button class="btn btn-sm btn-danger st-remove" data-ti="${ti}">✕</button>
        </div>
        <textarea class="form-textarea st-desc" data-ti="${ti}" placeholder="Description shown on the character sheet…" style="font-size:0.82rem; min-height:55px; margin-bottom:0.5rem;">${t.description || ''}</textarea>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.35rem; font-family:var(--font-display); letter-spacing:0.05em; text-transform:uppercase;">Mechanical effects (optional)</div>
        <div class="st-effects-list" data-ti="${ti}">
          ${(t.effects || []).map((e, ei) => renderEffectRow(e, 0, ti, ei)).join('')}
        </div>
        <button class="btn btn-sm st-add-effect" data-ti="${ti}" style="margin-top:0.35rem; align-self:flex-start;">+ Add effect</button>
      </div>
    `).join('');
  }

  function renderSubspeciesList(subs) {
    if (!subs.length) return '<div style="color:var(--text-muted); font-size:0.85rem;">No subspecies defined. This species will have no subspecies picker.</div>';
    return subs.map((sub, si) => `
      <div style="border:1px solid var(--border); border-radius:var(--radius); padding:0.6rem 0.75rem; margin-bottom:0.5rem; background:var(--bg-raised);">
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
          <input class="form-input sub-name" data-si="${si}" value="${sub.name || ''}" placeholder="Subspecies name (e.g. Hill Dwarf)" style="flex:1; font-weight:500;" />
          <button class="btn btn-sm btn-danger sub-remove" data-si="${si}">✕</button>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem; font-family:var(--font-display); letter-spacing:0.05em; text-transform:uppercase;">Subspecies traits</div>
        <div class="sub-traits-list" data-si="${si}">
          ${(sub.traits || []).map((t, sti) => `
            <div class="sub-trait-row" data-si="${si}" data-sti="${sti}" style="border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius); padding:0.5rem 0.6rem; margin-bottom:0.4rem; background:rgba(0,0,0,0.15);">
              <div style="display:flex; gap:0.4rem; align-items:center; margin-bottom:0.3rem;">
                <input class="form-input sub-trait-name" data-si="${si}" data-sti="${sti}" value="${t.name || ''}" placeholder="Trait name" style="flex:1; font-size:0.88rem;" />
                <button class="btn btn-sm btn-danger sub-trait-remove" data-si="${si}" data-sti="${sti}">✕</button>
              </div>
              <textarea class="form-textarea sub-trait-desc" data-si="${si}" data-sti="${sti}" placeholder="Trait description…" style="font-size:0.8rem; min-height:45px; margin-bottom:0.3rem;">${t.description || ''}</textarea>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem; font-family:var(--font-display); letter-spacing:0.05em; text-transform:uppercase;">Mechanical effects</div>
              <div class="sub-eff-list" data-si="${si}" data-sti="${sti}">
                ${(t.effects || []).map((e, ei) => renderEffectRow(e, 0, 0, ei, si, sti)).join('')}
              </div>
              <button class="btn btn-sm sub-add-effect" data-si="${si}" data-sti="${sti}" style="margin-top:0.25rem; align-self:flex-start; font-size:0.78rem;">+ Add effect</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-sm sub-add-trait" data-si="${si}" style="margin-top:0.35rem; font-size:0.82rem;">+ Add trait</button>
      </div>
    `).join('');
  }

  // ── Species & subspecies wiring ───────────────────────────────────────────
  function wireSubspecies(item) {
    if (!item.data) return;

    function rerenderTraits() {
      const list = document.getElementById('species-trait-list');
      if (list) list.innerHTML = renderSpeciesTraitList(item.data.speciesTraits || []);
      wireSpeciesTraitEvents();
    }
    function rerenderSubs() {
      const list = document.getElementById('subspecies-list');
      if (list) list.innerHTML = renderSubspeciesList(item.data.subspecies || []);
      wireSubspeciesEvents();
    }

    function wireSpeciesTraitEvents() {
      document.querySelectorAll('.st-name').forEach(input => {
        input.addEventListener('input', () => {
          const ti = parseInt(input.dataset.ti);
          item.data.speciesTraits = item.data.speciesTraits || [];
          item.data.speciesTraits[ti] = item.data.speciesTraits[ti] || {};
          item.data.speciesTraits[ti].name = input.value;
        });
      });
      document.querySelectorAll('.st-desc').forEach(ta => {
        ta.addEventListener('input', () => {
          const ti = parseInt(ta.dataset.ti);
          item.data.speciesTraits[ti] = item.data.speciesTraits[ti] || {};
          item.data.speciesTraits[ti].description = ta.value;
        });
      });
      document.querySelectorAll('.st-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          item.data.speciesTraits.splice(parseInt(btn.dataset.ti), 1);
          rerenderTraits();
        });
      });
      document.querySelectorAll('.st-add-effect').forEach(btn => {
        btn.addEventListener('click', () => {
          const ti = parseInt(btn.dataset.ti);
          item.data.speciesTraits[ti].effects = item.data.speciesTraits[ti].effects || [];
          item.data.speciesTraits[ti].effects.push({ type: 'passive', description: '' });
          rerenderTraits();
        });
      });
      // Wire effect rows inside each species trait
      document.querySelectorAll('.st-effects-list').forEach(container => {
        const ti = parseInt(container.dataset.ti);
        wireNestedEffectRows(
          container,
          () => (item.data.speciesTraits[ti].effects = item.data.speciesTraits[ti].effects || []),
          rerenderTraits
        );
      });
    }

    function wireSubspeciesEvents() {
      document.querySelectorAll('.sub-name').forEach(input => {
        input.addEventListener('input', () => {
          const si = parseInt(input.dataset.si);
          item.data.subspecies[si] = item.data.subspecies[si] || {};
          item.data.subspecies[si].name = input.value;
        });
      });
      document.querySelectorAll('.sub-add-trait').forEach(btn => {
        btn.addEventListener('click', () => {
          const si = parseInt(btn.dataset.si);
          item.data.subspecies[si].traits = item.data.subspecies[si].traits || [];
          item.data.subspecies[si].traits.push({ name: '', description: '', effects: [] });
          rerenderSubs();
        });
      });
      document.querySelectorAll('.sub-trait-name').forEach(input => {
        input.addEventListener('input', () => {
          const si = parseInt(input.dataset.si); const sti = parseInt(input.dataset.sti);
          item.data.subspecies[si].traits[sti].name = input.value;
        });
      });
      document.querySelectorAll('.sub-trait-desc').forEach(ta => {
        ta.addEventListener('input', () => {
          const si = parseInt(ta.dataset.si); const sti = parseInt(ta.dataset.sti);
          item.data.subspecies[si].traits[sti].description = ta.value;
        });
      });
      document.querySelectorAll('.sub-trait-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const si = parseInt(btn.dataset.si); const sti = parseInt(btn.dataset.sti);
          item.data.subspecies[si].traits.splice(sti, 1);
          rerenderSubs();
        });
      });
      document.querySelectorAll('.sub-add-effect').forEach(btn => {
        btn.addEventListener('click', () => {
          const si = parseInt(btn.dataset.si); const sti = parseInt(btn.dataset.sti);
          item.data.subspecies[si].traits[sti].effects = item.data.subspecies[si].traits[sti].effects || [];
          item.data.subspecies[si].traits[sti].effects.push({ type: 'passive', description: '' });
          rerenderSubs();
        });
      });
      // Wire effect rows inside subspecies traits
      document.querySelectorAll('.sub-eff-list').forEach(container => {
        const si = parseInt(container.dataset.si);
        const sti = parseInt(container.dataset.sti);
        wireNestedEffectRows(
          container,
          () => (item.data.subspecies[si].traits[sti].effects = item.data.subspecies[si].traits[sti].effects || []),
          rerenderSubs
        );
      });
      document.querySelectorAll('.sub-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          item.data.subspecies.splice(parseInt(btn.dataset.si), 1);
          rerenderSubs();
        });
      });
    }

    // Species trait add button
    document.getElementById('add-species-trait')?.addEventListener('click', () => {
      item.data.speciesTraits = item.data.speciesTraits || [];
      item.data.speciesTraits.push({ name: '', description: '', effects: [] });
      rerenderTraits();
    });

    // Subspecies add button
    document.getElementById('add-subspecies')?.addEventListener('click', () => {
      item.data.subspecies = item.data.subspecies || [];
      item.data.subspecies.push({ name: '', traits: [] });
      rerenderSubs();
    });

    wireSpeciesTraitEvents();
    wireSubspeciesEvents();
  }

  // Wire effect rows within a container for nested trait effects
  // getEffectsArray: function that returns the effects array to mutate
  // rerender: function to call after changes
  function wireNestedEffectRows(container, getEffectsArray, rerender) {
    container.querySelectorAll('.eff-type').forEach(sel => {
      sel.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const effects = getEffectsArray();
        const oldEff = effects[idx];
        effects[idx] = {
          type: e.target.value,
          ...(PLAYER_CHOICE_POOLS[e.target.value] && oldEff.playerChoice
            ? { playerChoice: true, allowedChoices: [] } : {}),
        };
        rerender();
      });
    });
    container.querySelectorAll('.eff-detail').forEach(input => {
      input.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const key = e.target.dataset.key;
        const effects = getEffectsArray();
        effects[idx][key] = input.type === 'number' ? (parseInt(input.value) || 0) : input.value;
      });
    });
    container.querySelectorAll('.eff-player-choice').forEach(cb => {
      cb.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const effects = getEffectsArray();
        effects[idx].playerChoice = cb.checked;
        if (!cb.checked) effects[idx].allowedChoices = [];
        rerender();
      });
    });
    container.querySelectorAll('.eff-restriction').forEach(cb => {
      cb.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const effects = getEffectsArray();
        const val = cb.value;
        const current = effects[idx].allowedChoices || [];
        effects[idx].allowedChoices = cb.checked
          ? [...current.filter(v => v !== val), val]
          : current.filter(v => v !== val);
      });
    });
    container.querySelectorAll('.eff-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        getEffectsArray().splice(idx, 1);
        rerender();
      });
    });
  }

  // ── Effect wiring ─────────────────────────────────────────────────────────
  function wireEffects(item) {
    document.getElementById('add-effect')?.addEventListener('click', () => {
      item.data.effects = item.data.effects || [];
      item.data.effects.push({ type: 'passive', description: '' });
      document.getElementById('effects-list').innerHTML =
        item.data.effects.map((e, i) => renderEffectRow(e, i)).join('');
      wireEffectRows(item);
    });
    wireEffectRows(item);
  }

  function wireEffectRows(item) {
    // Type change — reset the effect object, preserving playerChoice/allowedChoices
    document.querySelectorAll('.eff-type').forEach(sel => {
      sel.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const oldEffect = item.data.effects[idx];
        item.data.effects[idx] = {
          type: e.target.value,
          // carry over player choice settings if the new type also supports it
          ...(PLAYER_CHOICE_POOLS[e.target.value] && oldEffect.playerChoice
            ? { playerChoice: true, allowedChoices: [] }
            : {}),
        };
        document.getElementById('effects-list').innerHTML =
          item.data.effects.map((ef, i) => renderEffectRow(ef, i)).join('');
        wireEffectRows(item);
      });
    });

    // Fixed-value detail fields
    document.querySelectorAll('.eff-detail').forEach(input => {
      input.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const key = e.target.dataset.key;
        item.data.effects[idx][key] = input.type === 'number'
          ? (parseInt(input.value) || 0)
          : input.value;
      });
    });

    // Player choice checkbox
    document.querySelectorAll('.eff-player-choice').forEach(cb => {
      cb.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        item.data.effects[idx].playerChoice = cb.checked;
        if (!cb.checked) item.data.effects[idx].allowedChoices = [];
        document.getElementById('effects-list').innerHTML =
          item.data.effects.map((ef, i) => renderEffectRow(ef, i)).join('');
        wireEffectRows(item);
      });
    });

    // Restriction checkboxes (the pill buttons under player choice)
    document.querySelectorAll('.eff-restriction').forEach(cb => {
      cb.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const val = cb.value;
        const current = item.data.effects[idx].allowedChoices || [];
        if (cb.checked) {
          if (!current.includes(val)) item.data.effects[idx].allowedChoices = [...current, val];
        } else {
          item.data.effects[idx].allowedChoices = current.filter(v => v !== val);
        }
        // Re-render just the restriction pills to update highlight without full redraw
        const container = cb.closest('.choice-restrictions');
        if (container) {
          const pool = PLAYER_CHOICE_POOLS[item.data.effects[idx].type];
          const allowed = item.data.effects[idx].allowedChoices;
          container.querySelectorAll('label').forEach(label => {
            const optVal = label.querySelector('input').value;
            const isChecked = allowed.includes(optVal);
            label.style.borderColor = isChecked ? 'var(--gold-dim)' : 'var(--border)';
            label.style.background  = isChecked ? 'var(--gold-glow)' : 'var(--bg-raised)';
          });
        }
      });
    });

    // Remove button
    document.querySelectorAll('.eff-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        item.data.effects.splice(idx, 1);
        document.getElementById('effects-list').innerHTML =
          item.data.effects.map((ef, i) => renderEffectRow(ef, i)).join('');
        wireEffectRows(item);
      });
    });
  }

  // ── Full page render ──────────────────────────────────────────────────────
  async function fullRender() {
    const filtered = items.filter(i => i.type === activeType);
    const listHtml = filtered.length === 0
      ? `<div style="color:var(--text-muted); font-size:0.9rem; padding:1rem 0;">No homebrew ${activeType}s yet.</div>`
      : filtered.map(i => `
          <div class="hb-item">
            <div class="hb-item-name">${i.name}</div>
            <button class="btn btn-sm hb-edit" data-id="${i.id}">Edit</button>
            <button class="btn btn-sm btn-danger hb-del" data-id="${i.id}">Delete</button>
          </div>`).join('');

    container.innerHTML = `
      <div style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-family:var(--font-display); font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.25rem;">DM Tools</div>
          <div style="font-family:var(--font-display); font-size:1.3rem; color:var(--gold);">Homebrew Editor</div>
        </div>
        <button class="btn btn-gold" id="hb-new">+ New ${activeType}</button>
      </div>
      <div class="hb-type-tabs">
        ${TYPES.map(t => `<button class="btn ${activeType === t ? 'btn-gold' : ''} hb-tab" data-type="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}s</button>`).join('')}
      </div>
      <div class="card hb-item-list">${listHtml}</div>
      ${editingItem ? renderEditor() : ''}
    `;

    // Tab switching
    document.querySelectorAll('.hb-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeType = btn.dataset.type; editingItem = null; fullRender(); });
    });

    // New item
    document.getElementById('hb-new')?.addEventListener('click', () => {
      editingItem = { name: '', type: activeType, data: { effects: [] } };
      fullRender();
    });

    // Edit existing
    document.querySelectorAll('.hb-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        editingItem = { ...items.find(i => i.id === btn.dataset.id) };
        editingItem.data = { ...(editingItem.data || {}), effects: editingItem.data?.effects || [] };
        fullRender();
      });
    });

    // Delete
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
      wireSubspecies(item);

      document.getElementById('hb-cancel')?.addEventListener('click', () => {
        editingItem = null;
        fullRender();
      });

      document.getElementById('hb-save')?.addEventListener('click', async () => {
        item.name = document.getElementById('hb-name')?.value || '';
        item.data.description = document.getElementById('hb-desc')?.value || '';
        if (!item.name.trim()) { alert('Please enter a name.'); return; }

        if (activeType === 'species') {
          item.data.speed      = parseInt(document.getElementById('hb-speed')?.value) || 30;
          item.data.darkvision = parseInt(document.getElementById('hb-darkvision')?.value) || 0;
          item.data.size       = document.getElementById('hb-size')?.value;
          // Subspecies are saved live via wireSubspecies — no extra action needed here
        }
        if (activeType === 'background') {
          item.data.skillProficiencies = document.getElementById('hb-bg-skills')?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
          item.data.toolProficiencies  = document.getElementById('hb-bg-tools')?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
        }
        if (activeType === 'item') {
          item.data.itemType    = document.getElementById('hb-item-type')?.value;
          item.data.damage      = document.getElementById('hb-damage')?.value;
          item.data.damageType  = document.getElementById('hb-dmg-type')?.value;
          item.data.attackBonus = parseInt(document.getElementById('hb-atk-bonus')?.value) || 0;
          item.data.damageBonus = parseInt(document.getElementById('hb-dmg-bonus')?.value) || 0;
          item.data.weaponType     = document.getElementById('hb-wpn-type')?.value;
          item.data.weaponCategory = document.getElementById('hb-wpn-cat')?.value;
          item.data.misfireScore   = parseInt(document.getElementById('hb-misfire')?.value) || 0;
          item.data.range          = document.getElementById('hb-range')?.value.trim() || null;
          item.data.finesse        = document.getElementById('hb-finesse')?.value === 'true';
          item.data.baseAC      = parseInt(document.getElementById('hb-base-ac')?.value) || 0;
          item.data.armorType   = document.getElementById('hb-armor-type')?.value;
          item.data.properties  = document.getElementById('hb-props')?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
        }

        try {
          const saved = await saveHomebrew({ ...item, type: activeType });
          items = item.id
            ? items.map(i => i.id === saved.id ? saved : i)
            : [...items, saved];
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
