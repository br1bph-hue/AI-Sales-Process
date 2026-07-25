# GRIDIRON PRIME — broadcast-style football in Three.js

A playable, broadcast-presented American football game rendered entirely in Three.js —
night game, floodlit stadium, animated crowd, score bug, play-calling, commentary, and
a drive/possession loop. Built as a "how close can a browser demo get to Madden's
broadcast look" exercise, with every subsystem reviewed by adversarial visual critics
against real Madden broadcast standards.

## Run it

Serve the folder statically (ES modules require http):

```bash
cd madden-sim
python3 -m http.server 8371
# open http://127.0.0.1:8371
```

No build step, no external network — Three.js 0.160 is vendored in `vendor/`.

## How to play

- Click the title screen to kick off. You are the **Navy Bay Admirals** (offense).
- **1–6** (or click a card) to call a play; **P** punt, **K** field goal on any down.
- Pass plays: **Q / W / E / R** throw to WR-left / slot / WR-right / TE.
- After the catch (or handoff): **arrows / WASD** steer the ball carrier, **Shift** sprints.
- Drives resolve with downs, first-down chains, TDs, INTs, sacks; opponent drives are
  simulated between your possessions. Four 5:00 quarters.

## Architecture (`src/`)

| Module | Responsibility |
|---|---|
| `main.js` | Renderer, lighting, fixed-timestep loop, input, state wiring, blob shadows |
| `field.js` | Canvas-painted turf (mow stripes, numerals, hashes, baked floodlight pools), goal posts, LOS/first-down broadcast lines |
| `stadium.js` | Two-tier bowl, 26k-instance weighted crowd, LED ribbons, ad boards, light towers with glare, jumbotron, sky/stars, camera flashes |
| `players.js` | Procedural articulated athletes (helmet/facemask/pads/numbers), procedural run/stance/throw/tackle animation, the ball |
| `gameplay.js` | Playbook, routes, offensive/defensive AI, blocking, ball physics, tackling, downs/possessions/clock |
| `cameras.js` | Broadcast sideline cam with dynamic FOV, end-zone, celebration and blimp cams |
| `hud.js` | Score bug, banners, play-call cards with route diagrams, lower-third |
| `commentary.js` | Two-man booth lines keyed to game events |

Simulation runs at a fixed 60 Hz timestep decoupled from render rate, so game speed
is identical on any machine (including headless captures).
