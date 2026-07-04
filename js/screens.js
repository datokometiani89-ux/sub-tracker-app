/* SubTrack screens */
(function(){
  const ST = window.ST = window.ST || {};
  ST.screens = {};
  const t = (...a)=>ST.t(...a), esc=s=>ST.esc(s), icon=(...a)=>ST.icon(...a);

  /* ============ ONBOARDING ============ */
  ST.screens.welcome = () => {
    const CURR = ["USD","EUR","GBP","GEL","RUB","BRL","TRY","INR"];
    let cur = ST.state.settings.currency;
    const sel = new Set();

    const grid = () => ST.POPULAR.map(id => {
      const p = ST.preset(id);
      return `<button class="precard ${sel.has(id)?'sel':''}" data-p="${id}">
        ${ST.tile(p.color, p.category)}
        <span class="nm">${esc(p.name)}</span>
        <span class="pr">$${p.priceUSD}${t("perMo")}</span>
      </button>`;
    }).join("");

    ST.mount(`
      <div class="onb screen">
        <div class="mark">${icon("ring")}</div>
        <h1>${t("onbTitle")}</h1>
        <p>${t("onbSub")}</p>
        <div style="margin-top:26px">
          <div style="font-size:12px;color:var(--mut);letter-spacing:1px;text-transform:uppercase;font-weight:500">${t("onbCurrency")}</div>
          <div class="curgrid">${CURR.map(c=>`<button data-c="${c}" class="${c===cur?'on':''}">${c}</button>`).join("")}</div>
        </div>
        <div style="margin-top:26px">
          <div style="font-size:15px;font-weight:600">${t("onbPick")}</div>
          <div style="font-size:12px;color:var(--dim);margin-top:3px">${t("onbPickSub")}</div>
          <div class="pregrid" style="padding:14px 0" id="obgrid">${grid()}</div>
        </div>
        <div class="grow"></div>
        <button class="cta" id="obGo" style="position:static;width:100%;margin:10px 0 0" disabled>${t("onbStart")}</button>
        <button style="margin-top:12px;color:var(--dim);font-size:13px;width:100%" id="obSkip">${t("onbSkip")}</button>
      </div>
    `, root => {
      const go = root.querySelector("#obGo");
      const refresh = () => {
        go.disabled = false;
        go.textContent = sel.size ? t("onbAddN",{n:sel.size}) : t("onbStart");
      };
      root.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
        cur = b.dataset.c;
        root.querySelectorAll("[data-c]").forEach(x=>x.classList.toggle("on", x===b));
      });
      root.querySelector("#obgrid").addEventListener("click", e => {
        const b = e.target.closest("[data-p]"); if(!b) return;
        const id = b.dataset.p;
        sel.has(id) ? sel.delete(id) : sel.add(id);
        b.classList.toggle("sel", sel.has(id));
        refresh();
      });
      const finish = (withSubs) => {
        ST.state.settings.currency = cur;
        if (withSubs) sel.forEach(id => {
          const p = ST.preset(id);
          ST.state.subs.push(ST.newSub({
            presetId:id, name:p.name, category:p.category, color:p.color,
            price:p.priceUSD, currency:cur,
            nextBilling: ST.addCycle(ST.todayISO(), {unit:"month",n:1}),
            priceHistory:[{date:ST.todayISO(), price:p.priceUSD}],
          }));
        });
        ST.state.meta.onboarded = true;
        ST.save();
        if (withSubs && sel.size) ST.askNotifPermission();
        location.hash = "#/";
      };
      go.onclick = () => finish(true);
      root.querySelector("#obSkip").onclick = () => finish(false);
      refresh();
    });
  };

  /* ============ HOME ============ */
  ST.screens.home = () => {
    const subs = ST.activeSubs();
    if (!subs.length) return renderEmpty();
    const yearlyView = ST._homeYearly || false;

    const mTotal = ST.monthlyTotal();
    const shown  = yearlyView ? mTotal*12 : mTotal;
    const [ints, cents] = shown.toFixed(2).split(".");
    const delta = ST.deltaVsPrevMonth();
    const next  = ST.soonest();
    const cats  = ST.categoryBreakdown();
    const days  = next ? ST.daysUntil(next.nextBilling) : 99;
    const ringPct = Math.max(0.06, Math.min(1, 1 - days/30));

    const sorted = subs.slice().sort((a,b)=>a.nextBilling.localeCompare(b.nextBilling));

    ST.mount(`
      <div class="screen">
        <div class="hdr">
          <h1>${t("home")}</h1>
          <div class="acts">
            <button class="icobtn lime" onclick="location.hash='#/add'">${icon("plus")}</button>
          </div>
        </div>

        <div class="seg">
          <button class="${yearlyView?'':'on'}" data-seg="m">${t("monthly")}</button>
          <button class="${yearlyView?'on':''}" data-seg="y">${t("yearly")}</button>
        </div>

        <div class="hero">
          <div class="lbl">${t("total")} · ${new Date().toLocaleDateString(ST.lang(),{month:"long"})}</div>
          <div class="num">${ST.fmtMoney(shown).replace(/([.,]\d{2})(\D*)$/, '<span class="cents">$1</span>$2')}
            <span class="per">${yearlyView?t("perYr"):t("perMo")}</span></div>
          <div class="row">
            ${delta ? `<span class="chip ${delta.delta<=0?'good':'bad'}">
                ${icon(delta.delta<=0?"downRight":"upRight")}${t("vsPrev",{v:ST.fmtMoney(Math.abs(delta.delta)),m:delta.prevLabel})}</span>` : ""}
            <span class="sub2">${yearlyView ? ST.fmtMoney(mTotal)+" "+t("perMo") : ST.fmtMoney(mTotal*12,{round:1})+" "+t("perYr")}</span>
          </div>
        </div>

        ${cats.length ? `
        <div class="catbar">${cats.slice(0,3).map((c,i)=>{
          const share = c.v/mTotal*100;
          const col = i===0?"var(--lime)":i===1?"var(--violet)":"#3A3A3F";
          return `<div style="width:${share}%;background:${col}"></div>`;
        }).join("")}${cats.length>3?`<div style="width:${cats.slice(3).reduce((a,c)=>a+c.v,0)/mTotal*100}%;background:#2A2A2E"></div>`:""}</div>
        <div class="catleg">${cats.slice(0,3).map((c,i)=>{
          const col = i===0?"#D7FF3F":i===1?"#7A78FF":"#5A5A60";
          return `<span><i style="background:${col}"></i>${ST.catName(c.id)}</span>`;
        }).join("")}</div>` : ""}

        ${next ? `
        <div class="renew">
          <div class="ring">
            <svg viewBox="0 0 44 44" width="42" height="42">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#232326" stroke-width="3.5"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--lime)" stroke-width="3.5"
                stroke-dasharray="${(ringPct*113).toFixed(0)} 113" transform="rotate(-90 22 22)" stroke-linecap="round"/>
            </svg>
            <b>${days<=0?"!":days+"d"}</b>
          </div>
          <div style="flex:1">
            <div class="tt">${t("renewsSoon",{name:esc(next.name)})}</div>
            <div class="ss">${t("willCharge",{price:ST.fmtMoney(next.price),date:ST.fmtDate(next.nextBilling)})}</div>
          </div>
          <button class="btn-lime" onclick="location.hash='#/sub/${next.id}'">${t("review")}</button>
        </div>` : ""}

        <div class="sect">
          <div class="t">${t("active")}<em>${subs.length}</em></div>
        </div>

        <div class="sublist">
          ${sorted.map(subCard).join("")}
          ${cancelledRow()}
        </div>
      </div>
    `, root => {
      root.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => {
        ST._homeYearly = b.dataset.seg==="y"; ST.render();
      });
    });
  };

  const subCard = (s) => {
    const days = ST.daysUntil(s.nextBilling);
    const soon = days<=3;
    const badge = s.trial.isTrial ? `<span class="badge trial">${t("trialBadge")}</span>` :
                  s.status==="paused" ? `<span class="badge paused">${t("pausedBadge")}</span>` : "";
    const cyc = s.cycle.unit==="year"?t("year"):s.cycle.unit==="week"?t("week"):s.cycle.n===3?t("months3"):t("month");
    return `<button class="subcard ${s.status==='paused'?'dim':''}" onclick="location.hash='#/sub/${s.id}'">
      ${ST.tile(s.color, s.category)}
      <span style="flex:1">
        <span class="nm">${esc(s.name)} ${badge}</span>
        <span class="dt ${soon?'soon':''}" style="display:block">${soon ? ST.whenLabel(s.nextBilling) : ST.fmtDate(s.nextBilling)}</span>
      </span>
      <span>
        <span class="pr" style="display:block">${ST.fmtMoney(s.price)}</span>
        <span class="cy" style="display:block">${cyc.toLowerCase()}</span>
      </span>
    </button>`;
  };

  const cancelledRow = () => {
    const n = ST.state.subs.filter(s=>s.status==="cancelled").length;
    if (!n) return "";
    return `<button class="subcard dim" onclick="location.hash='#/archive'">
      <span class="tile" style="background:#1C1C1F;color:var(--mut)">${icon("check")}</span>
      <span style="flex:1"><span class="nm" style="color:var(--mut)">${t("cancelledArchive")}</span></span>
      <span style="color:var(--dim);font-size:13px">${n} ${icon("chevR")}</span>
    </button>`;
  };

  const renderEmpty = () => ST.mount(`
    <div class="screen">
      <div class="hdr"><h1>${t("home")}</h1></div>
      <div class="empty">
        <div class="big">${icon("ring")}</div>
        <h2>${t("emptyTitle")}</h2>
        <p>${t("emptySub")}</p>
        <button class="cta" style="position:static;width:100%;margin:24px 0 0" onclick="location.hash='#/add'">${t("addFirst")}</button>
      </div>
    </div>
  `);

  /* ============ ADD ============ */
  ST.screens.add = () => {
    if (!ST.isPro() && ST.activeSubs().length >= ST.FREE_LIMIT) { location.hash="#/pro"; return; }
    let q = "";
    const list = () => {
      const match = q ? ST.PRESETS.filter(p=>p.name.toLowerCase().includes(q)) :
                        ST.POPULAR.map(id=>ST.preset(id));
      return match.map(p => `<button class="precard" data-p="${p.id}">
        ${ST.tile(p.color,p.category)}<span class="nm">${esc(p.name)}</span>
        <span class="pr">$${p.priceUSD}${t("perMo")}</span></button>`).join("");
    };
    ST.mount(`
      <div class="screen">
        <button class="back" onclick="history.back()">${icon("chevL")}${t("back")}</button>
        <div class="hdr" style="padding-top:8px"><h1>${t("add")}</h1></div>
        <div class="searchbox">${icon("search")}<input id="q" placeholder="${t("search")}" autocomplete="off"></div>
        <div class="pregrid" id="grid">${list()}</div>
        <button class="rowbtn" onclick="location.hash='#/add/custom'">${t("addCustom")}</button>
      </div>
    `, root => {
      const grid = root.querySelector("#grid");
      root.querySelector("#q").oninput = e => { q = e.target.value.trim().toLowerCase(); grid.innerHTML = list(); };
      grid.addEventListener("click", e => {
        const b = e.target.closest("[data-p]"); if(!b) return;
        openPresetSheet(ST.preset(b.dataset.p));
      });
    });
  };

  const openPresetSheet = (p) => {
    ST.sheet(`
      <div class="dhead">${ST.tile(p.color,p.category)}<h2 style="font-size:18px">${esc(p.name)}</h2></div>
      <div class="form">
        <div class="duo">
          <div><label>${t("price")} (${ST.state.settings.currency})</label>
            <input id="pp" type="number" step="0.01" inputmode="decimal" value="${p.priceUSD}"></div>
          <div><label>${t("firstBill")}</label>
            <input id="pd" type="date" value="${ST.addCycle(ST.todayISO(),{unit:'month',n:1})}"></div>
        </div>
        <div><label>${t("cycle")}</label><div class="cycrow" id="pc">
          ${cycleBtns({unit:"month",n:1})}</div></div>
        <div class="togglerow"><span class="t">${t("isTrial")}</span>
          <button class="tgl" id="ptg"><i></i></button></div>
        <div id="ptrialbox" style="display:none"><label>${t("trialEnds")}</label>
          <input id="pte" type="date" value="${ST.addCycle(ST.todayISO(),{unit:'week',n:1})}"></div>
        <button class="cta" style="position:static;width:100%;margin:6px 0 0" id="psave">${t("save")}</button>
      </div>
    `, w => {
      let cyc = {unit:"month",n:1}, isTrial=false;
      wireCycle(w, c=>cyc=c);
      const tg = w.querySelector("#ptg");
      tg.onclick = () => { isTrial=!isTrial; tg.classList.toggle("on",isTrial);
        w.querySelector("#ptrialbox").style.display = isTrial?"block":"none"; };
      w.querySelector("#psave").onclick = () => {
        const price = parseFloat(w.querySelector("#pp").value)||0;
        ST.state.subs.push(ST.newSub({
          presetId:p.id, name:p.name, category:p.category, color:p.color,
          price, nextBilling: w.querySelector("#pd").value || ST.todayISO(),
          cycle:cyc,
          trial: isTrial ? {isTrial:true, endsAt:w.querySelector("#pte").value, priceAfter:price} : {isTrial:false,endsAt:null,priceAfter:null},
          priceHistory:[{date:ST.todayISO(), price}],
        }));
        ST.save(); ST.closeSheets(); ST.toast(t("added"));
        ST.askNotifPermission();
        location.hash = "#/";
      };
    });
  };

  const cycleBtns = (sel) => [
    ["week",1,t("week")],["month",1,t("month")],["month",3,t("months3")],["year",1,t("year")]
  ].map(([u,n,l])=>`<button data-u="${u}" data-n="${n}" class="${sel.unit===u&&sel.n===n?'on':''}">${l}</button>`).join("");
  const wireCycle = (root, cb) => {
    root.querySelectorAll(".cycrow button").forEach(b => b.onclick = () => {
      root.querySelectorAll(".cycrow button").forEach(x=>x.classList.remove("on"));
      b.classList.add("on"); cb({unit:b.dataset.u, n:Number(b.dataset.n)});
    });
  };

  ST.screens["add/custom"] = () => {
    if (!ST.isPro() && ST.activeSubs().length >= ST.FREE_LIMIT) { location.hash="#/pro"; return; }
    let cyc={unit:"month",n:1}, cat="other", isTrial=false;
    ST.mount(`
      <div class="screen">
        <button class="back" onclick="history.back()">${icon("chevL")}${t("back")}</button>
        <div class="hdr" style="padding-top:8px"><h1>${t("addCustom").replace("+ ","")}</h1></div>
        <div class="form">
          <div><label>${t("name")}</label><input id="cn" placeholder="Gym, rent, hosting…"></div>
          <div class="duo">
            <div><label>${t("price")} (${ST.state.settings.currency})</label>
              <input id="cp" type="number" step="0.01" inputmode="decimal" placeholder="9.99"></div>
            <div><label>${t("firstBill")}</label><input id="cd" type="date" value="${ST.todayISO()}"></div>
          </div>
          <div><label>${t("cycle")}</label><div class="cycrow">${cycleBtns(cyc)}</div></div>
          <div><label>${t("category")}</label><div class="catrow" id="cats">
            ${ST.CATS.map(c=>`<button data-c="${c.id}" class="${c.id===cat?'on':''}"><i style="background:${c.dot}"></i>${ST.catName(c.id)}</button>`).join("")}
          </div></div>
          <div class="togglerow"><span class="t">${t("isTrial")}</span>
            <button class="tgl" id="ctg"><i></i></button></div>
          <div id="ctrialbox" style="display:none"><label>${t("trialEnds")}</label>
            <input id="cte" type="date" value="${ST.addCycle(ST.todayISO(),{unit:'week',n:1})}"></div>
          <div><label>${t("notes")}</label><input id="cno"></div>
          <button class="cta" style="position:static;width:100%" id="csave">${t("save")}</button>
        </div>
      </div>
    `, root => {
      wireCycle(root, c=>cyc=c);
      root.querySelector("#cats").addEventListener("click", e=>{
        const b=e.target.closest("[data-c]"); if(!b) return;
        cat=b.dataset.c;
        root.querySelectorAll("#cats button").forEach(x=>x.classList.toggle("on",x===b));
      });
      const tg=root.querySelector("#ctg");
      tg.onclick=()=>{ isTrial=!isTrial; tg.classList.toggle("on",isTrial);
        root.querySelector("#ctrialbox").style.display=isTrial?"block":"none"; };
      root.querySelector("#csave").onclick = () => {
        const name = root.querySelector("#cn").value.trim();
        const price = parseFloat(root.querySelector("#cp").value)||0;
        if (!name || !price) { ST.toast(t("name")+" + "+t("price")); return; }
        const catDef = ST.cat(cat);
        ST.state.subs.push(ST.newSub({
          name, price, category:cat, color:catDef.dot,
          nextBilling: root.querySelector("#cd").value || ST.todayISO(),
          cycle:cyc, notes: root.querySelector("#cno").value,
          trial: isTrial ? {isTrial:true, endsAt:root.querySelector("#cte").value, priceAfter:price} : {isTrial:false,endsAt:null,priceAfter:null},
          priceHistory:[{date:ST.todayISO(), price}],
        }));
        ST.save(); ST.toast(t("added"));
        ST.askNotifPermission();
        location.hash = "#/";
      };
    });
  };

  /* ============ DETAIL ============ */
  ST.screens.sub = (id) => {
    const s = ST.subById(id);
    if (!s) { location.hash="#/"; return; }
    const preset = s.presetId ? ST.preset(s.presetId) : null;
    const spent = ST.spentOn(s);
    const cyc = s.cycle.unit==="year"?t("year"):s.cycle.unit==="week"?t("week"):s.cycle.n===3?t("months3"):t("month");

    ST.mount(`
      <div class="screen">
        <button class="back" onclick="history.back()">${icon("chevL")}${t("back")}</button>
        <div class="dhead">
          ${ST.tile(s.color,s.category)}
          <h2>${esc(s.name)}</h2>
          <div class="cat">${ST.catName(s.category)} · ${cyc}
            ${s.trial.isTrial?` · <span style="color:var(--amber)">${t("trialBadge")} → ${ST.fmtDate(s.trial.endsAt)}</span>`:""}</div>
        </div>
        <div class="statgrid">
          <div class="stat"><div class="l">${t("price")}</div>
            <div class="v">${ST.fmtMoney(s.price)}<small> / ${cyc.toLowerCase()}</small></div></div>
          <div class="stat"><div class="l">${t("nextBilling")}</div>
            <div class="v">${s.status==="active"?ST.fmtDate(s.nextBilling):"—"}
              ${s.status==="active"?`<small>${ST.whenLabel(s.nextBilling)}</small>`:""}</div></div>
          <div class="stat"><div class="l">${t("totalSpent",{d:ST.fmtDate(s.startedAt,{month:"short",year:"numeric"})})}</div>
            <div class="v">${ST.fmtMoney(spent)}</div></div>
          <div class="stat"><div class="l">${ST.catName(s.category)}</div>
            <div class="v">${ST.fmtMoney(ST.monthlyOf(s))}<small> ${t("perMo")}</small></div></div>
        </div>

        <div class="dacts">
          <button class="dact" id="dEdit">${icon("edit")}${t("edit")}</button>
          <button class="dact" id="dUsed">${icon("check")}${t("markUsed")}</button>
          ${s.status!=="cancelled" ? `
            <button class="dact" id="dPause">${icon(s.status==="paused"?"play":"pause")}${s.status==="paused"?t("resume"):t("pause")}</button>
            <button class="dact lime" id="dCancel">${icon("downRight")}${t("cancelSub")}</button>` : ""}
          ${preset && preset.cancelUrl ? `<button class="dact" id="dHow" style="grid-column:1/-1">${icon("ext")}${t("howCancel")}</button>` : ""}
          <button class="dact danger" id="dDel" style="grid-column:1/-1">${icon("trash")}${t("delete_")}</button>
        </div>

        ${s.paymentLog.length ? `
        <div class="sect"><div class="t">${t("history")}<em>${s.paymentLog.length}</em></div></div>
        <div class="histlist">${s.paymentLog.slice(-12).reverse().map(p=>
          `<div class="histrow"><span class="d">${ST.fmtDate(p.date,{day:"numeric",month:"short",year:"numeric"})}</span>
           <span>${ST.fmtMoney(p.amount)}</span></div>`).join("")}</div>` : ""}
      </div>
    `, root => {
      root.querySelector("#dEdit").onclick = () => openEditSheet(s);
      root.querySelector("#dUsed").onclick = () => { s.lastUsed = ST.todayISO(); ST.save(); ST.toast("✓"); };
      const p = root.querySelector("#dPause");
      if (p) p.onclick = () => { s.status = s.status==="paused"?"active":"paused"; ST.save(); ST.render(); };
      const h = root.querySelector("#dHow");
      if (h) h.onclick = () => window.open(preset.cancelUrl, "_blank");
      const c = root.querySelector("#dCancel");
      if (c) c.onclick = () => {
        s.status = "cancelled"; s.cancelledAt = ST.todayISO(); ST.save();
        ST.confetti();
        ST.toast(t("savedNow",{v:ST.fmtMoney(ST.monthlyOf(s))}));
        setTimeout(()=>location.hash="#/", 900);
      };
      root.querySelector("#dDel").onclick = () => {
        if (!confirm(t("confirmDelete"))) return;
        const idx = ST.state.subs.indexOf(s);
        const copy = s;
        ST.state.subs.splice(idx,1); ST.save();
        location.hash = "#/";
        ST.toast(t("deleted"), () => { ST.state.subs.splice(idx,0,copy); ST.save(); ST.render(); });
      };
    });
  };

  const openEditSheet = (s) => {
    ST.sheet(`
      <div class="dhead">${ST.tile(s.color,s.category)}<h2 style="font-size:18px">${esc(s.name)}</h2></div>
      <div class="form">
        <div><label>${t("name")}</label><input id="en" value="${esc(s.name)}"></div>
        <div class="duo">
          <div><label>${t("price")}</label><input id="ep" type="number" step="0.01" value="${s.price}"></div>
          <div><label>${t("nextBilling")}</label><input id="ed" type="date" value="${s.nextBilling}"></div>
        </div>
        <div><label>${t("cycle")}</label><div class="cycrow">${cycleBtns(s.cycle)}</div></div>
        <button class="cta" style="position:static;width:100%" id="esave">${t("save")}</button>
      </div>
    `, w => {
      let cyc = {...s.cycle};
      wireCycle(w, c=>cyc=c);
      w.querySelector("#esave").onclick = () => {
        const np = parseFloat(w.querySelector("#ep").value)||s.price;
        if (np !== s.price) s.priceHistory.push({date:ST.todayISO(), price:np}); // keep hike history
        s.name = w.querySelector("#en").value.trim() || s.name;
        s.price = np;
        s.nextBilling = w.querySelector("#ed").value || s.nextBilling;
        s.cycle = cyc;
        ST.save(); ST.closeSheets(); ST.render();
      };
    });
  };

  /* ============ ARCHIVE ============ */
  ST.screens.archive = () => {
    const list = ST.state.subs.filter(s=>s.status==="cancelled");
    const saved = ST.savedTotal();
    ST.mount(`
      <div class="screen">
        <button class="back" onclick="history.back()">${icon("chevL")}${t("back")}</button>
        <div class="hdr" style="padding-top:8px"><h1>${t("cancelledArchive")}</h1></div>
        <div class="inscard"><div class="l">${t("savedSoFar")}</div>
          <div class="big lime">${ST.fmtMoney(saved.total,{round:1})}</div>
          <div class="note">${t("savedNote",{n:saved.count})} · ${ST.fmtMoney(saved.monthly)}${t("perMo")}</div></div>
        <div class="sublist" style="margin-top:16px">${list.map(subCard).join("")}</div>
      </div>
    `);
  };

  /* ============ INSIGHTS ============ */
  ST.screens.insights = () => {
    const subs = ST.activeSubs();
    if (!subs.length) return ST.mount(`
      <div class="screen"><div class="hdr"><h1>${t("insights")}</h1></div>
      <div class="empty"><div class="big">${icon("chart")}</div><p>${t("noData")}</p></div></div>`);

    const bars = ST.projectionBars();
    const max = Math.max(...bars.map(b=>b.v), 1);
    const top = subs.slice().sort((a,b)=>ST.monthlyOf(b)-ST.monthlyOf(a)).slice(0,3);
    const saved = ST.savedTotal();
    const hikes = ST.priceHikes();
    const unused = ST.unusedSubs();
    const cats = ST.categoryBreakdown();
    const mTotal = ST.monthlyTotal();
    const pro = ST.isPro();
    const lock = pro ? "" : `<div class="lock" onclick="location.hash='#/pro'">${icon("lock")}<span>${t("unlockPro")}</span></div>`;

    ST.mount(`
      <div class="screen">
        <div class="hdr"><h1>${t("insights")}</h1></div>

        <div class="inscard">
          <div class="l">${t("projection")}</div>
          <div class="big">${ST.fmtMoney(ST.yearlyTotal(),{round:1})}</div>
          <div class="bars">${bars.map(b=>`<div class="${b.current?'hi':''}" style="height:${Math.max(6,b.v/max*100)}%"></div>`).join("")}</div>
          <div class="barlbl">${bars.map(b=>`<span>${b.label}</span>`).join("")}</div>
        </div>

        <div class="inscard">
          <div class="l">${t("top3")}</div>
          <div style="margin-top:8px">${top.map((s,i)=>`
            <div class="toprow"><span class="rank">${i+1}</span>
              ${ST.tile(s.color,s.category)}<span class="nm">${esc(s.name)}</span>
              <span class="v">${ST.fmtMoney(ST.monthlyOf(s))}${t("perMo")}</span></div>`).join("")}
          </div>
        </div>

        ${saved.count ? `
        <div class="inscard">
          <div class="l">${t("savedSoFar")}</div>
          <div class="big lime">${ST.fmtMoney(saved.total,{round:1})}</div>
          <div class="note">${t("savedNote",{n:saved.count})}</div>
        </div>` : ""}

        <div class="inscard lockcard">${lock}
          <div class="l">${t("priceHikes")}</div>
          ${hikes.length ? hikes.map(h=>`
            <div class="hikerow">${ST.tile(h.sub.color,h.sub.category)}
              <span class="nm">${t("hikeText",{name:esc(h.sub.name),p:h.pct})}</span>
              <span class="pc">+${h.pct}%</span></div>`).join("")
          : `<div class="note" style="margin-top:8px">${t("noHikes")}</div>`}
        </div>

        ${unused.length ? `
        <div class="inscard lockcard">${lock}
          <div class="l">${t("unused")}</div>
          ${unused.map(s=>`
            <div class="hikerow">${ST.tile(s.color,s.category)}
              <span class="nm">${esc(s.name)} — ${t("unusedText",{d:ST.UNUSED_DAYS,v:ST.fmtMoney(ST.monthlyOf(s))})}</span></div>`).join("")}
        </div>` : ""}

        <div class="inscard">
          <div class="l">${t("byCategory")}</div>
          <div class="catrows">${cats.map(c=>{
            const def = ST.cat(c.id);
            return `<div class="catline"><span style="width:90px">${ST.catName(c.id)}</span>
              <span class="bar"><i style="width:${(c.v/mTotal*100).toFixed(0)}%;background:${def.dot}"></i></span>
              <span class="v">${ST.fmtMoney(c.v,{round:1})}</span></div>`;
          }).join("")}</div>
        </div>
      </div>
    `);
  };

  /* ============ SETTINGS ============ */
  ST.screens.settings = () => {
    const st = ST.state.settings;
    const CURR = ["USD","EUR","GBP","GEL","RUB","BRL","TRY","INR","JPY","CAD","AUD"];
    ST.mount(`
      <div class="screen">
        <div class="hdr"><h1>${t("settings")}</h1></div>

        ${ST.isPro() ? `
        <div class="probanner"><div class="mark" style="width:44px;height:44px;border-radius:13px;background:var(--lime);display:flex;align-items:center;justify-content:center;color:var(--lime-ink)">${icon("sparkles")}</div>
          <div><div class="tt">${t("proActive")}</div><div class="ss">${ST.state.pro.plan==="lifetime"?t("pwLifetime"):t("pwMonthly")}</div></div></div>` : `
        <button class="probanner" style="width:calc(100% - 44px)" onclick="location.hash='#/pro'">
          <div style="width:44px;height:44px;border-radius:13px;background:var(--lime);display:flex;align-items:center;justify-content:center;color:var(--lime-ink)">${icon("sparkles")}</div>
          <div style="text-align:left"><div class="tt">${t("proTitle")}</div><div class="ss">${t("proSub")}</div></div>
          <div style="margin-left:auto;color:var(--lime)">${icon("chevR")}</div></button>`}

        <div class="setgroup">
          <div class="setrow"><span class="ic" style="background:#12210A;color:var(--lime)">${icon("coins")}</span>
            <span class="t">${t("currency")}</span>
            <select id="sCur">${CURR.map(c=>`<option ${c===st.currency?"selected":""}>${c}</option>`).join("")}</select></div>
          <div class="setrow"><span class="ic" style="background:#101B2A;color:#5AC8FA">${icon("globe")}</span>
            <span class="t">${t("language")}</span>
            <select id="sLang">${ST.LANGS.map(([c,n])=>`<option value="${c}" ${c===st.locale?"selected":""}>${n}</option>`).join("")}</select></div>
        </div>

        <div class="setgroup">
          ${[["d3",t("remind3")],["d1",t("remind1")],["dayOf",t("remindDay")]].map(([k,l])=>`
          <div class="setrow"><span class="ic" style="background:#1F1A0A;color:var(--amber)">${icon("bell")}</span>
            <span class="t">${l}</span>
            <button class="tgl ${st.reminders[k]?'on':''}" data-r="${k}"><i></i></button></div>`).join("")}
        </div>

        <div class="setgroup">
          <button class="setrow" id="sExport"><span class="ic" style="background:#0F1F14;color:#34C759">${icon("download")}</span>
            <span class="t">${t("exportJson")}</span>${ST.isPro()?"":icon("lock","")}</button>
          <button class="setrow" id="sErase"><span class="ic" style="background:#2A1210;color:var(--red)">${icon("trash")}</span>
            <span class="t" style="color:var(--red)">${t("erase")}</span></button>
        </div>
        <div class="demo-note" style="padding:0 26px">SubTrack v1 · local-first, your data never leaves this device.</div>
      </div>
    `, root => {
      root.querySelector("#sCur").onchange = e => { ST.state.settings.currency = e.target.value; ST.save(); ST.render(); };
      root.querySelector("#sLang").onchange = e => { ST.setLang(e.target.value); ST.render(); };
      root.querySelectorAll("[data-r]").forEach(b => b.onclick = () => {
        const k = b.dataset.r;
        ST.state.settings.reminders[k] = !ST.state.settings.reminders[k];
        ST.save(); b.classList.toggle("on", ST.state.settings.reminders[k]);
      });
      root.querySelector("#sExport").onclick = () => {
        if (!ST.isPro()) { location.hash="#/pro"; return; }
        const blob = new Blob([JSON.stringify(ST.state,null,2)],{type:"application/json"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "subtrack-export.json"; a.click();
      };
      root.querySelector("#sErase").onclick = () => {
        if (!confirm(t("eraseConfirm"))) return;
        ST.reset(); location.hash = "#/welcome"; ST.render();
      };
    });
  };

  /* ============ PAYWALL ============ */
  ST.screens.pro = () => {
    ST.mount(`
      <div class="screen">
        <button class="back" onclick="history.back()">${icon("chevL")}${t("back")}</button>
        <div class="paywall">
          <div class="mark">${icon("sparkles")}</div>
          <h2>${t("pwTitle")}</h2>
          <div class="sub">${t("pwSub")}</div>
          <div class="feats">
            ${["pwF1","pwF2","pwF3","pwF4"].map(k=>`<div>${icon("check")}${t(k)}</div>`).join("")}
          </div>
          <div class="plans">
            <button class="plan best" data-plan="lifetime">
              <span><span class="nm">${t("pwLifetime")} <span class="tag">${t("pwBest")}</span></span>
              <span class="d">${t("pwLifetimeD")}</span></span>
              <span class="pr">$4.99</span></button>
            <button class="plan" data-plan="monthly">
              <span><span class="nm">${t("pwMonthly")}</span></span>
              <span class="pr">$0.99<span style="font-size:12px;color:var(--mut)">${t("perMo")}</span></span></button>
          </div>
          <button style="margin-top:16px;color:var(--mut);font-size:13px">${t("restore")}</button>
          <div class="demo-note">${t("pwDemo")}</div>
        </div>
      </div>
    `, root => {
      root.querySelectorAll("[data-plan]").forEach(b => b.onclick = () => {
        // DEMO: real IAP (Play Billing / StoreKit) is a store-release seam — see SPEC §5
        ST.state.pro = { active:true, plan:b.dataset.plan, since:new Date().toISOString() };
        ST.save(); ST.confetti(); ST.toast(t("pwDone"));
        setTimeout(()=>location.hash="#/", 800);
      });
    });
  };
})();
