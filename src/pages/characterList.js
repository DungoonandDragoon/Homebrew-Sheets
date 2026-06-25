import { getMyCharacters, deleteCharacter } from '../lib/db.js';
import { maxHP } from '../lib/calculations.js';

export async function renderCharacterList(container, userId, navigate) {
  container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading characters…</div>`;

  let characters = [];
  try {
    characters = await getMyCharacters(userId);
  } catch (e) {
    container.innerHTML = `<div class="card"><p style="color:var(--red)">Error loading characters: ${e.message}</p></div>`;
    return;
  }

  function render() {
    const grid = characters.map(c => {
      const data = c.data || {};
      const hp = data.currentHP ?? maxHP({ level: c.level, abilities: data.abilities || {}, classId: c.class_id });
      const mhp = maxHP({ level: c.level, abilities: data.abilities || {}, classId: c.class_id });
      const pct = Math.max(0, Math.min(100, Math.round(hp / mhp * 100)));
      const subclassName = data.archetypeName || data.evolutionName || '';
      return `
        <div class="char-card" data-id="${c.id}">
          <div class="char-card-name">${c.name}</div>
          <div class="char-card-meta">Level ${c.level} ${c.class_id.charAt(0).toUpperCase() + c.class_id.slice(1)}${subclassName ? ' · ' + subclassName : ''}</div>
          <div class="char-card-hp">
            <span>${hp} / ${mhp} HP</span>
            <div class="hp-bar-mini"><div class="hp-bar-mini-fill" style="width:${pct}%"></div></div>
          </div>
          <div style="margin-top:0.75rem; display:flex; gap:0.4rem">
            <button class="btn btn-sm btn-gold char-open" data-id="${c.id}" style="flex:1">Open sheet</button>
            <button class="btn btn-sm btn-danger char-delete" data-id="${c.id}" title="Delete character">✕</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;">
        <div>
          <div style="font-family:var(--font-display); font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.25rem;">Your Characters</div>
          <div style="font-family:var(--font-display); font-size:1.3rem; color:var(--gold);">Character Roster</div>
        </div>
        <button class="btn btn-gold" id="new-char-btn">+ New character</button>
      </div>
      <div class="char-grid">
        ${grid}
        <div class="char-card new-char-card" id="new-char-card">
          <span>+ New Character</span>
        </div>
      </div>
    `;

    document.getElementById('new-char-btn')?.addEventListener('click', () => navigate('new-character'));
    document.getElementById('new-char-card')?.addEventListener('click', () => navigate('new-character'));

    container.querySelectorAll('.char-open').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate('sheet', { characterId: btn.dataset.id });
      });
    });

    container.querySelectorAll('.char-card').forEach(card => {
      if (!card.dataset.id) return; // skip new-char-card which has no id
      card.addEventListener('click', () => navigate('sheet', { characterId: card.dataset.id }));
    });

    container.querySelectorAll('.char-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this character? This cannot be undone.')) return;
        try {
          await deleteCharacter(btn.dataset.id);
          characters = characters.filter(c => c.id !== btn.dataset.id);
          render();
        } catch (err) {
          alert('Error deleting character: ' + err.message);
        }
      });
    });
  }

  render();
}
