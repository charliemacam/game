/* 石尸 Rock Zombie（Charlie 原画：character-design/rock-zombie/）坐标用原画像素写，统一换算。
 * 比例按原画量过：灰白色带裂纹的石头身体，上面有黑色斑块和青色的水痕；头像一块圆角石砖，顶上两个圆角，角尖是黄色小球；
 *   两个圆圆的石头肩甲；左手一把黑色大锤，右手一把很长的弯刀（灰底黑斜纹）；大腿和脚都是圆滚滚的石块，带黑色箍纹。
 * Charlie 的回答：攻击 ∞（一下打死士兵），攻击速度慢；能吸走三个士兵的盔甲和补给（防御变 0，补给变 0），石尸不会变强；
 *   是岩石巨人的手下，但也会单独出现；死的时候碎成大块碎片。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#1c1b1a';
const T=([x,y])=>[f1((x-410)*0.5), f1((y-600)*0.5+160)];
const TP=pts=>pts.map(T);
function rock(P,id,pts,seed,extra){                     // 一块石头：灰白底 + 裂纹 + 黑斑 + 青色水痕
  const d=organic(TP(pts),1.4,seed,{sub:2}), R=rng(seed+1), xs=pts.map(p=>T(p)[0]), ys=pts.map(p=>T(p)[1]);
  const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  let cracks=''; for(let i=0;i<4;i++){ let x=x0+R()*(x1-x0), y=y0+R()*(y1-y0); cracks+=`M${f1(x)},${f1(y)}`;
    for(let k=0;k<4;k++){ x+=(R()-0.5)*14; y+=(R()-0.3)*10; cracks+=`L${f1(x)},${f1(y)}`; } }
  let blots=''; for(let i=0;i<2;i++){ const bx=x0+R()*(x1-x0), by=y0+R()*(y1-y0); blots+=`<path d="${organic(ring(bx,by,4+R()*7,3+R()*6,8),2,seed+10+i)}" fill="#2a2a2c" opacity=".85"/>`; }
  let drips=''; for(let i=0;i<2;i++){ const bx=x0+4+R()*(x1-x0-8), by=y0+R()*(y1-y0)*0.6; drips+=`M${f1(bx)},${f1(by)} l${f1(R()*2-1)},${f1(6+R()*8)}`; }
  return `<g id="${P}-${id}"><clipPath id="${P}-${id}c"><path d="${d}"/></clipPath>
    <path d="${d}" fill="url(#${P}-stone)" stroke="${OUT}" stroke-width="1.8"/>
    <g clip-path="url(#${P}-${id}c)">${blots}${extra||''}
      <path d="${cracks}" stroke="#3a3a3a" stroke-width="1" fill="none"/>
      <path d="${drips}" stroke="#2cb5c0" stroke-width="2" stroke-linecap="round" opacity=".85"/>
      ${scratches(seed+20,x0,y0,x1-x0,y1-y0,14,5,'#8a8a86',0.7,0.45)}</g></g>`;
}
function markup(P){
  const band=(a,b,w)=>`<path d="M${T(a)}Q${T([(a[0]+b[0])/2,(a[1]+b[1])/2+8])} ${T(b)}" stroke="#2a2a2c" stroke-width="${w||5}" fill="none" stroke-linecap="round"/>`;
  const blade=organic(TP([[640,370],[626,352],[690,250],[728,160],[756,80],[770,96],[752,190],[716,290]]),0.8,1410,{sub:2});
  let bladeSt=''; for(let i=0;i<9;i++){ const t=i/9, x=650+t*110, y=350-t*265; bladeSt+=`M${T([x-6,y+6])}L${T([x+10,y-4])}`; }
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2,grain:0.18,grainF:0.4,rim:0.45,seed:61})}
  <radialGradient id="${P}-stone" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#f4f4f0"/><stop offset=".65" stop-color="#cfcfca"/><stop offset="1" stop-color="#8f8f8a"/></radialGradient>
  <linearGradient id="${P}-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7176"/><stop offset=".5" stop-color="#d7dadd"/><stop offset="1" stop-color="#8a8e92"/></linearGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="162" rx="90" ry="9" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-legL">${rock(P,'thL',[[250,410],[370,410],[380,470],[350,490],[260,490],[240,460]],1401)}${band([252,450],[372,452],6)}
    ${rock(P,'ftL',[[240,490],[360,490],[384,560],[372,600],[230,602],[214,560]],1402)}${band([232,520],[262,598],5)}${band([330,520],[350,598],5)}</g>
  <g id="${P}-legR">${rock(P,'thR',[[440,430],[560,430],[568,490],[540,505],[450,505],[432,480]],1403)}${band([442,470],[562,472],6)}
    ${rock(P,'ftR',[[440,505],[560,505],[584,570],[570,602],[440,602],[420,570]],1404)}${band([450,530],[470,598],5)}${band([540,530],[556,598],5)}</g>
  <g id="${P}-armR">${rock(P,'arR',[[560,240],[610,250],[625,320],[595,345],[570,320]],1405)}
    <g id="${P}-sword"><path d="${blade}" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="1.6"/>
      <path d="${bladeSt}" stroke="#1d1d1f" stroke-width="2.4"/>
      <path d="M${T([628,365])}L${T([660,385])}" stroke="#222" stroke-width="6" stroke-linecap="round"/></g>
    ${rock(P,'haR',[[578,312],[622,314],[630,346],[590,352]],1406)}</g>
  ${rock(P,'body',[[330,170],[420,150],[500,175],[520,260],[510,360],[470,410],[400,420],[340,400],[312,330],[310,240]],1407)}
  ${ao(P+'-tex',`M${T([330,400])}Q${T([410,430])} ${T([500,400])}`,10,0.4)}
  <g id="${P}-armL">${rock(P,'arL',[[230,250],[275,240],[290,300],[260,330],[230,320]],1408)}
    <g id="${P}-hammer"><path d="M${T([235,320])}L${T([185,355])}" stroke="#4a3a2a" stroke-width="5" stroke-linecap="round"/>
      <path d="${organic(TP([[140,340],[195,330],[205,405],[150,415]]),0.8,1409)}" fill="#2c2c30" stroke="${OUT}" stroke-width="1.6"/>
      <path d="${organic(TP([[146,330],[198,322],[200,340],[146,346]]),0.6,1411)}" fill="#8a8a86" stroke="${OUT}" stroke-width="1.2"/>
      ${scratches(1412,T([140,0])[0],T([0,340])[1],28,34,10,6,'#55555a',0.8,0.6)}</g>
    ${rock(P,'haL',[[210,300],[260,298],[262,335],[214,340]],1413)}</g>
  ${rock(P,'shL',[[250,180],[330,170],[345,240],[300,265],[250,250]],1414)}
  ${rock(P,'shR',[[500,195],[585,190],[600,270],[555,300],[505,280]],1415)}
  <g id="${P}-head">
    <path d="M${T([395,110])}L${T([392,92])} M${T([490,120])}L${T([494,104])}" stroke="#9a9a96" stroke-width="7" stroke-linecap="round"/>
    ${rock(P,'hd',[[360,110],[400,95],[470,105],[505,125],[500,190],[440,205],[370,195],[352,150]],1416,
      `<path d="M${T([400,160])}L${T([460,150])}" stroke="#1c1b1a" stroke-width="2.4"/><path d="M${T([410,140])}l2,6 M${T([450,135])}l2,6" stroke="#1c1b1a" stroke-width="2.2"/>`)}
    <circle cx="${T([392,90])[0]}" cy="${T([392,90])[1]}" r="6" fill="#f2cf2a" stroke="${OUT}" stroke-width="1.3"/>
    <circle cx="${T([495,103])[0]}" cy="${T([495,103])[1]}" r="6" fill="#f2cf2a" stroke="${OUT}" stroke-width="1.3"/>
  </g>
</g></g></g>
<g id="${P}-fx">${[0,1,2,3,4,5].map(i=>`<path id="${P}-dust${i}" d="${organic(ring(0,0,6,5,6),1.5,1420+i)}" fill="#bdbdb8" stroke="${OUT}" stroke-width="1" opacity="0"/>`).join('')}</g>`;
}
const PARTS=['legL','legR','armR','armL','head','body','shL','shR'];
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','shadow','flip','sword','hammer',...PARTS]) el[k]=q(k);
  el.dust=[0,1,2,3,4,5].map(i=>q('dust'+i)); return el; }
// 碎裂：每块往外飞的方向
const SHATTER={legL:[-30,10,-20],legR:[30,10,25],armR:[60,-20,40],armL:[-60,-20,-40],head:[10,-50,30],body:[0,20,8],shL:[-50,-30,-50],shR:[50,-30,50]};
const BASE={bobY:0,rot:0,aL:0,aR:0,lL:0,lR:0,head:0,dY:0,sq:1,alpha:1,flash:0,shatter:0,dust:0};
const ATTACK=[[0,{}],[0.45,{aR:-50,aL:20,head:-4,bobY:-4}],[0.6,{aR:40,aL:-10,head:6,bobY:4,sq:0.97}],[0.8,{aR:30}],[1,{}]];
const DIE=[[0,{}],[0.15,{flash:1,bobY:-4}],[0.35,{shatter:0.2}],[0.75,{shatter:1,alpha:0.9,dust:0.7}],[1,{shatter:1.2,alpha:0,dust:1}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*1.2; o.aL=Math.sin(w)*3; o.aR=-Math.sin(w)*3; o.head=Math.sin(w)*2; }
  else if(anim==='walk'){ const s=Math.sin(w); o.lL=Math.max(0,s)*7; o.lR=Math.max(0,-s)*7; o.rot=s*2; o.bobY=-Math.abs(s)*3; o.aL=-s*8; o.aR=s*8; }
  else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.bobY-=2*k; o.head-=5*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,160) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-160)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3)); S(el.bob,`translate(0,${f1(o.bobY)})`);
  const sh=o.shatter, mv=(k,extra)=>{ const [dx,dy,r]=SHATTER[k]; return `translate(${f1(dx*sh)},${f1(dy*sh+sh*sh*60)}) rotate(${f1(r*sh)} ${T([410,300])}) ${extra||''}`; };
  S(el.armR,mv('armR',`rotate(${f1(o.aR)} ${T([580,240])})`)); S(el.armL,mv('armL',`rotate(${f1(o.aL)} ${T([260,245])})`));
  S(el.legL,mv('legL',`translate(0,${f1(-o.lL)})`)); S(el.legR,mv('legR',`translate(0,${f1(-o.lR)})`));
  S(el.head,mv('head',`rotate(${f1(o.head)} ${T([430,200])})`)); S(el.body,mv('body')); S(el.shL,mv('shL')); S(el.shR,mv('shR'));
  el.dust.forEach((d,i)=>{ const a=i/6*Math.PI*2, r=o.dust*60; d.setAttribute('opacity',o.dust>0?(0.8*(1-o.dust)).toFixed(2):0);
    S(d,`translate(${f1(Math.cos(a)*r)},${f1(60+Math.sin(a)*r*0.5+o.dust*40)}) rotate(${f1(o.dust*200)}) scale(${(1+o.dust).toFixed(2)})`); });
  el.shadow.setAttribute('rx',f1(90*(0.5+0.5*o.alpha))); }
window.CHARS.rockZombie={ name:'石尸', nameEn:'Rock Zombie', source:'rock-zombie/concept-source/page03c.jpg',
  viewBox:[-170,-200,370,375], foot:[0,160], center:[0,10], top:-140, flipX:0, gameH:60,
  anims:{ idle:{dur:3,frames:16}, walk:{dur:1.4,frames:14}, attack:{dur:1.2,frames:14}, die:{dur:1.6,frames:22,loop:false,hold:0.4}, hit:{dur:0.3,overlay:true} },
  markup, bind, pose, hit, apply };
})();
