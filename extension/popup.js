// popup.js

const SHEET_URL = 'YOUR_GITHUB_PAGES_URL'; // e.g. https://yourname.github.io/dnd-homebrew-sheet

async function init() {
  // Check for DnDBeyond tabs
  const ddbTabs = await chrome.tabs.query({ url: 'https://www.dndbeyond.com/*' });
  const ddbDot = document.getElementById('ddb-dot');
  const ddbStatus = document.getElementById('ddb-status');
  if (ddbTabs.length > 0) {
    ddbDot.classList.add('green');
    ddbStatus.textContent = `DnDBeyond open (${ddbTabs.length} tab${ddbTabs.length > 1 ? 's' : ''})`;
  } else {
    ddbDot.classList.add('amber');
    ddbStatus.textContent = 'No DnDBeyond tab open';
  }

  // Check for sheet tab
  const sheetTabs = await chrome.tabs.query({ url: `${SHEET_URL}/*` });
  const sheetDot = document.getElementById('sheet-dot');
  const sheetStatus = document.getElementById('sheet-status');
  if (sheetTabs.length > 0) {
    sheetDot.classList.add('green');
    sheetStatus.textContent = 'Homebrew Sheet is open';
  } else {
    sheetDot.classList.add('amber');
    sheetStatus.textContent = 'Sheet not open';
  }

  // Load last roll from storage
  const { lastRoll } = await chrome.storage.local.get('lastRoll');
  if (lastRoll) {
    document.getElementById('last-roll-label').textContent = lastRoll.label;
    document.getElementById('last-roll-total').textContent = lastRoll.total;
    document.getElementById('last-roll-breakdown').textContent = lastRoll.breakdown;
  }

  document.getElementById('open-sheet').addEventListener('click', () => {
    if (sheetTabs.length > 0) {
      chrome.tabs.update(sheetTabs[0].id, { active: true });
    } else {
      chrome.tabs.create({ url: SHEET_URL });
    }
    window.close();
  });
}

init();
