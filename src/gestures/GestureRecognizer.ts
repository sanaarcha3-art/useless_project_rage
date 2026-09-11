import { FilesetResolver, GestureRecognizer as MPGestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision'
import { CameraIndicator } from '../ui/CameraIndicator'

export type GestureType = 'punch' | 'finger_gun' | 'two_hand_explosion' | 'mind_blown'

/**
 * GestureRecognizer — wraps MediaPipe Tasks GestureRecognizer.
 * Privacy guarantees (hard constraints):
 *   - Camera is NEVER started unless the user explicitly enables it.
 *   - Only per-frame hand landmarks are extracted; raw frames are never stored.
 *   - stop() immediately calls track.stop() — no background capture.
 *   - CameraIndicator is always visible while stream is active.
 */
export class GestureRecognizer {
  private recognizer: MPGestureRecognizer | null = null
  private stream: MediaStream | null = null
  private videoEl: HTMLVideoElement | null = null
  private indicator: CameraIndicator
  private active = false
  private onGestureCb: ((type: GestureType) => void) | null = null

  // Debounce: gesture must hold ~100ms before firing
  private pending: { type: GestureType; since: number } | null = null
  private readonly HOLD_MS = 100

  // Cooldown: prevent same gesture rapid-firing
  private lastFired: Partial<Record<GestureType, number>> = {}
  private readonly COOLDOWN_MS = 300

  constructor(indicator: CameraIndicator) { this.indicator = indicator }

  onGesture(cb: (type: GestureType) => void) { this.onGestureCb = cb }

  async start(): Promise<boolean> {
    if (this.active) return true
    try {
      // MediaPipe WASM — served from node_modules via Vite
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      this.recognizer = await MPGestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task', delegate: 'GPU' },
        runningMode: 'VIDEO', numHands: 2,
      })

      this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      this.videoEl = document.createElement('video')
      this.videoEl.srcObject = this.stream
      this.videoEl.style.display = 'none'
      document.body.appendChild(this.videoEl)
      await this.videoEl.play()

      this.active = true
      this.indicator.show()
      this.loop()
      return true
    } catch (err) {
      console.error('[Gestures] Failed to start:', err)
      return false
    }
  }

  stop() {
    this.active = false
    // Immediately release camera — hard constraint
    this.stream?.getTracks().forEach(t => t.stop())
    this.stream = null
    if (this.videoEl) { this.videoEl.pause(); this.videoEl.remove(); this.videoEl = null }
    this.indicator.hide()
    this.pending = null
  }

  isActive() { return this.active }

  private loop() {
    if (!this.active || !this.recognizer || !this.videoEl) return

    const now = performance.now()
    try {
      const result: GestureRecognizerResult = this.recognizer.recognizeForVideo(this.videoEl, now)
      this.processResult(result, now)
    } catch { /* frame skip on error */ }

    requestAnimationFrame(() => this.loop())
  }

  private processResult(result: GestureRecognizerResult, now: number) {
    if (!result.gestures.length) { this.pending = null; return }

    // Map MediaPipe gesture names → our types
    const detected = this.detectGestureType(result)
    if (!detected) { this.pending = null; return }

    if (this.pending?.type === detected) {
      // Same gesture is holding — check if it's been held long enough
      if (now - this.pending.since >= this.HOLD_MS) {
        const lastTime = this.lastFired[detected] ?? 0
        if (now - lastTime >= this.COOLDOWN_MS) {
          this.lastFired[detected] = now
          this.pending = null
          this.onGestureCb?.(detected)
        }
      }
    } else {
      // New gesture detected — start hold timer
      this.pending = { type: detected, since: now }
    }
  }

  private detectGestureType(result: GestureRecognizerResult): GestureType | null {
    if (!result.gestures.length) return null

    const g0 = result.gestures[0][0]?.categoryName?.toLowerCase() ?? ''
    const g1 = result.gestures[1]?.[0]?.categoryName?.toLowerCase() ?? ''
    const numHands = result.gestures.length

    // Two-hand explosion: both hands open then away
    if (numHands >= 2 && g0.includes('open') && g1.includes('open')) return 'two_hand_explosion'

    // Mind blown: closed fist near temple area (approximated via landmarks)
    if (g0 === 'closed_fist' && this.nearTemple(result, 0)) return 'mind_blown'

    // Pointing up = finger gun
    if (g0 === 'pointing_up' || g0 === 'victory') return 'finger_gun'

    // Closed fist thrust = punch
    if (g0 === 'closed_fist') return 'punch'

    return null
  }

  private nearTemple(result: GestureRecognizerResult, handIdx: number): boolean {
    // Wrist landmark (0) x position — if far left or right, it's near the temple
    const lms = result.landmarks?.[handIdx]
    if (!lms?.length) return false
    const wristX = lms[0].x // normalized 0–1
    return wristX < 0.25 || wristX > 0.75
  }
}
