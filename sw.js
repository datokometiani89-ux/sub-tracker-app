/* SubTrack service worker — cache-first shell */
const CACHE = "subtrack-v9";
const SHELL = [
  "./", "./index.html", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./manifest.webmanifest",
  "./css/app.css?v=9",
  "./js/i18n.js?v=9", "./js/ui.js?v=9", "./js/state.js?v=9", "./js/auth.js?v=9",
  "./js/presets.js?v=9", "./js/logic.js?v=9", "./js/import.js?v=9", "./js/screens.js?v=9", "./js/app.js?v=9",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
