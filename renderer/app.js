'use strict';

// ============================================================================
// Helpers
// ============================================================================
const $ = (s, root = document) => root.querySelector(s);
const J = (url, opts) => window.api.fetchJson(url, opts);
const JA = (url, opts) => J(url, { ...(opts || {}), auth: true }); // logged-in request (cookie stays in the main process)
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/></svg>',
  charts: '<svg viewBox="0 0 24 24"><path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z"/></svg>',
  avatar: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
  vol: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
  like: '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>',
  people: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>',
  addfriend:'<svg viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
};

function fmtNum(n) {
  n = Number(n) || 0;
  const f = (v, s) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + s;
  if (n >= 1e6) return f(n / 1e6, 'M');
  if (n >= 1e3) return f(n / 1e3, 'K');
  return String(n);
}
const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const rating = (up, down) => (up + down > 0 ? Math.round((up * 100) / (up + down)) + '%' : '--');

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function setRangeFill(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  input.style.setProperty('--p', ((Number(input.value) - min) / (max - min)) * 100 + '%');
}

// Mouse wheel scrolls rows sideways
function wheelScroll(row) {
  row.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        row.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

// ============================================================================
// Roblox data
// ============================================================================
const universeCache = new Map(); // placeId -> universeId
const imageCache = { icon: new Map(), thumb: new Map() };

async function universeOf(placeId) {
  const key = String(placeId);
  if (universeCache.has(key)) return universeCache.get(key);
  const r = await J(`https://apis.roblox.com/universes/v1/places/${key}/universe`);
  universeCache.set(key, r.universeId);
  return r.universeId;
}

// universeIds -> Map(universeId -> game)
async function hydrateUniverses(ids) {
  const map = new Map();
  ids = [...new Set(ids.filter(Boolean))];
  for (const part of chunk(ids, 50)) {
    try {
      const [details, votes] = await Promise.all([
        J(`https://games.roblox.com/v1/games?universeIds=${part.join(',')}`),
        J(`https://games.roblox.com/v1/games/votes?universeIds=${part.join(',')}`).catch(() => ({ data: [] })),
      ]);
      const voteMap = new Map((votes.data || []).map((v) => [v.id, v]));
      for (const d of details.data || []) {
        const v = voteMap.get(d.id) || {};
        map.set(d.id, {
          universeId: d.id,
          placeId: d.rootPlaceId,
          name: d.name,
          players: d.playing || 0,
          up: v.upVotes || 0,
          down: v.downVotes || 0,
        });
        universeCache.set(String(d.rootPlaceId), d.id);
      }
    } catch (e) {
      console.warn('hydrate failed', e);
    }
  }
  return map;
}

async function loadImages(universeIds) {
  const need = (kind) => [...new Set(universeIds.filter((id) => id && !imageCache[kind].has(id)))];
  const tasks = [];
  for (const part of chunk(need('icon'), 100)) {
    tasks.push(
      J(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${part.join(',')}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`)
        .then((r) => (r.data || []).forEach((d) => d.imageUrl && imageCache.icon.set(d.targetId, d.imageUrl)))
        .catch(() => {})
    );
  }
  for (const part of chunk(need('thumb'), 100)) {
    tasks.push(
      J(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${part.join(',')}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`)
        .then((r) =>
          (r.data || []).forEach((d) => {
            const t = (d.thumbnails || [])[0];
            if (t && t.imageUrl) imageCache.thumb.set(d.universeId, t.imageUrl);
          })
        )
        .catch(() => {})
    );
  }
  await Promise.all(tasks);
}

async function headshots(userIds) {
  const out = new Map();
  for (const part of chunk([...new Set(userIds)], 100)) {
    try {
      const r = await J(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${part.join(',')}&size=150x150&format=Png&isCircular=false`);
      (r.data || []).forEach((d) => d.imageUrl && out.set(d.targetId, d.imageUrl));
    } catch (e) {
      console.warn('headshots failed', e);
    }
  }
  return out;
}

// Used if Roblox's discovery endpoints don't answer
const FALLBACK_PLACES = [920587237, 4924922222, 2753915549, 1962086868, 142823291, 6516141723, 606849621, 2788229376, 189707, 4623386862];

async function fetchRecommended() {
  try {
    const sortsRes = await J('https://games.roblox.com/v1/games/sorts?gameSortsContext=GamesDefaultSorts');
    const sorts = (sortsRes.sorts || []).filter((s) => s.token).slice(0, 5);
    for (const s of sorts) {
      const base = encodeURIComponent(s.token);
      const urls = [
        `https://games.roblox.com/v1/games/list?model.sortToken=${base}&model.maxRows=30&model.startRows=0`,
        `https://games.roblox.com/v1/games/list?sortToken=${base}&maxRows=30&startRows=0`,
      ];
      for (const url of urls) {
        try {
          const r = await J(url);
          const games = (r.games || []).map((g) => ({
            universeId: g.universeId,
            placeId: g.placeId,
            name: g.name,
            players: g.playerCount || 0,
            up: g.totalUpVotes || 0,
            down: g.totalDownVotes || 0,
          }));
          if (games.length) return games;
        } catch {
          /* try next */
        }
      }
    }
  } catch (e) {
    console.warn('sorts failed', e);
  }
  // Fallback: hydrate a fixed list of popular places
  const results = await Promise.allSettled(FALLBACK_PLACES.map(universeOf));
  const ids = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const map = await hydrateUniverses(ids);
  return ids.map((id) => map.get(id)).filter(Boolean);
}

// ============================================================================
// State
// ============================================================================
let S = {};
let media = { music: [], backgrounds: [] };
let recommended = [];
let continueTab = 0;
let continueGames = { recent: [], pinned: [] };

// ============================================================================
// Floating popup (one at a time)
// ============================================================================
const floatEl = $('#float');
let floatAnchor = null;

function openFloat(anchor, build, align = 'left') {
  if (floatAnchor === anchor && floatEl.classList.contains('open')) return closeFloat();
  floatEl.classList.remove('open');
  floatEl.replaceChildren();
  build(floatEl);
  floatAnchor = anchor;
  const r = anchor.getBoundingClientRect();
  floatEl.style.left = '0px';
  floatEl.style.top = '0px';
  const w = floatEl.offsetWidth;
  const h = floatEl.offsetHeight;
  let x = align === 'right' ? r.right - w : align === 'side' ? r.right + 10 : r.left;
  let y = align === 'side' ? r.top : r.bottom + 8;
  x = Math.max(8, Math.min(x, innerWidth - w - 8));
  if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
  floatEl.style.left = x + 'px';
  floatEl.style.top = y + 'px';
  requestAnimationFrame(() => floatEl.classList.add('open'));
}
function closeFloat() {
  floatEl.classList.remove('open');
  floatAnchor = null;
}
document.addEventListener('pointerdown', (e) => {
  if (!floatEl.classList.contains('open')) return;
  if (floatEl.contains(e.target) || (floatAnchor && floatAnchor.contains(e.target))) return;
  closeFloat();
});

function menuItem(text, fn) {
  const b = el('button', 'menu-item', text);
  b.addEventListener('click', () => {
    closeFloat();
    fn();
  });
  return b;
}

// ============================================================================
// Prompt modal
// ============================================================================
const ALT = '__alt__';
function promptModal({ title, text, placeholder = '', value = '', okLabel = 'OK', alt = null, secret = false }) {
  return new Promise((resolve) => {
    const m = $('#modal');
    const input = $('#modalInput');
    $('#modalTitle').textContent = title;
    $('#modalText').textContent = text || '';
    $('#modalOk').textContent = okLabel;
    input.type = secret ? 'password' : 'text'; // hides pasted cookies
    input.placeholder = placeholder;
    input.value = value;
    m.classList.add('open');
    setTimeout(() => input.focus(), 50);
    let altBtn = null;
    if (alt) {
      altBtn = el('button', 'pill', alt);
      $('#modalBtns').insertBefore(altBtn, $('#modalOk'));
      altBtn.onclick = () => done(ALT);
    }
    const done = (val) => {
      if (altBtn) altBtn.remove();
      input.type = 'text';
      input.value = '';
      m.classList.remove('open');
      $('#modalOk').onclick = $('#modalCancel').onclick = input.onkeydown = null;
      resolve(val);
    };
    $('#modalOk').onclick = () => done(input.value.trim() || null);
    $('#modalCancel').onclick = () => done(null);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') done(input.value.trim() || null);
      if (e.key === 'Escape') done(null);
    };
  });
}

// ============================================================================
// Window controls + sidebar
// ============================================================================
function initTitlebar() {
  $('#wmin').onclick = () => window.api.win.min();
  $('#wmax').onclick = () => window.api.win.max();
  $('#wclose').onclick = () => window.api.win.close();
}

function initSidebar() {
  const items = [
    { name: 'Home', icon: ICONS.home },
    { name: 'Charts', icon: ICONS.charts, view: 'charts' },
    { name: 'Avatar', icon: ICONS.avatar, view: 'avatar' },
    { name: 'News', icon: NEWS_ICON, view: 'news' },
    { name: 'More', icon: ICONS.more, menu: true },
    { name: 'Settings', icon: ICONS.gear, view: 'settings', bottom: true },
  ];
  const bar = $('#sidebar');
  items.forEach((it) => {
    const b = el('button', 'navbtn' + (it.name === 'Home' ? ' active' : ''));
    b.innerHTML = it.icon;
    b.appendChild(el('span', null, it.name));
    b.addEventListener('click', () => {
      if (it.menu) return openMore(b);
      if (it.view) return showView(it.view);
      if (it.action === 'avatar') return openAvatarEditor();
      if (it.link) {
        window.api.openLink(it.link);
        toast('Opening ' + it.name + ' in your browser');
      } else {
        showView('home');
      }
    });
    navBtns[it.name] = b;
    if (it.bottom) b.style.marginTop = 'auto';
    bar.appendChild(b);
  });
}

function openMore(anchor) {
  openFloat(
    anchor,
    (f) => {
      f.appendChild(menuItem('Background settings…', () => showView('settings', 'background')));
      f.appendChild(menuItem('Next background', () => bg.next()));
      f.appendChild(menuItem('Previous background', () => bg.prev()));
      f.appendChild(menuItem('Toggle dark overlay', () => bg.toggleOverlay()));
      f.appendChild(el('div', 'menu-sep'));
      f.appendChild(menuItem('Launch by Place ID…', launchByPlaceId));
      f.appendChild(menuItem('Refresh games & friends', refreshAll));
      f.appendChild(
        menuItem('Copy game-data debug info', async () => {
          try {
            await navigator.clipboard.writeText(JSON.stringify({ home: homeDebug, charts: chartDebug, look: lookDebug(), music: { mode: player.mode, ...(player.pc.dbg || {}), miss: player.pc.miss, haveCover: !!player.pc.thumb } }, null, 2));
            toast('Copied to the clipboard.');
          } catch {
            toast("Couldn't copy to the clipboard");
          }
        })
      );
      f.appendChild(el('div', 'menu-sep'));
      f.appendChild(menuItem('Open backgrounds folder', () => window.api.openFolder('backgrounds')));
      f.appendChild(menuItem('Music settings…', () => showView('settings', 'music')));
      f.appendChild(menuItem('Reload backgrounds', reloadMedia));
      f.appendChild(el('div', 'menu-sep'));
      if (S.loggedIn) {
        f.appendChild(menuItem('Log out', logout));
      } else {
        f.appendChild(menuItem('Log in with cookie…', cookieLogin));
        f.appendChild(menuItem('Log in with Roblox window', login));
        f.appendChild(menuItem('Change Roblox username…', changeUsername));
      }
    },
    'side'
  );
}

// ============================================================================
// Background
// ============================================================================
const bg = {
  layers: [$('#bgA'), $('#bgB')],
  active: -1,
  timer: null,
  set(index, save = true) {
    const list = media.backgrounds;
    if (!list.length) return;
    index = ((index % list.length) + list.length) % list.length;
    const item = list[index];
    S.backgroundIndex = index;
    S.backgroundName = item.name;
    if (save) window.api.setSettings({ backgroundIndex: index, backgroundName: item.name });
    const next = (this.active + 1) % 2;
    const layer = this.layers[next];
    layer.replaceChildren();
    let node;
    if (item.type === 'video') {
      node = document.createElement('video');
      node.src = item.url;
      node.autoplay = true;
      node.loop = true;
      node.muted = true;
      node.playsInline = true;
    } else {
      node = document.createElement('img');
      node.src = item.url; // GIFs animate natively
      node.alt = '';
    }
    applyAdjust(node, (S.bgAdjust || {})[item.name]);
    layer.appendChild(node);
    layer.classList.add('show');
    if (this.active >= 0) this.layers[this.active].classList.remove('show');
    this.active = next;
  },
  refreshAdjust() {
    const layer = this.layers[this.active];
    if (layer && layer.firstChild) applyAdjust(layer.firstChild, (S.bgAdjust || {})[S.backgroundName]);
  },
  next() { this.set((S.backgroundIndex || 0) + 1); },
  prev() { this.set((S.backgroundIndex || 0) - 1); },
  toggleOverlay() {
    S.overlayOn = !S.overlayOn;
    window.api.setSettings({ overlayOn: S.overlayOn });
    this.applyOverlay();
  },
  applyOverlay() {
    document.documentElement.style.setProperty('--overlay', S.overlayOn ? S.overlayOpacity : 0);
  },
  init() {
    this.applyOverlay();
    clearInterval(this.timer);
    this.active = -1;
    this.layers.forEach((l) => { l.classList.remove('show'); l.replaceChildren(); });
    if (media.backgrounds.length) {
      let idx = media.backgrounds.findIndex((b) => b.name === S.backgroundName);
      if (idx < 0) idx = S.backgroundIndex || 0;
      this.set(idx, false);
    }
    this.startTimer();
  },
  startTimer() {
    clearInterval(this.timer);
    if (S.backgroundCycleSeconds > 0 && media.backgrounds.length > 1) {
      this.timer = setInterval(() => this.next(), S.backgroundCycleSeconds * 1000);
    }
  },
};

// ============================================================================
// Music player: Windows media session (free), Spotify Premium API, or local files
// ============================================================================
const IS_WIN = /Windows/i.test(navigator.userAgent);

const player = {
  audio: new Audio(),
  songs: [],
  i: 0,
  seeking: false,
  volDragging: false,
  wired: false,
  mode: 'local', // 'pc' | 'spotify' | 'local'
  sp: { state: null, poll: null, tick: null },
  pc: { state: null, poll: null, tick: null, n: 0, key: '', thumb: '', shown: '', warned: false },
  _playing: null,

  pickMode() {
    if (S.musicOff) return 'off';
    if (S.musicSource === 'spotify' && S.spotifyConnected) return 'spotify';
    return IS_WIN ? 'pc' : 'local';
  },

  init(songs) {
    this.songs = songs;
    this.audio.volume = S.volume ?? 0.5;
    $('#pprev').innerHTML = ICONS.prev;
    $('#pnext').innerHTML = ICONS.next;
    $('#pvolicon').innerHTML = ICONS.vol;
    setRangeFill($('#pseek'));
    if (!this.wired) {
      this.wired = true;
      this.wire();
    }
    this.setMode(this.pickMode());
  },

  setPlayIcon(playing) {
    if (this._playing === playing) return;
    this._playing = playing;
    $('#pplay').innerHTML = playing ? ICONS.pause : ICONS.play;
  },

  setMode(mode) {
    if (S.musicOff) mode = 'off';
    [this.sp, this.pc].forEach((x) => {
      clearInterval(x.poll);
      clearInterval(x.tick);
      x.state = null;
    });
    this.mode = mode;
    this.pc.n = 0;
    this.pc.fails = 0;
    if (mode === 'pc') this.pc.warned = false;
    this.pc.key = '';
    this.pc.thumb = '';
    this.pc.shown = '';
    this.volDragging = false;
    $('#pseek').style.opacity = 1;
    if (mode === 'off') {
      this.audio.pause();
    } else if (mode === 'spotify') {
      this.audio.pause();
      this.spPoll();
      this.sp.poll = setInterval(() => this.spPoll(), 3000);
      this.sp.tick = setInterval(() => this.spRender(), 250);
    } else if (mode === 'pc') {
      this.audio.pause();
      this.pcPoll(true);
      this.pc.poll = setInterval(() => this.pcPoll(false), 1500);
      this.pc.tick = setInterval(() => this.pcRender(), 250);
    } else {
      const vol = $('#pvolume');
      vol.value = this.audio.volume;
      setRangeFill(vol);
      this.loadLocal(0, false);
    }
  },

  wire() {
    $('#art').addEventListener('error', () => {
      if ($('#art').getAttribute('src')) this.artBroken();
    });
    const a = this.audio;
    const seek = $('#pseek');
    const vol = $('#pvolume');
    const local = () => this.mode === 'local';

    $('#pplay').onclick = () => {
      if (this.mode === 'spotify') return this.spToggle();
      if (this.mode === 'pc') return this.pcCmd('toggle');
      if (!this.songs.length) {
        toast('Set up music in Settings → Music');
        return showView('settings', 'music');
      }
      a.paused ? a.play().catch(() => {}) : a.pause();
    };
    $('#pprev').onclick = () => {
      if (this.mode === 'spotify') return this.spCmd('POST', '/v1/me/player/previous');
      if (this.mode === 'pc') return this.pcCmd('prev');
      if (!this.songs.length) return;
      if (a.currentTime > 3) a.currentTime = 0;
      else this.loadLocal(this.i - 1, true);
    };
    $('#pnext').onclick = () => {
      if (this.mode === 'spotify') return this.spCmd('POST', '/v1/me/player/next');
      if (this.mode === 'pc') return this.pcCmd('next');
      if (this.songs.length) this.loadLocal(this.i + 1, true);
    };

    a.addEventListener('play', () => local() && this.setPlayIcon(true));
    a.addEventListener('pause', () => local() && this.setPlayIcon(false));
    a.addEventListener('ended', () => local() && this.loadLocal(this.i + 1, true));
    a.addEventListener('loadedmetadata', () => local() && ($('#pttot').textContent = fmtTime(a.duration)));
    a.addEventListener('timeupdate', () => {
      if (!local() || this.seeking || !a.duration) return;
      seek.value = Math.round((a.currentTime / a.duration) * 1000);
      setRangeFill(seek);
      $('#ptcur').textContent = fmtTime(a.currentTime);
    });

    seek.addEventListener('input', () => {
      this.seeking = true;
      setRangeFill(seek);
      const dur = this.mode === 'spotify' ? this.spDuration() : this.mode === 'pc' ? this.pcDuration() : a.duration;
      if (dur) $('#ptcur').textContent = fmtTime((seek.value / 1000) * dur);
    });
    seek.addEventListener('change', () => {
      if (this.mode === 'spotify') {
        const dur = this.spDuration();
        if (dur) {
          const ms = Math.round((seek.value / 1000) * dur * 1000);
          if (this.sp.state) {
            this.sp.state.progress_ms = ms;
            this.sp.state.at = Date.now();
          }
          this.spCmd('PUT', `/v1/me/player/seek?position_ms=${ms}`);
        }
      } else if (this.mode === 'pc') {
        const st = this.pc.state;
        const dur = this.pcDuration();
        if (st && dur) {
          if (!st.canSeek) {
            toast("The app doesn't allow seeking from outside");
          } else {
            const ms = Math.round((seek.value / 1000) * dur * 1000);
            st.position = ms;
            st.age = 0;
            st.at = Date.now();
            this.pcCmd('seek:' + ms);
          }
        }
      } else if (a.duration) {
        a.currentTime = (seek.value / 1000) * a.duration;
      }
      this.seeking = false;
    });

    let volTimer;
    vol.addEventListener('input', () => {
      setRangeFill(vol);
      this.volDragging = true;
      clearTimeout(volTimer);
      if (this.mode === 'spotify') {
        volTimer = setTimeout(async () => {
          await this.spCmd('PUT', `/v1/me/player/volume?volume_percent=${Math.round(vol.value * 100)}`);
          this.volDragging = false;
        }, 250);
      } else if (this.mode === 'pc') {
        volTimer = setTimeout(async () => {
          const r = await window.api.mediaCmd('vol:set:' + Number(vol.value).toFixed(2));
          if (!r.ok) {
            toast(
              r.error === 'novolume'
                ? 'Volume can be changed while Spotify is playing'
                : "Couldn't change Spotify's volume"
            );
          }
          this.volDragging = false;
        }, 250);
      } else {
        a.volume = Number(vol.value);
        volTimer = setTimeout(() => {
          window.api.setSettings({ volume: a.volume });
          this.volDragging = false;
        }, 400);
      }
    });
  },

  // ---------- local files (fallback) ----------
  loadLocal(n, play) {
    const a = this.audio;
    this.setPlayIcon(false);
    if (!this.songs.length) {
      a.removeAttribute('src');
      $('#ptitle').textContent = 'No music source';
      $('#partist').textContent = 'Press play to set it up';
      $('#art').removeAttribute('src');
      $('#pseek').value = 0;
      setRangeFill($('#pseek'));
      $('#ptcur').textContent = '0:00';
      $('#pttot').textContent = '0:00';
      return;
    }
    this.i = ((n % this.songs.length) + this.songs.length) % this.songs.length;
    const s = this.songs[this.i];
    a.src = s.src;
    $('#ptitle').textContent = s.title;
    $('#partist').textContent = s.artist;
    if (s.cover) $('#art').src = s.cover;
    else $('#art').removeAttribute('src');
    $('#pseek').value = 0;
    setRangeFill($('#pseek'));
    $('#ptcur').textContent = '0:00';
    $('#pttot').textContent = '0:00';
    if (play) a.play().catch(() => {});
  },

  // ---------- Windows media session (free) ----------
  pcDuration() {
    const st = this.pc.state;
    return st && st.duration > 0 ? st.duration / 1000 : 0;
  },

  pcUnavailable(detail) {
    if (!this.pc.warned) {
      this.pc.warned = true;
      toast('Windows media control failed' + (detail ? ': ' + String(detail).slice(0, 140) : ''));
    }
    this.setMode('local');
  },

  artBroken() {
    if (this.mode !== 'pc' || !this.pc.thumb) return;
    this.pc.thumb = '';
    this.pc.shown = '';
    this.pc.miss = 2; // next poll tries the online lookup
    this.pc.lookedUp = 0;
  },

  async pcPoll(first) {
    if (this.mode !== 'pc') return;
    const r = await window.api.mediaCmd(first ? 'poll:full' : 'poll');
    if (this.mode !== 'pc') return;
    if (!r.ok) {
      if (r.error === 'unsupported' || r.error === 'spawn') return this.pcUnavailable(r.detail);
      if (r.error === 'exit' || r.error === 'timeout') {
        this.pc.fails = (this.pc.fails || 0) + 1;
        if (this.pc.fails >= 3) return this.pcUnavailable(r.detail);
      }
      return; // helper restarting or busy: keep what is on screen
    }
    this.pc.fails = 0;
    this.pc.dbg = Object.assign(this.pc.dbg || {}, {
      app: r.app, key: r.key, active: r.active,
      thumbFromHelperLen: r.thumb ? r.thumb.length : (this.pc.dbg && this.pc.dbg.thumbFromHelperLen) || 0,
      thumbErr: r.thumbErr || '',
    });
    if (r.active) {
      if (r.key !== this.pc.key) {
        this.pc.key = r.key;
        this.pc.thumb = '';
        this.pc.miss = 0;
        this.pc.lookedUp = 0;
      }
      if (r.thumb) this.pc.thumb = r.thumb;
      if (r.thumbErr && r.thumbErr !== 'no thumbnail' && !this.pc.errShown) {
        this.pc.errShown = true;
        console.warn('cover error', r.thumbErr);
        toast('Cover from Windows failed: ' + String(r.thumbErr).slice(0, 120));
      }
      // No cover from Windows after a few checks: look it up online by song name.
      if (!this.pc.thumb) {
        this.pc.miss++;
        // Ask the helper to send the cover again now and then (it normally sends it only once per song)
        if (this.pc.miss % 6 === 0 && this.pc.miss <= 60) window.api.mediaCmd('poll:full').then((x) => {
          if (x && x.ok && x.thumb && this.pc.key === x.key && !this.pc.thumb) {
            this.pc.thumb = x.thumb;
            this.pcRender();
          }
        });
        // And look it up online by song name (retry once later if the first try finds nothing)
        const attempt = this.pc.miss >= 3 && !this.pc.lookedUp ? 1 : this.pc.miss >= 15 && this.pc.lookedUp === 1 ? 2 : 0;
        if (attempt && r.title) {
          this.pc.lookedUp = attempt;
          const key = r.key;
          window.api.artLookup(r.artist, r.title).then((url) => {
            this.pc.dbg.lookup = url || 'nothing found';
            if (url && this.mode === 'pc' && this.pc.key === key && !this.pc.thumb) {
              this.pc.thumb = url;
              this.pcRender();
            }
          });
        }
      }
      this.pc.state = { ...r, at: Date.now() };
      this.pc.n++;
      if (!this.volDragging && this.pc.n % 10 === 1) this.pcVolRead();
    } else {
      this.pc.state = null;
    }
    this.pcRender();
  },

  async pcVolRead() {
    const r = await window.api.mediaCmd('vol:get');
    if (this.mode !== 'pc' || this.volDragging) return;
    if (r.ok && typeof r.volume === 'number') {
      const vol = $('#pvolume');
      vol.value = r.volume;
      setRangeFill(vol);
    }
  },

  pcRender() {
    if (this.mode !== 'pc') return;
    const st = this.pc.state;
    const seek = $('#pseek');
    if (!st || !st.title) {
      $('#ptitle').textContent = 'Nothing playing';
      $('#partist').textContent = 'Open Spotify and press play';
      $('#art').removeAttribute('src');
      this.pc.shown = '';
      this.setPlayIcon(false);
      if (!this.seeking) {
        seek.value = 0;
        setRangeFill(seek);
      }
      $('#ptcur').textContent = '0:00';
      $('#pttot').textContent = '0:00';
      return;
    }
    if ($('#ptitle').textContent !== st.title) $('#ptitle').textContent = st.title;
    const artist = st.artist || st.album || '';
    if ($('#partist').textContent !== artist) $('#partist').textContent = artist;
    if (this.pc.shown !== this.pc.thumb) {
      this.pc.shown = this.pc.thumb;
      if (this.pc.thumb) $('#art').src = this.pc.thumb;
      else $('#art').removeAttribute('src');
    }
    this.setPlayIcon(!!st.playing);

    const dur = st.duration || 0;
    let prog = (st.position || 0) + (st.playing ? (st.age || 0) + (Date.now() - st.at) : 0);
    if (dur > 0) prog = Math.min(prog, dur);
    if (!this.seeking) {
      seek.value = dur > 0 ? Math.round((prog / dur) * 1000) : 0;
      setRangeFill(seek);
      $('#ptcur').textContent = dur > 0 ? fmtTime(prog / 1000) : '0:00';
    }
    $('#pttot').textContent = dur > 0 ? fmtTime(dur / 1000) : '0:00';
    seek.style.opacity = st.canSeek ? 1 : 0.5;
  },

  async pcCmd(cmd) {
    const r = await window.api.mediaCmd(cmd);
    if (!r.ok) {
      if (r.error === 'nosession') {
        toast('Opening Spotify… press play once it has loaded');
        window.api.openLink('spotify:');
      } else if (r.error === 'unsupported' || r.error === 'spawn') {
        this.pcUnavailable(r.detail);
      } else if (!r.error) {
        toast("The app didn't accept that control");
      }
    }
    setTimeout(() => this.pcPoll(false), 300);
    return r;
  },

  // ---------- Spotify Premium (Web API) ----------
  spDuration() {
    const it = this.sp.state && this.sp.state.item;
    return it ? it.duration_ms / 1000 : 0;
  },

  spExpired() {
    S.spotifyConnected = false;
    this.setMode(this.pickMode());
    toast('Spotify disconnected. Reconnect in Settings → Music.');
    if (view === 'settings') renderSettings();
  },

  async spPoll() {
    if (this.mode !== 'spotify') return;
    const r = await window.api.spotifyApi({ method: 'GET', path: '/v1/me/player?additional_types=episode' });
    if (this.mode !== 'spotify') return;
    if (r.status === 401) return this.spExpired();
    if (r.status === 200 && r.data) this.sp.state = { ...r.data, at: Date.now() };
    else if (r.status === 204 || r.status === 200) this.sp.state = null;
    this.spRender();
  },

  spRender() {
    if (this.mode !== 'spotify') return;
    const st = this.sp.state;
    const it = st && st.item;
    const seek = $('#pseek');
    const vol = $('#pvolume');
    if (!it) {
      $('#ptitle').textContent = 'Nothing playing';
      $('#partist').textContent = 'Open Spotify and press play';
      $('#art').removeAttribute('src');
      this.setPlayIcon(false);
      if (!this.seeking) {
        seek.value = 0;
        setRangeFill(seek);
      }
      $('#ptcur').textContent = '0:00';
      $('#pttot').textContent = '0:00';
      return;
    }
    const title = it.name || '';
    const artist = it.artists ? it.artists.map((x) => x.name).join(', ') : it.show ? it.show.name : '';
    const imgs = (it.album && it.album.images) || it.images || [];
    const art = (imgs[1] || imgs[0] || {}).url;
    if ($('#ptitle').textContent !== title) $('#ptitle').textContent = title;
    if ($('#partist').textContent !== artist) $('#partist').textContent = artist;
    if (art) {
      if ($('#art').getAttribute('src') !== art) $('#art').src = art;
    } else {
      $('#art').removeAttribute('src');
    }
    this.setPlayIcon(!!st.is_playing);

    const dur = it.duration_ms || 1;
    const prog = Math.min(dur, (st.progress_ms || 0) + (st.is_playing ? Date.now() - st.at : 0));
    if (!this.seeking) {
      seek.value = Math.round((prog / dur) * 1000);
      setRangeFill(seek);
      $('#ptcur').textContent = fmtTime(prog / 1000);
    }
    $('#pttot').textContent = fmtTime(dur / 1000);
    if (st.device && st.device.volume_percent != null && !this.volDragging) {
      vol.value = st.device.volume_percent / 100;
      setRangeFill(vol);
    }
  },

  async spToggle() {
    const playing = this.sp.state && this.sp.state.is_playing;
    await this.spCmd('PUT', playing ? '/v1/me/player/pause' : '/v1/me/player/play');
  },

  async spCmd(method, path, body) {
    const r = await window.api.spotifyApi({ method, path, body });
    const reason = r.data && r.data.error && r.data.error.reason;
    if (r.status === 401) this.spExpired();
    else if (r.status === 403 && reason === 'PREMIUM_REQUIRED') toast('Spotify Premium is needed for this mode. Switch to "This PC" in Settings → Music.');
    else if (r.status === 404 || reason === 'NO_ACTIVE_DEVICE') await this.spWake();
    else if (r.status >= 400) toast('Spotify said no (' + r.status + ')');
    setTimeout(() => this.spPoll(), 450);
    return r;
  },

  // No active device: try to start playback on one that Spotify knows about.
  async spWake() {
    const d = await window.api.spotifyApi({ method: 'GET', path: '/v1/me/player/devices' });
    const list = (d.data && d.data.devices) || [];
    if (!list.length) return toast('Open Spotify on your PC or phone first, then press play');
    const target = list.find((x) => x.is_active) || list[0];
    const r = await window.api.spotifyApi({
      method: 'PUT',
      path: '/v1/me/player',
      body: { device_ids: [target.id], play: true },
    });
    toast(r.status >= 400 ? 'Could not start Spotify on ' + target.name : 'Playing on ' + target.name);
  },
};

// ============================================================================
// Profile + friends
// ============================================================================
async function resolveUsername(name) {
  const r = await J('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    body: { usernames: [name], excludeBannedUsers: true },
  });
  const u = (r.data || [])[0];
  if (!u) throw new Error('not found');
  return u;
}

async function changeUsername() {
  const name = await promptModal({
    title: 'Your Roblox username',
    text: 'Used to show your avatar and friends. Only public info is read.',
    placeholder: 'e.g. osloeb',
    value: S.username || '',
    okLabel: 'Save',
  });
  if (!name) return;
  try {
    const u = await resolveUsername(name);
    S = await window.api.setSettings({ username: u.name, userId: u.id, displayName: u.displayName });
    await loadProfile();
    await loadFriends();
    toast('Signed in as ' + u.name);
  } catch {
    toast('Could not find that username');
  }
}

// ---- Name tags (e.g. OWNER, OWNER'S ALT). They come from bloxhome.config.json, not from the
// profile server, so nobody can give themselves one. ----
const tagsById = new Map(); // userId -> { label, icon }
const CROWN = '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/></svg>';
const TAGICON = '<svg viewBox="0 0 24 24"><path d="M3 4h8l10 10-7 7L4 11V4zm4 2.5A1.5 1.5 0 1 0 7 9.5a1.5 1.5 0 0 0 0-3z"/></svg>';
const TAG_ICONS = {
  star: ["M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", 0, ["#fff3b0", "#ffc933", "#4a3300"]],
  heart: ["M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", 0, ["#ffb3c7", "#ff4d7d", "#4a0016"]],
  shield: ["M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z", 0, ["#c9d3e6", "#7f93b8", "#10192b"]],
  fire: ["M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z", 0, ["#ffd08a", "#ff6a1a", "#3d1300"]],
  diamond: ["M6 3h12l4 6-10 13L2 9l4-6z", 0, ["#d6f7ff", "#4fd8ff", "#00323f"]],
  bolt: ["M7 2v11h3v9l7-12h-4l4-8z", 0, ["#fff7a8", "#ffe600", "#3d3400"]],
  skull: ["M12 2C7.58 2 4 5.58 4 10c0 2.6 1.24 4.9 3.17 6.36V20h2.33v-2h1.5v2h2v-2h1.5v2h2.33v-3.64C18.76 14.9 20 12.6 20 10c0-4.42-3.58-8-8-8zM6.75 10.75a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 1 0 -3.5 0zM13.75 10.75a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 1 0 -3.5 0z", 1, ["#e8e8ee", "#9a9aaa", "#16161d"]],
  ghost: ["M12 2a8 8 0 0 0-8 8v12l2.67-2 2.66 2 2.67-2 2.67 2 2.66-2L20 22V10a8 8 0 0 0-8-8zM7.5 10.5a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0zM13.5 10.5a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0z", 1, ["#f1ecff", "#b9a4ff", "#1f1442"]],
  moon: ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", 0, ["#cfd6ff", "#7280e8", "#0d1240"]],
  sun: ["M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0zM11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z", 0, ["#ffe9a0", "#ffb300", "#3d2800"]],
  leaf: ["M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z", 0, ["#c8f5c2", "#4fcf5f", "#0b3012"]],
  music: ["M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z", 0, ["#f3c6ff", "#c25cf0", "#2f0a40"]],
  gamepad: ["M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM11 13H9v2H7v-2H5v-2h2V9h2v2h2v2zM14.0 13.5a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0zM17.0 10.5a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0z", 1, ["#c6ffe6", "#2ed3a0", "#04342a"]],
  wrench: ["M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z", 0, ["#dfe3ea", "#98a2b3", "#1b2230"]],
  check: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", 1, ["#c9ffd0", "#34d058", "#06330f"]],
  flag: ["M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z", 0, ["#ffc9c9", "#f04848", "#430606"]],
  bug: ["M20 8h-2.81a5.985 5.985 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17a6.002 6.002 0 0 0-2.83 0L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z", 0, ["#e1ffb0", "#8fd42a", "#243d00"]],
  rocket: ["M12 2c3 2 5 6 5 10l2 3v3l-3-1.5H8L5 18v-3l2-3c0-4 2-8 5-10zM10 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM10 20h4l-2 3-2-3z", 1, ["#ffd1b0", "#ff7a3d", "#3d1500"]],
  paw: ["M4.5 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM15.5 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM7.5 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM12.5 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM12 11c-3 0-6 3.5-6 6.2 0 1.6 1.2 2.3 2.6 2.3 1 0 2-.5 3.4-.5s2.4.5 3.4.5c1.4 0 2.6-.7 2.6-2.3C18 14.5 15 11 12 11z", 0, ["#f5d9bd", "#c98a4b", "#34200c"]],
  eye: ["M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", 1, ["#d9e9ff", "#6aa8ff", "#0b2347"]],
};
function tagBadge(id) {
  return tagBadgeOf(tagsById.get(Number(id)));
}
function tagBadgeOf(t) {
  if (!t) return null;
  const b = el('span', 'ownerbadge' + (t.icon === 'tag' ? ' alt' : ''));
  const ic = TAG_ICONS[t.icon];
  if (ic) {
    b.innerHTML = '<svg viewBox="0 0 24 24"><path' + (ic[1] ? ' fill-rule="evenodd"' : '') + ' d="' + ic[0] + '"/></svg><i></i>';
    b.style.background = 'linear-gradient(135deg, ' + ic[2][0] + ', ' + ic[2][1] + ')';
    b.style.color = ic[2][2];
    b.style.boxShadow = '0 0 12px ' + ic[2][1] + '88';
  } else b.innerHTML = (t.icon === 'tag' ? TAGICON : CROWN) + '<i></i>';
  b.querySelector('i').textContent = t.label;
  b.title = t.label;
  return b;
}
function withTag(node, id) {
  node.querySelectorAll('.ownerbadge').forEach((n) => n.remove());
  const b = tagBadge(id);
  if (b) node.appendChild(b);
}
function paintMiniBadge() {
  const mini = $('#miniName');
  mini.querySelectorAll('.ownerbadge').forEach((n) => n.remove());
  if (S.loggedIn) withTag(mini, S.userId);
}
const ownerReady = (async () => {
  try {
    const tags = await window.api.tagsConfig();
    const need = tags.filter((t) => !t.userId && t.username);
    tags.filter((t) => t.userId && t.label).forEach((t) => tagsById.set(t.userId, t));
    if (need.length) {
      const r = await J('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        body: { usernames: need.map((t) => t.username), excludeBannedUsers: false },
      });
      (r.data || []).forEach((u) => {
        const t = need.find((x) => x.username.toLowerCase() === String(u.requestedUsername || u.name).toLowerCase());
        if (t && t.label) tagsById.set(u.id, t);
      });
    }
  } catch {
    /* no tags */
  }
  paintMiniBadge();
})();

async function loadProfile() {
  const mine = S.userId ? lookOf(S.userId) || {} : {};
  $('#miniName').textContent = mine.nick || S.username || 'Guest';
  paintMiniBadge();
  if (!S.userId) return;
  const map = await headshots([S.userId]);
  if (map.has(S.userId)) $('#miniAvatar').src = map.get(S.userId);
  if (mine.pfp) $('#miniAvatar').src = mine.pfp;
}

function initMini() {
  $('#bell').innerHTML = ICONS.bell;
  const bellBadge = el('span', 'bellbadge');
  bellBadge.id = 'bellBadge';
  $('#bell').appendChild(bellBadge);
  $('#bell').onclick = (e) =>
    openFloat(
      e.currentTarget,
      (f) => {
        f.appendChild(el('div', 'pop-name', 'Notifications'));
        f.appendChild(
          el(
            'div',
            'pop-note',
            !S.loggedIn
              ? 'Log in to see your notifications.'
              : unreadCount
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}. Open Roblox to read them.`
              : 'No new notifications.'
          )
        );
      },
      'right'
    );
  $('#miniProfile').onclick = (e) =>
    openFloat(
      e.currentTarget,
      (f) => {
        const head = el('div', 'pop-head');
        const img = el('img');
        img.src = $('#miniAvatar').src || '';
        const t = el('div');
        const pn = el('div', 'pop-name', S.displayName || S.username || 'Guest');
        if (S.loggedIn) withTag(pn, S.userId);
        t.appendChild(pn);
        t.appendChild(el('div', 'pop-sub', S.username ? '@' + S.username : 'Not signed in'));
        head.append(img, t);
        f.appendChild(head);
        const actions = el('div', 'pop-actions');
        if (S.userId) {
          actions.appendChild(
            menuItem('View my profile', () =>
              showProfile({ id: S.userId, name: S.username, displayName: S.displayName, shot: $('#miniAvatar').src })
            )
          );
        }
        accountsInfo.accounts
          .filter((a) => !(S.loggedIn && a.userId === S.userId))
          .slice(0, 6)
          .forEach((a) => actions.appendChild(menuItem('Switch to ' + (a.displayName || a.username), () => switchAccount(a.userId))));
        if (S.loggedIn) {
          actions.appendChild(menuItem('Add another account…', () => addAccount('cookie')));
          actions.appendChild(menuItem('Edit avatar', openAvatarEditor));
          actions.appendChild(menuItem('Log out', logout));
        } else {
          actions.appendChild(menuItem('Log in with cookie…', cookieLogin));
          actions.appendChild(menuItem('Log in with Roblox window', login));
          actions.appendChild(menuItem('Change username…', changeUsername));
        }
        f.appendChild(actions);
      },
      'right'
    );
}

// BloxCool users can have their own name and picture; show them in the friends bar
async function applyFriendLooks() {
  const ids = friendEls.map((x) => x.f.id);
  if (!ids.length) return;
  for (const part of chunk(ids, 60)) await fetchLooks(part);
  friendEls.forEach((x) => {
    const c = lookOf(x.f.id) || {};
    x.label.textContent = c.nick || x.f.name;
    if (c.pfp) x.img.src = c.pfp;
    else if (x.shot) x.img.src = x.shot;
    fxPic(x.img.parentElement, c.fx && c.fx.pic);
  });
}

// ---- Only the first few friends (online ones first) are shown on the home page; "See all" opens everyone ----
function applyFriendLimit() {
  const row = $('#friendsRow');
  const box = document.getElementById('friends');
  if (!row || !box || box.offsetParent === null && getComputedStyle(box).display === 'none') return;
  row.querySelectorAll(':scope > .fall').forEach((n) => n.remove());
  friendEls.forEach((x) => (x.b.style.display = ''));
  const friends = [...row.children].filter((c) => friendEls.some((x) => x.b === c));
  const hasAdd = !!row.querySelector(':scope > .fadd');
  // up to 20 friends (or your own limit) are listed and you scroll through them with the mouse wheel; the rest are under "See all"
  const show = Math.min(friends.length, layoutGet().size.friendsMax || 20);
  friends.forEach((c, i) => (c.style.display = i < show ? '' : 'none'));
  if (friends.length > show) {
    const b = el('button', 'friend fall');
    const circ = el('div', 'addcircle moretile', '+' + (friends.length - show));
    b.append(circ, el('span', null, 'See all'));
    b.onclick = openAllFriends;
    row.appendChild(b);
  }
}
// in the thin one-row shape the mouse wheel scrolls sideways
document.addEventListener(
  'wheel',
  (e) => {
    const row = e.target.closest && e.target.closest('#friends[data-form="strip"] #friendsRow');
    if (!row || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft += e.deltaY || e.deltaX;
    e.preventDefault();
  },
  { passive: false }
);
function openAllFriends() {
  const ov = el('div', 'fpanel');
  const box = el('div', 'fpbox');
  const head = el('div', 'fphead');
  head.appendChild(el('h2', null, `Friends (${friendEls.length})`));
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search friends';
  search.className = 'fpsearch';
  const close = el('button', 'pill', 'Close');
  head.append(search, close);
  const grid = el('div', 'fpgrid');
  const rank = (id) => {
    const t = presenceMap.get(id)?.userPresenceType;
    return t === 2 ? 3 : t === 1 || t === 3 ? 2 : 1;
  };
  const items = [...friendEls]
    .sort((a, b) => rank(b.f.id) - rank(a.f.id) || String(a.f.name).localeCompare(String(b.f.name)))
    .map((x) => {
      const c = el('button', 'fpcard');
      const w = el('div', 'avwrap');
      const im = el('img');
      im.src = x.img.src;
      im.alt = '';
      const d = el('i', x.dot.className);
      w.append(im, d);
      const nm = x.label.textContent || x.f.name;
      c.append(w, el('span', null, nm));
      c.onclick = () => {
        shut();
        x.b.click();
      };
      grid.appendChild(c);
      return { c, key: (nm + ' ' + x.f.name + ' ' + (x.f.displayName || '')).toLowerCase() };
    });
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    items.forEach((i) => (i.c.style.display = !q || i.key.includes(q) ? '' : 'none'));
  };
  const key = (e) => e.key === 'Escape' && shut();
  function shut() {
    document.removeEventListener('keydown', key);
    ov.remove();
  }
  close.onclick = shut;
  ov.onclick = (e) => e.target === ov && shut();
  document.addEventListener('keydown', key);
  box.append(head, grid);
  ov.appendChild(box);
  document.body.appendChild(ov);
  search.focus();
}

async function loadFriends() {
  const row = $('#friendsRow');
  row.replaceChildren();
  friendEls = [];
  const add = el('button', 'friend fadd');
  const circle = el('div', 'addcircle');
  circle.innerHTML = ICONS.addfriend;
  add.append(circle, el('span', null, 'Add Friends'));
  add.onclick = () => window.api.openLink('https://www.roblox.com/users/friends');
  row.appendChild(add);

  if (!S.userId) {
    $('#friendsTitle').textContent = 'Friends';
    row.appendChild(el('div', 'empty', 'Set your Roblox username (More → Change username) to see friends.'));
    return;
  }
  let friends = [];
  try {
    const r = await J(`https://friends.roblox.com/v1/users/${S.userId}/friends`);
    friends = r.data || [];
  } catch {
    row.appendChild(el('div', 'empty', "Couldn't load friends (is your friends list private?)."));
    return;
  }
  $('#friendsTitle').textContent = `Friends (${friends.length})`;

  // Roblox's friends list often returns blank names, so look them up separately.
  const fillNames = async () => {
    const missing = friends.filter((f) => !f.name).map((f) => f.id);
    for (const part of chunk(missing, 100)) {
      try {
        const r = await J('https://users.roblox.com/v1/users', {
          method: 'POST',
          body: { userIds: part, excludeBannedUsers: false },
        });
        (r.data || []).forEach((u) => {
          const f = friends.find((x) => x.id === u.id);
          if (f) {
            f.name = u.name;
            f.displayName = u.displayName;
          }
        });
      } catch (e) {
        console.warn('name lookup failed', e);
      }
    }
  };
  const [shots] = await Promise.all([headshots(friends.map((f) => f.id)), fillNames()]);
  friends.forEach((f) => {
    if (!f.name) f.name = f.displayName || 'User ' + f.id;
    const b = el('button', 'friend');
    b.title = f.displayName && f.displayName !== f.name ? `${f.displayName} (@${f.name})` : f.name;
    const img = el('img');
    if (shots.has(f.id)) img.src = shots.get(f.id);
    const wrap = el('div', 'avwrap');
    const dot = el('i', 'dot');
    wrap.append(img, dot);
    const label = el('span', null, f.name);
    b.append(wrap, label);
    b.onclick = () =>
      showProfile({ id: f.id, name: f.name, displayName: f.displayName, shot: shots.get(f.id), status: presenceText(f.id) });
    row.appendChild(b);
    friendEls.push({ f, b, dot, img, label, shot: shots.get(f.id) });
  });
  applyFriendLimit();
  loadPresence();
  applyFriendLooks();
}

// ============================================================================
// Games
// ============================================================================
function makeCard(g, wide) {
  const b = el('div', 'card' + (wide ? ' wide' : ''));
  b.tabIndex = 0;
  b.setAttribute('role', 'button');
  const tw = el('div', 'thumbwrap');
  const img = el('img', 'thumb');
  const src = wide ? imageCache.thumb.get(g.universeId) || imageCache.icon.get(g.universeId) : imageCache.icon.get(g.universeId);
  if (src) img.src = src;
  img.loading = 'lazy';
  tw.appendChild(img);
  const fab = el('button', 'playfab');
  fab.innerHTML = ICONS.play;
  fab.title = 'Play now';
  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    playGame(g);
  });
  tw.appendChild(fab);
  b.appendChild(tw);
  b.appendChild(el('div', 'name', g.name));
  const stats = el('div', 'stats');
  const like = el('span');
  like.innerHTML = ICONS.like;
  like.appendChild(document.createTextNode(rating(g.up, g.down)));
  const ppl = el('span');
  ppl.innerHTML = ICONS.people;
  ppl.appendChild(document.createTextNode(fmtNum(g.players)));
  stats.append(like, ppl);
  b.appendChild(stats);

  b.title = 'Click for details · ▶ to play · Right-click to ' + (isPinned(g) ? 'unpin' : 'pin');
  b.addEventListener('click', () => openGame(g));
  b.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openGame(g);
  });
  b.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    togglePin(g);
  });
  return b;
}

// ---- Game page (description, screenshots, stats) ----
let gameToken = 0;
function closeGame() {
  $('#gamepage').classList.remove('open');
  gameToken++;
}
$('#gamepage').addEventListener('pointerdown', (e) => {
  if (e.target.id === 'gamepage') closeGame();
});

async function openGame(g) {
  const my = ++gameToken;
  closeFloat();
  const box = $('#gameBox');
  box.replaceChildren();
  box.scrollTop = 0;

  const close = el('button', 'gclose', '✕');
  close.title = 'Close';
  close.onclick = closeGame;

  const hero = el('div', 'ghero');
  const hi = imageCache.thumb.get(g.universeId);
  if (hi) hero.style.backgroundImage = `url("${hi}")`;

  const icon = el('img', 'gicon');
  icon.alt = '';
  const ic = imageCache.icon.get(g.universeId);
  if (ic) icon.src = ic;
  const title = el('div', 'gtitle');
  title.appendChild(el('h2', null, g.name));
  const creator = el('div', 'gcreator', ' ');
  title.appendChild(creator);
  const head = el('div', 'ghead');
  head.append(icon, title);

  const body = el('div', 'gbody');
  const actions = el('div', 'gactions');
  const play = el('button', 'gplay');
  play.innerHTML = ICONS.play;
  play.appendChild(document.createTextNode('Play'));
  play.onclick = () => playGame(g);
  const pin = el('button', 'pill', isPinned(g) ? 'Unpin' : 'Pin');
  pin.onclick = async () => {
    await togglePin(g);
    pin.textContent = isPinned(g) ? 'Unpin' : 'Pin';
  };
  const web = el('button', 'pill', 'Open on Roblox.com');
  web.onclick = () => window.api.openLink(`https://www.roblox.com/games/${g.placeId}`);
  actions.append(play, pin, web);

  const stats = el('div', 'gstats');
  const addStat = (label, value) => {
    const d = el('div', 'gstat');
    const v = el('b', null, value);
    d.append(v, el('span', null, label));
    stats.appendChild(d);
    return v;
  };
  addStat('Playing', fmtNum(g.players));
  addStat('Rating', rating(g.up, g.down));
  const vVisits = addStat('Visits', '–');
  const vFav = addStat('Favorites', '–');
  const vMax = addStat('Max players', '–');
  const vGenre = addStat('Genre', '–');
  const vUpd = addStat('Last updated', '–');

  const shots = el('div', 'gshots');
  const descH = el('h3', null, 'About this game');
  const desc = el('div', 'gdesc', 'Loading…');

  body.append(actions, stats, shots, descH, desc);
  box.append(close, hero, head, body);
  $('#gamepage').classList.add('open');

  // Fresh details + screenshots
  try {
    const [det, th] = await Promise.all([
      J(`https://games.roblox.com/v1/games?universeIds=${g.universeId}`),
      J(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${g.universeId}&countPerUniverse=12&defaults=true&size=768x432&format=Png&isCircular=false`
      ).catch(() => ({ data: [] })),
    ]);
    if (my !== gameToken) return;
    const d = (det.data || [])[0];
    if (d) {
      desc.textContent = (d.description || '').trim() || 'No description.';
      if (d.creator) creator.textContent = 'By ' + d.creator.name;
      vVisits.textContent = fmtNum(d.visits || 0);
      vFav.textContent = fmtNum(d.favoritedCount || 0);
      vMax.textContent = String(d.maxPlayers || '–');
      vGenre.textContent = d.genre && d.genre !== 'All' ? d.genre : d.genre || '–';
      if (d.updated) vUpd.textContent = new Date(d.updated).toLocaleDateString();
      stats.children[0].firstChild.textContent = fmtNum(d.playing || g.players);
    } else {
      desc.textContent = 'No description.';
    }
    const urls = ((th.data || [])[0]?.thumbnails || []).map((t) => t.imageUrl).filter(Boolean);
    if (urls.length) {
      hero.style.backgroundImage = `url("${urls[0]}")`;
      urls.forEach((u, i) => {
        const im = el('img', i === 0 ? 'sel' : '');
        im.src = u;
        im.alt = '';
        im.onclick = () => {
          hero.style.backgroundImage = `url("${u}")`;
          shots.querySelectorAll('img').forEach((x) => x.classList.toggle('sel', x === im));
        };
        shots.appendChild(im);
      });
    } else {
      shots.remove();
    }
  } catch {
    if (my === gameToken) desc.textContent = "Couldn't load the description.";
  }
}

const isPinned = (g) => (S.pinned || []).some((p) => String(p.placeId) === String(g.placeId));

async function togglePin(g) {
  const pinned = (S.pinned || []).filter((p) => String(p.placeId) !== String(g.placeId));
  if (pinned.length === (S.pinned || []).length) {
    pinned.unshift({ placeId: g.placeId, universeId: g.universeId, name: g.name });
    toast('Pinned ' + g.name);
  } else {
    toast('Unpinned ' + g.name);
  }
  S = await window.api.setSettings({ pinned: pinned.slice(0, 30) });
  await refreshContinue();
}

async function playGame(g) {
  try {
    const how = await window.api.launch(g.placeId);
    if (how === 'direct') toast('Launching ' + g.name + '…');
    else {
      const why = await window.api.launchError();
      toast('Launching ' + g.name + ' through the Roblox link' + (why ? ' (direct launch failed: ' + why + ')' : ''));
    }
  } catch {
    toast("Couldn't start Roblox. Is it installed?");
    return;
  }
  const recent = (S.recent || []).filter((r) => String(r.placeId) !== String(g.placeId));
  recent.unshift({ placeId: g.placeId, universeId: g.universeId, name: g.name });
  S = await window.api.setSettings({ recent: recent.slice(0, 20) });
  refreshContinue();
}

async function launchByPlaceId() {
  const v = await promptModal({
    title: 'Launch by Place ID',
    text: 'Paste the number from a game URL (roblox.com/games/NUMBER/...).',
    placeholder: '920587237',
    okLabel: 'Launch',
  });
  if (!v) return;
  if (!/^\d{1,15}$/.test(v)) return toast('That is not a valid Place ID');
  let game = { placeId: v, universeId: 0, name: 'Place ' + v, players: 0, up: 0, down: 0 };
  try {
    const uid = await universeOf(v);
    const map = await hydrateUniverses([uid]);
    if (map.has(uid)) game = map.get(uid);
  } catch {
    /* launch anyway */
  }
  playGame(game);
}

function renderTabs() {
  const tabs = $('#tabs');
  tabs.replaceChildren();
  ['Jump Back In', 'Pinned'].forEach((name, i) => {
    const b = el('button', 'pill' + (i === continueTab ? ' active' : ''), name);
    b.onclick = () => {
      continueTab = i;
      renderTabs();
      renderContinue();
    };
    tabs.appendChild(b);
  });
}

function renderContinue() {
  const row = $('#continueRow');
  row.replaceChildren();
  let list = continueTab === 0 ? continueGames.recent : continueGames.pinned;
  if (!list.length) {
    if (continueTab === 0) {
      row.appendChild(el('div', 'empty', 'Games you start from here will show up here. Showing popular games for now:'));
      list = recommended.slice(0, 10);
      const wrap = row;
      list.forEach((g) => wrap.appendChild(makeCard(g, false)));
    } else {
      row.appendChild(el('div', 'empty', 'Right-click any game to pin it here.'));
    }
    return;
  }
  list.forEach((g) => row.appendChild(makeCard(g, false)));
}

async function refreshContinue() {
  const entries = [...(S.recent || []), ...(S.pinned || [])];
  const ids = [];
  for (const e of entries) {
    if (!e.universeId) {
      try { e.universeId = await universeOf(e.placeId); } catch { /* skip */ }
    }
    ids.push(e.universeId);
  }
  const map = await hydrateUniverses(ids);
  await loadImages([...map.keys()]);
  const toGame = (e) => map.get(e.universeId) || { ...e, players: 0, up: 0, down: 0 };
  continueGames = {
    recent: homeContinue.length ? homeContinue : (S.recent || []).filter((e) => e.universeId).map(toGame),
    pinned: (S.pinned || []).filter((e) => e.universeId).map(toGame),
  };
  renderContinue();
}

// ---- Roblox home-page data (your real Continue + Recommended For You) ----
let homeContinue = [];
let homeDebug = {};
let homeSorts = [];

const uuid4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });

// Pulls sort names + universe ids out of the home response, whichever shape Roblox uses.
function parseSorts(j) {
  const raw = j && (j.sorts || j.sortsList);
  const sorts = [];
  for (const s of Array.isArray(raw) ? raw : []) {
    const name = String(s.topic || s.sortDisplayName || s.displayName || s.name || s.sortId || '');
    let ids = [];
    if (Array.isArray(s.recommendationList)) {
      ids = s.recommendationList
        .filter((x) => !x.contentType || /game/i.test(x.contentType))
        .map((x) => x.contentId ?? x.universeId);
    } else if (Array.isArray(s.games)) {
      ids = s.games.map((g) => g.universeId ?? g.id);
    } else if (Array.isArray(s.items)) {
      ids = s.items.map((g) => g.universeId ?? g.contentId ?? g.id);
    }
    ids = [...new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
    if (ids.length) sorts.push({ name, ids });
  }
  return sorts;
}

async function loadHome() {
  homeDebug = { loggedIn: !!S.loggedIn, tried: [], sorts: [] };
  const call = S.loggedIn ? JA : J;
  const sid = uuid4();
  const attempts = [
    ['omni-recommendation', () => call('https://apis.roblox.com/discovery-api/omni-recommendation', { method: 'POST', body: { pageType: 'Home', sessionId: sid } })],
    ['explore-api', () => call(`https://apis.roblox.com/explore-api/v1/get-sorts?sessionId=${sid}&device=computer&country=all`)],
  ];
  let sorts = [];
  for (const [label, attempt] of attempts) {
    try {
      const j = await attempt();
      sorts = parseSorts(j);
      homeDebug.tried.push({ label, ok: true, topKeys: Object.keys(j || {}).slice(0, 12), sorts: sorts.length });
      if (sorts.length) break;
    } catch (e) {
      homeDebug.tried.push({ label, ok: false, error: String((e && e.message) || e) });
    }
  }
  homeSorts = sorts;
  homeDebug.sorts = sorts.map((s) => `${s.name} (${s.ids.length})`);
  if (!sorts.length) return null;

  const cont = sorts.find((s) => /continue|продолж/i.test(s.name));
  const rec =
    sorts.find((s) => /recommend|рекоменд/i.test(s.name)) || sorts.find((s) => s !== cont && s.ids.length >= 6);
  const contIds = cont ? cont.ids.slice(0, 30) : [];
  const recIds = rec ? rec.ids.slice(0, 60) : [];
  homeDebug.picked = { continue: cont && cont.name, recommended: rec && rec.name };

  const map = await hydrateUniverses([...contIds, ...recIds]);
  await loadImages([...map.keys()]);
  homeContinue = contIds.map((id) => map.get(id)).filter(Boolean);
  const recGames = recIds.map((id) => map.get(id)).filter(Boolean);
  return recGames.length ? recGames : null;
}

async function refreshRecommended() {
  const row = $('#recRow');
  row.replaceChildren(el('div', 'empty', 'Loading games…'));
  const home = await loadHome();
  if (!home) toast("Couldn't load your personal games from Roblox, showing popular ones");
  recommended = home || (await fetchRecommended());
  await loadImages(recommended.map((g) => g.universeId));
  row.replaceChildren();
  if (!recommended.length) {
    row.appendChild(el('div', 'empty', "Couldn't reach Roblox. Check your internet and use More → Refresh."));
    return;
  }
  recommended.forEach((g) => row.appendChild(makeCard(g, true)));
}

async function refreshAll() {
  toast('Refreshing…');
  await Promise.all([loadProfile(), loadFriends(), refreshRecommended()]);
  await refreshContinue();
}

async function reloadMedia() {
  media = await window.api.scanMedia();
  bg.init();
  player.init(media.music);
  toast(`${media.backgrounds.length} backgrounds · ${media.music.length} songs`);
}

// ============================================================================
// Boot
// ============================================================================
// ============================================================================
// Views + Settings (Background)
// ============================================================================
let view = 'home';
let profileDraft = null; // unsaved profile edits survive re-renders
let saveBar = null;
let settingsGuard = null; // returns true if leaving should be blocked (unsaved changes)
let profileTab = 'pics'; // which tab of My profile is open
let settingsPage = null; // null = the settings menu, otherwise the open sub-page
const navBtns = {};


// ============================================================================
// Charts page
// ============================================================================
let chartData = null; // [{ name, games: [...] }]
let chartDebug = {};
let chartIndex = 0;
let chartLoading = false;

async function loadCharts() {
  chartDebug = { tried: [] };
  const call = S.loggedIn ? JA : J;
  const sid = uuid4();
  let sorts = [];
  // Home-page lists (Continue, Recommended, Friends...) are NOT charts.
  const notChart = /continue|recommend|favorite|friend|recent|для вас|продолж/i;
  const attempts = [];
  for (const ctx of ['Charts', 'GameCharts', 'ChartsPage']) {
    attempts.push([`omni-${ctx}`, () => call('https://apis.roblox.com/discovery-api/omni-recommendation', { method: 'POST', body: { pageType: ctx, sessionId: sid } })]);
    attempts.push([`explore-${ctx}`, () => call(`https://apis.roblox.com/explore-api/v1/get-sorts?sessionId=${sid}&device=computer&country=all&sortsPageContext=${ctx}`)]);
  }
  for (const [label, attempt] of attempts) {
    try {
      const j = await attempt();
      const all = parseSorts(j);
      sorts = all.filter((x) => !notChart.test(x.name) && x.ids.length >= 3);
      chartDebug.tried.push({ label, ok: true, topKeys: Object.keys(j || {}).slice(0, 12), sortNames: all.map((x) => x.name), kept: sorts.length });
      if (sorts.length) break;
    } catch (e) {
      chartDebug.tried.push({ label, ok: false, error: String((e && e.message) || e) });
    }
  }

  // The Charts page loads each chart by its own id.
  if (!sorts.length) {
    const CHARTS = [
      ['top-trending', 'Top Trending'],
      ['top-playing-now', 'Top Playing'],
      ['up-and-coming', 'Up-and-Coming'],
      ['top-earning', 'Top Earning'],
      ['top-revisited', 'Top Revisited'],
      ['top-rated', 'Top Rated'],
    ];
    const res = await Promise.all(
      CHARTS.map(async ([id, name]) => {
        try {
          const j = await call(`https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId=${sid}&sortId=${id}&device=computer&country=all`);
          const list = j.games || j.items || j.recommendationList || [];
          const ids = [...new Set(list.map((g) => Number(g.universeId ?? g.contentId ?? g.id)).filter((n) => n > 0))];
          chartDebug.tried.push({ label: 'sort-content ' + id, ok: true, topKeys: Object.keys(j || {}).slice(0, 10), count: ids.length });
          return { name: (j.sortDisplayName || j.displayName || name), ids };
        } catch (e) {
          chartDebug.tried.push({ label: 'sort-content ' + id, ok: false, error: String((e && e.message) || e) });
          return null;
        }
      })
    );
    sorts = res.filter((x) => x && x.ids.length >= 3);
  }
  sorts = sorts.slice(0, 12);
  if (sorts.length) {
    const map = await hydrateUniverses(sorts.flatMap((x) => x.ids.slice(0, 50)));
    await loadImages([...map.keys()]);
    return sorts
      .map((x) => ({ name: x.name || 'Games', games: x.ids.slice(0, 50).map((id) => map.get(id)).filter(Boolean) }))
      .filter((x) => x.games.length);
  }

  // Public fallback: classic game sorts
  try {
    const res = await J('https://games.roblox.com/v1/games/sorts?gameSortsContext=GamesDefaultSorts');
    const out = [];
    for (const so of (res.sorts || []).filter((x) => x.token).slice(0, 8)) {
      try {
        const r = await J(`https://games.roblox.com/v1/games/list?model.sortToken=${encodeURIComponent(so.token)}&model.maxRows=40&model.startRows=0`);
        const games = (r.games || []).map((g) => ({
          universeId: g.universeId, placeId: g.placeId, name: g.name,
          players: g.playerCount || 0, up: g.totalUpVotes || 0, down: g.totalDownVotes || 0,
        }));
        if (games.length) out.push({ name: so.displayName || so.name || 'Games', games });
      } catch { /* next */ }
    }
    chartDebug.tried.push({ label: 'public-sorts', ok: true, sorts: out.length });
    if (out.length) {
      await loadImages(out.flatMap((c) => c.games.map((g) => g.universeId)));
      return out;
    }
  } catch (e) {
    chartDebug.tried.push({ label: 'public-sorts', ok: false, error: String((e && e.message) || e) });
  }
  return [];
}

function renderCharts() {
  const v = $('#chartsView');
  v.replaceChildren(el('h1', null, 'Charts'));
  if (chartLoading && !chartData) return v.appendChild(el('div', 'empty', 'Loading charts…'));
  if (!chartData || !chartData.length) {
    v.appendChild(el('div', 'empty', "Couldn't load charts from Roblox. Use More → Copy game-data debug info and share it when you report the problem."));
    const retry = el('button', 'pill primary', 'Try again');
    retry.onclick = () => { chartData = null; openCharts(); };
    v.appendChild(retry);
    return;
  }
  chartIndex = Math.min(chartIndex, chartData.length - 1);
  const tabs = el('div', 'chart-tabs');
  chartData.forEach((c, i) => {
    const b = el('button', 'pill' + (i === chartIndex ? ' active' : ''), c.name);
    b.onclick = () => { chartIndex = i; renderCharts(); v.scrollTo({ top: 0 }); };
    tabs.appendChild(b);
  });
  v.appendChild(tabs);
  const grid = el('div', 'chart-grid');
  chartData[chartIndex].games.forEach((g, i) => {
    const w = el('div', 'rankwrap');
    w.appendChild(el('div', 'rank', '#' + (i + 1)));
    w.appendChild(makeCard(g, false));
    grid.appendChild(w);
  });
  v.appendChild(grid);
}

// ---- Opening animation: blurred app + greeting, clears once everything has loaded ----
// ---- Animation switches (Settings -> Optimization) ----
const ANIMS = [
  ['intro', 'Greeting screen', 'The blurry "Good evening" screen when the app opens'],
  ['lift', 'Slide-up after greeting', 'Games slide up when the greeting fades away'],
  ['pages', 'Page transitions', 'Fade when switching between Home, Settings, Charts and Avatar'],
  ['sections', 'Home sections', 'Home rows sliding in one after another'],
  ['cards', 'Game cards', 'Cards rising in when they load'],
  ['cardhover', 'Card hover zoom', 'Cards growing when you hover them'],
  ['friends', 'Friends popping in', 'Friend pictures popping in'],
  ['pulse', 'In-game pulse', 'The glowing green dot on friends who are playing'],
  ['sidebar', 'Sidebar icons', 'Icons lifting, bouncing and glowing'],
  ['buttons', 'Button press effects', 'Buttons shrinking when pressed and growing on hover'],
  ['windows', 'Windows and popups', 'Profile, game and menu windows popping in'],
  ['fx', 'Profile effects', 'Picture, banner and name effects on profiles and friends'],
  ['logo', 'Logo wobble', 'The BloxCool text in the corner wobbling on hover'],
];
const animOn = (k) => !(S && S.animOff && (S.animOff[k] || S.animOff.all));
function applyAnimPrefs() {
  const off = (S && S.animOff) || {};
  const root = document.documentElement.classList;
  root.toggle('noa-all', !!off.all);
  ANIMS.forEach(([k]) => root.toggle('noa-' + k, !!off[k]));
}


// ============================================================================
// Profile effects (picture / banner / name), picked in Settings -> My profile
// ============================================================================
const PIC_FX = [['flame', 'Flame ring'], ['sparkle', 'Sparkle orbit'], ['neon', 'Neon pulse'], ['rainbow', 'Rainbow spin'], ['lightning', 'Lightning'], ['glitch', 'Glitch'], ['ghost', 'Ghost trail'], ['halo', 'Halo'],
  ['pulse', 'Heartbeat'], ['radar', 'Radar'], ['bubbles', 'Bubbles'], ['hearts', 'Floating hearts'], ['ice', 'Frost'], ['shadow', 'Dark aura'], ['laser', 'Laser scan'], ['portal', 'Portal'], ['confetti', 'Confetti'], ['sun', 'Sunburst'], ['owner', 'Owner crown'], ['symbiote', 'Symbiote']];
const BAN_FX = [['snow', 'Snowfall'], ['rain', 'Rain'], ['stars', 'Starfield'], ['embers', 'Embers'], ['matrix', 'Matrix rain'], ['hearts', 'Floating hearts'], ['fireflies', 'Fireflies'], ['aurora', 'Aurora'], ['scanlines', 'Scanlines'],
  ['sakura', 'Sakura petals'], ['confetti', 'Confetti'], ['bubbles', 'Bubbles'], ['storm', 'Thunderstorm'], ['binary', 'Binary'], ['sunset', 'Sunset'], ['galaxy', 'Galaxy'], ['waves', 'Waves'], ['fog', 'Fog'], ['retrogrid', 'Retro grid'], ['gold', 'Golden dust'], ['webs', 'Spider webs']];
const BG_FX = [['ooze', 'Black ooze']];
const NAME_FX = [['gradient', 'Gradient'], ['shine', 'Shine'], ['neon', 'Neon glow'], ['glitch', 'Glitch'],
  ['rainbow', 'Rainbow'], ['fire', 'Fire'], ['ice', 'Ice'], ['chrome', 'Chrome'], ['wave', 'Wave'], ['cursor', 'Typing cursor'], ['pulse', 'Pulse'], ['outline', 'Outline'], ['retro3d', 'Retro 3D'], ['twinkle', 'Twinkle'], ['royal', 'Royal gold']];
const OWNER_FX = new Set(['owner', 'gold', 'royal']);
const ALT_FX = new Set(['symbiote', 'webs', 'ooze']); // only for the OWNER'S ALT account
const isAltAcc = () => {
  const t = tagsById.get(Number(S.userId));
  return !!(t && t.label === "OWNER'S ALT");
};
const GRANT_FX = new Set(); // server effects marked 'exclusive': only for players who were given them
let myGrants = new Set(); // effect ids this account was given ('*' = all)
const fxAllowed = (k) => myGrants.has(k) || myGrants.has('*') || ((!OWNER_FX.has(k) || isOwnerAcc()) && (!ALT_FX.has(k) || isAltAcc()) && (!GRANT_FX.has(k) || isOwnerAcc() || isAltAcc())); // only offered to accounts with the OWNER (crown) tag
async function loadGrants() {
  try {
    const g = await window.api.grantsGet();
    myGrants = new Set((S.userId && g && g[String(S.userId)]) || []);
  } catch {
    myGrants = new Set();
  }
}
const isOwnerAcc = () => {
  const t = tagsById.get(Number(S.userId));
  return !!(t && t.icon === 'crown');
};
const fxValid = (list, v) => list.some(([k]) => k === v);

function fxPic(host, name) {
  if (!host) return;
  host.querySelectorAll(':scope > .fxx').forEach((n) => n.remove());
  [...host.classList].filter((c) => c.startsWith('fxp-')).forEach((c) => host.classList.remove(c));
  host.classList.remove('fxhost');
  if (!name || !fxValid(PIC_FX, name) || !animOn('fx')) return;
  host.classList.add('fxhost', 'fxp-' + name);
  const add = (tag, cls, html, style) => {
    const e = document.createElement(tag);
    e.className = 'fxx ' + cls;
    if (html) e.innerHTML = html;
    if (style) e.style.cssText = style;
    host.appendChild(e);
    return e;
  };
  const rdp = fxRemote.get('pic:' + name);
  if (rdp) {
    rdp.parts.forEach((pt) => {
      const e = fxPartEl(pt, rdp.images);
      if (e) {
        e.classList.add('fxx');
        host.appendChild(e);
      }
    });
    return;
  }
  if (name === 'flame') [22, 46, 70].forEach((l, i) => add('i', 'fx-st', '', `left:${l}%;animation-delay:${i * 0.3}s`));
  else if (name === 'sparkle')
    add('div', 'fx-orbit', '<i style="left:48%;top:-6%">✦</i><i style="left:94%;top:48%;font-size:9px">✧</i><i style="left:12%;top:92%;font-size:11px">✦</i><i style="left:-4%;top:28%;font-size:8px">✧</i>');
  else if (name === 'rainbow') add('div', 'fx-rb');
  else if (name === 'pulse') [0, 0.8].forEach((d) => add('div', 'fx-pr', '', `animation-delay:${d}s`));
  else if (name === 'radar') add('div', 'fx-radar');
  else if (name === 'bubbles') [14, 34, 56, 76, 90].forEach((l, i) => add('i', 'fx-bub', '', `left:${l}%;animation-delay:${i * 0.55}s;width:${6 + (i % 3) * 3}px;height:${6 + (i % 3) * 3}px`));
  else if (name === 'hearts') [8, 36, 64, 88].forEach((l, i) => add('i', 'fx-ht', '♥', `left:${l}%;animation-delay:${i * 0.6}s`));
  else if (name === 'ice') add('div', 'fx-orbit fx-snow', '<i style="left:48%;top:-8%">❄</i><i style="left:92%;top:60%;font-size:10px">❅</i><i style="left:6%;top:70%;font-size:12px">❆</i>');
  else if (name === 'shadow') [20, 50, 76].forEach((l, i) => add('i', 'fx-smoke', '', `left:${l}%;animation-delay:${i * 0.8}s`));
  else if (name === 'laser') add('div', 'fx-lz', '<b></b>');
  else if (name === 'portal') { add('div', 'fx-prt'); add('div', 'fx-prt b'); }
  else if (name === 'confetti') for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28; add('i', 'fx-cf', '', `--x:${Math.round(Math.cos(a) * 62)}px;--y:${Math.round(Math.sin(a) * 62)}px;background:hsl(${i * 40},90%,60%);animation-delay:${(i % 3) * 0.25}s`); }
  else if (name === 'sun') add('div', 'fx-rays');
  else if (name === 'symbiote') {
    let h = '';
    for (let i = 0; i < 9; i++) h += `<i class="fx-td" style="--a:${i * 40 + (i % 2) * 12}deg;--s:${(0.8 + (i % 3) * 0.22).toFixed(2)};animation-delay:${(i * 0.17).toFixed(2)}s"></i>`;
    add('div', 'fx-sym', h);
    [26, 52, 74].forEach((l, i) => add('i', 'fx-dr', '', `left:${l}%;animation-delay:${i * 0.9}s`));
  } else if (name === 'owner') {
    add('div', 'fx-rb fx-gold');
    add('div', 'fx-crown', CROWN);
  }
  else if (name === 'lightning') add('div', 'fx-bolt');
  else if (name === 'ghost') {
    const img = host.querySelector('img');
    if (img && img.getAttribute('src')) [0, 0.5].forEach((d) => add('img', 'fx-g', '', `animation-delay:${d}s`).setAttribute('src', img.getAttribute('src')));
  }
}

const FX_EMOJI = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}]|[0-9#*]️?⃣)(?:️|‍|[\u{1F3FB}-\u{1F3FF}]|\p{Extended_Pictographic})*/gu;
// effects that paint the letters through see-through text: emojis are kept out of them
const FX_SPLIT = new Set(['gradient', 'shine', 'royal', 'rainbow', 'fire', 'ice', 'chrome', 'outline']);
function fxTokens(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(FX_EMOJI)) {
    if (m.index > last) out.push({ s: text.slice(last, m.index), emoji: false });
    out.push({ s: m[0], emoji: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ s: text.slice(last), emoji: false });
  return out;
}
function fxName(node, name) {
  if (!node) return;
  const text = node.dataset.t && node.querySelector('.fxd') ? node.dataset.t : node.textContent;
  [...node.classList].filter((c) => c.startsWith('fxn') || c.startsWith('fxs-')).forEach((c) => node.classList.remove(c));
  node.style.backgroundImage = '';
  if (node.querySelector('.fxt, .fxe, .fxw, .fxd')) node.textContent = text; // undo an earlier split
  if (!name || !fxValid(NAME_FX, name) || !animOn('fx')) return;
  node.dataset.t = text;
  const make = (str, cls, style) => {
    const sp = document.createElement('span');
    sp.className = cls;
    sp.textContent = str;
    if (style) sp.style.cssText = style;
    node.appendChild(sp);
  };
  const rdn = fxRemote.get('name:' + name);
  if (rdn) {
    node.classList.add('fxn', 'fxn-' + name);
    if (rdn.split) {
      node.textContent = '';
      fxTokens(text).forEach((t) => make(t.s, t.emoji ? 'fxe' : 'fxt'));
      if (rdn.fillImage) node.querySelectorAll('.fxt').forEach((n) => (n.style.backgroundImage = 'url("' + rdn.fillImage + '")'));
    } else if (rdn.fillImage) node.style.backgroundImage = 'url("' + rdn.fillImage + '")';
    if (rdn.decor) {
      const dec = (str) => {
        const sp = document.createElement('span');
        sp.className = 'fxd da-' + rdn.decor.anim;
        sp.textContent = str;
        return sp;
      };
      if (rdn.decor.pre) node.insertBefore(dec(rdn.decor.pre + ' '), node.firstChild);
      if (rdn.decor.post) node.appendChild(dec(' ' + rdn.decor.post));
    }
    return;
  }
  if (FX_SPLIT.has(name)) {
    node.classList.add('fxn', 'fxs-' + name);
    node.textContent = '';
    fxTokens(text).forEach((t) => make(t.s, t.emoji ? 'fxe' : 'fxt'));
  } else if (name === 'wave') {
    node.classList.add('fxn', 'fxn-wave');
    node.textContent = '';
    let i = 0;
    fxTokens(text).forEach((t) => (t.emoji ? [t.s] : Array.from(t.s)).forEach((ch) => make(ch, 'fxw', `animation-delay:${(i++ * 0.09).toFixed(2)}s`)));
  } else node.classList.add('fxn', 'fxn-' + name);
}

function fxWebSvg(flip) {
  // a corner spider web: threads from the corner and sagging rings
  const R = 120, n = 6;
  const pts = (r) => Array.from({ length: n }, (_, i) => { const a = (i / (n - 1)) * (Math.PI / 2); return [Math.cos(a) * r, Math.sin(a) * r]; });
  let d = '';
  pts(R).forEach(([x, y]) => (d += `M0 0L${x.toFixed(1)} ${y.toFixed(1)}`));
  [28, 52, 76, 100].forEach((r) => {
    const p = pts(r);
    for (let i = 0; i < n - 1; i++) {
      const [x1, y1] = p[i], [x2, y2] = p[i + 1];
      const mx = (x1 + x2) / 2 * 0.86, my = (y1 + y2) / 2 * 0.86;
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
  });
  return `<svg class="fx-web${flip ? ' r' : ''}" viewBox="0 0 122 122" style="overflow:visible"><path d="${d}" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".75"/><circle cx="52" cy="52" r="1.6" fill="#ff3b3b"/><circle cx="90" cy="30" r="1.4" fill="#3b7bff"/></svg>`;
}
function fxGooDefs() {
  if (document.getElementById('fxgoo-defs')) return;
  const d = document.createElement('div');
  d.id = 'fxgoo-defs';
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><filter id="fxgoo"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter></svg>';
  document.body.appendChild(d);
}
function fxBanner(box, name, opts) {
  if (!box) return;
  const slot = (opts && opts.slot) || 'banner';
  box.querySelectorAll(':scope > .fxlayer').forEach((n) => n.dataset.slot === slot && n.remove());
  const list = slot === 'bg' ? BG_FX : BAN_FX;
  if (!name || !fxValid(list, name) || !animOn('fx')) return;
  const pv = !!(opts && opts.preview);
  const layer = el('div', 'fxlayer' + (pv ? ' pv' : '') + (slot === 'bg' ? ' bgl' : ''));
  layer.dataset.slot = slot;
  const inner = el('div', 'fxin fxb-' + name);
  if (name === 'fog') inner.innerHTML = '<i></i><i></i><i></i>';
  if (name === 'waves') inner.innerHTML = '<i></i><i></i>';
  if (name === 'webs') inner.innerHTML = fxWebSvg(false) + fxWebSvg(true) + '<span class="fx-thread"><b></b></span><span class="fx-thread t2"><b></b></span>';
  if (name === 'ooze') {
    fxGooDefs();
    let h = '';
    for (let i = 0; i < 9; i++) h += `<i style="left:${4 + i * 11.5}%;width:${46 + (i * 29) % 40}px;height:${46 + (i * 29) % 40}px;animation-delay:${(i * 0.7).toFixed(1)}s;animation-duration:${(5 + (i % 4)).toFixed(1)}s"></i>`;
    inner.innerHTML = '<div class="fx-oozewrap"><div class="fx-ooze">' + h + '<u></u></div></div>';
  }
  layer.appendChild(inner);
  const rdb = fxRemote.get((slot === 'bg' ? 'bg' : 'banner') + ':' + name);
  if (rdb) {
    rdb.parts.forEach((pt) => {
      const e = fxPartEl(pt, rdb.images);
      if (e) inner.appendChild(e);
    });
    if (rdb.particles) {
      const c = document.createElement('canvas');
      c.className = 'fxc';
      c.dataset.kind = 'custom';
      c.__cfg = rdb.particles;
      inner.appendChild(c);
    }
  } else if (!['aurora', 'scanlines', 'sunset', 'waves', 'fog', 'retrogrid', 'webs', 'ooze'].includes(name)) {
    const c = document.createElement('canvas');
    c.className = 'fxc';
    c.dataset.kind = name === 'galaxy' ? 'stars' : name;
    inner.appendChild(c);
  }
  box.prepend(layer);
  if (!pv) {
    // keep the layer as tall as the profile window, also while its content is still loading in
    if (!box.__fxIn) {
      box.__fxIn = new Set();
      const fit = () => box.__fxIn.forEach((n) => (n.isConnected ? (n.style.height = box.clientHeight + 'px') : box.__fxIn.delete(n)));
      box.__fxFit = fit;
      if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
    }
    box.__fxIn.add(inner);
    inner.style.height = box.clientHeight + 'px';
    requestAnimationFrame(box.__fxFit);
    setTimeout(box.__fxFit, 600);
    setTimeout(box.__fxFit, 2000);
  }
  fxStart();
}

// one loop draws every effect canvas that is on screen
let fxRaf = 0;
function fxStart() {
  if (!fxRaf) fxRaf = requestAnimationFrame(fxTick);
}
function fxTick(t) {
  const cs = document.querySelectorAll('canvas.fxc');
  if (!cs.length || !animOn('fx')) {
    fxRaf = 0;
    return;
  }
  const prof = $('#profile');
  cs.forEach((c) => {
    if (c.closest('#profile') && !(prof && prof.classList.contains('open'))) return;
    if (!c.offsetParent) return;
    fxDraw(c, t);
  });
  fxRaf = requestAnimationFrame(fxTick);
}
setInterval(() => {
  if (!animOn('fx')) return;
  document.querySelectorAll('.fx-bolt').forEach((d) => {
    if (Math.random() > 0.7) return;
    let s = '';
    for (let k = 0; k < 3; k++) {
      const a = Math.random() * 6.28;
      let x = 50 + Math.cos(a) * 30, y = 50 + Math.sin(a) * 30, p = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let i = 0; i < 5; i++) {
        x += Math.cos(a) * 6 + (Math.random() - 0.5) * 10;
        y += Math.sin(a) * 6 + (Math.random() - 0.5) * 10;
        p += `L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      s += `<path d="${p}" stroke="#bfe9ff" stroke-width="1.6" fill="none" style="filter:drop-shadow(0 0 3px #4dc3ff)"/>`;
    }
    d.innerHTML = '<svg viewBox="0 0 100 100">' + s + '</svg>';
    setTimeout(() => (d.innerHTML = ''), 90);
  });
}, 420);

function fxDraw(c, t) {
  const W = c.clientWidth, H = c.clientHeight;
  if (!W || !H) return;
  if (c.width !== W || c.height !== H) {
    c.width = W;
    c.height = H;
  }
  const kind = c.dataset.kind;
  if (kind !== 'custom' && !c.__p) {
    const area = (W * H) / 2600;
    const N = kind === 'matrix' || kind === 'binary' ? Math.max(8, Math.floor(W / 16)) : kind === 'rain' || kind === 'storm' ? Math.max(14, Math.min(80, Math.round(area * 1.6))) : Math.max(10, Math.min(60, Math.round(area)));
    c.__p = Array.from({ length: N }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, v: 0.4 + Math.random() * 1.2, r: 1 + Math.random() * 2.2, p: Math.random() * 6.28, c: i }));
    c.__sh = 0;
  }
  const x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  if (kind === 'custom') {
    if (c.__cfg) fxDrawCustom(c, t, W, H, x);
    return;
  }
  for (const q of c.__p) {
    if (kind === 'snow') {
      q.y += q.v * 0.7; q.x += Math.sin(t / 900 + q.p) * 0.4;
      x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.fill();
      if (q.y > H) { q.y = -4; q.x = Math.random() * W; }
    } else if (kind === 'rain') {
      q.y += q.v * 7;
      x.strokeStyle = 'rgba(170,200,255,.5)'; x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x - 2, q.y + 11); x.stroke();
      if (q.y > H) { x.fillStyle = 'rgba(170,200,255,.45)'; x.fillRect(q.x - 3, H - 2, 6, 1); q.y = -10; q.x = Math.random() * W; }
    } else if (kind === 'stars') {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t / 700 + q.p));
      x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(q.x | 0, q.y | 0, q.r > 2 ? 2 : 1.4, q.r > 2 ? 2 : 1.4);
    } else if (kind === 'embers') {
      q.y -= q.v * 0.8; q.x += Math.sin(t / 500 + q.p) * 0.5;
      x.fillStyle = `rgba(255,${120 + (q.c % 80)},30,${Math.max(0, q.y / H)})`; x.beginPath(); x.arc(q.x, q.y, q.r * 0.9, 0, 7); x.fill();
      if (q.y < 0) { q.y = H + 4; q.x = Math.random() * W; }
    } else if (kind === 'matrix') {
      q.y += q.v * 2.2;
      const cx = (q.c * 16) % W;
      x.font = '13px monospace'; x.fillStyle = '#38ff7a';
      x.fillText(String.fromCharCode(0x30a0 + (((t / 90 + q.c * 7) | 0) % 60)), cx, q.y);
      x.fillStyle = 'rgba(56,255,122,.25)'; x.fillText('1', cx, q.y - 15);
      if (q.y > H + 20) q.y = -10;
    } else if (kind === 'hearts') {
      q.y -= q.v * 0.7; q.x += Math.sin(t / 800 + q.p) * 0.5;
      x.fillStyle = `rgba(255,120,170,${0.35 + q.r / 6})`; x.font = 8 + q.r * 4 + 'px sans-serif'; x.fillText('♥', q.x, q.y);
      if (q.y < -10) { q.y = H + 10; q.x = Math.random() * W; }
    } else if (kind === 'gold') {
      q.y += q.v * 0.5; q.x += Math.sin(t / 900 + q.p) * 0.35;
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 500 + q.p));
      if (q.c % 5 === 0) { x.fillStyle = `rgba(255,215,90,${a})`; x.font = 8 + q.r * 3 + 'px sans-serif'; x.fillText('✦', q.x, q.y); }
      else { x.fillStyle = `rgba(255,${190 + (q.c % 50)},60,${a})`; x.beginPath(); x.arc(q.x, q.y, q.r * 0.8, 0, 7); x.fill(); }
      if (q.y > H + 6) { q.y = -6; q.x = Math.random() * W; }
    } else if (kind === 'sakura') {
      q.y += q.v * 0.7; q.x += Math.sin(t / 700 + q.p) * 0.9;
      x.save(); x.translate(q.x, q.y); x.rotate(t / 600 + q.p); x.fillStyle = `rgba(255,${170 + (q.c % 40)},${200 + (q.c % 40)},.85)`;
      x.beginPath(); x.ellipse(0, 0, 3 + q.r, 1.8 + q.r / 2, 0, 0, 7); x.fill(); x.restore();
      if (q.y > H + 6) { q.y = -6; q.x = Math.random() * W; }
    } else if (kind === 'confetti') {
      q.y += q.v * 1.4; q.x += Math.sin(t / 600 + q.p) * 0.6;
      x.save(); x.translate(q.x, q.y); x.rotate(t / 300 + q.p); x.fillStyle = `hsl(${q.c * 37},90%,60%)`; x.fillRect(-3, -2, 6, 4); x.restore();
      if (q.y > H + 6) { q.y = -6; q.x = Math.random() * W; }
    } else if (kind === 'bubbles') {
      q.y -= q.v * 0.8; q.x += Math.sin(t / 800 + q.p) * 0.4;
      x.strokeStyle = 'rgba(190,235,255,.7)'; x.fillStyle = 'rgba(190,235,255,.12)'; x.lineWidth = 1.2;
      x.beginPath(); x.arc(q.x, q.y, 3 + q.r * 2.4, 0, 7); x.fill(); x.stroke();
      if (q.y < -12) { q.y = H + 12; q.x = Math.random() * W; }
    } else if (kind === 'storm') {
      q.y += q.v * 9; q.x -= 2;
      x.strokeStyle = 'rgba(180,200,240,.5)'; x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x - 3, q.y + 12); x.stroke();
      if (q.y > H) { q.y = -12; q.x = Math.random() * (W + 40); }
    } else if (kind === 'binary') {
      q.y += q.v * 1.6;
      x.font = '12px monospace'; x.fillStyle = `rgba(160,210,255,${0.35 + (q.c % 4) / 6})`;
      x.fillText(((t / 140 + q.c) | 0) % 2 ? '1' : '0', (q.c * 14) % W, q.y);
      if (q.y > H + 14) q.y = -10;
    } else if (kind === 'fireflies') {
      q.x += Math.sin(t / 1100 + q.p) * 0.45; q.y += Math.cos(t / 900 + q.p) * 0.35;
      const a = 0.3 + 0.7 * Math.abs(Math.sin(t / 600 + q.p));
      const g = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, 10);
      g.addColorStop(0, `rgba(220,255,140,${a})`); g.addColorStop(1, 'rgba(220,255,140,0)');
      x.fillStyle = g; x.beginPath(); x.arc(q.x, q.y, 10, 0, 7); x.fill();
    }
  }
  if (kind === 'storm') {
    c.__fl = (c.__fl || 0) - 1;
    if (c.__fl < -140 && Math.random() < 0.02) c.__fl = 7;
    if (c.__fl > 0) { x.fillStyle = `rgba(255,255,255,${c.__fl / 14})`; x.fillRect(0, 0, W, H); }
  }
  if (kind === 'stars') {
    c.__sh = (c.__sh + 1) % 260;
    if (c.__sh < 30) {
      const k = c.__sh / 30;
      x.strokeStyle = `rgba(255,255,255,${1 - k})`; x.beginPath();
      x.moveTo(W * 0.2 + k * W * 0.5, 10 + k * H * 0.4); x.lineTo(W * 0.2 + k * W * 0.5 - 24, 10 + k * H * 0.4 - 12); x.stroke();
    }
  }
}


// ---- Extra effects defined on the server (effects.json): styling only, no code ----
const fxRemote = new Map(); // 'pic:id' -> definition
const fxRemoteIds = []; // [list, id] so a refresh can remove old ones
function fxStyleOk(t) {
  return typeof t === 'string' && t.length <= 600 && !/url\s*\(|expression|javascript:|\\|<|position\s*:\s*fixed/i.test(t);
}
function fxScope(css, sel, id) {
  if (typeof css !== 'string' || css.length > 12000) return null;
  if (/@import|@font-face|@media|@supports|url\s*\(|expression|javascript:|behavior|binding|\\|<|position\s*:\s*fixed|!important/i.test(css)) return null;
  // keyframe names get the effect id in front so effects can't clash with each other
  for (const m of [...css.matchAll(/@keyframes\s+([\w-]+)/g)]) {
    const name = m[1];
    css = css.replace(new RegExp('(?<![\\w-])' + name.replace(/[-]/g, '\\-') + '(?![\\w-])', 'g'), 'fxr_' + id + '_' + name);
  }
  let out = '', i = 0;
  const n = css.length;
  while (i < n) {
    const open = css.indexOf('{', i);
    if (open < 0) return css.slice(i).trim() ? null : out;
    const head = css.slice(i, open).trim();
    let d = 1, j = open + 1;
    while (j < n && d > 0) {
      if (css[j] === '{') d++;
      else if (css[j] === '}') d--;
      j++;
    }
    if (d !== 0) return null;
    const body = css.slice(open + 1, j - 1);
    if (/^@keyframes\s+[\w-]+$/.test(head)) out += head + '{' + body + '}';
    else if (head.startsWith('@')) return null;
    else {
      const sels = head.split(',').map((x) => x.trim());
      if (!sels.length || !sels.every((x) => x.startsWith('&'))) return null;
      out += sels.map((x) => x.replace(/&/g, sel)).join(',') + '{' + body + '}';
    }
    i = j;
  }
  return out;
}
const FX_IMG_OK = /^data:image\/(png|webp|gif|jpeg);base64,[A-Za-z0-9+/=]+$/;
function fxPartEl(pt, imgs) {
  if (!pt || typeof pt !== 'object' || !['div', 'i', 'b', 'u', 'span'].includes(pt.tag)) return null;
  const e = document.createElement(pt.tag);
  e.className = String(pt.class || '').replace(/[^\w -]/g, '').slice(0, 40);
  if (pt.style != null) {
    if (!fxStyleOk(String(pt.style))) return null;
    e.style.cssText = String(pt.style);
  }
  if (pt.text != null) e.textContent = String(pt.text).slice(0, 12);
  if (pt.img != null) {
    const m = /^@(\d{1,2})$/.exec(String(pt.img));
    const src = m && imgs && imgs[+m[1]];
    if (!src) return null;
    e.style.backgroundImage = 'url("' + src + '")';
  }
  return e;
}
function fxRegister(defs) {
  fxRemoteIds.splice(0).forEach(([list, id]) => {
    const k = list.findIndex((x) => x[0] === id);
    if (k >= 0) list.splice(k, 1);
    OWNER_FX.delete(id);
    ALT_FX.delete(id);
    GRANT_FX.delete(id);
  });
  fxRemote.clear();
  const lists = { pic: PIC_FX, banner: BAN_FX, name: NAME_FX, bg: BG_FX };
  const sels = { pic: '.fxp-', banner: '.fxb-', bg: '.fxb-', name: '.fxn-' };
  let css = '';
  (Array.isArray(defs) ? defs : []).slice(0, 60).forEach((d) => {
    try {
      if (!d || !lists[d.kind] || !/^[a-z0-9]{2,16}$/.test(String(d.id))) return;
      const id = String(d.id), list = lists[d.kind];
      if (list.some((x) => x[0] === id)) return; // can't replace built-in ones
      const scoped = d.css ? fxScope(d.css, sels[d.kind] + id, id) : '';
      if (scoped === null) return;
      const imgs = (Array.isArray(d.images) ? d.images : []).slice(0, 6).map((x) => (typeof x === 'string' && x.length <= 450000 && FX_IMG_OK.test(x) ? x : ''));
      const def = { kind: d.kind, id, split: !!d.split, parts: [], particles: null, images: imgs, fillImage: '', decor: null };
      const fi = /^@(\d{1,2})$/.exec(String(d.fillImage || ''));
      if (d.kind === 'name' && fi && imgs[+fi[1]]) def.fillImage = imgs[+fi[1]];
      if (d.kind === 'name' && d.decor && typeof d.decor === 'object') {
        const t = (v) => Array.from(String(v || '').replace(/[\u0000-\u001f<>]/g, '')).slice(0, 4).join('');
        def.decor = { pre: t(d.decor.pre), post: t(d.decor.post), anim: ['none', 'bounce', 'spin', 'pulse'].includes(d.decor.anim) ? d.decor.anim : 'none' };
        if (!def.decor.pre && !def.decor.post) def.decor = null;
      }
      (Array.isArray(d.parts) ? d.parts : []).slice(0, 12).forEach((pt) => fxPartEl(pt, def.images) && def.parts.push(pt));
      if (d.particles && typeof d.particles === 'object' && ['pic'].indexOf(d.kind) < 0) {
        const p = d.particles;
        const num = (v, lo, hi, dflt) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : dflt);
        const col = (Array.isArray(p.color) ? p.color : [p.color]).filter((c) => /^#[0-9a-f]{3,8}$/i.test(String(c))).slice(0, 6);
        def.particles = {
          motion: ['fall', 'rise', 'drift', 'twinkle', 'rain'].includes(p.motion) ? p.motion : 'fall',
          shape: ['circle', 'rect', 'heart', 'star', 'char', 'petal', 'picture'].includes(p.shape) ? p.shape : 'circle',
          char: String(p.char || '✦').slice(0, 2),
          color: col.length ? col : ['#ffffff'],
          count: num(p.count, 5, 120, 50), speed: num(p.speed, 0.2, 8, 1), size: num(p.size, 0.5, 4, 1),
          wind: num(p.wind, -3, 3, 0), glow: num(p.glow, 0, 20, 0), opacity: p.opacity == null ? null : num(p.opacity, 0.05, 1, 0.9), rotate: p.rotate !== false,
          imgSrc: (() => { const m = /^@(\d{1,2})$/.exec(String(p.img || '')); return (m && imgs[+m[1]]) || ''; })(),
        };
      }
      fxRemote.set(d.kind + ':' + id, def);
      list.push([id, String(d.label || id).slice(0, 24)]);
      fxRemoteIds.push([list, id]);
      if (d.only === 'owner') OWNER_FX.add(id);
      if (d.only === 'alt') ALT_FX.add(id);
      if (d.only === 'granted') GRANT_FX.add(id);
      css += scoped + '\n';
    } catch { /* skip a broken effect */ }
  });
  let st = document.getElementById('fxremote');
  if (!st) {
    st = document.createElement('style');
    st.id = 'fxremote';
    document.head.appendChild(st);
  }
  st.textContent = css;
}
function fxDrawCustom(c, t, W, H, x) {
  const cfg = c.__cfg;
  if (!c.__cp) {
    const area = (W * H) / 2600;
    const N = Math.max(8, Math.min(cfg.count, Math.round(area * 1.5)));
    c.__cp = Array.from({ length: N }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, v: 0.5 + Math.random(), r: 1 + Math.random() * 2, p: Math.random() * 6.28, c: i }));
  }
  const sp = cfg.speed, sz = cfg.size;
  for (const q of c.__cp) {
    if (cfg.motion === 'fall') { q.y += q.v * 0.8 * sp; q.x += Math.sin(t / 800 + q.p) * 0.4 + (cfg.wind || 0) * 0.4 * sp; if (q.y > H + 8) { q.y = -8; q.x = Math.random() * W; } }
    else if (cfg.motion === 'rise') { q.y -= q.v * 0.8 * sp; q.x += Math.sin(t / 700 + q.p) * 0.4 + (cfg.wind || 0) * 0.4 * sp; if (q.y < -8) { q.y = H + 8; q.x = Math.random() * W; } }
    else if (cfg.motion === 'rain') { q.y += q.v * 8 * sp; q.x += (-1.5 + (cfg.wind || 0)) * sp; if (q.y > H) { q.y = -10; q.x = Math.random() * (W + 30); } }
    else if (cfg.motion === 'drift') { q.x += Math.sin(t / 1100 + q.p) * 0.45 * sp + (cfg.wind || 0) * 0.3 * sp; q.y += Math.cos(t / 900 + q.p) * 0.35 * sp; }
    const tw = cfg.motion === 'twinkle' || cfg.motion === 'drift' ? 0.3 + 0.7 * Math.abs(Math.sin(t / 600 + q.p)) : 1;
    const a = cfg.opacity == null ? (tw === 1 ? 0.9 : tw) : tw * cfg.opacity;
    if (q.x > W + 10) q.x = -10;
    if (q.x < -10) q.x = W + 10;
    const col = cfg.color[q.c % cfg.color.length];
    x.shadowColor = col;
    x.shadowBlur = cfg.glow || 0;
    x.globalAlpha = a;
    x.fillStyle = col;
    x.strokeStyle = col;
    const r = (1 + q.r) * sz;
    if (cfg.motion === 'rain') { x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x - 2 * sz, q.y + 10 * sz); x.stroke(); }
    else if (cfg.shape === 'picture') {
      const im = cfg.__im || (cfg.imgSrc ? (cfg.__im = Object.assign(new Image(), { src: cfg.imgSrc })) : null);
      if (im && im.complete && im.naturalWidth) { const sz = r * 5; x.save(); x.translate(q.x, q.y); if (cfg.rotate) x.rotate(t / 600 + q.p); x.drawImage(im, -sz / 2, -sz / 2, sz, (sz * im.naturalHeight) / im.naturalWidth); x.restore(); }
    }
    else if (cfg.shape === 'circle') { x.beginPath(); x.arc(q.x, q.y, r, 0, 7); x.fill(); }
    else if (cfg.shape === 'rect') { x.save(); x.translate(q.x, q.y); if (cfg.rotate) x.rotate(t / 400 + q.p); x.fillRect(-r, -r * 0.6, r * 2, r * 1.2); x.restore(); }
    else if (cfg.shape === 'petal') { x.save(); x.translate(q.x, q.y); x.rotate(t / 600 + q.p); x.beginPath(); x.ellipse(0, 0, r * 2, r, 0, 0, 7); x.fill(); x.restore(); }
    else { x.font = Math.round(7 + r * 3) + 'px sans-serif'; x.fillText(cfg.shape === 'heart' ? '♥' : cfg.shape === 'star' ? '✦' : cfg.char, q.x, q.y); }
  }
  x.globalAlpha = 1;
  x.shadowBlur = 0;
}
let fxDefs = []; // the server's effects as loaded
function fxPreviewRegister(def) {
  fxRegister([...fxDefs.filter((d) => d && d.id !== 'zzpreview'), def]);
}
function fxPreviewClear() {
  fxRegister(fxDefs);
}
const fxReady = window.api
  .effectsConfig()
  .then((defs) => {
    fxDefs = Array.isArray(defs) ? defs : [];
    fxRegister(fxDefs);
  })
  .catch(() => {});
fxReady.then(() => {
  try { applyFriendLooks(); } catch { /* not ready yet */ }
});

const FX_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b6cff"/><stop offset="1" stop-color="#1b2a6b"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="38" r="15" fill="#d9dee9"/><ellipse cx="50" cy="92" rx="32" ry="30" fill="#d9dee9"/></svg>');


// ============================================================================
// Effects debug: Ctrl+Shift+D (or Settings -> Optimization -> Effects debug).
// Draws outlines around every effect layer and prints measurements you can copy and send.
// ============================================================================
let fxDbgTimer = 0;
function fxDebugReport() {
  const r = (n) => {
    if (!n) return null;
    const b = n.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  const box = $('#profileBox');
  const out = {
    window: innerWidth + 'x' + innerHeight,
    dpr: devicePixelRatio,
    profileOpen: !!$('#profile').classList.contains('open'),
  };
  if (box) {
    const cs = getComputedStyle(box);
    const br = r(box);
    out.box = { ...br, client: box.clientWidth + 'x' + box.clientHeight, scroll: box.scrollWidth + 'x' + box.scrollHeight, scrollTop: Math.round(box.scrollTop), padding: cs.padding, border: cs.borderTopWidth, radius: cs.borderRadius };
    out.layers = [...box.querySelectorAll(':scope > .fxlayer')].map((l) => {
      const inner = l.querySelector('.fxin');
      const ib = r(inner);
      const row = { slot: l.dataset.slot, effect: inner && [...inner.classList].find((c) => c.startsWith('fxb-')), inner: ib };
      if (ib && br) {
        // distance from each window edge (the inside of its border) to the effect; should all be ~0
        row.gapLeft = +(ib.x - (br.x + 1)).toFixed(1);
        row.gapTop = +(ib.y - (br.y + 1)).toFixed(1);
        row.gapRight = +((br.x + br.w - 1) - (ib.x + ib.w)).toFixed(1);
        row.gapBottom = +((br.y + box.clientHeight + 1) - (ib.y + ib.h)).toFixed(1);
        row.aligned = [row.gapLeft, row.gapTop, row.gapRight, row.gapBottom].every((v) => Math.abs(v) <= 1.5);
      }
      row.canvas = inner && inner.querySelector('canvas') ? r(inner.querySelector('canvas')) : undefined;
      row.webs = [...(inner ? inner.querySelectorAll('.fx-web') : [])].map((w) => {
        const wb = r(w);
        return { ...wb, atLeftEdge: ib ? +(wb.x - ib.x).toFixed(1) : null, atRightEdge: ib ? +((ib.x + ib.w) - (wb.x + wb.w)).toFixed(1) : null, atTop: ib ? +(wb.y - ib.y).toFixed(1) : null };
      });
      return row;
    });
    out.pfp = [...box.querySelectorAll('.pfphost')].map((h) => ({ rect: r(h), effect: [...h.classList].find((c) => c.startsWith('fxp-')), extras: h.querySelectorAll('.fxx').length }));
    out.name = [...box.querySelectorAll('.fxn')].map((n) => ({ rect: r(n), effect: [...n.classList].filter((c) => c.startsWith('fxn') || c.startsWith('fxs-')).join(' '), text: n.textContent.slice(0, 20) }));
  }
  const prev = document.querySelector('.fxprev');
  if (prev && prev.offsetParent) {
    const pb = r(prev);
    out.settingsPreview = {
      box: pb,
      layers: [...prev.querySelectorAll(':scope > .fxlayer')].map((l) => ({ slot: l.dataset.slot, inner: r(l.querySelector('.fxin')) })),
    };
  }
  return out;
}
function fxDebugToggle() {
  const root = document.documentElement;
  const on = !root.classList.contains('fxdebug');
  root.classList.toggle('fxdebug', on);
  let panel = document.getElementById('fxdbg');
  if (!on) {
    clearInterval(fxDbgTimer);
    if (panel) panel.remove();
    return;
  }
  if (!panel) {
    panel = el('div');
    panel.id = 'fxdbg';
    const head = el('div', 'fxdbg-head');
    head.appendChild(el('b', null, 'Effects debug'));
    const copy = el('button', null, 'Copy');
    const close = el('button', null, 'Close');
    head.append(copy, close);
    const pre = el('pre');
    panel.append(head, pre);
    document.body.appendChild(panel);
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent);
        copy.textContent = 'Copied!';
      } catch {
        const ta = document.createElement('textarea');
        ta.value = pre.textContent;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        copy.textContent = 'Copied!';
      }
      setTimeout(() => (copy.textContent = 'Copy'), 1200);
    };
    close.onclick = fxDebugToggle;
  }
  const pre = panel.querySelector('pre');
  const tick = () => {
    try {
      pre.textContent = JSON.stringify(fxDebugReport(), null, 1);
    } catch (e) {
      pre.textContent = 'debug error: ' + e.message;
    }
  };
  tick();
  clearInterval(fxDbgTimer);
  fxDbgTimer = setInterval(tick, 700);
}
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
    e.preventDefault();
    fxDebugToggle();
  }
});

function startIntro() {
  if (!animOn('intro')) {
    // no greeting screen at all
    const b = $('#intro');
    if (b) b.remove();
    document.documentElement.classList.remove('introing');
    return { dismiss() {}, async finish() {} };
  }
  if (!animOn('lift')) document.documentElement.classList.remove('introing');
  const box = $('#intro');
  const t0 = Date.now();
  const h = new Date().getHours();
  const greet = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : 'Good evening';
  const name = S.displayName || S.username;
  $('#introText').textContent = name ? `${greet}, ${name}` : greet;
  box.classList.add('show');
  setTimeout(() => document.documentElement.classList.remove('introing'), 14000); // safety
  let closed = false;
  const dismiss = () => {
    if (closed) return;
    closed = true;
    // the games were loading behind the blur: now they slide up as the greeting fades away
    const root = document.documentElement;
    if (animOn('lift')) root.classList.add('lift');
    root.classList.remove('introing');
    setTimeout(() => root.classList.remove('lift'), 2600);
    box.classList.add('done');
    setTimeout(() => box.remove(), 1200);
  };
  box.addEventListener('click', dismiss); // click to skip
  return {
    dismiss,
    async finish(loading) {
      // wait for the data (at most 7s), and show the greeting for at least ~2.2s
      await Promise.race([Promise.resolve(loading).catch(() => {}), new Promise((r) => setTimeout(r, 7000))]);
      const left = 2200 - (Date.now() - t0);
      if (left > 0) await new Promise((r) => setTimeout(r, left));
      dismiss();
    },
  };
}

async function applyUiFont() {
  let st = document.getElementById('uifontStyle');
  if (!st) {
    st = document.createElement('style');
    st.id = 'uifontStyle';
    document.head.appendChild(st);
  }
  let url = '';
  try {
    url = await window.api.uiFontUrl();
  } catch { /* none */ }
  st.textContent = url ? `@font-face { font-family: "BloxUI"; src: url("${url}"); font-display: swap; }` : '';
}

async function openCharts() {
  renderCharts();
  if (chartData || chartLoading) return;
  chartLoading = true;
  renderCharts();
  try {
    chartData = await loadCharts();
  } catch (e) {
    chartData = [];
    chartDebug.error = String((e && e.message) || e);
  }
  chartLoading = false;
  if (view === 'charts') renderCharts();
}

function showView(v, page) {
  if (view === 'settings' && settingsGuard && settingsGuard()) return; // unsaved changes
  closeFloat();
  view = v;
  if (v === 'settings') settingsPage = page || null;
  $('#main').classList.toggle('hide', v !== 'home');
  $('#settingsView').classList.toggle('show', v === 'settings');
  $('#chartsView').classList.toggle('show', v === 'charts');
  $('#avatarView').classList.toggle('show', v === 'avatar');
  $('#newsView').classList.toggle('show', v === 'news');
  for (const [name, b] of Object.entries(navBtns)) {
    b.classList.toggle('active', (name === 'Home' && v === 'home') || (name === 'Settings' && v === 'settings') || (name === 'Charts' && v === 'charts') || (name === 'Avatar' && v === 'avatar') || (name === 'News' && v === 'news'));
  }
  if (v === 'settings') syncBackgrounds(true);
  else if (v === 'charts') openCharts();
  else if (v === 'avatar') openAvatar();
  else if (v === 'news') openNews();
  else $('#main').scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// Avatar editor (in the app): outfits, what you wear, your inventory, body colors
// ============================================================================
const av = { state: null, tab: 'outfits', items: [], cursor: '', loading: false, outfits: null, token: 0 };
const thumbCache = new Map(); // assetId -> url
const AV_TABS = [
  ['outfits', 'Outfits'],
  ['wearing', 'Wearing'],
  ['Hat', 'Hats'],
  ['HairAccessory', 'Hair'],
  ['FaceAccessory', 'Face'],
  ['NeckAccessory,ShoulderAccessory,FrontAccessory,BackAccessory,WaistAccessory', 'Neck & back'],
  ['Shirt', 'Shirts'],
  ['Pants', 'Pants'],
  ['TShirt', 'T-Shirts'],
  ['Face', 'Faces'],
  ['Head', 'Heads'],
];
const EXCLUSIVE_TYPES = ['Shirt', 'Pants', 'TShirt', 'Face', 'Head', 'Torso', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg'];
// BrickColor ids Roblox allows for body colors (a few common ones)
const BODY_COLORS = [
  [1, '#f2f3f3'], [208, '#e5e4df'], [18, '#cc8e69'], [125, '#eab892'], [217, '#7c5c46'], [26, '#1b2a35'],
  [21, '#c4281c'], [23, '#0d69ab'], [24, '#f5cd30'], [37, '#4b974b'], [194, '#a3a2a5'], [105, '#e29b40'],
];

async function assetThumbs(ids) {
  const need = [...new Set(ids)].filter((i) => !thumbCache.has(i));
  for (const part of chunk(need, 100)) {
    try {
      const r = await J(`https://thumbnails.roblox.com/v1/assets?assetIds=${part.join(',')}&size=150x150&format=Png&isCircular=false`);
      (r.data || []).forEach((d) => d.imageUrl && thumbCache.set(d.targetId, d.imageUrl));
    } catch (e) {
      console.warn('asset thumbs failed', e);
    }
  }
}

async function loadAvatarState() {
  av.state = await JA('https://avatar.roblox.com/v1/avatar');
}
const wornIds = () => ((av.state && av.state.assets) || []).map((a) => a.id);

// Re-draws the preview picture (Roblox needs a moment after a change)
async function paintAvatarPreview(img, my) {
  img.classList.add('loading');
  try {
    JA('https://avatar.roblox.com/v1/avatar/redraw-thumbnail', { method: 'POST' }).catch(() => {});
  } catch { /* ignore */ }
  for (let i = 0; i < 10; i++) {
    if (my !== av.token) return;
    try {
      const r = await J(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${S.userId}&size=420x420&format=Png&isCircular=false`);
      const d = (r.data || [])[0];
      if (d && d.state === 'Completed' && d.imageUrl) {
        img.src = d.imageUrl;
        img.classList.remove('loading');
        return;
      }
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1200));
  }
  img.classList.remove('loading');
}

async function avatarSet(newIds) {
  // Roblox's current endpoint (v2) wants asset objects; keep the details of items you already wear
  const have = new Map(((av.state && av.state.assets) || []).map((a) => [a.id, a]));
  const assets = newIds.map((id) => {
    const a = have.get(id);
    return a ? { id: a.id, name: a.name, assetType: a.assetType, currentVersionId: a.currentVersionId, meta: a.meta } : { id };
  });
  let r;
  try {
    r = await JA('https://avatar.roblox.com/v2/avatar/set-wearing-assets', { method: 'POST', body: { assets } });
  } catch (e) {
    if (!/404|405/.test(String((e && e.message) || e))) throw e;
    r = await JA('https://avatar.roblox.com/v1/avatar/set-wearing-assets', { method: 'POST', body: { assetIds: newIds } });
  }
  const bad = r && (r.invalidAssets || r.invalidAssetIds);
  if (bad && bad.length) toast('Some items could not be worn');
  await loadAvatarState();
}

async function toggleWear(item) {
  const state = av.state || {};
  const worn = wornIds();
  let next;
  if (worn.includes(item.id)) next = worn.filter((x) => x !== item.id);
  else {
    next = [...worn];
    if (EXCLUSIVE_TYPES.includes(item.type)) {
      const sameType = new Set((state.assets || []).filter((a) => a.assetType && a.assetType.name === item.type).map((a) => a.id));
      next = next.filter((x) => !sameType.has(x));
    }
    next.push(item.id);
  }
  try {
    await avatarSet(next);
  } catch (e) {
    return toast("Couldn't change your avatar (" + String(e.message || e) + ')');
  }
  loadProfile();
  renderAvatar(true);
}

async function openAvatar() {
  const v = $('#avatarView');
  if (!S.loggedIn) {
    v.replaceChildren(el('h1', null, 'Avatar'));
    v.appendChild(el('div', 'empty', 'Log in to edit your avatar.'));
    const b = el('button', 'pill primary', 'Log in with cookie');
    b.onclick = cookieLogin;
    v.appendChild(b);
    return;
  }
  av.token++;
  av.cursor = '';
  av.items = [];
  v.replaceChildren(el('h1', null, 'Avatar'), el('div', 'empty', 'Loading your avatar…'));
  try {
    await loadAvatarState();
  } catch (e) {
    v.replaceChildren(el('h1', null, 'Avatar'), el('div', 'empty', "Couldn't load your avatar (" + String(e.message || e) + ')'));
    return;
  }
  if (view !== 'avatar') return;
  renderAvatar(false);
}

async function renderAvatar(keepPreview) {
  const v = $('#avatarView');
  const my = ++av.token;
  v.replaceChildren();
  v.appendChild(el('h1', null, 'Avatar'));
  const wrap = el('div', 'avlayout');

  // left: preview + body colors
  const left = el('div', 'avleft');
  const prev = el('img', 'avprev');
  prev.alt = '';
  left.appendChild(prev);
  const refresh = el('button', 'pill', 'Refresh picture');
  refresh.onclick = () => paintAvatarPreview(prev, av.token);
  left.appendChild(refresh);
  left.appendChild(el('div', 'plabel', 'Body color'));
  const cols = el('div', 'avcolors');
  BODY_COLORS.forEach(([id, hex]) => {
    const c = el('button', 'avcolor');
    c.style.background = hex;
    c.onclick = async () => {
      try {
        await JA('https://avatar.roblox.com/v1/avatar/set-body-colors', {
          method: 'POST',
          body: { headColorId: id, torsoColorId: id, rightArmColorId: id, leftArmColorId: id, rightLegColorId: id, leftLegColorId: id },
        });
        await loadAvatarState();
        toast('Body color changed');
        paintAvatarPreview(prev, av.token);
      } catch (e) {
        toast("Couldn't change the color (" + String(e.message || e) + ')');
      }
    };
    cols.appendChild(c);
  });
  left.appendChild(cols);
  const web = el('button', 'pill', 'Open full editor on roblox.com');
  web.onclick = () => window.api.openRobloxWindow('https://www.roblox.com/my/avatar');
  left.appendChild(web);
  wrap.appendChild(left);

  // right: tabs + grid
  const right = el('div', 'avright');
  const tabs = el('div', 'chart-tabs');
  AV_TABS.forEach(([key, label]) => {
    const t = el('button', 'pill' + (av.tab === key ? ' active' : ''), label);
    t.onclick = () => {
      av.tab = key;
      av.items = [];
      av.cursor = '';
      renderAvatar(true);
    };
    tabs.appendChild(t);
  });
  right.appendChild(tabs);
  const grid = el('div', 'avgrid');
  right.appendChild(grid);
  wrap.appendChild(right);
  v.appendChild(wrap);

  paintAvatarPreview(prev, my);
  fillAvatarGrid(grid, my);
}

async function fillAvatarGrid(grid, my) {
  const alive = () => my === av.token;
  const tile = (img, name, worn, onclick) => {
    const t = el('button', 'avtile' + (worn ? ' worn' : ''));
    const im = el('img');
    im.alt = '';
    if (img) im.src = img;
    t.append(im, el('span', null, name));
    t.title = name;
    t.onclick = onclick;
    return t;
  };
  grid.replaceChildren(el('div', 'empty', 'Loading…'));
  try {
    if (av.tab === 'outfits') {
      const r = await JA(`https://avatar.roblox.com/v1/users/${S.userId}/outfits?page=1&itemsPerPage=50&isEditable=true`);
      const list = r.data || [];
      let thumbs = new Map();
      if (list.length) {
        const th = await J(`https://thumbnails.roblox.com/v1/users/outfits?userOutfitIds=${list.map((o) => o.id).join(',')}&size=150x150&format=Png&isCircular=false`).catch(() => ({ data: [] }));
        thumbs = new Map((th.data || []).map((d) => [d.targetId, d.imageUrl]));
      }
      if (!alive()) return;
      grid.replaceChildren();
      if (!list.length) grid.appendChild(el('div', 'empty', 'You have no saved outfits.'));
      list.forEach((o) =>
        grid.appendChild(
          tile(thumbs.get(o.id), o.name, false, async () => {
            toast('Wearing "' + o.name + '"…');
            try {
              await JA(`https://avatar.roblox.com/v1/outfits/${o.id}/wear`, { method: 'POST' });
              await loadAvatarState();
              loadProfile();
              renderAvatar(true);
            } catch (e) {
              toast("Couldn't wear that outfit (" + String(e.message || e) + ')');
            }
          })
        )
      );
      return;
    }
    if (av.tab === 'wearing') {
      const items = ((av.state && av.state.assets) || []).map((a) => ({ id: a.id, name: a.name, type: a.assetType && a.assetType.name }));
      await assetThumbs(items.map((i) => i.id));
      if (!alive()) return;
      grid.replaceChildren();
      if (!items.length) grid.appendChild(el('div', 'empty', 'You are not wearing anything.'));
      items.forEach((it) => grid.appendChild(tile(thumbCache.get(it.id), it.name, true, () => toggleWear(it))));
      return;
    }
    // inventory category
    const url =
      `https://inventory.roblox.com/v2/users/${S.userId}/inventory?assetTypes=${av.tab}&limit=100&sortOrder=Desc` +
      (av.cursor ? `&cursor=${encodeURIComponent(av.cursor)}` : '');
    const r = await JA(url);
    const items = (r.data || []).map((d) => ({ id: d.assetId, name: d.assetName, type: d.assetType }));
    av.cursor = r.nextPageCursor || '';
    av.items = av.items.concat(items);
    await assetThumbs(av.items.map((i) => i.id));
    if (!alive()) return;
    grid.replaceChildren();
    if (!av.items.length) grid.appendChild(el('div', 'empty', 'Nothing here, or your inventory is hidden.'));
    const worn = new Set(wornIds());
    av.items.forEach((it) => grid.appendChild(tile(thumbCache.get(it.id), it.name, worn.has(it.id), () => toggleWear(it))));
    if (av.cursor) {
      const more = el('button', 'pill', 'Load more');
      more.onclick = () => fillAvatarGrid(grid, my);
      grid.appendChild(more);
    }
  } catch (e) {
    if (alive()) grid.replaceChildren(el('div', 'empty', "Couldn't load this (" + String(e.message || e) + ')'));
  }
}

// Re-reads the backgrounds folder (so pictures you drop in by hand show up too).
async function syncBackgrounds(force) {
  const fresh = (await window.api.scanMedia()).backgrounds;
  const same =
    fresh.length === media.backgrounds.length && fresh.every((b, i) => b.name === media.backgrounds[i].name);
  if (!same) {
    media.backgrounds = fresh;
    bg.init();
    renderSettings();
  } else if (force) {
    renderSettings();
  }
}

function markActiveTile() {
  document.querySelectorAll('.bgtile').forEach((t) => {
    const on = t.dataset.name === S.backgroundName;
    t.classList.toggle('active', on);
    const badge = t.querySelector('.badge');
    if (on && !badge) t.appendChild(el('div', 'badge', 'In use'));
    if (!on && badge) badge.remove();
  });
}

function bgTile(item, index) {
  const t = el('div', 'bgtile');
  t.dataset.name = item.name;
  t.tabIndex = 0;
  t.setAttribute('role', 'button');

  let prev;
  if (item.type === 'video') {
    prev = document.createElement('video');
    prev.src = item.url + '#t=0.1';
    prev.muted = true;
    prev.preload = 'metadata';
    prev.playsInline = true;
  } else {
    prev = document.createElement('img');
    prev.src = item.url;
    prev.loading = 'lazy';
    prev.alt = '';
  }
  prev.className = 'prev';
  t.appendChild(prev);
  t.appendChild(el('div', 'label', item.name));

  const del = el('button', 'del', '✕');
  del.title = 'Remove this background';
  let timer;
  del.onclick = async (e) => {
    e.stopPropagation();
    if (!del.classList.contains('confirm')) {
      del.classList.add('confirm');
      del.textContent = 'Remove?';
      timer = setTimeout(() => {
        del.classList.remove('confirm');
        del.textContent = '✕';
      }, 3000);
      return;
    }
    clearTimeout(timer);
    media = await window.api.deleteBackground(item.name);
    bg.init();
    renderSettings();
    toast('Removed ' + item.name);
  };
  t.appendChild(del);

  const apply = () => {
    const i = media.backgrounds.findIndex((b) => b.name === item.name);
    bg.set(i >= 0 ? i : index);
    markActiveTile();
  };
  t.onclick = apply;
  t.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      apply();
    }
  };
  return t;
}

function renderSettings() {
  const sv = $('#settingsView');
  sv.replaceChildren();
  saveBar = null;
  settingsGuard = null;
  if (settingsPage !== 'profile') profileDraft = null;
  const pages = { account: [], profile: [], background: [], music: [], appearance: [], game: [], optimization: [], layout: [] };

  // ----- Account -----
  const acc = el('div', 'set-sec');
  acc.appendChild(el('h3', null, 'Accounts'));
  acc.appendChild(
    el(
      'div',
      'set-desc',
      S.loggedIn
        ? `Logged in as @${S.username}. Games you start open as this account. Add your other accounts to switch between them without logging in again.`
        : "Log in to see your real avatar, which friends are online and your notifications. You can add several accounts and switch between them."
    )
  );
  const list = el('div', 'acctlist');
  accountsInfo.accounts.forEach((a) => {
    const active = S.loggedIn && a.userId === S.userId;
    const row = el('div', 'acctrow' + (active ? ' active' : ''));
    const im = el('img');
    im.alt = '';
    headshots([a.userId]).then((m) => m.get(a.userId) && (im.src = m.get(a.userId)));
    const names = el('div', 'acctnames');
    names.appendChild(el('b', null, a.displayName || a.username));
    names.appendChild(el('span', null, '@' + a.username));
    row.append(im, names);
    if (active) row.appendChild(el('span', 'acctbadge', 'In use'));
    else {
      const sw = el('button', 'pill', 'Switch');
      sw.onclick = () => switchAccount(a.userId);
      row.appendChild(sw);
    }
    const rm = el('button', 'acctremove', '✕');
    rm.title = 'Remove this account from BloxCool';
    rm.onclick = () => removeAccount(a.userId);
    row.appendChild(rm);
    list.appendChild(row);
  });
  if (accountsInfo.accounts.length) acc.appendChild(list);
  const accActions = el('div', 'set-actions');
  const addCookie = el('button', 'pill primary', S.loggedIn || accountsInfo.accounts.length ? 'Add account (cookie)' : 'Log in with cookie');
  addCookie.onclick = () => (S.loggedIn || accountsInfo.accounts.length ? addAccount('cookie') : cookieLogin());
  const addWin = el('button', 'pill', S.loggedIn || accountsInfo.accounts.length ? 'Add account (Roblox window)' : 'Log in with Roblox window');
  addWin.onclick = () => (S.loggedIn || accountsInfo.accounts.length ? addAccount('window') : login());
  accActions.append(addCookie, addWin);
  if (S.loggedIn) {
    const edit = el('button', 'pill', 'Edit avatar');
    edit.onclick = openAvatarEditor;
    const out = el('button', 'pill', 'Log out');
    out.onclick = logout;
    accActions.append(edit, out);
  }
  acc.appendChild(accActions);
  pages.account.push(acc);

  // ----- My profile (look + group server) -----
  const pl = el('div', 'set-sec');
  pl.appendChild(el('h3', null, 'Profile look'));
  pl.appendChild(el('div', 'set-desc', 'Everyone who uses BloxCool sees your profile look when they open your profile.'));
  const ptabBar = el('div', 'set-pills ptabs');
  const panes = { pics: el('div', 'ptab'), name: el('div', 'ptab'), fx: el('div', 'ptab') };
  [['pics', 'Pictures'], ['name', 'Name & style'], ['fx', 'Effects']].forEach(([k, label]) => {
    const b = el('button', 'pill' + (profileTab === k ? ' active' : ''), label);
    b.onclick = () => {
      profileTab = k;
      ptabBar.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x === b));
      Object.entries(panes).forEach(([n, pn]) => (pn.hidden = n !== k));
    };
    ptabBar.appendChild(b);
  });
  Object.entries(panes).forEach(([n, pn]) => (pn.hidden = n !== profileTab));
  pl.append(ptabBar, panes.pics, panes.name, panes.fx);
  const draft = profileDraft || (profileDraft = { ...(S.profileCustom || {}) });
  const norm = (o) =>
    JSON.stringify(
      Object.keys(o || {})
        .filter((k) => o[k] !== undefined && o[k] !== '' && o[k] !== 'none')
        .sort()
        .map((k) => [k, o[k]])
    );
  const isDirty = () => norm(draft) !== norm(S.profileCustom);
  let refreshDirty = () => {};
  const plPrev = el('div', 'pbanner');
  const paintPrev = () => {
    plPrev.hidden = !draft.banner;
    plPrev.style.backgroundImage = draft.banner ? `url("${draft.banner}")` : '';
    refreshDirty();
  };
  paintPrev();
  panes.pics.appendChild(el('div', 'fxlabel', 'Banner'));
  panes.pics.appendChild(plPrev);
  const bRow = el('div', 'set-actions');
  const bPick = el('button', 'pill', draft.banner ? 'Change banner…' : 'Choose banner…');
  bPick.onclick = async () => {
    const d = await pickImage({ aspect: 3, w: 900, h: 300, title: 'Adjust your banner', max: 170000 });
    if (d === false) return; // cancelled
    if (!d) return toast("Couldn't use that picture");
    draft.banner = d;
    bPick.textContent = 'Change banner…';
    paintPrev();
  };
  const bOff = el('button', 'pill', 'Remove banner');
  bOff.onclick = () => {
    delete draft.banner;
    paintPrev();
  };
  bRow.append(bPick, bOff);
  panes.pics.appendChild(bRow);

  const bgPrev = el('div', 'pbanner');
  bgPrev.style.height = '90px';
  const paintBg = () => {
    bgPrev.hidden = !draft.bg;
    bgPrev.style.backgroundImage = draft.bg ? `url("${draft.bg}")` : '';
    refreshDirty();
  };
  paintBg();
  panes.pics.appendChild(el('div', 'fxlabel', 'Profile background'));
  panes.pics.appendChild(bgPrev);
  const gRow2 = el('div', 'set-actions');
  const gPick = el('button', 'pill', draft.bg ? 'Change profile background…' : 'Choose profile background…');
  gPick.onclick = async () => {
    const d = await pickImage({ aspect: 1.6, w: 1280, h: 800, title: 'Adjust profile background', max: 240000 });
    if (d === false) return;
    if (!d) return toast("Couldn't use that picture");
    draft.bg = d;
    gPick.textContent = 'Change profile background…';
    paintBg();
  };
  const gOff = el('button', 'pill', 'Remove background');
  gOff.onclick = () => {
    delete draft.bg;
    paintBg();
  };
  gRow2.append(gPick, gOff);
  panes.pics.appendChild(gRow2);

  const nickIn = document.createElement('input');
  nickIn.className = 'set-input';
  nickIn.placeholder = 'BloxCool username (any name, emojis too, shown to everyone in BloxCool)';
  nickIn.value = draft.nick || '';
  nickIn.oninput = () => (draft.nick = Array.from(nickIn.value.trim()).slice(0, 32).join(''));
  panes.name.appendChild(el('div', 'fxlabel', 'BloxCool username'));
  panes.name.appendChild(nickIn);

  const pfpRow = el('div', 'set-actions');
  const pfpPrev = el('img', 'ppfp');
  pfpPrev.alt = '';
  const paintPfp = () => {
    pfpPrev.hidden = !draft.pfp;
    if (draft.pfp) pfpPrev.src = draft.pfp;
    refreshDirty();
  };
  const pfpPick = el('button', 'pill', draft.pfp ? 'Change profile picture…' : 'Choose profile picture…');
  pfpPick.onclick = async () => {
    const d = await pickImage({ aspect: 1, w: 256, h: 256, title: 'Adjust profile picture', max: 70000 });
    if (d === false) return;
    if (!d) return toast("Couldn't use that picture");
    draft.pfp = d;
    pfpPick.textContent = 'Change profile picture…';
    paintPfp();
  };
  const pfpOff = el('button', 'pill', 'Remove picture');
  pfpOff.onclick = () => {
    delete draft.pfp;
    paintPfp();
  };
  pfpRow.append(pfpPrev, pfpPick, pfpOff);
  panes.pics.appendChild(el('div', 'fxlabel', 'Profile picture'));
  panes.pics.appendChild(pfpRow);
  paintPfp();

  const tag = document.createElement('input');
  tag.className = 'set-input';
  tag.placeholder = 'Tagline (e.g. "grinding Blox Fruits")';
  tag.maxLength = 80;
  tag.value = draft.tagline || '';
  tag.oninput = () => (draft.tagline = tag.value.trim());
  panes.name.appendChild(el('div', 'fxlabel', 'Tagline'));
  panes.name.appendChild(tag);

  const colRow = el('div', 'set-row');
  const col = document.createElement('input');
  col.type = 'color';
  col.value = draft.accent || S.accent || '#00a2ff';
  col.oninput = () => (draft.accent = col.value);
  colRow.append(el('span', null, 'Profile color'), col);
  colRow.style.margin = '14px 0';
  panes.name.appendChild(colRow);

  const fr = el('div', 'set-pills');
  [['none', 'Square'], ['round', 'Round'], ['ring', 'Ring'], ['glow', 'Glow']].forEach(([val, label]) => {
    const p = el('button', 'pill' + ((draft.frame || 'none') === val ? ' active' : ''), label);
    p.onclick = () => {
      draft.frame = val;
      fr.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x === p));
    };
    fr.appendChild(p);
  });
  fr.style.marginBottom = '16px';
  panes.name.appendChild(el('div', 'fxlabel', 'Picture frame'));
  panes.name.appendChild(fr);

  // ----- Effects: pick one for your picture, banner and name, with a live preview -----
  panes.fx.appendChild(el('div', 'fxlabel', 'Preview'));
  const fxPrev = el('div', 'fxprev');
  const fxRow = el('div', 'fxprev-row');
  const fxHost = el('span', 'pfphost');
  const fxImg = el('img', 'ppfp');
  fxImg.alt = '';
  fxHost.appendChild(fxImg);
  const fxNm = el('span', 'fxprev-name', draft.nick || S.displayName || S.username || 'You');
  fxRow.append(fxHost, fxNm);
  fxPrev.appendChild(fxRow);
  const paintFx = () => {
    const f = draft.fx || {};
    fxPrev.style.backgroundImage = draft.banner ? `url("${draft.banner}")` : '';
    fxImg.src = draft.pfp || FX_PLACEHOLDER;
    fxNm.textContent = draft.nick || S.displayName || S.username || 'You';
    fxPic(fxHost, f.pic);
    fxName(fxNm, f.name);
    fxBanner(fxPrev, f.banner, { preview: true });
    fxBanner(fxPrev, f.bg, { preview: true, slot: 'bg' });
    refreshDirty();
  };
  panes.fx.appendChild(fxPrev);
  const fxSample = (kind, key, host) => {
    if (kind === 'pic') {
      const h = el('span', 'pfphost');
      const im = el('img', 'ppfp');
      im.src = draft.pfp || FX_PLACEHOLDER;
      h.appendChild(im);
      host.appendChild(h);
      fxPic(h, key);
    } else if (kind === 'banner' || kind === 'bgfx') {
      const st = el('div', 'fxmini-ban');
      if (draft.banner) st.style.backgroundImage = `url("${draft.banner}")`;
      host.appendChild(st);
      fxBanner(st, key, { preview: true, slot: kind === 'bgfx' ? 'bg' : 'banner' });
    } else {
      const nm = el('span', 'fxmini-name', 'snwer');
      host.appendChild(nm);
      fxName(nm, key);
    }
  };
  const isSpecial = (k) => GRANT_FX.has(k) || OWNER_FX.has(k) || ALT_FX.has(k);
  const fxPicker = (title, list, kind, key, special) => {
    const items = list.filter(([k]) => fxAllowed(k) && !!isSpecial(k) === !!special);
    if (!items.length) return; // nothing to offer this account
    panes.fx.appendChild(el('div', 'fxlabel', title));
    const grid = el('div', 'fxgrid');
    (special ? items : [['', 'None'], ...items]).forEach(([val, label]) => {
      const t = el('button', 'fxtile' + (special ? ' fxspecial' : '') + ((draft.fx || {})[key] === val || (!val && !(draft.fx || {})[key]) ? ' sel' : ''));
      t.dataset.fxkey = key;
      const locked = !!val && !fxAllowed(val);
      if (locked) { t.classList.add('fxlocked'); t.title = 'Exclusive: only given out by the owner'; }
      const stage = el('div', 'fxstage' + (kind === 'banner' || kind === 'bgfx' ? ' wide' : ''));
      if (val) fxSample(kind, val, stage);
      else stage.appendChild(el('span', 'fxnone', '∅'));
      t.append(stage, el('span', 'fxtile-l', label));
      if (locked) stage.appendChild(el('span', 'fxlock', '🔒'));
      t.onclick = () => {
        if (locked) { toast && toast('Exclusive effect: only the owner can give it out'); return; }
        const f = { ...(draft.fx || {}) };
        if (val) f[key] = val;
        else delete f[key];
        const ordered = {};
        ['pic', 'banner', 'name', 'bg'].forEach((k) => f[k] && (ordered[k] = f[k]));
        if (Object.keys(ordered).length) draft.fx = ordered;
        else delete draft.fx;
        panes.fx.querySelectorAll('.fxtile[data-fxkey="' + key + '"]').forEach((x) => x.classList.toggle('sel', x === t));
        paintFx();
      };
      grid.appendChild(t);
    });
    panes.fx.appendChild(grid);
  };
  fxPicker('Picture effect', PIC_FX, 'pic', 'pic');
  fxPicker('Banner and background effect', BAN_FX, 'banner', 'banner');
  fxPicker('Name effect', NAME_FX, 'name', 'name');
  fxPicker('Background effect (behind your whole profile)', BG_FX, 'bgfx', 'bg');
  const exTitle = el('div', 'fxlabel fxex', '✦ Exclusive effects');
  panes.fx.appendChild(exTitle);
  const exStart = panes.fx.children.length;
  fxPicker('Exclusive picture', PIC_FX, 'pic', 'pic', true);
  fxPicker('Exclusive banner', BAN_FX, 'banner', 'banner', true);
  fxPicker('Exclusive name', NAME_FX, 'name', 'name', true);
  fxPicker('Exclusive background', BG_FX, 'bgfx', 'bg', true);
  if (panes.fx.children.length === exStart) exTitle.remove();
  setTimeout(paintFx, 0);
  const fxEnd = el('div');
  fxEnd.style.height = '16px';
  panes.fx.appendChild(fxEnd);

  const save = el('button', 'pill primary', 'Save');
  const doSave = async (btn) => {
    const label = btn.textContent;
    btn.textContent = 'Saving…';
    S = await window.api.setSettings({ profileCustom: { ...draft } });
    applyPlayColor();
    const r = await window.api.groupSave();
    btn.textContent = label;
    lastLookError = r.ok ? '' : r.error;
    if (r.ok) {
      looks[String(S.userId)] = { look: { ...draft }, at: Date.now() };
      toast('Saved. Everyone using BloxCool can see it now.');
      loadProfile();
    } else toast("Saved on this PC, but couldn't share it: " + r.error);
    profileDraft = null;
    renderSettings();
  };
  save.onclick = () => doSave(save);
  const reset = el('button', 'pill', 'Clear look');
  reset.title = 'Remove your whole custom look';
  reset.onclick = async () => {
    profileDraft = null;
    S = await window.api.setSettings({ profileCustom: {} });
    await window.api.groupSave();
    delete looks[String(S.userId)];
    renderSettings();
    toast('Look cleared');
  };
  const sRow = el('div', 'set-actions');
  sRow.append(save, reset);
  pl.appendChild(sRow);

  // Discord-style bar: shows while there are unsaved changes
  const bar = el('div', 'savebar');
  bar.hidden = true;
  bar.appendChild(el('span', null, 'Careful, you have unsaved changes!'));
  const barBtns = el('div', 'savebar-btns');
  const barReset = el('button', 'savebar-reset', 'Reset');
  barReset.onclick = () => {
    profileDraft = null;
    renderSettings();
  };
  const barSave = el('button', 'savebar-save', 'Save Changes');
  barSave.onclick = () => doSave(barSave);
  barBtns.append(barReset, barSave);
  bar.appendChild(barBtns);
  saveBar = bar;
  refreshDirty = () => {
    bar.hidden = !isDirty();
  };
  settingsGuard = () => {
    if (!isDirty()) return false;
    bar.classList.remove('shake');
    void bar.offsetWidth; // restart the animation
    bar.classList.add('shake');
    return true;
  };
  pl.addEventListener('input', refreshDirty);
  pl.addEventListener('click', () => setTimeout(refreshDirty, 0));
  refreshDirty();
  pages.profile.push(pl);

  // ----- BloxCool font -----
  const ufn = el('div', 'set-sec');
  ufn.appendChild(el('h3', null, 'BloxCool font'));
  ufn.appendChild(el('div', 'set-desc', 'Changes the font of BloxCool itself (menus, names, titles). Pick a .ttf, .otf or .woff file.'));
  if (S.uiFontName && S.uiFontLabel) ufn.appendChild(el('div', 'set-desc', 'Current font: ' + S.uiFontLabel));
  const uRow = el('div', 'set-actions');
  const uPick = el('button', 'pill primary', S.uiFontName ? 'Change font…' : 'Choose font…');
  uPick.onclick = async () => {
    const r = await window.api.chooseUiFont();
    if (r.settings) S = r.settings;
    if (r.canceled) return;
    await applyUiFont();
    toast('Font changed');
    renderSettings();
  };
  uRow.appendChild(uPick);
  if (S.uiFontName) {
    const uOff = el('button', 'pill', 'Use default font');
    uOff.onclick = async () => {
      const r = await window.api.removeUiFont();
      if (r.settings) S = r.settings;
      await applyUiFont();
      renderSettings();
    };
    uRow.appendChild(uOff);
  }
  ufn.appendChild(uRow);
  pages.appearance.push(ufn);

  // ----- Game font -----
  const fnt = el('div', 'set-sec');
  fnt.appendChild(el('h3', null, 'Game font (inside Roblox)'));
  fnt.appendChild(
    el(
      'div',
      'set-desc',
      'Use your own font inside Roblox games (.ttf or .otf). It is applied to the Roblox files that BloxCool starts, so it needs direct launch to work. If a game opens through another launcher, that launcher may undo it.'
    )
  );
  if (S.fontEnabled && S.fontLabel) fnt.appendChild(el('div', 'set-desc', 'Current font: ' + S.fontLabel));
  const fRow = el('div', 'set-actions');
  const fPick = el('button', 'pill primary', S.fontEnabled ? 'Change font…' : 'Choose font…');
  fPick.onclick = async () => {
    const r = await window.api.chooseFont();
    if (r.settings) S = r.settings;
    if (r.canceled) return;
    toast(r.applied ? 'Font applied. It shows up next time a game starts.' : "Font saved, couldn't apply yet: " + r.error);
    renderSettings();
  };
  fRow.appendChild(fPick);
  if (S.fontEnabled) {
    const fOff = el('button', 'pill', 'Use default font');
    fOff.onclick = async () => {
      const r = await window.api.removeFont();
      if (r.settings) S = r.settings;
      toast(r.error ? "Couldn't fully restore: " + r.error : 'Default font restored');
      renderSettings();
    };
    fRow.appendChild(fOff);
  }
  fnt.appendChild(fRow);
  pages.game.push(fnt);

  // ----- Music -----
  const mus = el('div', 'set-sec');
  mus.appendChild(el('h3', null, 'Music'));
  {
    const row = el('div', 'opt-row');
    const txt = el('div', 'opt-txt');
    txt.append(el('b', null, 'Music player'), el('span', null, 'Turn off to remove the player from the home page and stop it checking what is playing'));
    const sw = el('button', 'switch' + (S.musicOff ? '' : ' on'));
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', String(!S.musicOff));
    sw.appendChild(el('i'));
    sw.onclick = async () => {
      S = await window.api.setSettings({ musicOff: !S.musicOff });
      player.setMode(player.pickMode());
      applyLayout();
      renderSettings();
    };
    row.append(txt, sw);
    mus.appendChild(row);
  }
  const src = S.musicSource === 'spotify' ? 'spotify' : 'pc';
  const srcPills = el('div', 'set-pills');
  srcPills.style.marginBottom = '14px';
  [
    ['pc', 'This PC (works with free Spotify)'],
    ['spotify', 'Spotify account (needs Premium)'],
  ].forEach(([val, label]) => {
    const p = el('button', 'pill' + (src === val ? ' active' : ''), label);
    p.onclick = async () => {
      S = await window.api.setSettings({ musicSource: val });
      player.setMode(player.pickMode());
      renderSettings();
    };
    srcPills.appendChild(p);
  });
  mus.appendChild(srcPills);

  if (src === 'pc') {
    mus.appendChild(
      el(
        'div',
        'set-desc',
        'Shows what is playing in the Spotify app on this PC (or any other media app) and controls it: play/pause, previous, next, seeking and the Spotify app\'s volume. No Premium and no developer app needed. Just open the Spotify app and press play. Windows only.'
      )
    );
  } else if (S.spotifyConnected) {
    mus.appendChild(
      el(
        'div',
        'set-desc',
        'Connected. The player in the top left controls whatever Spotify is playing on any of your devices. Start Spotify and press play.'
      )
    );
    const musActions = el('div', 'set-actions');
    const off = el('button', 'pill', 'Disconnect Spotify');
    off.onclick = async () => {
      S = await window.api.spotifyDisconnect();
      player.setMode(player.pickMode());
      renderSettings();
      toast('Spotify disconnected');
    };
    musActions.appendChild(off);
    mus.appendChild(musActions);
  } else {
    mus.appendChild(
      el(
        'div',
        'set-desc',
        'Control Spotify on any of your devices. This needs Spotify Premium and a free Spotify developer app. One-time setup, about 2 minutes:'
      )
    );
    const steps = el('ol', 'set-steps');
    const addStep = (text, extra) => {
      const li = el('li', null, text);
      if (extra) li.appendChild(extra);
      steps.appendChild(li);
    };
    addStep('Open the Spotify developer dashboard and click "Create app" (any name and description).');
    const uri = el('span', 'codebox', 'http://127.0.0.1:8888/callback');
    addStep('Under Redirect URIs add exactly this, click Add, and tick "Web API": ', uri);
    addStep("Save, open the app's Settings, and copy the Client ID.");
    addStep('Paste the Client ID below and click Connect Spotify.');
    mus.appendChild(steps);

    const row2 = el('div', 'set-actions');
    const dash = el('button', 'pill', 'Open developer dashboard');
    dash.onclick = () => window.api.openLink('https://developer.spotify.com/dashboard');
    const copy = el('button', 'pill', 'Copy redirect URI');
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText('http://127.0.0.1:8888/callback');
        toast('Copied');
      } catch {
        toast('Select the address above and press Ctrl+C');
      }
    };
    row2.append(dash, copy);
    mus.appendChild(row2);

    const idInput = document.createElement('input');
    idInput.className = 'set-input';
    idInput.placeholder = 'Client ID (32 letters and numbers)';
    idInput.spellcheck = false;
    idInput.value = S.spotifyClientId || '';
    mus.appendChild(idInput);

    const connect = el('button', 'pill primary', 'Connect Spotify');
    connect.onclick = async () => {
      const id = idInput.value.trim();
      if (!/^[a-f0-9]{32}$/i.test(id)) return toast("That doesn't look like a Client ID (32 letters and numbers)");
      toast('Your browser will open. Approve access, then come back here.');
      let r = null;
      try {
        r = await window.api.spotifyConnect(id);
      } catch (e) {
        console.warn('spotify connect failed', e);
      }
      if (r && r.settings) S = r.settings;
      if (!r || !r.ok) {
        return toast(
          r && r.error === 'port'
            ? 'Port 8888 is busy. Close other apps using it and try again.'
            : 'Spotify connection was cancelled or failed.'
        );
      }
      S = await window.api.setSettings({ musicSource: 'spotify' });
      toast('Spotify connected!');
      player.setMode(player.pickMode());
      renderSettings();
    };
    mus.appendChild(connect);
  }
  pages.music.push(mus);

  // ----- Background pictures -----
  const sec = el('div', 'set-sec');
  sec.appendChild(el('h3', null, 'Background'));
  sec.appendChild(
    el(
      'div',
      'set-desc',
      'Click a picture to use it as your background. Pictures you add are copied into BloxCool and stay saved. GIFs and videos (.mp4, .webm) animate.'
    )
  );

  const actions = el('div', 'set-actions');
  const addBtn = el('button', 'pill primary', 'Add pictures…');
  addBtn.onclick = async () => {
    const r = await window.api.addBackgrounds();
    if (r.canceled) return;
    media = r.media;
    if (r.added.length) {
      const i = media.backgrounds.findIndex((b) => b.name === r.added[0]);
      if (i >= 0) bg.set(i);
      bg.startTimer();
      toast(r.added.length === 1 ? 'Background added' : r.added.length + ' backgrounds added');
    } else {
      toast('No supported files were chosen');
    }
    renderSettings();
  };
  const folderBtn = el('button', 'pill', 'Open folder');
  folderBtn.onclick = () => window.api.openFolder('backgrounds');
  const adjBtn = el('button', 'pill', 'Adjust position…');
  adjBtn.title = 'Move and zoom the picture that is in use';
  adjBtn.onclick = async () => {
    const item = media.backgrounds.find((b) => b.name === S.backgroundName) || media.backgrounds[S.backgroundIndex || 0];
    if (!item) return toast('Add a picture first');
    const adj = await openCropper({
      url: item.url,
      kind: item.type === 'video' ? 'video' : 'image',
      aspect: window.innerWidth / window.innerHeight,
      title: 'Adjust background',
      hint: 'This is how your whole window will look. Drag to move, slider or wheel to zoom.',
      initial: (S.bgAdjust || {})[item.name],
    });
    if (!adj) return;
    const all = { ...(S.bgAdjust || {}) };
    if (adj.zoom === 1 && adj.x === 0.5 && adj.y === 0.5) delete all[item.name];
    else all[item.name] = adj;
    S = await window.api.setSettings({ bgAdjust: all });
    bg.refreshAdjust();
    toast('Background adjusted');
  };
  actions.append(addBtn, adjBtn, folderBtn);
  sec.appendChild(actions);

  const grid = el('div', 'bggrid');
  if (!media.backgrounds.length) {
    grid.appendChild(el('div', 'empty', 'No backgrounds yet. Click "Add pictures…" to choose some from your computer.'));
  }
  media.backgrounds.forEach((item, i) => grid.appendChild(bgTile(item, i)));
  sec.appendChild(grid);
  pages.background.push(sec);

  // ----- Darkness -----
  const dark = el('div', 'set-sec');
  dark.appendChild(el('h3', null, 'Readability'));
  dark.appendChild(el('div', 'set-desc', 'Darken the background so text stays easy to read.'));
  const row = el('div', 'set-row');
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '0.9';
  slider.step = '0.01';
  slider.value = S.overlayOn ? S.overlayOpacity : 0;
  const val = el('span', 'val', Math.round(slider.value * 100) + '%');
  setRangeFill(slider);
  slider.addEventListener('input', () => {
    S.overlayOpacity = Number(slider.value);
    S.overlayOn = S.overlayOpacity > 0;
    bg.applyOverlay();
    setRangeFill(slider);
    val.textContent = Math.round(slider.value * 100) + '%';
  });
  slider.addEventListener('change', () =>
    window.api.setSettings({ overlayOpacity: S.overlayOpacity, overlayOn: S.overlayOn })
  );
  row.append(el('span', null, 'Darkness'), slider, val);
  dark.appendChild(row);
  pages.appearance.push(dark);

  // ----- Optimization: switch each animation on or off -----
  const optSec = el('div', 'set-sec');
  optSec.appendChild(el('h3', null, 'Animations'));
  optSec.appendChild(el('div', 'set-desc', 'Turn off the ones you do not want. Turning them off can make the app feel lighter on slower PCs.'));
  const switches = [];
  const saveAnim = async (key, on) => {
    const next = { ...(S.animOff || {}) };
    if (on) delete next[key];
    else next[key] = true;
    S = await window.api.setSettings({ animOff: next });
    applyAnimPrefs();
    switches.forEach((f) => f());
  };
  const mkSwitch = (key, label, desc) => {
    const row = el('div', 'opt-row');
    const txt = el('div', 'opt-txt');
    txt.append(el('b', null, label), el('span', null, desc));
    const sw = el('button', 'switch');
    sw.setAttribute('role', 'switch');
    sw.appendChild(el('i'));
    const paint = () => {
      const on = key === 'all' ? !(S.animOff && S.animOff.all) : !(S.animOff && S.animOff[key]);
      sw.classList.toggle('on', on);
      sw.setAttribute('aria-checked', on);
      if (key !== 'all') row.classList.toggle('dim', !!(S.animOff && S.animOff.all));
    };
    sw.onclick = () => saveAnim(key, !sw.classList.contains('on'));
    switches.push(paint);
    paint();
    row.append(txt, sw);
    return row;
  };
  optSec.appendChild(mkSwitch('all', 'All animations', 'Master switch: off disables every animation and transition'));
  ANIMS.forEach(([k, l, d]) => optSec.appendChild(mkSwitch(k, l, d)));
  const dbgRow = el('div', 'set-actions');
  dbgRow.style.marginTop = '16px';
  const dbgBtn = el('button', 'pill', 'Effects debug (Ctrl+Shift+D)');
  dbgBtn.title = 'Outlines every effect layer and shows measurements you can copy';
  dbgBtn.onclick = fxDebugToggle;
  dbgRow.appendChild(dbgBtn);
  optSec.appendChild(dbgRow);
  pages.optimization.push(optSec);

  // ----- Auto-change -----
  const cyc = el('div', 'set-sec');
  cyc.appendChild(el('h3', null, 'Auto-change'));
  cyc.appendChild(el('div', 'set-desc', 'Switch to the next background automatically.'));
  const pills = el('div', 'set-pills');
  [['Off', 0], ['30 seconds', 30], ['1 minute', 60], ['5 minutes', 300]].forEach(([label, secs]) => {
    const p = el('button', 'pill' + ((S.backgroundCycleSeconds || 0) === secs ? ' active' : ''), label);
    p.onclick = () => {
      S.backgroundCycleSeconds = secs;
      window.api.setSettings({ backgroundCycleSeconds: secs });
      bg.startTimer();
      pills.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x === p));
    };
    pills.appendChild(p);
  });
  cyc.appendChild(pills);
  pages.background.push(cyc);

  // ----- Layout: move / hide the blocks of the home page -----
  {
    const lay = el('div', 'set-sec');
    lay.appendChild(el('h3', null, 'Home page'));
    lay.appendChild(el('div', 'set-desc', 'Rearrange the home page. Changes apply right away.'));
    renderLayoutEditor(lay);
    pages.layout.push(lay);
    const parts = el('div', 'set-sec');
    parts.appendChild(el('h3', null, 'Parts of each block'));
    parts.appendChild(el('div', 'set-desc', 'Switch off the little pieces you never use.'));
    const partSwitches = [];
    LAYOUT_PARTS.forEach(([blk, key, label]) => {
      const row = el('div', 'opt-row');
      const txt = el('div', 'opt-txt');
      txt.append(el('b', null, label), el('span', null, LAYOUT_NAMES[blk]));
      const sw = el('button', 'switch');
      sw.setAttribute('role', 'switch');
      sw.appendChild(el('i'));
      const paint = () => {
        const on = !layoutGet().parts[key];
        sw.classList.toggle('on', on);
        sw.setAttribute('aria-checked', on);
      };
      sw.onclick = async () => {
        const L = layoutGet();
        if (L.parts[key]) delete L.parts[key];
        else L.parts[key] = true;
        await layoutSave(L);
        partSwitches.forEach((f) => f());
      };
      partSwitches.push(paint);
      paint();
      row.append(txt, sw);
      parts.appendChild(row);
    });
    // sizes
    const sz = el('div', 'set-sec');
    sz.appendChild(el('h3', null, 'Sizes'));
    sz.appendChild(el('div', 'set-desc', 'Resizing only happens here, not on the home page.'));
    layoutPreviewBuild(sz);
    const mkSize = (key, label, min, max, step, auto, unit) => {
      const row = el('div', 'set-row');
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = String(min);
      sl.max = String(max);
      sl.step = String(step);
      const cur = () => layoutGet().size[key];
      sl.value = String(cur() || auto);
      const val = el('span', 'val', cur() ? cur() + unit : 'Auto');
      setRangeFill(sl);
      sl.addEventListener('input', () => {
        const L = layoutGet();
        L.size[key] = Number(sl.value);
        S.layout = { ...(S.layout || {}), size: L.size };
        applyLayout();
        val.textContent = sl.value + unit;
        setRangeFill(sl);
      });
      sl.addEventListener('change', () => layoutSave(layoutGet()));
      row.append(el('span', null, label), sl, val);
      return row;
    };
    sz.append(
      mkSize('topH', 'Top area height', 180, 700, 5, 320, 'px'),
      mkSize('leftW', 'Left block width', 220, 800, 5, 400, 'px'),
      mkSize('friends', 'Friend picture size', 50, 180, 2, 100, 'px'),
      mkSize('friendsMax', 'Friends listed on home', 1, 60, 1, 20, ''),
      mkSize('mini', 'Mini profile size', 60, 160, 5, 100, '%')
    );
    pages.layout.push(sz);
    const chk = el('div', 'set-sec');
    chk.appendChild(el('h3', null, 'Check for clipping'));
    chk.appendChild(el('div', 'set-desc', 'Looks at the real home page and tells you if anything is cut off or covered.'));
    renderLayoutCheck(chk);
    pages.layout.push(chk);
    const rst = el('div', 'set-actions');
    rst.style.marginTop = '16px';
    const rb = el('button', 'pill', 'Reset layout');
    rb.onclick = async () => {
      S = await window.api.setSettings({ layout: {} });
      document.getElementById('top').style.cssText = '';
      applyLayout();
      renderSettings();
    };
    rst.appendChild(rb);
    parts.appendChild(rst);
    pages.layout.push(parts);
  }

  // ----- Roblox-style menu: a list of rows, each opens its own page -----
  const defs = [
    ['account', 'Accounts', S.loggedIn ? '@' + S.username + (accountsInfo.accounts.length > 1 ? ' · ' + accountsInfo.accounts.length + ' accounts' : '') : 'Not logged in'],
    ['background', 'Background', S.backgroundName ? S.backgroundName.replace(/\.[^.]+$/, '').slice(0, 24) : 'None'],
    ['profile', 'My profile', 'Seen by all BloxCool users'],
    ['layout', 'Layout', 'Move or hide home page blocks'],
    ['music', 'Music', S.musicSource === 'spotify' ? 'Spotify account' : 'This PC'],
    ['appearance', 'Appearance', 'Readability, BloxCool font'],
    ['optimization', 'Optimization', S.animOff && S.animOff.all ? 'All animations off' : Object.keys(S.animOff || {}).length ? Object.keys(S.animOff).length + ' animations off' : 'Animations'],
    ['game', 'Game font', S.fontEnabled && S.fontLabel ? S.fontLabel : 'Default'],
  ];
  if (settingsPage && !pages[settingsPage]) settingsPage = null;

  if (!settingsPage) {
    sv.appendChild(el('h1', 'set-title', 'Settings'));
    const list = el('div', 'set-menu');
    defs.forEach(([key, label, hint]) => {
      const row = el('button', 'set-menurow');
      row.appendChild(el('span', 'smr-label', label));
      row.appendChild(el('span', 'smr-hint', hint));
      const chev = el('span', 'smr-chev');
      chev.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      row.appendChild(chev);
      row.onclick = () => {
        settingsPage = key;
        renderSettings();
        sv.scrollTop = 0;
      };
      list.appendChild(row);
    });
    sv.appendChild(list);
    return;
  }

  const def = defs.find((d) => d[0] === settingsPage);
  const head = el('div', 'set-pagehead');
  const back = el('button', 'set-back');
  back.title = 'Back';
  back.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  back.onclick = () => {
    if (settingsGuard && settingsGuard()) return;
    settingsPage = null;
    renderSettings();
  };
  head.append(back, el('h1', 'set-title', def[1]));
  sv.appendChild(head);

  const secs = pages[settingsPage];
  if (settingsPage === 'appearance') secs.reverse(); // Readability first, then the BloxCool font
  const wrap = el('div', 'set-page');
  secs.forEach((sec) => {
    // a page with a single section already has its title in the header
    if (secs.length === 1) {
      const h = sec.querySelector('h3');
      if (h) h.remove();
    }
    wrap.appendChild(sec);
  });
  sv.appendChild(wrap);
  if (saveBar) sv.appendChild(saveBar);
  markActiveTile();
}

// ============================================================================
// In-app profile viewer (friends + your own profile)
// ============================================================================
let profileToken = 0;

// ---- Account, presence, notifications ----
let friendEls = [];
let unreadCount = 0;
const presenceMap = new Map();

function presenceText(id) {
  if (!S.loggedIn) return '';
  const p = presenceMap.get(id);
  if (!p) return '';
  if (p.userPresenceType === 2) return 'In game' + (p.lastLocation ? ': ' + p.lastLocation : '');
  if (p.userPresenceType === 3) return 'In Roblox Studio';
  if (p.userPresenceType === 1) return 'Online';
  return 'Offline';
}

function applyPresence() {
  const rank = (id) => {
    const t = presenceMap.get(id)?.userPresenceType;
    return t === 2 ? 3 : t === 1 || t === 3 ? 2 : 1;
  };
  friendEls.forEach((x) => {
    const t = presenceMap.get(x.f.id)?.userPresenceType;
    x.dot.className = 'dot' + (t === 2 ? ' ingame' : t === 1 || t === 3 ? ' online' : '');
  });
  const row = $('#friendsRow');
  [...friendEls].sort((a, b) => rank(b.f.id) - rank(a.f.id)).forEach((x) => row.appendChild(x.b));
  applyFriendLimit();
}

async function loadPresence() {
  presenceMap.clear();
  if (!S.loggedIn || !friendEls.length) return applyPresence();
  try {
    const r = await JA('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      body: { userIds: friendEls.map((x) => x.f.id).slice(0, 200) },
    });
    (r.userPresences || []).forEach((p) => presenceMap.set(p.userId, p));
    applyPresence();
  } catch (e) {
    console.warn('presence failed', e);
  }
}

async function refreshNotifications() {
  const badge = $('#bellBadge');
  if (!badge) return;
  unreadCount = 0;
  if (S.loggedIn) {
    try {
      const r = await JA('https://notifications.roblox.com/v2/stream-notifications/unread-count');
      unreadCount = Number(r.unreadNotifications) || 0;
    } catch {
      /* leave at 0 */
    }
  }
  badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
  badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

async function login() {
  closeFloat();
  toast('Opening the Roblox login window…');
  let r = null;
  try {
    r = await window.api.authLogin();
  } catch (e) {
    console.warn('login failed', e);
  }
  if (!r || !r.me) return toast('Login cancelled');
  S = r.settings;
  bg.init(); // this account's own background
  await refreshAccounts();
  toast('Logged in as ' + r.me.name);
  await Promise.all([loadProfile(), loadFriends()]);
  refreshNotifications();
  if (view === 'settings') renderSettings();
}

async function cookieLogin() {
  closeFloat();
  const v = await promptModal({
    title: 'Log in with your cookie',
    text: 'Paste your .ROBLOSECURITY cookie value. It is saved only on this computer and only ever sent to roblox.com.',
    placeholder: '_|WARNING:-DO-NOT-SHARE-THIS…',
    okLabel: 'Log in',
    secret: true,
  });
  if (!v) return;
  toast('Checking your cookie…');
  let r = null;
  try {
    r = await window.api.authSetCookie(v);
  } catch (e) {
    console.warn('cookie login failed', e);
  }
  if (!r || !r.me) return toast("That cookie didn't work. Copy the whole value again.");
  S = r.settings;
  bg.init(); // this account's own background
  await refreshAccounts();
  toast('Logged in as ' + r.me.name);
  await Promise.all([loadProfile(), loadFriends()]);
  refreshNotifications();
  if (view === 'settings') renderSettings();
}

// ---- Several accounts ----
let accountsInfo = { active: 0, accounts: [] };
async function refreshAccounts() {
  try {
    accountsInfo = await window.api.accountsList();
  } catch {
    accountsInfo = { active: 0, accounts: [] };
  }
  return accountsInfo;
}

// After the active account changed: reload everything that belongs to it.
async function afterAccountChange(settings) {
  S = settings;
  applyPlayColor();
  bg.init(); // this account's own background
  presenceMap.clear();
  unreadCount = 0;
  Object.keys(looks).forEach((k) => delete looks[k]);
  profileDraft = null;
  await refreshAccounts();
  enforceBan();
  loadGrants();
  news.items = []; // another account: its groups, its news
  news.at = 0;
  setTimeout(newsPrefetch, 1500);
  await Promise.all([loadProfile(), loadFriends()]);
  refreshNotifications();
  ensureMyLook();
  refreshAll(); // Continue + Recommended are different for every account
  if (view === 'settings') renderSettings();
}

async function switchAccount(userId) {
  closeFloat();
  if (settingsGuard && settingsGuard()) return;
  const acc = accountsInfo.accounts.find((a) => a.userId === userId);
  toast('Switching to ' + (acc ? acc.username : 'account') + '…');
  const r = await window.api.accountsSwitch(userId);
  if (!r.ok) {
    S = r.settings || S;
    await refreshAccounts();
    if (view === 'settings') renderSettings();
    return toast(
      r.error === 'expired'
        ? 'That login expired. Use "Add account" to log in again.'
        : "Couldn't switch: " + r.error
    );
  }
  await afterAccountChange(r.settings);
  toast('Now using ' + r.settings.username);
}

async function addAccount(kind) {
  closeFloat();
  if (settingsGuard && settingsGuard()) return;
  const prev = S.loggedIn ? S.userId : 0;
  const restore = async () => {
    if (prev) {
      const r = await window.api.accountsSwitch(prev);
      if (r.ok) await afterAccountChange(r.settings);
    }
  };
  let r = null;
  if (kind === 'window') {
    await window.api.accountsPrepareAdd();
    toast('Log in to the other account in the window…');
    try {
      r = await window.api.authLogin();
    } catch { /* cancelled */ }
    if (!r || !r.me) {
      await restore();
      return toast('Login cancelled');
    }
  } else {
    const v = await promptModal({
      title: 'Add an account',
      text: 'Paste the .ROBLOSECURITY cookie of the other account. It is saved only on this computer.',
      placeholder: '_|WARNING:-DO-NOT-SHARE-THIS…',
      okLabel: 'Add',
      secret: true,
    });
    if (!v) return;
    toast('Checking the cookie…');
    try {
      r = await window.api.authSetCookie(v);
    } catch { /* invalid */ }
    if (!r || !r.me) {
      await restore();
      return toast("That cookie didn't work. Copy the whole value again.");
    }
  }
  await afterAccountChange(r.settings);
  toast('Added ' + r.me.name + '. You can switch accounts in Settings or from your profile menu.');
}

async function removeAccount(userId) {
  const acc = accountsInfo.accounts.find((a) => a.userId === userId);
  const was = S.loggedIn && S.userId === userId;
  const r = await window.api.accountsRemove(userId);
  accountsInfo = { active: r.active, accounts: r.accounts };
  if (was) await afterAccountChange(r.settings);
  else if (view === 'settings') renderSettings();
  toast('Removed ' + (acc ? acc.username : 'account'));
}

async function logout() {
  closeFloat();
  S = await window.api.authLogout();
  presenceMap.clear();
  unreadCount = 0;
  await refreshAccounts();
  refreshNotifications();
  await Promise.all([loadProfile(), loadFriends()]);
  if (view === 'settings') renderSettings();
  toast('Logged out. Your other accounts are still saved.');
}

async function openAvatarEditor() {
  closeFloat();
  if (!S.loggedIn) {
    toast('Log in first to edit your avatar');
    await login();
    if (!S.loggedIn) return;
  }
  showView('avatar');
}

async function welcome() {
  const name = await promptModal({
    title: 'Welcome to BloxCool',
    text: 'Log in with your cookie to see your real avatar, which friends are online and your notifications. Or just type a username to look around.',
    placeholder: 'Roblox username (optional)',
    okLabel: 'Use username',
    alt: 'Log in with cookie',
  });
  if (name === ALT) return cookieLogin();
  if (!name) return;
  try {
    const u = await resolveUsername(name);
    S = await window.api.setSettings({ username: u.name, userId: u.id, displayName: u.displayName });
    await loadProfile();
    await loadFriends();
    toast('Signed in as ' + u.name);
  } catch {
    toast('Could not find that username');
  }
}

function closeProfile() {
  $('#profile').classList.remove('open');
  profileToken++;
}
$('#profile').addEventListener('pointerdown', (e) => {
  if (e.target.id === 'profile') closeProfile();
});

async function fullBodyUrl(id) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await J(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png&isCircular=false`);
      const d = (r.data || [])[0];
      if (d && d.imageUrl) return d.imageUrl;
      if (!d || d.state !== 'Pending') return null;
    } catch {
      return null;
    }
    await new Promise((res) => setTimeout(res, 1200));
  }
  return null;
}


// Extra sections on a profile page: wearing, friends, favorites, creations, groups, badges.
async function loadProfileExtras(u, my, more, info) {
  const alive = () => my === profileToken;
  const section = (title) => {
    const wrap = el('div', 'psec');
    wrap.hidden = true;
    wrap.appendChild(el('h3', null, title));
    const body = el('div', 'pgrid');
    wrap.appendChild(body);
    more.appendChild(wrap);
    return { wrap, body, show: () => (wrap.hidden = false) };
  };
  const secWear = section('Currently wearing');
  const secFriends = section('Friends');
  const secFav = section('Favorites');
  const secMade = section('Experiences');
  const secGroups = section('Communities');
  const secBadges = section('Roblox badges');
  const safe = (p) => p.catch(() => null);

  // Past usernames
  safe(J(`https://users.roblox.com/v1/users/${u.id}/username-history?limit=10&sortOrder=Desc`)).then((r) => {
    const names = ((r && r.data) || []).map((x) => x.name).filter(Boolean);
    if (names.length && alive()) {
      const line = el('div', 'pjoined', 'Previously: ' + names.slice(0, 5).join(', '));
      const bioLabel = [...info.children].find((c) => c.classList && c.classList.contains('plabel'));
      info.insertBefore(line, bioLabel || null);
    }
  });

  // Currently wearing
  (async () => {
    const r = await safe(J(`https://avatar.roblox.com/v1/users/${u.id}/currently-wearing`));
    const ids = (r && r.assetIds) || [];
    if (!ids.length) return;
    const th = await safe(J(`https://thumbnails.roblox.com/v1/assets?assetIds=${ids.slice(0, 30).join(',')}&size=150x150&format=Png&isCircular=false`));
    if (!alive()) return;
    ((th && th.data) || []).forEach((d) => {
      if (!d.imageUrl) return;
      const t = el('button', 'ptile square');
      const im = el('img');
      im.src = d.imageUrl;
      im.alt = '';
      t.appendChild(im);
      t.title = 'Open in the catalog';
      t.onclick = () => window.api.openLink(`https://www.roblox.com/catalog/${d.targetId}`);
      secWear.body.appendChild(t);
    });
    if (secWear.body.children.length) secWear.show();
  })();

  // Friends
  (async () => {
    const r = await safe(J(`https://friends.roblox.com/v1/users/${u.id}/friends`));
    const list = ((r && r.data) || []).slice(0, 60);
    if (!list.length) return;
    const shots = await headshots(list.map((f) => f.id));
    if (!alive()) return;
    list.forEach((f) => {
      const t = el('button', 'ptile person');
      const im = el('img');
      if (shots.get(f.id)) im.src = shots.get(f.id);
      im.alt = '';
      t.append(im, el('span', null, f.displayName || f.name));
      t.title = '@' + f.name;
      t.onclick = () => showProfile({ id: f.id, name: f.name, displayName: f.displayName, shot: shots.get(f.id) });
      secFriends.body.appendChild(t);
    });
    secFriends.wrap.querySelector('h3').textContent = 'Friends (' + list.length + (r.data.length > 60 ? '+' : '') + ')';
    secFriends.show();
  })();

  // Games (favorites + created)
  const gameSection = async (sec, url) => {
    const r = await safe(J(url));
    const ids = ((r && r.data) || []).map((g) => g.id).filter(Boolean).slice(0, 12);
    if (!ids.length) return;
    const map = await hydrateUniverses(ids);
    await loadImages([...map.keys()]);
    if (!alive()) return;
    ids.map((id) => map.get(id)).filter(Boolean).forEach((g) => {
      const card = makeCard(g, false);
      card.addEventListener('click', () => closeProfile(), true); // the game page opens above everything
      sec.body.appendChild(card);
    });
    if (sec.body.children.length) sec.show();
  };
  gameSection(secFav, `https://games.roblox.com/v2/users/${u.id}/favorite/games?limit=12&sortOrder=Desc`);
  gameSection(secMade, `https://games.roblox.com/v2/users/${u.id}/games?accessFilter=Public&limit=12&sortOrder=Desc`);

  // Groups
  (async () => {
    const r = await safe(J(`https://groups.roblox.com/v2/users/${u.id}/groups/roles?includeLocked=false`));
    const list = ((r && r.data) || []).slice(0, 24);
    if (!list.length) return;
    const th = await safe(J(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${list.map((x) => x.group.id).join(',')}&size=150x150&format=Png&isCircular=false`));
    const icons = new Map(((th && th.data) || []).map((d) => [d.targetId, d.imageUrl]));
    if (!alive()) return;
    list.forEach((x) => {
      const t = el('button', 'ptile person');
      const im = el('img');
      if (icons.get(x.group.id)) im.src = icons.get(x.group.id);
      im.alt = '';
      t.append(im, el('span', null, x.group.name));
      t.title = (x.role && x.role.name) || '';
      t.onclick = () => window.api.openLink(`https://www.roblox.com/communities/${x.group.id}`);
      secGroups.body.appendChild(t);
    });
    secGroups.show();
  })();

  // Official Roblox badges
  (async () => {
    const r = await safe(J(`https://accountinformation.roblox.com/v1/users/${u.id}/roblox-badges`));
    const list = Array.isArray(r) ? r : [];
    if (!list.length || !alive()) return;
    list.forEach((b) => {
      const t = el('div', 'ptile person static');
      const im = el('img');
      if (b.imageUrl) im.src = b.imageUrl;
      im.alt = '';
      t.append(im, el('span', null, b.name));
      secBadges.body.appendChild(t);
    });
    secBadges.show();
  })();
}

// ---- Custom profile looks, shared through the profile server ----
const looks = {}; // userId -> { look, at }
async function fetchLooks(ids, force) {
  const need = [...new Set(ids.map(String))].filter((id) => force || !looks[id] || Date.now() - looks[id].at > 60000);
  if (!need.length) return { ok: true };
  const r = await window.api.lookGet(need);
  if (r.ok) need.forEach((id) => (looks[id] = { look: (r.profiles || {})[id] || null, at: Date.now() }));
  return r;
}
const lookOf = (id) => {
  if (String(id) === String(S.userId) && S.profileCustom && Object.keys(S.profileCustom).length) return S.profileCustom;
  return (looks[String(id)] && looks[String(id)].look) || null;
};
let lastLookError = '';
function lookDebug() {
  const mine = String(S.userId);
  return {
    myUserId: S.userId,
    myUsername: S.username,
    localLook: Object.keys(S.profileCustom || {}),
    bannerKB: S.profileCustom && S.profileCustom.banner ? Math.round(S.profileCustom.banner.length / 1024) : 0,
    serverHasMine: looks[mine] ? Object.keys(looks[mine].look || {}) : 'not checked',
    lastError: lastLookError,
  };
}
// If the server has lost our look (free hosts restart), upload it again
async function ensureMyLook() {
  if (!S.userId || !S.profileCustom || !Object.keys(S.profileCustom).length) return;
  const r = await fetchLooks([S.userId], true);
  if (r.ok && !looks[String(S.userId)].look) await window.api.groupSave();
}

// Downscale a picked image to a small banner (keeps the upload tiny)
// ---- Picture adjuster (like Discord): drag to move, slider/wheel to zoom ----
// Model: the picture covers the frame, then is zoomed by `zoom`; x/y (0..1) say which part is shown.
// The same numbers work as CSS (object-position + scale around that point), so GIFs and videos work too.
function applyAdjust(node, adj) {
  if (!node) return;
  const a = adj || {};
  const x = typeof a.x === 'number' ? a.x : 0.5;
  const y = typeof a.y === 'number' ? a.y : 0.5;
  const z = typeof a.zoom === 'number' && a.zoom > 1 ? a.zoom : 1;
  node.style.objectPosition = `${x * 100}% ${y * 100}%`;
  node.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  node.style.transform = z > 1 ? `scale(${z})` : '';
}

function openCropper({ url, kind, aspect, title, hint, initial }) {
  return new Promise((resolve) => {
    const state = { x: 0.5, y: 0.5, zoom: 1, ...(initial || {}) };
    const modal = el('div', 'cropmodal');
    const box = el('div', 'cropbox');
    box.appendChild(el('h3', null, title || 'Adjust picture'));
    box.appendChild(el('div', 'set-desc', hint || 'Drag the picture to move it. Use the slider or the mouse wheel to zoom.'));

    const view = el('div', 'cropview');
    const maxW = Math.min(640, window.innerWidth * 0.8);
    const maxH = window.innerHeight * 0.5;
    let W = maxW;
    let H = W / aspect;
    if (H > maxH) {
      H = maxH;
      W = H * aspect;
    }
    view.style.width = W + 'px';
    view.style.height = H + 'px';
    let node;
    if (kind === 'video') {
      node = document.createElement('video');
      node.src = url;
      node.autoplay = true;
      node.loop = true;
      node.muted = true;
      node.playsInline = true;
    } else {
      node = document.createElement('img');
      node.src = url;
      node.alt = '';
      node.draggable = false;
    }
    view.appendChild(node);
    box.appendChild(view);

    const row = el('div', 'croprow');
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.01';
    row.append(el('span', null, 'Zoom'), zoom);
    box.appendChild(row);

    const btns = el('div', 'cropbtns');
    const reset = el('button', 'pill', 'Reset');
    const cancel = el('button', 'pill', 'Cancel');
    const ok = el('button', 'pill primary', 'Apply');
    btns.append(reset, cancel, ok);
    box.appendChild(btns);
    modal.appendChild(box);
    document.body.appendChild(modal);

    const paint = () => {
      state.x = Math.min(1, Math.max(0, state.x));
      state.y = Math.min(1, Math.max(0, state.y));
      state.zoom = Math.min(3, Math.max(1, state.zoom));
      zoom.value = state.zoom;
      setRangeFill(zoom);
      applyAdjust(node, state);
    };
    paint();

    const natural = () => ({
      w: node.naturalWidth || node.videoWidth || W,
      h: node.naturalHeight || node.videoHeight || H,
    });
    // Dragging: moving the picture right shows more of its left side, so x goes down.
    let drag = null;
    view.addEventListener('pointerdown', (e) => {
      drag = { px: e.clientX, py: e.clientY, x: state.x, y: state.y };
      view.setPointerCapture(e.pointerId);
      view.classList.add('dragging');
    });
    view.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const n = natural();
      const s0 = Math.max(W / n.w, H / n.h);
      const dw = n.w * s0 * state.zoom;
      const dh = n.h * s0 * state.zoom;
      if (dw - W > 0.5) state.x = drag.x - (e.clientX - drag.px) / (dw - W);
      if (dh - H > 0.5) state.y = drag.y - (e.clientY - drag.py) / (dh - H);
      paint();
    });
    const end = () => {
      drag = null;
      view.classList.remove('dragging');
    };
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    view.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.zoom -= e.deltaY * 0.002;
      paint();
    }, { passive: false });
    zoom.addEventListener('input', () => {
      state.zoom = Number(zoom.value);
      paint();
    });

    const close = (val) => {
      document.removeEventListener('keydown', onKey, true);
      modal.remove();
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(null);
      } else if (e.key === 'Enter') close({ ...state });
    };
    document.addEventListener('keydown', onKey, true);
    reset.onclick = () => {
      state.x = 0.5;
      state.y = 0.5;
      state.zoom = 1;
      paint();
    };
    cancel.onclick = () => close(null);
    ok.onclick = () => close({ ...state });
  });
}

function pickImage({ aspect, w: outW, h: outH, title, max }) {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/png,image/jpeg,image/webp,image/gif';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return resolve(null);
      const fr = new FileReader();
      fr.onerror = () => resolve(null);
      fr.onload = () => {
      const url = fr.result; // a data: address, which the app's security rules allow
      const im = new Image();
      im.onload = async () => {
        const adj = await openCropper({ url, kind: 'image', aspect, title, initial: null });
        if (!adj) return resolve(false); // cancelled
        const W = outW, H = outH;
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const ctx = c.getContext('2d');
        const k = Math.max(W / im.width, H / im.height) * adj.zoom;
        const w = im.width * k, h = im.height * k;
        ctx.drawImage(im, -(w - W) * adj.x, -(h - H) * adj.y, w, h);
        let q = 0.82, out = c.toDataURL('image/jpeg', q);
        while (out.length > max && q > 0.3) {
          q -= 0.12;
          out = c.toDataURL('image/jpeg', q);
        }
        resolve(out);
      };
      im.onerror = () => resolve(null);
      im.src = url;
      };
      fr.readAsDataURL(f);
    };
    inp.click();
  });
}

async function showProfile(u) {
  const my = ++profileToken;
  closeFloat();
  const box = $('#profileBox');
  box.replaceChildren();

  const closeX = el('button', 'pclose', '✕');
  closeX.title = 'Close';
  closeX.onclick = closeProfile;

  const avatar = el('div', 'pavatar');
  const img = el('img');
  img.alt = '';
  if (u.shot) img.src = u.shot;
  avatar.appendChild(img);

  const info = el('div', 'pinfo2');
  const nameRow = el('div', 'pname');
  const nameText = el('span', null, u.displayName || u.name);
  let baseName = u.displayName || u.name;
  const pfpEl = el('img', 'ppfp');
  pfpEl.alt = '';
  pfpEl.hidden = true;
  const pfpHost = el('span', 'pfphost');
  pfpHost.hidden = true;
  pfpHost.appendChild(pfpEl);
  nameRow.append(pfpHost, nameText);
  info.appendChild(nameRow);
  ownerReady.then(() => {
    if (my === profileToken && !nameRow.querySelector('.ownerbadge')) withTag(nameRow, u.id);
  });
  info.appendChild(el('div', 'puser', '@' + u.name));
  const tagline = el('div', 'ptagline');
  tagline.hidden = true;
  info.appendChild(tagline);
  if (u.status) info.appendChild(el('div', 'pstatus', u.status));

  const stats = el('div', 'pstats');
  const mkStat = (label) => {
    const s = el('div', 'pstat');
    const v = el('b', null, '–');
    s.append(v, el('span', null, label));
    stats.appendChild(s);
    return v;
  };
  const vFriends = mkStat('Friends');
  const vFollowers = mkStat('Followers');
  const vFollowing = mkStat('Following');
  info.appendChild(stats);

  const joined = el('div', 'pjoined');
  info.appendChild(joined);
  info.appendChild(el('div', 'plabel', 'About'));
  const bio = el('div', 'pbio', 'Loading…');
  info.appendChild(bio);

  const actions = el('div', 'pactions');
  const web = el('button', 'pill', 'Open on roblox.com');
  web.onclick = () => window.api.openLink(`https://www.roblox.com/users/${u.id}/profile`);
  const done = el('button', 'pill primary', 'Close');
  done.onclick = closeProfile;
  const pres = presenceMap.get(u.id);
  if (pres && pres.userPresenceType === 2) {
    const pid = pres.rootPlaceId || pres.placeId;
    const join = el('button', 'gplay', 'Join');
    join.style.cssText = 'padding:8px 22px;font-size:14px;border-radius:10px';
    if (pid && pres.gameId) {
      join.onclick = async () => {
        try {
          await window.api.joinFriend(pid, pres.gameId);
          toast('Joining ' + (u.displayName || u.name) + '…');
        } catch {
          toast("Couldn't join. Is Roblox installed?");
        }
      };
    } else {
      join.disabled = true;
      join.style.opacity = '0.5';
      join.title = "This player's privacy settings don't allow joining";
      join.textContent = "Can't join";
    }
    actions.append(join);
  }
  actions.append(web, done);
  info.appendChild(actions);

  const top = el('div', 'ptop');
  top.append(avatar, info);
  const more = el('div', 'pmore');
  const banner = el('div', 'pbanner');
  banner.hidden = true;
  box.append(closeX, banner, top, more);
  box.scrollTop = 0;
  $('#profile').classList.add('open');
  const applyLook = () => {
    const c = lookOf(u.id) || {};
    banner.hidden = !c.banner;
    banner.style.backgroundImage = c.banner ? `url("${c.banner}")` : '';
    box.classList.toggle('has-banner', !!c.banner);
    box.classList.toggle('has-bg', !!c.bg);
    const fxs = c.fx || {};
    const picSrc = c.pfp || (fxs.pic ? u.shot || FX_PLACEHOLDER : '');
    pfpEl.hidden = !picSrc;
    pfpHost.hidden = !picSrc;
    if (picSrc) pfpEl.src = picSrc;
    nameText.textContent = c.nick || baseName;
    fxPic(pfpHost, fxs.pic);
    fxName(nameText, fxs.name);
    fxBanner(box, fxs.banner);
    fxBanner(box, fxs.bg, { slot: 'bg' });
    // custom profile background: the picture with a dark film on top so text stays readable
    box.style.backgroundImage = c.bg ? `linear-gradient(rgba(10, 12, 18, 0.55), rgba(10, 12, 18, 0.55)), url("${c.bg}")` : '';
    tagline.hidden = !c.tagline;
    tagline.textContent = c.tagline || '';
    if (c.accent) box.style.setProperty('--paccent', c.accent);
    else box.style.removeProperty('--paccent');
    ['ring', 'glow', 'round'].forEach((f) => avatar.classList.toggle('f-' + f, c.frame === f));
  };
  applyLook();
  fetchLooks([u.id]).then(() => {
    if (my === profileToken) applyLook();
  });
  loadProfileExtras(u, my, more, info);

  fullBodyUrl(u.id).then((url) => {
    if (url && my === profileToken) {
      img.src = url;
      avatar.classList.add('full');
    }
  });

  const [details, fr, fo, fg] = await Promise.allSettled([
    J(`https://users.roblox.com/v1/users/${u.id}`),
    J(`https://friends.roblox.com/v1/users/${u.id}/friends/count`),
    J(`https://friends.roblox.com/v1/users/${u.id}/followers/count`),
    J(`https://friends.roblox.com/v1/users/${u.id}/followings/count`),
  ]);
  if (my !== profileToken) return;

  const num = (r) => (r.status === 'fulfilled' && r.value && typeof r.value.count === 'number' ? fmtNum(r.value.count) : '–');
  vFriends.textContent = num(fr);
  vFollowers.textContent = num(fo);
  vFollowing.textContent = num(fg);

  if (details.status === 'fulfilled') {
    const d = details.value;
    if (d.displayName) {
      baseName = d.displayName;
      nameText.textContent = (lookOf(u.id) || {}).nick || baseName;
      fxName(nameText, ((lookOf(u.id) || {}).fx || {}).name);
    }
    if (d.hasVerifiedBadge) nameRow.appendChild(el('span', 'pverified', '✔'));
    if (d.created) {
      joined.textContent = 'Joined ' + new Date(d.created).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    bio.textContent = (d.description || '').trim() || 'No description.';
  } else {
    bio.textContent = "Couldn't load this profile.";
  }
}

// Play buttons use your profile color
function applyPlayColor() {
  const c = (S && ((S.profileCustom && S.profileCustom.accent) || S.accent)) || '#00a2ff';
  const root = document.documentElement.style;
  root.setProperty('--play', c);
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  let txt = '#fff';
  if (m) {
    const n = parseInt(m[1], 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    if (lum > 0.62) txt = '#000';
  }
  root.setProperty('--playtext', txt);
}

(async function main() {
  S = await window.api.getSettings();
  applyAnimPrefs();
  applyLayout();
  applyUiFont();
  const intro = startIntro();
  document.documentElement.style.setProperty('--accent', S.accent);
  applyPlayColor();
  try {
    const a = await window.api.authMe(); // restores a previous login, if any
    if (a && a.settings) S = a.settings;
  } catch (e) {
    console.warn('authMe failed', e);
  }
  applyPlayColor();
  applyAnimPrefs();
  applyLayout();
  media = await window.api.scanMedia();
  await refreshAccounts();
  if (await enforceBan()) intro.dismiss();
  loadGrants();
  setTimeout(newsPrefetch, 4000);

  initTitlebar();
  initSidebar();
  initMini();
  renderTabs();
  (function setupContinueScroll() {
    const row = $('#continueRow');
    const by = (dir) => row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: 'smooth' });
    $('#contPrev').onclick = () => by(-1);
    $('#contNext').onclick = () => by(1);
    let down = false, moved = false, startX = 0, startLeft = 0;
    row.addEventListener('mousedown', (e) => { down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft; });
    window.addEventListener('mousemove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; row.classList.add('dragging'); }
      if (moved) row.scrollLeft = startLeft - dx;
    });
    window.addEventListener('mouseup', () => { down = false; row.classList.remove('dragging'); });
    row.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  })();
  bg.init();
  player.init(media.music);
  window.addEventListener('focus', () => {
    if (view === 'settings') syncBackgrounds(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFloat();
      closeProfile();
      closeGame();
    }
  });

  let friendsP;
  if (!S.userId) {
    intro.dismiss(); // the login prompt must not hide behind the blur
    await welcome();
    if (!S.userId) friendsP = loadFriends(); // skipped: still show the "Add Friends" tile + hint
  } else {
    loadProfile();
    friendsP = loadFriends();
  }
  ensureMyLook();
  refreshNotifications();
  setInterval(() => {
    if (S.loggedIn) {
      loadPresence();
      refreshNotifications();
    }
    enforceBan();
  }, 60000);
  const gamesP = (async () => {
    await refreshRecommended();
    await refreshContinue();
  })();
  await intro.finish(Promise.all([friendsP, gamesP]));
})();
