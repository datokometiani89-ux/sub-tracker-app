# SubTrack — ASO / SEO plan (2026 July)

## 1. საკვანძო სიტყვების ძებნა — რეალური მონაცემი

Apple/Google **ზუსტ** მოცულობას არ აქვეყნებენ. ინდიკატორები:
- **Apple Search Popularity (SP)** — 5–100, ლოგარითმული. მასშტაბი (დღიური impressions):
  SP20 ≈ 870 · SP30 ≈ 1,600 · SP40 ≈ 2,800 · SP50 ≈ 5,600 · SP60–70 ≈ 10–18k · SP80 ≈ 33k.
  **ინდი-აპისთვის sweet spot = SP 30–50** (SP70+ დიდ ბრენდებს უჭირავთ). [წყარო: Sonar]
- **Sonar** (ASO tool) კონკრეტული რიცხვი "subscription tracker"-ზე (queried 2026-06-30):

| keyword | პლატფორმა | popularity | difficulty | კონკურენტი აპი |
|---------|-----------|:---:|:---:|:---:|
| **subscription tracker** | iOS | 25 | 37 | **200** |
| **subscription tracker** | **Android** | **28** | **24** | **10** 🟢 |

### 🎯 მთავარი დასკვნა
**Android-ზე იგივე მოთხოვნაა (pop 28 ≈ ~1,400 ძებნა/დღე ≈ ~43k/თვე), მაგრამ მხოლოდ 10 კონკურენტი აპი — iOS-ის 200-ის წინააღმდეგ.** difficulty 24 (დაბალი). ეს **ზუსტად ადასტურებს Android-first სტრატეგიას** — ჩვენ TWA-ს ისედაც Play Store-ზე ვდებთ.

### keyword-ცხრილი (pop/diff — ✅=Sonar რეალური, ~=შეფასება მასშტაბიდან+კატეგორიის ცოდნა)

| keyword | est. pop | კონკურენცია | პრიორიტეტი | ფაზა |
|---------|:---:|:---:|:---:|------|
| subscription tracker | 28 ✅ | დაბალი (10) | 🔥🔥🔥 | Launch |
| subscription manager | ~30 ~ | საშუალო | 🔥🔥🔥 | Launch |
| bill reminder | ~35 ~ | საშუალო | 🔥🔥 | Growth |
| renewal reminder | ~22 ~ | დაბალი | 🔥🔥 | Launch (long-tail) |
| cancel subscriptions | ~30 ~ | საშუალო | 🔥🔥 | Growth |
| recurring payments | ~25 ~ | დაბალი | 🔥 | Launch |
| track subscriptions | ~24 ~ | დაბალი | 🔥🔥 | Launch |
| budget tracker | ~45 ~ | **მაღალი** | 🔸 (ძვირი) | Scaling |
| expense tracker | ~48 ~ | **მაღალი** | 🔸 | Scaling |
| money manager | ~50 ~ | **მაღალი** | 🔸 | Scaling |
| subscription tracker free | ~18 ~ | ძალიან დაბალი | 🔥 | Launch (intent!) |
| free trial reminder | ~15 ~ | ძალიან დაბალი | 🔥 | Launch (unique) |

**სტრატეგია (ASO სტანდარტი):** Launch = low-comp / long-tail-ით indexing (subscription tracker, renewal reminder, track subscriptions, *free); Growth = mid (bill reminder, cancel subscriptions); Scaling = high-volume (budget/expense/money) მას შემდეგ, რაც rating/installs დაგროვდება.

---

## 2. Google Play Store listing

### App title (მაქს. 30 სიმბოლო)
```
SubTrack: Subscription Tracker      (30/30)
```
alt: `SubTrack – Subscription Manager` (30)

### Short description (მაქს. 80 სიმბოლო) — ინდექსირდება, მაღალი წონა
```
Track subscriptions, get renewal reminders & cancel what you don't use.
```
(71/80)

### Full description (მაქს. 4000; keyword-ები ბუნებრივად, 2–3× გამეორება)
```
SubTrack is the simple, private subscription tracker that shows what you really
pay every month — and warns you before each renewal so you never get charged for
something you forgot.

WHY SUBTRACK
• See your true monthly and yearly total at a glance
• Get a reminder 3 days, 1 day, or on the day of every renewal
• Free-trial alerts so a trial never turns into a surprise charge
• Cancel what you don't use — with step-by-step cancellation guides

MAGIC IMPORT — add everything in seconds
Paste your list from Google Play, the App Store, or a bank statement and SubTrack
finds your subscriptions automatically. Or scan a receipt — it all happens on your
device. No email access, no bank login.

INSIGHTS THAT SAVE YOU MONEY
• Yearly spending projection
• Price-hike detector — see which subscriptions quietly got more expensive
• "Possibly unused" nudges
• Track how much you've saved by cancelling

PRIVATE BY DESIGN
Your data stays on your device. No account required. Optional encrypted backup
and cross-device sync when you want it.

BUILT FOR EVERYONE
7 languages (English, Русский, Español, Português, Deutsch, Français, Türkçe),
37 currencies with live conversion, dark design, calendar view, home-screen ready.

FREE — with an optional Pro upgrade (unlimited subscriptions, full insights,
multi-currency, export) for $0.99/month or $4.99 once.

Track subscriptions. Kill the ones you forgot. Keep your money.
```

### Play keyword tips
- Play indexes the **title + short + full description** (არა ცალკე keyword ველი).
- title-ში "Subscription Tracker" = ორი მთავარი keyword ერთდროულად.
- გაიმეორე "subscription", "reminder", "cancel", "track" 2–3× full desc-ში — ბუნებრივად.

---

## 3. Apple App Store listing (iOS-ისთვის, Capacitor-ის შემდეგ)

### App name (30) : `SubTrack: Subscription Tracker`
### Subtitle (30) : `Reminders for every renewal`  (27)
### Keyword field (100 — comma, NO spaces, არ გაიმეორო title-ის სიტყვები)
```
manager,bill,renewal,recurring,cancel,budget,expense,money,spending,trial,payments,reminder,saver,due
```
(≈95/100 — "subscription"/"tracker" title-შია, აქ აღარ ვწერთ, ადგილს ვზოგავთ)

---

## 4. ლოკალიზებული title + short (ტოპ ბაზრები — ცალკე ASO index თითო locale-ზე)

| ენა | Title (≤30) | Short (≤80) |
|-----|-------------|-------------|
| EN | SubTrack: Subscription Tracker | Track subscriptions, get renewal reminders & cancel what you don't use. |
| RU | SubTrack: Трекер подписок | Учёт подписок, напоминания об оплате и отмена ненужного. |
| ES | SubTrack: Gestor de suscripciones | Controla suscripciones, recibe avisos de renovación y cancela lo que no usas. |
| PT-BR | SubTrack: Controle de assinaturas | Controle assinaturas, receba avisos de renovação e cancele o que não usa. |
| DE | SubTrack: Abo-Tracker | Abos verfolgen, vor Verlängerung erinnern & Ungenutztes kündigen. |
| FR | SubTrack: Suivi d'abonnements | Suis tes abonnements, sois averti avant chaque renouvellement. |
| TR | SubTrack: Abonelik Takibi | Abonelikleri takip et, yenileme hatırlatmaları al, gereksizleri iptal et. |

> 🔑 თითო ენა = ცალკე ASO ბაზარი, თითქმის ნულოვანი კონკურენციით (RU/PT/TR-ზე subscription-tracker-ები თითქმის ყველა EN-only-ა — ჩვენი დიფერენციატორი).

---

## 5. Store visual assets (გასაკეთებელი)
- **Feature graphic** 1024×500 (Play) — ჰერო "$84.97/mo" + ლაიმის ring, მუქ ფონზე
- **Screenshots** (min 2, რეკ. 5–8), ლოკალიზებული ტოპ-5 ენაზე. თანმიმდევრობა:
  1. ჰერო total + "Know what you really pay"
  2. Renewal alert / "Never miss a renewal"
  3. Magic Import / "Add everything in seconds"
  4. Insights yearly / "See what you'll spend this year"
  5. Saved celebration / "Cancel & save"
- caption თითო screenshot-ზე keyword-ით (screenshot caption-საც ხედავს ASO ალგორითმი).
- App icon: ✅ უკვე გვაქვს (lime ring, PNG 512/192).

## 6. Web SEO — ✅ გაკეთებული (index.html)
- `<title>` + meta description + keywords, canonical, robots
- Open Graph + Twitter Card (icon-512 როგორც preview)
- **JSON-LD** `SoftwareApplication` (price 0, category Finance) → rich result-ის შანსი
- `robots.txt` + `sitemap.xml`
- **TODO push-ის შემდეგ:** Google Search Console-ში sitemap-ის submit; Bing Webmaster.

## 7. Rating/review სტრატეგია (ASO ranking factor #1 Play-ზე)
- in-app rating prompt **დადებითი მომენტის შემდეგ** (მაგ. cancel→saved celebration, ან მე-5 subscription-ის დამატება) — არა პირველ გაშვებაზე.
- (native TWA-ში: Google Play In-App Review API.)
