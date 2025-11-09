// engines/particles.js
// Particle engine with configurable amount, size, speed, direction, and modes.
// Simple implementation — lightweight, no external libs.

export class ParticleEngine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.amount = opts.amount ?? 120;
    this.size = opts.size ?? 4;
    this.speed = opts.speed ?? 2;
    this.direction = opts.direction ?? 'float'; // float, up, down, left, right
    this.colorA = opts.colorA ?? '#00eaff';
    this.colorB = opts.colorB ?? '#ff3fa8';
    this.w = canvas.width; this.h = canvas.height;
    this._lastResize = 0;
    this._seedInitial();
  }

  _seedInitial(){
    this.particles.length = 0;
    for(let i=0;i<this.amount;i++){
      this.particles.push(this._make());
    }
  }

  _make(){
    const w = this.w, h = this.h;
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      vx: (Math.random()-0.5)*this.speed,
      vy: (Math.random()-0.5)*this.speed,
      size: Math.max(1, this.size*(0.6+Math.random()*0.9)),
      life: 100 + Math.random()*200,
      age: Math.random()*100,
      col: this._mixColor(this.colorA, this.colorB, Math.random())
    };
  }

  _mixColor(a,b,t){
    const pa = this._hexToRgb(a), pb = this._hexToRgb(b);
    const r=Math.round(pa.r*(1-t)+pb.r*t);
    const g=Math.round(pa.g*(1-t)+pb.g*t);
    const bl=Math.round(pa.b*(1-t)+pb.b*t);
    return `rgba(${r},${g},${bl},1)`;
  }

  _hexToRgb(hex){
    const h = hex.replace('#','');
    return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
  }

  resize(w,h){
    this.w = w; this.h = h;
    // keep particles inside
    for(const p of this.particles){
      p.x = Math.min(this.w, Math.max(0, p.x));
      p.y = Math.min(this.h, Math.max(0, p.y));
    }
  }

  setOptions(opts){
    if(typeof opts.amount === 'number') this.amount = Math.max(0, Math.floor(opts.amount));
    if(typeof opts.size === 'number') this.size = opts.size;
    if(typeof opts.speed === 'number') this.speed = opts.speed;
    if(typeof opts.direction === 'string') this.direction = opts.direction;
    if(opts.colorA) this.colorA = opts.colorA;
    if(opts.colorB) this.colorB = opts.colorB;

    // adjust array
    if(this.particles.length < this.amount){
      const add = this.amount - this.particles.length;
      for(let i=0;i<add;i++) this.particles.push(this._make());
    } else if(this.particles.length > this.amount){
      this.particles.splice(0, this.particles.length - this.amount);
    }
  }

  tick(audioData=null){
    // update physics
    const ctx = this.ctx;
    const w = this.w, h = this.h;
    for(const p of this.particles){
      // audio influence: push velocity based on bass or energy
      let audioFactor = 0;
      if(audioData && audioData.length){
        // sample medium frequencies
        const idx = Math.floor(Math.random()*Math.min(32, audioData.length));
        audioFactor = (audioData[idx] / 255) * 2.0;
      }

      // direction control
      const speedBase = this.speed * (0.2 + Math.random()*0.8) + audioFactor*1.5;
      if(this.direction === 'float'){
        p.vx += (Math.random()-0.5)*0.2;
        p.vy += (Math.random()-0.5)*0.2;
      } else if(this.direction === 'up'){
        p.vy -= 0.02 + audioFactor*0.15;
        p.vx += (Math.random()-0.5)*0.02;
      } else if(this.direction === 'down'){
        p.vy += 0.02 + audioFactor*0.15;
        p.vx += (Math.random()-0.5)*0.02;
      } else if(this.direction === 'left'){
        p.vx -= 0.02 + audioFactor*0.15;
      } else if(this.direction === 'right'){
        p.vx += 0.02 + audioFactor*0.15;
      }

      // friction
      p.vx *= 0.985;
      p.vy *= 0.985;

      // velocity influence by size and speed
      p.x += p.vx * (speedBase*0.8);
      p.y += p.vy * (speedBase*0.8);

      p.age++;
      if(p.age > p.life || p.x < -50 || p.x > w+50 || p.y < -50 || p.y > h+50){
        // recycle
        Object.assign(p, this._make());
        // put near center for nicer visuals
        p.x = Math.random()*w;
        p.y = Math.random()*h;
      }
    }
  }

  draw(opacity=1.0){
    const ctx = this.ctx;
    ctx.save();
    for(const p of this.particles){
      ctx.globalAlpha = Math.max(0.05, (1 - p.age/p.life) * opacity);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
}
