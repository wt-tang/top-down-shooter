class Bullet {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = 600;
    this.radius = 5;
    this.dead = false;
    this.trail = [];
    this.angle = Math.atan2(dy, dx);
  }

  update(dt, canvasW, canvasH) {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.pop();

    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;

    if (this.x < -40 || this.x > canvasW + 40 ||
        this.y < -40 || this.y > canvasH + 40) {
      this.dead = true;
    }
  }

  draw(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const frac = 1 - i / this.trail.length;
      ctx.save();
      ctx.globalAlpha = frac * 0.35;
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * frac * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bullet body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(-3, 0, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
