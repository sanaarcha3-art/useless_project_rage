import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

export class GunTool extends BaseTool {
  readonly name = 'Gun'; readonly icon = '🔫'; readonly shortcutKey = 4
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    // Play a sharp crack sound if available, otherwise fallback to axe
    this.audio.play('gun_shot', 1.0)
    
    // 1. Muzzle Flash (Transient Effect)
    const flash = new PIXI.Graphics()
    flash.circle(x, y, 20)
    flash.fill({ color: 0xffdd44, alpha: 1 })
    flash.circle(x, y, 40)
    flash.fill({ color: 0xff8800, alpha: 0.5 })
    
    // Starburst flash lines
    for(let i=0; i<8; i++) {
      const a = (i / 8) * Math.PI * 2
      flash.moveTo(x + Math.cos(a)*10, y + Math.sin(a)*10)
      flash.lineTo(x + Math.cos(a)*60, y + Math.sin(a)*60)
      flash.stroke({ color: 0xffffff, width: 3, alpha: 0.8 })
    }
    
    this.overlay.effectsContainer.addChild(flash)
    
    let flashLife = 0
    const animFlash = (ticker: PIXI.Ticker) => {
      flashLife += ticker.deltaMS / 1000
      flash.alpha = 1 - (flashLife / 0.1) // Fade out very quickly in 100ms
      if (flashLife >= 0.1) {
        this.overlay.ticker.remove(animFlash)
        flash.destroy()
      }
    }
    this.overlay.ticker.add(animFlash)

    // 2. Permanent Bullet Hole
    const hole = new PIXI.Graphics()
    
    // Outer glass frosting/shatter (grayish white rim)
    hole.circle(x, y, 12)
    hole.fill({ color: 0xdddddd, alpha: 0.3 })
    
    // Inner impact crater (dark gray)
    hole.circle(x, y, 7)
    hole.fill({ color: 0x222222, alpha: 0.9 })
    
    // Pitch black bullet hole
    hole.circle(x, y, 3)
    hole.fill({ color: 0x000000, alpha: 1 })

    // Sharp, jagged radial cracks
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const length = 15 + Math.random() * 35
      hole.moveTo(x + Math.cos(angle)*5, y + Math.sin(angle)*5)
      hole.lineTo(x + Math.cos(angle)*length, y + Math.sin(angle)*length)
      // Main crack line
      hole.stroke({ color: 0x111111, width: 1.5, alpha: 0.8 })
      
      // Secondary fork
      if (Math.random() < 0.5) {
        const forkAngle = angle + (Math.random() - 0.5) * 1.5
        const forkLen = length * 0.5
        hole.moveTo(x + Math.cos(angle)*(length*0.6), y + Math.sin(angle)*(length*0.6))
        hole.lineTo(x + Math.cos(forkAngle)*forkLen, y + Math.sin(forkAngle)*forkLen)
        hole.stroke({ color: 0x555555, width: 1, alpha: 0.6 })
      }
    }

    this.overlay.damageLayer.drawInto(hole)
    hole.destroy()

    // 3. Debris and Sparks
    const sparks = new ParticleSystem(x, y, {
      count: 12, colors: [0xffffff, 0xffaa00, 0x555555, 0xaaaaaa],
      speed: 400, spread: Math.PI * 2, gravity: 800,
      lifetime: 0.4, sizeMin: 2, sizeMax: 5, alphaStart: 1,
    })
    this.overlay.effectsContainer.addChild(sparks.container)
    this.overlay.ticker.add(sparks.update)
  }

  getScoreValue() { return 10 }
}
