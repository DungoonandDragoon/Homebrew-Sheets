// bridge.js — runs on the Homebrew Sheet page (content script).
//
// The sheet decides WHAT to send and WHERE (each character has its own Discord
// webhook). This script is just the pipe between the page and the extension:
//
//   page  --HBS_DISCORD_SEND-->  bridge  --runtime message-->  background.js --> Discord
//   page  <--HBS_BRIDGE_ACK----  bridge   (immediately: "the extension has it")
//   page  <--HBS_DISCORD_RESULT  bridge   (when Discord has answered)
//
// If this script isn't present (extension not installed, or an old version), the
// page never receives an ACK and posts to Discord itself instead.

(function () {
  const ORIGIN = window.location.origin;

  // After the extension is reloaded/updated, orphaned copies of this script keep
  // running in already-open tabs and chrome.runtime stops working. Stay silent in
  // that case (no ACK) so the page falls back to posting directly.
  function extensionAlive() {
    try { return !!(chrome.runtime && chrome.runtime.id); } catch (_) { return false; }
  }

  function reply(msg) {
    window.postMessage(msg, ORIGIN);
  }

  window.addEventListener('message', (event) => {
    // Only accept messages from this very page (not iframes / other windows)
    if (event.source !== window || !event.data || typeof event.data !== 'object') return;
    const msg = event.data;

    if (msg.type === 'HBS_PING') {
      if (!extensionAlive()) return;
      reply({ type: 'HBS_PONG', version: chrome.runtime.getManifest().version });
      return;
    }

    if (msg.type !== 'HBS_DISCORD_SEND') return;
    if (!extensionAlive()) return;

    reply({ type: 'HBS_BRIDGE_ACK', id: msg.id });

    chrome.runtime.sendMessage({
      type: 'DISCORD_POST',
      webhookUrl: msg.webhookUrl,
      body: msg.body,
      meta: msg.meta || {},
    }).then((res) => {
      reply({ type: 'HBS_DISCORD_RESULT', id: msg.id, ok: !!(res && res.ok), status: res && res.status, error: res && res.error });
    }).catch(() => {
      reply({ type: 'HBS_DISCORD_RESULT', id: msg.id, ok: false, error: 'The extension was reloaded. Refresh this page and try again.' });
    });
  });
})();
