/* 关卡背景：程序生成的行星地表（每关开局渲染一次并缓存）
 * Backdrop.render({theme, surface, seed, routes, pads, holes, W, H, res}) → { canvas, twinkles }
 *   surface: 'moon' | 'mars' | 'ice' | 'asteroid' | 'io' | 'titan' | 'volcanic'（不传则按 theme 选）
 *   pads / holes：塔位要压平成小场地；黑洞处地面裂开露出星空
 * 画面：高度图（起伏、沙丘、陨坑、巨石）+ 低角度阳光的明暗和投影 + 压实的车辙路 + 立交桥 + 暗角
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

// 与路线的最短距离
function routeDist(x,y,routes){ let m=1e9;
  for(const p of routes) for(let i=1;i<p.length;i++){
    const ax=p[i-1][0], ay=p[i-1][1], bx=p[i][0]-ax, by=p[i][1]-ay, L=bx*bx+by*by||1;
    const t=clamp(((x-ax)*bx+(y-ay)*by)/L,0,1), dx=x-ax-bx*t, dy=y-ay-by*t;
    m=Math.min(m,Math.hypot(dx,dy)); }
  return m; }

// 黑洞裂谷里的星空配色
const THEMES={
  earth:{ base:['#02060b','#061420','#020509'], neb:[[30,120,140],[70,60,150],[20,70,90]], dust:0.55 },
  space:{ base:['#04030c','#0b0922','#03020a'], neb:[[110,55,190],[210,70,140],[40,80,190]], dust:0.65 },
  hell: { base:['#0a0203','#1a0508','#050102'], neb:[[190,50,20],[110,10,35],[240,120,40]], dust:0.75 },
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

/* ---------- 黑洞（吸积盘 + 多普勒增亮） ---------- */
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

/* ---------- 道路几何 ---------- */
function plen(p){ let L=0; for(let i=1;i<p.length;i++) L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]); return L; }
// 沿折线每隔 step 取一个点（含切线方向）
function walk(p,step,fn){ let acc=0;
  for(let i=1;i<p.length;i++){ const ax=p[i-1][0], ay=p[i-1][1], dx=p[i][0]-ax, dy=p[i][1]-ay, L=Math.hypot(dx,dy); if(!L) continue;
    let t=(step-acc)/L; while(t<=1){ fn(ax+dx*t, ay+dy*t, dx/L, dy/L); t+=step/L; } acc=(acc+L)%step; } }
function roadPath(g,routes){ g.beginPath(); for(const p of routes){ g.moveTo(p[0][0],p[0][1]); for(let i=1;i<p.length;i++) g.lineTo(p[i][0],p[i][1]); } }

/* ---------- 行星地表：高度图 → 法线光照 + 投影 → 反照率 → 放大 + 细颗粒 ----------
 * 半分辨率逐像素计算（约 15 万像素），再放大并叠一层全分辨率的细颗粒和碎石。
 * 路是压实的车辙路：比周围略低、平整，两侧有被推起的土埂，中间两道车辙；边缘被噪声打乱，不是整齐的色带。
 * 塔位是压平的小场地。黑洞处地面裂开，露出下面的星空。
 */
// alb 基础两色；dark 暗斑（月海/玄武岩）；road 压实路面色；cr [陨坑数, 最大半径]；bo 巨石数；
// sun 太阳高度（越低影子越长）；amb 环境光；relief 起伏；dune 沙丘；lava 熔岩（自发光）；line 冰裂纹；spots 硫磺斑；haze 大气雾
const SURF={
  moon:    { alb:[[160,158,153],[116,114,110]], dark:[82,81,82],   darkK:0.55, road:[84,82,79],   cr:[115,48], bo:260, sun:0.4,  amb:0.2,  relief:16 },
  mars:    { alb:[[192,110,66],[150,80,48]],   dark:[100,56,40],  darkK:0.4,  road:[110,58,38],  cr:[26,42],  bo:760, sun:0.52, amb:0.3,  relief:20, dune:1.1, haze:[235,170,120,0.07] },
  ice:     { alb:[[226,233,240],[182,202,226]], dark:[150,172,200],darkK:0.35, road:[148,162,184], cr:[8,30],   bo:80,  sun:0.58, amb:0.42, relief:9,  line:[150,96,74] },
  asteroid:{ alb:[[112,106,99],[74,70,66]],    dark:[58,55,53],   darkK:0.4,  road:[154,147,137],cr:[280,36], bo:560, sun:0.42, amb:0.2,  relief:22 },
  io:      { alb:[[232,214,108],[216,156,70]], dark:[58,40,30],   darkK:0.2,  road:[150,110,64], cr:[12,30],  bo:120, sun:0.6,  amb:0.36, relief:10, spots:1, lava:0.35 },
  titan:   { alb:[[206,148,86],[164,108,62]],  dark:[118,76,46],  darkK:0.3,  road:[126,82,48],  cr:[10,30],  bo:150, sun:0.58, amb:0.38, relief:12, dune:1.9, haze:[240,170,100,0.12] },
  volcanic:{ alb:[[76,64,58],[44,38,36]],      dark:[30,26,25],   darkK:0.4,  road:[118,104,94], cr:[30,36],  bo:440, sun:0.52, amb:0.26, relief:18, lava:1 },
};
function ground(W,H,res,routes,pads,holes,S,N,R){
  const q=2, w=Math.ceil(W/q), h=Math.ceil(H/q), n=w*h;
  // 1. 到路中心的距离场：从宽到窄描线，红色通道 = 距离（像素，2 像素一档）
  const dc=document.createElement('canvas'); dc.width=w; dc.height=h; const dg=dc.getContext('2d');
  dg.fillStyle='#ff0000'; dg.fillRect(0,0,w,h); dg.scale(1/q,1/q); dg.lineCap='round'; dg.lineJoin='round';
  for(let d=110; d>=2; d-=2){ dg.strokeStyle=`rgb(${d},0,0)`; dg.lineWidth=d*2; roadPath(dg,routes); dg.stroke(); }
  const DR=dg.getImageData(0,0,w,h).data, D=new Float32Array(n), P=new Float32Array(n);
  for(let i=0;i<n;i++) D[i]=DR[i*4];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ let m=1e9; for(const p of pads){ const d=Math.hypot(x*q-p.x,y*q-p.y); if(d<m) m=d; } P[y*w+x]=m; }
  // 2. 高度图：大起伏 + 细起伏 + 沙丘 + 陨坑 + 巨石
  const Hm=new Float32Array(n), base=new Float32Array(n);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const X=x*q, Y=y*q, i=y*w+x;
    const lo=(N.fbm(X/260,Y/260,1.3,4)-0.5)*S.relief*2;
    let hh=lo+(N.fbm(X/48,Y/48,5.1,4)-0.5)*S.relief*0.35+(N.n3(X/9,Y/9,7.7)-0.5)*0.9;
    if(S.dune){ const wv=N.fbm(X/150,Y/150,3.3,3); hh+=Math.pow(Math.abs(Math.sin((X*0.85+Y*0.5)/(15+wv*10)+wv*9)),3)*S.dune*3; }
    base[i]=lo; Hm[i]=hh; }
  const stamp=(cx,cy,ext,fn)=>{ const x0=Math.max(0,Math.floor((cx-ext)/q)), x1=Math.min(w-1,Math.ceil((cx+ext)/q));
    const y0=Math.max(0,Math.floor((cy-ext)/q)), y1=Math.min(h-1,Math.ceil((cy+ext)/q));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) fn(y*w+x,x*q-cx,y*q-cy); };
  for(let k=0;k<S.cr[0];k++){ const r=3+Math.pow(R(),2.6)*S.cr[1], cx=R()*W, cy=R()*H, dep=r*0.24, rim=r*0.08;
    stamp(cx,cy,r*1.7,(i,dx,dy)=>{ const d=Math.hypot(dx,dy)/r; if(d>1.7) return;
      Hm[i]+=(d<1?dep*(d*d-1):0)+rim*Math.exp(-Math.pow((d-1)/0.22,2))+(d>1?rim*0.3*Math.exp(-(d-1)*3):0); }); }
  for(let k=0;k<S.bo;k++){ const r=2.5+Math.pow(R(),3)*8, bx=R()*W, by=R()*H, j=((by/q)|0)*w+((bx/q)|0);
    if(D[j]<34+r || P[j]<30+r) continue;
    stamp(bx,by,r,(i,dx,dy)=>{ const d=Math.hypot(dx,dy*1.2)/r; if(d<1) Hm[i]+=r*0.9*Math.sqrt(1-d*d); }); }
  // 3. 路和塔位：压平、两侧土埂、两道车辙；边缘用噪声打乱
  const road=new Float32Array(n), rut=new Float32Array(n), pad=new Float32Array(n);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x, X=x*q, Y=y*q;
    const e=D[i]+(N.fbm(X/22,Y/22,4.4,3)-0.5)*12;
    const m=1-sstep(18,30,e), berm=Math.exp(-Math.pow((e-29)/5,2))*1.3*(1-m), rt=m*Math.exp(-Math.pow((D[i]-9)/1.7,2))*0.6;
    Hm[i]=Hm[i]*(1-m)+(base[i]-0.8)*m+berm-rt; road[i]=m; rut[i]=rt;
    const pe=P[i]+(N.n3(X/8,Y/8,2.2)-0.5)*4, pm=1-sstep(16,23,pe);
    Hm[i]=Hm[i]*(1-pm)+(base[i]-0.3)*pm+Math.exp(-Math.pow((pe-24)/3,2))*0.7; pad[i]=pm; }
  // 4. 光照：法线 + 朝太阳方向步进求投影
  let lx=-0.62, ly=-0.5, lz=S.sun; const ll=Math.hypot(lx,ly,lz); lx/=ll; ly/=ll; lz/=ll;
  const hl=Math.hypot(lx,ly), sx=lx/hl, sy=ly/hl, tanE=lz/hl;
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const cg=cv.getContext('2d');
  const img=cg.createImageData(w,h), O=img.data;
  const glow=document.createElement('canvas'); glow.width=w; glow.height=h; const gg=glow.getContext('2d'), gimg=gg.createImageData(w,h), GO=gimg.data;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x, X=x*q, Y=y*q, o=i*4;
    const xl=x>0?i-1:i, xr=x<w-1?i+1:i, yu=y>0?i-w:i, yd=y<h-1?i+w:i;
    const gx=(Hm[xr]-Hm[xl])/(q*(xr-xl||1)), gy=(Hm[yd]-Hm[yu])/(q*((yd-yu)/w||1));
    const diff=Math.max(0,(-gx*lx-gy*ly+lz)/Math.hypot(gx,gy,1));
    let sh=1;
    for(let s=1;s<=16;s++){ const px=Math.round(x+sx*s), py=Math.round(y+sy*s); if(px<0||py<0||px>=w||py>=h) break;
      const over=Hm[py*w+px]-(Hm[i]+s*q*tanE); if(over>0){ sh=Math.min(sh,1-Math.min(1,over/1.2)*0.78); if(sh<0.25) break; } }
    const light=S.amb+(1-S.amb)*diff*1.25*sh;
    // 反照率
    const fine=N.n3(X/3.1,Y/3.1,9.9);
    let a=mix(S.alb[0],S.alb[1],sstep(0.3,0.72,N.fbm(X/120,Y/120,8.1,4)));
    a=mix(a,S.dark,sstep(0.5,0.66,N.fbm(X/320+9,Y/320,2.2,4))*S.darkK);
    if(S.line){ const r=1-Math.abs(N.fbm(X/170,Y/170,6.6,5)*2-1); a=mix(a,S.line,sstep(0.935,0.985,r)*0.8); }
    if(S.spots){ const s1=N.fbm(X/80,Y/80,3.9,4), s2=N.fbm(X/110+5,Y/110,1.7,4);
      a=mix(a,[44,30,24],sstep(0.66,0.74,s1)); a=mix(a,[184,72,40],sstep(0.62,0.72,s2)*0.7); a=mix(a,[240,236,212],sstep(0.4,0.3,s2)*0.5); }
    a=mix(a,mix(S.road,[255,255,255],(fine-0.5)*0.12),road[i]*0.9);
    a=mix(a,mix(S.road,[255,255,255],0.1),pad[i]*0.7);
    const k=(0.9+fine*0.2)*(1-rut[i]*0.4);
    let c=[a[0]*light*k,a[1]*light*k,a[2]*light*k];
    // 熔岩：低洼处的脊状裂缝（自发光，不受光照影响），四周是冷却后的黑壳
    if(S.lava){ const r=1-Math.abs(N.fbm(X/210,Y/210,3.3,5)*2-1), keep=(1-road[i])*(1-pad[i]);
      const crust=sstep(0.9,0.955,r)*keep, lv=sstep(0.968,0.99,r)*S.lava*keep;
      c=mix(c,[c[0]*0.45,c[1]*0.45,c[2]*0.45],crust*0.8);
      if(lv>0){ const hot=0.6+0.4*fine; c=mix(c,[255*hot,105*hot,25*hot],lv);
        GO[o]=255; GO[o+1]=90; GO[o+2]=20; GO[o+3]=lv*110; } }
    if(S.haze) c=mix(c,S.haze,S.haze[3]);
    // 黑洞裂谷：地面裂开，边缘发暗
    let al=1;
    for(const hh of holes){ const d=Math.hypot(X-hh.x,Y-hh.y)+(N.n3(X/12,Y/12,6.1)-0.5)*14;
      al=Math.min(al,sstep(64,72,d)); const rim=1-sstep(72,96,d); c=[c[0]*(1-rim*0.55),c[1]*(1-rim*0.55),c[2]*(1-rim*0.55)]; }
    O[o]=c[0]; O[o+1]=c[1]; O[o+2]=c[2]; O[o+3]=255*al; }
  cg.putImageData(img,0,0);
  // 5. 放大到全分辨率，叠细颗粒、碎石和熔岩辉光
  const out=document.createElement('canvas'); out.width=W*res; out.height=H*res; const og=out.getContext('2d');
  og.imageSmoothingEnabled=true; og.imageSmoothingQuality='high'; og.drawImage(cv,0,0,out.width,out.height); og.scale(res,res);
  const tile=document.createElement('canvas'); tile.width=tile.height=128; const tg=tile.getContext('2d');
  for(let i=0;i<2600;i++){ const s=0.5+R()*1.1; tg.fillStyle=R()<0.5?`rgba(0,0,0,${0.08+R()*0.14})`:`rgba(255,250,240,${0.05+R()*0.09})`; tg.fillRect(R()*128,R()*128,s,s); }
  og.save(); og.globalCompositeOperation='source-atop'; og.fillStyle=og.createPattern(tile,'repeat'); og.fillRect(0,0,W,H); og.restore();
  for(let i=0;i<1400;i++){ const x=R()*W, y=R()*H, xi=Math.min(w-1,(x/q)|0), yi=Math.min(h-1,(y/q)|0), j=yi*w+xi;
    if(O[j*4+3]<250 || D[j]<12 || P[j]<20) continue;
    const r=0.6+Math.pow(R(),2)*2.2, c=[O[j*4],O[j*4+1],O[j*4+2]];
    og.fillStyle='rgba(0,0,0,.35)'; og.beginPath(); og.ellipse(x+r*0.5,y+r*0.45,r*1.05,r*0.75,0,0,7); og.fill();
    og.fillStyle=rgba(mix(c,[255,255,255],0.18),1); og.beginPath(); og.ellipse(x,y,r,r*0.75,0,0,7); og.fill(); }
  if(S.lava){ gg.putImageData(gimg,0,0); og.save(); og.globalCompositeOperation='lighter'; og.filter='blur(3px)'; og.drawImage(glow,0,0,W,H); og.filter='none'; og.restore(); }
  return out;
}

// 立交桥：两段路真正交叉的地方，后经过的那段架成桥（桥面 + 护栏 + 桥下阴影）
function bridges(g,routes){
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
  const surf=SURF[o.surface]?o.surface:({earth:'moon',space:'asteroid',hell:'volcanic'}[theme]);
  const R=mulberry(o.seed|0), N=makeNoise((o.seed|0)+7);
  const cv=document.createElement('canvas'); cv.width=W*res; cv.height=H*res;
  const g=cv.getContext('2d'); g.scale(res,res);
  if(holes.length){                                   // 黑洞裂谷里能看到的星空和黑洞
    const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,T.base[0]); gr.addColorStop(0.5,T.base[1]); gr.addColorStop(1,T.base[2]);
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    const band={ x:holes[0].x, y:holes[0].y, nx:0.8, ny:0.6, sig:60 };
    skyLayer(g,W,H,T,N,R,band); starfield(g,W,H,R,band,[],[]);
    for(const h of holes) blackHole(g,h.x,h.y,17);
  }
  g.drawImage(ground(W,H,res,routes,pads,holes,SURF[surf],N,R),0,0,W,H);
  for(const h of holes){                              // 裂谷有深度：内壁阴影 + 受光的崖口
    g.save(); g.beginPath(); g.arc(h.x,h.y,74,0,7); g.clip();
    const sg=g.createRadialGradient(h.x+6,h.y+8,30,h.x+6,h.y+8,74);
    sg.addColorStop(0,'rgba(0,0,0,0)'); sg.addColorStop(0.7,'rgba(0,0,0,.25)'); sg.addColorStop(1,'rgba(0,0,0,.85)');
    g.fillStyle=sg; g.fillRect(h.x-80,h.y-80,160,160); g.restore();
    g.strokeStyle='rgba(255,235,210,.18)'; g.lineWidth=1.5; g.beginPath(); g.arc(h.x,h.y,69,Math.PI*0.95,Math.PI*1.75); g.stroke(); }
  bridges(g,routes);
  const vg=g.createRadialGradient(W/2,H/2,H*0.5,W/2,H/2,W*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.4)');
  g.fillStyle=vg; g.fillRect(0,0,W,H);
  return { canvas:cv, twinkles:[], theme, surface:surf };
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
