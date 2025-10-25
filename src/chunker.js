import { estimateTokens, hashString } from './util.js';

// Split by semantic boundaries then assemble to token budget
function sentenceSplit(text) {
  // Simple rule-based split. You can attach a better tokenizer later.
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'\(])/).map(s => s.trim()).filter(Boolean);
}

export function chunkText(items, { maxTokens = 450, minTokens = 120 } = {}) {
  // items: [{ idx, text, node, ... }]
  const chunks = [];
  let cur = [];
  let curTok = 0;
  let origin = [];

  const pushChunk = () => {
    if (cur.length === 0) return;
    const combined = cur.join(' ').trim();
    if (!combined) return;
    const id = hashString(combined + '|' + origin.join(','));
    chunks.push({
      id,
      text: combined,
      meta: { origin, // array of {itemIdx, startSent, endSent}
              ts: Date.now() }
    });
    cur = [];
    curTok = 0;
    origin = [];
  };

  items.forEach((item, i) => {
    const sents = sentenceSplit(item.text);
    let start = 0;
    for (let si = 0; si < sents.length; si++) {
      const s = sents[si];
      const t = estimateTokens(s) + (cur.length ? 1 : 0); // space
      if (curTok + t > maxTokens && curTok >= minTokens) {
        pushChunk();
      }
      cur.push(s);
      curTok += t;
    }
    const end = sents.length - 1;
    if (sents.length > 0) {
      origin.push({ itemIdx: item.idx, startSent: start, endSent: end });
    }
  });
  pushChunk();
  return chunks;
}

// Map chunk origins back to DOM nodes for overlay
export function buildSourceMap(items, chunks) {
  const map = {};
  chunks.forEach(ch => {
    map[ch.id] = ch.meta.origin.map(o => items[o.itemIdx]).filter(Boolean);
  });
  return map;
}
