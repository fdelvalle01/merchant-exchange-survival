import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   MERCHANT EXCHANGE SURVIVAL — Royal Trading Desk
   Medieval window-manager workstation (Diablo / Black Desert style)
   ═══════════════════════════════════════════════════════════════ */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cinzel+Decorative:wght@700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

:root{
  --abyss:#0b0805;
  --iron:#171107;
  --panel:#1a130a;
  --panel-2:#221809;
  --ember:#c9974a;
  --gold:#e3b96b;
  --gold-dim:#8a6d3b;
  --parchment:#e9dcc0;
  --ash:#9b8a6c;
  --blood:#d65a4a;
  --blood-deep:#7a2018;
  --venom:#7fc46e;
  --arcane:#7e9fd6;
  --rune:#caa0e8;
}
*{box-sizing:border-box}
.mes-root{
  font-family:'IBM Plex Mono',monospace;
  background:
    radial-gradient(ellipse 70% 50% at 50% -10%, rgba(201,151,74,0.07), transparent 60%),
    radial-gradient(ellipse 50% 60% at 100% 110%, rgba(122,32,24,0.10), transparent 60%),
    var(--abyss);
  color:var(--parchment);
  height:100vh; width:100vw; overflow:hidden; position:relative;
  user-select:none;
}
.mes-root::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  mix-blend-mode:overlay;
}
.cinzel{font-family:'Cinzel',serif}
.cinzel-deco{font-family:'Cinzel Decorative',serif}

/* ─── ornate window frame ─── */
.mes-win{
  position:absolute;
  background:linear-gradient(180deg, var(--panel-2) 0%, var(--panel) 14%, #140e06 100%);
  border:1px solid #3a2c14;
  box-shadow:
    0 0 0 1px #000,
    0 18px 50px rgba(0,0,0,0.75),
    inset 0 1px 0 rgba(227,185,107,0.12);
  display:flex; flex-direction:column;
}
.mes-win.focused{
  border-color:var(--gold-dim);
  box-shadow:
    0 0 0 1px #000,
    0 18px 60px rgba(0,0,0,0.85),
    0 0 24px rgba(201,151,74,0.10),
    inset 0 1px 0 rgba(227,185,107,0.22);
}
.corner{position:absolute; width:17px; height:17px; pointer-events:none; z-index:3}
.corner svg{display:block}
.c-tl{top:-4px; left:-4px}
.c-tr{top:-4px; right:-4px; transform:scaleX(-1)}
.c-bl{bottom:-4px; left:-4px; transform:scaleY(-1)}
.c-br{bottom:-4px; right:-4px; transform:scale(-1)}

.mes-titlebar{
  display:flex; align-items:center; gap:8px;
  padding:7px 10px;
  background:linear-gradient(180deg,#2b1f0d,#1c1408 60%,#150f06);
  border-bottom:1px solid #3a2c14;
  cursor:grab;
}
.mes-titlebar:active{cursor:grabbing}
.win-rune{
  width:18px;height:18px;border:1px solid var(--gold-dim);
  display:flex;align-items:center;justify-content:center;
  font-size:10px;color:var(--gold);
  background:radial-gradient(circle,#2e2008,#170f04);
  transform:rotate(45deg)
}
.win-rune span{transform:rotate(-45deg)}
.win-title{
  font-family:'Cinzel',serif; font-weight:700; font-size:12px;
  letter-spacing:0.22em; color:var(--gold);
  text-shadow:0 0 12px rgba(227,185,107,0.35), 0 1px 0 #000;
  flex:1;
}
.win-btn{
  width:18px;height:18px; font-size:10px; line-height:1;
  border:1px solid #4a3819; color:var(--ash);
  background:linear-gradient(180deg,#241a0b,#150e05);
  cursor:pointer; display:flex;align-items:center;justify-content:center;
}
.win-btn:hover{color:var(--gold); border-color:var(--gold-dim); text-shadow:0 0 8px var(--ember)}
.win-btn.close:hover{color:var(--blood); border-color:var(--blood-deep)}

.mes-body{flex:1; overflow:auto; padding:12px}
.mes-body::-webkit-scrollbar{width:9px}
.mes-body::-webkit-scrollbar-track{background:#0e0903}
.mes-body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#4a3819,#2b1f0d); border:1px solid #000}

/* ─── ticker ─── */
.ticker-wrap{
  border-top:1px solid #3a2c14; border-bottom:1px solid #3a2c14;
  background:linear-gradient(180deg,#150f06,#0d0905);
  overflow:hidden; white-space:nowrap; position:relative;
}
.ticker-inner{display:inline-block; animation:tick 42s linear infinite; padding:6px 0}
@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion: reduce){ .ticker-inner{animation:none} .flicker{animation:none} }

/* ─── stat plates ─── */
.plate{
  border:1px solid #3a2c14; padding:9px 11px;
  background:
    linear-gradient(135deg, rgba(227,185,107,0.05), transparent 40%),
    #150f06;
  box-shadow:inset 0 1px 0 rgba(227,185,107,0.07), inset 0 -6px 12px rgba(0,0,0,0.5);
}
.plate-label{font-size:9px; letter-spacing:0.2em; color:var(--ash); text-transform:uppercase}
.plate-value{font-family:'Cinzel',serif; font-weight:700; font-size:17px; margin-top:3px; text-shadow:0 0 14px rgba(227,185,107,0.2)}

/* ─── rows / tables ─── */
.mkt-row{
  display:grid; grid-template-columns:18px 1fr 76px 70px 64px 54px;
  gap:6px; align-items:center; padding:7px 8px; font-size:11px;
  border-bottom:1px solid rgba(58,44,20,0.5); cursor:pointer;
}
.mkt-row:hover{background:linear-gradient(90deg, rgba(201,151,74,0.10), transparent 75%)}
.mkt-row.sel{background:linear-gradient(90deg, rgba(201,151,74,0.16), rgba(201,151,74,0.03)); border-left:2px solid var(--gold)}
.up{color:var(--venom)} .down{color:var(--blood)}
.sig{font-size:9px; letter-spacing:0.12em; padding:2px 5px; border:1px solid; text-align:center}
.sig-buy{color:var(--venom); border-color:rgba(127,196,110,0.4)}
.sig-watch{color:var(--ember); border-color:rgba(201,151,74,0.4)}
.sig-flee{color:var(--blood); border-color:rgba(214,90,74,0.4)}

/* ─── herald ─── */
.scroll-card{
  border:1px solid #3a2c14; margin-bottom:10px; padding:10px 12px;
  background:linear-gradient(180deg, rgba(233,220,192,0.035), transparent 50%), #150f06;
  position:relative;
}
.scroll-card::before{
  content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
}
.scroll-card.critical::before{background:linear-gradient(180deg,var(--blood),var(--blood-deep)); box-shadow:0 0 10px rgba(214,90,74,0.5)}
.scroll-card.high::before{background:linear-gradient(180deg,var(--ember),#6b4d1d)}
.scroll-card.omen::before{background:linear-gradient(180deg,var(--rune),#4b3563)}
.sev{font-size:8px; letter-spacing:0.18em; padding:2px 6px; border:1px solid}
.sev-critical{color:var(--blood); border-color:var(--blood-deep); animation:flicker 1.6s infinite}
.sev-high{color:var(--ember); border-color:var(--gold-dim)}
.sev-omen{color:var(--rune); border-color:#4b3563}
@keyframes flicker{0%,100%{opacity:1}45%{opacity:1}50%{opacity:.55}55%{opacity:1}80%{opacity:.8}}
.flicker{animation:flicker 1.6s infinite}

/* ─── buttons ─── */
.btn-seal{
  font-family:'Cinzel',serif; font-weight:700; letter-spacing:0.2em; font-size:11px;
  padding:9px 0; width:100%; cursor:pointer; border:1px solid var(--gold-dim);
  color:#1a1206;
  background:linear-gradient(180deg,#e8c47a,#c9974a 55%,#9a7236);
  box-shadow:0 0 16px rgba(201,151,74,0.25), inset 0 1px 0 rgba(255,240,200,0.6);
  text-shadow:0 1px 0 rgba(255,235,190,0.4);
}
.btn-seal:hover{filter:brightness(1.12)}
.btn-seal:active{transform:translateY(1px)}
.btn-ghost{
  font-family:'Cinzel',serif; font-weight:700; letter-spacing:0.15em; font-size:10px;
  padding:7px 0; width:100%; cursor:pointer;
  border:1px solid #3a2c14; color:var(--ash); background:#140e06;
}
.btn-ghost.on{color:var(--parchment); border-color:var(--gold-dim); background:linear-gradient(180deg,#2b1f0d,#1a1308); box-shadow:inset 0 0 12px rgba(201,151,74,0.15)}
.btn-ghost.sell-on{color:var(--blood); border-color:var(--blood-deep); box-shadow:inset 0 0 12px rgba(122,32,24,0.3)}

/* ─── dock ─── */
.dock-btn{
  display:flex; flex-direction:column; align-items:center; gap:4px;
  padding:9px 4px; cursor:pointer; border:1px solid transparent;
  color:var(--ash); font-size:8px; letter-spacing:0.12em; width:100%;
}
.dock-btn:hover{color:var(--gold)}
.dock-btn.active{
  color:var(--gold); border-color:#3a2c14;
  background:linear-gradient(180deg, rgba(201,151,74,0.10), transparent);
  box-shadow:inset 0 0 14px rgba(201,151,74,0.08);
}
.dock-ico{font-size:16px; filter:drop-shadow(0 0 6px rgba(201,151,74,0.4))}

input.qty{
  width:100%; background:#0e0903; border:1px solid #3a2c14; color:var(--parchment);
  font-family:'IBM Plex Mono',monospace; font-size:13px; padding:8px 10px; outline:none;
}
input.qty:focus{border-color:var(--gold-dim); box-shadow:0 0 10px rgba(201,151,74,0.15)}
select.asset-sel{
  width:100%; background:#0e0903; border:1px solid #3a2c14; color:var(--parchment);
  font-family:'IBM Plex Mono',monospace; font-size:11px; padding:8px; outline:none;
}
.divider-rune{
  display:flex; align-items:center; gap:8px; color:var(--gold-dim); font-size:9px; letter-spacing:0.3em;
  margin:10px 0 8px;
}
.divider-rune::before,.divider-rune::after{content:''; flex:1; height:1px; background:linear-gradient(90deg,transparent,#3a2c14,transparent)}
`;

/* ─── corner ornament (engraved bracket) ─── */
const Corner = ({ pos }) => (
  <div className={`corner c-${pos}`}>
    <svg width="17" height="17" viewBox="0 0 17 17">
      <path d="M1 16 L1 5 Q1 1 5 1 L16 1" fill="none" stroke="#e3b96b" strokeWidth="1.6" opacity="0.85"/>
      <path d="M1 16 L1 5 Q1 1 5 1 L16 1" fill="none" stroke="#000" strokeWidth="3.4" opacity="0.5" transform="translate(1.2,1.2)"/>
      <circle cx="4.5" cy="4.5" r="1.6" fill="#e3b96b"/>
    </svg>
  </div>
);

/* ─── seeded market data ─── */
const ASSETS_INIT = [
  { id: "SCB", name: "Silvercrown Bank",      icon: "🏦", price: 5.76,  base: 7.20, signal: "FLEE"  },
  { id: "BHS", name: "Black Harbor Shipping", icon: "⚓", price: 4.40,  base: 5.50, signal: "WATCH" },
  { id: "ODB", name: "Old Dragon Brewery",    icon: "🍺", price: 3.84,  base: 4.80, signal: "WATCH" },
  { id: "IHM", name: "Ironhill Mines",        icon: "⛏️", price: 5.69,  base: 5.10, signal: "BUY"   },
  { id: "NWL", name: "Northwind Logistics",   icon: "🐎", price: 3.09,  base: 3.90, signal: "WATCH" },
  { id: "ARG", name: "Arcane Research Guild", icon: "🔮", price: 10.44, base: 8.60, signal: "BUY"   },
  { id: "RGC", name: "Royal Grain Company",   icon: "🌾", price: 4.10,  base: 4.30, signal: "WATCH" },
];

const NEWS_INIT = [
  { sev: "high", tag: "Industrial Safety", title: "Mining Accident Reported", impact: -10.4, asset: "Ironhill Mines",
    body: "A collapsed shaft has halted ore lifts at Ironhill. Guild inspectors ordered a shutdown while crews search the lower tunnels." },
  { sev: "critical", tag: "Banking Houses", title: "Silvercrown Liquidity Crisis", impact: -18.3, asset: "Silvercrown Bank",
    body: "Fear spreads across the banking houses after a sudden liquidity shock. Merchant houses are pulling funds until the ledgers settle." },
  { sev: "omen", tag: "Arcane Affairs", title: "Comet Sighted Over the Capital", impact: +12.1, asset: "Arcane Research Guild",
    body: "Court astronomers demand new instruments. The Arcane Guild's order book overflows with royal commissions." },
];

const RANDOM_EVENTS = [
  { sev: "critical", tag: "War Council",   title: "Border Skirmish Reported",    impact: -7.2,  asset: "Northwind Logistics", body: "Caravan routes through the northern pass are closed by royal decree. Shipments delayed indefinitely." },
  { sev: "high",     tag: "Harvest Watch", title: "Blight Found in West Fields", impact: -5.8,  asset: "Royal Grain Company", body: "Inspectors burned three silos at dawn. Grain futures tremble in the exchange hall." },
  { sev: "omen",     tag: "Tavern Rumors", title: "Dragon Ale Wins Royal Favor", impact: +9.4,  asset: "Old Dragon Brewery",  body: "The crown prince was seen ordering three barrels for the solstice feast. Demand surges across taverns." },
  { sev: "high",     tag: "Harbor Master", title: "Storm Fleet Returns Intact",  impact: +6.1,  asset: "Black Harbor Shipping", body: "Against all omens, the autumn fleet returned with full holds. Insurance houses exhale." },
];

const fmt = (n) => "$" + n.toFixed(3).replace(".", ",");
const now = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ─── draggable window shell ─── */
function Win({ id, title, rune, geo, z, focused, onFocus, onClose, onMin, onDrag, children, width }) {
  const dragRef = useRef(null);
  const startDrag = (e) => {
    onFocus(id);
    const startX = e.clientX, startY = e.clientY;
    const ox = geo.x, oy = geo.y;
    const move = (ev) => onDrag(id, ox + ev.clientX - startX, oy + ev.clientY - startY);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  return (
    <div
      ref={dragRef}
      className={`mes-win ${focused ? "focused" : ""}`}
      style={{ left: geo.x, top: geo.y, width: width || geo.w, height: geo.h, zIndex: z }}
      onMouseDown={() => onFocus(id)}
    >
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div className="mes-titlebar" onMouseDown={startDrag}>
        <div className="win-rune"><span>{rune}</span></div>
        <div className="win-title">{title}</div>
        <button className="win-btn" onMouseDown={(e) => e.stopPropagation()} onClick={() => onMin(id)}>—</button>
        <button className="win-btn close" onMouseDown={(e) => e.stopPropagation()} onClick={() => onClose(id)}>✕</button>
      </div>
      <div className="mes-body">{children}</div>
    </div>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function MerchantExchangeSurvival() {
  const [assets, setAssets] = useState(ASSETS_INIT);
  const [news, setNews] = useState(NEWS_INIT);
  const [selected, setSelected] = useState("SCB");
  const [side, setSide] = useState("BUY");
  const [qty, setQty] = useState(10);
  const [orders, setOrders] = useState([
    { id: "ORD-013", t: "03:31:21", asset: "Old Dragon Brewery", side: "BUY",  qty: 10, price: 4.372, status: "FILLED" },
    { id: "ORD-012", t: "03:31:18", asset: "Black Harbor Shipping", side: "BUY", qty: 10, price: 5.010, status: "FILLED" },
    { id: "ORD-011", t: "03:29:50", asset: "Silvercrown Bank", side: "SELL", qty: 10, price: 7.044, status: "FILLED" },
    { id: "ORD-010", t: "03:28:42", asset: "Silvercrown Bank", side: "BUY",  qty: 10, price: 6.389, status: "FILLED" },
  ]);
  const [cash, setCash] = useState(18316);
  const [holdings, setHoldings] = useState({ BHS: 10, ODB: 10 });
  const ordSeq = useRef(14);

  /* window manager state */
  const [wins, setWins] = useState({
    company: { open: true, x: 18,  y: 64,  w: 460, h: 430 },
    market:  { open: true, x: 496, y: 64,  w: 540, h: 380 },
    ticket:  { open: true, x: 1054,y: 64,  w: 300, h: 470 },
    herald:  { open: true, x: 496, y: 458, w: 540, h: 300 },
    ledger:  { open: true, x: 18,  y: 508, w: 460, h: 250 },
  });
  const [zOrder, setZOrder] = useState(["company", "ledger", "herald", "market", "ticket"]);
  const focusWin = useCallback((id) => setZOrder((zo) => [...zo.filter((w) => w !== id), id]), []);
  const closeWin = (id) => setWins((w) => ({ ...w, [id]: { ...w[id], open: false } }));
  const toggleWin = (id) => { setWins((w) => ({ ...w, [id]: { ...w[id], open: !w[id].open } })); focusWin(id); };
  const dragWin = (id, x, y) => setWins((w) => ({ ...w, [id]: { ...w[id], x: Math.max(0, x), y: Math.max(40, y) } }));

  /* market simulation: random walk + occasional kingdom events */
  useEffect(() => {
    const iv = setInterval(() => {
      setAssets((as) => as.map((a) => {
        const drift = (a.base - a.price) * 0.004;
        const shock = (Math.random() - 0.5) * 0.06;
        const p = Math.max(0.5, a.price + drift + shock);
        return { ...a, price: p };
      }));
    }, 1400);
    const ev = setInterval(() => {
      if (Math.random() < 0.45) {
        const e = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setNews((n) => [{ ...e, time: now() }, ...n].slice(0, 12));
        setAssets((as) => as.map((a) => a.name === e.asset ? { ...a, price: Math.max(0.5, a.price * (1 + e.impact / 100)) } : a));
      }
    }, 9000);
    return () => { clearInterval(iv); clearInterval(ev); };
  }, []);

  const sel = assets.find((a) => a.id === selected);
  const portfolioValue = Object.entries(holdings).reduce((s, [id, q]) => {
    const a = assets.find((x) => x.id === id); return s + (a ? a.price * q * 1000 : 0);
  }, 0);
  const companyValue = cash + portfolioValue;

  const sendOrder = () => {
    const q = Math.max(1, Number(qty) || 1);
    const total = sel.price * q * 1000;
    if (side === "BUY" && total > cash) {
      setNews((n) => [{ sev: "critical", tag: "Counting House", title: "Order Rejected: Insufficient Coin", impact: 0, asset: sel.name, time: now(),
        body: `The counting house refuses the seal. Required ${fmt(total / 1000)}k, treasury holds ${fmt(cash / 1000)}k.` }, ...n].slice(0, 12));
      return;
    }
    if (side === "SELL" && (holdings[sel.id] || 0) < q) {
      setNews((n) => [{ sev: "critical", tag: "Counting House", title: "Order Rejected: No Holdings", impact: 0, asset: sel.name, time: now(),
        body: "You cannot sell what your vault does not contain. The clerk stamps the parchment: REJECTED." }, ...n].slice(0, 12));
      return;
    }
    setCash((c) => side === "BUY" ? c - total : c + total);
    setHoldings((h) => ({ ...h, [sel.id]: (h[sel.id] || 0) + (side === "BUY" ? q : -q) }));
    setOrders((o) => [{ id: `ORD-${String(ordSeq.current++).padStart(3, "0")}`, t: now(), asset: sel.name, side, qty: q, price: sel.price, status: "FILLED" }, ...o].slice(0, 30));
  };

  const chg = (a) => ((a.price - a.base) / a.base) * 100;
  const tickerItems = [...assets, ...assets];

  const DOCK = [
    { id: "company", ico: "🏰", label: "COMPANY" },
    { id: "market",  ico: "⚖️", label: "MARKET" },
    { id: "ticket",  ico: "📜", label: "TICKET" },
    { id: "herald",  ico: "📯", label: "HERALD" },
    { id: "ledger",  ico: "🗝️", label: "LEDGER" },
  ];

  return (
    <div className="mes-root">
      <style>{FONTS}</style>

      {/* ── top bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 16px", borderBottom: "1px solid #3a2c14",
        background: "linear-gradient(180deg,#1d1509,#120c05)" }}>
        <div style={{ width: 30, height: 30, border: "1px solid var(--gold-dim)", transform: "rotate(45deg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle,#3a2810,#170f04)", boxShadow: "0 0 14px rgba(201,151,74,0.3)" }}>
          <span style={{ transform: "rotate(-45deg)", fontSize: 15 }}>⚜️</span>
        </div>
        <div>
          <div className="cinzel-deco" style={{ fontSize: 15, color: "var(--gold)", letterSpacing: "0.14em",
            textShadow: "0 0 18px rgba(227,185,107,0.45), 0 2px 0 #000" }}>
            MERCHANT EXCHANGE SURVIVAL
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.34em", color: "var(--ash)" }}>ROYAL TRADING DESK · GUILD CHARTER MB-01</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: "var(--ash)" }}>⚔️ trader <span style={{ color: "var(--gold)" }}>TRADER OF THE REALM</span></div>
        <div className="plate" style={{ padding: "4px 12px" }}>
          <span className="cinzel" style={{ fontSize: 11, color: "var(--gold)" }}>🕯️ {now().slice(0, 5)}</span>
        </div>
      </div>

      {/* ── ticker ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {tickerItems.map((a, i) => {
            const c = chg(a);
            return (
              <span key={i} style={{ margin: "0 22px", fontSize: 11 }}>
                <span style={{ marginRight: 6 }}>{a.icon}</span>
                <span className="cinzel" style={{ color: "var(--parchment)", fontWeight: 700, letterSpacing: "0.08em" }}>{a.name.toUpperCase()}</span>
                <span style={{ margin: "0 8px", color: "var(--gold)" }}>{fmt(a.price)}</span>
                <span className={c >= 0 ? "up" : "down"}>{c >= 0 ? "▲" : "▼"} {Math.abs(c).toFixed(2)}%</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* ── left dock ── */}
      <div style={{ position: "absolute", left: 0, top: 86, bottom: 26, width: 62, borderRight: "1px solid #3a2c14",
        background: "linear-gradient(180deg,#150f06,#0d0905)", display: "flex", flexDirection: "column", gap: 2, padding: "10px 5px", zIndex: 500 }}>
        {DOCK.map((d) => (
          <div key={d.id} className={`dock-btn ${wins[d.id].open ? "active" : ""}`} onClick={() => toggleWin(d.id)}>
            <span className="dock-ico">{d.ico}</span>
            <span className="cinzel" style={{ fontWeight: 700 }}>{d.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div className="dock-btn"><span className="dock-ico flicker">🔥</span><span className="cinzel">LIVE</span></div>
      </div>

      {/* ════ WINDOWS ════ */}

      {wins.company.open && (
        <Win id="company" title="COMPANY KEEP" rune="♜" geo={wins.company} z={100 + zOrder.indexOf("company")}
          focused={zOrder[zOrder.length - 1] === "company"} onFocus={focusWin} onClose={closeWin} onMin={closeWin} onDrag={dragWin}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div className="plate"><div className="plate-label">Treasury</div><div className="plate-value" style={{ color: "var(--gold)" }}>{fmt(cash / 1000)}k</div></div>
            <div className="plate"><div className="plate-label">Debt to Crown</div><div className="plate-value">$0</div></div>
            <div className="plate"><div className="plate-label">House Value</div><div className="plate-value" style={{ color: "var(--gold)" }}>{fmt(companyValue / 1000)}k</div></div>
            <div className="plate"><div className="plate-label">Vault Holdings</div><div className="plate-value">{fmt(portfolioValue / 1000)}k</div></div>
            <div className="plate"><div className="plate-label">Peril Level</div><div className="plate-value" style={{ color: "var(--ember)" }}>MEDIUM</div></div>
            <div className="plate"><div className="plate-label">Guild Renown</div><div className="plate-value">50 ⭐</div></div>
          </div>
          <div className="divider-rune">✦ VAULT INVENTORY ✦</div>
          {Object.entries(holdings).filter(([, q]) => q > 0).length === 0 && (
            <div style={{ fontSize: 10, color: "var(--ash)", textAlign: "center", padding: 16 }}>
              The vault stands empty. Acquire holdings from the Market Board.
            </div>
          )}
          {Object.entries(holdings).filter(([, q]) => q > 0).map(([id, q]) => {
            const a = assets.find((x) => x.id === id);
            const c = chg(a);
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderBottom: "1px solid rgba(58,44,20,0.5)", fontSize: 11 }}>
                <span>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ color: "var(--ash)" }}>×{q}</span>
                <span style={{ color: "var(--gold)", width: 70, textAlign: "right" }}>{fmt(a.price * q)}</span>
                <span className={c >= 0 ? "up" : "down"} style={{ width: 60, textAlign: "right" }}>{c >= 0 ? "+" : ""}{c.toFixed(1)}%</span>
              </div>
            );
          })}
        </Win>
      )}

      {wins.market.open && (
        <Win id="market" title="MARKET BOARD" rune="⚖" geo={wins.market} z={100 + zOrder.indexOf("market")}
          focused={zOrder[zOrder.length - 1] === "market"} onFocus={focusWin} onClose={closeWin} onMin={closeWin} onDrag={dragWin}>
          <div className="mkt-row" style={{ cursor: "default", color: "var(--ash)", fontSize: 9, letterSpacing: "0.15em" }}>
            <span /><span>ASSET</span><span style={{ textAlign: "right" }}>LAST</span><span style={{ textAlign: "right" }}>CHANGE</span><span style={{ textAlign: "right" }}>BASE</span><span style={{ textAlign: "center" }}>OMEN</span>
          </div>
          {assets.map((a) => {
            const c = chg(a);
            return (
              <div key={a.id} className={`mkt-row ${selected === a.id ? "sel" : ""}`} onClick={() => setSelected(a.id)}>
                <span>{a.icon}</span>
                <span className="cinzel" style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.04em" }}>{a.name}</span>
                <span style={{ textAlign: "right", color: "var(--gold)" }}>{fmt(a.price)}</span>
                <span className={c >= 0 ? "up" : "down"} style={{ textAlign: "right" }}>{c >= 0 ? "+" : ""}{c.toFixed(2)}%</span>
                <span style={{ textAlign: "right", color: "var(--ash)" }}>{fmt(a.base)}</span>
                <span className={`sig ${a.signal === "BUY" ? "sig-buy" : a.signal === "FLEE" ? "sig-flee" : "sig-watch"}`}>{a.signal}</span>
              </div>
            );
          })}
        </Win>
      )}

      {wins.ticket.open && (
        <Win id="ticket" title="ROYAL TICKET" rune="✠" geo={wins.ticket} z={100 + zOrder.indexOf("ticket")}
          focused={zOrder[zOrder.length - 1] === "ticket"} onFocus={focusWin} onClose={closeWin} onMin={closeWin} onDrag={dragWin}>
          <div className="plate-label" style={{ marginBottom: 5 }}>Asset Under Seal</div>
          <select className="asset-sel" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 0" }}>
            <button className={`btn-ghost ${side === "BUY" ? "on" : ""}`} onClick={() => setSide("BUY")}>⚔️ ACQUIRE</button>
            <button className={`btn-ghost ${side === "SELL" ? "sell-on" : ""}`} onClick={() => setSide("SELL")}>🛡️ RELEASE</button>
          </div>
          <div className="plate-label" style={{ marginBottom: 5 }}>Quantity (lots ×1000)</div>
          <input className="qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          <div className="plate" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{sel.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="cinzel" style={{ fontSize: 19, fontWeight: 900, color: "var(--gold)", textShadow: "0 0 16px rgba(227,185,107,0.4)" }}>{fmt(sel.price)}</div>
              <div style={{ fontSize: 9, color: "var(--ash)" }}>Base value {fmt(sel.base)}</div>
            </div>
            <span className={chg(sel) >= 0 ? "up" : "down"} style={{ fontSize: 12 }}>{chg(sel) >= 0 ? "+" : ""}{chg(sel).toFixed(2)}%</span>
          </div>
          <div className="plate" style={{ marginTop: 8 }}>
            <div className="plate-label">Total Tribute</div>
            <div className="plate-value">{fmt(sel.price * Math.max(1, Number(qty) || 1))}k</div>
          </div>
          <div style={{ fontSize: 9, color: "var(--ash)", margin: "10px 0", lineHeight: 1.5 }}>
            The price is set by the exchange engine; the counting house verifies your seal before filling.
          </div>
          <button className="btn-seal" onClick={sendOrder}>🕯️ STAMP & SEND {side}</button>
        </Win>
      )}

      {wins.herald.open && (
        <Win id="herald" title="GUILD HERALD" rune="📯" geo={wins.herald} z={100 + zOrder.indexOf("herald")}
          focused={zOrder[zOrder.length - 1] === "herald"} onFocus={focusWin} onClose={closeWin} onMin={closeWin} onDrag={dragWin}>
          {news.map((n, i) => (
            <div key={i} className={`scroll-card ${n.sev}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span className={`sev sev-${n.sev}`}>{n.sev.toUpperCase()}</span>
                <span style={{ fontSize: 9, color: "var(--ash)", letterSpacing: "0.1em" }}>{n.time || "28/5, 03:46"} · {n.tag}</span>
                <span style={{ flex: 1 }} />
                {n.impact !== 0 && <span className={n.impact >= 0 ? "up" : "down"} style={{ fontSize: 11, fontWeight: 700 }}>{n.impact > 0 ? "+" : ""}{n.impact}%</span>}
              </div>
              <div className="cinzel" style={{ fontWeight: 700, fontSize: 13, color: "var(--parchment)", marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 10, color: "var(--ash)", lineHeight: 1.55 }}>{n.body}</div>
              <div style={{ marginTop: 7 }}>
                <span style={{ fontSize: 9, border: "1px solid #3a2c14", padding: "2px 7px", color: "var(--ember)" }}>{n.asset}</span>
              </div>
            </div>
          ))}
        </Win>
      )}

      {wins.ledger.open && (
        <Win id="ledger" title="TRADE LEDGER" rune="🗝" geo={wins.ledger} z={100 + zOrder.indexOf("ledger")}
          focused={zOrder[zOrder.length - 1] === "ledger"} onFocus={focusWin} onClose={closeWin} onMin={closeWin} onDrag={dragWin}>
          {orders.map((o) => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "70px 64px 1fr 44px 30px 64px", gap: 6, alignItems: "center",
              padding: "6px 4px", borderBottom: "1px solid rgba(58,44,20,0.5)", fontSize: 10 }}>
              <span style={{ color: "var(--ash)" }}>{o.id}</span>
              <span style={{ color: "var(--ash)" }}>{o.t}</span>
              <span>{o.asset}</span>
              <span className={o.side === "BUY" ? "up" : "down"} style={{ fontWeight: 700 }}>{o.side}</span>
              <span style={{ textAlign: "right" }}>×{o.qty}</span>
              <span style={{ textAlign: "right", color: "var(--gold)" }}>{fmt(o.price)}</span>
            </div>
          ))}
        </Win>
      )}

      {/* ── status bar ── */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, borderTop: "1px solid #3a2c14",
        background: "linear-gradient(180deg,#150f06,#0b0805)", display: "flex", alignItems: "center", gap: 18,
        padding: "0 14px", fontSize: 9, color: "var(--ash)", letterSpacing: "0.12em", zIndex: 600 }}>
        <span><span className="flicker" style={{ color: "var(--venom)" }}>●</span> CONNECTED TO THE EXCHANGE HALL</span>
        <span>ASSETS {assets.length}</span>
        <span>WINDOWS {Object.values(wins).filter((w) => w.open).length}</span>
        <span>ORDERS {orders.length}</span>
        <span style={{ flex: 1 }} />
        <span className="cinzel" style={{ color: "var(--gold-dim)" }}>MES DESK · FORGED IN THE GUILD HALLS · v0.2</span>
      </div>
    </div>
  );
}
