import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/* ── constants ── */
const SUBJECTS = ["Maths", "Physics", "Chemistry"];
const SC = { Maths: "#f59e0b", Physics: "#38bdf8", Chemistry: "#c084fc" };
const SI = { Maths: "∑", Physics: "⚛", Chemistry: "⚗" };
const TABS = ["Today", "Dashboard", "Reports", "Exams"];
const TAB_ICONS = ["📅", "📊", "📋", "🏆"];
const SK = (k) => `jee_v5_${k}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Still up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Burning midnight oil";
};

function gfs(key, fallback) {
  try { return JSON.parse(localStorage.getItem(SK(key))) ?? fallback; }
  catch { return fallback; }
}
function sfs(key, val) { localStorage.setItem(SK(key), JSON.stringify(val)); }

const blankSub = () => ({ videos: "", hours: "", videoTopics: [{ topic: "" }], questions: [{ topic: "", count: "" }] });
const blankDay = () => ({ date: todayStr(), subjects: { Maths: blankSub(), Physics: blankSub(), Chemistry: blankSub() }, rating: "", notes: "", submitted: false, aiSummary: "" });
const weekOf = (ds) => { const d = new Date(ds), dy = d.getDay(), diff = d.getDate() - dy + (dy === 0 ? -6 : 1); return new Date(d.setDate(diff)).toISOString().slice(0, 10); };

function getMotivation(name, streak) {
  const n = name || "Champion";
  if (streak === 0)  return { msg: `Every IIT topper started exactly where you are right now, ${n}. Today is Day 1 of your story.`, emoji: "🌱", color: "#6ee7b7", glow: false, badge: null };
  if (streak === 1)  return { msg: `${n}, Day 1 is in the books! The hardest part is always starting — you've already won that battle.`, emoji: "⚡", color: "#4ade80", glow: false, badge: null };
  if (streak === 2)  return { msg: `Two days running, ${n}! Consistency is the only thing that separates dreamers from IITians.`, emoji: "🔥", color: "#fb923c", glow: false, badge: null };
  if (streak === 3)  return { msg: `${n}, 3 days strong! Science says neural pathways form right around now. Your brain is physically changing for JEE.`, emoji: "🧠", color: "#f59e0b", glow: true, badge: null };
  if (streak <= 6)   return { msg: `${streak} days of fire, ${n}! Most people talk about JEE. You're out here actually doing it every single day.`, emoji: "💪", color: "#f59e0b", glow: true, badge: null };
  if (streak === 7)  return { msg: `ONE FULL WEEK, ${n}! 🎉 Students who study 7 days straight are 3× more likely to crack JEE. You are on that path.`, emoji: "🏅", color: "#fbbf24", glow: true, badge: "7-DAY WARRIOR" };
  if (streak <= 13)  return { msg: `${streak} days, ${n}! You're in the top 20% of consistent aspirants. The compound effect is silently doing its magic.`, emoji: "📈", color: "#34d399", glow: true, badge: null };
  if (streak === 14) return { msg: `TWO WEEKS, ${n}! Your dedication is extraordinary. While others rest, you're building the foundation IIT is made of.`, emoji: "🌟", color: "#34d399", glow: true, badge: "FORTNIGHT LEGEND" };
  if (streak <= 20)  return { msg: `${streak} days, ${n}. Most students quit before this point. You're still here, still grinding. That's elite mentality.`, emoji: "⚔️", color: "#38bdf8", glow: true, badge: null };
  if (streak === 21) return { msg: `21 DAYS, ${n} — habit is LOCKED IN! What once felt like effort now feels like who you are. Keep this identity.`, emoji: "💎", color: "#a78bfa", glow: true, badge: "HABIT MACHINE 💎" };
  if (streak <= 29)  return { msg: `${streak} days of unbroken discipline, ${n}! IIT professors would be proud. You are what serious preparation looks like.`, emoji: "🚀", color: "#a78bfa", glow: true, badge: null };
  if (streak === 30) return { msg: `ONE FULL MONTH, ${n}! 🏆 This is rare. Truly rare. You are not just preparing for JEE — you ARE the JEE aspirant.`, emoji: "🏆", color: "#fbbf24", glow: true, badge: "30-DAY TITAN 🏆" };
  if (streak <= 59)  return { msg: `${streak} days of pure elite grind, ${n}! Your competition gave up weeks ago. You're in legendary territory now.`, emoji: "👑", color: "#fbbf24", glow: true, badge: "ELITE GRINDER 👑" };
  return { msg: `${streak} days, ${n}. Top 1% discipline in the entire country. IIT isn't your dream anymore — it's your scheduled destination.`, emoji: "🌠", color: "#fbbf24", glow: true, badge: "UNSTOPPABLE 🌠" };
}

function buildLogLine(log) {
  if (!log) return "";
  const parts = [];
  SUBJECTS.forEach(s => {
    const d = log.subjects[s]; if (!d) return;
    const vids = parseInt(d.videos) || 0, hrs = parseFloat(d.hours) || 0;
    const vt = (d.videoTopics || []).map(v => v.topic).filter(Boolean);
    const qt = (d.questions || []).filter(q => q.topic || q.count);
    const qn = qt.reduce((a, q) => a + (parseInt(q.count) || 0), 0);
    if (!vids && !hrs && !qn) return;
    const bits = [];
    if (vids) bits.push(`${vids} video${vids > 1 ? "s" : ""}${vt.length ? ` on ${vt.join(", ")}` : ""}`);
    if (hrs)  bits.push(`${hrs}h`);
    if (qn)   { const qd = qt.filter(q => q.topic).map(q => `${q.topic} x${q.count}`).join(", "); bits.push(`${qn} Qs${qd ? ` [${qd}]` : ""}`); }
    parts.push(`${SI[s]} ${s}: ${bits.join(" · ")}`);
  });
  return parts.length ? parts.join(" | ") + (log.rating ? ` | Review: "${log.rating}"` : "") : "Nothing logged.";
}

/* ── global css (injected once) ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; padding: 0; overflow-x: hidden; }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-glow{ 0%,100%{opacity:.35} 50%{opacity:.9} }
  @keyframes slide-up  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slide-in  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes zoom-in   { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes glow-pulse{ 0%,100%{box-shadow:0 0 16px rgba(245,158,11,.15)} 50%{box-shadow:0 0 32px rgba(245,158,11,.4)} }
  .slide-up  { animation: slide-up  0.55s cubic-bezier(.16,1,.3,1) forwards; }
  .slide-in  { animation: slide-in  0.4s  ease forwards; }
  .zoom-in   { animation: zoom-in   0.45s cubic-bezier(.16,1,.3,1) forwards; }
  .onb-btn   { transition: all .2s cubic-bezier(.16,1,.3,1) !important; }
  .onb-btn:hover  { transform: scale(1.025); box-shadow: 0 8px 30px rgba(245,158,11,.35) !important; }
  .save-btn  { transition: all .2s cubic-bezier(.16,1,.3,1) !important; }
  .save-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(245,158,11,.4) !important; }
  .tab-btn   { transition: color .2s, border-color .2s; }
  .tab-btn:hover { color: #f0ece0 !important; }
  .sub-card  { transition: transform .2s; }
  .sub-card:hover { transform: translateY(-2px); }
  .target-opt{ transition: all .18s; }
  .target-opt:hover { border-color: rgba(245,158,11,.4) !important; background: rgba(245,158,11,.06) !important; }
  .target-opt.sel { border-color: rgba(245,158,11,.6) !important; background: rgba(245,158,11,.1) !important; }
  input, textarea { transition: border-color .2s, box-shadow .2s; }
  input:focus, textarea:focus { border-color: rgba(245,158,11,.45) !important; box-shadow: 0 0 0 3px rgba(245,158,11,.07) !important; outline: none; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(245,158,11,.18); border-radius: 3px; }
`;

/* ── shared style objects ── */
const IS  = { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#f0ece0", fontSize:15, fontFamily:"'Crimson Text',Georgia,serif", outline:"none", width:"100%", boxSizing:"border-box" };
const RMB = { background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.22)", color:"#ef4444", borderRadius:8, padding:"10px 12px", cursor:"pointer", fontSize:14, flexShrink:0, lineHeight:1, minWidth:38 };
const ADB = (c) => ({ background:"none", border:`1px dashed ${c}45`, color:c, padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, marginTop:6, fontFamily:"'Crimson Text',Georgia,serif" });
const LS  = { display:"flex", flexDirection:"column", gap:7 };
const LT  = { fontSize:11, color:"#6a6a7a", letterSpacing:2, textTransform:"uppercase", fontFamily:"Georgia,serif" };
const TT  = { background:"#0d0d1a", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#f0ece0", fontSize:12 };

/* ══════════════════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════════════════ */
function Onboarding({ onComplete }) {
  const [step, setStep]       = useState(0);
  const [name, setName]       = useState("");
  const [target, setTarget]   = useState("JEE Advanced");
  const [appeared, setAppeared] = useState(false);
  const inp = useRef();

  useEffect(() => { setTimeout(() => setAppeared(true), 60); }, []);
  useEffect(() => { if (step === 1 && inp.current) setTimeout(() => inp.current.focus(), 350); }, [step]);

  const QUOTES = [
    { text: "Success is not final, failure is not fatal — it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  ];
  const [q] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const particles = Array.from({ length: 16 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    r: Math.random() * 2.5 + 0.8, delay: Math.random() * 4, dur: Math.random() * 3.5 + 2.5,
  }));

  const BG = "linear-gradient(145deg,#06060f 0%,#0d0a1a 45%,#060d1a 100%)";

  const wrapStyle = {
    minHeight:"100vh", background: BG,
    display:"flex", alignItems:"center", justifyContent:"center",
    position:"relative", overflow:"hidden",
    fontFamily:"'Crimson Text',Georgia,serif",
    padding:"24px 16px",
  };

  const cardStyle = {
    position:"relative", zIndex:10, width:"100%", maxWidth:460,
    opacity: appeared ? 1 : 0,
    transform: appeared ? "translateY(0)" : "translateY(18px)",
    transition:"all .65s cubic-bezier(.16,1,.3,1)",
  };

  const bigBtn = (disabled=false) => ({
    width:"100%", padding:"16px 20px",
    background: disabled ? "rgba(255,255,255,.04)" : "linear-gradient(135deg,#f59e0b,#d97706)",
    border:"none", borderRadius:14,
    color: disabled ? "#3a3a4a" : "#06060f",
    fontSize:16, fontWeight:700, fontFamily:"'Cinzel',serif",
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing:1,
    boxShadow: disabled ? "none" : "0 4px 22px rgba(245,158,11,.28)",
  });

  return (
    <div style={wrapStyle}>
      <style>{GLOBAL_CSS}</style>
      {/* particles */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
        <defs>
          <radialGradient id="og1" cx="20%" cy="20%"><stop offset="0%" stopColor="#f59e0b" stopOpacity=".07"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          <radialGradient id="og2" cx="80%" cy="80%"><stop offset="0%" stopColor="#a78bfa" stopOpacity=".07"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          <radialGradient id="og3" cx="85%" cy="15%"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".05"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#og1)"/>
        <rect width="100%" height="100%" fill="url(#og2)"/>
        <rect width="100%" height="100%" fill="url(#og3)"/>
        {particles.map((p, i) => (
          <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r={p.r}
            fill={["#f59e0b","#a78bfa","#38bdf8"][i % 3]}
            opacity="0" style={{ animation:`pulse-glow ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
        ))}
      </svg>
      {/* orbital rings */}
      <div style={{ position:"absolute", width:"min(560px,130vw)", height:"min(560px,130vw)", borderRadius:"50%", border:"1px solid rgba(245,158,11,.05)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"spin-slow 44s linear infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"min(380px,90vw)",  height:"min(380px,90vw)",  borderRadius:"50%", border:"1px solid rgba(167,139,250,.05)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"spin-slow 30s linear infinite reverse", pointerEvents:"none" }} />

      <div style={cardStyle}>

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"clamp(48px,12vw,68px)", marginBottom:14, animation:"float 3s ease-in-out infinite", display:"inline-block" }}>🎯</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(10px,2.5vw,13px)", letterSpacing:5, color:"#f59e0b", textTransform:"uppercase", marginBottom:10 }}>JEE Preparation</div>
            <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(26px,8vw,40px)", margin:"0 0 8px", fontWeight:700, lineHeight:1.15, background:"linear-gradient(135deg,#f0ece0,#f59e0b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Study Tracker
            </h1>
            <p style={{ color:"#7a7a8a", fontSize:"clamp(14px,3.5vw,16px)", marginBottom:28, lineHeight:1.65 }}>Your personal companion for cracking JEE</p>
            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"18px 20px", marginBottom:28, textAlign:"left" }}>
              <div style={{ fontSize:22, color:"#f59e0b", opacity:.55, marginBottom:6 }}>"</div>
              <p style={{ color:"#c4b99a", fontSize:"clamp(13px,3.5vw,15px)", fontStyle:"italic", lineHeight:1.7, margin:"0 0 8px" }}>{q.text}</p>
              <div style={{ fontSize:11, color:"#5a5a6a", letterSpacing:1 }}>— {q.author}</div>
            </div>
            <button className="onb-btn" onClick={() => setStep(1)} style={bigBtn()}>Begin My Journey →</button>
            <p style={{ color:"#3a3a4a", fontSize:11, marginTop:10 }}>No login required · All data stored on your device</p>
          </div>
        )}

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <div className="slide-up" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"clamp(36px,10vw,52px)", marginBottom:16 }}>👋</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:5, color:"#f59e0b", textTransform:"uppercase", marginBottom:10 }}>Step 1 of 2</div>
            <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(20px,6vw,28px)", color:"#f0ece0", margin:"0 0 8px" }}>What's your name?</h2>
            <p style={{ color:"#7a7a8a", fontSize:"clamp(13px,3.5vw,15px)", marginBottom:28, lineHeight:1.65 }}>
              I'll use your name to personalise every message and keep you motivated throughout your JEE journey.
            </p>
            <input
              ref={inp}
              style={{ ...IS, fontSize:"clamp(16px,4vw,20px)", textAlign:"center", padding:"14px 18px", marginBottom:22, borderRadius:14, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)" }}
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
              autoComplete="given-name"
            />
            <button className="onb-btn" onClick={() => name.trim() && setStep(2)} disabled={!name.trim()} style={bigBtn(!name.trim())}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Target ── */}
        {step === 2 && (
          <div className="slide-up" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"clamp(36px,10vw,52px)", marginBottom:16 }}>🎯</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:5, color:"#f59e0b", textTransform:"uppercase", marginBottom:10 }}>Step 2 of 2</div>
            <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(18px,5.5vw,26px)", color:"#f0ece0", margin:"0 0 6px" }}>Your target, {name}?</h2>
            <p style={{ color:"#7a7a8a", fontSize:"clamp(13px,3.5vw,15px)", marginBottom:24, lineHeight:1.65 }}>This helps me tailor your daily motivation.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {["JEE Advanced","JEE Mains","Both JEE Mains & Advanced"].map(t => (
                <button key={t} className={`target-opt${target===t?" sel":""}`} onClick={() => setTarget(t)}
                  style={{ padding:"14px 18px", background: target===t?"rgba(245,158,11,.1)":"rgba(255,255,255,.03)", border:`1px solid ${target===t?"rgba(245,158,11,.55)":"rgba(255,255,255,.08)"}`, borderRadius:12, color: target===t?"#f59e0b":"#c4b99a", fontSize:"clamp(13px,3.5vw,15px)", fontFamily:"'Crimson Text',Georgia,serif", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:20 }}>{t.includes("Advanced")&&!t.includes("Both")?"🏆":t.includes("Both")?"⭐":"🎯"}</span>
                  <span style={{ flex:1 }}>{t}</span>
                  {target===t && <span style={{ color:"#f59e0b", fontSize:16 }}>✓</span>}
                </button>
              ))}
            </div>
            <button className="onb-btn" onClick={() => setStep(3)} style={bigBtn()}>Let's Go! →</button>
          </div>
        )}

        {/* ── Step 3: Ready ── */}
        {step === 3 && (
          <div className="slide-up" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"clamp(48px,12vw,68px)", marginBottom:16, animation:"float 2.2s ease-in-out infinite", display:"inline-block" }}>🚀</div>
            <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(22px,6vw,32px)", margin:"0 0 12px", background:"linear-gradient(135deg,#f0ece0,#f59e0b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              You're all set, {name}!
            </h2>
            <p style={{ color:"#c4b99a", fontSize:"clamp(14px,3.8vw,17px)", marginBottom:8, lineHeight:1.7 }}>
              Your journey to <strong style={{ color:"#f59e0b" }}>{target}</strong> starts today.
            </p>
            <p style={{ color:"#6a6a7a", fontSize:"clamp(12px,3.2vw,14px)", marginBottom:28, lineHeight:1.75 }}>
              Log every study session. Track every topic.<br/>Build an unbreakable streak, one day at a time.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:28 }}>
              {[["📹","Videos"],["❓","Questions"],["🔥","Streak"]].map(([ic,lb]) => (
                <div key={lb} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"14px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:"clamp(18px,5vw,24px)", marginBottom:6 }}>{ic}</div>
                  <div style={{ fontSize:"clamp(10px,2.5vw,12px)", color:"#6a6a7a" }}>{lb}</div>
                </div>
              ))}
            </div>
            <button className="onb-btn" onClick={() => onComplete(name, target)} style={{ ...bigBtn(), padding:"18px 20px", fontSize:17, boxShadow:"0 6px 28px rgba(245,158,11,.34)" }}>
              Open My Tracker →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [userName,    setUserName]    = useState(() => gfs("userName", null));
  const [userTarget,  setUserTarget]  = useState(() => gfs("userTarget", "JEE Advanced"));
  const [tab,         setTab]         = useState(0);
  const [dayLogs,     setDayLogs]     = useState(() => gfs("dayLogs", {}));
  const [exams,       setExams]       = useState(() => gfs("exams", []));
  const [form,        setForm]        = useState(() => { const e = gfs("dayLogs",{})[todayStr()]; return e ? {...e} : blankDay(); });
  const [examForm,    setExamForm]    = useState({ date:todayStr(), name:"", maths:"", physics:"", chemistry:"", total:"", avgMaths:"", avgPhysics:"", avgChemistry:"", avgTotal:"" });
  const [streak,      setStreak]      = useState(0);
  const [toast,       setToast]       = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [dashSummary, setDashSummary] = useState("");
  const [dashLoading, setDashLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  /* streak calc + persist */
  useEffect(() => {
    sfs("dayLogs", dayLogs);
    let s = 0; const d = new Date();
    while (true) { const ds = d.toISOString().slice(0,10); if (dayLogs[ds]?.submitted) { s++; d.setDate(d.getDate()-1); } else break; }
    setStreak(s); sfs("streak", s);
  }, [dayLogs]);

  useEffect(() => { sfs("exams", exams); }, [exams]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const onboard = (name, target) => {
    sfs("userName", name); sfs("userTarget", target);
    setUserName(name); setUserTarget(target);
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 2800);
  };

  /* form helpers */
  const updSub = (s,f,v)   => setForm(fm => ({...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],[f]:v}}}));
  const updQ   = (s,i,f,v) => setForm(fm => { const qs=[...fm.subjects[s].questions]; qs[i]={...qs[i],[f]:v}; return {...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],questions:qs}}}; });
  const addQ   = (s)       => setForm(fm => ({...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],questions:[...fm.subjects[s].questions,{topic:"",count:""}]}}}));
  const remQ   = (s,i)     => setForm(fm => { const qs=fm.subjects[s].questions.filter((_,j)=>j!==i); return {...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],questions:qs.length?qs:[{topic:"",count:""}]}}}; });
  const updVT  = (s,i,v)   => setForm(fm => { const vt=[...(fm.subjects[s].videoTopics||[])]; vt[i]={topic:v}; return {...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],videoTopics:vt}}}; });
  const addVT  = (s)       => setForm(fm => ({...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],videoTopics:[...(fm.subjects[s].videoTopics||[]),{topic:""}]}}}));
  const remVT  = (s,i)     => setForm(fm => { const vt=(fm.subjects[s].videoTopics||[]).filter((_,j)=>j!==i); return {...fm, subjects:{...fm.subjects,[s]:{...fm.subjects[s],videoTopics:vt.length?vt:[{topic:""}]}}}; });

  const callAI = async (prompt) => {
    const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
    const d = await r.json(); return (d.content||[]).map(c=>c.text||"").join("").trim();
  };

  const submitDay = async () => {
    const log = {...form, date:todayStr(), submitted:true};
    setAiLoading(true);
    try {
      const s = await callAI(`You are an energetic personal JEE coach. Student name: ${userName||"Champion"}, target: ${userTarget}. Write a warm 3-sentence personal daily report. S1: address by name, summarise subjects/topics/videos studied with specifics. S2: highlight their strongest effort today. S3: powerful personal motivational line mentioning their ${streak+1}-day streak and ${userTarget} goal. Max 90 words. No bullets.\n\nLog:\n${buildLogLine(log)}`);
      const final = {...log, aiSummary:s};
      setDayLogs(p=>({...p,[todayStr()]:final})); setForm(final);
    } catch { setDayLogs(p=>({...p,[todayStr()]:log})); setForm(log); }
    setAiLoading(false); showToast("✅ Today's log saved!");
  };

  const genDashSummary = async () => {
    const sd = Object.keys(dayLogs).sort(); if (!sd.length) return;
    setDashLoading(true);
    const last7 = sd.slice(-7);
    const lines = last7.map(d=>`${d}: ${buildLogLine(dayLogs[d])}`).join("\n");
    try {
      const t = await callAI(`JEE coach. Student: ${userName||"student"}, Target: ${userTarget}, Streak: ${streak} days.\nLast ${last7.length} days:\n${lines}\n\nWrite 3-4 sentences addressed personally to ${userName||"them"}: subjects that dominated, any weak area, consistency /10, strong personal close mentioning ${userTarget}. Under 110 words. No bullets.`);
      setDashSummary(t);
    } catch { setDashSummary("Could not generate. Try again."); }
    setDashLoading(false);
  };

  const submitExam = () => {
    if (!examForm.name) return showToast("Please enter exam name");
    setExams(e=>[...e,{...examForm,id:Date.now()}]);
    setExamForm({date:todayStr(),name:"",maths:"",physics:"",chemistry:"",total:"",avgMaths:"",avgPhysics:"",avgChemistry:"",avgTotal:""});
    showToast("🏆 Exam result saved!");
  };

  const sortedDates = Object.keys(dayLogs).sort();
  const last14 = sortedDates.slice(-14);
  const lineData = last14.map(d => {
    const log = dayLogs[d];
    const tQ = SUBJECTS.reduce((a,s)=>a+(log.subjects[s]?.questions||[]).reduce((b,q)=>b+(parseInt(q.count)||0),0),0);
    return { date:d.slice(5), Maths:parseFloat(log.subjects.Maths?.hours)||0, Physics:parseFloat(log.subjects.Physics?.hours)||0, Chemistry:parseFloat(log.subjects.Chemistry?.hours)||0, Questions:tQ };
  });
  const examLD = exams.map(e=>({
    name:`${e.date.slice(5)} ${e.name}`,
    "Your Total":+e.total||0,
    "Class Avg":+e.avgTotal||null,
    Maths:+e.maths||0, Physics:+e.physics||0, Chemistry:+e.chemistry||0,
    "Avg Maths":+e.avgMaths||null, "Avg Physics":+e.avgPhysics||null, "Avg Chemistry":+e.avgChemistry||null,
  }));
  const wkData = {}; sortedDates.forEach(d=>{const w=weekOf(d);if(!wkData[w])wkData[w]={Maths:0,Physics:0,Chemistry:0,days:0};SUBJECTS.forEach(s=>{wkData[w][s]+=parseFloat(dayLogs[d].subjects[s]?.hours)||0;});wkData[w].days++;});
  const wkAvg = Object.entries(wkData).map(([w,v])=>({week:w.slice(5),Maths:+(v.Maths/v.days).toFixed(2),Physics:+(v.Physics/v.days).toFixed(2),Chemistry:+(v.Chemistry/v.days).toFixed(2)}));
  const totalH = sortedDates.reduce((a,d)=>a+SUBJECTS.reduce((b,s)=>b+(parseFloat(dayLogs[d]?.subjects[s]?.hours)||0),0),0);
  const motiv    = getMotivation(userName, streak);
  const todayLog = dayLogs[todayStr()];
  const greeting = getTimeGreeting();

  if (!userName) return <Onboarding onComplete={onboard} />;

  if (showWelcome) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#06060f,#0d0a1a)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{GLOBAL_CSS}</style>
      <div className="zoom-in" style={{textAlign:"center"}}>
        
        <h1 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(22px,7vw,36px)",margin:"0 0 10px",background:"linear-gradient(135deg,#f0ece0,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Welcome, {userName}!</h1>
        <p style={{color:"#6a6a7a",fontSize:"clamp(14px,4vw,18px)",margin:0}}>Your {userTarget} journey starts NOW.</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#06060f",color:"#f0ece0",fontFamily:"'Crimson Text',Georgia,serif",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      {/* bg glow */}
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(ellipse at 10% 10%,rgba(245,158,11,.05) 0%,transparent 50%),radial-gradient(ellipse at 90% 90%,rgba(167,139,250,.05) 0%,transparent 50%),radial-gradient(ellipse at 90% 10%,rgba(56,189,248,.04) 0%,transparent 50%)",pointerEvents:"none",zIndex:0}}/>

      {/* toast */}
      {toast && <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#111120",border:"1px solid #f59e0b",color:"#f59e0b",padding:"11px 22px",borderRadius:10,fontSize:14,zIndex:999,boxShadow:"0 4px 24px rgba(245,158,11,.3)",fontFamily:"Georgia,serif",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center"}}>{toast}</div>}

      {/* ── Sticky Header ── */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(6,6,15,.93)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid rgba(245,158,11,.1)"}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 16px"}}>

          {/* top bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,paddingBottom:8,gap:12}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:"clamp(11px,2.8vw,13px)",color:"#5a5a6a",letterSpacing:1,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {greeting}, <span style={{color:"#f59e0b",fontWeight:600}}>{userName}</span> 👋
              </div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(14px,4vw,19px)",color:"#f0ece0",fontWeight:700,letterSpacing:.4,lineHeight:1.2}}>JEE Study Tracker</div>
              <div style={{fontSize:"clamp(10px,2.4vw,12px)",color:"#3a3a4a",marginTop:2}}>
                Target: <span style={{color:"#5a5a6a"}}>{userTarget}</span>
              </div>
            </div>
            {/* streak badge */}
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(20px,6vw,30px)",fontWeight:700,color:"#f59e0b",lineHeight:1,textShadow:streak>=3?"0 0 28px rgba(245,158,11,.5)":"none",animation:streak>=7?"float 3s ease-in-out infinite":"none"}}>
                🔥 {streak}
              </div>
              <div style={{fontSize:"clamp(8px,2vw,10px)",color:"#5a5a6a",letterSpacing:1.5,textTransform:"uppercase",marginTop:2}}>Streak</div>
              {streak >= 7 && (
                <div style={{fontSize:"clamp(8px,2vw,10px)",marginTop:2,fontWeight:700,letterSpacing:1,
                  color:streak>=30?"#fbbf24":streak>=21?"#a78bfa":streak>=14?"#34d399":"#f59e0b"}}>
                  {streak>=30?"LEGEND 👑":streak>=21?"ELITE 💎":streak>=14?"STELLAR 🌟":"ON FIRE 🔥"}
                </div>
              )}
            </div>
          </div>

          {/* motivation strip */}
          <div style={{margin:"0 0 10px",padding:"9px 14px",background:motiv.glow?"rgba(245,158,11,.05)":"rgba(255,255,255,.02)",border:`1px solid ${motiv.color}1a`,borderRadius:10,display:"flex",alignItems:"flex-start",gap:8,animation:motiv.glow?"glow-pulse 3.5s ease-in-out infinite":"none"}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{motiv.emoji}</span>
            <span style={{fontSize:"clamp(11.5px,3vw,13.5px)",color:motiv.color,lineHeight:1.5,flex:1}}>{motiv.msg}</span>
            {motiv.badge && <span style={{flexShrink:0,background:`${motiv.color}12`,border:`1px solid ${motiv.color}28`,color:motiv.color,fontSize:"clamp(8px,2vw,10px)",padding:"3px 8px",borderRadius:20,letterSpacing:1,alignSelf:"center",fontFamily:"Georgia,serif"}}>{motiv.badge}</span>}
          </div>

          {/* tabs — icon only on mobile, icon+text on larger */}
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
            {TABS.map((t,i) => (
              <button key={i} className="tab-btn" onClick={() => setTab(i)}
                style={{background:"none",border:"none",color:tab===i?"#f59e0b":"#4a4a5a",padding:"9px clamp(10px,3vw,18px)",cursor:"pointer",fontSize:"clamp(11px,3vw,13px)",fontFamily:"'Cinzel',Georgia,serif",borderBottom:tab===i?"2px solid #f59e0b":"2px solid transparent",whiteSpace:"nowrap",flexShrink:0,letterSpacing:.3}}>
                {TAB_ICONS[i]} <span style={{display:"inline"}}>{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 16px 48px",position:"relative",zIndex:1}}>

        {/* ═══ TODAY ═══ */}
        {tab === 0 && (
          <div className="slide-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(15px,4vw,18px)",color:"#f0ece0",marginBottom:3}}>Today's Session</div>
                <div style={{fontSize:"clamp(11px,2.8vw,13px)",color:"#4a4a5a",letterSpacing:.5}}>{new Date().toDateString()}</div>
              </div>
              {todayLog?.submitted && <span style={{background:"rgba(34,197,94,.08)",color:"#4ade80",padding:"6px 14px",borderRadius:20,fontSize:"clamp(11px,3vw,13px)",border:"1px solid rgba(34,197,94,.2)"}}>✓ Saved</span>}
            </div>

            {SUBJECTS.map(subj => {
              const col = SC[subj];
              const rgb = subj==="Maths"?"245,158,11":subj==="Physics"?"56,189,248":"192,132,252";
              return (
                <div key={subj} className="sub-card" style={{marginBottom:20,background:`linear-gradient(135deg,rgba(${rgb},.04) 0%,rgba(6,6,15,.55) 100%)`,border:`1px solid rgba(${rgb},.2)`,borderRadius:16,padding:"clamp(16px,4vw,24px)"}}>
                  {/* subject header */}
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,paddingBottom:14,borderBottom:`1px solid rgba(${rgb},.1)`}}>
                    <div style={{width:40,height:40,borderRadius:11,background:`rgba(${rgb},.12)`,border:`1px solid rgba(${rgb},.25)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:col,flexShrink:0}}>{SI[subj]}</div>
                    <div>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(14px,3.8vw,16px)",fontWeight:700,color:col}}>{subj}</div>
                      <div style={{fontSize:11,color:"#4a4a5a",letterSpacing:.5}}>
                        {subj==="Maths"?"Calculus · Algebra · Geometry":subj==="Physics"?"Mechanics · Electricity · Optics":"Physical · Organic · Inorganic"}
                      </div>
                    </div>
                  </div>

                  {/* videos + hours */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                    <div style={LS}><span style={LT}>Videos</span><input style={IS} type="number" min="0" placeholder="0" inputMode="numeric" value={form.subjects[subj].videos} onChange={e=>updSub(subj,"videos",e.target.value)}/></div>
                    <div style={LS}><span style={LT}>Hours</span><input style={IS} type="number" min="0" step="0.5" placeholder="0.0" inputMode="decimal" value={form.subjects[subj].hours} onChange={e=>updSub(subj,"hours",e.target.value)}/></div>
                  </div>

                  {/* video topics */}
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:11,color:col,letterSpacing:1.8,textTransform:"uppercase",marginBottom:10,opacity:.8}}>▶ Video Topics Watched</div>
                    {(form.subjects[subj].videoTopics||[]).map((vt,idx)=>(
                      <div key={idx} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                        <input style={{...IS,flex:1}} placeholder={subj==="Maths"?"e.g. Limits & Continuity":subj==="Physics"?"e.g. Newton's Laws":"e.g. Periodic Trends"} value={vt.topic} onChange={e=>updVT(subj,idx,e.target.value)}/>
                        {(form.subjects[subj].videoTopics||[]).length>1 && <button onClick={()=>remVT(subj,idx)} style={RMB}>✕</button>}
                      </div>
                    ))}
                    <button onClick={()=>addVT(subj)} style={ADB(col)}>+ Add Video Topic</button>
                  </div>

                  {/* questions */}
                  <div>
                    <div style={{fontSize:11,color:col,letterSpacing:1.8,textTransform:"uppercase",marginBottom:10,opacity:.8}}>❓ Questions by Topic</div>
                    {form.subjects[subj].questions.map((q,idx)=>(
                      <div key={idx} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                        <input style={{...IS,flex:3,minWidth:0}} placeholder="Topic (e.g. Integration)" value={q.topic} onChange={e=>updQ(subj,idx,"topic",e.target.value)}/>
                        <input style={{...IS,flex:"0 0 70px",width:"70px"}} type="number" min="0" placeholder="Qty" inputMode="numeric" value={q.count} onChange={e=>updQ(subj,idx,"count",e.target.value)}/>
                        {form.subjects[subj].questions.length>1 && <button onClick={()=>remQ(subj,idx)} style={RMB}>✕</button>}
                      </div>
                    ))}
                    <button onClick={()=>addQ(subj)} style={ADB(col)}>+ Add Question Topic</button>
                  </div>
                </div>
              );
            })}

            {/* review */}
            <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(245,158,11,.12)",borderRadius:16,padding:"clamp(16px,4vw,24px)",marginBottom:20}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(13px,3.5vw,15px)",color:"#c4b99a",marginBottom:16}}>Day Review</div>
              <div style={LS}>
                <span style={LT}>How was today, {userName}? Rate &amp; reflect freely</span>
                <textarea style={{...IS,minHeight:80,resize:"vertical",lineHeight:1.75}} placeholder="e.g. 8/10 — great session on integration, need to revise electrochemistry tomorrow." value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))}/>
              </div>
              <div style={{...LS,marginTop:14}}>
                <span style={LT}>Notes &amp; goals for tomorrow</span>
                <textarea style={{...IS,minHeight:54,resize:"vertical",lineHeight:1.75}} placeholder="Topics to revise, doubts to clear..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </div>

            <button className="save-btn" onClick={submitDay} disabled={aiLoading} style={{width:"100%",padding:"clamp(14px,3.5vw,17px)",background:aiLoading?"rgba(245,158,11,.1)":"linear-gradient(135deg,#f59e0b,#d97706)",border:aiLoading?"1px solid rgba(245,158,11,.22)":"none",borderRadius:14,color:aiLoading?"#f59e0b":"#06060f",fontSize:"clamp(14px,4vw,17px)",fontWeight:700,fontFamily:"'Cinzel',serif",cursor:aiLoading?"not-allowed":"pointer",letterSpacing:1,boxShadow:aiLoading?"none":"0 4px 24px rgba(245,158,11,.28)"}}>
              {aiLoading?"✨ Generating your AI report...":`Save Today's Log, ${userName} →`}
            </button>

            {form.aiSummary && (
              <div style={{marginTop:20,padding:"clamp(16px,4vw,22px)",background:"linear-gradient(135deg,rgba(245,158,11,.05),rgba(167,139,250,.03))",border:"1px solid rgba(245,158,11,.15)",borderRadius:14}}>
                <div style={{fontSize:10,color:"#f59e0b",letterSpacing:3,textTransform:"uppercase",marginBottom:10,fontFamily:"Georgia,serif"}}>✨ Your AI Coach Report</div>
                <div style={{fontSize:"clamp(13px,3.5vw,15px)",color:"#d4c9a8",lineHeight:1.9}}>{form.aiSummary}</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ DASHBOARD ═══ */}
        {tab === 1 && (
          <div className="slide-in">
            <div style={{marginBottom:22}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(15px,4vw,18px)",color:"#f0ece0",marginBottom:3}}>{userName}'s Dashboard</div>
              <div style={{fontSize:"clamp(11px,3vw,13px)",color:"#4a4a5a"}}>Your {userTarget} preparation at a glance</div>
            </div>

            {/* stats — 2 col on mobile, 4 on desktop */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:22}}>
              {[{label:"Days Logged",val:sortedDates.length,icon:"📅",col:"#f59e0b"},{label:"Total Hours",val:totalH.toFixed(1)+"h",icon:"⏱",col:"#38bdf8"},{label:"Day Streak",val:`${streak} 🔥`,icon:"",col:"#f59e0b"},{label:"Exams Logged",val:exams.length,icon:"🏆",col:"#c084fc"}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${s.col}14`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
                  <div style={{fontSize:18,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(18px,5vw,22px)",fontWeight:700,color:s.col}}>{s.val}</div>
                  <div style={{fontSize:"clamp(9px,2.2vw,11px)",color:"#4a4a5a",letterSpacing:1.2,textTransform:"uppercase",marginTop:5}}>{s.label}</div>
                </div>
              ))}
            </div>

            <CB title="Daily Hours by Subject (Last 14 Days)"><LCW data={lineData} keys={SUBJECTS} colors={SC}/></CB>
            <CB title="Daily Questions Solved"><LCW data={lineData} keys={["Questions"]} colors={{Questions:"#4ade80"}}/></CB>
            <CB title="Weekly Average Hours"><LCW data={wkAvg} xKey="week" keys={SUBJECTS} colors={SC}/></CB>

            {/* AI weekly analysis */}
            <div style={{background:"rgba(167,139,250,.04)",border:"1px solid rgba(167,139,250,.15)",borderRadius:14,padding:"clamp(16px,4vw,22px)",marginBottom:26}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(12px,3vw,14px)",color:"#c084fc"}}>✨ Weekly AI Analysis</div>
                <button onClick={genDashSummary} disabled={dashLoading||!sortedDates.length} style={{background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.25)",color:"#c084fc",padding:"9px 18px",borderRadius:9,cursor:"pointer",fontSize:"clamp(12px,3vw,13px)",fontFamily:"Georgia,serif"}}>
                  {dashLoading?"Thinking...":"Generate →"}
                </button>
              </div>
              {dashSummary
                ? <div style={{fontSize:"clamp(13px,3.3vw,14px)",color:"#c4b0e8",lineHeight:1.85}}>{dashSummary}</div>
                : <div style={{fontSize:"clamp(12px,3vw,13px)",color:"#2a2a3a",fontStyle:"italic"}}>Generate a personal AI analysis of your last 7 days.</div>}
            </div>

            {/* daily report feed */}
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(11px,2.8vw,13px)",color:"#5a5a6a",letterSpacing:1,marginBottom:16}}>📋 What I Did — Daily Reports</div>
            {sortedDates.length===0 && <div style={{color:"#2a2a3a",textAlign:"center",padding:"36px 0",fontSize:14}}>No logs yet, {userName}. Start from the Today tab!</div>}
            {[...sortedDates].reverse().slice(0,10).map(d=><DailyCard key={d} date={d} log={dayLogs[d]}/>)}
          </div>
        )}

        {/* ═══ REPORTS ═══ */}
        {tab === 2 && (
          <div className="slide-in">
            <div style={{marginBottom:22}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(15px,4vw,18px)",color:"#f0ece0",marginBottom:3}}>{userName}'s Reports</div>
              <div style={{fontSize:"clamp(11px,3vw,13px)",color:"#4a4a5a"}}>Tap any day to expand the full report</div>
            </div>
            {!sortedDates.length && <div style={{color:"#2a2a3a",textAlign:"center",padding:56,fontSize:14}}>No logs yet. Start from the Today tab!</div>}
            {[...sortedDates].reverse().map(d=><DayReport key={d} date={d} log={dayLogs[d]}/>)}
          </div>
        )}

        {/* ═══ EXAMS ═══ */}
        {tab === 3 && (
          <div className="slide-in">
            <div style={{marginBottom:24}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(15px,4vw,18px)",color:"#f0ece0",marginBottom:3}}>Exam Results</div>
              <div style={{fontSize:"clamp(11px,3vw,13px)",color:"#4a4a5a"}}>Log your mock tests and JEE results here, {userName}</div>
            </div>

            {/* ── Entry form ── */}
            <div style={{background:"rgba(192,132,252,.04)",border:"1px solid rgba(192,132,252,.2)",borderRadius:16,padding:"clamp(16px,4vw,26px)",marginBottom:28}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(12px,3vw,13px)",color:"#c084fc",marginBottom:20}}>Log Exam Result</div>

              {/* name + date */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div style={LS}><span style={LT}>Exam Name</span><input style={IS} placeholder="e.g. Allen Mock 3" value={examForm.name} onChange={e=>setExamForm(f=>({...f,name:e.target.value}))}/></div>
                <div style={LS}><span style={LT}>Date</span><input style={IS} type="date" value={examForm.date} onChange={e=>setExamForm(f=>({...f,date:e.target.value}))}/></div>
              </div>

              {/* column header labels */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:6}}>
                <div/>{/* subject label column */}
                <div style={{...LT,textAlign:"center",paddingBottom:4,borderBottom:"1px solid rgba(245,158,11,.15)",color:"#f59e0b"}}>Your Marks</div>
                <div style={{...LT,textAlign:"center",paddingBottom:4,borderBottom:"1px solid rgba(56,189,248,.15)",color:"#38bdf8"}}>Class Avg</div>
                <div style={{...LT,textAlign:"center",paddingBottom:4,borderBottom:"1px solid rgba(255,255,255,.08)",color:"#5a5a6a"}}>Diff</div>
              </div>

              {/* per-subject rows */}
              {[
                {key:"maths",    avgKey:"avgMaths",    label:"Maths",     col:SC.Maths},
                {key:"physics",  avgKey:"avgPhysics",  label:"Physics",   col:SC.Physics},
                {key:"chemistry",avgKey:"avgChemistry",label:"Chemistry", col:SC.Chemistry},
              ].map(({key,avgKey,label,col})=>{
                const yours = parseFloat(examForm[key])  || null;
                const avg   = parseFloat(examForm[avgKey])|| null;
                const diff  = (yours!==null && avg!==null) ? (yours - avg) : null;
                return (
                  <div key={key} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:10,alignItems:"center"}}>
                    <div style={{...LT,color:col,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:14}}>{SI[label]}</span>{label}
                    </div>
                    <input style={IS} type="number" min="0" placeholder="0" inputMode="numeric"
                      value={examForm[key]} onChange={e=>setExamForm(f=>({...f,[key]:e.target.value}))}/>
                    <input style={{...IS,borderColor:"rgba(56,189,248,.2)"}} type="number" min="0" placeholder="0" inputMode="numeric"
                      value={examForm[avgKey]} onChange={e=>setExamForm(f=>({...f,[avgKey]:e.target.value}))}/>
                    <div style={{textAlign:"center",fontSize:"clamp(13px,3.5vw,15px)",fontWeight:700,fontFamily:"'Cinzel',serif",
                      color: diff===null?"#3a3a4a": diff>0?"#4ade80": diff<0?"#f87171":"#f0ece0"}}>
                      {diff===null?"—":`${diff>0?"+":""}${diff.toFixed(0)}`}
                    </div>
                  </div>
                );
              })}

              {/* total row */}
              <div style={{height:1,background:"rgba(255,255,255,.07)",margin:"14px 0"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:20,alignItems:"center"}}>
                <div style={{...LT,color:"#f59e0b",fontWeight:700}}>Total</div>
                <input style={{...IS,borderColor:"rgba(245,158,11,.3)"}} type="number" min="0" placeholder="0" inputMode="numeric"
                  value={examForm.total} onChange={e=>setExamForm(f=>({...f,total:e.target.value}))}/>
                <input style={{...IS,borderColor:"rgba(56,189,248,.2)"}} type="number" min="0" placeholder="0" inputMode="numeric"
                  value={examForm.avgTotal} onChange={e=>setExamForm(f=>({...f,avgTotal:e.target.value}))}/>
                <div style={{textAlign:"center",fontSize:"clamp(13px,3.5vw,16px)",fontWeight:700,fontFamily:"'Cinzel',serif",
                  color:(()=>{const d=(parseFloat(examForm.total)||null)!==null&&(parseFloat(examForm.avgTotal)||null)!==null?parseFloat(examForm.total)-parseFloat(examForm.avgTotal):null;return d===null?"#3a3a4a":d>0?"#4ade80":d<0?"#f87171":"#f0ece0";})()} }>
                  {(()=>{const y=parseFloat(examForm.total)||null,a=parseFloat(examForm.avgTotal)||null,d=y!==null&&a!==null?y-a:null;return d===null?"—":`${d>0?"+":""}${d.toFixed(0)}`})()}
                </div>
              </div>

              <button onClick={submitExam} style={{background:"rgba(192,132,252,.12)",border:"1px solid rgba(192,132,252,.3)",color:"#c084fc",padding:"13px 26px",borderRadius:10,cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:"clamp(12px,3.5vw,14px)",letterSpacing:.8,width:"100%",transition:"all .2s"}}>
                Save Result →
              </button>
            </div>

            {/* ── Graph 1: Your Total vs Class Average ── */}
            <CB title="Your Total vs Class Average">
              {examLD.length>1
                ? <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={examLD} margin={{top:4,right:8,left:-14,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
                      <XAxis dataKey="name" tick={{fill:"#4a4a5a",fontSize:10}} interval={0} angle={-20} textAnchor="end" height={46}/>
                      <YAxis tick={{fill:"#4a4a5a",fontSize:10}}/>
                      <Tooltip contentStyle={TT} formatter={(val,name)=>[val===null?"—":val, name]}/>
                      <Legend wrapperStyle={{fontSize:11,color:"#9ca3af"}}/>
                      <Line type="monotone" dataKey="Your Total" stroke="#f59e0b" strokeWidth={2.5} dot={{r:4,fill:"#f59e0b"}} activeDot={{r:6}} connectNulls/>
                      <Line type="monotone" dataKey="Class Avg"  stroke="#38bdf8" strokeWidth={2}   dot={{r:4,fill:"#38bdf8"}} strokeDasharray="6 3" activeDot={{r:6}} connectNulls/>
                    </LineChart>
                  </ResponsiveContainer>
                : <Empty msg="Log at least 2 exams to see the trend"/>}
            </CB>

            {/* ── Graph 2: Subject-wise You vs Class ── */}
            <CB title="Subject Marks — You vs Class Average">
              {examLD.length>1
                ? <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={examLD} margin={{top:4,right:8,left:-14,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
                      <XAxis dataKey="name" tick={{fill:"#4a4a5a",fontSize:10}} interval={0} angle={-20} textAnchor="end" height={46}/>
                      <YAxis tick={{fill:"#4a4a5a",fontSize:10}}/>
                      <Tooltip contentStyle={TT} formatter={(val,name)=>[val===null?"—":val, name]}/>
                      <Legend wrapperStyle={{fontSize:11,color:"#9ca3af"}}/>
                      <Line type="monotone" dataKey="Maths"       stroke={SC.Maths}     strokeWidth={2}   dot={{r:3}} activeDot={{r:5}} connectNulls/>
                      <Line type="monotone" dataKey="Avg Maths"   stroke={SC.Maths}     strokeWidth={1.5} dot={{r:3}} strokeDasharray="5 3" activeDot={{r:5}} connectNulls/>
                      <Line type="monotone" dataKey="Physics"     stroke={SC.Physics}   strokeWidth={2}   dot={{r:3}} activeDot={{r:5}} connectNulls/>
                      <Line type="monotone" dataKey="Avg Physics" stroke={SC.Physics}   strokeWidth={1.5} dot={{r:3}} strokeDasharray="5 3" activeDot={{r:5}} connectNulls/>
                      <Line type="monotone" dataKey="Chemistry"   stroke={SC.Chemistry} strokeWidth={2}   dot={{r:3}} activeDot={{r:5}} connectNulls/>
                      <Line type="monotone" dataKey="Avg Chemistry" stroke={SC.Chemistry} strokeWidth={1.5} dot={{r:3}} strokeDasharray="5 3" activeDot={{r:5}} connectNulls/>
                    </LineChart>
                  </ResponsiveContainer>
                : <Empty msg="Log at least 2 exams to see subject-wise comparison"/>}
            </CB>
            {examLD.length>1 && <div style={{fontSize:11,color:"#3a3a4a",marginTop:-12,marginBottom:18,paddingLeft:4,fontStyle:"italic"}}>Solid lines = your marks &nbsp;·&nbsp; Dashed lines = class average</div>}

            {/* ── All results list ── */}
            {exams.length>0 && (
              <div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(11px,2.8vw,13px)",color:"#4a4a5a",letterSpacing:1,marginBottom:14,marginTop:8}}>All Results</div>
                {[...exams].reverse().map(e=>{
                  const totalDiff = (e.total&&e.avgTotal) ? (parseFloat(e.total)-parseFloat(e.avgTotal)) : null;
                  return (
                    <div key={e.id} style={{background:"rgba(255,255,255,.015)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"clamp(12px,3vw,18px)",marginBottom:12,overflow:"hidden"}}>
                      {/* card header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
                        <div>
                          <div style={{fontWeight:700,fontFamily:"'Cinzel',serif",fontSize:"clamp(13px,3.5vw,15px)",marginBottom:3}}>{e.name}</div>
                          <div style={{fontSize:11,color:"#4a4a5a"}}>{e.date}</div>
                        </div>
                        {totalDiff!==null && (
                          <div style={{background:totalDiff>=0?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",border:`1px solid ${totalDiff>=0?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`,borderRadius:10,padding:"6px 14px",textAlign:"center",flexShrink:0}}>
                            <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(14px,4vw,18px)",fontWeight:700,color:totalDiff>=0?"#4ade80":"#f87171"}}>{totalDiff>=0?"+":""}{totalDiff.toFixed(0)}</div>
                            <div style={{fontSize:9,color:"#4a4a5a",letterSpacing:1.2,textTransform:"uppercase",marginTop:2}}>vs class</div>
                          </div>
                        )}
                      </div>

                      {/* subject grid — scroll horizontally if needed on very small screens */}
                      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(70px,1fr))",gap:8,minWidth:280}}>
                          {/* header row */}
                          <div/>
                          {SUBJECTS.map(s=>(
                            <div key={s} style={{textAlign:"center",fontSize:10,color:SC[s],letterSpacing:1,textTransform:"uppercase",fontFamily:"'Cinzel',serif",paddingBottom:6,borderBottom:`1px solid ${SC[s]}20`}}>
                              {SI[s]} {s}
                            </div>
                          ))}
                          {/* your marks row */}
                          <div style={{fontSize:10,color:"#5a5a6a",letterSpacing:1,textTransform:"uppercase",display:"flex",alignItems:"center"}}>Your</div>
                          {SUBJECTS.map(s=>(
                            <div key={s} style={{textAlign:"center"}}>
                              <div style={{fontSize:"clamp(15px,4.5vw,19px)",fontWeight:700,color:SC[s],fontFamily:"'Cinzel',serif"}}>{e[s.toLowerCase()]||"—"}</div>
                            </div>
                          ))}
                          {/* class avg row */}
                          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:1,textTransform:"uppercase",display:"flex",alignItems:"center"}}>Avg</div>
                          {SUBJECTS.map(s=>(
                            <div key={s} style={{textAlign:"center"}}>
                              <div style={{fontSize:"clamp(12px,3.5vw,14px)",color:"#38bdf8",fontFamily:"'Cinzel',serif"}}>{e[`avg${s}`]||"—"}</div>
                            </div>
                          ))}
                          {/* diff row */}
                          <div style={{fontSize:10,color:"#4a4a5a",letterSpacing:1,textTransform:"uppercase",display:"flex",alignItems:"center"}}>Diff</div>
                          {SUBJECTS.map(s=>{
                            const y=parseFloat(e[s.toLowerCase()])||null, a=parseFloat(e[`avg${s}`])||null;
                            const d=y!==null&&a!==null?y-a:null;
                            return (
                              <div key={s} style={{textAlign:"center"}}>
                                <div style={{fontSize:"clamp(11px,3vw,13px)",fontWeight:600,color:d===null?"#3a3a4a":d>0?"#4ade80":d<0?"#f87171":"#f0ece0",fontFamily:"'Cinzel',serif"}}>
                                  {d===null?"—":`${d>0?"+":""}${d.toFixed(0)}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* total row */}
                      {(e.total||e.avgTotal) && (
                        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                          {e.total && <div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:10,color:"#4a4a5a",textTransform:"uppercase",letterSpacing:1}}>Your Total</span><span style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(16px,5vw,20px)",fontWeight:700,color:"#f59e0b"}}>{e.total}</span></div>}
                          {e.avgTotal && <div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:10,color:"#38bdf8",textTransform:"uppercase",letterSpacing:1}}>Class Avg</span><span style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(14px,4vw,17px)",fontWeight:700,color:"#38bdf8"}}>{e.avgTotal}</span></div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Chart wrapper ── */
function LCW({ data, xKey="date", keys, colors }) {
  if (data.length < 2) return <Empty/>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{top:4,right:8,left:-14,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
        <XAxis dataKey={xKey} tick={{fill:"#4a4a5a",fontSize:10}}/>
        <YAxis tick={{fill:"#4a4a5a",fontSize:10}}/>
        <Tooltip contentStyle={TT}/>
        <Legend wrapperStyle={{fontSize:11,color:"#9ca3af"}}/>
        {keys.map(k=><Line key={k} type="monotone" dataKey={k} stroke={colors[k]} strokeWidth={2} dot={{r:2.5}} activeDot={{r:5}}/>)}
      </LineChart>
    </ResponsiveContainer>
  );
}

function CB({ title, children }) {
  return (
    <div style={{background:"rgba(255,255,255,.015)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"clamp(14px,3.5vw,20px) clamp(12px,3vw,20px) 12px",marginBottom:20}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(10px,2.5vw,12px)",color:"#4a4a5a",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ msg="Log at least 2 days to see the graph" }) {
  return <div style={{color:"#2a2a3a",textAlign:"center",padding:"32px 0",fontSize:13,fontStyle:"italic"}}>{msg}</div>;
}

function DailyCard({ date, log }) {
  const tH = SUBJECTS.reduce((a,s)=>a+(parseFloat(log.subjects[s]?.hours)||0),0);
  const tQ = SUBJECTS.reduce((a,s)=>a+(log.subjects[s]?.questions||[]).reduce((b,q)=>b+(parseInt(q.count)||0),0),0);
  const tV = SUBJECTS.reduce((a,s)=>a+(parseInt(log.subjects[s]?.videos)||0),0);
  return (
    <div style={{marginBottom:16,background:"rgba(255,255,255,.018)",border:"1px solid rgba(245,158,11,.09)",borderRadius:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.04)",background:"rgba(255,255,255,.01)",flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Cinzel',serif",fontWeight:600,fontSize:"clamp(11px,3vw,13px)",color:"#c4b99a"}}>{date}</span>
          <span style={{fontSize:"clamp(10px,2.5vw,12px)",color:"#4a4a5a"}}>⏱{tH.toFixed(1)}h · 📹{tV} · ❓{tQ}</span>
        </div>
        {log.submitted && <span style={{background:"rgba(34,197,94,.07)",color:"#4ade80",padding:"2px 9px",borderRadius:20,fontSize:10,border:"1px solid rgba(34,197,94,.15)"}}>✓</span>}
      </div>
      <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {SUBJECTS.map(s=>{
          const d=log.subjects[s];
          const vt=(d?.videoTopics||[]).map(v=>v.topic).filter(Boolean);
          const qt=(d?.questions||[]).filter(q=>q.topic);
          const hrs=parseFloat(d?.hours)||0,vids=parseInt(d?.videos)||0;
          const qn=(d?.questions||[]).reduce((a,q)=>a+(parseInt(q.count)||0),0);
          if(!hrs&&!vids&&!qn) return null;
          return (
            <div key={s}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <span style={{color:SC[s],fontSize:13}}>{SI[s]}</span>
                <span style={{fontSize:"clamp(12px,3vw,13px)",color:SC[s],fontWeight:600,fontFamily:"'Cinzel',serif"}}>{s}</span>
                <span style={{fontSize:"clamp(10px,2.5vw,11px)",color:"#3a3a4a"}}>{hrs}h · {vids}v · {qn}q</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:20}}>
                {vt.map((t,i)=><span key={`v${i}`} style={{background:`${SC[s]}10`,border:`1px solid ${SC[s]}25`,color:SC[s],padding:"2px 9px",borderRadius:20,fontSize:"clamp(10px,2.5vw,11px)",display:"inline-flex",alignItems:"center",gap:3}}><span style={{fontSize:8}}>▶</span>{t}</span>)}
                {qt.map((q,i)=><span key={`q${i}`} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#6a6a7a",padding:"2px 9px",borderRadius:20,fontSize:"clamp(10px,2.5vw,11px)"}}>❓{q.topic}×{q.count}</span>)}
                {!vt.length&&!qt.length&&<span style={{fontSize:11,color:"#2a2a3a",fontStyle:"italic"}}>No topics logged</span>}
              </div>
            </div>
          );
        })}
      </div>
      {log.aiSummary && (
        <div style={{padding:"0 16px 14px"}}>
          <div style={{background:"linear-gradient(135deg,rgba(245,158,11,.05),rgba(167,139,250,.03))",border:"1px solid rgba(245,158,11,.1)",borderRadius:10,padding:"11px 13px"}}>
            <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2.5,textTransform:"uppercase",marginBottom:6,fontFamily:"Georgia,serif"}}>✨ AI Summary</div>
            <div style={{fontSize:"clamp(12px,3vw,13px)",color:"#c4b99a",lineHeight:1.82}}>{log.aiSummary}</div>
          </div>
        </div>
      )}
      {log.rating && <div style={{padding:"0 16px 12px"}}><div style={{fontSize:"clamp(11px,2.8vw,12px)",color:"#3a3a4a",fontStyle:"italic",borderLeft:"2px solid rgba(245,158,11,.2)",paddingLeft:9,lineHeight:1.6}}>"{log.rating}"</div></div>}
    </div>
  );
}

function DayReport({ date, log }) {
  const [open, setOpen] = useState(false);
  const tH = SUBJECTS.reduce((a,s)=>a+(parseFloat(log.subjects[s]?.hours)||0),0);
  const tQ = SUBJECTS.reduce((a,s)=>a+(log.subjects[s]?.questions||[]).reduce((b,q)=>b+(parseInt(q.count)||0),0),0);
  return (
    <div style={{marginBottom:10,background:"rgba(255,255,255,.015)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"13px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",WebkitTapHighlightColor:"transparent"}}>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",flex:1,minWidth:0}}>
          <span style={{fontFamily:"'Cinzel',serif",fontWeight:600,fontSize:"clamp(12px,3vw,14px)"}}>{date}</span>
          <span style={{fontSize:"clamp(10px,2.5vw,12px)",color:"#4a4a5a"}}>{tH.toFixed(1)}h · {tQ}q</span>
          {log.submitted && <span style={{background:"rgba(34,197,94,.07)",color:"#4ade80",padding:"2px 8px",borderRadius:20,fontSize:10}}>✓</span>}
        </div>
        <span style={{color:"#4a4a5a",fontSize:12,flexShrink:0,marginLeft:8}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{padding:"0 16px 20px",borderTop:"1px solid rgba(255,255,255,.05)"}}>
          {log.aiSummary && (
            <div style={{margin:"16px 0 14px",padding:"13px 15px",background:"linear-gradient(135deg,rgba(245,158,11,.05),rgba(167,139,250,.03))",border:"1px solid rgba(245,158,11,.12)",borderRadius:11}}>
              <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2.5,textTransform:"uppercase",marginBottom:7,fontFamily:"Georgia,serif"}}>✨ AI Coach Report</div>
              <div style={{fontSize:"clamp(12px,3vw,13px)",color:"#c4b99a",lineHeight:1.85}}>{log.aiSummary}</div>
            </div>
          )}
          {/* subject detail — stacked on mobile */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,200px),1fr))",gap:12,marginTop:log.aiSummary?0:16}}>
            {SUBJECTS.map(s=>{
              const d=log.subjects[s];
              const qn=(d?.questions||[]).reduce((a,q)=>a+(parseInt(q.count)||0),0);
              const vt=(d?.videoTopics||[]).filter(v=>v.topic);
              return (
                <div key={s} style={{padding:14,background:"rgba(255,255,255,.02)",borderRadius:10,border:`1px solid ${SC[s]}18`}}>
                  <div style={{color:SC[s],fontFamily:"'Cinzel',serif",fontSize:"clamp(12px,3vw,13px)",fontWeight:700,marginBottom:9}}>{SI[s]} {s}</div>
                  <div style={{fontSize:12,color:"#6a6a7a",marginBottom:8}}>📹 {d?.videos||0} · ⏱ {d?.hours||0}h</div>
                  {vt.length>0 && <div style={{marginBottom:9}}>
                    <div style={{fontSize:9,color:SC[s],letterSpacing:2,textTransform:"uppercase",marginBottom:5,opacity:.7}}>Video Topics</div>
                    {vt.map((v,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{color:SC[s],fontSize:9}}>▶</span><span style={{fontSize:11,color:"#7dd3fc"}}>{v.topic}</span></div>)}
                  </div>}
                  <div style={{fontSize:12,color:"#6a6a7a",marginBottom:5}}>❓ {qn} questions</div>
                  {(d?.questions||[]).filter(q=>q.topic).map((q,i)=><div key={i} style={{fontSize:11,color:"#4a4a5a",marginTop:3}}>• {q.topic}: {q.count}</div>)}
                </div>
              );
            })}
          </div>
          {log.rating && (
            <div style={{marginTop:14,padding:"12px 14px",background:"rgba(245,158,11,.03)",borderRadius:9,border:"1px solid rgba(245,158,11,.08)"}}>
              <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontFamily:"Georgia,serif"}}>Day Review</div>
              <div style={{fontSize:"clamp(12px,3vw,13px)",color:"#c4b99a",lineHeight:1.75}}>{log.rating}</div>
            </div>
          )}
          {log.notes && <div style={{marginTop:9,fontSize:"clamp(11px,2.8vw,12px)",color:"#3a3a4a",fontStyle:"italic",lineHeight:1.6}}>{log.notes}</div>}
        </div>
      )}
    </div>
  );
}