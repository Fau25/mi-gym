// Ejecuta el Code.gs real con un Drive simulado y dos dispositivos con sync.js.
const fs = require('fs'), vm = require('vm'), assert = require('assert');

const { cargarScript } = require('./google-falso');
const google = cargarScript(__dirname + '/Code.gs');

const URL_OK = 'https://script.google.com/macros/s/ABC123/exec';
let reloj = 1_700_000_000_000;
global.Date.now = () => (reloj += 1000);
global.fetch = async (url, op) => {
  const out = google.doPost({ postData: { contents: op.body } });
  return { ok: true, status: 200, json: async () => JSON.parse(out.t) };
};
global.document = { hidden: true, addEventListener() {} };
global.addEventListener = () => {};
global.navigator = { onLine: true };
const fuente = fs.readFileSync(__dirname + '/../sync.js', 'utf8');

function dispositivo(nombre, datos, nuevo = false) {
  const almacen = {};
  const ls = { getItem: (k) => almacen[k] ?? null, setItem: (k, v) => { almacen[k] = String(v); }, removeItem: (k) => { delete almacen[k]; } };
  const ctx = { localStorage: ls, fetch, document, navigator, addEventListener() {}, AbortController, setTimeout, clearTimeout, setInterval: () => 1, console, Date };
  vm.createContext(ctx); vm.runInContext(fuente + '\nthis.crearSync = crearSync;', ctx);
  const d = { nombre, datos: { ...datos }, nuevo, ultimoEstado: null };
  d.sync = ctx.crearSync({ app: 'test', aItems: () => ({ ...d.datos }), deItems: (m) => { d.datos = { ...m }; d.nuevo = false; }, esNuevo: () => d.nuevo, estado: (t, x) => { d.ultimoEstado = [t, x]; } });
  return d;
}

(async () => {
  const A = dispositivo('A', { 'h:1': { n: 'Agua' }, 'x:1:2026-11-10': 1 });
  const B = dispositivo('B', { 'h:e1': { n: 'Ejemplo' } }, true);

  // Validaciones
  assert.ok(A.sync.comprobarUrl('https://script.google.com/macros/s/ABC/dev'));
  await assert.rejects(A.sync.conectar(URL_OK, 'mala'), /Contraseña incorrecta/);

  // 1. A sube sus datos
  await A.sync.conectar(URL_OK, 'secreta');
  assert.deepStrictEqual(A.ultimoEstado[0], 'ok');
  // 2. B (solo ejemplos) recibe lo de A y descarta los ejemplos
  await B.sync.conectar(URL_OK, 'secreta');
  assert.deepStrictEqual(B.datos, A.datos, 'B debe quedar igual que A');
  // 3. Cambios cruzados: A marca un día, B borra el hábito... y otro marca
  A.datos['x:1:2026-11-11'] = 1;
  B.datos['h:2'] = { n: 'Leer' };
  delete B.datos['x:1:2026-11-10'];
  await A.sync.sincronizar(); await B.sync.sincronizar(); await A.sync.sincronizar();
  assert.deepStrictEqual(A.datos, B.datos, 'A y B convergen');
  assert.ok(A.datos['x:1:2026-11-11'] && A.datos['h:2'] && !A.datos['x:1:2026-11-10']);
  // 4. Mismo dato editado en los dos: gana el último
  A.datos['h:1'] = { n: 'Agua 2L' }; await A.sync.sincronizar();
  B.datos['h:1'] = { n: 'Agua 3L' }; await B.sync.sincronizar(); await A.sync.sincronizar();
  assert.strictEqual(A.datos['h:1'].n, 'Agua 3L');
  // 5. Si Drive no se puede leer, error y no se pisa el archivo
  const antes = google._archivos.find((f) => f.nombre === 'datos.json' && !f.padre.padre).txt;
  google._romper(true);
  A.datos['h:3'] = { n: 'X' }; await A.sync.sincronizar();
  assert.strictEqual(A.ultimoEstado[0], 'error');
  google._romper(false);
  assert.strictEqual(google._archivos.find((f) => f.nombre === 'datos.json' && !f.padre.padre).txt, antes);
  await A.sync.sincronizar(); await B.sync.sincronizar();
  assert.ok(B.datos['h:3'], 'se envía al recuperarse');
  // 6. Copia diaria creada
  assert.ok(google._archivos.some((f) => /^datos-\d{4}-\d\d-\d\d\.json$/.test(f.nombre)));
  // 7. Un dispositivo con datos propios que se conecta tarde: junta, sin pisar lo del servidor
  const C = dispositivo('C', { 'h:1': { n: 'viejo' }, 'h:9': { n: 'Solo en C' } });
  await C.sync.conectar(URL_OK, 'secreta');
  assert.strictEqual(C.datos['h:1'].n, 'Agua 3L'); assert.ok(C.datos['h:9']);
  await A.sync.sincronizar(); assert.ok(A.datos['h:9']);
  // 8. Sondeo sin cambios no lee Drive
  const r = google.doPost({ postData: { contents: JSON.stringify({ clave: 'secreta', accion: 'sync', desde: 9e15, cambios: {} }) } });
  assert.ok(JSON.parse(r.t).sinCambios);
  console.log('TODO BIEN ✓ (8 comprobaciones)');
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
