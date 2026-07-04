/* SubTrack service worker — cache-first shell */
const CACHE = "subtrack-v4";
const SHELL = [
  "./", "./index.html", "./icon.svg", "./manifest.webmanifest",
  "./css/app.css?v=4",
  "./js/i18n.js?v=4", "./js/ui.js?v=4", "./js/state.js?v=4",
  "./js/presets.js?v=4", "./js/logic.js?v=4", "./js/screens.js?v=4", "./js/app.js?v=4",
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
