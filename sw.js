const CACHE = 'mi-gym-v16';
const ARCHIVOS = ['./', 'index.html', 'estilos.css', 'app.js', 'ejercicios.js', 'manifest.json', 'icono-180.png', 'icono-192.png', 'icono-512.png',
  'fuentes/montserrat-400.woff2', 'fuentes/montserrat-500.woff2', 'fuentes/montserrat-600.woff2', 'fuentes/montserrat-700.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mi-gym-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
