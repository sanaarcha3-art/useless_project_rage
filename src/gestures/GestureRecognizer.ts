import { FilesetResolver, GestureRecognizer as MPGestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision'
import { CameraIndicator } from '../ui/CameraIndicator'

export type GestureType = 'punch' | 'finger_gun' | 'two_hand_explosion' | 'mind_blown' | 'egg_throw'

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
  private canvasEl: HTMLCanvasElement | null = null
  private indicator: CameraIndicator
  private active = false
  private onGestureCb: ((type: GestureType, x: number, y: number) => void) | null = null

  // Debounce: gesture must hold ~100ms before firing
  private pending: { type: GestureType; handIdx: number; firstSeen: number; lastSeen: number } | null = null
  private readonly HOLD_MS = 150
  private readonly TOLERANCE_MS = 250 // allowed gap between detections

  // Cooldown: prevent same gesture rapid-firing
  private lastFired: Partial<Record<GestureType, number>> = {}
  private readonly COOLDOWN_MS = 400

  constructor(indicator: CameraIndicator) { this.indicator = indicator }

  onGesture(cb: (type: GestureType, x: number, y: number) => void) { this.onGestureCb = cb }

  private isStarting = false

  async start(): Promise<boolean> {
    if (this.active || this.isStarting) return true
    this.isStarting = true
    try {
      console.log('[Gestures] Fetching vision WASM from jsdelivr...')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      console.log('[Gestures] Fetching model from googleapis...')
      this.recognizer = await MPGestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task', delegate: 'CPU' },
        runningMode: 'VIDEO', numHands: 2,
      })
      console.log('[Gestures] Model loaded! Requesting camera...')

      this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      this.videoEl = document.createElement('video')
      this.videoEl.srcObject = this.stream
      this.videoEl.style.cssText = 'position:fixed;bottom:20px;right:20px;width:240px;height:180px;border-radius:12px;border:2px solid rgba(255,255,255,0.2);box-shadow:0 10px 30px rgba(0,0,0,0.5);transform:scaleX(-1);z-index:9998;object-fit:cover;'
      document.body.appendChild(this.videoEl)
      await this.videoEl.play()

      this.canvasEl = document.createElement('canvas')
      this.canvasEl.width = 640; this.canvasEl.height = 480
      this.canvasEl.style.cssText = 'position:fixed;bottom:20px;right:20px;width:240px;height:180px;border-radius:12px;z-index:9999;pointer-events:none;transform:scaleX(-1);'
      document.body.appendChild(this.canvasEl)

      this.active = true
      this.indicator.show()
      console.log('[Gestures] Camera started successfully! Resolution:', this.videoEl.videoWidth, 'x', this.videoEl.videoHeight)
      this.loop()
      this.isStarting = false
      return true
    } catch (err) {
      console.error('[Gestures] Failed to start:', err)
      const errEl = document.createElement('div')
      errEl.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(255,0,0,0.8);color:white;padding:10px 20px;border-radius:8px;z-index:99999;'
      errEl.innerText = 'Failed to start camera: ' + (err as Error).message
      document.body.appendChild(errEl)
      setTimeout(() => errEl.remove(), 5000)
      this.isStarting = false
      return false
    }
  }

  stop() {
    this.active = false
    this.stream?.getTracks().forEach(t => t.stop())
    this.stream = null
    if (this.videoEl) { this.videoEl.pause(); this.videoEl.remove(); this.videoEl = null }
    if (this.canvasEl) { this.canvasEl.remove(); this.canvasEl = null }
    this.indicator.hide()
    this.pending = null
  }

  isActive() { return this.active }

  private frameCount = 0
  private loop() {
    if (!this.active || !this.recognizer || !this.videoEl) return

    const now = performance.now()
    try {
      const result: GestureRecognizerResult = this.recognizer.recognizeForVideo(this.videoEl, now)
      this.frameCount++
      
      // Draw skeleton
      if (this.canvasEl) {
        const ctx = this.canvasEl.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
          if (result.landmarks) {
            ctx.fillStyle = '#00ff00'
            ctx.strokeStyle = '#00ff00'
            ctx.lineWidth = 2
            for (const hand of result.landmarks) {
              for (const pt of hand) {
                ctx.beginPath()
                ctx.arc(pt.x * this.canvasEl.width, pt.y * this.canvasEl.height, 4, 0, 2 * Math.PI)
                ctx.fill()
              }
            }
          }
          const rawGesture = result.gestures?.[0]?.[0]?.categoryName
          if (rawGesture && rawGesture !== 'None') {
            ctx.save()
            ctx.translate(this.canvasEl.width, 0)
            ctx.scale(-1, 1)
            ctx.font = '24px sans-serif'
            ctx.fillStyle = '#ff0000'
            ctx.fillText(rawGesture, 10, 30)
            ctx.restore()
          }
        }
      }

      this.processResult(result, now)
    } catch (err) { 
      console.error('[Gestures] Inference error:', err)
    }

    requestAnimationFrame(() => this.loop())
  }

  private processResult(result: GestureRecognizerResult, now: number) {
    const detected = this.detectGestureType(result)
    
    // Clear pending if tolerance exceeded
    if (this.pending && now - this.pending.lastSeen > this.TOLERANCE_MS) {
      this.pending = null
    }

    if (!detected) return

    if (this.pending && this.pending.type === detected.type) {
      this.pending.lastSeen = now
      // Same gesture is holding — check if it's been held long enough
      if (now - this.pending.firstSeen >= this.HOLD_MS) {
        const lastTime = this.lastFired[detected.type] ?? 0
        if (now - lastTime >= this.COOLDOWN_MS) {
          this.lastFired[detected.type] = now
          
          let hx = 0.5, hy = 0.5
          const lms = result.landmarks[this.pending.handIdx]
          if (lms && lms.length > 0) {
            // Index finger tip is landmark 8
            // Map the camera's X (0 to 1) to screen X, flipping horizontally because camera is mirrored
            hx = 1.0 - lms[8].x 
            hy = lms[8].y
          }
          this.onGestureCb?.(detected.type, hx, hy)
        }
      }
    } else {
      // New gesture detected — start hold timer
      this.pending = { type: detected.type, handIdx: detected.handIdx, firstSeen: now, lastSeen: now }
    }
  }

  private detectGestureType(result: GestureRecognizerResult): { type: GestureType, handIdx: number } | null {
    if (!result.gestures.length) return null

    const g0 = result.gestures[0]?.[0]?.categoryName?.toLowerCase() ?? ''
    const g1 = result.gestures[1]?.[0]?.categoryName?.toLowerCase() ?? ''
    const numHands = result.gestures.length

    // Two-hand explosion: both hands open then away
    if (numHands >= 2 && g0.includes('open') && g1.includes('open')) return { type: 'two_hand_explosion', handIdx: 0 }

    for (let i = 0; i < numHands; i++) {
      const g = result.gestures[i]?.[0]?.categoryName?.toLowerCase() ?? ''
      // Mind blown: closed fist near temple area (approximated via landmarks)
      if (g === 'closed_fist' && this.nearTemple(result, i)) return { type: 'mind_blown', handIdx: i }

      // Thumb down = egg throw
      if (g === 'thumb_down') return { type: 'egg_throw', handIdx: i }

      // Pointing up = finger gun
      if (g === 'pointing_up' || g === 'victory' || g === 'thumb_up') return { type: 'finger_gun', handIdx: i }

      // Closed fist thrust = punch
      if (g === 'closed_fist') return { type: 'punch', handIdx: i }
    }

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
