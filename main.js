/**
 * main.js — Entry point for StarSong Orchestra
 *
 * Initialises the canvas, audio engine, solar system, music editor,
 * and UI manager. Runs the global BPM clock and render loop.
 */

import { AudioEngine }  from './audioEngine.js';
import { SolarSystem }  from './solarSystem.js';
import { MusicEditor }  from './musicEditor.js';
import { UIManager }     from './ui.js';

// ═══════════════════════════════════════════════════════════════════
//  GLOBALS
// ═══════════════════════════════════════════════════════════════════

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

// Shared clock state
const globalClock = {
    bpm: 120,
    steps: 16,
    currentStep: 0,
    stepAccumulator: 0,   // time accumulated toward next step
};

// ═══════════════════════════════════════════════════════════════════
//  INITIALISATION
// ═══════════════════════════════════════════════════════════════════

const audioEngine  = new AudioEngine();
const solarSystem  = new SolarSystem(canvas, audioEngine);
const musicEditor  = new MusicEditor();
const uiManager    = new UIManager(solarSystem, audioEngine, musicEditor, globalClock);

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Try loading saved system; if nothing saved, spawn a starter planet
const loaded = uiManager.loadSystem();
if (!loaded) {
    // Add two demo planets so the user sees something immediately
    solarSystem.addPlanet({ instrumentType: 'sine',     color: '#4dabf7' });
    solarSystem.addPlanet({ instrumentType: 'triangle', color: '#69db7c' });
}

// ═══════════════════════════════════════════════════════════════════
//  RENDER + SEQUENCER LOOP
// ═══════════════════════════════════════════════════════════════════

let lastTime = performance.now();

function loop(now) {
    requestAnimationFrame(loop);

    const deltaTime = (now - lastTime) / 1000;   // seconds
    lastTime = now;

    // ── Sequencer tick ──────────────────────────────────────────────
    const stepDuration = (60 / globalClock.bpm) / 4;   // 16th-note duration
    globalClock.stepAccumulator += deltaTime;

    if (globalClock.stepAccumulator >= stepDuration) {
        globalClock.stepAccumulator -= stepDuration;
        globalClock.currentStep = (globalClock.currentStep + 1) % globalClock.steps;

        // Fire notes on every planet
        let anyPlayed = false;
        for (const planet of solarSystem.planets) {
            const hadNotes = planet.noteGrid.some(row => row[globalClock.currentStep]);
            planet.playNotesAtStep(globalClock.currentStep);
            if (hadNotes) anyPlayed = true;
        }
        // Pulse the star when multiple planets play at once
        if (anyPlayed) {
            solarSystem.starPulse = Math.min(1, solarSystem.starPulse + 0.4);
        }

        // Update editor step highlight
        musicEditor.highlightStep(globalClock.currentStep);
    }

    // ── Update & draw ───────────────────────────────────────────────
    solarSystem.update(deltaTime);
    solarSystem.draw(ctx);
}

// Kick off the loop
requestAnimationFrame(loop);

