/**
 * solarSystem.js — SolarSystem class for StarSong Orchestra
 *
 * Manages the central star, planet collection, rendering,
 * and interaction (click detection, add/remove planets).
 */

import { Planet } from './planet.js';

export class SolarSystem {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {import('./audioEngine.js').AudioEngine} audioEngine
     */
    constructor(canvas, audioEngine) {
        this.canvas      = canvas;
        this.audioEngine = audioEngine;

        /** @type {Planet[]} */
        this.planets = [];

        // Star visual state
        this.starPulse = 0;      // 0–1, pulses when many planets play
        this.showTrails = true;

        // Camera / zoom
        this.zoom   = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /* ── Centre of the star (always canvas centre) ──────────────────── */
    get cx() { return this.canvas.width / 2 + this.offsetX; }
    get cy() { return this.canvas.height / 2 + this.offsetY; }

    /* ── Add a new planet with auto-incrementing orbit radius ───────── */
    addPlanet(opts = {}) {
        const index = this.planets.length;
        const minRadius = 80;
        const spacing   = 55;
        const orbitRadius = opts.orbitRadius ?? (minRadius + index * spacing);
        const planet = new Planet({ ...opts, orbitRadius }, this.audioEngine);
        this.planets.push(planet);
        return planet;
    }

    /* ── Remove a planet ────────────────────────────────────────────── */
    removePlanet(planet) {
        this.planets = this.planets.filter(p => p !== planet);
    }

    /* ── Update all planets ─────────────────────────────────────────── */
    update(deltaTime) {
        for (const planet of this.planets) {
            planet.update(deltaTime);
        }
        // Decay star pulse
        this.starPulse = Math.max(0, this.starPulse - deltaTime * 2);
    }

    /* ── Draw everything ────────────────────────────────────────────── */
    draw(ctx) {
        const cx = this.cx;
        const cy = this.cy;

        ctx.save();
        // Optional zoom (centred on star)
        if (this.zoom !== 1) {
            ctx.translate(cx, cy);
            ctx.scale(this.zoom, this.zoom);
            ctx.translate(-cx, -cy);
        }

        // ── Background gradient ──
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(this.canvas.width, this.canvas.height) * 0.7);
        bgGrad.addColorStop(0, '#12123a');
        bgGrad.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ── Stars (background twinkle) ──
        this._drawBackgroundStars(ctx);

        // ── Central star ──
        this._drawStar(ctx, cx, cy);

        // ── Planets ──
        for (const planet of this.planets) {
            planet.draw(ctx, cx, cy, this.showTrails);
        }

        ctx.restore();
    }

    /* ── Draw the central star ──────────────────────────────────────── */
    _drawStar(ctx, cx, cy) {
        const baseRadius = 22;
        const pulse = 1 + this.starPulse * 0.25;
        const r = baseRadius * pulse;

        // Outer glow
        const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 3);
        glow.addColorStop(0, 'rgba(255, 230, 150, 0.5)');
        glow.addColorStop(0.5, 'rgba(255, 200, 100, 0.15)');
        glow.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
        ctx.fill();

        // Star body
        const body = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        body.addColorStop(0, '#fffbe6');
        body.addColorStop(0.6, '#ffd966');
        body.addColorStop(1, '#ffaa33');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    /* ── Procedural background stars (seeded, deterministic) ────────── */
    _bgStarsCache = null;
    _drawBackgroundStars(ctx) {
        if (!this._bgStarsCache) {
            this._bgStarsCache = [];
            const seed = 42;
            let s = seed;
            const rand = () => { s = (s * 16807 + 11) % 2147483647; return s / 2147483647; };
            for (let i = 0; i < 200; i++) {
                this._bgStarsCache.push({
                    x: rand(),
                    y: rand(),
                    r: 0.5 + rand() * 1.5,
                    a: 0.3 + rand() * 0.5,
                });
            }
        }
        for (const s of this._bgStarsCache) {
            ctx.fillStyle = `rgba(255,255,255,${s.a})`;
            ctx.beginPath();
            ctx.arc(s.x * this.canvas.width, s.y * this.canvas.height, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ── Click detection: returns the clicked Planet or null ─────────── */
    handlePlanetClick(mx, my) {
        const cx = this.cx;
        const cy = this.cy;
        // Check in reverse so top-drawn planets are checked first
        for (let i = this.planets.length - 1; i >= 0; i--) {
            if (this.planets[i].isClicked(mx, my, cx, cy)) {
                return this.planets[i];
            }
        }
        return null;
    }

    /* ── Serialise ──────────────────────────────────────────────────── */
    toJSON() {
        return {
            showTrails: this.showTrails,
            planets: this.planets.map(p => p.toJSON()),
        };
    }

    /* ── Load from saved data ───────────────────────────────────────── */
    loadFromJSON(data) {
        this.planets = [];
        this.showTrails = data.showTrails ?? true;
        for (const pd of data.planets) {
            this.addPlanet(pd);
        }
    }
}

