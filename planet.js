/**
 * planet.js — Planet class for StarSong Orchestra
 *
 * Each planet represents an instrument orbiting the central star.
 * It holds a 16×8 note grid and renders itself on the canvas.
 */

// ── Random planet name generator ───────────────────────────────────
const NAME_PREFIXES = [
    'Zel', 'Kry', 'Lun', 'Vor', 'Aur', 'Neb', 'Sol', 'Tyx',
    'Pho', 'Cel', 'Rin', 'Dra', 'Xen', 'Ori', 'Vex', 'Eos',
];
const NAME_SUFFIXES = [
    'ara', 'ion', 'ith', 'ova', 'ius', 'ala', 'eon', 'ora',
    'yx', 'is', 'um', 'ax', 'os', 'an', 'el', 'us',
];

function randomName() {
    const pre = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
    const suf = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
    return pre + suf;
}

// ── Constants ──────────────────────────────────────────────────────
const GRID_COLS = 16;   // time steps
const GRID_ROWS = 8;    // scale degrees

const PLANET_COLORS = [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c',
    '#4dabf7', '#9775fa', '#f783ac', '#63e6be',
];

const INSTRUMENT_TYPES = ['sine', 'square', 'triangle', 'sawtooth', 'noise'];

export class Planet {
    /**
     * @param {object}      opts
     * @param {string}      [opts.name]
     * @param {string}      [opts.color]
     * @param {number}      opts.orbitRadius
     * @param {number}      [opts.orbitSpeed]   — radians per second
     * @param {string}      [opts.instrumentType]
     * @param {boolean[][]} [opts.noteGrid]     — 8×16 matrix
     * @param {number}      [opts.angle]        — starting angle
     * @param {import('./audioEngine.js').AudioEngine} audioEngine
     */
    constructor(opts, audioEngine) {
        this.name           = opts.name || randomName();
        this.color          = opts.color || PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
        this.orbitRadius    = opts.orbitRadius;
        this.orbitSpeed     = opts.orbitSpeed ?? (0.15 + Math.random() * 0.35);
        this.instrumentType = opts.instrumentType || INSTRUMENT_TYPES[Math.floor(Math.random() * INSTRUMENT_TYPES.length)];
        this.angle          = opts.angle ?? Math.random() * Math.PI * 2;
        this.size           = 10 + Math.random() * 6;   // render radius
        this.audioEngine    = audioEngine;

        // ── Note grid (rows × cols): row 0 = highest pitch ──
        this.noteGrid = opts.noteGrid
            ? opts.noteGrid.map(r => [...r])
            : Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));

        // ── Visual state ──
        this.glowIntensity = 0;   // 0–1, pulses when a note plays
        this.trail = [];          // recent positions for orbit trail
    }

    /* ── Update position ────────────────────────────────────────────── */
    update(deltaTime) {
        this.angle += this.orbitSpeed * deltaTime;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;

        // Decay glow
        this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * 3);

        // Store trail
        const pos = this.getPosition(0, 0);
        this.trail.push({ x: pos.x, y: pos.y, alpha: 1 });
        if (this.trail.length > 80) this.trail.shift();
        for (const t of this.trail) t.alpha -= deltaTime * 1.2;
    }

    /* ── Get world-space position (provide star center) ─────────────── */
    getPosition(cx, cy) {
        return {
            x: cx + Math.cos(this.angle) * this.orbitRadius,
            y: cy + Math.sin(this.angle) * this.orbitRadius,
        };
    }

    /* ── Draw planet + glow on canvas ───────────────────────────────── */
    draw(ctx, cx, cy, showTrails) {
        const pos = this.getPosition(cx, cy);

        // ── Orbit ring ──
        ctx.beginPath();
        ctx.arc(cx, cy, this.orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Orbit trail ──
        if (showTrails && this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const t = this.trail[i];
                if (t.alpha <= 0) continue;
                ctx.beginPath();
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(t.x, t.y);
                ctx.strokeStyle = this.color + Math.round(t.alpha * 60).toString(16).padStart(2, '0');
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // ── Glow ──
        if (this.glowIntensity > 0) {
            const glowRadius = this.size * (2 + this.glowIntensity * 2);
            const grad = ctx.createRadialGradient(pos.x, pos.y, this.size * 0.5, pos.x, pos.y, glowRadius);
            grad.addColorStop(0, this.color + 'aa');
            grad.addColorStop(1, this.color + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Planet body ──
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // ── Name label ──
        ctx.fillStyle = '#ffffffcc';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, pos.x, pos.y + this.size + 14);
    }

    /* ── Hit detection ──────────────────────────────────────────────── */
    isClicked(mx, my, cx, cy) {
        const pos = this.getPosition(cx, cy);
        const dx = mx - pos.x;
        const dy = my - pos.y;
        return dx * dx + dy * dy <= (this.size + 6) * (this.size + 6);
    }

    /* ── Play notes at a given sequencer step ───────────────────────── */
    playNotesAtStep(step) {
        let played = false;
        for (let row = 0; row < GRID_ROWS; row++) {
            if (this.noteGrid[row][step]) {
                // Pan based on planet angle (-1 left, +1 right)
                const pan = Math.cos(this.angle);
                this.audioEngine.playNote(this.instrumentType, row, pan, 0.65);
                played = true;
            }
        }
        if (played) this.glowIntensity = 1;
    }

    /* ── Serialise for saving ───────────────────────────────────────── */
    toJSON() {
        return {
            name: this.name,
            color: this.color,
            orbitRadius: this.orbitRadius,
            orbitSpeed: this.orbitSpeed,
            instrumentType: this.instrumentType,
            angle: this.angle,
            noteGrid: this.noteGrid,
        };
    }
}

