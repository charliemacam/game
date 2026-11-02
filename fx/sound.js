/* 音效引擎（Web Audio 程序合成，不需要音频文件）
 *   Sfx.play(ac, kind, {x, big})   x = 发声位置（游戏坐标 0..960，用来做左右声像）
 * 每种塔、每个等级有自己的开火声和命中声；同一种声音有最短间隔，同时发声数有上限，
 * 总线上挂压缩器，满屏塔一起开火也不会爆音。每次播放带一点随机音高，听起来不机械。
 */
(function(){
let ac=null, bus=null, nb=null, voices=0;
const MAX_VOICES=26, last={};
// 最短间隔（秒）：高频音效限流
const GAP={ arrow:.05, longbow:.06, sniper:.08, magic:.06, arcane:.06, frost:.07, cannon:.08, heavy:.09, flame:.1,
  boom:.07, fireboom:.09, hitArrow:.07, hitMagic:.07, hitFrost:.08, clink:.09, clash:.08, zap:.08, die:.04,
  deploy:.15, reload:.1 };
// 每种音效的总音量：按实测响度（最响 100ms 的 RMS）校准。开火声约 -29 dB，命中声更轻约 -35 dB，
// 建造/升级约 -25 dB，波次号角/胜负/Boss 死亡最响约 -18 dB
const VOL={ arrow:.9, longbow:.44, sniper:.61, magic:.39, arcane:.4, frost:.4, cannon:.38, heavy:.32, flame:.63,
  boom:.46, fireboom:.46, hitArrow:2.19, hitMagic:.81, hitFrost:1.05, clink:1.12, clash:2.06, zap:1.5, die:.58, bossDie:.55,
  deploy:.38, build:.46, upgrade:.43, perk:.3, sell:.86, deny:.38, reload:1.71, leak:1.04, wave:.41, win:.54, lose:1,
  pause:.24, resume:.56 };

function setup(ctx){
  if(ac===ctx) return; ac=ctx;
  const comp=ac.createDynamicsCompressor();
  comp.threshold.value=-18; comp.knee.value=12; comp.ratio.value=5; comp.attack.value=0.003; comp.release.value=0.2;
  bus=ac.createGain(); bus.gain.value=0.9; bus.connect(comp); comp.connect(ac.destination);
  nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
  const d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
}
// 一个发声通道：音量 → 声像 → 总线；dur 秒后释放计数
function voice(vol,x,dur){
  const g=ac.createGain(); g.gain.value=vol;
  if(x!=null && ac.createStereoPanner){ const p=ac.createStereoPanner(); p.pan.value=Math.max(-0.7,Math.min(0.7,(x/960*2-1)*0.7));
    g.connect(p); p.connect(bus); }
  else g.connect(bus);
  voices++; setTimeout(()=>{ voices--; }, (dur+0.1)*1000);
  return g;
}
// 振荡器 + 包络；f1 = 结束频率（指数滑音）
function tone(out,t,type,f0,f1,dur,peak,o){
  o=o||{}; const osc=ac.createOscillator(), g=ac.createGain(); osc.type=type;
  osc.frequency.setValueAtTime(f0,t); if(f1!==f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur*(o.glide||0.9));
  const a=o.attack||0.004;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+a);
  if(o.hold) g.gain.setValueAtTime(peak,t+a+o.hold);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  let last=g;
  if(o.lp){ const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=o.lp; g.connect(f); last=f; }
  osc.connect(g); last.connect(out);
  if(o.vib){ const l=ac.createOscillator(), lg=ac.createGain(); l.frequency.value=o.vib[0]; lg.gain.value=o.vib[1];
    l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t+dur+0.02); }
  osc.start(t); osc.stop(t+dur+0.02);
}
// 滤波噪声；f1 = 滤波器结束频率（扫频）
function hiss(out,t,ftype,f0,f1,dur,peak,q){
  const s=ac.createBufferSource(); s.buffer=nb;
  const f=ac.createBiquadFilter(); f.type=ftype; f.Q.value=q||0.8;
  f.frequency.setValueAtTime(f0,t); if(f1!==f0) f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=ac.createGain(); g.gain.setValueAtTime(peak,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t, Math.random()*0.5); s.stop(t+dur+0.02);
}
const notes=(out,t,type,fs,step,dur,peak,o)=>fs.forEach((f,i)=>tone(out,t+i*step,type,f,f,dur,peak,o));

const R={
  /* ---- 塔开火 ---- */
  arrow(o,t,r){ tone(o,t,'triangle',720*r,260*r,.11,.6); hiss(o,t,'bandpass',2600,2000,.05,.45,1.2); },
  longbow(o,t,r){ for(const d of [0,.035]){ tone(o,t+d,'triangle',560*r,200*r,.13,.55); hiss(o,t+d,'bandpass',2000,1500,.05,.4,1.2); } },
  sniper(o,t,r){ hiss(o,t,'highpass',2200,1800,.06,.9); tone(o,t,'sine',230*r,55,.2,.75);
    hiss(o,t+.13,'bandpass',900,600,.16,.14,1); hiss(o,t+.27,'bandpass',800,500,.14,.06,1); },     // 回声
  magic(o,t,r){ tone(o,t,'sine',520*r,1300*r,.2,.5,{vib:[28,90],attack:.02}); },
  arcane(o,t,r){ tone(o,t,'sine',480*r,1250*r,.22,.45,{vib:[24,90],attack:.02}); tone(o,t,'sine',720*r,1870*r,.22,.25,{attack:.02}); },
  frost(o,t,r){ [[1568,.5,.32],[2350,.36,.2],[3136,.26,.13]].forEach(([f,d,p])=>tone(o,t,'sine',f*r,f*r,d,p));
    hiss(o,t,'highpass',6000,6000,.16,.14); },
  cannon(o,t,r){ tone(o,t,'sine',140*r,45,.26,.9); hiss(o,t,'lowpass',800,300,.15,.55); },
  heavy(o,t,r){ tone(o,t,'sine',110*r,36,.32,1); hiss(o,t,'lowpass',600,200,.2,.65); },
  flame(o,t,r){ hiss(o,t,'bandpass',300,1800,.34,.55,.8); tone(o,t,'sine',120*r,45,.22,.6); },
  /* ---- 命中 ---- */
  boom(o,t,r){ tone(o,t,'sine',120*r,38,.3,.8); hiss(o,t,'lowpass',1300,250,.32,.6); },
  fireboom(o,t,r){ R.boom(o,t,r); for(let i=0;i<5;i++) hiss(o,t+.05+Math.random()*.3,'highpass',3000,3000,.02,.18); },  // 火焰噼啪
  hitArrow(o,t,r){ hiss(o,t,'bandpass',1300*r,900,.04,.4,3); tone(o,t,'square',190*r,120,.04,.1); },
  hitMagic(o,t,r){ tone(o,t,'sine',1800*r,2500*r,.09,.3); },
  hitFrost(o,t,r){ tone(o,t,'triangle',2600*r,2100*r,.1,.25); hiss(o,t,'highpass',5000,5000,.09,.3); },
  clink(o,t,r){ tone(o,t,'square',1900*r,1900*r,.06,.2,{lp:5000}); tone(o,t,'triangle',2850*r,2850*r,.12,.18); },   // 打在护甲上
  clash(o,t,r){ hiss(o,t,'bandpass',3500*r,3000,.07,.5,4); tone(o,t,'square',1200*r,900,.05,.12,{lp:4000}); tone(o,t,'triangle',2400*r,2400*r,.14,.1); },
  zap(o,t,r){ tone(o,t,'sawtooth',900*r,300,.12,.3,{lp:3000}); hiss(o,t,'bandpass',2000,2000,.1,.3,2); },
  die(o,t,r,x,big){ const k=big?.55:1; tone(o,t,'sine',380*r*k,90*k,.13,.55); hiss(o,t,'bandpass',900*k,500,.09,.35,1.5); },
  bossDie(o,t){ tone(o,t,'sine',70,25,1.3,1); hiss(o,t,'lowpass',700,120,1.5,.9); tone(o,t,'sawtooth',220,40,1.1,.3,{lp:800});
    for(let i=0;i<4;i++){ const d=.15+i*.22; tone(o,t+d,'sine',110,35,.35,.6); hiss(o,t+d,'lowpass',1200,250,.35,.45); } },
  /* ---- 兵营 / 建造 / 经济 ---- */
  deploy(o,t){ notes(o,t,'square',[392,523],.08,.12,.3,{lp:1600}); },
  build(o,t){ for(let i=0;i<3;i++){ hiss(o,t+i*.09,'bandpass',800,700,.05,.6,2); tone(o,t+i*.09,'square',160,140,.05,.15,{lp:1200}); }
    tone(o,t+.27,'sine',880,880,.25,.3); },
  upgrade(o,t){ notes(o,t,'triangle',[523,659,784,1047],.07,.2,.4); hiss(o,t+.2,'highpass',6000,6000,.2,.15); },
  perk(o,t){ notes(o,t,'sine',[784,1175,1568],.06,.5,.35); hiss(o,t,'highpass',7000,7000,.4,.12); },
  sell(o,t){ notes(o,t,'square',[1318,1760],.06,.12,.18,{lp:6000}); notes(o,t+.13,'square',[1318,1760],.06,.12,.12,{lp:6000}); },
  deny(o,t){ tone(o,t,'square',140,140,.15,.3,{lp:900}); tone(o,t+.1,'square',110,110,.18,.3,{lp:900}); },
  reload(o,t){ hiss(o,t,'bandpass',1500,1500,.03,.6,3); hiss(o,t+.08,'bandpass',2200,2200,.03,.6,3); tone(o,t+.08,'square',600,600,.03,.1); },
  /* ---- 战局 ---- */
  leak(o,t){ for(const d of [0,.2]) tone(o,t+d,'sawtooth',660,440,.18,.35,{lp:1800}); },
  wave(o,t){ tone(o,t,'sine',90,40,.35,.8); tone(o,t,'sawtooth',110,147,.9,.35,{attack:.05,glide:.2,hold:.4,lp:700});
    tone(o,t,'sawtooth',220,294,.9,.15,{attack:.05,glide:.2,hold:.4,lp:900}); },
  win(o,t){ notes(o,t,'triangle',[523,659,784],.12,.3,.4); tone(o,t+.36,'triangle',1047,1047,.8,.45);
    tone(o,t+.36,'square',523,523,.8,.12,{lp:1500}); },
  lose(o,t){ notes(o,t,'sawtooth',[392,370,330,262],.25,.45,.3,{lp:900}); },
  pause(o,t){ tone(o,t,'triangle',660,220,.22,.9); tone(o,t+.06,'sine',120,60,.2,.6); },
  resume(o,t){ tone(o,t,'triangle',280,820,.18,.9); },
};
// 每种音效大约持续多久（用于通道计数）
const DUR={ bossDie:1.6, wave:1, win:1.2, lose:1.5, perk:.6, upgrade:.45, build:.55, sniper:.45, leak:.4 };

function play(ctx,kind,o){
  const fn=R[kind]; if(!fn) return;
  setup(ctx); o=o||{};
  const t=ac.currentTime;
  if(GAP[kind] && last[kind]!=null && t>=last[kind] && t-last[kind]<GAP[kind]) return;
  if(voices>=MAX_VOICES && GAP[kind]) return;          // 太忙时丢掉高频小音效，保留重要提示音
  last[kind]=t;
  const dur=DUR[kind]||0.35, out=voice(VOL[kind]||0.25, o.x, dur);
  fn(out,t+0.005,0.94+Math.random()*0.12,o.x,o.big);
}
window.Sfx={ play };
})();
