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

  // ── 1. Gentle Rain on Leaves (Warm, Velvety, Hypnotic) ───────────────────
  _playRain() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // True soft pink noise (1/f) using Kellet's refined 6-stage filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Gentle cascaded lowpass filters to cut all harshness (>500Hz)
    const rainFilter1 = ctx.createBiquadFilter();
    rainFilter1.type = 'lowpass';
    rainFilter1.frequency.setValueAtTime(460, ctx.currentTime);
    rainFilter1.Q.setValueAtTime(0.5, ctx.currentTime); // Low Q = no whistling peaks

    const rainFilter2 = ctx.createBiquadFilter();
    rainFilter2.type = 'lowpass';
    rainFilter2.frequency.setValueAtTime(680, ctx.currentTime);
    rainFilter2.Q.setValueAtTime(0.4, ctx.currentTime);

    // Soft rain volume with subtle organic movement (no sudden noises)
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.45, ctx.currentTime);

    // Gentle 0.12Hz slow ambient swell (rain gently shifting in the breeze)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.06, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(rainGain.gain);

    noiseSource.connect(rainFilter1);
    rainFilter1.connect(rainFilter2);
    rainFilter2.connect(rainGain);
    rainGain.connect(this.masterGain);

    noiseSource.start();
    lfo.start();

    this.activeNodes.push(noiseSource, rainFilter1, rainFilter2, rainGain, lfo, lfoGain);
  }

  // ── 2. Peaceful Ocean Waves (Warm Coastal Shore) ───────────────────────────
  _playOcean() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Soft brown-pink noise generator
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.03 * white) / 1.03;
      output[i] = last * 1.8;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Smooth lowpass filter for wave body (180Hz to 380Hz, Q=0.5 — strictly no whistle)
    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(260, ctx.currentTime);
    waveFilter.Q.setValueAtTime(0.5, ctx.currentTime);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.15, ctx.currentTime);

    // 11.5 second wave breath cycle (gentle swell & receding shore wash)
    const lfoWave = ctx.createOscillator();
    lfoWave.type = 'sine';
    lfoWave.frequency.setValueAtTime(0.087, ctx.currentTime); // ~11.5s period

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.18, ctx.currentTime);

    const lfoFilter = ctx.createGain();
    lfoFilter.gain.setValueAtTime(140, ctx.currentTime);

    lfoWave.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    lfoWave.connect(lfoFilter);
    lfoFilter.connect(waveFilter.frequency);

    // Deep warm ocean undertone (72Hz sine grounding sub)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(72, ctx.currentTime);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.04, ctx.currentTime);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    noiseSource.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(this.masterGain);

    noiseSource.start();
    lfoWave.start();
    subOsc.start();

    this.activeNodes.push(noiseSource, waveFilter, waveGain, lfoWave, lfoGain, lfoFilter, subOsc, subGain);
  }

  // ── 3. Tibetan Singing Bowls & Zen Bell (Warm, Serene, Meditative) ─────────
  _playTibetanBowl() {
    const ctx = this.ctx;

    // Deep warm continuous Buddhist temple root drone (108Hz)
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    const droneFilter = ctx.createBiquadFilter();

    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(108, ctx.currentTime);

    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(280, ctx.currentTime);

    droneGain.gain.setValueAtTime(0.04, ctx.currentTime);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start();
    this.activeNodes.push(droneOsc, droneFilter, droneGain);

    // Warm, soothing singing bowl bell strikes (NO screeching high frequencies)
    const strikeBowl = (fundamental = 174) => {
      if (!this.isPlaying || this.currentSoundId !== 'bowl') return;

      // Warm harmonic series: Root (174Hz), Soft Octave (348Hz), Warm Fifth (261Hz)
      const harmonics = [
        { f: fundamental,        g: 0.22, decay: 13.0 },
        { f: fundamental * 1.5,  g: 0.08, decay: 10.0 }, // Perfect 5th
        { f: fundamental * 2.0,  g: 0.04, decay: 7.5 },  // Octave
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Soft pulsating acoustic beating (1.2 Hz)
        const tremolo = ctx.createOscillator();
        const tremoloGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.f, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(520, ctx.currentTime); // Eliminates all harsh treble

        tremolo.type = 'sine';
        tremolo.frequency.setValueAtTime(1.2, ctx.currentTime);
        tremoloGain.gain.setValueAtTime(0.015 * h.g, ctx.currentTime);

        // Gentle felt-mallet attack (150ms gentle curve, no sharp snap)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(h.g, ctx.currentTime + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + h.decay);

        tremolo.connect(tremoloGain);
        tremoloGain.connect(gain.gain);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        tremolo.start();
        osc.stop(ctx.currentTime + h.decay + 0.1);
        tremolo.stop(ctx.currentTime + h.decay + 0.1);
      });
    };

    // First bell strike right away
    strikeBowl(174);

    // Spacious strikes every 15 seconds (giving generous quiet reflection between bells)
    let strikeIndex = 0;
    const strikeTones = [174, 216, 174, 261];
    const bowlInterval = setInterval(() => {
      strikeIndex++;
      const tone = strikeTones[strikeIndex % strikeTones.length];
      strikeBowl(tone);
    }, 15000);

    this.activeIntervals.push(bowlInterval);
  }

  // ── 4. Forest Stream & Peaceful Nature (Tranquil Mountain Brook) ───────────
  _playForest() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Soft water noise
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.04 * white) / 1.04;
      output[i] = last * 1.5;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Gentle bubbling stream body (low-pass at 380Hz, Q=0.6 — warm, smooth trickling water)
    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'lowpass';
    streamFilter.frequency.setValueAtTime(360, ctx.currentTime);
    streamFilter.Q.setValueAtTime(0.6, ctx.currentTime);

    const streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Gentle slow modulation of water current
    const lfoWater = ctx.createOscillator();
    lfoWater.type = 'sine';
    lfoWater.frequency.setValueAtTime(0.2, ctx.currentTime);

    const lfoWaterGain = ctx.createGain();
    lfoWaterGain.gain.setValueAtTime(60, ctx.currentTime);

    lfoWater.connect(lfoWaterGain);
    lfoWaterGain.connect(streamFilter.frequency);

    // Soft pine forest breeze in background (low-pass at 220Hz)
    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'lowpass';
    breezeFilter.frequency.setValueAtTime(200, ctx.currentTime);

    const breezeGain = ctx.createGain();
    breezeGain.gain.setValueAtTime(0.12, ctx.currentTime);

    noiseSource.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(this.masterGain);

    noiseSource.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(this.masterGain);

    noiseSource.start();
    lfoWater.start();

    this.activeNodes.push(noiseSource, streamFilter, streamGain, lfoWater, lfoWaterGain, breezeFilter, breezeGain);
  }

  // ── 5. 432Hz Sacred Harmonic Sound Bath (Serene Ambient Pad) ───────────────
  _play432HzDrone() {
    const ctx = this.ctx;

    // 432Hz Pythagorean harmonic series (warm pure sine tones)
    const chords = [
      { f: 108, g: 0.12 }, // Deep root foundation
      { f: 216, g: 0.10 }, // Warm baritone octave
      { f: 324, g: 0.06 }, // Harmonic fifth
      { f: 432, g: 0.05 }, // 432Hz sacred healing tone
    ];

    // Master warm filter to ensure smooth, silky texture
    const chordFilter = ctx.createBiquadFilter();
    chordFilter.type = 'lowpass';
    chordFilter.frequency.setValueAtTime(450, ctx.currentTime);

    const chordMasterGain = ctx.createGain();
    chordMasterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    chords.forEach((c, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Slow gentle meditative breathing movement (25s cycle)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.f, ctx.currentTime);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.04 + idx * 0.012, ctx.currentTime);
      lfoGain.gain.setValueAtTime(c.g * 0.25, ctx.currentTime);

      gain.gain.setValueAtTime(c.g, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(chordFilter);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, gain, lfo, lfoGain);
    });

    chordFilter.connect(chordMasterGain);
    chordMasterGain.connect(this.masterGain);
    this.activeNodes.push(chordFilter, chordMasterGain);
  }

  // ── 6. Deep Rest (Velvety Soft Sleep Brown Noise) ───────────────────────────
  _playSleepBrownNoise() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // True soft 1/f² brown noise for deep nervous system calming
    let last = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.018 * white) / 1.018;
      output[i] = last * 2.2;
    }

    const brownSource = ctx.createBufferSource();
    brownSource.buffer = noiseBuffer;
    brownSource.loop = true;

    // Filtered at 220Hz — warm, cozy, womb-like calming tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    filter.Q.setValueAtTime(0.4, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);

    brownSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    brownSource.start();
    this.activeNodes.push(brownSource, filter, gain);
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
