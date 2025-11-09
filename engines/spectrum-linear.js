// engines/spectrum-linear.js
// Draws a horizontal/vertical linear spectrum (bars across center).
// Exports drawLinearSpectrum(ctx, x,y,width,height,data,options)

export function drawLinearSpectrum(ctx, x, y, w, h, data, options = {}) {
  const bars = options.bars ?? 120;
  const colorA = options.colorA ?? '#00eaff';
  const colorB = options.colorB ?? '#ff3fa8';
  const speed = options.speed ?? 1.0;
  const vertical = options.vertical ?? false;

  if(vertical){
    // vertical columns centered
    const bw = w / bars;
    for(let i=0;i<bars;i++){
      const idx = Math.floor((i/bars)*data.length);
      const v = (data[idx]||0)/255;
      const H = h * v * speed;
      const cx = x + i*bw;
      const g = ctx.createLinearGradient(cx, y+h, cx, y);
      g.addColorStop(0, colorB);
      g.addColorStop(1, colorA);
      ctx.fillStyle = g;
      ctx.fillRect(cx, y + (h-H), bw*0.8, H);
    }
  } else {
    const bw = w / bars;
    for(let i=0;i<bars;i++){
      const idx = Math.floor((i/bars)*data.length);
      const v = (data[idx]||0)/255;
      const H = h * v * speed;
      const cx = x + i*bw;
      const g = ctx.createLinearGradient(cx, y, cx, y+h);
      g.addColorStop(0, colorA);
      g.addColorStop(1, colorB);
      ctx.fillStyle = g;
      ctx.fillRect(cx, y + (h - H)/2, bw*0.75, H); // centered vertically
    }
  }
}
