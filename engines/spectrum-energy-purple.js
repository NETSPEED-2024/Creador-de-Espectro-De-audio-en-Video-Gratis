// engines/spectrum-energy-purple.js
// Draws a purple energy-style spectrum with sharp edges.
// Exports drawEnergyPurpleSpectrum(ctx, cx, cy, radius, data, options)
export function drawEnergyPurpleSpectrum(ctx, cx, cy, radius, data, options = {}) {
  const bars = options.bars ?? 120;
  const thickness = options.thickness ?? 5;
  const colorA = options.colorA ?? '#ff00ff';
  const colorB = options.colorB ?? '#cc00cc';
  const len = Math.min(bars, data.length);

  // Draw sharp energy lines
  for (let i = 0; i < len; i++) {
    const v = (data[Math.floor((i / len) * data.length)] || 0) / 255;
    const angle = (i / len) * Math.PI * 2;
    const lenRad = radius + v * radius * 1.6;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * lenRad;
    const y2 = cy + Math.sin(angle) * lenRad;

    ctx.lineWidth = Math.max(1, thickness + v * 8);
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Add central glow
  const gradientGlow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.2);
  gradientGlow.addColorStop(0, hexToRgba(colorA, 0.3));
  gradientGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradientGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
