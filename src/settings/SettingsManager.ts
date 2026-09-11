/**
 * SettingsManager (singleton)
 * ───────────────────────────
 * Stores all user preferences. In Phase 1 this is a simple in-memory store
 * with localStorage persistence. Phase 7 will migrate to electron-store for
 * proper OS-level persistence in %LOCALAPPDATA%\RageDesk\.
 */
export interface Settings {
  hotkey: string
  soundEnabled: boolean
  shakeIntensity: number    // 0–1
  particleIntensity: number // 0–1
  hudVisible: boolean
  windowDetectionEnabled: boolean
  startWithWindows: boolean
  overlayOpacity: number    // 0–1
  targetMonitor: 'primary' | 'all' | string
  gesturesEnabled: boolean
}

const DEFAULTS: Settings = {
  hotkey: 'CommandOrControl+Shift+R',
  soundEnabled: true,
  shakeIntensity: 0.75,
  particleIntensity: 1.0,
  hudVisible: true,
  windowDetectionEnabled: false,
  startWithWindows: false,
  overlayOpacity: 1.0,
  targetMonitor: 'primary',
  gesturesEnabled: false,
}

const STORAGE_KEY = 'ragedesk_settings'

export class SettingsManager {
  private static instance: SettingsManager
  private settings: Settings = { ...DEFAULTS }
  private listeners = new Map<keyof Settings, Set<(value: unknown) => void>>()

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) SettingsManager.instance = new SettingsManager()
    return SettingsManager.instance
  }

  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Settings>
        this.settings = { ...DEFAULTS, ...saved }
      }
    } catch {
      // Corrupt storage — fall back to defaults silently
      this.settings = { ...DEFAULTS }
    }
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key]
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.settings[key] = value
    this.save()
    this.listeners.get(key)?.forEach((cb) => cb(value))
  }

  on<K extends keyof Settings>(key: K, cb: (value: Settings[K]) => void) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set())
    this.listeners.get(key)!.add(cb as (v: unknown) => void)
  }

  reset() {
    this.settings = { ...DEFAULTS }
    this.save()
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
    } catch {
      // Quota exceeded or private mode — ignore
    }
  }
}
