# Candidate research — Stillpoint rain + deep rain beds

Chosen 2026-09-23. License bar: **CC0 1.0** with a direct download (same bar as Nature / Beach). No CC-BY-NC. No “login to Freesound” as the only copy.

## Rain (`rain`) — CHOSEN

**Summer Rain on Terrace — Joseph Sardin / BigSoundBank — CC0**  
https://bigsoundbank.com/summer-rain-on-terrace-s1019.html  
Direct: https://bigsoundbank.com/UPLOAD/mp3/1019.mp3  

**Why chosen:** Real stereo field recording (~2:37) of summer rain on a terrace. Open-air drops, no thunder, no traffic bed. Matches the light “Rain” chip. Same author/license path as the Nature brook.

## Deep rain (`fall`) — CHOSEN

**Big rain on car roof — Joseph Sardin / BigSoundBank — CC0**  
https://bigsoundbank.com/big-rain-on-car-roof-s1294.html  
Direct: https://bigsoundbank.com/UPLOAD/mp3/1294.mp3  

**Why chosen:** Denser close rain on a hard surface (~1:22). Reads as heavier than the terrace bed. Source is mono; processed to dual-mono stereo so it matches the other beds in the player.

---

## Rejected / not used

| Candidate | License | Why rejected |
|-----------|---------|--------------|
| Synth rain / deep rain in `sounds.js` | n/a (original code) | User request: replace fake rain. |
| Freesound barkenov #640655 Soft rain | CC0 | Excellent light rain (~1:01) used by rainsoundsforsleeping.com. Full WAV needs Freesound login; HQ preview only. Kept as fallback. https://freesound.org/people/barkenov/sounds/640655/ |
| Freesound barkenov #255900 Hard rain | CC0 | Good heavy backyard rain (~1:04). Same login wall. Fallback. |
| Freesound speakwithanimals #525046 Rain Slowly Passing TREATED LOOP | CC0 | 13:52 treated loop, highly rated. 228 MB WAV, login required. |
| BigSoundBank #2719 Rain and Thunder 4 | CC0 | 34:52 stereo storm. Beautiful, but distant and thunder-led. Too quiet in mid sections; would need cherry-picking. Not used. Direct: https://bigsoundbank.com/UPLOAD/mp3/2719.mp3 |
| BigSoundBank #1289 Rain on concrete | CC0 | Real drops, but short and mono; less body than car-roof. |
| Orange Free Sounds rain loops | CC-BY / CC-BY-NC | Attribution or non-commercial. Skip. |
| Pixabay DRAGON-STUDIO rain loops | Pixabay Content License | Commercial use allowed, but weaker than CC0 and standalone-audio limits. Not needed. |

## Processing (chosen beds)

- Rain: first **75 s** of #1019.
- Deep rain: full #1294 (~82 s), dual-mono stereo.
- `loudnorm` target **I=-16 LUFS, TP=-3 dBTP** (two-pass linear).
- Soft **1.5 s** fade-in / fade-out for HTMLAudio looping.
- Stereo, 44.1 kHz, MP3 **128 kbps**.
- White noise stays synth on purpose (not rain).
