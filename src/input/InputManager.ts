import * as PIXI from 'pixi.js'
import { OverlayManager } from '../overlay/OverlayManager'
import { AudioManager } from '../audio/AudioManager'
import { HUD } from '../ui/HUD'
import { ToolBar } from '../ui/ToolBar'
import { SettingsManager } from '../settings/SettingsManager'
import { AchievementTracker } from './AchievementTracker'
import { Tool } from '../tools/Tool'
import { HammerTool } from '../tools/HammerTool'
import { DrillTool } from '../tools/DrillTool'
import { EggTool } from '../tools/EggTool'
import { GunTool } from '../tools/GunTool'
import { ExplosionTool } from '../tools/ExplosionTool'
import { BlackHoleTool } from '../tools/BlackHoleTool'
import { FireTool } from '../tools/FireTool'
import { WindowDetector } from '../windowDetection/WindowDetector'
import { ContextMenu } from '../ui/ContextMenu'

export class InputManager {
  private overlay: OverlayManager; private audio: AudioManager
  private hud: HUD; private toolBar: ToolBar
  private settings: SettingsManager; private achievements: AchievementTracker
  private windowDetector: WindowDetector; private ctxMenu: ContextMenu

  private tools: Tool[]; private activeToolIndex = 0; private isHolding = false
  private drillAccum = 0

  private score = 0; private combo = 1; private comboTimer = 0
  private readonly COMBO_RESET = 2.0

  constructor(
    overlay: OverlayManager, audio: AudioManager, hud: HUD,
    toolBar: ToolBar, settings: SettingsManager, achievements: AchievementTracker,
    windowDetector: WindowDetector, ctxMenu: ContextMenu
  ) {
    this.overlay = overlay; this.audio = audio; this.hud = hud
    this.toolBar = toolBar; this.settings = settings; this.achievements = achievements
    this.windowDetector = windowDetector; this.ctxMenu = ctxMenu

    this.tools = [
      new HammerTool(overlay, audio),
      new DrillTool(overlay, audio),
      new EggTool(overlay, audio),
      new GunTool(overlay, audio),
      new ExplosionTool(overlay, audio),
      new BlackHoleTool(overlay, audio),
      new FireTool(overlay, audio),
    ]

    this.overlay.ticker.add(this.tickFrame)
  }

  // ── Public API for ToolBar & Gestures ──
  getToolCount() { return this.tools.length }
  getToolAt(i: number) { return this.tools[i] }
  getActiveIndex() { return this.activeToolIndex }
  setActiveTool(i: number) {
    if (this.isHolding) { this.activeTool.endHold(); this.isHolding = false }
    this.activeToolIndex = i
    this.toolBar.setActive(i)
    this.hud.setTool(this.activeTool)
    this.setCursor(this.activeTool)
  }
  triggerToolAt(index: number, x: number, y: number) {
    const tool = this.tools[index]; if (!tool) return
    tool.activate(x, y)
    const pts = tool.getScoreValue()
    if (pts > 0) this.registerHit(pts, tool.name)
    else this.achievements.recordHit(tool.name)
  }
  triggerMindBlown() { this.achievements.unlock('MIND_BLOWN') }
  showGestureFeedback(emoji: string, name: string) { this.hud.showToast(`${emoji} ${name}`) }

  private setCursor(tool: Tool) {
    // Create an SVG-based cursor using the tool's emoji icon
    // We add a subtle text-shadow so it's visible on both light and dark backgrounds
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <text x="4" y="26" font-size="24" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${tool.icon}</text>
      </svg>
    `.trim().replace(/\n/g, '')
    const encoded = encodeURIComponent(svg)
    // Hotspot at roughly the top-left of the emoji
    document.body.style.cursor = `url('data:image/svg+xml;utf8,${encoded}') 4 4, crosshair`
  }

  attach() {
    window.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup',   this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('keydown',   this.onKeyDown)
    window.addEventListener('contextmenu', this.onContextMenu)
    this.hud.setTool(this.activeTool)
    this.setCursor(this.activeTool)
  }

  detach() {
    window.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mouseup',   this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('keydown',   this.onKeyDown)
    window.removeEventListener('contextmenu', this.onContextMenu)
    this.overlay.ticker.remove(this.tickFrame)
  }

  // ── Mouse ──
  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return // Only handle left clicks
    this.ctxMenu.hide()
    this.isHolding = true
    const tool = this.activeTool
    tool.startHold(e.clientX, e.clientY)
    const pts = tool.getScoreValue()
    if (pts > 0) this.registerHit(pts, tool.name)
    else this.achievements.recordHit(tool.name)
  }

  private onMouseUp = (e: MouseEvent) => {
    if (e.button !== 0) return
    this.isHolding = false
    this.activeTool.endHold()
    this.drillAccum = 0
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.isHolding) this.activeTool.updateHold(e.clientX, e.clientY, 0)
  }

  // Right-click targeting
  private onContextMenu = async (e: MouseEvent) => {
    e.preventDefault()
    if (!this.settings.get('windowDetectionEnabled')) return

    await this.windowDetector.refresh()
    const target = this.windowDetector.hitTest(e.clientX, e.clientY)
    if (target) {
      this.ctxMenu.show(e.clientX, e.clientY, target, () => {
        // Callback after destroy clicked
        this.achievements.unlock('WINDOW_DESTROY')
        this.registerHit(200, 'Window Shatter')
      })
    }
  }

  // ── Keyboard ──
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { window.rageDesk.closeOverlay(); return }
    if (e.key === 'r' || e.key === 'R') { this.reset(); return }
    if (e.key === 'm' || e.key === 'M') {
      const muted = !this.audio.isMuted()
      this.audio.setMuted(muted); this.settings.set('soundEnabled', !muted)
      this.hud.showToast(muted ? '🔇 Muted' : '🔊 Sound On')
      return
    }
    const num = parseInt(e.key)
    if (num >= 1 && num <= this.tools.length) this.setActiveTool(num - 1)
  }

  // ── Per-frame ticker ──
  private tickFrame = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaMS / 1000

    // Combo decay
    if (this.combo > 1) {
      this.comboTimer += dt
      if (this.comboTimer >= this.COMBO_RESET) { this.combo = 1; this.comboTimer = 0; this.hud.update(this.score, this.combo) }
    }

    // Drill/Fire per-second scoring
    if (this.isHolding && (this.activeTool instanceof DrillTool || this.activeTool instanceof FireTool)) {
      this.drillAccum += dt
      if (this.drillAccum >= 1) {
        this.drillAccum -= 1
        this.registerHit(this.activeTool instanceof DrillTool ? 2 : 3, this.activeTool.name)
      }
    }
  }

  // ── Scoring ──
  private registerHit(points: number, toolName: string) {
    this.score += points * this.combo
    this.comboTimer = 0
    this.combo = Math.min(this.combo + 1, 10)
    this.achievements.recordHit(toolName)
    this.achievements.recordScore(this.score)
    this.hud.update(this.score, this.combo)
  }

  // ── Reset ──
  reset() {
    this.score = 0; this.combo = 1; this.comboTimer = 0
    this.overlay.reset(); this.hud.update(0, 1)
    this.achievements.reset()
    this.ctxMenu.hide()
    this.hud.showToast('🧹 Desktop Restored')
  }

  private get activeTool() { return this.tools[this.activeToolIndex] }
}
