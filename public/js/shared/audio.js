/** Lightweight WebAudio SFX */
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  tone(freq, dur = 0.08, type = "square", gain = 0.04, slide = 0) {
    if (!this.enabled) return;
    this.ensure();
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  noise(dur = 0.1, gain = 0.03) {
    if (!this.enabled) return;
    this.ensure();
    const t0 = this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1200;
    src.buffer = buf;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start(t0);
  }

  attack() { this.tone(420, 0.07, "square", 0.035, -180); this.noise(0.06, 0.02); }
  special() { this.tone(220, 0.12, "sawtooth", 0.04, 300); this.tone(440, 0.18, "triangle", 0.03, 200); }
  hit() { this.tone(160, 0.09, "square", 0.05, -100); this.noise(0.08, 0.04); }
  dash() { this.tone(600, 0.1, "triangle", 0.03, -400); }
  jump() { this.tone(380, 0.1, "triangle", 0.03, 220); }
  hurt() { this.tone(120, 0.16, "sawtooth", 0.04, -80); }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "triangle", 0.04), i * 90));
  }
  lose() { this.tone(200, 0.3, "sawtooth", 0.04, -120); }
}
