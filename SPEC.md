# SubTrack — Subscription Tracker (სამუშაო სახელი)
## სრული პროდუქტის სპეციფიკაცია v1.0

> გლობალური ბაზრისთვის. Premium dark დიზაინი (ლაიმის აქცენტი #D7FF3F, ფონი #09090B) —
> დამტკიცებული mockup-ის მიხედვით. Local-first, ანგარიში არასავალდებულო.

---

## 1. პროდუქტის არსი

**ერთი წინადადებით:** აპი, რომელიც აჩვენებს რამდენს ხარჯავ subscription-ებზე და გაფრთხილებს სანამ ფული ჩამოგეჭრება.

**მთავარი ღირებულება (რიგითობით):**
1. **Renewal alerts** — "Spotify 2 დღეში განახლდება" → გააუქმე სანამ გვიანია
2. **ჯამური სურათი** — "თვეში $85, წელიწადში $1,019" (aha-moment)
3. **Insights** — სად ზოგავ, რა არ გამოგიყენებია, ვინ გაზარდა ფასი

**KPI-ები:**
- D1 retention ≥ 40%, D30 ≥ 15%
- Onboarding completion (მინ. 1 subscription დამატებული) ≥ 70%
- Free→Pro კონვერსია ≥ 3%
- Notification opt-in ≥ 60%

---

## 2. ტექნიკური ჩარჩო

| რა | გადაწყვეტა |
|----|-----------|
| Front-end | Vanilla HTML/CSS/JS, no build (VITA-ს პატერნი: IIFE მოდულები, hash router, `window.ST` namespace) |
| შენახვა | **Local-first**: `localStorage` (`subtrack.state.v1`) + IndexedDB (თუ ისტორია გაიზარდა) |
| Sync/Backup | ეტაპი 2: Google/Apple sign-in → cloud backup (Firebase/Supabase seam) |
| Store | PWA → **TWA (Bubblewrap)** Play Store-ზე; შემდეგ Capacitor iOS-ისთვის |
| Notifications | ეტაპი 1: local notifications (Notification API + SW); TWA-ში მუშაობს |
| ვალუტის კურსები | უფასო API (exchangerate.host ან frankfurter.app), ქეშირება 24სთ |
| Analytics | მინიმალური, privacy-friendly (მაგ. საკუთარი event log ან Plausible) |
| Monetization | AdMob (banner Insights-ზე + interstitial იშვიათად) + **Pro** in-app purchase |

### i18n
- ბაზა **EN**; ჩაშენებული: **RU, ES, PT-BR, DE, FR, IT, TR, PL, HI, ID, JA, KO, ZH** (ეტაპობრივად)
- VITA-ს `i18n.js` პატერნი: `{ en: "...", ru: "...", es: "..." }` ობიექტები, `ST.t(key)`
- ტექსტი UI-ში მინიმალურია (რიცხვები/ლოგოები/თარიღები) → თარგმანი იაფია
- ვალუტა და თარიღის ფორმატი `Intl.NumberFormat`/`Intl.DateTimeFormat`-ით locale-ის მიხედვით

---

## 3. მომხმარებლის ფლოუები

### 3.1 პირველი გაშვება / Onboarding (მიზანი: 60 წამში პირველი subscription)

**პრინციპი: რეგისტრაცია არ არის საჭირო.** Local-first — მონაცემები ტელეფონზეა.
ანგარიში მხოლოდ backup/sync-ისთვის სთავაზდება, მოგვიანებით.

```
Splash (ლოგო, 1წმ)
  → Welcome carousel (3 სლაიდი, skip-ით):
      1. "Know what you pay" — ჰერო-რიცხვის ილუსტრაცია
      2. "Never miss a renewal" — countdown ბარათი
      3. "Cancel what you don't use" — insights
  → ვალუტის არჩევა (auto-detect locale-დან, შეცვლადი): USD/EUR/GBP/₾/₽/R$/...
  → "Add your first subscription" (ქვემოთ 3.2)
  → პირველი დამატების შემდეგ → notification permission prompt
      (კონტექსტით: "გინდა შეგახსენოთ Netflix-ის განახლებამდე 3 დღით ადრე?")
  → Home
```

- Carousel-ის ყოველ სლაიდზე "Skip" → პირდაპირ ვალუტა+დამატება.
- Permission prompt **არასდროს** პირველ ეკრანზე — მხოლოდ პირველი subscription-ის შემდეგ, კონტექსტით (opt-in rate ~2x იზრდება).
- ანგარიშის შექმნის შეთავაზება: მე-3 subscription-ის შემდეგ ან Settings-დან ("Back up your data").

### 3.2 Subscription-ის დამატება (core flow — მაქს. 4 ტაპი პრესეტიდან)

```
[+] ღილაკი (Home-ის ზედა მარჯვენა / ცარიელი მდგომარეობის CTA)
  → Search sheet: საძიებო ველი + პოპულარულების grid (ლოგოებით)
      ├─ ნაპოვნია პრესეტში (Netflix, Spotify, ChatGPT...)
      │    → Preset detail: სახელი/ლოგო/ფერი/კატეგორია უკვე შევსებულია
      │       მომხმარებელი ირჩევს/ადასტურებს:
      │         • Plan (თუ პრესეტს აქვს გეგმები: Basic/Standard/Premium → ფასი auto)
      │         • ფასი (editable, ვალუტა default-იდან)
      │         • Billing cycle: weekly / monthly / every 3 mo / yearly / custom (N დღე)
      │         • First/next billing date (date picker, default: დღეს)
      │       → Save
      └─ ვერ ნაპოვნია → "Add custom"
           → Custom form: სახელი*, ფასი*, cycle*, next date*,
             კატეგორია (picker), ფერი+icon (auto-გენერირებული ინიციალებიდან, შეცვლადი),
             შენიშვნა (optional)
           → Save
Save-ის შემდეგ → Home, ახალი ბარათი subtle ანიმაციით + toast "Added ✓"
```

**პრესეტ-კატალოგი (ჩაშენებული JSON, ~250 სერვისი):**
- ველები: `id, name, category, brandColor, icon, plans[{name, priceUSD, cycle}], cancelUrl, region[]`
- ტოპ გლობალურები: Netflix, Spotify, YouTube Premium, Disney+, HBO Max, Apple One/iCloud/Music/TV+, Amazon Prime, ChatGPT, Claude, Midjourney, Google One, Dropbox, Notion, Figma, Adobe CC, Microsoft 365, PS Plus, Xbox Game Pass, Nintendo Online, Duolingo, Headspace, Calm, Strava, Tinder/Bumble, LinkedIn Premium, Twitch, Patreon, NYT, Medium, Audible, Kindle Unlimited, Crunchyroll, NordVPN/Express, 1Password, GitHub Copilot...
- რეგიონული პაკეტები locale-ის მიხედვით (RU: Yandex Plus, Kinopoisk; BR: Globoplay; DE: Sky...)
- ლოგოები: **არა ბრენდირებული ასლები** (trademark რისკი) — ფერადი tile + კატეგორიის icon ან ინიციალები, ბრენდის ფერით. (როგორც mockup-შია.)

**Free trial-ის მხარდაჭერა:**
- Toggle "This is a free trial" → ველი "Trial ends on [date]" + "Then costs [price]"
- Trial-ის ბოლომდე 3/1 დღით ადრე აგრესიული შეხსენება: **"Trial ends tomorrow — cancel or pay $15.49"**
- Trial ბარათს აქვს ცალკე ბეჯი "TRIAL" (ყვითელი)

### 3.3 Home (მთავარი ეკრანი — დამტკიცებული mockup)

**შემადგენლობა (ზემოდან ქვემოთ):**
1. Header: "Subscriptions" + Search + [+]
2. **Monthly/Yearly segmented control** — გადართავს ყველა რიცხვს
3. **Hero-რიცხვი**: ჯამი /mo (yearly ხედში /yr), ქვემოთ:
   - Δ chip წინა თვესთან ("↓ $4.99 vs June" მწვანე / "↑" წითელი)
   - მეორადი რიცხვი: წლიური ექვივალენტი
4. **კატეგორიების bar** (სეგმენტირებული, ლაიმი/იისფერი/ნაცრისფერი) + legend
5. **Next renewal ბარათი** — ყველაზე ახლო განახლება countdown ring-ით + "Review" ღილაკი
6. **Active list** — sort: Next renewal (default) / Price / Name / Category
   - თითო ბარათი: tile + სახელი + განახლების თარიღი (ახლოს = ლაიმის ფერით "in 2 days") + ფასი
   - Swipe left: Pause / Delete; Tap: Detail
7. Floating pill tab bar: **Home / Insights / Calendar / Profile**

**ჯამის დათვლის წესები:**
- ყველა cycle ნორმალიზდება: weekly×4.33, quarterly÷3, yearly÷12 → monthly ხედი
- სხვადასხვა ვალუტის subscription-ები კონვერტირდება default ვალუტაში (კურსის ქეში); ბარათზე ორიგინალი ფასი ჩანს
- Paused არ ითვლება ჯამში (ბარათი ჩამქრალი, ბეჯი "PAUSED")

### 3.4 Subscription detail

```
Tap ბარათზე → Detail sheet:
  • დიდი tile + სახელი + კატეგორია
  • ფასი + cycle + next renewal (დიდი countdown)
  • Payment history (auto-გენერირებული ლოგი წარსული cycle-ებიდან + manual კორექცია)
  • "Total spent since [start date]: $XXX" ← ემოციური რიცხვი
  • Price history (თუ ფასი შეიცვალა — გრაფიკი)
  • Reminder settings (per-subscription override: 7d/3d/1d/off)
  • Notes
  • ღილაკები: Edit / Pause / **How to cancel** / Delete
```

**"How to cancel"** — killer ფიჩა:
- პრესეტებს აქვთ `cancelUrl` + მოკლე ინსტრუქცია ("Netflix → Account → Cancel membership")
- გახსნა browser-ში; დახურვის შემდეგ prompt: "Did you cancel? [Yes — mark as cancelled] [No]"
- Cancelled → გადადის "Cancelled" არქივში + **"You're saving $15.49/mo" celebration** (confetti, ლაიმი) + ჯამური "Saved so far" მრიცხველი Insights-ზე

### 3.5 ფასის შეცვლა (price hike tracking)

- Edit-ში ფასის შეცვლისას → prompt: "Price changed? Keep history" → ინახება `priceHistory[]`
- Insights აჩვენებს: "Netflix raised prices 12% since you subscribed"
- (ეტაპი 2: ცნობილი გლობალური price hike-ების feed პრესეტ-კატალოგის განახლებით)

### 3.6 Insights (ვირუსული ეკრანი)

1. **Yearly projection**: "You'll spend **$1,019** this year" + bar თვეების მიხედვით
2. **Top 3 most expensive** — podium
3. **"Saved so far"** — გაუქმებულების ჯამი ლაიმის დიდი რიცხვით
4. **Price hikes** — ვინ გაძვირდა შენს ისტორიაში
5. **Unused nudge**: ხელით "last used" მონიშვნა → "You haven't used X in 2 months = $40 wasted"
6. **Category breakdown** donut + თვეების ტრენდი
7. **Share card** — გენერირდება ლამაზი image (canvas): "My subscriptions: $85/mo 💸" — **ბრენდირებული, ვირუსული**; Web Share API

### 3.7 Calendar

- თვის ბადე; დღეებზე წერტილები subscription-ის ფერით
- Tap დღეზე → იმ დღის განახლებები ჯამით
- თვის header: "July: $84.97 across 7 renewals"
- Heaviest day highlight

### 3.8 Profile / Settings

- **Account**: Sign in with Google/Apple (backup/sync) — optional; სტატუსი "Local only / Backed up"
- Currency (default + კურსების refresh)
- Language (13 ენა)
- Theme: Dark (default) / Light / System
- Notifications: global default (7d/3d/1d/day-of toggles), quiet hours
- **Data**: Export CSV/JSON · Import · Erase all (double-confirm)
- **SubTrack Pro** ბანერი
- Rate us / Contact / Privacy / Terms

### 3.9 Notifications (ლოგიკა)

| ტრიგერი | დრო | ტექსტი (მაგ.) |
|---------|-----|---------------|
| Renewal reminder | -3d (default), -7d/-1d ინდივიდუალურად | "Spotify renews in 3 days — $10.99" |
| Day-of | განახლების დღეს 09:00 | "Netflix charges you today: $15.49" |
| Trial ending | -3d და -1d (ორივე, აუცილებლად) | "⚠️ Trial ends tomorrow — then $15.49/mo" |
| Monthly recap | თვის 1-ში | "June total: $89.96. See insights →" |
| Win-back (idle 7d+) | მაქს. 1/კვირაში | "2 renewals coming this week" |

- ყველა notification deep-link-დება შესაბამის ეკრანზე
- Scheduling: SW + `setTimeout`/periodic check app open-ზე; TWA-ში local notifications

---

## 4. მონაცემთა მოდელი

```js
state = {
  version: 1,
  settings: { currency:"USD", locale:"en", theme:"dark",
              reminders:{d7:false,d3:true,d1:true,dayOf:true}, quietHours:[22,9] },
  user: { id:null, email:null, provider:null, backedUpAt:null },   // null = local-only
  subs: [{
    id:"uuid", presetId:"netflix"|null, name:"Netflix",
    category:"entertainment",            // entertainment|productivity|cloud|music|health|finance|education|other
    color:"#E50914", icon:"device-tv",
    price:15.49, currency:"USD",
    cycle:{unit:"month",n:1},            // {unit:"week"|"month"|"year", n}
    nextBilling:"2026-07-18",
    startedAt:"2024-03-01",
    trial:{isTrial:false, endsAt:null, priceAfter:null},
    status:"active",                     // active|paused|cancelled
    cancelledAt:null,
    priceHistory:[{date:"2024-03-01", price:13.99}],
    paymentLog:[{date:"2026-06-18", amount:15.49}],   // auto + manual
    lastUsed:null, notes:"",
    reminderOverride:null                // null = global defaults
  }],
  fx: { base:"USD", rates:{...}, fetchedAt:"..." },
  pro: { active:false, plan:null, since:null },
  meta: { installedAt:"...", onboarded:true, subsAddedTotal:9 }
}
```

**წარმოებული ლოგიკა (pure ფუნქციები — unit-ტესტირებადი):**
- `monthlyTotal(subs, fx)` / `yearlyTotal` — ნორმალიზაცია + კონვერტაცია
- `nextRenewals(subs, days)` — მომდევნო N დღის განახლებები
- `advanceBilling(sub, today)` — გასული nextBilling → paymentLog-ში ჩაწერა + შემდეგი თარიღის დათვლა (app open-ზე ეშვება)
- `savedTotal(subs)` — გაუქმებულების ჯამი გაუქმების დღიდან
- `categoryBreakdown(subs)`, `deltaVsPrevMonth(paymentLogs)`

---

## 5. Free vs Pro (freemium)

| ფიჩა | Free | Pro |
|------|------|-----|
| Subscriptions | მაქს. **5** | Unlimited |
| Renewal reminders | 1 წესი (-3d) | სრული customize + per-sub |
| Trial alerts | ✓ | ✓ (ორივეგან — ეს user-ის ფულის დაცვაა, არ ვკეტავთ) |
| Insights | ჯამი + კატეგორიები | + projection, hikes, unused, saved |
| Calendar | ✓ | ✓ |
| Multi-currency | 1 ვალუტა | Unlimited + auto-კონვერტაცია |
| Export CSV/JSON | — | ✓ |
| Themes/App icons | 1 | ყველა |
| Cloud backup | — | ✓ |
| Ads | banner Insights-ზე | No ads |

**ფასი:** **$0.99/mo** · **$4.99 lifetime** (lifetime წინ — impulse buy, ფასი განგებ დაბალია მოცულობისთვის)
**Paywall მომენტები:** მე-6 subscription-ის დამატებისას · Insights-ის დაბლოკილ ბლოკზე tap · Settings ბანერი. Paywall = ერთი ეკრანი, სამივე ფასით, "Restore purchase"-ით.

---

## 6. ეკრანების სრული სია

| # | ეკრანი | Route | პრიორიტეტი |
|---|--------|-------|-----------|
| 1 | Splash | — | M1 |
| 2 | Welcome carousel ×3 | #/welcome | M1 |
| 3 | Currency picker | #/setup | M1 |
| 4 | Home | #/ | M1 |
| 5 | Add: search+presets | #/add | M1 |
| 6 | Add: preset confirm | #/add/:id | M1 |
| 7 | Add: custom form | #/add/custom | M1 |
| 8 | Subscription detail | #/sub/:id | M1 |
| 9 | Edit | #/sub/:id/edit | M1 |
| 10 | Insights | #/insights | M2 |
| 11 | Calendar | #/calendar | M2 |
| 12 | Settings/Profile | #/settings | M1 (მინიმალური) |
| 13 | Paywall | #/pro | M2 |
| 14 | Cancelled archive | #/archive | M2 |
| 15 | Sign-in sheet | #/auth | M3 |

---

## 7. Edge cases & წესები

- **გასული nextBilling** app-ის გახსნისას: auto-advance + paymentLog; თუ >1 cycle გამოტოვდა — ყველა ჩაიწერება
- **29-31 რიცხვის თვეები**: billing day 31 → თებერვალში 28/29 (თვის ბოლო დღე), შემდეგ ისევ 31
- **Yearly ხედში** weekly/monthly ჯამები ×12/×52 პროექციით
- **ვალუტის კურსი ვერ ჩამოიტვირთა**: ბოლო ქეში + ბეჯი "rates from Jul 1"; თუ ქეში არ არსებობს — უცხოვალუტიანი subs ცალკე ჯგუფად უკონვერტაციოდ
- **0 subscription** (ყველა წაშალა): ცარიელი მდგომარეობა პოპულარულების grid-ით
- **Paused**: ჯამში არ ითვლება, notifications ჩერდება, თარიღი "ყინავს"
- **წაშლა vs გაუქმება**: Delete = სამუდამოდ (undo toast 5წმ); Cancel = არქივი + "saved" მრიცხველი
- **იმპორტი დუბლიკატით**: id-ით merge, კონფლიქტზე ახალი იგებს
- **Offline**: ყველაფერი მუშაობს გარდა კურსების refresh-ისა

---

## 8. Analytics events (მინიმალური სეტი)

`onboard_start / onboard_done / sub_added {preset|custom, category} / sub_cancelled {viaCancelFlow} /
notif_optin {yes|no} / notif_open {type} / paywall_view {trigger} / pro_purchased {plan} /
insights_view / share_card_created / export_data`

---

## 9. Store readiness (Play Store, შემდეგ App Store)

- **App icon**: მუქი ფონი + ლაიმის მინიმალისტური მარკა (მაგ. ring/₪-ტიპის sub სიმბოლო)
- **Screenshots** (5): Hero ჯამი → Renewal alert → Insights yearly → Calendar → Saved celebration; ყოველი ლოკალიზებული ტოპ-5 ენაზე
- **Listing copy** ლოკალიზებული; keywords: subscription tracker, bill reminder, money saver...
- Privacy policy + Data safety: "data stored on device; optional cloud backup" — მარტივი დეკლარაცია
- TWA: Bubblewrap, `assetlinks.json`, PWA ქულა 100 (manifest, SW, offline)

---

## 10. Milestones

**M1 — MVP (Store-ready core):**
Onboarding → Add (presets ~100 + custom) → Home (ჯამი, list, segmented) → Detail/Edit/Delete →
local notifications (-3d/-1d/day-of, trial) → Settings მინიმალური → PWA+TWA → EN+RU+ES
✅ Acceptance: ახალი user-ი 60 წამში ამატებს subscription-ს და იღებს reminder-ს

**M2 — Monetization & retention:**
Insights სრული + share card → Calendar → Paywall + Pro gating + AdMob → Cancel flow + saved counter →
+PT-BR, DE, FR, IT, TR → Play Store публикა

**M3 — Growth:**
Sign-in + cloud backup → პრესეტ-კატალოგი 250+ + რეგიონული → price-hike feed → widgets →
iOS (Capacitor) → +PL, HI, ID, JA, KO, ZH

---

## 11. დიზაინ-სისტემა (დამტკიცებული mockup-იდან)

- ფონი #09090B · ბარათი #141416 · border #1F1F22 (0.5px) · მეორადი ფონი #161618
- ტექსტი #F5F5F7 / #8E8E93 / #6E6E73
- **აქცენტი: ლაიმი #D7FF3F** (მხოლოდ: CTA, countdown, აქტიური tab, "saving" მომენტები)
- მეორადი აქცენტი: იისფერი #7A78FF (კატეგორია), წითელი მხოლოდ ალერტებზე
- ჰერო-რიცხვი: 44px / weight 300 / letter-spacing -1.5px; სათაურები 21px/600
- Radius: ბარათები 16-18px, tiles 12px, pills 99px
- Tab bar: floating pill, აქტიური = ლაიმის pill icon+label-ით
- ანიმაციები: spring-ease, 200-300ms; celebration confetti მხოლოდ cancel-saving მომენტზე
