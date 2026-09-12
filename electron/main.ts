import {
  app, BrowserWindow, globalShortcut, ipcMain,
  screen, Tray, Menu, nativeImage, shell, session
} from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── State ─────────────────────────────────────────────────────────────────────
let overlayWin: BrowserWindow | null = null
let tray: Tray | null = null
let rageActive = false

// ─── Settings persistence ───────────────────────────────────────────────────────
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

function loadSettings(): Record<string, unknown> {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) } catch { return {} }
}
function saveSettings(data: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true })
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2))
}

// ─── Autostart ─────────────────────────────────────────────────────────────────
const STARTUP_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const APP_NAME = 'RageDesk'
function setAutostart(enable: boolean) {
  try {
    const exePath = process.execPath
    if (enable) {
      execSync(`reg add "${STARTUP_KEY}" /v "${APP_NAME}" /t REG_SZ /d "${exePath}" /f`)
    } else {
      execSync(`reg delete "${STARTUP_KEY}" /v "${APP_NAME}" /f`)
    }
  } catch { /* ignore if key doesn't exist on delete */ }
}

// ─── Window enumeration (read-only) ─────────────────────────────────────────────
interface WinInfo { title: string; x: number; y: number; width: number; height: number }

function enumerateWindows(): WinInfo[] {
  try {
    const ps = `
      Add-Type @"
        using System;using System.Runtime.InteropServices;using System.Text;
        public class WE {
          [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lp, IntPtr p);
          [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
          [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
          [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
          public delegate bool EnumWindowsProc(IntPtr h, IntPtr p);
          public struct RECT { public int L,T,R,B; }
          public static string GetAll() {
            var sb=new System.Text.StringBuilder();sb.Append("[");bool first=true;
            EnumWindows((h,p)=>{
              if(!IsWindowVisible(h))return true;
              var t=new StringBuilder(256);GetWindowText(h,t,256);
              var title=t.ToString().Trim();if(title.Length<2)return true;
              RECT r;GetWindowRect(h,out r);
              int w=r.R-r.L,ht=r.B-r.T;if(w<50||ht<50)return true;
              if(!first)sb.Append(",");first=false;
              sb.Append($"{{\"title\":\"{title.Replace("\"","'")}\",\"x\":{r.L},\"y\":{r.T},\"width\":{w},\"height\":{ht}}}");
              return true;
            },IntPtr.Zero);
            sb.Append("]");return sb.ToString();
          }
        }
"@
      [WE]::GetAll()
    `
    const raw = execSync(`powershell -NoProfile -Command "${ps.replace(/\n/g,' ')}"`, {
      encoding: 'utf8', timeout: 3000,
    }).trim()
    return JSON.parse(raw) as WinInfo[]
  } catch { return [] }
}

// ─── Overlay factory ────────────────────────────────────────────────────────────
function createOverlay(): BrowserWindow {
  const { bounds } = screen.getPrimaryDisplay()
  const win = new BrowserWindow({
    x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
    transparent: true, frame: false, backgroundColor: '#00000000',
    alwaysOnTop: true, skipTaskbar: true, focusable: true,
    resizable: false, movable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  })
  win.setIgnoreMouseEvents(false)
  win.setAlwaysOnTop(true, 'screen-saver')

  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL)
  else win.loadFile(path.join(__dirname, '../dist/index.html'))

  win.once('closed', () => { overlayWin = null; rageActive = false; updateTray() })
  return win
}

function openOverlay() {
  if (rageActive && overlayWin && !overlayWin.isDestroyed()) return
  rageActive = true
  overlayWin = createOverlay()
  overlayWin.once('ready-to-show', () => {
    overlayWin?.show(); overlayWin?.focus()
    overlayWin?.setIgnoreMouseEvents(false)
    updateTray()
  })
  overlayWin.webContents.on('console-message', (_e, level, message, line, source) => {
    console.log(`[Renderer Console] ${message}`)
  })
}
function closeOverlay() {
  if (!overlayWin || overlayWin.isDestroyed()) return
  overlayWin.setIgnoreMouseEvents(true)
  ipcMain.removeAllListeners('overlay:close')
  overlayWin.destroy(); overlayWin = null; rageActive = false; updateTray()
}
function toggleOverlay() { rageActive ? closeOverlay() : openOverlay() }

// ─── Tray ───────────────────────────────────────────────────────────────────────
function createTray() {
  tray = new Tray(nativeImage.createEmpty())
  tray.setToolTip('RageDesk')
  updateTray()
  tray.on('double-click', () => toggleOverlay())
}
function updateTray() {
  if (!tray) return
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: rageActive ? '🔥 Exit Rage Mode' : '💥 Activate Rage Mode', click: () => toggleOverlay() },
    { type: 'separator' },
    { label: '⚙️ Settings', click: () => { if (overlayWin) overlayWin.webContents.send('open:settings') } },
    { type: 'separator' },
    { label: 'Quit', click: () => { closeOverlay(); app.quit() } },
  ]))
}

// ─── App boot ───────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') callback(true)
    else callback(false)
  })
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') return true
    return false
  })

  createTray()

  const candidates = ['CommandOrControl+Shift+R', 'CommandOrControl+Alt+R', 'CommandOrControl+Shift+F12']
  for (const hk of candidates) {
    if (globalShortcut.register(hk, toggleOverlay)) {
      tray?.setToolTip(`RageDesk — ${hk}`)
      break
    }
  }

  // IPC handlers
  ipcMain.on('renderer:ready',   () => { overlayWin?.show(); overlayWin?.focus() })
  ipcMain.on('overlay:escape',   () => closeOverlay())
  ipcMain.handle('get:display-bounds', () => screen.getPrimaryDisplay().bounds)
  ipcMain.handle('get:windows',  () => enumerateWindows())
  ipcMain.handle('settings:load', () => loadSettings())
  ipcMain.handle('settings:save', (_e, data: Record<string, unknown>) => saveSettings(data))
  ipcMain.handle('autostart:set', (_e, enable: boolean) => setAutostart(enable))

  // Open immediately for the user!
  toggleOverlay()
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => {
})
