export type SoundId =
  | 'hammer_impact' | 'glass_crack'
  | 'drill' | 'axe_slash' | 'gun_shot'
  | 'explosion' | 'fire_loop' | 'blackhole_whoosh'
  | 'paintball_hit'

export class AudioManager {
  private static instance: AudioManager
  private muted = false
  private ctx: AudioContext | null = null
  
  // Keep track of looping sounds
  private loops = new Map<SoundId, { osc: OscillatorNode, gain: GainNode }>()

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager()
    return AudioManager.instance
  }

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.ctx
  }

  play(id: SoundId, volume: number = 0.5) {
    if (this.muted) return
    const ctx = this.getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const t = ctx.currentTime

    // Synthesize sounds procedurally!
    if (id === 'gun_shot') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(150, t)
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.1)
      gain.gain.setValueAtTime(volume, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.2)
      
      // White noise for gunshot crack
      this.playNoise(t, 0.2, volume)
    } 
    else if (id === 'hammer_impact') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(300, t)
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15)
      gain.gain.setValueAtTime(volume, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.2)
      
      // Add a chunky glass/wood impact noise
      this.playNoise(t, 0.25, volume * 1.2, 'lowpass', 2000)
    }
    else if (id === 'glass_crack') {
      // High pitched crunchy noise for egg splat/glass
      this.playNoise(t, 0.15, volume * 0.7, 'highpass')
    }
    else if (id === 'explosion') {
      this.playNoise(t, 0.8, volume * 1.5, 'lowpass', 800)
    }
    else if (id === 'blackhole_whoosh') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(60, t)
      osc.frequency.linearRampToValueAtTime(300, t + 2.5) // pitch up
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(volume, t + 1.5)
      gain.gain.linearRampToValueAtTime(0, t + 3.0)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t + 3.0)
    }
    else if (id === 'drill') {
      // Continuous loop
      if (this.loops.has('drill')) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(400, t)
      gain.gain.setValueAtTime(volume * 0.3, t)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t)
      this.loops.set('drill', { osc, gain })
    }
    else if (id === 'fire_loop') {
      if (this.loops.has('fire_loop')) return
      // Noise loop for fire
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 1500
      
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(volume * 0.4, t)
      
      noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
      noise.start(t)
      // Hack to store buffer source as 'osc' so we can stop it
      this.loops.set('fire_loop', { osc: noise as any, gain })
    }
  }

  private playNoise(t: number, duration: number, vol: number, filterType?: BiquadFilterType, freq = 1000) {
    const ctx = this.getCtx()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration)
    
    if (filterType) {
      const filter = ctx.createBiquadFilter()
      filter.type = filterType; filter.frequency.value = freq
      noise.connect(filter); filter.connect(gain)
    } else {
      noise.connect(gain)
    }
    
    gain.connect(ctx.destination)
    noise.start(t)
  }

  stop(id: SoundId) {
    if (this.loops.has(id)) {
      const { osc, gain } = this.loops.get(id)!
      const t = this.getCtx().currentTime
      gain.gain.setValueAtTime(gain.gain.value, t)
      gain.gain.linearRampToValueAtTime(0, t + 0.1)
      setTimeout(() => { try { osc.stop() } catch {} }, 150)
      this.loops.delete(id)
    }
  }

  setMuted(muted: boolean) { 
    this.muted = muted
    if (muted && this.ctx) {
      this.loops.forEach(({ gain }) => gain.gain.value = 0)
    }
  }
  
  isMuted() { return this.muted }
}
