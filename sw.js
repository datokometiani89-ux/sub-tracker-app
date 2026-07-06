/* SubTrack service worker — cache-first shell */
const CACHE = "subtrack-v7";
const SHELL = [
  "./", "./index.html", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./manifest.webmanifest",
  "./css/app.css?v=7",
  "./js/i18n.js?v=7", "./js/ui.js?v=7", "./js/state.js?v=7", "./js/auth.js?v=7",
  "./js/presets.js?v=7", "./js/logic.js?v=7", "./js/import.js?v=7", "./js/screens.js?v=7", "./js/app.js?v=7",
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
