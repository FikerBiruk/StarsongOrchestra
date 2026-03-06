# 🎵 StarSong Orchestra

**A browser-based interactive music toy where you build a custom solar system and each planet is an instrument!**

[**🚀 Play Now on GitHub Pages**](https://your-username.github.io/StarsongOrchestra/)

![StarSong Orchestra](https://img.shields.io/badge/status-live-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-canvas-orange)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-synthesis-blue)
![GitHub Pages](https://img.shields.io/badge/deployed-GitHub%20Pages-success)

---

## ✨ Features

- 🪐 **Build Your Solar System** — Add up to 8 planets, each with its own orbit
- 🎹 **Chrome Music Lab-Style Grid Editor** — Click planets to open a 16×8 sequencer grid
- 🎼 **5 Instrument Types** — Sine pad, square lead, triangle pluck, sawtooth buzz, and noise percussion
- 🎵 **3 Musical Scales** — Pentatonic, major, and minor
- 🔊 **Stereo Panning** — Planets pan left/right based on their orbital position
- ☄️ **Orbit Trails** — Beautiful motion trails follow each planet
- 💾 **Save/Load** — Auto-saves to localStorage; export/import JSON files
- 🎨 **Visual Effects** — Glowing planets, pulsing star, smooth animations
- ⌨️ **Adjustable BPM** — 60–200 BPM slider
- 🔍 **Zoom** — Scroll wheel to zoom in/out

---

## 🎮 How to Use

1. **Click anywhere** to start the audio engine
2. **Click "✦ Add Planet"** to spawn a new planet
3. **Click a planet** to open its sequencer grid
4. **Click grid cells** to place notes (row = pitch, column = time)
5. **Change instruments** with the dropdown
6. **Adjust BPM** with the slider
7. **Save your creation** with the 💾 button
8. **Export/Import** systems as JSON files

---

## 🛠️ Tech Stack

- **HTML5 Canvas** — Rendering the solar system
- **Web Audio API** — Real-time audio synthesis with ADSR envelopes
- **Vanilla JavaScript** — ES6 classes, modular architecture
- **CSS** — Glassmorphism UI, smooth animations
- **GitHub Pages** — Static hosting, no server required

---

## 📂 File Structure

```
StarsongOrchestra/
├── index.html          # Main HTML page
├── style.css           # UI styles & animations
├── main.js             # Entry point, render loop, BPM clock
├── solarSystem.js      # SolarSystem class
├── planet.js           # Planet class with note grid
├── audioEngine.js      # Web Audio API synthesis
├── musicEditor.js      # Grid editor UI
└── ui.js               # UI manager & save/load
```

---

## 🚀 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/StarsongOrchestra.git
   cd StarsongOrchestra
   ```

2. Serve with any static HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000

   # VS Code Live Server extension
   # Or use Node.js http-server: npx http-server
   ```

3. Open `http://localhost:8000` in your browser

> **Note:** ES6 modules require an HTTP server — opening `index.html` directly (`file://`) won't work.

---

## 🎨 Customization

- **Add more scales:** Edit `SCALES` in `audioEngine.js`
- **Change colors:** Modify `PLANET_COLORS` in `planet.js`
- **Add instruments:** Extend `INSTRUMENT_PRESETS` in `audioEngine.js`
- **Tweak ADSR:** Adjust attack/decay/sustain/release values

---

## 📜 License

MIT License — feel free to remix and share!

---

## 🌟 Credits

Inspired by [Chrome Music Lab](https://musiclab.chromeexperiments.com/)

Built with ❤️ and Web Audio API

---

**Happy music making! 🎵✨**

