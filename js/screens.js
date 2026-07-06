/* SubTrack screens */
(function(){
  const ST = window.ST = window.ST || {};
  ST.screens = {};
  const t = (...a)=>ST.t(...a), esc=s=>ST.esc(s), icon=(...a)=>ST.icon(...a);

  /* minimal RFC-4180 CSV parser (quotes, escaped quotes, CRLF) */
  const parseCSV = (txt) => {
    const rows = [[]]; let f = "", q = false;
    for (let i=0; i<txt.length; i++){
      const c = txt[i];
      if (q) { if (c==='"') { if (txt[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
      else if (c==='"') q = true;
      else if (c===",") { rows[rows.length-1].push(f); f=""; }
      else if (c==="\n" || c==="\r") {
        if (c==="\r" && txt[i+1]==="\n") i++;
        rows[rows.length-1].push(f); f=""; rows.push([]);
      } else f += c;
    }
    rows[rows.length-1].push(f);
    return rows.filter(r => r.length>1 || (r[0]&&r[0].trim()));
  };

  /* ============ ONBOARDING ============ */
  ST.screens.welcome = () => {
    const CURR = ST.CURRENCIES.slice(0, 8);
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
          <div class="curgrid">${CURR.map(c=>`<button data-c="${c}" class="${c===cur?'on':''}">${c}</button>`).join("")}
            <button id="obMore">${t("moreCur")}</button></div>
          <select id="obCurSel" style="display:none;margin-top:10px">${ST.CURRENCIES.map(c=>`<option ${c===cur?"selected":""}>${c}</option>`).join("")}</select>
        </div>
        <div style="margin-top:26px">
          <div style="font-size:15px;font-weight:600">${t("onbPick")}</div>
          <div style="font-size:12px;color:var(--dim);margin-top:3px">${t("onbPickSub")}</div>
          <div class="pregrid" style="padding:14px 0" id="obgrid">${grid()}</div>
        </div>
        <div class="grow"></div>
        <button class="cta" id="obGo" style="position:static;width:100%;margin:10px 0 0" disabled>${t("onbStart")}</button>
        <button class="cta ghost" id="obImport" style="position:static;width:100%;margin:10px 0 0">${icon("sparkles")} ${t("importAuto")}</button>
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
      const moreSel = root.querySelector("#obCurSel");
      root.querySelector("#obMore").onclick = () => {
        moreSel.style.display = "block";
        root.querySelector("#obMore").classList.add("on");
      };
      moreSel.onchange = () => {
        cur = moreSel.value;
        root.querySelectorAll("[data-c]").forEach(x=>x.classList.remove("on"));
      };
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
      root.querySelector("#obImport").onclick = () => {
        ST.state.settings.currency = cur; ST.state.meta.onboarded = true; ST.save();
        location.hash = "#/import";
      };
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
        ST._homeYearly = b.dataset.seg==="y"; ST._keepScroll=true; ST.render();
      });
    });
  };

  const cycLabel = (c) => {
    const base = c.unit==="year"?t("year"):c.unit==="week"?t("week"):c.n===3?t("months3"):t("month");
    return (c.n===1 || (c.unit==="month" && c.n===3)) ? base : base+" ×"+c.n;
  };

  const subCard = (s) => {
    const days = ST.daysUntil(s.nextBilling);
    const soon = days<=3;
    const badge = s.trial.isTrial ? `<span class="badge trial">${t("trialBadge")}</span>` :
                  s.status==="paused" ? `<span class="badge paused">${t("pausedBadge")}</span>` : "";
    const cyc = cycLabel(s.cycle);
    return `<button class="subcard ${s.status==='paused'?'dim':''}" onclick="location.hash='#/sub/${s.id}'">
      ${ST.tileFor(s)}
      <span style="flex:1">
        <span class="nm">${esc(s.name)} ${badge}</span>
        <span class="dt ${soon?'soon':''}" style="display:block">${soon ? ST.whenLabel(s.nextBilling) : ST.fmtDate(s.nextBilling)}</span>
      </span>
      <span>
        <span class="pr" style="display:block">${ST.fmtMoney(s.price,{cur:s.currency})}</span>
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
    if (ST.atFreeLimit()) { location.hash="#/pro"; return; }
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
        <button class="back" onclick="ST.back()">${icon("chevL")}${t("back")}</button>
        <div class="hdr" style="padding-top:8px"><h1>${t("add")}</h1></div>
        <div class="searchbox">${icon("search")}<input id="q" placeholder="${t("search")}" autocomplete="off"></div>
        <button class="rowbtn imp-cta" onclick="location.hash='#/import'">${icon("sparkles")} ${t("importAuto")}</button>
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
          <div><label>${t("price")}</label>
            <div class="curwrap"><span class="pricebox"><input id="pp" type="number" step="0.01" inputmode="decimal" value="${p.priceUSD}"></span>${curSel("pcur", ST.state.settings.currency)}</div></div>
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
      wireCycle(w, c=>cyc=c); wireCur(w);
      const tg = w.querySelector("#ptg");
      tg.onclick = () => { isTrial=!isTrial; tg.classList.toggle("on",isTrial);
        w.querySelector("#ptrialbox").style.display = isTrial?"block":"none"; };
      w.querySelector("#psave").onclick = () => {
        const price = parseFloat(w.querySelector("#pp").value)||0;
        ST.state.subs.push(ST.newSub({
          presetId:p.id, name:p.name, category:p.category, color:p.color,
          price, currency: w.querySelector("#pcur").value,
          nextBilling: w.querySelector("#pd").value || ST.todayISO(),
          cycle:cyc,
          trial: isTrial ? {isTrial:true, endsAt:w.querySelector("#pte").value || ST.addCycle(ST.todayISO(),{unit:"week",n:1}), priceAfter:price} : {isTrial:false,endsAt:null,priceAfter:null},
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

  /* per-sub currency select — multi-currency is a Pro perk */
  const curSel = (id, val) => {
    const opts = ST.CURRENCIES.map(c=>`<option ${c===val?"selected":""}>${c}</option>`).join("");
    return ST.isPro()
      ? `<select id="${id}">${opts}</select>`
      : `<span class="curlock" data-golock><select id="${id}" disabled>${opts}</select><span class="lk">${icon("lock")}</span></span>`;
  };
  const wireCur = (root) => root.querySelectorAll("[data-golock]").forEach(e =>
    e.onclick = () => { ST.closeSheets(); location.hash = "#/pro"; });

  /* icon + color pickers */
  const iconRow = (sel) => `<div class="iconrow">${ST.ICONS.map(i=>
    `<button type="button" data-ic="${i}" class="${sel===i?'on':''}">${icon(i)}</button>`).join("")}</div>`;
  const swatchRow = (sel) => `<div class="swatches">${ST.SWATCHES.map(c=>
    `<button type="button" data-sw="${c}" class="${sel===c?'on':''}" style="background:${c}"></button>`).join("")}</div>`;
  const wirePick = (root, onIcon, onColor) => {
    root.querySelectorAll("[data-ic]").forEach(b => b.onclick = () => {
      root.querySelectorAll("[data-ic]").forEach(x=>x.classList.toggle("on", x===b)); onIcon(b.dataset.ic); });
    root.querySelectorAll("[data-sw]").forEach(b => b.onclick = () => {
      root.querySelectorAll("[data-sw]").forEach(x=>x.classList.toggle("on", x===b)); onColor(b.dataset.sw); });
  };

  ST.screens["add/custom"] = () => {
    if (ST.atFreeLimit()) { location.hash="#/pro"; return; }
    let cyc={unit:"month",n:1}, cat="other", isTrial=false;
    ST.mount(`
      <div class="screen">
        <button class="back" onclick="ST.back()">${icon("chevL")}${t("back")}</button>
        <div class="hdr" style="padding-top:8px"><h1>${t("addCustom").replace("+ ","")}</h1></div>
        <div class="form">
          <div><label>${t("name")}</label><input id="cn" placeholder="Gym, rent, hosting…"></div>
          <div class="duo">
            <div><label>${t("price")}</label>
              <div class="curwrap"><span class="pricebox"><input id="cp" type="number" step="0.01" inputmode="decimal" placeholder="9.99"></span>${curSel("ccur", ST.state.settings.currency)}</div></div>
            <div><label>${t("firstBill")}</label><input id="cd" type="date" value="${ST.todayISO()}"></div>
          </div>
          <div><label>${t("cycle")}</label><div class="cycrow">${cycleBtns(cyc)}</div></div>
          <div><label>${t("category")}</label><div class="catrow" id="cats">
            ${ST.CATS.map(c=>`<button data-c="${c.id}" class="${c.id===cat?'on':''}"><i style="background:${c.dot}"></i>${ST.catName(c.id)}</button>`).join("")}
          </div></div>
          <div><label>${t("iconLbl")}</label>${iconRow(null)}</div>
          <div><label>${t("colorLbl")}</label>${swatchRow(null)}</div>
          <div class="togglerow"><span class="t">${t("isTrial")}</span>
            <button class="tgl" id="ctg"><i></i></button></div>
          <div id="ctrialbox" style="display:none"><label>${t("trialEnds")}</label>
            <input id="cte" type="date" value="${ST.addCycle(ST.todayISO(),{unit:'week',n:1})}"></div>
          <div><label>${t("notes")}</label><input id="cno"></div>
          <button class="cta" style="position:static;width:100%" id="csave">${t("save")}</button>
        </div>
      </div>
    `, root => {
      let pIcon=null, pColor=null;
      wireCycle(root, c=>cyc=c); wireCur(root); wirePick(root, i=>pIcon=i, c=>pColor=c);
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
          name, price, category:cat, color:pColor||catDef.dot, icon:pIcon,
          currency: root.querySelector("#ccur").value,
          nextBilling: root.querySelector("#cd").value || ST.todayISO(),
          cycle:cyc, notes: root.querySelector("#cno").value,
          trial: isTrial ? {isTrial:true, endsAt:root.querySelector("#cte").value || ST.addCycle(ST.todayISO(),{unit:"week",n:1}), priceAfter:price} : {isTrial:false,endsAt:null,priceAfter:null},
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
    const cyc = cycLabel(s.cycle);

    ST.mount(`
      <div class="screen">
        <button class="back" onclick="ST.back()">${icon("chevL")}${t("back")}</button>
        <div class="dhead">
          ${ST.tileFor(s)}
          <h2>${esc(s.name)}</h2>
          <div class="cat">${ST.catName(s.category)} · ${cyc}
            ${s.trial.isTrial?` · <span style="color:var(--amber)">${t("trialBadge")} → ${ST.fmtDate(s.trial.endsAt)}</span>`:""}</div>
        </div>
        <div class="statgrid">
          <div class="stat"><div class="l">${t("price")}</div>
            <div class="v">${ST.fmtMoney(s.price,{cur:s.currency})}<small> / ${cyc.toLowerCase()}</small></div></div>
          <div class="stat"><div class="l">${t("nextBilling")}</div>
            <div class="v">${s.status==="active"?ST.fmtDate(s.nextBilling):"—"}
              ${s.status==="active"?`<small>${ST.whenLabel(s.nextBilling)}</small>`:""}</div></div>
          <div class="stat"><div class="l">${t("totalSpent",{d:ST.fmtDate(s.startedAt,{month:"short",year:"numeric"})})}</div>
            <div class="v">${ST.fmtMoney(spent,{cur:s.currency})}</div></div>
          <div class="stat"><div class="l">${ST.catName(s.category)}</div>
            <div class="v">${ST.fmtMoney(ST.monthlyBase(s))}<small> ${t("perMo")}</small></div></div>
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
           <span>${ST.fmtMoney(p.amount,{cur:s.currency})}</span></div>`).join("")}</div>` : ""}
      </div>
    `, root => {
      root.querySelector("#dEdit").onclick = () => openEditSheet(s);
      root.querySelector("#dUsed").onclick = () => { s.lastUsed = ST.todayISO(); ST.save(); ST.toast("✓"); };
      const p = root.querySelector("#dPause");
      if (p) p.onclick = () => { s.status = s.status==="paused"?"active":"paused"; ST.save(); ST.render(); };
      const h = root.querySelector("#dHow");
      if (h) h.onclick = () => {
        const guide = ST.GUIDES[s.presetId];
        if (!guide) { window.open(preset.cancelUrl, "_blank"); return; }
        ST.sheet(`
          <div class="dhead">${ST.tileFor(s)}<h2 style="font-size:18px">${t("howCancel")}</h2></div>
          <div class="form">
            <div style="background:var(--card);border:0.5px solid var(--line2);border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.6;color:var(--txt)">${esc(guide)}</div>
            <button class="cta" style="position:static;width:100%" id="gOpen">${icon("ext")} ${t("openPage")}</button>
          </div>
        `, w => { w.querySelector("#gOpen").onclick = () => window.open(preset.cancelUrl, "_blank"); });
      };
      const c = root.querySelector("#dCancel");
      if (c) c.onclick = () => {
        s.status = "cancelled"; s.cancelledAt = ST.todayISO(); ST.save();
        ST.confetti();
        ST.toast(t("savedNow",{v:ST.fmtMoney(ST.monthlyBase(s))}));
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
      <div class="dhead">${ST.tileFor(s)}<h2 style="font-size:18px">${esc(s.name)}</h2></div>
      <div class="form">
        <div><label>${t("name")}</label><input id="en" value="${esc(s.name)}"></div>
        <div class="duo">
          <div><label>${t("price")}</label>
            <div class="curwrap"><span class="pricebox"><input id="ep" type="number" step="0.01" value="${s.price}"></span>${curSel("ecur", s.currency)}</div></div>
          <div><label>${t("nextBilling")}</label><input id="ed" type="date" value="${s.nextBilling}"></div>
        </div>
        <div><label>${t("cycle")}</label><div class="cycrow">${cycleBtns(s.cycle)}</div></div>
        <div><label>${t("iconLbl")}</label>${iconRow(s.icon)}</div>
        <div><label>${t("colorLbl")}</label>${swatchRow(s.color)}</div>
        <button class="cta" style="position:static;width:100%" id="esave">${t("save")}</button>
      </div>
    `, w => {
      let cyc = {...s.cycle}, pIcon=s.icon, pColor=s.color;
      wireCycle(w, c=>cyc=c); wireCur(w); wirePick(w, i=>pIcon=i, c=>pColor=c);
      w.querySelector("#esave").onclick = () => {
        const np = parseFloat(w.querySelector("#ep").value)||s.price;
        if (np !== s.price) s.priceHistory.push({date:ST.todayISO(), price:np}); // keep hike history
        s.name = w.querySelector("#en").value.trim() || s.name;
        s.price = np;
        s.currency = w.querySelector("#ecur").value || s.currency;
        s.nextBilling = w.querySelector("#ed").value || s.nextBilling;
        s.cycle = cyc; s.icon = pIcon; s.color = pColor;
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
        <button class="back" onclick="ST.back()">${icon("chevL")}${t("back")}</button>
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
    const top = subs.slice().sort((a,b)=>ST.monthlyBase(b)-ST.monthlyBase(a)).slice(0,3);
    const saved = ST.savedTotal();
    const hikes = ST.priceHikes();
    const unused = ST.unusedSubs();
    const cats = ST.categoryBreakdown();
    const mTotal = ST.monthlyTotal();
    const pro = ST.isPro();
    const lock = pro ? "" : `<div class="lock" onclick="location.hash='#/pro'">${icon("lock")}<span>${t("unlockPro")}</span></div>`;

    ST.mount(`
      <div class="screen">
        <div class="hdr"><h1>${t("insights")}</h1>
          <div class="acts"><button class="icobtn lime" onclick="ST.shareCard()" aria-label="${t("share")}">${icon("share")}</button></div>
        </div>

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
              ${ST.tileFor(s)}<span class="nm">${esc(s.name)}</span>
              <span class="v">${ST.fmtMoney(ST.monthlyBase(s))}${t("perMo")}</span></div>`).join("")}
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
            <div class="hikerow">${ST.tileFor(h.sub)}
              <span class="nm">${t("hikeText",{name:esc(h.sub.name),p:h.pct})}</span>
              <span class="pc">+${h.pct}%</span></div>`).join("")
          : `<div class="note" style="margin-top:8px">${t("noHikes")}</div>`}
        </div>

        ${unused.length ? `
        <div class="inscard lockcard">${lock}
          <div class="l">${t("unused")}</div>
          ${unused.map(s=>`
            <div class="hikerow">${ST.tileFor(s)}
              <span class="nm">${esc(s.name)} — ${t("unusedText",{d:ST.UNUSED_DAYS,v:ST.fmtMoney(ST.monthlyBase(s))})}</span></div>`).join("")}
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

  /* ============ MAGIC IMPORT ============ */
  ST.screens.import = () => {
    let found = [];   // parsed candidates
    ST.mount(`
      <div class="screen">
        <button class="back" onclick="ST.back()">${icon("chevL")}${t("back")}</button>
        <div class="hdr" style="padding-top:8px"><h1>${t("importTitle")}</h1></div>
        <p style="padding:2px 22px 0;font-size:13px;color:var(--mut);line-height:1.5">${t("importSub")}</p>

        <div class="imp-actions">
          <button class="imp-chip" id="impPlay">${icon("ext")}${t("importOpenPlay")}</button>
          <button class="imp-chip" id="impGmail">${icon("search")}${t("importOpenGmail")}</button>
        </div>

        <div class="form" style="padding-top:8px">
          <textarea id="impText" rows="7" placeholder="${t("importPaste")}"></textarea>
          <button class="rowbtn" id="impScan" style="width:100%;margin:0">${icon("plus")} ${t("importScan")}</button>
          <input type="file" id="impFile" accept="image/*" capture="environment" style="display:none">
          <div id="impProg" style="display:none;font-size:12px;color:var(--mut);text-align:center"></div>
          <button class="cta" style="position:static;width:100%" id="impFind">${t("importFind")}</button>
        </div>

        <div id="impResults"></div>
      </div>
    `, root => {
      root.querySelector("#impPlay").onclick  = () => window.open(ST.PLAY_SUBS, "_blank");
      root.querySelector("#impGmail").onclick = () => window.open(ST.GMAIL_SEARCH, "_blank");

      const prog = root.querySelector("#impProg");
      const fileIn = root.querySelector("#impFile");
      root.querySelector("#impScan").onclick = () => fileIn.click();
      fileIn.onchange = () => {
        const f = fileIn.files[0]; if (!f) return;
        prog.style.display = "block"; prog.textContent = t("importScanning");
        ST.runOCR(f, p => prog.textContent = t("importScanning")+" "+Math.round(p*100)+"%")
          .then(txt => {
            const ta = root.querySelector("#impText");
            ta.value = (ta.value ? ta.value+"\n" : "") + txt;
            prog.style.display = "none";
            root.querySelector("#impFind").click();
          })
          .catch(() => { prog.textContent = t("importOcrFail"); });
      };

      root.querySelector("#impFind").onclick = () => {
        found = ST.parseImport(root.querySelector("#impText").value || "");
        renderResults();
      };

      const results = root.querySelector("#impResults");
      const renderResults = () => {
        if (!found.length) {
          results.innerHTML = `<div class="calempty">${t("importNone")}</div>
            <button class="rowbtn" onclick="location.hash='#/add/custom'">${t("addCustom")}</button>`;
          return;
        }
        const sel = new Set(found.map((_,i)=>i));
        const draw = () => {
          results.innerHTML = `
            <div class="sect"><div class="t">${t("importFoundN",{n:found.length})}</div></div>
            <div class="sublist">${found.map((c,i)=>{
              const cyc = c.cycle.unit==="year"?t("year"):c.cycle.unit==="week"?t("week"):c.cycle.n===3?t("months3"):t("month");
              return `<div class="subcard imp-pick ${sel.has(i)?'on':''}" data-i="${i}">
                ${ST.tile(c.color,c.category,"",c.icon)}
                <span style="flex:1"><span class="nm">${esc(c.name)}</span>
                  <span class="dt" style="display:block">${ST.fmtDate(c.nextBilling)} · ${cyc.toLowerCase()}</span></span>
                <span class="pr">${ST.fmtMoney(c.price,{cur:c.currency})}</span>
                <span class="imp-check">${sel.has(i)?icon("check"):""}</span>
              </div>`;
            }).join("")}</div>
            <button class="cta" style="position:static;width:100%" id="impAdd">${t("importAddN",{n:sel.size})}</button>`;
          results.querySelectorAll(".imp-pick").forEach(el => el.onclick = () => {
            const i = +el.dataset.i; sel.has(i)?sel.delete(i):sel.add(i); draw();
          });
          const add = results.querySelector("#impAdd");
          if (add) add.onclick = () => {
            let n = 0;
            for (const i of sel) {
              if (ST.atFreeLimit()) { location.hash="#/pro"; return; }
              const c = found[i];
              ST.state.subs.push(ST.newSub({
                presetId:c.presetId, name:c.name, category:c.category, color:c.color, icon:c.icon,
                price:c.price, currency:c.currency, cycle:c.cycle, nextBilling:c.nextBilling,
                priceHistory:[{date:ST.todayISO(), price:c.price}],
              }));
              n++;
            }
            ST.save(); ST.toast(t("importedN",{n})); ST.askNotifPermission();
            location.hash = "#/";
          };
        };
        draw();
      };
    });
  };

  /* ============ CALENDAR ============ */
  ST.screens.calendar = () => {
    if (!ST._calYM) { const d=new Date(); ST._calYM=[d.getFullYear(), d.getMonth()]; }
    const [y,m] = ST._calYM;
    const first = new Date(y,m,1), last = new Date(y,m+1,0);
    const iso = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    const startISO = iso(first), endISO = iso(last), today = ST.todayISO();

    // date -> [{sub, amount}]: past = paymentLog, future = projected from nextBilling
    const map = {};
    const push = (d,e) => (map[d] = map[d]||[]).push(e);
    ST.state.subs.forEach(s => s.paymentLog.forEach(p => {
      if (p.date>=startISO && p.date<=endISO) push(p.date, {sub:s, amount:p.amount});
    }));
    ST.activeSubs().forEach(s => {
      const anchor = Number((s.startedAt||s.nextBilling).split("-")[2]);
      let d = s.nextBilling, guard=0;
      while (d <= endISO && guard++ < 40) {
        if (d >= startISO) push(d, {sub:s, amount:s.price});
        d = ST.addCycle(d, s.cycle, anchor);
      }
    });
    const entries = Object.values(map).flat();
    const monthTotal = entries.reduce((a,e)=>a+ST.conv(e.amount,e.sub.currency),0);

    if (!ST._calSel || !ST._calSel.startsWith(startISO.slice(0,7)))
      ST._calSel = (today>=startISO && today<=endISO) ? today : startISO;
    const sel = ST._calSel;

    const dow = [];
    for (let i=0;i<7;i++) dow.push(new Date(2026,5,1+i).toLocaleDateString(ST.lang(),{weekday:"narrow"}));
    const blanks = (first.getDay()+6)%7;
    let cells = "";
    for (let i=0;i<blanks;i++) cells += `<div></div>`;
    for (let d=1; d<=last.getDate(); d++){
      const dISO = startISO.slice(0,8)+String(d).padStart(2,"0");
      const dots = (map[dISO]||[]).slice(0,3).map(e=>`<i style="background:${e.sub.color}"></i>`).join("");
      cells += `<button class="calcell ${dISO===today?'today':''} ${dISO===sel?'sel':''}" data-d="${dISO}">
        ${d}<span class="dots">${dots}</span></button>`;
    }
    const dayList = (map[sel]||[]);

    ST.mount(`
      <div class="screen">
        <div class="calhead">
          <button class="icobtn" id="calPrev">${icon("chevL")}</button>
          <div class="mt">${first.toLocaleDateString(ST.lang(),{month:"long",year:"numeric"})}</div>
          <button class="icobtn" id="calNext">${icon("chevR")}</button>
        </div>
        <div class="calsum">${t("calSummary",{n:entries.length, v:ST.fmtMoney(monthTotal)})}</div>
        <div class="calgrid">${dow.map(w=>`<div class="caldow">${w}</div>`).join("")}${cells}</div>
        <div class="caldaylist">
          ${dayList.length ? dayList.map(e=>`
            <button class="subcard" onclick="location.hash='#/sub/${e.sub.id}'">
              ${ST.tileFor(e.sub)}
              <span style="flex:1"><span class="nm">${esc(e.sub.name)}</span>
                <span class="dt" style="display:block">${ST.fmtDate(sel)}</span></span>
              <span class="pr">${ST.fmtMoney(e.amount,{cur:e.sub.currency})}</span>
            </button>`).join("")
          : `<div class="calempty">${t("calNone")}</div>`}
        </div>
      </div>
    `, root => {
      root.querySelector("#calPrev").onclick = () => {
        let [yy,mm]=ST._calYM; mm--; if(mm<0){mm=11;yy--;} ST._calYM=[yy,mm]; ST._calSel=null; ST.render(); };
      root.querySelector("#calNext").onclick = () => {
        let [yy,mm]=ST._calYM; mm++; if(mm>11){mm=0;yy++;} ST._calYM=[yy,mm]; ST._calSel=null; ST.render(); };
      root.querySelector(".calgrid").addEventListener("click", e => {
        const b = e.target.closest("[data-d]"); if(!b) return;
        ST._calSel = b.dataset.d; ST._keepScroll=true; ST.render();
      });
    });
  };

  /* ============ SHARE CARD ============ */
  ST.buildShareCanvas = () => {
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1350;
    const x = c.getContext("2d");
    const F = "-apple-system,'SF Pro Display',system-ui,sans-serif";
    x.fillStyle = "#09090B"; x.fillRect(0,0,1080,1350);

    x.strokeStyle="#2C2C30"; x.lineWidth=54; x.lineCap="round";
    x.beginPath(); x.arc(540,300,165,0,Math.PI*2); x.stroke();
    x.strokeStyle="#D7FF3F";
    x.beginPath(); x.arc(540,300,165,-Math.PI/2,-Math.PI/2+Math.PI*1.4); x.stroke();

    x.textAlign="center";
    x.fillStyle="#8E8E93"; x.font="500 40px "+F;
    x.fillText(ST.t("shareMy").toUpperCase(), 540, 610);
    x.fillStyle="#F5F5F7"; x.font="300 150px "+F;
    x.fillText(ST.fmtMoney(ST.monthlyTotal()), 540, 760);
    x.fillStyle="#6E6E73"; x.font="400 46px "+F;
    x.fillText(ST.fmtMoney(ST.yearlyTotal(),{round:1})+" "+ST.t("perYr")+"  ·  "+ST.activeSubs().length+" "+ST.t("active").toLowerCase(), 540, 830);

    const top = ST.activeSubs().slice().sort((a,b)=>ST.monthlyBase(b)-ST.monthlyBase(a)).slice(0,3);
    let yy = 930;
    top.forEach(s => {
      x.fillStyle = s.color;
      if (x.roundRect){ x.beginPath(); x.roundRect(180, yy-46, 64, 64, 18); x.fill(); }
      else x.fillRect(180, yy-46, 64, 64);
      x.textAlign="left"; x.fillStyle="#F5F5F7"; x.font="500 44px "+F;
      x.fillText(s.name, 280, yy);
      x.textAlign="right"; x.fillStyle="#8E8E93"; x.font="400 40px "+F;
      x.fillText(ST.fmtMoney(ST.monthlyBase(s))+ST.t("perMo"), 900, yy);
      x.textAlign="center"; yy += 110;
    });

    x.fillStyle="#D7FF3F"; x.beginPath(); x.arc(430,1270,14,0,Math.PI*2); x.fill();
    x.textAlign="left"; x.fillStyle="#F5F5F7"; x.font="600 40px "+F;
    x.fillText("SubTrack", 460, 1284);
    x.textAlign="center"; x.fillStyle="#6E6E73"; x.font="400 30px "+F;
    x.fillText(ST.t("shareTag"), 540, 1330);
    return c;
  };
  ST.shareCard = () => {
    ST.buildShareCanvas().toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], "subtrack-card.png", {type:"image/png"});
      if (navigator.canShare && navigator.canShare({files:[file]})) {
        try { await navigator.share({files:[file], title:"SubTrack"}); return; } catch(e){}
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "subtrack-card.png"; a.click();
      ST.toast(ST.t("shareDone"));
    }, "image/png");
  };

  /* ============ SETTINGS ============ */
  ST.screens.settings = () => {
    const st = ST.state.settings;
    const CURR = ST.CURRENCIES;
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
          <button class="setrow" id="sCsv"><span class="ic" style="background:#0F1F14;color:#34C759">${icon("download")}</span>
            <span class="t">${t("exportCsv")}</span>${ST.isPro()?"":icon("lock","")}</button>
          <button class="setrow" id="sImport"><span class="ic" style="background:#101B2A;color:#5AC8FA">${icon("upRight")}</span>
            <span class="t">${t("importCsv")}</span></button>
          <input type="file" id="sImportFile" accept=".csv,text/csv" style="display:none">
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
      root.querySelector("#sCsv").onclick = () => {
        if (!ST.isPro()) { location.hash="#/pro"; return; }
        const head = "name,price,currency,cycleUnit,cycleN,nextBilling,category,status,startedAt,notes";
        const q = v => { v=String(v??""); return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; };
        const rows = ST.state.subs.map(s=>[s.name,s.price,s.currency,s.cycle.unit,s.cycle.n,
          s.nextBilling,s.category,s.status,s.startedAt,s.notes].map(q).join(","));
        const blob = new Blob([head+"\n"+rows.join("\n")],{type:"text/csv"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "subtrack-export.csv"; a.click();
      };
      const fileIn = root.querySelector("#sImportFile");
      root.querySelector("#sImport").onclick = () => fileIn.click();
      fileIn.onchange = () => {
        const f = fileIn.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          const rows = parseCSV(String(rd.result));
          let n = 0;
          for (const r of rows) {
            if (r[0] && r[0].toLowerCase()==="name") continue;               // header
            const [name,price,currency,unit,cn,nextBilling,category,status,startedAt,notes] = r;
            if (!name || !parseFloat(price)) continue;
            if (ST.atFreeLimit()) break; // free cap
            ST.state.subs.push(ST.newSub({
              name, price:parseFloat(price),
              currency: ST.CURRENCIES.includes(currency) ? currency : ST.state.settings.currency,
              cycle: {unit: ["week","month","year"].includes(unit)?unit:"month", n: Math.max(1, parseInt(cn)||1)},
              nextBilling: /^\d{4}-\d{2}-\d{2}$/.test(nextBilling) ? nextBilling : ST.todayISO(),
              category: ST.CATS.some(c=>c.id===category) ? category : "other",
              status: ["active","paused","cancelled"].includes(status) ? status : "active",
              startedAt: /^\d{4}-\d{2}-\d{2}$/.test(startedAt) ? startedAt : ST.todayISO(),
              notes: notes||"",
              priceHistory:[{date:ST.todayISO(), price:parseFloat(price)}],
            }));
            n++;
          }
          ST.save(); ST.toast(t("importedN",{n})); ST.render();
        };
        rd.readAsText(f);
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
        <button class="back" onclick="ST.back()">${icon("chevL")}${t("back")}</button>
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
