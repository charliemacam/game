/* 大型补电机器人 Big Charger Robot（Charlie 原画：character-design/big-charger-robot/）坐标用原画像素写，统一换算。
 * Charlie 说「不要漏掉任何细节」，所以原画里的每一样都画了：
 *   灰色的大柜子身体（下面稍微张开），正面一块大黑窗；窗里是黄色的小怪（就是它的大电池充电器），黑色乱毛、小眼睛、大红嘴；
 *   窗下两角各一个黄色的 C 形把手；头顶两个灰色的圆耳朵，各伸出一根黄色电缆，顶着一块红色带格子的电池板；
 *   右边一条灰色 L 形手臂，举着一个半圆形的充电盘，盘中间竖一根天线、顶上一个小圈，周围是一大团蓝色的电；
 *   一根彩虹色的电线从黄色小怪身上，沿着手臂一直通到充电盘；底下两只黑色的大脚。
 * Charlie 的回答：要挨着才能充电，同时只能给一个充；自己不会攻击。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#151517';
const T=([x,y])=>[f1((x-260)*0.42), f1((y-960)*0.42+150)];
const TP=pts=>pts.map(T);
function panel(P,pts,seed){ const q=TP(pts), xs=q.map(p=>p[0]), ys=q.map(p=>p[1]), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  let g=''; for(let i=1;i<6;i++) g+=`M${f1(x0+(x1-x0)*i/6)},${f1(y0)}V${f1(y1)}`; for(let i=1;i<3;i++) g+=`M${f1(x0)},${f1(y0+(y1-y0)*i/3)}H${f1(x1)}`;
  return `<path d="${organic(q,0.6,seed)}" fill="#d42a2e" stroke="${OUT}" stroke-width="1.5"/><path d="${g}" stroke="#3a0a0c" stroke-width="1.2"/>
    <path d="M${f1(x0+2)},${f1(y0+2)}H${f1(x1-2)}" stroke="#ff9a9a" stroke-width="1" opacity=".6"/>`; }
function markup(P){
  const R=rng(1600);
  const body=organic(TP([[70,300],[110,250],[200,238],[330,238],[420,258],[445,330],[452,600],[472,800],[430,842],[260,852],[80,842],[40,800],[62,600]]),1.6,1601,{sub:2});
  const win=organic(TP([[150,322],[400,312],[410,560],[400,762],[150,772],[140,560]]),1.2,1602,{sub:2});
  const crit=organic(TP([[190,520],[255,468],[360,468],[410,520],[402,642],[300,668],[198,642]]),1.4,1603,{sub:2});
  let hair=''; for(let i=0;i<10;i++){ const [x,y]=T([235+i*8,480+R()*12]); hair+=`M${x},${y} l${f1((R()-0.5)*4)},${f1(8+R()*8)}`; }
  const earL=organic(TP([[80,300],[85,235],[140,212],[195,240],[200,300]]),1,1604), earR=organic(TP([[320,300],[322,238],[372,205],[425,232],[432,300]]),1,1605);
  const cableL=`M${T([170,300])}Q${T([150,240])} ${T([95,190])}`, cableR=`M${T([345,295])}Q${T([370,240])} ${T([395,190])}`;
  const arm=organic(TP([[440,405],[740,405],[740,170],[690,170],[690,480],[440,480]].slice(0,0).concat([[440,405],[690,405],[690,175],[752,175],[752,482],[440,482]])),1.2,1606);
  const dish=organic(TP([[600,150],[870,150],[850,215],[800,262],[735,282],[670,262],[620,215]]),1,1607);
  const cable=TP([[380,495],[560,468],[718,452],[722,260],[735,182]]), cd=`M${cable[0]}Q${cable[1]} ${cable[2]}T${cable[3]}L${cable[4]}`;
  let aura=''; for(let i=0;i<90;i++){ const a=R()*Math.PI*2, r0=20+R()*20, r1=r0+20+R()*40, c=T([735,170]);
    aura+=`M${f1(c[0]+Math.cos(a)*r0)},${f1(c[1]+Math.sin(a)*r0*0.9)}l${f1(Math.cos(a)*(r1-r0))},${f1(Math.sin(a)*(r1-r0)*0.9)}`; }
  let bolts=''; for(let i=0;i<4;i++){ const a=-0.3-i*0.7, c=T([735,170]); let x=c[0],y=c[1],d=`M${x},${y}`; for(let k=0;k<4;k++){ x+=Math.cos(a)*12+(R()-0.5)*8; y+=Math.sin(a)*12+(R()-0.5)*8; d+=`L${f1(x)},${f1(y)}`; } bolts+=d; }
  const foot=(pts,s)=>`<path d="${organic(TP(pts),1.2,s)}" fill="#26262a" stroke="${OUT}" stroke-width="1.8"/>${scratches(s+1,T(pts[0])[0],T(pts[0])[1],50,80,10,8,'#4a4a50',0.8,0.5,Math.PI/2)}`;
  const handle=(p,s)=>{ const [x,y]=T(p); return `<path d="M${x+s*6},${y-9} Q${x-s*7},${y} ${x+s*6},${y+9}" stroke="${OUT}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${x+s*6},${y-9} Q${x-s*7},${y} ${x+s*6},${y+9}" stroke="#f2cf2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`; };
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2,grain:0.16,grainF:0.36,rim:0.45,seed:81})}
  <clipPath id="${P}-wc"><path d="${win}"/></clipPath>
  <radialGradient id="${P}-grey" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#e6e6e2"/><stop offset=".6" stop-color="#aeaeaa"/><stop offset="1" stop-color="#77777a"/></radialGradient>
  <radialGradient id="${P}-yel" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#e2b81a"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="152" rx="90" ry="9" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-fL">${foot([[70,760],[210,760],[218,900],[200,962],[80,962],[62,900]],1610)}</g>
  <g id="${P}-fR">${foot([[300,760],[440,760],[448,890],[430,948],[310,948],[292,890]],1612)}</g>
  <g id="${P}-arm">
    <g id="${P}-aura"><path d="${organic(ring(...T([735,170]),62,56,16),8,1619)}" fill="#1e7fff" opacity=".85"/>
      <path d="${aura}" stroke="#0a3fb0" stroke-width="3.2" opacity="1" fill="none"/>
      <path d="${bolts}" stroke="#bfe8ff" stroke-width="1.6" fill="none"/></g>
    <path d="${arm}" fill="url(#${P}-grey)" stroke="${OUT}" stroke-width="2"/>
    ${scratches(1614,T([440,0])[0],T([0,405])[1],110,30,12,8,'#77777a',0.8,0.45,0)}
    <path d="M${T([735,182])}L${T([735,92])}" stroke="${OUT}" stroke-width="3"/>
    <circle cx="${T([735,76])[0]}" cy="${T([735,76])[1]}" r="6" fill="none" stroke="${OUT}" stroke-width="2"/>
    <path d="${dish}" fill="url(#${P}-grey)" stroke="${OUT}" stroke-width="1.8"/>
    <path d="M${T([620,165])}L${T([850,165])}" stroke="#fff" stroke-width="1.2" opacity=".5"/>
    <path d="${cd}" stroke="#d42a2e" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="${cd}" stroke="#f08a24" stroke-width="5" fill="none" stroke-linecap="round" transform="translate(0,1)"/>
    <path d="${cd}" stroke="#4ab83a" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(0,2)"/>
    <path d="${cd}" stroke="#2e7fe0" stroke-width="1.5" fill="none" stroke-linecap="round" transform="translate(0,3)"/>
  </g>
  <path d="${cableL}" stroke="${OUT}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="${cableL}" stroke="#f2cf2a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="${cableR}" stroke="${OUT}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="${cableR}" stroke="#f2cf2a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <g id="${P}-panL">${panel(P,[[0,145],[150,138],[152,190],[2,196]],1615)}</g>
  <g id="${P}-panR">${panel(P,[[330,135],[490,130],[492,185],[332,192]],1616)}</g>
  <path d="${earL}" fill="url(#${P}-grey)" stroke="${OUT}" stroke-width="1.8"/><path d="${earR}" fill="url(#${P}-grey)" stroke="${OUT}" stroke-width="1.8"/>
  <path d="${body}" fill="url(#${P}-grey)" stroke="${OUT}" stroke-width="2.4"/>
  ${scratches(1617,T([60,0])[0],T([0,250])[1],170,250,40,12,'#86868a',0.8,0.45)}
  <path d="${win}" fill="#18181b" stroke="${OUT}" stroke-width="2"/>
  <g clip-path="url(#${P}-wc)">
    ${scratches(1618,T([150,0])[0],T([0,320])[1],110,190,40,14,'#3a3a40',0.8,0.5,0.2)}
    <g id="${P}-crit"><path d="${crit}" fill="url(#${P}-yel)" stroke="${OUT}" stroke-width="1.6"/>
      <path d="${hair}" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${T([232,560])[0]}" cy="${T([232,560])[1]}" r="2.2" fill="${OUT}"/><circle cx="${T([335,548])[0]}" cy="${T([335,548])[1]}" r="2.2" fill="${OUT}"/>
      <g id="${P}-mouth"><ellipse cx="${T([282,602])[0]}" cy="${T([282,602])[1]}" rx="15" ry="12" fill="#e2242a" stroke="${OUT}" stroke-width="1.4"/></g>
      <path d="M${T([300,470])}L${T([300,520])}" stroke="#1a1a1a" stroke-width="3"/></g>
    <path d="M${T([160,330])}L${T([230,330])}" stroke="#fff" stroke-width="2" opacity=".25"/>
  </g>
  ${handle([118,725],-1)}${handle([432,705],1)}
  ${ao(P+'-tex',`M${T([80,842])}L${T([430,842])}`,10,0.45)}
</g></g></g>`;
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','arm','aura','fL','fR','crit','mouth','panL','panR','shadow','flip']) el[k]=q(k); return el; }
const BASE={bobY:0,rot:0,arm:0,aura:0.85,fL:0,fR:0,crit:0,mouth:1,dY:0,sq:1,alpha:1,flash:0,pan:0};
const ATTACK=[[0,{}],[0.5,{arm:-6,aura:1,crit:-2,mouth:1.4}],[1,{}]];             // 不会攻击：被拦住时只是电流更亮
const CHARGE=[[0,{aura:0.6}],[0.3,{aura:1,arm:-4,mouth:1.3}],[0.7,{aura:1,arm:-2}],[1,{aura:0.6}]];
const DIE=[[0,{}],[0.12,{flash:1,aura:1}],[0.5,{dY:16,sq:0.8,rot:-8,aura:0,arm:20,pan:20}],[0.85,{dY:20,sq:0.75,rot:-10,alpha:0.8,aura:0,arm:30,pan:30}],[1,{dY:20,sq:0.75,rot:-10,alpha:0,aura:0,arm:30,pan:30}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*1.2; o.aura=0.75+0.25*Math.abs(Math.sin(w*3)); o.crit=Math.sin(w*2)*1.5; o.pan=Math.sin(w)*3; }
  else if(anim==='walk'){ const s=Math.sin(w); o.fL=Math.max(0,s)*7; o.fR=Math.max(0,-s)*7; o.rot=s*1.5; o.bobY=-Math.abs(s)*3; o.aura=0.75+0.25*Math.abs(Math.sin(w*3)); o.pan=s*4; }
  else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='charge') return kf(BASE,CHARGE,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.bobY-=2*k; o.mouth+=0.5*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,150) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-150)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3)); S(el.bob,`translate(0,${f1(o.bobY)})`);
  S(el.arm,`rotate(${f1(o.arm)} ${T([450,440])})`); el.aura.setAttribute('opacity',o.aura.toFixed(2));
  S(el.fL,`translate(0,${f1(-o.fL)})`); S(el.fR,`translate(0,${f1(-o.fR)})`);
  S(el.crit,`translate(0,${f1(o.crit)})`);
  const m=T([282,602]); S(el.mouth,`translate(${m}) scale(1,${o.mouth.toFixed(2)}) translate(${-m[0]},${-m[1]})`);
  S(el.panL,`rotate(${f1(-o.pan)} ${T([95,190])})`); S(el.panR,`rotate(${f1(o.pan)} ${T([395,190])})`);
  el.shadow.setAttribute('rx',f1(90*(0.5+0.5*o.alpha))); }
window.CHARS.chargerRobot={ name:'大型补电机器人', nameEn:'Big Charger Robot', source:'big-charger-robot/concept-source/page04a.jpg',
  viewBox:[-130,-260,420,420], foot:[0,150], center:[40,-30], top:-210, flipX:0, gameH:62, chargePt:[735,176].map((v,i)=>T([735,176])[i]),
  anims:{ idle:{dur:2.4,frames:16}, walk:{dur:1.2,frames:12}, attack:{dur:0.8,frames:10}, charge:{dur:0.8,frames:10}, die:{dur:1.5,frames:20,loop:false,hold:0.5}, hit:{dur:0.3,overlay:true} },
  markup, bind, pose, hit, apply };
})();
