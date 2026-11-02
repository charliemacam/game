/* 战斗特效：粒子、闪光、冲击波、闪电、焦痕、飘字、震屏
 * 坐标都是游戏坐标（960×620）。Fx.update(dt) 跟随游戏时间（暂停时特效也定住），
 * Fx.drawUnder(g) 画在塔和敌人下面（地面焦痕），Fx.draw(g) 画在最上层。
 * 发光粒子用预渲染的光点贴图 + 叠加混合，粒子总数有上限，iPad 上也流畅。
 */
(function(){
const MAX=650;
let P=[], decals=[], shake=0, ox=0, oy=0, flashA=0, flashC='255,60,60';
const rnd=(a,b)=>a+Math.random()*(b-a);
const cache={};
// 预渲染光点：中心白、外圈为 col（'r,g,b'）
function glow(col){
  let c=cache[col]; if(c) return c;
  c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.2,`rgba(${col},1)`);
  gr.addColorStop(0.5,`rgba(${col},.35)`); gr.addColorStop(1,`rgba(${col},0)`);
  g.fillStyle=gr; g.fillRect(0,0,64,64); cache[col]=c; return c;
}
function rgbOf(hex){ const n=parseInt(hex.slice(1),16); return `${n>>16},${n>>8&255},${n&255}`; }
// p: {x,y,vx,vy,life,size,grow,col,kind,drag,grav,delay,rot,vr,a}
function add(p){
  if(P.length>=MAX) P.splice(0,P.length-MAX+1);
  p.max=p.life; p.vx=p.vx||0; p.vy=p.vy||0; p.drag=p.drag==null?2:p.drag; p.grav=p.grav||0;
  p.grow=p.grow||0; p.delay=p.delay||0; p.a=p.a==null?1:p.a; P.push(p); return p;
}
function burst(x,y,n,o){
  for(let i=0;i<n;i++){ const a=rnd(0,6.283), s=rnd(o.s0,o.s1);
    add({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s+(o.up||0),life:rnd(o.l0,o.l1),size:rnd(o.z0,o.z1),
      col:o.col,kind:o.kind,drag:o.drag,grav:o.grav,grow:o.grow,delay:o.delay,rot:rnd(0,6.28),vr:rnd(-8,8)}); }
}

/* ---------- 发射：炮口闪光 ---------- */
function muzzle(x,y,ang,key,tier){
  const L= key==='arrow' ? (tier>=3?23:18) : key==='cannon' ? 19 : 0, mx=x+Math.cos(ang)*L, my=y+Math.sin(ang)*L, dx=Math.cos(ang), dy=Math.sin(ang);
  if(key==='arrow'){
    if(tier>=3){ add({x:mx,y:my,life:.08,size:16,col:'255,230,170',kind:'glow'});
      for(let i=0;i<3;i++) add({x:mx,y:my,vx:dx*rnd(20,50)+rnd(-10,10),vy:dy*rnd(20,50)+rnd(-10,10),life:rnd(.4,.7),size:rnd(3,5),grow:10,col:'150,155,165',kind:'smoke',a:.35}); }
    else add({x:mx,y:my,life:.06,size:7,col:'220,255,220',kind:'glow'});
  } else if(key==='mage'){
    const col=tier>=3?'150,230,255':'170,150,255';
    add({x,y:y-8,life:.18,size:22,col,kind:'glow'});
    burst(x,y-8,5,{s0:30,s1:70,l0:.2,l1:.4,z0:2,z1:4,col,kind:'glow'});
  } else if(key==='cannon'){
    const fire=tier>=3;
    add({x:mx,y:my,life:.09,size:fire?20:16,col:fire?'255,150,50':'255,210,140',kind:'glow'});
    for(let i=0;i<4;i++) add({x:mx,y:my,vx:dx*rnd(25,70)+rnd(-15,15),vy:dy*rnd(25,70)+rnd(-15,15),life:rnd(.5,.9),size:rnd(4,6),grow:14,col:'120,120,125',kind:'smoke',a:.45});
    if(fire) burst(mx,my,5,{s0:40,s1:90,l0:.15,l1:.35,z0:3,z1:5,col:'255,130,40',kind:'glow'});
  }
}
/* ---------- 飞行中的拖尾 ---------- */
function trail(s,dt){
  const k=s.key, t=s.tier;
  if(k==='mage'){ if(Math.random()<dt*40) add({x:s.x+rnd(-2,2),y:s.y+rnd(-2,2),life:rnd(.2,.35),size:rnd(3,5),col:t>=3?'150,230,255':'170,150,255',kind:'glow',drag:4}); }
  else if(k==='cannon'){
    if(t>=3){ if(Math.random()<dt*45) add({x:s.x,y:s.y-s.z,life:rnd(.2,.4),size:rnd(4,7),col:'255,130,40',kind:'glow',vy:-10}); }
    if(Math.random()<dt*22) add({x:s.x,y:s.y-s.z,life:rnd(.4,.7),size:3,grow:8,col:'140,140,145',kind:'smoke',a:.3}); }
}
/* ---------- 命中 ---------- */
function explosion(x,y,r,fire){
  add({x,y,life:.14,size:r*1.3,col:fire?'255,150,60':'255,220,160',kind:'glow'});
  add({x,y,life:.32,size:r*0.3,grow:r*2.6,col:fire?'255,140,60':'255,200,140',kind:'ring',a:.8});
  burst(x,y,10,{s0:80,s1:200,l0:.15,l1:.35,z0:1,z1:2,col:'255,210,140',kind:'spark',drag:3});
  burst(x,y,7,{s0:10,s1:40,l0:.6,l1:1.1,z0:5,z1:9,col:'90,85,85',kind:'smoke',grow:16,drag:2});
  burst(x,y,5,{s0:40,s1:110,l0:.4,l1:.7,z0:1.5,z1:2.5,col:'70,60,55',kind:'debris',grav:220,drag:1});
  if(fire){ burst(x,y,9,{s0:15,s1:60,l0:.4,l1:.8,z0:4,z1:8,col:'255,120,30',kind:'glow',up:-25,drag:2});
    burst(x,y,6,{s0:20,s1:50,l0:.8,l1:1.4,z0:1.5,z1:2.5,col:'255,180,80',kind:'glow',up:-40,drag:1}); }   // 余烬
  decals.push({x,y,r:r*0.55,life:3.5,max:3.5,fire});
  if(decals.length>40) decals.shift();
}
function hit(kind,x,y){
  if(kind==='arrow') burst(x,y,3,{s0:40,s1:90,l0:.08,l1:.16,z0:1,z1:1.5,col:'235,240,220',kind:'spark',drag:4});
  else if(kind==='sniper'){ add({x,y,life:.1,size:14,col:'255,240,200',kind:'glow'});
    burst(x,y,6,{s0:80,s1:180,l0:.1,l1:.22,z0:1,z1:1.6,col:'255,230,170',kind:'spark',drag:3}); }
  else if(kind==='magic'){ add({x,y,life:.16,size:16,col:'170,150,255',kind:'glow'});
    add({x,y,life:.25,size:3,grow:60,col:'190,170,255',kind:'ring',a:.7});
    burst(x,y,6,{s0:30,s1:80,l0:.2,l1:.4,z0:2,z1:3.5,col:'200,180,255',kind:'glow',drag:3}); }
  else if(kind==='frost'){ add({x,y,life:.2,size:18,col:'150,230,255',kind:'glow'});
    add({x,y,life:.3,size:3,grow:70,col:'190,240,255',kind:'ring',a:.8});
    burst(x,y,7,{s0:40,s1:110,l0:.3,l1:.55,z0:2.5,z1:4,col:'210,245,255',kind:'shard',drag:3}); }
}
function clink(x,y){ burst(x,y,4,{s0:70,s1:150,l0:.1,l1:.2,z0:1,z1:1.4,col:'255,240,180',kind:'spark',drag:4}); }
// 锯齿闪电（连锁 / 贯穿）
function zap(x1,y1,x2,y2,col){
  const pts=[[x1,y1]], n=6, nx=-(y2-y1), ny=x2-x1, L=Math.hypot(nx,ny)||1;
  for(let i=1;i<n;i++){ const k=i/n, j=rnd(-1,1)*Math.min(14,L*0.15); pts.push([x1+(x2-x1)*k+nx/L*j, y1+(y2-y1)*k+ny/L*j]); }
  pts.push([x2,y2]); add({x:x1,y:y1,life:.16,size:2,col,kind:'bolt',pts,drag:0});
  add({x:x2,y:y2,life:.12,size:12,col,kind:'glow'});
}
/* ---------- 敌人状态 / 死亡 ---------- */
function burn(x,y){ add({x:x+rnd(-5,5),y:y+rnd(-3,3),vy:rnd(-35,-20),life:rnd(.3,.55),size:rnd(3,6),col:'255,120,30',kind:'glow',drag:1}); }
function chill(x,y){ add({x:x+rnd(-8,8),y:y+rnd(-6,6),vy:rnd(-8,-3),life:rnd(.4,.7),size:rnd(2,3.5),col:'170,230,255',kind:'glow',drag:1,a:.7}); }
function death(x,y,hex,r,boss){
  const col=hex?rgbOf(hex):'200,200,200';
  if(boss){
    for(let i=0;i<6;i++){ const d=i*0.18, ex=x+rnd(-r,r), ey=y+rnd(-r,r);
      add({x:ex,y:ey,life:.2,size:r*1.4,col:'255,200,120',kind:'glow',delay:d});
      add({x:ex,y:ey,life:.4,size:r*.3,grow:r*3,col:'255,180,100',kind:'ring',a:.8,delay:d});
      burst(ex,ey,10,{s0:80,s1:220,l0:.2,l1:.45,z0:1,z1:2,col:'255,220,150',kind:'spark',drag:3,delay:d}); }
    burst(x,y,24,{s0:40,s1:160,l0:.6,l1:1.2,z0:3,z1:5,col,kind:'goo',grav:160,drag:1.5});
    burst(x,y,12,{s0:10,s1:50,l0:1,l1:1.8,z0:8,z1:14,col:'80,75,80',kind:'smoke',grow:22,drag:1.5});
    decals.push({x,y,r:r*1.2,life:6,max:6,fire:true}); shakeBy(9); return;
  }
  add({x,y,life:.14,size:r*1.8,col,kind:'glow'});
  add({x,y,life:.28,size:r*.4,grow:r*3.2,col,kind:'ring',a:.6});
  burst(x,y,8+Math.round(r/3),{s0:40,s1:120,l0:.35,l1:.6,z0:1.5,z1:3,col,kind:'goo',grav:180,drag:1.5,up:-30});
  burst(x,y,3,{s0:5,s1:25,l0:.5,l1:.8,z0:4,z1:6,col:'110,105,110',kind:'smoke',grow:12,drag:2});
}
/* ---------- 建造 / 升级 / 出售 ---------- */
function build(x,y){
  add({x,y,life:.35,size:6,grow:70,col:'200,190,170',kind:'ring',a:.7});
  burst(x,y+6,10,{s0:20,s1:60,l0:.5,l1:.9,z0:4,z1:7,col:'150,140,125',kind:'smoke',grow:12,drag:3});
}
function upgrade(x,y){
  add({x,y,life:.4,size:8,grow:80,col:'245,196,81',kind:'ring',a:.9});
  for(let i=0;i<14;i++) add({x:x+rnd(-14,14),y:y+rnd(-6,10),vy:rnd(-70,-35),life:rnd(.5,.9),size:rnd(2,3.5),col:'255,215,110',kind:'glow',drag:1.5,delay:rnd(0,.15)});
}
function sell(x,y){ burst(x,y,10,{s0:40,s1:90,l0:.5,l1:.8,z0:2.5,z1:3.5,col:'255,210,90',kind:'glow',grav:200,up:-90,drag:1}); }
/* ---------- 飘字 / 震屏 / 全屏闪 ---------- */
function text(x,y,str,col){ add({x,y,vy:-38,life:.8,size:13,col:col||'255,230,120',kind:'text',str,drag:2}); }
function shakeBy(a){ shake=Math.max(shake,a); }
function screenFlash(col,a){ flashC=col; flashA=Math.max(flashA,a); }

function update(dt){
  for(const p of P){
    if(p.delay>0){ p.delay-=dt; continue; }
    p.life-=dt; const f=Math.exp(-p.drag*dt);
    p.vx*=f; p.vy=p.vy*f+p.grav*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.size+=p.grow*dt;
    if(p.vr) p.rot+=p.vr*dt;
  }
  P=P.filter(p=>p.life>0);
  for(const d of decals) d.life-=dt; decals=decals.filter(d=>d.life>0);
  shake*=Math.exp(-dt*9); if(shake<0.2) shake=0;
  ox=shake?rnd(-shake,shake):0; oy=shake?rnd(-shake,shake):0;
  flashA=Math.max(0,flashA-dt*1.6);
}
function drawUnder(g){
  for(const d of decals){ const a=Math.min(1,d.life/d.max*1.5)*0.55;
    const gr=g.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r);
    gr.addColorStop(0,`rgba(20,14,10,${a})`); gr.addColorStop(0.6,`rgba(30,20,14,${a*0.6})`); gr.addColorStop(1,'rgba(30,20,14,0)');
    g.fillStyle=gr; g.beginPath(); g.ellipse(d.x,d.y,d.r,d.r*0.8,0,0,7); g.fill();
    if(d.fire && d.life>d.max-1.2){ const e=(d.life-(d.max-1.2))/1.2;      // 刚炸完时地面发红
      g.fillStyle=`rgba(255,110,30,${0.25*e})`; g.beginPath(); g.ellipse(d.x,d.y,d.r*0.6,d.r*0.48,0,0,7); g.fill(); } }
}
function draw(g,W,H){
  g.save();
  // 普通混合：烟、碎块、血浆、冰晶、文字
  for(const p of P){ if(p.delay>0) continue; const k=p.life/p.max;
    if(p.kind==='smoke'){ g.globalAlpha=p.a*k; g.fillStyle=`rgb(${p.col})`; g.beginPath(); g.arc(p.x,p.y,p.size,0,7); g.fill(); }
    else if(p.kind==='debris'){ g.globalAlpha=Math.min(1,k*2); g.fillStyle=`rgb(${p.col})`; g.save(); g.translate(p.x,p.y); g.rotate(p.rot); g.fillRect(-p.size,-p.size,p.size*2,p.size*2); g.restore(); }
    else if(p.kind==='goo'){ g.globalAlpha=Math.min(1,k*1.6); g.fillStyle=`rgb(${p.col})`; g.beginPath(); g.arc(p.x,p.y,p.size*(0.5+k*0.5),0,7); g.fill(); }
    else if(p.kind==='shard'){ g.globalAlpha=Math.min(1,k*1.5); g.fillStyle=`rgb(${p.col})`; g.save(); g.translate(p.x,p.y); g.rotate(p.rot);
      g.beginPath(); g.moveTo(0,-p.size); g.lineTo(p.size*0.45,0); g.lineTo(0,p.size); g.lineTo(-p.size*0.45,0); g.closePath(); g.fill(); g.restore(); }
    else if(p.kind==='text'){ g.globalAlpha=Math.min(1,k*2); g.font=`bold ${p.size}px sans-serif`; g.textAlign='center'; g.textBaseline='middle';
      g.lineWidth=3; g.strokeStyle='rgba(0,0,0,.8)'; g.strokeText(p.str,p.x,p.y); g.fillStyle=`rgb(${p.col})`; g.fillText(p.str,p.x,p.y); } }
  // 叠加混合：光点、火花、冲击波、闪电
  g.globalCompositeOperation='lighter';
  for(const p of P){ if(p.delay>0) continue; const k=p.life/p.max;
    if(p.kind==='glow'){ g.globalAlpha=p.a*Math.min(1,k*1.4); const s=p.size*2; g.drawImage(glow(p.col),p.x-s/2,p.y-s/2,s,s); }
    else if(p.kind==='spark'){ g.globalAlpha=k; g.strokeStyle=`rgb(${p.col})`; g.lineWidth=p.size; g.lineCap='round';
      g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x-p.vx*0.04,p.y-p.vy*0.04); g.stroke(); }
    else if(p.kind==='ring'){ g.globalAlpha=p.a*k; g.strokeStyle=`rgb(${p.col})`; g.lineWidth=2.5*k+0.5;
      g.beginPath(); g.ellipse(p.x,p.y,p.size,p.size*0.82,0,0,7); g.stroke(); }
    else if(p.kind==='bolt'){ g.globalAlpha=k; g.lineCap='round'; g.lineJoin='round';
      for(const [w,c] of [[5,`rgba(${p.col},.35)`],[1.6,'rgb(255,255,255)']]){ g.strokeStyle=c; g.lineWidth=w;
        g.beginPath(); p.pts.forEach((q,i)=>g[i?'lineTo':'moveTo'](q[0],q[1])); g.stroke(); } } }
  g.restore();
  if(flashA>0){ g.save(); const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.7);
    v.addColorStop(0,`rgba(${flashC},0)`); v.addColorStop(1,`rgba(${flashC},${flashA})`);
    g.fillStyle=v; g.fillRect(-20,-20,W+40,H+40); g.restore(); }
}
function reset(){ P=[]; decals=[]; shake=0; ox=oy=0; flashA=0; }

window.Fx={ glow, rgbOf, muzzle, trail, explosion, hit, clink, zap, burn, chill, death, build, upgrade, sell,
  text, shake:shakeBy, screenFlash, update, drawUnder, draw, reset, offset:()=>[ox,oy], count:()=>P.length };
})();
