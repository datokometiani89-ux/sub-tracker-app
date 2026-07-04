/* SubTrack app — router + boot + notifications */
(function(){
  const ST = window.ST = window.ST || {};
  const TABS = [
    ["#/",        "grid",     "home"],
    ["#/insights","chart",    "insights"],
    ["#/settings","settings", "settings"],
  ];

  ST.mount = (html, onMount) => {
    const app = document.getElementById("app");
    const route = location.hash || "#/";
    const showTabs = ST.state.meta.onboarded && ["#/","#/insights","#/settings"].includes(route);
    app.innerHTML = html + (showTabs ? tabbar(route) : "");
    window.scrollTo(0,0);
    if (onMount) onMount(app);
  };

  const tabbar = (route) => `
    <nav class="tabbar">${TABS.map(([href,ic,key]) => `
      <button class="tab ${route===href?'on':''}" onclick="location.hash='${href}'">
        ${ST.icon(ic)}<span>${ST.t(key==='home'?'home':key)}</span>
      </button>`).join("")}
    </nav>`;

  ST.render = () => {
    ST.closeSheets();
    if (!ST.state.meta.onboarded) { ST.screens.welcome(); return; }
    const h = (location.hash || "#/").replace(/^#\//,"");
    if (h === "") return ST.screens.home();
    const parts = h.split("/");
    if (parts[0]==="sub" && parts[1]) return ST.screens.sub(parts[1]);
    const key = parts.join("/");
    (ST.screens[key] || ST.screens.home)();
  };

  ST.go = (hash) => { location.hash = hash; };

  /* --- notifications (local, on app open; SPEC §3.9) --- */
  ST.askNotifPermission = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      setTimeout(()=>Notification.requestPermission().catch(()=>{}), 600);
    }
  };
  ST.checkReminders = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const today = ST.todayISO();
    if (ST.state.meta.lastNotifCheck === today) return; // once per day
    ST.state.meta.lastNotifCheck = today; ST.save();
    const r = ST.state.settings.reminders;
    ST.activeSubs().forEach(s => {
      const d = ST.daysUntil(s.trial.isTrial && s.trial.endsAt ? s.trial.endsAt : s.nextBilling);
      const fire = (d===0&&r.dayOf)||(d===1&&r.d1)||(d===3&&r.d3)||(d===7&&r.d7)||(s.trial.isTrial&&(d===1||d===3));
      if (!fire) return;
      try { new Notification("SubTrack", { body: ST.t("notifBody", {
        name:s.name, when:ST.whenLabel(s.nextBilling), price:ST.fmtMoney(s.price)}) }); } catch(e){}
    });
  };

  /* --- boot --- */
  ST.load();
  ST.advanceBilling();
  window.addEventListener("hashchange", ST.render);
  document.addEventListener("DOMContentLoaded", () => {
    ST.render();
    ST.checkReminders();
    if ("serviceWorker" in navigator && location.protocol !== "file:")
      navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
})();
