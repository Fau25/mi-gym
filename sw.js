const CACHE = 'mi-gym-v10';
const IDS = ['apertInc',  'apertMan',  'arnold',  'banca',  'bancaAncho',  'bancaMan',  'bancaSmith',  'barraV',  'cerrado',  'concentr',  'cruces',  'crucesAlto',  'crucesBajo',  'crucesMedio',  'crunch',  'crunchPolea',  'cuerda',  'curlAlt',  'curlArana',  'curlArrastre',  'curlBarra',  'curlFemSent',  'curlFemTumb',  'curlInc',  'curlMaq',  'curlPolea',  'curlPoleaUna',  'curlSent',  'curlZ',  'domSup',  'dominadas',  'elevRodillas',  'encogSmith',  'extCuad',  'extMaq',  'extTumb',  'facePull',  'fondos',  'fondosBanco',  'frances',  'francesDecl',  'francesInc',  'francesSent',  'frontMan',  'frontPolea',  'gemeloBarra',  'gemeloPie',  'gemeloSent',  'hack',  'hipThrust',  'incBarra',  'incMan',  'incNeutro',  'incSmith',  'jalon',  'jalonEst',  'latMan',  'latMaq',  'latPolea',  'latSent',  'martillo',  'martilloAlt',  'martilloCruz',  'mentonSmith',  'militar',  'pajaros',  'pajarosSent',  'pajarosTumb',  'patada',  'pecDeck',  'predMan',  'predMaq',  'predicador',  'prensa',  'pressDecl',  'pressMaq',  'pullBarra',  'pullover',  'pushInv',  'pushRecta',  'remoApoyado',  'remoBarra',  'remoInvSmith',  'remoMan',  'remoMaq',  'remoPolea',  'remoT',  'sentMan',  'sentSmith',  'sentadilla',  'sobreCab',  'sobreCabP',  'sobreCabPolea',  'sobreCabUna',  'zancadas'];
const ARCHIVOS = [...IDS.flatMap(i => [`img/${i}-0.webp`, `img/${i}-1.webp`]), './', 'index.html', 'estilos.css', 'app.js', 'ejercicios.js', 'manifest.json', 'icono-180.png', 'icono-192.png', 'icono-512.png',
  'fuentes/inter-400.woff2', 'fuentes/inter-500.woff2', 'fuentes/inter-600.woff2', 'fuentes/inter-700.woff2', 'fuentes/montserrat-400.woff2', 'fuentes/montserrat-500.woff2', 'fuentes/montserrat-600.woff2', 'fuentes/montserrat-700.woff2'];
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
