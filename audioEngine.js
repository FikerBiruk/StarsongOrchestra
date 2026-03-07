/**
 * audioEngine.js — Web Audio API synthesis engine for StarSong Orchestra
 *
 * Handles sound generation with multiple instrument types, ADSR envelopes,
 * stereo panning, and optional reverb/delay effects.
 */

// ── Scale definitions (semitone offsets from root) ──────────────────
const SCALES = {
    pentatonic: [0, 2, 4, 7, 9, 12, 14, 16],   // 8 degrees across 2 octaves
    major:      [0, 2, 4, 5, 7, 9, 11, 12],
    minor:      [0, 2, 3, 5, 7, 8, 10, 12],
};

// ── ADSR presets per instrument type ────────────────────────────────
const INSTRUMENT_PRESETS = {
    sine:     { attack: 0.05, decay: 0.2, sustain: 0.4,  release: 0.4,  type: 'sine'     },
    square:   { attack: 0.01, decay: 0.1, sustain: 0.3,  release: 0.2,  type: 'square'   },
    triangle: { attack: 0.005,decay: 0.15,sustain: 0.0,  release: 0.3,  type: 'triangle' },
    sawtooth: { attack: 0.02, decay: 0.15,sustain: 0.25, release: 0.25, type: 'sawtooth' },
    noise:    { attack: 0.005,decay: 0.08,sustain: 0.0,  release: 0.1,  type: 'noise'    },
};

export class AudioEngine {
    /**
     * @param {number} baseNote — MIDI note number for the lowest row (default C4 = 60)
     */
    constructor(baseNote = 60) {
        /** @type {AudioContext|null} */
        this.ctx = null;
        this.baseNote = baseNote;
        this.currentScale = 'pentatonic';
        this.masterGain = null;
    }

    /* ── Lazy-initialise AudioContext (must be called after user gesture) ── */
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.ctx.destination);
    }

    /** Resume context if suspended (browser autoplay policy) */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /* ── Scale helpers ──────────────────────────────────────────────── */

    setScale(scaleName) {
        if (SCALES[scaleName]) this.currentScale = scaleName;
    }

    /**
     * Convert a grid row (0 = top = highest pitch) to a frequency.
     * Row 0 → highest note, row 7 → lowest note.
     */
    scaleDegreeToFrequency(row) {
        const scale = SCALES[this.currentScale];
        // Invert so row 0 = high
        const degree = scale[scale.length - 1 - row] ?? 0;
        const midiNote = this.baseNote + degree;
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    /* ── Play a single note ─────────────────────────────────────────── */

    /**
     * @param {string}  instrumentType — key into INSTRUMENT_PRESETS
     * @param {number}  row            — grid row (0–7)
     * @param {number}  pan            — stereo pan (-1 to 1)
     * @param {number}  velocity       — volume multiplier (0–1)
     */
    playNote(instrumentType, row, pan = 0, velocity = 0.8) {
        if (!this.ctx) return;
        const preset = INSTRUMENT_PRESETS[instrumentType] || INSTRUMENT_PRESETS.sine;
        const freq   = this.scaleDegreeToFrequency(row);
        const now    = this.ctx.currentTime;

        // ── Gain node with ADSR envelope ──
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity, now + preset.attack);
        gainNode.gain.linearRampToValueAtTime(
            velocity * preset.sustain,
            now + preset.attack + preset.decay
        );
        const noteEnd = now + preset.attack + preset.decay + 0.15;
        gainNode.gain.setValueAtTime(velocity * preset.sustain, noteEnd);
        gainNode.gain.linearRampToValueAtTime(0, noteEnd + preset.release);

        // ── Stereo panner ──
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));

        gainNode.connect(panner);
        panner.connect(this.masterGain);

        // ── Source node ──
        if (preset.type === 'noise') {
            this._playNoise(gainNode, noteEnd + preset.release);
        } else {
            const osc = this.ctx.createOscillator();
            osc.type = preset.type;
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(noteEnd + preset.release + 0.05);
        }
    }

    /* ── Noise generator (for percussion) ──────────────────────────── */
    _playNoise(destination, stopTime) {
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(destination);
        src.start(this.ctx.currentTime);
        src.stop(stopTime + 0.05);
    }
}

