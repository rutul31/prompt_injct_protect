export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function hashString(str) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16);
}

// WCAG contrast ratio for RGB triplets [0..255]
function relL([r, g, b]) {
  const srgb = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
export function contrastRatio(fgRgb, bgRgb) {
  const L1 = relL(fgRgb);
  const L2 = relL(bgRgb);
  const lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}
export function parseRgb(cssColor) {
  // supports rgb(a) and hex
  if (!cssColor) return [0,0,0];
  const c = cssColor.trim().toLowerCase();
  if (c.startsWith('rgb')) {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0,0,0];
  }
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
    const n = parseInt(hex.slice(0,6), 16);
    return [(n>>16)&255, (n>>8)&255, n&255];
  }
  return [0,0,0];
}

// Rough token estimator (~4 chars/token heuristic)
export function estimateTokens(s) {
  const len = (s || '').length;
  return Math.max(1, Math.round(len / 4));
}
