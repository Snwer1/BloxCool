# BloxCool

A desktop home page for Roblox (Electron, Windows). It shows your friends, games and group news,
launches games in the real Roblox client, and lets you customise the layout, background and profile look.

This repository is public so you can read exactly what the app does before you run it.

## Install

Download `BloxCool-Setup.exe` from the **Releases** page. Each release lists a SHA-256 checksum:

```
certutil -hashfile BloxCool-Setup.exe SHA256
```

The installer is not code-signed yet, so Windows SmartScreen will warn you (More info → Run anyway).
If you would rather not trust a download, build it yourself (below).

## Build it yourself

Needs [Node.js LTS](https://nodejs.org).

```
npm install
npm start          # run from source
npm run dist       # build the installer into dist/
```

On Windows you can also double-click `build-installer.bat`. It asks for administrator rights because Windows needs them to unpack one of the build tools (it creates symbolic links). The script only runs `npm install` and `npm run dist`, so you can read it first.

## What it does with your account

Short version, full detail in [SECURITY.md](SECURITY.md):

- Your Roblox login (cookie) is stored only on your PC, encrypted by Windows when available, and is only sent to `*.roblox.com`.
- Your password is never seen by the app. The login window is Roblox's own page.
- The app talks to a small set of hosts (listed in SECURITY.md). There is no analytics or tracking.
- The BloxCool profile server stores the look you choose (name, banner, picture, effects), nothing else. Custom pictures are only shown to other players after a safety check (until it runs they stay hidden), players can report pictures, and you can hide everyone's pictures in Settings. The server's code is not published here.

## Layout of the code

| Path | What it is |
| --- | --- |
| `main.js`, `preload.js` | Electron main process. All network access with your login lives here. |
| `renderer/` | The interface (HTML, CSS and plain JavaScript, no frameworks). |
| `bloxhome.config.json` | Address of the profile server. It is empty in this public copy, so a build from this source runs without profile sharing. |
| `docs/USAGE.md` | How to use the app. |

## What is not in this repository

- The profile server's code.
- A few owner-only admin tools that are part of the released installer. They only work with the owner's own admin key, they never touch your Roblox login, and they are not published.

Everything else in the app, including everything that handles your Roblox login, is here.

## License

Source-available, see [LICENSE](LICENSE). You may read, audit and build it for yourself.
