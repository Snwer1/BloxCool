const { app, BrowserWindow, ipcMain, shell, net, Menu, dialog, session, safeStorage } = require('electron');
const crypto = require('crypto');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// The app is now called BloxCool, but keep using the old data folder so your settings, logins and accounts stay.
app.setPath('userData', path.join(app.getPath('appData'), 'bloxhome'));
app.setName('BloxCool');

// ---------------------------------------------------------------------------
// Settings (saved in your user-data folder, edited through the app)
// ---------------------------------------------------------------------------
const DEFAULTS = {
  username: '',
  userId: 0,
  displayName: '',
  loggedIn: false,
  spotifyClientId: '',
  spotifyConnected: false,
  lockSeen: {}, // look-lock notices the player already read: { userId: lockedAt }
  showCustomImages: true, // false = hide other people's custom pictures (banners, backgrounds, profile pictures)
  musicOff: false, // true = no music player at all
  musicSource: 'pc', // 'pc' = Windows media session (free) | 'spotify' = Spotify Web API (Premium)
  overlayOpacity: 0.45,
  accent: '#00a2ff',
  backgroundIndex: 0,
  backgroundName: '',
  backgroundCycleSeconds: 0,
  overlayOn: true,
  volume: 0.5,
  recent: [],
  pinned: [],
  fontName: '', // custom in-game font (file copied into userData/font)
  fontEnabled: false,
  fontLabel: '',
  uiFontName: '', // BloxCool's own font
  uiFontLabel: '',
  groupToken: '',
  animOff: {}, // animations the user turned off: { key: true }
  profileCustom: {}, // banner, accent, tagline, frame
  accountPrefs: {}, // each account's own app look: background, auto-change, darkness
  profileLooks: {}, // each account's own custom look: { userId: look }
  newsSeen: {}, // group shouts already seen: { groupId: updatedAt }
  layout: {}, // home page arrangement: { slots, page, hide, parts }
  bgAdjust: {}, // per-background position/zoom: { fileName: { x, y, zoom } }
};
let settings = { ...DEFAULTS };

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
  } catch {
    settings = { ...DEFAULTS };
  }
}
function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Could not save settings', e);
  }
}

// ---------------------------------------------------------------------------
// Media folders: drop files in and they show up in the app
// ---------------------------------------------------------------------------
const AUDIO_EXT = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.flac']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const VIDEO_EXT = new Set(['.mp4', '.webm']);

const mediaDir = (kind) => path.join(app.getPath('userData'), kind === 'music' ? 'music' : 'backgrounds');

function ensureDirs() {
  for (const k of ['music', 'backgrounds']) fs.mkdirSync(mediaDir(k), { recursive: true });
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

function scanMedia() {
  const musicDir = mediaDir('music');
  const musicFiles = listDir(musicDir);
  const music = musicFiles
    .filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const base = path.parse(f).name;
      let artist = 'Unknown artist';
      let title = base;
      const parts = base.split(' - ');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
      const coverFile = musicFiles.find(
        (c) => path.parse(c).name === base && IMAGE_EXT.has(path.extname(c).toLowerCase())
      );
      return {
        title,
        artist,
        src: pathToFileURL(path.join(musicDir, f)).href,
        cover: coverFile ? pathToFileURL(path.join(musicDir, coverFile)).href : null,
      };
    });

  const bgDir = mediaDir('backgrounds');
  const backgrounds = listDir(bgDir)
    .filter((f) => {
      const e = path.extname(f).toLowerCase();
      return IMAGE_EXT.has(e) || VIDEO_EXT.has(e);
    })
    .map((f) => ({
      name: f,
      url: pathToFileURL(path.join(bgDir, f)).href,
      type: VIDEO_EXT.has(path.extname(f).toLowerCase()) ? 'video' : 'image',
    }));

  return { music, backgrounds };
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------
function isRobloxHost(u) {
  return u.protocol === 'https:' && (u.hostname === 'roblox.com' || u.hostname.endsWith('.roblox.com'));
}

// ---------------------------------------------------------------------------
// Roblox login (separate, persistent browser session).
// You type your password on Roblox's own page. The cookie stays inside this
// process: the app UI never receives it, it only gets the results of API calls.
// ---------------------------------------------------------------------------
const AUTH_PARTITION = 'persist:roblox';
let authSes = null;
let csrfToken = '';

function authSession() {
  if (!authSes) {
    authSes = session.fromPartition(AUTH_PARTITION);
    // Look like a normal Chrome so Roblox's login + captcha work.
    authSes.setUserAgent(authSes.getUserAgent().replace(/\s*Electron\/\S+/, '').replace(/\s*bloxhome\/\S+/i, ''));
  }
  return authSes;
}

function isRobloxUrl(s) {
  try {
    return isRobloxHost(new URL(s));
  } catch {
    return false;
  }
}

async function authFetch(url, opts = {}) {
  if (!isRobloxUrl(url)) throw new Error('Blocked host');
  const ses = authSession();
  const method = opts.method === 'POST' ? 'POST' : 'GET';
  const headers = { Accept: 'application/json', 'Accept-Language': 'en-US,en;q=0.9' };
  let body;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body || {});
  }
  const send = () => {
    if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;
    return ses.fetch(url, { method, headers, body, credentials: 'include' });
  };
  let res = await send();
  if (res.status === 403 && res.headers.get('x-csrf-token')) {
    csrfToken = res.headers.get('x-csrf-token');
    res = await send();
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}


// ---------------------------------------------------------------------------
// Direct Roblox launch (no Bloxstrap / roblox:// handler involved)
// ---------------------------------------------------------------------------
let lastLaunchError = '';
let ticketReferer = '';
let ticketHooked = false;

function findRobloxPlayer() {
  const roots = [];
  const local = process.env.LOCALAPPDATA;
  if (local) {
    // Roblox itself plus any launcher (Bloxstrap, Fishstrap, Voidstrap...) that keeps a Versions folder
    roots.push(path.join(local, 'Roblox', 'Versions'));
    try {
      for (const d of fs.readdirSync(local)) roots.push(path.join(local, d, 'Versions'));
    } catch { /* ignore */ }
  }
  for (const pf of [process.env['ProgramFiles(x86)'], process.env.ProgramFiles]) {
    if (pf) roots.push(path.join(pf, 'Roblox', 'Versions'));
  }
  let best = null;
  for (const root of roots) {
    let dirs = [];
    try { dirs = fs.readdirSync(root); } catch { continue; }
    for (const d of dirs) {
      const exe = path.join(root, d, 'RobloxPlayerBeta.exe');
      try {
        const t = fs.statSync(exe).mtimeMs;
        if (!best || t > best.t) best = { exe, t };
      } catch { /* not a player folder */ }
    }
  }
  return best && best.exe;
}

// Asks Roblox for a one-time authentication ticket using the saved login.
function getAuthTicket(placeId) {
  return new Promise((resolve, reject) => {
    const ses = authSession();
    ticketReferer = `https://www.roblox.com/games/${placeId}`;
    if (!ticketHooked) {
      ticketHooked = true;
      // Electron refuses to let us set Referer/Origin on the request itself; the session hook may.
      ses.webRequest.onBeforeSendHeaders({ urls: ['https://auth.roblox.com/v1/authentication-ticket*'] }, (details, cb) => {
        const h = details.requestHeaders;
        h['Referer'] = ticketReferer;
        delete h['Origin'];
        h['RBX-For-Gameauth'] = 'true';
        cb({ requestHeaders: h });
      });
    }
    const attempt = (retry) => {
      const req = net.request({ method: 'POST', url: 'https://auth.roblox.com/v1/authentication-ticket', session: ses, useSessionCookies: true });
      req.setHeader('Content-Type', 'application/json');
      if (csrfToken) req.setHeader('X-CSRF-TOKEN', csrfToken);
      req.on('response', (res) => {
        let bodyText = '';
        res.on('data', (c) => { if (bodyText.length < 300) bodyText += c.toString(); });
        res.on('end', () => {
          const h = (n) => { const v = res.headers[n]; return Array.isArray(v) ? v[0] : v; };
          if (res.statusCode === 403 && h('x-csrf-token') && retry) {
            csrfToken = h('x-csrf-token');
            return attempt(false);
          }
          const ticket = h('rbx-authentication-ticket');
          if (ticket) return resolve(ticket);
          reject(new Error('No ticket (HTTP ' + res.statusCode + ') ' + bodyText.replace(/\s+/g, ' ').slice(0, 200)));
        });
      });
      req.on('error', reject);
      req.write('{}');
      req.end();
    };
    attempt(true);
  });
}

// Same request the Roblox website makes, but sent from inside a hidden roblox.com page, so the browser
// itself supplies a valid Referer/Origin (Roblox answers 403 "UrlReferrer was invalid" otherwise).
async function getAuthTicketViaPage(placeId) {
  const ref = `https://www.roblox.com/games/${placeId}`;
  const win = new BrowserWindow({
    show: false, width: 800, height: 600, skipTaskbar: true,
    webPreferences: { partition: AUTH_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!isRobloxUrl(url)) e.preventDefault(); });
  let timer;
  try {
    await Promise.race([
      new Promise((resolve, reject) => {
        win.webContents.once('dom-ready', resolve);
        win.webContents.once('did-fail-load', (_e, _c, desc) => reject(new Error('page failed to load: ' + desc)));
        win.loadURL(ref).catch(reject);
      }),
      new Promise((_r, reject) => { timer = setTimeout(() => reject(new Error('roblox.com page timed out')), 15000); }),
    ]);
    const js = `(async () => {
      const post = async (csrf, gameauth) => {
        const headers = { 'Content-Type': 'application/json' };
        if (gameauth) headers['RBX-For-Gameauth'] = 'true';
        if (csrf) headers['X-CSRF-TOKEN'] = csrf;
        const r = await fetch('https://auth.roblox.com/v1/authentication-ticket', { method: 'POST', credentials: 'include', referrer: ${JSON.stringify(ref)}, headers, body: '{}' });
        const text = await r.text().catch(() => '');
        return { status: r.status, ticket: r.headers.get('rbx-authentication-ticket'), csrf: r.headers.get('x-csrf-token'), body: text.slice(0, 160) };
      };
      const run = async (gameauth) => {
        let r = await post(${JSON.stringify(csrfToken || '')}, gameauth);
        if (!r.ticket && r.status === 403 && r.csrf) r = await post(r.csrf, gameauth);
        return r;
      };
      try { return await run(true); } catch (e) { try { return await run(false); } catch (e2) { return { status: 0, error: String(e2 && e2.message || e2) }; } }
    })()`;
    const r = await win.webContents.executeJavaScript(js, true);
    if (r && r.csrf) csrfToken = r.csrf;
    if (r && r.ticket) return r.ticket;
    throw new Error('No ticket via page (HTTP ' + (r && r.status) + ') ' + String((r && (r.error || r.body)) || '').replace(/\s+/g, ' ').slice(0, 160));
  } finally {
    clearTimeout(timer);
    if (!win.isDestroyed()) win.destroy();
  }
}

async function launchDirect(placeId) {
  if (process.platform !== 'win32') throw new Error('Direct launch is Windows only');
  const exe = findRobloxPlayer();
  if (!exe) throw new Error('Roblox player not found');
  if (settings.fontEnabled) {
    try { applyFont(path.dirname(exe)); } catch (e) { console.warn('font apply failed', e.message); }
  }
  let ticket;
  try {
    ticket = await getAuthTicketViaPage(placeId);
  } catch (e1) {
    try { ticket = await getAuthTicket(placeId); }
    catch (e2) { throw new Error(String(e1.message || e1) + ' | ' + String(e2.message || e2)); }
  }
  const tracker = String(Math.floor(Math.random() * 1e11) + 1e11);
  const launcher =
    'https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=RequestGame' +
    `&browserTrackerId=${tracker}&placeId=${placeId}&isPlayTogetherGame=false`;
  const arg =
    `roblox-player:1+launchmode:play+gameinfo:${ticket}+launchtime:${Date.now()}` +
    `+placelauncherurl:${encodeURIComponent(launcher)}+browsertrackerid:${tracker}` +
    '+robloxLocale:en_us+gameLocale:en_us+channel:+LaunchExp:InApp';
  const child = spawn(exe, [arg], { detached: true, stdio: 'ignore' });
  child.on('error', (e) => { lastLaunchError = String(e.message || e); });
  child.unref();
}


// ---------------------------------------------------------------------------
// Custom in-game font (same trick Bloxstrap uses: swap the font files Roblox reads)
// ---------------------------------------------------------------------------
const fontStore = () => path.join(app.getPath('userData'), 'font');

function playerVersionDir() {
  const exe = findRobloxPlayer();
  return exe ? path.dirname(exe) : null;
}

function familiesDir(versionDir) {
  return path.join(versionDir, 'content', 'fonts', 'families');
}

function eachFamily(versionDir, fn) {
  const dir = familiesDir(versionDir);
  for (const f of fs.readdirSync(dir)) {
    if (f.toLowerCase().endsWith('.json')) fn(path.join(dir, f));
  }
}

// Points every Roblox font family at our font. Originals are saved as *.bloxhome-bak so they can be restored.
function applyFont(versionDir) {
  const src = settings.fontName && path.join(fontStore(), settings.fontName);
  if (!src || !fs.existsSync(src)) throw new Error('No font chosen');
  const fontsDir = path.join(versionDir, 'content', 'fonts');
  const target = path.join(fontsDir, 'BloxHomeCustom' + path.extname(src).toLowerCase());
  fs.copyFileSync(src, target);
  const rbx = 'rbxasset://fonts/' + path.basename(target);
  eachFamily(versionDir, (file) => {
    const bak = file + '.bloxhome-bak';
    if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
    const json = JSON.parse(fs.readFileSync(bak, 'utf8'));
    for (const face of json.faces || []) face.assetId = rbx;
    fs.writeFileSync(file, JSON.stringify(json, null, 2));
  });
}

function removeFont(versionDir) {
  const fontsDir = path.join(versionDir, 'content', 'fonts');
  try {
    eachFamily(versionDir, (file) => {
      const bak = file + '.bloxhome-bak';
      if (fs.existsSync(bak)) {
        fs.copyFileSync(bak, file);
        fs.unlinkSync(bak);
      }
    });
  } catch { /* ignore */ }
  for (const f of fs.readdirSync(fontsDir)) {
    if (f.startsWith('BloxHomeCustom')) {
      try { fs.unlinkSync(path.join(fontsDir, f)); } catch { /* ignore */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Several Roblox accounts. Cookies are stored encrypted (Windows DPAPI via safeStorage) in
// accounts.bin and never leave the main process; the UI only sees names and ids.
// ---------------------------------------------------------------------------
const accountsFile = () => path.join(app.getPath('userData'), 'accounts.bin');
let accountsCache = null;

function loadAccounts() {
  if (accountsCache) return accountsCache;
  try {
    const buf = fs.readFileSync(accountsFile());
    const tag = String.fromCharCode(buf[0]);
    const body = buf.subarray(1);
    const parsed = JSON.parse(tag === 'E' ? safeStorage.decryptString(body) : body.toString('utf8'));
    accountsCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    accountsCache = [];
  }
  return accountsCache;
}
function saveAccounts() {
  try {
    const json = JSON.stringify(accountsCache || []);
    const enc = safeStorage.isEncryptionAvailable();
    const data = enc ? safeStorage.encryptString(json) : Buffer.from(json, 'utf8');
    fs.writeFileSync(accountsFile(), Buffer.concat([Buffer.from(enc ? 'E' : 'P'), data]));
  } catch (e) {
    console.error('Could not save accounts', e);
  }
}
async function currentCookie() {
  try {
    const list = await authSession().cookies.get({ name: '.ROBLOSECURITY' });
    const c = list.find((x) => /roblox\.com$/i.test(x.domain || '')) || list[0];
    return c ? c.value : '';
  } catch {
    return '';
  }
}
// Remember the logged-in account (its cookie) so it can be switched to later.
async function rememberAccount(me) {
  if (!me || !me.id) return;
  const cookie = await currentCookie();
  if (!cookie) return;
  const list = loadAccounts();
  const rec = { userId: me.id, username: me.name, displayName: me.displayName || me.name, cookie };
  const i = list.findIndex((a) => a.userId === me.id);
  if (i >= 0) list[i] = rec;
  else list.push(rec);
  saveAccounts();
}
// Make `me` the active account: keep each account's own profile look separate.
const PREF_KEYS = ['backgroundName', 'backgroundIndex', 'backgroundCycleSeconds', 'overlayOpacity', 'overlayOn'];
function adoptAccount(me) {
  if (settings.userId && settings.userId !== me.id) {
    // every account remembers its own background; one that has none yet starts from the current one
    const mine = {};
    PREF_KEYS.forEach((k) => (mine[k] = settings[k]));
    const prefs = { ...(settings.accountPrefs || {}), [settings.userId]: mine };
    const theirs = prefs[me.id];
    if (theirs) PREF_KEYS.forEach((k) => theirs[k] !== undefined && (settings[k] = theirs[k]));
    settings.accountPrefs = prefs;
    settings.profileLooks = { ...(settings.profileLooks || {}), [settings.userId]: settings.profileCustom || {} };
    settings.profileCustom = (settings.profileLooks || {})[me.id] || {};
  }
  settings.loggedIn = true;
  settings.userId = me.id;
  settings.username = me.name;
  settings.displayName = me.displayName || me.name;
  saveSettings();
}
async function setRobloxCookie(value) {
  await authSession().cookies.set({
    url: 'https://www.roblox.com',
    name: '.ROBLOSECURITY',
    value,
    domain: '.roblox.com',
    path: '/',
    secure: true,
    httpOnly: true,
    expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  });
  csrfToken = '';
}

let loginWin = null;
function openLogin(parent) {
  return new Promise((resolve) => {
    if (loginWin && !loginWin.isDestroyed()) {
      loginWin.focus();
      return resolve(null);
    }
    let done = false;
    let timer = null;
    loginWin = new BrowserWindow({
      width: 520,
      height: 780,
      parent: parent || undefined,
      title: 'Log in to Roblox',
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      webPreferences: { partition: AUTH_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    const wc = loginWin.webContents;
    wc.on('will-navigate', (e, url) => {
      if (!isRobloxUrl(url)) e.preventDefault();
    });
    wc.setWindowOpenHandler(({ url }) => {
      if (isRobloxUrl(url)) loginWin && loginWin.loadURL(url);
      return { action: 'deny' };
    });
    loginWin.loadURL('https://www.roblox.com/login');

    const check = async () => {
      if (done) return;
      try {
        const me = await authFetch('https://users.roblox.com/v1/users/authenticated');
        if (me && me.id) {
          done = true;
          clearInterval(timer);
          if (loginWin && !loginWin.isDestroyed()) loginWin.close();
          resolve(me);
        }
      } catch {
        /* not logged in yet */
      }
    };
    timer = setInterval(check, 1500);
    loginWin.on('closed', () => {
      clearInterval(timer);
      loginWin = null;
      if (!done) resolve(null);
    });
  });
}

// Opens a Roblox page (e.g. the avatar editor) in a window that shares the login.
function openRobloxWindow(url) {
  return new Promise((resolve) => {
    if (!isRobloxUrl(url)) return resolve(false);
    const w = new BrowserWindow({
      width: 1100,
      height: 800,
      title: 'Roblox',
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      webPreferences: { partition: AUTH_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    w.webContents.on('will-navigate', (e, u) => {
      if (!isRobloxUrl(u)) e.preventDefault();
    });
    w.webContents.setWindowOpenHandler(({ url: u }) => {
      if (isRobloxUrl(u)) w.loadURL(u);
      return { action: 'deny' };
    });
    w.loadURL(url);
    w.on('closed', () => resolve(true));
  });
}

// ---------------------------------------------------------------------------
// Spotify: remote control through the Spotify Web API (PKCE login, no client secret).
// Tokens live only in this process and are saved encrypted when the OS supports it.
// ---------------------------------------------------------------------------
const SPOTIFY_REDIRECT = 'http://127.0.0.1:8888/callback';
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
let spotifyTokens = null; // { access, refresh, expires }
const spotifyFile = () => path.join(app.getPath('userData'), 'spotify.bin');

function saveSpotifyTokens(t) {
  spotifyTokens = t;
  try {
    const json = JSON.stringify(t);
    const enc = safeStorage.isEncryptionAvailable();
    const data = enc ? safeStorage.encryptString(json) : Buffer.from(json, 'utf8');
    fs.writeFileSync(spotifyFile(), Buffer.concat([Buffer.from(enc ? 'E' : 'P'), data]));
  } catch (e) {
    console.error('Could not save Spotify tokens', e);
  }
}

function loadSpotifyTokens() {
  try {
    const buf = fs.readFileSync(spotifyFile());
    const tag = String.fromCharCode(buf[0]);
    const body = buf.subarray(1);
    spotifyTokens = JSON.parse(tag === 'E' ? safeStorage.decryptString(body) : body.toString('utf8'));
  } catch {
    spotifyTokens = null;
  }
  if (!spotifyTokens && settings.spotifyConnected) {
    settings.spotifyConnected = false;
    saveSettings();
  }
}

function clearSpotify() {
  spotifyTokens = null;
  try {
    fs.unlinkSync(spotifyFile());
  } catch {
    /* already gone */
  }
  settings.spotifyConnected = false;
  saveSettings();
}

async function spotifyTokenRequest(params) {
  const r = await net.fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  if (!r.ok) {
    const err = new Error('HTTP ' + r.status);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

async function spotifyAccessToken() {
  if (!spotifyTokens) return null;
  if (Date.now() < spotifyTokens.expires) return spotifyTokens.access;
  try {
    const j = await spotifyTokenRequest({
      grant_type: 'refresh_token',
      refresh_token: spotifyTokens.refresh,
      client_id: settings.spotifyClientId,
    });
    saveSpotifyTokens({
      access: j.access_token,
      refresh: j.refresh_token || spotifyTokens.refresh,
      expires: Date.now() + (j.expires_in - 30) * 1000,
    });
    return spotifyTokens.access;
  } catch (e) {
    if (e.status === 400 || e.status === 401) clearSpotify(); // access was revoked
    return null;
  }
}

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const msgPage = (msg) =>
  `<!doctype html><meta charset="utf-8"><title>BloxCool</title><body style="font-family:Segoe UI,sans-serif;background:#0b0d12;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>${msg}</h2></body>`;

function spotifyConnect(clientId) {
  return new Promise((resolve) => {
    const verifier = b64url(crypto.randomBytes(64));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(16));
    let finished = false;
    let timer = null;
    let server = null;

    const done = (ok, error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        server.close();
      } catch {
        /* not listening */
      }
      resolve({ ok, error });
    };

    server = http.createServer(async (req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1:8888');
      if (u.pathname !== '/callback') {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const code = u.searchParams.get('code');
      if (u.searchParams.get('error') || !code || u.searchParams.get('state') !== state) {
        res.end(msgPage('Could not connect. You can close this tab and try again.'));
        return done(false, 'denied');
      }
      try {
        const j = await spotifyTokenRequest({
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_REDIRECT,
          code_verifier: verifier,
        });
        saveSpotifyTokens({
          access: j.access_token,
          refresh: j.refresh_token,
          expires: Date.now() + (j.expires_in - 30) * 1000,
        });
        res.end(msgPage('Spotify connected! You can close this tab and go back to BloxCool.'));
        done(true);
      } catch (e) {
        console.error('Spotify token exchange failed', e);
        res.end(msgPage('Could not connect. You can close this tab and try again.'));
        done(false, 'token');
      }
    });
    server.on('error', () => done(false, 'port'));
    server.listen(8888, '127.0.0.1', () => {
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: SPOTIFY_REDIRECT,
        scope: SPOTIFY_SCOPES,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        state,
      });
      shell.openExternal('https://accounts.spotify.com/authorize?' + params.toString());
    });
    timer = setTimeout(() => done(false, 'timeout'), 3 * 60 * 1000);
  });
}

// ---------------------------------------------------------------------------
// Windows media session helper (works with free Spotify): a long-running PowerShell process that
// reads/controls what Windows is playing. One command in, one JSON line out, strictly in order.
// ---------------------------------------------------------------------------
let mediaProc = null;
let mediaQueue = [];
let mediaBuf = '';
let mediaErr = '';

function mediaScriptPath() {
  return path.join(__dirname, 'media-helper.ps1').replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
}

function failMedia(reason, detail) {
  const q = mediaQueue;
  mediaQueue = [];
  mediaProc = null;
  q.forEach((entry) => entry.resolve({ ok: false, error: reason, detail: detail || '' }));
}

function startMedia() {
  if (process.platform !== 'win32') return false;
  if (mediaProc) return true;
  try {
    mediaProc = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', mediaScriptPath()],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch {
    mediaProc = null;
    return false;
  }
  const proc = mediaProc;
  mediaBuf = '';
  mediaErr = '';
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk) => {
    mediaBuf += chunk;
    let idx;
    while ((idx = mediaBuf.indexOf('\n')) >= 0) {
      const line = mediaBuf.slice(0, idx).trim();
      mediaBuf = mediaBuf.slice(idx + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.ready) continue;
      if (msg.fatal) {
        failMedia('spawn', String(msg.fatal));
        continue;
      }
      const next = mediaQueue.shift();
      if (next) next.resolve(msg);
    }
  });
  proc.stderr.on('data', (d) => {
    mediaErr = (mediaErr + d.toString()).slice(-400);
  });
  proc.on('error', (err) => {
    if (mediaProc === proc) failMedia('spawn', err && err.message);
  });
  proc.on('exit', () => {
    if (mediaProc === proc) failMedia('exit', mediaErr.trim());
  });
  return true;
}

function mediaCommand(cmd) {
  return new Promise((resolve) => {
    if (!startMedia() || !mediaProc) return resolve({ ok: false, error: 'unsupported' });
    const entry = {
      resolve: (m) => {
        clearTimeout(entry.timer);
        resolve(m);
      },
    };
    entry.timer = setTimeout(() => {
      try {
        if (mediaProc) mediaProc.kill();
      } catch {
        /* already gone */
      }
      failMedia('timeout');
    }, 25000);
    mediaQueue.push(entry);
    try {
      mediaProc.stdin.write(cmd + '\n');
    } catch {
      failMedia('exit');
    }
  });
}

function registerIpc() {
  ipcMain.handle('settings:get', () => settings);

  ipcMain.handle('settings:set', (_e, patch) => {
    if (patch && typeof patch === 'object') {
      for (const key of Object.keys(DEFAULTS)) {
        if (key in patch) settings[key] = patch[key];
      }
      saveSettings();
    }
    return settings;
  });

  ipcMain.handle('font:choose', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const res = await dialog.showOpenDialog(win, {
      title: 'Choose a font',
      properties: ['openFile'],
      filters: [{ name: 'Fonts', extensions: ['ttf', 'otf'] }],
    });
    if (res.canceled || !res.filePaths.length) return { canceled: true, settings };
    const src = res.filePaths[0];
    const ext = path.extname(src).toLowerCase();
    if (ext !== '.ttf' && ext !== '.otf') return { canceled: true, settings };
    fs.mkdirSync(fontStore(), { recursive: true });
    for (const f of fs.readdirSync(fontStore())) fs.unlinkSync(path.join(fontStore(), f));
    const name = 'custom' + ext;
    fs.copyFileSync(src, path.join(fontStore(), name));
    settings.fontName = name;
    settings.fontLabel = path.basename(src);
    settings.fontEnabled = true;
    saveSettings();
    let applied = false;
    let error = '';
    const dir = playerVersionDir();
    if (dir) {
      try { applyFont(dir); applied = true; } catch (err) { error = err.message; }
    } else error = 'Roblox player not found';
    return { canceled: false, applied, error, settings };
  });

  ipcMain.handle('font:remove', () => {
    settings.fontEnabled = false;
    settings.fontName = '';
    settings.fontLabel = '';
    saveSettings();
    const dir = playerVersionDir();
    let error = '';
    if (dir) {
      try { removeFont(dir); } catch (err) { error = err.message; }
    }
    return { error, settings };
  });

  const uiFontDir = () => path.join(app.getPath('userData'), 'uifont');
  ipcMain.handle('uifont:url', () => {
    if (!settings.uiFontName) return '';
    const f = path.join(uiFontDir(), settings.uiFontName);
    try {
      return pathToFileURL(f).href + '?v=' + fs.statSync(f).mtimeMs;
    } catch {
      return '';
    }
  });
  ipcMain.handle('uifont:choose', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const res = await dialog.showOpenDialog(win, {
      title: 'Choose a font for BloxCool',
      properties: ['openFile'],
      filters: [{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }],
    });
    if (res.canceled || !res.filePaths.length) return { canceled: true, settings };
    const src = res.filePaths[0];
    const ext = path.extname(src).toLowerCase();
    if (!['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) return { canceled: true, settings };
    fs.mkdirSync(uiFontDir(), { recursive: true });
    for (const f of fs.readdirSync(uiFontDir())) fs.unlinkSync(path.join(uiFontDir(), f));
    const name = 'ui' + ext;
    fs.copyFileSync(src, path.join(uiFontDir(), name));
    settings.uiFontName = name;
    settings.uiFontLabel = path.basename(src);
    saveSettings();
    return { canceled: false, settings };
  });
  ipcMain.handle('uifont:remove', () => {
    try {
      for (const f of fs.readdirSync(uiFontDir())) fs.unlinkSync(path.join(uiFontDir(), f));
    } catch { /* none */ }
    settings.uiFontName = '';
    settings.uiFontLabel = '';
    saveSettings();
    return { settings };
  });

  // ---- Profile server (everyone's custom looks) ----
  function serverBase() {
    let url = '';
    try {
      url = String(JSON.parse(fs.readFileSync(path.join(__dirname, 'bloxhome.config.json'), 'utf8')).serverUrl || '');
    } catch { /* no config */ }
    url = url.trim().replace(/\/+$/, '');
    if (!/^https:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.)/i.test(url)) return '';
    return url;
  }
  async function groupFetch(method, route, body) {
    const base = serverBase();
    if (!base) throw new Error('No server set in bloxhome.config.json');
    if (!settings.groupToken) {
      settings.groupToken = crypto.randomBytes(16).toString('hex');
      saveSettings();
    }
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 45000); // free hosts can take a while to wake up
    try {
      const r = await net.fetch(base + route, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-token': settings.groupToken, ...(typeof extraSaveHeaders === 'function' ? extraSaveHeaders(method) : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      });
      let j = {};
      try { j = await r.json(); } catch { /* not json */ }
      if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
      return j;
    } finally {
      clearTimeout(timer);
    }
  }
  // Name tags (badges) shown next to certain accounts: defined in bloxhome.config.json
  const cleanTags = (arr) =>
    (Array.isArray(arr) ? arr : []).slice(0, 40).map((t) => ({
      username: String((t && t.username) || '').slice(0, 40),
      userId: Number(t && t.userId) || 0,
      label: String((t && t.label) || '').slice(0, 24),
      icon: t && /^[a-z]{2,20}$/.test(String(t.icon)) ? String(t.icon) : 'crown',
    }));
  // Tags come from the server (so you can add one without anyone updating), plus the local config as a fallback.
  ipcMain.handle('config:tags', async () => {
    const cacheFile = path.join(app.getPath('userData'), 'tags-cache.json');
    let local = [];
    try {
      local = JSON.parse(fs.readFileSync(path.join(__dirname, 'bloxhome.config.json'), 'utf8')).tags || [];
    } catch { /* none */ }
    let remote = null;
    try {
      const j = await groupFetch('GET', '/tags');
      if (Array.isArray(j.tags)) {
        remote = j.tags;
        try { fs.writeFileSync(cacheFile, JSON.stringify(remote)); } catch { /* ignore */ }
      }
    } catch {
      try { remote = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch { /* none */ }
    }
    const all = cleanTags(remote || []).concat(cleanTags(local));
    const seen = new Set();
    return all.filter((t) => {
      const k = (t.userId || t.username.toLowerCase()) + '';
      if (!t.label || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });
  // Which exclusive effects each player was given (effect ids only)
  ipcMain.handle('config:grants', async () => {
    try {
      const j = await groupFetch('GET', '/grants');
      return j.grants && typeof j.grants === 'object' ? j.grants : {};
    } catch {
      return {};
    }
  });
  // Extra effects come from the server's effects.json (cached for when the server is asleep)
  ipcMain.handle('config:effects', async () => {
    const cacheFile = path.join(app.getPath('userData'), 'effects-cache.json');
    try {
      const j = await groupFetch('GET', '/effects');
      if (Array.isArray(j.effects)) {
        try { fs.writeFileSync(cacheFile, JSON.stringify(j.effects)); } catch { /* ignore */ }
        return j.effects.slice(0, 80);
      }
    } catch { /* fall back to the cache */ }
    try {
      const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return Array.isArray(c) ? c.slice(0, 80) : [];
    } catch {
      return [];
    }
  });
  // ---- Ban check: the server says if this Roblox account is banned from BloxCool ----
  const banCacheFile = () => path.join(app.getPath('userData'), 'ban-cache.json');
  ipcMain.handle('ban:check', async (_e, userId) => {
    const id = String(userId || '');
    if (!/^\d{1,15}$/.test(id)) return { banned: false };
    let cache = {};
    try { cache = JSON.parse(fs.readFileSync(banCacheFile(), 'utf8')); } catch { /* none */ }
    try {
      const j = await groupFetch('GET', '/banned?id=' + id);
      if (j.banned) cache[id] = { reason: String(j.reason || '') };
      else delete cache[id];
      try { fs.writeFileSync(banCacheFile(), JSON.stringify(cache)); } catch { /* ignore */ }
      if (j.banned) return { banned: true, reason: String(j.reason || '') };
      return j.locked ? { banned: false, locked: true, lockReason: String(j.lockReason || ''), lockAt: Number(j.lockAt) || 0 } : { banned: false };
    } catch {
      // server asleep or offline: a ban we already know about stays in force
      return cache[id] ? { banned: true, reason: cache[id].reason } : { banned: false };
    }
  });

  ipcMain.handle('look:get', async (_e, ids) => {
    try {
      const list = (Array.isArray(ids) ? ids : []).map(String).filter((x) => /^\d{1,15}$/.test(x)).slice(0, 60);
      if (!list.length) return { ok: true, profiles: {} };
      const j = await groupFetch('GET', '/profiles?ids=' + list.join(','));
      return { ok: true, profiles: j.profiles || {} };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  });
  ipcMain.handle('group:report', async (_e, id) => {
    try {
      if (!/^\d{1,15}$/.test(String(id))) throw new Error('bad id');
      if (!settings.userId) throw new Error('Log in or set your username first');
      await groupFetch('POST', '/report/' + id, {});
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  });
  ipcMain.handle('group:save', async () => {
    try {
      if (!settings.userId) throw new Error('Log in or set your username first');
      const j = await groupFetch('PUT', '/profile/' + settings.userId, settings.profileCustom || {});
      return { ok: true, review: (j && j.review) || {}, checking: !!(j && j.checking), blockedUntil: Number(j && j.blockedUntil) || 0, locked: !!(j && j.locked) };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  });

  ipcMain.handle('media:scan', () => scanMedia());

  ipcMain.handle('media:openFolder', (_e, kind) => shell.openPath(mediaDir(kind)));

  // File picker: copies the chosen pictures/videos into the backgrounds folder so they stay saved.
  ipcMain.handle('bg:add', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const exts = [...IMAGE_EXT, ...VIDEO_EXT].map((x) => x.slice(1));
    const res = await dialog.showOpenDialog(win, {
      title: 'Choose background pictures',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Pictures & videos', extensions: exts }],
    });
    if (res.canceled || !res.filePaths.length) return { canceled: true, added: [], media: scanMedia() };
    const dir = mediaDir('backgrounds');
    const added = [];
    for (const src of res.filePaths) {
      const ext = path.extname(src).toLowerCase();
      if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
      let name = path.basename(src);
      const parsed = path.parse(name);
      let n = 1;
      while (fs.existsSync(path.join(dir, name))) name = `${parsed.name}-${n++}${parsed.ext}`;
      try {
        fs.copyFileSync(src, path.join(dir, name));
        added.push(name);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
    return { canceled: false, added, media: scanMedia() };
  });

  ipcMain.handle('bg:delete', (_e, name) => {
    if (typeof name === 'string' && path.basename(name) === name) {
      const ext = path.extname(name).toLowerCase();
      if (IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext)) {
        try {
          fs.unlinkSync(path.join(mediaDir('backgrounds'), name));
        } catch (err) {
          console.error('Delete failed', err);
        }
      }
    }
    return scanMedia();
  });

  // All Roblox web API calls go through here (no CORS problems, only roblox.com allowed).
  ipcMain.handle('net:json', async (_e, url, opts = {}) => {
    const u = new URL(url);
    if (!isRobloxHost(u)) throw new Error('Blocked host');
    if (opts.auth) return authFetch(url, opts); // logged-in request: cookie never leaves this process
    const init = { method: opts.method === 'POST' ? 'POST' : 'GET', headers: { Accept: 'application/json', 'Accept-Language': 'en-US,en;q=0.9' } };
    if (init.method === 'POST') {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body || {});
    }
    const res = await net.fetch(url, init);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });

  // Starts the game. Direct launch (like Bloxstrap does): get a one-time login ticket for your account
  // and start RobloxPlayerBeta.exe ourselves. Falls back to the roblox:// link if that is not possible.
  ipcMain.handle('game:launch', async (_e, placeId) => {
    const id = String(placeId);
    if (!/^\d{1,15}$/.test(id)) throw new Error('Invalid place id');
    try {
      await launchDirect(id);
      return 'direct';
    } catch (err) {
      console.warn('direct launch failed:', err && err.message);
      lastLaunchError = String((err && err.message) || err);
    }
    await shell.openExternal(`roblox://experiences/start?placeId=${id}`);
    return 'protocol';
  });
  // Join a friend who is in a game (same server)
  ipcMain.handle('game:join', async (_e, placeId, gameId) => {
    const pid = String(placeId);
    const gid = String(gameId || '');
    if (!/^\d{1,15}$/.test(pid)) throw new Error('Invalid place id');
    if (!/^[0-9a-f-]{36}$/i.test(gid)) throw new Error('Invalid server id');
    await shell.openExternal(`roblox://experiences/start?placeId=${pid}&gameInstanceId=${gid}`);
    return true;
  });
  ipcMain.handle('game:lastError', () => lastLaunchError);

  ipcMain.handle('link:open', async (_e, url) => {
    if (
      typeof url === 'string' &&
      (url.startsWith('https://www.roblox.com/') || url.startsWith('https://developer.spotify.com/') || url === 'spotify:')
    ) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('auth:login', async (e) => {
    const me = await openLogin(BrowserWindow.fromWebContents(e.sender));
    if (me) {
      adoptAccount(me);
      await rememberAccount(me);
    }
    return { me: me || null, settings };
  });

  // Log in by pasting the .ROBLOSECURITY cookie. It is verified with Roblox, kept only in this
  // app's own session, and only ever sent to roblox.com.
  ipcMain.handle('auth:setCookie', async (_e, raw) => {
    let value = String(raw || '').trim();
    value = value
      .replace(/^\.?ROBLOSECURITY\s*=\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .replace(/;.*$/, '')
      .trim();
    if (value.length < 50 || /\s/.test(value)) return { me: null, settings };
    const ses = authSession();
    try {
      await ses.cookies.set({
        url: 'https://www.roblox.com',
        name: '.ROBLOSECURITY',
        value,
        domain: '.roblox.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      });
    } catch (err) {
      console.error('Cookie set failed', err);
      return { me: null, settings };
    }
    csrfToken = '';
    let me = null;
    try {
      me = await authFetch('https://users.roblox.com/v1/users/authenticated');
    } catch {
      /* invalid or expired cookie */
    }
    if (!me || !me.id) {
      await ses.cookies.remove('https://www.roblox.com', '.ROBLOSECURITY').catch(() => {});
      return { me: null, settings };
    }
    adoptAccount(me);
    await rememberAccount(me);
    return { me, settings };
  });

  ipcMain.handle('auth:me', async () => {
    let me = null;
    try {
      me = await authFetch('https://users.roblox.com/v1/users/authenticated');
      if (me && me.id) {
        adoptAccount(me);
        await rememberAccount(me); // picks up an account that was logged in before this update
      }
    } catch (err) {
      if (/HTTP 401/.test(String(err.message))) {
        settings.loggedIn = false;
        saveSettings();
      }
    }
    return { me, settings };
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      await authSession().clearStorageData();
    } catch (err) {
      console.error('Logout failed', err);
    }
    csrfToken = '';
    settings.loggedIn = false;
    saveSettings();
    return settings;
  });

  // ---- Accounts ----
  const publicAccounts = () => ({
    active: settings.loggedIn ? settings.userId : 0,
    accounts: loadAccounts().map((a) => ({ userId: a.userId, username: a.username, displayName: a.displayName })),
  });
  ipcMain.handle('accounts:list', () => publicAccounts());

  ipcMain.handle('accounts:switch', async (_e, userId) => {
    const acc = loadAccounts().find((a) => a.userId === Number(userId));
    if (!acc) return { ok: false, error: 'Account not found', settings };
    try {
      await setRobloxCookie(acc.cookie);
      const me = await authFetch('https://users.roblox.com/v1/users/authenticated');
      if (!me || !me.id || me.id !== acc.userId) throw new Error('HTTP 401');
      adoptAccount(me);
      await rememberAccount(me);
      return { ok: true, settings };
    } catch (err) {
      await authSession().cookies.remove('https://www.roblox.com', '.ROBLOSECURITY').catch(() => {});
      settings.loggedIn = false;
      saveSettings();
      const expired = /HTTP 401|HTTP 403/.test(String(err.message));
      return { ok: false, error: expired ? 'expired' : String(err.message || err), settings };
    }
  });

  ipcMain.handle('accounts:remove', async (_e, userId) => {
    const id = Number(userId);
    accountsCache = loadAccounts().filter((a) => a.userId !== id);
    saveAccounts();
    if (settings.userId === id && settings.loggedIn) {
      try { await authSession().clearStorageData(); } catch { /* ignore */ }
      csrfToken = '';
      settings.loggedIn = false;
      saveSettings();
    }
    return { ...publicAccounts(), settings };
  });

  // Before adding another account through the login window: sign the window's session out
  // (the current account's cookie is already stored, so it can be switched back to).
  ipcMain.handle('accounts:prepareAdd', async () => {
    try { await authSession().clearStorageData(); } catch { /* ignore */ }
    csrfToken = '';
    return true;
  });

  ipcMain.handle('auth:openWindow', (_e, url) => openRobloxWindow(url));

  ipcMain.handle('spotify:connect', async (_e, clientId) => {
    if (typeof clientId !== 'string' || !/^[a-f0-9]{32}$/i.test(clientId.trim())) {
      return { ok: false, error: 'id', settings };
    }
    settings.spotifyClientId = clientId.trim();
    saveSettings();
    const r = await spotifyConnect(settings.spotifyClientId);
    if (r.ok) {
      settings.spotifyConnected = true;
      saveSettings();
    }
    return { ...r, settings };
  });

  // Fallback cover: public iTunes search by artist + title (no key, nothing else is sent).
  ipcMain.handle('art:lookup', async (_e, artist, title) => {
    const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9Ѐ-ӿ]+/g, '');
    const t = String(title || '').slice(0, 150);
    const a = String(artist || '').slice(0, 100);
    if (!t) return null;
    const matches = (name) => {
      const x = norm(name);
      const y = norm(t);
      return x && y && (x.includes(y) || y.includes(x));
    };
    // 1) Apple
    try {
      const r = await net.fetch(
        'https://itunes.apple.com/search?' + new URLSearchParams({ term: (a + ' ' + t).trim(), entity: 'song', limit: '5' }).toString()
      );
      if (r.ok) {
        const j = await r.json();
        const hit = (j.results || []).find((x) => matches(x.trackName));
        if (hit && hit.artworkUrl100) return hit.artworkUrl100.replace(/\/\d+x\d+bb\./, '/600x600bb.');
      }
    } catch { /* next source */ }
    // 2) Deezer (much bigger catalog)
    const queries = [`artist:"${a}" track:"${t}"`, `${a} ${t}`.trim()];
    for (const q of queries) {
      try {
        const r = await net.fetch('https://api.deezer.com/search?' + new URLSearchParams({ q, limit: '8' }).toString());
        if (!r.ok) continue;
        const j = await r.json();
        const list = j.data || [];
        const hit =
          list.find((x) => matches(x.title) && norm(x.artist && x.artist.name) && (norm(a).includes(norm(x.artist.name)) || norm(x.artist.name).includes(norm(a)))) ||
          list.find((x) => matches(x.title));
        const cover = hit && hit.album && (hit.album.cover_xl || hit.album.cover_big || hit.album.cover_medium);
        if (cover) return cover;
      } catch { /* try next query */ }
    }
    return null;
  });

  ipcMain.handle('media:cmd', (_e, cmd) => {
    if (typeof cmd !== 'string' || !/^(poll(:full)?|toggle|next|prev|vol:get|vol:set:(0|1|0\.\d{1,3}|1\.0{1,3})|seek:\d{1,9})$/.test(cmd)) {
      return { ok: false, error: 'badcmd' };
    }
    return mediaCommand(cmd);
  });

  ipcMain.handle('spotify:disconnect', () => {
    clearSpotify();
    return settings;
  });

  // Only the player endpoints can be called, and the token never leaves this process.
  ipcMain.handle('spotify:api', async (_e, req) => {
    const { method = 'GET', path: p = '', body } = req || {};
    if (!['GET', 'PUT', 'POST'].includes(method)) return { status: 400 };
    if (!/^\/v1\/me\/player(\/[a-z-]+)?(\?[A-Za-z0-9_=&%.,-]*)?$/.test(p)) return { status: 400 };
    const token = await spotifyAccessToken();
    if (!token) return { status: 401 };
    try {
      const init = { method, headers: { Authorization: 'Bearer ' + token } };
      if (body !== undefined && method !== 'GET') {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
      const r = await net.fetch('https://api.spotify.com' + p, init);
      if (r.status === 204 || r.status === 202) return { status: r.status, data: null };
      let data = null;
      try {
        data = await r.json();
      } catch {
        /* empty body */
      }
      return { status: r.status, data };
    } catch {
      return { status: 0 };
    }
  });

  const winOf = (e) => BrowserWindow.fromWebContents(e.sender);
  ipcMain.on('win:min', (e) => winOf(e)?.minimize());
  ipcMain.on('win:max', (e) => {
    const w = winOf(e);
    if (!w) return;
    w.isMaximized() ? w.unmaximize() : w.maximize();
  });
  ipcMain.on('win:close', (e) => winOf(e)?.close());
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0b0d12',
    title: 'BloxCool',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  loadSettings();
  loadSpotifyTokens();
  ensureDirs();
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  try {
    if (mediaProc) mediaProc.kill();
  } catch {
    /* already gone */
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
