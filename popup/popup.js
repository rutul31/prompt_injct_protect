(async function () {
  let activeTabUrl = '';

  function clampPercent(value) {
    if (Number.isFinite(value)) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    return 0;
  }

  function readState() {
    return new Promise((resolve) => {
      chrome.storage.local.get('llm_prompt_guard', (res) => {
        if (chrome.runtime.lastError) {
          resolve({});
          return;
        }
        resolve(res['llm_prompt_guard'] || {});
      });
    });
  }

  const progressEl = document.querySelector('.progress');
  const progressBar = progressEl?.querySelector('.progress__bar');
  const progressLabel = document.getElementById('progress-text');
  const statusEl = document.getElementById('status');
  const statusCard = statusEl?.closest('.status-card');

  function renderProgress(progress) {
    const percent = clampPercent(progress?.percent);
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
    if (progressEl) {
      progressEl.setAttribute('aria-valuenow', String(percent));
    }
    if (progressLabel) {
      if (progress?.text) {
        progressLabel.textContent = `${progress.text} (${percent}%)`;
      } else if (progress) {
        progressLabel.textContent = `${percent}% complete`;
      } else {
        progressLabel.textContent = 'Waiting for scan…';
      }
    }
  }

  function applyProgressFromState(state) {
    if (!activeTabUrl) {
      renderProgress(null);
      return;
    }
    const progress = state?.progress?.[activeTabUrl];
    renderProgress(progress || null);
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.executeScript?.(); // noop for MV3; kept for compatibility
  activeTabUrl = tab?.url || '';

  if (statusCard) {
    statusCard.dataset.state = 'ready';
  }

  statusEl.textContent =
    'Open the sidebar on the page. The extension scans automatically.';

  applyProgressFromState(await readState());

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!Object.prototype.hasOwnProperty.call(changes, 'llm_prompt_guard')) return;
    const nextState = changes.llm_prompt_guard?.newValue;
    if (!nextState) return;
    applyProgressFromState(nextState);
  });
})();
