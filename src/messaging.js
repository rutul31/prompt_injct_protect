// Simple request/response messaging
export function askBg(type, payload) {
  return chrome.runtime.sendMessage({ type, payload });
}
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  // reserved for future content-side listeners
});
