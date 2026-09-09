# Stillpoint audio beds

Sound Design owns the MP3/OGG binaries. This PR only wires the app to these paths:

| Mode (`TYPES` id) | App path |
| --- | --- |
| `sit` | `./audio/stillpoint-sit.mp3` |
| `box` | `./audio/stillpoint-box.mp3` |
| `wind` | `./audio/stillpoint-wind.mp3` |

Do **not** commit placeholder or empty audio files here. Land real assets in a separate Sound Design PR.

Legacy unused bed (kept in repo root): `./nastelbom-meditation.mp3.mp3`.
