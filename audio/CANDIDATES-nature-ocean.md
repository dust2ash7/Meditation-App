# Candidate research — Stillpoint wild + shore beds

Chosen picks first; rejected / fallback options documented for audit.

---

## Nature (`wild`) — CHOSEN

**Forest and Stream #1 — Joseph Sardin / BigSoundBank — CC0**  
https://bigsoundbank.com/forest-and-stream-1-s2713.html  
Direct: https://bigsoundbank.com/UPLOAD/mp3/2713.mp3  

**Why chosen:** Real brook + birds field recording (~5:01). Richer and more natural than birds-only; clearly reads as forest/nature for the Nature UI. Existing MP3 (and OGG on site) made trim/re-encode straightforward. Beat the original OGA birds-only plan.

---

## Nature — rejected / not used

| Candidate | License | Why rejected |
|-----------|---------|--------------|
| **Ambient Bird Sounds — isaiah658** (OpenGameArt) https://opengameart.org/content/ambient-bird-sounds · `birds-isaiah658.ogg` (~30.7 s) | CC0 | Real birds/forest, but thin/short alone vs BigSoundBank brook+birds. Downloaded under `src/` as prior locked primary; superseded by upgrade. |
| **Forest Ambience — TinyWorlds / Rick Hoppmann** (OGA) `Forest_Ambience.mp3` (~44.8 s) | CC0 | Ludum Dare 29 soundtrack piece; risk of melodic/pad character. Brief said prefer birds-only if musical — skipped enrichment mix. |

---

## Ocean (`shore`) — CHOSEN

**Calm ocean waves — SamsterBirdies — CC0**  
https://freesound.org/people/SamsterBirdies/sounds/578524/  
HQ preview used: https://cdn.freesound.org/previews/578/578524_5487341-hq.mp3  

**Why chosen:** ~3 min real calm ocean (Whidbey Island). Continuous beach-wave bed; no choppy stitch needed. HQ preview sufficient after trim to 75 s. Clearly reads as ocean/shore for Beach UI.

---

## Ocean — rejected / fallbacks (not used)

| Candidate | License | Why rejected / status |
|-----------|---------|----------------------|
| **Beach Ocean Waves — jasinski / qubodup** (OGA) wave_01–04 FLACs https://opengameart.org/content/beach-ocean-waves | CC0 | Real beach clips but very short (2–4 s each, ~12 s total). Would need heavy concat/crossfade loops. Downloaded as fallback; **not used** after Freesound HQ preview succeeded. |
| **pkanduth — sea smooth waves novigrad** (Freesound 444217) | CC0 (if confirmed) | Listed as alt #2 if SamsterBirdies failed; not needed. |
| **VistulaShort.mp3 — RandomMind** (OGA “Sea and river wave sounds”) | CC0 | River, not ocean — last-resort only per brief; not used. |
| Pixabay ocean beds | varies | Not pursued once Freesound HQ preview worked. |

---

## Processing summary (both chosen beds)

- Duration target: **~75 s** (within 60–90 s).
- Size target: **under ~1.8 MB** each MP3 → both ~1.17 MB.
- ffmpeg: loudnorm I=-16 TP=-3; soft end fades; MP3 128k + Ogg Vorbis ~96k.
- Output dir: `/workspace/stillpoint-nature-ocean/out/`
- GitHub: **not pushed**.
