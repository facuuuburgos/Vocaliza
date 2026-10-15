// Vocaliza — service worker (se encarga de que la app funcione sin internet y se actualice sola)
//
// · La app (index.html, ícono, manifest) siempre se busca primero en internet,
//   así los alumnos reciben tus correcciones apenas abren la app.
// · Los sonidos de piano no cambian nunca: se descargan una sola vez y quedan guardados.
// · Si no hay internet, se usa la última copia guardada.
//
// No hace falta tocar este archivo cuando actualices la app.
const CACHE = 'vocaliza-app';
const PIANO_CACHE = 'vocaliza-piano-1';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const PIANO = ['Ds1','Fs1','A1','C2','Ds2','Fs2','A2','C3','Ds3','Fs3','A3','C4','Ds4','Fs4','A4','C5','Ds5','Fs5','A5','C6','Ds6']
  .map(n => './piano/' + n + '.mp3');

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(APP_FILES.map(u => new Request(u, { cache: 'reload' })))),
    caches.open(PIANO_CACHE).then(c => c.addAll(PIANO)).catch(() => {})
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PIANO_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;

  // Piano y fuentes: no cambian → primero lo guardado
  if ((same && url.pathname.includes('/piano/')) || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    const name = same ? PIANO_CACHE : CACHE;
    e.respondWith(caches.open(name).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (!same) return;

  // Todo lo demás: primero internet (versión más nueva), si falla lo guardado
  e.respondWith(
    fetch(new Request(req.url, { cache: 'no-store' }))
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(hit =>
        hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
      ))
  );
});
