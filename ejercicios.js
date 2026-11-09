// Catálogo: solo los ejercicios que hago (32). g = grupo · inc = subida de kilos sugerida (0 = sin peso)
window.EJ = {
  // Pecho
  bancaMan:     { n: 'Press plano con mancuernas', g: 'pecho', inc: 2 },
  planoJuntas:  { n: 'Press plano con mancuernas juntas', g: 'pecho', inc: 2 },
  incMan:       { n: 'Press inclinado con mancuernas', g: 'pecho', inc: 2 },
  incSmith:     { n: 'Press inclinado en Smith', g: 'pecho', inc: 2.5 },
  hombroMaq:    { n: 'Press de pecho en máquina de palancas', g: 'pecho', inc: 5 },
  fondos:       { n: 'Fondos en paralelas', g: 'pecho', inc: 2.5 },
  pecDeck:      { n: 'Aperturas en máquina (pec deck)', g: 'pecho', inc: 5 },
  pajarosTumb:  { n: 'Aperturas con mancuernas en banco plano', g: 'pecho', inc: 1 },
  flexAbiertas: { n: 'Flexiones abiertas', g: 'pecho', inc: 0 },
  // Hombro
  hombroPalancas:   { n: 'Press de hombro en máquina de palancas', g: 'hombro', inc: 5 },
  latMaq:           { n: 'Remo al mentón con mancuernas', g: 'hombro', inc: 1 },
  frontMan:         { n: 'Elevación frontal con mancuerna', g: 'hombro', inc: 1 },
  frontAlt:         { n: 'Elevación frontal alterna', g: 'hombro', inc: 1 },
  latPoleaApoyo:    { n: 'Elevación lateral en polea con apoyo', g: 'hombro', inc: 1.25 },
  pajarosSentBanco: { n: 'Pájaros sentado en banco', g: 'hombro', inc: 1 },
  // Tríceps
  sobreCabPolea:   { n: 'Extensión de tríceps sobre la cabeza en polea', g: 'triceps', inc: 2.5 },
  cuerda:          { n: 'Extensión de tríceps en polea con cuerda', g: 'triceps', inc: 2.5 },
  barraV:          { n: 'Extensión de tríceps en polea con barra', g: 'triceps', inc: 2.5 },
  sobreCabUna:     { n: 'Extensión a una mano sobre la cabeza', g: 'triceps', inc: 1 },
  fondosParalelas: { n: 'Fondos de tríceps en paralelas', g: 'triceps', inc: 2.5 },
  // Espalda
  jalonEst:           { n: 'Jalón agarre estrecho neutro', g: 'espalda', inc: 5 },
  jalonEstrechoBanco: { n: 'Jalón agarre estrecho en banco', g: 'espalda', inc: 5 },
  jalonConv:          { n: 'Jalón en máquina convergente', g: 'espalda', inc: 5 },
  dominadas:          { n: 'Dominadas (con lastre si puedes)', g: 'espalda', inc: 2.5 },
  remoEstrecho:       { n: 'Remo en polea baja agarre estrecho', g: 'espalda', inc: 5 },
  frontDiscoSent:     { n: 'Remo alto en máquina de palancas', g: 'espalda', inc: 5 },
  encogMan:           { n: 'Encogimientos con mancuernas', g: 'espalda', inc: 2 },
  // Bíceps
  curlAlt:    { n: 'Curl alterno con mancuernas', g: 'biceps', inc: 1 },
  curlMan:    { n: 'Curl con mancuernas', g: 'biceps', inc: 1 },
  martillo:   { n: 'Curl martillo', g: 'biceps', inc: 1 },
  curlIncAlt: { n: 'Curl inclinado alterno', g: 'biceps', inc: 1 },
  curlZ:      { n: 'Curl con barra Z', g: 'biceps', inc: 2.5 }
};

window.GRUPOS = { pecho: 'Pecho', hombro: 'Hombro', triceps: 'Tríceps', espalda: 'Espalda', biceps: 'Bíceps' };

(() => {
const grupo = g => Object.keys(window.EJ).filter(id => window.EJ[id].g === g);
const hueco = pool => ({ pool, s: 3, r: [8, 8] });
const PRESS = ['bancaMan', 'planoJuntas', 'incMan', 'incSmith', 'hombroMaq', 'fondos'];
const JALON = ['jalonEst', 'jalonEstrechoBanco', 'jalonConv', 'dominadas'];

// 3 ejercicios por grupo; el domingo se elige al azar sin repetir en el mismo día
window.PLANTILLA = {
  empuje: {
    titulo: 'Empuje', sub: 'Pecho, hombro y tríceps',
    huecos: [hueco(PRESS), hueco(PRESS), hueco(['pecDeck', 'pajarosTumb', 'flexAbiertas']),
      hueco(grupo('hombro')), hueco(grupo('hombro')), hueco(grupo('hombro')),
      hueco(grupo('triceps')), hueco(grupo('triceps')), hueco(grupo('triceps'))]
  },
  tiron: {
    titulo: 'Tirón', sub: 'Espalda y bíceps',
    huecos: [hueco(JALON), hueco(['remoEstrecho', 'frontDiscoSent']), hueco(grupo('espalda')),
      hueco(grupo('biceps')), hueco(grupo('biceps')), hueco(grupo('biceps'))]
  }
};

// Los ejercicios sin peso no entran en la rotación; quedan como alternativa con el botón de cambiar.
for (const t in window.PLANTILLA) for (const h of window.PLANTILLA[t].huecos) {
  h.extra = h.pool.filter(id => !window.EJ[id].inc);
  h.pool = h.pool.filter(id => window.EJ[id].inc);
}

})();

// 0 = domingo … 6 = sábado
window.DIAS = { 1: 'empuje', 4: 'empuje', 2: 'tiron', 5: 'tiron' };
