// Sincronización con un script de Google (Code.gs). Común a Hábitos y Mi Gym.
// La app aporta: aItems() → { clave: valor }, deItems(mapa) para aplicar lo recibido,
// esNuevo() → true si este dispositivo solo tiene datos de ejemplo/vacíos, y estado(tipo, texto).
function crearSync(o) {
  const KC = o.app + '-sync', KE = o.app + '-sync-estado';
  const leer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let conf = leer(KC);
  let est = leer(KE) || { desde: 0, tiempos: {}, huellas: {} };
  let enCurso = false, otraVez = false, tCambio = null, tSondeo = null, ultimoOk = null;

  const huella = (v) => { const s = v === undefined ? "~" : JSON.stringify(v); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h.toString(36) + '.' + s.length; };
  const aviso = (tipo, texto) => { try { o.estado && o.estado(tipo, texto); } catch (e) {} };

  async function llamar(cuerpo, url, clave) {
    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), 40000);
    try {
      const r = await fetch(url || conf.url, { method: 'POST', body: JSON.stringify({ ...cuerpo, clave: clave || conf.clave }), signal: ctrl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('El script respondió con un error (' + r.status + ')');
      let d;
      try { d = await r.json(); } catch (e) { throw new Error('La dirección no es la de un script de sincronización'); }
      if (!d || !d.ok) throw new Error((d && d.error) || 'Respuesta no válida');
      return d;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Sin respuesta del script (tiempo agotado)');
      if (e instanceof TypeError) throw new Error(navigator.onLine === false ? 'Sin conexión' : 'No se pudo conectar con el script');
      throw e;
    } finally { clearTimeout(reloj); }
  }

  async function sincronizar() {
    if (!conf || !conf.url) return;
    if (enCurso) { otraVez = true; return; }
    enCurso = true;
    aviso('sync');
    try {
      const primera = !est.desde;
      const nuevo = primera && o.esNuevo();
      const enviado = o.aItems();
      const ahora = Date.now(), cambios = {};
      if (!nuevo) {
        for (const k in enviado) {
          if (est.huellas[k] !== huella(enviado[k])) cambios[k] = { t: (primera && !est.tiempos[k]) ? 1 : ahora, v: enviado[k] };
        }
        for (const k in est.huellas) if (!(k in enviado)) cambios[k] = { t: ahora, v: null };
      }
      const r = await llamar({ accion: 'sync', desde: est.desde, cambios });
      const remotos = r.items || {};
      const hayRemotos = Object.keys(remotos).length > 0;

      // Lo que el usuario haya cambiado mientras tanto se respeta (y se enviará en la próxima)
      const ahoraLocal = o.aItems();
      const tocadoEnVuelo = (k) => huella(ahoraLocal[k] === undefined ? null : ahoraLocal[k]) !== huella(enviado[k] === undefined ? null : enviado[k]);
      const reemplazar = nuevo && hayRemotos;
      const mapa = reemplazar ? {} : { ...ahoraLocal };
      const tiempos = reemplazar ? {} : { ...est.tiempos };
      for (const k in cambios) tiempos[k] = cambios[k].t;
      let aplicado = reemplazar;
      for (const k in remotos) {
        if (!reemplazar && tocadoEnVuelo(k)) continue;
        const rt = remotos[k].t, lt = tiempos[k] || 0;
        if (reemplazar || rt >= lt) {
          if (remotos[k].v === null) { if (k in mapa) { delete mapa[k]; aplicado = true; } }
          else if (huella(mapa[k]) !== huella(remotos[k].v)) { mapa[k] = remotos[k].v; aplicado = true; }
          tiempos[k] = rt;
        }
      }
      if (aplicado) o.deItems(mapa);

      const huellas = {};
      for (const k in mapa) huellas[k] = (!reemplazar && tocadoEnVuelo(k)) ? (k in enviado ? huella(enviado[k]) : '-') : huella(mapa[k]);
      if (!reemplazar) for (const k in enviado) if (!(k in mapa) && tocadoEnVuelo(k)) huellas[k] = huella(enviado[k]);
      est = { desde: r.ahora || est.desde, tiempos, huellas };
      guardar(KE, est);
      ultimoOk = new Date();
      aviso('ok', ultimoOk);
    } catch (e) {
      aviso('error', e.message || String(e));
    } finally {
      enCurso = false;
      if (otraVez) { otraVez = false; sincronizar(); }
    }
  }

  function avisarCambio() {
    if (!conf || !conf.url) return;
    clearTimeout(tCambio);
    tCambio = setTimeout(sincronizar, 2000);
  }

  function arrancar(sinPrimera) {
    if (tSondeo) return;
    const visible = () => !document.hidden;
    tSondeo = setInterval(() => { if (visible()) sincronizar(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (visible()) sincronizar(); });
    addEventListener('online', sincronizar);
    addEventListener('pagehide', () => { if (tCambio) { clearTimeout(tCambio); sincronizar(); } });
    if (!sinPrimera) sincronizar();
  }

  return {
    get conectado() { return !!(conf && conf.url); },
    get url() { return conf ? conf.url : ''; },
    get ultimo() { return ultimoOk; },
    comprobarUrl(url) {
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return 'La dirección debe ser la del script y acabar en /exec';
      return '';
    },
    async conectar(url, clave) {
      url = String(url || '').trim(); clave = String(clave || '');
      const mal = this.comprobarUrl(url); if (mal) throw new Error(mal);
      if (!clave) throw new Error('Escribe la contraseña del script');
      await llamar({ accion: 'probar' }, url, clave);
      conf = { url, clave }; guardar(KC, conf);
      est = { desde: 0, tiempos: {}, huellas: {} }; guardar(KE, est);
      await sincronizar();
      if (!tSondeo) arrancar(true);
    },
    desconectar() {
      conf = null; est = { desde: 0, tiempos: {}, huellas: {} };
      try { localStorage.removeItem(KC); localStorage.removeItem(KE); } catch (e) {}
      ultimoOk = null; aviso('off');
    },
    sincronizar, avisarCambio,
    iniciar() { if (conf && conf.url) arrancar(); else aviso('off'); }
  };
}
