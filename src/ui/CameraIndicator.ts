/**
 * CameraIndicator — always-visible badge when webcam is active.
 * Hard constraint: must be visible any time the camera stream is live.
 */
export class CameraIndicator {
  private el: HTMLDivElement
  private visible = false

  constructor(root: HTMLElement) {
    this.el = document.createElement('div')
    this.el.id = 'cam-indicator'
    this.el.innerHTML = `<span class="cam-dot"></span> CAM ON`
    this.el.style.display = 'none'
    root.appendChild(this.el)
    this.injectStyles()
  }

  show() { this.el.style.display = 'flex'; this.visible = true }
  hide() { this.el.style.display = 'none'; this.visible = false }
  isVisible() { return this.visible }

  private injectStyles() {
    const s = document.createElement('style')
    s.textContent = `
      #cam-indicator {
        position:fixed; top:24px; left:50%; transform:translateX(-50%);
        display:flex; align-items:center; gap:6px;
        padding:5px 14px; background:rgba(200,0,0,0.75);
        border:1px solid rgba(255,100,100,0.6); border-radius:20px;
        color:#fff; font-family:'Segoe UI',sans-serif; font-size:11px; font-weight:700;
        letter-spacing:.08em; pointer-events:none; z-index:13000;
      }
      .cam-dot { width:8px; height:8px; background:#ff4444; border-radius:50%;
        animation:camBlink 1s ease-in-out infinite; }
      @keyframes camBlink { 0%,100%{opacity:1} 50%{opacity:.2} }
    `
    document.head.appendChild(s)
  }
}
