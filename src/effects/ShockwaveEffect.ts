import * as PIXI from 'pixi.js'

export class ShockwaveEffect {
  private g: PIXI.Graphics
  private cx: number; private cy: number
  private radius = 0; private alpha = 0.8; private done = false

  constructor(cx: number, cy: number, parent: PIXI.Container) {
    this.cx = cx; this.cy = cy
    this.g = new PIXI.Graphics()
    parent.addChild(this.g)
  }

  update = (ticker: PIXI.Ticker) => {
    if (this.done) return
    const dt = ticker.deltaMS / 1000
    this.radius += 380 * dt
    this.alpha -= 2.5 * dt

    if (this.alpha <= 0) {
      this.done = true
      ticker.remove(this.update)
      this.g.parent?.removeChild(this.g)
      this.g.destroy()
      return
    }

    this.g.clear()
    this.g.circle(this.cx, this.cy, this.radius)
    this.g.stroke({ color: 0xff8800, alpha: this.alpha, width: 4 })
    this.g.circle(this.cx, this.cy, this.radius * 0.85)
    this.g.stroke({ color: 0xffcc44, alpha: this.alpha * 0.5, width: 2 })
  }
}
