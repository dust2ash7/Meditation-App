# Stillpoint

A quiet, cinematic meditation web app. Timed sits, box breathing, and wind-down — no accounts, no paywall, nothing to install unless you want it on your home screen.

Live: [dust2ash7.github.io/Meditation-App](https://dust2ash7.github.io/Meditation-App/)

## Practice

- **Timed sit** — a 4 / 6 breath guide. Watch the orb, let time pass.
- **Box breathing** — 4-4-4-4 visual square for a restless nervous system.
- **Wind-down** — 4-7-8 cadence for the edge of sleep.

Lengths: 5, 10, 15, 20 minutes, or open (elapsed time).

During a sitting you can pause, loop the **nastelbom** soundscape, mute everything, or end early. A gentle Web Audio chime marks the start and close. Sittings of 15 seconds or longer are logged.

## What is stored locally

History, streak, total minutes, mute, and soundscape preference live in `localStorage` (`stillpoint-v1`). Nothing is sent anywhere.

Streaks count consecutive calendar days with at least one logged sitting. Missing today still keeps yesterday’s streak alive until the day turns.

## Sound

The primary ambient bed is `nastelbom-meditation.mp3`. If that file cannot play, the app falls back to `nastelbom-meditation.mp3.mp3` (the original longer encode in this repo). Both files are left as-is; this rewrite does not replace audio.

## Progressive web app

`manifest.json` and `sw.js` register from relative URLs so GitHub Pages at `/Meditation-App/` works. The service worker caches the app shell and attempts to cache both soundscape files. Audio cache of the large file may fail on constrained devices; the app still runs.

## Accessibility

- Skip link, labels, and `:focus-visible` rings
- Contrast on a dark restful palette
- `aria-live` for breath phase and periodic time updates
- `prefers-reduced-motion` freezes the orb and atmosphere (phase text still changes)

## Run locally

This is a static site. From the repo root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. A service worker needs HTTP(S), not `file://`.

## Stack

Plain HTML, CSS, and JavaScript. Google Fonts: Fraunces and Figtree. No build step, no backend.
