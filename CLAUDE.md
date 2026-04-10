# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser — no build step, no server required:

```
open index.html
```

There are no dependencies, package managers, or transpilation steps.

## Architecture

The game is a plain-JS HTML5 Canvas application. Scripts are loaded in order via `<script>` tags in `index.html` — later files depend on earlier ones:

```
effects.js → bullet.js → enemy.js → player.js → level.js → main.js
```

All game state lives as module-level variables in `main.js`: `player`, `enemies`, `bullets`, `effects`, `levelManager`, `score`, `state`.

### Game Loop

`main.js` runs a `requestAnimationFrame` loop calling `update(dt)` then `draw()` each frame. Delta time (`dt`) is capped at 50 ms to prevent physics explosions on tab-unfocus. All movement is `velocity × dt` so it is frame-rate independent.

### State Machine

`state` is one of `STATES = { MENU, PLAYING, LEVEL_COMPLETE, GAME_OVER, VICTORY }`. The `update()` function switches on state and returns early for non-playing states — only `PLAYING` runs physics and collision.

### Input

Two structures track keyboard input:
- `keys` — live held-key map (`keydown`/`keyup`)
- `justPressed` — set populated at the top of each `update()` from a `justPressedBuffer`, then cleared. Used for one-shot actions (menu navigation). Shooting uses `keys` (held) so players can hold S.

### Entity Classes

Each entity is a self-contained class with `update(dt, ...)` and `draw(ctx)` methods. All drawing is pure Canvas 2D — no images or sprite sheets.

| File | Class | Key methods |
|------|-------|-------------|
| `player.js` | `Player` | `update(dt, keys, W, H)`, `shoot(bullets, effects)`, `takeDamage(effects)` |
| `enemy.js` | `Enemy` | `update(dt, player, speedMult)`, `takeDamage(dmg, effects)` — type set in constructor |
| `bullet.js` | `Bullet` | `update(dt, W, H)` — sets `this.dead = true` when off-screen |
| `effects.js` | `ParticleSystem` | `addParticles(...)`, `addMuzzleFlash(...)`, `addScreenShake(...)` |
| `level.js` | `LevelManager` | `loadLevel(level, W, H)`, `update(dt, enemies)` — drains `spawnQueue` on a timer |

### Enemy Types

All three types are a single `Enemy` class, branched by `this.type` in the constructor and draw methods:

- `'runner'` — direct pursuit, 1 HP, rotating spikes
- `'brute'` — direct pursuit, 4 HP, hexagon body, HP bar shown
- `'dasher'` — state machine: `pursue → charge → dash → pursue`, 2 HP, star shape

### Collision Detection

All collisions are circle-circle: `Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius`. No spatial partitioning — fine for current enemy counts.

### Level Progression

`LevelManager.loadLevel(n)` builds a shuffled `spawnQueue` array of type strings and drains it one enemy at a time on a timer (`spawnInterval`, shrinks per level). `speedMult = 1 + (level - 1) * 0.1` is passed into every `enemy.update()` call. Level is complete when `spawnQueue` is empty and `enemies.length === 0`.

## Git & GitHub

This repo is pushed to **github.com/wt-tang/top-down-shooter**. Make a focused commit after each meaningful change:

```bash
git add <files>
git commit -m "Short summary of what changed"
git push
```
