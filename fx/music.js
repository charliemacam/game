/* 背景音乐（Web Audio 程序合成，不需要音频文件）
 *   Music.start(ac, mood)      mood: 'menu' | 'earth' | 'space' | 'hell'；同一首重复调用无副作用，换曲会交叉淡入淡出
 *   Music.setIntensity(i)      0 = 备战（安静） 1 = 交战（鼓和贝斯进来） 2 = Boss 在场（加旋律、更密的鼓）
 *   Music.duck(on)             暂停时变闷变小声
 *   Music.stop()
 * 用音频时钟提前排程（不随 setInterval 抖动）；每首曲子按层（铺底/琶音/贝斯/鼓/旋律）混音，
 * 强度变化时各层音量平滑过渡，强度下降要持续 4 秒才生效，避免两拨怪之间来回跳。
 */
(function(){
let ac=null, master=null, duckF=null, rev=null, nb=null, dist=null;
let song=null, timer=null, I=0, target=0, lowSince=0, ducked=false;
const mf=m=>440*Math.pow(2,(m-69)/12);
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------- 混音总线：歌曲 → 暂停闷音滤波 → 压缩 → 输出；混响作为发送效果 ---------- */
function graph(ctx){
  if(ac===ctx) return; ac=ctx;
  master=ac.createGain(); master.gain.value=0;
  duckF=ac.createBiquadFilter(); duckF.type='lowpass'; duckF.frequency.value=18000;
  const comp=ac.createDynamicsCompressor(); comp.threshold.value=-20; comp.ratio.value=3; comp.attack.value=0.01; comp.release.value=0.3;
  master.connect(duckF); duckF.connect(comp); comp.connect(ac.destination);
  // 混响：程序生成的立体声衰减噪声脉冲
  const len=Math.floor(ac.sampleRate*2.2), ir=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){ const d=ir.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2); }
  rev=ac.createConvolver(); rev.buffer=ir; rev.connect(master);
  nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate); const d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  dist=new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/512-1; dist[i]=Math.tanh(x*3.5); }
}

/* ---------- 乐器 ---------- */
function env(g,t,a,peak,hold,rel){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+a);
  g.gain.setValueAtTime(peak,t+a+Math.max(0,hold)); g.gain.exponentialRampToValueAtTime(0.0001,t+a+Math.max(0,hold)+rel); return t+a+Math.max(0,hold)+rel; }
function osc(type,f,t,end,dest,det){ const o=ac.createOscillator(); o.type=type; o.frequency.value=f; if(det) o.detune.value=det;
  o.connect(dest); o.start(t); o.stop(end+0.05); return o; }
function filt(type,f,q,dest){ const x=ac.createBiquadFilter(); x.type=type; x.frequency.value=f; x.Q.value=q||0.7; x.connect(dest); return x; }
function noise(t,dur,dest){ const s=ac.createBufferSource(); s.buffer=nb; s.connect(dest); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); }
// 弦乐/合成铺底：每个音两根失谐锯齿波
function pad(dest,t,dur,notes,o){
  for(const m of notes){ const g=ac.createGain(); g.connect(dest);
    const end=env(g,t,o.a||0.6,(o.v||.3)/notes.length,dur-(o.a||0.6),o.rel||0.9), f=filt('lowpass',o.cut||1200,0.5,g);
    osc('sawtooth',mf(m),t,end,f,-(o.det||8)); osc('sawtooth',mf(m),t,end,f,o.det||8); }
}
// 管风琴：正弦 + 2、3 次谐波
function organ(dest,t,dur,notes,o){
  for(const m of notes){ const g=ac.createGain(); g.connect(dest);
    const end=env(g,t,o.a||0.9,(o.v||.3)/notes.length,dur-(o.a||0.9),o.rel||1.4);
    [[1,.6],[2,.25],[3,.12],[4,.06]].forEach(([h,a])=>{ const k=ac.createGain(); k.gain.value=a; k.connect(g); osc('sine',mf(m)*h,t,end,k); }); }
}
// 合唱 "啊"：锯齿波过两个共振峰
function choir(dest,t,dur,notes,o){
  for(const m of notes){ const g=ac.createGain(); g.connect(dest);
    const end=env(g,t,o.a||0.8,(o.v||.3)/notes.length,dur-(o.a||0.8),o.rel||1);
    const f1=filt('bandpass',700,4,g), f2=filt('bandpass',1150,5,g);
    for(const det of [-10,0,10]){ const o2=osc('sawtooth',mf(m),t,end,f1,det); o2.connect(f2); } }
}
// 拨弦/琶音：滤波包络
function pluck(dest,t,f,dur,o){
  const g=ac.createGain(); g.connect(dest); const end=env(g,t,0.004,o.v||.2,0,dur);
  const x=filt('lowpass',(o.cut||2000)*2.5,1.5,g); x.frequency.setValueAtTime((o.cut||2000)*2.5,t); x.frequency.exponentialRampToValueAtTime(o.cut||2000,t+dur*0.6);
  osc(o.type||'square',f,t,end,x);
}
// 贝斯：锯齿 + 正弦低频，可加失真
function bass(dest,t,f,dur,o){
  const g=ac.createGain(); g.connect(dest); const end=env(g,t,0.01,o.v||.35,dur*0.6,dur*0.4+0.08);
  let into=filt('lowpass',o.cut||420,1,g);
  if(o.dist){ const w=ac.createWaveShaper(); w.curve=dist; w.connect(into); into=w; }
  osc('sawtooth',f,t,end,into); osc('sine',f,t,end,g);
}
// 铜管/号角旋律：失谐锯齿 + 滤波起音 + 延迟颤音
function horn(dest,t,f,dur,o){
  const g=ac.createGain(); g.connect(dest); const end=env(g,t,0.06,o.v||.22,dur-0.06,0.25);
  const x=filt('lowpass',600,1.2,g); x.frequency.setValueAtTime(500,t); x.frequency.linearRampToValueAtTime(o.cut||1500,t+0.12);
  const a=osc(o.type||'sawtooth',f,t,end,x,-6), b=osc(o.type||'sawtooth',f,t,end,x,6);
  const l=ac.createOscillator(), lg=ac.createGain(); l.frequency.value=5.2; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*0.012,t+Math.min(0.35,dur));
  l.connect(lg); lg.connect(a.frequency); lg.connect(b.frequency); l.start(t); l.stop(end+0.05);
}
function kick(d,t,v){ const g=ac.createGain(); g.connect(d); env(g,t,0.002,v,0.02,0.28);
  const o=osc('sine',150,t,t+0.35,g); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12);
  const c=ac.createGain(); c.connect(d); env(c,t,0.001,v*0.3,0,0.015); noise(t,0.02,filt('highpass',3000,0.7,c)); }
function snare(d,t,v){ const g=ac.createGain(); g.connect(d); env(g,t,0.001,v*0.7,0,0.16); noise(t,0.2,filt('bandpass',1900,0.8,g));
  const b=ac.createGain(); b.connect(d); env(b,t,0.001,v*0.5,0,0.08); const o=osc('triangle',200,t,t+0.1,b); o.frequency.exponentialRampToValueAtTime(150,t+0.08); }
function clap(d,t,v){ const g=ac.createGain(); g.connect(d); const x=filt('bandpass',1500,1.2,g);
  g.gain.setValueAtTime(0.0001,t); [0,0.011,0.022].forEach(k=>{ g.gain.setValueAtTime(v,t+k); g.gain.exponentialRampToValueAtTime(v*0.2,t+k+0.009); });
  g.gain.setValueAtTime(v*0.6,t+0.032); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18); noise(t,0.2,x); }
function hat(d,t,v,open){ const g=ac.createGain(); g.connect(d); env(g,t,0.001,v,0,open?0.22:0.04); noise(t,0.25,filt('highpass',7500,0.7,g)); }
function tom(d,t,f,v){ const g=ac.createGain(); g.connect(d); env(g,t,0.002,v,0.02,0.3);
  const o=osc('sine',f,t,t+0.35,g); o.frequency.exponentialRampToValueAtTime(f*0.6,t+0.25); }
function taiko(d,t,v){ const g=ac.createGain(); g.connect(d); env(g,t,0.003,v,0.05,0.55);
  const o=osc('sine',110,t,t+0.65,g); o.frequency.exponentialRampToValueAtTime(48,t+0.35);
  const s=ac.createGain(); s.connect(d); env(s,t,0.001,v*0.5,0,0.08); noise(t,0.1,filt('bandpass',420,0.8,s)); }
function tick(d,t,v,hi){ const g=ac.createGain(); g.connect(d); env(g,t,0.001,v,0,0.035); osc('sine',hi?2600:1900,t,t+0.05,g);
  const n=ac.createGain(); n.connect(d); env(n,t,0.001,v*0.4,0,0.012); noise(t,0.02,filt('highpass',6000,0.7,n)); }

/* ---------- 曲目 ----------
 * prog：每小节一个和弦（MIDI 音）；gain：整首音量（按实测响度校准，交战时约 -27 dB，压在音效下面）；
 * mix：各层基础音量；send：各层混响量；
 * levels[强度]：各层在该强度下的比例；bar() 每小节开头调用；step() 每个 16 分音符调用
 */
const low=m=>{ while(m>45) m-=12; return m; };   // 和弦根音降到贝斯音区
// 旋律：[起始 16 分音符, 时值, 相对调中心的半音]，四小节一句
function motif(list){ const m={}; for(const [s,d,n] of list) m[s]=[d,n]; return m; }
const MOODS={
  // 主菜单：星际穿越式管风琴 + 时钟滴答 + 慢琶音
  menu:{ bpm:72, gain:.23, prog:[[57,60,64,71],[53,57,60,64],[48,55,60,64],[55,59,62,67]],
    mix:{pad:.55,arp:.22,bass:.4,drums:.16,lead:0}, send:{pad:.55,arp:.6,bass:.05,drums:.25,lead:0},
    levels:[{pad:1,arp:1,bass:1,drums:1,lead:0}],
    bar(t,b,ch,L,spb){ organ(L.pad,t,spb*16,ch,{v:.5}); bass(L.bass,t,mf(low(ch[0])),spb*15,{cut:220,v:.45}); },
    step(t,s,b,ch,L,spb){ if(s%4===0) tick(L.drums,t,s===0?.5:.3,s===0);
      if(s%2===0 && b%2===1){ const p=[0,1,2,3,2,1,2,3]; pluck(L.arp,t,mf(ch[p[s/2]]+12),spb*3,{type:'sine',cut:2500,v:.35}); } } },
  // 地球：英雄冒险，D 小调，弦乐断奏 + 军鼓 + 号角
  earth:{ bpm:108, gain:.23, key:62, prog:[[50,57,62,65],[46,58,62,65],[53,57,60,65],[48,55,60,64]],
    mix:{pad:.4,arp:.32,bass:.5,drums:.55,lead:.38}, send:{pad:.35,arp:.2,bass:0,drums:.12,lead:.3},
    levels:[{pad:.9,arp:.45,bass:.5,drums:.35,lead:0},{pad:.7,arp:1,bass:1,drums:1,lead:.8},{pad:.8,arp:1,bass:1,drums:1,lead:1}],
    lead:motif([[0,4,7],[4,2,5],[6,2,3],[8,8,0],[16,4,-2],[20,2,0],[22,2,2],[24,8,3],[32,4,7],[36,2,8],[38,2,7],[40,6,5],[46,2,3],[48,12,2],[60,4,-2]]),
    bar(t,b,ch,L,spb){ pad(L.pad,t,spb*16,ch,{cut:1500,v:.4,a:.4}); },
    step(t,s,b,ch,L,spb,I){
      const p=[0,2,1,2,3,2,1,2];
      if(I>=1 ? s%2===0 : s%4===0) pluck(L.arp,t,mf(ch[p[(s>>1)%8]]+12),spb*1.4,{type:'sawtooth',cut:2200,v:.28});
      if(I>=1){ if([0,3,6,8,11,14].includes(s)) bass(L.bass,t,mf(low(ch[0])),spb*2,{cut:500,v:.4}); }
      else if(s===0) bass(L.bass,t,mf(low(ch[0])),spb*15,{cut:300,v:.4});
      if(I>=1){ if(s===0||s===8||(s===10&&b%2)) kick(L.drums,t,.9); if(I>=2&&(s===6||s===14)) kick(L.drums,t,.7);
        if(s===4||s===12) snare(L.drums,t,.6); if(s%2===0) hat(L.drums,t+rnd(0,.004),s%4===0?.18:.11);
        if(b%4===3&&s>=12) tom(L.drums,t,[220,190,160,130][s-12],.6); }
      else if(s===0||s===8) tom(L.drums,t,90,.5);
      const m=this.lead[(b%4)*16+s];
      if(m && I>=1 && (I>=2 || Math.floor(b/4)%2===1)) horn(L.lead,t,mf(this.key+m[1]),spb*m[0],{v:.3,cut:1500}); } },
  // 太空：E 小调，空灵铺底 + 16 分音符琶音（附点八分延迟）+ 电子鼓
  space:{ bpm:96, gain:.27, key:64, prog:[[52,59,62,66],[48,55,59,64],[55,59,62,66],[50,57,62,64]],
    mix:{pad:.45,arp:.24,bass:.5,drums:.45,lead:.3}, send:{pad:.5,arp:.35,bass:0,drums:.15,lead:.45},
    levels:[{pad:1,arp:.55,bass:.45,drums:.25,lead:0},{pad:.75,arp:1,bass:1,drums:1,lead:.7},{pad:.8,arp:1,bass:1,drums:1,lead:1}],
    delay:3,
    lead:motif([[0,8,7],[8,8,10],[16,16,12],[32,8,14],[40,8,12],[48,16,7]]),
    bar(t,b,ch,L,spb){ pad(L.pad,t,spb*16,ch,{cut:950,v:.42,a:1.2,rel:1.4,det:12}); },
    step(t,s,b,ch,L,spb,I){
      const p=[0,1,2,3,4,3,2,1], n=p[s%8]===4 ? ch[1]+12 : ch[p[s%8]];
      if(I>=1 || s%2===0) pluck(L.arp,t,mf(n+12),spb*0.9,{type:'square',cut:1700,v:.2});
      if(I>=1){ if(s===0||s%4===2) bass(L.bass,t,mf(low(ch[0])),spb*1.6,{cut:380,v:.4}); }
      else if(s===0) bass(L.bass,t,mf(low(ch[0])),spb*15,{cut:200,v:.4});
      if(I>=1){ if(s%4===0) kick(L.drums,t,.75); if(I>=2&&s===14) kick(L.drums,t,.6);
        if(s===4||s===12) clap(L.drums,t,.5); hat(L.drums,t+rnd(0,.004),s%2?.1:.05,I>=2&&(s===6||s===14)); }
      else if(s%4===2) hat(L.drums,t,.06);
      const m=this.lead[(b%4)*16+s];
      if(m && I>=1 && (I>=2 || Math.floor(b/4)%2===1)) horn(L.lead,t,mf(this.key+m[1]),spb*m[0],{type:'triangle',v:.34,cut:2400}); } },
  // 地狱：E 弗里几亚，合唱 + 失真低音断奏 + 太鼓 + 铜管
  hell:{ bpm:126, gain:.19, key:64, prog:[[52,55,59],[53,57,60],[52,55,59],[50,53,57]],
    mix:{pad:.42,arp:.3,bass:.45,drums:.6,lead:.34}, send:{pad:.45,arp:.08,bass:0,drums:.18,lead:.3},
    levels:[{pad:.9,arp:0,bass:.6,drums:.6,lead:0},{pad:.6,arp:1,bass:1,drums:1,lead:.75},{pad:.75,arp:1,bass:1,drums:1,lead:1}],
    lead:motif([[0,6,0],[6,2,1],[8,8,0],[16,6,1],[22,2,3],[24,8,1],[32,6,0],[38,2,-2],[40,8,0],[48,8,-2],[56,8,-5]]),
    bar(t,b,ch,L,spb){ choir(L.pad,t,spb*16,ch,{v:.42}); },
    step(t,s,b,ch,L,spb,I){
      const chug=[1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,1], r=low(ch[0]);
      if(I>=1 && chug[s]) bass(L.arp,t,mf(r+12),spb*0.7,{cut:900,v:.22,dist:1});
      if(I>=1){ if([0,6,8,14].includes(s)) bass(L.bass,t,mf(r),spb*2,{cut:300,v:.4,dist:1}); }
      else if(s===0) bass(L.bass,t,mf(r),spb*15,{cut:200,v:.4});
      if(I>=1){ if([0,6,8,11].includes(s)) taiko(L.drums,t,.9); if(s===4||s===12) snare(L.drums,t,.55);
        hat(L.drums,t+rnd(0,.004),s%2?.06:.1);
        if(b%4===3&&s>=12) tom(L.drums,t,[200,170,140,110][s-12],.6);
        if(I>=2&&s>=12) taiko(L.drums,t,.6); }
      else if(s===0||s===6) taiko(L.drums,t,s?.45:.7);
      const m=this.lead[(b%4)*16+s];
      if(m && I>=1 && (I>=2 || Math.floor(b/4)%2===1)) horn(L.lead,t,mf(this.key+m[1]),spb*m[0],{v:.3,cut:1300}); } },
};

/* ---------- 排程 ---------- */
function makeSong(mood,t){
  const def=MOODS[mood], bus=ac.createGain(), L={};
  bus.gain.setValueAtTime(0.0001,t); bus.gain.exponentialRampToValueAtTime(def.gain,t+1.2); bus.connect(master);
  for(const k of ['pad','arp','bass','drums','lead']){ const g=ac.createGain(); g.gain.value=0;
    let out=g;
    if(k==='arp' && def.delay){ // 琶音的附点八分回声
      const dl=ac.createDelay(1), fb=ac.createGain(), wet=ac.createGain();
      dl.delayTime.value=60/def.bpm/4*def.delay; fb.gain.value=0.38; wet.gain.value=0.5;
      g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(bus); }
    out.connect(bus);
    if(def.send[k]){ const s=ac.createGain(); s.gain.value=def.send[k]; g.connect(s); s.connect(rev); }
    L[k]=g; }
  return { mood, def, bus, L, n:0, next:t+0.05, I:-1 };
}
function applyLevels(sg,t){
  const lv=sg.def.levels[Math.min(I,sg.def.levels.length-1)];
  for(const k in sg.L) sg.L[k].gain.setTargetAtTime(sg.def.mix[k]*lv[k],t,0.6);
  sg.I=I;
}
function scheduleUntil(sg,until){
  const spb=60/sg.def.bpm/4;
  while(sg.next<until){
    const s=sg.n%16, b=Math.floor(sg.n/16), ch=sg.def.prog[b%sg.def.prog.length], t=sg.next;
    if(s===0){ updateI(t); if(sg.I!==I) applyLevels(sg,t); sg.def.bar(t,b,ch,sg.L,spb,I); }
    sg.def.step(t,s,b,ch,sg.L,spb,I);
    sg.next+=spb; sg.n++;
  }
}
// 强度：升高立即生效；降低要先持续 4 秒
function updateI(t){
  if(target>I){ I=target; lowSince=0; }
  else if(target<I){ if(!lowSince) lowSince=t; else if(t-lowSince>4){ I=target; lowSince=0; } }
  else lowSince=0;
}
function pump(){ if(!ac||!song) return; scheduleUntil(song, ac.currentTime+0.2); }

function start(ctx,mood){
  if(!MOODS[mood]) mood='menu';
  graph(ctx);
  master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(ducked?0.55:1,ac.currentTime,0.3);
  if(!timer) timer=setInterval(pump,40);
  if(song && song.mood===mood) return;
  const t=ac.currentTime;
  if(song){ const old=song.bus; old.gain.cancelScheduledValues(t); old.gain.setTargetAtTime(0.0001,t,0.5);
    setTimeout(()=>{ try{ old.disconnect(); }catch(e){} },3000); }
  if(mood==='menu') target=0;
  song=makeSong(mood,t); I=target; lowSince=0; applyLevels(song,t); pump();
}
function stop(){
  if(timer){ clearInterval(timer); timer=null; }
  if(ac && master){ master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0.0001,ac.currentTime,0.25); }
  const sg=song; song=null;
  if(sg) setTimeout(()=>{ try{ sg.bus.disconnect(); }catch(e){} },2000);
}
function setIntensity(i){ target=Math.max(0,Math.min(2,i|0)); }
function duck(on){
  ducked=!!on; if(!ac||!master) return; const t=ac.currentTime;
  duckF.frequency.setTargetAtTime(on?650:18000,t,0.15);
  if(song) master.gain.setTargetAtTime(on?0.55:1,t,0.2);
}
// 测试用：离线渲染某首曲子某个强度若干秒（检查响度）
function renderTo(ctx,mood,intensity,sec){
  const keep=[ac,master,duckF,rev,nb,dist,I,target];
  ac=null; graph(ctx); master.gain.value=1; target=I=intensity;
  const sg=makeSong(mood,0); applyLevels(sg,0); scheduleUntil(sg,sec);
  [ac,master,duckF,rev,nb,dist,I,target]=keep;
  return ctx.startRendering();
}
window.Music={ start, stop, setIntensity, duck, renderTo, moods:Object.keys(MOODS), playing:()=>song?song.mood:null };
})();
