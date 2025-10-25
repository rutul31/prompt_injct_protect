// Simple request/response messaging
export function askBg(type, payload) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        if (chrome.runtime.lastError) {
          return resolve({ ok: false, error: chrome.runtime.lastError.message });
        }
        resolve(resp);
      });
    } catch (error) {
      resolve({ ok: false, error: error?.message || String(error) });
    }
  });
}

// Reserved for content-side listeners in future
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  // no-op for now
});
