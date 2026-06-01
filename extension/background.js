// background.js — service worker
// Receives roll messages from the Homebrew Sheet page
// and forwards them to any open DnDBeyond tabs

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTENT_READY') {
    // Content script checking in — nothing to do
    return;
  }

  if (message.type === 'HOMEBREW_SHEET_ROLL') {
    // Forward to all DnDBeyond tabs that have the content script
    forwardRollToDDB(message.payload);
    sendResponse({ ok: true });
    return true;
  }
});

// Also listen for messages posted from web pages via externally_connectable
// (the Homebrew Sheet page posts window.postMessage which the content script
// picks up and relays here, OR the sheet can use chrome.runtime if the
// extension ID is known — we handle both)
chrome.runtime.onMessageExternal?.addListener((message, _sender, sendResponse) => {
  if (message.type === 'HOMEBREW_SHEET_ROLL') {
    forwardRollToDDB(message.payload);
    sendResponse({ ok: true });
  }
});

async function forwardRollToDDB(payload) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.dndbeyond.com/*' });
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'HOMEBREW_ROLL',
          payload,
        });
      } catch (_) {
        // Tab may not have content script yet — inject it
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
          await chrome.tabs.sendMessage(tab.id, {
            type: 'HOMEBREW_ROLL',
            payload,
          });
        } catch (e) {
          console.warn('Could not inject into tab', tab.id, e);
        }
      }
    }
  } catch (e) {
    console.error('forwardRollToDDB error', e);
  }
}
