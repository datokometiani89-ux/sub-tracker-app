/* SubTrack state — localStorage persistence */
(function(){
  const ST = window.ST = window.ST || {};
  const KEY = "subtrack.state.v1";

  const defaults = () => ({
    version: 1,
    settings: {
      currency: "USD",
      locale: (navigator.language||"en").slice(0,2).match(/^(ru|es|pt|de|fr|tr)$/) ? (navigator.language||"en").slice(0,2) : "en",
      theme: "dark",
      reminders: { d7:false, d3:true, d1:true, dayOf:true },
    },
    subs: [],       // see SPEC.md data model
    fx: { rates:null, fetchedAt:null },   // USD-based rates from open.er-api.com
    pro: { active:false, plan:null, since:null },
    meta: { installedAt: new Date().toISOString(), onboarded:false, lastNotifCheck:null },
  });

  ST.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        ST.state = Object.assign(defaults(), s);
        ST.state.settings = Object.assign(defaults().settings, s.settings||{});
        return;
      }
    } catch(e){}
    ST.state = defaults();
  };
  ST.save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST.state)); } catch(e){} };
  ST.reset = () => { localStorage.removeItem(KEY); ST.state = defaults(); };

  ST.FREE_LIMIT = 5;
  ST.isPro = () => !!ST.state.pro.active;
  ST.activeSubs = () => ST.state.subs.filter(s=>s.status==="active");
  ST.subById = id => ST.state.subs.find(s=>s.id===id);

  ST.newSub = (o) => ({
    id: ST.uuid(), presetId:null, name:"", category:"other",
    color:"#5A5A60", icon:null, price:0, currency:ST.state.settings.currency,
    cycle:{unit:"month",n:1},
    nextBilling: ST.todayISO(), startedAt: ST.todayISO(),
    trial:{isTrial:false, endsAt:null, priceAfter:null},
    status:"active", cancelledAt:null,
    priceHistory:[], paymentLog:[],
    lastUsed:null, notes:"", reminderOverride:null,
    ...o
  });
})();
