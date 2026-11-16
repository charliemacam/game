/* 黏液怪 Slime Monster（Charlie 原画：character-design/slime-monster/）坐标用原画像素写，统一换算。
 * 比例按原画量过（2026-11-16 加了更多细节，比例再对一遍）：一大团亮绿色的黏液：中间是圆顶的身体，顶上三只小眼睛，中间一张深绿色的宽嘴；
 *   两条又粗又长的手臂先往上拱起再落到地上，像两座拱桥，末端是黏糊糊的手；身体下面往下滴着黏液，落地成一滩。
 *   身体和手臂里隐约能看到一些东西（骷髅、小手、骨头、箭、笼子、剑）和小气泡，只是装饰；外轮廓先描、再统一填色，整团连在一起。
 * Charlie 的回答：黏液不会让士兵变慢；身体里的东西不是吞进去的，它也不吞士兵；写着 slow 的符号是移动速度。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#1c3a0c';
const T=([x,y])=>[f1((x-420)*0.42), f1((y-620)*0.42+150)];
const TP=pts=>pts.map(T);
function markup(P){
  const R=rng(1800);
  // 圆顶身体（更圆，和手臂、腿、地上那滩连成一整块）
  const body=organic(TP([[208,322],[246,280],[330,262],[430,258],[520,268],[598,298],[640,350],[646,420],[628,466],[560,482],[420,486],[280,482],[218,466],[204,400]]),2.4,1801,{sub:1});
  // 两条粗手臂：从身体两肩拱起，再落到地上
  // 左臂非常粗（约 130 像素），和身体之间只留一道窄缝
  const armL=organic(TP([[262,276],[222,196],[164,150],[100,156],[54,210],[36,300],[28,400],[16,470],[24,530],[100,552],[190,560],[150,500],[146,420],[152,340],[170,294],[214,288]]),2.4,1802,{sub:1});
  // 右臂拱得更低更宽，拱下面露出一块空隙
  const armR=organic(TP([[496,266],[560,214],[650,196],[740,212],[792,258],[812,330],[816,410],[812,470],[748,482],[754,410],[748,326],[716,288],[670,280],[628,300]]),2.4,1803,{sub:1});
  const puddle=organic(TP([[108,560],[200,516],[420,524],[640,516],[704,556],[664,600],[420,612],[160,604]]),3,1804,{sub:2});
  // 身体下面的几条黏液腿，一直连到地上那滩
  const legs=[[262,462,540,34],[340,474,548,22],[410,476,552,30],[484,476,550,18],[556,468,546,36]].map(([x,y0,y1,w],k)=>{   // 宽窄不一的黏液腿，中间只有窄缝
    return organic(TP([[x-w,y0],[x+w,y0],[x+w*0.7,y1-10],[x+w*1.1,y1],[x-w*1.1,y1],[x-w*0.7,y1-10]]),1.2,1806+k); });
  // 手：五根黏糊糊的手指
  const hand=(pts,seed)=>pts.map(([x,y,rx,ry],k)=>organic(ring(...T([x,y]),rx,ry,8),0.8,seed+k));
  const handL=hand([[14,478,5,7],[18,500,5,7.5],[24,520,5,7.5],[36,538,5,7],[54,548,4.5,6]],1810);
  const handR=hand([[752,480,4.5,6.5],[770,484,5,7],[788,484,5,7],[806,480,5,6.5],[820,468,4.5,6]],1816);
  // 手臂下面、身体下沿往下挂的黏液滴
  const drips=[[166,470,500],[34,420,452],[814,420,452],[752,440,470],[196,470,498],[646,462,492]].map(([x,y0,y1],k)=>{ const a=T([x,y0]), b=T([x,y1]);
    return `M${f1(a[0]-4)},${f1(a[1])} Q${f1(b[0]-4)},${f1(b[1]-4)} ${f1(b[0])},${f1(b[1]+3)} Q${f1(b[0]+4)},${f1(b[1]-4)} ${f1(a[0]+4)},${f1(a[1])}Z`; }).join('');
  const all=[body,armL,armR,puddle,...legs,...handL,...handR];
  // 嘴：深绿色的宽嘴，上嘴唇波浪形，里面有一道更深的缝
  const mouth=organic(TP([[292,378],[340,366],[384,374],[430,362],[480,368],[530,360],[542,392],[510,440],[420,456],[330,450],[296,420]]),1.2,1805,{sub:1});
  const lip=`M${T([300,398])}Q${T([370,414])} ${T([430,406])}T${T([534,398])}`;
  let eyes=''; [[356,300],[396,294],[436,302]].forEach(([x,y],k)=>{ const [u,v]=T([x,y]);
    eyes+=`<ellipse cx="${u}" cy="${v}" rx="6.5" ry="7.2" fill="#f4ffe2" stroke="${OUT}" stroke-width="1.3"/><circle cx="${f1(u+0.6)}" cy="${f1(v+1)}" r="2.3" fill="${OUT}"/><circle cx="${f1(u-0.8)}" cy="${f1(v-1)}" r=".9" fill="#fff"/>
      <path d="M${f1(u-6)},${f1(v-5)} Q${u},${f1(v-9)} ${f1(u+6)},${f1(v-5)}" stroke="${OUT}" stroke-width="1" fill="none" opacity=".6"/>`; });
  // 身体里隐约能看到的东西（只是装饰）
  const G=(d,o)=>`<g opacity="${o||0.5}" stroke="#123a08" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
  const skull=(x,y,r)=>{ const [u,v]=T([x,y]); return `<path d="M${f1(u-r)},${f1(v)} a${r},${r} 0 1 1 ${f1(2*r)},0 v${f1(r*0.5)} h${f1(-2*r)}Z" fill="#2c6a14" fill-opacity=".25"/><path d="M${f1(u-r*0.6)},${f1(v-r*0.3)} l${f1(r*0.4)},${f1(r*0.4)} m0,${f1(-r*0.4)} l${f1(-r*0.4)},${f1(r*0.4)} M${f1(u+r*0.2)},${f1(v-r*0.3)} l${f1(r*0.4)},${f1(r*0.4)} m0,${f1(-r*0.4)} l${f1(-r*0.4)},${f1(r*0.4)} M${f1(u-r*0.5)},${f1(v+r*0.3)} h${f1(r)}"/>`; };
  const handIn=(x,y,a)=>{ const [u,v]=T([x,y]); return `<g transform="translate(${u},${v}) rotate(${a})"><path d="M-5,6 v-6 q0,-4 4,-4 h2 q4,0 4,4 v6Z" fill="#2c6a14" fill-opacity=".25"/><path d="M-4,-4 v-7 M-1,-4 v-9 M2,-4 v-8 M5,-3 v-6 M-6,2 l-4,-3"/></g>`; };
  const bone=(x,y,a)=>{ const [u,v]=T([x,y]); return `<g transform="translate(${u},${v}) rotate(${a})"><path d="M-9,0 h18"/><circle cx="-10" cy="-2" r="2"/><circle cx="-10" cy="2" r="2"/><circle cx="10" cy="-2" r="2"/><circle cx="10" cy="2" r="2"/></g>`; };
  const items=G(skull(130,233,9)+handIn(205,190,-20)+bone(259,223,30)+
    `<path d="M${T([84,350])}L${T([126,404])} M${T([120,392])}l5,0 l-1,-6 M${T([84,350])}l-3,-4 m3,4 l-5,1"/>`+
    `<path d="M${T([200,436])}h16v16h-16Z M${T([200,436])}l8,-8 l8,8 M${T([206,436])}v16 M${T([212,436])}v16"/>`+
    skull(560,470,8)+`<path d="M${T([572,262])}L${T([584,330])} M${T([566,282])}h12"/>`+handIn(626,228,15)+bone(700,240,-20)+bone(470,500,10),0.55);
  let bubbles=''; for(let k=0;k<26;k++){ const pts=[[230+R()*390,300+R()*210],[50+R()*110,190+R()*320],[570+R()*220,220+R()*200]][k%3], [u,v]=T(pts), r=1.2+R()*2.8;
    bubbles+=`<circle cx="${u}" cy="${v}" r="${f1(r)}" fill="#e8ffc0" fill-opacity=".35" stroke="#3f9a1c" stroke-width=".6"/><circle cx="${f1(u-r*0.35)}" cy="${f1(v-r*0.35)}" r="${f1(r*0.3)}" fill="#fff" opacity=".8"/>`; }
  const crayon=scratches(1830,-180,-80,370,220,160,12,'#3f9a1c',1,0.45,-0.9)+scratches(1831,-180,-80,370,220,90,10,'#d8ff9a',0.9,0.4,-0.9);
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.6,warpF:0.035,grain:0.16,grainF:0.3,rim:0.38,seed:101})}
  <radialGradient id="${P}-slime" gradientUnits="userSpaceOnUse" cx="${T([400,250])[0]}" cy="${T([400,250])[1]}" r="230"><stop offset="0" stop-color="#d6ff8a"/><stop offset=".45" stop-color="#8ce044"/><stop offset="1" stop-color="#3f9a1c"/></radialGradient>
  <radialGradient id="${P}-mouth" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#2e6a14"/><stop offset="1" stop-color="#143a08"/></radialGradient>
  <clipPath id="${P}-all">${all.map(d=>`<path d="${d}"/>`).join('')}</clipPath>
</defs>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-puddleG">
    <path d="${puddle}" fill="none" stroke="${OUT}" stroke-width="4"/>
  </g>
  <g id="${P}-armL"><path d="${armL}" fill="none" stroke="${OUT}" stroke-width="4"/>${handL.map(d=>`<path d="${d}" fill="none" stroke="${OUT}" stroke-width="3"/>`).join('')}</g>
  <g id="${P}-armR"><path d="${armR}" fill="none" stroke="${OUT}" stroke-width="4"/>${handR.map(d=>`<path d="${d}" fill="none" stroke="${OUT}" stroke-width="3"/>`).join('')}</g>
  ${legs.map(d=>`<path d="${d}" fill="none" stroke="${OUT}" stroke-width="4"/>`).join('')}
  <path d="${body}" fill="none" stroke="${OUT}" stroke-width="4"/>
  <path d="${drips}" fill="url(#${P}-slime)" stroke="${OUT}" stroke-width="1.3"/>
  <!-- 外轮廓画完再把所有部分填上同一种绿色，连成一整团 -->
  <path id="${P}-puddle" d="${puddle}" fill="url(#${P}-slime)"/>
  <g id="${P}-armLf"><path d="${armL}" fill="url(#${P}-slime)"/>${handL.map(d=>`<path d="${d}" fill="url(#${P}-slime)"/>`).join('')}</g>
  <g id="${P}-armRf"><path d="${armR}" fill="url(#${P}-slime)"/>${handR.map(d=>`<path d="${d}" fill="url(#${P}-slime)"/>`).join('')}</g>
  ${legs.map(d=>`<path d="${d}" fill="url(#${P}-slime)"/>`).join('')}
  <path d="${body}" fill="url(#${P}-slime)"/>
  <g clip-path="url(#${P}-all)">
    ${crayon}${items}${bubbles}
    ${ao(P+'-tex',`M${T([220,490])}Q${T([420,540])} ${T([630,490])}`,14,0.35)}
    ${ao(P+'-tex',`M${T([156,320])}Q${T([150,420])} ${T([152,500])} M${T([212,320])}Q${T([206,420])} ${T([216,470])} M${T([748,320])}Q${T([756,400])} ${T([750,470])}`,8,0.35)}
    <path d="M${T([170,160])}Q${T([110,170])} ${T([70,240])} M${T([700,196])}Q${T([780,200])} ${T([826,250])}" stroke="#f4ffd8" stroke-width="5" opacity=".45" fill="none" stroke-linecap="round"/>
    <path d="M${T([290,300])}Q${T([360,270])} ${T([440,266])}" stroke="#f4ffd8" stroke-width="5" opacity=".45" fill="none" stroke-linecap="round"/>
    <path d="M${T([300,560])}Q${T([400,540])} ${T([500,548])}" stroke="#f4ffd8" stroke-width="3" opacity=".4" fill="none" stroke-linecap="round"/>
  </g>
  ${eyes}
  <path d="M${T([396,336])}l2,4 M${T([410,336])}l-2,4" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>
  <g id="${P}-mouth"><path d="${mouth}" fill="url(#${P}-mouth)" stroke="${OUT}" stroke-width="1.8"/>
    <path d="${lip}" stroke="#0c2604" stroke-width="2.2" fill="none"/>
    <path d="M${T([330,380])}Q${T([420,372])} ${T([500,372])}" stroke="#7ad83a" stroke-width="1.5" opacity=".6" fill="none"/></g>
</g></g></g>`;
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','armL','armR','armLf','armRf','mouth','puddle','puddleG','flip']) el[k]=q(k); return el; }
const BASE={bobY:0,sx:1,sy:1,aL:0,aR:0,mouth:1,dY:0,alpha:1,flash:0,pud:1};
const ATTACK=[[0,{}],[0.4,{sy:1.1,sx:0.94,aL:-6,aR:6,mouth:1.4}],[0.55,{sy:0.85,sx:1.12,aL:8,aR:-8,mouth:0.8}],[0.75,{sy:0.95,sx:1.04}],[1,{}]];
const DIE=[[0,{}],[0.15,{flash:1,sy:1.1,sx:0.95}],[0.6,{sy:0.4,sx:1.3,alpha:0.85,pud:1.4}],[1,{sy:0.2,sx:1.5,alpha:0,pud:1.6}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){ o.sy=1+Math.sin(w)*0.03; o.sx=1-Math.sin(w)*0.02; o.aL=Math.sin(w)*2; o.aR=-Math.sin(w)*2; }
  else if(anim==='walk'){ o.sy=1+Math.sin(w*2)*0.05; o.sx=1-Math.sin(w*2)*0.04; o.aL=Math.sin(w)*4; o.aR=Math.sin(w+Math.PI)*4; o.bobY=-Math.abs(Math.sin(w))*2; }
  else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.sy-=0.06*k; o.sx+=0.05*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,150) scale(${o.sx.toFixed(3)},${o.sy.toFixed(3)}) translate(0,-150)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3)); S(el.bob,`translate(0,${f1(o.bobY)})`);
  const rl=`rotate(${f1(o.aL)} ${T([280,320])})`, rr=`rotate(${f1(o.aR)} ${T([560,320])})`;
  S(el.armL,rl); S(el.armLf,rl); S(el.armR,rr); S(el.armRf,rr);
  const m=T([405,392]); S(el.mouth,`translate(${m}) scale(1,${o.mouth.toFixed(3)}) translate(${-m[0]},${-m[1]})`);
  const pt=`translate(0,140) scale(${o.pud.toFixed(2)},1) translate(0,-140)`; S(el.puddle,pt); S(el.puddleG,pt); }
window.CHARS.slimeMonster={ name:'黏液怪', nameEn:'Slime Monster', source:'slime-monster/concept-source/page04c.jpg',
  viewBox:[-195,-115,390,285], foot:[0,140], center:[0,30], top:-90, flipX:0, gameH:56,
  anims:{ idle:{dur:2.4,frames:16}, walk:{dur:1.2,frames:12}, attack:{dur:1.0,frames:12}, die:{dur:1.4,frames:18,loop:false,hold:0.4}, hit:{dur:0.3,overlay:true} },
  markup, bind, pose, hit, apply };
})();
