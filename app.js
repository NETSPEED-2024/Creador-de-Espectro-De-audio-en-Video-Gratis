// ---------- HELPERS ----------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function hexToRgba(hex, a = 1) {
  const p = hexToRgb(hex);
  return `rgba(${p.r},${p.g},${p.b},${a})`;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- DOM ----------
const canvas = document.getElementById('visualizer');
const container = document.querySelector('.canvas-wrap');
const bgInput = document.getElementById('bgInput');
const logoInput = document.getElementById('logoInput');
const audioInput = document.getElementById('audioInput');
const visualSelect = document.getElementById('visualSelect');
const colorAInput = document.getElementById('colorA');
const colorBInput = document.getElementById('colorB');
const glowInput = document.getElementById('glow');
const particlesInput = document.getElementById('particles');
const spectrumSizeInp = document.getElementById('spectrumSize');
const spectrumPulseInp = document.getElementById('spectrumPulse');
const spectrumThicknessInp = document.getElementById('spectrumThickness');
const spectrumHeightInp = document.getElementById('spectrumHeight');
const spectrumBarsInp = document.getElementById('spectrumBars');
const minFreqInp = document.getElementById('minFreq');
const maxFreqInp = document.getElementById('maxFreq');
const titleInput = document.getElementById('songTitle');
const artistInput = document.getElementById('songArtist');
const titleSizeInp = document.getElementById('titleSize');
const artistSizeInp = document.getElementById('artistSize');
const playBtn = document.getElementById('playBtn');
const exportBtn = document.getElementById('exportBtn');
const stopBtn = document.getElementById('stopBtn');
const exportProgress = document.getElementById('exportProgress');
const exportQuality = document.getElementById('exportQuality');
const exportCrf = document.getElementById('exportCrf');
const exportFormat = document.getElementById('exportFormat');
const exportOrientation = document.getElementById('exportOrientation');
const presetButtons = document.querySelectorAll('.chip');
const displayTitle = document.getElementById('displayTitle');
const displayArtist = document.getElementById('displayArtist');

// ---------- STATE ----------
let DPR = window.devicePixelRatio || 1;
let W = 800, H = 600;
let bgImage = null, logoImage = null;
let audio = new Audio();
audio.crossOrigin = 'anonymous';
audio.loop = false;
audio.controls = false;
document.body.appendChild(audio);
let audioCtx = null, analyser = null, sourceNode = null, dataArray = null;
let config = {
  colorA: colorAInput.value,
  colorB: colorBInput.value,
  glow: Number(glowInput.value),
  particles: Number(particlesInput.value),
  spectrumSize: Number(spectrumSizeInp.value),
  spectrumPulse: Number(spectrumPulseInp.value),
  spectrumThickness: Number(spectrumThicknessInp.value),
  spectrumHeight: Number(spectrumHeightInp.value),
  spectrumBars: Number(spectrumBarsInp.value),
  minFreq: Number(minFreqInp.value),
  maxFreq: Number(maxFreqInp.value),
  titleSize: 48,
  artistSize: 24
};

// ---------- PARTICLES ENGINE ----------
class Particles {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.list = [];
    this.amount = opts.amount || 160;
    this.baseSize = opts.size || 2;
    this.speed = opts.speed || 1.2;
    this.colorA = opts.colorA;
    this.colorB = opts.colorB;
    this._seed();
  }
  _seed() {
    this.list.length = 0;
    for (let i = 0; i < this.amount; i++) this.list.push(this._make());
  }
  _make() {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      vx: (Math.random() - 0.5) * this.speed,
      vy: (Math.random() - 0.5) * this.speed,
      size: Math.random() * this.baseSize + 0.8,
      life: 120 + Math.random() * 180,
      age: Math.random() * 100,
      colorMix: Math.random()
    };
  }
  resize(w, h) {
    this.w = w;
    this.h = h;
    for (const p of this.list) {
      p.x = Math.min(this.w, Math.max(0, p.x));
      p.y = Math.min(this.h, Math.max(0, p.y));
    }
  }
  setOptions(opts) {
    if (opts.amount) this.amount = Math.max(0, parseInt(opts.amount));
    if (opts.colorA) this.colorA = opts.colorA;
    if (opts.colorB) this.colorB = opts.colorB;
    if (this.list.length < this.amount) {
      for (let i = 0; i < this.amount - this.list.length; i++) this.list.push(this._make());
    } else if (this.list.length > this.amount) {
      this.list.splice(0, this.list.length - this.amount);
    }
  }
  tick(audioData) {
    const ctxFreq = audioData && audioData.length ? (audioData[1] / 255) : 0;
    for (const p of this.list) {
      p.vx += (Math.random() - 0.5) * 0.08 + (Math.random() - 0.5) * ctxFreq * 0.6;
      p.vy += (Math.random() - 0.5) * 0.08 + (Math.random() - 0.5) * ctxFreq * 0.6;
      p.vx *= 0.988;
      p.vy *= 0.988;
      p.x += p.vx * (1 + ctxFreq * 1.4);
      p.y += p.vy * (1 + ctxFreq * 1.4);
      p.age++;
      if (p.age > p.life || p.x < -40 || p.x > this.w + 40 || p.y < -40 || p.y > this.h + 40) {
        Object.assign(p, this._make());
        p.x = Math.random() * this.w;
        p.y = Math.random() * this.h;
      }
    }
  }
  draw(opacity = 1) {
    const ctx = this.ctx;
    ctx.save();
    for (const p of this.list) {
      const t = p.colorMix;
      const ca = hexToRgb(this.colorA);
      const cb = hexToRgb(this.colorB);
      const r = Math.round(ca.r * (1 - t) + cb.r * t);
      const g = Math.round(ca.g * (1 - t) + cb.g * t);
      const b = Math.round(ca.b * (1 - t) + cb.b * t);
      ctx.fillStyle = `rgba(${r},${g},${b},${clamp((1 - p.age / p.life) * opacity, 0.03, 0.95)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.6, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- TRIANGLES ----------
class Triangles {
  constructor() {
    this.list = [];
    this.w = 800;
    this.h = 600;
    this.count = 40;
    this.speed = 0.8;
    this._seed();
  }
  _seed() {
    this.list.length = 0;
    for (let i = 0; i < this.count; i++) this.list.push(this._make());
  }
  _make() {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      s: 8 + Math.random() * 120,
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      spin: (Math.random() - 0.5) * 0.02,
      col: Math.random()
    };
  }
  resize(w, h) {
    this.w = w;
    this.h = h;
    for (const t of this.list) {
      t.x = Math.min(w, Math.max(0, t.x));
      t.y = Math.min(h, Math.max(0, t.y));
    }
  }
  setCount(n) {
    this.count = Math.max(0, Math.floor(n / 4));
    this._seed();
  }
  tick(audioData) {
    const bass = audioData ? (audioData[1] / 255) : 0;
    for (const t of this.list) {
      t.x += t.vx * (1 + bass * 2.5);
      t.y += t.vy * (1 + bass * 2.5);
      t.rot += t.spin * (1 + bass * 1.5);
      if (t.x < -200 || t.x > this.w + 200 || t.y < -200 || t.y > this.h + 200) {
        Object.assign(t, this._make());
        t.x = Math.random() * this.w;
        t.y = Math.random() * this.h;
      }
    }
  }
  draw(ctx, colorA, colorB, glow) {
    ctx.save();
    for (const t of this.list) {
      const mix = t.col;
      const ca = hexToRgb(colorA);
      const cb = hexToRgb(colorB);
      const r = Math.round(ca.r * (1 - mix) + cb.r * mix);
      const g = Math.round(ca.g * (1 - mix) + cb.g * mix);
      const b = Math.round(ca.b * (1 - mix) + cb.b * mix);
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.globalAlpha = 0.12 + (1 - (t.s / 200)) * 0.6;
      ctx.lineWidth = Math.max(1, t.s / 24);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`;
      ctx.shadowColor = `rgba(${r},${g},${b},${clamp(glow / 80, 0.02, 0.6)})`;
      ctx.shadowBlur = glow * (0.8 + (t.s / 200));
      ctx.beginPath();
      const s = t.s;
      ctx.moveTo(0, -s * 0.6);
      ctx.lineTo(s * 0.8, s * 0.6);
      ctx.lineTo(-s * 0.8, s * 0.6);
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = Math.max(0.8, t.s / 48);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.25)`;
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }
}

// ---------- ELECTRIC ARCS ----------
function drawElectricArcs(ctx, cx, cy, radius, data, colorA, colorB) {
  const bars = 40;
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const angle = t * Math.PI * 2;
    const idx = Math.floor(t * data.length);
    const v = (data[idx] || 0) / 255;
    if (Math.random() > 0.5 && v < 0.06) continue;
    const len = radius + v * radius * 1.8;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    ctx.lineWidth = 1 + v * 6;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, hexToRgba(colorA, 0.9));
    g.addColorStop(1, hexToRgba(colorB, 0.6));
    ctx.strokeStyle = g;
    ctx.beginPath();
    const steps = 5;
    for (let s = 0; s <= steps; s++) {
      const f = s / steps;
      const px = x1 + (x2 - x1) * f + (Math.random() - 0.5) * 10 * v;
      const py = y1 + (y2 - y1) * f + (Math.random() - 0.5) * 10 * v;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

// ---------- CIRCULAR SPECTRUM (Con rango de frecuencias) ----------
function drawCircularSpectrum(ctx, cx, cy, radius, data, opts = {}) {
  const bars = opts.bars || config.spectrumBars;
  const thickness = opts.thickness || config.spectrumThickness;
  const maxRadius = radius * 3.5;
  const barHeight = config.spectrumHeight / 100;
  const minFreq = config.minFreq;
  const maxFreq = config.maxFreq;
  const nyquist = audioCtx.sampleRate / 2;
  const minIndex = Math.floor((minFreq / nyquist) * data.length);
  const maxIndex = Math.floor((maxFreq / nyquist) * data.length);
  const segmentLength = maxIndex - minIndex;
  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
    const segmentIdx = Math.floor((i / bars) * segmentLength) + minIndex;
    const idx = Math.min(segmentIdx, data.length - 1);
    const v = (data[idx] || 0) / 255;
    const len = radius + v * maxRadius * barHeight;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    ctx.lineWidth = Math.max(1, thickness + v * 8);
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, opts.colorA);
    g.addColorStop(1, opts.colorB);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

// ---------- LINEAR SPECTRUM (Con rango de frecuencias) ----------
function drawLinearBars(ctx, x, y, w, h, data, opts = {}) {
  const bars = opts.bars || 140;
  const bw = w / bars;
  const speed = opts.speed || 1;
  const minFreq = config.minFreq;
  const maxFreq = config.maxFreq;
  const nyquist = audioCtx.sampleRate / 2;
  const minIndex = Math.floor((minFreq / nyquist) * data.length);
  const maxIndex = Math.floor((maxFreq / nyquist) * data.length);
  const segmentLength = maxIndex - minIndex;
  for (let i = 0; i < bars; i++) {
    const segmentIdx = Math.floor((i / bars) * segmentLength) + minIndex;
    const idx = Math.min(segmentIdx, data.length - 1);
    const v = (data[idx] || 0) / 255;
    const H = h * v * speed;
    const cx = x + i * bw;
    const g = ctx.createLinearGradient(cx, y + h, cx, y);
    g.addColorStop(0, opts.colorB);
    g.addColorStop(1, opts.colorA);
    ctx.fillStyle = g;
    ctx.fillRect(cx, y + (h - H) / 2, bw * 0.75, H);
  }
}

// ---------- SETUP ----------
let particlesEngine = new Particles(canvas, {
  amount: config.particles,
  size: 3,
  speed: 1.2,
  colorA: config.colorA,
  colorB: config.colorB
});
let triangles = new Triangles();
let ffmpegLoaded = false;
let ffmpeg = null;

// ---------- RESIZE ----------
function resize() {
  const w = Math.max(320, container.clientWidth);
  const h = Math.max(320, container.clientHeight);
  DPR = window.devicePixelRatio || 1;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.floor(w * DPR);
  canvas.height = Math.floor(h * DPR);
  W = canvas.width / DPR;
  H = canvas.height / DPR;
  particlesEngine.resize(W, H);
  triangles.resize(W, H);
}
window.addEventListener('resize', resize);
resize();

// ---------- AUDIO ----------
function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

// ---------- INPUTS ----------
bgInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.src = url;
  img.onload = () => {
    bgImage = img;
    resize();
  };
  container.style.backgroundImage = `url(${url})`;
  container.style.backgroundSize = 'cover';
});
logoInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.src = url;
  img.onload = () => logoImage = img;
});
audioInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  audio.src = url;
  initAudio();
  audio.play().catch(() => {});
  playBtn.textContent = 'Pausar';
});

// ---------- UI BINDS ----------
colorAInput.addEventListener('input', () => {
  config.colorA = colorAInput.value;
  particlesEngine.setOptions({ colorA: config.colorA });
});
colorBInput.addEventListener('input', () => {
  config.colorB = colorBInput.value;
  particlesEngine.setOptions({ colorB: config.colorB });
});
glowInput.addEventListener('input', () => config.glow = Number(glowInput.value));
particlesInput.addEventListener('input', () => {
  config.particles = Number(particlesInput.value);
  particlesEngine.setOptions({ amount: config.particles });
  triangles.setCount(config.particles);
});
spectrumSizeInp.addEventListener('input', e => config.spectrumSize = Number(e.target.value));
spectrumPulseInp.addEventListener('input', e => config.spectrumPulse = Number(e.target.value));
spectrumThicknessInp.addEventListener('input', e => config.spectrumThickness = Number(e.target.value));
spectrumHeightInp.addEventListener('input', e => config.spectrumHeight = Number(e.target.value));
spectrumBarsInp.addEventListener('input', e => config.spectrumBars = Number(e.target.value));
minFreqInp.addEventListener('input', e => config.minFreq = Number(e.target.value));
maxFreqInp.addEventListener('input', e => config.maxFreq = Number(e.target.value));
titleInput.addEventListener('input', () => displayTitle.textContent = titleInput.value || 'CALL ME');
artistInput.addEventListener('input', () => displayArtist.textContent = artistInput.value || 'Campal Haze');
titleSizeInp.addEventListener('input', e => config.titleSize = Number(e.target.value));
artistSizeInp.addEventListener('input', e => config.artistSize = Number(e.target.value));

// ---------- PRESETS ----------
presetButtons.forEach(b => {
  b.addEventListener('click', () => {
    const p = b.dataset.preset;
    if (p === 'tron') {
      colorAInput.value = '#00eaff';
      colorBInput.value = '#00ffd4';
      glowInput.value = 20;
      particlesInput.value = 240;
      visualSelect.value = 'triangles';
      spectrumHeightInp.value = 60;
      spectrumBarsInp.value = 240;
      minFreqInp.value = 20;
      maxFreqInp.value = 5000;
    }
    if (p === 'fire') {
      colorAInput.value = '#ff6b00';
      colorBInput.value = '#ff0022';
      glowInput.value = 28;
      particlesInput.value = 200;
      visualSelect.value = 'wave';
      spectrumHeightInp.value = 50;
      spectrumBarsInp.value = 180;
      minFreqInp.value = 100;
      maxFreqInp.value = 3000;
    }
    if (p === 'galaxy') {
      colorAInput.value = '#6f4cff';
      colorBInput.value = '#00ffd4';
      glowInput.value = 16;
      particlesInput.value = 140;
      visualSelect.value = 'rings';
      spectrumHeightInp.value = 80;
      spectrumBarsInp.value = 200;
      minFreqInp.value = 50;
      maxFreqInp.value = 8000;
    }
    if (p === 'gothic') {
      colorAInput.value = '#ffd27a';
      colorBInput.value = '#6b3b00';
      glowInput.value = 10;
      particlesInput.value = 80;
      visualSelect.value = 'linear';
      spectrumHeightInp.value = 40;
      spectrumBarsInp.value = 120;
      minFreqInp.value = 200;
      maxFreqInp.value = 2000;
    }
    if (p === 'cyber') {
      colorAInput.value = '#ff3fa8';
      colorBInput.value = '#00eaff';
      glowInput.value = 22;
      particlesInput.value = 260;
      visualSelect.value = 'particles';
      spectrumHeightInp.value = 90;
      spectrumBarsInp.value = 300;
      minFreqInp.value = 10;
      maxFreqInp.value = 10000;
    }
    if (p === 'all') {
      colorAInput.value = '#00eaff';
      colorBInput.value = '#ff3fa8';
      glowInput.value = 20;
      particlesInput.value = 320;
      visualSelect.value = 'triangles';
      spectrumHeightInp.value = 100;
      spectrumBarsInp.value = 360;
      minFreqInp.value = 0;
      maxFreqInp.value = 22050;
    }
    config.colorA = colorAInput.value;
    config.colorB = colorBInput.value;
    config.glow = Number(glowInput.value);
    config.particles = Number(particlesInput.value);
    config.spectrumHeight = Number(spectrumHeightInp.value);
    config.spectrumBars = Number(spectrumBarsInp.value);
    config.minFreq = Number(minFreqInp.value);
    config.maxFreq = Number(maxFreqInp.value);
    particlesEngine.setOptions({ amount: config.particles, colorA: config.colorA, colorB: config.colorB });
    triangles.setCount(config.particles);
  });
});

// ---------- PLAY / STOP ----------
playBtn.addEventListener('click', async () => {
  if (!audio.src) return alert('Subí un audio primero.');
  initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
  if (audio.paused) {
    audio.play();
    playBtn.textContent = 'Pausar';
  } else {
    audio.pause();
    playBtn.textContent = 'Reproducir';
  }
});
stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  playBtn.textContent = 'Reproducir';
});

// ---------- DRAW LOOP ----------
function clear(ctx) {
  ctx.clearRect(0, 0, W, H);
}
function drawLoop() {
  requestAnimationFrame(drawLoop);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  clear(ctx);
  // background
  if (bgImage) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    const arImg = bgImage.width / bgImage.height;
    const arCan = W / H;
    let dw = W, dh = H, dx = 0, dy = 0;
    if (arImg > arCan) {
      dh = H;
      dw = arImg * dh;
      dx = -(dw - W) / 2;
    } else {
      dw = W;
      dh = dw / arImg;
      dy = -(dh - H) / 2;
    }
    ctx.drawImage(bgImage, dx, dy, dw, dh);
    ctx.restore();
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#030313');
    g.addColorStop(1, '#071028');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // audio data
  if (analyser && dataArray) analyser.getByteFrequencyData(dataArray);
  const data = dataArray || new Uint8Array(1024);
  // particles
  particlesEngine.setOptions({ colorA: config.colorA, colorB: config.colorB });
  particlesEngine.tick(data);
  particlesEngine.draw(0.95);
  // get center
  const cx = W / 2, cy = H / 2;
  // Draw chosen visual + combined effects
  const visual = visualSelect.value;
  // Triangles layer (Tron)
  if (visual === 'triangles' || visual === 'particles' || visual === 'rings') {
    triangles.draw(ctx, config.colorA, config.colorB, config.glow);
  }
  // circular spectrum
  if (visual === 'rings' || visual === 'triangles') {
    const baseR = config.spectrumSize * 0.8;
    drawCircularSpectrum(ctx, cx, cy, baseR, data, {
      bars: config.spectrumBars,
      thickness: config.spectrumThickness,
      colorA: config.colorA,
      colorB: config.colorB,
      speed: 1 + (config.spectrumPulse / 120)
    });
    drawElectricArcs(ctx, cx, cy, baseR * 0.9, data, config.colorA, config.colorB);
  }
  // waveform style
  if (visual === 'wave') {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = Math.max(1, config.spectrumThickness);
    const samples = 600;
    const radius = config.spectrumSize * 0.6;
    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const angle = t * Math.PI * 2;
      const idx = Math.floor(t * data.length);
      const v = (data[idx] || 128) / 255;
      const r = radius + (v - 0.5) * Math.min(W, H) * 0.18 * (config.spectrumPulse / 120);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    g.addColorStop(0, config.colorA);
    g.addColorStop(1, config.colorB);
    ctx.strokeStyle = g;
    ctx.stroke();
    ctx.restore();
  }
  // linear bars
  if (visual === 'linear') {
    const barW = Math.min(W * 0.9, 1400);
    drawLinearBars(ctx, (W - barW) / 2, H * 0.28, barW, H * 0.44, data, {
      bars: 200,
      colorA: config.colorA,
      colorB: config.colorB,
      speed: 1.4
    });
  }
  // small retro rings
  if (visual === 'particles') {
    drawCircularSpectrum(ctx, cx, cy, Math.min(W, H) * 0.18, data, {
      bars: 110,
      thickness: 2,
      colorA: config.colorA,
      colorB: config.colorB,
      speed: 1.2
    });
  }
  // central logo
  if (logoImage) {
    const size = Math.min(W, H) * 0.18;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 + 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const ar = logoImage.width / logoImage.height;
    let dw = size, dh = size, dx = cx - size / 2, dy = cy - size / 2;
    if (ar > 1) {
      dh = size;
      dw = ar * dh;
      dx = dx - (dw - size) / 2;
    } else {
      dw = size;
      dh = dw / ar;
      dy = dy - (dh - size) / 2;
    }
    ctx.drawImage(logoImage, dx, dy, dw, dh);
    ctx.restore();
  }
  // text
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = config.colorA;
  ctx.shadowBlur = config.glow;
  ctx.fillStyle = config.colorA;
  ctx.font = `${config.titleSize || 48}px Inter, Roboto, Arial`;
  ctx.fillText(titleInput.value || 'CALL ME', cx, H - 120);
  ctx.shadowColor = config.colorB;
  ctx.shadowBlur = Math.max(2, config.glow * 0.5);
  ctx.fillStyle = config.colorB;
  ctx.font = `${config.artistSize || 24}px Inter, Roboto, Arial`;
  ctx.fillText(artistInput.value || 'Campal Haze', cx, H - 80);
  ctx.restore();
}
drawLoop();

// ---------- PROCESAR Y EXPORTAR ----------
exportBtn.addEventListener('click', async () => {
  if (!audio.src) return alert('Subí un audio primero.');
  await processAndExport();
});

async function processAndExport() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});

  const format = exportFormat.value || 'mp4';
  const orientation = exportOrientation.value || 'horizontal';
  const q = exportQuality.value || '1920x1080';
  const crf = Number(exportCrf.value || 20);
  const [w, h] = q.split('x').map(n => parseInt(n, 10));

  // Capturar el canvas como stream de video
  const fps = 60;
  const canvasStream = canvas.captureStream(fps);

  // Conectar el audio al destino
  const dest = audioCtx.createMediaStreamDestination();
  sourceNode.connect(dest);

  // Mezclar video (canvas) + audio
  const mixedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  // Crear un MediaRecorder temporal para obtener los datos
  let mime = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';

  let recorder;
  try {
    recorder = new MediaRecorder(mixedStream, { mimeType: mime });
  } catch (e) {
    alert('Error al crear el procesador. Usa Chrome/Edge recientes.');
    return;
  }

  const parts = [];
  recorder.ondataavailable = e => {
    if (e.data && e.data.size) parts.push(e.data);
  };

  recorder.onstop = async () => {
    const webmBlob = new Blob(parts, { type: mime });
    await convertWithFFmpegOrDownload(webmBlob, format, orientation, q, crf);
  };

  // Iniciar la captura
  recorder.start(1000);

  // Reproducir el audio para capturar el espectro en movimiento
  audio.currentTime = 0;
  audio.play();

  // Detener después de la duración del audio (o 60 segundos como máximo)
  const duration = Math.min(Math.max(5, Math.floor(audio.duration || 60)), 60 * 60);
  setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop();
  }, (duration + 1) * 1000);
}

// ---------- FFmpeg WASM CONVERSION ----------
async function ensureFFmpegLoaded() {
  if (ffmpegLoaded) return true;
  try {
    const { createFFmpeg, fetchFile } = await import('https://unpkg.com/@ffmpeg/ffmpeg@0.11.1/dist/ffmpeg.min.js');
    ffmpeg = createFFmpeg({ log: true, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.1/dist/ffmpeg-core.js' });
    exportProgress.style.display = 'inline-block';
    exportProgress.value = 2;
    await ffmpeg.load();
    ffmpegLoaded = true;
    exportProgress.value = 6;
    return true;
  } catch (err) {
    console.warn('FFmpeg WASM no cargó:', err);
    ffmpegLoaded = false;
    exportProgress.style.display = 'none';
    return false;
  }
}

async function convertWithFFmpegOrDownload(webmBlob, format, orientation, resolution, crf) {
  exportProgress.style.display = 'inline-block';
  exportProgress.value = 8;
  const [w, h] = resolution.split('x').map(n => parseInt(n, 10));

  if (format === 'webm') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(webmBlob);
    a.download = `specterr_export_${orientation}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    exportProgress.style.display = 'none';
    return;
  }

  // Exportar a MP4 usando FFmpeg WASM
  const ff = await ensureFFmpegLoaded();
  if (!ff) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(webmBlob);
    a.download = `specterr_fallback_${orientation}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    exportProgress.style.display = 'none';
    return;
  }

  // Procesar con FFmpeg
  exportProgress.value = 12;
  const nameIn = 'capture.webm';
  const nameOut = 'output.mp4';
  ffmpeg.FS('writeFile', nameIn, await fetchFile(webmBlob));
  exportProgress.value = 20;

  try {
    // Ajustar la rotación si es vertical (Shorts)
    const rotateFilter = orientation === 'vertical' ? ',transpose=1' : '';
    const args = [
      '-i', nameIn,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', String(crf),
      '-vf', `scale=${w}:${h}:flags=lanczos${rotateFilter}`,
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      nameOut
    ];

    exportProgress.value = 30;
    await ffmpeg.run(...args);
    exportProgress.value = 90;

    const data = ffmpeg.FS('readFile', nameOut);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `specterr_${orientation}_${w}x${h}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    exportProgress.value = 100;
  } catch (err) {
    console.error('FFmpeg error:', err);
    alert('Error al convertir. Se descargará WebM como fallback.');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(webmBlob);
    a.download = `specterr_fallback_${orientation}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    exportProgress.style.display = 'none';
    try {
      ffmpeg.FS('unlink', nameIn);
      ffmpeg.FS('unlink', nameOut);
    } catch (e) {}
  }
}
