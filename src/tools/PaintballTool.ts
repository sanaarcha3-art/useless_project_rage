import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

const PAINT_COLORS = [0xff2244, 0xff8800, 0xffdd00, 0x00cc66, 0x0088ff, 0xcc44ff, 0xff44aa]

export class PaintballTool extends BaseTool {
  readonly name = 'Paintball'; readonly icon = '🎨'; readonly shortcutKey = 4
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    this.audio.play('paintball_hit', 0.6)
    const color = PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)]

    // Central blob
    const splat = new PIXI.Graphics()
    const blobRadius = 18 + Math.random() * 14
    splat.circle(x, y, blobRadius)
    splat.fill({ color, alpha: 0.9 })

    // Splatter drips and dots
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = blobRadius * (0.8 + Math.random() * 1.5)
      const r = 3 + Math.random() * 8
      splat.ellipse(
        x + Math.cos(angle) * dist, y + Math.sin(angle) * dist,
        r, r * (0.4 + Math.random() * 0.8)
      )
      splat.fill({ color, alpha: 0.6 + Math.random() * 0.3 })
    }
    this.overlay.damageLayer.drawInto(splat)
    splat.destroy()

    // Airborne droplet particles
    const particles = new ParticleSystem(x, y, {
      count: 12, colors: [color, color, 0xffffff],
      speed: 80, spread: Math.PI * 2, gravity: 300,
      lifetime: 0.5, sizeMin: 2, sizeMax: 6, alphaStart: 0.8,
    })
    this.overlay.effectsContainer.addChild(particles.container)
    this.overlay.ticker.add(particles.update)
  }

  getScoreValue() { return 5 }
}
