import { getAllCharacters } from '../lib/db.js';
import { maxHP } from '../lib/calculations.js';

export async function renderDMView(container, navigate) {
  container.innerHTML = `<div style="color:var(--text-muted); padding:2rem; text-align:center;">Loading all characters…</div>`;

  let characters = [];
  try {
    characters = await getAllCharacters();
  } catch (e) {
    container.innerHTML = `<div class="card"><p style="color:var(--red)">Error: ${e.message}</p></div>`;
    return;
  }

  const rows = characters.map(c => {
    const data = c.data || {};
    const hp = data.currentHP ?? 0;
    const mhp = maxHP({ level: c.level, abilities: data.abilities || {}, classId: c.class_id });
    const pct = Math.max(0, Math.min(100, Math.round(hp / mhp * 100)));
    const archName = data.archetypeName || data.evolutionName || '';
    const conditions = (data.conditions || []).join(', ') || '—';
    const nd = data.nerveDiceCurrent ?? '?';
    const ndMax = data.nerveDiceMax ?? '?';
    const hpColor = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--gold)' : 'var(--red)';

    return `
      <div class="dm-char-row" data-id="${c.id}">
        <div style="flex:1;">
          <div class="dm-char-name">${c.name}</div>
          <div class="dm-char-meta">Level ${c.level} ${c.class_id}${archName ? ' · ' + archName : ''}</div>
        </div>
        <div style="min-width:140px;">
          <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; margin-bottom:0.3rem;">
            <span style="color:${hpColor}; font-family:var(--font-display);">${hp}/${mhp} HP</span>
          </div>
          <div style="height:4px; background:var(--border); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:${hpColor}; border-radius:999px;"></div>
          </div>
        </div>
        <div style="min-width:100px; font-size:0.85rem; color:var(--text-dim);">
          <div>Nerve: ${nd}/${ndMax}</div>
        </div>
        <div style="min-width:120px; font-size:0.82rem; color:${conditions==='—'?'var(--text-muted)':'var(--red)'};">
          ${conditions}
        </div>
        <button class="btn btn-sm btn-gold view-sheet" data-id="${c.id}">View sheet</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <div style="font-family:var(--font-display); font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.25rem;">DM View</div>
      <div style="font-family:var(--font-display); font-size:1.3rem; color:var(--gold);">All Characters</div>
    </div>
    <div class="card">
      ${characters.length === 0
        ? '<div style="color:var(--text-muted); text-align:center; padding:2rem;">No characters found.</div>'
        : rows
      }
    </div>
  `;

  container.querySelectorAll('.view-sheet').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('sheet', { characterId: btn.dataset.id });
    });
  });
  container.querySelectorAll('.dm-char-row').forEach(row => {
    row.addEventListener('click', () => navigate('sheet', { characterId: row.dataset.id }));
  });
}
