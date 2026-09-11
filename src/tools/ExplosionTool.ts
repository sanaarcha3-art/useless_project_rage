import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { ScreenShakeEffect } from '../effects/ScreenShakeEffect'
import { ShockwaveEffect } from '../effects/ShockwaveEffect'
import { SmokeEffect } from '../effects/SmokeEffect'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

export class ExplosionTool extends BaseTool {
  readonly name = 'Explosion'; readonly icon = '💥'; readonly shortcutKey = 5
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    this.audio.play('explosion', 1.0)

    // White flash overlay
    const flash = new PIXI.Graphics()
    flash.rect(0, 0, this.overlay.width, this.overlay.height)
    flash.fill({ color: 0xffffff, alpha: 0.7 })
    this.overlay.effectsContainer.addChild(flash)
    let flashAlpha = 0.7
    const fadeFlash = (ticker: PIXI.Ticker) => {
      flashAlpha -= ticker.deltaMS / 1000 * 4
      flash.alpha = Math.max(0, flashAlpha)
      if (flashAlpha <= 0) {
        this.overlay.ticker.remove(fadeFlash)
        flash.parent?.removeChild(flash)
        flash.destroy()
      }
    }
    this.overlay.ticker.add(fadeFlash)

    // Scorch mark
    const scorch = new PIXI.Graphics()
    scorch.circle(x, y, 60)
    scorch.fill({ color: 0x111111, alpha: 0.6 })
    scorch.circle(x, y, 35)
    scorch.fill({ color: 0x000000, alpha: 0.8 })
    this.overlay.damageLayer.drawInto(scorch)
    scorch.destroy()

    // Shockwave ring
    const shockwave = new ShockwaveEffect(x, y, this.overlay.effectsContainer)
    this.overlay.ticker.add(shockwave.update)

    // Massive debris
    const particles = new ParticleSystem(x, y, {
      count: 40, colors: [0xff4400, 0xff8800, 0xffaa00, 0xffff00, 0x888888, 0x555555],
      speed: 300, spread: Math.PI * 2, gravity: 350,
      lifetime: 1.2, sizeMin: 3, sizeMax: 10,
    })
    this.overlay.effectsContainer.addChild(particles.container)
    this.overlay.ticker.add(particles.update)

    // Smoke cloud
    const smoke = new SmokeEffect(x, y, this.overlay.effectsContainer)
    this.overlay.ticker.add(smoke.update)

    // Heavy shake
    const shake = new ScreenShakeEffect(this.overlay.stage, 18, 0.5)
    this.overlay.ticker.add(shake.update)
  }

  getScoreValue() { return 100 }
}
