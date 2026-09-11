import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { ScreenShakeEffect } from '../effects/ScreenShakeEffect'
import { SmokeEffect } from '../effects/SmokeEffect'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

export class BlackHoleTool extends BaseTool {
  readonly name = 'Black Hole'; readonly icon = '🌀'; readonly shortcutKey = 6
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    this.audio.play('blackhole_whoosh', 0.8)

    const container = new PIXI.Container()
    this.overlay.effectsContainer.addChild(container)

    const core = new PIXI.Graphics()
    core.x = x; core.y = y
    const rings: PIXI.Graphics[] = []
    for (let i = 0; i < 4; i++) {
      const ring = new PIXI.Graphics()
      ring.x = x; ring.y = y
      rings.push(ring)
      container.addChild(ring)
    }
    container.addChild(core)

    let elapsed = 0
    const DURATION = 2.5
    const MAX_RADIUS = 80

    const tick = (ticker: PIXI.Ticker) => {
      elapsed += ticker.deltaMS / 1000
      const t = Math.min(1, elapsed / DURATION)
      const radius = MAX_RADIUS * Math.sin(t * Math.PI) // grow then shrink
      const rotation = elapsed * 5

      core.clear()
      core.circle(0, 0, radius * 0.4)
      core.fill({ color: 0x000000, alpha: 1 })
      // Glowing rim
      core.circle(0, 0, radius * 0.45)
      core.stroke({ color: 0x6600cc, alpha: 0.8, width: 4 })

      rings.forEach((ring, i) => {
        ring.clear()
        const r = radius * (0.5 + i * 0.2)
        ring.ellipse(0, 0, r, r * 0.25)
        ring.stroke({ color: i === 0 ? 0xaa44ff : 0x5500bb, alpha: 1 - i * 0.2, width: 2 + (4 - i) })
        ring.rotation = rotation + i * 1.2
      })

      // Suck in nearby particles
      for (const child of this.overlay.effectsContainer.children) {
        if (child === container) continue
        const dx = x - child.x; const dy = y - child.y
        const dist = Math.hypot(dx, dy)
        if (dist < 300 && dist > 5) {
          const pull = (1 - dist / 300) * 150 * (ticker.deltaMS / 1000)
          child.x += (dx / dist) * pull
          child.y += (dy / dist) * pull
        }
      }

      if (elapsed >= DURATION) {
        this.overlay.ticker.remove(tick)
        // Final implosion burst
        const burst = new ParticleSystem(x, y, {
          count: 30, colors: [0x8800ff, 0x4400aa, 0xffffff],
          speed: 200, spread: Math.PI * 2, gravity: 100,
          lifetime: 0.6, sizeMin: 2, sizeMax: 6,
        })
        this.overlay.effectsContainer.addChild(burst.container)
        this.overlay.ticker.add(burst.update)
        container.parent?.removeChild(container)
        container.destroy({ children: true })

        const shake = new ScreenShakeEffect(this.overlay.stage, 10, 0.3)
        this.overlay.ticker.add(shake.update)
      }
    }
    this.overlay.ticker.add(tick)
  }

  getScoreValue() { return 150 }
}
