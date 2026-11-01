/* 沼泽怪 Swamp Troll（Charlie 原画：art-pipeline/characters/swamp-troll/）
 * SVG 零件 + 骨骼姿态。朝右画，朝左由运行时镜像。
 */
(function(){
const { f1, rng, kf } = window.CharSprites;
const OUT='#20180f';

// 毛茸茸的圆（耳朵）
function fuzz(cx,cy,r,n,amp,seed){ const R=rng(seed); let d='';
  for(let i=0;i<n*2;i++){ const a=i/(n*2)*Math.PI*2;
    const rr = i%2 ? r-amp*0.3*R() : r+amp*(0.55+0.45*R());
    d+=(i?'L':'M')+f1(cx+Math.cos(a)*rr)+','+f1(cy+Math.sin(a)*rr); }
  return d+'Z'; }
function qpt(p0,c,p2,t){ const u=1-t; return [u*u*p0[0]+2*u*t*c[0]+t*t*p2[0], u*u*p0[1]+2*u*t*c[1]+t*t*p2[1]]; }

// 背鳍：b1 = 后侧根部，b2 = 前侧根部，tip = 尖端（向后掠）
function fin(P,id,b1,b2,tip,seed){
  const R=rng(seed);
  const c1=[(b1[0]+tip[0])/2+3,(b1[1]+tip[1])/2+1];
  const c2=[(tip[0]+b2[0])/2+9,(tip[1]+b2[1])/2-7];
  let sp='';
  for(let t=0.1;t<0.95;t+=0.1){
    const a=qpt(b1,c1,tip,t-0.045), b=qpt(b1,c1,tip,t+0.045), m=qpt(b1,c1,tip,t);
    const tx=b[0]-a[0], ty=b[1]-a[1], L=Math.hypot(tx,ty)||1;
    const len=5+4*R(), nx=ty/L*len, ny=-tx/L*len;
    sp+=`M${f1(a[0])},${f1(a[1])}L${f1(m[0]+nx)},${f1(m[1]+ny)}L${f1(b[0])},${f1(b[1])}Z`;
  }
  const mid=[(b1[0]+b2[0])/2,(b1[1]+b2[1])/2], v1=qpt(mid,[(mid[0]+tip[0])/2+4,(mid[1]+tip[1])/2],tip,0.75);
  return `<g id="${P}-${id}">
    <path d="${sp}" fill="${OUT}"/>
    <path d="M${b1}Q${f1(c1[0])},${f1(c1[1])} ${tip}Q${f1(c2[0])},${f1(c2[1])} ${b2}Z" fill="url(#${P}-fin)" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M${f1(mid[0])},${f1(mid[1])}L${f1(v1[0])},${f1(v1[1])}" stroke="#b9481a" stroke-width="1.4" opacity=".7"/>
  </g>`;
}

// 一节甲壳
function seg(P,id,cx,cy,r,extra){
  return `<g id="${P}-${id}">
    <clipPath id="${P}-${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${P}-body)"/>
    <g clip-path="url(#${P}-${id}c)">
      <circle cx="${cx-5}" cy="${cy-7}" r="${r}" fill="none" stroke="rgba(40,70,15,.24)" stroke-width="14"/>
      ${extra||''}
      <ellipse cx="${f1(cx-r*.3)}" cy="${f1(cy-r*.5)}" rx="${f1(r*.32)}" ry="${f1(r*.13)}" transform="rotate(-25 ${f1(cx-r*.3)} ${f1(cy-r*.5)})" fill="#fff" opacity=".45"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${OUT}" stroke-width="2.4"/>
  </g>`;
}
function cap(cx,cy,rx,ry){ // 深色硬壳 + 排线
  let h=''; for(let i=-3;i<=3;i++) h+=`<path d="M${cx+i*7-4},${cy+ry} L${cx+i*7+5},${cy-ry}" stroke="#4d4934" stroke-width="1.3"/>`;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2b281d" stroke="${OUT}" stroke-width="1.6"/>${h}`;
}

// 后腿：粗，三个圆脚趾 + 粉色趾甲
function hindLeg(id,x,y,dark){
  const g=dark?'#6f9d36':'#93d13d', t=dark?'#668f31':'#86c437';
  const toe=(cx,cy,rx,ry)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${t}" stroke="${OUT}" stroke-width="2"/>`;
  const nail=(cx,cy)=>`<ellipse cx="${cx}" cy="${cy}" rx="2.6" ry="2" fill="#f4b3ad" stroke="${OUT}" stroke-width="1"/>`;
  const X=(cx,cy)=>`<path d="M${cx-4},${cy-4}L${cx+4},${cy+4}M${cx+4},${cy-4}L${cx-4},${cy+4}M${cx-5},${cy}L${cx+5},${cy}" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<g id="${id}">
    <rect x="${x-12}" y="${y-4}" width="24" height="54" rx="11" fill="${g}" stroke="${OUT}" stroke-width="2.2"/>
    ${X(x-3,y+18)}${X(x+5,y+34)}
    <ellipse cx="${x+4}" cy="${y+53}" rx="17" ry="10" fill="${g}" stroke="${OUT}" stroke-width="2.2"/>
    ${toe(x+1,y+60,6.5,5.5)}${toe(x+12,y+59.5,7,5.8)}${toe(x+20,y+54,6.5,6)}
    ${nail(x+5,y+63)}${nail(x+17,y+62)}${nail(x+25,y+54)}
  </g>`;
}
// 前腿：细，黑色小刺，末端深青色触手簇
function frontLeg(id,x,y,dark){
  const g=dark?'#6f9d36':'#93d13d', te=dark?'#1b4c53':'#23646d';
  let th=''; for(let k=0;k<6;k++){ const yy=y+5+k*8;
    th+=`M${x-5},${yy}L${x-10},${yy+2.5}L${x-5},${yy+4.5}Z M${x+5},${yy+3}L${x+10},${yy+5.5}L${x+5},${yy+7.5}Z`; }
  const ends=[[-13,14],[-9,17],[-4,19],[1,19.5],[6,18],[10,15],[13,11]];
  const ty=y+45; let s1='', s2='';
  for(const [dx,dy] of ends){ const d=`M${x},${ty}Q${f1(x+dx*.35)},${f1(ty+dy*.75)} ${x+dx},${ty+dy}`;
    s1+=`<path d="${d}" stroke="#0d1a1c" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s2+=`<path d="${d}" stroke="${te}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`; }
  return `<g id="${id}">
    <rect x="${x-5.5}" y="${y-4}" width="11" height="52" rx="5.5" fill="${g}" stroke="${OUT}" stroke-width="2"/>
    <path d="${th}" fill="${OUT}"/>
    <g id="${id}-tuft">${s1}${s2}<ellipse cx="${x}" cy="${ty+1}" rx="6.5" ry="4" fill="${te}" stroke="${OUT}" stroke-width="1.6"/></g>
  </g>`;
}
function ear(P,id,cx,cy,r,seed){
  return `<g id="${P}-${id}">
    <path d="${fuzz(cx,cy,r,14,4.5,seed)}" fill="#e2392e" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="${fuzz(cx,cy,r*.78,11,2.5,seed+9)}" fill="none" stroke="#a8221d" stroke-width="1.2"/>
    <circle cx="${cx}" cy="${cy}" r="${f1(r*.55)}" fill="#6a1450" stroke="${OUT}" stroke-width="1.6"/>
    <circle cx="${cx}" cy="${cy}" r="${f1(r*.36)}" fill="#9c2a7c"/>
    <path d="M${cx-1.8},${cy}L${cx},${cy-3.8}L${cx+1.8},${cy}L${cx},${cy+3.8}Z" fill="#f5a73b" stroke="${OUT}" stroke-width=".8"/>
    <circle cx="${cx-2.6}" cy="${cy-2.8}" r="1.2" fill="#fff" opacity=".8"/>
  </g>`;
}

function markup(P){
  const R=rng(42); let speck='';
  for(let i=0;i<20;i++){ const a=R()*6.28, rr=R()*9.5;
    speck+=`<circle cx="${f1(18+Math.cos(a)*rr)}" cy="${f1(147+Math.sin(a)*rr)}" r="${f1(0.9+R()*1.1)}" fill="${i%3?'#5b0b2a':'#ec6a9c'}"/>`; }
  let hipSp=''; for(let a=12;a<=168;a+=13){ const r1=a*Math.PI/180, w=0.09;
    hipSp+=`M${f1(98+Math.cos(r1-w)*16)},${f1(113+Math.sin(r1-w)*16)}L${f1(98+Math.cos(r1)*23)},${f1(113+Math.sin(r1)*23)}L${f1(98+Math.cos(r1+w)*16)},${f1(113+Math.sin(r1+w)*16)}Z`; }
  let zig='M86,116'; for(let i=1;i<=8;i++) zig+=`L${86+i*3},${i%2?122:117}`;
  let bub=''; for(let i=0;i<8;i++) bub+=`<circle id="${P}-bub${i}" r="${2.4+(i%3)*1.2}" fill="rgba(170,220,120,.25)" stroke="#bfe58c" stroke-width="1.2" opacity="0"/>`;

  return `
<defs>
  <linearGradient id="${P}-body" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="125">
    <stop offset="0" stop-color="#fff27a"/><stop offset=".38" stop-color="#f7dc2c"/>
    <stop offset=".55" stop-color="#f2d32a"/><stop offset=".64" stop-color="#9fd443"/><stop offset="1" stop-color="#5fa52c"/>
  </linearGradient>
  <linearGradient id="${P}-fin" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#e2611c"/><stop offset="1" stop-color="#ffa04c"/>
  </linearGradient>
  <clipPath id="${P}-ground"><rect x="-60" y="-60" width="400" height="230"/></clipPath>
</defs>
<ellipse id="${P}-shadow" cx="120" cy="168" rx="80" ry="7" fill="rgba(0,0,0,.25)"/>
<ellipse id="${P}-puddle" cx="120" cy="168" rx="0" ry="0" fill="#3f5e22" stroke="#2b4316" stroke-width="2"/>
<g id="${P}-flip">
<g clip-path="url(#${P}-ground)"><g id="${P}-root"><g id="${P}-bob">
  <g id="${P}-tail">
    <path d="M64,110 C48,118 34,130 24,142" stroke="${OUT}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M64,110 C48,118 34,130 24,142" stroke="#8cc93b" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M64,110 C48,118 34,130 24,142" stroke="${OUT}" stroke-width="9" fill="none" stroke-dasharray="3 5.5"/>
    <g id="${P}-ball"><circle cx="18" cy="147" r="11.5" fill="#a51d55" stroke="${OUT}" stroke-width="2"/>${speck}</g>
  </g>
  ${hindLeg(P+'-hF',134,104,true)}
  ${frontLeg(P+'-fF',184,98,true)}
  ${hindLeg(P+'-hN',100,104,false)}
  ${frontLeg(P+'-fN',168,100,false)}
  ${fin(P,'fin1',[70,56],[92,46],[54,20],1)}
  ${fin(P,'fin2',[112,42],[136,38],[100,6],2)}
  ${fin(P,'fin3',[150,58],[170,54],[140,26],3)}
  ${seg(P,'sR',88,80,38,`
      <ellipse cx="70" cy="62" rx="7.5" ry="8.5" fill="#3a3a38" stroke="${OUT}" stroke-width="1.6"/>
      <ellipse cx="66" cy="81" rx="7.5" ry="8.5" fill="#3a3a38" stroke="${OUT}" stroke-width="1.6"/>
      <ellipse cx="70" cy="100" rx="7.5" ry="8.5" fill="#3a3a38" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M80,46 Q72,80 82,116" fill="none" stroke="${OUT}" stroke-width="1.6"/>`)}
  ${seg(P,'sM',126,72,38,`${cap(128,38,30,12)}
      <path d="M113,59 L131,55 L132,61 L114,64 Z" fill="${OUT}"/>
      <path d="M136,63 Q127,78 132,92" fill="none" stroke="${OUT}" stroke-width="1.8"/>
      <path d="M111,90 Q118,96 126,90" fill="none" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M113,92.5 L111,97 M118,94 L118,99 M123,93 L125,97.5" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>`)}
  ${seg(P,'sF',160,80,30,cap(160,53,24,9))}
  <g id="${P}-hip">
    <path d="${hipSp}" fill="#f5ead2" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M81,113 A17,17 0 0 0 115,113 Z" fill="#c97c2c" stroke="${OUT}" stroke-width="2"/>
    <path d="${zig}" fill="none" stroke="#6b3a12" stroke-width="1.5"/>
    <path d="M84,114 L112,114" stroke="#e7a35a" stroke-width="2" opacity=".7"/>
  </g>
  <g id="${P}-head">
    ${fin(P,'fin4',[186,70],[194,70],[182,54],4)}
    ${ear(P,'earF',214,74,15,7)}
    ${ear(P,'earN',166,73,17,3)}
    <ellipse cx="191" cy="89" rx="11" ry="13.5" fill="#93d13d" stroke="${OUT}" stroke-width="2"/>
    <ellipse cx="187" cy="84" rx="4" ry="2" fill="#fff" opacity=".35"/>
    <path d="M183,79 L184.5,70 L188,78 Z M195,78 L198,69.5 L199.5,79 Z" fill="#d8262a" stroke="${OUT}" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="187" cy="86" r="3.3" fill="#d8262a" stroke="${OUT}" stroke-width="1.2"/><circle cx="187.4" cy="86.3" r="1.4" fill="${OUT}"/>
    <circle cx="197" cy="85.5" r="3.3" fill="#d8262a" stroke="${OUT}" stroke-width="1.2"/><circle cx="197.4" cy="85.8" r="1.4" fill="${OUT}"/>
    <circle cx="191" cy="91.5" r=".9" fill="${OUT}"/><circle cx="194" cy="91.5" r=".9" fill="${OUT}"/>
    <g id="${P}-mouth">
      <ellipse cx="192" cy="97.5" rx="5.8" ry="2.6" fill="#5c0f12" stroke="${OUT}" stroke-width="1.3"/>
      <path d="M187.4,96.3 l1.5,1.8 l1.4,-1.8 l1.5,1.8 l1.4,-1.8 l1.5,1.8 l1.4,-1.8 Z" fill="#fff"/>
    </g>
  </g>
</g></g></g>
</g>
<g id="${P}-fx">${bub}</g>`;
}

const PART_IDS=['root','bob','tail','ball','hF','fF','hN','fN','fin1','fin2','fin3','head','earN','earF','mouth','hip','shadow','puddle','flip'];
function bind(svg,P){
  const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of PART_IDS) el[k]=q(k);
  el.tN=q('fN-tuft'); el.tF=q('fF-tuft');
  el.bub=[...Array(8)].map((_,i)=>q('bub'+i));
  return el;
}

/* ---- 姿态 ---- */
const BASE={bobY:0,rot:0,tail:0,ball:0,hN:0,hF:0,fN:0,fF:0,lhN:0,lhF:0,lfN:0,lfF:0,tN:0,tF:0,
  f1:0,f2:0,f3:0,head:0,hx:0,ear:1,earR:0,mouth:1,dY:0,sq:1,alpha:1,flash:0,puddle:0,bub:0};
const ATTACK=[
  [0,{}],
  [0.38,{rot:-6,head:-10,hx:-3,mouth:2.0,ear:1.12,fN:-35,fF:-25,tN:-20,tF:-15,f1:-6,f2:-6,f3:-6,tail:12}],
  [0.5,{rot:7,head:12,hx:9,mouth:2.7,ear:1.16,fN:-62,fF:-46,tN:28,tF:22,f1:6,f2:6,f3:6,tail:-6,bobY:1}],
  [0.62,{rot:6,head:9,hx:7,mouth:0.6,ear:1.05,fN:-22,fF:-16,tN:-10,tF:-8,tail:-4}],
  [1,{}],
];
// 死亡：受击 → 瘫软 → 沉进沼泽水里冒泡
const SUNK={rot:4,sq:0.85,hN:25,hF:-25,fN:-30,fF:20,head:18,mouth:1.3,ear:0.9,f1:12,f2:12,f3:12,tail:-15,puddle:1};
const DIE=[
  [0,{}],
  [0.1,{rot:-8,head:-14,hx:-3,mouth:2.4,ear:1.18,flash:1,tail:12}],
  [0.22,{rot:-5,head:-8,mouth:2,ear:1.1,tail:8}],
  [0.45,{...SUNK,dY:6}],
  [0.85,{...SUNK,dY:70,bub:0.7}],
  [1,{...SUNK,dY:95,alpha:0,puddle:0,bub:1}],
];

function pose(anim,p){
  const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){
    o.bobY=Math.sin(w*2)*1.2; o.tail=Math.sin(w)*7; o.ball=Math.sin(w-1)*8;
    o.f1=Math.sin(w*2)*3; o.f2=Math.sin(w*2+0.8)*3; o.f3=Math.sin(w*2+1.6)*3;
    o.head=Math.sin(w)*4; o.ear=1+Math.sin(w*3)*0.03; o.earR=Math.sin(w*2)*4;
    o.tN=Math.sin(w*2)*8; o.tF=Math.sin(w*2+1)*8;
    o.mouth=1+Math.max(0,Math.sin(w))*0.3;
  } else if(anim==='walk'){
    const c=Math.cos(w);
    o.hN=Math.sin(w)*20; o.hF=-Math.sin(w)*20; o.fN=-Math.sin(w)*18; o.fF=Math.sin(w)*18;
    o.lhN=Math.max(0,-c)*4; o.lfF=Math.max(0,-c)*4; o.lhF=Math.max(0,c)*4; o.lfN=Math.max(0,c)*4;
    o.bobY=-Math.abs(c)*2.4; o.rot=Math.sin(w*2)*1.2;
    o.tail=Math.sin(w)*10+4; o.ball=Math.sin(w-1.2)*14;
    o.f1=Math.sin(w*2)*4; o.f2=Math.sin(w*2+0.8)*4; o.f3=Math.sin(w*2+1.6)*4;
    o.head=Math.sin(w*2+1)*3; o.earR=Math.sin(w*2+2)*6; o.tN=Math.sin(w*2)*14; o.tF=Math.sin(w*2+1)*14;
  } else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o;
}
function hit(o,k){ o.flash=k; o.hx-=5*k; o.rot-=4*k; o.mouth+=1.2*k; o.ear+=0.1*k; }

function apply(el,o,flipped){
  const S=(k,v)=>el[k].setAttribute('transform',v);
  S('root',`translate(0,${f1(o.dY)}) translate(120,168) scale(1,${o.sq.toFixed(3)}) translate(-120,-168)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S('bob',`translate(0,${f1(o.bobY)}) rotate(${f1(o.rot)} 112 166)`);
  S('tail',`rotate(${f1(o.tail)} 64 110)`); S('ball',`rotate(${f1(o.ball)} 24 142)`);
  S('hN',`translate(0,${f1(-o.lhN)}) rotate(${f1(o.hN)} 100 104)`);
  S('hF',`translate(0,${f1(-o.lhF)}) rotate(${f1(o.hF)} 134 104)`);
  S('fN',`translate(0,${f1(-o.lfN)}) rotate(${f1(o.fN)} 168 100)`);
  S('fF',`translate(0,${f1(-o.lfF)}) rotate(${f1(o.fF)} 184 98)`);
  S('tN',`rotate(${f1(o.tN)} 168 145)`); S('tF',`rotate(${f1(o.tF)} 184 143)`);
  S('hip',`rotate(${f1(o.hN*0.25)} 98 108)`);
  S('fin1',`rotate(${f1(o.f1)} 81 51)`); S('fin2',`rotate(${f1(o.f2)} 124 40)`); S('fin3',`rotate(${f1(o.f3)} 160 56)`);
  S('head',`translate(${f1(o.hx)},0) rotate(${f1(o.head)} 178 96)`);
  S('earN',`translate(166,73) rotate(${f1(o.earR)}) scale(${o.ear.toFixed(3)}) translate(-166,-73)`);
  S('earF',`translate(214,74) rotate(${f1(-o.earR)}) scale(${o.ear.toFixed(3)}) translate(-214,-74)`);
  S('mouth',`translate(192,97) scale(1,${o.mouth.toFixed(3)}) translate(-192,-97)`);
  const sh=Math.max(0,1-o.dY/40);
  el.shadow.setAttribute('rx',f1(80*sh)); el.shadow.setAttribute('ry',f1(7*sh));
  el.puddle.setAttribute('rx',f1(92*o.puddle)); el.puddle.setAttribute('ry',f1(9*o.puddle));
  el.bub.forEach((b,i)=>{
    if(o.bub<=0||o.bub>=1){ b.setAttribute('opacity',0); return; }
    const fr=(o.bub*2.5+i*0.37)%1, x=84+i*10;
    b.setAttribute('cx',f1((flipped?240-x:x)+Math.sin(fr*9+i)*3));
    b.setAttribute('cy',f1(166-fr*55)); b.setAttribute('opacity',(0.9*(1-fr)).toFixed(2));
  });
}

window.CHARS.swampTroll={
  name:'沼泽怪', nameEn:'Swamp Troll',
  source:'characters/swamp-troll/concept-source/IMG_1702_upright.jpg',
  viewBox:[-12,-6,264,186], foot:[120,168], center:[120,90], top:6, flipX:240, gameH:48,
  anims:{
    idle:  {dur:3.0,  frames:24},
    walk:  {dur:0.8,  frames:12},
    attack:{dur:0.95, frames:14},
    die:   {dur:1.6,  frames:24, loop:false, hold:0.7},
    hit:   {dur:0.35, overlay:true},
  },
  markup, bind, pose, hit, apply,
};
})();
