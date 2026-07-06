# SubTrack → Google Play (TWA packaging)

TWA (Trusted Web Activity) აფუთავს ჩვენს PWA-ს `.aab`-ად რომელიც Play Store-ზე აიტვირთება.
აპი იგივე რჩება — უბრალოდ Android "ჩარჩოში" ეშვება, URL-ბარის გარეშე.

## რა გჭირდება (შენს Mac-ზე, ერთხელ)
- **Node.js LTS** (nodejs.org) — ახლა დაინსტალირებული არ არის
- **JDK 17** (`brew install openjdk@17`)
- **Bubblewrap CLI**: `npm i -g @bubblewrap/cli` (Android SDK-ს თავად ჩამოტვირთავს კითხვაზე "Yes")

## ნაბიჯები

### 1. init
```
mkdir ~/subtrack-twa && cd ~/subtrack-twa
bubblewrap init --manifest https://subtrack-dc51.onrender.com/manifest.webmanifest
```
პასუხები prompt-ებზე:
| kითხვა | პასუხი |
|--------|--------|
| Domain | `subtrack-dc51.onrender.com` |
| Application ID (package) | `com.subtrack.app` |
| App name | `SubTrack` |
| Launcher name (≤12) | `SubTrack` |
| Display mode | `standalone` |
| Status bar color | `#09090B` |
| Splash color | `#09090B` |
| Icon | (manifest-იდან 512 auto) |
| Signing key | **Create new** → შეინახავს `android.keystore` |

⚠️ **`android.keystore` + პაროლები შეინახე უსაფრთხოდ (backup-იც).** დაკარგვა = აპის განახლება ვეღარ შეძლებ.

### 2. აიღე SHA-256 fingerprint
```
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```
(ან bubblewrap init-ის ბოლოს ბეჭდავს.)

### 3. ჩასვი fingerprint assetlinks-ში
რეპოში უკვე დევს [`.well-known/assetlinks.json`](../.well-known/assetlinks.json) — `package_name` სწორია (`com.subtrack.app`).
შეცვალე `REPLACE_WITH_SHA256_FROM_YOUR_SIGNING_KEY` → შენი fingerprint (ფორმატი: `AA:BB:CC:...`).
Push → Render → გადაამოწმე რომ იხსნება:
`https://subtrack-dc51.onrender.com/.well-known/assetlinks.json`
(ეს არის ის, რაც URL-ბარს მალავს TWA-ში — verify აუცილებელია.)

### 4. build
```
cd ~/subtrack-twa
bubblewrap build
```
შედეგი: `app-release-bundle.aab` (Play-სთვის) + `app-release-signed.apk` (ტესტისთვის).

### 5. ტესტი მოწყობილობაზე
`app-release-signed.apk` გადაიტანე ტელეფონზე და დააინსტალირე (ან `adb install`).
შეამოწმე: URL-ბარი **არ ჩანს** (assetlinks მუშაობს), splash ლაიმის ring-ია, offline მუშაობს.

### 6. Play Console
1. [play.google.com/console](https://play.google.com/console) → **$25 ერთჯერადი** dev account
2. Create app → SubTrack
3. Production (ან ჯერ Internal testing) → Upload `app-release-bundle.aab`
4. Store listing → შეავსე [`ASO.md`](../ASO.md)-დან (title/short/full, ლოკალიზებული)
5. Screenshots + feature graphic → [`assets.html`](assets.html)-იდან ჩამოტვირთე PNG-ები
6. **Data safety** ფორმა (ქვემოთ) + Content rating (IARC questionnaire → სავარაუდოდ Everyone)
7. Countries → ყველა (ან ტოპ ბაზრები)
8. Review → 3–7 დღე პირველზე

## Data safety ფორმის პასუხები (Play Console)
- Data collected/shared: ** თუ demo auth-ს ტოვებ და backend არ არის — "No data collected"** (ყველაფერი on-device).
- როცა Supabase ჩაერთვება: აღნიშნე Email (account management, არ იყიდება) + App activity (subscriptions, backup) — encrypted in transit, deletable.
- "Data can be deleted" → **Yes** (Account → Delete account; Settings → Erase).

## ⚠️ გადახდები (მნიშვნელოვანი)
TWA-ში demo IAP (localStorage) **არ დაარღვევს** policy-ს თუ ფასს **არ** ახსენებ როგორც რეალურ ყიდვას.
ორი ვარიანტი:
- **სწრაფი launch:** პირველ ვერსიაში Pro-ს ღილაკები დამალე ან "Coming soon" — უფასო აპი უფრო სწრაფად გადის review-ს.
- **რეალური IAP:** Play Billing TWA-ში = **Digital Goods API** + `PaymentRequest`. სჭირდება აპი Play-ზე ატვირთული + Play Console-ში products შექმნილი (`pro_monthly` $0.99, `pro_lifetime` $4.99). ეს ცალკე ინტეგრაციაა — გავაკეთოთ მას შემდეგ რაც აპი Play-ზე იქნება.

## TWA-readiness checklist (უკვე ✅)
- ✅ manifest: name, short_name, display standalone, theme/bg #09090B, 192/512 + maskable icons
- ✅ service worker (offline)
- ✅ HTTPS (Render)
- ✅ `.well-known/assetlinks.json` (fingerprint-ს ელოდება)
- ✅ store assets generator + ASO listing
