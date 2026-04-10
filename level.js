class LevelManager {
  constructor() {
    this.level = 1;
    this.maxLevel = 10;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.totalEnemies = 0;
    this.killedEnemies = 0;
    this.speedMult = 1;
    this.canvasW = 900;
    this.canvasH = 600;
  }

  loadLevel(level, canvasW, canvasH) {
    this.level = level;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.killedEnemies = 0;
    this.speedMult = 1 + (level - 1) * 0.1; // +10% speed per level

    let runners, brutes, dashers;
    if      (level === 1) { runners = 10; brutes = 0; dashers = 0; }
    else if (level === 2) { runners = 14; brutes = 3; dashers = 0; }
    else if (level === 3) { runners = 18; brutes = 5; dashers = 4; }
    else {
      const e = level - 3;
      runners = 18 + e * 4;
      brutes  = 5  + e;
      dashers = 4  + e * 2;
    }

    this.totalEnemies = runners + brutes + dashers;
    this.spawnQueue = [
      ...Array(runners).fill('runner'),
      ...Array(brutes).fill('brute'),
      ...Array(dashers).fill('dasher'),
    ];

    // Shuffle spawn order
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }

    this.spawnTimer = 0.9;
    this.spawnInterval = Math.max(0.32, 1.1 - level * 0.06);
  }

  update(dt, enemies) {
    if (this.spawnQueue.length === 0) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval;
      const type = this.spawnQueue.shift();
      const [x, y] = this._randomEdgePos();
      enemies.push(new Enemy(x, y, type));
    }
  }

  _randomEdgePos() {
    const W = this.canvasW, H = this.canvasH, m = 38;
    switch (Math.floor(Math.random() * 4)) {
      case 0: return [Math.random() * W, -m];
      case 1: return [Math.random() * W, H + m];
      case 2: return [-m, Math.random() * H];
      default: return [W + m, Math.random() * H];
    }
  }

  isComplete(enemies) {
    return this.spawnQueue.length === 0 && enemies.length === 0;
  }

  // Enemies still to spawn + enemies currently on screen
  get remaining() {
    return this.spawnQueue.length;
  }

  get progress() {
    if (this.totalEnemies === 0) return 1;
    return this.killedEnemies / this.totalEnemies;
  }
}
