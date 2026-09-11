/**
 * Tool — base interface
 * ─────────────────────
 * Every tool implements this. The InputManager calls these methods based on
 * mouse events. Tools dispatch to effects and audio — they never touch the OS,
 * real windows, files, or any resource outside the overlay.
 */
export interface Tool {
  /** Display name shown in HUD */
  readonly name: string
  /** Emoji icon shown in tool bar */
  readonly icon: string
  /** 1-based keyboard shortcut (1–8) */
  readonly shortcutKey: number
  /** Cursor style while this tool is active */
  readonly cursor: string

  /** Single click / tap at (x, y) */
  activate(x: number, y: number): void

  /** Mouse button pressed — start of a hold gesture */
  startHold(x: number, y: number): void
  /** Called each frame while the button is held, dt = seconds since last frame */
  updateHold(x: number, y: number, dt: number): void
  /** Mouse button released */
  endHold(): void

  /** Points awarded per activation. Drill/Fire use per-second accounting separately. */
  getScoreValue(): number
}

/** Abstract base class providing no-op defaults for hold methods */
export abstract class BaseTool implements Tool {
  abstract readonly name: string
  abstract readonly icon: string
  abstract readonly shortcutKey: number
  readonly cursor = 'crosshair'

  abstract activate(x: number, y: number): void

  startHold(x: number, y: number) { this.activate(x, y) }
  updateHold(_x: number, _y: number, _dt: number) {}
  endHold() {}

  getScoreValue() { return 0 }
}
