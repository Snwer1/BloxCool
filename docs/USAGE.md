# Eudora

A standalone desktop app (Electron) with a Roblox-style home page. It shows your friends, popular games and
recently played games, and clicking a game launches it in the real Roblox client.

## Run it

1. Install Node.js (LTS) from https://nodejs.org
2. In this folder, open a terminal and run:

```
npm install
npm start
```

To build an installer (.exe): `npm run dist` (output goes to `dist/`).

## Logging in

**With your cookie (fastest):** More → Log in with cookie… (or your profile popup, or Settings → Account).
Get the value in Chrome: log in at roblox.com, press F12 → Application → Cookies → https://www.roblox.com →
copy the Value of `.ROBLOSECURITY`. Paste it in the box. It is checked with Roblox, stored only in the app's
data folder, and only sent to roblox.com. Anyone with that cookie is you, so never share the app's data
folder or settings. Logging out of Roblox on the website or changing your password makes the cookie stop working.

**With Roblox's login window:**

Click **Log in with Roblox** (first-launch screen, your profile popup, More menu, or Settings → Account).
A window opens with **Roblox's own login page**. You type your password there, so Eudora never sees it.
The login is kept inside the app's own data folder (like a browser would), and only the app's background
process uses it to ask Roblox for read-only info. **Log out** deletes it.

Once logged in you get:
- your real avatar and friends,
- green/orange dots for friends who are in a game / online (online friends sorted first, refreshed every minute),
- the unread-notification count on the bell,
- **Avatar** button and Settings → Account → **Edit avatar**: opens Roblox's avatar editor in an app window.

Google / Apple sign-in buttons on Roblox's page may not work inside the app. Use username + password
(or Roblox quick login).

## Customize

- **Settings (bottom of the sidebar) → Background**: add pictures/GIFs/videos with a file picker, preview and
  click to apply, remove ones you don't want, darkness slider, auto-change timer.

## Music

The player at the top left has two modes. Pick one in **Settings → Music**:

- **This PC (default, works with a free Spotify account):** shows what is playing in the Spotify app on this
  Windows PC (or any media app) and controls it: play/pause, previous, next, seeking and the Spotify app's
  volume. No Premium and no developer app. A small PowerShell helper (`media-helper.ps1`) talks to Windows'
  media session. Open the Spotify app and press play. Seeking only works if the app allows it, and the volume
  slider only works while Spotify has sound playing.
- **Spotify account (needs Premium):** controls Spotify on any of your devices through Spotify's developer API.
  One-time setup: create an app at https://developer.spotify.com/dashboard, add the Redirect URI
  `http://127.0.0.1:8888/callback`, tick "Web API", paste its Client ID in Eudora and click Connect.
  Tokens are stored only on this computer (encrypted when Windows allows it) and only sent to Spotify.

## How games work

- **Continue** and **Recommended For You** come from Roblox's home-page data (your real ones when you are logged in; a popular-games list if that can't be loaded). Game rows wrap downward and the page scrolls.
- **Jump Back In** = games you started from this app. **Pinned** = right-click any card to pin/unpin.
- Clicking a card opens `roblox://experiences/start?placeId=...`, so Roblox must be installed.

## Limits

- Roblox's own personal "Continue" list isn't available (no stable public API), so Jump Back In is local.
- Charts / Chat open the matching roblox.com page in your browser for now.
- Roblox can change its web APIs. If a row shows empty, use More → Refresh.

Files: `main.js` (window, settings, login session, API proxy, game launch), `preload.js` (safe bridge),
`renderer/` (index.html, styles.css, app.js).
