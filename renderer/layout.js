// ============================================================================
// Home layout: move, hide and tidy the blocks on the home page (Settings -> Layout)
// ============================================================================
const LAYOUT_DEF = { slots: ['player', 'friends', 'mini'], page: ['top', 'continue', 'recommended'], hide: {}, parts: {}, size: {} };
const LAYOUT_NAMES = { player: 'Music player', friends: 'Friends', mini: 'Mini profile', top: 'Top area', continue: 'Continue', recommended: 'Recommended for you' };
// [block, key, label]: a part set to true is hidden
const LAYOUT_PARTS = [
  ['player', 'art', 'Album cover'], ['player', 'text', 'Song title and artist'], ['player', 'ctl', 'Play, previous and next buttons'],
  ['player', 'prog', 'Progress bar'], ['player', 'vol', 'Volume'],
  ['mini', 'name', 'Your name and picture'], ['mini', 'status', 'Online status'], ['mini', 'bell', 'Notifications bell'],
];
const sameSet = (a, b) => Array.isArray(a) && a.length === b.length && b.every((x) => a.includes(x)) && new Set(a).size === a.length;

function layoutGet() {
  const l = (typeof S !== 'undefined' && S && S.layout) || {};
  return {
    slots: sameSet(l.slots, LAYOUT_DEF.slots) ? l.slots.slice() : LAYOUT_DEF.slots.slice(),
    page: sameSet(l.page, LAYOUT_DEF.page) ? l.page.slice() : LAYOUT_DEF.page.slice(),
    hide: { ...(l.hide || {}) },
    parts: { ...(l.parts || {}) },
    size: { ...(l.size || {}) }, // topH, leftW (px), friends (px), mini (%)
  };
}

// Places the three top blocks + the two game sections inside `root`; used by the real home page and by the preview
function layoutArrange(L, els, top) {
  L.page.forEach((k, i) => (els[k].style.order = String(i)));
  ['continue', 'recommended'].forEach((k) => (els[k].style.display = L.hide[k] ? 'none' : ''));
  L.slots.forEach((k) => (els[k].style.display = L.hide[k] ? 'none' : ''));
  const vis = L.slots.filter((k) => !L.hide[k]);
  top.style.display = vis.length ? '' : 'none';
  const put = (k, col, row) => {
    els[k].style.gridColumn = col;
    els[k].style.gridRow = row;
  };
  const z = L.size;
  // the left block can never push the other one out of the window
  top.style.gridTemplateColumns = vis.length === 1 ? 'minmax(0, 1fr)' : z.leftW ? `min(${z.leftW}px, calc(100% - 240px)) minmax(0, 1fr)` : '';
  if (vis.length === 3) {
    put(vis[0], '1', '1 / 3');
    put(vis[1], '2', '1');
    put(vis[2], '2', '2');
  } else vis.forEach((k, i) => put(k, String(i + 1), '1 / 3'));
  const hasPlayer = vis.includes('player');

  if (z.friends) els.friends.style.setProperty('--fsize', z.friends + 'px');
  else els.friends.style.removeProperty('--fsize');
  els.mini.style.zoom = z.mini && z.mini !== 100 ? String(z.mini / 100) : '';
  // each block changes shape to fit the slot it sits in: tall (left column), wide (right), strip (thin bottom row)
  // placeholder, set below once the shapes are known
  const forms = vis.length === 3 ? ['tall', 'wide', 'strip'] : vis.length === 2 ? ['tall', 'wide'] : ['wide'];
  vis.forEach((k, i) => (els[k].dataset.form = forms[i]));
  const mt = els.mini.dataset.form === 'tall';
  els.mini.style.justifySelf = mt ? 'stretch' : vis.length === 1 ? 'start' : 'end';
  els.mini.style.alignSelf = mt ? 'stretch' : 'start';
  // The top area is never shorter than what its blocks need, so nothing gets cut off
  const fs = z.friends || (els.friends.querySelector('.friend img, .addcircle') || {}).offsetWidth || 100;
  const mz = (z.mini || 100) / 100;
  const form = (k) => (vis.includes(k) ? els[k].dataset.form : '');
  const mini1 = 76 * mz;
  const hh = (k, f) =>
    k === 'player' ? (f === 'strip' ? 90 : 250) : k === 'friends' ? (f === 'tall' ? 2 * (fs + 36) + 64 : fs + 56) : f === 'tall' ? Math.round(280 * mz) : mini1;
  let need = 0;
  if (vis.length === 3) need = Math.max(hh(vis[0], 'tall'), hh(vis[1], 'wide') + 8 + hh(vis[2], 'strip'));
  else vis.forEach((k) => (need = Math.max(need, hh(k, form(k)))));
  need = Math.ceil(need);
  const base = z.topH || 0;
  const h = Math.max(base, need);
  top.style.height = base || need > 290 ? h + 'px' : hasPlayer ? '' : 'auto';
  top.style.minHeight = need + 'px';
  top.style.gridTemplateRows = hasPlayer || base || need > 290 ? '' : 'auto';
}

// What the home page really uses: a block with nothing left in it (or music turned off) is removed instead of leaving an empty panel
function layoutEffective() {
  const L = layoutGet();
  const allOff = (blk) => LAYOUT_PARTS.filter((x) => x[0] === blk).every((x) => L.parts[x[1]]);
  if ((typeof S !== 'undefined' && S && S.musicOff) || allOff('player')) L.hide.player = true;
  if (allOff('mini')) L.hide.mini = true;
  return L;
}

function applyLayout() {
  const L = layoutEffective();
  const main = document.getElementById('main');
  if (!main) return;
  const top = document.getElementById('top');
  const secs = main.querySelectorAll(':scope > .gamesec');
  const els = { player: document.getElementById('player'), friends: document.getElementById('friends'), mini: document.getElementById('mini'), continue: secs[0], recommended: secs[1], top };
  if (Object.values(els).some((e) => !e)) return;
  layoutArrange(L, els, top);
  LAYOUT_PARTS.forEach(([, k]) => main.classList.toggle('lh-' + k, !!L.parts[k]));
  if (typeof applyFriendLimit === 'function') applyFriendLimit();
  layoutPreviewRefresh();
  if (layoutResRefresh) layoutResRefresh();
  if (layoutDbg) layoutDbgPaint();
}

// ---- Live preview: a small copy of the home page that follows every change ----
let layoutPrev = [];
function layoutPreviewRefresh() {
  layoutPrev = layoutPrev.filter((p) => p.root.isConnected);
  const L = layoutGet();
  const Le = layoutEffective();
  layoutPrev.forEach(({ root, els, top, fit }) => {
    layoutArrange(Le, els, top);
    LAYOUT_PARTS.forEach(([, k]) => root.classList.toggle('lh-' + k, !!L.parts[k]));
    fit();
  });
}
function layoutPreviewBuild(parent) {
  const wrap = el('div', 'lay-prevwrap');
  const root = el('div', 'lay-prev');
  const top = el('div', 'pv-top');
  const player = el('div', 'pv-player');
  const art = el('div', 'pv-art');
  const info = el('div', 'pv-info');
  const text = el('div', 'pv-text');
  text.append(el('b', null, 'Song title'), el('span', null, 'Artist'));
  const ctl = el('div', 'pv-ctl');
  ctl.append(el('i'), el('i', 'big'), el('i'));
  const prog = el('div', 'pv-bar');
  const vol = el('div', 'pv-bar pv-vol');
  info.append(text, ctl, prog, vol);
  player.append(art, info);
  player.className = 'pv-player';
  const friends = el('div', 'pv-friends');
  friends.appendChild(el('h4', null, 'Friends'));
  const frow = el('div', 'pv-frow');
  for (let i = 0; i < 6; i++) frow.appendChild(el('i'));
  friends.appendChild(frow);
  const mini = el('div', 'pv-mini');
  mini.append(el('i', 'pv-avatar'), el('span', 'pv-name', 'Your name'), el('span', 'pv-status', '● Online'), el('i', 'pv-bell'));
  top.append(player, friends, mini);
  const sec = (title) => {
    const d = el('div', 'pv-sec');
    d.appendChild(el('h4', null, title));
    const row = el('div', 'pv-tiles');
    for (let i = 0; i < 7; i++) row.appendChild(el('i'));
    d.appendChild(row);
    return d;
  };
  const cont = sec('Continue');
  const rec = sec('Recommended For You');
  root.append(top, cont, rec);
  wrap.appendChild(root);
  parent.appendChild(wrap);
  const fit = () => {
    const sc = Math.min(1, wrap.clientWidth / 1100) || 0.5;
    root.style.transform = 'scale(' + sc + ')';
    wrap.style.height = Math.ceil(root.offsetHeight * sc) + 2 + 'px';
  };
  layoutPrev.push({ root, top, els: { player, friends, mini, continue: cont, recommended: rec, top }, fit });
  new ResizeObserver(fit).observe(wrap);
  const L0 = layoutEffective();
  layoutArrange(L0, layoutPrev[layoutPrev.length - 1].els, top); // not in the page yet, so arrange it directly
  LAYOUT_PARTS.forEach(([, k]) => root.classList.toggle('lh-' + k, !!L0.parts[k]));
}

async function layoutSave(L) {
  S = await window.api.setSettings({ layout: { slots: L.slots, page: L.page, hide: L.hide, parts: L.parts, size: L.size } });
  applyLayout();
}

function renderLayoutEditor(parent) {
  const L = layoutGet();
  parent.appendChild(el('div', 'fxlabel', 'Preview'));
  layoutPreviewBuild(parent);
  parent.appendChild(el('div', 'fxlabel', 'Arrange'));
  let sel = null; // click-to-swap: the chip picked first
  const commit = () => {
    layoutSave(L);
    paint();
  };
  const frame = el('div', 'lay-frame');
  const mkChip = (kind, key) => {
    const chip = el('div', 'lay-chip' + (L.hide[key] ? ' off' : '') + (sel && sel.key === key ? ' sel' : ''));
    chip.draggable = true;
    chip.appendChild(el('span', 'lay-name', LAYOUT_NAMES[key]));
    if (kind !== 'row' || key !== 'top') {
      const eye = el('button', 'lay-eye', L.hide[key] ? 'Show' : 'Hide');
      eye.title = L.hide[key] ? 'Show this on the home page' : 'Remove this from the home page';
      eye.onclick = (e) => {
        e.stopPropagation();
        if (L.hide[key]) delete L.hide[key];
        else L.hide[key] = true;
        commit();
      };
      chip.appendChild(eye);
    }
    chip.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', kind + ':' + key);
      e.dataTransfer.effectAllowed = 'move';
    };
    return chip;
  };
  const swapIn = (arr, a, b) => {
    const i = arr.indexOf(a);
    const j = arr.indexOf(b);
    if (i < 0 || j < 0 || i === j) return false;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return true;
  };
  const target = (node, kind, key) => {
    node.ondragover = (e) => {
      e.preventDefault();
      node.classList.add('over');
    };
    node.ondragleave = () => node.classList.remove('over');
    node.ondrop = (e) => {
      e.preventDefault();
      node.classList.remove('over');
      const [k0, from] = (e.dataTransfer.getData('text/plain') || '').split(':');
      if (k0 !== kind) return;
      if (swapIn(kind === 'slot' ? L.slots : L.page, from, key)) commit();
    };
    node.onclick = () => {
      if (sel && sel.kind === kind && sel.key !== key) {
        if (swapIn(kind === 'slot' ? L.slots : L.page, sel.key, key)) {
          sel = null;
          commit();
          return;
        }
      }
      sel = sel && sel.kind === kind && sel.key === key ? null : { kind, key };
      paint();
    };
  };
  function paint() {
    frame.replaceChildren();
    L.page.forEach((key, idx) => {
      const row = el('div', 'lay-row' + (key !== 'top' && L.hide[key] ? ' off' : ''));
      if (key === 'top') {
        const grid = el('div', 'lay-top');
        L.slots.forEach((bk, i) => {
          const cell = el('div', 'lay-cell lay-c' + i);
          cell.appendChild(mkChip('slot', bk));
          target(cell, 'slot', bk);
          grid.appendChild(cell);
        });
        row.append(el('div', 'lay-rowname', LAYOUT_NAMES.top), grid);
      } else {
        const chip = mkChip('row', key);
        row.appendChild(chip);
        const wide = el('div', 'lay-wide', key === 'continue' ? 'Your recent games' : 'Games picked for you');
        row.appendChild(wide);
      }
      const arrows = el('div', 'lay-arrows');
      const up = el('button', 'lay-arrow', '▲');
      const dn = el('button', 'lay-arrow', '▼');
      up.title = 'Move up';
      dn.title = 'Move down';
      up.disabled = idx === 0;
      dn.disabled = idx === L.page.length - 1;
      up.onclick = (e) => {
        e.stopPropagation();
        L.page[idx] = L.page[idx - 1];
        L.page[idx - 1] = key;
        commit();
      };
      dn.onclick = (e) => {
        e.stopPropagation();
        L.page[idx] = L.page[idx + 1];
        L.page[idx + 1] = key;
        commit();
      };
      arrows.append(up, dn);
      row.appendChild(arrows);
      if (key !== 'top') target(row, 'row', key);
      row.draggable = key === 'top';
      if (key === 'top') {
        row.ondragstart = (e) => {
          if (e.target !== row) return;
          e.dataTransfer.setData('text/plain', 'row:top');
        };
        target(row, 'row', 'top');
        // slot clicks inside must not trigger the row handler
        row.querySelector('.lay-top').addEventListener('click', (e) => e.stopPropagation());
      }
      frame.appendChild(row);
    });
  }
  paint();
  parent.appendChild(frame);
  parent.appendChild(el('div', 'set-desc lay-hint', 'Drag a block onto another one to swap them, or click one and then click where it should go. Use Hide to remove something you do not want.'));
  return { L, commit };
}

// ============================================================================
// Layout debug: finds blocks whose content is cut off or that cover each other
// ============================================================================
let layoutDbg = false;
let layoutDbgTimer = 0;
let layoutResRefresh = null;

function layoutCheck() {
  const main = document.getElementById('main');
  const out = { items: [], blocks: [] };
  if (!main) return out;
  const wasHidden = main.classList.contains('hide');
  if (wasHidden) {
    main.classList.remove('hide');
    main.style.visibility = 'hidden';
  }
  try {
    const secs = main.querySelectorAll(':scope > .gamesec');
    const blocks = [
      ['Music player', document.getElementById('player'), 'player'],
      ['Friends', document.getElementById('friends'), 'friends'],
      ['Mini profile', document.getElementById('mini'), 'mini'],
      ['Continue', secs[0], 'continue'],
      ['Recommended', secs[1], 'recommended'],
    ];
    const cs = (e) => getComputedStyle(e);
    const scrolls = (d, root, axis) => {
      for (let n = d; n && n !== root.parentElement; n = n.parentElement) {
        const o = axis === 'x' ? cs(n).overflowX : cs(n).overflowY;
        if (o === 'auto' || o === 'scroll') return true;
        if (n === root) break;
      }
      return false;
    };
    const label = (d) => {
      const t = (d.textContent || '').trim().slice(0, 18);
      return (d.id ? '#' + d.id : d.tagName.toLowerCase() + (d.className && typeof d.className === 'string' ? '.' + d.className.split(' ')[0] : '')) + (t ? ' "' + t + '"' : '');
    };
    const live = [];
    blocks.forEach(([name, e, key]) => {
      if (!e || cs(e).display === 'none') return;
      const er = e.getBoundingClientRect();
      if (er.width < 2 || er.height < 2) return;
      live.push([name, er, key, e]);
      let bad = { px: 0, side: '', who: '' };
      e.querySelectorAll('*').forEach((d) => {
        if (d.closest('.fxx, .fxlayer, .fxlayer *, .lay-prev') || cs(d).display === 'none') return;
        if (d.closest('[style*="display: none"]')) return;
        const dr = d.getBoundingClientRect();
        if (dr.width < 1 || dr.height < 1) return;
        const b = dr.bottom - er.bottom;
        const r = dr.right - er.right;
        if (b > bad.px && cs(e).overflowY !== 'visible' && !scrolls(d, e, 'y')) bad = { px: b, side: 'bottom', who: label(d) };
        if (r > bad.px && cs(e).overflowX !== 'visible' && !scrolls(d, e, 'x')) bad = { px: r, side: 'right side', who: label(d) };
      });
      if (bad.px > 2) out.items.push({ key, name, state: 'bad', msg: `${Math.round(bad.px)}px cut off at the ${bad.side} (${bad.who})` });
      else out.items.push({ key, name, state: 'ok', msg: `fits (${Math.round(er.width)} × ${Math.round(er.height)})` });
    });
    // covering each other
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i][1];
        const c = live[j][1];
        const w = Math.min(a.right, c.right) - Math.max(a.left, c.left);
        const h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (w > 3 && h > 3) {
          out.items.push({ key: live[i][2], name: live[i][0], state: 'bad', msg: `overlaps ${live[j][0]} by ${Math.round(w)} × ${Math.round(h)}px` });
          out.items.find((x) => x.key === live[j][2] && x.state === 'ok') && (out.items.find((x) => x.key === live[j][2] && x.state === 'ok').state = 'bad');
        }
      }
    if (main.scrollWidth > main.clientWidth + 1) out.items.push({ key: 'page', name: 'Home page', state: 'bad', msg: `scrolls sideways by ${main.scrollWidth - main.clientWidth}px` });
    // blocks that scroll on purpose
    const fr = document.querySelector('#friendsRow');
    if (fr && fr.offsetParent !== null && fr.scrollHeight > fr.clientHeight + 2 && cs(fr).overflowY === 'auto') out.items.push({ key: 'friends', name: 'Friends', state: 'info', msg: 'list scrolls (more friends than fit): normal' });
    out.blocks = live.map(([name, , key, e]) => ({ name, key, e, bad: out.items.some((x) => x.key === key && x.state === 'bad') }));
  } finally {
    if (wasHidden) {
      main.classList.add('hide');
      main.style.visibility = '';
    }
  }
  return out;
}

function layoutDbgPaint() {
  const main = document.getElementById('main');
  if (!main) return;
  main.querySelectorAll('.lay-dbg-bad, .lay-dbg-ok').forEach((e) => {
    e.classList.remove('lay-dbg-bad', 'lay-dbg-ok');
    e.removeAttribute('data-dbg');
  });
  main.classList.toggle('lay-dbg', layoutDbg);
  if (!layoutDbg) return;
  const res = layoutCheck();
  res.blocks.forEach((b) => {
    const why = res.items.filter((x) => x.key === b.key && x.state === 'bad').map((x) => x.msg)[0];
    b.e.classList.add(b.bad ? 'lay-dbg-bad' : 'lay-dbg-ok');
    b.e.setAttribute('data-dbg', b.name + (why ? ': ' + why : ': ok'));
  });
}

function layoutDbgSet(on) {
  layoutDbg = !!on;
  clearInterval(layoutDbgTimer);
  if (layoutDbg) layoutDbgTimer = setInterval(layoutDbgPaint, 1500);
  layoutDbgPaint();
}

function renderLayoutCheck(parent) {
  const head = el('div', 'set-actions');
  const run = el('button', 'pill primary', 'Check now');
  head.appendChild(run);
  const row = el('div', 'opt-row');
  const txt = el('div', 'opt-txt');
  txt.append(el('b', null, 'Outline blocks on the home page'), el('span', null, 'Green = fits, red = something is cut off or covered. Each box says why. Resets when you close the app.'));
  const sw = el('button', 'switch' + (layoutDbg ? ' on' : ''));
  sw.setAttribute('role', 'switch');
  sw.appendChild(el('i'));
  sw.onclick = () => {
    layoutDbgSet(!layoutDbg);
    sw.classList.toggle('on', layoutDbg);
  };
  row.append(txt, sw);
  const list = el('div', 'lay-res');
  const paint = () => {
    const res = layoutCheck();
    list.replaceChildren();
    if (!res.items.length) list.appendChild(el('div', 'set-desc', 'Nothing to check: no blocks are shown.'));
    const order = { bad: 0, info: 1, ok: 2 };
    res.items
      .slice()
      .sort((a, b) => order[a.state] - order[b.state])
      .forEach((it) => {
        const r = el('div', 'lay-resrow ' + it.state);
        r.append(el('b', null, (it.state === 'bad' ? '✕ ' : it.state === 'info' ? 'ℹ ' : '✓ ') + it.name), el('span', null, it.msg));
        list.appendChild(r);
      });
    const bads = res.items.filter((x) => x.state === 'bad').length;
    sum.textContent = bads ? bads + ' problem' + (bads > 1 ? 's' : '') + ' found' : 'No clipping or overlap found';
    sum.className = 'lay-sum ' + (bads ? 'bad' : 'ok');
  };
  const sum = el('div', 'lay-sum');
  run.onclick = paint;
  layoutResRefresh = () => list.isConnected && paint();
  parent.append(head, sum, list, row);
  paint();
}
