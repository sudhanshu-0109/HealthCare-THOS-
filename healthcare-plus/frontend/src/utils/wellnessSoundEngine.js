/**
 * utils/wellnessSoundEngine.js
 *
 * Professional Web Audio API sound synthesis engine for Mental Wellness activities.
 * 100% self-contained, offline, zero-dependency, and royalty-free.
 *
 * Soundscapes:
 *  - 'rain'        : Gentle rainfall with soft thunder & drizzle filter
 *  - 'ocean'       : Soothing rhythmic ocean waves & beach shore surf
 *  - 'bowl'        : Tibetan singing bowls & Zen bell harmonics with long resonant decay
 *  - 'forest'      : Babbling forest stream with gentle morning nature acoustics
 *  - 'drone_432'   : 432Hz harmonic sound bath & warm meditative ambient chords
 *  - 'sleep_noise' : Deep warm brown noise for sleep & nervous system calming
 */

class WellnessSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentSoundId = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.activeNodes = [];
    this.activeIntervals = [];
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }
  }

  stop(fadeTime = 0.8) {
    if (!this.ctx || !this.isPlaying) {
      this.isPlaying = false;
      return;
    }

    this.activeIntervals.forEach(id => clearInterval(id));
    this.activeIntervals = [];

    const now = this.ctx.currentTime;
    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeTime);
    } catch { /* ignore */ }

    setTimeout(() => {
      this.activeNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch { /* ignore */ }
      });
      this.activeNodes = [];
      this.isPlaying = false;
      this.currentSoundId = null;
    }, fadeTime * 1000 + 50);
  }

  play(soundId) {
    if (!soundId || soundId === 'none') {
      this.stop();
      return;
    }

    if (this.isPlaying && this.currentSoundId === soundId) {
      return; // already playing this sound
    }

    this.stop(0.3); // quick crossfade

    setTimeout(() => {
      if (!this._initContext()) return;

      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 1.2);

      this.currentSoundId = soundId;
      this.isPlaying = true;

      switch (soundId) {
        case 'rain':
          this._playRain();
          break;
        case 'ocean':
          this._playOcean();
          break;
        case 'bowl':
          this._playTibetanBowl();
          break;
        case 'forest':
          this._playForest();
          break;
        case 'drone_432':
          this._play432HzDrone();
          break;
        case 'sleep_noise':
          this._playSleepBrownNoise();
          break;
        default:
          this._playOcean();
      }
    }, 350);
  }

  // ── 1. Gentle Rain & Soft Drizzle ──────────────────────────────────────────
  _playRain() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate pink/brown noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Rain low-pass filter
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);

    // High sizzle layer for realistic drizzle
    const sizzleFilter = ctx.createBiquadFilter();
    sizzleFilter.type = 'bandpass';
    sizzleFilter.frequency.setValueAtTime(3200, ctx.currentTime);
    sizzleFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.7, ctx.currentTime);

    const sizzleGain = ctx.createGain();
    sizzleGain.gain.setValueAtTime(0.2, ctx.currentTime);

    whiteNoise.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);

    whiteNoise.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, rainFilter, sizzleFilter, rainGain, sizzleGain);

    // Distant subtle warm thunder rumble every 22 seconds
    const triggerThunder = () => {
      if (!this.isPlaying || this.currentSoundId !== 'rain') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 3.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 4.6);
    };

    const thunderInterval = setInterval(triggerThunder, 22000);
    this.activeIntervals.push(thunderInterval);
  }

  // ── 2. Peaceful Ocean Shore Waves ──────────────────────────────────────────
  _playOcean() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Resonant bandpass filter modulated by LFO to simulate surging swell
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(2.0, ctx.currentTime);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.1, ctx.currentTime);

    // LFO for wave rhythmic cycle (0.09 Hz = ~11-second wave breath rhythm)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.09, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Modulate filter cutoff with wave swell
    const lfoFilterGain = ctx.createGain();
    lfoFilterGain.gain.setValueAtTime(400, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    lfo.connect(lfoFilterGain);
    lfoFilterGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();

    this.activeNodes.push(whiteNoise, filter, waveGain, lfo, lfoGain, lfoFilterGain);
  }

  // ── 3. Tibetan Singing Bowls & Zen Bell ────────────────────────────────────
  _playTibetanBowl() {
    const ctx = this.ctx;

    // Deep continuous warm background drone (108Hz / 216Hz)
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(108, ctx.currentTime);
    droneGain.gain.setValueAtTime(0.08, ctx.currentTime);

    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start();
    this.activeNodes.push(droneOsc, droneGain);

    // Multi-harmonic singing bowl strike generator
    const strikeBowl = (fundamental = 216) => {
      if (!this.isPlaying || this.currentSoundId !== 'bowl') return;

      const harmonics = [
        { f: fundamental,        g: 0.35, decay: 9.0 },
        { f: fundamental * 2.76, g: 0.15, decay: 6.5 },
        { f: fundamental * 5.4,  g: 0.08, decay: 4.5 },
        { f: fundamental * 8.9,  g: 0.03, decay: 3.0 },
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const tremolo = ctx.createOscillator();
        const tremoloGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.f, ctx.currentTime);

        // Subtle ~2.5Hz pulsating singing bowl modulation
        tremolo.type = 'sine';
        tremolo.frequency.setValueAtTime(2.5, ctx.currentTime);
        tremoloGain.gain.setValueAtTime(0.02 * h.g, ctx.currentTime);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(h.g, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + h.decay);

        tremolo.connect(tremoloGain);
        tremoloGain.connect(gain.gain);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        tremolo.start();
        osc.stop(ctx.currentTime + h.decay + 0.1);
        tremolo.stop(ctx.currentTime + h.decay + 0.1);
      });
    };

    // Initial strike right away
    strikeBowl(216);

    // Recurring bell strike every 12 seconds
    let strikeCount = 0;
    const intervals = [216, 288, 324, 216];
    const bowlInterval = setInterval(() => {
      strikeCount++;
      const f = intervals[strikeCount % intervals.length];
      strikeBowl(f);
    }, 12000);

    this.activeIntervals.push(bowlInterval);
  }

  // ── 4. Forest Stream & Nature ──────────────────────────────────────────────
  _playForest() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Resonant water babble bandpass filter
    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'bandpass';
    streamFilter.frequency.setValueAtTime(950, ctx.currentTime);
    streamFilter.Q.setValueAtTime(3.0, ctx.currentTime);

    // Second filter for bubbling highs
    const bubbleFilter = ctx.createBiquadFilter();
    bubbleFilter.type = 'bandpass';
    bubbleFilter.frequency.setValueAtTime(1800, ctx.currentTime);
    bubbleFilter.Q.setValueAtTime(4.0, ctx.currentTime);

    const streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.4, ctx.currentTime);

    const bubbleGain = ctx.createGain();
    bubbleGain.gain.setValueAtTime(0.2, ctx.currentTime);

    // Slow modulation for natural water current flow
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.35, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(streamFilter.frequency);

    whiteNoise.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(this.masterGain);

    whiteNoise.connect(bubbleFilter);
    bubbleFilter.connect(bubbleGain);
    bubbleGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();

    this.activeNodes.push(whiteNoise, streamFilter, bubbleFilter, streamGain, bubbleGain, lfo, lfoGain);

    // Gentle bird chirp every 8-15 seconds
    const triggerBird = () => {
      if (!this.isPlaying || this.currentSoundId !== 'forest') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startFreq = 2800 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(startFreq + 600, ctx.currentTime + 0.08);
      osc.frequency.linearRampToValueAtTime(startFreq - 200, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    };

    const birdInterval = setInterval(triggerBird, 9000);
    this.activeIntervals.push(birdInterval);
  }

  // ── 5. 432Hz Sound Bath & Ambient Chord Pad ───────────────────────────────
  _play432HzDrone() {
    const ctx = this.ctx;
    // Harmonic series tuned around 432Hz (432Hz, 216Hz, 648Hz, 864Hz)
    const freqs = [108, 216, 432, 648];
    const gains = [0.12, 0.15, 0.10, 0.04];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      // Slow breathing movement (0.05 Hz = 20s cycle)
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.04 + idx * 0.015, ctx.currentTime);
      lfoGain.gain.setValueAtTime(gains[idx] * 0.3, ctx.currentTime);

      gain.gain.setValueAtTime(gains[idx], ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, gain, lfo, lfoGain);
    });
  }

  // ── 6. Deep Brown Noise (Sleep & Rest) ─────────────────────────────────────
  _playSleepBrownNoise() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    const brownNoise = ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, ctx.currentTime);

    brownNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    brownNoise.start();
    this.activeNodes.push(brownNoise, filter, gain);
  }
}

// Global Singleton sound engine instance
export const wellnessAudio = new WellnessSoundEngine();

/**
 * Soundscape preset registry for UI selection
 */
export const WELLNESS_SOUNDSCAPES = [
  { id: 'rain',        name: 'Gentle Rain',    icon: '🌧️', desc: 'Soft rain on leaves & distant thunder' },
  { id: 'ocean',       name: 'Ocean Waves',    icon: '🌊', desc: 'Rhythmic shore waves for breathing' },
  { id: 'bowl',        name: 'Tibetan Bowl',   icon: '🥣', desc: 'Zen bell & singing bowl harmonics' },
  { id: 'forest',      name: 'Forest Stream',  icon: '🌲', desc: 'Flowing water & morning birdsong' },
  { id: 'drone_432',   name: '432Hz Chords',   icon: '🎵', desc: 'Harmonic sound bath relaxation' },
  { id: 'sleep_noise', name: 'Deep Rest',      icon: '🌙', desc: 'Warm calming brown noise for sleep' },
  { id: 'none',        name: 'Silent / Off',   icon: '🔇', desc: 'No background audio' },
];

/**
 * Maps activity type to its optimal default soundscape
 */
export const DEFAULT_ACTIVITY_SOUNDS = {
  BREATHING:        'ocean',       // Rhythmic ocean surge perfectly fits 4-4 breath cycle
  MEDITATION:       'bowl',        // Tibetan singing bowls & Zen bell
  MINDFULNESS:      'forest',      // Babbling stream & serene nature
  SLEEP_SOUND:      'rain',        // Calming gentle rainfall
  SLEEP_STORY:      'sleep_noise', // Deep warm sleep noise
  RELAXATION_MUSIC: 'drone_432',   // 432Hz harmonic sound bath
  GRATITUDE:        'drone_432',   // Warm uplifting harmonic pads
  GROUNDING:        'forest',      // Earthy stream & nature
  FOCUS:            'forest',      // Calming water flow for mental clarity
};
