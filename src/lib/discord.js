// ─────────────────────────────────────────────────────────────────────────────
// Discord roll posting
//
// Every character can have its own Discord webhook URL (stored on the character
// as data.discordWebhook), so one player can run characters in several
// different servers.
//
// Delivery:
//   1. If the Homebrew Sheet browser extension is installed, the message is
//      handed to it (bridge.js → background.js) and the extension posts it.
//   2. If the extension isn't there (or is an old version that doesn't know
//      about Discord), the sheet posts to the webhook itself from the browser.
// Either way the player doesn't have to do anything different.
//
// All message formatting lives here, NOT in the extension. The extension is a
// dumb pipe, so changing how rolls look never needs players to reinstall it.
// ─────────────────────────────────────────────────────────────────────────────

// https://discord.com/api/webhooks/<id>/<token>  (ptb./canary./discordapp.com variants,
// optional /v10 style version segment, optional ?thread_id= for forum/thread posting)
const WEBHOOK_RE = /^https:\/\/(?:(?:ptb|canary)\.)?(?:discord|discordapp)\.com\/api\/(?:v\d+\/)?webhooks\/\d+\/[\w-]+(?:\?thread_id=\d+)?$/;

export function isValidWebhookUrl(url) {
  return typeof url === 'string' && WEBHOOK_RE.test(url.trim());
}

const GOLD = 0xc9a84c;

function clip(str, max) {
  const s = String(str ?? '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// Discord refuses webhook usernames that contain "discord" or "clyde", and they
// must be 1–80 characters. Fall back to a neutral name rather than failing the post.
function safeUsername(name) {
  const n = clip(String(name || '').trim(), 80);
  if (!n || /discord|clyde/i.test(n)) return 'Homebrew Sheet';
  return n;
}

// A dice roll: title = what was rolled, big number = the total, footer = the math.
export function buildRollBody({ characterName, label, total, breakdown }) {
  return {
    username: safeUsername(characterName),
    // Never let a roll label / character name ping @everyone, roles or users.
    allowed_mentions: { parse: [] },
    embeds: [{
      title: clip(label, 256),
      description: `**${clip(total, 100)}**`,
      color: GOLD,
      footer: breakdown ? { text: clip(breakdown, 2048) } : undefined,
      timestamp: new Date().toISOString(),
    }],
  };
}

// An announcement with nothing to roll (e.g. "Covering Fire — 2 Nerve Dice, DC 14").
export function buildNoticeBody({ characterName, label, detail }) {
  return {
    username: safeUsername(characterName),
    allowed_mentions: { parse: [] },
    embeds: [{
      title: clip(label, 256),
      description: detail ? clip(detail, 4000) : undefined,
      color: GOLD,
      timestamp: new Date().toISOString(),
    }],
  };
}

// ── Transport 1: via the browser extension ───────────────────────────────────
// bridge.js answers every request with an immediate HBS_BRIDGE_ACK (so we know
// the extension has it and must NOT also post directly), then a later
// HBS_DISCORD_RESULT with the outcome. No ACK within ~500ms → no extension.
function sendViaExtension(webhookUrl, body, meta) {
  return new Promise(resolve => {
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random();
    let done = false;
    let ackTimer = null;
    let resultTimer = null;

    function finish(result) {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(ackTimer);
      clearTimeout(resultTimer);
      resolve(result);
    }
    function onMessage(e) {
      if (e.source !== window || !e.data || e.data.id !== id) return;
      if (e.data.type === 'HBS_BRIDGE_ACK') {
        clearTimeout(ackTimer);
      } else if (e.data.type === 'HBS_DISCORD_RESULT') {
        finish({ handled: true, ok: !!e.data.ok, status: e.data.status, error: e.data.error });
      }
    }

    window.addEventListener('message', onMessage);
    ackTimer = setTimeout(() => finish({ handled: false }), 500);
    resultTimer = setTimeout(() => finish({ handled: true, ok: false, error: 'The extension did not respond.' }), 15000);
    window.postMessage({ type: 'HBS_DISCORD_SEND', id, webhookUrl, body, meta }, window.location.origin);
  });
}

// ── Transport 2: straight from the page ──────────────────────────────────────
async function sendDirect(webhookUrl, body) {
  async function attempt() {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res;
  }
  try {
    let res = await attempt();
    if (res.status === 429) {
      // Rate limited — Discord says how long to wait. One polite retry.
      let wait = 1000;
      try { wait = Math.min(5000, Math.ceil(((await res.json()).retry_after || 1) * 1000)); } catch (_) { /* default */ }
      await new Promise(r => setTimeout(r, wait));
      res = await attempt();
    }
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status, error: explainStatus(res.status) };
  } catch (e) {
    return { ok: false, error: 'Could not reach Discord (network error or the browser blocked the request).' };
  }
}

export function explainStatus(status) {
  if (status === 404 || status === 401) return 'Discord says this webhook no longer exists. It may have been deleted — create a new one.';
  if (status === 429) return 'Discord is rate limiting this webhook. Try again in a few seconds.';
  if (status === 400) return 'Discord rejected the message.';
  return `Discord returned an error (${status}).`;
}

// Posts are sent one at a time per page so a burst of rolls can't trip rate limits
// or arrive out of order.
let queue = Promise.resolve();

// Resolves to { ok, status?, error?, via: 'extension' | 'direct' }. Never rejects.
export function postToDiscord(webhookUrl, body, meta = {}) {
  const job = queue.then(async () => {
    if (!isValidWebhookUrl(webhookUrl)) {
      return { ok: false, error: 'The saved Discord webhook URL is not valid.', via: 'none' };
    }
    const viaExt = await sendViaExtension(webhookUrl, body, meta);
    if (viaExt.handled) return { ok: viaExt.ok, status: viaExt.status, error: viaExt.error, via: 'extension' };
    const direct = await sendDirect(webhookUrl, body);
    return { ...direct, via: 'direct' };
  });
  queue = job.catch(() => {});
  return job;
}

// Is the extension installed? Resolves true/false within ~400ms.
export function detectExtension() {
  return new Promise(resolve => {
    let done = false;
    function finish(v) {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      resolve(v);
    }
    function onMessage(e) {
      if (e.source === window && e.data && e.data.type === 'HBS_PONG') finish(e.data.version || true);
    }
    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'HBS_PING' }, window.location.origin);
    setTimeout(() => finish(false), 400);
  });
}
