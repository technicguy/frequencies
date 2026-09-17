/**
 * RESONANZ - Reverse Cymatics Engine
 * Logic for pattern analysis, physics-based frequency calculation, and sound synthesis.
 */

class CymaticsApp {
    constructor() {
        this.initElements();
        this.initCanvas();
        this.initAudio();
        this.bindEvents();

        // App State
        this.state = {
            drawing: false,
            tool: 'draw',
            symmetry: true,
            symmetryPoints: 6,
            plateShape: 'circular',
            material: 'brass',
            plateSize: 50, // cm
            calculatedFreq: 0,
            isPlaying: false
        };

        this.history = [];
        this.animate();
    }

    initElements() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.freqDisplay = document.getElementById('freq-value');
        this.modeIndicator = document.getElementById('detected-mode');
        this.btnPlay = document.getElementById('btn-play');
        this.btnCalculate = document.getElementById('btn-calculate');
        this.statusBadge = document.getElementById('app-status');
        this.spectrumViz = document.getElementById('spectrum-viz');

        // Inputs
        this.materialSelect = document.getElementById('material');
        this.shapeSelect = document.getElementById('plate-shape');
        this.sizeRange = document.getElementById('plate-size');
        this.symmetryInput = document.getElementById('symmetry-points');
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Set initial styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 80;
        this.canvas.height = container.clientHeight - 80;
        this.clearCanvas();
    }

    initAudio() {
        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;
    }

    bindEvents() {
        // Drawing Events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Control Events
        document.getElementById('tool-clear').addEventListener('click', () => this.clearCanvas());
        document.getElementById('tool-symmetry').addEventListener('click', (e) => {
            this.state.symmetry = !this.state.symmetry;
            e.currentTarget.classList.toggle('active', this.state.symmetry);
        });

        this.btnCalculate.addEventListener('click', () => this.processPattern());
        this.btnPlay.addEventListener('click', () => this.togglePlayback());

        // State Sync
        this.materialSelect.addEventListener('change', (e) => this.state.material = e.target.value);
        this.shapeSelect.addEventListener('change', (e) => this.state.plateShape = e.target.value);
        this.sizeRange.addEventListener('input', (e) => this.state.plateSize = parseInt(e.target.value));
        this.symmetryInput.addEventListener('change', (e) => this.state.symmetryPoints = parseInt(e.target.value));
    }

    // --- Drawing Logic ---

    clearCanvas() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw centered guideline
        this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.05)';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) * 0.4, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    startDrawing(e) {
        this.state.drawing = true;
        this.draw(e);
    }

    stopDrawing() {
        this.state.drawing = false;
        this.ctx.beginPath();
    }

    draw(e) {
        if (!this.state.drawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#00d2ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00d2ff';

        if (this.state.symmetry) {
            const points = this.state.symmetryPoints;
            const angleStep = (Math.PI * 2) / points;

            // Coordinates relative to center
            const relX = x - centerX;
            const relY = y - centerY;
            const dist = Math.sqrt(relX * relX + relY * relY);
            const angle = Math.atan2(relY, relX);

            for (let i = 0; i < points; i++) {
                const currentAngle = angle + (i * angleStep);
                const drawX = centerX + Math.cos(currentAngle) * dist;
                const drawY = centerY + Math.sin(currentAngle) * dist;

                // For a smooth line, we'd need to track previous points per symmetry segment
                // Simplification for now: Draw dots/blobs
                this.ctx.beginPath();
                this.ctx.arc(drawX, drawY, 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        } else {
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        }
    }

    // --- Physics & Pattern Analysis ---

    async processPattern() {
        this.statusBadge.innerText = 'Analyzing...';
        this.statusBadge.style.color = '#ffcc00';

        // 1. Extract geometric features from canvas
        const modes = this.analyzeGeometry();

        // 2. Calculate frequency based on modes and material
        const freq = this.calculateFrequency(modes);
        this.state.calculatedFreq = freq;

        // 3. Update UI
        this.animateFrequencyDisplay(freq);
        this.modeIndicator.innerText = `Mode: ${modes.n},${modes.m} (Radial, Angular)`;
        this.btnPlay.disabled = false;
        this.statusBadge.innerText = 'Calculated';
        this.statusBadge.style.color = '#00fff2';

        this.updateSpectrum(freq);
    }

    analyzeGeometry() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        let pixelCount = 0;
        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        // Analyze density and distribution
        let radialDistSum = 0;
        for (let i = 0; i < imageData.length; i += 400) { // Sample every 100 pixels
            if (imageData[i + 3] > 50) { // Alpha channel check (drawing exists)
                pixelCount++;
                const pixelIdx = i / 4;
                const x = pixelIdx % this.canvas.width;
                const y = Math.floor(pixelIdx / this.canvas.width);
                const dx = x - centerX;
                const dy = y - centerY;
                radialDistSum += Math.sqrt(dx * dx + dy * dy);
            }
        }

        const avgDist = pixelCount > 0 ? radialDistSum / pixelCount : 0;
        const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2;
        const normalizedDist = avgDist / maxRadius;

        // Map visual features to mode numbers
        // n: Radial nodes (rings)
        // m: Angular nodes (spokes)
        const n = Math.max(1, Math.floor(normalizedDist * 6) + 1);
        const m = this.state.symmetry ? this.state.symmetryPoints : 2;

        return { n, m };
    }

    calculateFrequency(modes) {
        const materialConstants = {
            brass: { speed: 3500 },
            steel: { speed: 5000 },
            water: { speed: 1480 },
            rubber: { speed: 60 }
        };

        const mat = materialConstants[this.state.material];
        const L = (this.state.plateSize / 100) || 0.5; // m

        // Base frequency calculation using wave mechanics
        // f = (modeFactor * speed) / (2 * L)
        const modeFactor = Math.sqrt(Math.pow(modes.n, 1.5) + Math.pow(modes.m, 1.2));
        let freq = (modeFactor * mat.speed) / (2 * L);

        // Clamp to scientific frequency ranges
        const minFreq = 40;
        const maxFreq = 4000;
        freq = Math.min(maxFreq, Math.max(minFreq, freq));

        return parseFloat(freq.toFixed(2));
    }

    // --- Audio Logic ---

    initAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    togglePlayback() {
        this.initAudioContext();

        if (this.state.isPlaying) {
            this.stopTone();
        } else {
            this.playTone();
        }
    }

    playTone() {
        if (!this.state.calculatedFreq) return;

        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(this.state.calculatedFreq, this.audioCtx.currentTime);

        // Gentle fade in
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);

        this.oscillator.start();
        this.state.isPlaying = true;
        this.btnPlay.innerHTML = '<span class="icon">⏹</span> Stop Tone';
    }

    stopTone() {
        if (this.oscillator) {
            this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.1);
            this.oscillator.stop(this.audioCtx.currentTime + 0.1);
            this.state.isPlaying = false;
            this.btnPlay.innerHTML = '<span class="icon">▶</span> Play Tone';
        }
    }

    // --- Visual Polish ---

    animateFrequencyDisplay(target) {
        let current = 0;
        const step = target / 20;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                this.freqDisplay.innerText = target.toFixed(2);
                clearInterval(timer);
            } else {
                this.freqDisplay.innerText = current.toFixed(2);
            }
        }, 30);
    }

    updateSpectrum(freq) {
        this.spectrumViz.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const bar = document.createElement('div');
            bar.className = 'spectrum-bar';

            // Generate some pseudo-harmonics based on freq
            const height = Math.abs(Math.sin((freq * i) / 100)) * 100;
            bar.style.height = `${height}%`;
            bar.style.opacity = Math.max(0.2, 1 - (i / 40));

            this.spectrumViz.appendChild(bar);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        // Potential for real-time interference visualization on canvas
    }
}

// Initialize App
window.addEventListener('load', () => {
    window.app = new CymaticsApp();
});
