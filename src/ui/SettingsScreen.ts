import { SettingsManager, Settings } from '../settings/SettingsManager'
import { AudioManager } from '../audio/AudioManager'

/**
 * SettingsScreen — full settings panel overlaid on the rage overlay.
 * Toggle with Ctrl+, or tray > Settings. All changes apply immediately.
 */
export class SettingsScreen {
  private el: HTMLDivElement | null = null
  private settings: SettingsManager; private audio: AudioManager
  private visible = false

  constructor(settings: SettingsManager, audio: AudioManager) {
    this.settings = settings; this.audio = audio
    this.injectStyles()
    window.rageDesk.onOpenSettings(() => this.toggle())
  }

  toggle() { this.visible ? this.hide() : this.show() }

  show() {
    if (this.el) return
    this.visible = true
    this.el = document.createElement('div'); this.el.id = 'settings-panel'
    this.el.innerHTML = this.buildHTML()
    document.body.appendChild(this.el)
    this.bindEvents()
  }

  hide() { this.el?.remove(); this.el = null; this.visible = false }

  private buildHTML(): string {
    const s = this.settings
    const row = (label: string, id: string, control: string) =>
      `<div class="s-row"><label class="s-label" for="${id}">${label}</label>${control}</div>`
    const tog = (id: keyof Settings, label: string) =>
      row(label, id, `<label class="s-toggle"><input type="checkbox" id="${id}" ${s.get(id) ? 'checked' : ''}><span class="s-knob"></span></label>`)
    const slid = (id: keyof Settings, label: string, min=0, max=100) =>
      row(label, id, `<input type="range" id="${id}" min="${min}" max="${max}" value="${Math.round((s.get(id) as number)*100)}" class="s-range">`)

    return `
      <div class="s-header">
        <span>⚙️ Settings</span>
        <button class="s-close" id="s-close">✕</button>
      </div>
      <div class="s-body">
        ${tog('soundEnabled',          '🔊 Sound enabled')}
        ${tog('hudVisible',            '📊 HUD visible')}
        ${tog('windowDetectionEnabled','🪟 Window detection')}
        ${tog('gesturesEnabled',       '🤚 Gesture control (webcam)')}
        ${tog('startWithWindows',      '🚀 Start with Windows')}
        ${slid('shakeIntensity',       '📳 Screen shake')}
        ${slid('particleIntensity',    '✨ Particle intensity')}
        ${slid('overlayOpacity',       '🔍 Overlay opacity')}
        <div class="s-row">
          <label class="s-label">🔑 Hotkey</label>
          <span class="s-hint">Ctrl+Alt+R (rebind in v2)</span>
        </div>
        <div class="s-row">
          <button class="s-btn-danger" id="s-reset">🗑️ Reset all settings</button>
        </div>
      </div>
    `
  }

  private bindEvents() {
    if (!this.el) return
    this.el.querySelector('#s-close')!.addEventListener('click', () => this.hide())

    const bind = (id: keyof Settings) => {
      const el = this.el!.querySelector(`#${id}`) as HTMLInputElement
      if (!el) return
      el.addEventListener('change', async () => {
        const isCheck = el.type === 'checkbox'
        const isRange = el.type === 'range'
        const val = isCheck ? el.checked : isRange ? el.valueAsNumber / 100 : el.value
        this.settings.set(id, val as never)
        if (id === 'soundEnabled') this.audio.setMuted(!val)
        if (id === 'startWithWindows') await window.rageDesk.setAutostart(val as boolean)
        await window.rageDesk.saveSettings(this.getAllSettings())
      })
    }

    const keys: (keyof Settings)[] = [
      'soundEnabled','hudVisible','windowDetectionEnabled','gesturesEnabled',
      'startWithWindows','shakeIntensity','particleIntensity','overlayOpacity',
    ]
    keys.forEach(bind)

    this.el.querySelector('#s-reset')!.addEventListener('click', async () => {
      this.settings.reset()
      await window.rageDesk.saveSettings(this.getAllSettings())
      this.hide(); this.show()
    })

    // Close on outside click
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.hide() })
  }

  private getAllSettings(): Record<string, unknown> {
    const keys: (keyof Settings)[] = [
      'soundEnabled','hudVisible','windowDetectionEnabled','gesturesEnabled',
      'startWithWindows','shakeIntensity','particleIntensity','overlayOpacity',
      'hotkey','targetMonitor','overlayOpacity',
    ]
    const out: Record<string, unknown> = {}
    keys.forEach(k => { out[k] = this.settings.get(k) })
    return out
  }

  private injectStyles() {
    if (document.getElementById('settings-styles')) return
    const s = document.createElement('style'); s.id = 'settings-styles'
    s.textContent = `
      #settings-panel {
        position:fixed; inset:0; z-index:12000;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);
        pointer-events:all;
      }
      .s-header {
        display:flex; justify-content:space-between; align-items:center;
        padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.08);
        font-size:16px; font-weight:700; color:#fff;
      }
      #settings-panel > * { /* center card */
        background:rgba(12,12,20,0.96); backdrop-filter:blur(24px);
        border:1px solid rgba(255,255,255,0.1); border-radius:16px;
        width:420px; max-height:80vh; overflow-y:auto;
        font-family:'Segoe UI',system-ui,sans-serif; color:#fff;
        box-shadow:0 20px 60px rgba(0,0,0,0.7);
        animation:sPop 0.2s cubic-bezier(.22,1,.36,1);
      }
      @keyframes sPop { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      .s-close { background:none; border:none; color:rgba(255,255,255,.5); font-size:18px; cursor:pointer; padding:4px 8px; border-radius:6px; }
      .s-close:hover { color:#fff; background:rgba(255,255,255,.1); }
      .s-body { padding:8px 0 16px; }
      .s-row { display:flex; align-items:center; justify-content:space-between; padding:10px 24px; }
      .s-row:hover { background:rgba(255,255,255,.03); }
      .s-label { font-size:13px; color:rgba(255,255,255,.8); }
      .s-hint { font-size:12px; color:rgba(255,255,255,.35); }
      /* Toggle switch */
      .s-toggle { position:relative; display:inline-block; width:42px; height:24px; }
      .s-toggle input { opacity:0; width:0; height:0; }
      .s-knob { position:absolute; inset:0; background:rgba(255,255,255,.15); border-radius:12px; cursor:pointer; transition:.2s; }
      .s-knob::before { content:''; position:absolute; width:18px; height:18px; left:3px; top:3px; background:#fff; border-radius:50%; transition:.2s; }
      .s-toggle input:checked + .s-knob { background:#ff4e4e; }
      .s-toggle input:checked + .s-knob::before { transform:translateX(18px); }
      /* Range slider */
      .s-range { -webkit-appearance:none; width:140px; height:4px; background:rgba(255,255,255,.2); border-radius:2px; outline:none; cursor:pointer; }
      .s-range::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; background:#ff4e4e; border-radius:50%; }
      /* Danger button */
      .s-btn-danger { padding:8px 18px; background:rgba(255,60,60,.15); border:1px solid rgba(255,60,60,.4); border-radius:8px; color:#ff6060; font-size:13px; cursor:pointer; transition:background .15s; }
      .s-btn-danger:hover { background:rgba(255,60,60,.3); }
    `
    document.head.appendChild(s)
  }
}
