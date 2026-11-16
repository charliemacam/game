/* 三头鬼 Three-head Ghost（Charlie 原画：character-design/three-head-ghost/）
 * 黑暗魔法师的化身。坐标直接用原画像素写，再统一换算。比例按原画量过：
 *   黑色的鬼身，宽宽的肩膀，三根粗脖子各顶着一个长骷髅头（红眼、黑鼻、张开的小嘴），头顶一对粉色弯角，两侧粉色长獠片；
 *   胸口一张白色狐狸脸（橙红斜眼），两肩各一只黄色的眼斑；两条粗黑手臂向两边弯下，末端灰色钩爪；
 *   腰间两个红黑条纹的圆球；下身收成尖尾，插在一滩熔岩里；右边拖着一条紫色长尾巴，背上有黑刺，尾尖是一个长红角的小粉头。
 * Charlie 的回答：走过的地方留下熔岩，只烧士兵，留约 6 秒；三个头可以分别被打掉，每个头血量较低，总血量是三倍；
 *   头越少，攻击力越小；右上角的黑球和灰烟只是装饰（没有做进角色）。
 * 动画名后面加数字表示还剩几个头：walk2 / walk1 …（die 时只剩一个头）。
 * 质感：烟雾一样的黑身体、骨头的裂纹、熔岩发光。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#0d0a0d';
const T=([x,y])=>[f1((x-255)*0.55), f1((y-520)*0.55+150)];
const TP=pts=>pts.map(T);
const HEADS=[[100,150],[255,142],[390,148]];              // 左、中、右
const NECKS=[[[165,245],[132,215],[106,196]],[[255,252],[255,225],[255,198]],[[345,238],[372,214],[392,198]]];

function skull(P,i){
  const [cx,cy]=T(HEADS[i]);
  const sk=organic([[cx-17,cy-26],[cx,cy-32],[cx+17,cy-26],[cx+19,cy-4],[cx+12,cy+18],[cx+7,cy+30],[cx-7,cy+30],[cx-12,cy+18],[cx-19,cy-4]],0.9,1200+i,{sub:2});
  const horn=s=>organic([[cx+s*6,cy-26],[cx+s*12,cy-28],[cx+s*16,cy-46],[cx+s*12,cy-62],[cx+s*9,cy-46]],0.6,1210+i*2+(s>0?1:0));
  const fin=s=>organic([[cx+s*16,cy-12],[cx+s*24,cy-2],[cx+s*24,cy+22],[cx+s*18,cy+34],[cx+s*17,cy+16]],0.6,1220+i*2+(s>0?1:0));
  const eye=(dx)=>`<path d="${organic(ring(cx+dx,cy-8,5.5,7.5,8),0.5,1230+i*3+dx)}" fill="#c8202a" stroke="${OUT}" stroke-width="1.2"/><circle cx="${cx+dx}" cy="${cy-7}" r="2" fill="${OUT}"/>`;
  return `<g id="${P}-h${i}">
    <path d="${fin(-1)}" fill="url(#${P}-pink)" stroke="${OUT}" stroke-width="1.2"/><path d="${fin(1)}" fill="url(#${P}-pink)" stroke="${OUT}" stroke-width="1.2"/>
    <path d="${horn(-1)}" fill="url(#${P}-pink)" stroke="${OUT}" stroke-width="1.2"/><path d="${horn(1)}" fill="url(#${P}-pink)" stroke="${OUT}" stroke-width="1.2"/>
    <path d="${sk}" fill="url(#${P}-bone)" stroke="${OUT}" stroke-width="1.8"/>
    ${scratches(1240+i,cx-16,cy-28,32,56,12,5,'#7a7672',0.7,0.45)}
    <path d="M${cx-4},${cy-28} l2,8 l-3,6" stroke="#5a5652" stroke-width=".9" fill="none"/>
    ${eye(-8)}${eye(8)}
    <path d="M${cx-3},${cy+4} L${cx+3},${cy+4} L${cx},${cy+10}Z" fill="${OUT}"/>
    <ellipse cx="${cx}" cy="${cy+22}" rx="4" ry="4.5" fill="#8a1018" stroke="${OUT}" stroke-width="1"/>
  </g>`;
}
function markup(P){
  const body=organic(TP([[150,228],[200,236],[255,252],[312,236],[362,224],[398,250],[384,302],[334,352],[302,372],[210,372],[170,342],[130,292],[124,256]]),1.6,1250,{sub:2});
  const lower=organic(TP([[200,368],[310,368],[300,420],[275,462],[255,486],[238,462],[214,420]]),1.4,1251,{sub:2});
  const armL=TP([[148,268],[110,300],[86,340],[74,378]]), armR=TP([[372,270],[402,306],[420,346],[432,384]]);
  const pathOf=pts=>`M${pts[0]}Q${pts[1]} ${pts[2]}T${pts[3]}`;
  // 灰色钩爪：一个向内弯的月牙
  // 手臂前端：很短的钢刀，和胳膊差不多粗，接在胳膊上
  const blade=(pts,s)=>{ const a=pts[2], b=pts[3], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, nx=-uy, ny=ux, w=8.5, len=26;
    const [x,y]=b, tip=[x+ux*len+nx*s*4, y+uy*len+ny*s*4];
    return `<path d="M${f1(x+nx*w)},${f1(y+ny*w)} L${f1(x+ux*len*0.65+nx*w*0.9)},${f1(y+uy*len*0.65+ny*w*0.9)} L${f1(tip[0])},${f1(tip[1])} L${f1(x-nx*w)},${f1(y-ny*w)}Z" fill="url(#${P}-steel)" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M${f1(x+nx*w*0.6)},${f1(y+ny*w*0.6)} L${f1(tip[0])},${f1(tip[1])}" stroke="#fff" stroke-width="1.2" opacity=".7"/>
      <path d="M${f1(x+nx*(w+1))},${f1(y+ny*(w+1))} L${f1(x-nx*(w+1))},${f1(y-ny*(w+1))}" stroke="#55525a" stroke-width="4"/>
      <circle cx="${f1(x+nx*4)}" cy="${f1(y+ny*4)}" r="1.4" fill="#ccc"/><circle cx="${f1(x-nx*4)}" cy="${f1(y-ny*4)}" r="1.4" fill="#ccc"/>`; };
  // 背上的炸药桶（只是背着，不参与战斗）
  const barrel=([x,y],rot,k)=>`<g transform="translate(${x},${y}) rotate(${rot})">
    <path d="${organic([[-11,-17],[11,-17],[13,0],[11,17],[-11,17],[-13,0]],0.6,1290+k)}" fill="url(#${P}-barrel)" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M-12,-9 Q0,-7 12,-9 M-12,9 Q0,11 12,9" stroke="${OUT}" stroke-width="3" fill="none"/>
    <ellipse cx="0" cy="-17" rx="11" ry="3" fill="#8a1018" stroke="${OUT}" stroke-width="1.2"/>
    <path d="M3,-18 q5,-8 1,-14" stroke="#4a3a2a" stroke-width="1.5" fill="none"/><circle cx="4" cy="-32" r="1.6" fill="#ffb43a"/>
    <path d="M-5,-3 h10 M0,-6 v6" stroke="#fff" stroke-width="1" opacity=".6"/></g>`;
  // 伤疤：浅色的裂口 + 缝线
  const scar=(x,y,len,ang,k)=>{ const a=ang*Math.PI/180, dx=Math.cos(a)*len/2, dy=Math.sin(a)*len/2, nx=-Math.sin(a), ny=Math.cos(a); let st='';
    const n=Math.max(3,Math.round(len/6)); for(let i=1;i<n;i++){ const t=i/n-0.5; st+=`M${f1(x+dx*2*t+nx*5)},${f1(y+dy*2*t+ny*5)}L${f1(x+dx*2*t-nx*5)},${f1(y+dy*2*t-ny*5)}`; }
    return `<path d="M${f1(x-dx)},${f1(y-dy)} Q${f1(x+nx*3)},${f1(y+ny*3)} ${f1(x+dx)},${f1(y+dy)}" stroke="#c9a0a6" stroke-width="4.2" fill="none" stroke-linecap="round"/>
      <path d="M${f1(x-dx)},${f1(y-dy)} Q${f1(x+nx*2)},${f1(y+ny*2)} ${f1(x+dx)},${f1(y+dy)}" stroke="#5a2a32" stroke-width=".8" fill="none"/>
      <path d="${st}" stroke="#c9b8b0" stroke-width=".9"/>`; };
  const SCARS=[[-44,-14,34,35],[40,-18,32,-25],[18,22,28,15]];   // 少一点、大一点
  // 两条腿：从腰下伸出，交叉着踩进熔岩，红色的爪子
  const legPath=(a,b,c)=>`M${T(a)}Q${T(b)} ${T(c)}`;
  const LEGS=[[[225,372],[262,420],[300,470]],[[285,372],[248,420],[212,470]]];
  const foot=(p,k)=>{ const [x,y]=T(p); return `<path d="M${x-8},${y} l-6,6 M${x-3},${y+1} l-2,8 M${x+3},${y+1} l2,8 M${x+8},${y} l6,6" stroke="#c8202a" stroke-width="3" stroke-linecap="round"/>`; };
  const claw=([x,y],s)=>`<path d="${organic([[x-s*6,y-6],[x+s*8,y-2],[x+s*12,y+10],[x+s*4,y+20],[x-s*10,y+18],[x-s*2,y+12],[x+s*4,y+8],[x,y+2]],0.5,1260+s)}" fill="#9a9692" stroke="${OUT}" stroke-width="1.3"/>`;
  const fox=T([255,300]);
  const lava=organic(ring(0,134,52,20,14),3,1270);
  const R=rng(1271); let lavaBits='';
  for(let i=0;i<10;i++){ const a=R()*6.28, r=R(); lavaBits+=`<path d="${organic(ring(f1(Math.cos(a)*40*r),f1(134+Math.sin(a)*14*r),4+R()*5,3+R()*3,6),1,1272+i)}" fill="${['#ffd24a','#d9262a','#ff7a1a'][i%3]}" opacity=".9"/>`; }
  const tailPts=TP([[300,440],[380,446],[460,422],[530,372],[566,332]]);
  const tail=organic(tailPts,0,1,{sub:1,open:true});
  // 蛇身的鳞片：沿着尾巴撒一排排小弧线；肚皮一条浅色带
  let scales=''; for(let i=0;i<40;i++){ const t=i/40*4, k=Math.floor(t), f=t-k, a=tailPts[k], b=tailPts[Math.min(4,k+1)];
    const u=a[0]+(b[0]-a[0])*f, v=a[1]+(b[1]-a[1])*f; scales+=`M${f1(u-2.5)},${f1(v-1)} q2.5,-2.5 5,0 M${f1(u-1)},${f1(v+2)} q2,-2 4,0`; }
  let tailSp=''; for(let i=1;i<10;i++){ const t=i/10*4, k=Math.floor(t), f=t-k, a=tailPts[k], b=tailPts[Math.min(4,k+1)];
    const u=a[0]+(b[0]-a[0])*f, v=a[1]+(b[1]-a[1])*f, dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1, nx=dy/L, ny=-dx/L;
    tailSp+=`<path d="M${f1(u-dx/L*3)},${f1(v-dy/L*3)}L${f1(u+nx*9)},${f1(v+ny*9)}L${f1(u+dx/L*3)},${f1(v+dy/L*3)}Z" fill="${OUT}"/>`; }
  const th=T([586,316]);
  // 蛇头：和骷髅头一样有细节：三角形的头、竖瞳、鼻孔、嘴线、两颗毒牙、分叉的舌头、两根红角
  const sh=organic([[th[0]-12,th[1]+6],[th[0]-10,th[1]-6],[th[0]+2,th[1]-10],[th[0]+14,th[1]-6],[th[0]+18,th[1]+1],[th[0]+12,th[1]+7],[th[0]-2,th[1]+9]],0.5,1280);
  let necks=''; NECKS.forEach((n,i)=>{ const q=TP(n); necks+=`<path id="${P}-n${i}" d="M${q[0]}Q${q[1]} ${q[2]}" stroke="${OUT}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M${q[0]}Q${q[1]} ${q[2]}" stroke="#2c2830" stroke-width="10" fill="none" stroke-linecap="round" class="n${i}"/>`; });
  const stump=(i)=>{ const a=T(NECKS[i][0]), b=T(NECKS[i][1]), x=f1((a[0]+b[0])/2), y=f1((a[1]+b[1])/2); return `<g id="${P}-st${i}" opacity="0"><path d="M${a}L${x},${y}" stroke="${OUT}" stroke-width="14" stroke-linecap="round"/><ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#5a1018" stroke="${OUT}" stroke-width="1.2"/></g>`; };
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.2,grain:0.17,grainF:0.42,rim:0.35,seed:51})}
  <clipPath id="${P}-bc"><path d="${body}"/></clipPath>
  <radialGradient id="${P}-body" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#4a4650"/><stop offset=".6" stop-color="#2a262e"/><stop offset="1" stop-color="#141216"/></radialGradient>
  <radialGradient id="${P}-bone" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#f2efe8"/><stop offset=".7" stop-color="#cfcac2"/><stop offset="1" stop-color="#9b958c"/></radialGradient>
  <linearGradient id="${P}-pink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d6cc"/><stop offset="1" stop-color="#d89a8c"/></linearGradient>
  <linearGradient id="${P}-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a2088"/><stop offset=".6" stop-color="#8a44c4"/><stop offset="1" stop-color="#a868dc"/></linearGradient>
  <radialGradient id="${P}-snake" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f6c8c0"/><stop offset=".7" stop-color="#e09a98"/><stop offset="1" stop-color="#b8707a"/></radialGradient>
  <linearGradient id="${P}-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f2"/><stop offset=".5" stop-color="#a9adb2"/><stop offset="1" stop-color="#6d7176"/></linearGradient>
  <linearGradient id="${P}-barrel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a1018"/><stop offset=".45" stop-color="#e2343a"/><stop offset="1" stop-color="#7a0e14"/></linearGradient>
  <radialGradient id="${P}-lava" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ff7a1a"/><stop offset="1" stop-color="#c81a10"/></radialGradient>
</defs>
<g id="${P}-lavaG"><path d="${lava}" fill="url(#${P}-lava)" stroke="#7a1208" stroke-width="1.5"/>${lavaBits}</g>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  ${barrel(T([186,360]),-18,0)}${barrel(T([324,360]),18,1)}${barrel(T([255,350]),0,2)}
  <g id="${P}-tail">${tailSp}<path d="${tail}" stroke="${OUT}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="${tail}" stroke="url(#${P}-tail)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="${tail}" stroke="#d8b8e8" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(0,3)" opacity=".7"/>
    <path d="${scales}" stroke="#3a1458" stroke-width=".9" fill="none" opacity=".75"/>
    <path d="M${th[0]-4},${th[1]-8} q-6,-10 -2,-18 q1,8 6,13 M${th[0]+5},${th[1]-9} q0,-12 6,-16 q-2,8 0,14" fill="#c8202a" stroke="${OUT}" stroke-width="1"/>
    <path d="${sh}" fill="url(#${P}-snake)" stroke="${OUT}" stroke-width="1.4"/>
    ${scratches(1288,th[0]-10,th[1]-8,26,14,12,3,'#9a5a8a',0.6,0.5)}
    <path d="M${th[0]-6},${th[1]+3} Q${th[0]+6},${th[1]+5} ${th[0]+17},${th[1]+1}" stroke="${OUT}" stroke-width="1.1" fill="none"/>
    <path d="M${th[0]+8},${th[1]+4} l1,4 l1,-4 M${th[0]+13},${th[1]+3} l1,4 l1,-4" fill="#fff" stroke="${OUT}" stroke-width=".6"/>
    <path d="M${th[0]+17},${th[1]+2} l7,1 l3,-3 M${th[0]+24},${th[1]+3} l3,3" stroke="#c8202a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="${th[0]+5}" cy="${th[1]-3}" rx="3" ry="2.6" fill="#f2cf2a" stroke="${OUT}" stroke-width=".8"/><ellipse cx="${th[0]+5}" cy="${th[1]-3}" rx=".8" ry="2.2" fill="${OUT}"/>
    <circle cx="${th[0]+15}" cy="${th[1]-2}" r=".9" fill="${OUT}"/></g>
  ${LEGS.map((L,k)=>`<path d="${legPath(...L)}" stroke="${OUT}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="${legPath(...L)}" stroke="#2e2a32" stroke-width="12" fill="none" stroke-linecap="round"/>${foot(L[2],k)}`).join('')}
  <g id="${P}-armL"><path d="${pathOf(armL)}" stroke="${OUT}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="${pathOf(armL)}" stroke="#2e2a32" stroke-width="17" fill="none" stroke-linecap="round"/>${blade(armL,-1)}</g>
  <g id="${P}-armR"><path d="${pathOf(armR)}" stroke="${OUT}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="${pathOf(armR)}" stroke="#2e2a32" stroke-width="17" fill="none" stroke-linecap="round"/>${blade(armR,1)}${scar(armR[1][0],armR[1][1],22,-60,11)}</g>
  ${necks}
  <path d="${body}" fill="url(#${P}-body)"/>
  <g clip-path="url(#${P}-bc)">${scratches(1282,-80,-30,160,90,60,10,'#5c5662',0.8,0.4)}
    ${ao(P+'-tex',`M${T([180,250])}Q${T([255,270])} ${T([330,245])}`,8,0.45)}
    ${SCARS.map(([x,y,l,a],k)=>scar(x,y,l,a,k)).join('')}</g>
  <path d="${body}" fill="none" stroke="${OUT}" stroke-width="2.2"/>
  <path d="${organic(TP([[160,262],[192,270],[178,282]]),0.6,1283)}" fill="#f2cf2a" stroke="${OUT}" stroke-width="1"/>
  <path d="${organic(TP([[332,250],[362,244],[350,262]]),0.6,1284)}" fill="#f2cf2a" stroke="${OUT}" stroke-width="1"/>
  <path d="M${T([176,268])}l1,6 M${T([347,250])}l1,6" stroke="${OUT}" stroke-width="1.6"/>
  <g id="${P}-fox">
    <path d="${organic([[fox[0]-18,fox[1]-8],[fox[0]-14,fox[1]-24],[fox[0]-6,fox[1]-12],[fox[0]+6,fox[1]-12],[fox[0]+14,fox[1]-24],[fox[0]+18,fox[1]-8],[fox[0]+8,fox[1]+16],[fox[0],fox[1]+22],[fox[0]-8,fox[1]+16]],0.7,1285)}" fill="#f4f1ea" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M${fox[0]-12},${fox[1]-6} l8,3 l-7,2Z M${fox[0]+12},${fox[1]-6} l-8,3 l7,2Z" fill="#e8642a" stroke="${OUT}" stroke-width=".8"/>
    <path d="M${fox[0]-2},${fox[1]+6} h4 l-2,3Z" fill="${OUT}"/>
    <path d="M${fox[0]-5},${fox[1]+13} l2,3 l2,-3 l2,3 l2,-3" fill="none" stroke="${OUT}" stroke-width=".9"/>
  </g>
  ${[0,1,2].map(stump).join('')}
  ${[0,1,2].map(i=>skull(P,i)).join('')}
</g></g></g>`;
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','armL','armR','tail','fox','lavaG','flip']) el[k]=q(k);
  el.h=[0,1,2].map(i=>q('h'+i)); el.st=[0,1,2].map(i=>q('st'+i)); el.n=[0,1,2].map(i=>svg.querySelectorAll(`#${P}-n${i}, .n${i}`)); return el; }

const BASE={bobY:0,rot:0,aL:0,aR:0,h0:0,h1:0,h2:0,tail:0,dY:0,sq:1,alpha:1,flash:0,lava:1,heads:3};
const ATTACK=[[0,{}],[0.3,{aL:-26,aR:26,h0:-8,h1:-6,h2:8,bobY:-4}],[0.5,{aL:30,aR:-30,h0:10,h1:8,h2:-10,bobY:3,sq:0.97}],[0.7,{aL:16,aR:-16}],[1,{}]];
const DIE=[[0,{}],[0.12,{flash:1,bobY:-8,aL:-30,aR:30}],[0.6,{dY:20,sq:0.6,aL:40,aR:-40,alpha:0.85,lava:0.6}],[1,{dY:30,sq:0.4,aL:40,aR:-40,alpha:0,lava:0}]];
function pose(name,p){
  const m=/^(\D+)(\d)?$/.exec(name), anim=m[1], heads=m[2]?+m[2]:(anim==='die'?1:3);
  let o={...BASE}; const w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w)*3; o.h0=Math.sin(w)*5; o.h1=Math.sin(w+1)*4; o.h2=Math.sin(w+2)*5; o.tail=Math.sin(w)*4; o.aL=Math.sin(w)*4; o.aR=-Math.sin(w)*4; }
  else if(anim==='walk'){ o.bobY=Math.sin(w*2)*3; o.rot=Math.sin(w)*2; o.h0=Math.sin(w)*7; o.h1=Math.sin(w+1.2)*5; o.h2=Math.sin(w+2.4)*7; o.tail=Math.sin(w)*8; o.aL=Math.sin(w)*8; o.aR=Math.sin(w)*8; o.lava=0.85+Math.sin(w*2)*0.15; }
  else if(anim==='attack') o=kf(BASE,ATTACK,p);
  else if(anim==='die') o=kf(BASE,DIE,p);
  o.heads=heads; return o; }
function hit(o,k){ o.flash=k; o.bobY-=3*k; o.h1-=8*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,140) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-140)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)})`);
  const sh=T([148,268]), sr=T([372,270]); S(el.armL,`rotate(${f1(o.aL)} ${sh})`); S(el.armR,`rotate(${f1(o.aR)} ${sr})`);
  S(el.tail,`rotate(${f1(o.tail)} ${T([300,440])})`);
  // 掉头顺序：先右、再左，最后剩中间
  const alive=[o.heads>=2, true, o.heads>=3];
  el.h.forEach((h,i)=>{ const [x,y]=T(NECKS[i][2]); S(h,`rotate(${f1(o['h'+i])} ${x},${y})`); h.setAttribute('opacity',alive[i]?1:0);
    el.st[i].setAttribute('opacity',alive[i]?0:1); el.n[i].forEach(n=>n.setAttribute('opacity',alive[i]?1:0.0)); });
  el.lavaG.setAttribute('opacity',(o.lava*o.alpha).toFixed(2)); }

const A={ idle:{dur:2.6,frames:16}, walk:{dur:1.0,frames:12}, attack:{dur:0.7,frames:12}, die:{dur:1.5,frames:20,loop:false,hold:0.5}, hit:{dur:0.3,overlay:true} };
for(const n of [2,1]){ A['walk'+n]={...A.walk}; A['attack'+n]={...A.attack}; }
window.CHARS.threeHeadGhost={ name:'三头鬼', nameEn:'Three-head Ghost', source:'three-head-ghost/concept-source/page03b.jpg',
  viewBox:[-140,-118,370,290], foot:[0,140], center:[0,20], top:-100, flipX:0, gameH:56,
  anims:A, markup, bind, pose, hit, apply };
})();
