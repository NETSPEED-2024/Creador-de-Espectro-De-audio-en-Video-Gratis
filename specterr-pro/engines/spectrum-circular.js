// engines/spectrum-circular.js
// Draws a smooth circular spectrum using polar coordinates.
// Exports a function drawCircularSpectrum(ctx, centerX, centerY, radius, data, options)

export function drawCircularSpectrum(ctx, cx, cy, radius, data, options = {}) {
  const bars = options.bars ?? 180;
  const thickness = options.thickness ?? 2;
  const colorA = options.colorA ?? '#00eaff';
  const colorB = options.colorB ?? '#ff3fa8';
  const speed = options.speed ?? 1.0;

  const len = Math.min(bars, data.length);
  for(let i=0;i<len;i++){
    const v = (data[Math.floor((i/data.length)*data.length)] || 0) / 255;
    const angle = (i/len) * Math.PI*2 - Math.PI/2;
    const lenRad = radius + v * (radius*1.6) * speed;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * lenRad;
    const y2 = cy + Math.sin(angle) * lenRad;

    ctx.lineWidth = Math.max(1, thickness + v*5);
    const g = ctx.createLinearGradient(x1,y1,x2,y2);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }
}
