// Language-only normalization: strip code, tags, scripts, encodings
export function toLanguageOnly(raw) {
  let s = String(raw || '');

  // Remove script-ish patterns & markup artifacts
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
       .replace(/<style[\s\S]*?<\/style>/gi, ' ')
       .replace(/<\/?[^>]+>/g, ' ')
       .replace(/[`~]{3,}[\s\S]*?[`~]{3,}/g, ' ') // fenced code
       .replace(/```[\s\S]*?```/g, ' ')
       .replace(/`[^`]*`/g, ' ')
       .replace(/[{[]\s*\"?on\w+\"?\s*:\s*.*?[}\]]/gi, ' ')
       .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, ' ')
       .replace(/[^\S\r\n]+/g, ' ')
       .replace(/\s+/g, ' ')
       .trim();

  // Remove common code-y tokens/brackets that add noise
  s = s.replace(/[{}`<>;()=]/g, ' ').replace(/\s+/g, ' ').trim();

  return s;
}

export function preprocessExtracts(extracts) {
  // Combine but keep mapping by index for highlighting
  return extracts.map((e, idx) => ({
    idx,
    kind: e.kind,
    visibility: e.visibility,
    node: e.node,
    raw: e.text,
    text: toLanguageOnly(e.text)
  })).filter(x => x.text && x.text.length > 0);
}
