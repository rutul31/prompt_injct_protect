// Inline overlays + tooltips near flagged nodes
const TAG = 'llm-prompt-guard-overlay';
let shadowRoot, container;

function ensureHost() {
  let host = document.getElementById(TAG);
  if (!host) {
    host = document.createElement('div');
    host.id = TAG;
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.zIndex = '2147483647';
    document.documentElement.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });
    container = document.createElement('div');
    shadowRoot.appendChild(container);
    const style = document.createElement('style');
    style.textContent = `
      .badge {
        position: absolute;
        font: 12px/1.6 system-ui, sans-serif;
        background: #ff2d55;
        color: #fff;
        padding: 2px 6px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,.2);
        cursor: pointer;
        user-select: none;
      }
      .badge.safe { background: #0bbf5f; }
      .tip {
        position: absolute;
        background: #111;
        color: #fff;
        padding: 6px 8px;
        border-radius: 8px;
        max-width: 260px;
        font: 12px/1.5 system-ui, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,.3);
      }
    `;
    shadowRoot.appendChild(style);
  }
}

function rectForNode(node) {
  try {
    if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
      const range = document.createRange();
      range.selectNodeContents(node.parentElement);
      const r = range.getBoundingClientRect();
      range.detach?.();
      return r;
    }
    if (node.getBoundingClientRect) return node.getBoundingClientRect();
  } catch {}
  return null;
}

const overlays = new Map(); // chunkId -> {badge, tip}

export function clearOverlays() {
  overlays.forEach(({badge, tip}) => {
    badge?.remove(); tip?.remove();
  });
  overlays.clear();
}

export function showFlagOverlay(chunkId, nodes, reason) {
  ensureHost();
  // place near first visible/any node
  const node = nodes.find(n => n?.node?.ownerDocument === document)?.node || nodes[0]?.node;
  const r = rectForNode(node);
  if (!r) return;
  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.textContent = '⚠︎ Injection?';
  badge.style.top = Math.max(0, r.top + 6) + 'px';
  badge.style.left = Math.max(0, r.left + 6) + 'px';

  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.style.top = Math.max(0, r.top + 28) + 'px';
  tip.style.left = Math.max(0, r.left + 6) + 'px';
  tip.textContent = reason || 'Possible prompt override attempt';

  container.appendChild(badge);
  container.appendChild(tip);
  overlays.set(chunkId, { badge, tip });
}

export function updateOverlayStatus(chunkId, label) {
  const entry = overlays.get(chunkId);
  if (!entry) return;
  if (label === 'safe') entry.badge.classList.add('safe');
}
