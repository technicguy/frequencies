# Resonanz | Reverse Cymatics Explorer

An interactive web-based physics and sound synthesis explorer that translates visual geometric patterns into resonant acoustic frequencies using Chladni plate mathematical modeling and Web Audio API synthesis.

![Status](https://img.shields.io/badge/Status-Active-00fff2?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS%20%7C%20WebAudio-7000ff?style=for-the-badge)

---

## 🌊 Overview

**Resonanz** explores the fascinating intersection of acoustics, geometry, and visual art. Based on **Chladni plate dynamics** (the pattern sand forms on a vibrating plate at specific harmonic frequencies), this application allows you to:
- Model physical plate dimensions and resonant modes.
- Generate real-time visual nodal patterns.
- Synthesize complex multi-harmonic audio corresponding to the visual geometry.

---

## ⚡ Key Features

- **Physics-Based Cymatic Modeling:** Solves standing wave equations ($m, n$ modes) on vibrating boundaries.
- **Real-Time Sound Synthesis:** Uses Web Audio API oscillators and gain nodes to map spatial resonance into harmonic audio spectra.
- **Interactive Controls:** Adjust plate elasticity, damping factor, driving frequency, and harmonic overtones.
- **Pure Vanilla Stack:** Zero external build steps or heavy dependencies—built with HTML, CSS (Glassmorphism), and modern JavaScript.

---

## 🚀 Quick Start / Local Setup

Since **Resonanz** is built with standard Web APIs, no installation or compilation step is required!

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/technicguy/frequencies.git
   cd frequencies
   ```

2. **Run Locally:**
   - Open `index.html` directly in any modern web browser.
   - Or serve using any lightweight static server (e.g. VS Code Live Server or `npx serve .`).

---

## 📂 Project Structure

```text
frequencies/
├── index.html     # Main HTML structure and UI canvas viewports
├── style.css      # Dark glassmorphic design system and UI styling
├── app.js         # Cymatic physics math, canvas render loop, and Web Audio engine
└── README.md      # Project documentation
```

---

## 📄 License

Distributed under the MIT License.
