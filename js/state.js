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
    // account: null = guest (local-only). emails[] = linked & verified identities.
    account: null,  // { id, name, primaryEmail, provider, emails:[{address,provider,verified,addedAt}], backedUpAt }
    meta: { installedAt: new Date().toISOString(), onboarded:false, lastNotifCheck:null, opens:0, ratePrompted:false },
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
  ST.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(ST.state)); } catch(e){}
    if (ST.auth && ST.auth.onSaved) ST.auth.onSaved();   // push to cloud when signed in
  };
  ST.reset = () => { localStorage.removeItem(KEY); ST.state = defaults(); };

  ST.FREE_LIMIT = 5;
  // Pro is HIDDEN for the first store release (billing not wired yet). Flip to
  // true to re-enable the paywall, limits and lock badges in one place.
  ST.PRO_ENABLED = false;
  ST.isPro = () => !!ST.state.pro.active;
  // is a premium feature available to the user right now?
  ST.unlocked = () => !ST.PRO_ENABLED || ST.isPro();
  ST.activeSubs = () => ST.state.subs.filter(s=>s.status==="active");
  // free-tier limit counts paused too, else pausing bypasses the cap.
  // when Pro is hidden everything is free → no cap.
  ST.atFreeLimit = () => ST.PRO_ENABLED && !ST.isPro() &&
    ST.state.subs.filter(s=>s.status!=="cancelled").length >= ST.FREE_LIMIT;
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
