import { BaseTool } from './Tool'
import { CrackEffect } from '../effects/CrackEffect'
import { ParticleSystem } from '../effects/ParticleSystem'
import { ScreenShakeEffect } from '../effects/ScreenShakeEffect'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'
import { HitRecord } from '../effects/CrackEffect'

export class HammerTool extends BaseTool {
  readonly name = 'Hammer'; readonly icon = '🔨'; readonly shortcutKey = 1
  private overlay: OverlayManager; private audio: AudioManager
  private hitHistory: HitRecord[] = []

  constructor(overlay: OverlayManager, audio: AudioManager) {
    super(); this.overlay = overlay; this.audio = audio
  }

  activate(x: number, y: number) {
    const now = performance.now()
    const nearby = this.hitHistory.filter(h => Math.hypot(h.x - x, h.y - y) < 80 && now - h.time < 5000)
    const hitCount = Math.min(nearby.length + 1, 8)
    this.hitHistory = [...this.hitHistory.filter(h => now - h.time < 5000), { x, y, time: now }]

    this.audio.play('hammer_impact', Math.min(1, 0.5 + hitCount * 0.08))

    new CrackEffect(x, y, hitCount, this.overlay)

    const particles = new ParticleSystem(x, y, {
      count: 8 + hitCount * 4, colors: [0xaaaaaa, 0x888888, 0xcccccc, 0x555555],
      speed: 120 + hitCount * 40, spread: Math.PI, gravity: 400,
      lifetime: 0.5 + hitCount * 0.08, sizeMin: 2, sizeMax: 5,
    })
    this.overlay.effectsContainer.addChild(particles.container)
    this.overlay.ticker.add(particles.update)

    const shake = new ScreenShakeEffect(this.overlay.stage, 3 + hitCount * 1.5, 0.2 + hitCount * 0.04)
    this.overlay.ticker.add(shake.update)
  }

  getScoreValue() { return 10 }
}
