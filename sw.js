// Vocaliza — service worker
// Siempre busca la versión más nueva en internet; si no hay conexión, usa la copia guardada.
// No hace falta cambiar nada acá cuando actualices la app.
const CACHE = 'vocaliza-cache-2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './piano/Ds1.mp3', './piano/Fs1.mp3', './piano/A1.mp3', './piano/C2.mp3', './piano/Ds2.mp3', './piano/Fs2.mp3', './piano/A2.mp3', './piano/C3.mp3', './piano/Ds3.mp3', './piano/Fs3.mp3', './piano/A3.mp3', './piano/C4.mp3', './piano/Ds4.mp3', './piano/Fs4.mp3', './piano/A4.mp3', './piano/C5.mp3', './piano/Ds5.mp3', './piano/Fs5.mp3', './piano/A5.mp3', './piano/C6.mp3', './piano/Ds6.mp3'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  const netReq = sameOrigin ? new Request(req.url, { cache: 'no-store' }) : req;
  e.respondWith(
    fetch(netReq)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(hit =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
