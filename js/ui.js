/* SubTrack UI helpers — icons, formatting, toast, sheet */
(function(){
  const ST = window.ST = window.ST || {};

  /* --- inline SVG icons (stroke, tabler-like) --- */
  const P = {
    plus:'<path d="M12 5v14M5 12h14"/>',
    search:'<circle cx="10" cy="10" r="7"/><path d="m21 21-6-6"/>',
    chevR:'<path d="m9 6 6 6-6 6"/>',
    chevL:'<path d="m15 6-6 6 6 6"/>',
    bell:'<path d="M10 5a2 2 0 1 1 4 0 7 7 0 0 1 4 6v3l2 3H4l2-3v-3a7 7 0 0 1 4-6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/>',
    grid:'<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    chart:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 14 4-4 3 3 5-6"/>',
    calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    check:'<path d="m5 12 5 5L20 7"/>',
    trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
    edit:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3z"/><path d="m13.5 6.5 3 3"/>',
    pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    play:'<path d="M7 4v16l13-8z"/>',
    downRight:'<path d="M7 7l10 10M17 8v9H8"/>',
    upRight:'<path d="M17 17 7 7M7 16V7h9"/>',
    ext:'<path d="M12 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/><path d="M11 13 20 4M15 4h5v5"/>',
    lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    tv:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m8 3 4 4 4-4"/>',
    music:'<circle cx="6" cy="17" r="3"/><circle cx="16" cy="15" r="3"/><path d="M9 17V6l10-2v11"/>',
    bot:'<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v1M15 13v1M8 4h8"/>',
    bolt:'<path d="M13 3 4 14h6l-1 7 9-11h-6z"/>',
    cloud:'<path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17 18z"/>',
    gamepad:'<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M16 11h.01M18 13h.01"/>',
    heart:'<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    coins:'<circle cx="9" cy="8" r="5"/><path d="M14 5a5 5 0 1 1-4 11"/><path d="M9 6v4M7 8h4"/>',
    dots:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    ring:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 8 8" stroke-width="3.5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.5-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.5-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.6a7 7 0 0 0 2-1.2l2.5 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
    download:'<path d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14"/>',
    selector:'<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>',
    sparkles:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>',
    share:'<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/>',
  };
  ST.icon = (name, cls) =>
    `<svg class="${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]||P.dots}</svg>`;

  ST.CATS = [
    {id:"entertainment", icon:"tv",      dot:"#D7FF3F"},
    {id:"music",         icon:"music",   dot:"#7A78FF"},
    {id:"ai",            icon:"bot",     dot:"#5AC8FA"},
    {id:"productivity",  icon:"bolt",    dot:"#FF9F0A"},
    {id:"cloud",         icon:"cloud",   dot:"#0A84FF"},
    {id:"gaming",        icon:"gamepad", dot:"#BF5AF2"},
    {id:"health",        icon:"heart",   dot:"#FF375F"},
    {id:"education",     icon:"book",    dot:"#34C759"},
    {id:"finance",       icon:"coins",   dot:"#FFD60A"},
    {id:"other",         icon:"dots",    dot:"#5A5A60"},
  ];
  ST.cat = id => ST.CATS.find(c=>c.id===id) || ST.CATS[ST.CATS.length-1];
  ST.catName = id => ST.t("cat"+id.charAt(0).toUpperCase()+id.slice(1));

  /* tile: colored square w/ category icon */
  ST.tile = (color, catId, extra) => {
    const ink = ST.inkFor(color);
    return `<span class="tile ${extra||''}" style="background:${color};color:${ink}">${ST.icon(ST.cat(catId).icon)}</span>`;
  };
  /* readable ink on brand color */
  ST.inkFor = (hex) => {
    const c = hex.replace("#",""); if (c.length<6) return "#fff";
    const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
    return (0.299*r+0.587*g+0.114*b) > 160 ? "#0A0A0B" : "#fff";
  };

  ST.esc = s => String(s??"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  /* --- money / dates --- */
  ST.fmtMoney = (v, opts) => {
    const cur = (ST.state && ST.state.settings.currency) || "USD";
    try { return new Intl.NumberFormat(ST.lang(), {style:"currency", currency:cur,
      minimumFractionDigits:(opts&&opts.round)?0:2, maximumFractionDigits:(opts&&opts.round)?0:2}).format(v); }
    catch(e){ return cur+" "+v.toFixed(2); }
  };
  ST.fmtDate = (iso, opts) => {
    const d = new Date(iso+"T00:00:00");
    return d.toLocaleDateString(ST.lang(), opts || {month:"short", day:"numeric"});
  };
  ST.todayISO = () => {
    const d = new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  };
  ST.daysUntil = (iso) => Math.round((new Date(iso+"T00:00:00") - new Date(ST.todayISO()+"T00:00:00"))/864e5);
  ST.whenLabel = (iso) => {
    const n = ST.daysUntil(iso);
    if (n<=0) return ST.t("today");
    if (n===1) return ST.t("tomorrow");
    return ST.t("inDays",{n});
  };

  /* --- toast --- */
  let toastT = null;
  ST.toast = (msg, undoFn) => {
    document.querySelectorAll(".toast").forEach(t=>t.remove());
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = ST.esc(msg) + (undoFn ? ` <button class="undo">${ST.t("undo")}</button>` : "");
    if (undoFn) el.querySelector(".undo").onclick = () => { undoFn(); el.remove(); };
    document.body.appendChild(el);
    clearTimeout(toastT);
    toastT = setTimeout(()=>el.remove(), undoFn?5000:2200);
  };

  /* --- bottom sheet --- */
  ST.sheet = (html, onMount) => {
    const w = document.createElement("div");
    w.className = "sheetwrap";
    w.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
    w.addEventListener("click", e=>{ if(e.target===w) w.remove(); });
    document.body.appendChild(w);
    if (onMount) onMount(w);
    return w;
  };
  ST.closeSheets = () => document.querySelectorAll(".sheetwrap").forEach(s=>s.remove());

  /* --- confetti (cancel-saving celebration only) --- */
  ST.confetti = () => {
    const c = document.createElement("div");
    c.className = "confetti";
    const colors = ["#D7FF3F","#7A78FF","#FF9F0A","#F5F5F7"];
    for (let i=0;i<36;i++){
      const p = document.createElement("i");
      p.style.left = Math.random()*100+"vw";
      p.style.background = colors[i%4];
      p.style.animationDelay = (Math.random()*0.5)+"s";
      p.style.animationDuration = (1+Math.random()*0.8)+"s";
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(()=>c.remove(), 2600);
  };

  ST.uuid = () => (crypto.randomUUID ? crypto.randomUUID() :
    "id-"+Date.now().toString(36)+Math.random().toString(36).slice(2,8));
})();
