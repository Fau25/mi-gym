const CACHE = 'mi-gym-v6';
const IDS = ['apertInc',  'apertMan',  'arnold',  'banca',  'bancaMan',  'barraV',  'cerrado',  'concentr',  'cruces',  'crucesBajo',  'cuerda',  'curlAlt',  'curlBarra',  'curlInc',  'curlPolea',  'curlSent',  'curlZ',  'dominadas',  'extTumb',  'facePull',  'fondos',  'frances',  'incBarra',  'incMan',  'incNeutro',  'jalon',  'jalonEst',  'latMan',  'latMaq',  'latPolea',  'latSent',  'martillo',  'militar',  'pajaros',  'pajarosSent',  'pajarosTumb',  'patada',  'pecDeck',  'predMan',  'predMaq',  'predicador',  'pressMaq',  'pullover',  'remoApoyado',  'remoBarra',  'remoMan',  'remoMaq',  'remoPolea',  'remoT',  'sobreCab',  'sobreCabP',  'sobreCabPolea',  'sobreCabUna'];
const ARCHIVOS = [...IDS.flatMap(i => [`img/${i}-0.webp`, `img/${i}-1.webp`]), './', 'index.html', 'estilos.css', 'app.js', 'ejercicios.js', 'manifest.json', 'icono-180.png', 'icono-192.png', 'icono-512.png',
  'fuentes/inter-400.woff2', 'fuentes/inter-500.woff2', 'fuentes/inter-600.woff2', 'fuentes/inter-700.woff2'];
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
