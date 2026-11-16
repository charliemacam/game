/* 火焰龙 Fire Dragon（Charlie 原画：character-design/fire-dragon/）
 * 原画朝左，这里镜像成朝右（运行时再按方向翻转）。坐标直接用原画像素写，再统一换算。
 * 比例按原画量过：很长的身体，从头到尾 红 → 橙 → 黄 渐变；黄色鳄鱼一样的长嘴，头顶两只眼睛竖着；
 *   脖子上一圈红橙色火焰；一对又长又窄的翅膀（一只朝上、一只朝下），红底黑横纹，外沿黑、尖端黄；
 *   前面两条短腿，后面六条长腿（上红下黄，黄色爪子）；背上和尾巴外侧一排红刺；尾巴向下卷，尾尖是橙褐色的爪。
 * Charlie 的回答：完全不怕火焰塔；冰霜塔对它造成 2.5 倍伤害；会喷火，能烧伤士兵；会飞一点点。
 * 质感：鳞片、蜡笔纹、翅膜的半透明筋、火焰的发光。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#2a0d06';
const T=([x,y])=>[f1((x-450)*-0.42), f1((y-590)*0.42+160)];
const TP=pts=>pts.map(T);
const BODY=[[150,295],[200,262],[300,262],[400,282],[500,250],[620,235],[720,240],[800,268],[840,330],[855,420],[840,510],[805,575],[790,600],[778,588],[812,520],[822,430],[800,372],[720,362],[600,372],[480,372],[380,372],[300,362],[220,352],[160,332]];
const BACK_LEGS=[520,585,650,715];   // 中间四条腿
const WING_UP=[400,292], WING_DN=[400,370];

// 翅膀和身体在同一个平面上（从上往下看展开）：前缘是一根黑色硬骨，后面是用来滑翔的软翅膜（红底深色翅脉），后缘一圈橙黄
function wing(P,id,lead,trail,seed){
  const all=[...lead,...trail], w=organic(TP(all),1.2,seed,{sub:2});
  const base=T(lead[0]), rear=T(trail[trail.length-1]);
  let ribs=''; for(let k=1;k<5;k++){ const a=T(lead[Math.min(lead.length-1,k)]), b=T(trail[Math.min(trail.length-1,k-1)]);
    ribs+=`M${f1(base[0]+(rear[0]-base[0])*0.3)},${f1(base[1]+(rear[1]-base[1])*0.3)} Q${f1((a[0]+b[0])/2)},${f1((a[1]+b[1])/2)} ${b}`; }
  let stripes=''; const R=rng(seed+3);
  for(let k=1;k<10;k++){ const t=k/10, a=T(lead[0]), tip=T(lead[lead.length-1]); const y=a[1]+(tip[1]-a[1])*t;
    stripes+=`M${f1(Math.min(a[0],tip[0])-80)},${f1(y+R()*3)} L${f1(Math.max(a[0],tip[0])+80)},${f1(y+R()*3)}`; }
  const bone=TP(lead), boneD=`M${bone[0]}`+bone.slice(1).map(p=>`L${p}`).join('');
  const fringe=TP(trail), fringeD=`M${fringe[0]}`+fringe.slice(1).map(p=>`L${p}`).join('');
  return `<g id="${P}-${id}"><clipPath id="${P}-${id}c"><path d="${w}"/></clipPath>
    <path d="${w}" fill="url(#${P}-wing)" stroke="${OUT}" stroke-width="2"/>
    <g clip-path="url(#${P}-${id}c)">
      <path d="${stripes}" stroke="#2a0a06" stroke-width="3" fill="none" opacity=".75"/>
      <path d="${ribs}" stroke="#3a0c08" stroke-width="2" fill="none" opacity=".8"/>
      <path d="${fringeD}" stroke="#f2a52a" stroke-width="7" fill="none" stroke-linejoin="round" opacity=".9"/>
      ${scratches(seed+5,-80,-90,180,280,40,10,'#ff9a6a',0.8,0.28,Math.PI/2)}
    </g>
    <path d="${boneD}" stroke="${OUT}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${boneD}" stroke="#2c2a2e" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${boneD}" stroke="#77737a" stroke-width="1.5" fill="none" transform="translate(-1,-1)" opacity=".7"/>
    <circle cx="${bone[bone.length-1][0]}" cy="${bone[bone.length-1][1]}" r="4" fill="#f2c230" stroke="${OUT}" stroke-width="1.2"/></g>`;
}
// 腿：粗一点；爪子像霸王龙：三根朝前的大弯钩爪 + 一根朝后的小爪
function leg(P,i,x0,y0,y1,front){
  const [ax,ay]=T([x0,y0]), [bx,by]=T([x0+(front?-6:4),y1]), w=front?7:8;
  const seg=organic([[ax-w,ay],[ax+w,ay],[bx+w*0.75,by],[bx-w*0.75,by]],0.6,1100+i);
  let claws=''; for(let k=0;k<3;k++){ const ex=bx+6+k*5, ey=by+5-k*0.5;
    claws+=`<path d="M${f1(bx-2+k*3)},${f1(by-2)} Q${f1(ex+4)},${f1(by-4)} ${f1(ex+5)},${f1(ey+3)} Q${f1(ex)},${f1(ey)} ${f1(bx-2+k*3)},${f1(by+3)}Z" fill="#f2cf2a" stroke="${OUT}" stroke-width="1.1"/>
      <path d="M${f1(ex+5)},${f1(ey+3)} l-1.5,-2.5" stroke="${OUT}" stroke-width="1.6"/>`; }
  claws+=`<path d="M${f1(bx-4)},${f1(by)} q-7,0 -8,5 q4,-2 8,-1Z" fill="#f2cf2a" stroke="${OUT}" stroke-width="1"/>`;
  return `<g id="${P}-g${i}"><path d="${seg}" fill="url(#${P}-leg)" stroke="${OUT}" stroke-width="1.4"/>
    <ellipse cx="${f1(bx)}" cy="${f1(by-1)}" rx="${w+1}" ry="4" fill="#f2c230" stroke="${OUT}" stroke-width="1.2"/>${claws}</g>`;
}
function markup(P){
  const body=organic(TP(BODY),1.6,1101,{sub:2});
  const head=organic(TP([[156,294],[128,276],[100,282],[60,298],[30,318],[38,333],[90,337],[156,334]]),1,1102);
  const flames=organic(TP([[168,268],[180,165],[205,228],[232,150],[256,228],[276,198],[292,264]]),1.4,1103,{sub:2});
  const flamesIn=organic(TP([[190,262],[200,205],[218,240],[234,190],[250,240],[268,230],[276,262]]),1,1104,{sub:2});
  let spikes=''; const sp=[[440,268],[495,250],[550,240],[605,236],[660,234],[715,240],[765,252],[805,272],[836,312],[852,365],[855,420],[846,475]];
  sp.forEach(([x,y],i)=>{ const nx=i<8?0:1, a=T([x-13,y+5]), b=T([x+13,y+5]), t=T([x+nx*44+(1-nx)*10,y-44+nx*34]);
    spikes+=`<path d="M${a}L${t}L${b}Z" fill="#d8262a" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>`; });
  // 尾巴最后是一把红色三叉戟
  const tri=TP([[786,592],[794,592],[794,622],[826,622],[832,668],[818,646],[806,640],[800,684],[790,702],[780,684],[774,640],[762,646],[748,668],[754,622],[786,622]]);
  const R=rng(1110); let scales='';
  for(let i=0;i<70;i++){ const x=170+R()*660, y=280+R()*80; const [u,v]=T([x,y]); scales+=`M${f1(u-3)},${f1(v)} q3,-3 6,0`; }
  const gx=T([150,0])[0], gx2=T([850,0])[0];
  const fire=organic([[0,-6],[30,-14],[56,-8],[70,0],[56,8],[30,14],[0,6]],2,1112);
  const [mx,my]=T([30,322]);
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2,grain:0.17,grainF:0.4,rim:0.4,seed:41})}
  <clipPath id="${P}-bc"><path d="${body}"/></clipPath>
  <linearGradient id="${P}-body" gradientUnits="userSpaceOnUse" x1="${gx}" y1="0" x2="${gx2}" y2="0">
    <stop offset="0" stop-color="#d9262a"/><stop offset=".38" stop-color="#e2412a"/><stop offset=".5" stop-color="#ef7d22"/><stop offset=".72" stop-color="#f2a52a"/><stop offset=".85" stop-color="#f4d23a"/><stop offset="1" stop-color="#f2c230"/></linearGradient>
  <linearGradient id="${P}-wing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d42620"/><stop offset=".7" stop-color="#c41c1c"/><stop offset=".85" stop-color="#f08a24"/><stop offset="1" stop-color="#f2c230"/></linearGradient>
  <linearGradient id="${P}-leg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9262a"/><stop offset=".55" stop-color="#ef7d22"/><stop offset="1" stop-color="#f4d23a"/></linearGradient>
  <linearGradient id="${P}-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d9262a"/><stop offset=".6" stop-color="#f06a22"/><stop offset="1" stop-color="#ffd24a"/></linearGradient>
  <radialGradient id="${P}-fire" cx=".1" cy=".5" r=".9"><stop offset="0" stop-color="#fff6c0"/><stop offset=".35" stop-color="#ffb43a"/><stop offset=".75" stop-color="#ff4a16" stop-opacity=".85"/><stop offset="1" stop-color="#c81010" stop-opacity="0"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="20" cy="162" rx="150" ry="9" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  ${BACK_LEGS.map((x,i)=>leg(P,i+2,x,366,560,false)).join('')}
  ${leg(P,0,225,348,440,true)}${leg(P,1,268,352,444,true)}
  ${spikes}
  <path d="${body}" fill="url(#${P}-body)"/>
  <g clip-path="url(#${P}-bc)"><path d="${scales}" stroke="#7a1e0a" stroke-width="1" fill="none" opacity=".45"/>
    ${scratches(1113,-170,0,350,80,80,10,'#fff0a0',0.8,0.25,0.1)}
    ${ao(P+'-tex',`M${T([180,352])}L${T([800,372])}`,10,0.35)}</g>
  <path d="${body}" fill="none" stroke="${OUT}" stroke-width="2.2"/>
  <path d="${organic(tri,0.4,1114,{sub:1})}" fill="#d42620" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M${T([790,600])}L${T([790,680])}" stroke="#ff8a7a" stroke-width="1.2" opacity=".6"/>
  <g id="${P}-wDn">${wing(P,'wd',[[352,370],[332,450],[338,540],[380,606]],[[420,590],[460,505],[474,420],[466,370]],1120)}</g>
  <g id="${P}-wUp">${wing(P,'wu',[[338,292],[316,200],[316,110],[338,40]],[[384,44],[446,104],[474,190],[466,292]],1121)}</g>
  <g id="${P}-head">
    <path d="${flames}" fill="url(#${P}-flame)" stroke="${OUT}" stroke-width="1.6"/>
    <path d="${flamesIn}" fill="#ffd24a" opacity=".7"/>
    <g id="${P}-jaw"><path d="${organic(TP([[150,322],[90,328],[36,328],[38,334],[90,338],[150,334]]),0.6,1115)}" fill="#e2b22a" stroke="${OUT}" stroke-width="1.4"/></g>
    <path d="${head}" fill="#f2cf2a" stroke="${OUT}" stroke-width="1.8"/>
    <path d="M${T([42,323])}Q${T([90,318])} ${T([142,318])}" stroke="#c8202a" stroke-width="2" fill="none"/>
    <!-- 耳朵：在眼睛后面，用细线连着头 -->
    <path d="M${T([126,284])}Q${T([116,262])} ${T([106,248])} M${T([142,282])}Q${T([146,262])} ${T([146,244])}" stroke="${OUT}" stroke-width="1.4" fill="none"/>
    <circle cx="${T([106,246])[0]}" cy="${T([106,246])[1]}" r="4.5" fill="#f6e7c8" stroke="${OUT}" stroke-width="1.2"/><circle cx="${T([106,246])[0]}" cy="${T([106,246])[1]}" r="1.8" fill="#c86a4a"/>
    <circle cx="${T([146,242])[0]}" cy="${T([146,242])[1]}" r="4.5" fill="#f6e7c8" stroke="${OUT}" stroke-width="1.2"/><circle cx="${T([146,242])[0]}" cy="${T([146,242])[1]}" r="1.8" fill="#c86a4a"/>
    <!-- 眼睛长在头上 -->
    <g id="${P}-pupils"><ellipse cx="${T([120,288])[0]}" cy="${T([120,288])[1]}" rx="3.6" ry="4.6" fill="#1a1210" stroke="${OUT}" stroke-width=".8"/>
      <ellipse cx="${T([138,285])[0]}" cy="${T([138,285])[1]}" rx="3.6" ry="4.6" fill="#1a1210" stroke="${OUT}" stroke-width=".8"/>
      <circle cx="${T([118,286])[0]+1}" cy="${T([118,286])[1]-1.5}" r="1.1" fill="#fff"/><circle cx="${T([136,283])[0]+1}" cy="${T([136,283])[1]-1.5}" r="1.1" fill="#fff"/></g>
    <g id="${P}-fire" opacity="0" transform="translate(${mx},${my})"><path d="${fire}" fill="url(#${P}-fire)"/></g>
  </g>
</g></g></g>`;
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','wUp','wDn','head','jaw','fire','pupils','shadow','flip']) el[k]=q(k);
  el.g=[0,1,2,3,4,5].map(i=>q('g'+i)); return el; }

const BASE={bobY:0,rot:0,wU:0,wD:0,head:0,jaw:0,fire:0,fireS:1,dY:0,sq:1,alpha:1,flash:0,eyeX:0,step:0,lift:0,shadow:1};
const ATTACK=[[0,{}],[0.25,{head:-8,jaw:4,wU:-10,wD:10}],[0.45,{head:4,jaw:10,fire:1,fireS:1.3}],[0.8,{head:2,jaw:8,fire:0.8,fireS:1.1}],[1,{}]];
const DIE=[[0,{}],[0.12,{flash:1,head:-14,wU:-20,wD:20,jaw:8}],[0.5,{dY:14,rot:6,head:20,wU:30,wD:-20,sq:0.8}],[0.8,{dY:18,rot:8,head:24,wU:40,wD:-30,sq:0.75,alpha:0.8}],[1,{dY:18,rot:8,head:24,wU:40,wD:-30,sq:0.75,alpha:0}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*1.5; o.wU=Math.sin(w)*4; o.wD=-Math.sin(w)*4; o.head=Math.sin(w)*2; o.fire=0; }
  else if(anim==='walk'){ o.step=p; o.bobY=-Math.abs(Math.sin(w*2))*2; o.wU=Math.sin(w)*6; o.wD=-Math.sin(w)*6; o.head=Math.sin(w*2)*2; }
  else if(anim==='fly'){ const s=Math.sin(w); o.wU=s*26; o.wD=-s*26; o.bobY=-s*5; o.lift=1; o.step=p*0.3; o.shadow=0.55; }
  else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.bobY-=3*k; o.head-=8*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,160) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-160)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)})`);
  const up=T(WING_UP), dn=T(WING_DN);
  const ku=Math.max(0.45,1-Math.abs(o.wU)/50), kd=Math.max(0.45,1-Math.abs(o.wD)/50);   // 平面里的翅膀：扇动 = 变短再伸开
  S(el.wUp,`translate(${up}) rotate(${f1(o.wU*0.15)}) scale(1,${ku.toFixed(3)}) translate(${-up[0]},${-up[1]})`);
  S(el.wDn,`translate(${dn}) rotate(${f1(o.wD*0.15)}) scale(1,${kd.toFixed(3)}) translate(${-dn[0]},${-dn[1]})`);
  const hp=T([160,310]); S(el.head,`rotate(${f1(o.head)} ${hp})`);
  const jp=T([150,330]); S(el.jaw,`rotate(${f1(o.jaw)} ${jp})`);
  const [mx,my]=T([30,322]); el.fire.setAttribute('opacity',o.fire.toFixed(2));
  S(el.fire,`translate(${mx},${my}) scale(${o.fireS.toFixed(2)},${o.fireS.toFixed(2)})`);
  el.g.forEach((g,i)=>{ if(!g) return; const ph=(o.step*2+i*0.37)%1, lift=o.lift?4:Math.max(0,Math.sin(ph*Math.PI*2))*6;
    S(g,`translate(0,${f1(-lift)})`); });
  el.shadow.setAttribute('rx',f1(150*o.shadow*(0.5+0.5*o.alpha))); }

window.CHARS.fireDragon={ name:'火焰龙', nameEn:'Fire Dragon', source:'fire-dragon/concept-source/page03a.jpg',
  viewBox:[-200,-100,470,312], foot:[0,160], center:[10,60], top:-60, flipX:0, gameH:44,
  anims:{ idle:{dur:2.2,frames:16}, walk:{dur:0.5,frames:10}, fly:{dur:0.4,frames:10}, attack:{dur:0.7,frames:12},
    die:{dur:1.4,frames:20,loop:false,hold:0.6}, hit:{dur:0.3,overlay:true} },
  markup, bind, pose, hit, apply };
})();
