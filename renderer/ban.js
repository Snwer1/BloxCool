// ============================================================================
// Ban lock screen. The profile server keeps a list of banned Roblox IDs; if you are on it, this screen
// covers the app. Uses helpers from app.js: el, S, accountsInfo, switchAccount.
// ============================================================================

// ---- Ban lock screen ----
let lookLock = null; // set while the owner has look-locked this account: { reason, until, at }
const fmtWhen = (t) => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const untilText = (t, what) => (t ? what + ' until ' + fmtWhen(t) + '.' : 'This is permanent.');
async function enforceBan() {
  const prevLock = lookLock;
  lookLock = null;
  if (!S.userId) return hideBan();
  let r = null;
  try {
    r = await window.api.banCheck(S.userId);
  } catch {
    r = null;
  }
  if (r && r.banned) {
    await announceLifted(r); // remembers that this account is banned
    showBan(r.reason, r.until);
    return true;
  }
  hideBan();
  if (r && r.locked) {
    lookLock = { reason: r.lockReason, until: r.lockUntil, at: r.lockAt };
    if (!((S.lockSeen || {})[String(S.userId)] >= r.lockAt)) showLockNotice(r);
  }
  if (r) await announceLifted(r);
  else lookLock = prevLock; // couldn't reach the server this time: keep what we knew
  return false;
}
// Tell the player when a ban or look lock they were under has ended (time ran out, or the owner lifted it).
async function announceLifted(r) {
  const id = String(S.userId);
  const before = (S.restricted || {})[id] || {};
  const now = { ban: !!r.banned, lock: !!r.locked };
  if (r.banned) now.lock = !!before.lock; // while banned the server doesn't report a lock, keep what we knew
  const lifted = [];
  if (before.ban && !now.ban) lifted.push('ban');
  if (before.lock && !now.lock) lifted.push('lock');
  if (!!before.ban !== now.ban || !!before.lock !== now.lock) {
    S = await window.api.setSettings({ restricted: { ...(S.restricted || {}), [id]: now } });
  }
  if (lifted.length) showLiftedNotice(lifted);
}
function showLiftedNotice(kinds) {
  if (document.getElementById('liftednotice')) return;
  const b = el('div');
  b.id = 'liftednotice';
  b.className = 'noticeov';
  const box = el('div', 'ban-box');
  const ban = kinds.includes('ban');
  const lock = kinds.includes('lock');
  const title = ban && lock ? 'Your ban and look lock have ended' : ban ? 'Your ban has ended' : 'Your look lock has ended';
  const lines = [];
  if (ban) lines.push('You can use BloxCool again.');
  if (lock) lines.push('You can customize your profile again: banner, background, picture and description.');
  box.append(el('h1', null, title), ...lines.map((t) => el('p', null, t)), el('p', 'ban-sub', 'Please follow the rules so it does not happen again.'));
  const ok = el('button', 'pill primary', 'Got it');
  ok.onclick = () => b.remove();
  box.appendChild(ok);
  b.appendChild(box);
  document.body.appendChild(b);
}
// Cooldown on the close button so the message can't be skipped.
const NOTICE_SECONDS = 10;
function holdButton(btn, label, seconds, onReady) {
  let left = seconds;
  btn.disabled = true;
  const tick = () => {
    if (left > 0) {
      btn.textContent = label + ' (' + left + ')';
      left--;
      setTimeout(tick, 1000);
    } else {
      btn.textContent = label;
      btn.disabled = false;
      if (onReady) onReady();
    }
  };
  tick();
}
function showLockNotice(r) {
  if (document.getElementById('locknotice')) return;
  const b = el('div');
  b.id = 'locknotice';
  b.className = 'noticeov';
  const box = el('div', 'ban-box');
  box.append(
    el('h1', null, 'Your profile look was locked'),
    el('p', null, 'You can no longer use a custom banner, background, profile picture or description.'),
    el('p', null, r.lockReason ? 'Reason: ' + r.lockReason : 'The owner did not give a reason.'),
    el('p', null, untilText(r.lockUntil, 'Locked'))
  );
  const ok = el('button', 'pill primary', 'I understand');
  ok.onclick = async () => {
    const seen = { ...(S.lockSeen || {}) };
    seen[String(S.userId)] = r.lockAt;
    S = await window.api.setSettings({ lockSeen: seen });
    b.remove();
  };
  box.appendChild(ok);
  b.appendChild(box);
  document.body.appendChild(b);
  holdButton(ok, 'I understand', NOTICE_SECONDS);
}
function hideBan() {
  const b = document.getElementById('banned');
  if (b) b.remove();
  return false;
}
function showBan(reason, until) {
  let b = document.getElementById('banned');
  if (!b) {
    b = el('div');
    b.id = 'banned';
    document.body.appendChild(b);
  }
  b.innerHTML = '';
  const box = el('div', 'ban-box');
  box.append(el('h1', null, 'Your account is banned from BloxCool'), el('p', null, reason ? 'Reason: ' + reason : 'The owner did not give a reason.'), el('p', null, untilText(until, 'Banned')));
  const others = (accountsInfo.accounts || []).filter((a) => a.userId !== S.userId);
  if (others.length) {
    box.appendChild(el('p', 'ban-sub', 'You can use another account:'));
    others.forEach((a) => {
      const sw = el('button', 'pill', 'Switch to ' + a.username);
      sw.onclick = () => switchAccount(a.userId);
      box.appendChild(sw);
    });
  }
  const q = el('button', 'pill primary', 'Close app');
  q.onclick = () => window.api.win.close();
  box.appendChild(q);
  holdButton(q, 'Close app', NOTICE_SECONDS);
  b.appendChild(box);
}
