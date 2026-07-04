# კონკურენტების ანალიზი — Subscription Trackers (2026 ივლისი)

წყაროები: CNBC Select, resubs.app-ის შედარებები, Google Play/App Store listing-ები, lowermysubs.com.

## ორი ბანაკი

**1. Bank-linked (ავტო-დეტექცია):** Rocket Money, PocketGuard, Monarch, Copilot — ბანკს უკავშირდებიან (Plaid),
subscription-ებს ავტომატურად პოულობენ, ძვირია ($6–15/თვე), მხოლოდ US/UK ბანკები. **ეს ჩვენი ბრძოლა არ არის** —
Plaid საქართველოში/გლობალურად არ მუშაობს და privacy-სკეპტიკოსი იუზერი ბანკს არ აბამს.

**2. Manual / privacy-first (ჩვენი კატეგორია):** Bobby, Subby, Tilla, ReSubs.

## პირდაპირი კონკურენტები

| აპი | პლატფორმა | ფასი | ძლიერი მხარეები | სისუსტეები |
|-----|-----------|------|-----------------|------------|
| **Bobby** | iOS only | one-time ~$1.99–3 | ლამაზი UI, custom icons+ფერები, reminders; "free სერვისებში საუკეთესო" (CNBC) | iOS-only, no CSV, no cancel guides, no sync, EN-only |
| **Subby** | Android only | უფასო unlimited + $2.99 ads-off | 400+ icon, **160+ ვალუტა**, unused-30d dashboard, 4.2MB, privacy | Android-only, დიზაინი მშრალი Material, EN-only |
| **Tilla** | Android | free **5 subs** + **$2.99 lifetime** | offline-first, cloud sync, local backup | მინიმალური ფიჩერსეტი, EN |
| **ReSubs** | iOS+Android | freemium | **ყველაზე ღრმა**: AI extraction (screenshot/email), Gmail receipt scan, CSV import, 30+ cancel guide, widgets, calendar, lifecycle states, multi-currency | შედარებით ახალია |
| Rocket Money | iOS/Android/Web | $6–14/თვე | bank auto-detect, bill negotiation, cancel-for-you service | ბანკის credentials სჭირდება, ძვირი, US-centric |

## SubTrack-ის პოზიცია (რაც უკვე გვაქვს ✓ / gap ✗)

| ფიჩერი | Bobby | Subby | Tilla | ReSubs | **SubTrack ახლა** |
|--------|:-:|:-:|:-:|:-:|:-:|
| Manual + presets | ✓ | ✓ | ✓ | ✓ | ✓ (48 preset) |
| Renewal reminders | ✓ | ✓ | ✓ | ✓ | ✓ (-7/-3/-1/day) |
| Trial tracking | ✗ | ~ | ✗ | ✓ | ✓ |
| Lifecycle (paused/cancelled) | ✗ | ~ | ✗ | ✓ | ✓ + saved counter |
| Calendar view | ✗ | ✗ | ✗ | ✓ | ✓ |
| Analytics/insights | ~ | ✓ | ~ | ✓ | ✓ + projection/hikes |
| Price-hike detector | ✗ | ✗ | ✗ | ✗ | **✓ (უნიკალური!)** |
| Cancel guides | ✗ | ✗ | ✗ | ✓ (30+) | ~ (link-ები; ტექსტი ✗) |
| Share card | ✗ | ✗ | ✗ | ✗ | **✓ (უნიკალური!)** |
| მრავალენოვნება | ✗ | ✗ | ✗ | ✗ | **✓ 7 ენა (უნიკალური!)** |
| Custom icon/color picker | ✓ | ✓ (400+) | ✗ | ✓ | ✗ |
| Multi-currency + კონვერტაცია | ✗ | ✓ (160+) | ✗ | ✓ | ✗ (1 ვალუტა) |
| CSV import/export | ✗ | ✗ | ✗ | ✓ | ~ (JSON export Pro) |
| Cloud sync/backup | ✗ | ✗ | ✓ | ✓ | ✗ (M3 seam) |
| Home-screen widgets | ✗ | ✗ | ✗ | ✓ | ✗ (native-ის შემდეგ) |
| AI extraction (screenshot/email) | ✗ | ✗ | ✗ | ✓ | ✗ |
| Cross-platform | ✗ | ✗ | ✗ | ✓ | ✓ (PWA ორივეგან) |

## ფასების შედარება

- Bobby one-time $1.99–3 · Subby $2.99 · Tilla $2.99 lifetime (free = 5 subs — **ზუსტად ჩვენი მოდელი**)
- ReSubs freemium/subscription · Rocket Money $6–14/თვე
- **ჩვენი $0.99/თვე + $4.99 lifetime კონკურენტულია** — ოდნავ ძვირი Android-ის one-time-ებზე,
  მაგრამ ფიჩერსეტი ReSubs-ის დონისკენ მიდის. OK.

## ჩვენი დიფერენციატორები (გავამყაროთ)

1. **7 ენა** — არცერთ კონკურენტს არ აქვს. RU/ES/PT/DE/FR/TR ბაზრებზე პრაქტიკულად კონკურენცია ნულია.
2. **Price-hike detector** — არავის აქვს, ჩვენს ისტორიაზე მუშაობს.
3. **Share card** — viral loop, არავის აქვს.
4. **Cancel celebration + "saved so far"** — ემოციური hook.

## რეკომენდებული TODO (პრიორიტეტით)

**P1 — პარიტეტი, იაფი (M2.5):**
- [ ] Custom icon + ფერის picker subscription-ზე (Bobby/Subby პარიტეტი)
- [ ] ვალუტების სია ~30-მდე გავზარდოთ (Subby-ს 160 არ გვჭირდება, ტოპ-30 საკმარისია)
- [ ] Per-sub ვალუტა + კურსით კონვერტაცია ჯამში (Pro ფიჩა; frankfurter.app API)
- [ ] CSV export (JSON-ის გვერდით) + CSV import
- [ ] Cancel guide: preset-ებში მოკლე ტექსტური ინსტრუქცია ("Account → Membership → Cancel") link-ის გვერდით
- [ ] Auto-unused: თუ lastUsed საერთოდ არ არის მონიშნული 45+ დღის sub-ზე — რბილი nudge

**P2 — დიფერენციაცია (M3):**
- [ ] **Year in Review / "Subscription Wrapped"** — წლის ბოლოს viral ბარათი (არავის აქვს კარგად)
- [ ] Cloud backup (sign-in seam) — Tilla/ReSubs პარიტეტი
- [ ] Notification-ების გაუმჯობესება TWA push-ით

**P3 — native-ის შემდეგ:**
- [ ] Home-screen widgets (TWA-ში შეზღუდულია; Capacitor/native საჭიროა)
- [ ] AI extraction screenshot-იდან (ReSubs-ის wedge; ჩვენი AI proxy პატერნი გამოდგება)
