(async function () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.executeScript?.(); // noop for MV3; kept for compatibility
  // We’ll just show a lightweight status via content decision memory
  const statusEl = document.getElementById('status');
  const statusCard = statusEl?.closest('.status-card');

  if (statusCard) {
    statusCard.dataset.state = 'ready';
  }

  statusEl.textContent =
    'Open the sidebar on the page. The extension scans automatically.';
})();
