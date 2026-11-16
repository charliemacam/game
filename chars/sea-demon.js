/* 海之魔 Demon of the Seas 和 小海魔 Small Sea Demon（Charlie 原画：character-design/demon-of-the-seas/、character-design/small-sea-demon/）
 * 海之魔（比例按原画量过）：蓝色子弹形的高头，顶上一对灰色大羊角，两侧几个灰色小钩爪；额头一排六只小眼睛；
 *   一张占满下半个头的血红大嘴，上下两排尖牙；头下面是一团红色章鱼触手（八条），触手外侧一排深色尖刺。
 * 小海魔：小小的蓝色圆顶头，头顶一圈黑刺，额头一排小眼睛，张大的黑嘴有红唇和牙齿；下面是红色触手裙，尖端有刺。
 * Charlie 的回答：海之魔把触手上的尖刺扔出去当远程攻击，扔完会再长出来；陆地上也能走；小海魔和海之魔是一家。
 *   小海魔抓住士兵 2 秒后，和士兵一起变成海之魔（要有变身动画）。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#140a0c';
function tentacle(P,pts,w0,seed,spk,id){                 // 一条由粗到细的触手，外侧一排尖刺
  const N=16, C=[], L=[], Rr=[];
  const q=(t)=>{ const n=pts.length-1, s=Math.min(n-1e-6,t*n), k=Math.floor(s), f=s-k, a=pts[k], b=pts[k+1]; return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]; };
  for(let i=0;i<=N;i++){ const t=i/N, p=q(t), p2=q(Math.min(1,t+0.02)), p1=q(Math.max(0,t-0.02)), dx=p2[0]-p1[0], dy=p2[1]-p1[1], l=Math.hypot(dx,dy)||1, w=w0*(1-t*0.85);
    C.push([p,dx/l,dy/l,w]); L.push([p[0]-dy/l*w,p[1]+dx/l*w]); Rr.push([p[0]+dy/l*w,p[1]-dx/l*w]); }
  let sp=''; for(let i=2;i<N;i+=2){ const [p,ux,uy,w]=C[i], nx=uy, ny=-ux, l=3+w*0.9;
    sp+=`M${f1(p[0]+nx*w-ux*2)},${f1(p[1]+ny*w-uy*2)}L${f1(p[0]+nx*(w+l)+ux*2)},${f1(p[1]+ny*(w+l)+uy*2)}L${f1(p[0]+nx*w+ux*2.5)},${f1(p[1]+ny*w+uy*2.5)}Z`; }
  const d=organic([...L,...Rr.reverse()],0.5,seed,{sub:1});
  let suck=''; for(let i=3;i<N;i+=3){ const [p,ux,uy,w]=C[i]; suck+=`<circle cx="${f1(p[0]-uy*w*0.45)}" cy="${f1(p[1]+ux*w*0.45)}" r="${f1(Math.max(0.8,w*0.22))}" fill="#f7a8a0" stroke="#7a1010" stroke-width=".6"/>`; }
  return `<g ${id?`id="${id}"`:''}><g class="spk"><path d="${sp}" fill="#2a2228" stroke="${OUT}" stroke-width=".6"/></g>
    <path d="${d}" fill="url(#${P}-red)" stroke="${OUT}" stroke-width="1.5"/>${suck}</g>`;
}
/* ---------- 海之魔 ---------- */
const T=([x,y])=>[f1((x-345)*0.5), f1((y-560)*0.5+150)];
const TP=pts=>pts.map(T);
const TENT=[[[330,410],[240,385],[180,330],[158,300]],[[322,440],[210,432],[100,405],[62,430]],[[322,470],[220,505],[130,522],[82,492]],[[332,480],[285,540],[245,592],[218,566]],
  [[350,480],[398,540],[428,598],[468,580]],[[362,470],[455,502],[560,522],[640,500]],[[362,440],[462,410],[540,360],[562,320]],[[352,410],[420,334],[470,292],[500,302]]];
function markupBig(P){
  const head=organic(TP([[285,100],[330,80],[400,85],[440,120],[452,200],[446,282],[420,342],[360,362],[300,342],[276,262],[270,160]]),1.6,1701,{sub:2});
  const mouth=organic(TP([[290,215],[330,200],[400,205],[440,232],[432,302],[392,334],[330,328],[296,292]]),1.2,1702,{sub:2});
  let teeth=''; const mt=[[296,222],[310,212],[326,206],[342,204],[358,204],[374,205],[390,208],[406,214],[420,222],[432,234]], mb=[[302,296],[318,312],[336,322],[354,326],[372,326],[390,320],[406,310],[420,296]];
  mt.forEach(([x,y],i)=>{ const a=T([x-6,y]), b=T([x+6,y]), t=T([x,y+22+(i%2)*6]); teeth+=`M${a}L${t}L${b}Z`; });
  mb.forEach(([x,y],i)=>{ const a=T([x-6,y]), b=T([x+6,y]), t=T([x,y-20-(i%2)*6]); teeth+=`M${a}L${t}L${b}Z`; });
  const horn=(pts,s)=>`<path d="${organic(TP(pts),0.6,s)}" fill="url(#${P}-horn)" stroke="${OUT}" stroke-width="1.5"/>${[0.3,0.55,0.8].map(k=>{ const a=T(pts[0]),b=T(pts[3]); return `<path d="M${f1(a[0]+(b[0]-a[0])*k-3)},${f1(a[1]+(b[1]-a[1])*k)} l6,-2" stroke="#6a6258" stroke-width="1"/>`; }).join('')}`;
  const hook=(p,dir,s)=>{ const [x,y]=T(p); return `<path d="M${x},${y} q${dir*10},-2 ${dir*12},-10 q${dir*-2},6 ${dir*-8},10Z" fill="#9a958e" stroke="${OUT}" stroke-width="1.1"/>`; };
  let eyes=''; [[310,172],[332,162],[356,156],[380,158],[404,166],[426,178]].forEach(([x,y],i)=>{ const [u,v]=T([x,y]); eyes+=`<circle cx="${u}" cy="${v}" r="4" fill="#fff" stroke="${OUT}" stroke-width="1"/><circle cx="${f1(u+0.5)}" cy="${f1(v+0.6)}" r="1.8" fill="${OUT}"/>`; });
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.2,grain:0.18,grainF:0.42,rim:0.42,seed:91})}
  <clipPath id="${P}-hc"><path d="${head}"/></clipPath>
  <radialGradient id="${P}-blue" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#8fe0f6"/><stop offset=".6" stop-color="#3aa8dc"/><stop offset="1" stop-color="#1c6aa0"/></radialGradient>
  <linearGradient id="${P}-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f04a40"/><stop offset=".6" stop-color="#d42020"/><stop offset="1" stop-color="#8e1010"/></linearGradient>
  <linearGradient id="${P}-horn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2ddd2"/><stop offset="1" stop-color="#8a847a"/></linearGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="152" rx="120" ry="9" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-tents">${TENT.map((t,i)=>`<g id="${P}-t${i}">${tentacle(P,TP(t),i===3||i===4?12:14,1710+i)}</g>`).join('')}</g>
  <path d="${organic(TP([[300,320],[420,320],[400,410],[370,450],[310,450],[285,410]]),1.4,1719,{sub:2})}" fill="url(#${P}-red)" stroke="${OUT}" stroke-width="1.6"/>
  <path d="${organic(ring(...T([340,440]),26,20,10),1.2,1720)}" fill="#a81818" stroke="${OUT}" stroke-width="1.6"/>
  ${scratches(1725,T([290,0])[0],T([0,330])[1],60,55,24,8,'#6a0a10',0.8,0.5,Math.PI/2)}
  <g id="${P}-head">
    ${horn([[306,132],[262,118],[246,78],[276,40],[286,80],[312,108]],1721)}${horn([[404,124],[438,96],[442,52],[470,84],[462,120],[430,140]],1722)}
    ${hook([268,182],-1)}${hook([262,232],-1)}${hook([446,192],1)}${hook([450,250],1)}
    <path d="${head}" fill="url(#${P}-blue)" stroke="${OUT}" stroke-width="2"/>
    <g clip-path="url(#${P}-hc)">${scratches(1723,T([270,0])[0],T([0,80])[1],92,140,40,8,'#1c5a88',0.8,0.4)}</g>
    ${eyes}
    <path d="M${T([316,188])}Q${T([360,180])} ${T([420,194])}" stroke="#c8202a" stroke-width="3" fill="none"/>
    <g id="${P}-jaw"><path d="${mouth}" fill="#6a0a10" stroke="${OUT}" stroke-width="1.8"/>
      <path d="${organic(TP([[320,240],[400,240],[410,290],[330,296]]),1.5,1724)}" fill="#c8202a" opacity=".8"/>
      <path d="${teeth}" fill="#fbf6ea" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/></g>
  </g>
</g></g></g>`;
}
function bindBig(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','head','jaw','shadow','flip']) el[k]=q(k);
  el.t=TENT.map((_,i)=>q('t'+i)); el.spk=[...svg.querySelectorAll('#'+P+'-tents .spk')]; return el; }
const BB={bobY:0,rot:0,head:0,jaw:1,wig:0,spk:1,dY:0,sq:1,alpha:1,flash:0};
const ATK=[[0,{}],[0.35,{head:-8,jaw:1.3,bobY:-4}],[0.55,{head:8,jaw:0.8,bobY:3,sq:0.96}],[1,{}]];
const THROW=[[0,{}],[0.3,{bobY:-5,sq:1.04,wig:0.3}],[0.42,{spk:0,bobY:3,sq:0.95,wig:-0.3}],[0.75,{spk:0.2}],[1,{spk:1}]];   // 扔出尖刺，再慢慢长回来
const DIEB=[[0,{}],[0.15,{flash:1,jaw:1.5}],[0.55,{dY:16,sq:0.6,rot:-8,head:20,jaw:1.4}],[0.85,{dY:20,sq:0.55,rot:-10,head:24,alpha:0.8}],[1,{dY:20,sq:0.55,rot:-10,head:24,alpha:0}]];
function poseBig(anim,p){ const o={...BB}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*2; o.wig=Math.sin(w); o.head=Math.sin(w)*3; o.jaw=1+Math.max(0,Math.sin(w*2))*0.15; }
  else if(anim==='walk'){ o.bobY=-Math.abs(Math.sin(w))*4; o.wig=Math.sin(w)*1.6; o.rot=Math.sin(w)*2; o.head=Math.sin(w*2)*2; }
  else if(anim==='attack') return kf(BB,ATK,p);
  else if(anim==='throw') return kf(BB,THROW,p);
  else if(anim==='die') return kf(BB,DIEB,p);
  return o; }
function hitBig(o,k){ o.flash=k; o.bobY-=3*k; o.jaw+=0.3*k; }
function applyBig(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,150) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-150)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3)); S(el.bob,`translate(0,${f1(o.bobY)})`);
  const hp=T([360,360]); S(el.head,`rotate(${f1(o.head)} ${hp})`);
  const jp=T([360,215]); S(el.jaw,`translate(${jp}) scale(1,${o.jaw.toFixed(3)}) translate(${-jp[0]},${-jp[1]})`);
  const c=T([340,440]); el.t.forEach((t,i)=>S(t,`rotate(${f1(o.wig*(i%2?6:-6)*(i<4?1:-1))} ${c})`));
  el.spk.forEach(s=>{ s.setAttribute('opacity',o.spk.toFixed(2)); });
  el.shadow.setAttribute('rx',f1(120*(0.5+0.5*o.alpha))); }
window.CHARS.seaDemon={ name:'海之魔', nameEn:'Demon of the Seas', source:'demon-of-the-seas/concept-source/page04b.jpg',
  viewBox:[-160,-180,330,350], foot:[0,150], center:[0,0], top:-150, flipX:0, gameH:52, spikePt:T([340,440]),
  anims:{ idle:{dur:2.4,frames:16}, walk:{dur:1.2,frames:12}, attack:{dur:0.8,frames:12}, throw:{dur:1.0,frames:12}, die:{dur:1.5,frames:20,loop:false,hold:0.5}, hit:{dur:0.3,overlay:true} },
  markup:markupBig, bind:bindBig, pose:poseBig, hit:hitBig, apply:applyBig };

/* ---------- 小海魔 ---------- */
const T2=([x,y])=>[f1((x-260)*0.5), f1((y-410)*0.5+75)];
const TP2=pts=>pts.map(T2);
function markupSmall(P){
  const head=organic(TP2([[190,255],[188,170],[210,122],[250,104],[292,116],[312,172],[312,255]]),1.2,1750,{sub:2});
  let spikes=''; [[198,148,-150],[214,118,-125],[240,104,-100],[268,104,-80],[292,118,-55],[308,146,-30]].forEach(([x,y,a])=>{ const [u,v]=T2([x,y]), r=a*Math.PI/180;
    spikes+=`<path d="M${f1(u-Math.sin(r)*3)},${f1(v+Math.cos(r)*3)}L${f1(u+Math.cos(r)*12)},${f1(v+Math.sin(r)*12)}L${f1(u+Math.sin(r)*3)},${f1(v-Math.cos(r)*3)}Z" fill="#2a2228" stroke="${OUT}" stroke-width=".8"/>`; });
  let eyes=''; [225,238,251,264,277].forEach((x,i)=>{ const [u,v]=T2([x,150+Math.abs(x-251)*0.1]); eyes+=`<circle cx="${u}" cy="${v}" r="2.6" fill="#fff" stroke="${OUT}" stroke-width=".7"/><circle cx="${u}" cy="${v}" r="1.1" fill="${OUT}"/>`; });
  const skirt=organic(TP2([[182,255],[318,255],[350,325],[402,330],[362,352],[382,410],[332,378],[302,412],[270,378],[240,412],[210,372],[168,402],[172,350],[128,332],[172,318]]),1,1751,{sub:1});
  let tips=''; [[402,330],[382,410],[302,412],[240,412],[168,402],[128,332]].forEach(([x,y])=>{ const [u,v]=T2([x,y]); tips+=`<path d="M${u-2},${v} l2,5 l2,-5Z" fill="#2a2228"/>`; });
  const [mx,my]=T2([248,202]);
  return `
<defs>
  ${texFilter(P+'-tex',{rough:1.6,grain:0.18,grainF:0.5,rim:0.4,rimBlur:2.4,aoBlur:2,seed:93})}
  <radialGradient id="${P}-blue" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#8fe0f6"/><stop offset=".6" stop-color="#3aa8dc"/><stop offset="1" stop-color="#1c6aa0"/></radialGradient>
  <linearGradient id="${P}-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f04a40"/><stop offset=".6" stop-color="#d42020"/><stop offset="1" stop-color="#8e1010"/></linearGradient>
  <radialGradient id="${P}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#8fe0f6" stop-opacity=".6"/><stop offset="1" stop-color="#3aa8dc" stop-opacity="0"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="76" rx="55" ry="6" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  <g id="${P}-skirt"><path d="${skirt}" fill="url(#${P}-red)" stroke="${OUT}" stroke-width="1.5"/>${tips}
    ${scratches(1752,-60,15,120,60,30,6,'#8e1010',0.8,0.4,Math.PI/2)}</g>
  ${spikes}
  <path d="${head}" fill="url(#${P}-blue)" stroke="${OUT}" stroke-width="1.8"/>
  ${scratches(1753,-34,-60,68,70,20,5,'#1c5a88',0.7,0.4)}
  ${eyes}
  <g id="${P}-mouth"><ellipse cx="${mx}" cy="${my}" rx="10" ry="15" fill="#c8202a" stroke="${OUT}" stroke-width="1.2"/>
    <ellipse cx="${mx}" cy="${my+1}" rx="7" ry="12" fill="#151012"/>
    <path d="M${mx-6},${my-8} l2,4 l2,-4 l2,4 l2,-4 l2,4 M${mx-6},${my+9} l2,-4 l2,4 l2,-4 l2,4 l2,-4" stroke="#fff" stroke-width=".9" fill="none"/></g>
</g></g></g>
<circle id="${P}-glow" cx="0" cy="20" r="70" fill="url(#${P}-glow)" opacity="0"/>`;
}
function bindSmall(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','skirt','mouth','shadow','flip','glow']) el[k]=q(k); return el; }
const SB={bobY:0,rot:0,sk:1,mouth:1,dY:0,sq:1,sc:1,alpha:1,flash:0,glow:0,spin:0};
const ATS=[[0,{}],[0.4,{bobY:-5,mouth:1.4,sq:1.06}],[0.6,{bobY:2,mouth:0.8,sq:0.94}],[1,{}]];
// 变身：抖动、越胀越大、转起来，最后一道亮光（之后游戏里换成海之魔）
const MORPH=[[0,{}],[0.25,{sc:1.1,rot:-8,mouth:1.5}],[0.45,{sc:1.25,rot:8,mouth:1.7,glow:0.3}],[0.7,{sc:1.5,rot:-14,spin:120,glow:0.6}],[0.9,{sc:1.8,spin:300,glow:1,alpha:0.7}],[1,{sc:2,spin:360,glow:1,alpha:0.3}]];
const DIES=[[0,{}],[0.15,{flash:1,mouth:1.5}],[0.6,{dY:8,sq:0.5,alpha:0.8}],[1,{dY:10,sq:0.4,alpha:0}]];
function poseSmall(anim,p){ const o={...SB}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*2; o.sk=1+Math.sin(w*2)*0.05; }
  else if(anim==='walk'){ o.bobY=-Math.abs(Math.sin(w))*4; o.rot=Math.sin(w)*4; o.sk=1+Math.sin(w*2)*0.08; }
  else if(anim==='attack') return kf(SB,ATS,p);
  else if(anim==='morph') return kf(SB,MORPH,p);
  else if(anim==='die') return kf(SB,DIES,p);
  return o; }
function hitSmall(o,k){ o.flash=k; o.bobY-=3*k; }
function applySmall(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,74) rotate(${f1(o.rot+o.spin)} 0 -40) scale(${o.sc.toFixed(3)},${(o.sc*o.sq).toFixed(3)}) translate(0,-74)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3)); S(el.bob,`translate(0,${f1(o.bobY)})`);
  S(el.skirt,`translate(0,30) scale(${o.sk.toFixed(3)},1) translate(0,-30)`);
  const [mx,my]=T2([248,202]); S(el.mouth,`translate(${mx},${my}) scale(1,${o.mouth.toFixed(3)}) translate(${-mx},${-my})`);
  el.glow.setAttribute('opacity',o.glow.toFixed(2)); el.glow.setAttribute('r',f1(40+o.glow*50));
  el.shadow.setAttribute('rx',f1(55*o.sc*(0.5+0.5*o.alpha))); }
window.CHARS.smallSeaDemon={ name:'小海魔', nameEn:'Small Sea Demon', source:'small-sea-demon/concept-source/page11d.jpg',
  viewBox:[-100,-110,200,200], foot:[0,74], center:[0,0], top:-75, flipX:0, gameH:32,
  anims:{ idle:{dur:1.8,frames:12}, walk:{dur:0.6,frames:10}, attack:{dur:0.6,frames:10}, morph:{dur:2,frames:24}, die:{dur:1,frames:14,loop:false,hold:0.3}, hit:{dur:0.3,overlay:true} },
  markup:markupSmall, bind:bindSmall, pose:poseSmall, hit:hitSmall, apply:applySmall };
})();
