import { WinInfo } from '../windowDetection/WindowDetector'
import { GlassShatterEffect } from '../effects/GlassShatterEffect'
import { OverlayManager } from '../overlay/OverlayManager'

/**
 * ContextMenu — appears on right-click near a detected window.
 * "Destroy" triggers a visual-only shatter effect. Never closes or mutates the real window.
 */
export class ContextMenu {
  private el: HTMLDivElement | null = null
  private overlay: OverlayManager

  constructor(overlay: OverlayManager) {
    this.overlay = overlay
    this.injectStyles()
  }

  show(x: number, y: number, win: WinInfo, onDone: () => void) {
    this.hide()
    this.el = document.createElement('div')
    this.el.className = 'ctx-menu'
    this.el.style.left = `${Math.min(x, window.innerWidth - 240)}px`
    this.el.style.top  = `${Math.min(y, window.innerHeight - 120)}px`
    this.el.innerHTML = `
      <div class="ctx-title">🎯 Target Window</div>
      <div class="ctx-name">${win.title.slice(0, 36)}${win.title.length > 36 ? '…' : ''}</div>
      <div class="ctx-buttons">
        <button class="ctx-destroy">💥 Destroy</button>
        <button class="ctx-cancel">Cancel</button>
      </div>
    `
    document.body.appendChild(this.el)

    this.el.querySelector('.ctx-destroy')!.addEventListener('click', () => {
      GlassShatterEffect.trigger(win, this.overlay)
      this.hide(); onDone()
    })
    this.el.querySelector('.ctx-cancel')!.addEventListener('click', () => { this.hide(); onDone() })
  }

  hide() { this.el?.remove(); this.el = null }

  private injectStyles() {
    if (document.getElementById('ctx-styles')) return
    const s = document.createElement('style'); s.id = 'ctx-styles'
    s.textContent = `
      .ctx-menu {
        position: fixed; z-index: 11000;
        background: rgba(10,10,20,0.92); backdrop-filter: blur(18px);
        border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
        padding: 14px 18px; min-width: 220px; color: #fff;
        font-family: 'Segoe UI', system-ui, sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        animation: ctxPop 0.15s cubic-bezier(.22,1,.36,1);
      }
      @keyframes ctxPop { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
      .ctx-title { font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,.4); margin-bottom:4px; }
      .ctx-name  { font-size:14px; font-weight:600; margin-bottom:12px; color:#eee; }
      .ctx-buttons { display:flex; gap:8px; }
      .ctx-destroy { flex:1; padding:8px; background:rgba(255,60,60,.2); border:1px solid rgba(255,60,60,.5);
        border-radius:8px; color:#ff6060; font-weight:600; cursor:pointer; font-size:13px;
        transition:background .15s; }
      .ctx-destroy:hover { background:rgba(255,60,60,.35); }
      .ctx-cancel { padding:8px 14px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
        border-radius:8px; color:rgba(255,255,255,.6); cursor:pointer; font-size:13px; }
      .ctx-cancel:hover { background:rgba(255,255,255,.12); }
    `
    document.head.appendChild(s)
  }
}
