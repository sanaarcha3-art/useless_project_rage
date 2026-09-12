import * as PIXI from 'pixi.js'
import { BaseTool } from './Tool'
import { ParticleSystem } from '../effects/ParticleSystem'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'

// Lazily generate a soft glow texture for fire and scorch marks
let glowTexture: PIXI.Texture | null = null
function getGlowTexture(): PIXI.Texture {
  if (glowTexture) return glowTexture
  const R = 64
  const canvas = document.createElement('canvas')
  canvas.width = R * 2; canvas.height = R * 2
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(R, R, 0, R, R, R)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)')
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI * 2); ctx.fill()
  glowTexture = PIXI.Texture.from(canvas)
  return glowTexture
}

interface FlameParticle {
  sprite: PIXI.Sprite
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  scaleBase: number
  isSmoke: boolean
}

export class FireTool extends BaseTool {
  readonly name = 'Fire'; readonly icon = '🔥'; readonly shortcutKey = 7
  private overlay: OverlayManager; private audio: AudioManager

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    this.audio.play('fire_loop', 0.5)
    
    const container = new PIXI.Container()
    this.overlay.effectsContainer.addChild(container)
    const tex = getGlowTexture()

    const flames: FlameParticle[] = []
    let elapsed = 0
    const MAX_TIME = 2.5
    const MAX_RADIUS = 260
    
    // Smoothly grow the fire emission area
    let emitRadius = 10
    let lastScorchTime = 0

    const spawnFlame = (cx: number, cy: number, isSmoke = false) => {
      const sprite = new PIXI.Sprite(tex)
      sprite.anchor.set(0.5)
      sprite.blendMode = isSmoke ? 'normal' : 'add'
      container.addChild(sprite)
      
      flames.push({
        sprite,
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 40,
        vy: -40 - Math.random() * 80, // rising heat
        life: 0,
        maxLife: 0.8 + Math.random() * 0.8,
        scaleBase: 0.4 + Math.random() * 0.8,
        isSmoke
      })
    }

    const tick = (ticker: PIXI.Ticker) => {
      const dt = ticker.deltaMS / 1000
      elapsed += dt

      // Expand the fire area non-linearly
      const progress = Math.min(1, elapsed / MAX_TIME)
      emitRadius = 10 + (MAX_RADIUS - 10) * Math.pow(progress, 0.5)

      // Emit new flames
      if (elapsed < MAX_TIME) {
        const toSpawn = Math.floor(12 + emitRadius * 0.15)
        for (let i = 0; i < toSpawn; i++) {
          const angle = Math.random() * Math.PI * 2
          // Bias spawning towards the center with a square root
          const r = emitRadius * Math.sqrt(Math.random())
          const isSmoke = Math.random() < 0.15 // 15% smoke
          spawnFlame(x + Math.cos(angle) * r, y + Math.sin(angle) * r * 0.4, isSmoke) // squashed Y for perspective
        }
      }

      // Embers
      if (elapsed < MAX_TIME && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2
        const r = emitRadius * Math.random()
        const p = new ParticleSystem(
          x + Math.cos(angle) * r, y + Math.sin(angle) * r,
          { count: 1, colors: [0xffffff, 0xffaa00, 0xff2200], speed: 90, spread: Math.PI*2,
            gravity: -120, lifetime: 1.5, sizeMin: 1.5, sizeMax: 3.5 }
        )
        this.overlay.effectsContainer.addChild(p.container)
        this.overlay.ticker.add(p.update)
      }

      // Intermittent Scorch marks while burning
      if (elapsed < MAX_TIME && elapsed - lastScorchTime > 0.15) {
        lastScorchTime = elapsed
        const scorch = new PIXI.Sprite(tex)
        scorch.anchor.set(0.5)
        scorch.tint = 0x050505
        scorch.alpha = 0.4
        // Slightly random position within current radius
        const sa = Math.random() * Math.PI * 2
        const sr = emitRadius * Math.random() * 0.7
        scorch.x = x + Math.cos(sa) * sr
        scorch.y = y + Math.sin(sa) * sr
        scorch.scale.set((emitRadius / 64) * (0.5 + Math.random() * 0.5))
        this.overlay.damageLayer.drawInto(scorch)
        scorch.destroy()
      }

      // Update active particles
      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i]
        p.life += dt
        
        if (p.life >= p.maxLife) {
          p.sprite.destroy()
          flames.splice(i, 1)
          continue
        }

        const t = p.life / p.maxLife
        p.x += p.vx * dt
        p.y += p.vy * dt
        // slight horizontal wobble
        p.x += Math.sin(p.life * 10) * 30 * dt 
        
        p.sprite.x = p.x
        p.sprite.y = p.y
        p.sprite.scale.set(p.scaleBase * (1 - t * 0.5))

        if (p.isSmoke) {
          p.sprite.tint = 0x222222
          p.sprite.alpha = (1 - t) * 0.6
        } else {
          // Color ramp: White -> Yellow -> Orange -> Red -> fade out
          if (t < 0.15) p.sprite.tint = 0xffffff
          else if (t < 0.4) p.sprite.tint = 0xffdd44
          else if (t < 0.7) p.sprite.tint = 0xff6600
          else p.sprite.tint = 0xff0000

          // Smooth fade in/out
          if (t < 0.1) p.sprite.alpha = t * 10
          else p.sprite.alpha = 1 - Math.pow((t - 0.1) / 0.9, 1.5)
        }
      }

      if (flames.length === 0 && elapsed > MAX_TIME) {
        this.audio.stop('fire_loop')
        this.overlay.ticker.remove(tick)
        container.parent?.removeChild(container)
        container.destroy()
      }
    }

    this.overlay.ticker.add(tick)
  }

  getScoreValue() { return 0 } // scored per-second
}
