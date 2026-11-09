# Mi Gym

App personal (PWA) para apuntar los entrenos y el peso corporal, y seguir el progreso para ganar masa muscular.

- Lunes y jueves: empuje (pecho, hombro y tríceps). Martes y viernes: tirón (espalda y bíceps).
- Catálogo reducido a los 32 ejercicios que hago (ejercicios.js). Cada domingo se eligen 3 por grupo, sin repetir en el día ni respecto a la semana anterior. Todo a 3 × 8.
- Doble progresión: con todas las series en lo alto del rango, propone subir kilos; dos sesiones sin llegar al mínimo, bajar un 10 %.
- Peso: media de 7 días y ritmo semanal (objetivo +0,25 % a +0,5 % a la semana).
- Datos solo en el dispositivo (localStorage), 3 copias automáticas diarias, exportar e importar.
- Imágenes: paquete privado que se importa en Ajustes y se guarda en IndexedDB. No está en el repositorio; sin paquete se muestra un icono del grupo.

Publicar: subir `VERSION` en app.js y `CACHE` en sw.js, push a main (Pages desde main / raíz).
