// Catálogo de ejercicios y plantilla de cada día.
// g = grupo · inc = subida de kilos sugerida
window.EJ = {
  // Pecho
  banca:      { n: 'Press banca con barra', g: 'pecho', inc: 2.5 },
  incMan:     { n: 'Press inclinado con mancuernas', g: 'pecho', inc: 2 },
  incBarra:   { n: 'Press inclinado con barra', g: 'pecho', inc: 2.5 },
  pressMaq:   { n: 'Press de pecho en máquina', g: 'pecho', inc: 5 },
  pecDeck:    { n: 'Aperturas en máquina (pec deck)', g: 'pecho', inc: 5 },
  cruces:     { n: 'Cruces en polea', g: 'pecho', inc: 2.5 },
  apertMan:   { n: 'Aperturas con mancuernas', g: 'pecho', inc: 2 },
  fondos:     { n: 'Fondos en paralelas', g: 'pecho', inc: 2.5 },
  bancaMan:   { n: 'Press plano con mancuernas', g: 'pecho', inc: 2 },
  // Hombro
  militar:    { n: 'Press militar con mancuernas', g: 'hombro', inc: 2 },
  latMan:     { n: 'Elevaciones laterales con mancuernas', g: 'hombro', inc: 1 },
  latPolea:   { n: 'Elevaciones laterales en polea', g: 'hombro', inc: 1.25 },
  latMaq:     { n: 'Elevaciones laterales en máquina', g: 'hombro', inc: 2.5 },
  arnold:     { n: 'Press Arnold', g: 'hombro', inc: 2 },
  pajaros:    { n: 'Pájaros (deltoides posterior)', g: 'hombro', inc: 1 },
  facePull:   { n: 'Face pull en polea', g: 'hombro', inc: 2.5 },
  // Tríceps
  cuerda:     { n: 'Extensión de tríceps en polea con cuerda', g: 'triceps', inc: 2.5 },
  barraV:     { n: 'Extensión de tríceps en polea con barra', g: 'triceps', inc: 2.5 },
  frances:    { n: 'Press francés con barra Z', g: 'triceps', inc: 2.5 },
  sobreCab:   { n: 'Extensión sobre la cabeza con mancuerna', g: 'triceps', inc: 2 },
  sobreCabP:  { n: 'Extensión sobre la cabeza en polea', g: 'triceps', inc: 2.5 },
  patada:     { n: 'Patada de tríceps', g: 'triceps', inc: 1 },
  cerrado:    { n: 'Press de banca agarre cerrado', g: 'triceps', inc: 2.5 },
  // Espalda
  jalon:      { n: 'Jalón al pecho', g: 'espalda', inc: 5 },
  remoBarra:  { n: 'Remo con barra', g: 'espalda', inc: 2.5 },
  remoMan:    { n: 'Remo con mancuerna a una mano', g: 'espalda', inc: 2 },
  remoPolea:  { n: 'Remo en polea baja', g: 'espalda', inc: 5 },
  jalonEst:   { n: 'Jalón agarre estrecho neutro', g: 'espalda', inc: 5 },
  pullover:   { n: 'Pullover en polea alta', g: 'espalda', inc: 2.5 },
  remoMaq:    { n: 'Remo en máquina', g: 'espalda', inc: 5 },
  remoT:      { n: 'Remo en T', g: 'espalda', inc: 2.5 },
  dominadas:  { n: 'Dominadas (con lastre si puedes)', g: 'espalda', inc: 2.5 },
  // Bíceps
  curlBarra:  { n: 'Curl con barra', g: 'biceps', inc: 2.5 },
  curlAlt:    { n: 'Curl alterno con mancuernas', g: 'biceps', inc: 1 },
  martillo:   { n: 'Curl martillo', g: 'biceps', inc: 1 },
  predicador: { n: 'Curl en banco predicador', g: 'biceps', inc: 2.5 },
  curlPolea:  { n: 'Curl en polea', g: 'biceps', inc: 2.5 },
  curlInc:    { n: 'Curl inclinado con mancuernas', g: 'biceps', inc: 1 },
  concentr:   { n: 'Curl concentrado', g: 'biceps', inc: 1 },
  curlZ:      { n: 'Curl con barra Z', g: 'biceps', inc: 2.5 }
};

window.GRUPOS = { pecho: 'Pecho', hombro: 'Hombro', triceps: 'Tríceps', espalda: 'Espalda', biceps: 'Bíceps' };

// Huecos de cada día. fijo = siempre el mismo (para medir la fuerza);
// pool = se cambia cada domingo por otro distinto al de la semana anterior.
window.PLANTILLA = {
  empuje: {
    titulo: 'Empuje', sub: 'Pecho, hombro y tríceps',
    huecos: [
      { fijo: 'banca', s: 4, r: [6, 10] },
      { fijo: 'militar', s: 3, r: [8, 12] },
      { pool: ['incMan', 'incBarra', 'bancaMan', 'pressMaq', 'fondos'], s: 3, r: [8, 12] },
      { pool: ['pecDeck', 'cruces', 'apertMan'], s: 3, r: [12, 15] },
      { pool: ['latMan', 'latPolea', 'latMaq'], s: 4, r: [12, 20] },
      { pool: ['cuerda', 'barraV', 'frances', 'cerrado'], s: 3, r: [10, 12] },
      { pool: ['sobreCab', 'sobreCabP', 'patada'], s: 3, r: [12, 15] }
    ]
  },
  tiron: {
    titulo: 'Tirón', sub: 'Espalda y bíceps',
    huecos: [
      { fijo: 'jalon', s: 4, r: [6, 10] },
      { fijo: 'remoBarra', s: 4, r: [6, 10] },
      { pool: ['remoMan', 'remoPolea', 'remoMaq', 'remoT'], s: 3, r: [8, 12] },
      { pool: ['jalonEst', 'pullover', 'dominadas'], s: 3, r: [10, 12] },
      { pool: ['pajaros', 'facePull'], s: 3, r: [12, 20] },
      { pool: ['curlBarra', 'curlZ', 'predicador', 'curlPolea'], s: 3, r: [8, 12] },
      { pool: ['curlAlt', 'martillo', 'curlInc', 'concentr'], s: 3, r: [10, 15] }
    ]
  }
};

// 0 = domingo … 6 = sábado
window.DIAS = { 1: 'empuje', 4: 'empuje', 2: 'tiron', 5: 'tiron' };
