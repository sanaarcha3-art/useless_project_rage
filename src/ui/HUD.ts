import { Tool } from '../tools/Tool'

/**
 * HUD
 * ───
 * Renders the minimal overlay HUD as an HTML element layered above the canvas.
 * DOM-based (not PixiJS) so it's always crisp at any DPI and easy to style.
 *
 * Layout (bottom-left):
 *   💥 RAGE MODE
 *   Tool: Hammer 🔨
 *   Rage: 0   Combo: x1
 *   [ESC] Exit   [R] Reset   [M] Mute
 */
export class HUD {
  private root: HTMLElement
  private el!: HTMLDivElement
  private scoreEl!: HTMLSpanElement
  private comboEl!: HTMLSpanElement
  private toolEl!: HTMLSpanElement
  private toastEl!: HTMLDivElement
  private toastTimer: ReturnType<typeof setTimeout> | null = null

  constructor(root: HTMLElement) {
    this.root = root
  }

  mount() {
    this.el = document.createElement('div')
    this.el.id = 'hud'
    this.el.innerHTML = `
      <div class="hud-title">💥 RAGE MODE</div>
      <div class="hud-tool">Tool: <span id="hud-tool">—</span></div>
      <div class="hud-score">
        Rage: <span id="hud-score">0</span>
        &nbsp;&nbsp;Combo: <span id="hud-combo">x1</span>
      </div>
      <div class="hud-hints">[ESC] Exit &nbsp; [R] Reset &nbsp; [M] Mute &nbsp; [1-7] Tools</div>
    `

    // Toast element (outside the HUD box so it can be positioned freely)
    this.toastEl = document.createElement('div')
    this.toastEl.id = 'hud-toast'
    this.toastEl.style.display = 'none'

    this.root.appendChild(this.el)
    this.root.appendChild(this.toastEl)

    this.scoreEl = document.getElementById('hud-score')!
    this.comboEl = document.getElementById('hud-combo')!
    this.toolEl  = document.getElementById('hud-tool')!

    this.injectStyles()
  }

  update(score: number, combo: number) {
    this.scoreEl.textContent = score.toLocaleString()
    this.comboEl.textContent = `x${combo}`
    // Pulse combo element when multiplier > 1
    if (combo > 1) {
      this.comboEl.classList.add('combo-active')
    } else {
      this.comboEl.classList.remove('combo-active')
    }
  }

  setTool(tool: Tool) {
    this.toolEl.textContent = `${tool.name} ${tool.icon}`
  }

  showToast(message: string, durationMs = 1800) {
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastEl.textContent = message
    this.toastEl.style.display = 'block'
    this.toastEl.classList.remove('toast-fade')
    void this.toastEl.offsetWidth // force reflow to restart animation
    this.toastEl.classList.add('toast-fade')
    this.toastTimer = setTimeout(() => {
      this.toastEl.style.display = 'none'
    }, durationMs)
  }

  private injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
      #hud {
        position: fixed;
        left: 24px;
        bottom: 24px;
        padding: 12px 18px;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        color: #fff;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.7;
        pointer-events: none;
        user-select: none;
        z-index: 9999;
      }
      .hud-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #ff4e4e;
        text-shadow: 0 0 8px rgba(255,78,78,0.6);
        margin-bottom: 2px;
      }
      .hud-tool  { color: #e0e0e0; }
      .hud-score { color: #ffd700; font-weight: 600; }
      .hud-hints { color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 4px; }

      #hud-combo {
        transition: transform 0.1s, color 0.1s;
        display: inline-block;
      }
      #hud-combo.combo-active {
        color: #ff8c00;
        text-shadow: 0 0 6px rgba(255,140,0,0.7);
        transform: scale(1.2);
      }

      #hud-toast {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 16px 36px;
        background: rgba(0, 0, 0, 0.85);
        border: 2px solid rgba(255,255,255,0.25);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        color: #fff;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 32px;
        font-weight: 700;
        pointer-events: none;
        z-index: 10000;
      }
      @keyframes toastFadeOut {
        0%   { opacity: 1; }
        70%  { opacity: 1; }
        100% { opacity: 0; }
      }
      .toast-fade { animation: toastFadeOut 1.8s ease forwards; }
    `
    document.head.appendChild(style)
  }
}
