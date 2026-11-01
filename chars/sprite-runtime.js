/* 角色精灵运行时
 * 每个角色文件（如 swamp-troll.js）注册到 window.CHARS，提供：
 *   viewBox, foot:[x,y]（脚底锚点）, center:[x,y]（图标锚点）, anims:{名字:{dur,frames,loop,overlay}}
 *   markup(P) → SVG 内容字符串；bind(svg,P) → 零件引用；pose(anim,p) → 姿态参数；apply(parts,o,flipped)
 *   hit(o,k) → 受击时叠加的姿态
 * 预览页用 CharRig 实时驱动 SVG；游戏用 bake() 预烘焙成帧，再用 draw() 画到 Canvas。
 */
(function(){
const NS='http://www.w3.org/2000/svg';
window.CHARS = window.CHARS || {};

const f1=n=>+n.toFixed(1);
function rng(seed){ return ()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }; }
const sstep=k=>{ k=Math.max(0,Math.min(1,k)); return k*k*(3-2*k); };
// 关键帧插值：frames = [[时间0..1, {参数}], ...]，缺省参数取 BASE
function kf(BASE,frames,p){
  let i=0; while(i<frames.length-2 && p>frames[i+1][0]) i++;
  const [t0,a]=frames[i], [t1,b]=frames[i+1], k=sstep((p-t0)/(t1-t0)), o={...BASE};
  for(const key in BASE){ const va=key in a?a[key]:BASE[key], vb=key in b?b[key]:BASE[key]; o[key]=va+(vb-va)*k; }
  return o;
}

/* ---- 预览页：实时 SVG 动画 ---- */
class CharRig{
  constructor(def,svg,P){
    this.def=def; this.svg=svg;
    svg.setAttribute('viewBox',def.viewBox.join(' ')); svg.innerHTML=def.markup(P);
    this.parts=def.bind(svg,P);
    this.loop='idle'; this.one=null; this.t=Math.random()*5; this.oneT=0; this.flipped=false;
  }
  setFlip(f){ this.flipped=f; this.parts.flip.setAttribute('transform', f?`translate(${this.def.flipX},0) scale(-1,1)`:''); }
  play(one){ this.one=one; this.oneT=0; }
  tick(dt){
    const A=this.def.anims; this.t+=dt;
    if(this.one){ this.oneT+=dt; const a=A[this.one]; if(this.oneT>a.dur+(a.hold||0)) this.one=null; }
    let o;
    if(this.one && !A[this.one].overlay) o=this.def.pose(this.one,Math.min(1,this.oneT/A[this.one].dur));
    else {
      const a=A[this.loop]; o=this.def.pose(this.loop,(this.t%a.dur)/a.dur);
      if(this.one) this.def.hit(o,1-this.oneT/A[this.one].dur);
    }
    this.def.apply(this.parts,o,this.flipped);
    this.svg.style.filter = o.flash>0.01 ? `brightness(${(1+o.flash*0.9).toFixed(2)}) saturate(${(1-o.flash*0.5).toFixed(2)})` : '';
  }
}

/* ---- 游戏：预烘焙成帧 ---- */
function loadImg(str){ return new Promise((res,rej)=>{ const img=new Image();
  img.onload=()=>res(img); img.onerror=rej;
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(str); }); }

// pxH = 每帧的像素高度（按整张 viewBox 算）
async function bake(def,pxH){
  const [vx,vy,vw,vh]=def.viewBox, s=pxH/vh, W=Math.ceil(vw*s), H=Math.ceil(pxH);
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('xmlns',NS); svg.setAttribute('viewBox',def.viewBox.join(' '));
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.innerHTML=def.markup('k'); const parts=def.bind(svg,'k');
  const ser=new XMLSerializer(), out={def,W,H,s,anims:{}}, jobs=[];
  for(const [name,a] of Object.entries(def.anims)){ if(a.overlay) continue;
    const once=a.loop===false, frames=new Array(a.frames);
    out.anims[name]={dur:a.dur,loop:!once,frames};
    for(let i=0;i<a.frames;i++){
      def.apply(parts,def.pose(name, once ? i/(a.frames-1) : i/a.frames),false);
      const str=ser.serializeToString(svg);
      jobs.push(loadImg(str).then(img=>{ const c=document.createElement('canvas'); c.width=W; c.height=H;
        c.getContext('2d').drawImage(img,0,0,W,H); frames[i]=c; }));
    }
  }
  await Promise.all(jobs);
  return out;
}

// 画一帧。mode='field'：脚底对准 (0,0)，高度 h；mode='icon'：内容中心对准 (0,0)，宽度 h
function draw(g,B,anim,time,h,opt){
  opt=opt||{};
  const A=B.anims[anim]||B.anims.idle, n=A.frames.length;
  const i = A.loop ? Math.floor(time/A.dur*n)%n : Math.min(n-1,Math.floor(Math.max(0,time)/A.dur*(n-1)));
  const [vx,vy,vw,vh]=B.def.viewBox;
  const sc = opt.mode==='icon' ? h/vw : h/vh;          // 每 viewBox 单位多少像素
  const anchor = opt.mode==='icon' ? B.def.center : B.def.foot;
  const ax=(anchor[0]-vx)*sc, ay=(anchor[1]-vy)*sc, w=vw*sc, hh=vh*sc;
  g.save(); if(opt.flip) g.scale(-1,1);
  g.drawImage(A.frames[i],-ax,-ay,w,hh);
  if(opt.flash>0){ g.globalCompositeOperation='lighter'; g.globalAlpha=Math.min(1,opt.flash)*0.6; g.drawImage(A.frames[i],-ax,-ay,w,hh); }
  g.restore();
}

window.CharSprites={ NS, f1, rng, sstep, kf, CharRig, bake, draw };
})();
