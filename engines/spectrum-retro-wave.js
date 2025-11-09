// engines/spectrum-retro-wave.js
// Draws a retro grid-style spectrum with neon lines.
// Exports drawRetroWaveSpectrum(ctx, cx, cy, radius, data, options)
export function drawRetroWaveSpectrum(ctx, cx, cy, radius, data, options = {}) {
  const bars = options.bars ?? 90;
  const thickness = options.thickness ?? 2;
  const colorA = options.colorA ?? '#00ffff';
  const colorB = options.colorB ?? '#ff00ff';
  const len = Math.min(bars, data.length);

  // Draw grid lines
  for (let i = 0; i < len; i++) {
    const v = (data[Math.floor((i / len) * data.length)] || 0) / 255;
    const angle = (i / len) * Math.PI * 2;
    const lenRad = radius + v * radius * 0.8;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * lenRad;
    const y2 = cy + Math.sin(angle) * lenRad;

    ctx.lineWidth = Math.max(1, thickness + v * 3);
    ctx.strokeStyle = i % 2 === 0 ? colorA : colorB;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Add retro grid background
  ctx.strokeStyle = hexToRgba('#ffffff', 0.1);
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius * 1.5;
    const y = cy + Math.sin(angle) * radius * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
