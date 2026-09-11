import * as PIXI from 'pixi.js'

/**
 * DamageLayer
 * ───────────
 * A persistent RenderTexture that accumulates crack marks, splatter,
 * burn marks, and other permanent damage across the session.
 *
 * Individual effects draw into this texture via drawInto(), which never
 * clears it — damage accumulates until reset() is explicitly called (R key).
 */
export class DamageLayer {
  private app: PIXI.Application
  private renderTexture: PIXI.RenderTexture
  private sprite: PIXI.Sprite

  /** Public container added to the main stage */
  public container: PIXI.Container

  constructor(app: PIXI.Application) {
    this.app = app
    this.container = new PIXI.Container()

    // Create a persistent render texture the size of the screen
    this.renderTexture = PIXI.RenderTexture.create({
      width: app.screen.width,
      height: app.screen.height,
    })

    this.sprite = new PIXI.Sprite(this.renderTexture)
    this.container.addChild(this.sprite)
  }

  /**
   * Render a display object permanently into the damage layer.
   * Pass `clear: false` so existing content is preserved (accumulation).
   */
  drawInto(displayObject: PIXI.Container | PIXI.Graphics, clear = false) {
    this.app.renderer.render({
      container: displayObject,
      target: this.renderTexture,
      clear,
    })
  }

  update(_dt: number) {
    // Currently static — future phases may add fade-in of new marks
  }

  /** Wipe all accumulated damage (R key reset) */
  clear() {
    this.app.renderer.render({
      container: new PIXI.Container(),
      target: this.renderTexture,
      clear: true,
    })
  }
}
