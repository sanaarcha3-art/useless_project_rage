export interface WinInfo {
  title: string; x: number; y: number; width: number; height: number
}

/**
 * WindowDetector — fetches visible window rects from the main process.
 * All calls are read-only (GetWindowRect + GetWindowText only).
 * Never manipulates windows.
 */
export class WindowDetector {
  private windows: WinInfo[] = []
  private lastFetch = 0
  private readonly CACHE_MS = 2000

  async refresh() {
    const now = Date.now()
    if (now - this.lastFetch < this.CACHE_MS) return
    this.lastFetch = now
    try { this.windows = await window.rageDesk.getWindows() } catch { this.windows = [] }
  }

  /** Returns the window whose rect contains (x,y), or null */
  hitTest(x: number, y: number): WinInfo | null {
    for (const w of this.windows) {
      if (x >= w.x && x <= w.x + w.width && y >= w.y && y <= w.y + w.height) return w
    }
    return null
  }

  getAll() { return this.windows }
}
