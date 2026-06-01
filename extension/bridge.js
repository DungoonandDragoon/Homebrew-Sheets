// bridge.js — injected into the Homebrew Sheet page as a content script
// Listens for roll messages posted via window.postMessage
// and relays them to the background service worker

(function () {
  window.addEventListener('message', (event) => {
    // Only accept messages from the same origin
    if (event.source !== window) return;
    if (!event.data || event.data.type !== 'HOMEBREW_SHEET_ROLL') return;

    // Relay to background
    chrome.runtime.sendMessage({
      type: 'HOMEBREW_SHEET_ROLL',
      payload: event.data.payload,
    }).then(() => {
      // Also store last roll for popup display
      chrome.storage.local.set({ lastRoll: event.data.payload });
    }).catch(() => {
      // Extension context may be invalidated — silently ignore
    });
  });
})();
