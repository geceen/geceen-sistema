// Service worker do app GECEEN — funciona sem internet.
const VERSAO = "geceen-app-v2";
const APP = VERSAO + "-app", LIBS = "geceen-libs-v1";
const PRE_APP = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const PRE_LIBS = [
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
];
const LIB_HOSTS = ["www.gstatic.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(Promise.all([
    caches.open(APP).then(c => c.addAll(PRE_APP)).catch(() => {}),
    caches.open(LIBS).then(c => Promise.all(PRE_LIBS.map(u => fetch(u, { mode: "no-cors" }).then(r => c.put(u, r)).catch(() => {}))))
  ]).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== LIBS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function comPrazo(p, ms) { return new Promise((ok, erro) => { const t = setTimeout(() => erro(new Error("lento")), ms); p.then(r => { clearTimeout(t); ok(r); }, x => { clearTimeout(t); erro(x); }); }); }
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (LIB_HOSTS.includes(url.hostname) && !url.pathname.includes("/v1/projects/")) {
    e.respondWith(caches.open(LIBS).then(c => c.match(req, { ignoreVary: true }).then(r => r || fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  const rede = fetch(req).then(res => { if (res && res.ok) { const copia = res.clone(); caches.open(APP).then(c => c.put(req, copia)); } return res; });
  e.respondWith(comPrazo(rede, req.mode === "navigate" ? 6000 : 10000).catch(() => caches.open(APP).then(c => c.match(req, { ignoreSearch: req.mode === "navigate" }).then(r => r || c.match("./").then(x => x || rede)))));
});
