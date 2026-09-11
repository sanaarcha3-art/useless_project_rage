import * as PIXI from 'pixi.js'
import { WinInfo } from '../windowDetection/WindowDetector'
import { ParticleSystem } from './ParticleSystem'
import { ScreenShakeEffect } from './ScreenShakeEffect'
import { OverlayManager } from '../overlay/OverlayManager'

/**
 * GlassShatterEffect — purely visual shatter bounded to a window rect.
 * The real window is never touched.
 */
export class GlassShatterEffect {
  static trigger(win: WinInfo, overlay: OverlayManager) {
    const { x, y, width, height } = win
    const container = new PIXI.Container()
    overlay.effectsContainer.addChild(container)

    // Shatter lines radiating from center
    const cx = x + width / 2; const cy = y + height / 2
    const g = new PIXI.Graphics()
    container.addChild(g)

    const NUM_SHARDS = 18
    for (let i = 0; i < NUM_SHARDS; i++) {
      const angle = (i / NUM_SHARDS) * Math.PI * 2
      const len = Math.min(width, height) * (0.3 + Math.random() * 0.5)
      g.moveTo(cx, cy)
      g.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
      g.stroke({ color: 0xaaddff, alpha: 0.7 - i * 0.01, width: 1.5 })
    }
    // Rect outline flash
    g.rect(x, y, width, height)
    g.stroke({ color: 0x88ccff, alpha: 0.5, width: 2 })

    // Glass shard particles
    const p = new ParticleSystem(cx, cy, {
      count: 30, colors: [0xaaddff, 0xeeffff, 0x88bbee, 0xffffff],
      speed: 180, spread: Math.PI * 2, gravity: 320,
      lifetime: 0.9, sizeMin: 2, sizeMax: 9,
    })
    overlay.effectsContainer.addChild(p.container)
    overlay.ticker.add(p.update)

    // Fade out the shatter lines
    let alpha = 0.8; let elapsed = 0
    const fade = (ticker: PIXI.Ticker) => {
      elapsed += ticker.deltaMS / 1000
      alpha = Math.max(0, 0.8 - elapsed * 1.2)
      g.alpha = alpha
      if (alpha <= 0) {
        overlay.ticker.remove(fade)
        container.parent?.removeChild(container)
        container.destroy({ children: true })
      }
    }
    overlay.ticker.add(fade)

    const shake = new ScreenShakeEffect(overlay.stage, 8, 0.35)
    overlay.ticker.add(shake.update)
  }
}
