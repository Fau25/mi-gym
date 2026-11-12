/**
 * Sincronización de Mi Gym (iPhone, iPad y PC) a través de Google Drive.
 *
 * 1. Cambia la contraseña de la línea de abajo por una tuya (la misma que pondrás en la app).
 * 2. Implementar → Nueva implementación → Aplicación web
 *      Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario → Implementar
 * 3. Copia la URL que acaba en /exec y pégala en la app (Ajustes → Sincronización).
 *
 * Los datos se guardan en tu Drive, carpeta «Mi Gym» (datos.json + Copias diarias).
 */
const CLAVE = 'CAMBIA-ESTA-CONTRASEÑA';
const CARPETA = 'Mi Gym';
const COPIAS_MAX = 14;          // copias diarias que se conservan
const BORRADOS_DIAS = 120;      // tras cuántos días se olvidan las marcas de borrado

function doGet() {
  return json_({ ok: true, app: CARPETA });
}

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    return json_(atender_(p));
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function atender_(p) {
  comprobarClave_(p && p.clave);
  if (p.accion === 'probar') return { ok: true, app: CARPETA };
  if (p.accion !== 'sync') throw new Error('Acción desconocida');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('Drive está ocupado, se reintentará');
  try {
    const props = PropertiesService.getScriptProperties();
    const desde = Number(p.desde) || 0;
    const cambios = (p.cambios && typeof p.cambios === 'object') ? p.cambios : {};
    const hayCambios = Object.keys(cambios).length > 0;

    // Nada que subir y nada nuevo desde la última vez: no se lee Drive
    const ultimo = Number(props.getProperty('ultimo')) || 0;
    if (!hayCambios && ultimo && ultimo <= desde) return { ok: true, sinCambios: true, ahora: desde };

    const carpeta = carpeta_();
    const f = archivo_(carpeta);
    const datos = leer_(f); // si no se puede leer, lanza error: nunca se guarda vacío
    const ahora = Math.max(Date.now(), ultimo + 1); // siempre creciente
    let cambiado = false;

    for (const k in cambios) {
      const c = cambios[k];
      if (!c || typeof c.t !== 'number' || k.length > 200) continue;
      const a = datos.items[k];
      if (!a || c.t > a.t) {
        datos.items[k] = { t: c.t, v: (c.v === undefined ? null : c.v), s: ahora };
        cambiado = true;
      }
    }

    if (cambiado) {
      const limite = ahora - BORRADOS_DIAS * 864e5;
      for (const k in datos.items) {
        const it = datos.items[k];
        if (it.v === null && (it.s || 0) < limite) delete datos.items[k];
      }
      copiaDiaria_(carpeta, f);
      const texto = JSON.stringify(datos);
      if (f) f.setContent(texto); else carpeta.createFile('datos.json', texto, 'application/json');
      props.setProperty('ultimo', String(ahora));
    }

    const items = {};
    for (const k in datos.items) {
      const it = datos.items[k];
      if ((it.s || 0) > desde) items[k] = { t: it.t, v: it.v };
    }
    return { ok: true, ahora: cambiado ? ahora : ultimo, items: items };
  } finally {
    lock.releaseLock();
  }
}

// La contraseña buena siempre entra; las malas se frenan tras 5 intentos en 10 minutos.
function comprobarClave_(clave) {
  if (clave === CLAVE && CLAVE !== 'CAMBIA-ESTA-CONTRASEÑA') return;
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('fallos')) || 0;
  cache.put('fallos', String(n + 1), 600);
  if (CLAVE === 'CAMBIA-ESTA-CONTRASEÑA') throw new Error('Falta poner la contraseña en el script (línea CLAVE)');
  if (n >= 5) throw new Error('Demasiados intentos. Espera 10 minutos');
  throw new Error('Contraseña incorrecta');
}

function carpeta_() {
  const it = DriveApp.getFoldersByName(CARPETA);
  while (it.hasNext()) {
    const c = it.next();
    if (!c.isTrashed()) return c;
  }
  return DriveApp.createFolder(CARPETA);
}

function archivo_(carpeta) {
  const it = carpeta.getFilesByName('datos.json');
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed()) return f;
  }
  return null;
}

function leer_(f) {
  if (!f) return { v: 1, items: {} };
  const d = JSON.parse(f.getBlob().getDataAsString());
  if (!d || typeof d.items !== 'object' || d.items === null) throw new Error('datos.json no se puede leer');
  return d;
}

function copiaDiaria_(carpeta, f) {
  if (!f) return;
  const nombre = 'datos-' + Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd') + '.json';
  let sub;
  const it = carpeta.getFoldersByName('Copias');
  while (it.hasNext()) { const c = it.next(); if (!c.isTrashed()) { sub = c; break; } }
  if (!sub) sub = carpeta.createFolder('Copias');
  if (sub.getFilesByName(nombre).hasNext()) return;
  f.makeCopy(nombre, sub);
  const lista = [];
  const fs = sub.getFiles();
  while (fs.hasNext()) lista.push(fs.next());
  lista.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });
  lista.slice(COPIAS_MAX).forEach(function (x) { x.setTrashed(true); });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
