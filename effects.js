class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeDur = 0;
    this.shakeIntensity = 0;
  }

  addParticles(x, y, color, count, speed, size = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: size * (0.5 + Math.random() * 0.5),
        life: 1.0,
        decay: 1.2 + Math.random() * 1.5
      });
    }
  }

  addMuzzleFlash(x, y, angle) {
    for (let i = 0; i < 7; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const spd = 80 + Math.random() * 180;
      this.particles.push({
        x, y,
        vx: Math.cos(angle + spread) * spd,
        vy: Math.sin(angle + spread) * spd,
        color: Math.random() > 0.5 ? '#ffffff' : '#ffe066',
        size: 1.5 + Math.random() * 2.5,
        life: 1.0,
        decay: 6 + Math.random() * 4
      });
    }
  }

  addScreenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDur = duration;
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.life -= p.decay * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.shakeDur > 0) {
      this.shakeDur -= dt;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      if (this.shakeDur <= 0) { this.shakeX = 0; this.shakeY = 0; }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
