/**
 * musicEditor.js — Chrome Music Lab–style grid editor for StarSong Orchestra
 *
 * Opens a 16×8 grid panel where users toggle notes on/off for a planet.
 * Highlights the current playback step in real time.
 */

const GRID_COLS = 16;
const GRID_ROWS = 8;

// Row labels (top = high, bottom = low) — display only
const ROW_LABELS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export class MusicEditor {
    constructor() {
        /** @type {import('./planet.js').Planet|null} */
        this.planet = null;

        this.isOpen = false;
        this.currentStep = -1;

        // DOM references
        this.editorEl       = document.getElementById('music-editor');
        this.gridEl         = document.getElementById('editor-grid');
        this.planetNameEl   = document.getElementById('editor-planet-name');
        this.instrumentEl   = document.getElementById('instrument-select');
        this.closeBtnEl     = document.getElementById('btn-close-editor');

        // Set grid template
        this.gridEl.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
        this.gridEl.style.gridTemplateRows    = `repeat(${GRID_ROWS}, 1fr)`;

        // Build cells
        /** @type {HTMLElement[][]} row-major */
        this.cells = [];
        for (let row = 0; row < GRID_ROWS; row++) {
            this.cells[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.gridEl.appendChild(cell);
                this.cells[row][col] = cell;

                // Toggle on click
                cell.addEventListener('click', () => this._toggleCell(row, col));
            }
        }

        // Instrument change
        this.instrumentEl.addEventListener('change', () => {
            if (this.planet) {
                this.planet.instrumentType = this.instrumentEl.value;
            }
        });

        // Close button
        this.closeBtnEl.addEventListener('click', () => this.close());
    }

    /* ── Open editor for a planet ───────────────────────────────────── */
    open(planet) {
        this.planet = planet;
        this.isOpen = true;
        this.planetNameEl.textContent = `🪐 ${planet.name}`;
        this.instrumentEl.value = planet.instrumentType;

        // Set cell colors from planet color
        const color = planet.color;
        this.gridEl.style.setProperty('--cell-color', color + 'bb');
        this.gridEl.style.setProperty('--cell-color-bright', color);

        // Sync grid state
        this._syncGridFromPlanet();

        // Show panel
        this.editorEl.classList.remove('hidden');
    }

    /* ── Close editor ───────────────────────────────────────────────── */
    close() {
        this.isOpen = false;
        this.planet = null;
        this.editorEl.classList.add('hidden');
    }

    /* ── Toggle a cell on/off ───────────────────────────────────────── */
    _toggleCell(row, col) {
        if (!this.planet) return;
        this.planet.noteGrid[row][col] = !this.planet.noteGrid[row][col];
        this.cells[row][col].classList.toggle('active', this.planet.noteGrid[row][col]);
    }

    /* ── Sync DOM grid from planet noteGrid ─────────────────────────── */
    _syncGridFromPlanet() {
        if (!this.planet) return;
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                this.cells[row][col].classList.toggle('active', !!this.planet.noteGrid[row][col]);
            }
        }
    }

    /* ── Highlight the current playback step column ─────────────────── */
    highlightStep(step) {
        if (!this.isOpen) return;
        // Remove previous highlight
        if (this.currentStep >= 0 && this.currentStep < GRID_COLS) {
            for (let row = 0; row < GRID_ROWS; row++) {
                this.cells[row][this.currentStep].classList.remove('current-step');
            }
        }
        this.currentStep = step;
        // Add new highlight
        if (step >= 0 && step < GRID_COLS) {
            for (let row = 0; row < GRID_ROWS; row++) {
                this.cells[row][step].classList.add('current-step');
            }
        }
    }
}

