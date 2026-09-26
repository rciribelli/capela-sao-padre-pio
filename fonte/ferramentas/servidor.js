// Servidor local para visualizar a página e gravar os quadros do vídeo 3D.
// Uso: node servidor.js  →  http://localhost:5178/
//      http://localhost:5178/ferramentas/gravar.html  (gera os quadros em ../../render/quadros)
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const QUADROS = path.resolve(__dirname, '..', '..', 'render', 'quadros');
const PORTA = Number(process.env.PORT) || 5178;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.mp4': 'video/mp4',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/quadro') {
    const pasta = path.join(QUADROS, (url.searchParams.get('pasta') || 'padrao').replace(/[^a-z0-9_-]/gi, ''));
    const n = String(Number(url.searchParams.get('n')) || 0).padStart(5, '0');
    fs.mkdirSync(pasta, { recursive: true });
    const partes = [];
    req.on('data', (c) => partes.push(c));
    req.on('end', () => {
      fs.writeFileSync(path.join(pasta, n + '.jpg'), Buffer.concat(partes));
      res.end('ok');
    });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/log') {
    let t = '';
    req.on('data', (c) => (t += c));
    req.on('end', () => { console.log('[pagina]', t); res.end('ok'); });
    return;
  }
  let arq = path.join(RAIZ, decodeURIComponent(url.pathname));
  if (!arq.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(arq) && fs.statSync(arq).isDirectory()) arq = path.join(arq, 'index.html');
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); return res.end('não encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log('Servidor em http://localhost:' + PORTA));
