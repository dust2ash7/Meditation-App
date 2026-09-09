# Stillpoint meditation beds (original, royalty-free)

Generated with Python + NumPy synthesis + ffmpeg (`libmp3lame`). Not copyrighted stock — original layered sine/triangle pads, filtered noise, and slow LFOs.

## Files (repo paths after push)

| Repo path | Local path | Mode |
|-----------|------------|------|
| `audio/stillpoint-sit.mp3` | `audio/stillpoint-sit.mp3` | Timed sit |
| `audio/stillpoint-box.mp3` | `audio/stillpoint-box.mp3` | Box breathing |
| `audio/stillpoint-wind.mp3` | `audio/stillpoint-wind.mp3` | Wind-down |

## Specs (all three)

| Property | Value |
|----------|-------|
| Duration | ~56.0 s each (seamless loop via end→start crossfade) |
| Sample rate | 44100 Hz |
| Channels | Mono |
| Codec / bitrate | MP3 CBR **112 kbps** (`libmp3lame`) |
| Approx size | **~767 KB** each (~785,000 bytes) — well under Pages budget |
| Peak | Normalized ≈ −3 dBFS before encode |
| Content | No drums, no vocals, no sharp attacks |

## Musical notes

### `stillpoint-sit.mp3` — Timed sit
Warm open **C-minor** pad (C3–Eb3–G3–Bb3–C4–Eb4 + soft G4/C5 shimmer). Calm amplitude drift only — **no rhythmic pulse**. Soft breath-noise bed, LPF ~2.4 kHz for warmth.

### `stillpoint-box.mp3` — Box breathing
Same **C-minor** family with F3 for motion. Soft **~4 s breathe cycle** (raised-cosine swell, not a click) plus quiet C2 sub swell. Distinct soft pulse feel for inhale/hold/exhale/hold pacing without drums.

### `stillpoint-wind.mp3` — Wind-down
Darker / lower: **C2–G2–Bb2–C3–Eb3–G3** + Ab3 color, extra C1-ish sub drone. LPF ~1.2 kHz — more low drone, **less sparkle**, sleepier tempo of LFO movement.

## Playback (HTMLAudio / Stillpoint)

- Recommended volume: **`0.32`**
- **`loop = true`**
- Keep the existing **Web Audio end bell** (do not replace or mute it with these beds)

## Generation

```bash
python3 generate_beds.py   # writes WAVs (or use the regen path in history)
ffmpeg -i bed.wav -codec:a libmp3lame -b:a 112k -ar 44100 -ac 1 bed.mp3
```

Do not treat these as stock library cues; they are original Stillpoint assets.
