import { Tool } from '../tools/Tool'

/**
 * ToolBar — compact horizontal bar at bottom-center of screen.
 * Number keys 1-7 switch the active tool.
 */
export class ToolBar {
  private root: HTMLElement
  private el!: HTMLDivElement
  private slots: HTMLDivElement[] = []

  constructor(root: HTMLElement) { this.root = root }

  mount(input: { getToolCount(): number; getToolAt(i: number): Tool; getActiveIndex(): number; setActiveTool(i: number): void }) {
    this.el = document.createElement('div')
    this.el.id = 'toolbar'
    this.root.appendChild(this.el)

    for (let i = 0; i < input.getToolCount(); i++) {
      const tool = input.getToolAt(i)
      const slot = document.createElement('div')
      slot.className = 'tb-slot'
      slot.innerHTML = `<span class="tb-icon">${tool.icon}</span><span class="tb-key">${tool.shortcutKey}</span><span class="tb-name">${tool.name}</span>`
      slot.addEventListener('click', () => input.setActiveTool(i))
      this.slots.push(slot)
      this.el.appendChild(slot)
    }

    // Settings Button
    const setBtn = document.createElement('div')
    setBtn.className = 'tb-slot tb-settings'
    setBtn.innerHTML = `<span class="tb-icon">⚙️</span><span class="tb-name">Settings</span>`
    setBtn.addEventListener('click', () => window.dispatchEvent(new Event('open-settings-ui')))
    this.el.appendChild(setBtn)

    this.setActive(0)
    this.injectStyles()
  }

  setActive(index: number) {
    this.slots.forEach((s, i) => s.classList.toggle('tb-active', i === index))
  }

  private injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
      #toolbar {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        display: flex; gap: 8px; padding: 8px 14px;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
        pointer-events: all; user-select: none; z-index: 9998;
      }
      .tb-slot {
        display: flex; flex-direction: column; align-items: center;
        padding: 6px 10px; border-radius: 8px; cursor: pointer;
        min-width: 52px; border: 1px solid transparent;
        transition: background 0.15s, border-color 0.15s;
      }
      .tb-slot:hover { background: rgba(255,255,255,0.08); }
      .tb-active {
        background: rgba(255,78,78,0.25) !important;
        border-color: rgba(255,78,78,0.6) !important;
        box-shadow: 0 0 10px rgba(255,78,78,0.3);
      }
      .tb-icon { font-size: 22px; line-height: 1; }
      .tb-key { font-size: 9px; color: rgba(255,255,255,0.35); font-family: monospace; margin-top: 1px; }
      .tb-name { font-size: 9px; color: rgba(255,255,255,0.55); font-family: 'Segoe UI', sans-serif; margin-top: 1px; }
    `
    document.head.appendChild(style)
  }
}
