import { extractAllText, watchDomChanges } from './textExtraction.js';
import { preprocessExtracts } from './preprocess.js';
import { chunkText, buildSourceMap } from './chunker.js';
import { askBg } from './messaging.js';
import { getState, saveDecision, getDecision, cacheClassification, getCachedClassification, setState } from './storage.js';
import { mountSidebar, renderSidebar, setSidebarProgress } from './sidebar.js';
import { clearOverlays, showFlagOverlay, updateOverlayStatus } from './overlay.js';
import { hashString } from './util.js';
import { getApprovedForLLM } from './integration.js';

let disposeObserver = null;
let lastSourceMap = {};
let lastChunks = [];
let lastFlagged = [];
let currentUrl = location.href;

async function scanAndClassify() {
  const { endpoint, apiKey } = await getState();
  clearOverlays();
  mountSidebar(onUserAction);
  // start progress
  try { setSidebarProgress({ percent: 5, text: 'Starting scan' }); } catch (e) {}

  // 1) Extract
  const extracts = extractAllText();
  try { setSidebarProgress({ percent: 20, text: 'Extracted text' }); } catch (e) {}

  // 2) Preprocess
  const items = preprocessExtracts(extracts);
  try { setSidebarProgress({ percent: 35, text: 'Preprocessed' }); } catch (e) {}

  // 3) Chunk
  const chunks = chunkText(items, { maxTokens: 450, minTokens: 120 });
  lastChunks = chunks;
  lastSourceMap = buildSourceMap(items, chunks);
  try { setSidebarProgress({ percent: 50, text: `Chunked ${chunks.length}` }); } catch (e) {}

  // 4) Classify (with cache + per-chunk)
  const toAsk = [];
  const results = {};
  for (const ch of chunks) {
    const h = ch.id;
    const cached = await getCachedClassification(currentUrl, h);
    if (cached) {
      results[h] = cached.result;
      continue;
    }
    toAsk.push({ id: h, text: ch.text, meta: { url: currentUrl } });
  }

  if (toAsk.length) {
    try { setSidebarProgress({ percent: 65, text: 'Classifying' }); } catch (e) {}
    const resp = await askBg('classify', { endpoint, apiKey, url: currentUrl, chunks: toAsk });
    if (!resp.ok) {
      console.warn('Classifier error:', resp.error);
      // Treat as safe on failure (or choose to block-by-default)
      toAsk.forEach(x => { results[x.id] = { id: x.id, label: 'safe', confidence: 0.0 }; });
    } else {
      resp.data.results.forEach(r => { results[r.id] = r; });
      // cache
      for (const r of resp.data.results) {
        await cacheClassification(currentUrl, r.id, r);
      }
    }
    try { setSidebarProgress({ percent: 85, text: 'Applying results' }); } catch (e) {}
  }

  // Build flagged list
  lastFlagged = [];
  for (const ch of chunks) {
    const out = results[ch.id] || { id: ch.id, label: 'safe', confidence: 0.0 };
    const decision = await getDecision(currentUrl, ch.id);
    const label = decision?.decision === 'block' ? 'malicious' :
                  (decision?.decision === 'safe' || decision?.decision === 'ignore') ? 'safe' :
                  out.label;

    if (label === 'malicious') {
      const preview = ch.text.slice(0, 600);
      lastFlagged.push({
        chunkId: ch.id,
        label: out.label,
        confidence: out.confidence ?? 0,
        preview
      });
      const nodes = lastSourceMap[ch.id] || [];
      showFlagOverlay(ch.id, nodes, out.reason || 'Possible prompt override attempt');
    } else {
      updateOverlayStatus(ch.id, 'safe');
    }
  }

  const allResolved = lastFlagged.length === 0;
  renderSidebar({ url: currentUrl, flagged: lastFlagged, allResolved });
  try { setSidebarProgress({ percent: 100, text: allResolved ? 'Done' : 'Review' }); } catch (e) {}

  // 7) Integration: prepare approved text snapshot
  const st = await getState();
  window.__LLM_LAST_APPROVED_TEXT__ = getApprovedForLLM(chunks, currentUrl, st.decisions);
}

async function onUserAction(action, item) {
  const { chunkId } = item;
  if (action === 'ignore') {
    await saveDecision(currentUrl, chunkId, 'ignore');
  } else if (action === 'safe') {
    await saveDecision(currentUrl, chunkId, 'safe');
  } else if (action === 'block') {
    await saveDecision(currentUrl, chunkId, 'block');
  }
  await scanAndClassify();
}

function init() {
  if (disposeObserver) disposeObserver();
  disposeObserver = watchDomChanges(() => {
    // debounce via microtask
    if (init._timer) cancelIdleCallback(init._timer);
    init._timer = requestIdleCallback(scanAndClassify, { timeout: 2000 });
  });
  scanAndClassify();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scanAndClassify();
});

init();
