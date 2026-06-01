import { saveCharacter, getAllHomebrew } from '../lib/db.js';
import { OUTLAW } from '../lib/classes/outlaw.js';
import { maxHP } from '../lib/calculations.js';

const CLASSES = [
  { id: 'outlaw', name: 'Outlaw', hitDie: 10, description: 'A ranged martial who wins fights through speed, nerve, and precision.' },
];

export async function renderCharacterCreation(container, userId, navigate) {
  let homebrew = [];
  try { homebrew = await getAllHomebrew(); } catch (_) {}

  const homebrewSpecies = homebrew.filter(h => h.type === 'species');
  const homebrewBackgrounds = homebrew.filter(h => h.type === 'background');

  const BUILTIN_SPECIES = [
    { id:'human', name:'Human', description:'Versatile and ambitious.' },
    { id:'elf', name:'Elf', description:'Graceful and perceptive.' },
    { id:'dwarf', name:'Dwarf', description:'Hardy and resilient.' },
    { id:'halfling', name:'Halfling', description:'Lucky and nimble.' },
    { id:'gnome', name:'Gnome', description:'Clever and inventive.' },
    { id:'half-orc', name:'Half-orc', description:'Strong and enduring.' },
    { id:'tiefling', name:'Tiefling', description:'Infernal heritage.' },
    { id:'dragonborn', name:'Dragonborn', description:'Draconic power.' },
    { id:'half-elf', name:'Half-elf', description:'Adaptable and charming.' },
  ];
  const BUILTIN_BACKGROUNDS = [
    { id:'outlander', name:'Outlander' },
    { id:'criminal', name:'Criminal' },
    { id:'soldier', name:'Soldier' },
    { id:'acolyte', name:'Acolyte' },
    { id:'folk-hero', name:'Folk hero' },
    { id:'noble', name:'Noble' },
    { id:'sage', name:'Sage' },
    { id:'charlatan', name:'Charlatan' },
    { id:'entertainer', name:'Entertainer' },
    { id:'guild-artisan', name:'Guild artisan' },
    { id:'hermit', name:'Hermit' },
    { id:'sailor', name:'Sailor' },
    { id:'urchin', name:'Urchin' },
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
  const totalSteps = 5;
  const draft = {
    name: '',
    classId: 'outlaw',
    level: 3,
    archetypeId: '',
    speciesId: '',
    backgroundId: '',
    abilities: { strength:10, dexterity:10, constitution:10, intelligence:10, wisdom:10, charisma:10 },
    skillProficiencies: [],
    saveProficiencies: ['dexterity','intelligence'],
    selectedTrickShots: [],
    currentHP: null,
    maxHPOverride: null,
    notes: '',
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
        </div>
      `;
    }

    if (step === 2) {
      html += `
        <div class="card">
          <div class="card-title">Ability scores</div>
          <p style="font-size:0.9rem; color:var(--text-dim); margin-bottom:1rem;">Enter your ability scores (after species bonuses if applicable).</p>
          <div class="form-row cols-3">
            ${['strength','dexterity','constitution','intelligence','wisdom','charisma'].map(ab => `
              <div class="form-group">
                <label>${ab.charAt(0).toUpperCase() + ab.slice(1)}</label>
                <input class="form-input" type="number" min="1" max="30" id="ab-${ab}" value="${draft.abilities[ab]}" />
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (step === 3 && draft.classId === 'outlaw') {
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

      // Gunslinger trick shots
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

    if (step === 4) {
      const cls = OUTLAW;
      const skills = cls.skillChoices.options;
      const count = cls.skillChoices.count;
      html += `
        <div class="card">
          <div class="card-title">Skill proficiencies (choose ${count})</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">
            ${skills.map(s => {
              const key = s.replace(/\s+/g,'').replace(/^./, c=>c.toLowerCase());
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
            <div><strong style="color:var(--text)">Archetype:</strong> ${draft.archetypeId || '—'}</div>
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
      document.getElementById('f-class').addEventListener('change', e => { draft.classId = e.target.value; });
      document.getElementById('f-level').addEventListener('change', e => { draft.level = parseInt(e.target.value); });
      document.getElementById('f-species').addEventListener('change', e => { draft.speciesId = e.target.value; });
      document.getElementById('f-background').addEventListener('change', e => { draft.backgroundId = e.target.value; });
    }
    if (step === 2) {
      ['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(ab => {
        document.getElementById(`ab-${ab}`)?.addEventListener('input', e => {
          draft.abilities[ab] = parseInt(e.target.value) || 10;
        });
      });
    }
    if (step === 3) {
      document.querySelectorAll('input[name="archetype"]').forEach(r => {
        r.addEventListener('change', e => { draft.archetypeId = e.target.value; renderStep(); });
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
    // Archetype only required at level 3+
    if (step === 3 && draft.level >= 3 && !draft.archetypeId) {
      alert('Please choose an archetype. If starting below level 3, set your level on step 1 first.');
      return false;
    }
    if (step === 4) {
      const count = OUTLAW.skillChoices.count;
      if (draft.skillProficiencies.length < count) { alert(`Please choose ${count} skill proficiencies.`); return false; }
      if (draft.skillProficiencies.length > count) { alert(`Please choose only ${count} skill proficiencies.`); return false; }
    }
    return true;
  }

  async function createCharacter() {
    try {
      const hp = draft.maxHPOverride || maxHP({ level: draft.level, abilities: draft.abilities, classId: draft.classId });
      const archObj = draft.archetypeId ? OUTLAW.archetypes[draft.archetypeId] : null;
      // Nerve dice only available from level 2+
      const ndMax = draft.level >= 2 ? (OUTLAW.progression.find(p => p.level === draft.level)?.nerveDiceCount || 0) : 0;
      const characterData = {
        name: draft.name,
        class_id: draft.classId,
        level: draft.level,
        data: {
          archetypeId: draft.archetypeId,
          archetypeName: archObj?.name || '',
          speciesId: draft.speciesId,
          backgroundId: draft.backgroundId,
          abilities: draft.abilities,
          skillProficiencies: draft.skillProficiencies,
          saveProficiencies: draft.saveProficiencies,
          currentHP: draft.currentHP ?? hp,
          maxHPOverride: draft.maxHPOverride,
          tempHP: 0,
          nerveDiceCurrent: ndMax,
          nerveDiceMax: ndMax,
          spellSlotsUsed: {},
          conditions: [],
          deathSaves: { successes: 0, failures: 0 },
          inventory: [],
          equippedArmorId: null,
          equippedShieldId: null,
          feats: [],
          selectedTrickShots: draft.selectedTrickShots,
          signatureMove: null,
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
