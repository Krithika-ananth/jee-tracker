import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/* ─── constants ─── */
const SUBJECTS  = ["Maths","Physics","Chemistry"];
const SC        = { Maths:"#d97706", Physics:"#0ea5e9", Chemistry:"#9333ea" };
const SI        = { Maths:"∑", Physics:"⚛", Chemistry:"⚗" };
const TABS      = ["Today","Dashboard","Reports","Exams","Settings"];
const TAB_ICONS = ["📅","📊","📋","🏆","⚙️"];
const SK = k => `jee_v6_${k}`;
const todayStr  = () => new Date().toISOString().slice(0,10);
const weekOf = ds => { const d=new Date(ds),dy=d.getDay(),diff=d.getDate()-dy+(dy===0?-6:1); return new Date(d.setDate(diff)).toISOString().slice(0,10); };

/* ─── theme tokens ─── */
const THEMES = {
  dark: {
    name:"Dark",icon:"🌙",
    bg:"#07070f", bgCard:"rgba(255,255,255,0.04)", bgHeader:"rgba(7,7,15,0.94)",
    border:"rgba(255,255,255,0.1)", borderAccent:"rgba(245,158,11,0.22)",
    text:"#f0ece0", textSub:"#a0a0b8", textMuted:"#5a5a72", textLabel:"#7a7a92",
    input:"rgba(255,255,255,0.07)", inputBorder:"rgba(255,255,255,0.12)",
    accentMain:"#f59e0b", accentGlow:"rgba(245,158,11,0.35)",
    cardBg:"rgba(255,255,255,0.025)", statBg:"rgba(255,255,255,0.03)",
    tooltipBg:"#0d0d1a", badgeBg:"rgba(245,158,11,0.12)",
    settingsBg:"rgba(255,255,255,0.03)", settingsBorder:"rgba(255,255,255,0.08)",
    glow1:"rgba(245,158,11,0.06)", glow2:"rgba(167,139,250,0.05)", glow3:"rgba(56,189,248,0.04)",
  },
  light: {
    name:"Light",icon:"☀️",
    bg:"#f4f1ea", bgCard:"rgba(255,255,255,0.9)", bgHeader:"rgba(244,241,234,0.96)",
    border:"rgba(0,0,0,0.12)", borderAccent:"rgba(180,100,0,0.3)",
    text:"#1a1408", textSub:"#3d3520", textMuted:"#7a6e58", textLabel:"#5a5040",
    input:"rgba(255,255,255,0.85)", inputBorder:"rgba(0,0,0,0.18)",
    accentMain:"#b45309", accentGlow:"rgba(180,83,9,0.25)",
    cardBg:"rgba(255,255,255,0.7)", statBg:"rgba(255,255,255,0.8)",
    tooltipBg:"#1a1408", badgeBg:"rgba(180,83,9,0.1)",
    settingsBg:"rgba(255,255,255,0.6)", settingsBorder:"rgba(0,0,0,0.1)",
    glow1:"rgba(180,83,9,0.05)", glow2:"rgba(120,60,180,0.04)", glow3:"rgba(0,120,200,0.04)",
  },
  sepia: {
    name:"Sepia",icon:"📜",
    bg:"#2a1f0e", bgCard:"rgba(255,220,150,0.06)", bgHeader:"rgba(42,31,14,0.95)",
    border:"rgba(255,200,100,0.15)", borderAccent:"rgba(255,180,50,0.3)",
    text:"#f5deb3", textSub:"#d4a96a", textMuted:"#8a6a40", textLabel:"#a08050",
    input:"rgba(255,200,100,0.08)", inputBorder:"rgba(255,200,100,0.2)",
    accentMain:"#f0a030", accentGlow:"rgba(240,160,48,0.3)",
    cardBg:"rgba(255,200,100,0.05)", statBg:"rgba(255,200,100,0.06)",
    tooltipBg:"#1a1005", badgeBg:"rgba(240,160,48,0.12)",
    settingsBg:"rgba(255,200,100,0.05)", settingsBorder:"rgba(255,200,100,0.12)",
    glow1:"rgba(240,160,48,0.07)", glow2:"rgba(200,100,50,0.05)", glow3:"rgba(180,140,80,0.04)",
  },
  midnight: {
    name:"Midnight",icon:"🌌",
    bg:"#020817", bgCard:"rgba(30,58,138,0.08)", bgHeader:"rgba(2,8,23,0.96)",
    border:"rgba(99,102,241,0.15)", borderAccent:"rgba(99,102,241,0.3)",
    text:"#e0e7ff", textSub:"#a5b4fc", textMuted:"#4a5080", textLabel:"#6366a0",
    input:"rgba(99,102,241,0.08)", inputBorder:"rgba(99,102,241,0.2)",
    accentMain:"#818cf8", accentGlow:"rgba(129,140,248,0.3)",
    cardBg:"rgba(30,58,138,0.06)", statBg:"rgba(30,58,138,0.08)",
    tooltipBg:"#020817", badgeBg:"rgba(129,140,248,0.12)",
    settingsBg:"rgba(30,58,138,0.06)", settingsBorder:"rgba(99,102,241,0.12)",
    glow1:"rgba(99,102,241,0.07)", glow2:"rgba(167,139,250,0.05)", glow3:"rgba(56,189,248,0.04)",
  },
};

const FONT_SIZES = {
  S:  { base:13, sm:11, lg:16, xl:20, h1:22, label:10 },
  M:  { base:15, sm:12, lg:18, xl:23, h1:26, label:11 },
  L:  { base:17, sm:14, lg:20, xl:26, h1:30, label:12 },
  XL: { base:19, sm:15, lg:22, xl:30, h1:34, label:13 },
};

const FONT_FAMILIES = {
  "Elegant":  { body:"'Crimson Text',Georgia,serif",   heading:"'Cinzel',serif" },
  "Modern":   { body:"'Inter','Helvetica Neue',sans-serif", heading:"'Inter',sans-serif" },
  "Classic":  { body:"Georgia,'Times New Roman',serif", heading:"Georgia,serif" },
  "Round":    { body:"'Nunito','Segoe UI',sans-serif",  heading:"'Nunito',sans-serif" },
};

/* ─── storage helpers ─── */
function gfs(k,fb){try{return JSON.parse(localStorage.getItem(SK(k)))??fb;}catch{return fb;}}
function sfs(k,v){localStorage.setItem(SK(k),JSON.stringify(v));}

/* ─── data helpers ─── */
const blankSub = () => ({ videos:"", hours:"", videoTopics:[{topic:""}], questions:[{topic:"",count:""}] });
const blankDay = () => ({ date:todayStr(), subjects:{Maths:blankSub(),Physics:blankSub(),Chemistry:blankSub()}, rating:"", notes:"", submitted:false, aiSummary:"" });

const getTimeGreeting=()=>{const h=new Date().getHours();if(h<5)return"Still up late";if(h<12)return"Good morning";if(h<17)return"Good afternoon";if(h<21)return"Good evening";return"Burning midnight oil";};

function getMotivation(name,streak,accent){
  const n=name||"Champion";const c=accent;
  if(streak===0)  return{msg:`Every IIT topper started exactly where you are right now, ${n}. Today is Day 1 of your story.`,emoji:"🌱",color:"#6ee7b7",glow:false,badge:null};
  if(streak===1)  return{msg:`${n}, Day 1 is in the books! The hardest part is always starting — you've already won that battle.`,emoji:"⚡",color:"#4ade80",glow:false,badge:null};
  if(streak===2)  return{msg:`Two days running, ${n}! Consistency is the only thing that separates dreamers from IITians.`,emoji:"🔥",color:"#fb923c",glow:false,badge:null};
  if(streak===3)  return{msg:`${n}, 3 days strong! Science says neural pathways form right around now. Your brain is physically changing for JEE.`,emoji:"🧠",color:c,glow:true,badge:null};
  if(streak<=6)   return{msg:`${streak} days of fire, ${n}! Most people talk about JEE. You're out here actually doing it every single day.`,emoji:"💪",color:c,glow:true,badge:null};
  if(streak===7)  return{msg:`ONE FULL WEEK, ${n}! 🎉 Students who study 7 days straight are 3× more likely to crack JEE. You are on that path.`,emoji:"🏅",color:c,glow:true,badge:"7-DAY WARRIOR"};
  if(streak<=13)  return{msg:`${streak} days, ${n}! You're in the top 20% of consistent aspirants. The compound effect is silently doing its magic.`,emoji:"📈",color:"#34d399",glow:true,badge:null};
  if(streak===14) return{msg:`TWO WEEKS, ${n}! Your dedication is extraordinary. While others rest, you're building the foundation IIT is made of.`,emoji:"🌟",color:"#34d399",glow:true,badge:"FORTNIGHT LEGEND"};
  if(streak<=20)  return{msg:`${streak} days, ${n}. Most students quit before this point. You're still here, still grinding. That's elite mentality.`,emoji:"⚔️",color:"#38bdf8",glow:true,badge:null};
  if(streak===21) return{msg:`21 DAYS, ${n} — habit is LOCKED IN! What once felt like effort now feels like who you are. Keep this identity.`,emoji:"💎",color:"#a78bfa",glow:true,badge:"HABIT MACHINE 💎"};
  if(streak<=29)  return{msg:`${streak} days of unbroken discipline, ${n}! IIT professors would be proud. You are what serious preparation looks like.`,emoji:"🚀",color:"#a78bfa",glow:true,badge:null};
  if(streak===30) return{msg:`ONE FULL MONTH, ${n}! 🏆 This is rare. Truly rare. You are not just preparing for JEE — you ARE the JEE aspirant.`,emoji:"🏆",color:c,glow:true,badge:"30-DAY TITAN 🏆"};
  if(streak<=59)  return{msg:`${streak} days of pure elite grind, ${n}! Your competition gave up weeks ago. You're in legendary territory now.`,emoji:"👑",color:c,glow:true,badge:"ELITE GRINDER 👑"};
  return{msg:`${streak} days, ${n}. Top 1% discipline in the entire country. IIT isn't your dream anymore — it's your scheduled destination.`,emoji:"🌠",color:c,glow:true,badge:"UNSTOPPABLE 🌠"};
}

function buildLogLine(log){
  if(!log)return"";const parts=[];
  SUBJECTS.forEach(s=>{
    const d=log.subjects[s];if(!d)return;
    const vids=parseInt(d.videos)||0,hrs=parseFloat(d.hours)||0;
    const vt=(d.videoTopics||[]).map(v=>v.topic).filter(Boolean);
    const qt=(d.questions||[]).filter(q=>q.topic||q.count);
    const qn=qt.reduce((a,q)=>a+(parseInt(q.count)||0),0);
    if(!vids&&!hrs&&!qn)return;
    const bits=[];
    if(vids)bits.push(`${vids} video${vids>1?"s":""}${vt.length?` on ${vt.join(", ")}`:""}`);
    if(hrs)bits.push(`${hrs}h`);
    if(qn){const qd=qt.filter(q=>q.topic).map(q=>`${q.topic} x${q.count}`).join(", ");bits.push(`${qn} Qs${qd?` [${qd}]`:""}`);}
    parts.push(`${SI[s]} ${s}: ${bits.join(" · ")}`);
  });
  return parts.length?parts.join(" | ")+(log.rating?` | Review: "${log.rating}"`:""):"Nothing logged.";
}

/* ─── build global CSS from theme+font settings ─── */
function buildCSS(T,FS,FF){
  return `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  html{-webkit-text-size-adjust:100%;}
  body{margin:0;padding:0;overflow-x:hidden;background:${T.bg};color:${T.text};font-family:${FF.body};font-size:${FS.base}px;line-height:1.6;}
  input,textarea,button,select{font-family:${FF.body};font-size:${FS.base}px;}
  @keyframes float    {0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes pulse-glow{0%,100%{opacity:.3}50%{opacity:.85}}
  @keyframes slide-up {from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slide-in {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes zoom-in  {from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
  @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes glow-pulse{0%,100%{box-shadow:0 0 14px ${T.accentGlow}}50%{box-shadow:0 0 32px ${T.accentGlow}}}
  .slide-up{animation:slide-up .5s cubic-bezier(.16,1,.3,1) forwards;}
  .slide-in{animation:slide-in .38s ease forwards;}
  .zoom-in {animation:zoom-in  .42s cubic-bezier(.16,1,.3,1) forwards;}
  .onb-btn {transition:all .2s cubic-bezier(.16,1,.3,1)!important;}
  .onb-btn:hover{transform:scale(1.025);box-shadow:0 8px 28px ${T.accentGlow}!important;}
  .save-btn{transition:all .2s cubic-bezier(.16,1,.3,1)!important;}
  .save-btn:hover{transform:translateY(-2px);box-shadow:0 10px 34px ${T.accentGlow}!important;}
  .tab-btn{transition:color .18s,border-color .18s;}
  .tab-btn:hover{color:${T.text}!important;}
  .sub-card{transition:transform .18s,box-shadow .18s;}
  .sub-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px ${T.accentGlow};}
  .setting-row{transition:background .15s;}
  .setting-row:hover{background:${T.settingsBg}!important;}
  input,textarea{transition:border-color .18s,box-shadow .18s;}
  input:focus,textarea:focus{border-color:${T.accentMain}!important;box-shadow:0 0 0 3px ${T.accentGlow.replace("0.3","0.12")}!important;outline:none;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
  `;
}

/* ═══════════════════════════════════════════════
   ONBOARDING  (always dark — standalone)
═══════════════════════════════════════════════ */
function Onboarding({onComplete}){
  const [step,setStep]=useState(0);
  const [name,setName]=useState("");
  const [target,setTarget]=useState("JEE Advanced");
  const [appeared,setAppeared]=useState(false);
  const inp=useRef();
  useEffect(()=>{setTimeout(()=>setAppeared(true),60);},[]);
  useEffect(()=>{if(step===1&&inp.current)setTimeout(()=>inp.current.focus(),350);},[step]);
  const QUOTES=[
    {text:"Success is not final, failure is not fatal — it is the courage to continue that counts.",author:"Winston Churchill"},
    {text:"The difference between ordinary and extraordinary is that little extra.",author:"Jimmy Johnson"},
    {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
    {text:"Hard work beats talent when talent doesn't work hard.",author:"Tim Notke"},
  ];
  const [q]=useState(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)]);
  const pts=Array.from({length:14},(_,i)=>({x:Math.random()*100,y:Math.random()*100,r:Math.random()*2.5+0.8,delay:Math.random()*4,dur:Math.random()*3+2.5}));
  const bigBtn=(dis=false)=>({width:"100%",padding:"16px 20px",background:dis?"rgba(255,255,255,.05)":"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",borderRadius:14,color:dis?"#4a4a5a":"#06060f",fontSize:16,fontWeight:700,fontFamily:"'Cinzel',serif",cursor:dis?"not-allowed":"pointer",letterSpacing:1,boxShadow:dis?"none":"0 4px 22px rgba(245,158,11,.3)"});
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#07070f 0%,#0d0a1a 50%,#060d1a 100%)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",fontFamily:"'Crimson Text',Georgia,serif",padding:"24px 16px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');*,*::before,*::after{box-sizing:border-box;}body{margin:0;overflow-x:hidden;}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes pulse-glow{0%,100%{opacity:.3}50%{opacity:.85}}@keyframes slide-up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.slide-up{animation:slide-up .5s cubic-bezier(.16,1,.3,1) forwards;}.onb-btn{transition:all .2s cubic-bezier(.16,1,.3,1)!important;}.onb-btn:hover{transform:scale(1.025);box-shadow:0 8px 28px rgba(245,158,11,.35)!important;}input:focus{border-color:rgba(245,158,11,.5)!important;outline:none;}.target-opt{transition:all .18s;}.target-opt:hover{border-color:rgba(245,158,11,.45)!important;background:rgba(245,158,11,.07)!important;}.target-opt.sel{border-color:rgba(245,158,11,.6)!important;background:rgba(245,158,11,.1)!important;}`}</style>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs>
          <radialGradient id="og1" cx="20%" cy="20%"><stop offset="0%" stopColor="#f59e0b" stopOpacity=".07"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          <radialGradient id="og2" cx="80%" cy="80%"><stop offset="0%" stopColor="#a78bfa" stopOpacity=".07"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#og1)"/><rect width="100%" height="100%" fill="url(#og2)"/>
        {pts.map((p,i)=><circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r={p.r} fill={["#f59e0b","#a78bfa","#38bdf8"][i%3]} opacity="0" style={{animation:`pulse-glow ${p.dur}s ${p.delay}s ease-in-out infinite`}}/>)}
      </svg>
      <div style={{position:"absolute",width:"min(520px,130vw)",height:"min(520px,130vw)",borderRadius:"50%",border:"1px solid rgba(245,158,11,.05)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"spin-slow 44s linear infinite",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:460,opacity:appeared?1:0,transform:appeared?"translateY(0)":"translateY(18px)",transition:"all .6s cubic-bezier(.16,1,.3,1)"}}>
        {step===0&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"clamp(48px,12vw,68px)",marginBottom:14,animation:"float 3s ease-in-out infinite",display:"inline-block"}}>🎯</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(10px,2.5vw,13px)",letterSpacing:5,color:"#f59e0b",textTransform:"uppercase",marginBottom:10}}>JEE Preparation</div>
            <h1 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(26px,8vw,40px)",margin:"0 0 8px",fontWeight:700,lineHeight:1.15,background:"linear-gradient(135deg,#f0ece0,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Study Tracker</h1>
            <p style={{color:"#9a9ab0",fontSize:"clamp(14px,3.5vw,16px)",marginBottom:28,lineHeight:1.65}}>Your personal companion for cracking JEE</p>
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"18px 20px",marginBottom:28,textAlign:"left"}}>
              <div style={{fontSize:22,color:"#f59e0b",opacity:.5,marginBottom:6}}>"</div>
              <p style={{color:"#c4b99a",fontSize:"clamp(13px,3.5vw,15px)",fontStyle:"italic",lineHeight:1.7,margin:"0 0 8px"}}>{q.text}</p>
              <div style={{fontSize:11,color:"#5a5a6a",letterSpacing:1}}>— {q.author}</div>
            </div>
            <button className="onb-btn" onClick={()=>setStep(1)} style={bigBtn()}>Begin My Journey →</button>
            <p style={{color:"#3a3a4a",fontSize:11,marginTop:10}}>No login required · All data stored on your device</p>
          </div>
        )}
        {step===1&&(
          <div className="slide-up" style={{textAlign:"center"}}>
            <div style={{fontSize:"clamp(36px,10vw,52px)",marginBottom:16}}>👋</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:5,color:"#f59e0b",textTransform:"uppercase",marginBottom:10}}>Step 1 of 2</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(20px,6vw,28px)",color:"#f0ece0",margin:"0 0 8px"}}>What's your name?</h2>
            <p style={{color:"#8a8aa0",fontSize:"clamp(13px,3.5vw,15px)",marginBottom:28,lineHeight:1.65}}>I'll use your name to personalise every message and keep you motivated.</p>
            <input ref={inp} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",borderRadius:14,padding:"14px 18px",color:"#f0ece0",fontSize:"clamp(16px,4vw,20px)",fontFamily:"'Crimson Text',Georgia,serif",outline:"none",width:"100%",boxSizing:"border-box",textAlign:"center",marginBottom:22}} placeholder="Enter your name..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&setStep(2)} autoComplete="given-name"/>
            <button className="onb-btn" onClick={()=>name.trim()&&setStep(2)} disabled={!name.trim()} style={bigBtn(!name.trim())}>Continue →</button>
          </div>
        )}
        {step===2&&(
          <div className="slide-up" style={{textAlign:"center"}}>
            <div style={{fontSize:"clamp(36px,10vw,52px)",marginBottom:16}}>🎯</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:5,color:"#f59e0b",textTransform:"uppercase",marginBottom:10}}>Step 2 of 2</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(18px,5.5vw,26px)",color:"#f0ece0",margin:"0 0 6px"}}>Your target, {name}?</h2>
            <p style={{color:"#8a8aa0",fontSize:"clamp(13px,3.5vw,15px)",marginBottom:24,lineHeight:1.65}}>This helps tailor your daily motivation.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {["JEE Advanced","JEE Mains","Both JEE Mains & Advanced"].map(t=>(
                <button key={t} className={`target-opt${target===t?" sel":""}`} onClick={()=>setTarget(t)} style={{padding:"14px 18px",background:target===t?"rgba(245,158,11,.1)":"rgba(255,255,255,.03)",border:`1px solid ${target===t?"rgba(245,158,11,.55)":"rgba(255,255,255,.08)"}`,borderRadius:12,color:target===t?"#f59e0b":"#c4b99a",fontSize:"clamp(13px,3.5vw,15px)",fontFamily:"'Crimson Text',Georgia,serif",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}>{t.includes("Advanced")&&!t.includes("Both")?"🏆":t.includes("Both")?"⭐":"🎯"}</span>
                  <span style={{flex:1}}>{t}</span>
                  {target===t&&<span style={{color:"#f59e0b",fontSize:16}}>✓</span>}
                </button>
              ))}
            </div>
            <button className="onb-btn" onClick={()=>setStep(3)} style={bigBtn()}>Let's Go! →</button>
          </div>
        )}
        {step===3&&(
          <div className="slide-up" style={{textAlign:"center"}}>
            <div style={{fontSize:"clamp(48px,12vw,68px)",marginBottom:16,animation:"float 2.2s ease-in-out infinite",display:"inline-block"}}>🚀</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(22px,6vw,32px)",margin:"0 0 12px",background:"linear-gradient(135deg,#f0ece0,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>You're all set, {name}!</h2>
            <p style={{color:"#c4b99a",fontSize:"clamp(14px,3.8vw,17px)",marginBottom:8,lineHeight:1.7}}>Your journey to <strong style={{color:"#f59e0b"}}>{target}</strong> starts today.</p>
            <p style={{color:"#6a6a7a",fontSize:"clamp(12px,3.2vw,14px)",marginBottom:28,lineHeight:1.75}}>Log every session. Track every topic.<br/>Build an unbreakable streak, one day at a time.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:28}}>
              {[["📹","Videos"],["❓","Questions"],["🔥","Streak"]].map(([ic,lb])=>(
                <div key={lb} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
                  <div style={{fontSize:"clamp(18px,5vw,24px)",marginBottom:6}}>{ic}</div>
                  <div style={{fontSize:"clamp(10px,2.5vw,12px)",color:"#6a6a7a"}}>{lb}</div>
                </div>
              ))}
            </div>
            <button className="onb-btn" onClick={()=>onComplete(name,target)} style={{...bigBtn(),padding:"18px 20px",fontSize:17,boxShadow:"0 6px 26px rgba(245,158,11,.34)"}}>Open My Tracker →</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SETTINGS PANEL
═══════════════════════════════════════════════ */
function SettingsPanel({T,FS,FF,themeName,fontSize,fontFamily,setThemeName,setFontSize,setFontFamily,userName,userTarget,onReset}){
  const row=(label,children)=>(
    <div className="setting-row" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderRadius:12,marginBottom:4,flexWrap:"wrap",gap:12,background:"transparent"}}>
      <span style={{fontSize:FS.base,color:T.text,fontWeight:600,minWidth:120}}>{label}</span>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>
    </div>
  );
  const chip=(val,current,setter,label,extra={})=>(
    <button key={val} onClick={()=>setter(val)} style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${val===current?T.accentMain:T.border}`,background:val===current?T.badgeBg:"transparent",color:val===current?T.accentMain:T.textSub,fontSize:FS.sm,cursor:"pointer",fontFamily:FF.body,transition:"all .18s",...extra}}>
      {label||val}
    </button>
  );
  return(
    <div style={{animation:"slide-in .38s ease forwards"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontFamily:FF.heading,fontSize:FS.h1,color:T.text,fontWeight:700,marginBottom:4}}>⚙️ Settings</div>
        <div style={{fontSize:FS.sm,color:T.textMuted}}>Personalise your study tracker experience</div>
      </div>

      {/* profile info */}
      <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"clamp(16px,4vw,22px)",marginBottom:20}}>
        <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:T.accentMain,marginBottom:16,fontWeight:600}}>👤 Profile</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{background:T.settingsBg,border:`1px solid ${T.settingsBorder}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:FS.sm,color:T.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Name</div>
            <div style={{fontSize:FS.lg,color:T.text,fontWeight:600}}>{userName}</div>
          </div>
          <div style={{background:T.settingsBg,border:`1px solid ${T.settingsBorder}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:FS.sm,color:T.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Target</div>
            <div style={{fontSize:FS.base,color:T.text,fontWeight:600}}>{userTarget}</div>
          </div>
        </div>
      </div>

      {/* appearance */}
      <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"clamp(16px,4vw,22px)",marginBottom:20}}>
        <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:T.accentMain,marginBottom:18,fontWeight:600}}>🎨 Appearance</div>

        {/* themes */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:FS.sm,color:T.textLabel,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Background Theme</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {Object.entries(THEMES).map(([key,th])=>(
              <button key={key} onClick={()=>setThemeName(key)} style={{padding:"14px 16px",borderRadius:12,border:`2px solid ${key===themeName?th.accentMain:T.border}`,background:key===themeName?th.badgeBg:T.settingsBg,cursor:"pointer",textAlign:"left",transition:"all .18s",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{th.icon}</span>
                <div>
                  <div style={{fontSize:FS.base,fontWeight:600,color:key===themeName?th.accentMain:T.text,fontFamily:FF.body}}>{th.name}</div>
                  <div style={{width:40,height:4,borderRadius:2,background:th.accentMain,marginTop:4,opacity:.7}}/>
                </div>
                {key===themeName&&<span style={{marginLeft:"auto",color:T.accentMain,fontSize:16}}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* font size */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:FS.sm,color:T.textLabel,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Text Size</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.keys(FONT_SIZES).map(sz=>(
              <button key={sz} onClick={()=>setFontSize(sz)} style={{padding:"10px 20px",borderRadius:10,border:`1.5px solid ${sz===fontSize?T.accentMain:T.border}`,background:sz===fontSize?T.badgeBg:"transparent",color:sz===fontSize?T.accentMain:T.textSub,fontSize:sz==="S"?13:sz==="M"?15:sz==="L"?17:19,cursor:"pointer",fontFamily:FF.body,fontWeight:sz===fontSize?700:400,transition:"all .18s",minWidth:52}}>
                {sz}
              </button>
            ))}
          </div>
          <div style={{fontSize:FS.sm,color:T.textMuted,marginTop:8}}>Current: <span style={{color:T.accentMain,fontWeight:600}}>{fontSize}</span> — body text is {FONT_SIZES[fontSize].base}px</div>
        </div>

        {/* font family */}
        <div>
          <div style={{fontSize:FS.sm,color:T.textLabel,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Text Style</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {Object.entries(FONT_FAMILIES).map(([key,ff])=>(
              <button key={key} onClick={()=>setFontFamily(key)} style={{padding:"12px 14px",borderRadius:10,border:`1.5px solid ${key===fontFamily?T.accentMain:T.border}`,background:key===fontFamily?T.badgeBg:T.settingsBg,cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                <div style={{fontSize:FS.base,fontFamily:ff.body,color:key===fontFamily?T.accentMain:T.text,fontWeight:key===fontFamily?700:400,marginBottom:2}}>{key}</div>
                <div style={{fontSize:FS.sm,fontFamily:ff.body,color:T.textMuted}}>The quick brown fox</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* preview */}
      <div style={{background:T.cardBg,border:`1px solid ${T.borderAccent}`,borderRadius:16,padding:"clamp(16px,4vw,22px)",marginBottom:20}}>
        <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:T.accentMain,marginBottom:14,fontWeight:600}}>👁️ Preview</div>
        <div style={{fontFamily:FF.heading,fontSize:FS.h1,color:T.text,fontWeight:700,marginBottom:6}}>JEE Study Tracker</div>
        <div style={{fontSize:FS.base,color:T.textSub,marginBottom:10,lineHeight:1.6}}>This is how your text looks with current settings. Clear, readable, and personalised for your study sessions.</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {SUBJECTS.map(s=><span key={s} style={{background:T.badgeBg,border:`1px solid ${T.accentMain}30`,color:T.accentMain,padding:"5px 14px",borderRadius:20,fontSize:FS.sm,fontFamily:FF.body}}>{SI[s]} {s}</span>)}
        </div>
      </div>

      {/* danger zone */}
      <div style={{background:"rgba(239,68,68,.04)",border:"1px solid rgba(239,68,68,.15)",borderRadius:16,padding:"clamp(16px,4vw,22px)"}}>
        <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:"#ef4444",marginBottom:10,fontWeight:600}}>⚠️ Reset</div>
        <div style={{fontSize:FS.sm,color:T.textMuted,marginBottom:14,lineHeight:1.6}}>Clear all your study data and start fresh. This cannot be undone.</div>
        <button onClick={onReset} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",color:"#ef4444",padding:"11px 22px",borderRadius:10,cursor:"pointer",fontFamily:FF.body,fontSize:FS.base,letterSpacing:.5}}>Reset All Data</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App(){
  const [userName,    setUserName]    = useState(()=>gfs("userName",null));
  const [userTarget,  setUserTarget]  = useState(()=>gfs("userTarget","JEE Advanced"));
  const [tab,         setTab]         = useState(0);
  const [dayLogs,     setDayLogs]     = useState(()=>gfs("dayLogs",{}));
  const [exams,       setExams]       = useState(()=>gfs("exams",[]));
  const [form,        setForm]        = useState(()=>{const e=gfs("dayLogs",{})[todayStr()];return e?{...e}:blankDay();});
  const [examForm,    setExamForm]    = useState({date:todayStr(),name:"",maths:"",physics:"",chemistry:"",total:"",avgMaths:"",avgPhysics:"",avgChemistry:"",avgTotal:""});
  const [streak,      setStreak]      = useState(0);
  const [toast,       setToast]       = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [dashSummary, setDashSummary] = useState("");
  const [dashLoading, setDashLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  /* settings */
  const [themeName,   setThemeNameS]  = useState(()=>gfs("themeName","dark"));
  const [fontSize,    setFontSizeS]   = useState(()=>gfs("fontSize","M"));
  const [fontFamily,  setFontFamilyS] = useState(()=>gfs("fontFamily","Elegant"));

  const setThemeName  = v=>{setThemeNameS(v); sfs("themeName",v);};
  const setFontSize   = v=>{setFontSizeS(v);  sfs("fontSize",v);};
  const setFontFamily = v=>{setFontFamilyS(v);sfs("fontFamily",v);};

  const T  = THEMES[themeName] || THEMES.dark;
  const FS = FONT_SIZES[fontSize] || FONT_SIZES.M;
  const FF = FONT_FAMILIES[fontFamily] || FONT_FAMILIES.Elegant;
  const CSS = buildCSS(T,FS,FF);

  /* streak */
  useEffect(()=>{
    sfs("dayLogs",dayLogs);
    let s=0;const d=new Date();
    while(true){const ds=d.toISOString().slice(0,10);if(dayLogs[ds]?.submitted){s++;d.setDate(d.getDate()-1);}else break;}
    setStreak(s);sfs("streak",s);
  },[dayLogs]);
  useEffect(()=>{sfs("exams",exams);},[exams]);

  const showToast=m=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  const onboard=(name,target)=>{sfs("userName",name);sfs("userTarget",target);setUserName(name);setUserTarget(target);setShowWelcome(true);setTimeout(()=>setShowWelcome(false),2800);};

  /* form helpers */
  const updSub=(s,f,v)=>setForm(fm=>({...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],[f]:v}}}));
  const updQ=(s,i,f,v)=>setForm(fm=>{const qs=[...fm.subjects[s].questions];qs[i]={...qs[i],[f]:v};return{...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],questions:qs}}};});
  const addQ=s=>setForm(fm=>({...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],questions:[...fm.subjects[s].questions,{topic:"",count:""}]}}}));
  const remQ=(s,i)=>setForm(fm=>{const qs=fm.subjects[s].questions.filter((_,j)=>j!==i);return{...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],questions:qs.length?qs:[{topic:"",count:""}]}}};});
  const updVT=(s,i,v)=>setForm(fm=>{const vt=[...(fm.subjects[s].videoTopics||[])];vt[i]={topic:v};return{...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],videoTopics:vt}}};});
  const addVT=s=>setForm(fm=>({...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],videoTopics:[...(fm.subjects[s].videoTopics||[]),{topic:""}]}}}));
  const remVT=(s,i)=>setForm(fm=>{const vt=(fm.subjects[s].videoTopics||[]).filter((_,j)=>j!==i);return{...fm,subjects:{...fm.subjects,[s]:{...fm.subjects[s],videoTopics:vt.length?vt:[{topic:""}]}}};});

  const callAI=async prompt=>{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});const d=await r.json();return(d.content||[]).map(c=>c.text||"").join("").trim();};

  const submitDay=async()=>{
    const log={...form,date:todayStr(),submitted:true};setAiLoading(true);
    try{const s=await callAI(`You are an energetic personal JEE coach. Student name: ${userName||"Champion"}, target: ${userTarget}. Write a warm 3-sentence personal daily report. S1: address by name, summarise subjects/topics/videos studied with specifics. S2: highlight their strongest effort today. S3: powerful personal motivational line mentioning their ${streak+1}-day streak and ${userTarget} goal. Max 90 words. No bullets.\n\nLog:\n${buildLogLine(log)}`);const final={...log,aiSummary:s};setDayLogs(p=>({...p,[todayStr()]:final}));setForm(final);}
    catch{setDayLogs(p=>({...p,[todayStr()]:log}));setForm(log);}
    setAiLoading(false);showToast("✅ Today's log saved!");
  };

  const genDashSummary=async()=>{
    const sd=Object.keys(dayLogs).sort();if(!sd.length)return;setDashLoading(true);
    const last7=sd.slice(-7);const lines=last7.map(d=>`${d}: ${buildLogLine(dayLogs[d])}`).join("\n");
    try{const t=await callAI(`JEE coach. Student: ${userName||"student"}, Target: ${userTarget}, Streak: ${streak} days.\nLast ${last7.length} days:\n${lines}\n\nWrite 3-4 sentences addressed personally to ${userName||"them"}: subjects that dominated, any weak area, consistency /10, strong personal close mentioning ${userTarget}. Under 110 words. No bullets.`);setDashSummary(t);}
    catch{setDashSummary("Could not generate. Try again.");}
    setDashLoading(false);
  };

  const submitExam=()=>{if(!examForm.name)return showToast("Please enter exam name");setExams(e=>[...e,{...examForm,id:Date.now()}]);setExamForm({date:todayStr(),name:"",maths:"",physics:"",chemistry:"",total:"",avgMaths:"",avgPhysics:"",avgChemistry:"",avgTotal:""});showToast("🏆 Exam result saved!");};

  const handleReset=()=>{if(window.confirm("Reset ALL data? This cannot be undone.")){["dayLogs","exams","userName","userTarget","streak"].forEach(k=>localStorage.removeItem(SK(k)));window.location.reload();}};

  /* derived data */
  const sortedDates=Object.keys(dayLogs).sort();
  const last14=sortedDates.slice(-14);
  const lineData=last14.map(d=>{const log=dayLogs[d];const tQ=SUBJECTS.reduce((a,s)=>a+(log.subjects[s]?.questions||[]).reduce((b,q)=>b+(parseInt(q.count)||0),0),0);return{date:d.slice(5),Maths:parseFloat(log.subjects.Maths?.hours)||0,Physics:parseFloat(log.subjects.Physics?.hours)||0,Chemistry:parseFloat(log.subjects.Chemistry?.hours)||0,Questions:tQ};});
  const examLD=exams.map(e=>({name:`${e.date.slice(5)} ${e.name}`,"Your Total":+e.total||0,"Class Avg":+e.avgTotal||null,Maths:+e.maths||0,Physics:+e.physics||0,Chemistry:+e.chemistry||0,"Avg Maths":+e.avgMaths||null,"Avg Physics":+e.avgPhysics||null,"Avg Chemistry":+e.avgChemistry||null}));
  const wkData={};sortedDates.forEach(d=>{const w=weekOf(d);if(!wkData[w])wkData[w]={Maths:0,Physics:0,Chemistry:0,days:0};SUBJECTS.forEach(s=>{wkData[w][s]+=parseFloat(dayLogs[d].subjects[s]?.hours)||0;});wkData[w].days++;});
  const wkAvg=Object.entries(wkData).map(([w,v])=>({week:w.slice(5),Maths:+(v.Maths/v.days).toFixed(2),Physics:+(v.Physics/v.days).toFixed(2),Chemistry:+(v.Chemistry/v.days).toFixed(2)}));
  const totalH=sortedDates.reduce((a,d)=>a+SUBJECTS.reduce((b,s)=>b+(parseFloat(dayLogs[d]?.subjects[s]?.hours)||0),0),0);
  const motiv=getMotivation(userName,streak,T.accentMain);
  const todayLog=dayLogs[todayStr()];
  const greeting=getTimeGreeting();

  /* shared style factories using theme */
  const IS={background:T.input,border:`1px solid ${T.inputBorder}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:FS.base,fontFamily:FF.body,outline:"none",width:"100%",boxSizing:"border-box"};
  const RMB={background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.22)",color:"#ef4444",borderRadius:8,padding:"10px 12px",cursor:"pointer",fontSize:FS.base,flexShrink:0,lineHeight:1,minWidth:38};
  const ADB=c=>({background:"none",border:`1px dashed ${c}50`,color:c,padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:FS.sm,marginTop:6,fontFamily:FF.body,transition:"border-color .18s"});
  const LS={display:"flex",flexDirection:"column",gap:7};
  const LT={fontSize:FS.label,color:T.textLabel,letterSpacing:2,textTransform:"uppercase",fontFamily:FF.body};
  const TT={background:T.tooltipBg,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:FS.sm};

  if(!userName) return <Onboarding onComplete={onboard}/>;

  if(showWelcome) return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{CSS}</style>
      <div className="zoom-in" style={{textAlign:"center"}}>
        <div style={{fontSize:"clamp(52px,15vw,80px)",marginBottom:16}}>🔥</div>
        <h1 style={{fontFamily:FF.heading,fontSize:"clamp(22px,7vw,36px)",margin:"0 0 10px",color:T.text}}>Welcome, {userName}!</h1>
        <p style={{color:T.textMuted,fontSize:"clamp(14px,4vw,18px)",margin:0}}>Your {userTarget} journey starts NOW.</p>
      </div>
    </div>
  );

  /* ── RENDER ── */
  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:FF.body,fontSize:FS.base,position:"relative"}}>
      <style>{CSS}</style>
      {/* bg glow */}
      <div style={{position:"fixed",inset:0,backgroundImage:`radial-gradient(ellipse at 10% 10%,${T.glow1} 0%,transparent 50%),radial-gradient(ellipse at 90% 90%,${T.glow2} 0%,transparent 50%),radial-gradient(ellipse at 90% 10%,${T.glow3} 0%,transparent 50%)`,pointerEvents:"none",zIndex:0}}/>

      {/* toast */}
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:T.tooltipBg,border:`1px solid ${T.accentMain}`,color:T.accentMain,padding:"11px 22px",borderRadius:10,fontSize:FS.base,zIndex:999,boxShadow:`0 4px 24px ${T.accentGlow}`,whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center"}}>{toast}</div>}

      {/* ── HEADER ── */}
      <div style={{position:"sticky",top:0,zIndex:50,background:T.bgHeader,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${T.borderAccent}`}}>
        <div style={{maxWidth:980,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,paddingBottom:8,gap:12}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:FS.sm,color:T.textMuted,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {greeting}, <span style={{color:T.accentMain,fontWeight:700}}>{userName}</span> 👋
              </div>
              <div style={{fontFamily:FF.heading,fontSize:`clamp(${FS.lg}px,4vw,${FS.xl}px)`,color:T.text,fontWeight:700,letterSpacing:.4,lineHeight:1.2}}>JEE Study Tracker</div>
              <div style={{fontSize:FS.sm,color:T.textMuted,marginTop:2}}>Target: <span style={{color:T.textSub,fontWeight:600}}>{userTarget}</span></div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:FF.heading,fontSize:`clamp(20px,6vw,30px)`,fontWeight:700,color:T.accentMain,lineHeight:1,textShadow:streak>=3?`0 0 24px ${T.accentGlow}`:"none",animation:streak>=7?"float 3s ease-in-out infinite":"none"}}>🔥 {streak}</div>
              <div style={{fontSize:FS.label,color:T.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginTop:2}}>Streak</div>
              {streak>=7&&<div style={{fontSize:FS.label,marginTop:2,fontWeight:700,letterSpacing:1,color:streak>=30?"#fbbf24":streak>=21?"#a78bfa":streak>=14?"#34d399":T.accentMain}}>{streak>=30?"LEGEND 👑":streak>=21?"ELITE 💎":streak>=14?"STELLAR 🌟":"ON FIRE 🔥"}</div>}
            </div>
          </div>

          {/* motivation strip */}
          <div style={{margin:"0 0 10px",padding:"9px 14px",background:motiv.glow?T.badgeBg:"transparent",border:`1px solid ${motiv.color}22`,borderRadius:10,display:"flex",alignItems:"flex-start",gap:8,animation:motiv.glow?"glow-pulse 3.5s ease-in-out infinite":"none"}}>
            <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{motiv.emoji}</span>
            <span style={{fontSize:FS.sm,color:motiv.color,lineHeight:1.55,flex:1,fontWeight:500}}>{motiv.msg}</span>
            {motiv.badge&&<span style={{flexShrink:0,background:`${motiv.color}15`,border:`1px solid ${motiv.color}30`,color:motiv.color,fontSize:FS.label,padding:"3px 9px",borderRadius:20,letterSpacing:1,alignSelf:"center"}}>{motiv.badge}</span>}
          </div>

          {/* tabs */}
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
            {TABS.map((t,i)=>(
              <button key={i} className="tab-btn" onClick={()=>setTab(i)} style={{background:"none",border:"none",color:tab===i?T.accentMain:T.textMuted,padding:"9px clamp(8px,2.5vw,16px)",cursor:"pointer",fontSize:FS.sm,fontFamily:FF.heading,borderBottom:tab===i?`2px solid ${T.accentMain}`:"2px solid transparent",whiteSpace:"nowrap",flexShrink:0,letterSpacing:.3,fontWeight:tab===i?700:400}}>
                {TAB_ICONS[i]} {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:980,margin:"0 auto",padding:"24px 16px 56px",position:"relative",zIndex:1}}>

        {/* ══ TODAY ══ */}
        {tab===0&&(
          <div className="slide-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontFamily:FF.heading,fontSize:FS.xl,color:T.text,fontWeight:700,marginBottom:3}}>Today's Session</div>
                <div style={{fontSize:FS.sm,color:T.textMuted}}>{new Date().toDateString()}</div>
              </div>
              {todayLog?.submitted&&<span style={{background:"rgba(74,222,128,.1)",color:"#4ade80",padding:"6px 14px",borderRadius:20,fontSize:FS.sm,border:"1px solid rgba(74,222,128,.22)",fontWeight:600}}>✓ Saved</span>}
            </div>

            {SUBJECTS.map(subj=>{
              const col=SC[subj];
              return(
                <div key={subj} className="sub-card" style={{marginBottom:20,background:T.cardBg,border:`1px solid ${col}28`,borderRadius:16,padding:"clamp(16px,4vw,24px)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${col}18`}}>
                    <div style={{width:42,height:42,borderRadius:12,background:`${col}15`,border:`1px solid ${col}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:col,flexShrink:0}}>{SI[subj]}</div>
                    <div>
                      <div style={{fontFamily:FF.heading,fontSize:FS.lg,fontWeight:700,color:col}}>{subj}</div>
                      <div style={{fontSize:FS.sm,color:T.textMuted}}>{subj==="Maths"?"Calculus · Algebra · Geometry":subj==="Physics"?"Mechanics · Electricity · Optics":"Physical · Organic · Inorganic"}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                    <div style={LS}><span style={LT}>Videos</span><input style={IS} type="number" min="0" placeholder="0" inputMode="numeric" value={form.subjects[subj].videos} onChange={e=>updSub(subj,"videos",e.target.value)}/></div>
                    <div style={LS}><span style={LT}>Hours</span><input style={IS} type="number" min="0" step="0.5" placeholder="0.0" inputMode="decimal" value={form.subjects[subj].hours} onChange={e=>updSub(subj,"hours",e.target.value)}/></div>
                  </div>
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:FS.label,color:col,letterSpacing:1.8,textTransform:"uppercase",marginBottom:10,opacity:.85,fontWeight:600}}>▶ Video Topics</div>
                    {(form.subjects[subj].videoTopics||[]).map((vt,idx)=>(
                      <div key={idx} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                        <input style={{...IS,flex:1}} placeholder={subj==="Maths"?"e.g. Limits & Continuity":subj==="Physics"?"e.g. Newton's Laws":"e.g. Periodic Trends"} value={vt.topic} onChange={e=>updVT(subj,idx,e.target.value)}/>
                        {(form.subjects[subj].videoTopics||[]).length>1&&<button onClick={()=>remVT(subj,idx)} style={RMB}>✕</button>}
                      </div>
                    ))}
                    <button onClick={()=>addVT(subj)} style={ADB(col)}>+ Add Video Topic</button>
                  </div>
                  <div>
                    <div style={{fontSize:FS.label,color:col,letterSpacing:1.8,textTransform:"uppercase",marginBottom:10,opacity:.85,fontWeight:600}}>❓ Questions by Topic</div>
                    {form.subjects[subj].questions.map((q,idx)=>(
                      <div key={idx} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                        <input style={{...IS,flex:3,minWidth:0}} placeholder="Topic (e.g. Integration)" value={q.topic} onChange={e=>updQ(subj,idx,"topic",e.target.value)}/>
                        <input style={{...IS,flex:"0 0 70px",width:"70px"}} type="number" min="0" placeholder="Qty" inputMode="numeric" value={q.count} onChange={e=>updQ(subj,idx,"count",e.target.value)}/>
                        {form.subjects[subj].questions.length>1&&<button onClick={()=>remQ(subj,idx)} style={RMB}>✕</button>}
                      </div>
                    ))}
                    <button onClick={()=>addQ(subj)} style={ADB(col)}>+ Add Topic</button>
                  </div>
                </div>
              );
            })}

            <div style={{background:T.cardBg,border:`1px solid ${T.borderAccent}`,borderRadius:16,padding:"clamp(16px,4vw,24px)",marginBottom:20}}>
              <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:T.textSub,marginBottom:16,fontWeight:600}}>Day Review</div>
              <div style={LS}>
                <span style={LT}>How was today, {userName}? Rate & reflect freely</span>
                <textarea style={{...IS,minHeight:80,resize:"vertical",lineHeight:1.75}} placeholder="e.g. 8/10 — great session on integration, need to revise electrochemistry tomorrow." value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))}/>
              </div>
              <div style={{...LS,marginTop:14}}>
                <span style={LT}>Notes & goals for tomorrow</span>
                <textarea style={{...IS,minHeight:54,resize:"vertical",lineHeight:1.75}} placeholder="Topics to revise, doubts to clear..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </div>

            <button className="save-btn" onClick={submitDay} disabled={aiLoading} style={{width:"100%",padding:"clamp(14px,3.5vw,17px)",background:aiLoading?T.badgeBg:`linear-gradient(135deg,${T.accentMain},${T.accentMain}cc)`,border:aiLoading?`1px solid ${T.borderAccent}`:"none",borderRadius:14,color:aiLoading?T.accentMain:themeName==="light"?"#fff":"#06060f",fontSize:FS.lg,fontWeight:700,fontFamily:FF.heading,cursor:aiLoading?"not-allowed":"pointer",letterSpacing:1,boxShadow:aiLoading?"none":`0 4px 22px ${T.accentGlow}`}}>
              {aiLoading?"✨ Generating your AI report...":`Save Today's Log, ${userName} →`}
            </button>

            {form.aiSummary&&(
              <div style={{marginTop:20,padding:"clamp(16px,4vw,22px)",background:T.badgeBg,border:`1px solid ${T.borderAccent}`,borderRadius:14}}>
                <div style={{fontSize:FS.label,color:T.accentMain,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>✨ Your AI Coach Report</div>
                <div style={{fontSize:FS.lg,color:T.textSub,lineHeight:1.9}}>{form.aiSummary}</div>
              </div>
            )}
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {tab===1&&(
          <div className="slide-in">
            <div style={{marginBottom:22}}>
              <div style={{fontFamily:FF.heading,fontSize:FS.xl,color:T.text,fontWeight:700,marginBottom:3}}>{userName}'s Dashboard</div>
              <div style={{fontSize:FS.sm,color:T.textMuted}}>Your {userTarget} preparation at a glance</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:22}}>
              {[{label:"Days Logged",val:sortedDates.length,icon:"📅",col:T.accentMain},{label:"Total Hours",val:totalH.toFixed(1)+"h",icon:"⏱",col:SC.Physics},{label:"Day Streak",val:`${streak} 🔥`,icon:"",col:T.accentMain},{label:"Exams Logged",val:exams.length,icon:"🏆",col:SC.Chemistry}].map((s,i)=>(
                <div key={i} style={{background:T.statBg,border:`1px solid ${s.col}18`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontFamily:FF.heading,fontSize:FS.xl,fontWeight:700,color:s.col}}>{s.val}</div>
                  <div style={{fontSize:FS.label,color:T.textMuted,letterSpacing:1.2,textTransform:"uppercase",marginTop:5}}>{s.label}</div>
                </div>
              ))}
            </div>
            <CB title="Daily Hours by Subject (Last 14 Days)" T={T} FS={FS} FF={FF}><LCW data={lineData} keys={SUBJECTS} colors={SC} T={T} FS={FS}/></CB>
            <CB title="Daily Questions Solved" T={T} FS={FS} FF={FF}><LCW data={lineData} keys={["Questions"]} colors={{Questions:"#4ade80"}} T={T} FS={FS}/></CB>
            <CB title="Weekly Average Hours" T={T} FS={FS} FF={FF}><LCW data={wkAvg} xKey="week" keys={SUBJECTS} colors={SC} T={T} FS={FS}/></CB>
            <div style={{background:T.cardBg,border:`1px solid ${SC.Chemistry}28`,borderRadius:14,padding:"clamp(16px,4vw,22px)",marginBottom:26}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
                <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:SC.Chemistry,fontWeight:600}}>✨ Weekly AI Analysis</div>
                <button onClick={genDashSummary} disabled={dashLoading||!sortedDates.length} style={{background:`${SC.Chemistry}15`,border:`1px solid ${SC.Chemistry}30`,color:SC.Chemistry,padding:"9px 18px",borderRadius:9,cursor:"pointer",fontSize:FS.sm,fontFamily:FF.body,fontWeight:600}}>
                  {dashLoading?"Thinking...":"Generate →"}
                </button>
              </div>
              {dashSummary?<div style={{fontSize:FS.base,color:T.textSub,lineHeight:1.85}}>{dashSummary}</div>:<div style={{fontSize:FS.sm,color:T.textMuted,fontStyle:"italic"}}>Generate a personal AI analysis of your last 7 days.</div>}
            </div>
            <div style={{fontFamily:FF.heading,fontSize:FS.sm,color:T.textMuted,letterSpacing:1,marginBottom:16}}>📋 What I Did — Daily Reports</div>
            {sortedDates.length===0&&<div style={{color:T.textMuted,textAlign:"center",padding:"36px 0",fontSize:FS.base}}>No logs yet, {userName}. Start from the Today tab!</div>}
            {[...sortedDates].reverse().slice(0,10).map(d=><DailyCard key={d} date={d} log={dayLogs[d]} T={T} FS={FS} FF={FF}/>)}
          </div>
        )}

        {/* ══ REPORTS ══ */}
        {tab===2&&(
          <div className="slide-in">
            <div style={{marginBottom:22}}>
              <div style={{fontFamily:FF.heading,fontSize:FS.xl,color:T.text,fontWeight:700,marginBottom:3}}>{userName}'s Reports</div>
              <div style={{fontSize:FS.sm,color:T.textMuted}}>Tap any day to expand the full report</div>
            </div>
            {!sortedDates.length&&<div style={{color:T.textMuted,textAlign:"center",padding:56,fontSize:FS.base}}>No logs yet. Start from the Today tab!</div>}
            {[...sortedDates].reverse().map(d=><DayReport key={d} date={d} log={dayLogs[d]} T={T} FS={FS} FF={FF}/>)}
          </div>
        )}

        {/* ══ EXAMS ══ */}
        {tab===3&&(
          <div className="slide-in">
            <div style={{marginBottom:24}}>
              <div style={{fontFamily:FF.heading,fontSize:FS.xl,color:T.text,fontWeight:700,marginBottom:3}}>Exam Results</div>
              <div style={{fontSize:FS.sm,color:T.textMuted}}>Log your mock tests and JEE results here, {userName}</div>
            </div>
            <div style={{background:T.cardBg,border:`1px solid ${SC.Chemistry}28`,borderRadius:16,padding:"clamp(16px,4vw,26px)",marginBottom:28}}>
              <div style={{fontFamily:FF.heading,fontSize:FS.lg,color:SC.Chemistry,marginBottom:20,fontWeight:600}}>Log Exam Result</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div style={LS}><span style={LT}>Exam Name</span><input style={IS} placeholder="e.g. Allen Mock 3" value={examForm.name} onChange={e=>setExamForm(f=>({...f,name:e.target.value}))}/></div>
                <div style={LS}><span style={LT}>Date</span><input style={IS} type="date" value={examForm.date} onChange={e=>setExamForm(f=>({...f,date:e.target.value}))}/></div>
              </div>
              {/* column headers */}
              <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 60px",gap:10,marginBottom:8,alignItems:"center"}}>
                <div/>
                <div style={{...LT,textAlign:"center",paddingBottom:4,borderBottom:`2px solid ${T.accentMain}40`,color:T.accentMain}}>Your Marks</div>
                <div style={{...LT,textAlign:"center",paddingBottom:4,borderBottom:`2px solid ${SC.Physics}40`,color:SC.Physics}}>Class Avg</div>
                <div style={{...LT,textAlign:"center",color:T.textMuted}}>Diff</div>
              </div>
              {[{key:"maths",avgKey:"avgMaths",label:"Maths",col:SC.Maths},{key:"physics",avgKey:"avgPhysics",label:"Physics",col:SC.Physics},{key:"chemistry",avgKey:"avgChemistry",label:"Chemistry",col:SC.Chemistry}].map(({key,avgKey,label,col})=>{
                const y=parseFloat(examForm[key])||null,a=parseFloat(examForm[avgKey])||null,diff=y!==null&&a!==null?y-a:null;
                return(
                  <div key={key} style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 60px",gap:10,marginBottom:10,alignItems:"center"}}>
                    <div style={{fontSize:FS.sm,color:col,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><span>{SI[label]}</span>{label}</div>
                    <input style={IS} type="number" min="0" placeholder="0" inputMode="numeric" value={examForm[key]} onChange={e=>setExamForm(f=>({...f,[key]:e.target.value}))}/>
                    <input style={{...IS,borderColor:SC.Physics+"40"}} type="number" min="0" placeholder="0" inputMode="numeric" value={examForm[avgKey]} onChange={e=>setExamForm(f=>({...f,[avgKey]:e.target.value}))}/>
                    <div style={{textAlign:"center",fontSize:FS.base,fontWeight:700,fontFamily:FF.heading,color:diff===null?T.textMuted:diff>0?"#4ade80":diff<0?"#f87171":T.text}}>{diff===null?"—":`${diff>0?"+":""}${diff.toFixed(0)}`}</div>
                  </div>
                );
              })}
              <div style={{height:1,background:T.border,margin:"12px 0"}}/>
              <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 60px",gap:10,marginBottom:20,alignItems:"center"}}>
                <div style={{fontSize:FS.sm,color:T.accentMain,fontWeight:700}}>Total</div>
                <input style={{...IS,borderColor:T.accentMain+"40"}} type="number" min="0" placeholder="0" inputMode="numeric" value={examForm.total} onChange={e=>setExamForm(f=>({...f,total:e.target.value}))}/>
                <input style={{...IS,borderColor:SC.Physics+"40"}} type="number" min="0" placeholder="0" inputMode="numeric" value={examForm.avgTotal} onChange={e=>setExamForm(f=>({...f,avgTotal:e.target.value}))}/>
                <div style={{textAlign:"center",fontSize:FS.lg,fontWeight:700,fontFamily:FF.heading,color:(()=>{const d=(parseFloat(examForm.total)||null)!==null&&(parseFloat(examForm.avgTotal)||null)!==null?parseFloat(examForm.total)-parseFloat(examForm.avgTotal):null;return d===null?T.textMuted:d>0?"#4ade80":d<0?"#f87171":T.text;})()}}>{(()=>{const y=parseFloat(examForm.total)||null,a=parseFloat(examForm.avgTotal)||null,d=y!==null&&a!==null?y-a:null;return d===null?"—":`${d>0?"+":""}${d.toFixed(0)}`;})()}</div>
              </div>
              <button onClick={submitExam} style={{background:`${SC.Chemistry}15`,border:`1px solid ${SC.Chemistry}35`,color:SC.Chemistry,padding:"13px 26px",borderRadius:10,cursor:"pointer",fontFamily:FF.heading,fontSize:FS.base,letterSpacing:.8,width:"100%",fontWeight:600}}>Save Result →</button>
            </div>

            <CB title="Your Total vs Class Average" T={T} FS={FS} FF={FF}>
              {examLD.length>1?<ResponsiveContainer width="100%" height={240}>
                <LineChart data={examLD} margin={{top:4,right:8,left:-14,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:FS.label}} interval={0} angle={-15} textAnchor="end" height={44}/>
                  <YAxis tick={{fill:T.textMuted,fontSize:FS.label}}/>
                  <Tooltip contentStyle={TT}/>
                  <Legend wrapperStyle={{fontSize:FS.sm,color:T.textSub}}/>
                  <Line type="monotone" dataKey="Your Total" stroke={T.accentMain} strokeWidth={2.5} dot={{r:4,fill:T.accentMain}} activeDot={{r:6}} connectNulls/>
                  <Line type="monotone" dataKey="Class Avg" stroke={SC.Physics} strokeWidth={2} dot={{r:4,fill:SC.Physics}} strokeDasharray="6 3" activeDot={{r:6}} connectNulls/>
                </LineChart>
              </ResponsiveContainer>:<Empty msg="Log at least 2 exams to see the trend" T={T} FS={FS}/>}
            </CB>

            <CB title="Subject Marks — You vs Class Average" T={T} FS={FS} FF={FF}>
              {examLD.length>1?<ResponsiveContainer width="100%" height={260}>
                <LineChart data={examLD} margin={{top:4,right:8,left:-14,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:FS.label}} interval={0} angle={-15} textAnchor="end" height={44}/>
                  <YAxis tick={{fill:T.textMuted,fontSize:FS.label}}/>
                  <Tooltip contentStyle={TT} formatter={(val,name)=>[val===null?"—":val,name]}/>
                  <Legend wrapperStyle={{fontSize:FS.sm,color:T.textSub}}/>
                  {SUBJECTS.map(s=>[
                    <Line key={s} type="monotone" dataKey={s} stroke={SC[s]} strokeWidth={2} dot={{r:3}} activeDot={{r:5}} connectNulls/>,
                    <Line key={`avg${s}`} type="monotone" dataKey={`Avg ${s}`} stroke={SC[s]} strokeWidth={1.5} dot={{r:3}} strokeDasharray="5 3" activeDot={{r:5}} connectNulls/>,
                  ])}
                </LineChart>
              </ResponsiveContainer>:<Empty msg="Log at least 2 exams to see subject-wise comparison" T={T} FS={FS}/>}
            </CB>
            {examLD.length>1&&<div style={{fontSize:FS.sm,color:T.textMuted,marginTop:-12,marginBottom:18,paddingLeft:4,fontStyle:"italic"}}>Solid lines = your marks · Dashed lines = class average</div>}

            {exams.length>0&&(
              <div>
                <div style={{fontFamily:FF.heading,fontSize:FS.sm,color:T.textMuted,letterSpacing:1,marginBottom:14,marginTop:8}}>All Results</div>
                {[...exams].reverse().map(e=>{
                  const totalDiff=(e.total&&e.avgTotal)?parseFloat(e.total)-parseFloat(e.avgTotal):null;
                  return(
                    <div key={e.id} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"clamp(12px,3vw,18px)",marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
                        <div>
                          <div style={{fontWeight:700,fontFamily:FF.heading,fontSize:FS.lg,color:T.text,marginBottom:3}}>{e.name}</div>
                          <div style={{fontSize:FS.sm,color:T.textMuted}}>{e.date}</div>
                        </div>
                        {totalDiff!==null&&<div style={{background:totalDiff>=0?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)",border:`1px solid ${totalDiff>=0?"rgba(74,222,128,.25)":"rgba(248,113,113,.25)"}`,borderRadius:10,padding:"7px 14px",textAlign:"center",flexShrink:0}}>
                          <div style={{fontFamily:FF.heading,fontSize:FS.xl,fontWeight:700,color:totalDiff>=0?"#4ade80":"#f87171"}}>{totalDiff>=0?"+":""}{totalDiff.toFixed(0)}</div>
                          <div style={{fontSize:FS.label,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>vs class</div>
                        </div>}
                      </div>
                      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                        <div style={{display:"grid",gridTemplateColumns:"70px 1fr 1fr 1fr",gap:8,minWidth:260}}>
                          <div/>
                          {SUBJECTS.map(s=><div key={s} style={{textAlign:"center",fontSize:FS.label,color:SC[s],letterSpacing:1,textTransform:"uppercase",fontFamily:FF.heading,paddingBottom:6,borderBottom:`1px solid ${SC[s]}20`}}>{SI[s]} {s}</div>)}
                          <div style={{fontSize:FS.label,color:T.textMuted,textTransform:"uppercase",display:"flex",alignItems:"center",fontWeight:600}}>You</div>
                          {SUBJECTS.map(s=><div key={s} style={{textAlign:"center"}}><div style={{fontSize:FS.xl,fontWeight:700,color:SC[s],fontFamily:FF.heading}}>{e[s.toLowerCase()]||"—"}</div></div>)}
                          <div style={{fontSize:FS.label,color:SC.Physics,textTransform:"uppercase",display:"flex",alignItems:"center",fontWeight:600}}>Avg</div>
                          {SUBJECTS.map(s=><div key={s} style={{textAlign:"center"}}><div style={{fontSize:FS.base,color:SC.Physics,fontFamily:FF.heading}}>{e[`avg${s}`]||"—"}</div></div>)}
                          <div style={{fontSize:FS.label,color:T.textMuted,textTransform:"uppercase",display:"flex",alignItems:"center",fontWeight:600}}>Diff</div>
                          {SUBJECTS.map(s=>{const y=parseFloat(e[s.toLowerCase()])||null,a=parseFloat(e[`avg${s}`])||null,d=y!==null&&a!==null?y-a:null;return<div key={s} style={{textAlign:"center"}}><div style={{fontSize:FS.sm,fontWeight:700,color:d===null?T.textMuted:d>0?"#4ade80":d<0?"#f87171":T.text,fontFamily:FF.heading}}>{d===null?"—":`${d>0?"+":""}${d.toFixed(0)}`}</div></div>;})}
                        </div>
                      </div>
                      {(e.total||e.avgTotal)&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                        {e.total&&<div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:FS.label,color:T.textMuted,textTransform:"uppercase",letterSpacing:1}}>Your Total</span><span style={{fontFamily:FF.heading,fontSize:FS.xl,fontWeight:700,color:T.accentMain}}>{e.total}</span></div>}
                        {e.avgTotal&&<div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:FS.label,color:SC.Physics,textTransform:"uppercase",letterSpacing:1}}>Class Avg</span><span style={{fontFamily:FF.heading,fontSize:FS.lg,fontWeight:700,color:SC.Physics}}>{e.avgTotal}</span></div>}
                      </div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab===4&&(
          <SettingsPanel T={T} FS={FS} FF={FF} themeName={themeName} fontSize={fontSize} fontFamily={fontFamily} setThemeName={setThemeName} setFontSize={setFontSize} setFontFamily={setFontFamily} userName={userName} userTarget={userTarget} onReset={handleReset}/>
        )}
      </div>
    </div>
  );
}

/* ── Shared chart wrapper ── */
function LCW({data,xKey="date",keys,colors,T,FS}){
  if(data.length<2)return<Empty T={T} FS={FS}/>;
  const TT={background:T.tooltipBg,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:FS.sm};
  return(
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{top:4,right:8,left:-14,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
        <XAxis dataKey={xKey} tick={{fill:T.textMuted,fontSize:FS.label}}/>
        <YAxis tick={{fill:T.textMuted,fontSize:FS.label}}/>
        <Tooltip contentStyle={TT}/>
        <Legend wrapperStyle={{fontSize:FS.sm,color:T.textSub}}/>
        {keys.map(k=><Line key={k} type="monotone" dataKey={k} stroke={colors[k]} strokeWidth={2} dot={{r:2.5}} activeDot={{r:5}}/>)}
      </LineChart>
    </ResponsiveContainer>
  );
}

function CB({title,T,FS,FF,children}){
  return(
    <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"clamp(14px,3.5vw,20px) clamp(12px,3vw,20px) 12px",marginBottom:20}}>
      <div style={{fontFamily:FF.heading,fontSize:FS.label,color:T.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>{title}</div>
      {children}
    </div>
  );
}

function Empty({msg="Log at least 2 days to see the graph",T,FS}){
  return<div style={{color:T?.textMuted||"#4a4a5a",textAlign:"center",padding:"32px 0",fontSize:FS?.sm||13,fontStyle:"italic"}}>{msg}</div>;
}

function DailyCard({date,log,T,FS,FF}){
  const tH=SUBJECTS.reduce((a,s)=>a+(parseFloat(log.subjects[s]?.hours)||0),0);
  const tQ=SUBJECTS.reduce((a,s)=>a+(log.subjects[s]?.questions||[]).reduce((b,q)=>b+(parseInt(q.count)||0),0),0);
  const tV=SUBJECTS.reduce((a,s)=>a+(parseInt(log.subjects[s]?.videos)||0),0);
  return(
    <div style={{marginBottom:16,background:T.cardBg,border:`1px solid ${T.borderAccent}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontFamily:FF.heading,fontWeight:700,fontSize:FS.base,color:T.textSub}}>{date}</span>
          <span style={{fontSize:FS.sm,color:T.textMuted}}>⏱{tH.toFixed(1)}h · 📹{tV} · ❓{tQ}</span>
        </div>
        {log.submitted&&<span style={{background:"rgba(74,222,128,.08)",color:"#4ade80",padding:"2px 9px",borderRadius:20,fontSize:FS.label,border:"1px solid rgba(74,222,128,.2)",fontWeight:600}}>✓</span>}
      </div>
      <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {SUBJECTS.map(s=>{
          const d=log.subjects[s];
          const vt=(d?.videoTopics||[]).map(v=>v.topic).filter(Boolean);
          const qt=(d?.questions||[]).filter(q=>q.topic);
          const hrs=parseFloat(d?.hours)||0,vids=parseInt(d?.videos)||0;
          const qn=(d?.questions||[]).reduce((a,q)=>a+(parseInt(q.count)||0),0);
          if(!hrs&&!vids&&!qn)return null;
          return(
            <div key={s}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <span style={{color:SC[s],fontSize:14,fontWeight:700}}>{SI[s]}</span>
                <span style={{fontSize:FS.base,color:SC[s],fontWeight:700,fontFamily:FF.heading}}>{s}</span>
                <span style={{fontSize:FS.sm,color:T.textMuted}}>{hrs}h · {vids}v · {qn}q</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:20}}>
                {vt.map((t,i)=><span key={`v${i}`} style={{background:`${SC[s]}12`,border:`1px solid ${SC[s]}28`,color:SC[s],padding:"2px 10px",borderRadius:20,fontSize:FS.sm,display:"inline-flex",alignItems:"center",gap:3,fontWeight:500}}><span style={{fontSize:9}}>▶</span>{t}</span>)}
                {qt.map((q,i)=><span key={`q${i}`} style={{background:T.statBg,border:`1px solid ${T.border}`,color:T.textSub,padding:"2px 10px",borderRadius:20,fontSize:FS.sm}}>❓{q.topic}×{q.count}</span>)}
                {!vt.length&&!qt.length&&<span style={{fontSize:FS.sm,color:T.textMuted,fontStyle:"italic"}}>No topics logged</span>}
              </div>
            </div>
          );
        })}
      </div>
      {log.aiSummary&&(
        <div style={{padding:"0 16px 14px"}}>
          <div style={{background:T.badgeBg,border:`1px solid ${T.borderAccent}`,borderRadius:10,padding:"11px 13px"}}>
            <div style={{fontSize:FS.label,color:T.accentMain,letterSpacing:2.5,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>✨ AI Summary</div>
            <div style={{fontSize:FS.base,color:T.textSub,lineHeight:1.82}}>{log.aiSummary}</div>
          </div>
        </div>
      )}
      {log.rating&&<div style={{padding:"0 16px 12px"}}><div style={{fontSize:FS.sm,color:T.textMuted,fontStyle:"italic",borderLeft:`2px solid ${T.borderAccent}`,paddingLeft:9,lineHeight:1.6}}>"{log.rating}"</div></div>}
    </div>
  );
}

function DayReport({date,log,T,FS,FF}){
  const [open,setOpen]=useState(false);
  const tH=SUBJECTS.reduce((a,s)=>a+(parseFloat(log.subjects[s]?.hours)||0),0);
  const tQ=SUBJECTS.reduce((a,s)=>a+(log.subjects[s]?.questions||[]).reduce((b,q)=>b+(parseInt(q.count)||0),0),0);
  return(
    <div style={{marginBottom:10,background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"13px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",WebkitTapHighlightColor:"transparent"}}>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",flex:1,minWidth:0}}>
          <span style={{fontFamily:FF.heading,fontWeight:700,fontSize:FS.base,color:T.text}}>{date}</span>
          <span style={{fontSize:FS.sm,color:T.textMuted}}>{tH.toFixed(1)}h · {tQ}q</span>
          {log.submitted&&<span style={{background:"rgba(74,222,128,.08)",color:"#4ade80",padding:"2px 8px",borderRadius:20,fontSize:FS.label,fontWeight:600}}>✓</span>}
        </div>
        <span style={{color:T.textMuted,fontSize:12,flexShrink:0,marginLeft:8}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 16px 20px",borderTop:`1px solid ${T.border}`}}>
          {log.aiSummary&&(
            <div style={{margin:"16px 0 14px",padding:"13px 15px",background:T.badgeBg,border:`1px solid ${T.borderAccent}`,borderRadius:11}}>
              <div style={{fontSize:FS.label,color:T.accentMain,letterSpacing:2.5,textTransform:"uppercase",marginBottom:7,fontWeight:600}}>✨ AI Coach Report</div>
              <div style={{fontSize:FS.base,color:T.textSub,lineHeight:1.85}}>{log.aiSummary}</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,200px),1fr))",gap:12,marginTop:log.aiSummary?0:16}}>
            {SUBJECTS.map(s=>{
              const d=log.subjects[s];
              const qn=(d?.questions||[]).reduce((a,q)=>a+(parseInt(q.count)||0),0);
              const vt=(d?.videoTopics||[]).filter(v=>v.topic);
              return(
                <div key={s} style={{padding:14,background:T.statBg,borderRadius:10,border:`1px solid ${SC[s]}22`}}>
                  <div style={{color:SC[s],fontFamily:FF.heading,fontSize:FS.base,fontWeight:700,marginBottom:9}}>{SI[s]} {s}</div>
                  <div style={{fontSize:FS.sm,color:T.textSub,marginBottom:8}}>📹 {d?.videos||0} · ⏱ {d?.hours||0}h</div>
                  {vt.length>0&&<div style={{marginBottom:9}}>
                    <div style={{fontSize:FS.label,color:SC[s],letterSpacing:2,textTransform:"uppercase",marginBottom:5,opacity:.8}}>Video Topics</div>
                    {vt.map((v,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{color:SC[s],fontSize:9}}>▶</span><span style={{fontSize:FS.sm,color:T.textSub,fontWeight:500}}>{v.topic}</span></div>)}
                  </div>}
                  <div style={{fontSize:FS.sm,color:T.textSub,marginBottom:5,fontWeight:600}}>❓ {qn} questions</div>
                  {(d?.questions||[]).filter(q=>q.topic).map((q,i)=><div key={i} style={{fontSize:FS.sm,color:T.textMuted,marginTop:3}}>• {q.topic}: {q.count}</div>)}
                </div>
              );
            })}
          </div>
          {log.rating&&(
            <div style={{marginTop:14,padding:"12px 14px",background:T.badgeBg,borderRadius:9,border:`1px solid ${T.borderAccent}`}}>
              <div style={{fontSize:FS.label,color:T.accentMain,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Day Review</div>
              <div style={{fontSize:FS.base,color:T.textSub,lineHeight:1.75}}>{log.rating}</div>
            </div>
          )}
          {log.notes&&<div style={{marginTop:9,fontSize:FS.sm,color:T.textMuted,fontStyle:"italic",lineHeight:1.6}}>{log.notes}</div>}
        </div>
      )}
    </div>
  );
}