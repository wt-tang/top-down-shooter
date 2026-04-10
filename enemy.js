class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.dead = false;
    this.hitFlash = 0;
    this.angle = 0;
    this.animTimer = 0;
    this.scale = 1;

    switch (type) {
      case 'runner':
        this.hp = this.maxHp = 1;
        this.speed = 115;
        this.radius = 14;
        this.color = '#e74c3c';
        this.glow  = '#ff6b6b';
        this.points = 10;
        break;
      case 'brute':
        this.hp = this.maxHp = 4;
        this.speed = 52;
        this.radius = 24;
        this.color = '#8e44ad';
        this.glow  = '#c39bd3';
        this.points = 30;
        break;
      case 'dasher':
        this.hp = this.maxHp = 2;
        this.speed = 88;
        this.radius = 16;
        this.color = '#e67e22';
        this.glow  = '#f39c12';
        this.points = 20;
        this.dashPhase = 'pursue';
        this.dashTimer = 1.0 + Math.random() * 1.5;
        this.dashVx = 0;
        this.dashVy = 0;
        this.chargeTimer = 0;
        this.dashDur = 0;
        break;
    }
  }

  update(dt, player, speedMult) {
    this.animTimer += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt * 6;
    if (this.scale > 1) this.scale = Math.max(1, this.scale - dt * 5);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);

    if (this.type === 'dasher') {
      this._updateDasher(dt, dx / dist, dy / dist, speedMult);
    } else {
      this.x += (dx / dist) * this.speed * speedMult * dt;
      this.y += (dy / dist) * this.speed * speedMult * dt;
    }
  }

  _updateDasher(dt, ndx, ndy, speedMult) {
    if (this.dashPhase === 'pursue') {
      this.x += ndx * this.speed * speedMult * dt;
      this.y += ndy * this.speed * speedMult * dt;
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.dashPhase = 'charge';
        this.chargeTimer = 0.45;
        this.dashVx = ndx * 500 * speedMult;
        this.dashVy = ndy * 500 * speedMult;
      }
    } else if (this.dashPhase === 'charge') {
      this.x += Math.sin(this.animTimer * 28) * 0.7;
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.dashPhase = 'dash';
        this.dashDur = 0.22;
      }
    } else if (this.dashPhase === 'dash') {
      this.x += this.dashVx * dt;
      this.y += this.dashVy * dt;
      this.dashDur -= dt;
      if (this.dashDur <= 0) {
        this.dashPhase = 'pursue';
        this.dashTimer = 1.2 + Math.random() * 1.5;
      }
    }
  }

  takeDamage(dmg, effects) {
    this.hp -= dmg;
    this.hitFlash = 1;
    this.scale = 1.35;
    if (this.hp <= 0) {
      this.dead = true;
      effects.addParticles(this.x, this.y, this.color, 22, 140, this.radius * 0.35);
      effects.addParticles(this.x, this.y, '#ffffff', 8, 70, 2);
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    if (this.type === 'runner')      this._drawRunner(ctx);
    else if (this.type === 'brute')  this._drawBrute(ctx);
    else if (this.type === 'dasher') this._drawDasher(ctx);

    // HP bar for tanky enemies
    if (this.maxHp > 1) {
      const bw = this.radius * 2.4;
      const by = -this.radius - 11;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-bw / 2, by, bw, 4);
      ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(-bw / 2, by, bw * (this.hp / this.maxHp), 4);
    }

    ctx.restore();
  }

  _drawRunner(ctx) {
    const flash = this.hitFlash > 0;
    const t = this.animTimer;
    const bob = Math.sin(t * 9) * 2;

    // Rotating spikes
    ctx.save();
    ctx.rotate(t * 3.5);
    ctx.fillStyle = flash ? '#fff' : '#c0392b';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(this.radius - 2, -3);
      ctx.lineTo(this.radius + 8, 0);
      ctx.lineTo(this.radius - 2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Body
    ctx.fillStyle = flash ? '#ffffff' : this.color;
    ctx.shadowColor = this.glow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes facing player
    ctx.save();
    ctx.rotate(this.angle);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.arc(8, -4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(9.5, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9.5, 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBrute(ctx) {
    const flash = this.hitFlash > 0;
    const t = this.animTimer;
    const bob = Math.sin(t * 3) * 1.5;

    // Hexagon body
    ctx.fillStyle = flash ? '#ffffff' : this.color;
    ctx.shadowColor = this.glow;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const px = Math.cos(a) * this.radius;
      const py = Math.sin(a) * this.radius + bob;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Inner belly
    ctx.fillStyle = flash ? '#fff' : 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, bob, this.radius * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Large eyes
    ctx.save();
    ctx.rotate(this.angle);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.arc(12, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(14, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawDasher(ctx) {
    const flash = this.hitFlash > 0;
    const t = this.animTimer;
    const isDash   = this.dashPhase === 'dash';
    const isCharge = this.dashPhase === 'charge';
    const bob = Math.sin(t * 7) * 2;

    // Charge pulse ring
    if (isCharge) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.abs(Math.sin(t * 25)) * 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Star body (spins when dashing)
    ctx.save();
    ctx.rotate(t * (isDash ? 9 : 1.8));
    ctx.fillStyle = flash ? '#ffffff' : this.color;
    ctx.shadowColor = this.glow;
    ctx.shadowBlur = isDash ? 30 : 14;
    ctx.beginPath();
    const pts = 4;
    for (let i = 0; i < pts * 2; i++) {
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 4;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.44;
      i === 0
        ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r + bob)
        : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r + bob);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Eye
    ctx.save();
    ctx.rotate(this.angle);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(9, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(10.5, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
