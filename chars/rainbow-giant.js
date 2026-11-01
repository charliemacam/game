/* 彩虹巨人 Rainbow Giant（Charlie 原画：art-pipeline/characters/rainbow-giant/）
 * 正面视角的螃蟹形巨怪：彩虹斜纹身体、三张尖牙嘴、彩色尖峰王冠、六条长臂、两只紫色螺纹蟹足。
 * Charlie 标注的数值：血量中、速度极快、攻击极高、护甲低。
 */
(function(){
const { f1, rng, kf } = window.CharSprites;
const OUT='#1e1712';
const PINK='#e8689c', PINK_HI='#f7a8c6';

function qpt(p0,c,p2,t){ const u=1-t; return [u*u*p0[0]+2*u*t*c[0]+t*t*p2[0], u*u*p0[1]+2*u*t*c[1]+t*t*p2[1]]; }
function spiral(cx,cy,r,turns){ let d=''; const N=30;
  for(let i=0;i<=N;i++){ const t=i/N, a=t*turns*Math.PI*2, rr=r*t;
    d+=(i?'L':'M')+f1(cx+Math.cos(a)*rr)+','+f1(cy+Math.sin(a)*rr); }
  return d; }

// 六条长臂：左三条，右三条镜像。tip：pad = 黄色圆拳，claw = 钳子
const LEFT=[
  { a:[-70,-22], c:[-112,-92], e:[-140,-142], tip:'pad'  },
  { a:[-88,-6],  c:[-145,-34], e:[-196,-72],  tip:'claw' },
  { a:[-90,12],  c:[-150,22],  e:[-206,34],   tip:'pad'  },
];
const ARMS=[...LEFT.map(A=>({...A,s:-1})), ...LEFT.map(A=>({s:1,tip:A.tip,a:[-A.a[0],A.a[1]],c:[-A.c[0],A.c[1]],e:[-A.e[0],A.e[1]]}))];
const MOUTHS=[[0,-6,30,13],[-30,20,26,11],[30,20,26,11]];   // cx, cy, w, h

function arm(P,i,A){
  const d=`M${A.a}Q${A.c} ${A.e}`;
  let knobs='';
  for(const t of [0.36,0.66]){
    const p=qpt(A.a,A.c,A.e,t), q=qpt(A.a,A.c,A.e,t+0.02);
    let tx=q[0]-p[0], ty=q[1]-p[1]; const L=Math.hypot(tx,ty)||1; tx/=L; ty/=L;
    let nx=-ty, ny=tx; if(ny>0){ nx=-nx; ny=-ny; }              // 朝上的一侧
    const kx=p[0]+nx*9, ky=p[1]+ny*9;
    knobs+=`<circle cx="${f1(kx)}" cy="${f1(ky)}" r="6.5" fill="#ece8e2" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M${f1(kx+nx*4-tx*3.5)},${f1(ky+ny*4-ty*3.5)}L${f1(kx+nx*15)},${f1(ky+ny*15)}L${f1(kx+nx*4+tx*3.5)},${f1(ky+ny*4+ty*3.5)}Z" fill="#c8232c" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
  const deg=f1(Math.atan2(A.e[1]-A.c[1],A.e[0]-A.c[0])*180/Math.PI);
  const tip = A.tip==='pad'
    ? `<g transform="translate(${A.e}) rotate(${deg})">
        <circle r="12.5" fill="#f2d33a" stroke="${OUT}" stroke-width="2.2"/>
        <path d="M-1,-6.5 L8,-5 M0,0 L10,0 M-1,6.5 L8,5" stroke="#9a7514" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="-4" cy="-5" r="2.5" fill="#fff" opacity=".5"/></g>`
    : `<g transform="translate(${A.e}) rotate(${deg})">
        <g id="${P}-jaw${i}"><path d="M-2,-3 Q12,-22 31,-11 Q18,-9 8,-2 Z" fill="#f6cdbd" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/></g>
        <path d="M-2,3 Q12,22 31,11 Q18,9 8,2 Z" fill="#f6cdbd" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>
        <circle r="7" fill="${PINK}" stroke="${OUT}" stroke-width="1.8"/></g>`;
  return `<g id="${P}-arm${i}">${knobs}
    <path d="${d}" stroke="${OUT}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="${PINK}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="${PINK_HI}" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(0,-2.5)" opacity=".85"/>
    ${tip}</g>`;
}

// 紫色螺纹蟹足 + 三根粉色尖爪
function foot(P,id,cx,side){
  const sy=64;
  const sp=[[side*34,102,side*20,76],[side*12,106,side*4,80],[-side*12,104,-side*12,78]]
    .map(([tx,ty,bx,by])=>`<path d="M${cx+bx-5},${by}L${cx+tx},${ty}L${cx+bx+5},${by}Z" fill="#f4a58c" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
  return `<g id="${P}-${id}">${sp}
    <ellipse cx="${cx}" cy="${sy}" rx="28" ry="20" fill="#8a46ad" stroke="${OUT}" stroke-width="2"/>
    <path d="${spiral(cx+side*13,sy-5,7,2.2)}" fill="none" stroke="#c99be2" stroke-width="1.5"/>
    <ellipse cx="${cx-side*6}" cy="${sy+5}" rx="17" ry="12" fill="#f4f1ee" stroke="${OUT}" stroke-width="1.2"/>
    <path d="${spiral(cx-side*11,sy+5,5.5,2.2)}" fill="none" stroke="#8b8b8b" stroke-width="1.3"/>
    <path d="${spiral(cx-side*1,sy+7,5,2.2)}" fill="none" stroke="#8b8b8b" stroke-width="1.3"/>
  </g>`;
}

function mouth(P,i,[cx,cy,w,h]){
  const x0=cx-w/2, y0=cy-h/2, n=Math.round(w/6); let top='', bot='';
  for(let k=0;k<n;k++){ const x=x0+2+k*(w-4)/n, tw=(w-4)/n;
    top+=`M${f1(x)},${f1(y0+1)}L${f1(x+tw/2)},${f1(y0+h*0.45)}L${f1(x+tw)},${f1(y0+1)}Z`;
    if(k%2===0) bot+=`M${f1(x+tw*0.2)},${f1(y0+h-1)}L${f1(x+tw*0.7)},${f1(y0+h*0.6)}L${f1(x+tw*1.2)},${f1(y0+h-1)}Z`; }
  return `<g id="${P}-m${i}">
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="#a8161b" stroke="${OUT}" stroke-width="1.8"/>
    <path d="${top}${bot}" fill="#fff" stroke="${OUT}" stroke-width=".7" stroke-linejoin="round"/></g>`;
}

function markup(P){
  // 身体：彩虹斜纹
  const BODY='M-95,0 C-95,-32 -55,-38 0,-38 C55,-38 95,-32 95,0 C95,30 55,40 0,40 C-55,40 -95,30 -95,0Z';
  const cols=['#e64032','#f5d33b','#e64032','#56b7e6']; let stripes='';
  for(let k=-14;k<=14;k++) stripes+=`<rect x="${k*17}" y="-200" width="17.5" height="400" fill="${cols[(k+28)%4]}" transform="rotate(-35)"/>`;
  // 王冠：三排宽大的彩色尖峰叠成一座山，后排最高，前排矮，高的画在后面
  const R=rng(11), tri=[];
  const ROWS=[ { xs:[-38,-12,14,40],          h:[118,162], w:[50,60], by:-34 },
               { xs:[-58,-30,0,30,58],        h:[78,112],  w:[48,58], by:-31 },
               { xs:[-66,-42,-16,12,38,64],   h:[44,72],   w:[42,52], by:-28 } ];
  for(const row of ROWS) for(const bx of row.xs){
    const k=1-Math.abs(bx)/90;
    tri.push({ bx, by:row.by+R()*3, h:(row.h[0]+(row.h[1]-row.h[0])*R())*(0.7+0.3*k),
      w:row.w[0]+(row.w[1]-row.w[0])*R(), tx:bx+(R()-0.5)*20 }); }
  tri.sort((a,b)=>(a.by-a.h)-(b.by-b.h));
  const tcol=['#7d1f5f','#4f7d2b','#f08a2b','#a02a72','#5e8f33'];
  const crown=tri.map((t,i)=>{ const ty=t.by-t.h;
    return `<path d="M${f1(t.bx-t.w/2)},${f1(t.by)}L${f1(t.tx)},${f1(ty)}L${f1(t.bx+t.w/2)},${f1(t.by)}Z" fill="${tcol[i%tcol.length]}" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${f1(t.tx)},${f1(ty+6)}L${f1(t.bx-t.w*0.12)},${f1(t.by-2)}" stroke="#fff" stroke-width="1.6" opacity=".28"/>`; }).join('');
  // 臂根的黑色绒毛
  let tufts=''; for(const A of ARMS){ const [ax,ay]=A.a;
    for(let k=0;k<6;k++){ const ang=Math.atan2(ay+6,ax)+(k-2.5)*0.28, r0=4, r1=10+(k%3)*3;
      tufts+=`M${f1(ax+Math.cos(ang)*r0)},${f1(ay+Math.sin(ang)*r0)}L${f1(ax+Math.cos(ang)*r1)},${f1(ay+Math.sin(ang)*r1)}`; } }
  const star='M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6Z';
  const scol=['#e64032','#f5a32b','#f5d33b','#5fbf4a','#56b7e6','#7d5ce0','#c04fd0'];
  let spark=''; for(let i=0;i<10;i++) spark+=`<path id="${P}-sp${i}" d="${star}" fill="${scol[i%scol.length]}" stroke="${OUT}" stroke-width=".8" opacity="0"/>`;

  return `
<defs><clipPath id="${P}-bodyc"><path d="${BODY}"/></clipPath></defs>
<ellipse id="${P}-shadow" cx="0" cy="104" rx="150" ry="10" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root"><g id="${P}-bob">
  ${ARMS.map((A,i)=>arm(P,i,A)).join('')}
  ${foot(P,'fL',-66,-1)}${foot(P,'fR',66,1)}
  <path d="${BODY}" fill="#e64032"/>
  <g clip-path="url(#${P}-bodyc)">${stripes}
    <path d="${BODY}" fill="none" stroke="rgba(60,10,40,.25)" stroke-width="14" transform="translate(4,6)"/>
    <ellipse cx="-40" cy="-24" rx="34" ry="7" fill="#fff" opacity=".35" transform="rotate(-6 -40 -24)"/></g>
  <path d="${BODY}" fill="none" stroke="${OUT}" stroke-width="2.6"/>
  <g id="${P}-eyes">
    <circle cx="-64" cy="0" r="13" fill="#f5d33b" stroke="${OUT}" stroke-width="5"/>
    <circle cx="64" cy="0" r="13" fill="#f5d33b" stroke="${OUT}" stroke-width="5"/>
    <ellipse cx="-28" cy="-22" rx="6.5" ry="7.5" fill="#fff" stroke="${OUT}" stroke-width="1.6"/>
    <ellipse cx="28" cy="-22" rx="6.5" ry="7.5" fill="#fff" stroke="${OUT}" stroke-width="1.6"/>
    <g id="${P}-pupils">
      <circle cx="-63" cy="1" r="5" fill="${OUT}"/><circle cx="65" cy="1" r="5" fill="${OUT}"/>
      <circle cx="-27" cy="-21" r="3" fill="${OUT}"/><circle cx="29" cy="-21" r="3" fill="${OUT}"/>
      <circle cx="-65" cy="-2" r="1.6" fill="#fff"/><circle cx="63" cy="-2" r="1.6" fill="#fff"/></g>
    <path d="M-36,-33 L-21,-29 M36,-33 L21,-29" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>
  </g>
  ${MOUTHS.map((m,i)=>mouth(P,i,m)).join('')}
  <path d="${tufts}" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>
  <g id="${P}-crown">${crown}</g>
</g></g></g>
<g id="${P}-fx">${spark}</g>`;
}

function bind(svg,P){
  const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','crown','fL','fR','pupils','shadow','flip']) el[k]=q(k);
  el.arms=ARMS.map((_,i)=>q('arm'+i));
  el.jaws=ARMS.map((_,i)=>q('jaw'+i));
  el.mouths=MOUTHS.map((_,i)=>q('m'+i));
  el.spark=[...Array(10)].map((_,i)=>q('sp'+i));
  return el;
}

/* ---- 姿态 ---- */
const BASE={bobY:0,rot:0,crown:0,down:0,a0:0,a1:0,a2:0,a3:0,a4:0,a5:0,jaw:12,fL:0,fR:0,lfL:0,lfR:0,
  eyeX:0,mouth:1,dY:0,sq:1,alpha:1,flash:0,spark:0};
const ATTACK=[
  [0,{}],
  [0.35,{down:-28,bobY:-4,mouth:1.6,jaw:32,crown:-3}],
  [0.5,{down:42,bobY:3,mouth:2.4,jaw:0,crown:4,sq:0.94}],
  [0.62,{down:30,mouth:1.2,jaw:5,sq:0.97}],
  [1,{}],
];
const FALLEN={down:60,sq:0.7,dY:14,crown:14,mouth:1.1,jaw:40};
const DIE=[
  [0,{}],
  [0.1,{flash:1,down:-20,mouth:2.4,jaw:35}],
  [0.3,{down:30,mouth:1.8,sq:0.9,jaw:30}],
  [0.55,{...FALLEN,spark:0.2}],
  [0.85,{...FALLEN,alpha:0.7,spark:0.7}],
  [1,{...FALLEN,alpha:0,spark:1}],
];

function pose(anim,p){
  const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){
    o.bobY=Math.sin(w*2)*1.5; o.crown=Math.sin(w)*1.5;
    for(let i=0;i<6;i++) o['a'+i]=Math.sin(w+i*0.9)*5;
    o.jaw=12+Math.sin(w*2)*8; o.eyeX=Math.sin(w)*2; o.mouth=1+Math.max(0,Math.sin(w))*0.25;
  } else if(anim==='walk'){                     // 横着小碎步快跑
    const s=Math.sin(w);
    o.fL=s*14; o.fR=-s*14; o.lfL=Math.max(0,s)*8; o.lfR=Math.max(0,-s)*8;
    o.bobY=-Math.abs(Math.cos(w))*3; o.rot=s*2.5; o.crown=-s*2.5;
    for(let i=0;i<6;i++) o['a'+i]=Math.sin(w+i*1.1)*9;
    o.jaw=12+Math.sin(w*2)*8; o.eyeX=2; o.mouth=1.1;
  } else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o;
}
function hit(o,k){ o.flash=k; o.bobY-=3*k; o.mouth+=1*k; o.down-=10*k; o.jaw+=15*k; }

function apply(el,o){
  const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,104) scale(1,${o.sq.toFixed(3)}) translate(0,-104)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)}) rotate(${f1(o.rot)} 0 104)`);
  S(el.crown,`rotate(${f1(o.crown)} 0 -32)`);
  ARMS.forEach((A,i)=>{ S(el.arms[i],`rotate(${f1(A.s*o.down+o['a'+i])} ${A.a})`);
    if(el.jaws[i]) S(el.jaws[i],`rotate(${f1(-o.jaw)})`); });
  S(el.fL,`translate(0,${f1(-o.lfL)}) rotate(${f1(o.fL)} -66 44)`);
  S(el.fR,`translate(0,${f1(-o.lfR)}) rotate(${f1(o.fR)} 66 44)`);
  S(el.pupils,`translate(${f1(o.eyeX)},0)`);
  MOUTHS.forEach(([cx,cy],i)=>S(el.mouths[i],`translate(${cx},${cy}) scale(1,${o.mouth.toFixed(3)}) translate(${-cx},${-cy})`));
  const sh=0.5+0.5*o.alpha;
  el.shadow.setAttribute('rx',f1(150*sh)); el.shadow.setAttribute('ry',f1(10*sh));
  el.spark.forEach((s,i)=>{
    if(o.spark<=0||o.spark>=1){ s.setAttribute('opacity',0); return; }
    const fr=(o.spark*2+i*0.29)%1, x=-90+i*20+Math.sin(fr*7+i)*6, y=60-fr*190;
    s.setAttribute('transform',`translate(${f1(x)},${f1(y)}) rotate(${f1(fr*200)}) scale(${(1.4-fr*0.6).toFixed(2)})`);
    s.setAttribute('opacity',(1-fr).toFixed(2));
  });
}

window.CHARS.rainbowGiant={
  name:'彩虹巨人', nameEn:'Rainbow Giant',
  source:'characters/rainbow-giant/concept-source/IMG_1754_crop.jpg',
  viewBox:[-235,-205,470,320], foot:[0,104], center:[0,-45], top:-190, flipX:0, gameH:60,
  anims:{
    idle:  {dur:2.4, frames:20},
    walk:  {dur:0.5, frames:10},
    attack:{dur:0.8, frames:12},
    die:   {dur:1.6, frames:24, loop:false, hold:0.7},
    hit:   {dur:0.35, overlay:true},
  },
  markup, bind, pose, hit, apply,
};
})();
