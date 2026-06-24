import { saveCharacter, getAllHomebrew } from '../lib/db.js';
import { OUTLAW } from '../lib/classes/outlaw.js';
import { MUTATOR } from '../lib/classes/mutator.js';
// Helper to get class definition by ID
function getClassDef(classId) { return classId === 'mutator' ? MUTATOR : OUTLAW; }
import { maxHP } from '../lib/calculations.js';

const CLASSES = [
  { id: 'outlaw',  name: 'Outlaw',  hitDie: 10, description: 'A ranged martial who wins fights through speed, nerve, and precision.' },
  { id: 'mutator', name: 'Mutator', hitDie: 10, description: 'A warrior of flesh and will, bending their own body into living weapons, armor, and tools of survival.' },
];

// 2014 PHB fixed ability score bonuses per species.
// Species with player-choice elements are handled separately in createCharacter().
const BUILTIN_SPECIES_BONUSES = {
  'human':      { strength:1, dexterity:1, constitution:1, intelligence:1, wisdom:1, charisma:1 },
  'elf':        { dexterity:2 },
  'dwarf':      { constitution:2 },
  'halfling':   { dexterity:2 },
  'gnome':      { intelligence:2 },
  'half-orc':   { strength:2, constitution:1 },
  'tiefling':   { charisma:2, intelligence:1 },
  'dragonborn': { strength:2, charisma:1 },
  // half-elf: +2 Cha fixed + two player-choice +1s — handled via modal in createCharacter()
};

// 2014 PHB subspecies definitions
// Each entry: { label, bonuses, traits[] }
const SUBSPECIES = {
  'dwarf': {
    'hill-dwarf':     { label: 'Hill Dwarf',     bonuses: { wisdom: 1 },    traits: [{ name: 'Dwarven Toughness', description: 'Your hit point maximum increases by 1, and increases by 1 every time you gain a level.' }] },
    'mountain-dwarf': { label: 'Mountain Dwarf', bonuses: { strength: 2 },  traits: [{ name: 'Dwarven Armor Training', description: 'Proficiency with light and medium armor.' }] },
  },
  'elf': {
    'high-elf': { label: 'High Elf', bonuses: { intelligence: 1 }, traits: [
      { name: 'Elf Weapon Training', description: 'Proficiency with longsword, shortsword, shortbow, and longbow.' },
      { name: 'Cantrip', description: 'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability.' },
      { name: 'Extra Language', description: 'You can speak, read, and write one extra language of your choice.' },
    ]},
    'wood-elf': { label: 'Wood Elf', bonuses: { wisdom: 1 }, traits: [
      { name: 'Elf Weapon Training', description: 'Proficiency with longsword, shortsword, shortbow, and longbow.' },
      { name: 'Fleet of Foot', description: 'Your base walking speed increases to 35 feet.' },
      { name: 'Mask of the Wild', description: 'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, or other natural phenomena.' },
    ]},
    'dark-elf': { label: 'Dark Elf (Drow)', bonuses: { charisma: 1 }, traits: [
      { name: 'Superior Darkvision', description: 'Your darkvision has a range of 120 feet.' },
      { name: 'Sunlight Sensitivity', description: 'Disadvantage on attack rolls and perception checks that rely on sight when you or the target is in direct sunlight.' },
      { name: 'Drow Magic', description: 'You know the Dancing Lights cantrip. At 3rd level you can cast Faerie Fire once per long rest. At 5th level you can cast Darkness once per long rest. Charisma is your spellcasting ability.' },
      { name: 'Drow Weapon Training', description: 'Proficiency with rapiers, shortswords, and hand crossbows.' },
    ]},
  },
  'halfling': {
    'lightfoot': { label: 'Lightfoot', bonuses: { charisma: 1 }, traits: [
      { name: 'Naturally Stealthy', description: 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.' },
    ]},
    'stout': { label: 'Stout', bonuses: { constitution: 1 }, traits: [
      { name: 'Stout Resilience', description: 'Advantage on saving throws against poison, and resistance to poison damage.' },
    ]},
  },
  'gnome': {
    'forest-gnome': { label: 'Forest Gnome', bonuses: { dexterity: 1 }, traits: [
      { name: 'Natural Illusionist', description: 'You know the Minor Illusion cantrip. Intelligence is your spellcasting ability.' },
      { name: 'Speak with Small Beasts', description: 'You can communicate simple ideas with Small or smaller beasts through sounds and gestures.' },
    ]},
    'rock-gnome': { label: 'Rock Gnome', bonuses: { constitution: 1 }, traits: [
      { name: "Artificer's Lore", description: 'Whenever you make a History check related to magical, alchemical, or technological items, double your proficiency bonus.' },
      { name: 'Tinker', description: "Proficiency with artisan tools (tinker's tools). You can spend 1 hour and 10gp to construct a Tiny clockwork device (AC 5, 1 HP)." },
    ]},
  },
};

// Species that need a player to pick some or all of their ASI targets
const SPECIES_WITH_CHOICES = {
  'half-elf': {
    fixed: { charisma: 2 },
    choices: { count: 2, amount: 1, exclude: ['charisma'], label: 'Half-elf: choose two other ability scores to increase by +1 each' },
  },
};

export async function renderCharacterCreation(container, userId, navigate) {
  let homebrew = [];
  try { homebrew = await getAllHomebrew(); } catch (_) {}

  const homebrewSpecies = homebrew.filter(h => h.type === 'species');
  const homebrewBackgrounds = homebrew.filter(h => h.type === 'background');

  const BUILTIN_SPECIES = [
    { id:'human',      name:'Human',      description:'Versatile and ambitious.' },
    { id:'elf',        name:'Elf',        description:'Graceful and perceptive.' },
    { id:'dwarf',      name:'Dwarf',      description:'Hardy and resilient.' },
    { id:'halfling',   name:'Halfling',   description:'Lucky and nimble.' },
    { id:'gnome',      name:'Gnome',      description:'Clever and inventive.' },
    { id:'half-orc',   name:'Half-orc',   description:'Strong and enduring.' },
    { id:'tiefling',   name:'Tiefling',   description:'Infernal heritage.' },
    { id:'dragonborn', name:'Dragonborn', description:'Draconic power.' },
    { id:'half-elf',   name:'Half-elf',   description:'+2 Cha, +1 to two other scores of your choice.' },
  ];
  const BUILTIN_BACKGROUNDS = [
    { id:'outlander',     name:'Outlander' },
    { id:'criminal',      name:'Criminal' },
    { id:'soldier',       name:'Soldier' },
    { id:'acolyte',       name:'Acolyte' },
    { id:'folk-hero',     name:'Folk hero' },
    { id:'noble',         name:'Noble' },
    { id:'sage',          name:'Sage' },
    { id:'charlatan',     name:'Charlatan' },
    { id:'entertainer',   name:'Entertainer' },
    { id:'guild-artisan', name:'Guild artisan' },
    { id:'hermit',        name:'Hermit' },
    { id:'sailor',        name:'Sailor' },
    { id:'urchin',        name:'Urchin' },
  ];

  const allSpecies = [
    ...BUILTIN_SPECIES,
    ...homebrewSpecies.map(h => ({ id: `hb_${h.id}`, name: h.name, description: 'Homebrew', data: h.data })),
  ];
  const allBackgrounds = [
    ...BUILTIN_BACKGROUNDS,
    ...homebrewBackgrounds.map(h => ({ id: `hb_${h.id}`, name: h.name })),
  ];

  let step = 1;
  const totalSteps = 6;
  const draft = {
    name: '',
    classId: 'outlaw',
    level: 3,
    archetypeId: '',
    evolutionId: '',
    speciesId: '',
    subspeciesId: '',
    backgroundId: '',
    abilities: { strength:10, dexterity:10, constitution:10, intelligence:10, wisdom:10, charisma:10 },
    skillProficiencies: [],
    saveProficiencies: ['dexterity','intelligence'],
    selectedTrickShots: [],
    currentHP: null,
    maxHPOverride: null,
    notes: '',
    equipmentChoices: {}, // keyed by choice.id → option.id
  };

  function renderStep() {
    let html = `
      <div style="max-width:600px; margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <div style="font-family:var(--font-display); font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.25rem;">Step ${step} of ${totalSteps}</div>
          <div style="height:3px; background:var(--border); border-radius:999px; margin-bottom:1.5rem;">
            <div style="height:100%; width:${(step/totalSteps)*100}%; background:var(--gold); border-radius:999px; transition:width 0.3s;"></div>
          </div>
    `;

    if (step === 1) {
      html += `
        <div class="card">
          <div class="card-title">Character basics</div>
          <div class="form-group">
            <label>Character name</label>
            <input class="form-input" id="f-name" placeholder="Enter character name" value="${draft.name}" />
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Class</label>
              <select class="form-select" id="f-class">
                ${CLASSES.map(c => `<option value="${c.id}" ${draft.classId===c.id?'selected':''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Starting level</label>
              <select class="form-select" id="f-level">
                ${Array.from({length:20},(_,i)=>i+1).map(l => `<option value="${l}" ${draft.level===l?'selected':''}>${l}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Species</label>
              <select class="form-select" id="f-species">
                <option value="">Select species</option>
                ${allSpecies.map(s => `<option value="${s.id}" ${draft.speciesId===s.id?'selected':''}>${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Background</label>
              <select class="form-select" id="f-background">
                <option value="">Select background</option>
                ${allBackgrounds.map(b => `<option value="${b.id}" ${draft.backgroundId===b.id?'selected':''}>${b.name}</option>`).join('')}
              </select>
            </div>
          </div>
          ${(() => {
            // Built-in subspecies
            if (SUBSPECIES[draft.speciesId]) {
              return `<div class="form-row cols-2">
                <div class="form-group">
                  <label>Subspecies</label>
                  <select class="form-select" id="f-subspecies">
                    <option value="">Select subspecies</option>
                    ${Object.entries(SUBSPECIES[draft.speciesId]).map(([id, s]) =>
                      `<option value="${id}" ${draft.subspeciesId===id?'selected':''}>${s.label}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>`;
            }
            // Homebrew subspecies
            const hbSp = allSpecies.find(s => s.id === draft.speciesId);
            const hbSubs = hbSp?.data?.subspecies;
            if (hbSubs?.length) {
              return `<div class="form-row cols-2">
                <div class="form-group">
                  <label>Subspecies</label>
                  <select class="form-select" id="f-subspecies">
                    <option value="">Select subspecies</option>
                    ${hbSubs.map((s, i) =>
                      `<option value="hb_sub_${i}" ${'hb_sub_'+i===draft.subspeciesId?'selected':''}>${s.name}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>`;
            }
            return '';
          })()}
        </div>
      `;
    }

    if (step === 2) {
      const COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
      const TOTAL_POINTS = 27;
      function pointsSpent(abs) {
        return Object.values(abs).reduce((sum, v) => sum + (COSTS[v] ?? 0), 0);
      }
      const spent = pointsSpent(draft.abilities);
      const remaining = TOTAL_POINTS - spent;

      const speciesFixed = BUILTIN_SPECIES_BONUSES[draft.speciesId] || {};
      const speciesChoice = SPECIES_WITH_CHOICES[draft.speciesId];
      // For display: show fixed bonuses; choice bonuses shown as "?" note
      const choiceNote = speciesChoice
        ? `<div style="margin-top:0.6rem; padding:0.5rem 0.75rem; background:var(--bg-raised); border-radius:var(--radius); font-size:0.85rem; color:var(--gold);">
            ${speciesChoice.choices.label} — you'll pick these when you click Create.
           </div>`
        : '';

      html += `
        <div class="card">
          <div class="card-title">Ability scores — point buy</div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
            <p style="font-size:0.9rem; color:var(--text-dim); margin:0;">Distribute 27 points. Scores range from 8–15 here. Species bonuses (2014 rules) are applied automatically on creation.</p>
            <div style="font-family:var(--font-display); font-size:1rem; color:${remaining === 0 ? 'var(--green)' : 'var(--gold)'}; white-space:nowrap; margin-left:1rem;">
              ${remaining} pts left
            </div>
          </div>
          ${choiceNote}
          <div class="form-row cols-3" style="margin-top:0.75rem;">
            ${['strength','dexterity','constitution','intelligence','wisdom','charisma'].map(ab => {
              const val = draft.abilities[ab];
              const bonus = speciesFixed[ab] || 0;
              const canInc = val < 15 && (remaining - ((COSTS[val+1]??99) - (COSTS[val]??0))) >= 0;
              const canDec = val > 8;
              return `
                <div style="background:var(--bg-raised); border:1px solid var(--border); border-radius:var(--radius); padding:10px 8px; text-align:center;">
                  <div class="stat-label">${ab.substring(0,3).toUpperCase()}</div>
                  <div style="font-size:1.6rem; font-weight:500; margin:6px 0;">${val}${bonus > 0 ? `<span style="font-size:1rem; color:var(--gold);"> +${bonus}</span>` : ''}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">${bonus > 0 ? `= ${val+bonus} final · ` : ''}(${val >= 8 && val <= 15 ? COSTS[val] : '?'} pts)</div>
                  <div style="display:flex; gap:4px; justify-content:center;">
                    <button class="btn btn-sm pb-dec" data-ab="${ab}" ${canDec?'':'disabled'} style="padding:2px 10px;">−</button>
                    <button class="btn btn-sm pb-inc" data-ab="${ab}" ${canInc?'':'disabled'} style="padding:2px 10px;">+</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="margin-top:1rem; padding:0.75rem; background:var(--bg-raised); border-radius:var(--radius); font-size:0.85rem; color:var(--text-dim);">
            <strong style="color:var(--text);">Manual override:</strong> if you need to set a stat above 15 or below 8 (e.g. from Deck of Many Things), use the Admin tab after character creation.
          </div>
        </div>
      `;
    }

    if (step === 3) {
      if (draft.classId === 'outlaw') {
        const archetypes = Object.values(OUTLAW.archetypes);
        html += `
          <div class="card">
            <div class="card-title">Outlaw archetype</div>
            ${draft.level >= 3 ? `
              <p style="font-size:0.9rem; color:var(--text-dim); margin-bottom:1rem;">At level 3, you choose an archetype that defines your style.</p>
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                ${archetypes.map(a => `
                  <label style="display:flex; gap:0.75rem; align-items:flex-start; cursor:pointer; padding:0.75rem; border:1px solid ${draft.archetypeId===a.id?'var(--gold-dim)':'var(--border)'}; border-radius:var(--radius); background:${draft.archetypeId===a.id?'var(--gold-glow)':'var(--bg-raised)'}; transition:all 0.15s;">
                    <input type="radio" name="archetype" value="${a.id}" ${draft.archetypeId===a.id?'checked':''} style="margin-top:0.2rem;" />
                    <div>
                      <div style="font-family:var(--font-display); font-size:0.85rem; letter-spacing:0.05em; color:var(--gold); margin-bottom:0.25rem;">${a.name}</div>
                      <div style="font-size:0.85rem; color:var(--text-dim);">${getArchetypeBlurb(a.id)}</div>
                    </div>
                  </label>
                `).join('')}
              </div>
            ` : `
              <p style="font-size:0.9rem; color:var(--text-dim);">Archetype choice unlocks at level 3. You will be prompted to choose when you reach that level.</p>
            `}
          </div>
        `;
        if (draft.archetypeId === 'gunslinger' && draft.level >= 3) {
          const shots = OUTLAW.archetypes.gunslinger.trickShots.options;
          const needed = 3 + OUTLAW.archetypes.gunslinger.trickShots.additionalLevels.filter(l => l <= draft.level).length;
          html += `
            <div class="card" style="margin-top:1rem;">
              <div class="card-title">Trick shots (choose ${needed})</div>
              ${shots.map(s => `
                <label style="display:flex; gap:0.75rem; align-items:flex-start; padding:0.5rem 0; border-bottom:1px solid var(--border); cursor:pointer;">
                  <input type="checkbox" name="trick" value="${s.id}" ${draft.selectedTrickShots.includes(s.id)?'checked':''} />
                  <div>
                    <div style="font-size:0.9rem; font-weight:500;">${s.name} <span style="color:var(--text-muted); font-size:0.8rem;">(${s.cost} die)</span></div>
                    <div style="font-size:0.82rem; color:var(--text-dim);">${s.description}</div>
                  </div>
                </label>
              `).join('')}
            </div>
          `;
        }
      }

      if (draft.classId === 'mutator') {
        const evolutions = Object.values(MUTATOR.evolutions);
        html += `
          <div class="card">
            <div class="card-title">Mutator evolution</div>
            ${draft.level >= 3 ? `
              <p style="font-size:0.9rem; color:var(--text-dim); margin-bottom:1rem;">At level 3, your biomantical powers evolve. Choose your evolution path.</p>
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                ${evolutions.map(e => `
                  <label style="display:flex; gap:0.75rem; align-items:flex-start; cursor:pointer; padding:0.75rem; border:1px solid ${draft.evolutionId===e.id?'var(--gold-dim)':'var(--border)'}; border-radius:var(--radius); background:${draft.evolutionId===e.id?'var(--gold-glow)':'var(--bg-raised)'}; transition:all 0.15s;">
                    <input type="radio" name="evolution" value="${e.id}" ${draft.evolutionId===e.id?'checked':''} style="margin-top:0.2rem;" />
                    <div>
                      <div style="font-family:var(--font-display); font-size:0.85rem; letter-spacing:0.05em; color:var(--gold); margin-bottom:0.25rem;">${e.name}</div>
                      <div style="font-size:0.85rem; color:var(--text-dim);">${e.description}</div>
                    </div>
                  </label>
                `).join('')}
              </div>
            ` : `
              <p style="font-size:0.9rem; color:var(--text-dim);">Evolution choice unlocks at level 3. You will be prompted to choose when you reach that level.</p>
            `}
          </div>
        `;
      }
    }

    if (step === 4) {
      const cls = draft.classId === 'mutator' ? MUTATOR : OUTLAW;
      const skills = cls.skillChoices.options;
      const count = cls.skillChoices.count;
      html += `
        <div class="card">
          <div class="card-title">Skill proficiencies (choose ${count})</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">
            ${skills.map(s => {
              const camel = toCamel(s);
              return `
                <label style="display:flex; gap:0.5rem; align-items:center; padding:0.4rem; border-radius:var(--radius); cursor:pointer; background:${draft.skillProficiencies.includes(camel)?'var(--gold-glow)':'transparent'};">
                  <input type="checkbox" name="skill" value="${camel}" ${draft.skillProficiencies.includes(camel)?'checked':''} />
                  <span style="font-size:0.9rem;">${s}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (step === 5) {
      const cls = getClassDef(draft.classId);
      const eq = cls.startingEquipment;
      html += `<div class="card"><div class="card-title">Starting equipment</div>`;
      if (eq?.fixed?.length) {
        html += `<div style="margin-bottom:0.75rem;">
          <div style="font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.4rem;">You always receive</div>
          <ul style="margin:0; padding-left:1.25rem; font-size:0.9rem; color:var(--text-dim); line-height:1.8;">
            ${eq.fixed.map(i => `<li>${i.quantity > 1 ? i.quantity + '× ' : ''}${i.name}</li>`).join('')}
          </ul>
        </div>`;
      }
      if (eq?.choices?.length) {
        eq.choices.forEach(choice => {
          const picked = draft.equipmentChoices[choice.id] || '';
          html += `<div style="margin-bottom:1rem;">
            <div style="font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.4rem;">${choice.label}</div>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
              ${choice.options.map(opt => `
                <label style="display:flex; gap:0.75rem; align-items:flex-start; padding:0.6rem 0.75rem;
                  border:1px solid ${picked===opt.id?'var(--gold-dim)':'var(--border)'};
                  border-radius:var(--radius); background:${picked===opt.id?'var(--gold-glow)':'var(--bg-raised)'}; cursor:pointer;">
                  <input type="radio" name="eq-${choice.id}" value="${opt.id}" ${picked===opt.id?'checked':''} style="margin-top:0.2rem;" />
                  <span style="font-size:0.9rem;">${opt.label}</span>
                </label>
              `).join('')}
            </div>
          </div>`;
        });
      }
      if (!eq) {
        html += `<p style="font-size:0.9rem; color:var(--text-dim);">This class has no defined starting equipment. Add items manually after creation via the Inventory tab.</p>`;
      }
      html += `</div>`;
    }

    if (step === 6) {
      const hp = maxHP({ level: draft.level, abilities: draft.abilities, classId: draft.classId });
      html += `
        <div class="card">
          <div class="card-title">Final details</div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label>Max HP (auto-calculated: ${hp})</label>
              <input class="form-input" type="number" id="f-hp" placeholder="${hp}" value="${draft.maxHPOverride || ''}" />
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.3rem;">Leave blank to use the calculated value above.</div>
            </div>
            <div class="form-group">
              <label>Current HP</label>
              <input class="form-input" type="number" id="f-curhp" value="${draft.currentHP ?? hp}" />
            </div>
          </div>
          <div class="form-group">
            <label>Notes / backstory</label>
            <textarea class="form-textarea" id="f-notes" placeholder="Character background, notes, anything else…">${draft.notes}</textarea>
          </div>
          <div class="card-title" style="margin-top:1rem;">Review</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.9rem; color:var(--text-dim);">
            <div><strong style="color:var(--text)">Name:</strong> ${draft.name || '—'}</div>
            <div><strong style="color:var(--text)">Class:</strong> ${draft.classId}</div>
            <div><strong style="color:var(--text)">Level:</strong> ${draft.level}</div>
            <div><strong style="color:var(--text)">Archetype/Evolution:</strong> ${draft.archetypeId || draft.evolutionId || '—'}</div>
            <div><strong style="color:var(--text)">Species:</strong> ${draft.speciesId || '—'}</div>
            <div><strong style="color:var(--text)">Background:</strong> ${draft.backgroundId || '—'}</div>
          </div>
        </div>
      `;
    }

    html += `
        <div style="display:flex; gap:0.75rem; justify-content:space-between; margin-top:1.5rem;">
          ${step > 1 ? `<button class="btn" id="step-back">← Back</button>` : `<button class="btn" id="cancel-creation">Cancel</button>`}
          ${step < totalSteps
            ? `<button class="btn btn-gold" id="step-next">Continue →</button>`
            : `<button class="btn btn-gold" id="step-finish">Create character</button>`
          }
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Wire up events per step
    if (step === 1) {
      document.getElementById('f-name').addEventListener('input', e => draft.name = e.target.value);
      document.getElementById('f-class').addEventListener('change', e => {
        draft.classId = e.target.value;
        draft.archetypeId = '';
        draft.evolutionId = '';
        draft.skillProficiencies = [];
      });
      document.getElementById('f-level').addEventListener('change', e => { draft.level = parseInt(e.target.value); });
      document.getElementById('f-species').addEventListener('change', e => {
        draft.speciesId = e.target.value;
        draft.subspeciesId = '';
        renderStep();
      });
      document.getElementById('f-subspecies')?.addEventListener('change', e => {
        draft.subspeciesId = e.target.value;
      });
      document.getElementById('f-background').addEventListener('change', e => { draft.backgroundId = e.target.value; });
    }
    if (step === 2) {
      const COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
      const TOTAL = 27;
      function spent() { return Object.values(draft.abilities).reduce((s,v) => s+(COSTS[v]??0), 0); }

      document.querySelectorAll('.pb-inc').forEach(btn => {
        btn.addEventListener('click', () => {
          const ab = btn.dataset.ab;
          const cur = draft.abilities[ab];
          if (cur >= 15) return;
          const cost = (COSTS[cur+1]??99) - (COSTS[cur]??0);
          if (spent() + cost > TOTAL) return;
          draft.abilities[ab] = cur + 1;
          renderStep();
        });
      });
      document.querySelectorAll('.pb-dec').forEach(btn => {
        btn.addEventListener('click', () => {
          const ab = btn.dataset.ab;
          if (draft.abilities[ab] <= 8) return;
          draft.abilities[ab]--;
          renderStep();
        });
      });
    }
    if (step === 3) {
      document.querySelectorAll('input[name="archetype"]').forEach(r => {
        r.addEventListener('change', e => { draft.archetypeId = e.target.value; renderStep(); });
      });
      document.querySelectorAll('input[name="evolution"]').forEach(r => {
        r.addEventListener('change', e => { draft.evolutionId = e.target.value; renderStep(); });
      });
      document.querySelectorAll('input[name="trick"]').forEach(cb => {
        cb.addEventListener('change', e => {
          if (e.target.checked) {
            draft.selectedTrickShots.push(e.target.value);
          } else {
            draft.selectedTrickShots = draft.selectedTrickShots.filter(s => s !== e.target.value);
          }
        });
      });
    }
    if (step === 4) {
      document.querySelectorAll('input[name="skill"]').forEach(cb => {
        cb.addEventListener('change', e => {
          if (e.target.checked) {
            draft.skillProficiencies.push(e.target.value);
          } else {
            draft.skillProficiencies = draft.skillProficiencies.filter(s => s !== e.target.value);
          }
        });
      });
    }
    if (step === 5) {
      const cls5 = getClassDef(draft.classId);
      (cls5.startingEquipment?.choices || []).forEach(choice => {
        document.querySelectorAll(`input[name="eq-${choice.id}"]`).forEach(r => {
          r.addEventListener('change', e => {
            draft.equipmentChoices[choice.id] = e.target.value;
            renderStep();
          });
        });
      });
    }

    if (step === 6) {
      document.getElementById('f-hp')?.addEventListener('input', e => {
        draft.maxHPOverride = e.target.value ? parseInt(e.target.value) : null;
      });
      document.getElementById('f-curhp')?.addEventListener('input', e => {
        draft.currentHP = parseInt(e.target.value);
      });
      document.getElementById('f-notes')?.addEventListener('input', e => { draft.notes = e.target.value; });
    }

    document.getElementById('step-back')?.addEventListener('click', () => { step--; renderStep(); });
    document.getElementById('cancel-creation')?.addEventListener('click', () => navigate('characters'));
    document.getElementById('step-next')?.addEventListener('click', () => {
      if (!validateStep()) return;
      step++;
      renderStep();
    });
    document.getElementById('step-finish')?.addEventListener('click', async () => {
      if (!validateStep()) return;
      await createCharacter();
    });
  }

  function validateStep() {
    if (step === 1 && !draft.name.trim()) { alert('Please enter a character name.'); return false; }
    if (step === 3 && draft.level >= 3) {
      if (draft.classId === 'outlaw' && !draft.archetypeId) {
        alert('Please choose an archetype. If starting below level 3, set your level on step 1 first.');
        return false;
      }
      if (draft.classId === 'mutator' && !draft.evolutionId) {
        alert('Please choose an evolution. If starting below level 3, set your level on step 1 first.');
        return false;
      }
    }
    if (step === 4) {
      const count = (draft.classId === 'mutator' ? MUTATOR : OUTLAW).skillChoices.count;
      if (draft.skillProficiencies.length < count) { alert(`Please choose ${count} skill proficiencies.`); return false; }
      if (draft.skillProficiencies.length > count) { alert(`Please choose only ${count} skill proficiencies.`); return false; }
    }
    return true;
  }

  async function createCharacter() {
    try {
      const finalAbilities = { ...draft.abilities };

      // Apply fixed species ASI bonuses (2014 PHB)
      const builtinBonuses = BUILTIN_SPECIES_BONUSES[draft.speciesId];
      if (builtinBonuses) {
        for (const [ab, bonus] of Object.entries(builtinBonuses)) {
          finalAbilities[ab] = Math.min(20, (finalAbilities[ab] || 10) + bonus);
        }
      }

      // Apply subspecies ASI bonuses
      if (draft.subspeciesId && SUBSPECIES[draft.speciesId]?.[draft.subspeciesId]) {
        const subBonuses = SUBSPECIES[draft.speciesId][draft.subspeciesId].bonuses || {};
        for (const [ab, bonus] of Object.entries(subBonuses)) {
          finalAbilities[ab] = Math.min(20, (finalAbilities[ab] || 10) + bonus);
        }
      }

      // Apply fixed portion of choice-based species, then prompt for the rest
      const speciesChoice = SPECIES_WITH_CHOICES[draft.speciesId];
      if (speciesChoice) {
        // Apply fixed bonuses first (e.g. half-elf's guaranteed +2 Cha)
        if (speciesChoice.fixed) {
          for (const [ab, bonus] of Object.entries(speciesChoice.fixed)) {
            finalAbilities[ab] = Math.min(20, (finalAbilities[ab] || 10) + bonus);
          }
        }
        // Prompt for player choices
        const { count, amount, exclude, label } = speciesChoice.choices;
        const chosen = await showSpeciesStatPickerModal(label, finalAbilities, count, amount, exclude);
        if (!chosen) return; // player cancelled
        for (const ab of chosen) {
          finalAbilities[ab] = Math.min(20, (finalAbilities[ab] || 10) + amount);
        }
      }

      // Apply homebrew species effects — handles fixed values and player-choice effects
      const hbSpecies = homebrew.find(h => h.type === 'species' && (`hb_${h.id}` === draft.speciesId || h.id === draft.speciesId));
      if (hbSpecies?.data?.effects) {
        for (const e of hbSpecies.data.effects) {

          // ── Ability score bonus ──────────────────────────────────────────
          if (e.type === 'stat-bonus') {
            const amount = parseInt(e.amount || 1);
            if (e.playerChoice) {
              // Player picks which ability; allowedChoices restricts the pool (empty = any)
              const pool = e.allowedChoices?.length ? e.allowedChoices
                : ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
              const label = `${hbSpecies.name}: choose an ability score to increase by +${amount}`;
              const chosen = await showSpeciesStatPickerModal(label, finalAbilities, 1, amount, [], pool);
              if (!chosen) return;
              for (const ab of chosen) finalAbilities[ab] = Math.min(20, (finalAbilities[ab] || 10) + amount);
            } else if (e.ability) {
              finalAbilities[e.ability] = Math.min(20, (finalAbilities[e.ability] || 10) + amount);
            }
          }

          // ── Skill proficiency (player choice) ───────────────────────────
          if ((e.type === 'skill-proficiency' || e.type === 'skill-expertise') && e.playerChoice) {
            const pool = e.allowedChoices?.length ? e.allowedChoices : null;
            // Store the choice to apply after character creation — handled by character sheet
            // We record it in draft so it lands in data on save
            if (!draft.pendingSkillChoices) draft.pendingSkillChoices = [];
            draft.pendingSkillChoices.push({ type: e.type, pool, source: hbSpecies.name });
          }

          // ── Language choice ──────────────────────────────────────────────
          if (e.type === 'language-choice') {
            // Language picks happen on the Features tab of the sheet, not at creation
            // Just record how many picks are granted; the pool is stored in the effect
            // Nothing to do here — sheet.js reads the homebrew effect directly
          }

          // ── Save proficiency (player choice) ────────────────────────────
          if (e.type === 'save-proficiency' && e.playerChoice) {
            const pool = e.allowedChoices?.length ? e.allowedChoices
              : ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
            const label = `${hbSpecies.name}: choose a saving throw proficiency`;
            const chosen = await showSpeciesStatPickerModal(label, {}, 1, 0, [], pool);
            if (!chosen) return;
            if (!draft.saveProficiencies.includes(chosen[0])) draft.saveProficiencies.push(chosen[0]);
          } else if (e.type === 'save-proficiency' && e.ability) {
            if (!draft.saveProficiencies.includes(e.ability)) draft.saveProficiencies.push(e.ability);
          }

          // ── Damage resistance (player choice) ───────────────────────────
          if (e.type === 'damage-resistance' && e.playerChoice) {
            const pool = e.allowedChoices?.length ? e.allowedChoices
              : ['Acid','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
            const label = `${hbSpecies.name}: choose a damage type to be resistant to`;
            const chosen = await showSpeciesStatPickerModal(label, {}, 1, 0, [], pool);
            if (!chosen) return;
            if (!draft.damageResistances) draft.damageResistances = [];
            draft.damageResistances.push(chosen[0]);
          } else if (e.type === 'damage-resistance' && e.damageType) {
            if (!draft.damageResistances) draft.damageResistances = [];
            draft.damageResistances.push(e.damageType);
          }
        }
      }

      const classHitDie = draft.classId === 'mutator' ? MUTATOR.hitDie : (OUTLAW.hitDie || 10);
      // Build starting inventory from equipment choices
      const startingInventory = [];
      const classDef = getClassDef(draft.classId);
      const eqDef = classDef.startingEquipment;
      if (eqDef) {
        // Fixed items
        (eqDef.fixed || []).forEach(item => {
          for (let q = 0; q < (item.quantity || 1); q++) {
            startingInventory.push({
              id: crypto.randomUUID(),
              name: item.name,
              damage: item.damage || null,
              damageType: item.damageType || null,
              weaponType: item.weaponType || null,
              baseAC: item.baseAC || null,
              armorType: item.armorType || null,
              quantity: 1,
              equipped: false,
            });
          }
        });
        // Chosen items
        (eqDef.choices || []).forEach(choice => {
          const pickedId = draft.equipmentChoices[choice.id];
          const opt = choice.options.find(o => o.id === pickedId) || choice.options[0];
          (opt?.items || []).forEach(item => {
            for (let q = 0; q < (item.quantity || 1); q++) {
              startingInventory.push({
                id: crypto.randomUUID(),
                name: item.name,
                damage: item.damage || null,
                damageType: item.damageType || null,
                weaponType: item.weaponType || null,
                baseAC: item.baseAC || null,
                armorType: item.armorType || null,
                quantity: 1,
                equipped: false,
              });
            }
          });
        });
      }

      const hp = draft.maxHPOverride || maxHP({ level: draft.level, abilities: finalAbilities, classId: draft.classId, classHitDie });
      const archObj = draft.classId === 'outlaw' && draft.archetypeId ? OUTLAW.archetypes[draft.archetypeId] : null;
      const evoObj  = draft.classId === 'mutator' && draft.evolutionId ? MUTATOR.evolutions[draft.evolutionId] : null;
      const ndMax = draft.classId === 'outlaw' && draft.level >= 2
        ? (OUTLAW.progression.find(p => p.level === draft.level)?.nerveDiceCount || 0) : 0;
      const mutProg = draft.classId === 'mutator'
        ? MUTATOR.progression.find(p => p.level === draft.level) : null;

      const characterData = {
        name: draft.name,
        class_id: draft.classId,
        level: draft.level,
        data: {
          archetypeId: draft.archetypeId,
          archetypeName: archObj?.name || '',
          evolutionId: draft.evolutionId,
          evolutionName: evoObj?.name || '',
          speciesId: draft.speciesId,
          subspeciesId: draft.subspeciesId || null,
          backgroundId: draft.backgroundId,
          abilities: finalAbilities,
          skillProficiencies: draft.skillProficiencies,
          saveProficiencies: draft.classId === 'mutator'
            ? ['constitution','intelligence']
            : draft.saveProficiencies,
          currentHP: draft.currentHP ?? hp,
          maxHPOverride: draft.maxHPOverride,
          tempHP: 0,
          nerveDiceCurrent: ndMax,
          nerveDiceMax: ndMax,
          spellSlotsUsed: {},
          conditions: [],
          deathSaves: { successes: 0, failures: 0 },
          inventory: startingInventory,
          equippedArmorId: null,
          equippedShieldId: null,
          feats: [],
          selectedTrickShots: draft.selectedTrickShots,
          signatureMove: null,
          // Mutator resources
          knownMutations: [],
          activeMutations: [],
          bioshockedMutations: [],
          biomassUsed: 0,
          bioshocksUsed: 0,
          mutatorSpellSlotsUsed: {},
          mutatorSpellNotes: '',
          recklessFusillade: { used: 0 },
          legendaryDuel: { used: false },
          runeActive: 'None',
          notes: draft.notes,
          currency: { gp: 0, sp: 0, cp: 0 },
          preparedSpells: [],
          knownSpells: [],
          cantrips: [],
        },
      };
      const saved = await saveCharacter(characterData, userId);
      navigate('sheet', { characterId: saved.id });
    } catch (e) {
      alert('Error creating character: ' + e.message);
    }
  }

  renderStep();
}

// ── Species stat picker modal ─────────────────────────────────────────────────
// Shows a modal asking the player to pick `numChoices` ability scores to
// increase by `amount`, excluding any in `exclude`. Returns a Promise that
// resolves to an array of chosen ability names, or null if cancelled.
function showSpeciesStatPickerModal(label, currentAbilities, numChoices, amount, exclude, pool) {
  return new Promise(resolve => {
    const ALL_ABILITIES = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
    // If an explicit pool is provided, use it (e.g. restricted homebrew choices).
    // Otherwise filter from all abilities excluding `exclude`.
    const available = pool
      ? pool.filter(opt => !exclude.includes(opt) && (currentAbilities[opt] === undefined || (currentAbilities[opt] || 10) < 20))
      : ALL_ABILITIES.filter(ab => !exclude.includes(ab) && (currentAbilities[ab] || 10) < 20);
    let picked = [];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-title">Species ability score increase</div>
        <p style="font-size:0.88rem; color:var(--text-dim); margin-bottom:1rem;">${label}</p>
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${available.map(ab => {
            const cur = currentAbilities[ab] || 10;
            return `
              <label style="display:flex; gap:0.75rem; align-items:center; padding:0.5rem; border-radius:var(--radius); cursor:pointer; border:1px solid var(--border);">
                <input type="checkbox" name="species-pick" value="${ab}" />
                <span style="flex:1; text-transform:capitalize;">${ab}</span>
                <span style="color:var(--text-muted); font-size:0.9rem;">${cur} → ${Math.min(20, cur + amount)}</span>
              </label>
            `;
          }).join('')}
        </div>
        <div id="species-pick-count" style="font-size:0.85rem; color:var(--gold); margin-top:0.75rem;">Selected: 0 / ${numChoices}</div>
        <div class="modal-footer">
          <button class="btn" id="species-pick-cancel">Cancel</button>
          <button class="btn btn-gold" id="species-pick-confirm" disabled>Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('input[name="species-pick"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) picked.push(cb.value);
        else picked = picked.filter(v => v !== cb.value);
        // Don't allow picking more than numChoices
        if (picked.length > numChoices) {
          cb.checked = false;
          picked = picked.filter(v => v !== cb.value);
        }
        modal.querySelector('#species-pick-count').textContent = `Selected: ${picked.length} / ${numChoices}`;
        modal.querySelector('#species-pick-confirm').disabled = picked.length !== numChoices;
      });
    });

    modal.querySelector('#species-pick-cancel').addEventListener('click', () => { modal.remove(); resolve(null); });
    modal.querySelector('#species-pick-confirm').addEventListener('click', () => { modal.remove(); resolve(picked); });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getArchetypeBlurb(id) {
  const blurbs = {
    'arcane-artillerist': 'Channels arcane energy through firearms, adding spell power to every shot.',
    'gunslinger': 'A showman of marksmanship with a toolkit of Trick Shots for every situation.',
    'desperado': 'Relentless aggression and frontier fortitude — attacks with advantage and refuses to fall.',
  };
  return blurbs[id] || '';
}

function toCamel(s) {
  return s.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase());
}
