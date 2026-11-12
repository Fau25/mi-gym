// Servidor local que hace de «script de Google» (Code.gs real + Drive simulado) para las pruebas.
const http = require('http');
const { cargarScript } = require('./google-falso');
const google = cargarScript(__dirname + '/Code.gs');
http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
    const out = req.method === 'POST' ? google.doPost({ postData: { contents: b } }) : google.doGet();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(out.t);
  });
}).listen(Number(process.argv[2] || 8790));
