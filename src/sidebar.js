import { saveDecision } from './storage.js';

const SIDEBAR_ID = 'llm-prompt-guard-sidebar';
let shadow, root, listEl, statusEl, onActionCb;

export function mountSidebar(onAction) {
  onActionCb = onAction;
  if (document.getElementById(SIDEBAR_ID)) return;

  const host = document.createElement('div');
  host.id = SIDEBAR_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.right = '0';
  host.style.width = '360px';
  host.style.height = '100vh';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'auto';
  document.documentElement.appendChild(host);
  shadow = host.attachShadow({ mode: 'open' });

  const container = document.createElement('div');
  container.className = 'wrap';
  const style = document.createElement('style');
  style.textContent = `
    .wrap { font: 13px/1.5 system-ui, sans-serif; height: 100%; display:flex; flex-direction:column; background:#0b1020; color:#fff; border-left:1px solid #1c2340; }
    header { display:flex; align-items:center; gap:8px; padding:12px; border-bottom:1px solid #1c2340; }
    header .dot { width:10px; height:10px; border-radius:50%; background:#f90; }
    header.safe .dot { background:#0bbf5f; }
    header h1 { font-size:14px; margin:0; }
    .scroll { overflow:auto; flex:1; }
    .chunk { border-bottom:1px solid #1c2340; padding:12px; }
    .chunk h3 { margin:0 0 6px 0; font-size:12px; color:#9fb3ff; }
    .chunk pre { white-space:pre-wrap; background:#0f1530; padding:8px; border-radius:6px; max-height:120px; overflow:auto; }
    .actions { display:flex; gap:6px; margin-top:8px; }
    .actions button { background:#222a50; color:#fff; border:1px solid #31418f; padding:6px 8px; border-radius:6px; cursor:pointer; }
    .actions button.block { background:#ff2d55; border-color:#ff2d55; }
    .footer { padding:10px; border-top:1px solid #1c2340; font-size:12px; color:#b5c1ff; }
  `;
  shadow.append(style, container);

  const header = document.createElement('header');
  const dot = document.createElement('div'); dot.className='dot';
  const title = document.createElement('h1'); title.textContent = 'LLM Prompt Guard';
  statusEl = document.createElement('span'); statusEl.textContent = 'Scanning…';
  header.append(dot, title, statusEl);

  const scroll = document.createElement('div'); scroll.className='scroll';
  listEl = document.createElement('div');

  const footer = document.createElement('div'); footer.className = 'footer';
  footer.textContent = 'Only approved text will be passed to the LLM.';

  scroll.appendChild(listEl);
  container.append(header, scroll, footer);
  root = { header, dot, title, statusEl, listEl };
}

function actionButton(txt, cls) {
  const b = document.createElement('button');
  b.textContent = txt; if (cls) b.className = cls;
  return b;
}

export function renderSidebar({ url, flagged, allResolved }) {
  if (!root) return;
  root.listEl.innerHTML = '';
  root.statusEl.textContent = allResolved ? 'LLM-safe ✅' : `Flagged: ${flagged.length}`;
  root.header.classList.toggle('safe', !!allResolved);

  flagged.forEach(item => {
    const wrap = document.createElement('div'); wrap.className='chunk';
    const h3 = document.createElement('h3');
    h3.textContent = `${item.label.toUpperCase()} • conf ${Math.round(item.confidence*100)}%`;
    const pre = document.createElement('pre'); pre.textContent = item.preview;

    const act = document.createElement('div'); act.className='actions';
    const ignore = actionButton('Ignore (bypass)');
    const safe = actionButton('Mark False Positive');
    const block = actionButton('Block from LLM', 'block');

    ignore.onclick = () => onActionCb('ignore', item);
    safe.onclick = () => onActionCb('safe', item);
    block.onclick = () => onActionCb('block', item);

    act.append(ignore, safe, block);
    wrap.append(h3, pre, act);
    root.listEl.appendChild(wrap);
  });
}
