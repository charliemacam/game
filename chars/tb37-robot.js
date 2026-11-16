/* TB-37 机器人 TB-37 Robot（Charlie 原画：character-design/tb37-robot/）
 * 比例按原画量过（原画 1 像素 ≈ 0.5 单位，身体宽 218、高 178）：
 *   头：顶上半圆、两边直的「子弹形」，宽约身体的 0.4，大半露在身体上面；金色电路头顶、橙色怒眼、红圆鼻、橙色咧嘴。
 *   身体：比高略宽的黑色方块，下面垂一块两角尖尖、中间凹进去的黑布。
 *   肩箱：竖长的灰白方块，压在身体上角；下面一条白色侧柱连到胯部。
 *   手臂：挂在肩箱外侧，黑色横杆连过去；灰色臂柱两侧都有红刺，刺尖朝外朝下。
 *   胯部：粉色大舱体，压在身体下侧角，底下一圈加宽的黄箍。
 *   腿：上段是粗的纺锤形大腿，两侧各一个小爪；下段是短而直的小腿；宽大的平板脚。
 * Charlie 的回答：护甲 ∞（只有魔法能打伤），毒液的时长和伤害先定临时值再调。
 * 质感：金属拉丝、刮痕、边角磨损、关节处油污与锈迹；轮廓不追求完美直线。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#141317';
const box=(x,y,w,h,c)=>{ c=c??3; return [[x+c,y],[x+w-c,y],[x+w,y+c],[x+w,y+h-c],[x+w-c,y+h],[x+c,y+h],[x,y+h-c],[x,y+c]]; };
const mir=(pts,s)=>s>0?pts.map(([x,y])=>[-x,y]):pts;      // 左侧画好，右侧镜像

const SH=[-148,-98], HIP=[-102,114];                      // 左臂、左腿的转轴

function arm(P,s){
  const R=rng(s>0?31:17), rx=x=>f1(s>0?-x:x);
  const bar=organic(mir(box(-190,-106,46,14,3),s),1,40+s);
  const cap=organic(mir(ring(-176,-96,15,10,10),s),1,41+s);
  const col=organic(mir(box(-188,-96,26,120,4),s),1.3,42+s);
  // 红刺：两侧都有，刺尖朝外、朝下（像倒着长的叶子）
  let spikes='';
  const leaf=(x0,y0,dir,L,i)=>{ const tx=x0+dir*L*0.72, ty=y0+L*0.7;
    const p=[[x0,y0-6],[x0+dir*L*0.45,y0-2+L*0.15],[tx,ty],[x0+dir*L*0.2,y0+L*0.35],[x0,y0+5]];
    return `<path d="${organic(mir(p,s),0.8,60+i+s*7)}" fill="url(#${P}-red)" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M${rx(x0+dir*2)},${f1(y0)}L${rx(tx-dir*4)},${f1(ty-4)}" stroke="#ff9d8c" stroke-width="1" opacity=".55"/>`; };
  [[-62,0],[-38,0],[-14,0]].forEach(([y],i)=>spikes+=leaf(-188,y+R()*4,-1,26+R()*6,i));
  [[-52,0],[-6,0]].forEach(([y],i)=>spikes+=leaf(-162,y+R()*4,1,24+R()*6,i+5));
  let fingers='';
  for(let i=0;i<4;i++){ const x=-200+i*8, p=[[x,40],[x+7,40],[x+7,52],[x+3,56],[x,51]];
    fingers+=`<path d="${organic(mir(p,s),0.5,70+i+s)}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="1.3"/>`; }
  const hand=organic(mir(box(-202,18,32,25,4),s),1,80+s);
  return `<g id="${P}-${s>0?'aR':'aL'}">
    <path d="${bar}" fill="url(#${P}-dark)" stroke="${OUT}" stroke-width="2"/>
    ${spikes}
    <path d="${col}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="2"/>
    ${scratches(90+s,s>0?162:-188,-90,26,108,16,10,'#5d5d60',0.8,0.55,Math.PI/2)}
    <path d="M${rx(-182)},-90 L${rx(-182)},20" stroke="#fff" stroke-width="1.5" opacity=".3"/>
    <path d="${cap}" fill="#1d1d21" stroke="${OUT}" stroke-width="1.8"/>
    ${ao(P,`M${rx(-178)},10 L${rx(-178)},20`,10,0.45)}
    ${fingers}
    <path d="${hand}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="2"/>
    <path d="M${rx(-198)},26 L${rx(-174)},26" stroke="#6a6a6a" stroke-width="1.2"/>
  </g>`;
}

// 芯片：金色电路板 + 走线 + 中间一块黑色集成块，两边一排银色引脚
function chip(x,y,w,h,seed,ic){
  const R=rng(seed); let tr='';
  for(let i=0;i<Math.round(w*h/60);i++){ const px=x+2+R()*(w-4), py=y+2+R()*(h-4), l=3+R()*6;
    tr+=R()<0.5?`M${f1(px)},${f1(py)}h${f1(l)}v${f1(R()*4)}`:`M${f1(px)},${f1(py)}v${f1(l)}h${f1(R()*4)}`; }
  let dots=''; for(let i=0;i<Math.round(w*h/90);i++) dots+=`<circle cx="${f1(x+3+R()*(w-6))}" cy="${f1(y+3+R()*(h-6))}" r=".9" fill="#7a5c10"/>`;
  let icS=''; if(ic){ const [ix,iy,iw,ih]=ic; let pins='';
    for(let k=0;k<Math.floor(ih/4);k++){ const py=iy+2+k*4; pins+=`M${ix-3},${py}h3M${ix+iw},${py}h3`; }
    for(let k=0;k<Math.floor(iw/4);k++){ const px=ix+2+k*4; pins+=`M${px},${iy-3}v3M${px},${iy+ih}v3`; }
    icS=`<path d="${pins}" stroke="#d8d8d4" stroke-width="1.4"/><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="1" fill="#1d1d21" stroke="#000" stroke-width=".8"/>
      <circle cx="${ix+2.5}" cy="${iy+2.5}" r="1" fill="#555"/><path d="M${ix+2},${iy+ih*0.6}h${iw-4}" stroke="#3a3a40" stroke-width=".8"/>`; }
  return `<path d="${tr}" stroke="#8a6a14" stroke-width="1" fill="none"/>${dots}${icS}`;
}
// 冒烟：一串灰白色的烟团（i 是第几串，动画里往上飘）
function smoke(P,i,x,y){ let d='';
  for(let k=0;k<4;k++) d+=`<ellipse class="pf" cx="${x}" cy="${y}" rx="6" ry="5" fill="#d9d9d6" stroke="#9a9a96" stroke-width=".8" opacity=".8"/>`;
  return `<g id="${P}-smk${i}" data-x="${x}" data-y="${y}">${d}</g>`; }

function shoulder(P,s){
  const rx=x=>f1(s>0?-x:x);
  const b=organic(mir(box(-148,-128,50,74,5),s),1.3,100+s);
  let holes='';
  for(const y of [-112,-95,-78]) holes+=`<ellipse cx="${rx(-123)}" cy="${y}" rx="6" ry="5.4" fill="#2a2a2e" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M${rx(-127)},${y-1.5}a4,4 0 0 1 ${s>0?-7:7},0" stroke="#e8e8e2" stroke-width="1" fill="none" opacity=".5"/>`;
  return `<path d="${b}" fill="url(#${P}-shs)" stroke="${OUT}" stroke-width="2.2"/>
    ${scratches(110+s,s>0?100:-146,-124,46,66,12,7,'#7c7c78',0.7,0.5)}
    <path d="M${rx(-144)},-58 L${rx(-102)},-58" stroke="#000" stroke-width="2" opacity=".18"/>
    ${holes}`;
}

function leg(P,s){
  const rx=x=>f1(s>0?-x:x);
  const shin=organic(mir(box(-113,150,22,82,2),s),0.8,120+s);
  const thigh=organic(mir([[-122,114],[-82,114],[-77,140],[-80,170],[-90,200],[-102,207],[-114,200],[-124,170],[-127,140]],s),1.2,122+s);
  const foot=organic(mir([[-136,228],[-68,228],[-64,240],[-68,251],[-138,251],[-141,240]],s),1.2,124+s);
  const claw=(x,y,dir)=>`<path d="${organic(mir([[x,y-4],[x+dir*10,y],[x+dir*15,y+10],[x+dir*9,y+6],[x+dir*4,y+10],[x,y+5]],s),0.5,130+x+s)}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="1.3"/>`;
  return `<g id="${P}-${s>0?'lR':'lL'}">
    <path d="${shin}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="2"/>
    <path d="M${rx(-106)},156 L${rx(-106)},228" stroke="#fff" stroke-width="1.6" opacity=".25"/>
    ${scratches(140+s,s>0?91:-113,160,22,66,8,6,'#5d5d60',0.7,0.5,Math.PI/2)}
    <path d="${thigh}" fill="url(#${P}-thigh)" stroke="${OUT}" stroke-width="2.2"/>
    <path d="M${rx(-114)},122 Q${rx(-118)},160 ${rx(-104)},200 M${rx(-90)},122 Q${rx(-84)},160 ${rx(-98)},200" stroke="#2c2c30" stroke-width="1.6" fill="none" opacity=".7"/>
    ${scratches(141+s,s>0?80:-124,120,44,80,14,9,'#3d3d42',0.8,0.5,Math.PI/2)}
    ${claw(-119,184,-1)}${claw(-85,184,1)}
    ${ao(P,`M${rx(-118)},229 L${rx(-86)},229`,8,0.5)}
    <path d="${foot}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="2.2"/>
    <path d="M${rx(-133)},233 L${rx(-70)},233" stroke="#fff" stroke-width="1.4" opacity=".3"/>
    ${scratches(150+s,s>0?68:-136,236,66,12,8,7,'#55554f',0.7,0.5,0)}
  </g>`;
}

function pod(P,s){                                  // 粉色胯部舱体 + 加宽的黄箍
  const rx=x=>f1(s>0?-x:x);
  const shell=organic(mir(box(-150,-2,56,96,8),s),1.3,160+s);
  const win=organic(mir(box(-146,28,22,62,4),s),1,162+s);
  const band=organic(mir(box(-152,90,74,24,4),s),1,164+s);
  const R=rng(170+s); let circ='';
  for(let i=0;i<7;i++){ const y=33+i*8, x=-143+R()*6, w=3+R()*6;
    circ+=`M${rx(x)},${f1(y)}h${s>0?-w:w}v${f1(3+R()*3)}`; }
  return `<path d="${shell}" fill="url(#${P}-pink)" stroke="${OUT}" stroke-width="2.2"/>
    <path d="${win}" fill="#e2bd3c" stroke="${OUT}" stroke-width="1.5"/>
    ${chip(s>0?124:-146,28,22,62,166+s,[s>0?130:-140,44,10,28])}
    ${scratches(175+s,s>0?94:-150,0,56,90,12,10,'#9a4d6a',0.9,0.35,Math.PI/2)}
    ${ao(P,`M${rx(-148)},88 L${rx(-96)},88`,6,0.4)}
    <path d="${band}" fill="#f0cf2c" stroke="${OUT}" stroke-width="2"/>
    ${scratches(178+s,s>0?78:-152,93,74,18,10,7,'#a07e10',0.8,0.6,0)}`;
}

function head(P){
  // 子弹形：顶上半圆，两边几乎直，底边略收
  const pts=[]; for(let i=0;i<=8;i++){ const a=Math.PI+i/8*Math.PI; pts.push([Math.cos(a)*44, -124+Math.sin(a)*44]); }
  pts.push([43,-104],[41,-86],[0,-84],[-41,-86],[-43,-104]);
  const shape=organic(pts,1.3,200,{sub:1});
  const capPts=[]; for(let i=0;i<=8;i++){ const a=Math.PI*1.12+i/8*Math.PI*0.76; capPts.push([Math.cos(a)*44, -124+Math.sin(a)*44]); }
  for(let i=8;i>=0;i--){ const a=Math.PI*1.12+i/8*Math.PI*0.76; capPts.push([Math.cos(a)*36, -118+Math.sin(a)*36]); }
  const cap=organic(capPts,0.8,202,{sub:1});
  // 头分三部分：最上面是芯片，中间是眼睛和鼻子，下面是嘴巴那一块
  return `<g id="${P}-head"><g transform="translate(0,-12)">
    <clipPath id="${P}-headc"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="url(#${P}-face)"/>
    <g clip-path="url(#${P}-headc)">
      <rect x="-50" y="-175" width="100" height="38" fill="#e2bd3c"/>
      ${chip(-44,-172,88,34,206,[-13,-160,26,14])}
      <rect x="-50" y="-102" width="100" height="22" fill="#a8a8a2"/>
      ${scratches(209,-44,-101,88,16,10,6,'#6e6e6a',0.7,0.5,0)}
      <path d="M-50,-137 H50 M-50,-102 H50" stroke="${OUT}" stroke-width="1.8"/>
      <path d="M-50,-135.5 H50" stroke="#fff" stroke-width="1" opacity=".4"/>
      <circle cx="-36" cy="-92" r="1.8" fill="#55554f"/><circle cx="36" cy="-92" r="1.8" fill="#55554f"/>
    </g>
    <path d="${shape}" fill="none" stroke="${OUT}" stroke-width="2.2"/>
    ${scratches(208,-38,-148,76,56,14,7,'#9b9b95',0.7,0.45)}
    <path d="M-34,-128 L-12,-122 M34,-128 L12,-122" stroke="${OUT}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="${organic([[-34,-128],[-12,-122],[-14,-115],[-32,-118]],0.6,210)}" fill="#e8742a" stroke="${OUT}" stroke-width="1.2"/>
    <path d="${organic([[34,-128],[12,-122],[14,-115],[32,-118]],0.6,211)}" fill="#e8742a" stroke="${OUT}" stroke-width="1.2"/>
    <circle cx="-22" cy="-120" r="2" fill="${OUT}"/><circle cx="22" cy="-120" r="2" fill="${OUT}"/>
    <path d="${organic(ring(0,-113,8,7.5,9),0.6,212)}" fill="url(#${P}-nose)" stroke="${OUT}" stroke-width="1.4"/>
    <ellipse cx="-3" cy="-116" rx="2.6" ry="1.6" fill="#fff" opacity=".6"/>
    <path id="${P}-mouth" d="" stroke="${OUT}" stroke-width="1.4" fill="#e3712a"/>
  </g></g>`;
}

function markup(P){
  const body=organic(box(-109,-98,218,178,7),1.6,300);
  const skirt=organic([[-30,76],[30,76],[34,104],[38,133],[18,120],[0,112],[-18,120],[-38,133],[-34,104]],1.4,302,{sub:2});
  const R=rng(305); let crayon='';
  for(let i=0;i<30;i++){ const y=-92+i*5.8+R()*2, x=-104+R()*12, w=180+R()*24; crayon+=`M${f1(x)},${f1(y)}l${f1(w)},${f1((R()-0.5)*4)}`; }
  const seams='M-109,-40 L109,-40 M-109,40 L109,40';
  let rivets=''; for(const [x,y] of [[-98,-88],[98,-88],[-98,-46],[98,-46],[-98,70],[98,70],[0,-88]])
    rivets+=`<circle cx="${x}" cy="${y}" r="2.6" fill="#3d3d44" stroke="#0d0d10" stroke-width=".8"/><circle cx="${x-0.8}" cy="${y-0.9}" r=".9" fill="#9a9aa2"/>`;
  const grime=[[-96,70,18,9],[92,66,16,8],[-60,-94,14,5],[40,74,22,7]].map(([x,y,rx,ry])=>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#6d4a26" opacity=".35" filter="url(#${P}-tex-soft)"/>`).join('');
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.2,grain:0.15,grainF:0.3,rim:0.45,seed:7})}
  <linearGradient id="${P}-dark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e1e23"/><stop offset=".45" stop-color="#3a3a42"/><stop offset="1" stop-color="#18181c"/></linearGradient>
  <linearGradient id="${P}-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d8d8a"/><stop offset=".4" stop-color="#d4d4cf"/><stop offset="1" stop-color="#7b7b78"/></linearGradient>
  <linearGradient id="${P}-thigh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e6e70"/><stop offset=".45" stop-color="#b9b9b6"/><stop offset="1" stop-color="#5f5f62"/></linearGradient>
  <linearGradient id="${P}-shs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ececE6"/><stop offset="1" stop-color="#a9a9a3"/></linearGradient>
  <linearGradient id="${P}-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2392f"/><stop offset="1" stop-color="#8e1414"/></linearGradient>
  <linearGradient id="${P}-pink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c46a8e"/><stop offset=".45" stop-color="#f0a3c0"/><stop offset="1" stop-color="#b65a7e"/></linearGradient>
  <radialGradient id="${P}-face" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f4f3ee"/><stop offset=".7" stop-color="#d2d2cc"/><stop offset="1" stop-color="#9c9c96"/></radialGradient>
  <radialGradient id="${P}-nose" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ff5a4a"/><stop offset="1" stop-color="#a5100e"/></radialGradient>
  <linearGradient id="${P}-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2e34"/><stop offset=".75" stop-color="#1d1d21"/><stop offset="1" stop-color="#121214"/></linearGradient>
  <radialGradient id="${P}-goo" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#4b5a34"/><stop offset=".6" stop-color="#1c2214"/><stop offset="1" stop-color="#0a0c08"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="250" rx="150" ry="12" fill="rgba(0,0,0,.28)"/>
<g id="${P}-puddle" opacity="0"><path d="${organic(ring(0,250,60,11,12),3,320)}" fill="url(#${P}-goo)"/></g>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  ${leg(P,-1)}${leg(P,1)}
  <g id="${P}-torso">
    ${head(P)}
    <path d="${skirt}" fill="#1a1a1e" stroke="${OUT}" stroke-width="2"/>
    ${scratches(301,-34,80,68,50,10,10,'#3a3a40',0.8,0.5,Math.PI/2)}
    <path d="${body}" fill="url(#${P}-body)" stroke="${OUT}" stroke-width="2.6"/>
    <path d="${crayon}" stroke="#4a4a54" stroke-width="1.1" opacity=".55" fill="none"/>
    <path d="${seams}" stroke="#0b0b0d" stroke-width="1.6" opacity=".8" fill="none"/>
    ${scratches(330,-104,-92,208,166,30,12,'#8a8a94',0.7,0.45)}
    ${grime}${rivets}
    <path d="M-104,-94 L104,-94" stroke="#8a8a96" stroke-width="2" opacity=".4"/>
    ${ao(P,'M-40,-90 Q0,-84 40,-90',12,0.5)}
    <g id="${P}-drip" opacity="0"><path d="M-4,124 Q0,114 4,124 Q6,132 0,134 Q-6,132 -4,124Z" fill="url(#${P}-goo)" stroke="#060705" stroke-width=".8"/></g>
    ${pod(P,-1)}${pod(P,1)}
    <g id="${P}-armL">${arm(P,-1)}</g><g id="${P}-armR">${arm(P,1)}</g>
    ${shoulder(P,-1)}${shoulder(P,1)}
    ${smoke(P,0,-124,-6)}${smoke(P,1,124,-6)}${smoke(P,2,-118,-130)}${smoke(P,3,118,-130)}
  </g>
</g></g></g>
<g id="${P}-fx"></g>`;
}

function bind(svg,P){
  const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','torso','head','armL','armR','lL','lR','mouth','shadow','flip','puddle','drip']) el[k]=q(k);
  el.smk=[0,1,2,3].map(i=>{ const g=q('smk'+i); return {x:+g.dataset.x, y:+g.dataset.y, pf:[...g.querySelectorAll('.pf')]}; });
  return el;
}

/* ---- 姿态 ---- */
const BASE={smk:0,bobY:0,rot:0,head:0,headY:0,aL:0,aR:0,lfL:0,lfR:0,rlL:0,rlR:0,dY:0,sq:1,alpha:1,flash:0,mouth:0,drip:0,puddle:0,headFall:0,tilt:0};
const ATTACK=[                                         // 两臂抬起，重重砸下（慢）
  [0,{}],
  [0.4,{aL:38,aR:-38,bobY:-6,head:-6,mouth:1}],
  [0.55,{aL:-14,aR:14,bobY:6,head:4,sq:0.97,mouth:1}],
  [0.7,{aL:-8,aR:8,bobY:3}],
  [1,{}],
];
const SPIT=[                                           // 远程：仰头再前探，吐出一团毒液
  [0,{}],
  [0.35,{head:-10,headY:-4,bobY:-3,mouth:1,aL:6,aR:-6}],
  [0.55,{head:8,headY:5,bobY:2,mouth:1.4,drip:1}],
  [1,{drip:0}],
];
const FALL={headY:280,headFall:1.3,head:80,dY:20,sq:0.85,aL:-26,aR:26,tilt:-8};
const DIE=[
  [0,{}],
  [0.12,{flash:1,head:-12,headY:-10,aL:20,aR:-20}],
  [0.4,{...FALL,alpha:1,flash:0.4}],
  [0.75,{...FALL,alpha:0.85}],
  [1,{...FALL,alpha:0}],
];

function pose(anim,p){
  const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){
    o.bobY=Math.sin(w*2)*1.2; o.head=Math.sin(w)*3; o.aL=Math.sin(w)*2; o.aR=-Math.sin(w+0.6)*2;
    o.drip=Math.max(0,Math.sin(w))*0.7; o.smk=p;
  } else if(anim==='walk'){ o.smk=p;                            // 很慢、很重的踏步
    const s=Math.sin(w);
    o.lfL=Math.max(0,s)*10; o.lfR=Math.max(0,-s)*10; o.rlL=s*3; o.rlR=s*3;
    o.bobY=Math.abs(s)*-4+2; o.rot=s*0.8; o.head=-s*3; o.tilt=s*0.8;
    o.aL=-s*6; o.aR=-s*6; o.drip=(p*2)%1;
  } else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='spit') return kf(BASE,SPIT,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o;
}
function hit(o,k){ o.flash=k; o.bobY-=2*k; o.head-=6*k; }

function apply(el,o){
  const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,250) scale(1,${o.sq.toFixed(3)}) translate(0,-250)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)}) rotate(${f1(o.rot)} 0 250)`);
  S(el.torso,`rotate(${f1(o.tilt)} 0 114)`);
  S(el.head,`translate(${f1(o.headFall*-50)},${f1(o.headY)}) rotate(${f1(o.head)} 0 -90)`);
  S(el.armL,`rotate(${f1(o.aL)} ${SH})`); S(el.armR,`rotate(${f1(o.aR)} ${-SH[0]},${SH[1]})`);
  S(el.lL,`translate(0,${f1(-o.lfL)}) rotate(${f1(o.rlL)} ${HIP})`);
  S(el.lR,`translate(0,${f1(-o.lfR)}) rotate(${f1(o.rlR)} ${-HIP[0]},${HIP[1]})`);
  const mo=o.mouth*6;                                   // 橙色咧嘴（原画是一条宽宽的橙色嘴）
  el.mouth.setAttribute('d', `M-21,-100 L21,-100 L19,${f1(-95+mo)} L-19,${f1(-95+mo)}Z`);
  el.mouth.setAttribute('fill', o.mouth>0.05 ? '#5a1c0a' : '#e3712a');
  const dp=o.drip%1;
  el.drip.setAttribute('opacity', o.drip>0.02 ? (1-dp*0.6).toFixed(2) : 0);
  S(el.drip,`translate(0,${f1(dp*110)})`);
  el.puddle.setAttribute('opacity',o.puddle.toFixed(2));
  // 烟往上飘、变大、变淡（肩箱和胯部之间那一串飘得短一些，免得挡住肩箱）
  el.smk.forEach((g,i)=>g.pf.forEach((c,k)=>{ const t=(o.smk*(i<2?2:1)+k/4)%1, rise=i<2?40:46;
    c.setAttribute('cx',f1(g.x+Math.sin(t*6+k)*3*(i%2?-1:1))); c.setAttribute('cy',f1(g.y-t*rise));
    c.setAttribute('rx',f1(5+t*7)); c.setAttribute('ry',f1(4+t*6)); c.setAttribute('opacity',(0.85*(1-t)*o.alpha).toFixed(2)); }));
  const sh=0.5+0.5*o.alpha; el.shadow.setAttribute('rx',f1(140*sh));
}

window.CHARS.tb37Robot={
  name:'TB-37 机器人', nameEn:'TB-37 Robot',
  source:'tb37-robot/concept-source/page01c.jpg',
  viewBox:[-235,-200,470,470], foot:[0,250], center:[0,-20], top:-172, flipX:0, gameH:66,
  anims:{
    idle:  {dur:3.0, frames:20},
    walk:  {dur:1.6, frames:16},
    attack:{dur:1.3, frames:14},
    spit:  {dur:0.9, frames:10},
    die:   {dur:1.6, frames:22, loop:false, hold:0.7},
    hit:   {dur:0.35, overlay:true},
  },
  markup, bind, pose, hit, apply,
};
})();
