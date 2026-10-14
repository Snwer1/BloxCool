# Security and privacy

## Your Roblox login

- **Cookie login:** you paste your `.ROBLOSECURITY` value. It is verified with Roblox, then stored in the app's
  data folder on your PC and only attached to requests to `roblox.com` hosts. Anyone with that cookie is you, so
  never share the app's data folder.
- **Window login:** a window opens Roblox's own login page. The app never sees your password; the session stays
  inside the app's own data folder, like a browser profile.
- The cookie and tokens never leave the main process (`main.js`). The interface code in `renderer/` cannot read
  them (context isolation is on, and it talks to the main process through the fixed list in `preload.js`).

## What the app connects to

| Host | Why |
| --- | --- |
| `*.roblox.com` (users, friends, games, thumbnails, avatar, groups, presence, inventory, notifications, auth) | Your friends, games, avatar, group news, launching games |
| `accounts.spotify.com`, `api.spotify.com` | Optional: control Spotify (login uses PKCE, no client secret) |
| `itunes.apple.com`, `api.deezer.com` | Album art lookups for the music player |
| the profile server in `bloxhome.config.json` | Optional: shares profile looks between BloxCool users |

There is no analytics, ad or telemetry code. You can check with a search for `fetch(` and `net.fetch(` in `main.js`
and `renderer/`.

## The profile server

The profile server's code is not published. It stores, per Roblox user ID: nickname, tagline, accent color,
banner/background/picture images, and chosen effects. It does not receive your cookie or password. Writes need a random
per-install key. Like any server, it sees the IP address of each request.

## What is not published

The released installer also contains a few owner-only admin tools that are not in this repository. They only work with
the owner's own admin key, and they never read or send your Roblox login. Everything that handles your login is in
`main.js` in this repository.

## Reporting a problem

Open a GitHub issue. For something sensitive, use GitHub's private "Report a vulnerability" option on the Security tab.
