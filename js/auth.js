/* SubTrack auth + cloud sync.
   DEMO backend: accounts & cloud snapshots live in localStorage.
   Every method is a seam for a real backend (Supabase) — see NOTE markers. */
(function(){
  const ST = window.ST = window.ST || {};
  const CLOUD = "subtrack.cloud.";      // + email  → {subs, settings, pro}
  const pending = {};                    // email → demo verification code (in-memory)

  const now = () => new Date().toISOString();
  const cloudKey = (email) => CLOUD + email.trim().toLowerCase();
  const readCloud = (email) => { try { return JSON.parse(localStorage.getItem(cloudKey(email))||"null"); } catch(e){ return null; } };
  const writeCloud = (email, snap) => { try { localStorage.setItem(cloudKey(email), JSON.stringify(snap)); } catch(e){} };
  const snapshot = () => ({ subs: ST.state.subs, settings: ST.state.settings, pro: ST.state.pro, at: now() });

  const A = ST.auth = {};

  A.isSignedIn = () => !!(ST.state.account && ST.state.account.primaryEmail);
  A.emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||"").trim());

  /* ---- demo email verification (NOTE: real backend emails a real code / OTP) ---- */
  A.sendCode = (email) => {
    const code = String(Math.floor(100000 + Math.random()*900000));
    pending[email.trim().toLowerCase()] = code;
    return code;   // returned only so the demo UI can show it; real backend returns nothing
  };
  A.checkCode = (email, code) => pending[email.trim().toLowerCase()] === String(code||"").trim();

  /* ---- sign in ---- */
  // provider: 'google' | 'apple' → OAuth implies a verified email (demo: passed in).
  // 'email' → must be verified via sendCode/checkCode first.
  A.signIn = (email, provider) => {
    email = email.trim().toLowerCase();
    const existing = ST.state.account;
    const acc = (existing && existing.primaryEmail===email) ? existing : {
      id: ST.uuid(), name: email.split("@")[0], primaryEmail: email, provider,
      emails: [{address:email, provider, verified:true, addedAt:now()}], backedUpAt:null,
    };
    if (!acc.emails.some(e=>e.address===email))
      acc.emails.push({address:email, provider, verified:true, addedAt:now()});
    ST.state.account = acc;
    ST.save();
    return { account: acc, cloud: readCloud(email) };   // caller decides merge/replace
  };

  /* merge cloud snapshot into local (union subs by id, then by name+price) */
  A.mergeCloud = (snap) => {
    if (!snap || !snap.subs) return;
    const seen = new Set(ST.state.subs.map(s=>s.id));
    const key = s => (s.name||"").toLowerCase()+"|"+s.price+"|"+s.cycle.unit;
    const keys = new Set(ST.state.subs.map(key));
    snap.subs.forEach(s => {
      if (seen.has(s.id) || keys.has(key(s))) return;
      seen.add(s.id); keys.add(key(s));
      ST.state.subs.push(s);
    });
    if (snap.pro && snap.pro.active && !ST.state.pro.active) ST.state.pro = snap.pro;
    ST.save();
  };
  A.replaceWithCloud = (snap) => {
    if (!snap || !snap.subs) return;
    ST.state.subs = snap.subs;
    if (snap.settings) ST.state.settings = Object.assign(ST.state.settings, snap.settings);
    if (snap.pro) ST.state.pro = snap.pro;
    ST.save();
  };

  /* ---- cloud sync ---- */
  A.syncNow = () => {                    // NOTE: real backend → upsert row for user
    if (!A.isSignedIn()) return;
    writeCloud(ST.state.account.primaryEmail, snapshot());
    ST.state.account.backedUpAt = now();
    try { localStorage.setItem("subtrack.state.v1", JSON.stringify(ST.state)); } catch(e){}
  };
  let syncT = null;
  A.onSaved = () => {                    // called by ST.save()
    if (!A.isSignedIn()) return;
    clearTimeout(syncT);
    syncT = setTimeout(A.syncNow, 400);  // debounce
  };

  /* ---- linked emails ---- */
  A.addVerifiedEmail = (email, provider) => {
    email = email.trim().toLowerCase();
    const acc = ST.state.account; if (!acc) return;
    if (acc.emails.some(e=>e.address===email)) return;
    acc.emails.push({address:email, provider:provider||"email", verified:true, addedAt:now()});
    // NOTE: real backend links this identity to the same user id; here we also
    // fold that email's cloud snapshot in, so subs from another account merge.
    A.mergeCloud(readCloud(email));
    writeCloud(email, snapshot());       // keep both mailboxes pointing at the same data
    ST.save();
  };
  A.removeEmail = (address) => {
    const acc = ST.state.account; if (!acc) return;
    if (address === acc.primaryEmail) return;   // can't remove primary
    acc.emails = acc.emails.filter(e=>e.address!==address);
    ST.save();
  };

  A.signOut = () => { ST.state.account = null; ST.save(); };

  /* ---- account deletion (Play policy requires server-side delete) ---- */
  A.deleteAccount = (alsoWipeLocal) => {
    const acc = ST.state.account; if (!acc) return;
    acc.emails.forEach(e => { try { localStorage.removeItem(cloudKey(e.address)); } catch(_){} }); // delete cloud
    ST.state.account = null;
    if (alsoWipeLocal) { ST.state.subs = []; ST.state.pro = {active:false,plan:null,since:null}; }
    ST.save();
  };

  /* ---- legal pages (English; contact is a real seam) ---- */
  const CONTACT = "dato.kometiani89@gmail.com";
  ST.LEGAL = {
    privacy: () => `
      <p>SubTrack is a subscription tracker. This policy explains what we collect and why. Last updated July 2026.</p>
      <h3>What stays on your device</h3>
      <p>Your subscriptions, prices, dates, notes and settings are stored locally on your device. You can use the entire app without an account and without sending anything to us.</p>
      <h3>Magic Import</h3>
      <p>When you paste text or scan a receipt, parsing happens entirely on your device. Images and pasted text are never uploaded. We do not read your email or connect to your bank.</p>
      <h3>Optional account &amp; backup</h3>
      <p>If you create an account, your email address and a backup of your subscription data are used only to sync across your own devices. We never sell your data or share it with advertisers.</p>
      <h3>Currency rates</h3>
      <p>To convert currencies the app fetches public exchange rates from a third-party API. No personal data is sent with that request.</p>
      <h3>Delete your data</h3>
      <p>You can erase all local data in Settings, and delete your account and its cloud backup from the Account screen at any time.</p>
      <h3>Contact</h3>
      <p><a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
    terms: () => `
      <p>By using SubTrack you agree to these terms. Last updated July 2026.</p>
      <h3>The service</h3>
      <p>SubTrack helps you track subscriptions and reminders. Amounts, renewal dates and insights are estimates for your convenience and are not financial advice.</p>
      <h3>Your responsibility</h3>
      <p>You are responsible for the accuracy of the data you enter and for cancelling any subscription yourself. SubTrack does not cancel subscriptions or move money on your behalf.</p>
      <h3>Subscriptions &amp; payments</h3>
      <p>SubTrack Pro is an optional purchase. In this build, purchases and sign-in are simulated on your device; real billing arrives with the store release.</p>
      <h3>Availability</h3>
      <p>The app is provided "as is" without warranties. We are not liable for missed renewals, charges, or data loss. Keep your own backups of important information.</p>
      <h3>Contact</h3>
      <p><a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
  };
})();
