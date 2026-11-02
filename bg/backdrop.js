/* 关卡背景：程序生成的写实太空场景（每关开局渲染一次并缓存）
 * Backdrop.render({theme, seed, routes, pads, holes, W, H, res}) → { canvas, twinkles }
 *   pads / holes：塔位和黑洞位置（地形要托住塔位；黑洞画在玩法位置，并在地形上挖开）
 *   theme: 'earth' | 'space' | 'hell'；variant 0/1 选同一主题下的两种场景（不传则按 seed 随机）
 *   twinkles: 需要每帧闪烁的远处亮星 {x,y,r,c,ph,sp}
 * 画面元素：银河带 + 星云 + 多层星空 + 主题天体（行星/环/黑洞/恒星）+ 浮空岩地 + 道路（含立交桥）+ 暗角
 */
(function(){
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sstep=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

// 三维值噪声 + 分形叠加（球面贴图用三维避免接缝）
function makeNoise(seed){
  const R=mulberry(seed), P=new Uint8Array(512), V=new Float32Array(256);
  for(let i=0;i<256;i++){ P[i]=i; V[i]=R(); }
  for(let i=255;i>0;i--){ const j=(R()*(i+1))|0, t=P[i]; P[i]=P[j]; P[j]=t; }
  for(let i=0;i<256;i++) P[i+256]=P[i];
  function n3(x,y,z){
    const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
    let u=x-xi, v=y-yi, w=z-zi; u=u*u*(3-2*u); v=v*v*(3-2*v); w=w*w*(3-2*w);
    const X=xi&255, Y=yi&255, Z=zi&255, X1=(X+1)&255, Y1=(Y+1)&255, Z1=(Z+1)&255;
    const A=P[X], B=P[X1];
    const a00=P[A+Y], a01=P[A+Y1], b00=P[B+Y], b01=P[B+Y1];
    const l=(p,q,t)=>p+(q-p)*t;
    return l( l(l(V[P[a00+Z]],V[P[b00+Z]],u), l(V[P[a01+Z]],V[P[b01+Z]],u), v),
              l(l(V[P[a00+Z1]],V[P[b00+Z1]],u), l(V[P[a01+Z1]],V[P[b01+Z1]],u), v), w);
  }
  function fbm(x,y,z,oct){ let s=0,a=0.5,f=1,n=0;
    for(let i=0;i<oct;i++){ s+=a*n3(x*f,y*f,z*f); n+=a; a*=0.5; f*=2.03; } return s/n; }
  return { n3, fbm };
}

// 与路线的最短距离（摆放天体时避开道路）
function routeDist(x,y,routes){ let m=1e9;
  for(const p of routes) for(let i=1;i<p.length;i++){
    const ax=p[i-1][0], ay=p[i-1][1], bx=p[i][0]-ax, by=p[i][1]-ay, L=bx*bx+by*by||1;
    const t=clamp(((x-ax)*bx+(y-ay)*by)/L,0,1), dx=x-ax-bx*t, dy=y-ay-by*t;
    m=Math.min(m,Math.hypot(dx,dy)); }
  return m; }
function pickSpot(cands,routes){ let best=cands[0], bd=-1;
  for(const c of cands){ const d=routeDist(c[0],c[1],routes); if(d>bd){ bd=d; best=c; } } return best; }

const THEMES={
  earth:{ base:['#02060b','#061420','#020509'], neb:[[30,120,140],[70,60,150],[20,70,90]], dust:0.55,
          road:{ edge:'#15130f', base:'#6b5a40', wear:'#8a7656', style:'dirt' },
          land:{ top:[[62,66,56],[96,98,80]], moss:[70,104,58], cliff:[[48,42,34],[16,14,11]], crystal:[110,230,255] } },
  space:{ base:['#04030c','#0b0922','#03020a'], neb:[[110,55,190],[210,70,140],[40,80,190]], dust:0.65,
          road:{ edge:'#0f1116', base:'#3a4352', wear:'#56627a', style:'metal' },
          land:{ top:[[66,62,64],[100,94,92]], moss:[86,80,112], cliff:[[44,40,46],[14,12,16]], crystal:[190,140,255] } },
  hell: { base:['#0a0203','#1a0508','#050102'], neb:[[190,50,20],[110,10,35],[240,120,40]], dust:0.75,
          road:{ edge:'#120807', base:'#4a2c24', wear:'#6a4234', style:'basalt' },
          land:{ top:[[40,30,28],[70,52,46]], moss:[90,40,24], cliff:[[42,22,18],[12,6,5]], crystal:[255,140,60] } },
};

/* ---------- 星空、银河、星云 ---------- */
const STAR_COLS=[[155,176,255],[170,191,255],[202,215,255],[248,247,255],[255,244,234],[255,210,161],[255,181,108]];
function starColor(R){ const r=R(); return STAR_COLS[r<0.1?0:r<0.25?1:r<0.45?2:r<0.7?3:r<0.85?4:r<0.95?5:6]; }

function skyLayer(g,W,H,T,N,R,band){
  // 低分辨率逐像素：星云（域扭曲分形噪声）+ 银河光带（带尘埃暗带）
  const s=3, w=Math.ceil(W/s), h=Math.ceil(H/s);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const cx=c.getContext('2d'), id=cx.createImageData(w,h), D=id.data;
  const [c1,c2,c3]=T.neb, ox=R()*50, oy=R()*50;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const X=x*s/W*3, Y=y*s/H*2;
    const qx=N.fbm(X+ox,Y+oy,0.3,4), qy=N.fbm(X+ox+5.2,Y+oy+1.3,0.7,4);
    const n=N.fbm(X+qx*1.8+ox,Y+qy*1.8+oy,1.7,5);
    const dens=sstep(0.46,0.78,n), tint=N.fbm(X*0.7+ox+9,Y*0.7,2.3,3);
    let col=mix(c1,c2,sstep(0.35,0.65,tint)); col=mix(col,c3,sstep(0.6,0.8,qx));
    let a=dens*0.5;
    // 银河：沿斜线的高斯光带，核心偏暖，被尘埃暗带切开
    const px=x*s, py=y*s, d=(px-band.x)*band.ny-(py-band.y)*band.nx;
    const gb=Math.exp(-(d*d)/(2*band.sig*band.sig));
    const dust=sstep(0.5,0.68,N.fbm(X*2.2+3,Y*2.2+7,4.1,5));
    const mw=gb*(0.55+0.45*N.fbm(X*1.5,Y*1.5,6.6,4))*(1-dust*T.dust);
    const mwc=mix([150,170,220],[255,225,190],gb);
    const tot=a+mw*0.6, k=tot>0?mw*0.6/tot:0;
    col=mix(col,mwc,k); a=Math.min(0.85,tot);
    const i=(y*w+x)*4; D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=a*255;
  }
  cx.putImageData(id,0,0);
  g.save(); g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  g.globalCompositeOperation='screen'; g.drawImage(c,0,0,W,H); g.restore();
}

function starfield(g,W,H,R,band,twinkles,routes){
  // 银河里的密集微星
  for(let i=0;i<2200;i++){
    const t=R()*1.4-0.2, u=(R()+R()+R()-1.5)*band.sig*0.9;
    const x=band.x+band.nx*(t-0.5)*W*1.6+band.ny*u, y=band.y+band.ny*(t-0.5)*W*1.6-band.nx*u;
    if(x<0||y<0||x>W||y>H) continue;
    g.fillStyle=rgba(starColor(R),0.25+R()*0.5); g.fillRect(x,y,0.6+R()*0.5,0.6+R()*0.5);
  }
  // 全天暗星
  for(let i=0;i<900;i++){ const r=0.3+R()*0.45;
    g.fillStyle=rgba(starColor(R),0.25+R()*0.55); g.beginPath(); g.arc(R()*W,R()*H,r,0,7); g.fill(); }
  // 中等亮星带光晕（不落在道路附近，免得和路上的东西混在一起）
  for(let i=0;i<70;i++){ const x=R()*W, y=R()*H, r=0.8+R()*0.6, c=starColor(R);
    if(routeDist(x,y,routes)<44) continue;
    const gr=g.createRadialGradient(x,y,0,x,y,r*4); gr.addColorStop(0,rgba(c,0.9)); gr.addColorStop(0.3,rgba(c,0.25)); gr.addColorStop(1,rgba(c,0));
    g.fillStyle=gr; g.fillRect(x-r*4,y-r*4,r*8,r*8); }
  // 少数远处的极亮星：十字星芒，加入闪烁列表
  for(let i=0,n=0;i<40 && n<5;i++){ const x=R()*W, y=R()*H, c=starColor(R), L=8+R()*12;
    if(routeDist(x,y,routes)<70) continue; n++;
    g.save(); g.globalCompositeOperation='lighter';
    for(const [dx,dy] of [[1,0],[0,1]]){ const gr=g.createLinearGradient(x-dx*L,y-dy*L,x+dx*L,y+dy*L);
      gr.addColorStop(0,rgba(c,0)); gr.addColorStop(0.5,rgba(c,0.8)); gr.addColorStop(1,rgba(c,0));
      g.strokeStyle=gr; g.lineWidth=0.9; g.beginPath(); g.moveTo(x-dx*L,y-dy*L); g.lineTo(x+dx*L,y+dy*L); g.stroke(); }
    const gr=g.createRadialGradient(x,y,0,x,y,7); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.25,rgba(c,0.6)); gr.addColorStop(1,rgba(c,0));
    g.fillStyle=gr; g.fillRect(x-7,y-7,14,14); g.restore();
    twinkles.push({x,y,r:2.2,c,ph:R()*6.28,sp:0.8+R()*1.6}); }
}

/* ---------- 球体：逐像素光照（明暗交界、边缘变暗、大气散射、夜面灯光） ---------- */
function sphere(g,W,H,cx,cy,r,o){
  const aw=o.atmo?0.08:0, ext=r*(1+aw)+2, sres=r>110?1:(o.res||2);
  const x0=Math.max(0,Math.floor(cx-ext)), y0=Math.max(0,Math.floor(cy-ext));
  const x1=Math.min(W,Math.ceil(cx+ext)), y1=Math.min(H,Math.ceil(cy+ext));
  if(x1<=x0||y1<=y0) return;
  const bw=Math.ceil((x1-x0)*sres), bh=Math.ceil((y1-y0)*sres);
  const c=document.createElement('canvas'); c.width=bw; c.height=bh;
  const cx2=c.getContext('2d'), id=cx2.createImageData(bw,bh), D=id.data;
  const L=o.light, ct=Math.cos(o.tilt||0), st=Math.sin(o.tilt||0), spin=o.spin||0, cs=Math.cos(spin), ss=Math.sin(spin);
  for(let py=0;py<bh;py++) for(let px=0;px<bw;px++){
    const lx=x0+(px+0.5)/sres-cx, ly=y0+(py+0.5)/sres-cy, d=Math.hypot(lx,ly), i=(py*bw+px)*4;
    let ga=0;                                     // 大气外光晕的不透明度
    if(o.atmo && d>r*0.98 && d<r*(1+aw)){ const t=Math.max(0,(d-r)/(r*aw)), lit=sstep(-0.4,0.5,(lx*L[0]+ly*L[1])/(d||1)*0.9+L[2]*0.3);
      ga=Math.pow(1-t,2.2)*lit*0.75; }
    if(d<=r+0.8){
      const nx=Math.min(1,lx/r), ny=Math.min(1,ly/r), nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
      // 自转轴倾斜后的纹理坐标
      let tx=nx*ct-ny*st, ty=nx*st+ny*ct, tz=nz; const tx2=tx*cs+tz*ss; tz=-tx*ss+tz*cs; tx=tx2;
      const lam=nx*L[0]+ny*L[1]+nz*L[2];
      let col=o.tex(tx,ty,tz);
      const day=sstep(-0.08,0.35,lam)*0.97+0.03;
      col=[col[0]*day,col[1]*day,col[2]*day];
      if(o.emit){ const e=o.emit(tx,ty,tz); col=[col[0]+e[0],col[1]+e[1],col[2]+e[2]]; }
      if(o.night && lam<0.1){ const k=1-sstep(-0.15,0.1,lam), e=o.night(tx,ty,tz); col=[col[0]+e[0]*k,col[1]+e[1]*k,col[2]+e[2]*k]; }
      if(o.atmo){ const rim=Math.pow(1-nz,3)*sstep(-0.3,0.4,lam); col=mix(col,o.atmo,rim*0.85); }
      const cov=clamp((r+0.8-d)*sres,0,1), a=cov+ga*(1-cov);
      if(o.atmo && cov<1) col=mix(o.atmo,col,cov/(a||1));
      D[i]=clamp(col[0],0,255); D[i+1]=clamp(col[1],0,255); D[i+2]=clamp(col[2],0,255); D[i+3]=255*a;
    } else if(ga>0){
      D[i]=o.atmo[0]; D[i+1]=o.atmo[1]; D[i+2]=o.atmo[2]; D[i+3]=255*ga;
    }
  }
  cx2.putImageData(id,0,0);
  g.save(); g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high'; g.drawImage(c,x0,y0,x1-x0,y1-y0); g.restore();
}

// 恒星：核心 + 大范围辉光 + 横向光带 + 镜头光斑
function sun(g,W,H,x,y,r,c,flare){
  g.save(); g.globalCompositeOperation='lighter';
  let gr=g.createRadialGradient(x,y,0,x,y,r*10); gr.addColorStop(0,rgba(c,0.55)); gr.addColorStop(0.15,rgba(c,0.18)); gr.addColorStop(1,rgba(c,0));
  g.fillStyle=gr; g.fillRect(x-r*10,y-r*10,r*20,r*20);
  gr=g.createRadialGradient(x,y,0,x,y,r*1.6); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.55,'rgba(255,255,250,1)'); gr.addColorStop(1,rgba(c,0));
  g.fillStyle=gr; g.beginPath(); g.arc(x,y,r*1.6,0,7); g.fill();
  g.save(); g.translate(x,y); g.scale(1,0.035);
  gr=g.createRadialGradient(0,0,0,0,0,r*14); gr.addColorStop(0,rgba(c,0.5)); gr.addColorStop(1,rgba(c,0));
  g.fillStyle=gr; g.beginPath(); g.arc(0,0,r*14,0,7); g.fill(); g.restore();
  if(flare){ const vx=W/2-x, vy=H/2-y;
    for(const [k,s,a] of [[0.5,r*0.9,0.08],[0.8,r*0.5,0.1],[1.25,r*1.8,0.05],[1.5,r*0.7,0.08]]){
      g.fillStyle=rgba(mix(c,[120,200,255],k/1.5),a); g.beginPath(); g.arc(x+vx*k,y+vy*k,s,0,7); g.fill(); } }
  g.restore();
}

/* ---------- 纹理 ---------- */
function habitableTex(N){ return {
  tex:(x,y,z)=>{ const e=N.fbm(x*2.2+11,y*2.2,z*2.2,6);
    let col;
    if(e<0.52){ const k=sstep(0.38,0.52,e); col=mix([8,30,72],[30,95,140],k); }
    else { const h=sstep(0.52,0.7,e); col=mix([62,112,48],[132,112,78],h); if(e>0.68) col=mix(col,[235,235,235],sstep(0.68,0.74,e)); }
    if(Math.abs(y)>0.82) col=mix(col,[240,244,248],sstep(0.82,0.9,Math.abs(y)+N.n3(x*6,y*6,z*6)*0.05));
    const cl=sstep(0.52,0.74,N.fbm(x*3+40,y*5,z*3,5));
    return mix(col,[245,248,252],cl*0.9); },
  night:(x,y,z)=>{ const e=N.fbm(x*2.2+11,y*2.2,z*2.2,6); if(e<0.53) return [0,0,0];
    const c=sstep(0.62,0.8,N.fbm(x*14,y*14,z*14,3)); return [255*c*0.9,180*c*0.9,90*c*0.9]; },
}; }
function desertTex(N){ return { tex:(x,y,z)=>{
  const d=Math.sin(y*38+N.fbm(x*3,y*3,z*3,4)*9)*0.5+0.5, e=N.fbm(x*2.5+7,y*2.5,z*2.5,5);
  let col=mix([196,150,96],[226,190,132],d*0.5+e*0.5);
  return mix(col,[128,92,62],sstep(0.62,0.75,e)); } }; }
function gasTex(N){ return { tex:(x,y,z)=>{
  const v=y+0.07*N.fbm(x*3,y*3,z*3,5);
  const b=Math.sin(v*21)*0.5+0.5, b2=Math.sin(v*47+1.3)*0.5+0.5;
  let col=mix([224,204,164],[186,142,96],b); col=mix(col,[142,96,62],b2*0.35);
  col=mix(col,[200,190,180],sstep(0.6,0.85,Math.abs(y)));
  const sx=(x-0.35)/0.18, sy=(y-0.28)/0.08, sd=sx*sx+sy*sy;               // 大红斑
  if(sd<1 && z>0) col=mix(col,[176,86,56],(1-sd)*0.8);
  return col; } }; }
function iceTex(N){ return { tex:(x,y,z)=>{
  const n=N.fbm(x*3,y*3,z*3,5), rid=1-Math.abs(N.fbm(x*7+3,y*7,z*7,4)*2-1);
  let col=mix([196,214,232],[240,246,252],n);
  col=mix(col,[70,100,140],sstep(0.86,0.97,rid)*0.8);
  return mix(col,[120,124,130],sstep(0.66,0.76,N.fbm(x*4+9,y*4,z*4,4))*0.6); } }; }
function lavaTex(N){
  const crack=(x,y,z)=>1-Math.abs(N.fbm(x*5,y*5,z*5,5)*2-1);
  return {
    tex:(x,y,z)=>mix([34,26,24],[70,52,44],N.fbm(x*4,y*4,z*4,4)),
    emit:(x,y,z)=>{ const k=sstep(0.82,0.95,crack(x,y,z)); return [255*k,110*k,25*k]; },
  }; }
function moonTex(N,R){ const cr=[...Array(14)].map(()=>{ const a=R()*6.28, b=Math.acos(R()*2-1);
    return [Math.sin(b)*Math.cos(a),Math.sin(b)*Math.sin(a),Math.cos(b),0.08+R()*0.18]; });
  return { tex:(x,y,z)=>{ let v=0.55+0.25*N.fbm(x*4,y*4,z*4,5);
    for(const [a,b,c,s] of cr){ const d=Math.hypot(x-a,y-b,z-c)/s; if(d<1.15) v+= d<0.85 ? -0.12*(1-d) : 0.1*(1-Math.abs(d-1)/0.15); }
    v*=255; return [v,v,v*1.02]; } }; }

/* ---------- 行星环、星系、黑洞、小行星 ---------- */
function rings(g,cx,cy,r,tilt,half,light){
  g.save(); g.translate(cx,cy); g.rotate(tilt); g.scale(1,0.28);
  g.beginPath(); if(half==='back') g.rect(-r*3,-r*3,r*6,r*3); else g.rect(-r*3,0,r*6,r*3); g.clip();
  for(let k=0;k<70;k++){ const t=k/70, rr=r*(1.35+t*1.05);
    if(t>0.62&&t<0.68) continue;                                   // 卡西尼缝
    const a=(0.25+0.45*Math.abs(Math.sin(t*37)))*(half==='back'?0.75:1);
    g.strokeStyle=rgba(mix([210,190,160],[150,130,110],Math.abs(Math.sin(t*13))),a);
    g.lineWidth=r*1.05/70*1.4; g.beginPath(); g.arc(0,0,rr,0,7); g.stroke(); }
  g.restore();
}
function galaxy(g,x,y,r,R,rot){
  g.save(); g.translate(x,y); g.rotate(rot); g.scale(1,0.42); g.globalCompositeOperation='lighter';
  let gr=g.createRadialGradient(0,0,0,0,0,r); gr.addColorStop(0,'rgba(255,236,200,.55)'); gr.addColorStop(0.25,'rgba(200,190,255,.15)'); gr.addColorStop(1,'rgba(120,140,255,0)');
  g.fillStyle=gr; g.beginPath(); g.arc(0,0,r,0,7); g.fill();
  for(let arm=0;arm<2;arm++) for(let i=0;i<260;i++){ const t=R(), a=arm*Math.PI+t*4.2, rr=r*0.12+t*r*0.85+(R()-0.5)*r*0.12;
    g.fillStyle=`rgba(${R()<0.3?'255,200,220':'190,210,255'},${(0.5*(1-t)+0.1).toFixed(2)})`;
    g.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,0.9,0.9); }
  g.restore();
}
function blackHole(g,x,y,rs){
  // 盘面先画到离屏画布，再整体乘一个左亮右暗的渐变（多普勒增亮），最后用 lighter 叠加
  const S=Math.ceil(rs*11);
  const ring=(o,sy,r0,r1,a,half)=>{ o.save(); o.scale(1,sy);
    if(half){ o.beginPath(); if(half>0) o.rect(-S,0,2*S,S); else o.rect(-S,-S,2*S,S); o.clip(); }
    const gr=o.createRadialGradient(0,0,r0,0,0,r1);
    gr.addColorStop(0,`rgba(255,246,225,${a})`); gr.addColorStop(0.12,`rgba(255,205,130,${a*0.85})`);
    gr.addColorStop(0.45,`rgba(240,125,50,${a*0.35})`); gr.addColorStop(1,'rgba(200,60,20,0)');
    o.fillStyle=gr; o.beginPath(); o.arc(0,0,r1,0,7); o.arc(0,0,r0,0,7,true); o.fill(); o.restore(); };
  const layer=draw=>{ const c=document.createElement('canvas'); c.width=c.height=S*2;
    const o=c.getContext('2d'); o.scale(2,2); o.translate(S/2,S/2); draw(o);
    o.setTransform(1,0,0,1,0,0); o.globalCompositeOperation='destination-in';
    const lg=o.createLinearGradient(0,0,S*2,0); lg.addColorStop(0,'rgba(0,0,0,1)'); lg.addColorStop(1,'rgba(0,0,0,.38)');
    o.fillStyle=lg; o.fillRect(0,0,S*2,S*2); return c; };
  const back =layer(o=>{ ring(o,0.92,rs*1.07,rs*2.5,1); ring(o,0.11,rs*1.45,rs*5.2,1); });
  const front=layer(o=>ring(o,0.11,rs*1.45,rs*5.2,1,1));
  g.save(); g.globalCompositeOperation='lighter';
  const gl=g.createRadialGradient(x,y,rs,x,y,rs*6); gl.addColorStop(0,'rgba(255,160,70,.3)'); gl.addColorStop(1,'rgba(255,110,40,0)');
  g.fillStyle=gl; g.fillRect(x-rs*6,y-rs*6,rs*12,rs*12);
  g.drawImage(back,x-S/2,y-S/2,S,S);
  g.restore();
  g.fillStyle='#000'; g.beginPath(); g.arc(x,y,rs*1.04,0,7); g.fill();          // 事件视界的阴影
  g.save(); g.globalCompositeOperation='lighter';
  g.strokeStyle='rgba(255,232,195,.85)'; g.lineWidth=1.2; g.beginPath(); g.arc(x,y,rs*1.08,0,7); g.stroke();   // 光子环
  g.drawImage(front,x-S/2,y-S/2,S,S);                                             // 盘面前半挡在黑洞前
  g.restore();
}
function asteroids(g,W,H,R,N,routes,n,light,col){
  for(let i=0;i<n;i++){ const r=2+Math.pow(R(),3)*16, x=R()*W, y=R()*H;
    if(routeDist(x,y,routes)<r+40) continue;
    const pts=[]; for(let k=0;k<11;k++){ const a=k/11*6.283, rr=r*(0.72+0.5*N.n3(x+Math.cos(a)*2,y+Math.sin(a)*2,i)); pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]); }
    const gr=g.createLinearGradient(x+light[0]*r,y+light[1]*r,x-light[0]*r,y-light[1]*r);
    gr.addColorStop(0,rgba(col[0],1)); gr.addColorStop(1,rgba(col[1],1));
    g.fillStyle=gr; g.beginPath(); pts.forEach((p,k)=>g[k?'lineTo':'moveTo'](p[0],p[1])); g.closePath(); g.fill();
    g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=0.8; g.stroke();
    for(let k=0;k<Math.floor(r/4);k++){ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.arc(x+(R()-0.5)*r,y+(R()-0.5)*r,r*0.12+R()*r*0.1,0,7); g.fill(); }
  }
}

/* ---------- 地形：托着道路和塔位的浮空岩地（悬崖、陨坑、碎石、晶体） ---------- */
function plen(p){ let L=0; for(let i=1;i<p.length;i++) L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]); return L; }
// 沿折线每隔 step 取一个点（含切线方向）
function walk(p,step,fn){ let acc=0;
  for(let i=1;i<p.length;i++){ const ax=p[i-1][0], ay=p[i-1][1], dx=p[i][0]-ax, dy=p[i][1]-ay, L=Math.hypot(dx,dy); if(!L) continue;
    let t=(step-acc)/L; while(t<=1){ fn(ax+dx*t, ay+dy*t, dx/L, dy/L); t+=step/L; } acc=(acc+L)%step; } }
function tint(mask,col){ const c=document.createElement('canvas'); c.width=mask.width; c.height=mask.height;
  const x=c.getContext('2d'); x.drawImage(mask,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,c.width,c.height); return c; }
function terrain(g,W,H,res,routes,pads,holes,T,N,R){
  const S=T.land, m=document.createElement('canvas'); m.width=W*res; m.height=H*res;
  const mg=m.getContext('2d'); mg.scale(res,res); mg.fillStyle='#fff';
  const blob=(x,y,r)=>{ mg.beginPath(); mg.arc(x,y,r,0,7); mg.fill(); };
  for(const p of routes) walk(p,10,(x,y)=>blob(x,y,44+46*N.fbm(x/110,y/110,3.3,3)+7*N.n3(x/16,y/16,0.5)));
  for(const q of pads) blob(q.x,q.y,36+10*N.n3(q.x/40,q.y/40,1.1));
  for(let i=0;i<7;i++){ const x=R()*W, y=R()*H; if(routeDist(x,y,routes)<120) continue;   // 远处零散的小浮岩
    for(let k=0;k<4;k++) blob(x+(R()-0.5)*30,y+(R()-0.5)*20,8+R()*14); }
  mg.globalCompositeOperation='destination-out';
  for(const h of holes){ const gr=mg.createRadialGradient(h.x,h.y,30,h.x,h.y,62); gr.addColorStop(0,'#000'); gr.addColorStop(1,'rgba(0,0,0,0)');
    mg.fillStyle=gr; mg.beginPath(); mg.arc(h.x,h.y,62,0,7); mg.fill(); }
  // 悬崖：遮罩往下错开，竖直渐变上色，外加一圈投影
  const cl=document.createElement('canvas'); cl.width=m.width; cl.height=m.height; const cg=cl.getContext('2d');
  cg.drawImage(m,0,0); cg.globalCompositeOperation='source-in';
  const cgr=cg.createLinearGradient(0,0,0,m.height); cgr.addColorStop(0,rgba(S.cliff[0],1)); cgr.addColorStop(1,rgba(S.cliff[1],1));
  cg.fillStyle=cgr; cg.fillRect(0,0,m.width,m.height);
  g.save(); g.shadowColor='rgba(0,0,0,.75)'; g.shadowBlur=26; g.shadowOffsetY=10;
  g.drawImage(cl,0,14,W,H); g.restore();
  g.drawImage(tint(m,'rgba(0,0,0,.35)'),0,7,W,H);                         // 悬崖上沿的暗带
  // 地表：低分辨率逐像素噪声上色（岩石 + 苔藓/尘土斑块），再裁成遮罩形状
  const s2=2, w=Math.ceil(W/s2), h=Math.ceil(H/s2), tc=document.createElement('canvas'); tc.width=w; tc.height=h;
  const tx=tc.getContext('2d'), id=tx.createImageData(w,h), D=id.data;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const X=x*s2/70, Y=y*s2/70;
    const n=N.fbm(X,Y,7.7,5), fine=N.n3(X*9,Y*9,2.2), moss=sstep(0.55,0.7,N.fbm(X*0.8+20,Y*0.8,4.4,4));
    let c=mix(S.top[0],S.top[1],sstep(0.3,0.75,n)); c=mix(c,S.moss,moss*0.55);
    const k=0.86+fine*0.22, i=(y*w+x)*4; D[i]=c[0]*k; D[i+1]=c[1]*k; D[i+2]=c[2]*k; D[i+3]=255; }
  tx.putImageData(id,0,0);
  const top=document.createElement('canvas'); top.width=m.width; top.height=m.height; const tg=top.getContext('2d');
  tg.imageSmoothingQuality='high'; tg.drawImage(tc,0,0,m.width,m.height);
  const gr2=document.createElement('canvas'); gr2.width=gr2.height=96; const gx=gr2.getContext('2d');   // 细颗粒
  for(let i=0;i<1400;i++){ gx.fillStyle=R()<0.5?'rgba(0,0,0,.16)':'rgba(255,245,230,.09)'; gx.fillRect(R()*96,R()*96,1+R()*1.5,1+R()*1.5); }
  tg.fillStyle=tg.createPattern(gr2,'repeat'); tg.fillRect(0,0,top.width,top.height);
  tg.globalCompositeOperation='destination-in'; tg.drawImage(m,0,0);
  g.drawImage(top,0,0,W,H);
  // 上沿受光：遮罩减去下移 3px 的自身 → 一道亮边
  const rim=document.createElement('canvas'); rim.width=m.width; rim.height=m.height; const rg=rim.getContext('2d');
  rg.drawImage(m,0,0); rg.globalCompositeOperation='destination-out'; rg.drawImage(m,0,3*res);
  rg.globalCompositeOperation='source-in'; rg.fillStyle='rgba(255,240,220,.22)'; rg.fillRect(0,0,rim.width,rim.height);
  g.drawImage(rim,0,0,W,H);
  // 装饰：只放在陆地上、离路和塔位都有距离的地方
  const onLand=(x,y)=>{ if(x<4||y<4||x>W-4||y>H-4) return false; const d=mg.getImageData(x*res|0,y*res|0,1,1).data; return d[3]>200; };
  const clear=(x,y,r)=>routeDist(x,y,routes)>34+r && !pads.some(q=>Math.hypot(q.x-x,q.y-y)<22+r);
  for(let i=0;i<90;i++){ const x=R()*W, y=R()*H, r=3+Math.pow(R(),2)*14;          // 陨坑
    if(!clear(x,y,r)||!onLand(x,y)) continue;
    g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x,y,r,r*0.75,0,0,7); g.fill();
    g.strokeStyle='rgba(255,240,220,.16)'; g.lineWidth=1.2; g.beginPath(); g.ellipse(x,y,r,r*0.75,0,0.2,2.6); g.stroke();
    g.strokeStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x,y,r,r*0.75,0,3.3,5.8); g.stroke(); }
  for(let i=0;i<160;i++){ const x=R()*W, y=R()*H, r=1.5+Math.pow(R(),3)*7;       // 碎石
    if(!clear(x,y,r)||!onLand(x,y)) continue;
    const pts=[]; for(let k=0;k<7;k++){ const a=k/7*6.283, rr=r*(0.7+R()*0.5); pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*0.8]); }
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x+1,y+r*0.6,r,r*0.4,0,0,7); g.fill();
    const gr=g.createLinearGradient(x-r,y-r,x+r,y+r); gr.addColorStop(0,rgba(mix(S.top[1],[255,255,255],0.15),1)); gr.addColorStop(1,rgba(S.cliff[0],1));
    g.fillStyle=gr; g.beginPath(); pts.forEach((q,k)=>g[k?'lineTo':'moveTo'](q[0],q[1])); g.closePath(); g.fill(); }
  for(let i=0;i<26;i++){ const x=R()*W, y=R()*H;                                 // 晶体簇（主题色，微微发光）
    if(!clear(x,y,8)||!onLand(x,y)) continue;
    g.save(); g.globalCompositeOperation='lighter';
    const gl=g.createRadialGradient(x,y-4,0,x,y-4,16); gl.addColorStop(0,rgba(S.crystal,0.35)); gl.addColorStop(1,rgba(S.crystal,0));
    g.fillStyle=gl; g.fillRect(x-16,y-20,32,32); g.restore();
    for(let k=0;k<3;k++){ const a=-1.57+(k-1)*0.45+(R()-0.5)*0.3, L=6+R()*7, bx=x+(k-1)*3;
      g.fillStyle=rgba(mix(S.crystal,[255,255,255],0.35),0.95); g.beginPath();
      g.moveTo(bx-2,y); g.lineTo(bx+Math.cos(a)*L,y+Math.sin(a)*L); g.lineTo(bx+2,y); g.closePath(); g.fill(); } }
}

/* ---------- 道路：路面纹理 + 主题细节（土路车辙/金属接缝/玄武岩熔岩缝） + 立交桥 ---------- */
function roadPath(g,routes){ g.beginPath(); for(const p of routes){ g.moveTo(p[0][0],p[0][1]); for(let i=1;i<p.length;i++) g.lineTo(p[i][0],p[i][1]); } }
function road(g,W,H,res,routes,T,N,R){
  const S=T.road;
  g.save(); g.lineJoin='round'; g.lineCap='round';
  g.shadowColor='rgba(0,0,0,.6)'; g.shadowBlur=10; g.strokeStyle=S.edge; g.lineWidth=60; roadPath(g,routes); g.stroke();
  g.restore();
  // 路面画在独立画布上，再用 source-atop 只给路面叠纹理
  const c=document.createElement('canvas'); c.width=W*res; c.height=H*res;
  const r=c.getContext('2d'); r.scale(res,res); r.lineJoin='round'; r.lineCap='round';
  r.strokeStyle=S.base; r.lineWidth=52; roadPath(r,routes); r.stroke();
  r.strokeStyle='rgba(255,255,255,.07)'; r.lineWidth=38; r.stroke();          // 中间略亮，路沿自然变暗
  r.globalCompositeOperation='source-atop';
  const tile=document.createElement('canvas'); tile.width=tile.height=128;
  const tg=tile.getContext('2d'), id=tg.createImageData(128,128), D=id.data;
  for(let y=0;y<128;y++) for(let x=0;x<128;x++){ const v=N.fbm(x/18,y/18,9.1,5), fine=N.n3(x*0.9,y*0.9,3.3), i=(y*128+x)*4;
    const k=(v-0.5)*1.6+(fine-0.5)*0.5; D[i]=D[i+1]=D[i+2]=k>0?255:0; D[i+3]=Math.min(255,Math.abs(k)*105); }
  tg.putImageData(id,0,0);
  for(let i=0;i<70;i++){ const x=R()*128, y=R()*128, s=0.6+R()*1.8;
    tg.fillStyle='rgba(0,0,0,.35)'; tg.beginPath(); tg.ellipse(x+0.6,y+0.6,s,s*0.8,0,0,7); tg.fill();
    tg.fillStyle='rgba(255,255,255,.18)'; tg.beginPath(); tg.ellipse(x,y,s,s*0.8,0,0,7); tg.fill(); }
  r.fillStyle=r.createPattern(tile,'repeat'); r.fillRect(0,0,W,H);
  r.globalAlpha=0.35; r.strokeStyle=S.wear; r.lineWidth=20; roadPath(r,routes); r.stroke(); r.globalAlpha=1;
  // 主题细节
  for(const p of routes){
    if(S.style==='dirt'){                                       // 两道车辙 + 路沿小石子
      for(const o of [-11,11]) walk(p,5,(x,y,dx,dy)=>{ r.fillStyle='rgba(30,22,12,.22)'; r.fillRect(x-dy*o-1.2,y+dx*o-1.2,2.4,2.4); });
      walk(p,7,(x,y,dx,dy)=>{ for(const sd of [-1,1]){ if(R()<0.5) continue; const o=sd*(22+R()*3);
        r.fillStyle=R()<0.5?'rgba(255,240,210,.22)':'rgba(0,0,0,.25)'; r.beginPath(); r.arc(x-dy*o,y+dx*o,0.8+R()*1.3,0,7); r.fill(); } });
    } else if(S.style==='metal'){                               // 横向接缝 + 两侧导轨 + 铆钉
      walk(p,24,(x,y,dx,dy)=>{ r.strokeStyle='rgba(0,0,0,.35)'; r.lineWidth=1.2; r.beginPath(); r.moveTo(x-dy*24,y+dx*24); r.lineTo(x+dy*24,y-dx*24); r.stroke();
        r.strokeStyle='rgba(255,255,255,.08)'; r.beginPath(); r.moveTo(x-dy*24+dx*1.3,y+dx*24+dy*1.3); r.lineTo(x+dy*24+dx*1.3,y-dx*24+dy*1.3); r.stroke();
        for(const o of [-19,19]){ r.fillStyle='rgba(200,215,235,.35)'; r.beginPath(); r.arc(x-dy*o+dx*6,y+dx*o+dy*6,0.9,0,7); r.fill(); } });
      for(const o of [-22,22]) walk(p,3,(x,y,dx,dy)=>{ r.fillStyle='rgba(150,170,200,.18)'; r.fillRect(x-dy*o-0.8,y+dx*o-0.8,1.6,1.6); });
    } else {                                                    // 玄武岩：横穿路面的发光熔岩缝
      walk(p,38,(x,y,dx,dy)=>{ if(R()<0.35) return; const o0=(R()-0.5)*30;
        r.save(); r.globalCompositeOperation='lighter'; r.strokeStyle='rgba(255,110,30,.55)'; r.lineWidth=1.3; r.shadowColor='rgba(255,90,20,.9)'; r.shadowBlur=6;
        r.beginPath(); let px=x-dy*(-24), py=y+dx*(-24); r.moveTo(px,py);
        for(let k=1;k<=5;k++){ const o=-24+k*9.6, j=(R()-0.5)*7; r.lineTo(x-dy*o+dx*(j+o0*0.15),y+dx*o+dy*(j+o0*0.15)); }
        r.stroke(); r.restore(); });
    }
  }
  g.drawImage(c,0,0,W,H);
  // 立交桥：两段路交叉的地方，后画的那段架成桥（桥面 + 护栏 + 桥下阴影）
  for(const b of crossings(routes)){
    g.save(); g.translate(b.x,b.y); g.rotate(b.ang);
    g.fillStyle='rgba(0,0,0,.45)'; g.filter='blur(4px)'; g.fillRect(-62,-26+9,124,60); g.filter='none';
    const dk=g.createLinearGradient(0,-30,0,30); dk.addColorStop(0,'#5a6070'); dk.addColorStop(0.5,'#3c414d'); dk.addColorStop(1,'#2a2e37');
    g.fillStyle=dk; g.fillRect(-60,-29,120,58);
    g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=1; for(let x=-56;x<=56;x+=8){ g.beginPath(); g.moveTo(x,-27); g.lineTo(x,27); g.stroke(); }
    for(const sd of [-1,1]){ g.fillStyle='#1c1f26'; g.fillRect(-60,sd*29-(sd>0?4:0),120,4);
      g.fillStyle='#8e98a8'; g.fillRect(-60,sd*31-1,120,2);
      for(let x=-56;x<=56;x+=14){ g.fillStyle='#cfd6df'; g.fillRect(x-1,sd*31-2,2,4); } }
    g.fillStyle='#22262e'; g.fillRect(-64,-31,6,62); g.fillRect(58,-31,6,62);
    g.restore(); }
}
// 找出道路交叉点：不同路线（且该处没有并道）或同一路线相隔很远的两段
function crossings(routes){
  const out=[], segs=[];
  routes.forEach((p,ri)=>{ let d=0; for(let i=1;i<p.length;i++){ const L=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]); segs.push({ri,a:p[i-1],b:p[i],d}); d+=L; } });
  const near=(p,x,y)=>{ let m=1e9; for(let i=1;i<p.length;i++){ const ax=p[i-1][0],ay=p[i-1][1],bx=p[i][0]-ax,by=p[i][1]-ay,L=bx*bx+by*by||1;
    const t=clamp(((x-ax)*bx+(y-ay)*by)/L,0,1); m=Math.min(m,Math.hypot(x-ax-bx*t,y-ay-by*t)); } return m; };
  // 路口判定：沿 B 往前或往后走 50~320 像素，如果又回到 A 上（相距 < 12），说明两条路在这里汇合或分岔，而不是交叉
  const at=(p,d)=>{ for(let i=1;i<p.length;i++){ const L=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]); if(d<=L){ const t=L?d/L:0; return [p[i-1][0]+(p[i][0]-p[i-1][0])*t,p[i-1][1]+(p[i][1]-p[i-1][1])*t]; } d-=L; } return p[p.length-1]; };
  const junction=(ra,rb,dB)=>{ const P=routes[rb], L=plen(P);
    return [-320,-200,-90,-50,50,90,200,320].some(k=>{ const d=dB+k; if(d<0||d>L) return false; const q=at(P,d); return near(routes[ra],q[0],q[1])<12; }); };
  for(let i=0;i<segs.length;i++) for(let j=i+1;j<segs.length;j++){
    const A=segs[i], B=segs[j];
    if(A.ri===B.ri && Math.abs(A.d-B.d)<150) continue;
    const r=[A.b[0]-A.a[0],A.b[1]-A.a[1]], s2=[B.b[0]-B.a[0],B.b[1]-B.a[1]], den=r[0]*s2[1]-r[1]*s2[0];
    if(Math.abs(den)<1e-6) continue;
    const qp=[B.a[0]-A.a[0],B.a[1]-A.a[1]], t=(qp[0]*s2[1]-qp[1]*s2[0])/den, u=(qp[0]*r[1]-qp[1]*r[0])/den;
    if(t<0||t>1||u<0||u>1) continue;
    const x=A.a[0]+r[0]*t, y=A.a[1]+r[1]*t;
    const cos=Math.abs((r[0]*s2[0]+r[1]*s2[1])/(Math.hypot(...r)*Math.hypot(...s2)));
    if(cos>0.8) continue;                                       // 夹角太小：是并道/分岔，不是交叉
    if(A.ri!==B.ri && junction(A.ri,B.ri,B.d+u*Math.hypot(...s2))) continue;   // 两条路线在这里汇合/分岔：是路口，不是立交
    if(routes.some(p=>[p[0],p[p.length-1]].some(q=>Math.hypot(q[0]-x,q[1]-y)<50))) continue;   // 入口、终点处不架桥
    if(out.some(o=>Math.hypot(o.x-x,o.y-y)<40)) continue;
    out.push({x,y,ang:Math.atan2(s2[1],s2[0])}); }
  return out;
}

/* ---------- 主入口 ---------- */
function render(o){
  const { W, H, res, routes } = o, theme=THEMES[o.theme]?o.theme:'space', T=THEMES[theme], holes=o.holes||[], pads=o.pads||[];
  const R=mulberry(o.seed|0), N=makeNoise((o.seed|0)+7), variant=o.variant!=null ? o.variant%2 : (R()<0.5?0:1), twinkles=[];
  const cv=document.createElement('canvas'); cv.width=W*res; cv.height=H*res;
  const g=cv.getContext('2d'); g.scale(res,res);
  let gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,T.base[0]); gr.addColorStop(0.5,T.base[1]); gr.addColorStop(1,T.base[2]);
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  const ang=(R()*0.6+0.25)*(R()<0.5?1:-1), band={ x:W*(0.3+R()*0.4), y:H*(0.3+R()*0.4), nx:Math.cos(ang), ny:Math.sin(ang), sig:70+R()*40 };
  skyLayer(g,W,H,T,N,R,band);
  starfield(g,W,H,R,band,twinkles,routes);

  const L=(()=>{ const v=[-0.62,-0.45,0.64], m=Math.hypot(...v); return v.map(a=>a/m); })();
  if(theme==='earth'){
    if(variant===0){                              // 宜居行星 + 月球 + 太阳
      const [px,py]=pickSpot([[W-70,H+130],[70,H+130],[W-70,-130],[70,-130]],routes);
      const lx=px<W/2?1:-1, ly=py<H/2?1:-1, LL=[lx*0.55,ly*0.45,0.7];
      sun(g,W,H,px<W/2?W-90:90,py<H/2?H-80:80,7,[255,240,215],true);
      sphere(g,W,H,px,py,300,{ ...habitableTex(N), light:LL, atmo:[110,170,255], tilt:0.35, spin:R()*6 });
      const [mx,my]=pickSpot([[W*0.18,H*0.2],[W*0.82,H*0.2],[W*0.5,H*0.12],[W*0.82,H*0.8]],routes);
      sphere(g,W,H,mx,my,26,{ ...moonTex(N,R), light:LL });
    } else {                                      // 沙漠行星 + 双太阳
      const [px,py]=pickSpot([[90,H+70],[W-90,H+70],[90,-70],[W-90,-70]],routes);
      const [sx,sy]=pickSpot([[W-150,H*0.5],[150,H*0.5],[W*0.5,H*0.5],[W*0.5,90],[W*0.5,H-90]].filter(c=>Math.hypot(c[0]-px,c[1]-py)>320),routes);
      sun(g,W,H,sx,sy,9,[255,225,170],true); sun(g,W,H,sx+44,sy+16,6,[255,190,140],false);
      const v=[sx-px,sy-py,260], m=Math.hypot(...v);
      sphere(g,W,H,px,py,215,{ ...desertTex(N), light:v.map(a=>a/m), atmo:[255,205,150], tilt:-0.2 });
    }
  } else if(theme==='space'){
    if(variant===0){                              // 带环气态巨行星 + 旋涡星系 + 小行星
      const [px,py]=pickSpot([[W*0.82,H*0.24],[W*0.18,H*0.24],[W*0.82,H*0.76],[W*0.18,H*0.76],[W*0.5,H*0.16]],routes);
      const pr=78+R()*24, tilt=-0.35+R()*0.2;
      rings(g,px,py,pr,tilt,'back',L);
      sphere(g,W,H,px,py,pr,{ ...gasTex(N), light:L, tilt, atmo:[230,210,170] });
      rings(g,px,py,pr,tilt,'front',L);
      const [gx,gy]=pickSpot([[W*0.15,H*0.5],[W*0.85,H*0.5],[W*0.5,H*0.85],[W*0.3,H*0.12]],routes);
      galaxy(g,gx,gy,46,R,R()*3);
      asteroids(g,W,H,R,N,routes,40,L,[[150,140,130],[40,36,34]]);
    } else {                                      // 冰封星球 + 小卫星 + 远处恒星
      const [px,py]=pickSpot([[W+30,H*0.5],[-30,H*0.5],[W*0.5,H+60],[W*0.5,-60]],routes);
      sun(g,W,H,px<W/2?W*0.85:W*0.15,H*0.18,5,[200,220,255],true);
      sphere(g,W,H,px,py,200,{ ...iceTex(N), light:L, atmo:[180,220,255], tilt:0.15 });
      const [mx,my]=pickSpot([[W*0.3,H*0.2],[W*0.7,H*0.2],[W*0.3,H*0.82],[W*0.7,H*0.82]],routes);
      sphere(g,W,H,mx,my,18,{ ...moonTex(N,R), light:L });
      asteroids(g,W,H,R,N,routes,24,L,[[170,180,195],[45,50,60]]);
    }
  } else {
    if(variant===0 && !holes.length){            // 黑洞 + 吸积盘（关卡自带黑洞时不再另画）
      const [bx,by]=pickSpot([[W*0.8,H*0.26],[W*0.2,H*0.26],[W*0.8,H*0.74],[W*0.2,H*0.74],[W*0.5,H*0.2]],routes);
      blackHole(g,bx,by,40+R()*8);
      asteroids(g,W,H,R,N,routes,20,L,[[120,70,50],[30,14,10]]);
    } else {                                      // 熔岩星球 + 红巨星
      const [px,py]=pickSpot([[90,H+80],[W-90,H+80],[90,-80],[W-90,-80]],routes);
      const [sx,sy]=pickSpot([[W-150,H*0.5],[150,H*0.5],[W*0.5,H*0.5],[W*0.5,90],[W*0.5,H-90]].filter(c=>Math.hypot(c[0]-px,c[1]-py)>320),routes);
      sun(g,W,H,sx,sy,22,[255,110,50],false);
      const v=[sx-px,sy-py,300], m=Math.hypot(...v);
      sphere(g,W,H,px,py,230,{ ...lavaTex(N), light:v.map(a=>a/m), atmo:[255,90,40], tilt:0.4 });
    }
  }
  for(const h of holes) blackHole(g,h.x,h.y,22);            // 玩法黑洞：画在真实位置
  terrain(g,W,H,res,routes,pads,holes,T,N,R);
  road(g,W,H,res,routes,T,N,R);
  gr=g.createRadialGradient(W/2,H/2,H*0.45,W/2,H/2,W*0.72);
  gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,.55)');
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  return { canvas:cv, twinkles, theme, variant };
}

// 每帧叠加：远处亮星的闪烁
function drawTwinkles(g,list,t){
  g.save(); g.globalCompositeOperation='lighter';
  for(const s of list){ const a=0.25+0.25*Math.sin(t*s.sp+s.ph);
    const gr=g.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*2.5);
    gr.addColorStop(0,rgba(s.c,a)); gr.addColorStop(1,rgba(s.c,0));
    g.fillStyle=gr; g.fillRect(s.x-s.r*2.5,s.y-s.r*2.5,s.r*5,s.r*5); }
  g.restore();
}

window.Backdrop={ render, drawTwinkles };
})();
