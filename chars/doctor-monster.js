/* 怪物博士 Doctor Monster（Charlie 原画：character-design/doctor-monster/）
 * 比例按原画量过（原画 1 像素 ≈ 0.6 单位）：
 *   头：上窄下宽的蛋形，稍微向右歪；高约 108、宽约 70，比身体横带粗得多。黑色乱发盖住头顶，右边垂到耳朵下面。
 *     圆框眼镜在上半部；一条蓝绿色的布斜着横过脸（左高右低），下面露出嘴。
 *   背包：蓝绿色，在头后面，左右两个角向上翘，各插一根长管子。
 *     左管负责攻击，下面有一个刀形标志；右管负责治疗，下面一颗红心。
 *   身体：白大褂横着很长、略微往右下倾斜，挂「Dr Monster」名牌；左臂竖直向上举着一把大刀，
 *     右臂向右下弯，手里拿扳手；两条细长的白腿，黑鞋。
 * Charlie 的回答：从背包右上方的血量管喷出小球给附近一个单位加血（不能给自己加，但两个博士可以互相加）；
 *   刀用来打人，扳手用来修机器人；左边的管子负责攻击。
 * 质感：布料褶皱和污渍、头发一缕一缕、皮肤明暗、眼镜反光、金属刀刃和扳手。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#1d1814';
const TEAL='#2fa3b4';
const HIP_L=[-132,98], HIP_R=[114,98], SH_L=[-122,58], SH_R=[156,74];
const TUBE=[52,-28], ATK_TUBE=[-52,-34];              // 右管口（加血）、左管口（攻击）

function limb(pts,w0,w1,seed){                          // 袖子 / 裤腿：沿折线左右偏移成一条粗带
  const L=[],Rr=[], n=pts.length;
  pts.forEach((p,i)=>{ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, w=w0+(w1-w0)*i/(n-1);
    L.push([p[0]-dy/l*w, p[1]+dx/l*w]); Rr.push([p[0]+dy/l*w, p[1]-dx/l*w]); });
  return organic([...L,...Rr.reverse()],1.2,seed,{sub:2});
}
const rot=(pts,deg,cx,cy)=>{ const a=deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a);
  return pts.map(([x,y])=>[cx+(x-cx)*c-(y-cy)*s, cy+(x-cx)*s+(y-cy)*c]); };

function tube(P,x,yTop,yBase,id){                       // 长管子 + 顶上的灰色帽
  return `<g id="${P}-${id}">
    <path d="${organic([[x-5,yBase],[x-5,yTop+4],[x+5,yTop+4],[x+5,yBase]],0.6,812+x)}" fill="url(#${P}-pipe)" stroke="${OUT}" stroke-width="1.4"/>
    <path d="M${x-5},${f1((yTop+yBase)/2)} h10 M${x-5},${f1((yTop+yBase)/2+8)} h10" stroke="#6d7479" stroke-width="1"/>
    <path d="${organic(ring(x,yTop,8.5,6,9),0.6,814+x)}" fill="#9aa3a8" stroke="${OUT}" stroke-width="1.4"/>
    <circle cx="${x}" cy="${yTop}" r="3.2" fill="#2f3437"/>
  </g>`;
}

function markup(P){
  const R=rng(800);
  const torso=organic([[-142,44],[-40,68],[66,72],[150,68],[166,74],[166,98],[100,102],[0,106],[-120,112],[-144,102]],1.8,801,{sub:2});
  const legL=limb([[-132,96],[-134,140],[-138,180]],12,11,802), legR=limb([[114,96],[114,140],[118,186]],12,11,803);
  const armL=limb([[-122,60],[-122,20],[-120,-12]],15,13,804);
  const armR=limb([[156,72],[182,94],[192,136]],14,12,805);
  const shoeL=organic([[-158,176],[-122,174],[-116,186],[-160,190]],1.2,806), shoeR=organic([[104,182],[142,182],[148,194],[100,194]],1.2,807);
  const stains=[[-80,80,12,5,'#c9c0a0'],[40,90,9,4,'#c8b49a'],[-136,150,6,8,'#b9b3a0'],[116,130,5,9,'#c4bca6']].map(([x,y,rx,ry,c])=>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity=".45" filter="url(#${P}-tex-soft)"/>`).join('');
  // 背包：两个角向上翘
  const pack=organic([[-86,32],[-70,6],[-56,-2],[-42,10],[0,16],[40,18],[52,6],[66,12],[72,42],[68,86],[-82,86]],1.8,810,{sub:2});
  // 头：上窄下宽的蛋形，向右歪 10 度
  const egg=[]; for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, k=1+0.14*Math.sin(a); egg.push([-9+Math.cos(a)*39*k, 40+Math.sin(a)*58]); }
  const face=organic(rot(egg,10,-9,38),1.4,825);
  const hp=rot([[-40,26],[-42,4],[-34,-10],[-26,-14],[-20,-22],[-12,-14],[-4,-24],[4,-14],[14,-22],[18,-10],[30,-12],[32,0],[42,4],[38,18],[42,30],[36,46],[28,40],[26,22],[14,10],[-6,8],[-26,16],[-32,30]],10,-9,38);
  const hair=organic(hp.map(([x,y])=>[-9+(x+9)*1.15, 38+(y-38)*1.08]),1.2,820,{sub:1});
  const strands=scratches(822,-48,-24,94,70,40,10,'#5a5a5a',0.9,0.55,-1.3);
  const band=organic([[-66,24],[-20,30],[30,38],[66,44],[66,58],[30,54],[-20,46],[-66,40]],1.2,846,{sub:1});
  const blade=organic([[-118,-38],[-134,-32],[-156,-96],[-164,-114],[-146,-94]],0.6,830);
  const wrench=organic(rot([[150,146],[214,146],[226,136],[246,138],[248,152],[236,147],[230,156],[242,166],[226,168],[214,158],[150,158]],-14,192,150),0.8,832);
  // 左管下面的攻击标志（刀形，和 Charlie 图例里的「A」一样表示攻击）
  const atkSign=`<g transform="translate(-58,66)"><circle r="12" fill="#f2cf2a" stroke="${OUT}" stroke-width="1.4"/>
    <path d="M0,-9 L3.2,2 L0,4 L-3.2,2Z" fill="#e8eef0" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M-5.5,3.5 L5.5,3.5 M0,4 L0,9" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/></g>`;
  const heart=`<path d="${organic([[48,70],[40,60],[47,54],[52,60],[57,54],[64,60],[56,71],[52,76]],0.5,842)}" fill="#d9262c" stroke="${OUT}" stroke-width="1.2"/>`;
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.2,grain:0.13,grainF:0.36,rim:0.38,seed:5})}
  <radialGradient id="${P}-skin" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#f2c2a0"/><stop offset=".7" stop-color="#d99a74"/><stop offset="1" stop-color="#b9785a"/></radialGradient>
  <linearGradient id="${P}-coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#d8d4ca"/></linearGradient>
  <linearGradient id="${P}-teal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fc1cf"/><stop offset=".6" stop-color="${TEAL}"/><stop offset="1" stop-color="#1c6f7c"/></linearGradient>
  <linearGradient id="${P}-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d6064"/><stop offset=".5" stop-color="#d9dde0"/><stop offset="1" stop-color="#7d8186"/></linearGradient>
  <linearGradient id="${P}-pipe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f979c"/><stop offset=".45" stop-color="#e3e7ea"/><stop offset="1" stop-color="#8a9297"/></linearGradient>
  <radialGradient id="${P}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9a9a"/><stop offset=".5" stop-color="#ff3b3b" stop-opacity=".7"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient>
  <radialGradient id="${P}-glowA" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2d8ff"/><stop offset=".5" stop-color="#9b4dff" stop-opacity=".7"/><stop offset="1" stop-color="#9b4dff" stop-opacity="0"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="-10" cy="192" rx="160" ry="9" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-legL"><path d="${legL}" fill="url(#${P}-coat)" stroke="${OUT}" stroke-width="2"/>${ao(P,'M-142,118 q8,4 16,0 M-142,150 q8,5 14,0',2.5,0.28)}<path d="${shoeL}" fill="#1e1c1b" stroke="${OUT}" stroke-width="1.6"/><path d="M-156,179 L-124,177" stroke="#77736e" stroke-width="1.2" opacity=".6"/></g>
  <g id="${P}-legR"><path d="${legR}" fill="url(#${P}-coat)" stroke="${OUT}" stroke-width="2"/>${ao(P,'M106,120 q8,4 16,0 M108,154 q8,5 14,0',2.5,0.28)}<path d="${shoeR}" fill="#1e1c1b" stroke="${OUT}" stroke-width="1.6"/><path d="M106,185 L140,185" stroke="#77736e" stroke-width="1.2" opacity=".6"/></g>
  <g id="${P}-body">
    <g id="${P}-armR">
      <path d="${armR}" fill="url(#${P}-coat)" stroke="${OUT}" stroke-width="2"/>
      ${ao(P,'M166,90 q6,6 14,4 M180,118 q6,4 12,0',2.5,0.28)}
      <path d="${wrench}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="1.6"/>
      ${scratches(834,160,140,70,14,8,7,'#4b4f53',0.7,0.6,-0.25)}
      <path d="${organic(ring(192,146,11,10,9),1,836)}" fill="url(#${P}-skin)" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M184,141 q6,-3 14,0 M184,147 q6,-2 14,0 M185,153 q5,-2 12,0" stroke="#8a5238" stroke-width="1" fill="none"/>
    </g>
    <path d="${torso}" fill="url(#${P}-coat)" stroke="${OUT}" stroke-width="2.2"/>
    ${ao(P,'M-60,96 Q20,102 100,96',8,0.28)}
    ${scratches(838,-136,52,290,40,26,9,'#b8b2a4',0.8,0.5,0.1)}
    ${stains}
    <path d="M70,78 L118,78 L118,88 L70,88Z" fill="#e8e6e0" stroke="${OUT}" stroke-width="1.2" transform="rotate(4 94 83)"/>
    <path d="M74,83 h6 m3,0 h10 m3,0 h14" stroke="#555" stroke-width="1.4" transform="rotate(4 94 83)"/>
    <g id="${P}-pack">
      ${tube(P,ATK_TUBE[0],ATK_TUBE[1],4,'tubeA')}${tube(P,TUBE[0],TUBE[1],10,'tube')}
      <path d="${pack}" fill="url(#${P}-teal)" stroke="${OUT}" stroke-width="2"/>
      ${scratches(840,-80,8,146,76,46,8,'#1b6672',0.8,0.45,-0.3)}
      ${ao(P,'M-60,82 L60,82',6,0.35)}
      ${atkSign}${heart}
      <circle id="${P}-glowc" cx="${TUBE[0]}" cy="${TUBE[1]}" r="15" fill="url(#${P}-glow)" opacity="0"/>
      <circle id="${P}-glowa" cx="${ATK_TUBE[0]}" cy="${ATK_TUBE[1]}" r="15" fill="url(#${P}-glowA)" opacity="0"/>
    </g>
    <g id="${P}-head">
      ${ao(P,'M-44,80 Q-14,96 18,84',10,0.45)}
      <path d="${face}" fill="url(#${P}-skin)" stroke="${OUT}" stroke-width="2"/>
      ${scratches(844,-38,20,56,70,16,4,'#b36f50',0.7,0.35)}
      <clipPath id="${P}-hc"><path d="${hair}"/></clipPath>
      <path d="${hair}" fill="#1f1d1d" stroke="${OUT}" stroke-width="1.6"/>
      <g clip-path="url(#${P}-hc)">${strands}</g>
      <g id="${P}-eyes">
        <circle cx="-16" cy="22" r="9" fill="#fff" fill-opacity=".35" stroke="#222" stroke-width="2.4"/>
        <circle cx="11" cy="24" r="9" fill="#fff" fill-opacity=".35" stroke="#222" stroke-width="2.4"/>
        <path d="M-7,22 L2,23" stroke="#222" stroke-width="2.2"/>
        <g id="${P}-pupils"><circle cx="-15" cy="23" r="2.6" fill="${OUT}"/><circle cx="12" cy="25" r="2.6" fill="${OUT}"/></g>
        <path d="M-21,16 q3,-2 6,0 M6,18 q3,-2 6,0" stroke="#fff" stroke-width="1.6" opacity=".75" fill="none"/>
      </g>
      <path d="${band}" fill="url(#${P}-teal)" stroke="${OUT}" stroke-width="1.6"/>
      ${scratches(848,-64,30,128,22,14,8,'#1b6672',0.7,0.5,0.15)}
      <path id="${P}-grin" d="M-34,70 Q-18,74 0,66" stroke="#5a2a1a" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    <g id="${P}-armL">
      <path d="${armL}" fill="url(#${P}-coat)" stroke="${OUT}" stroke-width="2"/>
      ${ao(P,'M-134,30 q8,3 16,-2 M-134,0 q8,4 14,0',2.5,0.28)}
      <path d="${blade}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M-132,-40 L-158,-104" stroke="#fff" stroke-width="1.4" opacity=".6"/>
      <path d="M-116,-24 L-124,-42 L-136,-36 L-128,-20Z" fill="#3b2a1e" stroke="${OUT}" stroke-width="1.2"/>
      <path d="${organic(ring(-120,-16,12,11,9),1,850)}" fill="url(#${P}-skin)" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M-128,-20 q6,-3 14,0 M-128,-14 q6,-2 14,0" stroke="#8a5238" stroke-width="1" fill="none"/>
    </g>
  </g>
</g></g></g>`;
}

function bind(svg,P){
  const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','body','head','armL','armR','legL','legR','pack','tube','tubeA','glowc','glowa','pupils','grin','shadow','flip']) el[k]=q(k);
  return el;
}

/* ---- 姿态 ---- */
const BASE={bobY:0,rot:0,head:0,aL:0,aR:0,lL:0,lR:0,lfL:0,lfR:0,tube:0,glow:0,tubeA:0,glowA:0,dY:0,sq:1,alpha:1,flash:0,eyeX:0,lean:3};
const ATTACK=[                                          // 近战：举刀向下砍
  [0,{}],
  [0.35,{aL:-22,head:-4,lean:0,bobY:-3}],
  [0.55,{aL:58,head:6,lean:8,bobY:3}],
  [0.72,{aL:40,lean:6}],
  [1,{}],
];
const HEAL=[                                            // 右边的血量管一鼓，喷出一个红色小球
  [0,{}],
  [0.3,{tube:-6,glow:0.6,lean:0,bobY:-2,head:-3}],
  [0.45,{tube:4,glow:1,lean:5}],
  [1,{glow:0}],
];
const SHOOT=[                                           // 左边的攻击管一缩，射出一个紫色小球
  [0,{}],
  [0.3,{tubeA:-6,glowA:0.6,lean:1,bobY:-2,head:3}],
  [0.45,{tubeA:4,glowA:1,lean:5}],
  [1,{glowA:0}],
];
const FALL={rot:-10,dY:30,sq:0.55,aL:70,aR:24,head:28,lL:34,lR:-34,lean:8};   // 腿一软瘫下去，刀垂下
const DIE=[
  [0,{}],
  [0.12,{flash:1,bobY:-8,aL:-30,aR:-20,head:10}],
  [0.5,{...FALL}],
  [0.8,{...FALL,alpha:0.8}],
  [1,{...FALL,alpha:0}],
];

function pose(anim,p){
  const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){
    o.bobY=Math.sin(w*2)*1.2; o.head=Math.sin(w)*3; o.aL=Math.sin(w)*4; o.aR=-Math.sin(w)*3; o.eyeX=Math.sin(w)*2;
    o.glow=Math.max(0,Math.sin(w*2))*0.25;
  } else if(anim==='walk'){                             // 长腿大步走
    const s=Math.sin(w);
    o.lL=s*16; o.lR=-s*16; o.lfL=Math.max(0,s)*6; o.lfR=Math.max(0,-s)*6;
    o.bobY=-Math.abs(Math.cos(w))*5; o.rot=s*1.5; o.head=-s*4;
    o.aL=-s*8; o.aR=s*10; o.lean=5;
  } else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='heal') return kf(BASE,HEAL,p);
  else if(anim==='shoot') return kf(BASE,SHOOT,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o;
}
function hit(o,k){ o.flash=k; o.bobY-=3*k; o.head-=8*k; o.aL-=10*k; }

function apply(el,o){
  const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(-10,192) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(10,-192)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)})`);
  S(el.body,`rotate(${f1(o.lean)} 0 90)`);
  S(el.head,`rotate(${f1(o.head)} -12 86)`);
  S(el.armL,`rotate(${f1(o.aL)} ${SH_L})`); S(el.armR,`rotate(${f1(o.aR)} ${SH_R})`);
  S(el.legL,`translate(0,${f1(-o.lfL)}) rotate(${f1(o.lL)} ${HIP_L})`);
  S(el.legR,`translate(0,${f1(-o.lfR)}) rotate(${f1(o.lR)} ${HIP_R})`);
  S(el.tube,`translate(0,${f1(o.tube)})`); S(el.tubeA,`translate(0,${f1(o.tubeA)})`);
  el.glowc.setAttribute('opacity',o.glow.toFixed(2)); el.glowa.setAttribute('opacity',o.glowA.toFixed(2));
  S(el.pupils,`translate(${f1(o.eyeX)},0)`);
  el.shadow.setAttribute('rx',f1(160*(0.5+0.5*o.alpha)));
}

window.CHARS.doctorMonster={
  name:'怪物博士', nameEn:'Doctor Monster',
  source:'doctor-monster/concept-source/page02a.jpg',
  viewBox:[-250,-150,510,355], foot:[-10,192], center:[0,40], top:-40, flipX:-20, gameH:45,
  healPt:TUBE, atkPt:ATK_TUBE,
  anims:{
    idle:  {dur:2.6, frames:18},
    walk:  {dur:0.7, frames:12},
    attack:{dur:0.6, frames:12},
    heal:  {dur:0.6, frames:10},
    shoot: {dur:0.5, frames:10},
    die:   {dur:1.5, frames:22, loop:false, hold:0.6},
    hit:   {dur:0.3, overlay:true},
  },
  markup, bind, pose, hit, apply,
};
})();
