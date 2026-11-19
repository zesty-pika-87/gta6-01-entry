# Solara Bay — Make GTA 6 (gta6-01)

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/zesty-pika-87/gta6-01-entry/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/zesty-pika-87/gta6-01-entry/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![three.js 0.187.0](https://img.shields.io/badge/three.js-0.187.0-blue)](https://threejs.org/)

An open-world story game for the [make.fun **gta6-01 — Make GTA 6** bounty](https://make.fun/bounty/gta6-01): one courier, one sun-soaked city, eight jobs — and the law never far behind.

## Play

Walk the streets of **Solara Bay**, steal any car, outrun the Solara Bay police, and finish all eight named story missions to take the Crown.

- **WASD / arrows** — walk & drive · **E** — enter / steal a car · **F** — shoot · **Shift** — brake · **M** — mission board · **P** — pause · **Space** — start / restart
- **8 story missions** from Mara Voss, Old Sal and The Broker: courier runs, crate pickups, a 2-star getaway, the gold Comet GT heist, a 4-gate street race, a rooftop signal, a midnight tow, and the final Solara Crown under a 4-star storm.
- **Wanted system**: 1–5 stars, interceptors that chase and ram, roadblocks of intent, and a police helicopter at 4+ stars. Stay fast and far to cool the heat — or get busted and lose half your cash.
- **Living city**: traffic on the street grid, pedestrians on the sidewalks, traffic lights, a beach with palms and the sea, golden-hour lighting, a round minimap, and a sparse HUD (money, wanted stars, health, speed, one-line objective, CHAIN combo).
- **Feel & sound**: camera shake, hit flash, particles, procedural WebAudio engine hum, sirens, and a generative sunny music loop. Progress saves to localStorage.

## Tech

- three.js **0.187.0**, vendored under `game/vendor/` (MIT, see `game/vendor/THREE-LICENSE.txt`) — zero network requests, fully offline.
- Source split one job per file: `world.js` (rules), `render.js` (three.js scene), `traffic.js`, `pedestrians.js`, `police.js`, `missions.js`, `vehicles.js`, `combat.js`, `particles.js`, `feel.js`, `audio.js`, `music.js`, `minimap.js`, `hud.js`, `save.js`, `input.js`, `config.js`.
- Deterministic screenshot staging: `?shot=start|play|garage|end&seed=N` + `window.__shotReady` (see `shots.json`).
- Serve locally: `node serve.ts`, then open http://localhost:8080.

## Screenshots

1. `1-chase.jpg` — 3-star chase down Sunset Boulevard · 2. `2-start.jpg` — title · 3. `3-missions.jpg` — mission board · 4. `4-victory.jpg` — Solara Crown secured.

## License

MIT. See [LICENSE](LICENSE).
