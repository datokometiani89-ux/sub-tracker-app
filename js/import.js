/* SubTrack — Magic Import: parse pasted text / OCR into subscription candidates.
   100% on-device, no backend, no Gmail scope, no audit. */
(function(){
  const ST = window.ST = window.ST || {};

  const SYM = {"$":"USD","€":"EUR","£":"GBP","₾":"GEL","₽":"RUB","₺":"TRY","¥":"JPY","₹":"INR"};
  const SYM_RE = "[$€£₾₽₺¥₹]";
  const CODE_RE = ST.CURRENCIES ? ST.CURRENCIES.join("|") : "USD|EUR|GBP";

  /* "15,49" / "1,299.00" / "1.299,00" → 15.49 / 1299 / 1299 */
  const normNum = (s) => {
    s = s.replace(/\s/g,"");
    const hasDot = s.includes("."), hasCom = s.includes(",");
    if (hasDot && hasCom) {
      const dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
      s = dec==="." ? s.replace(/,/g,"") : s.replace(/\./g,"").replace(",",".");
    } else if (hasCom) {
      s = /,\d{1,2}$/.test(s) ? s.replace(",",".") : s.replace(/,/g,"");
    }
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  ST.extractPrice = (line) => {
    let m;
    // symbol prefix:  $15.49
    m = line.match(new RegExp("("+SYM_RE+")\\s?(\\d[\\d.,]*)"));
    if (m) return {amount: normNum(m[2]), currency: SYM[m[1]]};
    // number then symbol:  15,49 €
    m = line.match(new RegExp("(\\d[\\d.,]*)\\s?("+SYM_RE+")"));
    if (m) return {amount: normNum(m[1]), currency: SYM[m[2]]};
    // code prefix/suffix:  USD 15.49  /  15.49 USD
    m = line.match(new RegExp("\\b("+CODE_RE+")\\b\\s?(\\d[\\d.,]*)","i"));
    if (m) return {amount: normNum(m[2]), currency: m[1].toUpperCase()};
    m = line.match(new RegExp("(\\d[\\d.,]*)\\s?\\b("+CODE_RE+")\\b","i"));
    if (m) return {amount: normNum(m[1]), currency: m[2].toUpperCase()};
    // bare decimal with 2 dp (bank statements: "NETFLIX 15.49")
    m = line.match(/(?:^|\s)(\d{1,4}[.,]\d{2})(?:\s|$)/);
    if (m) return {amount: normNum(m[1]), currency: null};
    return null;
  };

  const CYC = [
    [/\b(annual|year|yearly|yr|\/\s?yr|per year|p\.?a\.?)\b/i, {unit:"year",n:1}],
    [/\b(week|weekly|wk|\/\s?wk|per week)\b/i, {unit:"week",n:1}],
    [/\b(quarter|quarterly|3\s?months?)\b/i, {unit:"month",n:3}],
    [/\b(6\s?months?|semi-?annual)\b/i, {unit:"month",n:6}],
    [/\b(month|monthly|mo|\/\s?mo|per month|p\/m)\b/i, {unit:"month",n:1}],
  ];
  ST.extractCycle = (line) => { for (const [re,c] of CYC) if (re.test(line)) return c; return null; };

  const MON = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const toISO = (y,m,d) => y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
  const rollFuture = (iso) => {  // undated "renews Aug 5" → next occurrence
    if (iso >= ST.todayISO()) return iso;
    const [y,m,d] = iso.split("-").map(Number);
    return toISO(y+1, m-1, d);
  };
  ST.extractDate = (line) => {
    let m;
    m = line.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m) return toISO(+m[1], +m[2]-1, +m[3]);
    m = line.match(/\b([a-z]{3,})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
    if (m && MON[m[1].slice(0,3).toLowerCase()] !== undefined) {
      const mm = MON[m[1].slice(0,3).toLowerCase()];
      const y = m[3] ? +m[3] : new Date().getFullYear();
      const iso = toISO(y, mm, +m[2]);
      return m[3] ? iso : rollFuture(iso);
    }
    m = line.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})\b/);
    if (m) {
      let [_,a,b,c] = m; a=+a; b=+b; c=+c; if (c<100) c+=2000;
      const [dd,mm] = a>12 ? [a,b] : [b,a];          // DD/MM if day>12, else MM/DD
      return toISO(c, mm-1, dd);
    }
    return null;
  };

  /* preset name match with light alias (strip Plus/Premium/Pro/+/Sub) */
  const baseName = (s) => s.toLowerCase().replace(/\b(premium|plus|pro|gold|sub|subscription|\+)\b/gi,"").replace(/[^a-z0-9 ]/g,"").trim();
  const findPreset = (line) => {
    const L = line.toLowerCase();
    let best = null;
    for (const p of ST.PRESETS) {
      const full = p.name.toLowerCase();
      if (L.includes(full)) return p;                 // exact wins
      const b = baseName(p.name);
      if (b.length >= 4 && new RegExp("\\b"+b.replace(/ /g,"\\s?")+"\\b").test(L)) best = best||p;
    }
    return best;
  };

  const cleanName = (line) => line
    .replace(new RegExp("("+SYM_RE+")\\s?\\d[\\d.,]*","g"),"")
    .replace(new RegExp("\\d[\\d.,]*\\s?("+SYM_RE+")","g"),"")
    .replace(new RegExp("\\b("+CODE_RE+")\\b\\s?\\d[\\d.,]*","gi"),"")
    .replace(/\d{4}-\d{2}-\d{2}/g,"").replace(/\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}/g,"")
    .replace(/\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?/ig,"") // "05 JUL"
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(,?\s+\d{4})?/ig,"") // "Jul 5, 2026"
    .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/ig,"")
    .replace(/\d{1,4}[.,]\d{2}\b/g,"").replace(/[.,]\d{2}\b/g,"")   // bare amounts + leftover ".99"
    .replace(/\b(renews?|next billing|billed|subscription|subscr|monthly|yearly|weekly|per month|per year|auto-?renew|expires?|payment|com|www)\b/ig,"")
    .replace(/[·•*×#·:|]+/g," ").replace(/[-–—/]+/g," ").replace(/\s{2,}/g," ").trim();

  /* MAIN: text → [{name,price,currency,cycle,nextBilling,category,color,presetId,icon,src}] */
  ST.parseImport = (text) => {
    const raw = text.split(/\r?\n/).map(l=>l.trim());
    const lines = raw.filter((l,i)=> l && l.toLowerCase() !== (raw[i-1]||"").toLowerCase()); // drop empties + dup lines
    const out = [], seenPreset = new Set(), seenName = new Set(), used = new Set();
    const base = ST.state.settings.currency;

    // look ahead within this + next 3 lines, but stop before the next DIFFERENT preset
    const look = (i, fn) => {
      const cur = findPreset(lines[i]);
      const stop = Math.min(lines.length, i+4);
      for (let j=i;j<stop;j++){
        if (j>i) { const pj = findPreset(lines[j]); if (pj && pj!==cur) break; }
        const r = fn(lines[j]); if (r) return {val:r, idx:j};
      }
      return null;
    };

    // pass 1: preset rows (consume the lines that supplied price/date)
    for (let i=0;i<lines.length;i++){
      const preset = findPreset(lines[i]);
      if (!preset || seenPreset.has(preset.id)) continue;
      seenPreset.add(preset.id); used.add(i);
      const pRes = ST.extractPrice(lines[i]) ? {val:ST.extractPrice(lines[i]),idx:i} : look(i, ST.extractPrice);
      const cRes = look(i, ST.extractCycle);
      const dRes = look(i, ST.extractDate);
      [pRes,cRes,dRes].forEach(r=>{ if(r) used.add(r.idx); });
      const cyc = (cRes&&cRes.val) || {unit:"month",n:1};
      out.push({ name:preset.name, presetId:preset.id, category:preset.category, color:preset.color, icon:null,
        price: pRes ? pRes.val.amount : preset.priceUSD, currency: (pRes&&pRes.val.currency)||base,
        cycle:cyc, nextBilling: (dRes&&dRes.val) || ST.addCycle(ST.todayISO(), cyc), src:"preset" });
    }

    // pass 2: leftover lines with a price → custom (bank statements etc.)
    for (let i=0;i<lines.length;i++){
      if (used.has(i)) continue;
      const price = ST.extractPrice(lines[i]);
      if (!price || !price.amount) continue;
      const name = cleanName(lines[i]);
      if ((name.match(/[a-zа-яё]/gi)||[]).length < 2) continue;   // need ≥2 real letters
      const key = name.toLowerCase()+"|"+price.amount;
      if (seenName.has(key)) continue;
      seenName.add(key);
      const cyc = ST.extractCycle(lines[i]) || {unit:"month",n:1};
      const dt  = ST.extractDate(lines[i]);
      out.push({ name, presetId:null, category:"other", color:ST.cat("other").dot, icon:null,
        price: price.amount, currency: price.currency||base,
        cycle:cyc, nextBilling: dt || ST.addCycle(ST.todayISO(), cyc), src:"custom" });
    }
    return out;
  };

  /* lazy Tesseract.js (free, on-device OCR) */
  ST.runOCR = (file, onProgress) => new Promise((resolve, reject) => {
    const go = () => window.Tesseract.recognize(file, "eng", {
      logger: m => onProgress && m.status==="recognizing text" && onProgress(m.progress)
    }).then(r => resolve(r.data.text)).catch(reject);
    if (window.Tesseract) return go();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    s.onload = go; s.onerror = () => reject(new Error("ocr-load"));
    document.head.appendChild(s);
  });

  /* deep links (no permission needed) */
  ST.PLAY_SUBS = "https://play.google.com/store/account/subscriptions";
  ST.APPLE_SUBS = "https://apps.apple.com/account/subscriptions";
  ST.GMAIL_SEARCH = "https://mail.google.com/mail/u/0/#search/" +
    encodeURIComponent("subject:(subscription OR receipt OR renewal OR invoice OR payment) newer_than:1y");
})();
