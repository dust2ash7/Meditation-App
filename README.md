<p align="center">
  <img src="brand/logo-c.png" alt="Raven Flock" width="280" />
</p>

<p align="center"><strong>Raven Flock — Consider the ravens.</strong></p>

---

# Stillpoint

A quiet meditation PWA from **Raven Flock**. Timed sits, box breathing (4-4-4-4), and a 4-7-8 wind-down. No accounts. Tips optional.

Live: [dust2ash7.github.io/Meditation-App](https://dust2ash7.github.io/Meditation-App/)

Tip jar: [buymeacoffee.com/nrsteward](https://www.buymeacoffee.com/nrsteward)

## Practice

- **Timed sit** — a 4 / 6 breath guide. Watch the orb, let time pass.
- **Box breathing** — inhale, hold, exhale, hold, four seconds each. Phase names are announced with `aria-live`.
- **Wind-down** — 4-7-8 cadence for the edge of sleep.

Lengths: **5, 10, 15, 20 minutes**, **open** (counts up until you stop), or a **custom minutes** field.

During a sitting you can pause, switch soundscapes, mute, or stop. A soft Web Audio chime marks a completed sit. Sittings of 15 seconds or longer are stored in history.

## Sound

Pick a bed on the home screen or mid-sit:

| Chip | What you hear |
|------|----------------|
| **Soft** | Mode bed in `audio/` — sit, box, or wind |
| **White** | Filtered noise, generated in the browser |
| **Rain** | Light rain + drips |
| **Rainfall** | Heavier rain |
| **Beach** | Low swell |
| **Nature** | Low bed + occasional chirps |

Soft uses:

- `./audio/stillpoint-sit.mp3`
- `./audio/stillpoint-box.mp3`
- `./audio/stillpoint-wind.mp3`

Sources and licenses are in [`audio/CREDITS.md`](./audio/CREDITS.md). The other chips are synthesized by `sounds.js` — no extra files.

Playback starts from the **Begin** click so browsers allow it. Mute silences the bed and chimes without ending the session.

## What is stored locally

History, streak, total minutes, mute, soundscape on/off, and the selected sound live in `localStorage` under `stillpoint-v1`. Nothing is sent anywhere.

Streaks count consecutive calendar days with at least one completed sitting. Missing today still keeps yesterday’s streak until midnight.

## Progressive web app

`manifest.json` uses local `icon.svg` (Raven Flock mark). The service worker is `./sw.js` so GitHub Pages under `/Meditation-App/` works. Cached paths are relative. The app is a static site: HTML, CSS, and JavaScript.

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