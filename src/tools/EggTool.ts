import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'
import { ParticleSystem } from '../effects/ParticleSystem'

export class EggTool extends BaseTool {
  readonly name = 'Egg'; readonly icon = '🥚'; readonly shortcutKey = 3
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    // 1. Throwing animation
    const egg = new PIXI.Graphics()
    egg.ellipse(0, 0, 15, 22)
    egg.fill({ color: 0xfff3e0 })
    this.overlay.effectsContainer.addChild(egg)

    const startX = x + (Math.random() - 0.5) * 400
    const startY = window.innerHeight + 50
    const THROW_DUR = 0.35
    let elapsed = 0

    const animThrow = (ticker: PIXI.Ticker) => {
      elapsed += ticker.deltaMS / 1000
      const t = Math.min(1, elapsed / THROW_DUR)
      // Ease out
      const ease = 1 - Math.pow(1 - t, 3)
      
      egg.x = startX + (x - startX) * ease
      egg.y = startY + (y - startY) * ease - Math.sin(t * Math.PI) * 150 // Parabolic arc
      egg.scale.set(1 - ease * 0.3) // Shrink slightly to simulate depth
      egg.rotation = t * Math.PI * 4 // Spin in the air

      if (t >= 1) {
        this.overlay.ticker.remove(animThrow)
        egg.destroy()
        this.splat(x, y)
      }
    }
    this.overlay.ticker.add(animThrow)
  }

  private splat(x: number, y: number) {
    this.audio.play('glass_crack', 0.5)

    const splat = new PIXI.Graphics()

    // 1. Egg White (translucent blob)
    splat.moveTo(x, y)
    splat.beginPath()
    const points = 16
    for(let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = 30 + Math.random() * 40
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if(i === 0) splat.moveTo(px, py)
      else splat.lineTo(px, py)
    }
    splat.closePath()
    splat.fill({ color: 0xffffff, alpha: 0.85 })

    // 2. Yolk (orange/yellow)
    const yolkX = x + (Math.random() - 0.5) * 15
    const yolkY = y + (Math.random() - 0.5) * 15
    splat.circle(yolkX, yolkY, 15 + Math.random() * 8)
    splat.fill({ color: 0xffa200, alpha: 0.95 })

    splat.circle(yolkX - 5, yolkY - 5, 4)
    splat.fill({ color: 0xffeebb, alpha: 0.9 })

    this.overlay.damageLayer.drawInto(splat)
    splat.destroy()

    // 3. Shell pieces flying out
    const shells = new ParticleSystem(x, y, {
      count: 12, colors: [0xffffff, 0xf5f5f5, 0xe0e0e0],
      speed: 250, spread: Math.PI * 2, gravity: 600,
      lifetime: 0.6, sizeMin: 3, sizeMax: 8, alphaStart: 1,
    })
    this.overlay.effectsContainer.addChild(shells.container)
    this.overlay.ticker.add(shells.update)
    
    // 4. Realistic Dripping effect
    const drips = 4 + Math.floor(Math.random() * 3)
    for(let i=0; i<drips; i++) {
       const drip = new PIXI.Graphics()
       this.overlay.effectsContainer.addChild(drip)
       
       const startX = x + (Math.random() - 0.5) * 50
       let currentY = y + 10 + Math.random() * 30
       let length = 0
       
       let t = 0
       const dur = 1.0 + Math.random() * 1.5
       const isYolk = Math.random() < 0.4
       const color = isYolk ? 0xffa200 : 0xffffff
       const alpha = isYolk ? 0.9 : 0.7
       const width = 3 + Math.random() * 5
       
       const animDrip = (ticker: PIXI.Ticker) => {
          t += ticker.deltaMS / 1000
          const speed = 40 + Math.random() * 30
          const dy = speed * (ticker.deltaMS / 1000)
          currentY += dy
          length += dy
          
          drip.clear()
          // Draw a stretched tear-drop shape for the drip
          drip.moveTo(startX, currentY - length)
          drip.lineTo(startX, currentY)
          drip.stroke({ color, alpha: alpha * (1 - t/dur), width, cap: 'round' })
          
          if(t >= dur) {
             this.overlay.ticker.remove(animDrip)
             // Stamp the final dried drip trail into the damage layer
             this.overlay.damageLayer.drawInto(drip)
             drip.destroy()
          }
       }
       this.overlay.ticker.add(animDrip)
    }
  }

  getScoreValue() { return 15 }
}
