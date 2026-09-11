import { Howl, Howler } from 'howler'

type SoundId =
  | 'hammer_impact' | 'glass_crack'
  | 'drill' | 'axe_slash' | 'paintball_hit'
  | 'explosion' | 'fire_loop' | 'blackhole_whoosh'

const SOUNDS: Record<SoundId, { src: string[]; volume: number; loop?: boolean }> = {
  hammer_impact:    { src: ['assets/audio/hammer_impact.mp3'],   volume: 0.7 },
  glass_crack:      { src: ['assets/audio/glass_crack.mp3'],     volume: 0.5 },
  drill:            { src: ['assets/audio/drill.mp3'],           volume: 0.6, loop: true },
  axe_slash:        { src: ['assets/audio/axe_slash.mp3'],       volume: 0.8 },
  paintball_hit:    { src: ['assets/audio/paintball_hit.mp3'],   volume: 0.6 },
  explosion:        { src: ['assets/audio/explosion.mp3'],       volume: 1.0 },
  fire_loop:        { src: ['assets/audio/fire_loop.mp3'],       volume: 0.5, loop: true },
  blackhole_whoosh: { src: ['assets/audio/blackhole_whoosh.mp3'], volume: 0.8 },
}

export class AudioManager {
  private static instance: AudioManager
  private sounds = new Map<SoundId, Howl>()
  private muted = false

  private constructor() {
    for (const [id, def] of Object.entries(SOUNDS) as [SoundId, typeof SOUNDS[SoundId]][]) {
      this.sounds.set(id, new Howl({
        src: def.src, volume: def.volume, loop: def.loop ?? false, preload: true,
        onloaderror: (_id, err) => console.warn(`[Audio] Missing: ${id}`, err),
      }))
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager()
    return AudioManager.instance
  }

  play(id: SoundId, volume?: number) {
    if (this.muted) return
    const h = this.sounds.get(id); if (!h) return
    if (volume !== undefined) h.volume(volume)
    // For looping sounds, stop before replaying
    if (h.loop()) h.stop()
    h.play()
  }

  stop(id: SoundId) { this.sounds.get(id)?.stop() }

  setMuted(muted: boolean) { this.muted = muted; Howler.mute(muted) }
  isMuted() { return this.muted }
}
