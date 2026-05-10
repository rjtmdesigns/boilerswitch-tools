import { useState } from "react";
import {
  Flame, Zap, HelpCircle, CheckCircle2, XCircle,
  BatteryCharging, ShieldCheck, Wind, Gauge,
  Home, Building2, ThermometerSun, Droplets,
  BatteryFull, Leaf, Mail, TrendingUp,
  ClipboardList, MessageCircle, Lightbulb, Lock
} from "lucide-react";

// ─── Icon map — Lucide only, no emojis ───────────────────────────────────────
const IC = {
  gas:                <Flame size={26} strokeWidth={1.75} />,
  oil:                <Droplets size={26} strokeWidth={1.75} />,
  electric:           <Zap size={26} strokeWidth={1.75} />,
  heat_pump:          <ThermometerSun size={26} strokeWidth={1.75} />,
  battery:            <BatteryFull size={26} strokeWidth={1.75} />,
  both:               <BatteryCharging size={26} strokeWidth={1.75} />,
  good_insulation:    <ShieldCheck size={26} strokeWidth={1.75} />,
  average_insulation: <Gauge size={26} strokeWidth={1.75} />,
  poor_insulation:    <Wind size={26} strokeWidth={1.75} />,
  yes:                <CheckCircle2 size={26} strokeWidth={1.75} />,
  no:                 <XCircle size={26} strokeWidth={1.75} />,
  unsure:             <HelpCircle size={26} strokeWidth={1.75} />,
  leaf:               <Leaf size={26} strokeWidth={1.75} />,
};

// ─── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "property",
    phase: "eligibility",
    question: "What type of property do you own?",
    hint: "This determines which heat pump types are suitable",
    textCards: true,
    options: [
      { value: "detached",  label: "Detached House",    desc: "All heat pump types available" },
      { value: "semi",      label: "Semi-Detached",     desc: "Air source usually the best fit" },
      { value: "terraced",  label: "Terraced House",    desc: "Works well with good insulation" },
      { value: "flat",      label: "Flat / Apartment",  desc: "New air-to-air options available" },
    ],
  },
  {
    id: "heating",
    phase: "eligibility",
    question: "What's your current heating system?",
    hint: "Your existing system affects which grants you qualify for",
    options: [
      { value: "gas",      label: "Gas Boiler",          note: "Qualifies for £7,500 BUS grant",   icon: "gas" },
      { value: "oil",      label: "Oil Boiler",           note: "Qualifies for £9,000 BUS grant",   icon: "oil" },
      { value: "electric", label: "Electric Heating",     note: "ECO4 route may apply",             icon: "electric" },
      { value: "other",    label: "Other / Not sure",     note: "We'll find the right option",      icon: "unsure" },
    ],
  },
  {
    id: "benefits",
    phase: "eligibility",
    question: "Do you receive any government benefits?",
    hint: "Benefits recipients may qualify for free installation via ECO4",
    options: [
      { value: "yes",    label: "Yes — I receive benefits",  note: "May qualify for free install",   icon: "yes" },
      { value: "no",     label: "No — I don't",              note: "BUS grant still available",      icon: "no" },
      { value: "unsure", label: "Not sure",                  note: "We'll check all options",        icon: "unsure" },
    ],
  },
  {
    id: "size",
    phase: "cost",
    question: "How large is your property?",
    hint: "Property size determines the heat pump capacity you'll need",
    textCards: true,
    options: [
      { value: "small",   label: "1–2 Bedrooms",  desc: "Typically needs a 5–8 kW system" },
      { value: "medium",  label: "3 Bedrooms",    desc: "Typically needs an 8–11 kW system" },
      { value: "large",   label: "4 Bedrooms",    desc: "Typically needs an 11–14 kW system" },
      { value: "xlarge",  label: "5+ Bedrooms",   desc: "Typically needs a 14 kW+ system" },
    ],
  },
  {
    id: "insulation",
    phase: "cost",
    question: "How well insulated is your home?",
    hint: "Good insulation makes a heat pump significantly more cost-effective",
    options: [
      { value: "good",    label: "Well insulated",      note: "Double glazing, cavity wall",     icon: "good_insulation" },
      { value: "average", label: "Average insulation",  note: "Some upgrades done",              icon: "average_insulation" },
      { value: "poor",    label: "Poorly insulated",    note: "Older home, single glazing",      icon: "poor_insulation" },
      { value: "unsure",  label: "Not sure",            note: "We'll factor in typical levels",  icon: "unsure" },
    ],
  },
  {
    id: "postcode",
    phase: "local",
    question: "What's your postcode?",
    hint: "We use this to find MCS-certified installers near you",
    isText: true,
    placeholder: "e.g. M1 1AE",
  },
];

// ─── Calculation helpers ──────────────────────────────────────────────────────
const getCostRange = (size, insulation) => {
  const base = { small: [8000,11000], medium: [10000,13000], large: [12000,15000], xlarge: [14000,18000] };
  const add  = { poor: 1500, average: 500, good: 0, unsure: 750 };
  const [lo, hi] = base[size] || base.medium;
  const a = add[insulation] || 0;
  return [lo + a, hi + a];
};
const getGrant    = h => h === "oil" ? 9000 : h === "electric" ? 0 : 7500;
const getSavings  = (h, s) => {
  const b = { small:[200,500], medium:[350,700], large:[500,900], xlarge:[700,1200] };
  const [lo, hi] = b[s] || b.medium;
  if (h === "oil")      return [lo+200, hi+400];
  if (h === "electric") return [lo-50,  hi+100];
  return [lo, hi];
};
const isEligible  = h => h !== "electric";
const fmt         = n => `£${n.toLocaleString("en-GB")}`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function EligibilityCalculator() {
  const [step, setStep]               = useState(0);
  const [answers, setAnswers]         = useState({});
  const [selecting, setSelecting]     = useState(null);
  const [phase, setPhase]             = useState("tool");
  const [email, setEmail]             = useState("");
  const [emailError, setEmailError]   = useState("");
  const [postcodeInput, setPostcode]  = useState("");
  const [postcodeError, setPostcodeError] = useState("");

  const cur       = STEPS[step];
  const total     = STEPS.length;
  const pct       = Math.round(((step + 1) / total) * 100);
  const grant     = getGrant(answers.heating);
  const eligible  = isEligible(answers.heating);
  const [cLo, cHi] = answers.size ? getCostRange(answers.size, answers.insulation) : [0,0];
  const netLo     = Math.max(0, cLo - grant);
  const netHi     = Math.max(0, cHi - grant);
  const [sLo, sHi] = answers.size ? getSavings(answers.heating, answers.size) : [0,0];
  const payback   = grant > 0 && sLo > 0
    ? Math.round(((cLo+cHi)/2 - grant) / ((sLo+sHi)/2))
    : null;

  const pick = (value) => {
    if (selecting) return;
    setSelecting(value);
    setTimeout(() => {
      const na = { ...answers, [cur.id]: value };
      setAnswers(na);
      setSelecting(null);
      step < total - 1 ? setStep(step + 1) : setPhase("partial");
    }, 280);
  };

  const submitPostcode = () => {
    const v = postcodeInput.trim().toUpperCase();
    if (!v) { setPostcodeError("Please enter your postcode"); return; }
    if (!/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(v)) {
      setPostcodeError("Please enter a valid UK postcode"); return;
    }
    setPostcodeError("");
    setAnswers({ ...answers, postcode: v });
    setPhase("partial");
  };

  const submitEmail = () => {
    if (!email.trim()) { setEmailError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address"); return;
    }
    setEmailError("");
    setPhase("confirmed");
  };

  const phaseLabel = s => s < 3 ? "Eligibility" : s < 5 ? "Cost Estimate" : "Your Location";
  const phaseAccent = s => s < 3 ? "#1B4332" : s < 5 ? "#92400E" : "#1e3a5f";

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F5F4EF 0%,#EEF2EE 50%,#F5F4EF 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 16px", fontFamily:"'Lora',serif" }}>
      <h1 style={{ position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap" }}>Heat Pump Grant Eligibility Check</h1>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* Text card — for property type and size (no icon) */
        .tc {
          width:100%; background:#FAFAF7; border:1.5px solid #E4DED6; border-radius:12px;
          padding:15px 18px; cursor:pointer; text-align:left; transition:all 0.2s ease;
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .tc:hover { background:#F0F7F2; border-color:#1B4332; transform:translateX(3px); }
        .tc.sel   { background:#F0F7F2; border-color:#1B4332; box-shadow:0 0 0 3px rgba(27,67,50,0.1); }
        .tc.fade  { opacity:0.35; pointer-events:none; }

        /* Icon card — for heating, insulation etc */
        .ic {
          width:100%; background:#FAFAF7; border:1.5px solid #E4DED6; border-radius:12px;
          padding:14px 18px; cursor:pointer; text-align:left; transition:all 0.2s ease;
          display:flex; align-items:center; gap:14px;
        }
        .ic:hover { background:#F0F7F2; border-color:#1B4332; transform:translateX(3px); }
        .ic.sel   { background:#F0F7F2; border-color:#1B4332; box-shadow:0 0 0 3px rgba(27,67,50,0.1); }
        .ic.fade  { opacity:0.35; pointer-events:none; }

        .ic-wrap { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.2s; }
        .ic:hover .ic-wrap, .ic.sel .ic-wrap { background:#E0F0E8; }
        .ic-wrap svg { color:#4B5563; transition:color 0.2s; }
        .ic:hover .ic-wrap svg, .ic.sel .ic-wrap svg { color:#1B4332; }

        .prog-track { height:3px; background:#E8E3DB; border-radius:2px; overflow:hidden; }
        .prog-fill  { height:100%; background:linear-gradient(90deg,#1B4332,#52B788); border-radius:2px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }

        .btn-cta { width:100%; background:linear-gradient(135deg,#D97706,#B45309); color:#fff; border:none; border-radius:12px; padding:16px 24px; font-family:'Inter',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(180,83,9,0.28); }
        .btn-cta:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(180,83,9,0.38); }
        .btn-ghost { width:100%; background:none; border:1.5px solid #E4DED6; border-radius:10px; padding:12px 20px; font-family:'Inter',sans-serif; font-size:13px; color:#6B7280; cursor:pointer; transition:all 0.2s; }
        .btn-ghost:hover { border-color:#9CA3AF; color:#374151; }
        .back-btn { background:none; border:none; font-family:'Inter',sans-serif; font-size:12px; color:#9CA3AF; cursor:pointer; padding:0; transition:color 0.15s; display:flex; align-items:center; gap:4px; }
        .back-btn:hover { color:#4B5563; }

        .email-inp { width:100%; padding:14px 16px; border:1.5px solid #E4DED6; border-radius:10px; font-family:'Inter',sans-serif; font-size:15px; background:#FAFAF7; color:#111827; outline:none; transition:all 0.2s; }
        .email-inp:focus { border-color:#1B4332; background:#fff; box-shadow:0 0 0 3px rgba(27,67,50,0.08); }
        .email-inp.err { border-color:#EF4444; }
        .text-inp { width:100%; padding:15px 18px; border:1.5px solid #E4DED6; border-radius:12px; font-family:'Inter',sans-serif; font-size:18px; font-weight:600; background:#FAFAF7; color:#111827; outline:none; text-transform:uppercase; letter-spacing:0.08em; text-align:center; transition:all 0.2s; }
        .text-inp:focus { border-color:#1B4332; background:#fff; box-shadow:0 0 0 3px rgba(27,67,50,0.08); }
        .text-inp.err { border-color:#EF4444; }

        .stat-box { background:#F8F5F0; border:1px solid #E4DED6; border-radius:12px; padding:16px 18px; text-align:center; }
        .stat-box.hi { background:linear-gradient(135deg,#F0FDF4,#DCFCE7); border-color:#86EFAC; }
        .stat-box.lock { position:relative; overflow:hidden; }
        .stat-box.lock::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.72); backdrop-filter:blur(3px); border-radius:11px; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation:fadeUp 0.3s ease both; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @media(max-width:520px) {
          .prog-track { margin-bottom: 18px; }
          .stat-box { padding: 12px 14px; }
          .btn-cta { font-size: 14px; padding: 14px 20px; }
          .tc, .ic { padding: 12px 14px; }
        }
      `}</style>

      <div style={{ background:"#fff", borderRadius:22, border:"1px solid #E4DED6", boxShadow:"0 8px 48px rgba(0,0,0,0.09)", width:"100%", maxWidth:500, overflow:"hidden" }}>

        {/* Accent bar */}
        <div style={{ height:4, background: phase === "tool" ? `linear-gradient(90deg,${phaseAccent(step)},${phaseAccent(step)}99)` : phase === "confirmed" ? "linear-gradient(90deg,#D97706,#F59E0B)" : "linear-gradient(90deg,#1B4332,#52B788)", transition:"background 0.4s" }} />

        <div style={{ padding:"28px 30px" }}>

          {/* ── TOOL ── */}
          {phase === "tool" && (
            <div className="fu" key={step}>

              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                <div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:phaseAccent(step), background:`${phaseAccent(step)}12`, padding:"2px 9px", borderRadius:4 }}>
                    {phaseLabel(step)}
                  </span>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF", marginTop:5 }}>Step {step+1} of {total}</p>
                </div>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:"#1B4332" }}>{pct}%</span>
              </div>

              {/* Progress */}
              <div className="prog-track" style={{ marginBottom:24 }}>
                <div className="prog-fill" style={{ width:`${pct}%` }} />
              </div>

              {/* Question */}
              <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:20, color:"#111827", lineHeight:1.25, marginBottom:5 }}>{cur.question}</h2>
              {cur.hint && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#9CA3AF", marginBottom:20, lineHeight:1.5 }}>{cur.hint}</p>}

              {/* Text cards (property type & size) */}
              {cur.textCards && (
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {cur.options.map(o => (
                    <button
                      key={o.value}
                      className={`tc ${selecting===o.value?"sel":""} ${selecting&&selecting!==o.value?"fade":""}`}
                      onClick={() => pick(o.value)}
                      aria-label={o.label}
                    >
                      <div>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:"#111827", marginBottom:2 }}>{o.label}</p>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{o.desc}</p>
                      </div>
                      <span style={{ color:"#D1D5DB", fontSize:18, flexShrink:0 }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Icon cards (heating, insulation, benefits) */}
              {!cur.textCards && !cur.isText && (
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {cur.options.map(o => (
                    <button
                      key={o.value}
                      className={`ic ${selecting===o.value?"sel":""} ${selecting&&selecting!==o.value?"fade":""}`}
                      onClick={() => pick(o.value)}
                      aria-label={o.label}
                    >
                      <div className="ic-wrap" style={{ background:"#F0EBE3" }}>
                        {IC[o.icon]}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:"#111827", marginBottom:2 }}>{o.label}</p>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{o.note}</p>
                      </div>
                      <span style={{ color:"#D1D5DB", fontSize:18, flexShrink:0 }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Postcode input */}
              {cur.isText && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input className={`text-inp ${postcodeError?"err":""}`} type="text" placeholder={cur.placeholder}
                    value={postcodeInput} maxLength={8} autoFocus
                    onChange={e => { setPostcode(e.target.value.toUpperCase()); setPostcodeError(""); }}
                    onKeyDown={e => e.key==="Enter" && submitPostcode()}
                    aria-label="Postcode"
                  />
                  {postcodeError && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#EF4444", textAlign:"center" }}>{postcodeError}</p>}
                  <button className="btn-cta" onClick={submitPostcode}>See My Results →</button>
                </div>
              )}

              {/* Back */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:18 }}>
                {step > 0
                  ? <button className="back-btn" onClick={() => { setStep(step-1); setSelecting(null); setPostcodeError(""); }}>← Back</button>
                  : <span />
                }
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#C4BDB5", display:"flex", alignItems:"center", gap:4 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Your data is safe</p>
              </div>
            </div>
          )}

          {/* ── PARTIAL RESULT ── */}
          {phase === "partial" && (
            <div className="fu">
              <div style={{ textAlign:"center", marginBottom:22 }}>
                <div className={`pop`} style={{ width:60, height:60, borderRadius:"50%", background: eligible?"linear-gradient(135deg,#D1FAE5,#A7F3D0)":"#FEF3C7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:26 }}>
                  {eligible ? <CheckCircle2 size={28} color="#166534" strokeWidth={1.75} /> : <Lightbulb size={28} color="#92400E" strokeWidth={1.75} />}
                </div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color: eligible?"#166534":"#92400E", marginBottom:6 }}>
                  {eligible ? "You likely qualify" : "Alternative options available"}
                </p>
                <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:22, color:"#111827", lineHeight:1.2, marginBottom:6 }}>
                  {eligible ? `You may qualify for ${fmt(grant)} off` : "Let's find the right path for your home"}
                </h2>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#6B7280", lineHeight:1.55 }}>
                  {eligible ? "Based on your answers, you're likely eligible for the Boiler Upgrade Scheme grant." : "The BUS grant may not apply, but other funding routes are available."}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
                <div className={`stat-box hi`} style={{ gridColumn: eligible?"1":"1/-1" }}>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: eligible?"#166534":"#92400E", marginBottom:4 }}>BUS Grant</p>
                  <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:28, color: eligible?"#1B4332":"#92400E" }}>{eligible ? fmt(grant) : "Not eligible"}</p>
                  {!eligible && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#92400E", marginTop:3 }}>ECO4 may still apply</p>}
                </div>
                {eligible && (
                  <div className="stat-box">
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6B7280", marginBottom:4 }}>Est. Install Cost</p>
                    <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:18, color:"#374151" }}>{fmt(cLo)}–{fmt(cHi)}</p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#9CA3AF", marginTop:2 }}>before grant</p>
                  </div>
                )}
                <div className="stat-box lock">
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6B7280", marginBottom:4 }}>Your Net Cost</p>
                  <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:18, color:"#374151" }}>{fmt(netLo)}–{fmt(netHi)}</p>
                </div>
                <div className="stat-box lock">
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6B7280", marginBottom:4 }}>Annual Savings</p>
                  <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:18, color:"#374151" }}>{fmt(sLo)}–{fmt(sHi)}</p>
                </div>
              </div>

              {/* Lock explanation */}
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"11px 15px", display:"flex", gap:10, alignItems:"flex-start", marginBottom:16 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#78350F", lineHeight:1.55 }}>
                  <strong>Unlock your full result</strong> — enter your email to see your {eligible?"net cost after grant, ":""}annual savings{payback?`, ${payback}-year payback,`:""} and get 3 free quotes from local MCS installers.
                </p>
              </div>

              <button className="btn-cta" onClick={() => setPhase("email")}>Unlock Full Result & Get Free Quotes →</button>
              <button className="btn-ghost" style={{ marginTop:9 }} onClick={() => setPhase("confirmed")}>Skip — just show me my result</button>
              <button className="back-btn" style={{ margin:"12px auto 0", display:"block" }} onClick={() => { setPhase("tool"); setStep(total-1); }}>← Start again</button>
            </div>
          )}

          {/* ── EMAIL ── */}
          {phase === "email" && (
            <div className="fu">
              <div style={{ textAlign:"center", marginBottom:22 }}>
                <div style={{ width:56, height:56, background:"linear-gradient(135deg,#F0F9F4,#DCFCE7)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}><Mail size={26} color="#1B4332" strokeWidth={1.75} /></div>
                <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:21, color:"#111827", marginBottom:8, lineHeight:1.25 }}>Where should we send your full result?</h2>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#6B7280", lineHeight:1.6 }}>
                  We'll email your personalised cost breakdown and match you with up to 3 MCS-certified installers near {answers.postcode || "you"}.
                </p>
              </div>

              {/* Teaser */}
              <div style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", border:"1px solid #BBF7D0", borderRadius:11, padding:"13px 17px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"#166534", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Your BUS grant</p>
                  <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:22, color:"#1B4332" }}>{eligible ? fmt(grant) : "Alt route"}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"#6B7280", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Net cost</p>
                  <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:17, color:"#374151", display:"flex", alignItems:"center", gap:5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>{fmt(netLo)}–{fmt(netHi)}</p>
                </div>
              </div>

              <div style={{ marginBottom:11 }}>
                <input className={`email-inp ${emailError?"err":""}`} type="email" placeholder="your@email.com" value={email} autoFocus
                  onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={e => e.key==="Enter" && submitEmail()}
                  aria-label="Email address"
                />
                {emailError && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#EF4444", marginTop:5 }}>{emailError}</p>}
              </div>

              <button className="btn-cta" onClick={submitEmail}>See My Full Result & Get Quotes →</button>
              <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:11 }}>
                {["Email contact only","Max 3 installers","Unsubscribe anytime"].map(t => (
                  <span key={t} style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#C4BDB5" }}>{t}</span>
                ))}
              </div>
              <button className="back-btn" style={{ margin:"12px auto 0", display:"block" }} onClick={() => setPhase("partial")}>← Back to my result</button>
            </div>
          )}

          {/* ── CONFIRMED ── */}
          {phase === "confirmed" && (
            <div className="fu">
              {email ? (
                <>
                  <div style={{ textAlign:"center", marginBottom:22 }}>
                    <div className="pop" style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#D1FAE5,#A7F3D0)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><CheckCircle2 size={30} color="#1B4332" strokeWidth={2} /></div>
                    <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:21, color:"#111827", marginBottom:8 }}>Your full result is on its way</h2>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#6B7280", lineHeight:1.6 }}>
                      We've sent a summary to <strong>{email}</strong>. Everything unlocked:
                    </p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
                    {[
                      { label:"BUS Grant",      value: eligible?fmt(grant):"N/A",          hi:eligible },
                      { label:"Install Cost",   value:`${fmt(cLo)}–${fmt(cHi)}`,           hi:false },
                      { label:"Your Net Cost",  value:`${fmt(netLo)}–${fmt(netHi)}`,        hi:false },
                      { label:"Annual Savings", value:`${fmt(sLo)}–${fmt(sHi)}`,           hi:false },
                    ].map(({ label, value, hi }) => (
                      <div key={label} className={`stat-box ${hi?"hi":""}`}>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: hi?"#166534":"#6B7280", marginBottom:4 }}>{label}</p>
                        <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize: hi?24:17, color: hi?"#1B4332":"#374151" }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {payback && (
                    <div style={{ background:"#F0F9F4", border:"1px solid #BBF7D0", borderRadius:10, padding:"11px 16px", textAlign:"center", marginBottom:18 }}>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#166534" }}>
                        <span style={{display:"flex",alignItems:"center",gap:6}}><TrendingUp size={15} color="#166534" strokeWidth={1.75} /><span>Estimated payback: <strong>{payback} years</strong> — then pure savings</span></span>
                      </p>
                    </div>
                  )}

                  <div style={{ background:"#F8F5F0", borderRadius:11, padding:"16px 18px", marginBottom:16 }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>What happens next</p>
                    {[
                      [<ClipboardList size={14} color="#fff" strokeWidth={1.75} />, `MCS installers near ${answers.postcode||"you"} review your details`],
                      [<MessageCircle size={14} color="#fff" strokeWidth={1.75} />, "You receive up to 3 personalised quotes within 24 hours"],
                      [<CheckCircle2 size={14} color="#fff" strokeWidth={1.75} />, "Compare and choose — no obligation, no pressure"],
                    ].map(([icon, text], i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom: i<2?10:0 }}>
                        <div style={{ width:26, height:26, background:"#1B4332", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:13 }}>{icon}</div>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#374151", lineHeight:1.5, paddingTop:3 }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Skipped email */
                <>
                  <div style={{ textAlign:"center", marginBottom:22 }}>
                    <div style={{ width:52, height:52, background:"#FEF3C7", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}><Lightbulb size={24} color="#92400E" strokeWidth={1.75} /></div>
                    <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:21, color:"#111827", marginBottom:8 }}>Your result</h2>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#6B7280", lineHeight:1.6 }}>
                      Enter your email to unlock the full breakdown and get 3 free quotes.
                    </p>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div className={`stat-box hi`} style={{ marginBottom:10 }}>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: eligible?"#166534":"#92400E", marginBottom:4 }}>BUS Grant Available</p>
                      <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:30, color: eligible?"#1B4332":"#92400E" }}>{eligible?fmt(grant):"Not eligible"}</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div className="stat-box lock"><p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"#6B7280", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Net Cost</p><p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:16, color:"#374151" }}>Locked</p></div>
                      <div className="stat-box lock"><p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"#6B7280", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Savings</p><p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:16, color:"#374151" }}>Locked</p></div>
                    </div>
                  </div>
                  <button className="btn-cta" onClick={() => setPhase("email")}>Unlock Full Result — It's Free →</button>
                </>
              )}
              <button className="back-btn" style={{ display:"block", margin:"12px auto 0" }} onClick={() => { setPhase("tool"); setStep(0); setAnswers({}); setEmail(""); setPostcode(""); }}>
                ← Check another property
              </button>
            </div>
          )}

        </div>

        {/* Trust strip */}
        <div style={{ background:"#F8F5F0", borderTop:"1px solid #E4DED6", padding:"11px 28px", display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
          {["GDPR Compliant","MCS Installers Only","4.8 Trustpilot"].map(t => (
            <span key={t} style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#9CA3AF" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
