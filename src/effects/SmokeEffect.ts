import * as PIXI from 'pixi.js'

interface SmokeParticle {
  x: number; y: number; vx: number; vy: number
  radius: number; alpha: number; life: number; g: PIXI.Graphics
}

export class SmokeEffect {
  private container: PIXI.Container
  private particles: SmokeParticle[] = []
  private done = false; private spawnTime = 1.8; private elapsed = 0

  constructor(cx: number, cy: number, parent: PIXI.Container) {
    this.container = new PIXI.Container()
    parent.addChild(this.container)

    // Pre-seed smoke puffs
    for (let i = 0; i < 14; i++) {
      this.spawnParticle(cx + (Math.random()-0.5)*40, cy + (Math.random()-0.5)*20)
    }
  }

  private spawnParticle(x: number, y: number) {
    const g = new PIXI.Graphics()
    const radius = 20 + Math.random() * 30
    const p: SmokeParticle = {
      x, y, vx: (Math.random()-0.5)*15, vy: -(20 + Math.random()*30),
      radius, alpha: 0.4 + Math.random()*0.3, life: 2.0 + Math.random(),
      g,
    }
    this.container.addChild(g)
    this.particles.push(p)
  }

  update = (ticker: PIXI.Ticker) => {
    if (this.done) return
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    let alive = 0
    for (const p of this.particles) {
      if (p.life <= 0) continue
      alive++
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt
      p.radius += 18 * dt; p.alpha = Math.max(0, p.alpha - 0.18 * dt)

      p.g.clear()
      p.g.circle(p.x, p.y, p.radius)
      const gray = 0x888888
      p.g.fill({ color: gray, alpha: p.alpha })
    }

    if (alive === 0 && this.elapsed > this.spawnTime) {
      this.done = true
      ticker.remove(this.update)
      this.container.parent?.removeChild(this.container)
      this.container.destroy({ children: true })
    }
  }
}
