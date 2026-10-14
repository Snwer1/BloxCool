// ============================================================================
// News: group shouts (and wall posts) from every group you are in, in one place
// ============================================================================
const NEWS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11"/></svg>';
const news = { items: [], at: 0, loading: false, type: 'all', q: '', walls: true, token: 0, unread: new Set() };
const NEWS_TTL = 10 * 60 * 1000;

const newsAgo = (iso) => {
  const t = Date.parse(iso);
  if (!t) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago';
  return new Date(t).toLocaleDateString();
};

// run `fn` over `list` with a few requests at a time
async function newsPool(list, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, list.length) }, async () => {
      while (i < list.length) {
        const item = list[i++];
        try {
          await fn(item);
        } catch {
          /* one group failing must not stop the others */
        }
      }
    })
  );
}

async function newsLoad(force) {
  if (!S.userId) return { error: 'login' };
  if (!force && news.items.length && Date.now() - news.at < NEWS_TTL) return { ok: true };
  if (news.loading) return news.loading;
  news.loading = (async () => {
    const r = await J(`https://groups.roblox.com/v2/users/${S.userId}/groups/roles?includeLocked=false`).catch(() => null);
    const groups = ((r && r.data) || []).map((x) => x.group).filter(Boolean).slice(0, 60);
    if (!r) return { error: 'net' };
    const icons = new Map();
    for (let i = 0; i < groups.length; i += 40) {
      const ids = groups.slice(i, i + 40).map((g) => g.id).join(',');
      const th = await J(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${ids}&size=150x150&format=Png&isCircular=false`).catch(() => null);
      ((th && th.data) || []).forEach((d) => icons.set(d.targetId, d.imageUrl));
    }
    const items = [];
    await newsPool(groups, 6, async (g) => {
      const info = await J(`https://groups.roblox.com/v1/groups/${g.id}`).catch(() => null);
      const sh = info && info.shout;
      if (sh && sh.body) {
        items.push({ kind: 'shout', gid: g.id, group: g.name, icon: icons.get(g.id) || '', body: sh.body, who: (sh.poster && (sh.poster.displayName || sh.poster.username)) || '', at: sh.updated || sh.created || '', key: g.id + ':' + (sh.updated || sh.created) });
      }
      if (news.walls) {
        const w = await JA(`https://groups.roblox.com/v2/groups/${g.id}/wall/posts?limit=3&sortOrder=Desc`).catch(() => null);
        ((w && w.data) || []).forEach((p) => {
          if (!p.body) return;
          const u = p.poster && p.poster.user;
          items.push({ kind: 'wall', gid: g.id, group: g.name, icon: icons.get(g.id) || '', body: p.body, who: (u && (u.displayName || u.username)) || '', at: p.updated || p.created || '', key: 'w' + p.id });
        });
      }
    });
    items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    news.items = items;
    news.at = Date.now();
    news.groups = groups.length;
    return { ok: true };
  })();
  try {
    return await news.loading;
  } finally {
    news.loading = false;
  }
}

function newsUnreadCount() {
  const seen = S.newsSeen || {};
  return news.items.filter((i) => i.kind === 'shout' && seen[i.gid] !== i.at).length;
}

function newsBadge() {
  const b = typeof navBtns !== 'undefined' && navBtns.News;
  if (!b) return;
  let dot = b.querySelector('.navbadge');
  const n = newsUnreadCount();
  if (!n) return dot && dot.remove();
  if (!dot) {
    dot = el('i', 'navbadge');
    b.appendChild(dot);
  }
  dot.textContent = n > 9 ? '9+' : String(n);
}

// quietly look for new shouts after start-up so the sidebar can show a number
async function newsPrefetch() {
  const r = await newsLoad(false).catch(() => null);
  if (r && r.ok) newsBadge();
}

async function openNews() {
  const v = document.getElementById('newsView');
  const token = ++news.token;
  v.replaceChildren();
  v.appendChild(el('h1', null, 'News'));
  const sub = el('div', 'set-desc', 'Shouts and wall posts from every group you are in, newest first.');
  v.appendChild(sub);
  const bar = el('div', 'news-bar');
  const pills = el('div', 'set-pills');
  [['all', 'Everything'], ['shout', 'Shouts'], ['wall', 'Wall posts']].forEach(([k, l]) => {
    const p = el('button', 'pill' + (news.type === k ? ' active' : ''), l);
    p.onclick = () => {
      news.type = k;
      pills.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x === p));
      paint();
    };
    pills.appendChild(p);
  });
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search groups or text';
  search.className = 'news-search';
  search.value = news.q;
  search.oninput = () => {
    news.q = search.value.trim().toLowerCase();
    paint();
  };
  const ref = el('button', 'pill', 'Refresh');
  ref.onclick = () => run(true);
  bar.append(pills, search, ref);
  v.appendChild(bar);
  const list = el('div', 'news-list');
  v.appendChild(list);

  const seenBefore = { ...(S.newsSeen || {}) };
  function paint() {
    if (token !== news.token) return;
    list.replaceChildren();
    const items = news.items.filter((i) => (news.type === 'all' || i.kind === news.type) && (!news.q || (i.group + ' ' + i.body + ' ' + i.who).toLowerCase().includes(news.q)));
    if (!items.length) {
      list.appendChild(el('div', 'empty', news.items.length ? 'Nothing matches that.' : 'None of your groups have a shout or wall post right now.'));
      return;
    }
    items.forEach((i) => {
      const card = el('div', 'news-card' + (i.kind === 'shout' && seenBefore[i.gid] !== i.at ? ' fresh' : ''));
      const im = el('img', 'news-icon');
      im.alt = '';
      if (i.icon) im.src = i.icon;
      const main = el('div', 'news-main');
      const head = el('div', 'news-head');
      head.append(el('b', null, i.group), el('span', 'news-kind ' + i.kind, i.kind === 'shout' ? 'Shout' : 'Wall post'));
      if (i.kind === 'shout' && seenBefore[i.gid] !== i.at) head.appendChild(el('span', 'news-new', 'NEW'));
      main.append(head, el('div', 'news-body', i.body), el('div', 'news-meta', [i.who && 'by ' + i.who, newsAgo(i.at)].filter(Boolean).join(' · ')));
      const open = el('button', 'pill', 'Open group');
      open.onclick = () => window.api.openLink(`https://www.roblox.com/communities/${i.gid}`);
      card.append(im, main, open);
      list.appendChild(card);
    });
  }
  async function run(force) {
    if (!S.userId) {
      list.replaceChildren(el('div', 'empty', 'Log in (Settings → Accounts) to see news from your groups.'));
      return;
    }
    list.replaceChildren(el('div', 'empty', news.items.length && !force ? '' : 'Loading your groups…'));
    if (news.items.length && !force) paint();
    const r = await newsLoad(force);
    if (token !== news.token) return;
    if (r && r.error === 'net') {
      list.replaceChildren(el('div', 'empty', "Couldn't reach Roblox. Check your internet and press Refresh."));
      return;
    }
    paint();
    // everything shown now counts as read
    const seen = { ...(S.newsSeen || {}) };
    news.items.filter((i) => i.kind === 'shout').forEach((i) => (seen[i.gid] = i.at));
    S = await window.api.setSettings({ newsSeen: seen });
    newsBadge();
  }
  run(false);
}
