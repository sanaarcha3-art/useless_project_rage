export type AchievementId =
  | 'FIRST_BLOOD' | 'HIT_10' | 'HIT_100'
  | 'CHAOS_ENGINE' | 'ABS_RAGE' | 'WINDOW_DESTROY' | 'MIND_BLOWN'

interface AchievementDef {
  id: AchievementId; name: string; desc: string; icon: string
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'FIRST_BLOOD',    name: 'FIRST BLOOD',     desc: 'Land your first hit',              icon: '🩸' },
  { id: 'HIT_10',         name: '10 HITS',          desc: 'Hit 10 times',                     icon: '💥' },
  { id: 'HIT_100',        name: '100 HITS',          desc: 'Hit 100 times',                    icon: '🔥' },
  { id: 'CHAOS_ENGINE',   name: 'CHAOS ENGINE',     desc: 'Use 5 different tools in a session', icon: '⚙️' },
  { id: 'ABS_RAGE',       name: 'ABSOLUTE RAGE',    desc: 'Score over 1000 in one session',   icon: '🤬' },
  { id: 'WINDOW_DESTROY', name: 'WINDOW DESTROYER', desc: 'Destroy a real window (visually)', icon: '🪟' },
  { id: 'MIND_BLOWN',     name: 'MIND = BLOWN',     desc: 'Trigger the mind-blown gesture',   icon: '🤯' },
]

export class AchievementTracker {
  private root: HTMLElement
  private unlocked = new Set<AchievementId>()
  private toastEl!: HTMLDivElement

  // Counters
  private totalHits = 0
  private toolsUsed = new Set<string>()
  private onUnlock?: (id: AchievementId) => void

  constructor(root: HTMLElement) { this.root = root }

  mount() {
    this.toastEl = document.createElement('div')
    this.toastEl.id = 'achievement-toast'
    this.root.appendChild(this.toastEl)
    this.injectStyles()
  }

  setOnUnlock(cb: (id: AchievementId) => void) { this.onUnlock = cb }

  recordHit(toolName: string) {
    this.totalHits++
    this.toolsUsed.add(toolName)
    if (this.totalHits === 1) this.unlock('FIRST_BLOOD')
    if (this.totalHits === 10) this.unlock('HIT_10')
    if (this.totalHits === 100) this.unlock('HIT_100')
    if (this.toolsUsed.size >= 5) this.unlock('CHAOS_ENGINE')
  }

  recordScore(score: number) {
    if (score >= 1000) this.unlock('ABS_RAGE')
  }

  unlock(id: AchievementId) {
    if (this.unlocked.has(id)) return
    this.unlocked.add(id)
    const def = ACHIEVEMENTS.find(a => a.id === id)!
    this.showToast(def)
    this.onUnlock?.(id)
  }

  reset() {
    this.totalHits = 0
    this.toolsUsed.clear()
    // Note: we intentionally keep unlocked set — achievements persist in a session
  }

  private queue: AchievementDef[] = []
  private showing = false

  private showToast(def: AchievementDef) {
    this.queue.push(def)
    if (!this.showing) this.dequeue()
  }

  private dequeue() {
    if (!this.queue.length) { this.showing = false; return }
    this.showing = true
    const def = this.queue.shift()!

    this.toastEl.innerHTML = `
      <div class="ach-icon">${def.icon}</div>
      <div class="ach-body">
        <div class="ach-label">Achievement Unlocked</div>
        <div class="ach-name">${def.name}</div>
        <div class="ach-desc">${def.desc}</div>
      </div>
    `
    this.toastEl.classList.remove('ach-slide-in')
    void this.toastEl.offsetWidth
    this.toastEl.classList.add('ach-slide-in')

    setTimeout(() => { this.toastEl.classList.remove('ach-slide-in'); setTimeout(() => this.dequeue(), 400) }, 3000)
  }

  private injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
      #achievement-toast {
        position: fixed; top: 24px; right: 24px;
        display: flex; align-items: center; gap: 12px;
        padding: 14px 20px;
        background: rgba(10,10,10,0.85); backdrop-filter: blur(16px);
        border: 1px solid rgba(255,200,0,0.4);
        border-radius: 12px; color: #fff;
        font-family: 'Segoe UI', system-ui, sans-serif;
        pointer-events: none; z-index: 10001;
        transform: translateX(120%); transition: transform 0.35s cubic-bezier(.22,1,.36,1);
        box-shadow: 0 0 20px rgba(255,200,0,0.2);
      }
      .ach-slide-in { transform: translateX(0) !important; }
      .ach-icon { font-size: 32px; }
      .ach-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #ffd700; }
      .ach-name { font-size: 15px; font-weight: 700; margin-top: 2px; }
      .ach-desc { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }
    `
    document.head.appendChild(style)
  }
}
