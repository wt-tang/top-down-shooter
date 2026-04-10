class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.speed = 215;
    this.hp = 3;
    this.maxHp = 3;
    this.angle = 0; // facing right by default
    this.invincible = false;
    this.invincibleTimer = 0;
    this.shootCooldown = 0;
    this.walkTimer = 0;
    this.bobTimer = 0;
    this.isMoving = false;
  }

  update(dt, keys, W, H) {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'])  dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    if (keys['ArrowUp'])    dy -= 1;
    if (keys['ArrowDown'])  dy += 1;

    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isMoving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      this.angle = Math.atan2(dy, dx);
      this.walkTimer += dt;
    }

    this.bobTimer += dt;
    this.x = Math.max(this.radius, Math.min(W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(H - this.radius, this.y));

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
  }

  shoot(bullets, effects) {
    if (this.shootCooldown > 0) return false;
    this.shootCooldown = 0.16;
    const gx = this.x + Math.cos(this.angle) * (this.radius + 12);
    const gy = this.y + Math.sin(this.angle) * (this.radius + 12);
    bullets.push(new Bullet(gx, gy, Math.cos(this.angle), Math.sin(this.angle)));
    effects.addMuzzleFlash(gx, gy, this.angle);
    return true;
  }

  takeDamage(effects) {
    if (this.invincible) return false;
    this.hp--;
    this.invincible = true;
    this.invincibleTimer = 1.5;
    effects.addScreenShake(11, 0.32);
    effects.addParticles(this.x, this.y, '#5dade2', 14, 95, 3);
    return true;
  }

  draw(ctx) {
    ctx.save();

    // Invincibility flash
    if (this.invincible && Math.floor(this.invincibleTimer * 8) % 2 === 0) {
      ctx.globalAlpha = 0.25;
    }

    ctx.translate(this.x, this.y);
    const bob = Math.sin(this.bobTimer * 5) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(2, this.radius + 3 + bob, this.radius * 0.75, this.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (animated when moving)
    if (this.isMoving) {
      ctx.save();
      ctx.rotate(this.angle + Math.PI / 2);
      const swing = Math.sin(this.walkTimer * 11) * 0.38;
      ctx.fillStyle = '#1a3b6b';
      ctx.beginPath();
      ctx.ellipse(-6, 14 + bob, 4.5, 7, swing, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(6, 14 + bob, 4.5, 7, -swing, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Outer body
    ctx.fillStyle = '#1f618d';
    ctx.shadowColor = '#5dade2';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner body (lighter)
    ctx.fillStyle = '#2e86c1';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, bob, this.radius * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Gun barrel (rotates with facing direction)
    ctx.save();
    ctx.rotate(this.angle);
    ctx.translate(0, bob);
    ctx.fillStyle = '#444';
    ctx.fillRect(2, -4, 5, 8); // handle
    ctx.fillStyle = '#666';
    ctx.fillRect(6, -3, this.radius + 5, 6); // barrel
    ctx.fillStyle = '#999';
    ctx.fillRect(this.radius + 6, -2, 9, 4); // tip
    ctx.restore();

    // Visor / face (forward-facing glow)
    ctx.save();
    ctx.rotate(this.angle);
    ctx.translate(0, bob);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(10, 0, 7, -0.85, 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.11)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(-5, bob - 7, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
