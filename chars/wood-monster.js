/* 木兽 Wood Monster（Charlie 原画：character-design/wood-monster/）坐标用原画像素写，统一换算。
 * 比例按原画量过：一个又宽又矮的大树桩，正面是巨大的切面（一圈圈年轮，左边一道橙色树皮边），四周裹着一圈绿叶；
 *   头顶两侧伸出两根绿枝，顶着两个年轮圆盘当眼睛；两条长长的绿树枝手臂，手是一簇绿叶；底下是两丛深棕色的树根。
 * Charlie 的回答：护甲 ∞，但火能烧它（伤害有限），魔法能打它；用树枝手臂打人；不会长树根挡士兵。
 * 质感：树皮纹理、年轮的木纹、叶子的叶脉。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#1e2410';
const T=([x,y])=>[f1((x-450)*0.42), f1((y-630)*0.42+150)];
const TP=pts=>pts.map(T);
function leaf(x,y,ang,len,seed){ const a=ang*Math.PI/180, dx=Math.cos(a), dy=Math.sin(a), nx=-dy, ny=dx, w=len*0.32;
  return `<path d="M${f1(x)},${f1(y)} Q${f1(x+dx*len*0.5+nx*w)},${f1(y+dy*len*0.5+ny*w)} ${f1(x+dx*len)},${f1(y+dy*len)} Q${f1(x+dx*len*0.5-nx*w)},${f1(y+dy*len*0.5-ny*w)} ${f1(x)},${f1(y)}Z" fill="${seed%3?'#5fb83a':'#4a9a2c'}" stroke="${OUT}" stroke-width="1"/>
    <path d="M${f1(x)},${f1(y)}L${f1(x+dx*len*0.85)},${f1(y+dy*len*0.85)}" stroke="#2f6b20" stroke-width=".8"/>`; }
function rings(cx,cy,rx,ry,n,seed){ const R=rng(seed); let d='';
  for(let i=1;i<=n;i++){ const k=i/n; d+=`<path d="${organic(ring(cx+(R()-0.5)*3*k,cy+(R()-0.5)*3*k,rx*k,ry*k,14),1.2*k,seed+i)}" fill="none" stroke="#7a4a30" stroke-width="${i===n?1.8:1.1}"/>`; }
  return d; }
function markup(P){
  const R=rng(1500);
  const stump=organic(TP([[230,250],[330,195],[450,185],[570,195],[655,240],[668,360],[650,480],[600,545],[450,560],[300,545],[240,480],[222,360]]),2,1501,{sub:2});
  const [fc0,fc1]=T([452,388]);
  const face=organic(ring(fc0,fc1,64,70,18),1.6,1502);   // 椭圆形的切面
  let rim=''; for(let i=0;i<40;i++){ const a=R()*Math.PI*2, [x,y]=[fc0+Math.cos(a)*(72+R()*16), fc1+Math.sin(a)*(78+R()*16)];
    rim+=leaf(f1(x),f1(y),a*180/Math.PI+(R()-0.5)*60,10+R()*8,1503+i); }
  const branch=(pts,w)=>{ const q=TP(pts); return `M${q[0]}Q${q[1]} ${q[2]}`+(q[3]?` T${q[3]}`:''); };
  const armL=[[250,340],[150,370],[70,420]], armR=[[650,330],[750,345],[840,380]];
  const handLeaves=(p,dir,seed)=>{ const [x,y]=T(p); let s=''; for(let i=0;i<7;i++) s+=leaf(x,y,(dir>0?-50:230)+i*(dir>0?18:-18)+R()*10,12+R()*6,seed+i); return s; };
  const eye=(stalk,disc,r,seed)=>{ const [cx,cy]=T(disc); return `<path d="${branch(stalk)}" stroke="${OUT}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="${branch(stalk)}" stroke="#4a8a2a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="${organic(ring(cx,cy,r,r*1.08,12),0.8,seed)}" fill="url(#${P}-wood)" stroke="${OUT}" stroke-width="1.6"/>
      ${rings(cx,cy,r*0.85,r*0.92,3,seed+5)}<circle cx="${cx}" cy="${cy}" r="2" fill="#5a2a18"/>`; };
  const root=(pts,seed)=>{ const d=organic(TP(pts),1.4,seed,{sub:2}); return `<path d="${d}" fill="url(#${P}-root)" stroke="${OUT}" stroke-width="1.6"/>${scratches(seed+1,T(pts[0])[0]-30,T(pts[0])[1],60,40,10,8,'#2a1a10',0.8,0.5,Math.PI/2)}`; };
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.2,grain:0.2,grainF:0.42,rim:0.42,seed:71})}
  <clipPath id="${P}-fc"><path d="${face}"/></clipPath>
  <radialGradient id="${P}-wood" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#f6d6c4"/><stop offset=".8" stop-color="#e6b49a"/><stop offset="1" stop-color="#c88a68"/></radialGradient>
  <linearGradient id="${P}-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6b20"/><stop offset=".5" stop-color="#4a9a2c"/><stop offset="1" stop-color="#2a5a1a"/></linearGradient>
  <linearGradient id="${P}-root" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a24"/><stop offset="1" stop-color="#2e1c10"/></linearGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="152" rx="110" ry="9" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-rootL">${root([[250,500],[170,560],[110,620],[150,610],[200,580],[230,640],[260,580],[290,520]],1510)}</g>
  <g id="${P}-rootR">${root([[600,490],[660,540],[740,600],[700,605],[650,575],[640,630],[610,570],[580,520]],1512)}</g>
  <g id="${P}-armL"><path d="${branch(armL)}" stroke="${OUT}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="${branch(armL)}" stroke="url(#${P}-bark)" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M${T([200,350])}l-6,-8 M${T([130,385])}l4,-9" stroke="#3a7a24" stroke-width="3" stroke-linecap="round"/>${handLeaves(armL[2],-1,1520)}</g>
  <g id="${P}-armR"><path d="${branch(armR)}" stroke="${OUT}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="${branch(armR)}" stroke="url(#${P}-bark)" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M${T([700,335])}l4,-9 M${T([790,360])}l-3,-9" stroke="#3a7a24" stroke-width="3" stroke-linecap="round"/>${handLeaves(armR[2],1,1530)}</g>
  <g id="${P}-eyeL">${eye([[250,250],[205,215],[170,190]],[165,185],18,1540)}</g>
  <g id="${P}-eyeR">${eye([[650,240],[690,205],[715,180]],[720,170],16,1545)}</g>
  <path d="${stump}" fill="url(#${P}-bark)" stroke="${OUT}" stroke-width="2.4"/>
  ${scratches(1550,T([230,0])[0],T([0,195])[1],185,150,90,10,'#1e4a14',0.9,0.5,Math.PI/2)}
  ${rim}
  <path d="${face}" fill="url(#${P}-wood)" stroke="${OUT}" stroke-width="2"/>
  <g clip-path="url(#${P}-fc)">
    <path d="${organic(TP([[300,230],[340,226],[320,400],[330,540],[300,530],[290,390]]),1.2,1555)}" fill="#e8962a" opacity=".85"/>
    ${rings(fc0+4,fc1+6,60,70,6,1560)}
    ${scratches(1570,fc0-60,fc1-70,120,140,40,12,'#9a5a3a',0.7,0.35,Math.PI/2)}
    ${ao(P+'-tex',`M${T([300,250])}Q${T([450,215])} ${T([600,250])}`,10,0.4)}
  </g>
</g></g></g>`;
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','armL','armR','eyeL','eyeR','rootL','rootR','shadow','flip']) el[k]=q(k); return el; }
const BASE={bobY:0,rot:0,aL:0,aR:0,eL:0,eR:0,rL:0,rR:0,dY:0,sq:1,alpha:1,flash:0};
const ATTACK=[[0,{}],[0.4,{aR:-40,aL:-10,bobY:-3}],[0.58,{aR:35,aL:10,bobY:3,sq:0.97,eR:6,eL:-6}],[0.8,{aR:20}],[1,{}]];
const DIE=[[0,{}],[0.15,{flash:1,eL:-20,eR:20}],[0.55,{dY:14,sq:0.7,rot:-6,aL:30,aR:-30,eL:-50,eR:50}],[0.85,{dY:18,sq:0.6,rot:-8,alpha:0.8,eL:-60,eR:60}],[1,{dY:18,sq:0.6,rot:-8,alpha:0,eL:-60,eR:60}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*1.5; o.aL=Math.sin(w)*4; o.aR=-Math.sin(w)*4; o.eL=Math.sin(w)*6; o.eR=-Math.sin(w+1)*6; }
  else if(anim==='walk'){ const s=Math.sin(w); o.rot=s*3; o.bobY=-Math.abs(s)*4; o.rL=Math.max(0,s)*8; o.rR=Math.max(0,-s)*8; o.aL=s*10; o.aR=s*10; o.eL=s*8; o.eR=-s*8; }
  else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.bobY-=2*k; o.eL-=10*k; o.eR+=10*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,150) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-150)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3)); S(el.bob,`translate(0,${f1(o.bobY)})`);
  S(el.armL,`rotate(${f1(o.aL)} ${T([250,340])})`); S(el.armR,`rotate(${f1(o.aR)} ${T([650,330])})`);
  S(el.eyeL,`rotate(${f1(o.eL)} ${T([250,250])})`); S(el.eyeR,`rotate(${f1(o.eR)} ${T([650,240])})`);
  S(el.rootL,`translate(0,${f1(-o.rL)})`); S(el.rootR,`translate(0,${f1(-o.rR)})`);
  el.shadow.setAttribute('rx',f1(110*(0.5+0.5*o.alpha))); }
window.CHARS.woodMonster={ name:'木兽', nameEn:'Wood Monster', source:'wood-monster/concept-source/page03d.jpg',
  viewBox:[-200,-150,400,315], foot:[0,150], center:[0,20], top:-120, flipX:0, gameH:50,
  anims:{ idle:{dur:2.6,frames:16}, walk:{dur:1.1,frames:12}, attack:{dur:0.9,frames:12}, die:{dur:1.5,frames:20,loop:false,hold:0.5}, hit:{dur:0.3,overlay:true} },
  markup, bind, pose, hit, apply };
})();
