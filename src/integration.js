import { getDecision } from './storage.js';

// Simple integration layer:
// Pages (or AI browser shell) can post a request to get approved text.
// window.postMessage({ type: 'LLM_FILTER_REQUEST' }, '*')
window.addEventListener('message', async (evt) => {
  const msg = evt?.data;
  if (!msg || msg.type !== 'LLM_FILTER_REQUEST') return;
  // content.js will maintain lastApprovedText
  const approved = window.__LLM_LAST_APPROVED_TEXT__ || '';
  window.postMessage({ type: 'LLM_FILTER_RESPONSE', approved }, '*');
});

// For host AI UIs that extract text via selection:
export function getApprovedForLLM(chunks, url, decisions) {
  const approved = [];
  for (const ch of chunks) {
    const key = `${url}::${ch.id}`;
    const d = decisions[key]?.decision;
    if (d === 'block') continue;
    // 'ignore' and 'safe' pass through; unflagged pass through
    approved.push(ch.text);
  }
  return approved.join('\n\n');
}
