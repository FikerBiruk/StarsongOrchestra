/**
 * ui.js — UIManager for StarSong Orchestra
 *
 * Wires up toolbar controls, manages editor open/close,
 * and handles save/load/export/import operations.
 */

export class UIManager {
    /**
     * @param {import('./solarSystem.js').SolarSystem} solarSystem
     * @param {import('./audioEngine.js').AudioEngine}  audioEngine
     * @param {import('./musicEditor.js').MusicEditor}  musicEditor
     * @param {object}  globalClock — shared clock state { bpm, steps }
     */
    constructor(solarSystem, audioEngine, musicEditor, globalClock) {
        this.solarSystem = solarSystem;
        this.audioEngine = audioEngine;
        this.musicEditor = musicEditor;
        this.globalClock  = globalClock;

        // ── DOM references ──
        this.canvas        = solarSystem.canvas;
        this.bpmSlider     = document.getElementById('bpm-slider');
        this.bpmValueEl    = document.getElementById('bpm-value');
        this.addPlanetBtn  = document.getElementById('btn-add-planet');
        this.toggleTrailsBtn = document.getElementById('btn-toggle-trails');
        this.scaleSelect   = document.getElementById('scale-select');
        this.saveBtn       = document.getElementById('btn-save');
        this.exportBtn     = document.getElementById('btn-export');
        this.importBtn     = document.getElementById('btn-import');
        this.importFileEl  = document.getElementById('import-file');
        this.startHint     = document.getElementById('start-hint');

        this._bindEvents();
    }

    /* ── Wire up all event listeners ────────────────────────────────── */
    _bindEvents() {
        // BPM slider
        this.bpmSlider.addEventListener('input', () => {
            this.globalClock.bpm = parseInt(this.bpmSlider.value, 10);
            this.bpmValueEl.textContent = this.globalClock.bpm;
        });

        // Add planet
        this.addPlanetBtn.addEventListener('click', () => {
            this.solarSystem.addPlanet();
        });

        // Toggle orbit trails
        this.toggleTrailsBtn.addEventListener('click', () => {
            this.solarSystem.showTrails = !this.solarSystem.showTrails;
            this.toggleTrailsBtn.style.opacity = this.solarSystem.showTrails ? '1' : '0.4';
        });

        // Scale select
        this.scaleSelect.addEventListener('change', () => {
            this.audioEngine.setScale(this.scaleSelect.value);
        });

        // Save to localStorage
        this.saveBtn.addEventListener('click', () => this.saveSystem());

        // Export JSON
        this.exportBtn.addEventListener('click', () => this.exportJSON());

        // Import JSON
        this.importBtn.addEventListener('click', () => this.importFileEl.click());
        this.importFileEl.addEventListener('change', (e) => this.importJSON(e));

        // Canvas click → planet selection
        this.canvas.addEventListener('click', (e) => {
            if (this.musicEditor.isOpen) return; // ignore when editor is open
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const planet = this.solarSystem.handlePlanetClick(mx, my);
            if (planet) {
                this.musicEditor.open(planet);
            }
        });

        // Start hint: resume audio on first click
        this.startHint.addEventListener('click', () => {
            this.audioEngine.init();
            this.audioEngine.resume();
            this.startHint.classList.add('hidden');
        });

        // Scroll wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            this.solarSystem.zoom = Math.max(0.3, Math.min(2.5, this.solarSystem.zoom + delta));
        }, { passive: false });
    }

    /* ── Save to localStorage ───────────────────────────────────────── */
    saveSystem() {
        const data = {
            bpm: this.globalClock.bpm,
            scale: this.audioEngine.currentScale,
            solarSystem: this.solarSystem.toJSON(),
        };
        localStorage.setItem('starsong-orchestra', JSON.stringify(data));
        console.log('💾 System saved.');
    }

    /* ── Load from localStorage ─────────────────────────────────────── */
    loadSystem() {
        const raw = localStorage.getItem('starsong-orchestra');
        if (!raw) return false;
        try {
            const data = JSON.parse(raw);
            this.globalClock.bpm = data.bpm || 120;
            this.bpmSlider.value = this.globalClock.bpm;
            this.bpmValueEl.textContent = this.globalClock.bpm;
            this.audioEngine.setScale(data.scale || 'pentatonic');
            this.scaleSelect.value = data.scale || 'pentatonic';
            this.solarSystem.loadFromJSON(data.solarSystem);
            console.log('📂 System loaded.');
            return true;
        } catch (err) {
            console.warn('Failed to load saved data:', err);
            return false;
        }
    }

    /* ── Export system as downloadable JSON ──────────────────────────── */
    exportJSON() {
        const data = {
            bpm: this.globalClock.bpm,
            scale: this.audioEngine.currentScale,
            solarSystem: this.solarSystem.toJSON(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'starsong-orchestra.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ── Import system from uploaded JSON file ──────────────────────── */
    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.globalClock.bpm = data.bpm || 120;
                this.bpmSlider.value = this.globalClock.bpm;
                this.bpmValueEl.textContent = this.globalClock.bpm;
                this.audioEngine.setScale(data.scale || 'pentatonic');
                this.scaleSelect.value = data.scale || 'pentatonic';
                this.solarSystem.loadFromJSON(data.solarSystem);
                this.musicEditor.close();
                console.log('📥 System imported.');
            } catch (err) {
                console.error('Import failed:', err);
            }
        };
        reader.readAsText(file);
        // Reset file input so the same file can be re-imported
        event.target.value = '';
    }
}

