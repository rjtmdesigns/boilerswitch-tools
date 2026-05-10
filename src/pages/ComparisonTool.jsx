import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  Share2, Mail, Download, Check, ChevronDown, ChevronUp,
  Flame, Droplets, Zap, ThermometerSun, BatteryFull,
  BarChart2, Table, AlertCircle, Lightbulb, TrendingUp, ClipboardList
} from "lucide-react";

// ─── Calculation engine ───────────────────────────────────────────────────────

const HEATING_COSTS = {
  gas:      { annual: 1450, label: "Gas boiler",      colour: "#ef4444", icon: <Flame size={22} strokeWidth={1.75} color="#ef4444" /> },
  oil:      { annual: 1900, label: "Oil boiler",      colour: "#f97316", icon: <Droplets size={22} strokeWidth={1.75} color="#f97316" /> },
  electric: { annual: 2400, label: "Electric storage", colour: "#eab308", icon: <Zap size={22} strokeWidth={1.75} color="#eab308" /> },
};

const GRANT = { gas: 7500, oil: 9000, electric: 7500 };

const HP_RUNNING = {
  standard: { annual: 1300, label: "Standard tariff",     note: "Average UK electricity price" },
  heatpump: { annual: 950,  label: "Heat pump tariff",    note: "e.g. Octopus Cosy, E.ON Drive" },
};

const INSTALL_COST = {
  small:  { low: 8000,  high: 11000, label: "Small (1–2 bed)" },
  medium: { low: 10000, high: 13000, label: "Medium (3 bed)" },
  large:  { low: 12000, high: 15000, label: "Large (4 bed)" },
  xlarge: { low: 14000, high: 18000, label: "Very large (5+)" },
};

const buildData = (heating, size, tariff, years = 15) => {
  const boilerAnnual    = HEATING_COSTS[heating].annual;
  const hpAnnual        = HP_RUNNING[tariff].annual;
  const grant           = GRANT[heating];
  const installMid      = (INSTALL_COST[size].low + INSTALL_COST[size].high) / 2;
  const netInstall      = Math.max(0, installMid - grant);
  const boilerReplace   = 2200; // new boiler cost at year 10

  const data = [];
  let boilerCumulative = 0;
  let hpCumulative     = netInstall;

  for (let yr = 0; yr <= years; yr++) {
    if (yr > 0) {
      boilerCumulative += boilerAnnual;
      hpCumulative     += hpAnnual;
    }
    if (yr === 10) boilerCumulative += boilerReplace;

    data.push({
      year:    yr === 0 ? "Now" : `Yr ${yr}`,
      yr,
      boiler:  Math.round(boilerCumulative),
      heatpump: Math.round(hpCumulative),
      saving:  Math.round(boilerCumulative - hpCumulative),
    });
  }

  // Find crossover year
  const crossover = data.find(d => d.yr > 0 && d.heatpump <= d.boiler);

  return { data, netInstall, grant, crossover, boilerAnnual, hpAnnual };
};

const fmt = n => n < 0
  ? `-£${Math.abs(n).toLocaleString("en-GB")}`
  : `£${n.toLocaleString("en-GB")}`;

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, boilerLabel }) => {
  if (!active || !payload?.length) return null;
  const boiler = payload.find(p => p.dataKey === "boiler");
  const hp     = payload.find(p => p.dataKey === "heatpump");
  const saving = (boiler?.value || 0) - (hp?.value || 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E3DB", borderRadius: 10, padding: "14px 18px", minWidth: 180, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#6EE7B7", marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#f87171" }}>{boilerLabel}</span>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#f87171", fontWeight: 600 }}>{fmt(boiler?.value)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#1B4332" }}>Heat pump</span>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#1B4332", fontWeight: 600 }}>{fmt(hp?.value)}</span>
        </div>
        {saving !== 0 && (
          <div style={{ borderTop: "1px solid #1B4332", paddingTop: 6, marginTop: 2, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: saving >= 0 ? "#4ade80" : "#f87171" }}>
              {saving >= 0 ? "You save" : "Still paying back"}
            </span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: saving >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
              {fmt(Math.abs(saving))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Share modal ──────────────────────────────────────────────────────────────

const ShareModal = ({ onClose, heating, size, tariff }) => {
  const [email, setEmail]     = useState("");
  const [copied, setCopied]   = useState(false);
  const [sent, setSent]       = useState(false);
  const shareUrl = `https://boilerswitch.co.uk/compare?h=${heating}&s=${size}&t=${tariff}`;

  const handleCopy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmail = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSent(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 20, color: "#111827", marginBottom: 6 }}>Save or share your comparison</h3>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
          Send this to a partner, save it for later, or share it with your installer.
        </p>

        {/* Copy link */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Share a link</p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "11px 14px", background: "#F8F5F0", border: "1px solid #E4DED6", borderRadius: 8, fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shareUrl}
            </div>
            <button onClick={handleCopy} style={{ background: copied ? "#1B4332" : "#F0F7F4", border: `1.5px solid ${copied ? "#1B4332" : "#BBF7D0"}`, borderRadius: 8, padding: "0 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {copied ? <Check size={14} color="#fff" strokeWidth={2} /> : <Share2 size={14} color="#1B4332" strokeWidth={1.75} />}
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: copied ? "#fff" : "#1B4332" }}>
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Email me this comparison</p>
          {sent ? (
            <div style={{ background: "#F0F9F4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={16} color="#1B4332" strokeWidth={2} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#1B4332" }}>Sent to {email}</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmail()}
                style={{ flex: 1, padding: "11px 14px", border: "1.5px solid #E4DED6", borderRadius: 8, fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none", background: "#FAFAF7" }}
              />
              <button onClick={handleEmail} style={{ background: "linear-gradient(135deg,#D97706,#B45309)", border: "none", borderRadius: 8, padding: "0 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={14} color="#fff" strokeWidth={1.75} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#fff" }}>Send</span>
              </button>
            </div>
          )}
        </div>

        <button onClick={onClose} style={{ width: "100%", background: "none", border: "1.5px solid #E4DED6", borderRadius: 10, padding: "12px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#6B7280", cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ComparisonTool() {
  const [heating, setHeating]   = useState("gas");
  const [size, setSize]         = useState("medium");
  const [tariff, setTariff]     = useState("standard");
  const [showShare, setShare]   = useState(false);
  const [showEmail, setEmail]   = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState("chart");

  const { data, netInstall, grant, crossover, boilerAnnual, hpAnnual } =
    buildData(heating, size, tariff);

  const yr15 = data[data.length - 1];
  const saving15 = yr15.saving;
  const annualSaving = boilerAnnual - hpAnnual;
  const boilerInfo = HEATING_COSTS[heating];

  const handleEmailSave = () => {
    if (!emailVal.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;
    setEmailSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .seg { padding:8px 16px;border:1.5px solid #E4DED6;background:#fff;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;color:#6B7280;transition:all 0.2s;font-weight:500; }
        .seg:first-child{border-radius:8px 0 0 8px}
        .seg:last-child{border-radius:0 8px 8px 0}
        .seg:not(:first-child){border-left:none}
        .seg.on{background:#1B4332;border-color:#1B4332;color:#fff;z-index:1;position:relative}
        .seg:hover:not(.on){background:#F0F9F4;border-color:#1B4332;color:#1B4332}

        .card-sel{background:#fff;border:1.5px solid #E4DED6;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all 0.2s;text-align:left;width:100%}
        .card-sel:hover{border-color:#1B4332;background:#F0F7F4}
        .card-sel.on{border-color:#1B4332;background:#F0F7F4;box-shadow:0 0 0 3px rgba(27,67,50,0.1)}

        .tab-btn{padding:10px 20px;border:none;background:transparent;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;color:#9CA3AF;border-bottom:2px solid transparent;transition:all 0.2s}
        .tab-btn.on{color:#1B4332;border-bottom-color:#1B4332}

        .stat{background:#F8F5F0;border:1px solid #E4DED6;border-radius:12px;padding:16px;text-align:center}
        .stat.green{background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-color:#86EFAC}
        .stat.dark{background:linear-gradient(135deg,#0F2218,#1B4332)}

        .share-btn{display:flex;align-items:center;gap:8px;padding:11px 18px;border-radius:10px;border:1.5px solid #E4DED6;background:#fff;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#374151;transition:all 0.2s}
        .share-btn:hover{border-color:#1B4332;color:#1B4332;background:#F0F9F4}

        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.35s ease both}

        @media(max-width:768px){
          .layout{grid-template-columns:1fr !important}
          .stats-row{grid-template-columns:1fr 1fr !important}
          .heat-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "rgba(250,250,248,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E3DB", padding: "0 28px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1B4332,#2D6A4F)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 64 64" width="17" height="17" aria-hidden="true" style={{ flexShrink: 0 }}><rect x="0" y="0" width="64" height="64" rx="14" fill="rgba(255,255,255,0.15)"/><rect x="10" y="23" width="44" height="18" rx="9" fill="rgba(255,255,255,0.2)"/><circle cx="45" cy="32" r="7" fill="white"/><circle cx="19" cy="32" r="2.5" fill="rgba(255,255,255,0.35)"/></svg>
            </div>
            <span style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 16, color: "#111827" }}>
              BoilerSwitch<span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>.co.uk</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="share-btn" onClick={() => setShare(true)}>
              <Share2 size={14} strokeWidth={1.75} />
              Share comparison
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }} className="fu">
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.12em", background: "#F0F9F4", padding: "3px 12px", borderRadius: 20, display: "inline-block", marginBottom: 14 }}>
            Interactive Comparison
          </span>
          <h1 style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: "clamp(24px,4vw,40px)", color: "#0F1F17", lineHeight: 1.15, marginBottom: 10, letterSpacing: "-0.01em" }}>
            Heat pump vs your boiler —<br />
            <span style={{ color: "#1B4332", fontStyle: "italic" }}>what's the real cost over 15 years?</span>
          </h1>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "#6B7280", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            Adjust the settings to match your home. The chart updates in real time.
          </p>
        </div>

        <div className="layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 28, alignItems: "start" }}>

          {/* ── Controls ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Heating system */}
            <div style={{ background: "#fff", border: "1px solid #E4DED6", borderRadius: 16, padding: 20 }}>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Your heating system</p>
              <div className="heat-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {Object.entries(HEATING_COSTS).map(([key, val]) => (
                  <button key={key} className={`card-sel ${heating === key ? "on" : ""}`} onClick={() => setHeating(key)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: `${val.colour}15`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {val.icon}
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#111827" }}>{val.label}</p>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#9CA3AF" }}>{fmt(val.annual)}/yr avg running cost</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Property size */}
            <div style={{ background: "#fff", border: "1px solid #E4DED6", borderRadius: 16, padding: 20 }}>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Property size</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(INSTALL_COST).map(([key, val]) => (
                  <button key={key} className={`card-sel ${size === key ? "on" : ""}`} onClick={() => setSize(key)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#111827" }}>{val.label}</span>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#9CA3AF" }}>{fmt(val.low)}–{fmt(val.high)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Electricity tariff */}
            <div style={{ background: "#fff", border: "1px solid #E4DED6", borderRadius: 16, padding: 20 }}>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Electricity tariff</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(HP_RUNNING).map(([key, val]) => (
                  <button key={key} className={`card-sel ${tariff === key ? "on" : ""}`} onClick={() => setTariff(key)}>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{val.label}</p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#9CA3AF" }}>{val.note}</p>
                  </button>
                ))}
              </div>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 12px", marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Lightbulb size={14} color="#92400E" strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#78350F", lineHeight: 1.55 }}>
                  Heat pump-specific tariffs from Octopus, E.ON and EDF can cut running costs by 20–30%.
                </p>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Key stats */}
            <div className="stats-row fu" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} key={`${heating}-${size}-${tariff}`}>
              <div className="stat green">
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "#166534", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Grant available</p>
                <p style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 26, color: "#1B4332", lineHeight: 1 }}>{fmt(grant)}</p>
              </div>
              <div className="stat">
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Your net cost</p>
                <p style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 22, color: "#111827", lineHeight: 1 }}>{fmt(netInstall)}</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>after grant</p>
              </div>
              <div className="stat">
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Annual saving</p>
                <p style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 22, color: annualSaving > 0 ? "#1B4332" : "#EF4444", lineHeight: 1 }}>{fmt(annualSaving)}</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>vs {boilerInfo.label}</p>
              </div>
              <div className={`stat ${crossover ? "dark" : ""}`}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: crossover ? "#6EE7B7" : "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Break even</p>
                <p style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 22, color: crossover ? "#fff" : "#EF4444", lineHeight: 1 }}>
                  {crossover ? `Year ${crossover.yr}` : ">15 yrs"}
                </p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: crossover ? "#A7F3D0" : "#9CA3AF", marginTop: 3 }}>
                  {crossover ? "heat pump wins" : "boiler cheaper"}
                </p>
              </div>
            </div>

            {/* Chart / table tabs */}
            <div style={{ background: "#fff", border: "1px solid #E4DED6", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #E4DED6", padding: "0 20px" }}>
                {[
                  { id: "chart", label: "Chart",  Icon: BarChart2 },
                  { id: "table", label: "Table",  Icon: Table },
                ].map(({ id, label, Icon }) => (
                  <button key={id} className={`tab-btn ${activeTab === id ? "on" : ""}`} onClick={() => setActiveTab(id)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={14} strokeWidth={1.75} />
                    {label}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 4px" }}>
                  {[
                    { colour: "#ef4444", label: boilerInfo.label },
                    { colour: "#4ade80", label: "Heat pump" },
                  ].map(({ colour, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 24, height: 3, background: colour, borderRadius: 2 }} />
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#6B7280" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "24px 20px" }}>
                {activeTab === "chart" && (
                  <div className="fu" key={`chart-${heating}-${size}-${tariff}`}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="boilerGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="hpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" />
                        <XAxis dataKey="year" tick={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fill: "#9CA3AF" }} axisLine={{ stroke: "#E8E3DB" }} tickLine={false} />
                        <YAxis tick={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `£${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                        <Tooltip content={<CustomTooltip boilerLabel={boilerInfo.label} />} />
                        {crossover && (
                          <ReferenceLine x={crossover.year} stroke="#1B4332" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Break even", position: "top", fontSize: 10, fill: "#1B4332", fontFamily: "'Inter',sans-serif" }} />
                        )}
                        <Area type="monotone" dataKey="boiler" name={boilerInfo.label} stroke="#ef4444" strokeWidth={2} fill="url(#boilerGrad)" dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
                        <Area type="monotone" dataKey="heatpump" name="Heat pump" stroke="#4ade80" strokeWidth={2} fill="url(#hpGrad)" dot={false} activeDot={{ r: 4, fill: "#1B4332" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#C4BDB5", textAlign: "center", marginTop: 8 }}>
                      Includes boiler replacement at year 10 (est. £2,200). All figures are estimates — get quotes for your actual cost.
                    </p>
                  </div>
                )}

                {activeTab === "table" && (
                  <div className="fu" key={`table-${heating}-${size}-${tariff}`} style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Year", boilerInfo.label, "Heat pump", "Difference"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", background: "#1B4332", color: "#fff", textAlign: "left", fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif", letterSpacing: "0.04em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.filter(d => d.yr % 3 === 0 || d.yr === 1).map((row, i) => (
                          <tr key={row.yr} style={{ background: i % 2 === 0 ? "#fff" : "#F8F5F0" }}>
                            <td style={{ padding: "10px 14px", fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#374151" }}>{row.year}</td>
                            <td style={{ padding: "10px 14px", color: "#ef4444", fontWeight: 600 }}>{fmt(row.boiler)}</td>
                            <td style={{ padding: "10px 14px", color: "#1B4332", fontWeight: 600 }}>{fmt(row.heatpump)}</td>
                            <td style={{ padding: "10px 14px", color: row.saving >= 0 ? "#1B4332" : "#ef4444", fontWeight: 700 }}>
                              {row.saving >= 0 ? `+${fmt(row.saving)}` : fmt(row.saving)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 15 year verdict */}
            <div style={{ background: saving15 > 0 ? "linear-gradient(135deg,#0F2218,#1B4332)" : "linear-gradient(135deg,#2a1010,#3a1515)", borderRadius: 16, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: saving15 > 0 ? "#6EE7B7" : "#f87171", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  Over 15 years, a heat pump
                </p>
                <p style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: "clamp(18px,3vw,26px)", color: "#fff", lineHeight: 1.2 }}>
                  {saving15 > 0
                    ? `saves you ${fmt(saving15)} vs your ${boilerInfo.label}`
                    : `costs ${fmt(Math.abs(saving15))} more than keeping your ${boilerInfo.label}`}
                </p>
                {crossover && (
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#A7F3D0", marginTop: 8 }}>
                    You break even at year {crossover.yr} — then it's pure savings from there.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                <a href="/get-quotes" style={{ background: "linear-gradient(135deg,#D97706,#B45309)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(180,83,9,0.35)", textDecoration: "none", display: "inline-block", textAlign: "center" }}>
                  Get quotes for your home →
                </a>
                <button className="share-btn" onClick={() => setShare(true)} style={{ justifyContent: "center" }}>
                  <Share2 size={14} strokeWidth={1.75} />
                  Save this comparison
                </button>
              </div>
            </div>

            {/* Email save strip */}
            {!emailSent ? (
              <div style={{ background: "#fff", border: "1px solid #E4DED6", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Mail size={18} color="#1B4332" strokeWidth={1.75} style={{ flexShrink: 0 }} />
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#374151", flex: 1, minWidth: 160 }}>
                  <strong>Email me this comparison</strong> — I'll also send you our guide on choosing the right installer.
                </p>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={emailVal}
                    onChange={e => setEmailVal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEmailSave()}
                    style={{ padding: "10px 14px", border: "1.5px solid #E4DED6", borderRadius: 8, fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none", width: 200, background: "#FAFAF7" }}
                  />
                  <button onClick={handleEmailSave} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "#F0F9F4", border: "1px solid #BBF7D0", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <Check size={18} color="#1B4332" strokeWidth={2} />
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#1B4332" }}>
                  <strong>Sent to {emailVal}</strong> — check your inbox. We've also added you to the BoilerSwitch newsletter (unsubscribe anytime).
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Share modal */}
      {showShare && <ShareModal onClose={() => setShare(false)} heating={heating} size={size} tariff={tariff} />}
    </div>
  );
}
