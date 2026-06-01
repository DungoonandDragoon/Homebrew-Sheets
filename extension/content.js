// content.js — runs on every DnDBeyond page
// Listens for roll messages posted from the Homebrew Sheet tab
// and injects them into DnDBeyond's dice log / chat

(function () {
  'use strict';

  // ── Listen for messages from the Homebrew Sheet (via background relay) ──────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== 'HOMEBREW_ROLL') return;
    handleRoll(message.payload);
    sendResponse({ ok: true });
  });

  // ── Core roll handler ─────────────────────────────────────────────────────
  function handleRoll(payload) {
    const { label, total, breakdown } = payload;

    // Strategy 1: Try to use DnDBeyond's own dice roller overlay if present
    if (tryDDBDiceOverlay(label, total, breakdown)) return;

    // Strategy 2: Post to the campaign chat / game log text input
    if (tryGameLog(label, total, breakdown)) return;

    // Strategy 3: Fallback — inject a visible toast into the DDB page itself
    injectFallbackToast(label, total, breakdown);
  }

  // ── Strategy 1: DDB dice overlay ─────────────────────────────────────────
  // DnDBeyond renders roll results via a custom element / React component.
  // We dispatch a CustomEvent that Beyond20 also uses for compatibility.
  function tryDDBDiceOverlay(label, total, breakdown) {
    try {
      const event = new CustomEvent('ddb-roll', {
        bubbles: true,
        detail: {
          type: 'roll',
          name: label,
          total,
          formula: breakdown,
          source: 'Homebrew Sheet',
        },
      });
      document.dispatchEvent(event);

      // Also try Beyond20's event format for cross-compatibility
      const b20event = new CustomEvent('Beyond20_SendMessage', {
        bubbles: true,
        detail: {
          action: 'roll',
          title: label,
          roll: String(total),
          formula: breakdown,
        },
      });
      document.dispatchEvent(b20event);

      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Strategy 2: game log / chat input ────────────────────────────────────
  function tryGameLog(label, total, breakdown) {
    // DnDBeyond campaign chat textarea selectors (these may change with DDB updates)
    const selectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      '.ct-game-log__input textarea',
      '[data-testid="chat-input"]',
      '.ddbc-campaign-log-input textarea',
    ];

    let input = null;
    for (const sel of selectors) {
      input = document.querySelector(sel);
      if (input) break;
    }

    if (!input) return false;

    const text = `🎲 ${label}: ${total} (${breakdown})`;

    // Use React's synthetic event system to set the value properly
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Submit after a short delay so React can process the value change
    setTimeout(() => {
      const submitSelectors = [
        'button[type="submit"]',
        '.ct-game-log__send',
        '[data-testid="chat-send"]',
      ];
      for (const sel of submitSelectors) {
        const btn = document.querySelector(sel);
        if (btn) { btn.click(); break; }
      }
      // Also try Enter key
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    }, 100);

    return true;
  }

  // ── Strategy 3: Fallback toast on the DDB page ────────────────────────────
  function injectFallbackToast(label, total, breakdown) {
    // Remove existing toast if present
    const existing = document.getElementById('hbs-roll-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'hbs-roll-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: #1a1a2e;
      border: 1px solid #c9a84c;
      border-radius: 8px;
      padding: 12px 16px;
      z-index: 99999;
      font-family: sans-serif;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      min-width: 180px;
      animation: hbs-slide-in 0.2s ease;
    `;
    toast.innerHTML = `
      <style>
        @keyframes hbs-slide-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      </style>
      <div style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#8a8070; margin-bottom:4px;">
        ${escapeHtml(label)}
      </div>
      <div style="font-size:32px; font-weight:600; color:#c9a84c; line-height:1;">
        ${total}
      </div>
      <div style="font-size:12px; color:#8a8070; margin-top:4px;">
        ${escapeHtml(breakdown)}
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Signal that the content script is alive ───────────────────────────────
  chrome.runtime.sendMessage({ type: 'CONTENT_READY', url: window.location.href }).catch(() => {});

})();
