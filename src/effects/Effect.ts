/**
 * Effect — base interface
 * ────────────────────────
 * Implemented by all transient visual effects (shockwaves, smoke, etc.).
 * Effects manage their own PixiJS display objects and self-cleanup when done.
 */
export interface Effect {
  /** Called each frame by the game loop. dt = seconds since last frame. */
  update(dt: number): void
  /** Whether this effect has finished and can be removed. */
  isDone(): boolean
  /** Clean up PixiJS resources. Called after isDone() returns true. */
  destroy(): void
}
