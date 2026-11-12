// Drive y servicios de Google simulados para ejecutar el Code.gs real fuera de Google.
const fs = require('fs'), vm = require('vm');
function crearGoogle() {
  const archivos = []; let carpetas = []; let romperLectura = false;
  const mkFile = (nombre, txt, padre) => { const f = { nombre, txt, padre, trashed: false, getName: () => f.nombre, isTrashed: () => f.trashed, setTrashed: (v) => { f.trashed = v; },
    getBlob: () => ({ getDataAsString: () => { if (romperLectura) throw new Error('Drive no responde'); return f.txt; } }), setContent: (t) => { f.txt = t; },
    makeCopy: (n, dest) => mkFile(n, f.txt, dest) }; archivos.push(f); return f; };
  const iter = (arr) => { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; };
  const mkFolder = (nombre, padre) => { const c = { nombre, padre, trashed: false, isTrashed: () => c.trashed,
    getFilesByName: (n) => iter(archivos.filter((f) => f.padre === c && f.nombre === n)),
    getFiles: () => iter(archivos.filter((f) => f.padre === c && !f.trashed)),
    getFoldersByName: (n) => iter(carpetas.filter((x) => x.padre === c && x.nombre === n)),
    createFile: (n, t) => mkFile(n, t, c), createFolder: (n) => mkFolder(n, c) }; carpetas.push(c); return c; };
  const props = {}, cache = {};
  const g = {
    DriveApp: { getFoldersByName: (n) => iter(carpetas.filter((x) => !x.padre && x.nombre === n)), createFolder: (n) => mkFolder(n, null) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    Utilities: { formatDate: (d) => d.toISOString().slice(0, 10) },
    console,
  };
  g._archivos = archivos; g._romper = (v) => { romperLectura = v; };
  return g;
}

function cargarScript(ruta, clave = 'secreta', carpeta = 'Prueba') {
  const google = crearGoogle();
  const codigo = fs.readFileSync(ruta, 'utf8').replace("'CAMBIA-ESTA-CONTRASEÑA';", "'" + clave + "';").replace(/__CARPETA__/g, carpeta);
  vm.createContext(google); vm.runInContext(codigo, google);
  return google;
}
module.exports = { crearGoogle, cargarScript };
