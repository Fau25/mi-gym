'use strict';
const VERSION = 'v18';
const CLAVE = 'migym-v1', COPIAS = 'migym-copias';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
const fmt = (n, d = 1) => n == null ? '–' : n.toLocaleString('es-ES', { maximumFractionDigits: d });
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DSEM = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ---------- Fechas ----------
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deIso = s => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
const sumar = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
const hoy = () => iso(new Date());
const corta = s => { const d = deIso(s); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
// La semana va de lunes a sábado; el domingo ya muestra la semana siguiente (el «reseteo»).
const semanaDe = s => { const d = deIso(s), w = d.getDay(); return sumar(s, w === 0 ? 1 : 1 - w); };

// ---------- Datos ----------
let D = cargar();
function vacio() { return { v: 1, planes: {}, ses: {}, peso: {}, ajustes: { objetivo: null } }; }
function cargar() {
  try {
    const t = localStorage.getItem(CLAVE);
    if (!t) return vacio();
    const d = JSON.parse(t);
    if (!d || d.v !== 1) throw 0;
    return Object.assign(vacio(), d);
  } catch (e) {
    try { localStorage.setItem(CLAVE + '-danado', localStorage.getItem(CLAVE)); } catch (_) {}
    const c = copias()[0];
    return c ? c.d : vacio();
  }
}
function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(D));
    const cs = copias(), h = hoy();
    if (!cs[0] || cs[0].f !== h) { cs.unshift({ f: h, d: D }); localStorage.setItem(COPIAS, JSON.stringify(cs.slice(0, 3))); }
    else { cs[0].d = D; localStorage.setItem(COPIAS, JSON.stringify(cs)); }
    if (!aplicandoSync && typeof SYNC !== 'undefined') SYNC.avisarCambio();
  } catch (e) { aviso('No se pudo guardar: el almacenamiento está lleno'); }
}
// ---------- Sincronización con Google Drive (opcional, Ajustes) ----------
let aplicandoSync = false, syncEst = { t: 'off' }, pintarPendiente = false;
function aItems() {
  const m = { aj: D.ajustes };
  for (const k in D.planes) m['plan:' + k] = D.planes[k];
  for (const k in D.ses) m['ses:' + k] = D.ses[k];
  for (const k in D.peso) m['peso:' + k] = D.peso[k];
  return m;
}
function deItems(m) {
  const n = vacio();
  for (const k in m) {
    const i = k.indexOf(':'), tipo = i < 0 ? k : k.slice(0, i), id = k.slice(i + 1);
    if (k === 'aj') n.ajustes = Object.assign({ objetivo: null }, m[k]);
    else if (tipo === 'plan') n.planes[id] = m[k];
    else if (tipo === 'ses') n.ses[id] = m[k];
    else if (tipo === 'peso') n.peso[id] = m[k];
  }
  D = n; aplicandoSync = true; guardar(); aplicandoSync = false;
  const escribiendo = document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
  if (hojaAb || escribiendo) pintarPendiente = true; else pintar();
}
function textoSync() {
  const e = syncEst;
  if (e.t === 'ok') return 'Sincronizado a las ' + e.x.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (e.t === 'sync') return 'Sincronizando…';
  if (e.t === 'error') return 'No se pudo sincronizar: ' + e.x;
  return '';
}
const SYNC = crearSync({
  app: 'migym', aItems, deItems,
  esNuevo: () => !Object.keys(D.ses).length && !Object.keys(D.peso).length && D.ajustes.objetivo == null,
  estado: (t, x) => { syncEst = { t, x }; const el = document.getElementById('syncTxt'); if (el) { el.textContent = textoSync(); el.className = 'nota' + (t === 'error' ? ' error' : ''); } }
});
document.addEventListener('focusout', () => { setTimeout(() => { if (pintarPendiente && !hojaAb && !(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) { pintarPendiente = false; pintar(); } }, 50); });
function copias() { try { return JSON.parse(localStorage.getItem(COPIAS)) || []; } catch (e) { return []; } }
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

// ---------- Plan semanal ----------
function azar(semilla) { let h = 2166136261; for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function planAnterior(sem) { const k = Object.keys(D.planes).filter(x => x < sem).sort().pop(); return k ? D.planes[k] : null; }
function elegir(hueco, evitar, r) { const op = hueco.pool.filter(x => !evitar.includes(x)); const lista = op.length ? op : hueco.pool; return lista[Math.floor(r() * lista.length)]; }
function plan(sem) {
  const p = D.planes[sem] || {};
  let nuevo = !D.planes[sem];
  const prev = planAnterior(sem), r = azar(sem);
  for (const t in PLANTILLA) {
    const hs = PLANTILLA[t].huecos;
    if (p[t] && p[t].length === hs.length && p[t].every((id, i) => hs[i].pool.includes(id) || hs[i].extra.includes(id))) continue;
    const dia = [];
    hs.forEach((h, i) => { dia[i] = elegir(h, [...(prev && prev[t] ? [prev[t][i]] : []), ...dia], r); });
    p[t] = dia; nuevo = true;
  }
  if (nuevo) { D.planes[sem] = p; guardar(); }
  return p;
}
function cambiar(sem, t, i) {
  const h = PLANTILLA[t].huecos[i], prev = planAnterior(sem), act = D.planes[sem][t][i];
  const todos = [...h.pool, ...h.extra];
  const hoyDia = D.planes[sem][t];
  const op = todos.filter(x => x !== act && !hoyDia.includes(x) && (!prev || !prev[t] || x !== prev[t][i]));
  const lista = op.length ? op : todos.filter(x => x !== act && !hoyDia.includes(x));
  D.planes[sem][t][i] = lista[(lista.indexOf(act) + 1 + Math.floor(Math.random() * lista.length)) % lista.length] || act;
  guardar();
}

// ---------- Historial y progresión ----------
const hechas = arr => (arr || []).filter(s => s.ok && s.kg != null && s.reps);
function historial(id, antes) {
  return Object.keys(D.ses).filter(f => (!antes || f < antes) && hechas(D.ses[f].ej[id]).length).sort().map(f => ({ f, s: hechas(D.ses[f].ej[id]) }));
}
const rm = s => s.kg * (1 + s.reps / 30);
const mejorRM = ss => Math.max(...ss.map(rm));
const redondea = (kg, inc) => Math.round(kg / inc) * inc;

function sugerencia(id, h, fecha) {
  const hist = historial(id, fecha), e = EJ[id], [lo, hi] = h.r;
  if (hist.length && !e.inc) {
    const u = hist[hist.length - 1].s, m = Math.min(...u.map(s => s.reps));
    return { kg: Math.max(...u.map(s => s.kg)), reps: m + 1, txt: m >= hi ? 'Ya dominas el rango: añade peso o haz más repeticiones.' : `Intenta ${m + 1} repeticiones en cada serie.` };
  }
  if (!hist.length) return { kg: null, reps: hi, txt: `Primera vez: elige un peso con el que llegues a ${hi} reps dejando 1–2 en reserva.` };
  const ult = hist[hist.length - 1].s;
  const kg = Math.max(...ult.map(s => s.kg));
  const aKg = ult.filter(s => s.kg === kg);
  if (aKg.length >= h.s && aKg.every(s => s.reps >= hi)) {
    const nk = +(kg + e.inc).toFixed(2);
    return { kg: nk, reps: lo, txt: `¡Subes! ${fmt(nk, 2)} kg y vuelve a ${lo} reps.`, sube: true };
  }
  const bajo = aKg.some(s => s.reps < lo);
  const prev = hist.length > 1 ? hist[hist.length - 2].s : null;
  if (bajo && prev && prev.some(s => s.kg === kg && s.reps < lo)) {
    const bk = redondea(kg * 0.9, e.inc);
    return { kg: bk, reps: hi, txt: `Dos sesiones sin llegar a ${lo}: baja a ${fmt(bk, 2)} kg y sube reps.` };
  }
  const meta = Math.min(hi, Math.min(...aKg.map(s => s.reps)) + 1);
  return { kg, reps: meta, txt: `Mantén ${fmt(kg, 2)} kg e intenta ${meta} reps en cada serie.` };
}

// ---------- Peso corporal ----------
function media(fin, dias = 7) {
  const v = []; for (let i = 0; i < dias; i++) { const k = D.peso[sumar(fin, -i)]; if (k != null) v.push(k); }
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function ritmo() {
  const h = hoy(), a = media(h), b = media(sumar(h, -7));
  if (a == null) return null;
  const ult = Object.keys(D.peso).sort().pop();
  if (b == null) return { media: a, ult: D.peso[ult], d: null, txt: 'Pésate 3–4 días por semana para calcular el ritmo', cls: '' };
  const d = a - b, lo = a * 0.0025, hi = a * 0.005;
  let txt, cls;
  if (d < 0) { txt = 'Estás bajando: come unas 300 kcal más al día'; cls = 'mal'; }
  else if (d < lo) { txt = 'Muy lento: suma unas 200 kcal al día'; cls = 'medio'; }
  else if (d > hi * 1.5) { txt = 'Muy rápido: probablemente ganas grasa, recorta un poco'; cls = 'medio'; }
  else { txt = 'Buen ritmo para ganar músculo'; cls = 'bien'; }
  return { media: a, ult: D.peso[ult], d, txt, cls, lo, hi };
}

// ---------- Gráfica SVG ----------
function grafica(series, alto = 140) {
  const pts = series.flatMap(s => s.p);
  if (pts.length < 2) return '<p class="vacio">Aún no hay datos suficientes para la gráfica.</p>';
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  let y0 = Math.min(...ys), y1 = Math.max(...ys); if (y1 - y0 < 1) { y0 -= 0.5; y1 += 0.5; }
  const W = 320, H = alto, P = 14;
  const X = x => P + (x - x0) / ((x1 - x0) || 1) * (W - 2 * P), Y = y => H - P - (y - y0) / (y1 - y0) * (H - 2 * P);
  const lineas = series.map(s => `<polyline class="${s.c}" points="${s.p.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}"/>` +
    (s.puntos ? s.p.map(p => `<circle class="${s.c}" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.5"/>`).join('') : '')).join('');
  return `<svg class="graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de ${fmt(y0)} a ${fmt(y1)}"><line x1="0" x2="${W}" y1="${P}" y2="${P}"/><line x1="0" x2="${W}" y1="${H - P}" y2="${H - P}"/>${lineas}<text x="${W}" y="${P - 2}">${fmt(y1)}</text><text x="${W}" y="${H - P - 3}">${fmt(y0)}</text></svg>`;
}
const dia = s => deIso(s).getTime() / 864e5;

const rango = r => r[0] === r[1] ? r[0] : `${r[0]}–${r[1]}`;
// ---------- Vistas ----------
let vista = 'hoy', tipoManual = null;
// Escritorio (desde 1024 px): ejercicios agrupados por músculo en columnas y menú arriba
const MQ_PC = matchMedia('(min-width:1024px)');
MQ_PC.addEventListener('change', () => { if (!hojaAb) pintar(); });
function ir(v) { vista = v; pintar(); $('#vista').focus({ preventScroll: true }); scrollTo(0, 0); }
function pintar() {
  document.querySelectorAll('.menu button').forEach(b => b.setAttribute('aria-current', b.dataset.v === vista ? 'page' : 'false'));
  $('#vista').innerHTML = ({ hoy: vHoy, progreso: vProgreso, peso: vPeso, ajustes: vAjustes })[vista]();
}

function chipPeso() {
  const r = ritmo();
  if (!r) return `<button class="pchip" data-ir="peso">Apuntar peso</button>`;
  return `<button class="pchip ${r.cls}" data-ir="peso" aria-label="Peso ${fmt(r.ult)} kg"><b>${fmt(r.ult)} kg</b>${r.d != null ? `<span>${r.d >= 0 ? '+' : ''}${fmt(r.d, 2)}/sem</span>` : ''}</button>`;
}
// Imágenes propias (solo en este dispositivo, importadas desde Ajustes)
const CLAVE_IMG = 'migym-img';
let IMG = {};
function idb() { return new Promise((ok, ko) => { const r = indexedDB.open('migym', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
async function imgCargar() {
  const db = await idb();
  return new Promise(ok => { const out = {}, c = db.transaction('img').objectStore('img').openCursor(); c.onsuccess = () => { const k = c.result; if (k) { out[k.key] = k.value; k.continue(); } else ok(out); }; c.onerror = () => ok(out); });
}
async function imgGuardar(obj) {
  const db = await idb();
  return new Promise((ok, ko) => { const t = db.transaction('img', 'readwrite'), s = t.objectStore('img'); s.clear(); for (const k in obj) s.put(obj[k], k); t.oncomplete = ok; t.onerror = () => ko(t.error); });
}
(async () => {
  try {
    localStorage.removeItem(CLAVE_IMG);
    const todas = await imgCargar();
    for (const id in todas) if (EJ[id]) IMG[id] = todas[id];
    // Borra del dispositivo las imágenes de ejercicios que ya no están en el catálogo
    if (Object.keys(todas).length > Object.keys(IMG).length) await imgGuardar(IMG);
    if (Object.keys(IMG).length) pintar();
  } catch (e) {}
})();
const imgValida = s => typeof s === 'string' && s.length < 600000 && /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s);
const ICONO = '<svg viewBox="0 0 24 24"><path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/></svg>';
const foto = (id, cls = 'mini-img') => IMG[id] ? `<span class="${cls} anim propia" aria-hidden="true"><img src="${IMG[id]}" alt="" decoding="async"></span>` : `<span class="${cls} anim ph" aria-hidden="true">${ICONO}<b>${GRUPOS[EJ[id].g]}</b></span>`;

function vHoy() {
  const h = hoy(), d = deIso(h), sem = semanaDe(h), p = plan(sem);
  const ses = D.ses[h];
  const tipo = (ses && ses.tipo) || tipoManual || DIAS[d.getDay()];
  const r = ritmo();
  let html = `<header class="top"><button class="ic" data-ir="ajustes" aria-label="Ajustes"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/></svg></button>
    <p>${DSEM[d.getDay()]}, ${corta(h)}</p>
    <button class="ic peso-ic ${r ? r.cls : ''}" data-ir="peso" aria-label="Peso">${r ? `<b>${fmt(r.ult)}</b>` : '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 11a4 4 0 0 1 8 0M12 11l1.6-2.2"/></svg>'}</button></header>`;
  const tieneHechas = ses && Object.values(ses.ej).some(x => hechas(x).length);
  const chips = `<div class="pills" role="tablist">${Object.keys(PLANTILLA).map(t => `<button role="tab" aria-selected="${t === tipo}" class="${t === tipo ? 'on' : ''}" data-entrenar="${t}"${tieneHechas && t !== tipo ? ' disabled' : ''}>${PLANTILLA[t].titulo}</button>`).join('')}</div>`;
  if (!tipo) {
    const dom = d.getDay() === 0;
    html += `<h1 class="gran">Hoy toca<br>descansar</h1>
      <p class="sub-gran">${dom ? 'Nueva semana lista con ejercicios renovados.' : `El músculo crece descansando. Próximo: ${proximo(h)}.`}</p>
      <div class="sec-t"><h2>¿Entrenar igualmente?</h2></div>${chips}`;
    if (dom) html += Object.keys(PLANTILLA).map(t => resumenPlan(sem, t)).join('');
    return html;
  }
  const pl = PLANTILLA[tipo], ids = p[tipo], prev = planAnterior(sem);
  const total = pl.huecos.reduce((a, x) => a + x.s, 0), hechasHoy = ses ? Object.values(ses.ej).reduce((a, s) => a + hechas(s).length, 0) : 0;
  const pct = Math.round(hechasHoy / total * 100);
  html += `<h1 class="gran">Hoy toca<br>${pl.titulo.toLowerCase()}</h1>
    <p class="sub-gran">${pl.sub} · semana ${semanaNum(sem)}</p>
    ${chips}
    <div class="sec-t"><h2>Ejercicios de hoy</h2><span>${hechasHoy}/${total} series · ${pct} %</span></div>
    ${MQ_PC.matches ? gruposPC(ids, i => fichaEj(i)) : `<ul class="ejs">${ids.map((id, i) => fichaEj(i)).join('')}</ul>`}`;
  function fichaEj(i) { const id = ids[i]; {
      const hu = pl.huecos[i], s = hechas(ses && ses.ej[id]).length, sug = sugerencia(id, hu, h);
      const nuevo = (!prev || !prev[tipo] || prev[tipo][i] !== id);
      const pc = Math.min(100, Math.round(s / hu.s * 100));
      return `<li><button class="ejfila${s >= hu.s ? ' hecho' : ''}" data-abrir="${tipo}:${i}">${foto(id)}
        <span class="ejtxt"><b>${esc(EJ[id].n)}</b><small>${hu.s} × ${rango(hu.r)}${sug.kg != null ? ` · ${fmt(sug.kg, 2)} kg` : ''}${nuevo ? ' · <em>nuevo</em>' : ''}</small>
        <span class="barra-p"><svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect class="f" width="100" height="8" rx="4"/><rect class="v" width="${pc}" height="8" rx="4"/></svg><em>${pc}%</em></span></span></button></li>`;
    } }
  function gruposPC(ids, f) {
    const NOMBRES = { pecho: 'Pecho', hombro: 'Hombro', triceps: 'Tríceps', espalda: 'Espalda', biceps: 'Bíceps' };
    const orden = [], por = {};
    ids.forEach((id, i) => { const g = EJ[id].g; if (!por[g]) { por[g] = []; orden.push(g); } por[g].push(i); });
    return `<div class="grupos-pc">${orden.map(g => {
      const hech = por[g].reduce((a, i) => a + hechas(ses && ses.ej[ids[i]]).length, 0), tot = por[g].reduce((a, i) => a + pl.huecos[i].s, 0);
      return `<section><div class="sec-t"><h2>${NOMBRES[g] || g}</h2><span>${hech}/${tot} series</span></div><ul class="ejs">${por[g].map(f).join('')}</ul></section>`;
    }).join('')}</div>`;
  }
  if (tipoManual && tipoManual !== DIAS[d.getDay()] && !tieneHechas) html += `<button class="btn sec ancho" data-entrenar="">${DIAS[d.getDay()] ? 'Volver al entreno de hoy' : 'Volver a descanso'}</button>`;
  return html;
}
function semanaNum(lunes) { const d = deIso(lunes), j = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - j) / 864e5 - 3 + ((j.getDay() + 6) % 7)) / 7); }
function proximo(h) { for (let i = 1; i <= 7; i++) { const f = sumar(h, i), t = DIAS[deIso(f).getDay()]; if (t) return `${DSEM[deIso(f).getDay()].toLowerCase()}, ${PLANTILLA[t].titulo.toLowerCase()}`; } return ''; }
function resumenPlan(sem, t) {
  const p = plan(sem), prev = planAnterior(sem);
  return `<section class="tarjeta"><h2>${PLANTILLA[t].titulo} · ${PLANTILLA[t].sub}</h2><ul class="rejilla">${p[t].map((id, i) => {
    const h = PLANTILLA[t].huecos[i], nuevo = (!prev || !prev[t] || prev[t][i] !== id);
    return `<li>${foto(id, 'rej-img')}<b>${esc(EJ[id].n)}</b><small>${h.s} × ${rango(h.r)}${nuevo ? ' · nuevo' : ''}</small></li>`;
  }).join('')}</ul></section>`;
}

// ---------- Hoja de un ejercicio (diseño A en oscuro) ----------
let hojaAb = null;
const SVG_X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const SVG_CAMBIO = '<svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>';
const SVG_OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function datosHoja(fecha, tipo, i) {
  const id = plan(semanaDe(fecha))[tipo][i], h = PLANTILLA[tipo].huecos[i], ses = D.ses[fecha];
  const e = EJ[id], sug = sugerencia(id, h, fecha), hist = historial(id, fecha);
  const ult = hist.length ? hist[hist.length - 1] : null, prev = planAnterior(semanaDe(fecha));
  const etiqueta = (!prev || !prev[tipo] || prev[tipo][i] !== id) ? 'Nuevo' : '';
  const series = (ses && ses.ej[id]) || [];
  const n = Math.max(h.s, series.length), hechasN = hechas(series).length;
  return { id, h, e, sug, ult, etiqueta, series, n, hechasN, todas: hechasN >= h.s, total: PLANTILLA[tipo].huecos.length, puedeCambiar: !!(h.pool || h.alt) };
}
const coma = v => v == null ? '' : String(v).replace('.', ',');
const inKg = (id, k, s, sug) => `<input inputmode="decimal" enterkeyhint="next" data-c="kg" value="${coma(s.kg)}" placeholder="${sug.kg ?? 'kg'}" aria-label="Kilos serie ${k + 1}">`;
const inReps = (k, s, sug) => `<input inputmode="numeric" enterkeyhint="done" data-c="reps" value="${s.reps ?? ''}" placeholder="${sug.reps}" aria-label="Repeticiones serie ${k + 1}">`;
const pieHoja = (x, tipo, i, cls = '') => `<div class="hoja-pie ${cls}"><button class="mas" data-mas="${x.id}">+ Serie</button>
  ${i < x.total - 1 ? `<button class="btn${x.todas ? '' : ' sec'}" data-abrir="${tipo}:${i + 1}">Siguiente ›</button>` : `<button class="btn${x.todas ? '' : ' sec'}" data-cerrar>Terminar</button>`}</div>`;

function contenidoHoja(fecha, tipo, i) {
  const x = datosHoja(fecha, tipo, i);
  return `<div class="ej f-a" data-tipo="${tipo}" data-i="${i}">${fichaA(x, tipo, i)}</div>`;
}
// A · Hoja: tarjeta que sube desde abajo, imagen en caja gris, consejo en banner negro, series en filas
function fichaA(x, tipo, i) {
  let filas = '';
  for (let k = 0; k < x.n; k++) {
    const s = x.series[k] || {};
    filas += `<div class="serie${s.ok ? ' ok' : ''}" data-id="${x.id}" data-k="${k}"><span class="ns">${k + 1}</span>
      <label>${inKg(x.id, k, s, x.sug)}<i>kg</i></label><label>${inReps(k, s, x.sug)}<i>reps</i></label>
      <button class="check" aria-pressed="${!!s.ok}" aria-label="Serie ${k + 1} hecha">${SVG_OK}</button></div>`;
  }
  return `<div class="a-asa" aria-hidden="true"></div>
    <div class="a-top"><button class="ic" data-cerrar aria-label="Cerrar">${SVG_X}</button><span>${i + 1} de ${x.total}</span>${x.puedeCambiar ? `<button class="ic" data-cambiar aria-label="Cambiar por otro ejercicio">${SVG_CAMBIO}</button>` : '<span class="ic"></span>'}</div>
    <h2 id="hojaT">${esc(x.e.n)}</h2>
    <div class="pills peq">${x.etiqueta ? `<span class="on">${x.etiqueta}</span>` : ''}<span>${GRUPOS[x.e.g]}</span><span>${x.h.s} × ${rango(x.h.r)}</span></div>
    <div class="a-consejo${x.sug.sube ? ' sube' : ''}"><span>${esc(x.sug.txt)}</span>${x.ult ? `<small>Última vez (${corta(x.ult.f)}): ${x.ult.s.map(s => `${fmt(s.kg, 2)}×${s.reps}`).join(' · ')}</small>` : ''}</div>
    <div class="series">${filas}</div>${pieHoja(x, tipo, i, 'oscuro')}
    <div class="a-img">${foto(x.id, 'big-img')}</div>`;
}
function abrirHoja(tipo, i) {
  hojaAb = { tipo, i };
  const hoja = $('#hoja'), panel = $('#hoja .panel');
  panel.className = 'panel p-a'; panel.innerHTML = contenidoHoja(hoy(), tipo, i); panel.scrollTop = 0;
  if (hoja.hidden) { hoja.hidden = false; $('#vista').inert = true; $('.menu').inert = true; requestAnimationFrame(() => hoja.classList.add('ver')); }
  panel.focus();
}
function cerrarHoja() {
  if (!hojaAb) return; hojaAb = null;
  const hoja = $('#hoja'); hoja.classList.remove('ver'); $('#vista').inert = false; $('.menu').inert = false;
  setTimeout(() => { if (!hojaAb) hoja.hidden = true; }, 220);
  pintar();
}
function repintarHoja() {
  const panel = $('#hoja .panel'), y = panel.scrollTop;
  panel.innerHTML = contenidoHoja(hoy(), hojaAb.tipo, hojaAb.i); panel.scrollTop = y;
}

function vProgreso() {
  const h = hoy(), sem = deIso(h).getDay() === 0 ? sumar(semanaDe(h), -7) : semanaDe(h), fin = sumar(sem, 6);
  const sesSem = Object.keys(D.ses).filter(f => f >= sem && f <= fin && Object.values(D.ses[f].ej).some(s => hechas(s).length));
  const porGrupo = {}; ['pecho', 'hombro', 'triceps', 'espalda', 'biceps'].forEach(g => porGrupo[g] = 0);
  sesSem.forEach(f => Object.entries(D.ses[f].ej).forEach(([id, s]) => { if (EJ[id] && EJ[id].g in porGrupo) porGrupo[EJ[id].g] += hechas(s).length; }));
  const r = ritmo();

  // Fuerza en los 5 ejercicios más repetidos
  const fijos = Object.keys(EJ).map(id => [id, historial(id).length]).filter(x => x[1] > 1).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
  const fuerza = fijos.map(id => {
    const hi = historial(id); if (!hi.length) return null;
    const act = mejorRM(hi[hi.length - 1].s);
    const base = hi.find(x => x.f >= sumar(h, -28)) || hi[0];
    const pct = (act / mejorRM(base.s) - 1) * 100;
    const ult3 = hi.slice(-3).map(x => mejorRM(x.s));
    const parado = ult3.length === 3 && ult3[2] <= ult3[0];
    return { id, act, pct, parado };
  }).filter(Boolean);

  const consejos = [];
  if (r && r.cls && r.cls !== 'bien') consejos.push(r.txt);
  if (fuerza.some(f => f.parado)) consejos.push(`Estancado en ${fuerza.filter(f => f.parado).map(f => EJ[f.id].n.toLowerCase()).join(' y ')}: revisa descanso, sueño y que comes suficiente.`);
  Object.entries(porGrupo).forEach(([g, n]) => { if (sesSem.length >= 2 && n < 10) consejos.push(`${GRUPOS[g]}: ${n} series esta semana; para crecer conviene llegar a 10–20.`); });
  if (!consejos.length && (sesSem.length || r)) consejos.push('Todo en orden: sigue subiendo kilos o repeticiones cada semana.');

  const conHist = Object.keys(EJ).filter(id => historial(id).length);
  const sel = conHist.includes(progSel) ? progSel : conHist[0];
  const hiSel = sel ? historial(sel) : [];

  return `<header class="cab"><p class="fecha">Semana ${semanaNum(sem)}</p><h1>Progreso</h1></header>
  <section class="tarjeta"><h2>Esta semana</h2>
    <div class="cifras"><div><b>${sesSem.length}<small>/4</small></b><span>entrenos</span></div>
    <div><b>${r && r.d != null ? (r.d >= 0 ? '+' : '') + fmt(r.d, 2) : '–'}</b><span>kg/semana</span></div>
    <div><b>${Object.values(porGrupo).reduce((a, b) => a + b, 0)}</b><span>series</span></div></div>
    <div class="barras">${Object.entries(porGrupo).map(([g, n]) => `<div class="barra"><span>${GRUPOS[g]}</span><svg class="pista" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect class="f" width="100" height="8" rx="4"/><rect class="${n >= 10 ? 'v ok' : 'v'}" width="${Math.max(n ? 4 : 0, Math.min(100, n / 20 * 100))}" height="8" rx="4"/><rect class="m" x="49.5" width="1" height="8"/></svg><b>${n}</b></div>`).join('')}</div>
    <p class="nota">Marca: 10 series por grupo a la semana.</p></section>
  <section class="tarjeta"><h2>Análisis</h2><ul class="consejos">${(consejos.length ? consejos : ['Apunta tu primer entreno y tu peso para empezar a analizar.']).map(c => `<li>${esc(c)}</li>`).join('')}</ul></section>
  ${fuerza.length ? `<section class="tarjeta"><h2>Fuerza (máximo estimado)</h2><ul class="lista">${fuerza.map(f => `<li><span>${esc(EJ[f.id].n)}</span><small><b>${fmt(f.act)} kg</b> · ${f.pct >= 0 ? '+' : ''}${fmt(f.pct)} % en 4 sem${f.parado ? ' · estancado' : ''}</small></li>`).join('')}</ul></section>` : ''}
  ${sel ? `<section class="tarjeta"><h2>Por ejercicio</h2>
    <label class="campo"><span class="vh">Ejercicio</span><select id="selEj">${conHist.map(id => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(EJ[id].n)}</option>`).join('')}</select></label>
    ${grafica([{ c: 'l1', puntos: true, p: hiSel.map(x => [dia(x.f), mejorRM(x.s)]) }])}
    <ul class="lista">${hiSel.slice(-5).reverse().map(x => `<li><span>${corta(x.f)}</span><small>${x.s.map(s => `${fmt(s.kg, 2)}×${s.reps}`).join(', ')}</small></li>`).join('')}</ul></section>` : ''}`;
}
let progSel = null;

function vPeso() {
  const h = hoy(), r = ritmo(), obj = D.ajustes.objetivo;
  const fechas = Object.keys(D.peso).filter(f => f >= sumar(h, -90)).sort();
  const pts = fechas.map(f => [dia(f), D.peso[f]]);
  const med = fechas.map(f => [dia(f), media(f)]);
  return `<header class="cab"><p class="fecha">${corta(h)}</p><h1>Peso</h1></header>
  <form class="tarjeta fila-peso" id="fPeso"><label class="campo"><span>Peso de hoy (kg)</span><input id="inPeso" inputmode="decimal" enterkeyhint="done" value="${D.peso[h] ?? ''}" placeholder="${r ? fmt(r.ult) : '70,0'}"></label><button class="btn">Guardar</button></form>
  ${r ? `<section class="tarjeta"><div class="cifras"><div><b>${fmt(r.media)}</b><span>media 7 días</span></div><div><b>${r.d != null ? (r.d >= 0 ? '+' : '') + fmt(r.d, 2) : '–'}</b><span>kg/semana</span></div>${obj ? `<div><b>${fmt(obj - r.media)}</b><span>hasta ${fmt(obj)} kg</span></div>` : ''}</div>
    <p class="estado-l ${r.cls}">${esc(r.txt)}</p>${r.lo ? `<p class="nota">Ritmo ideal para ti: +${fmt(r.lo, 2)} a +${fmt(r.hi, 2)} kg por semana.</p>` : ''}</section>` : ''}
  <section class="tarjeta"><h2>Últimos 90 días</h2>${grafica([{ c: 'l2', puntos: true, p: pts }, { c: 'l1', p: med }])}<p class="leyenda"><i class="l2"></i>Cada pesada <i class="l1"></i>Media 7 días</p></section>
  ${fechas.length ? `<section class="tarjeta"><h2>Registro</h2><ul class="lista">${fechas.slice(-14).reverse().map(f => `<li><span>${corta(f)}</span><small>${fmt(D.peso[f])} kg <button class="mini x" data-borrapeso="${f}" aria-label="Borrar ${corta(f)}">×</button></small></li>`).join('')}</ul></section>` : ''}
  <p class="nota">Pésate en ayunas, después del baño, 3–4 días por semana.</p>`;
}

function vAjustes() {
  const cs = copias();
  return `<header class="cab"><h1>Ajustes</h1></header>
  <form class="tarjeta fila-peso" id="fObj"><label class="campo"><span>Peso objetivo (kg)</span><input id="inObj" inputmode="decimal" value="${D.ajustes.objetivo ?? ''}" placeholder="Opcional"></label><button class="btn">Guardar</button></form>
  <section class="tarjeta"><h2>Rutina</h2><p class="nota">Lunes y jueves: empuje (pecho, hombro y tríceps). Martes y viernes: tirón (espalda y bíceps). 3 ejercicios por grupo muscular. Cada domingo se eligen 3 ejercicios por grupo entre los tuyos, sin repetir los de la semana anterior (puedes cambiarlos si la máquina está ocupada).</p>
    <button class="btn sec ancho" id="renovar">Renovar ejercicios de esta semana</button></section>
  <section class="tarjeta"><h2>Cómo te guía</h2><p class="nota">Todos los ejercicios son de 3 series de 8. Cuando completas las 3 series de 8, te propone subir kilos. Si dos sesiones seguidas no llegas a 8, te propone bajar un 10 %. Para el peso corporal busca ganar entre un 0,25 % y un 0,5 % a la semana.</p></section>
  <section class="tarjeta"><h2>Imágenes de los ejercicios</h2><p class="nota">${Object.keys(IMG).length ? `Usando tus imágenes en ${Object.keys(IMG).length} ejercicios. Se guardan solo en este dispositivo.` : 'Puedes importar un paquete de imágenes propio. Se guarda solo en este dispositivo.'}</p>
    <div class="botones2"><label class="btn sec">Importar imágenes<input type="file" id="importarImg" accept="application/json,.json" hidden></label>${Object.keys(IMG).length ? '<button class="btn sec" id="quitarImg">Quitar</button>' : ''}</div></section>
  ${SYNC.conectado ? `<section class="tarjeta"><h2>Sincronización</h2><p class="nota">Tus entrenos y pesos se guardan en tu Google Drive y se comparten entre tus dispositivos.</p><p id="syncTxt" class="nota${syncEst.t === 'error' ? ' error' : ''}">${esc(textoSync())}</p>
    <div class="botones2"><button class="btn sec" id="syncYa">Sincronizar ahora</button><button class="btn sec" id="syncOff">Desconectar</button></div></section>`
  : `<form class="tarjeta" id="fSync"><h2>Sincronización</h2><p class="nota">Conecta tu script de Google «Mi Gym» para tener los mismos datos en el iPhone, el iPad y el PC.</p>
    <label class="campo"><span>Dirección del script (acaba en /exec)</span><input id="inSyncUrl" type="url" autocomplete="off" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec"></label>
    <label class="campo"><span>Contraseña del script</span><input id="inSyncClave" type="password" autocomplete="off"></label>
    <p id="syncTxt" class="nota${syncEst.t === 'error' ? ' error' : ''}">${esc(textoSync())}</p>
    <button class="btn ancho" id="btnSync">Conectar</button></form>`}
  <section class="tarjeta"><h2>Copia de seguridad</h2>
    <div class="botones2"><button class="btn sec" id="exportar">Exportar</button><label class="btn sec">Importar<input type="file" id="importar" accept="application/json,.json" hidden></label></div>
    ${cs.length ? `<p class="nota">Copias automáticas:</p><ul class="lista">${cs.map((c, i) => `<li><span>${corta(c.f)}</span><small><button class="mini txt" data-restaurar="${i}">Restaurar</button></small></li>`).join('')}</ul>` : ''}</section>
  <p class="nota centro">Mi Gym ${VERSION} · ${SYNC.conectado ? 'sincronizado con Google Drive' : 'datos solo en este dispositivo'}</p>`;
}

// ---------- Eventos ----------
function sesion(fecha, tipo) { if (!D.ses[fecha]) D.ses[fecha] = { tipo, ej: {} }; return D.ses[fecha]; }
function tipoHoy() { const h = hoy(); return (D.ses[h] && D.ses[h].tipo) || tipoManual || DIAS[deIso(h).getDay()]; }

document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-ir], [data-cerrar]'); if (!t) return;
  if (t.closest('.menu')) return ir(t.dataset.v);
  if (t.dataset.ir) return ir(t.dataset.ir);
  if (t.dataset.entrenar !== undefined) {
    tipoManual = t.dataset.entrenar || null;
    const s = D.ses[hoy()]; if (s && !Object.values(s.ej).some(x => hechas(x).length)) { delete D.ses[hoy()]; guardar(); }
    return pintar();
  }
  if (t.dataset.abrir) { const [ti, i] = t.dataset.abrir.split(':'); return abrirHoja(ti, +i); }
  if (t.hasAttribute('data-cerrar')) return cerrarHoja();
  const card = t.closest('.ej');
  if (t.classList.contains('check')) {
    const fila = t.closest('.serie'), id = fila.dataset.id, k = +fila.dataset.k;
    const ses = sesion(hoy(), tipoHoy()); const arr = ses.ej[id] || (ses.ej[id] = []);
    const s = arr[k] || (arr[k] = {});
    const ik = fila.querySelector('[data-c=kg]'), ir_ = fila.querySelector('[data-c=reps]');
    s.kg = num(ik.value) ?? num(ik.placeholder); s.reps = num(ir_.value) ?? num(ir_.placeholder);
    if (!s.ok && (s.kg == null || !s.reps)) { aviso('Escribe los kilos y las repeticiones'); (s.kg == null ? ik : ir_).focus(); return; }
    s.ok = !s.ok; for (let j = 0; j < arr.length; j++) if (!arr[j]) arr[j] = {};
    guardar(); repintarTarjeta(card);
    if (s.ok && navigator.vibrate) navigator.vibrate(15);
    return;
  }
  if (t.dataset.mas) {
    const ses = sesion(hoy(), tipoHoy()); const arr = ses.ej[t.dataset.mas] || (ses.ej[t.dataset.mas] = []);
    const h = PLANTILLA[card.dataset.tipo].huecos[+card.dataset.i];
    while (arr.length < h.s) arr.push({});
    arr.push({}); guardar(); repintarTarjeta(card); return;
  }
  if (t.hasAttribute('data-cambiar')) {
    const sem = semanaDe(hoy()), ti = card.dataset.tipo, i = +card.dataset.i, viejo = D.planes[sem][ti][i];
    const s = D.ses[hoy()]; if (s && hechas(s.ej[viejo]).length) return aviso('Ya tienes series hechas en este ejercicio');
    cambiar(sem, ti, i); repintarTarjeta(card); aviso('Ejercicio cambiado para toda la semana'); return;
  }
  if (t.dataset.borrapeso) { const f = t.dataset.borrapeso, kg = D.peso[f]; delete D.peso[f]; guardar(); pintar(); aviso('Pesada borrada', () => { D.peso[f] = kg; guardar(); pintar(); }); return; }
  if (t.id === 'syncYa') { SYNC.sincronizar(); return; }
  if (t.id === 'syncOff') { if (confirm('¿Desconectar la sincronización? Los datos se quedan en este dispositivo y en Drive.')) { SYNC.desconectar(); pintar(); } return; }
  if (t.id === 'renovar') { const sem = semanaDe(hoy()); renovar(sem, JSON.parse(JSON.stringify(plan(sem)))); return; }
  if (t.id === 'exportar') return exportar();
  if (t.id === 'quitarImg') { const antes = IMG; IMG = {}; imgGuardar({}).catch(() => {}); pintar(); aviso('Imágenes quitadas', () => { IMG = antes; imgGuardar(IMG).catch(() => {}); pintar(); }); return; }
  if (t.dataset.restaurar) { const c = copias()[+t.dataset.restaurar]; if (c) { const antes = D; D = Object.assign(vacio(), c.d); guardar(); pintar(); aviso('Copia restaurada', () => { D = antes; guardar(); pintar(); }); } }
});
function renovar(sem, viejo) {
  // Elige ejercicios distintos de los actuales en cada hueco
  const p = {}; for (const t in PLANTILLA) { const elegidos = viejo[t].filter(id => D.ses[hoy()] && hechas(D.ses[hoy()].ej[id]).length); p[t] = PLANTILLA[t].huecos.map((h, i) => {
    if (elegidos.includes(viejo[t][i])) return viejo[t][i];
    const op = h.pool.filter(x => x !== viejo[t][i] && !elegidos.includes(x)); const x = op[Math.floor(Math.random() * op.length)] || viejo[t][i]; elegidos.push(x); return x;
  }); }
  D.planes[sem] = p;
  guardar(); pintar(); aviso('Ejercicios de la semana renovados', () => { D.planes[sem] = viejo; guardar(); pintar(); });
}
function repintarTarjeta() { repintarHoja(); }
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.c) {
    const fila = t.closest('.serie'), id = fila.dataset.id, k = +fila.dataset.k;
    const ses = sesion(hoy(), tipoHoy()); const arr = ses.ej[id] || (ses.ej[id] = []);
    for (let j = 0; j <= k; j++) if (!arr[j]) arr[j] = {};
    arr[k][t.dataset.c] = num(t.value); guardar(); return;
  }
  if (t.id === 'selEj') { progSel = t.value; pintar(); return; }
  if (t.id === 'importarImg' && t.files[0]) {
    t.files[0].text().then(txt => {
      const d = JSON.parse(txt); if (!d || d.tipo !== 'migym-imagenes' || !d.img) throw 0;
      const nuevo = {}; for (const [id, s] of Object.entries(d.img)) if (EJ[id] && imgValida(s)) nuevo[id] = s;
      if (!Object.keys(nuevo).length) throw 0;
      aviso('Importando imágenes…');
      return imgGuardar(nuevo).then(() => { IMG = nuevo; pintar(); aviso(`Imágenes importadas: ${Object.keys(nuevo).length}`); }, () => aviso('No caben las imágenes en este dispositivo'));
    }).catch(() => aviso('El archivo no es un paquete de imágenes de Mi Gym'));
    t.value = ''; return;
  }
  if (t.id === 'importar' && t.files[0]) {
    t.files[0].text().then(txt => {
      const d = JSON.parse(txt); if (!d || d.v !== 1 || !d.ses) throw 0;
      const antes = D; D = Object.assign(vacio(), d); guardar(); pintar(); aviso('Datos importados', () => { D = antes; guardar(); pintar(); });
    }).catch(() => aviso('El archivo no es una copia de Mi Gym'));
  }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'fSync') {
    const b = $('#btnSync'), txt = $('#syncTxt');
    b.disabled = true; b.textContent = 'Conectando…';
    SYNC.conectar($('#inSyncUrl').value, $('#inSyncClave').value)
      .then(() => { pintar(); aviso('Sincronización activada'); })
      .catch(err => { b.disabled = false; b.textContent = 'Conectar'; txt.textContent = err.message; txt.className = 'nota error'; });
    return;
  }
  if (e.target.id === 'fPeso') {
    const v = num($('#inPeso').value); if (v == null || v < 30 || v > 250) return aviso('Escribe un peso entre 30 y 250 kg');
    D.peso[hoy()] = v; guardar(); pintar(); aviso('Peso guardado');
  }
  if (e.target.id === 'fObj') {
    const raw = $('#inObj').value.trim(), v = num(raw);
    if (raw && (v == null || v < 30 || v > 250)) return aviso('Escribe un peso entre 30 y 250 kg');
    D.ajustes.objetivo = raw ? v : null; guardar(); aviso('Objetivo guardado');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && hojaAb) { e.preventDefault(); return cerrarHoja(); }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.c === 'kg') { e.preventDefault(); e.target.closest('.serie').querySelector('[data-c=reps]').focus(); }
  else if (e.key === 'Enter' && e.target.dataset && e.target.dataset.c === 'reps') { e.preventDefault(); e.target.blur(); }
});
function exportar() {
  const b = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `mi-gym-${hoy()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
let tAviso;
function aviso(txt, deshacer) {
  const el = $('#aviso'); clearTimeout(tAviso);
  el.innerHTML = `<span>${esc(txt)}</span>${deshacer ? '<button>Deshacer</button>' : ''}`; el.classList.add('ver');
  if (deshacer) el.querySelector('button').onclick = () => { deshacer(); el.classList.remove('ver'); };
  tAviso = setTimeout(() => el.classList.remove('ver'), deshacer ? 6000 : 2500);
}

// Al volver a la app (p. ej. al día siguiente) se pinta el día correcto
let ultimoDia = hoy();
document.addEventListener('visibilitychange', () => { if (!document.hidden && hoy() !== ultimoDia) { ultimoDia = hoy(); tipoManual = null; pintar(); } });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) r.update(); });
}).catch(() => {});
let recargando = false;
navigator.serviceWorker && navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (recargando || document.activeElement && document.activeElement.tagName === 'INPUT') return; recargando = true; location.reload();
});
pintar();
SYNC.iniciar();
