import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { CrackEffect } from '../effects/CrackEffect'
import { ParticleSystem } from '../effects/ParticleSystem'
import { ScreenShakeEffect } from '../effects/ScreenShakeEffect'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

export class AxeTool extends BaseTool {
  readonly name = 'Axe'; readonly icon = '🪓'; readonly shortcutKey = 3
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    this.audio.play('axe_slash', 0.8)

    // Animated deep gouge slash mark
    const slash = new PIXI.Graphics()
    this.overlay.effectsContainer.addChild(slash)
    const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.4
    const len = 80 + Math.random() * 60
    
    // Start and end points of the slash
    const sx = x - Math.cos(angle) * len / 2
    const sy = y - Math.sin(angle) * len / 2
    const ex = x + Math.cos(angle) * len / 2
    const ey = y + Math.sin(angle) * len / 2

    // Secondary slash points
    const sx2 = x - Math.cos(angle + 0.2) * len * 0.6
    const sy2 = y - Math.sin(angle + 0.2) * len * 0.6
    const ex2 = x + Math.cos(angle + 0.2) * len * 0.6
    const ey2 = y + Math.sin(angle + 0.2) * len * 0.6

    let elapsed = 0
    const DURATION = 0.15

    const animSlash = (ticker: PIXI.Ticker) => {
      elapsed += ticker.deltaMS / 1000
      const t = Math.min(1, elapsed / DURATION)
      // Fast start, slow end easing
      const progress = 1 - Math.pow(1 - t, 3)

      slash.clear()
      // Main slash
      slash.moveTo(sx, sy)
      slash.lineTo(sx + (ex - sx) * progress, sy + (ey - sy) * progress)
      slash.stroke({ color: 0x111111, alpha: 0.95, width: 6 })
      // Secondary thinner slash
      slash.moveTo(sx2, sy2)
      slash.lineTo(sx2 + (ex2 - sx2) * progress, sy2 + (ey2 - sy2) * progress)
      slash.stroke({ color: 0x222222, alpha: 0.7, width: 2 })

      if (t >= 1) {
        this.overlay.ticker.remove(animSlash)
        this.overlay.damageLayer.drawInto(slash)
        slash.parent?.removeChild(slash)
        slash.destroy()
      }
    }
    this.overlay.ticker.add(animSlash)

    new CrackEffect(x, y, 3, this.overlay)

    // Larger, faster, more dramatic wood/debris chunks
    const particles = new ParticleSystem(x, y, {
      count: 16, colors: [0x8B4513, 0xA0522D, 0xD2691E, 0x555555, 0x888888],
      speed: 200, spread: Math.PI * 1.4, gravity: 500,
      lifetime: 0.7, sizeMin: 3, sizeMax: 8,
      direction: angle - Math.PI / 2,
    })
    this.overlay.effectsContainer.addChild(particles.container)
    this.overlay.ticker.add(particles.update)

    const shake = new ScreenShakeEffect(this.overlay.stage, 6, 0.3)
    this.overlay.ticker.add(shake.update)
  }

  getScoreValue() { return 15 }
}
