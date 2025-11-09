// engines/spectrum-halo.js
// Draws a halo-style spectrum with concentric circles.
// Exports drawHaloSpectrum(ctx, cx, cy, radius, data, options)
export function drawHaloSpectrum(ctx, cx, cy, radius, data, options = {}) {
  const rings = options.rings ?? 6;
  const colorA = options.colorA ?? '#ffffff';
  const colorB = options.colorB ?? '#00ffff';
  const len = data.length;

  // Draw concentric rings
  for (let r = 0; r < rings; r++) {
    const start = Math.floor((r / rings) * len);
    const end = Math.floor(((r + 1) / rings) * len);
    let sum = 0;
    let count = 0;
    for (let i = start; i < end; i++) {
      sum += (data[i] || 0);
      count++;
    }
    const avg = count ? sum / (count * 255) : 0;
    const rr = radius * (0.5 + r * 0.2) + avg * radius * 0.4;

    const g = ctx.createLinearGradient(cx - rr, cy - rr, cx + rr, cy + rr);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + r * 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Add central glow
  const gradientGlow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.5);
  gradientGlow.addColorStop(0, hexToRgba(colorB, 0.2));
  gradientGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradientGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
