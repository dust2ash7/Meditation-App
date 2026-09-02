# Stillpoint

A quiet, cinematic meditation PWA. Timed sits, box breathing (4-4-4-4), and a 4-7-8 wind-down. No accounts, no paywall, nothing to install unless you want it on your home screen.

Live after merge: [dust2ash7.github.io/Meditation-App](https://dust2ash7.github.io/Meditation-App/)

This rewrite replaces the original timer UI. The two existing audio files in the repo are left untouched.

## Practice

- **Timed sit** — a 4 / 6 breath guide. Watch the orb, let time pass.
- **Box breathing** — inhale, hold, exhale, hold, four seconds each. Phase names are announced with `aria-live`.
- **Wind-down** — 4-7-8 cadence for the edge of sleep.

Lengths: **5, 10, 15, 20 minutes**, **open** (counts up until you stop), or a **custom minutes** field.

During a sitting you can pause, loop the soundscape, mute, or stop. A soft Web Audio chime marks the start and a completed sit. Sittings of 15 seconds or longer are stored in history.

## Sound

The looping bed is `./nastelbom-meditation.mp3` (repo-relative). Playback starts from the **Begin** click so browsers allow it. Turning soundscape off, then on, while a session is running resumes the track. Mute silences the bed and chimes without tearing down the session.

Both `nastelbom-meditation.mp3` and `nastelbom-meditation.mp3.mp3` remain in the repository. The app never points at a GitHub `blob` URL and never uses the doubled `.mp3.mp3` filename as a source.

## What is stored locally

History, streak, total minutes, mute, and soundscape preference live in `localStorage` under `stillpoint-v1`. Nothing is sent anywhere.

Streaks count consecutive calendar days with at least one completed sitting. Missing today still keeps yesterday’s streak until midnight.

## Progressive web app

`manifest.json` uses local `icon.svg` (no third-party placeholder images). The service worker is registered at `./sw.js` so GitHub Pages under `/Meditation-App/` works. Cached paths are relative (`./index.html`, …). The app is a static site: HTML, CSS, and JavaScript.

## Accessibility and comfort

- Skip link, labels, and `:focus-visible` rings
- Contrast on a dark restful palette, with safe-area insets for notched phones
- `aria-live` for breath phases and periodic time updates
- `prefers-reduced-motion` freezes the orb and atmosphere (phase text still changes)
- Switching away from the tab pauses the session and the audio; returning resumes if it was running

## Run locally

From the repo root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. A service worker needs HTTP(S), not `file://`.

## Stack

Plain HTML, CSS, and JavaScript. Google Fonts: Fraunces and Figtree, with serif/system fallbacks. No build step, no backend.
