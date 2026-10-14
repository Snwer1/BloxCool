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
  return false;
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
  box.append(el('h1', null, 'You are banned from BloxCool'), el('p', null, reason ? 'Reason: ' + reason : 'The owner removed your access.'));
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
  b.appendChild(box);
}
