import * as PIXI from 'pixi.js'
import { OverlayManager } from '../overlay/OverlayManager'

interface CrackSegment {
  x1: number; y1: number; x2: number; y2: number
  alpha: number; width: number
  d1: number; d2: number
}

export interface HitRecord {
  x: number; y: number; time: number
}

/**
 * CrackEffect
 * ───────────
 * Draws procedural radial cracks emanating from an impact point.
 * Animated over ~150ms to look realistic, then stamped into DamageLayer.
 */
export class CrackEffect {
  private g: PIXI.Graphics
  private overlay: OverlayManager
  private cx: number; private cy: number
  private hitCount: number

  private segments: CrackSegment[] = []
  private maxDist = 0
  private elapsed = 0
  private readonly DURATION = 0.15

  constructor(cx: number, cy: number, hitCount: number, overlay: OverlayManager) {
    this.cx = cx
    this.cy = cy
    this.hitCount = hitCount
    this.overlay = overlay

    this.g = new PIXI.Graphics()
    this.overlay.effectsContainer.addChild(this.g)

    this.generateGeometry()
    this.overlay.ticker.add(this.update)
  }

  private generateGeometry() {
    const { cx, cy, hitCount } = this
    const numArms = 5 + hitCount * 2
    const maxLength = 40 + hitCount * 30
    const branchProbability = Math.min(0.8, 0.3 + hitCount * 0.1)
    const rng = mulberry32(cx * 1000 + cy + hitCount * 7)

    for (let i = 0; i < numArms; i++) {
      const baseAngle = (i / numArms) * Math.PI * 2 + rng() * 0.4
      this.generateArm(cx, cy, baseAngle, maxLength, rng, branchProbability, 0)
    }
  }

  private generateArm(
    x: number, y: number,
    angle: number, length: number,
    rng: () => number, branchProb: number, depth: number
  ) {
    if (length < 5 || depth > 3) return

    const segmentsCount = 3 + Math.floor(rng() * 3)
    let curX = x, curY = y, curAngle = angle

    for (let s = 0; s < segmentsCount; s++) {
      const segLen = (length / segmentsCount) * (0.7 + rng() * 0.6)
      curAngle += (rng() - 0.5) * 0.6

      const nextX = curX + Math.cos(curAngle) * segLen
      const nextY = curY + Math.sin(curAngle) * segLen

      const alpha = Math.max(0.3, 0.9 - depth * 0.2)
      const lineWidth = Math.max(0.5, 2 - depth * 0.5)

      const d1 = Math.hypot(curX - this.cx, curY - this.cy)
      const d2 = Math.hypot(nextX - this.cx, nextY - this.cy)

      this.segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY, alpha, width: lineWidth, d1, d2 })
      if (d2 > this.maxDist) this.maxDist = d2

      curX = nextX; curY = nextY

      if (rng() < branchProb && depth < 2) {
        const branchAngle = curAngle + (rng() > 0.5 ? 1 : -1) * (0.4 + rng() * 0.5)
        this.generateArm(curX, curY, branchAngle, length * 0.4 * rng(), rng, branchProb * 0.5, depth + 1)
      }
    }
  }

  private update = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    const t = Math.min(1, this.elapsed / this.DURATION)
    const easeOutCubic = 1 - Math.pow(1 - t, 3)
    const currentMaxDist = easeOutCubic * this.maxDist

    this.g.clear()

    // Central shatter circle
    this.g.circle(this.cx, this.cy, 4 + this.hitCount * 2)
    this.g.fill({ color: 0x222222, alpha: 0.9 })

    for (const seg of this.segments) {
      if (seg.d1 > currentMaxDist) continue

      let endX = seg.x2
      let endY = seg.y2

      if (seg.d2 > currentMaxDist) {
        const prog = (currentMaxDist - seg.d1) / (seg.d2 - seg.d1)
        endX = seg.x1 + (seg.x2 - seg.x1) * prog
        endY = seg.y1 + (seg.y2 - seg.y1) * prog
      }

      this.g.moveTo(seg.x1, seg.y1)
      this.g.lineTo(endX, endY)
      this.g.stroke({ color: 0x111111, alpha: seg.alpha, width: seg.width })
    }

    if (t >= 1) {
      this.overlay.ticker.remove(this.update)
      this.overlay.damageLayer.drawInto(this.g)
      this.g.parent?.removeChild(this.g)
      this.g.destroy()
    }
  }
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
