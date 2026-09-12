import { OverlayManager } from './overlay/OverlayManager'
import { HUD } from './ui/HUD'
import { InputManager } from './input/InputManager'
import { AudioManager } from './audio/AudioManager'
import { SettingsManager } from './settings/SettingsManager'
import { ToolBar } from './ui/ToolBar'
import { AchievementTracker } from './input/AchievementTracker'
import { WindowDetector } from './windowDetection/WindowDetector'
import { ContextMenu } from './ui/ContextMenu'
import { SettingsScreen } from './ui/SettingsScreen'
import { CameraIndicator } from './ui/CameraIndicator'
import { GestureRecognizer } from './gestures/GestureRecognizer'
import { GestureMapper } from './gestures/GestureMapper'

async function boot() {
  const root = document.getElementById('app')!

  const settings = SettingsManager.getInstance()
  await settings.load()

  const audio = AudioManager.getInstance()
  const overlay = new OverlayManager(root)

  // await PixiJS init
  await overlay.init()

  const hud = new HUD(root)
  const toolBar = new ToolBar(root)
  const achievements = new AchievementTracker(root)
  const windowDetector = new WindowDetector()
  const ctxMenu = new ContextMenu(overlay)

  // Settings UI
  new SettingsScreen(settings, audio)

  const input = new InputManager(
    overlay, audio, hud, toolBar, settings, achievements, windowDetector, ctxMenu
  )

  // Gestures setup
  const camIndicator = new CameraIndicator(root)
  const gestures = new GestureRecognizer(camIndicator)
  const gestureMapper = new GestureMapper(input)
  gestures.onGesture((type, x, y) => gestureMapper.handle(type, x, y))

  // Autostart/stop gestures based on settings
  const checkGestures = async () => {
    if (settings.get('gesturesEnabled')) {
      if (!gestures.isActive()) await gestures.start()
    } else {
      if (gestures.isActive()) gestures.stop()
    }
  }

  // Monitor settings changes (the SettingsScreen calls settings.set)
  setInterval(checkGestures, 1000)

  // Mount UI
  overlay.startLoop()
  hud.mount()
  toolBar.mount(input)
  achievements.mount()
  input.attach()

  // Apply persisted settings
  audio.setMuted(!settings.get('soundEnabled'))
  
  // Force start gestures immediately
  gestures.start()

  window.rageDesk.signalReady()
}

boot().catch(console.error)
