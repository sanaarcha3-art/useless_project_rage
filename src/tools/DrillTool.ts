import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { ScreenShakeEffect } from '../effects/ScreenShakeEffect'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

export class DrillTool extends BaseTool {
  readonly name = 'Drill'; readonly icon = '🔩'; readonly shortcutKey = 2
  private overlay: OverlayManager; private audio: AudioManager
  private holding = false; private cx = 0; private cy = 0
  private elapsed = 0; private drillGraphic: PIXI.Graphics | null = null
  private tickFn: ((ticker: PIXI.Ticker) => void) | null = null

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(_x: number, _y: number) {}

  startHold(x: number, y: number) {
    this.holding = true; this.cx = x; this.cy = y; this.elapsed = 0
    this.audio.play('drill', 0.7)
    this.drillGraphic = new PIXI.Graphics()
    this.overlay.effectsContainer.addChild(this.drillGraphic)
    this.tickFn = (ticker: PIXI.Ticker) => this.onTick(ticker)
    this.overlay.ticker.add(this.tickFn)
  }

  private onTick(ticker: PIXI.Ticker) {
    if (!this.holding || !this.drillGraphic) return
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt
    // Spiraling hole grows over time
    const radius = 8 + this.elapsed * 18
    this.drillGraphic.clear()
    this.drillGraphic.circle(this.cx, this.cy, radius)
    this.drillGraphic.fill({ color: 0x111111, alpha: 0.85 })
    // Concentric damage rings
    for (let r = radius * 0.3; r < radius; r += 8) {
      this.drillGraphic.circle(this.cx, this.cy, r)
      this.drillGraphic.stroke({ color: 0x333333, alpha: 0.5, width: 1 })
    }
    // Scatter metal shavings periodically
    if (Math.random() < 0.3) {
      const p = new ParticleSystem(this.cx + (Math.random()-0.5)*radius, this.cy + (Math.random()-0.5)*radius, {
        count: 2, colors: [0xaaaaaa, 0x888888], speed: 60, spread: Math.PI * 2,
        gravity: 200, lifetime: 0.4, sizeMin: 1, sizeMax: 3,
      })
      this.overlay.effectsContainer.addChild(p.container)
      this.overlay.ticker.add(p.update)
    }
  }

  updateHold(_x: number, _y: number, _dt: number) {} // handled by ticker

  endHold() {
    this.holding = false
    this.audio.stop('drill')
    // Stamp final hole into damage layer
    if (this.drillGraphic) {
      this.overlay.damageLayer.drawInto(this.drillGraphic)
      this.drillGraphic.parent?.removeChild(this.drillGraphic)
      this.drillGraphic.destroy()
      this.drillGraphic = null
    }
    if (this.tickFn) { this.overlay.ticker.remove(this.tickFn); this.tickFn = null }
  }

  getScoreValue() { return 0 } // scored per-second in InputManager
  getDrillElapsed() { return this.elapsed }
}
