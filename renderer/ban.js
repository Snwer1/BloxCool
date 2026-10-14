// ============================================================================
// Ban lock screen. The profile server keeps a list of banned Roblox IDs; if you are on it, this screen
// covers the app. Uses helpers from app.js: el, S, accountsInfo, switchAccount.
// ============================================================================

// ---- Ban lock screen ----
async function enforceBan() {
  if (!S.userId) return hideBan();
  let r = null;
  try {
    r = await window.api.banCheck(S.userId);
  } catch {
    r = null;
  }
  if (r && r.banned) {
    showBan(r.reason);
    return true;
  }
  hideBan();
  if (r && r.locked && !((S.lockSeen || {})[String(S.userId)] >= r.lockAt)) showLockNotice(r);
  return false;
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
    el('p', null, r.lockReason ? 'Reason: ' + r.lockReason : 'The owner did not give a reason.')
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
function showBan(reason) {
  let b = document.getElementById('banned');
  if (!b) {
    b = el('div');
    b.id = 'banned';
    document.body.appendChild(b);
  }
  b.innerHTML = '';
  const box = el('div', 'ban-box');
  box.append(el('h1', null, 'Your account is banned from BloxCool'), el('p', null, reason ? 'Reason: ' + reason : 'The owner did not give a reason.'));
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
