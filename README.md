# SubTrack — know what you really pay

Privacy-first subscription tracker. Track every subscription, get warned before
renewals, cancel what you don't use.

- **Local-first** — data lives on your device, no account, no bank link
- **7 languages** — EN · RU · ES · PT-BR · DE · FR · TR
- **Live FX** — 37 currencies with automatic conversion
- **Insights** — yearly projection, price-hike detector, unused subscriptions, saved-so-far
- **PWA** — installable, offline, dark premium UI

## Run locally

```
python3 -m http.server 8022
# open http://localhost:8022
```

No build step — vanilla HTML/CSS/JS. See [SPEC.md](SPEC.md) for the full product
spec and [COMPETITORS.md](COMPETITORS.md) for market analysis.

## Deploy

Static hosting works anywhere. `render.yaml` is included — on Render:
**New → Blueprint** → pick this repo, or **New → Static Site** with publish path `.`.

## Monetization (demo)

Free: 5 subscriptions. Pro ($0.99/mo · $4.99 lifetime): unlimited, full insights,
multi-currency, export. In-app purchases are stubbed until the store release.
