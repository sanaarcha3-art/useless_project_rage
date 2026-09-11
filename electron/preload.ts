import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('rageDesk', {
  signalReady:      () => ipcRenderer.send('renderer:ready'),
  closeOverlay:     () => ipcRenderer.send('overlay:escape'),
  getDisplayBounds: (): Promise<{ x: number; y: number; width: number; height: number }> =>
    ipcRenderer.invoke('get:display-bounds'),
  getWindows: (): Promise<{ title: string; x: number; y: number; width: number; height: number }[]> =>
    ipcRenderer.invoke('get:windows'),
  loadSettings:  (): Promise<Record<string, unknown>> => ipcRenderer.invoke('settings:load'),
  saveSettings:  (data: Record<string, unknown>): Promise<void> => ipcRenderer.invoke('settings:save', data),
  setAutostart:  (enable: boolean): Promise<void> => ipcRenderer.invoke('autostart:set', enable),
  onOpenSettings: (cb: () => void) => ipcRenderer.on('open:settings', cb),
})
export {}
