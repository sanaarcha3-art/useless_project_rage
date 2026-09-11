// Global type augmentation for the contextBridge API
interface WinInfo { title: string; x: number; y: number; width: number; height: number }

interface RageDeskAPI {
  signalReady: () => void
  closeOverlay: () => void
  getDisplayBounds: () => Promise<{ x: number; y: number; width: number; height: number }>
  getWindows: () => Promise<WinInfo[]>
  loadSettings: () => Promise<Record<string, unknown>>
  saveSettings: (data: Record<string, unknown>) => Promise<void>
  setAutostart: (enable: boolean) => Promise<void>
  onOpenSettings: (cb: () => void) => void
}

declare global {
  interface Window { rageDesk: RageDeskAPI }
}
export {}
