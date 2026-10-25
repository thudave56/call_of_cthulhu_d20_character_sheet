/*
 * sw.js — lets Investigator Sheets open with no connection.
 *
 * Network first: when online you always get the latest files (and the cache is
 * refreshed); when offline the last copy is served. Characters themselves live
 * in localStorage, so they are available offline either way.
 */
const CACHE = "investigator-sheets-v2";
const FILES = [
  "./", "./index.html", "./css/app.css", "./js/catalog.js", "./js/rules.js", "./js/store.js", "./js/designs.js", "./js/app.js",
  "./manifest.webmanifest", "./icon.svg", "../version-switch.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html")))
  );
});
