/* 操控怪 Flyer Monster（Charlie 原画：character-design/flyer-monster/）
 * 飞船的驾驶员。比例按原画量过：一整块橙色的胖身体（上窄下宽的土豆形），脸就在身体上半部：
 *   白眼睛加怒眉、大大的深色鼻子、红色的嘴露出尖牙；灰色耳麦从头顶绕过，右边伸出麦克风；
 *   肚子上一个很大的白色椭圆（竖条纹）；两只细小的胳膊伸在两边；底下两条短短的爪脚。
 * Charlie 的回答：不会攻击，自己不会飞，耳麦只是装饰。
 * 质感：毛茸茸的橙色皮毛（短绒线）、肚皮的褶、耳麦的塑料光泽。
 */
(function(){
const { f1, rng, kf, organic, ring, texFilter, ao, scratches } = window.CharSprites;
const OUT='#2a1608', OR='#e98a22';

function markup(P){
  const body=organic([[-60,-80],[0,-86],[58,-78],[80,-40],[92,10],[94,60],[86,110],[60,138],[0,146],[-62,138],[-88,108],[-94,60],[-90,10],[-78,-40]],2,900,{sub:2});
  const belly=organic(ring(4,42,32,46,14),1.2,902);
  let ribs=''; for(const x of [-14,-2,10,22]) ribs+=`M${x},${f1(4+Math.abs(x-4)*0.3)} Q${x+1},42 ${x},${f1(82-Math.abs(x-4)*0.3)}`;
  const fur=scratches(904,-88,-80,180,220,220,6,'#a8520c',0.9,0.45,Math.PI/2)+scratches(905,-88,-80,180,220,90,5,'#ffc070',0.8,0.35,Math.PI/2);
  const arm=(s)=>{ const x0=s*88, x1=s*114;
    return `<g id="${P}-a${s>0?'R':'L'}"><path d="${organic([[x0,-8],[x1,-12],[x1+s*2,-4],[x0,2]],0.6,906+s)}" fill="${OR}" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M${x1},-10 l${s*8},-6 M${x1+s*2},-7 l${s*9},0 M${x1+s*1},-4 l${s*7},5" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/></g>`; };
  const leg=(s)=>{ const x=s*68;
    return `<g id="${P}-l${s>0?'R':'L'}"><path d="${organic([[x-9,128],[x+9,128],[x+s*6+6,150],[x+s*6-8,150]],0.8,910+s)}" fill="${OR}" stroke="${OUT}" stroke-width="1.6"/>
      <path d="M${x+s*6-8},150 l-6,4 M${x+s*6},151 l0,6 M${x+s*6+6},150 l6,4" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/></g>`; };
  return `
<defs>
  ${texFilter(P+'-tex',{rough:2.2,grain:0.18,grainF:0.4,rim:0.42,seed:21})}
  <clipPath id="${P}-bc"><path d="${body}"/></clipPath>
  <radialGradient id="${P}-fur" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#ffb04a"/><stop offset=".6" stop-color="${OR}"/><stop offset="1" stop-color="#b85d10"/></radialGradient>
  <radialGradient id="${P}-belly" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff6f2"/><stop offset="1" stop-color="#e9c7c2"/></radialGradient>
</defs>
<ellipse id="${P}-shadow" cx="0" cy="155" rx="90" ry="8" fill="rgba(0,0,0,.25)"/>
<g id="${P}-flip"><g id="${P}-root" filter="url(#${P}-tex)"><g id="${P}-bob">
  ${leg(-1)}${leg(1)}
  ${arm(-1)}${arm(1)}
  <path d="${body}" fill="url(#${P}-fur)"/>
  <g clip-path="url(#${P}-bc)">${fur}${ao(P+'-tex','M-70,120 Q0,150 70,120',10,0.25)}</g>
  <path d="${body}" fill="none" stroke="${OUT}" stroke-width="2.4"/>
  <g id="${P}-belly"><path d="${belly}" fill="url(#${P}-belly)" stroke="${OUT}" stroke-width="1.8"/>
    <path d="${ribs}" stroke="#6b4a40" stroke-width="1.6" fill="none"/></g>
  <g id="${P}-face">
    <path d="M-48,-58 L-24,-50 M42,-56 L18,-48" stroke="${OUT}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="${organic(ring(-34,-42,9,11,9),0.6,920)}" fill="#fbf4e0" stroke="${OUT}" stroke-width="1.5"/>
    <path d="${organic(ring(26,-40,9,11,9),0.6,921)}" fill="#fbf4e0" stroke="${OUT}" stroke-width="1.5"/>
    <g id="${P}-pupils"><ellipse cx="-31" cy="-41" rx="3.5" ry="5" fill="${OUT}"/><ellipse cx="28" cy="-39" rx="3.5" ry="5" fill="${OUT}"/></g>
    <path d="${organic([[-14,-38],[10,-38],[14,-26],[0,-20],[-16,-26]],0.8,922)}" fill="#3a2618" stroke="${OUT}" stroke-width="1.4"/>
    <g id="${P}-mouth"><path d="${organic([[-12,-10],[14,-12],[8,0],[-8,0]],0.6,923)}" fill="#c8202a" stroke="${OUT}" stroke-width="1.4"/>
      <path d="M-10,-10 l3,5 l3,-5 l3,5 l3,-5 l3,5 l3,-5 l3,5" fill="#fff" stroke="${OUT}" stroke-width=".6"/></g>
  </g>
  <g id="${P}-headset">
    <path d="M-80,-28 Q-78,-90 0,-92 Q72,-90 74,-22" fill="none" stroke="#5d6166" stroke-width="7" stroke-linecap="round"/>
    <path d="M-80,-28 Q-78,-90 0,-92 Q72,-90 74,-22" fill="none" stroke="#a9aeb3" stroke-width="2" transform="translate(0,-1.5)"/>
    <ellipse cx="-80" cy="-24" rx="7" ry="10" fill="#4c5055" stroke="${OUT}" stroke-width="1.4"/>
    <ellipse cx="74" cy="-20" rx="7" ry="10" fill="#4c5055" stroke="${OUT}" stroke-width="1.4"/>
    <path d="M72,-14 Q52,-4 18,-8" fill="none" stroke="#2c2f33" stroke-width="3" stroke-linecap="round"/>
    <circle cx="16" cy="-8" r="5" fill="#1d1f22" stroke="${OUT}" stroke-width="1"/>
  </g>
</g></g></g>`;
}
function bind(svg,P){ const q=id=>svg.querySelector('#'+P+'-'+id), el={};
  for(const k of ['root','bob','aL','aR','lL','lR','face','mouth','pupils','belly','shadow','flip']) el[k]=q(k); return el; }

const BASE={bobY:0,rot:0,aL:0,aR:0,lL:0,lR:0,dY:0,sq:1,alpha:1,flash:0,mouth:1,eyeX:0,breath:1};
const ATTACK=[[0,{}],[0.3,{aL:-30,aR:30,mouth:1.6,bobY:-4,sq:1.03}],[0.6,{aL:20,aR:-20,mouth:1,bobY:2,sq:0.97}],[1,{}]];   // 不会攻击：被拦住时只会挥手大叫
const DIE=[[0,{}],[0.12,{flash:1,bobY:-10,aL:-40,aR:40,mouth:1.8}],[0.5,{dY:20,sq:0.6,rot:-14,aL:30,aR:-30}],[0.8,{dY:24,sq:0.55,rot:-16,alpha:0.8}],[1,{dY:24,sq:0.55,rot:-16,alpha:0}]];
function pose(anim,p){ const o={...BASE}, w=p*Math.PI*2;
  if(anim==='idle'){ o.bobY=Math.sin(w*2)*1.5; o.breath=1+Math.sin(w*2)*0.03; o.aL=Math.sin(w)*6; o.aR=-Math.sin(w)*6; o.eyeX=Math.sin(w)*2; }
  else if(anim==='walk'){ const s=Math.sin(w); o.rot=s*4; o.bobY=-Math.abs(s)*5; o.lL=Math.max(0,s)*7; o.lR=Math.max(0,-s)*7; o.aL=s*12; o.aR=s*12; }
  else if(anim==='attack') return kf(BASE,ATTACK,p);
  else if(anim==='die') return kf(BASE,DIE,p);
  return o; }
function hit(o,k){ o.flash=k; o.bobY-=3*k; o.mouth+=0.6*k; }
function apply(el,o){ const S=(e,v)=>e.setAttribute('transform',v);
  S(el.root,`translate(0,${f1(o.dY)}) translate(0,152) rotate(${f1(o.rot)}) scale(1,${o.sq.toFixed(3)}) translate(0,-152)`);
  el.root.setAttribute('opacity',o.alpha.toFixed(3));
  S(el.bob,`translate(0,${f1(o.bobY)})`);
  S(el.aL,`rotate(${f1(o.aL)} -88,-4)`); S(el.aR,`rotate(${f1(o.aR)} 88,-4)`);
  S(el.lL,`translate(0,${f1(-o.lL)})`); S(el.lR,`translate(0,${f1(-o.lR)})`);
  S(el.mouth,`translate(0,-10) scale(1,${o.mouth.toFixed(3)}) translate(0,10)`);
  S(el.belly,`translate(4,42) scale(${o.breath.toFixed(3)}) translate(-4,-42)`);
  S(el.pupils,`translate(${f1(o.eyeX)},0)`);
  el.shadow.setAttribute('rx',f1(90*(0.5+0.5*o.alpha))); }

window.CHARS.flyerMonster={ name:'操控怪', nameEn:'Flyer Monster', source:'flyer-monster/concept-source/page02c.jpg',
  viewBox:[-140,-110,280,275], foot:[0,152], center:[0,20], top:-94, flipX:0, gameH:40,
  anims:{ idle:{dur:2.4,frames:16}, walk:{dur:0.8,frames:12}, attack:{dur:0.7,frames:10}, die:{dur:1.4,frames:20,loop:false,hold:0.6}, hit:{dur:0.3,overlay:true} },
  markup, bind, pose, hit, apply };
})();
