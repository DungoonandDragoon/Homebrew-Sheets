// popup.js

const SHEET_URL = 'https://dungoonanddragoon.github.io/Homebrew-Sheets';

function timeAgo(ms) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

async function init() {
  // Is the sheet open?
  const sheetTabs = await chrome.tabs.query({ url: `${SHEET_URL}*` });
  const sheetDot = document.getElementById('sheet-dot');
  const sheetStatus = document.getElementById('sheet-status');
  if (sheetTabs.length > 0) {
    sheetDot.classList.add('green');
    sheetStatus.textContent = 'Homebrew Sheet is open';
  } else {
    sheetDot.classList.add('amber');
    sheetStatus.textContent = 'Sheet not open';
  }

  // Last roll sent to Discord
  const { lastSend, discordWebhook } = await chrome.storage.local.get(['lastSend', 'discordWebhook']);
  const labelEl = document.getElementById('last-roll-label');
  const totalEl = document.getElementById('last-roll-total');
  const resultEl = document.getElementById('last-roll-result');
  if (lastSend) {
    labelEl.textContent = [lastSend.character, lastSend.label].filter(Boolean).join(' · ') || 'Last message';
    totalEl.textContent = lastSend.total === '' || lastSend.total == null ? '' : lastSend.total;
    resultEl.textContent = lastSend.ok
      ? `✓ Posted to Discord · ${timeAgo(lastSend.at)}`
      : `✗ ${lastSend.error || 'Not delivered'} · ${timeAgo(lastSend.at)}`;
    resultEl.className = lastSend.ok ? 'ok' : 'bad';
  }

  // Older versions kept ONE webhook in the extension. It is no longer used.
  if (discordWebhook) {
    document.getElementById('legacy').style.display = 'block';
    document.getElementById('forget-legacy').addEventListener('click', async () => {
      await chrome.storage.local.remove('discordWebhook');
      document.getElementById('legacy').style.display = 'none';
    });
  }

  document.getElementById('open-sheet').addEventListener('click', () => {
    if (sheetTabs.length > 0) {
      chrome.tabs.update(sheetTabs[0].id, { active: true });
      chrome.windows.update(sheetTabs[0].windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: SHEET_URL });
    }
    window.close();
  });
}

init();
