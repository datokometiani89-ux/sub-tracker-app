/* SubTrack service worker — cache-first shell */
const CACHE = "subtrack-v5";
const SHELL = [
  "./", "./index.html", "./icon.svg", "./manifest.webmanifest",
  "./css/app.css?v=5",
  "./js/i18n.js?v=5", "./js/ui.js?v=5", "./js/state.js?v=5",
  "./js/presets.js?v=5", "./js/logic.js?v=5", "./js/import.js?v=5", "./js/screens.js?v=5", "./js/app.js?v=5",
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
