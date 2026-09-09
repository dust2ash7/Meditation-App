# Stillpoint meditation beds (original, royalty-free)

Generated with Python + NumPy synthesis + ffmpeg (`libmp3lame`). Original layered sine/triangle pads, filtered noise, and slow LFOs — not copyrighted stock.

## Files

| Path | Mode |
|------|------|
| `audio/stillpoint-sit.mp3` | Timed sit |
| `audio/stillpoint-box.mp3` | Box breathing |
| `audio/stillpoint-wind.mp3` | Wind-down |

## Specs (all three)

- Duration ~56 s, seamless loop
- 44100 Hz mono, MP3 **112 kbps**, ~767 KB each
- Peak ≈ −3 dBFS before encode
- No drums / vocals / sharp attacks

## Musical notes

- **sit** — warm open C-minor pad; calm drift; no rhythmic pulse
- **box** — C-minor family with soft ~4 s breathe swell for box pacing
- **wind** — darker/lower drone, LPF ~1.2 kHz, sleepier

## Playback

- `volume = 0.32`, `loop = true`
- Keep existing Web Audio end bell
- Legacy `./nastelbom-meditation.mp3.mp3` unused (Game Fixer wires the three paths above)
