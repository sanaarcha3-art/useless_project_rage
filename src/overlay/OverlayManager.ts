import * as PIXI from 'pixi.js'
import { DamageLayer } from './DamageLayer'

export class OverlayManager {
  private _app!: PIXI.Application
  private container: HTMLElement
  private running = false

  public damageLayer!: DamageLayer
  public effectsContainer!: PIXI.Container
  public hudContainer!: PIXI.Container

  constructor(container: HTMLElement) {
    this.container = container
  }

  async init() {
    this._app = new PIXI.Application()
    await this._app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance',
    })

    this._app.canvas.style.position = 'fixed'
    this._app.canvas.style.inset = '0'
    this._app.canvas.style.width = '100%'
    this._app.canvas.style.height = '100%'
    this._app.canvas.style.pointerEvents = 'none'
    this.container.appendChild(this._app.canvas)

    this.damageLayer = new DamageLayer(this._app)
    this.effectsContainer = new PIXI.Container()
    this.hudContainer = new PIXI.Container()

    this._app.stage.addChild(this.damageLayer.container)
    this._app.stage.addChild(this.effectsContainer)
    this._app.stage.addChild(this.hudContainer)

    window.addEventListener('resize', this.onResize)
  }

  startLoop() {
    this.running = true
    // Cleanup stale effects every frame
    this._app.ticker.add(this.tick)
  }

  private tick = () => {
    if (!this.running) return
    // Remove completed particle systems (they self-destroy, but clean up references)
  }

  stop() {
    this.running = false
    this._app.ticker.remove(this.tick)
  }

  reset() {
    this.damageLayer.clear()
    // Remove all transient effects
    while (this.effectsContainer.children.length > 0) {
      const child = this.effectsContainer.children[0]
      this.effectsContainer.removeChild(child)
      child.destroy({ children: true })
    }
  }

  private onResize = () => {
    this._app.renderer.resize(window.innerWidth, window.innerHeight)
  }

  get stage() { return this._app.stage }
  get ticker() { return this._app.ticker }
  get renderer() { return this._app.renderer }
  get width() { return this._app.screen.width }
  get height() { return this._app.screen.height }
  get app() { return this._app }
}
