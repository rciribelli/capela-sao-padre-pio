// Gera ../../index.html: a página publicada (imagens embutidas + passeio 3D carregado de fonte/).
// Uso: node montar.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FONTE = path.resolve(__dirname, '..');
const SAIDA = path.resolve(FONTE, '..', 'index.html');
const TIPOS = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const cache = {};
function dataUri(nome) {
  if (!cache[nome]) {
    const arq = path.join(FONTE, 'img', nome);
    cache[nome] = `data:${TIPOS[path.extname(nome)]};base64,${fs.readFileSync(arq).toString('base64')}`;
  }
  return cache[nome];
}
function trocar(html, de, para) {
  if (!html.includes(de)) throw new Error('não encontrado em fonte/index.html: ' + de);
  return html.split(de).join(para);
}

let html = fs.readFileSync(path.join(FONTE, 'index.html'), 'utf8').replace(/\r\n/g, '\n'); // sempre LF (os hashes da CSP dependem disso)
html = html.replace(/(["'(])img\/([A-Za-z0-9_.-]+)/g, (_, aspas, nome) => aspas + dataUri(nome));

// o passeio 3D e o three.js (cópia local em fonte/vendor/three) são servidos do próprio site
html = trocar(html, '"./vendor/three/', '"./fonte/vendor/three/');
html = trocar(html, "import('./tour3d.js')", "import('./fonte/tour3d.js')");

// Política de segurança (CSP): só roda script do próprio site ou os scripts embutidos desta página,
// identificados pelo hash. Qualquer script injetado ou alterado é bloqueado pelo navegador.
const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => `'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
const csp = [
  "default-src 'none'",
  `script-src 'self' ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');
html = trocar(html, '<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);

fs.writeFileSync(SAIDA, html);
console.log(`${SAIDA} — ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB · ${hashes.length} scripts embutidos autorizados na CSP`);
