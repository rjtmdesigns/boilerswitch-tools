import { useState } from "react";
import {
  Flame, Zap, HelpCircle, BatteryCharging,
  Rocket, Calendar, Clock, Search,
  ThermometerSun, BatteryFull, Droplets,
  Lock, BadgeCheck, ShieldCheck, Phone, Mail,
  CheckCircle2, XCircle, Star, Wrench
} from "lucide-react";

// ─── Icon map ─────────────────────────────────────────────────────────────────
const IC = {
  gas:        <Flame size={24} strokeWidth={1.75} />,
  oil:        <Droplets size={24} strokeWidth={1.75} />,
  electric:   <Zap size={24} strokeWidth={1.75} />,
  heat_pump:  <ThermometerSun size={24} strokeWidth={1.75} />,
  battery:    <BatteryFull size={24} strokeWidth={1.75} />,
  both:       <BatteryCharging size={24} strokeWidth={1.75} />,
  asap:       <Rocket size={24} strokeWidth={1.75} />,
  months3:    <Calendar size={24} strokeWidth={1.75} />,
  months6:    <Clock size={24} strokeWidth={1.75} />,
  research:   <Search size={24} strokeWidth={1.75} />,
  yes:        <CheckCircle2 size={24} strokeWidth={1.75} />,
  no:         <XCircle size={24} strokeWidth={1.75} />,
  unsure:     <HelpCircle size={24} strokeWidth={1.75} />,
};

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "property",
    title: "Your property",
    question: "What type of property do you own?",
    hint: "This determines suitable heat pump types and sizing",
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
    title: "Current heating",
    question: "What's your current heating system?",
    hint: "Your existing system affects which grants you qualify for",
    options: [
      { value: "gas",      label: "Gas Boiler",        note: "Eligible for £7,500 BUS grant",  icon: "gas" },
      { value: "oil",      label: "Oil Boiler",         note: "Eligible for £9,000 BUS grant",  icon: "oil" },
      { value: "electric", label: "Electric Heating",   note: "ECO4 options may apply",         icon: "electric" },
      { value: "other",    label: "Other / Not sure",   note: "We'll identify best route",      icon: "unsure" },
    ],
  },
  {
    id: "interest",
    title: "What you need",
    question: "What are you looking to install?",
    hint: "You can get quotes for multiple products",
    multi: true,
    options: [
      { value: "heat_pump",  label: "Heat Pump",             note: "Air or ground source",           icon: "heat_pump" },
      { value: "battery",    label: "Battery Storage",       note: "Store energy, cut bills",        icon: "battery" },
      { value: "both",       label: "Heat Pump + Battery",   note: "Best value combination",         icon: "both" },
      { value: "unsure",     label: "Not sure yet",          note: "We'll advise on the best option",icon: "unsure" },
    ],
  },
  {
    id: "timeline",
    title: "Your timeline",
    question: "When are you looking to install?",
    hint: "This helps installers give accurate availability",
    options: [
      { value: "asap",      label: "As soon as possible",  note: "Priority matching",          icon: "asap" },
      { value: "3months",   label: "Within 3 months",      note: "Standard timeline",          icon: "months3" },
      { value: "6months",   label: "Within 6 months",      note: "Planning ahead",             icon: "months6" },
      { value: "research",  label: "Just researching",     note: "No rush — we'll keep in touch", icon: "research" },
    ],
  },
  {
    id: "contact",
    title: "Your details",
    question: "Where should we send your quotes?",
    hint: "Only shared with up to 3 MCS-certified installers near you",
    isContact: true,
  },
];

const GRANT = h => h === "oil" ? "£9,000" : h === "electric" ? null : "£7,500";

// ─── Main component ───────────────────────────────────────────────────────────
export default function GetAQuote() {
  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState({});
  const [multi, setMulti]       = useState([]);
  const [selecting, setSelecting] = useState(null);
  const [phase, setPhase]       = useState("form");
  const [errors, setErrors]     = useState({});
  const [contact, setContact]   = useState({ name:"", email:"", phone:"", postcode:"" });

  const cur   = STEPS[step];
  const total = STEPS.length;
  const pct   = Math.round(((step + 1) / total) * 100);
  const grant = GRANT(answers.heating);

  const pick = (value) => {
    if (selecting) return;
    setSelecting(value);
    setTimeout(() => {
      setAnswers({ ...answers, [cur.id]: value });
      setSelecting(null);
      setStep(step + 1);
    }, 280);
  };

  const toggleMulti = (v) => {
    if (v === "unsure") { setMulti(["unsure"]); return; }
    const without = multi.filter(x => x !== "unsure");
    setMulti(without.includes(v) ? without.filter(x => x !== v) : [...without, v]);
  };

  const nextMulti = () => {
    if (!multi.length) { setErrors({ interest:"Please select at least one option" }); return; }
    setErrors({});
    setAnswers({ ...answers, interest: multi });
    setStep(step + 1);
  };

  const validate = () => {
    const e = {};
    if (!contact.name.trim())   e.name = "Please enter your name";
    if (!contact.email.trim())  e.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) e.email = "Please enter a valid email";
    if (!contact.postcode.trim()) e.postcode = "Please enter your postcode";
    else if (!/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(contact.postcode.trim())) e.postcode = "Please enter a valid UK postcode";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setPhase("done");
  };

  return (
    <div style={{ fontFamily:"'Lora',serif", background:"#FAFAF8", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* Text card — no icon */
        .tc { width:100%; background:#FAFAF7; border:1.5px solid #E4DED6; border-radius:12px; padding:15px 18px; cursor:pointer; text-align:left; transition:all 0.2s; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .tc:hover { background:#F0F7F2; border-color:#1B4332; transform:translateX(3px); }
        .tc.sel   { background:#F0F7F2; border-color:#1B4332; box-shadow:0 0 0 3px rgba(27,67,50,0.1); }
        .tc.fade  { opacity:0.35; pointer-events:none; }

        /* Icon card */
        .oic { width:100%; background:#FAFAF7; border:1.5px solid #E4DED6; border-radius:12px; padding:13px 17px; cursor:pointer; text-align:left; transition:all 0.2s; display:flex; align-items:center; gap:13px; }
        .oic:hover { background:#F0F7F2; border-color:#1B4332; transform:translateX(3px); }
        .oic.sel   { background:#F0F7F2; border-color:#1B4332; box-shadow:0 0 0 3px rgba(27,67,50,0.1); }
        .oic.fade  { opacity:0.35; pointer-events:none; }
        .oic.ms    { background:#F0F7F2; border-color:#1B4332; }
        .icw { width:40px; height:40px; background:#F0EBE3; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.2s; }
        .oic:hover .icw, .oic.sel .icw, .oic.ms .icw { background:#E0F0E8; }
        .icw svg { color:#4B5563; transition:color 0.2s; }
        .oic:hover .icw svg, .oic.sel .icw svg, .oic.ms .icw svg { color:#1B4332; }

        /* Multi checkbox */
        .chk { width:22px; height:22px; border-radius:50%; border:2px solid #E4DED6; background:transparent; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
        .chk.on { background:#1B4332; border-color:#1B4332; }

        .prog-track { height:3px; background:#E4DED6; border-radius:2px; overflow:hidden; }
        .prog-fill  { height:100%; background:linear-gradient(90deg,#1B4332,#52B788); border-radius:2px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }

        .btn-cta { width:100%; background:linear-gradient(135deg,#D97706,#B45309); color:#fff; border:none; border-radius:12px; padding:16px 24px; font-family:'Inter',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(180,83,9,0.28); }
        .btn-cta:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(180,83,9,0.38); }
        .btn-next { width:100%; background:#1B4332; color:#fff; border:none; border-radius:12px; padding:14px 24px; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .btn-next:hover { background:#143326; }
        .back-btn { background:none; border:none; font-family:'Inter',sans-serif; font-size:12px; color:#9CA3AF; cursor:pointer; padding:0; transition:color 0.15s; }
        .back-btn:hover { color:#4B5563; }

        .finp { width:100%; padding:13px 15px; border:1.5px solid #E4DED6; border-radius:10px; font-family:'Inter',sans-serif; font-size:15px; background:#FAFAF7; color:#111827; outline:none; transition:all 0.2s; }
        .finp:focus { border-color:#1B4332; background:#fff; box-shadow:0 0 0 3px rgba(27,67,50,0.08); }
        .finp.err { border-color:#EF4444; box-shadow:0 0 0 3px rgba(239,68,68,0.08); }
        .errmsg { font-family:'Inter',sans-serif; font-size:12px; color:#EF4444; margin-top:4px; }

        .step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.3s; font-family:'Inter',sans-serif; font-size:11px; font-weight:700; }
        .step-line { flex:1; height:2px; border-radius:1px; transition:background 0.3s; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation:fadeUp 0.3s ease both; }
        @keyframes pop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .pop { animation:pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

        @media(max-width:900px){.pg{grid-template-columns:1fr!important}.sb{display:none!important}}
      `}</style>

      {/* Nav */}
      <nav style={{ background:"rgba(250,250,248,0.94)", backdropFilter:"blur(12px)", borderBottom:"1px solid #E8E3DB", padding:"0 28px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:66 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,#1B4332,#2D6A4F)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6 6 6 10 12 14c6 4 6 8 0 12"/><path d="M7 6C4 9 4 12 7 15"/><path d="M17 6c3 3 3 6 0 9"/></svg>
            </div>
            <span style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:16, color:"#111827" }}>
              BoilerSwitch<span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF", fontWeight:400 }}>.co.uk</span>
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Lock size={13} color="#9CA3AF" strokeWidth={1.75} />
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>Secure · MCS Certified · Max 3 installers</span>
          </div>
        </div>
      </nav>

      {phase === "form" ? (
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"44px 24px" }}>
          <div className="pg" style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:48, alignItems:"start" }}>

            {/* Form */}
            <div>
              {/* Page header */}
              <div style={{ marginBottom:30 }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:"#1B4332", textTransform:"uppercase", letterSpacing:"0.1em", background:"#F0F9F4", padding:"3px 10px", borderRadius:4, display:"inline-block", marginBottom:10 }}>
                  Free — no obligation
                </span>
                <h1 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:"clamp(22px,3.5vw,36px)", color:"#0F1F17", lineHeight:1.15, marginBottom:8, letterSpacing:"-0.01em" }}>
                  Get 3 free quotes from<br />
                  <span style={{ color:"#1B4332", fontStyle:"italic" }}>local MCS installers</span>
                </h1>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:15, color:"#4B5563", lineHeight:1.65 }}>
                  Answer 5 quick questions and we'll match you with certified installers near you.
                </p>
              </div>

              {/* Step indicators */}
              <div style={{ display:"flex", alignItems:"center", marginBottom:22 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
                    <div className="step-dot" style={{
                      background: i < step ? "#1B4332" : i === step ? "#fff" : "#F0EBE3",
                      border: i === step ? "2px solid #1B4332" : i < step ? "2px solid #1B4332" : "2px solid #E4DED6",
                      color: i < step ? "#fff" : i === step ? "#1B4332" : "#9CA3AF",
                    }}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="step-line" style={{ background: i < step ? "#1B4332" : "#E4DED6" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="prog-track" style={{ marginBottom:28 }}>
                <div className="prog-fill" style={{ width:`${pct}%` }} />
              </div>

              {/* Card */}
              <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E4DED6", padding:"30px 28px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"linear-gradient(90deg,#1B4332,#52B788)" }} />

                <div className="fu" key={step}>
                  {/* Step label */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:"#1B4332", textTransform:"uppercase", letterSpacing:"0.08em", background:"#F0F9F4", padding:"2px 9px", borderRadius:4 }}>
                      {cur.title}
                    </span>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{step+1} / {total}</span>
                  </div>

                  <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:19, color:"#111827", lineHeight:1.25, marginBottom:5 }}>{cur.question}</h2>
                  {cur.hint && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#9CA3AF", marginBottom:20, lineHeight:1.5 }}>{cur.hint}</p>}

                  {/* Text cards — property type */}
                  {cur.textCards && (
                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                      {cur.options.map(o => (
                        <button key={o.value} className={`tc ${selecting===o.value?"sel":""} ${selecting&&selecting!==o.value?"fade":""}`}
                          onClick={() => pick(o.value)} aria-label={o.label}>
                          <div>
                            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:"#111827", marginBottom:2 }}>{o.label}</p>
                            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{o.desc}</p>
                          </div>
                          <span style={{ color:"#D1D5DB", fontSize:18, flexShrink:0 }}>›</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single select icon cards */}
                  {!cur.textCards && !cur.multi && !cur.isContact && (
                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                      {cur.options.map(o => (
                        <button key={o.value} className={`oic ${selecting===o.value?"sel":""} ${selecting&&selecting!==o.value?"fade":""}`}
                          onClick={() => pick(o.value)} aria-label={o.label}>
                          <div className="icw">{IC[o.icon]}</div>
                          <div style={{ flex:1 }}>
                            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:"#111827", marginBottom:2 }}>{o.label}</p>
                            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{o.note}</p>
                          </div>
                          <span style={{ color:"#D1D5DB", fontSize:18, flexShrink:0 }}>›</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Multi select */}
                  {cur.multi && (
                    <>
                      <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:14 }}>
                        {cur.options.map(o => (
                          <button key={o.value} className={`oic ${multi.includes(o.value)?"ms":""}`}
                            onClick={() => toggleMulti(o.value)} aria-pressed={multi.includes(o.value)}>
                            <div className="icw">{IC[o.icon]}</div>
                            <div style={{ flex:1 }}>
                              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:"#111827", marginBottom:2 }}>{o.label}</p>
                              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{o.note}</p>
                            </div>
                            <div className={`chk ${multi.includes(o.value)?"on":""}`}>
                              {multi.includes(o.value) && <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                      {errors.interest && <p className="errmsg" style={{ marginBottom:10 }}>{errors.interest}</p>}
                      <button className="btn-next" onClick={nextMulti}>Continue →</button>
                    </>
                  )}

                  {/* Contact form */}
                  {cur.isContact && (
                    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                      {grant && (
                        <div style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", border:"1px solid #BBF7D0", borderRadius:10, padding:"11px 15px", display:"flex", alignItems:"center", gap:11, marginBottom:4 }}>
                          <CheckCircle2 size={18} color="#166534" strokeWidth={1.75} style={{ flexShrink:0 }} />
                          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#166534", lineHeight:1.5 }}>
                            <strong>You may qualify for a {grant} grant.</strong> Your installers will confirm eligibility.
                          </p>
                        </div>
                      )}

                      {[
                        { id:"name",     label:"Full name",         req:true,  type:"text",  ph:"John Smith",       auto:"name",        hint:null },
                        { id:"email",    label:"Email address",     req:true,  type:"email", ph:"john@example.com", auto:"email",       hint:null },
                        { id:"phone",    label:"Phone number",      req:false, type:"tel",   ph:"07700 900123",     auto:"tel",         hint:"Optional — helps installers respond faster" },
                        { id:"postcode", label:"Postcode",          req:true,  type:"text",  ph:"M1 1AE",           auto:"postal-code", hint:null },
                      ].map(f => (
                        <div key={f.id}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <label style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:"#374151" }}>
                              {f.label} {f.req && <span style={{ color:"#EF4444" }}>*</span>}
                            </label>
                            {!f.req && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"#9CA3AF", background:"#F8F5F0", padding:"1px 7px", borderRadius:3 }}>Optional</span>}
                          </div>
                          <input
                            className={`finp ${errors[f.id]?"err":""}`}
                            type={f.type} placeholder={f.ph}
                            value={contact[f.id]}
                            style={f.id==="postcode"?{textTransform:"uppercase",letterSpacing:"0.05em"}:{}}
                            autoComplete={f.auto}
                            aria-label={f.label}
                            onChange={e => {
                              setContact({ ...contact, [f.id]: f.id==="postcode" ? e.target.value.toUpperCase() : e.target.value });
                              setErrors({ ...errors, [f.id]: null });
                            }}
                          />
                          {errors[f.id] && <p className="errmsg">{errors[f.id]}</p>}
                          {f.hint && !errors[f.id] && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#9CA3AF", marginTop:4 }}>{f.hint}</p>}
                        </div>
                      ))}

                      <button className="btn-cta" onClick={submit} style={{ marginTop:4 }}>
                        Get My 3 Free Quotes →
                      </button>

                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#9CA3AF", textAlign:"center", lineHeight:1.6 }}>
                        By submitting you agree to our <span style={{ color:"#1B4332", cursor:"pointer" }}>Privacy Policy</span>. Your details are only shared with up to 3 MCS-certified installers.
                      </p>
                    </div>
                  )}

                  {/* Back */}
                  {step > 0 && !cur.isContact && (
                    <button className="back-btn" style={{ marginTop:16 }} onClick={() => { setStep(step-1); setErrors({}); }}>← Back</button>
                  )}
                  {cur.isContact && (
                    <button className="back-btn" style={{ display:"block", margin:"8px auto 0" }} onClick={() => setStep(step-1)}>← Back</button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="sb" style={{ position:"sticky", top:88 }}>
              <div style={{ background:"#fff", border:"1px solid #E4DED6", borderRadius:16, padding:"22px", marginBottom:14 }}>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:"#1B4332", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>Why homeowners trust us</p>
                {[
                  { Icon:Lock,       title:"Your data, controlled",    desc:"Only shared with up to 3 local MCS-certified installers — and only to send your quote." },
                  { Icon:ShieldCheck,title:"MCS certified only",       desc:"Every installer holds the UK government's quality mark." },
                  { Icon:BadgeCheck, title:"Three quotes maximum",     desc:"Up to 3 local MCS-certified installers will get in touch with quotes. That's the cap." },
                  { Icon:CheckCircle2,title:"Local matching",          desc:"Each enquiry is matched to installers based in your area." },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} style={{ display:"flex", gap:11, marginBottom:14 }}>
                    <div style={{ width:34, height:34, background:"#F0F9F4", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={17} color="#1B4332" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:"#111827", marginBottom:2 }}>{title}</p>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#6B7280", lineHeight:1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background:"#fff", border:"1px solid #E4DED6", borderRadius:16, padding:"18px 22px", marginBottom:14, textAlign:"center" }}>
                <div style={{ display:"flex", gap:2, marginBottom:4 }}>{[1,2,3,4,5].map(i => <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>)}</div>
                <p style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:22, color:"#111827", marginBottom:3 }}>Trusted Service</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>UK homeowner reviews</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#1B4332", marginTop:5, fontWeight:600 }}>Verified BoilerSwitch reviews</p>
              </div>

              <div style={{ background:"#F0F9F4", border:"1px solid #BBF7D0", borderRadius:16, padding:"18px 22px" }}>
                <p style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:14, color:"#1B4332", lineHeight:1.65, marginBottom:10 }}>
                  "Three quotes came back within 24 hours. Straightforward process, professional installers."
                </p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#166534", fontWeight:600 }}>Sarah M. · Leeds · Verified homeowner</p>
              </div>
            </aside>
          </div>
        </div>
      ) : (

        /* Confirmation */
        <div style={{ maxWidth:580, margin:"0 auto", padding:"64px 24px", textAlign:"center" }}>
          <div className="pop" style={{ width:76, height:76, background:"linear-gradient(135deg,#D1FAE5,#A7F3D0)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 8px 24px rgba(27,67,50,0.2)" }}><CheckCircle2 size={36} color="#1B4332" strokeWidth={2} /></div>

          <h2 style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:"clamp(22px,4vw,34px)", color:"#111827", marginBottom:12, lineHeight:1.2, letterSpacing:"-0.01em" }}>
            You're all set, {contact.name.split(" ")[0]}!
          </h2>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:15, color:"#4B5563", lineHeight:1.7, marginBottom:32 }}>
            We're matching you with up to 3 MCS-certified installers near <strong>{contact.postcode}</strong>. Confirmation sent to <strong>{contact.email}</strong>.
          </p>

          <div style={{ background:"#fff", border:"1px solid #E4DED6", borderRadius:16, padding:"26px 28px", marginBottom:24, textAlign:"left" }}>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:18 }}>What happens next</p>
            {[
              { Icon:Search,      title:"We match you",           desc:`We find up to 3 MCS-certified installers near ${contact.postcode} for your requirements.` },
              { Icon:Mail,        title:"Installers reach out",   desc:"Each installer will contact you within 24 hours to arrange a free survey and quote." },
              { Icon:CheckCircle2,title:"You compare and choose", desc:"Review your quotes at your own pace. No obligation, no pressure whatsoever." },
              { Icon:Wrench,      title:"Installation day",       desc:"Your chosen installer completes the work and handles the grant application for you." },
            ].map(({ Icon, title, desc }, i) => (
              <div key={title} style={{ display:"flex", gap:14, marginBottom: i<3?18:0 }}>
                <div style={{ width:34, height:34, background:"#1B4332", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={16} color="#fff" strokeWidth={1.75} />
                </div>
                <div>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:"#111827", marginBottom:3 }}>{title}</p>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#6B7280", lineHeight:1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {grant && (
            <div style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", border:"1px solid #BBF7D0", borderRadius:12, padding:"14px 18px", marginBottom:22, textAlign:"left", display:"flex", gap:10, alignItems:"flex-start" }}>
              <CheckCircle2 size={17} color="#166534" strokeWidth={1.75} style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#166534", lineHeight:1.6 }}>
                <strong>Remember your {grant} grant</strong> — your installer applies for this on your behalf. You don't claim it separately.
              </p>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"center", gap:18, flexWrap:"wrap" }}>
            {[
              [Lock, "Data protected"],
              [ShieldCheck, "MCS certified only"],
              [BadgeCheck, "Max 3 installers"],
            ].map(([Icon, text]) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <Icon size={13} color="#9CA3AF" strokeWidth={1.75} />
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#9CA3AF" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer style={{ background:"#0A1A11", padding:"32px 28px", marginTop:32 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <span style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:15, color:"#fff" }}>BoilerSwitch.co.uk</span>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#374151" }}>© {new Date().getFullYear()} BoilerSwitch.co.uk · A comparison and information service for UK homeowners</p>
        </div>
      </footer>
    </div>
  );
}
