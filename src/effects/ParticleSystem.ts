import * as PIXI from 'pixi.js'

export interface ParticleOptions {
  count: number
  colors: number[]
  speed: number        // pixels/sec base speed
  spread: number       // arc in radians (Math.PI*2 = full circle)
  gravity: number      // pixels/sec²
  lifetime: number     // seconds
  sizeMin: number
  sizeMax: number
  /** Direction of the center of the spread cone (default: upward = -Math.PI/2) */
  direction?: number
  /** Alpha start (default 1) */
  alphaStart?: number
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
  color: number
  g: PIXI.Graphics
}

/**
 * ParticleSystem
 * ──────────────
 * Spawns a burst of debris/spark particles at (cx, cy) with configurable
 * physics. Automatically removes itself from the ticker once all particles
 * have expired.
 */
export class ParticleSystem {
  public container: PIXI.Container
  private particles: Particle[] = []
  private done = false

  constructor(cx: number, cy: number, opts: ParticleOptions) {
    this.container = new PIXI.Container()
    const dir = opts.direction ?? -Math.PI / 2   // default: upward
    const halfSpread = opts.spread / 2
    const alphaStart = opts.alphaStart ?? 1

    for (let i = 0; i < opts.count; i++) {
      const angle = dir - halfSpread + Math.random() * opts.spread
      const speed = opts.speed * (0.5 + Math.random() * 0.8)
      const life = opts.lifetime * (0.6 + Math.random() * 0.8)
      const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin)
      const color = opts.colors[Math.floor(Math.random() * opts.colors.length)]

      const g = new PIXI.Graphics()
      g.rect(-size / 2, -size / 2, size, size)
      g.fill({ color, alpha: alphaStart })
      g.x = cx
      g.y = cy

      this.container.addChild(g)
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, maxLife: life,
        size, color, g,
      })
    }
  }

  /** Bound ticker update — pass to overlay.ticker.add() */
  update = (ticker: PIXI.Ticker) => {
    if (this.done) return
    const dt = ticker.deltaMS / 1000
    let alive = 0

    for (const p of this.particles) {
      if (p.life <= 0) continue
      alive++

      p.vy += 400 * dt       // gravity (pixels/sec²)
      p.vx *= 0.98           // air resistance
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt

      const progress = 1 - p.life / p.maxLife
      p.g.x = p.x
      p.g.y = p.y
      p.g.alpha = Math.max(0, 1 - progress * 1.5)
      // Slight rotation for tumbling feel
      p.g.rotation += 0.1
    }

    if (alive === 0) {
      this.done = true
      this.container.parent?.removeChild(this.container)
      this.container.destroy({ children: true })
    }
  }
}
