import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { ScreenShakeEffect } from '../effects/ScreenShakeEffect'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

// Lazy loaded purple/cyan glow texture
let bhGlowTex: PIXI.Texture | null = null
function getBHGlow(): PIXI.Texture {
  if (bhGlowTex) return bhGlowTex
  const R = 64
  const canvas = document.createElement('canvas')
  canvas.width = R * 2; canvas.height = R * 2
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(R, R, 0, R, R, R)
  grad.addColorStop(0, 'rgba(200, 255, 255, 1)')
  grad.addColorStop(0.2, 'rgba(120, 50, 255, 0.8)')
  grad.addColorStop(0.5, 'rgba(50, 0, 150, 0.4)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI * 2); ctx.fill()
  bhGlowTex = PIXI.Texture.from(canvas)
  return bhGlowTex
}

interface Stardust { sprite: PIXI.Sprite, angle: number, dist: number, speed: number, life: number }

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
    const tex = getBHGlow()

    const glow = new PIXI.Sprite(tex)
    glow.anchor.set(0.5); glow.x = x; glow.y = y; glow.blendMode = 'add'
    container.addChild(glow)

    const core = new PIXI.Graphics()
    core.x = x; core.y = y
    
    const rings: PIXI.Graphics[] = []
    for (let i = 0; i < 5; i++) {
      const ring = new PIXI.Graphics()
      ring.x = x; ring.y = y
      ring.blendMode = 'add'
      rings.push(ring)
      container.addChild(ring)
    }
    container.addChild(core)

    const dustArray: Stardust[] = []
    const MAX_RADIUS = 100
    const DURATION = 2.8
    let elapsed = 0

    const tick = (ticker: PIXI.Ticker) => {
      const dt = ticker.deltaMS / 1000
      elapsed += dt
      
      const t = Math.min(1, elapsed / DURATION)
      // Rapid grow, hold, fast shrink
      const radius = MAX_RADIUS * Math.sin(Math.pow(t, 0.7) * Math.PI)
      const rotation = elapsed * 8

      // Glow behind
      glow.scale.set(radius / 30)
      glow.alpha = 0.5 + Math.sin(elapsed * 20) * 0.2

      core.clear()
      core.circle(0, 0, radius * 0.35)
      core.fill({ color: 0x000000, alpha: 1 })
      
      // Intense event horizon rim
      core.circle(0, 0, radius * 0.38)
      core.stroke({ color: 0xffffff, alpha: 0.9, width: 3 })
      core.circle(0, 0, radius * 0.45)
      core.stroke({ color: 0xaa22ff, alpha: 0.6, width: 8 })

      rings.forEach((ring, i) => {
        ring.clear()
        const r = radius * (0.5 + i * 0.25)
        ring.ellipse(0, 0, r, r * 0.15)
        const c = i % 2 === 0 ? 0xcc88ff : 0x00e5ff
        ring.stroke({ color: c, alpha: Math.max(0, 1 - i * 0.2), width: 3 + (5 - i) })
        ring.rotation = rotation + i * 1.5
      })

      // Erase damage from the screen
      const eraser = new PIXI.Graphics()
      eraser.circle(x, y, radius * 0.4) // erase within the event horizon
      eraser.fill({ color: 0xffffff, alpha: 1 })
      eraser.blendMode = 'erase'
      this.overlay.damageLayer.drawInto(eraser)
      eraser.destroy()

      // Spawn stardust
      if (elapsed < DURATION * 0.8) {
        for(let i=0; i<3; i++) {
          const s = new PIXI.Sprite(tex)
          s.anchor.set(0.5); s.blendMode = 'add'
          const scale = 0.05 + Math.random() * 0.1
          s.scale.set(scale)
          container.addChild(s)
          dustArray.push({
            sprite: s,
            angle: Math.random() * Math.PI * 2,
            dist: 300 + Math.random() * 150,
            speed: 2 + Math.random() * 4,
            life: 0
          })
        }
      }

      // Update stardust (spiraling inwards)
      for (let i = dustArray.length - 1; i >= 0; i--) {
        const d = dustArray[i]
        d.angle += d.speed * dt
        d.dist -= (100 + d.speed * 40) * dt
        if (d.dist <= radius * 0.3) {
          d.sprite.destroy()
          dustArray.splice(i, 1)
          continue
        }
        d.sprite.x = x + Math.cos(d.angle) * d.dist
        d.sprite.y = y + Math.sin(d.angle) * d.dist * 0.5 // elliptical orbit
        d.sprite.alpha = Math.min(1, d.dist / 150)
      }

      // Suck in other particles on screen
      for (const child of this.overlay.effectsContainer.children) {
        if (child === container) continue
        const dx = x - child.x; const dy = y - child.y
        const dist = Math.hypot(dx, dy)
        if (dist < 400 && dist > 5) {
          const pull = Math.pow(1 - dist / 400, 2) * 400 * dt
          child.x += (dx / dist) * pull
          child.y += (dy / dist) * pull
        }
      }

      // Implosion
      if (elapsed >= DURATION) {
        this.overlay.ticker.remove(tick)
        
        // Outward expanding shockwave ring
        const shock = new PIXI.Graphics()
        shock.x = x; shock.y = y
        this.overlay.effectsContainer.addChild(shock)
        let st = 0
        const animShock = (tk: PIXI.Ticker) => {
          st += tk.deltaMS / 1000
          shock.clear()
          const sr = st * 1500
          shock.circle(0, 0, sr)
          shock.stroke({ color: 0x00e5ff, width: 20 * (1 - st/0.3), alpha: 1 - (st/0.3) })
          if (st >= 0.3) {
            this.overlay.ticker.remove(animShock)
            shock.destroy()
          }
        }
        this.overlay.ticker.add(animShock)

        // Burst
        const burst = new ParticleSystem(x, y, {
          count: 50, colors: [0xaa22ff, 0x00e5ff, 0xffffff],
          speed: 400, spread: Math.PI * 2, gravity: 0,
          lifetime: 0.8, sizeMin: 2, sizeMax: 7,
        })
        this.overlay.effectsContainer.addChild(burst.container)
        this.overlay.ticker.add(burst.update)
        
        container.parent?.removeChild(container)
        container.destroy({ children: true })
        
        const shake = new ScreenShakeEffect(this.overlay.stage, 15, 0.4)
        this.overlay.ticker.add(shake.update)
      }
    }
    this.overlay.ticker.add(tick)
  }

  getScoreValue() { return 150 }
}
