// background.js — Manifest V3 service worker
//
// Receives a ready-made Discord message from bridge.js and posts it to the
// webhook URL that came with it. The webhook belongs to the character that is
// open on the sheet, so there is nothing to configure in the extension itself.

// Same shape the sheet validates against: https://discord.com/api/webhooks/<id>/<token>
// (ptb./canary./discordapp.com variants, optional /vN/, optional ?thread_id=).
// The extension refuses to POST anywhere else.
const WEBHOOK_RE = /^https:\/\/(?:(?:ptb|canary)\.)?(?:discord|discordapp)\.com\/api\/(?:v\d+\/)?webhooks\/\d+\/[\w-]+(?:\?thread_id=\d+)?$/;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'DISCORD_POST') return false;
  // Only our own content script may ask us to post.
  if (sender.id !== chrome.runtime.id) return false;

  postToDiscord(message)
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }));
  return true; // keep the message port open for the async response
});

function explain(status) {
  if (status === 404 || status === 401) return 'Discord says this webhook no longer exists. It may have been deleted — create a new one.';
  if (status === 429) return 'Discord is rate limiting this webhook. Try again in a few seconds.';
  if (status === 400) return 'Discord rejected the message.';
  return `Discord returned an error (${status}).`;
}

async function send(webhookUrl, body) {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function postToDiscord({ webhookUrl, body, meta }) {
  let result;
  if (typeof webhookUrl !== 'string' || !WEBHOOK_RE.test(webhookUrl)) {
    result = { ok: false, error: 'That is not a Discord webhook URL.' };
  } else {
    try {
      let res = await send(webhookUrl, body);
      if (res.status === 429) {
        let waitMs = 1000;
        try { waitMs = Math.min(5000, Math.ceil(((await res.json()).retry_after || 1) * 1000)); } catch (_) { /* default */ }
        await new Promise((r) => setTimeout(r, waitMs));
        res = await send(webhookUrl, body);
      }
      result = res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status, error: explain(res.status) };
    } catch (_) {
      result = { ok: false, error: 'Could not reach Discord.' };
    }
  }

  // Remember the last delivery so the toolbar popup can show it.
  try {
    await chrome.storage.local.set({
      lastSend: {
        label: (meta && meta.label) || '',
        total: meta && meta.total !== undefined ? meta.total : '',
        character: (meta && meta.character) || '',
        ok: result.ok,
        error: result.error || null,
        at: Date.now(),
      },
    });
  } catch (_) { /* storage is just for the popup */ }

  return result;
}
