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

/* ---- 自然质感（形状和颜色定稿之后再加）----
 * 不要几何卡通那种完美圆角：
 *   organic(pts,amp,seed)  手绘感的轮廓：边上随机起伏，再用平滑曲线连起来
 *   texFilter(id,o)        整个角色套一层滤镜：边缘轻微不规则 + 表面颗粒 + 轮廓内侧压暗
 *   ao(id,d,w,op)          零件交界处的柔和阴影（接缝、关节、衣褶）
 *   scratches(...)         刮痕、纤维、蜡笔纹这类细线
 */
function organic(pts,amp,seed,opt){
  opt=opt||{}; const R=rng(seed||1), sub=opt.sub||3, open=!!opt.open, P=[];
  const n=pts.length, m=open?n-1:n;
  for(let i=0;i<m;i++){ const a=pts[i], b=pts[(i+1)%n], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1;
    for(let k=0;k<sub;k++){ const t=k/sub, j=(k===0)?0.35:1, w=(R()*2-1)*amp*j;
      P.push([a[0]+dx*t - dy/L*w, a[1]+dy*t + dx/L*w]); } }
  if(open) P.push(pts[n-1]);
  const N=P.length, g=i=>open?P[Math.max(0,Math.min(N-1,i))]:P[(i+N)%N];
  let d=`M${f1(P[0][0])},${f1(P[0][1])}`;
  for(let i=0;i<(open?N-1:N);i++){ const p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2);
    d+=`C${f1(p1[0]+(p2[0]-p0[0])/6)},${f1(p1[1]+(p2[1]-p0[1])/6)} ${f1(p2[0]-(p3[0]-p1[0])/6)},${f1(p2[1]-(p3[1]-p1[1])/6)} ${f1(p2[0])},${f1(p2[1])}`; }
  return open?d:d+'Z';
}
// 椭圆上的点（给 organic 用）
function ring(cx,cy,rx,ry,n,rot){ const a0=rot||0;
  return [...Array(n)].map((_,i)=>{ const a=a0+i/n*Math.PI*2; return [cx+Math.cos(a)*rx, cy+Math.sin(a)*ry]; }); }
function texFilter(id,o){ o=o||{};
  const rough=o.rough??2.4, warpF=o.warpF??0.045, grainF=o.grainF??0.32, grain=o.grain??0.16, rim=o.rim??0.5, seed=o.seed||3;
  const lin=`type="linear" slope="${f1(grain*5)}" intercept="${(0.5-grain*2.5).toFixed(2)}"`;
  return `<filter id="${id}" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${warpF}" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="${rough}" xChannelSelector="R" yChannelSelector="G" result="r"/>
    <feTurbulence type="fractalNoise" baseFrequency="${grainF}" numOctaves="3" seed="${seed+5}" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="ng"/>
    <feComponentTransfer in="ng" result="gc"><feFuncR ${lin}/><feFuncG ${lin}/><feFuncB ${lin}/><feFuncA type="table" tableValues="1 1"/></feComponentTransfer>
    <feBlend in="gc" in2="r" mode="soft-light" result="b0"/>
    <feComposite in="b0" in2="r" operator="in" result="b"/>
    <feGaussianBlur in="r" stdDeviation="${o.rimBlur||3.5}" result="ab"/>
    <feColorMatrix in="ab" type="matrix" values="0 0 0 0 .07  0 0 0 0 .05  0 0 0 0 .04  0 0 0 -${rim} ${rim}" result="e"/>
    <feComposite in="e" in2="r" operator="in" result="ei"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="ei"/></feMerge>
  </filter>
  <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${o.aoBlur||3}"/></filter>`;
}
function ao(id,d,w,op){ return `<path d="${d}" fill="none" stroke="#1a120c" stroke-width="${w||8}" stroke-linecap="round" opacity="${op||0.35}" filter="url(#${id}-soft)"/>`; }
function scratches(seed,x0,y0,w,h,n,len,col,sw,op,ang){ const R=rng(seed); let d='';
  for(let i=0;i<n;i++){ const x=x0+R()*w, y=y0+R()*h, a=(ang==null?(R()-0.5)*2.4:ang+(R()-0.5)*0.5), l=len*(0.4+R()*0.8);
    d+=`M${f1(x)},${f1(y)}l${f1(Math.cos(a)*l)},${f1(Math.sin(a)*l)}`; }
  return `<path d="${d}" stroke="${col}" stroke-width="${sw||0.8}" stroke-linecap="round" opacity="${op||0.5}" fill="none"/>`; }

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

window.CharSprites={ NS, f1, rng, sstep, kf, CharRig, bake, draw, organic, ring, texFilter, ao, scratches };
})();
