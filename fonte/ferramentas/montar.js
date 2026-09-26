// Gera ../../index.html: a página inteira em UM arquivo (imagens e passeio 3D embutidos).
// Uso: node montar.js
const fs = require('fs');
const path = require('path');

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

let html = fs.readFileSync(path.join(FONTE, 'index.html'), 'utf8');
html = html.replace(/(["'(])img\/([A-Za-z0-9_.-]+)/g, (_, aspas, nome) => aspas + dataUri(nome));

// o tour3d.js importa ./esculturas.js; no arquivo único o código das esculturas vai junto
const esculturas = fs.readFileSync(path.join(FONTE, 'esculturas.js'), 'utf8').replace(/^export /gm, '');
let tour = fs.readFileSync(path.join(FONTE, 'tour3d.js'), 'utf8');
const linhaImport = /^import \{[^}]*\} from '\.\/esculturas\.js';$/m;
if (!linhaImport.test(tour)) throw new Error('import de esculturas.js não encontrado');
tour = tour.replace(linhaImport, () => esculturas);
if (tour.includes('</script')) throw new Error('tour3d.js não pode conter </script');
html = html.replace('</body>', `<script type="text/plain" id="tour3d-fonte">\n${tour}</script>\n</body>`);

fs.writeFileSync(SAIDA, html);
console.log(`${SAIDA} — ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`);
