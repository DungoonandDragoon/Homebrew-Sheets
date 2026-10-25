import { getSession, onAuthChange, signInWithGoogle, signOut, isDM } from './lib/db.js';
import { renderLogin } from './pages/login.js';
import { renderCharacterList } from './pages/characterList.js';
import { renderCharacterCreation } from './pages/characterCreation.js';
import { renderDMView } from './pages/dmView.js';
import { renderHomebrewEditor } from './pages/homebrewEditor.js';
import { isValidWebhookUrl, buildRollBody, buildNoticeBody, postToDiscord } from './lib/discord.js';
// sheet.js is loaded lazily — only when a character is opened

// ── State ────────────────────────────────────────────────────────────────────
export const appState = {
  session: null,
  userIsDM: false,
  playerViewActive: false,   // DM can toggle to see sheet as a player would
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
  const onSheet = appState.currentPage === 'sheet';
  const navHtml = `
    <nav class="topnav">
      <div class="nav-brand">⚔ Homebrew Sheet</div>
      <div class="nav-right">
        ${appState.userIsDM ? `<button class="btn btn-sm" id="nav-dm">DM View</button>` : ''}
        ${appState.userIsDM ? `<button class="btn btn-sm" id="nav-hb">Homebrew Editor</button>` : ''}
        ${appState.userIsDM && onSheet ? `
          <button class="btn btn-sm ${appState.playerViewActive ? 'btn-gold' : ''}" id="nav-playerview" title="Toggle player view">
            ${appState.playerViewActive ? 'Player view ON' : 'Player view'}
          </button>` : ''}
        <button class="btn btn-sm" id="nav-extension" title="Optional browser extension for posting rolls to Discord">Discord Extension</button>
        <button class="btn btn-sm" id="nav-chars">My Characters</button>
        <span class="nav-user">${appState.session.user.email}</span>
        <button class="btn btn-sm btn-danger" id="nav-signout">Sign out</button>
      </div>
    </nav>
  `;

  app.innerHTML = navHtml + '<div id="ext-banner-slot"></div><div class="page" id="page-content"></div>';
  const content = document.getElementById('page-content');
  renderExtensionBanner();

  // Wire nav buttons
  async function cleanupSheet() {
    // Flush any pending (debounced) character save before we leave the sheet,
    // so a quick nav click right after an edit can't lose that edit.
    try { await window._hbsFlushSave?.(); } catch (_) { /* already surfaced in sheet.js */ }
    if (window._hbsRealtimeChannel) {
      window._hbsRealtimeChannel.unsubscribe();
      window._hbsRealtimeChannel = null;
    }
    // Never let one character's webhook stay active once its sheet is closed.
    setRollWebhook(null);
  }

  document.getElementById('nav-chars')?.addEventListener('click', async () => {
    await cleanupSheet();
    appState.playerViewActive = false;
    navigate('characters');
  });
  document.getElementById('nav-signout')?.addEventListener('click', async () => {
    await cleanupSheet();
    await signOut();
    appState.session = null;
    appState.userIsDM = false;
    appState.playerViewActive = false;
    navigate('login');
  });
  document.getElementById('nav-dm')?.addEventListener('click', async () => {
    await cleanupSheet();
    appState.playerViewActive = false;
    navigate('dm');
  });
  document.getElementById('nav-hb')?.addEventListener('click', async () => {
    await cleanupSheet();
    appState.playerViewActive = false;
    navigate('homebrew-editor');
  });
  document.getElementById('nav-playerview')?.addEventListener('click', () => {
    appState.playerViewActive = !appState.playerViewActive;
    render();
  });
  document.getElementById('nav-extension')?.addEventListener('click', () => {
    showExtensionModal();
  });

  // Render page
  switch (appState.currentPage) {
    case 'characters':
      await renderCharacterList(content, appState.session.user.id, navigate);
      break;
    case 'sheet': {
      const { renderSheet } = await import('./pages/sheet.js');
      await renderSheet(content, appState.currentCharacterId, appState.session.user.id, appState.userIsDM && !appState.playerViewActive, navigate);
      break;
    }
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

// ── Discord (per-character webhooks) ──────────────────────────────────────────
// The sheet tells us which character is open by calling setRollWebhook() with
// that character's webhook URL (or null for none). Rolls are always shown in the
// on-screen toast; if the open character has a webhook they're also posted to it.
let activeWebhook = null;

export function setRollWebhook(url) {
  activeWebhook = url && isValidWebhookUrl(url) ? url.trim() : null;
}

export function hasRollWebhook() {
  return !!activeWebhook;
}

let discordToastTimer = null;
export function showDiscordProblem(message) {
  let el = document.getElementById('discord-problem');
  if (!el) {
    el = document.createElement('div');
    el.id = 'discord-problem';
    document.body.appendChild(el);
  }
  el.textContent = '⚠ Discord: ' + message;
  el.classList.add('visible');
  clearTimeout(discordToastTimer);
  discordToastTimer = setTimeout(() => el.classList.remove('visible'), 6000);
}

function deliver(body, meta) {
  if (!activeWebhook) return;
  postToDiscord(activeWebhook, body, meta).then(result => {
    if (!result.ok) showDiscordProblem(result.error || 'The roll could not be posted.');
  });
}

// Send a roll result: toast on screen + Discord post if this character has a webhook.
export function sendRoll(label, total, breakdown, characterName) {
  showRollToast(label, total, breakdown);
  deliver(buildRollBody({ characterName, label, total, breakdown }), { label, total, character: characterName });
}

// Something that doesn't roll anything (e.g. spending Nerve Dice on Covering Fire):
// short message on screen + Discord post. `detail` is the second line.
export function sendNotice(label, detail, characterName) {
  showRollToast(label, '', detail || '');
  deliver(buildNoticeBody({ characterName, label, detail }), { label, total: '', character: characterName });
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

  onAuthChange(async (newSession, event) => {
    appState.session = newSession;
    if (newSession) {
      appState.userIsDM = await isDM(newSession.user.id);
      // Supabase fires this on routine token refreshes too — e.g. every time
      // the browser tab regains focus after being backgrounded — not just on
      // an actual sign-in. Only jump to the character list for a genuine
      // sign-in; otherwise this was wiping out whatever page (like an
      // in-progress character sheet) the person was already on.
      if (event === 'SIGNED_IN' && (appState.currentPage === 'loading' || appState.currentPage === 'login')) {
        navigate('characters');
      }
    } else {
      appState.userIsDM = false;
      navigate('login');
    }
  });
}

boot();

// ── Extension banner & modal ──────────────────────────────────────────────────

// New key (was hbs_ext_banner_dismissed) so everyone sees the Discord announcement once.
const EXT_DISMISSED_KEY = 'hbs_discord_banner_dismissed';

function renderExtensionBanner() {
  const slot = document.getElementById('ext-banner-slot');
  if (!slot) return;
  // Don't show if already dismissed
  if (localStorage.getItem(EXT_DISMISSED_KEY)) return;

  slot.innerHTML = `
    <div id="ext-banner" style="
      background: linear-gradient(90deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06));
      border-bottom: 1px solid rgba(201,168,76,0.3);
      padding: 0.6rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: var(--text-dim);
      flex-wrap: wrap;
    ">
      <span style="color:var(--gold);">⚔</span>
      <span>Post your rolls to Discord — open a character and click the <strong style="color:var(--gold)">Discord</strong> button to add a webhook (each character can use a different server).</span>
      <button id="ext-banner-cta" class="btn btn-sm" style="
        border-color: var(--gold-dim);
        color: var(--gold);
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
      ">Extension info</button>
      <button id="ext-banner-dismiss" style="
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1rem;
        margin-left: auto;
        padding: 0 0.25rem;
        line-height: 1;
      " title="Dismiss">✕</button>
    </div>
  `;

  document.getElementById('ext-banner-cta')?.addEventListener('click', () => showExtensionModal());
  document.getElementById('ext-banner-dismiss')?.addEventListener('click', () => {
    localStorage.setItem(EXT_DISMISSED_KEY, '1');
    slot.innerHTML = '';
  });
}

function showExtensionModal() {
  // Remove any existing modal
  document.getElementById('ext-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ext-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:520px;">
      <div class="modal-title">Browser Extension</div>

      <p style="font-size:0.9rem; color:var(--text-dim); margin-bottom:1rem; line-height:1.6;">
        Rolls post to Discord <strong style="color:var(--text)">without installing anything</strong> — just add a webhook to your character (see below). The <strong style="color:var(--text)">Homebrew Sheet Extension</strong> is optional: if you have it, the sheet hands your rolls to it instead of posting from the page, which can help if your browser or an ad-blocker interferes with Discord requests.
      </p>

      <div style="background:var(--bg-raised); border-radius:var(--radius); padding:1rem; margin-bottom:1rem;">
        <div style="font-family:var(--font-display); font-size:0.65rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.75rem;">How to install</div>
        <ol style="font-size:0.88rem; color:var(--text-dim); line-height:1.9; padding-left:1.25rem; margin:0;">
          <li>Download and unzip the extension folder.</li>
          <li>Open Chrome or Edge and go to <strong style="color:var(--text)">chrome://extensions</strong></li>
          <li>Enable <strong style="color:var(--text)">Developer mode</strong> (toggle in the top-right corner).</li>
          <li>Click <strong style="color:var(--text)">Load unpacked</strong> and select the unzipped extension folder.</li>
          <li>The extension icon will appear in your toolbar. Pin it for easy access.</li>
        </ol>
      </div>

      <div style="background:var(--bg-raised); border-radius:var(--radius); padding:0.75rem 1rem; margin-bottom:1.25rem; font-size:0.85rem; color:var(--text-dim); line-height:1.6;">
        <span style="color:var(--gold);">Setting up Discord:</span> In your Discord server go to <strong style="color:var(--text)">Server Settings → Integrations → Webhooks → New Webhook</strong>, choose a channel and copy the Webhook URL. Then open your character here, click <strong style="color:var(--text)">Discord</strong> in the header and paste it. Every character keeps its own webhook, so you can play different characters in different servers.
      </div>

      <div class="modal-footer" style="justify-content:space-between;">
        <a class="btn btn-gold" href="https://github.com/DungoonandDragoon/Homebrew-Sheets/raw/main/extension.zip"
          download style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
          ⬇ Download Extension
        </a>
        <button class="btn" id="ext-modal-close">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('ext-modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
