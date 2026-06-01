import { getSession, onAuthChange, signInWithGoogle, signOut, isDM } from './lib/db.js';
import { renderLogin } from './pages/login.js';
import { renderCharacterList } from './pages/characterList.js';
import { renderSheet } from './pages/sheet.js';
import { renderCharacterCreation } from './pages/characterCreation.js';
import { renderDMView } from './pages/dmView.js';
import { renderHomebrewEditor } from './pages/homebrewEditor.js';

// ── State ────────────────────────────────────────────────────────────────────
export const appState = {
  session: null,
  userIsDM: false,
  currentPage: 'loading',
  currentCharacterId: null,
};

// ── Navigation ───────────────────────────────────────────────────────────────
export function navigate(page, params = {}) {
  appState.currentPage = page;
  if (params.characterId !== undefined) appState.currentCharacterId = params.characterId;
  render();
}

// ── Render ───────────────────────────────────────────────────────────────────
async function render() {
  const app = document.getElementById('app');

  if (!appState.session) {
    app.innerHTML = '';
    renderLogin(app, { onSignIn: signInWithGoogle });
    return;
  }

  // Build nav
  const navHtml = `
    <nav class="topnav">
      <div class="nav-brand">⚔ Homebrew Sheet</div>
      <div class="nav-right">
        ${appState.userIsDM ? `<button class="btn btn-sm" id="nav-dm">DM View</button>` : ''}
        ${appState.userIsDM ? `<button class="btn btn-sm" id="nav-hb">Homebrew Editor</button>` : ''}
        <button class="btn btn-sm" id="nav-chars">My Characters</button>
        <span class="nav-user">${appState.session.user.email}</span>
        <button class="btn btn-sm btn-danger" id="nav-signout">Sign out</button>
      </div>
    </nav>
  `;

  app.innerHTML = navHtml + '<div class="page" id="page-content"></div>';
  const content = document.getElementById('page-content');

  // Wire nav buttons
  document.getElementById('nav-chars')?.addEventListener('click', () => navigate('characters'));
  document.getElementById('nav-signout')?.addEventListener('click', async () => {
    await signOut();
    appState.session = null;
    appState.userIsDM = false;
    navigate('login');
  });
  document.getElementById('nav-dm')?.addEventListener('click', () => navigate('dm'));
  document.getElementById('nav-hb')?.addEventListener('click', () => navigate('homebrew-editor'));

  // Render page
  switch (appState.currentPage) {
    case 'characters':
      await renderCharacterList(content, appState.session.user.id, navigate);
      break;
    case 'sheet':
      await renderSheet(content, appState.currentCharacterId, appState.session.user.id, appState.userIsDM, navigate);
      break;
    case 'new-character':
      await renderCharacterCreation(content, appState.session.user.id, navigate);
      break;
    case 'dm':
      if (appState.userIsDM) await renderDMView(content, navigate);
      else navigate('characters');
      break;
    case 'homebrew-editor':
      if (appState.userIsDM) await renderHomebrewEditor(content);
      else navigate('characters');
      break;
    default:
      navigate('characters');
  }
}

// ── Roll toast ────────────────────────────────────────────────────────────────
let toastTimer = null;
export function showRollToast(label, total, breakdown) {
  let toast = document.getElementById('roll-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'roll-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="toast-label">${label}</div>
    <div class="toast-result">${total}</div>
    <div class="toast-breakdown">${breakdown}</div>
  `;
  toast.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}

// Roll a die and optionally send to extension
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(count, sides) {
  let total = 0, rolls = [];
  for (let i = 0; i < count; i++) {
    const r = rollDie(sides);
    rolls.push(r);
    total += r;
  }
  return { total, rolls };
}

// Send roll result to DnDBeyond via extension
export function sendRollToDnDBeyond(label, total, breakdown) {
  window.postMessage({
    type: 'HOMEBREW_SHEET_ROLL',
    payload: { label, total, breakdown, timestamp: Date.now() },
  }, '*');
  showRollToast(label, total, breakdown);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  const session = await getSession();
  appState.session = session;
  if (session) {
    appState.userIsDM = await isDM(session.user.id);
    navigate('characters');
  } else {
    navigate('login');
  }

  onAuthChange(async (newSession) => {
    appState.session = newSession;
    if (newSession) {
      appState.userIsDM = await isDM(newSession.user.id);
      navigate('characters');
    } else {
      appState.userIsDM = false;
      navigate('login');
    }
  });
}

boot();
