/* 飞船 Spaceship 和 半飞船 Half Spaceship（Charlie 原画：character-design/spaceship/、character-design/half-spaceship/）
 * 比例按原画量过：
 *   飞船：稍微倾斜的灰色大椭圆船身（宽:高 约 1.4），上面一道接缝；顶上三根黑色大炮（炮口冒红火），
 *     船身上还有八门朝左上的黑色小炮（炮口红色）；左下方是蓝色的驾驶舱，里面趴着橙色的驾驶员（操控怪）。
 *   半飞船：右上一大块被打掉，裂口是锯齿形；那块顶盖歪在右上方，下沿烧成黄色锯齿；三根大炮没了，剩下六门小炮；
 *     蓝色驾驶舱更大，驾驶员露出牙齿和手脚，舱底有裂纹。
 * Charlie 的回答：飞在天上，炮塔和士兵打不到；开炮打士兵，炮弹在附近炸开时也会伤到自己这边的怪物（25%）；
 *   飞船 → 半飞船 → 操控怪是同一个故事；半飞船满血重新开始；血越少飞得越慢。
 * 质感：金属拉丝、铆接缝、烟熏、炮口烧黑、驾驶舱玻璃反光。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#151417';
const BIG=[[[-34,-56]],[[2,-64]],[[38,-60]]];             // 推进孔根部
const SMALL=[[-66,-14],[-40,-38],[-14,-22],[16,-44],[40,-16],[-30,8],[8,6],[56,-2]];

function gun(x,y,len,w,ang,seed,flame,P,id){       // 一门炮：黑色炮管 + 红色炮口
  const a=ang*Math.PI/180, dx=Math.cos(a), dy=Math.sin(a), nx=-dy, ny=dx, tx=x+dx*len, ty=y+dy*len;
  const p=[[x+nx*w,y+ny*w],[tx+nx*w*0.75,ty+ny*w*0.75],[tx-nx*w*0.75,ty-ny*w*0.75],[x-nx*w,y-ny*w]];
  return `<g ${id?`id="${P}-${id}"`:''}><path d="${organic(p,0.6,seed)}" fill="url(#${P}-gun)" stroke="${OUT}" stroke-width="1.6"/>
    <path d="M${f1(tx+nx*w*0.8)},${f1(ty+ny*w*0.8)}L${f1(tx-nx*w*0.8)},${f1(ty-ny*w*0.8)}" stroke="#c02218" stroke-width="${f1(w*0.9)}" stroke-linecap="round"/>
    ${flame?`<g class="fl"><path d="M${f1(tx+nx*w*0.7)},${f1(ty+ny*w*0.7)} L${f1(tx+dx*18+nx*5)},${f1(ty+dy*18+ny*5)} L${f1(tx+dx*12)},${f1(ty+dy*12)} L${f1(tx+dx*20-nx*4)},${f1(ty+dy*20-ny*4)} L${f1(tx-nx*w*0.7)},${f1(ty-ny*w*0.7)}Z" fill="url(#${P}-fire)" opacity=".95"/></g>`:''}
  </g>`;
}

// 推进孔：喇叭形喷口，朝斜后方（飞船朝右飞，后方 = 左边）
function thruster(P,i,x,y,ang,len){
  const a=ang*Math.PI/180, dx=Math.cos(a), dy=Math.sin(a), nx=-dy, ny=dx, tx=x+dx*len, ty=y+dy*len;
  const tube=organic([[x+nx*6,y+ny*6],[tx+nx*7,ty+ny*7],[tx+nx*12+dx*8,ty+ny*12+dy*8],[tx-nx*12+dx*8,ty-ny*12+dy*8],[tx-nx*7,ty-ny*7],[x-nx*6,y-ny*6]],0.6,1030+i);
  const mx=tx+dx*8, my=ty+dy*8;
  return `<g id="${P}-big${i}"><path d="${tube}" fill="url(#${P}-gun)" stroke="${OUT}" stroke-width="1.6"/>
    <path d="M${f1(mx+nx*11)},${f1(my+ny*11)}L${f1(mx-nx*11)},${f1(my-ny*11)}" stroke="#c02218" stroke-width="3" stroke-linecap="round"/>
    <path class="fl" d="M${f1(mx+nx*10)},${f1(my+ny*10)} L${f1(mx+dx*26+nx*7)},${f1(my+dy*26+ny*7)} L${f1(mx+dx*18)},${f1(my+dy*18)} L${f1(mx+dx*30-nx*5)},${f1(my+dy*30-ny*5)} L${f1(mx-nx*10)},${f1(my-ny*10)}Z" fill="url(#${P}-fire)" opacity=".95"/>
  </g>`;
}
// 逃生舱：玻璃罩里是驾驶员（操控怪）的下半身：橙色的屁股、白肚皮的下半截、两条短爪腿
function pod(P){
  const glass=organic(ring(-18,40,44,24,14),0.8,1010);
  return `<clipPath id="${P}-podc"><path d="${glass}"/></clipPath>
    <path d="${glass}" fill="#2b6f98" stroke="${OUT}" stroke-width="2"/>
    <g clip-path="url(#${P}-podc)">
      <path d="${organic(ring(-18,30,30,26,12),1,1011)}" fill="#e98a22" stroke="${OUT}" stroke-width="1.4"/>
      ${scratches(1013,-46,10,56,40,30,5,'#a8520c',0.8,0.45,Math.PI/2)}
      <path d="${organic([[-32,22],[-4,22],[-6,44],[-18,50],[-30,44]],0.6,1012)}" fill="#f6e2dc" stroke="${OUT}" stroke-width="1.2"/>
      <path d="M-25,22 Q-25,38 -24,46 M-18,22 V49 M-11,22 Q-11,38 -12,46" stroke="#6b4a40" stroke-width="1.2" fill="none"/>
      <path d="M-34,52 l-3,10 M-34,52 l-6,7 M-34,52 l1,10 M-2,52 l2,10 M-2,52 l6,7 M-2,52 l-1,10" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M-38,46 L-32,56 L-28,48Z M-8,48 L-2,56 L2,46Z" fill="#e98a22" stroke="${OUT}" stroke-width="1"/>
      <path d="M-56,30 Q-40,20 -20,20" stroke="#fff" stroke-width="3" opacity=".45" fill="none"/>
      <rect x="-70" y="14" width="110" height="60" fill="url(#${P}-glass)"/>
    </g>
    <path d="${glass}" fill="none" stroke="#9fd8f2" stroke-width="1.2" opacity=".7" transform="translate(0,-1.5)"/>`;
}
function make(half){
  return function markup(P){
    const hull=organic(ring(0,0,94,66,18,0),2,1000);
    const R=rng(1004);
    // 小炮都朝斜后方，和推进孔平行
    const guns=SMALL.map(([x,y],i)=>gun(x,y,16,4.6,-148+R()*6,1020+i,false,P)).join('');
    const bigs=half?'':BIG.map(([[x,y]],i)=>thruster(P,i,x,y,-150+i*6,24)).join('');
    // 半飞船：后面是一个长方形的火箭推进器，尾部喷黄色锯齿火焰
    let booster='';
    if(half){ const bx=-128, by=-80, bw=92, bh=24;
      let teeth=''; for(let k=0;k<6;k++) teeth+=`L${bx-10-(k%2?14:4)},${by+2+k*(bh-4)/5}`;
      booster=`<g id="${P}-booster" transform="rotate(-8 ${bx+bw} ${by+bh})">
        <path d="M${bx},${by+2} ${teeth} L${bx},${by+bh-2}Z" fill="url(#${P}-fire)" stroke="#b8600a" stroke-width="1"/>
        <path d="${organic([[bx,by],[bx+bw,by],[bx+bw,by+bh],[bx,by+bh]],0.8,1060)}" fill="url(#${P}-hull)" stroke="${OUT}" stroke-width="2"/>
        <path d="M${bx+6},${by+5} H${bx+bw-6}" stroke="#fff" stroke-width="1.4" opacity=".4"/>
        <path d="M${bx+bw*0.35},${by} V${by+bh} M${bx+bw*0.7},${by} V${by+bh}" stroke="${OUT}" stroke-width="1.4"/>
        <rect x="${bx-4}" y="${by-2}" width="8" height="${bh+4}" rx="2" fill="#3a3a40" stroke="${OUT}" stroke-width="1.2"/>
        ${scratches(1061,bx,by,bw,bh,10,8,'#55575c',0.8,0.4,0)}
        <path d="M${bx+bw-10},${by+bh} L${bx+bw+6},${by+bh+12}" stroke="${OUT}" stroke-width="5"/></g>`; }
    return `
<defs>
  ${texFilter(P+'-tex',{rough:2,grain:0.15,grainF:0.32,rim:0.45,seed:31})}
  <clipPath id="${P}-hc"><path d="${hull}"/></clipPath>
  <radialGradient id="${P}-hull" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#d7d8da"/><stop offset=".6" stop-color="#9a9ca0"/><stop offset="1" stop-color="#5e6064"/></radialGradient>
  <linearGradient id="${P}-gun" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#101012"/><stop offset=".5" stop-color="#3a3a40"/><stop offset="1" stop-color="#0d0d0f"/></linearGradient>
  <linearGradient id="${P}-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe8ff" stop-opacity=".45"/><stop offset=".5" stop-color="#5fb8e8" stop-opacity=".15"/><stop offset="1" stop-color="#1c5f88" stop-opacity=".35"/></linearGradient>
  <linearGradient id="${P}-fire" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ff6a1a"/><stop offset="1" stop-color="#d81e10"/></linearGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="118" rx="80" ry="10" fill="rgba(0,0,0,.22)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob"><g transform="scale(-1,1) rotate(-6)">
  ${booster}${bigs}
  <path d="${hull}" fill="url(#${P}-hull)" stroke="${OUT}" stroke-width="2.4"/>
  <g clip-path="url(#${P}-hc)">
    ${scratches(1040,-94,-66,188,132,60,12,'#55575c',0.8,0.45,-0.25)}
    <path d="M-82,-30 Q0,-58 86,-24" stroke="${OUT}" stroke-width="1.8" fill="none"/>
    <path d="M-82,-28 Q0,-55 86,-22" stroke="#fff" stroke-width="1" fill="none" opacity=".35" transform="translate(0,2)"/>
    ${half?`<path d="M30,10 l8,-6 l4,8 l9,-4 M50,30 l10,4 l2,8" stroke="${OUT}" stroke-width="1.3" fill="none"/>`:''}
    ${ao(P+'-tex','M-80,50 Q0,76 80,30',14,0.4)}
  </g>
  ${pod(P)}
  ${guns}
  <g id="${P}-muzzle" opacity="0"><circle cx="-60" cy="-56" r="10" fill="url(#${P}-fire)"/></g>
</g></g></g></g>
<g id="${P}-fx">${[0,1,2].map(i=>`<circle id="${P}-sm${i}" r="10" fill="#55565a" opacity="0"/>`).join('')}</g>`;
  };
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','muzzle','shadow','flip']) el[k]=q(k);
  el.big=[0,1,2].map(i=>q('big'+i)); el.sm=[0,1,2].map(i=>q('sm'+i)); return el; }

const BASE={bobY:0,rot:0,recoil:0,muzzle:0,dY:0,sq:1,alpha:1,flash:0,smoke:0,spin:0};
const SHOOT=[[0,{}],[0.2,{recoil:-6,muzzle:1,rot:3}],[0.5,{recoil:2,muzzle:0.3}],[1,{}]];
const DIE=[[0,{}],[0.12,{flash:1,smoke:0.1}],[0.6,{dY:60,spin:40,smoke:0.6,alpha:0.9}],[1,{dY:90,spin:70,smoke:1,alpha:0}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'||anim==='walk'){ o.bobY=Math.sin(w)*4; o.rot=Math.sin(w)*2+(anim==='walk'?-4:0); }
  else if(anim==='attack'||anim==='shoot') return kf(BASE,SHOOT,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.bobY-=3*k; o.rot+=3*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) rotate(${f1(o.spin)} 0 0)`); el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(${f1(o.recoil)},${f1(o.bobY)}) rotate(${f1(o.rot)})`);
  el.big.forEach(b=>b&&S(b,`translate(${f1(o.recoil*0.4)},${f1(o.recoil*0.8)})`));
  el.muzzle.setAttribute('opacity',o.muzzle.toFixed(2));
  el.sm.forEach((c,i)=>{ const t=(o.smoke*1.6+i*0.3)%1; c.setAttribute('opacity',o.smoke>0?(0.6*(1-t)).toFixed(2):0);
    c.setAttribute('cx',f1(-20+i*20)); c.setAttribute('cy',f1(o.dY-20-t*60)); c.setAttribute('r',f1(8+t*14)); });
  el.shadow.setAttribute('rx',f1(80*(0.4+0.6*o.alpha))); }

const ANIMS={ idle:{dur:2.4,frames:16}, walk:{dur:1.2,frames:12}, shoot:{dur:0.45,frames:8}, attack:{dur:0.45,frames:8}, die:{dur:1.3,frames:18,loop:false,hold:0.3}, hit:{dur:0.3,overlay:true} };
window.CHARS.spaceship={ name:'飞船', nameEn:'Spaceship', source:'spaceship/concept-source/page02b.jpg',
  viewBox:[-130,-140,290,275], foot:[0,118], center:[0,-10], top:-100, flipX:0, gameH:50, gunPt:[60,-56], faceLeft:true,
  anims:ANIMS, markup:make(false), bind, pose, hit, apply };
window.CHARS.halfSpaceship={ name:'半飞船', nameEn:'Half Spaceship', source:'half-spaceship/concept-source/page02d.jpg',
  viewBox:[-130,-140,290,275], foot:[0,118], center:[0,0], top:-100, flipX:0, gameH:50, gunPt:[60,-56], faceLeft:true,
  anims:ANIMS, markup:make(true), bind, pose, hit, apply };
})();
