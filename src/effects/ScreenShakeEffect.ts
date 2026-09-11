import * as PIXI from 'pixi.js'

/**
 * ScreenShakeEffect
 * ─────────────────
 * Applies a decaying oscillating translate to the root stage container,
 * giving a physically plausible "camera shake" on impact. Uses a
 * critically-damped spring model for a smooth falloff (no abrupt snap).
 *
 * Usage: add to overlay.ticker, it removes itself when done.
 */
export class ScreenShakeEffect {
  private stage: PIXI.Container
  private amplitude: number
  private duration: number
  private elapsed = 0
  private readonly FREQ = 40   // oscillation frequency Hz

  constructor(stage: PIXI.Container, amplitude: number, duration: number) {
    this.stage = stage
    this.amplitude = amplitude
    this.duration = duration
  }

  update = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaMS / 1000
    this.elapsed += dt

    if (this.elapsed >= this.duration) {
      // Restore stage to origin and detach
      this.stage.x = 0
      this.stage.y = 0
      ticker.remove(this.update)
      return
    }

    const t = this.elapsed / this.duration
    const decay = 1 - t                          // linear falloff
    const offsetX = Math.sin(this.elapsed * this.FREQ) * this.amplitude * decay
    const offsetY = Math.cos(this.elapsed * this.FREQ * 0.7) * this.amplitude * decay * 0.6

    this.stage.x = offsetX
    this.stage.y = offsetY
  }
}
