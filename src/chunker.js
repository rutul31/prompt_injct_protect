import { estimateTokens, hashString } from './util.js';

// Split by semantic boundaries then assemble to token budget
function sentenceSplit(text) {
  // Simple rule-based split. You can attach a better tokenizer later.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\(])/)
    .map((s) => s.trim())
    .filter(Boolean);
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
    const id = hashString(`${combined}|${origin.map((o) => `${o.itemIdx}:${o.startSent}-${o.endSent}`).join(',')}`);
    chunks.push({
      id,
      text: combined,
      meta: {
        origin: origin.map((o) => ({ ...o })),
        ts: Date.now(),
      },
    });
    cur = [];
    curTok = 0;
    origin = [];
  };

  const recordOrigin = (itemIdx, sentIdx) => {
    const last = origin[origin.length - 1];
    if (last && last.itemIdx === itemIdx && last.endSent === sentIdx - 1) {
      last.endSent = sentIdx;
    } else {
      origin.push({ itemIdx, startSent: sentIdx, endSent: sentIdx });
    }
  };

  items.forEach((item) => {
    const sents = sentenceSplit(item.text);
    sents.forEach((s, si) => {
      const tokens = estimateTokens(s) + (cur.length ? 1 : 0); // account for space join
      if (curTok + tokens > maxTokens && curTok >= minTokens) {
        pushChunk();
      }
      cur.push(s);
      curTok += tokens;
      recordOrigin(item.idx, si);
    });
  });

  pushChunk();
  return chunks;
}

// Map chunk origins back to DOM nodes for overlay
export function buildSourceMap(items, chunks) {
  const map = {};
  chunks.forEach((ch) => {
    map[ch.id] = ch.meta.origin
      .map((o) => items.find((item) => item.idx === o.itemIdx))
      .filter(Boolean);
  });
  return map;
}
