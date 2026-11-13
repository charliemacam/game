/* 小丑怪 Clown-man（Charlie 原画：character-design/clown-man/）
 * 比例按原画量过（身体椭圆宽 172、高 220 为基准）：
 *   身体：红黄斜条纹的大椭圆；从椭圆顶上竖着下来一条宽宽的脖子（左红右黄，两种颜色），宽约身体的 0.4，接到头上。
 *   头：白色小丑面具，宽约身体的 0.37、高约 0.44，在椭圆下半部；头顶一根黄色尖帽，两边蓝色尖角。
 *     蓝色椭圆眼、蓝色三角鼻（尖朝上）、右边一撮黑胡子、黑色三角大嘴、缝线下巴。
 *   胳膊：沿翅膀上沿的一串大圆球（红、黄、蓝、黄、蓝），每颗直径约身体宽的 0.18，末端是黄蓝色爪手。
 *   翅膀：胳膊下面平滑的黑色扇形，收到身体两侧下方。
 *   腿：两条粗腿（黄蓝相间带小刺），脚是很大的黄色圆环（直径约身体宽的 0.27）。
 * Charlie 的回答：一半时间在天上飞，要落地休息，每次最多飞 3 到 4 秒；用手打上勾拳。
 * 质感：毛毡布料、蜡笔纹、缝线、褶皱阴影、圆球的毛边。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#1b1414';
const RED='#d8332c', YEL='#f2cf2a', BLUE='#38a9df';
const SHL=[-64,-66];                                    // 左胳膊/翅膀根部（转轴）
const HANDL=[-206,-44];
const HIPS=[[-52,94],[52,94]];
// 胳膊上的圆球：x, y, r, 颜色（从身体往外）
const BALLS=[[-80,-80,22,RED],[-117,-88,17,YEL],[-149,-82,16,BLUE],[-175,-70,15,YEL],[-195,-56,13,BLUE]];

function wing(P,s){
  const id=s>0?'wR':'wL', m=pts=>pts.map(([x,y])=>[-x*s,y]);     // 点按左边写，右边镜像
  const cape=organic(m([[-66,-66],[-110,-76],[-150,-70],[-192,-50],[-180,-14],[-156,26],[-124,58],[-88,86],[-66,66],[-60,0]]),1.8,500+s,{sub:2});
  let folds=''; for(const [x,y] of [[-170,-20],[-140,22],[-108,58]]) folds+=`M${66*s},-56 Q${f1(-(x*0.5-30)*s)},${f1(y*0.4-36)} ${-x*s},${y}`;
  let balls='';
  BALLS.forEach(([x,y,r,c],i)=>{ const X=-x*s;
    balls+=`<path d="${organic(ring(X,y,r,r*0.94,11),1.4,520+i+s*10)}" fill="${c}" stroke="${OUT}" stroke-width="1.8"/>
      ${scratches(525+i+s*10,X-r*0.7,y-r*0.7,r*1.4,r*1.4,10,r*0.4,'#000',0.8,0.18,-0.6)}
      <ellipse cx="${f1(X-r*0.3*-s)}" cy="${f1(y-r*0.35)}" rx="${f1(r*0.32)}" ry="${f1(r*0.22)}" fill="#fff" opacity=".28"/>`; });
  // 爪手：黄蓝相间的四根爪，朝外朝下
  let claw='';
  for(let i=0;i<4;i++){ const a=-0.5+i*0.42, L=24-i*1.5, [cx,cy]=HANDL;
    const ex=cx-Math.cos(a)*L, ey=cy+Math.sin(a)*L+8;
    const p=[[cx+2,cy-5],[(cx+ex)/2-3,(cy+ey)/2-5],[ex,ey],[(cx+ex)/2+3,(cy+ey)/2+3],[cx+3,cy+5]];
    claw+=`<path d="${organic(m(p),0.8,540+i+s)}" fill="${i%2?BLUE:YEL}" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>`; }
  return `<g id="${P}-${id}">
    <clipPath id="${P}-${id}c"><path d="${cape}"/></clipPath>
    <path d="${cape}" fill="url(#${P}-cape)" stroke="${OUT}" stroke-width="2.2"/>
    <g clip-path="url(#${P}-${id}c)">
      ${ao(P,folds,6,0.5)}
      <path d="${folds}" stroke="#4a4a52" stroke-width="1.2" fill="none" opacity=".5"/>
      ${scratches(530+s,s>0?56:-200,-80,150,170,46,10,'#5a5a64',0.8,0.4,1.1*s)}
    </g>
    <g id="${P}-${id}h">${claw}</g>
    ${balls}
  </g>`;
}

function leg(P,i,s){
  // 粗腿：从身体底下伸出，黄蓝相间三节，带小刺；末端是大圆环脚
  const [hx,hy]=HIPS[i], fx=hx+s*42, fy=168, n=3, R=rng(700+i);
  const dx=(fx-hx)/n, dy=(fy-hy)/n, L=Math.hypot(dx,dy), nx=-dy/L, ny=dx/L; let segs='';
  for(let k=0;k<n;k++){ const ax=hx+dx*k, ay=hy+dy*k, w=13-k;
    const p=[[ax+nx*w,ay+ny*w],[ax+dx+nx*(w-1),ay+dy+ny*(w-1)],[ax+dx-nx*(w-1),ay+dy-ny*(w-1)],[ax-nx*w,ay-ny*w]];
    segs+=`<path d="${organic(p,1,710+i*10+k)}" fill="${k%2?BLUE:YEL}" stroke="${OUT}" stroke-width="1.8"/>`;
    for(const sd of [1,-1]){ const sx=ax+dx*0.5+nx*w*sd, sy=ay+dy*0.5+ny*w*sd, l=9+R()*5;
      segs+=`<path d="M${f1(sx-dx*0.18)},${f1(sy-dy*0.18)}L${f1(sx+nx*l*sd+dx*0.25)},${f1(sy+ny*l*sd+dy*0.25)}L${f1(sx+dx*0.18)},${f1(sy+dy*0.18)}Z" fill="${k%2?YEL:BLUE}" stroke="${OUT}" stroke-width="1.1"/>`; } }
  const cx=fx+s*4, cy=fy+4;
  return `<g id="${P}-g${i}">${segs}
    <path d="${organic(ring(cx,cy,23,20,12),1.4,730+i)}" fill="${YEL}" stroke="${OUT}" stroke-width="2"/>
    <path d="M${f1(cx-s*18)},${f1(cy+10)} Q${f1(cx)},${f1(cy+24)} ${f1(cx+s*18)},${f1(cy+10)} L${f1(cx+s*12)},${f1(cy+6)} Q${f1(cx)},${f1(cy+14)} ${f1(cx-s*12)},${f1(cy+6)}Z" fill="${BLUE}" stroke="${OUT}" stroke-width="1.2"/>
    <path d="${organic(ring(cx,cy,12,10,10),1,740+i)}" fill="#5fb84a" stroke="#2f6b28" stroke-width="2"/>
    <path d="${organic(ring(cx,cy,6,5,8),0.6,745+i)}" fill="#f6efc0" stroke="${OUT}" stroke-width="1"/>
    ${scratches(750+i,cx-20,cy-18,40,36,14,6,'#a07e10',0.8,0.4)}
  </g>`;
}

function markup(P){
  const BODY=organic(ring(0,0,86,110,18),2,600);
  // 斜条纹：红底上几条倾斜的黄色宽带
  const R=rng(610); let bands='';
  for(const [y,h] of [[-96,20],[-46,24],[6,24],[58,22]]){
    const pts=[]; for(let i=0;i<=8;i++){ const x=-100+i*25; pts.push([x,y-x*0.28+Math.sin(i*0.9)*4+R()*3]); }
    for(let i=8;i>=0;i--){ const x=-100+i*25; pts.push([x,y+h-x*0.28+Math.sin(i*0.9+1)*4+R()*3]); }
    bands+=`<path d="${organic(pts,1.4,620+y,{sub:1})}" fill="${YEL}"/>`; }
  const crayon=scratches(640,-86,-110,172,220,100,14,'#7a1410',0.9,0.3,-0.5)+scratches(641,-86,-110,172,220,60,12,'#fff3a0',0.8,0.22,-0.5);
  // 脖子：从椭圆顶上竖着下来，左红右黄
  const neckL=organic([[-48,-118],[-10,-120],[-4,-16],[-34,-14]],1.2,645,{sub:2});
  const neckR=organic([[-10,-120],[24,-118],[27,-18],[-4,-16]],1.2,646,{sub:2});
  const face=organic([[-33,-16],[0,-19],[30,-19],[33,28],[29,60],[14,77],[-10,80],[-27,67],[-33,30]],1.4,650,{sub:2});
  const hatY=organic([[-29,-15],[-3,-19],[-8,-78]],0.8,660);
  const hatBL=organic([[-34,-12],[-29,8],[-62,-26]],0.8,661), hatBR=organic([[25,-19],[32,4],[54,-46]],0.8,662);
  const hatBM=organic([[-2,-19],[24,-19],[12,-36]],0.6,663);
  const stitches=[...Array(5)].map((_,i)=>{ const x=6+i*4.5; return `M${f1(x)},${f1(73-i*1.2)}l1,6`; }).join('');
  let dots=''; for(let i=0;i<7;i++){ const x=-42+i*14, y=98-Math.abs(x)*0.12; dots+=`<rect x="${f1(x-3)}" y="${f1(y-2)}" width="6" height="4" rx="1" fill="${OUT}" transform="rotate(${f1(x*0.4)} ${f1(x)} ${f1(y)})"/>`; }
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.6,grain:0.2,grainF:0.42,rim:0.42,seed:11})}
  <clipPath id="${P}-bc"><path d="${BODY}"/></clipPath>
  <linearGradient id="${P}-cape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a40"/><stop offset=".6" stop-color="#1e1e22"/><stop offset="1" stop-color="#101012"/></linearGradient>
  <radialGradient id="${P}-shade" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a0a08" stop-opacity=".45"/></radialGradient>
  <radialGradient id="${P}-mask" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fbf8f0"/><stop offset=".75" stop-color="#e4ddce"/><stop offset="1" stop-color="#b9b0a0"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="192" rx="110" ry="10" fill="rgba(0,0,0,.28)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-legs">${leg(P,0,-1)}${leg(P,1,1)}</g>
  <g id="${P}-wL">${wing(P,-1)}</g><g id="${P}-wR">${wing(P,1)}</g>
  <path d="${BODY}" fill="${RED}"/>
  <g clip-path="url(#${P}-bc)">${bands}${crayon}
    <path d="${neckL}" fill="${RED}" stroke="${OUT}" stroke-width="1.6"/>
    <path d="${neckR}" fill="${YEL}" stroke="${OUT}" stroke-width="1.6"/>
    ${scratches(647,-46,-118,70,100,30,12,'#000',0.8,0.15,Math.PI/2)}
    ${ao(P,'M-34,-14 Q0,-10 27,-18',8,0.4)}
    <path d="${BODY}" fill="url(#${P}-shade)"/>
  </g>
  <path d="${BODY}" fill="none" stroke="${OUT}" stroke-width="2.6"/>
  ${dots}
  <g id="${P}-face">
    <path d="${hatBL}" fill="${BLUE}" stroke="${OUT}" stroke-width="1.5"/>
    <path d="${hatBR}" fill="${BLUE}" stroke="${OUT}" stroke-width="1.5"/>
    <path d="${hatY}" fill="${YEL}" stroke="${OUT}" stroke-width="1.5"/>
    <path d="${hatBM}" fill="${BLUE}" stroke="${OUT}" stroke-width="1.3"/>
    <path d="${face}" fill="url(#${P}-mask)" stroke="${OUT}" stroke-width="2"/>
    ${scratches(670,-30,-14,60,90,18,6,'#a89c86',0.7,0.45)}
    <path d="${organic(ring(-18,11,6.5,8.5,8),0.6,672)}" fill="${BLUE}" stroke="${OUT}" stroke-width="1.3"/>
    <path d="${organic(ring(15,5,6.5,8.5,8),0.6,673)}" fill="${BLUE}" stroke="${OUT}" stroke-width="1.3"/>
    <g id="${P}-pupils"><circle cx="-17" cy="13" r="2" fill="${OUT}" opacity=".7"/><circle cx="16" cy="7" r="2" fill="${OUT}" opacity=".7"/></g>
    <path d="M-8,29 L-2,40 L-14,40Z" fill="${BLUE}" stroke="${OUT}" stroke-width="1.2"/>
    <path d="${organic([[8,25],[20,25],[21,31],[8,31]],0.5,674)}" fill="${OUT}"/>
    <circle cx="-17" cy="49" r="2.2" fill="${OUT}"/>
    <g id="${P}-mouth"><path d="M-8,53 L18,48 L14,76Z" fill="#170f0f" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/></g>
    <path d="M30,62 L37,64 L34,84 L28,70Z" fill="${BLUE}" stroke="${OUT}" stroke-width="1.1"/>
    <path d="${stitches}" stroke="${OUT}" stroke-width="1.3"/>
  </g>
</g></g></g>`;
}

function bind(svg,P){
  const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','wL','wR','wLh','wRh','legs','face','mouth','pupils','shadow','flip']) el[k]=q(k);
  el.g=[0,1].map(i=>q('g'+i));
  return el;
}

/* ---- 姿态 ---- */
const BASE={bobY:0,rot:0,wL:0,wR:0,wsc:1,hand:0,g0:0,g1:0,face:0,mouth:1,dY:0,sq:1,alpha:1,flash:0,eyeX:0,shadow:1};
const ATTACK=[                                          // 上勾拳：爪手先压低，再猛地往上挥
  [0,{}],
  [0.35,{wL:-26,wR:26,hand:-30,bobY:6,sq:0.94,rot:-4,mouth:1.3}],
  [0.52,{wL:40,wR:-40,hand:40,bobY:-12,sq:1.05,rot:5,mouth:1.7}],
  [0.7,{wL:16,wR:-16,hand:12,bobY:-4}],
  [1,{}],
];
const DIE=[
  [0,{}],
  [0.1,{flash:1,bobY:-10,wL:30,wR:-30,mouth:1.8}],
  [0.45,{dY:16,rot:-60,wL:-40,wR:10,sq:0.8,mouth:1.4,shadow:0.6}],
  [0.8,{dY:22,rot:-75,wL:-50,wR:20,sq:0.72,alpha:0.8,shadow:0.5}],
  [1,{dY:22,rot:-75,wL:-50,wR:20,sq:0.72,alpha:0,shadow:0.4}],
];

function pose(anim,p){
  const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){
    o.bobY=Math.sin(w)*2; o.wL=Math.sin(w)*5; o.wR=-Math.sin(w)*5; o.eyeX=Math.sin(w)*1.5;
    o.g0=Math.sin(w)*3; o.g1=-Math.sin(w)*3;
  } else if(anim==='walk'){                             // 地上：两条腿一跳一跳地快走，翅膀半收
    const s=Math.sin(w), h=Math.abs(s);
    o.bobY=-h*9; o.rot=s*4; o.sq=1-(1-h)*0.06;
    o.wL=-8+s*8; o.wR=8+s*8;
    o.g0=s*18; o.g1=s*18;
  } else if(anim==='fly'){                              // 天上：翅膀大幅扇动，腿垂着晃
    const s=Math.sin(w);
    o.wL=s*28; o.wR=-s*28; o.wsc=1-Math.max(0,-s)*0.18;
    o.bobY=-s*6; o.rot=Math.sin(w*0.5)*3;
    o.g0=10+s*6; o.g1=-10-s*6; o.shadow=0.55;
  } else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o;
}
function hit(o,k){ o.flash=k; o.bobY-=4*k; o.mouth+=0.6*k; o.wL+=10*k; o.wR-=10*k; }

function apply(el,o){
  const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,192) scale(1,${o.sq.toFixed(3)}) translate(0,-192)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)}) rotate(${f1(o.rot)} 0 40)`);
  S(el.wL,`rotate(${f1(o.wL)} ${SHL}) translate(${SHL}) scale(1,${o.wsc.toFixed(3)}) translate(${-SHL[0]},${-SHL[1]})`);
  S(el.wR,`rotate(${f1(o.wR)} ${-SHL[0]},${SHL[1]}) translate(${-SHL[0]},${SHL[1]}) scale(1,${o.wsc.toFixed(3)}) translate(${SHL[0]},${-SHL[1]})`);
  S(el.wLh,`rotate(${f1(-o.hand)} ${HANDL})`); S(el.wRh,`rotate(${f1(o.hand)} ${-HANDL[0]},${HANDL[1]})`);
  el.g.forEach((g,i)=>S(g,`rotate(${f1(o['g'+i])} ${HIPS[i]})`));
  S(el.mouth,`translate(4,52) scale(1,${o.mouth.toFixed(3)}) translate(-4,-52)`);
  S(el.pupils,`translate(${f1(o.eyeX)},0)`);
  el.shadow.setAttribute('rx',f1(110*o.shadow*(0.5+0.5*o.alpha))); el.shadow.setAttribute('ry',f1(10*o.shadow));
}

window.CHARS.clownMan={
  name:'小丑怪', nameEn:'Clown-man',
  source:'clown-man/concept-source/page01d.jpg',
  viewBox:[-245,-205,490,410], foot:[0,192], center:[0,10], top:-112, flipX:0, gameH:57,
  anims:{
    idle:  {dur:2.2, frames:16},
    walk:  {dur:0.42, frames:10},
    fly:   {dur:0.36, frames:10},
    attack:{dur:0.55, frames:12},
    die:   {dur:1.4, frames:20, loop:false, hold:0.6},
    hit:   {dur:0.3, overlay:true},
  },
  markup, bind, pose, hit, apply,
};
})();
