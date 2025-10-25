import { contrastRatio, parseRgb } from './util.js';

// Traverse all nodes, including comments; capture:
// - Visible & hidden text nodes
// - HTML comments
// - Hidden inputs and aria attrs
// Also keep a reference to the node for later highlighting.
export function extractAllText() {
  const results = [];
  const walker = document.createTreeWalker(
    document.documentElement,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT,
    null
  );

  const add = (text, node, kind, visibility) => {
    if (!text) return;
    results.push({ text, node, kind, visibility });
  };

  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeType === Node.COMMENT_NODE) {
      const txt = String(n.nodeValue || '').trim();
      if (txt) add(txt, n, 'comment', 'hidden');
      continue;
    }

    if (n.nodeType === Node.TEXT_NODE) {
      const parent = n.parentElement;
      if (!parent) continue;
      const cs = getComputedStyle(parent);

      const isHidden = (
        cs.display === 'none' ||
        cs.visibility === 'hidden' ||
        parseFloat(cs.opacity) === 0 ||
        parent.getAttribute('aria-hidden') === 'true' ||
        parent.hidden === true
      );

      // White-on-white or low contrast trick
      let visibility = isHidden ? 'hidden' : 'visible';
      if (!isHidden) {
        const fg = parseRgb(cs.color);
        // heuristic bg: use parent bg if set, else fallback to body
        const bgc = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
          ? cs.backgroundColor : getComputedStyle(document.body).backgroundColor;
        const bg = parseRgb(bgc);
        const cr = contrastRatio(fg, bg);
        if (cr < 1.2) visibility = 'low-contrast';
      }

      const txt = String(n.nodeValue || '').replace(/\s+/g, ' ').trim();
      if (txt) add(txt, n, 'text', visibility);
      continue;
    }

    if (n.nodeType === Node.ELEMENT_NODE) {
      const el = /** @type {HTMLElement} */ (n);
      // Hidden form fields
      if (el.tagName === 'INPUT') {
        const inp = /** @type {HTMLInputElement} */(el);
        if (inp.type === 'hidden' && inp.value) add(inp.value, el, 'hidden-input', 'hidden');
      }
      // ALT text / ARIA labels often hide content semantics
      const alt = el.getAttribute('alt');
      if (alt) add(alt, el, 'alt', 'meta');
      const aria = el.getAttribute('aria-label');
      if (aria) add(aria, el, 'aria', 'meta');
      // Titles (tooltips)
      const title = el.getAttribute('title');
      if (title) add(title, el, 'title', 'meta');
    }
  }

  return results;
}

export function watchDomChanges(callback) {
  const mo = new MutationObserver(() => {
    callback();
  });
  mo.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true
  });
  return () => mo.disconnect();
}
