import { classifyChunks } from './classifierApi.js';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'classify') {
        const { endpoint, apiKey, url, chunks } = msg.payload;
        const data = await classifyChunks({ endpoint, apiKey, url, chunks });
        sendResponse({ ok: true, data });
      } else {
        sendResponse({ ok: true });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
  })();
  return true; // async
});
