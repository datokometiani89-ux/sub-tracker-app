/* SubTrack pure logic — totals, billing advance, insights. Unit-testable. */
(function(){
  const ST = window.ST = window.ST || {};

  /* normalize any cycle to a monthly amount */
  ST.monthlyOf = (sub) => {
    const {unit,n} = sub.cycle;
    if (unit==="week")  return sub.price * (4.345/n);
    if (unit==="year")  return sub.price / (12*n);
    return sub.price / n; // month
  };
  /* FX: convert amount from `from` currency into the base (settings) currency.
     Rates are USD-based; missing rate → 1:1 fallback (offline-safe). */
  ST.conv = (v, from) => {
    const base = ST.state.settings.currency;
    if (!from || from === base) return v;
    const r = ST.state.fx && ST.state.fx.rates;
    if (!r || !r[from] || !r[base]) return v;
    return v / r[from] * r[base];
  };
  ST.monthlyBase = (sub) => ST.conv(ST.monthlyOf(sub), sub.currency);
  ST.fetchRates = async () => {
    const fx = ST.state.fx;
    if (fx.fetchedAt && (Date.now() - new Date(fx.fetchedAt).getTime()) < 864e5) return;
    try {
      const j = await (await fetch("https://open.er-api.com/v6/latest/USD")).json();
      if (j && j.rates) { ST.state.fx = {rates:j.rates, fetchedAt:new Date().toISOString()}; ST.save(); ST.render(); }
    } catch(e){}
  };

  ST.monthlyTotal = (subs) => (subs||ST.activeSubs()).reduce((a,s)=>a+ST.monthlyBase(s),0);
  ST.yearlyTotal  = (subs) => ST.monthlyTotal(subs)*12;

  /* add one cycle to an ISO date, clamping to month length (billing day 31 → Feb 28) */
  ST.addCycle = (iso, cycle, anchorDay) => {
    const [y,m,d] = iso.split("-").map(Number);
    const ad = anchorDay || d;
    if (cycle.unit==="week"){
      const dt = new Date(Date.UTC(y,m-1,d)); dt.setUTCDate(dt.getUTCDate()+7*cycle.n);
      return dt.toISOString().slice(0,10);
    }
    const addM = cycle.unit==="year" ? 12*cycle.n : cycle.n;
    let ny=y, nm=m+addM;
    while (nm>12){ nm-=12; ny++; }
    const last = new Date(ny, nm, 0).getDate();
    return ny+"-"+String(nm).padStart(2,"0")+"-"+String(Math.min(ad,last)).padStart(2,"0");
  };

  /* on app open: move past nextBilling dates into paymentLog */
  ST.advanceBilling = (today) => {
    const t = today || ST.todayISO();
    let changed = false;
    ST.state.subs.forEach(s => {
      if (s.status!=="active") return;
      // trial that already ended converts to a paid sub
      if (s.trial.isTrial && s.trial.endsAt && s.trial.endsAt < t) {
        s.trial.isTrial = false;
        if (s.trial.priceAfter) s.price = s.trial.priceAfter;
        changed = true;
      }
      const anchor = Number((s.startedAt||s.nextBilling).split("-")[2]);
      let guard = 0;
      while (s.nextBilling < t && guard++ < 60) {
        s.paymentLog.push({date:s.nextBilling, amount:s.price});
        s.nextBilling = ST.addCycle(s.nextBilling, s.cycle, anchor);
        changed = true;
      }
    });
    if (changed) ST.save();
    return changed;
  };

  /* subs renewing within N days, sorted soonest first */
  ST.nextRenewals = (days) => ST.activeSubs()
    .filter(s => ST.daysUntil(s.nextBilling) <= days)
    .sort((a,b)=> a.nextBilling.localeCompare(b.nextBilling));
  ST.soonest = () => ST.activeSubs().slice()
    .sort((a,b)=> a.nextBilling.localeCompare(b.nextBilling))[0] || null;

  /* per-category monthly breakdown, sorted desc */
  ST.categoryBreakdown = () => {
    const map = {};
    ST.activeSubs().forEach(s => { map[s.category] = (map[s.category]||0) + ST.monthlyBase(s); });
    return Object.entries(map).map(([id,v])=>({id,v})).sort((a,b)=>b.v-a.v);
  };

  /* delta vs previous calendar month from payment logs (null if no history) */
  ST.deltaVsPrevMonth = () => {
    const now = new Date();
    const ym  = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
    const pd  = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const pym = pd.getFullYear()+"-"+String(pd.getMonth()+1).padStart(2,"0");
    let cur=0, prev=0, seen=false;
    ST.state.subs.forEach(s => s.paymentLog.forEach(p => {
      if (p.date.startsWith(ym))  cur += ST.conv(p.amount, s.currency);
      if (p.date.startsWith(pym)) { prev += ST.conv(p.amount, s.currency); seen=true; }
    }));
    // project current month forward: payments still due this month
    ST.activeSubs().forEach(s => { if (s.nextBilling.startsWith(ym)) cur += ST.conv(s.price, s.currency); });
    if (!seen) return null;
    return { delta: cur - prev, prevLabel: pd.toLocaleDateString(ST.lang(),{month:"long"}) };
  };

  /* saved money from cancelled subs (accumulates monthly since cancel date) */
  ST.savedTotal = () => {
    let total=0, count=0;
    const today = new Date(ST.todayISO()+"T00:00:00");
    ST.state.subs.forEach(s => {
      if (s.status!=="cancelled" || !s.cancelledAt) return;
      count++;
      const months = Math.max(0, (today - new Date(s.cancelledAt+"T00:00:00"))/2629800000);
      total += ST.monthlyBase(s)*months;
    });
    return {total, count, monthly: ST.state.subs.filter(s=>s.status==="cancelled").reduce((a,s)=>a+ST.monthlyBase(s),0)};
  };

  /* price hikes: current price vs first recorded */
  ST.priceHikes = () => ST.activeSubs()
    .filter(s => s.priceHistory.length && s.price > s.priceHistory[0].price)
    .map(s => ({sub:s, pct: Math.round((s.price/s.priceHistory[0].price-1)*100)}))
    .sort((a,b)=>b.pct-a.pct);

  /* possibly unused: lastUsed 45+ days ago, OR never marked used on a 45+ day-old sub */
  ST.UNUSED_DAYS = 45;
  ST.unusedSubs = () => ST.activeSubs()
    .filter(s => s.lastUsed
      ? -ST.daysUntil(s.lastUsed) >= ST.UNUSED_DAYS
      : -ST.daysUntil(s.startedAt) >= ST.UNUSED_DAYS)
    .sort((a,b)=>ST.monthlyBase(b)-ST.monthlyBase(a));

  /* total spent on a sub from its payment log */
  ST.spentOn = (sub) => sub.paymentLog.reduce((a,p)=>a+p.amount,0);

  /* 12-month projection bars: past months = real log, future = current monthly rate */
  ST.projectionBars = () => {
    const out = [];
    const now = new Date();
    const rate = ST.monthlyTotal();
    for (let i=0;i<12;i++){
      const d = new Date(now.getFullYear(), i, 1);
      const ym = d.getFullYear()+"-"+String(i+1).padStart(2,"0");
      let real = 0, has=false;
      ST.state.subs.forEach(s => s.paymentLog.forEach(p => {
        if (p.date.startsWith(ym)) { real+=ST.conv(p.amount, s.currency); has=true; }
      }));
      out.push({ label: d.toLocaleDateString(ST.lang(),{month:"narrow"}),
                 v: (i < now.getMonth() && has) ? real : rate,
                 current: i===now.getMonth() });
    }
    return out;
  };
})();
