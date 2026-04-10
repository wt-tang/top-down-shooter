// --- Canvas setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 900, H = 600;
canvas.width = W;
canvas.height = H;

// --- Input ---
const keys = {};
const justPressedBuffer = new Set();
let justPressed = new Set();

window.addEventListener('keydown', e => {
  if (!keys[e.key]) justPressedBuffer.add(e.key);
  keys[e.key] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// --- State ---
const STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  VICTORY: 'victory'
};

let state = STATES.MENU;
let player, enemies, bullets, effects, levelManager, score, nextLevelTimer;

function initGame() {
  player = new Player(W / 2, H / 2);
  enemies = [];
  bullets = [];
  effects = new ParticleSystem();
  levelManager = new LevelManager();
  score = 0;
  levelManager.loadLevel(1, W, H);
  state = STATES.PLAYING;
}

// --- Update ---
function update(dt) {
  justPressed = new Set(justPressedBuffer);
  justPressedBuffer.clear();

  if (state === STATES.MENU) {
    if (justPressed.has('Enter') || justPressed.has(' ')) initGame();
    return;
  }

  if (state === STATES.GAME_OVER || state === STATES.VICTORY) {
    effects.update(dt);
    if (justPressed.has('Enter') || justPressed.has(' ') ||
        justPressed.has('r') || justPressed.has('R')) {
      state = STATES.MENU;
    }
    return;
  }

  if (state === STATES.LEVEL_COMPLETE) {
    effects.update(dt);
    nextLevelTimer -= dt;
    if (nextLevelTimer <= 0 || justPressed.has('Enter') || justPressed.has(' ')) {
      levelManager.level++;
      levelManager.loadLevel(levelManager.level, W, H);
      enemies = [];
      bullets = [];
      state = STATES.PLAYING;
    }
    return;
  }

  // === PLAYING ===
  player.update(dt, keys, W, H);

  // Shoot: hold S for continuous fire (rate-limited by shootCooldown)
  if (keys['s'] || keys['S']) {
    player.shoot(bullets, effects);
  }

  // Spawn enemies
  levelManager.update(dt, enemies);

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update(dt, player, levelManager.speedMult);

    // Enemy touches player
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius - 5) {
      if (player.takeDamage(effects)) {
        if (player.hp <= 0) {
          state = STATES.GAME_OVER;
          return;
        }
      }
    }

    if (e.dead) enemies.splice(i, 1);
  }

  // Update bullets & check collision with enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.update(dt, W, H);

    if (b.dead) { bullets.splice(i, 1); continue; }

    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
        if (e.takeDamage(1, effects)) {
          score += e.points;
          levelManager.killedEnemies++;
          enemies.splice(j, 1);
        }
        hit = true;
        break;
      }
    }
    if (hit) { bullets.splice(i, 1); continue; }
  }

  effects.update(dt);

  // Check level complete
  if (levelManager.isComplete(enemies)) {
    if (levelManager.level >= levelManager.maxLevel) {
      state = STATES.VICTORY;
    } else {
      state = STATES.LEVEL_COMPLETE;
      nextLevelTimer = 3.5;
    }
  }
}

// --- Draw ---
function drawBackground() {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.028)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawHUD() {
  // Level (top-left)
  ctx.fillStyle = '#7fb3d3';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.shadowBlur = 0;
  ctx.fillText(`LEVEL  ${levelManager.level} / ${levelManager.maxLevel}`, 18, 28);

  // Enemies remaining
  const onScreen = enemies.length;
  const queued   = levelManager.remaining;
  ctx.fillStyle = '#556';
  ctx.font = '12px monospace';
  ctx.fillText(`ENEMIES: ${onScreen + queued}`, 18, 46);

  // Controls hint
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '11px monospace';
  ctx.fillText('ARROWS move  |  S shoot', 18, H - 30);

  // Score (center top)
  ctx.fillStyle = '#ffe066';
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${score} PTS`, W / 2, 30);
  ctx.shadowBlur = 0;

  // Hearts (top-right)
  ctx.textAlign = 'right';
  for (let i = 0; i < player.maxHp; i++) {
    ctx.fillStyle = i < player.hp ? '#e74c3c' : 'rgba(255,255,255,0.12)';
    ctx.font = '22px sans-serif';
    ctx.fillText('♥', W - 14 - i * 28, 32);
  }

  // Progress bar (bottom)
  const bx = 18, by = H - 18, bw = W - 36, bh = 7;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(bx, by, bw, bh);

  const prog = levelManager.progress;
  if (prog > 0) {
    ctx.fillStyle = '#4a90e2';
    ctx.shadowColor = '#4a90e2';
    ctx.shadowBlur = 10;
    ctx.fillRect(bx, by, bw * prog, bh);
    ctx.shadowBlur = 0;
  }

  ctx.textAlign = 'left';
}

function drawOverlay(title, line1, line2, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 35;
  ctx.font = 'bold 54px monospace';
  ctx.fillText(title, W / 2, H / 2 - 38);
  ctx.shadowBlur = 0;

  // Line 1
  ctx.fillStyle = '#ddd';
  ctx.font = '22px monospace';
  ctx.fillText(line1, W / 2, H / 2 + 14);

  // Line 2 (hint)
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '14px monospace';
  ctx.fillText(line2, W / 2, H / 2 + 52);

  ctx.textAlign = 'left';
}

function drawMenuScreen() {
  drawBackground();

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#4a90e2';
  ctx.shadowColor = '#4a90e2';
  ctx.shadowBlur = 42;
  ctx.font = 'bold 60px monospace';
  ctx.fillText('TOP-DOWN', W / 2, H / 2 - 75);

  ctx.fillStyle = '#ffe066';
  ctx.shadowColor = '#ffe066';
  ctx.font = 'bold 60px monospace';
  ctx.fillText('SHOOTER', W / 2, H / 2 - 10);
  ctx.shadowBlur = 0;

  // Controls
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '15px monospace';
  ctx.fillText('ARROW KEYS  —  move', W / 2, H / 2 + 52);
  ctx.fillText('S           —  shoot', W / 2, H / 2 + 76);

  // Enemy legend
  ctx.fillStyle = '#e74c3c';
  ctx.font = '13px monospace';
  ctx.fillText('● Runner  (fast, 1 HP)', W / 2, H / 2 + 108);
  ctx.fillStyle = '#8e44ad';
  ctx.fillText('⬡ Brute   (slow, 4 HP)', W / 2, H / 2 + 126);
  ctx.fillStyle = '#e67e22';
  ctx.fillText('✦ Dasher  (dashes, 2 HP)', W / 2, H / 2 + 144);

  // Start prompt
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 14;
  ctx.font = 'bold 17px monospace';
  ctx.fillText('PRESS  SPACE  OR  ENTER  TO  START', W / 2, H / 2 + 178);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function draw() {
  if (state === STATES.MENU) {
    drawMenuScreen();
    return;
  }

  // Draw game world (with screen shake)
  ctx.save();
  ctx.translate(effects.shakeX, effects.shakeY);
  drawBackground();
  if (bullets)  for (const b of bullets)  b.draw(ctx);
  if (enemies)  for (const e of enemies)  e.draw(ctx);
  if (player)   player.draw(ctx);
  if (effects)  effects.draw(ctx);
  ctx.restore();

  // HUD (no shake)
  if (player) drawHUD();

  // Overlays
  if (state === STATES.LEVEL_COMPLETE) {
    const next = levelManager.level + 1;
    const sec  = Math.max(0, Math.ceil(nextLevelTimer));
    drawOverlay(
      'LEVEL CLEAR!',
      `Score: ${score} pts`,
      `Level ${next} begins in ${sec}s  —  SPACE to skip`,
      '#2ecc71'
    );
  } else if (state === STATES.GAME_OVER) {
    drawOverlay(
      'GAME OVER',
      `Final Score: ${score} pts`,
      'ENTER or R to return to menu',
      '#e74c3c'
    );
  } else if (state === STATES.VICTORY) {
    drawOverlay(
      'VICTORY!',
      `All ${levelManager.maxLevel} levels cleared  ·  ${score} pts`,
      'ENTER to play again',
      '#ffe066'
    );
  }
}

// --- Game Loop ---
let lastTime = 0;

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta at 50 ms
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(t => { lastTime = t; loop(t); });
