// Passeio 3D da Capela votiva a São Padre Pio (Obra Refúgio de Maria).
// Medidas do projeto: nave de 8,00 m de frente × 15,00 m de profundidade,
// corredor lateral externo de 1,00 m à ESQUERDA (olhando da rua), que segue ao lado da sede até o fundo.
// No meio do caminho do corredor fica a lojinha (livros e Bíblias), com porta de vidro de correr.
// Eixos: x = esquerda/direita de quem olha da rua, y = altura, z = profundidade (rua em z > 0).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { criarCrucificado } from './esculturas.js';

export const DURACAO = 50;

export const LEGENDAS = [
  { ini: 0.8, fim: 6.2, abertura: true, titulo: 'Capela votiva a São Padre Pio', texto: 'Obra Refúgio de Maria · Av. José Leon, 2038 · Fortaleza–CE' },
  { ini: 4.6, fim: 9.0, texto: 'Fachadas em madeira e iluminação em LED' },
  { ini: 12.4, fim: 17.2, texto: 'Bancos em madeira com corredores central e lateral livres' },
  { ini: 18.0, fim: 23.8, texto: 'Presbitério: altar, crucifixo, Nossa Senhora de Fátima e São Padre Pio' },
  { ini: 26.0, fim: 33.6, texto: 'Corredor lateral externo de 1 m, à esquerda, até o fundo' },
  { ini: 35.4, fim: 39.8, texto: 'No caminho, a lojinha com diversos itens católicos' },
  { ini: 42.6, fim: DURACAO, final: true, titulo: 'Ajude a construir esta casa de oração', texto: 'Doe via Pix · obrarefugiodemaria.com.br' },
];

// Tomadas de câmera: [tempo, posição, alvo]
const TOMADAS = [
  { ini: 0, fim: 25, chaves: [
    [-4, [5.6, 1.7, 21], [0.4, 3.2, 0]],
    [0, [4.2, 1.7, 17], [0.2, 3.0, 0]],
    [5, [2.0, 1.65, 10], [0, 2.7, 0]],
    [9.5, [0.35, 1.65, 3.4], [0, 1.9, -10]],
    [12.5, [0, 1.65, -1.2], [0, 1.7, -14]],
    [16.5, [0, 1.65, -6.8], [0, 1.9, -15]],
    [19.5, [-0.65, 1.6, -11.85], [-2.75, 1.85, -14.4]],
    [22.5, [0.65, 1.6, -11.95], [2.75, 2.15, -14.8]],
    [25.5, [0.15, 1.75, -12.05], [0, 1.3, 0]],
    [29, [0, 1.75, -9], [0, 1.5, 4]],
  ] },
  { ini: 25, fim: 40.2, chaves: [
    [21, [-1.2, 1.7, 12], [-4.5, 1.7, 0]],
    [25, [-2.6, 1.65, 7.5], [-4.5, 1.7, -3]],
    [28.5, [-4.5, 1.62, 1.8], [-4.5, 1.6, -10]],
    [33.2, [-4.5, 1.62, -13.6], [-4.45, 1.55, -24]],
    [35.0, [-4.45, 1.62, -15.95], [-1.2, 1.45, -16.9]],
    [36.3, [-3.35, 1.6, -16.45], [-0.8, 1.4, -16.8]],
    [37.8, [-2.95, 1.6, -16.35], [-1.3, 1.25, -18.2]],
    [39.4, [-2.95, 1.6, -17.15], [-1.4, 1.25, -15.2]],
    [41.5, [-3.05, 1.6, -17.3], [-2.0, 1.3, -15.1]],
  ] },
  { ini: 40.2, fim: DURACAO + 1, chaves: [
    [34, [7.0, 1.4, 11], [0.6, 3.0, 0]],
    [40.2, [4.6, 1.5, 9.5], [0.4, 3.0, 0]],
    [DURACAO, [0.9, 3.0, 12.5], [0, 3.1, -1]],
    [DURACAO + 6, [0.2, 3.8, 15], [0, 3.1, -2]],
  ] },
];

// Escurecimento (0 = imagem, 1 = preto) para transições entre tomadas
export function escuroEm(t) {
  const tri = (c, r) => Math.max(0, 1 - Math.abs(t - c) / r);
  let e = Math.max(0, 1 - t / 0.9);
  e = Math.max(e, tri(25, 0.7), tri(40.2, 0.7));
  return Math.min(1, e);
}

export function legendasEm(t) {
  return LEGENDAS.filter((l) => t >= l.ini && t <= l.fim).map((l) => {
    const a = Math.min(1, (t - l.ini) / 0.6, l.fim >= DURACAO ? 1 : (l.fim - t) / 0.6);
    return { ...l, opacidade: Math.max(0, a) };
  });
}

// ---------- utilidades ----------
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function tela(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function texturaDe(canvas, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function repetir(tex, rx, ry) {
  const t = tex.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

function canvasMadeira({ h = 24, s = 55, l = 30, v = 9, tabuas = 8, seed = 3, veios = 70, junta = 0.85 }) {
  const [c, g] = tela(1024, 1024);
  const r = rng(seed);
  const lw = c.width / tabuas;
  for (let i = 0; i < tabuas; i++) {
    const x0 = i * lw;
    g.fillStyle = `hsl(${h + (r() - 0.5) * 5}, ${s + (r() - 0.5) * 8}%, ${l + (r() - 0.5) * v}%)`;
    g.fillRect(x0, 0, lw, c.height);
    for (let k = 0; k < veios; k++) {
      const x = x0 + r() * lw;
      const a = 0.03 + r() * 0.11;
      g.strokeStyle = r() < 0.65 ? `rgba(35,14,4,${a})` : `rgba(255,214,160,${a * 0.55})`;
      g.lineWidth = 0.6 + r() * 2.4;
      const amp = 0.6 + r() * 3.5, fr = (Math.PI * 2 * (1 + Math.floor(r() * 3))) / c.height, ph = r() * 6.28;
      g.beginPath();
      for (let y = 0; y <= c.height; y += 16) {
        const xx = Math.min(x0 + lw - 2, Math.max(x0 + 2, x + Math.sin(y * fr + ph) * amp));
        y ? g.lineTo(xx, y) : g.moveTo(xx, y);
      }
      g.stroke();
    }
    const gr = g.createLinearGradient(x0, 0, x0 + lw, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.28)');
    gr.addColorStop(0.1, 'rgba(0,0,0,0)');
    gr.addColorStop(0.9, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.32)');
    g.fillStyle = gr;
    g.fillRect(x0, 0, lw, c.height);
    g.fillStyle = `rgba(18,7,2,${junta})`;
    g.fillRect(x0, 0, 3, c.height);
  }
  return c;
}

function canvasPiso() {
  const [c, g] = tela(1024, 1024);
  const r = rng(11);
  const n = 4, tw = c.width / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const l = 70 + (r() - 0.5) * 4;
    g.fillStyle = `hsl(34, 22%, ${l}%)`;
    g.fillRect(i * tw, j * tw, tw, tw);
    for (let k = 0; k < 0; k++) {
      const x = i * tw + r() * tw, y = j * tw + r() * tw, rad = 10 + r() * 50;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const d = r() < 0.5;
      gr.addColorStop(0, d ? 'rgba(150,130,105,0.10)' : 'rgba(255,250,240,0.12)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(i * tw, j * tw, tw, tw);
    }
  }
  g.fillStyle = '#a89a86';
  for (let i = 0; i <= n; i++) { g.fillRect(i * tw - 2, 0, 4, c.height); g.fillRect(0, i * tw - 2, c.width, 4); }
  return c;
}

function canvasPaver() {
  const [c, g] = tela(1024, 1024);
  const r = rng(5);
  g.fillStyle = '#6d6760';
  g.fillRect(0, 0, 1024, 1024);
  const bw = 128, bh = 64;
  for (let j = 0; j < 1024 / bh; j++) for (let i = -1; i < 1024 / bw + 1; i++) {
    const x = i * bw + (j % 2) * bw / 2, y = j * bh;
    const l = 66 + (r() - 0.5) * 16;
    g.fillStyle = `hsl(${30 + r() * 12}, ${8 + r() * 8}%, ${l}%)`;
    g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
  }
  return c;
}

function canvasReboco(cor = '#e6d4b4') {
  const [c, g] = tela(512, 512);
  const r = rng(9);
  g.fillStyle = cor;
  g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 9000; k++) {
    g.fillStyle = r() < 0.5 ? 'rgba(90,70,40,0.05)' : 'rgba(255,255,255,0.06)';
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  return c;
}

function canvasGranito() {
  const [c, g] = tela(512, 512);
  const r = rng(21);
  g.fillStyle = '#2a2a2c';
  g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 14000; k++) {
    const v = Math.floor(r() * 90);
    g.fillStyle = `rgba(${v + 40},${v + 40},${v + 42},${0.25 + r() * 0.4})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5);
  }
  return c;
}

function canvasTelha() {
  const [c, g] = tela(256, 256);
  for (let x = 0; x < 256; x++) {
    const v = 58 + Math.sin((x / 256) * Math.PI * 2 * 8) * 14;
    g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    g.fillRect(x, 0, 1, 256);
  }
  return c;
}

function canvasBrilho(alongado = false) {
  const [c, g] = tela(256, alongado ? 512 : 256);
  const cx = 128, cy = c.height / 2;
  g.save();
  g.translate(cx, cy);
  if (alongado) g.scale(1, 2.2);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 115);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(-128, -128, 256, 256);
  g.restore();
  return c;
}

function canvasTexto(linhas, w, h) {
  const [c, g] = tela(w, h);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  for (const l of linhas) {
    g.font = l.fonte;
    if (l.espaco) g.letterSpacing = l.espaco;
    g.fillStyle = 'rgba(40,18,6,0.55)';
    g.fillText(l.texto, l.x + 4, l.y + 6);
    g.fillStyle = l.cor || '#f3e4c6';
    g.fillText(l.texto, l.x, l.y);
    g.letterSpacing = '0px';
  }
  return c;
}

function canvasAzulejo(base, rejunte, n, seed) {
  const [c, g] = tela(512, 512);
  const r = rng(seed);
  const tw = 512 / n;
  g.fillStyle = rejunte;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const col = new THREE.Color(base).offsetHSL(0, 0, (r() - 0.5) * 0.03);
    g.fillStyle = '#' + col.getHexString();
    g.fillRect(i * tw + 2, j * tw + 2, tw - 4, tw - 4);
    const gr = g.createLinearGradient(i * tw, j * tw, (i + 1) * tw, (j + 1) * tw);
    gr.addColorStop(0, 'rgba(255,255,255,0.10)');
    gr.addColorStop(1, 'rgba(0,0,0,0.05)');
    g.fillStyle = gr;
    g.fillRect(i * tw + 2, j * tw + 2, tw - 4, tw - 4);
  }
  return c;
}

function canvasTelhaColonial() {
  const [c, g] = tela(256, 512);
  const r = rng(41);
  g.fillStyle = '#6b2f1c';
  g.fillRect(0, 0, 256, 512);
  const tw = 64, th = 96;
  for (let j = 0; j < 512 / th + 1; j++) for (let i = 0; i < 256 / tw; i++) {
    const x = i * tw, y = j * th - (i % 2) * 20;
    const gr = g.createLinearGradient(x, 0, x + tw, 0);
    const l = 38 + r() * 10;
    gr.addColorStop(0, `hsl(14, 55%, ${l - 14}%)`);
    gr.addColorStop(0.5, `hsl(16, 60%, ${l + 6}%)`);
    gr.addColorStop(1, `hsl(14, 55%, ${l - 16}%)`);
    g.fillStyle = gr;
    g.fillRect(x + 2, y, tw - 4, th - 6);
  }
  return c;
}

function canvasTapete() {
  const [c, g] = tela(512, 384);
  g.fillStyle = '#7a1f24';
  g.fillRect(0, 0, 512, 384);
  g.strokeStyle = '#c9a24a';
  g.lineWidth = 10;
  g.strokeRect(22, 22, 468, 340);
  g.lineWidth = 3;
  g.strokeRect(44, 44, 424, 296);
  g.fillStyle = 'rgba(232,207,142,0.35)';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const x = 100 + i * 78, y = 110 + j * 82;
    g.beginPath();
    g.moveTo(x, y - 22); g.lineTo(x + 18, y); g.lineTo(x, y + 22); g.lineTo(x - 18, y);
    g.fill();
  }
  return c;
}

function canvasCapaBiblia() {
  const [c, g] = tela(256, 360);
  g.fillStyle = '#2a1712';
  g.fillRect(0, 0, 256, 360);
  g.strokeStyle = '#c9a24a';
  g.lineWidth = 4;
  g.strokeRect(14, 14, 228, 332);
  g.fillStyle = '#d6b25a';
  g.fillRect(122, 70, 12, 110);
  g.fillRect(92, 100, 72, 12);
  g.textAlign = 'center';
  g.font = "700 30px 'Cormorant Garamond', Georgia, serif";
  g.fillText('BÍBLIA', 128, 236);
  g.fillText('SAGRADA', 128, 272);
  return c;
}

// superfície curva (meia elipse) para fotos recortadas: de frente fica igual à foto, de lado ganha volume
function superficieCurva(larg, alt, prof, segX = 24, segY = 8) {
  const g = new THREE.PlaneGeometry(larg, alt, segX, segY);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (larg / 2);
    p.setZ(i, prof * Math.sqrt(Math.max(0, 1 - u * u)));
  }
  g.computeVertexNormals();
  return g;
}

// ---------- cena ----------
export async function criarPasseio(canvas, opcoes = {}) {
  const { texturas = {}, qualidade = 'alta', gravacao = false } = opcoes;
  const alta = qualidade === 'alta';

  try { await document.fonts.load("700 100px 'Cormorant Garamond'"); } catch (e) { /* segue com fonte padrão */ }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: gravacao, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = alta;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.22;
  cena.fog = new THREE.Fog(0x2a3350, 35, 140);

  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.05, 600);

  // céu de fim de tarde
  cena.add(new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vP;
        vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
        void main(){
          float h = vP.y;
          vec3 topo = lin(vec3(0.10,0.17,0.36)), meio = lin(vec3(0.33,0.50,0.78)), hor = lin(vec3(0.98,0.74,0.55));
          vec3 c = mix(mix(hor, meio, smoothstep(0.0, 0.16, h)), topo, smoothstep(0.16, 0.75, h));
          if (h < 0.0) c = lin(vec3(0.16,0.14,0.14));
          gl_FragColor = vec4(c * 1.15, 1.0);
        }`,
    }),
  ));

  // ---------- texturas ----------
  const madeiraFachada = texturaDe(canvasMadeira({ h: 22, s: 58, l: 29, tabuas: 8, seed: 3 }));
  const madeiraClara = texturaDe(canvasMadeira({ h: 26, s: 52, l: 36, tabuas: 6, seed: 8 }));
  const madeiraEscura = texturaDe(canvasMadeira({ h: 20, s: 45, l: 20, tabuas: 5, seed: 13, junta: 0.5 }));
  const piso = texturaDe(canvasPiso());
  const paver = texturaDe(canvasPaver());
  const reboco = texturaDe(canvasReboco());
  const granito = texturaDe(canvasGranito());
  const telha = texturaDe(canvasTelha());
  const brilho = texturaDe(canvasBrilho(), 1, 1);
  const brilhoLongo = texturaDe(canvasBrilho(true), 1, 1);
  const azulejo = texturaDe(canvasAzulejo('#f4f4f1', '#c9c9c4', 4, 5));
  const porcelanato = texturaDe(canvasAzulejo('#d9cdb8', '#b9ab94', 2, 12));
  const telhaColonial = texturaDe(canvasTelhaColonial());
  const assoalho = texturaDe(canvasMadeira({ h: 28, s: 42, l: 40, tabuas: 7, seed: 31, junta: 0.6 }));

  // ---------- materiais ----------
  const M = {
    fachada: (rx, ry) => new THREE.MeshStandardMaterial({ map: repetir(madeiraFachada, rx, ry), roughness: 0.55 }),
    madeira: (rx, ry) => new THREE.MeshStandardMaterial({ map: repetir(madeiraClara, rx, ry), roughness: 0.5 }),
    escura: (rx = 1, ry = 1) => new THREE.MeshStandardMaterial({ map: repetir(madeiraEscura, rx, ry), roughness: 0.45 }),
    piso: (rx, ry) => new THREE.MeshStandardMaterial({ map: repetir(piso, rx, ry), roughness: 0.24, metalness: 0.0 }),
    paver: (rx, ry) => new THREE.MeshStandardMaterial({ map: repetir(paver, rx, ry), roughness: 0.85 }),
    reboco: (rx, ry) => new THREE.MeshStandardMaterial({ map: repetir(reboco, rx, ry), roughness: 0.92 }),
    granito: (rx, ry) => new THREE.MeshStandardMaterial({ map: repetir(granito, rx, ry), roughness: 0.4 }),
    aco: new THREE.MeshStandardMaterial({ color: 0x232427, metalness: 0.55, roughness: 0.45 }),
    telhaInt: new THREE.MeshStandardMaterial({ map: repetir(telha, 30, 1), color: 0x9a9ca3, metalness: 0.35, roughness: 0.6, side: THREE.DoubleSide }),
    pano: new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 0.95 }),
    pedra: new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 0.7 }),
    tunica: new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.45 }),
    ouro: new THREE.MeshStandardMaterial({ color: 0xd4a93c, metalness: 0.9, roughness: 0.3 }),
    vaso: new THREE.MeshStandardMaterial({ color: 0x8a4b2a, roughness: 0.8 }),
    folha: new THREE.MeshStandardMaterial({ color: 0x3f7a35, roughness: 0.6, side: THREE.DoubleSide }),
    parede: new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.9 }),
    asfalto: new THREE.MeshStandardMaterial({ color: 0x2e2e33, roughness: 0.92 }),
    policarbonato: new THREE.MeshStandardMaterial({ color: 0xcfd6dc, transparent: true, opacity: 0.35, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }),
    luz: (cor = 0xffd6a0, int = 3) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: cor, emissiveIntensity: int }),
    brilho: (cor, op = 0.8, longo = false) => new THREE.MeshBasicMaterial({ map: longo ? brilhoLongo : brilho, color: cor, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
  };

  const sombra = (m, projeta = true, recebe = true) => { m.castShadow = projeta && alta; m.receiveShadow = recebe && alta; return m; };
  function caixa(w, h, d, mat, x, y, z, pai = cena) {
    const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    m.position.set(x, y, z);
    pai.add(m);
    return m;
  }
  function barra(a, b, esp, mat, pai = cena) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(esp, esp, va.distanceTo(vb)), mat), true, false);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.lookAt(vb);
    pai.add(m);
    return m;
  }
  function brilhoPlano(w, h, cor, op, pos, rotY = 0, longo = false) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.brilho(cor, op, longo));
    m.position.set(...pos);
    m.rotation.y = rotY;
    m.renderOrder = 2;
    cena.add(m);
    return m;
  }

  const PISO = 0.12; // piso interno (um degrau acima da calçada)
  const X0 = -4, X1 = 4, Z0 = 0, Z1 = -15, HP = 4.2, CUME = 6.0;
  const CX0 = -5, CX1 = -4; // corredor à esquerda

  // ---------- rua, calçada e vizinhos ----------
  const calcada = sombra(new THREE.Mesh(new THREE.PlaneGeometry(40, 5.2), M.paver(40 / 2.4, 5.2 / 2.4)), false, true);
  calcada.rotation.x = -Math.PI / 2;
  calcada.position.set(0, 0, 2.6);
  cena.add(calcada);
  caixa(40, 0.15, 0.2, M.pedra, 0, 0.0, 5.25);
  const rua = sombra(new THREE.Mesh(new THREE.PlaneGeometry(200, 60), M.asfalto), false, true);
  rua.rotation.x = -Math.PI / 2;
  rua.position.set(0, -0.08, 35.3);
  cena.add(rua);
  // faixa central
  for (let x = -60; x < 60; x += 4) caixa(2, 0.01, 0.12, M.pedra, x, -0.07, 12.5);
  // vizinho à esquerda (muro de granito) e à direita (muro branco)
  caixa(7, 3.3, 0.35, M.granito(3.5, 1.6), -8.6, 1.65, 0.05);
  caixa(7, 3.2, 15, M.parede, -8.6, 1.6, -7.5);
  caixa(0.5, 3.6, 0.5, M.parede, 4.4, 1.8, 0.1);
  caixa(0.28, 0.5, 0.14, M.aco, 4.4, 1.9, 0.4);
  caixa(7, 2.6, 15, new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.95 }), 8.2, 1.3, -7.5);
  caixa(7, 0.2, 0.3, M.pedra, 8.2, 2.7, 0.05);
  // primavera (buganvília) do vizinho
  const flor = new THREE.MeshStandardMaterial({ color: 0xc02a78, roughness: 0.8 });
  const r = rng(77);
  for (let k = 0; k < 0; k++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + r() * 0.45, 1), r() < 0.55 ? flor : M.folha);
    b.position.set(5.4 + r() * 3.5, 3.0 + r() * 1.6, -0.6 - r() * 1.6);
    cena.add(b);
  }
  // casas do outro lado da rua (silhuetas)
  for (let i = -5; i <= 5; i++) {
    const h = 3 + r() * 3;
    caixa(7.6, h, 8, new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.08, 0.1, 0.35 + r() * 0.2), roughness: 0.9 }), i * 8, h / 2, 26);
  }
  // postes de rua
  for (const [px, pz] of [[7.5, 4.6], [-11, 4.6]]) {
    caixa(0.14, 6.5, 0.14, M.aco, px, 3.25, pz);
    caixa(0.1, 0.1, 1.6, M.aco, px, 6.45, pz - 0.8);
    caixa(0.45, 0.12, 0.3, M.luz(0xffcf95, 6), px, 6.35, pz - 1.55);
    const pl = new THREE.SpotLight(0xffc98a, 180, 22, 1.0, 0.7, 2);
    pl.position.set(px, 6.3, pz - 1.55);
    pl.target.position.set(px, 0, pz - 2.5);
    cena.add(pl, pl.target);
  }

  // ---------- nave ----------
  const pisoInt = sombra(new THREE.Mesh(new THREE.PlaneGeometry(7.7, 14.85), M.piso(7.7 / 2.4, 14.85 / 2.4)), false, true);
  pisoInt.rotation.x = -Math.PI / 2;
  pisoInt.position.set(0, PISO, -7.425);
  cena.add(pisoInt);
  caixa(8.2, PISO, 0.6, M.piso(8.2 / 2.4, 0.25), 0, PISO / 2, 0.3); // degrau/soleira
  // paredes
  const paredeLat = () => M.reboco(15 / 3, HP / 3);
  caixa(0.15, HP, 15, paredeLat(), X0 + 0.075, HP / 2, -7.5);
  caixa(0.15, HP, 15, paredeLat(), X1 - 0.075, HP / 2, -7.5);
  caixa(8, HP, 0.15, M.reboco(8 / 3, HP / 3), 0, HP / 2, Z1 + 0.075);
  const oitao = new THREE.Shape([new THREE.Vector2(-4, HP), new THREE.Vector2(4, HP), new THREE.Vector2(0, CUME)]);
  const oitaoFundo = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(oitao, { depth: 0.15, bevelEnabled: false }), M.reboco(1 / 3, 1 / 3)));
  oitaoFundo.position.set(0, 0, Z1);
  cena.add(oitaoFundo);
  // cobertura (telha metálica) e tesouras de aço
  const ang = Math.atan2(CUME - HP, 4);
  const lad = Math.hypot(4.4, (CUME - HP) * 1.1);
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(lad, 0.04, 15.1), M.telhaInt);
    t.position.set(s * 2.0, (HP + CUME) / 2 + 0.03, -7.55);
    t.rotation.z = -s * ang;
    sombra(t, true, true);
    cena.add(t);
  }
  const yTopo = (x) => HP + (CUME - HP) * (1 - Math.abs(x) / 4);
  for (let z = -1.5; z > Z1; z -= 3) {
    barra([-3.9, HP, z], [3.9, HP, z], 0.08, M.aco);
    barra([-3.9, HP, z], [0, CUME - 0.05, z], 0.08, M.aco);
    barra([3.9, HP, z], [0, CUME - 0.05, z], 0.08, M.aco);
    for (const x of [-3, -2, -1, 1, 2, 3]) {
      barra([x, HP, z], [x, yTopo(x) - 0.05, z], 0.05, M.aco);
      const x2 = x - Math.sign(x);
      barra([x, HP, z], [x2, yTopo(x2) - 0.05, z], 0.04, M.aco);
    }
  }
  for (const x of [-3, -1.6, 0, 1.6, 3]) barra([x, yTopo(x) - 0.08, 0], [x, yTopo(x) - 0.08, Z1], 0.07, M.aco);

  // luminárias pendentes (focos de luz)
  let nSombra = 0;
  for (let z = -1.5; z > Z1; z -= 3) {
    const lum = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 20), M.aco);
    lum.position.set(0, HP - 0.1, z);
    cena.add(lum);
    const disco = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), M.luz(0xffe2b8, 8));
    disco.rotation.x = Math.PI / 2;
    disco.position.set(0, HP - 0.165, z);
    cena.add(disco);
    const sp = new THREE.SpotLight(0xffd7a6, 20, 11, 0.95, 0.75, 2);
    sp.position.set(0, HP - 0.2, z);
    sp.target.position.set(0, 0, z);
    if (alta && z <= -4.5 && nSombra < 3) { sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -0.0004; nSombra++; }
    cena.add(sp, sp.target);
  }

  // arandelas (luz para cima e para baixo) nas paredes laterais — dentro e no corredor
  const zArandelas = [-1.8, -4.4, -7.0, -9.6, -12.2];
  for (const z of zArandelas) {
    for (const s of [-1, 1]) {
      const xi = s * (4 - 0.15); // face interna
      caixa(0.08, 0.26, 0.12, M.aco, xi - s * 0.04, 2.55, z);
      caixa(0.02, 0.02, 0.1, M.luz(0xffd49a, 6), xi - s * 0.085, 2.68, z);
      caixa(0.02, 0.02, 0.1, M.luz(0xffd49a, 6), xi - s * 0.085, 2.42, z);
      brilhoPlano(0.55, 1.9, 0xffb877, 0.3, [xi - s * 0.005, 2.55, z], s * -Math.PI / 2, true);
      const pl = new THREE.PointLight(0xffc27d, alta ? 2.2 : 3.5, 5, 2);
      pl.position.set(xi - s * 0.4, 2.55, z);
      if (alta || s === -1) cena.add(pl);
    }
    // face externa da parede esquerda (corredor)
    const xe = X0 - 0.001;
    caixa(0.08, 0.26, 0.12, M.aco, xe - 0.04, 2.3, z);
    brilhoPlano(0.55, 1.9, 0xffb877, 0.35, [xe - 0.002, 2.3, z], -Math.PI / 2, true);
  }

  // ---------- presbitério ----------
  caixa(5.2, 0.2, 2.6, M.pedra, 0, PISO + 0.1, Z1 + 1.3 + 0.15);
  // painel de madeira atrás do altar
  caixa(3.2, HP - PISO, 0.05, M.madeira(2.5, 3), 0, PISO + (HP - PISO) / 2, Z1 + 0.18);
  // crucifixo
  const cruz = new THREE.Group();
  caixa(0.12, 2.1, 0.07, M.escura(0.3, 1), 0, 0, 0, cruz);
  caixa(1.15, 0.12, 0.07, M.escura(0.6, 0.3), 0, 0.55, 0, cruz);
  caixa(0.22, 0.12, 0.02, M.pano, 0, 0.95, 0.045, cruz);
  // INRI
  const inri = texturaDe(canvasTexto([{ texto: 'INRI', fonte: "700 150px 'Times New Roman', Times, serif", x: 256, y: 170, cor: '#3a2a1a' }], 512, 220), 1, 1);
  const placaInri = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.086), new THREE.MeshStandardMaterial({ map: inri, transparent: true, roughness: 0.6 }));
  placaInri.position.set(0, 0.95, 0.056);
  cruz.add(placaInri);
  // Cristo esculpido (mãos sobre a trave, em y = 0,55)
  const cristo = criarCrucificado(THREE, { passo: alta ? 0.0036 : 0.0055 });
  cristo.position.set(0, 0.55 - 0.296, 0.012);
  cruz.add(cristo);
  cruz.position.set(0, 2.75, Z1 + 0.25);
  cena.add(cruz);
  brilhoPlano(2.2, 3.2, 0xffc890, 0.16, [0, 2.7, Z1 + 0.21], 0, true);
  const focoCruz = new THREE.SpotLight(0xffe0b5, 18, 9, 0.35, 0.6, 2);
  focoCruz.position.set(0, HP - 0.1, Z1 + 3.2);
  focoCruz.target = cruz;
  cena.add(focoCruz);

  // altar
  const zAltar = Z1 + 1.55;
  caixa(1.7, 0.95, 0.72, M.escura(1.2, 0.6), 0, PISO + 0.2 + 0.475, zAltar);
  caixa(1.95, 0.03, 0.9, M.pano, 0, PISO + 0.2 + 0.965, zAltar);
  caixa(1.95, 0.32, 0.015, M.pano, 0, PISO + 0.2 + 0.82, zAltar + 0.45);
  for (const s of [-1, 1]) caixa(0.015, 0.32, 0.9, M.pano, s * 0.975, PISO + 0.2 + 0.82, zAltar);
  const velas = [];
  for (const x of [-0.6, 0.6]) {
    const base = PISO + 0.2 + 0.98;
    caixa(0.1, 0.05, 0.1, M.ouro, x, base + 0.025, zAltar - 0.25);
    const vela = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), M.tunica);
    vela.position.set(x, base + 0.21, zAltar - 0.25);
    cena.add(vela);
    const chama = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), M.luz(0xffb050, 12));
    chama.scale.y = 1.8;
    chama.position.set(x, base + 0.41, zAltar - 0.25);
    cena.add(chama);
    const lv = new THREE.PointLight(0xffa850, 0.8, 3, 2);
    lv.position.copy(chama.position);
    cena.add(lv);
    velas.push({ chama, lv, fase: x * 7 });
  }
  // ambão
  caixa(0.1, 1.05, 0.1, M.escura(), 2.1, PISO + 0.2 + 0.52, Z1 + 2.4);
  const tampo = caixa(0.55, 0.04, 0.42, M.escura(), 2.1, PISO + 0.2 + 1.08, Z1 + 2.4);
  tampo.rotation.x = 0.35;
  caixa(0.4, 0.05, 0.35, M.escura(), 2.1, PISO + 0.22, Z1 + 2.4);

  // Nossa Senhora (à esquerda do altar, sobre pedestal)
  const nsX = -2.75, nsZ = Z1 + 0.6;
  caixa(0.62, 1.0, 0.46, M.escura(0.6, 0.8), nsX, PISO + 0.2 + 0.5, nsZ);
  // imagem de Nossa Senhora de Fátima: foto real (domínio público) aplicada numa superfície levemente curva
  const imagem = new THREE.Group();
  if (texturas.fatima) {
    const tf = await new THREE.TextureLoader().loadAsync(texturas.fatima);
    tf.colorSpace = THREE.SRGBColorSpace;
    tf.anisotropy = 8;
    const altF = 1.15, largF = (altF * 262) / 710;
    const foto = new THREE.Mesh(superficieCurva(largF, altF, 0.11), new THREE.MeshStandardMaterial({
      map: tf, transparent: true, alphaTest: 0.3, roughness: 0.55, emissive: 0xffffff, emissiveMap: tf, emissiveIntensity: 0.3,
    }));
    foto.position.y = altF / 2;
    foto.castShadow = alta;
    imagem.add(foto);
  }
  imagem.position.set(nsX, PISO + 0.2 + 1.0, nsZ + 0.05);
  imagem.rotation.y = 0.18;
  cena.add(imagem);
  const focoNS = new THREE.SpotLight(0xfff0d8, 9, 7, 0.32, 0.6, 2);
  focoNS.position.set(nsX + 0.6, HP - 0.2, nsZ + 2.6);
  focoNS.target = imagem;
  cena.add(focoNS);
  brilhoPlano(1.6, 2.4, 0xffc890, 0.12, [nsX, 2.4, Z1 + 0.16], 0, true);

  // quadro de São Padre Pio (à direita)
  const ppX = 2.75, ppY = 2.15;
  caixa(0.8, 0.98, 0.05, new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.35, metalness: 0.3 }), ppX, ppY, Z1 + 0.18);
  caixa(0.72, 0.9, 0.052, new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.7 }), ppX, ppY, Z1 + 0.182);
  if (texturas.padrePio) {
    const tp = await new THREE.TextureLoader().loadAsync(texturas.padrePio);
    tp.colorSpace = THREE.SRGBColorSpace;
    tp.anisotropy = 8;
    const quadro = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.8), new THREE.MeshStandardMaterial({ map: tp, roughness: 0.35 }));
    quadro.position.set(ppX, ppY, Z1 + 0.21);
    cena.add(quadro);
  }
  const focoPP = new THREE.SpotLight(0xfff0d8, 7, 7, 0.3, 0.6, 2);
  focoPP.position.set(ppX - 0.5, HP - 0.2, Z1 + 2.6);
  focoPP.target.position.set(ppX, ppY, Z1 + 0.2);
  cena.add(focoPP, focoPP.target);
  brilhoPlano(1.6, 2.4, 0xffc890, 0.12, [ppX, 2.3, Z1 + 0.16], 0, true);

  // plantas
  function planta(x, y, z, esc = 1) {
    const g = new THREE.Group();
    const v = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.3, 16), M.vaso));
    v.position.y = 0.15; g.add(v);
    const rr = rng(Math.floor(x * 100 + z * 10) + 3);
    for (let k = 0; k < 14; k++) {
      const f = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6, 4), M.folha), true, false);
      const a = rr() * Math.PI * 2, inc = 0.3 + rr() * 0.6;
      f.position.set(Math.cos(a) * 0.08, 0.5, Math.sin(a) * 0.08);
      f.rotation.set(Math.sin(a) * inc, 0, -Math.cos(a) * inc);
      g.add(f);
    }
    g.position.set(x, y, z);
    g.scale.setScalar(esc);
    cena.add(g);
  }
  planta(-3.45, PISO, Z1 + 0.5);
  planta(3.45, PISO, Z1 + 0.5);
  planta(-1.3, PISO + 0.2, Z1 + 0.55, 0.7);
  planta(1.3, PISO + 0.2, Z1 + 0.55, 0.7);

  // bancos de igreja: fileiras voltadas para o altar, em duas alas, com corredor central livre
  const matBanco = M.escura(3, 0.3);
  const matBancoLado = M.escura(0.4, 0.5);
  // perfil lateral do banco (visto de lado): assento, encosto inclinado e topo arredondado
  const lado = new THREE.Shape();
  lado.moveTo(-0.26, 0);
  lado.lineTo(0.2, 0);
  lado.lineTo(0.2, 0.44);
  lado.lineTo(0.12, 0.47);
  lado.lineTo(-0.16, 0.47);
  lado.lineTo(-0.2, 0.92);
  lado.quadraticCurveTo(-0.23, 0.99, -0.29, 0.97);
  lado.lineTo(-0.3, 0.9);
  lado.lineTo(-0.26, 0.47);
  lado.lineTo(-0.26, 0);
  const geoLado = new THREE.ExtrudeGeometry(lado, { depth: 0.05, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
  geoLado.translate(0, 0, -0.025);
  geoLado.rotateY(Math.PI / 2);
  function banco(comp) {
    const g = new THREE.Group();
    // (no grupo: x ao longo do banco, frente do assento em -z, voltada para o altar)
    const assento = caixa(comp, 0.045, 0.42, matBanco, 0, 0.45, 0.0, g);
    assento.position.z = -0.03;
    const enc = caixa(comp, 0.42, 0.035, matBanco, 0, 0.7, 0.2, g);
    enc.rotation.x = -0.14;
    caixa(comp, 0.07, 0.03, matBanco, 0, 0.93, 0.235, g);
    caixa(comp, 0.12, 0.025, matBanco, 0, 0.36, -0.22, g);
    caixa(comp, 0.05, 0.12, matBancoLado, 0, 0.12, 0.42, g); // genuflexório do banco de trás
    for (const s of [-1, 1]) {
      const l = sombra(new THREE.Mesh(geoLado, matBancoLado));
      l.position.set(s * (comp / 2 + 0.02), 0, 0);
      g.add(l);
    }
    caixa(0.04, 0.4, 0.04, matBancoLado, 0, 0.22, 0.1, g);
    return g;
  }
  const bancos = [];
  for (let fila = 0; fila < 8; fila++) {
    const z = Z1 + 3.6 + fila * 0.95;
    for (const s of [-1, 1]) {
      const b = banco(2.3);
      b.position.set(s * (0.75 + 1.15), PISO, z);
      cena.add(b);
      bancos.push(b);
    }
  }

  // ---------- fachada (toda em madeira) ----------
  const ZF = 0.02; // face interna da fachada
  const EF = 0.2; // espessura
  const zFrente = ZF + EF;
  caixa(1.55, 3.7, EF, M.fachada(1.55 / 1.6, 3.7 / 1.6), -3.325, 1.85, ZF + EF / 2);
  caixa(1.55, 3.7, EF, M.fachada(1.55 / 1.6, 3.7 / 1.6), 3.325, 1.85, ZF + EF / 2);
  // portas pivotantes de ripas (abertas, recolhidas nas laterais)
  const matRipa = M.fachada(0.08, 3.7 / 1.6);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 11; k++) {
      const x = s * (1.62 + k * 0.088);
      caixa(0.065, 3.5, 0.08, matRipa, x, 1.75 + 0.02, zFrente - 0.02);
    }
    caixa(1.0, 0.08, 0.1, M.escura(), s * 2.06, 3.54, zFrente - 0.02);
    caixa(1.0, 0.06, 0.1, M.escura(), s * 2.06, 0.05, zFrente - 0.02);
  }
  // viga superior
  caixa(8.3, 0.28, 0.32, M.fachada(8.3 / 1.6, 0.25), 0, 3.72, ZF + 0.16);
  // oitão frontal (triângulo)
  const oitaoF = new THREE.Shape([
    new THREE.Vector2(-4.15, 3.86), new THREE.Vector2(4.15, 3.86), new THREE.Vector2(4.15, 4.45),
    new THREE.Vector2(0, 6.45), new THREE.Vector2(-4.15, 4.45),
  ]);
  const geoOitao = new THREE.ExtrudeGeometry(oitaoF, { depth: EF, bevelEnabled: false });
  const oitaoMesh = sombra(new THREE.Mesh(geoOitao, M.fachada(1 / 1.6, 1 / 1.6)));
  oitaoMesh.position.z = ZF;
  cena.add(oitaoMesh);
  // beiral / testeira escura
  for (const s of [-1, 1]) {
    const comp = Math.hypot(4.15, 2.0) + 0.25;
    const b = caixa(comp, 0.2, 0.55, M.escura(3, 0.2), s * (2.075 + 0.1), 5.45 - 0.05, ZF + 0.2);
    b.rotation.z = -s * Math.atan2(2.0, 4.15);
  }
  // focos de luz no beiral + brilho na madeira
  for (const x of [-2.9, -1.2, 0.9, 2.7]) {
    const y = 6.45 - (2.0 * Math.abs(x)) / 4.15 - 0.25;
    caixa(0.08, 0.05, 0.08, M.luz(0xffe0b0, 20), x, y, zFrente + 0.05);
    brilhoPlano(1.0, 1.3, 0xffb870, 0.55, [x, y - 0.5, zFrente + 0.003], 0, true);
  }
  for (const x of [-1.6, 1.4]) {
    const f = new THREE.SpotLight(0xffe3bd, 30, 6, 0.6, 0.8, 2);
    f.position.set(x, 6.2, zFrente + 1.6);
    f.target.position.set(x, 4.5, zFrente);
    cena.add(f, f.target);
  }
  // letreiro "CAPELA São Padre Pio" com retrato gravado
  const canvasLetreiro = canvasTexto([
    { texto: 'CAPELA', fonte: "600 118px 'Cormorant Garamond', Georgia, serif", espaco: '22px', x: 1024, y: 190 },
    { texto: 'São Padre Pio', fonte: "700 300px 'Cormorant Garamond', Georgia, serif", x: 1024, y: 520 },
  ], 2048, 600);
  const texLetreiro = texturaDe(canvasLetreiro, 1, 1);
  const letreiro = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.055), new THREE.MeshStandardMaterial({ map: texLetreiro, transparent: true, roughness: 0.5, emissive: 0xffffff, emissiveMap: texLetreiro, emissiveIntensity: 0.28 }));
  letreiro.position.set(-0.35, 4.62, zFrente + 0.012);
  cena.add(letreiro);
  if (texturas.placaRetrato) {
    const tr = await new THREE.TextureLoader().loadAsync(texturas.placaRetrato);
    tr.colorSpace = THREE.SRGBColorSpace;
    const ret = new THREE.Mesh(new THREE.PlaneGeometry(0.93, 1.157), new THREE.MeshStandardMaterial({ map: tr, transparent: true, roughness: 0.5, emissive: 0xffffff, emissiveMap: tr, emissiveIntensity: 0.25 }));
    ret.position.set(2.0, 4.5, zFrente + 0.012);
    cena.add(ret);
  }
  const numero = texturaDe(canvasTexto([{ texto: '2038', fonte: "600 175px 'Times New Roman', Times, serif", x: 256, y: 185 }], 512, 240), 1, 1);
  const placaNum = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.29), new THREE.MeshStandardMaterial({ map: numero, transparent: true, emissive: 0xffffff, emissiveMap: numero, emissiveIntensity: 0.35 }));
  placaNum.position.set(-3.4, 3.25, zFrente + 0.012);
  cena.add(placaNum);
  // cruzes em LED
  for (const s of [-1, 1]) {
    const x = s * 3.36;
    caixa(0.085, 1.15, 0.05, M.luz(0xffd08a, 7), x, 1.95, zFrente + 0.025);
    caixa(0.6, 0.085, 0.05, M.luz(0xffd08a, 7), x, 2.25, zFrente + 0.025);
    brilhoPlano(1.5, 2.6, 0xffa458, 0.9, [x, 1.95, zFrente + 0.004], 0, true);
    const pl = new THREE.PointLight(0xffb96b, 5, 3.5, 2);
    pl.position.set(x, 2.0, zFrente + 0.35);
    cena.add(pl);
  }
  // fita de LED no rodapé da fachada
  caixa(8.3, 0.025, 0.03, M.luz(0xffcf95, 5), 0, 0.03, zFrente + 0.03);
  brilhoPlano(8.3, 0.7, 0xffb870, 0.35, [0, 0.18, zFrente + 0.003]);

  // ---------- corredor lateral (1 m, à esquerda) ----------
  const pisoCorr = sombra(new THREE.Mesh(new THREE.PlaneGeometry(1, 15.2), M.piso(1 / 2.4, 15.2 / 2.4)), false, true);
  pisoCorr.rotation.x = -Math.PI / 2;
  pisoCorr.position.set(-4.5, 0.06, -7.4);
  cena.add(pisoCorr);
  // muro de madeira à esquerda do corredor
  caixa(0.06, 3.1, 15.2, M.fachada(15.2 / 1.6, 3.1 / 1.6), CX0 - 0.03, 1.55, -7.4);
  for (let z = 0.15; z > Z1; z -= 1.9) caixa(0.08, 3.15, 0.08, M.aco, CX0 + 0.02, 1.575, z);
  // estrutura frontal (portão aberto) e pergolado
  caixa(0.1, 3.3, 0.1, M.aco, CX0 + 0.02, 1.65, 0.2);
  caixa(0.1, 3.3, 0.1, M.aco, CX1 - 0.03, 1.65, 0.24);
  caixa(1.1, 0.12, 0.12, M.aco, -4.5, 3.25, 0.22);
  const portao = new THREE.Group();
  for (let k = 0; k < 7; k++) caixa(0.03, 2.8, 0.03, M.aco, 0, 1.45, -k * 0.13, portao);
  caixa(0.04, 0.05, 0.85, M.aco, 0, 2.85, -0.39, portao);
  caixa(0.04, 0.05, 0.85, M.aco, 0, 0.1, -0.39, portao);
  portao.position.set(CX0 + 0.12, 0.05, 0.12);
  cena.add(portao);
  for (let z = 0.2; z > Z1 - 0.1; z -= 1.5) caixa(1.05, 0.08, 0.06, M.aco, -4.5, 3.14, z);
  caixa(0.06, 0.1, 15.3, M.aco, CX0 + 0.03, 3.14, -7.4);
  const cobertura = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 15.3), M.policarbonato);
  cobertura.rotation.x = -Math.PI / 2;
  cobertura.position.set(-4.5, 3.2, -7.4);
  cena.add(cobertura);
  for (let z = -1.0; z > Z1; z -= 3.2) {
    caixa(0.12, 0.03, 0.12, M.luz(0xffe2b8, 8), -4.5, 3.08, z);
    const pl = new THREE.PointLight(0xffcf98, 2.2, 5, 2);
    pl.position.set(-4.5, 2.9, z);
    cena.add(pl);
  }
  for (let z = -1.2; z > Z1 + 1; z -= 2.4) planta(-4.78, 0.06, z, 0.75);
  // ---------- sede (atrás da capela) e lojinha no caminho do corredor ----------
  const FIM = -26; // fim do corredor (fundo do terreno)
  const ZS = Z1 - 0.15; // face da sede logo atrás da parede do fundo da capela
  // piso do corredor ao lado da sede
  const pisoCorr2 = sombra(new THREE.Mesh(new THREE.PlaneGeometry(1, Z1 - FIM), M.piso(1 / 2.4, (Z1 - FIM) / 2.4)), false, true);
  pisoCorr2.rotation.x = -Math.PI / 2;
  pisoCorr2.position.set(-4.5, 0.06, (Z1 + FIM) / 2);
  cena.add(pisoCorr2);
  // muro do terreno (porcelanato bege, como hoje) e vasos
  caixa(0.06, 3.0, Z1 - FIM, new THREE.MeshStandardMaterial({ map: repetir(porcelanato, (Z1 - FIM) / 1.2, 3.0 / 1.2), roughness: 0.45 }), CX0 - 0.03, 1.5, (Z1 + FIM) / 2);
  for (let z = ZS - 1.4; z > FIM + 1; z -= 2.6) planta(-4.8, 0.06, z, 0.7);
  // parede da sede voltada para o corredor: azulejo branco, portas e condensadoras de ar
  const LOJ = { x0: -3.85, x1: -0.75, z0: ZS, z1: ZS - 3.1, h: 2.8 };
  const PORTA = { z0: LOJ.z0 - 0.75, z1: LOJ.z0 - 2.35, h: 2.25 };
  const matAzulejo = (comp, alt) => new THREE.MeshStandardMaterial({ map: repetir(azulejo, comp / 0.8, alt / 0.8), roughness: 0.25 });
  const parede = (z0, z1, y0, y1) => caixa(0.15, y1 - y0, z0 - z1, matAzulejo(z0 - z1, y1 - y0), X0 + 0.075, (y0 + y1) / 2, (z0 + z1) / 2);
  parede(ZS, PORTA.z0, 0, 3.2);
  parede(PORTA.z0, PORTA.z1, PORTA.h, 3.2);
  parede(PORTA.z1, FIM, 0, 3.2);
  // beiral de telha colonial sobre parte do corredor
  const matTelha = new THREE.MeshStandardMaterial({ map: repetir(telhaColonial, 1, (ZS - FIM) / 1.2), roughness: 0.7 });
  const beiral = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, ZS - FIM + 0.2), matTelha));
  beiral.position.set(-4.3, 3.22, (ZS + FIM) / 2);
  beiral.rotation.z = 0.28;
  cena.add(beiral);
  const telhado = sombra(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, ZS - FIM + 0.2), matTelha));
  telhado.position.set(-1.8, 3.9, (ZS + FIM) / 2);
  telhado.rotation.z = 0.3;
  cena.add(telhado);
  caixa(0.04, 0.16, ZS - FIM + 0.2, M.escura(), -4.66, 3.17, (ZS + FIM) / 2);
  // portas das outras salas (fechadas) com condensadora de ar acima
  const matPorta = M.madeira(0.6, 1.4);
  for (const zc of [FIM + 5.2, FIM + 1.8]) {
    caixa(0.05, 2.15, 0.9, matPorta, X0 - 0.025, 1.135, zc);
    caixa(0.03, 0.04, 0.14, M.aco, X0 - 0.06, 1.1, zc + 0.33);
    caixa(0.06, 2.2, 0.06, M.pano, X0 - 0.03, 1.13, zc + 0.48);
    caixa(0.06, 2.2, 0.06, M.pano, X0 - 0.03, 1.13, zc - 0.48);
    caixa(0.06, 0.06, 1.02, M.pano, X0 - 0.03, 2.25, zc);
    caixa(0.3, 0.55, 0.75, new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.5 }), X0 - 0.16, 2.72, zc);
    const grade = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: 0x6d6f73, roughness: 0.6 }));
    grade.rotation.y = -Math.PI / 2;
    grade.position.set(X0 - 0.315, 2.72, zc + 0.12);
    cena.add(grade);
  }
  // arandelas no corredor da sede
  for (const z of [ZS - 4.2, FIM + 3.5]) {
    caixa(0.08, 0.26, 0.12, M.aco, X0 - 0.04, 2.35, z);
    brilhoPlano(0.55, 1.8, 0xffb877, 0.4, [X0 - 0.004, 2.35, z], -Math.PI / 2, true);
    const pl = new THREE.PointLight(0xffc98a, 2.5, 5, 2);
    pl.position.set(-4.5, 2.4, z);
    cena.add(pl);
  }
  // fundo do terreno: portão e luz
  caixa(1.0, 2.4, 0.05, M.escura(0.6, 1.2), -4.5, 1.26, FIM);
  const fundo = new THREE.PointLight(0xffc98a, 4, 6, 2);
  fundo.position.set(-4.5, 2.6, FIM + 0.8);
  cena.add(fundo);

  // ---------- lojinha ----------
  // piso, forro e paredes internas
  const pisoLoja = sombra(new THREE.Mesh(new THREE.PlaneGeometry(LOJ.x1 - LOJ.x0, LOJ.z0 - LOJ.z1), new THREE.MeshStandardMaterial({ map: repetir(assoalho, 2, 2), roughness: 0.45 })), false, true);
  pisoLoja.rotation.x = -Math.PI / 2;
  pisoLoja.position.set((LOJ.x0 + LOJ.x1) / 2, 0.07, (LOJ.z0 + LOJ.z1) / 2);
  cena.add(pisoLoja);
  const forro = new THREE.Mesh(new THREE.PlaneGeometry(LOJ.x1 - LOJ.x0, LOJ.z0 - LOJ.z1), new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.9 }));
  forro.rotation.x = Math.PI / 2;
  forro.position.set((LOJ.x0 + LOJ.x1) / 2, LOJ.h, (LOJ.z0 + LOJ.z1) / 2);
  cena.add(forro);
  const tinta = new THREE.MeshStandardMaterial({ color: 0xefe6d6, roughness: 0.9 });
  caixa(LOJ.x1 - LOJ.x0 + 0.3, LOJ.h, 0.15, tinta, (LOJ.x0 + LOJ.x1) / 2, LOJ.h / 2, LOJ.z1 - 0.075);
  caixa(0.15, LOJ.h, LOJ.z0 - LOJ.z1 + 0.3, tinta, LOJ.x1 + 0.075, LOJ.h / 2, (LOJ.z0 + LOJ.z1) / 2);
  // tapete
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshStandardMaterial({ map: texturaDe(canvasTapete(), 1, 1), roughness: 0.95 }));
  tapete.rotation.x = -Math.PI / 2;
  tapete.position.set(-2.25, 0.075, (LOJ.z0 + LOJ.z1) / 2);
  cena.add(tapete);
  // porta de vidro de correr (uma folha fixa e outra aberta atrás dela)
  const vidro = new THREE.MeshStandardMaterial({ color: 0xcfe0e4, transparent: true, opacity: 0.2, roughness: 0.04, metalness: 0.2, depthWrite: false });
  const perfilAl = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.35 });
  const larg = (PORTA.z0 - PORTA.z1) / 2;
  for (const [xo, zc] of [[X0 - 0.03, PORTA.z1 + larg / 2], [X0 - 0.07, PORTA.z1 + larg / 2 - 0.04]]) {
    const folha = new THREE.Mesh(new THREE.BoxGeometry(0.012, PORTA.h - 0.06, larg), vidro);
    folha.position.set(xo, PORTA.h / 2, zc);
    folha.renderOrder = 3;
    cena.add(folha);
    for (const dz of [-larg / 2, larg / 2]) caixa(0.03, PORTA.h - 0.04, 0.03, perfilAl, xo, PORTA.h / 2, zc + dz);
    caixa(0.034, 0.03, larg, perfilAl, xo, 0.1, zc);
    caixa(0.034, 0.03, larg, perfilAl, xo, PORTA.h - 0.05, zc);
    caixa(0.02, 0.35, 0.025, perfilAl, xo - 0.02, 1.05, zc + larg / 2 - 0.06);
  }
  caixa(0.1, 0.06, PORTA.z0 - PORTA.z1 + 0.1, perfilAl, X0 - 0.05, PORTA.h, (PORTA.z0 + PORTA.z1) / 2);
  // plaquinha "Lojinha" sobre a porta
  const placaLoja = texturaDe(canvasTexto([{ texto: 'Lojinha', fonte: "italic 600 150px 'Cormorant Garamond', Georgia, serif", x: 400, y: 175, cor: '#f3e4c6' }], 800, 240), 1, 1);
  caixa(0.03, 0.34, 1.1, M.escura(0.5, 0.2), X0 - 0.02, 2.62, (PORTA.z0 + PORTA.z1) / 2);
  const txtLoja = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), new THREE.MeshStandardMaterial({ map: placaLoja, transparent: true, emissive: 0xffffff, emissiveMap: placaLoja, emissiveIntensity: 0.3 }));
  txtLoja.rotation.y = -Math.PI / 2;
  txtLoja.position.set(X0 - 0.04, 2.62, (PORTA.z0 + PORTA.z1) / 2);
  cena.add(txtLoja);

  // móvel de madeira que rodeia a sala: balcão embaixo, prateleiras em cima
  const matMovel = M.madeira(1.5, 0.6);
  const matMovelEsc = M.escura(1.5, 0.6);
  const livrosPos = [];
  function movel(cx, cz, ang, L, comBalcao = true) {
    const g = new THREE.Group();
    g.position.set(cx, 0.07, cz);
    g.rotation.y = ang; // local x ao longo da parede, local z para dentro da sala
    if (comBalcao) {
      caixa(L, 0.8, 0.44, matMovelEsc, 0, 0.46, 0.22, g);
      caixa(L, 0.06, 0.4, M.escura(), 0, 0.03, 0.2, g);
      caixa(L + 0.02, 0.04, 0.48, matMovel, 0, 0.88, 0.24, g);
      for (let x = -L / 2 + 0.5; x < L / 2 - 0.2; x += 0.5) caixa(0.008, 0.66, 0.005, M.escura(), x, 0.46, 0.442, g);
    }
    caixa(L, 1.45, 0.02, matMovel, 0, 1.73, 0.01, g); // fundo
    caixa(L, 0.04, 0.32, matMovel, 0, 2.47, 0.16, g); // tampo
    const nDiv = Math.max(1, Math.round(L / 0.8));
    for (let i = 0; i <= nDiv; i++) caixa(0.025, 1.47, 0.3, matMovel, -L / 2 + (i * L) / nDiv, 1.74, 0.15, g);
    for (const y of [1.05, 1.4, 1.75, 2.1]) {
      caixa(L, 0.025, 0.3, matMovel, 0, y, 0.15, g);
      caixa(L - 0.05, 0.008, 0.012, M.luz(0xffd9a0, 2.2), 0, y + 0.33, 0.27, g); // fita de LED
      g.updateMatrixWorld(true);
      for (let i = 0; i < nDiv; i++) {
        const a = -L / 2 + (i * L) / nDiv + 0.02, b = -L / 2 + ((i + 1) * L) / nDiv - 0.02;
        livrosPos.push({ g, a, b, y: y + 0.0125 });
      }
    }
    cena.add(g);
    return g;
  }
  const cxL = (LOJ.x0 + LOJ.x1) / 2, czL = (LOJ.z0 + LOJ.z1) / 2;
  movel(cxL, LOJ.z0, Math.PI, LOJ.x1 - LOJ.x0);
  movel(cxL, LOJ.z1, 0, LOJ.x1 - LOJ.x0);
  movel(LOJ.x1, czL, -Math.PI / 2, LOJ.z0 - LOJ.z1 - 0.9);
  // livros (uma única malha instanciada)
  const cores = ['#6a1a1f', '#1f3a5f', '#2f4f3a', '#8a5a2b', '#c9a24a', '#3b2a20', '#7a2e2e', '#d8cfbd', '#26354a', '#5b3a5e', '#b8862b', '#e6dcc8', '#1c1c1c', '#4a2a1a'];
  const rl = rng(2026);
  const livros = [];
  for (const s of livrosPos) {
    let x = s.a + rl() * 0.03;
    while (x < s.b - 0.03) {
      if (rl() < 0.06) { x += 0.06 + rl() * 0.1; continue; }
      const biblia = rl() < 0.18;
      const w = biblia ? 0.05 + rl() * 0.015 : 0.02 + rl() * 0.035;
      const h = biblia ? 0.24 : 0.16 + rl() * 0.11;
      const d = biblia ? 0.18 : 0.13 + rl() * 0.07;
      if (x + w > s.b) break;
      livros.push({ g: s.g, x: x + w / 2, y: s.y + h / 2, z: 0.02 + d / 2 + 0.02, w, h, d, cor: biblia ? (rl() < 0.5 ? '#1a1412' : '#3b2317') : cores[Math.floor(rl() * cores.length)] });
      x += w + 0.002;
    }
  }
  const livrosMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7 }), livros.length);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), vs = new THREE.Vector3(), vp = new THREE.Vector3(), cor = new THREE.Color();
  livros.forEach((l, i) => {
    vp.set(l.x, l.y, l.z).applyMatrix4(l.g.matrixWorld);
    q.setFromRotationMatrix(l.g.matrixWorld);
    mt.compose(vp, q, vs.set(l.w, l.h, l.d));
    livrosMesh.setMatrixAt(i, mt);
    livrosMesh.setColorAt(i, cor.set(l.cor));
  });
  livrosMesh.castShadow = alta;
  cena.add(livrosMesh);
  // Bíblias em destaque sobre o balcão (capa de frente)
  const capa = texturaDe(canvasCapaBiblia(), 1, 1);
  const matCapa = [M.escura(), M.escura(), M.escura(), M.escura(), new THREE.MeshStandardMaterial({ map: capa, roughness: 0.55 }), M.escura()];
  const bibliasDestaque = [
    [cxL - 0.9, LOJ.z1 + 0.38, 0], [cxL - 0.45, LOJ.z1 + 0.38, 0], [cxL + 0.6, LOJ.z1 + 0.38, 0],
    [cxL - 0.6, LOJ.z0 - 0.38, Math.PI], [cxL + 0.3, LOJ.z0 - 0.38, Math.PI], [LOJ.x1 - 0.38, czL - 0.4, -Math.PI / 2], [LOJ.x1 - 0.38, czL + 0.3, -Math.PI / 2],
  ];
  for (const [x, z, a] of bibliasDestaque) {
    const b = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.24, 0.04), matCapa));
    b.position.set(x, 0.07 + 0.9 + 0.12, z);
    b.rotation.set(0, a, 0);
    b.rotateX(-0.22);
    cena.add(b);
    caixa(0.12, 0.012, 0.1, M.ouro, x, 0.975, z);
  }
  // terços e uma planta sobre o balcão
  planta(LOJ.x1 - 0.32, 0.07 + 0.9, LOJ.z1 + 0.38, 0.45);
  // artigos religiosos sobre o balcão: terços, imagens, quadrinhos, crucifixos e velas
  const topoBalcao = 0.07 + 0.9;
  const carregar = (url) => (url ? new THREE.TextureLoader().loadAsync(url).then((t) => { t.colorSpace = THREE.SRGBColorSpace; return t; }) : null);
  const [texFat, texPP] = await Promise.all([carregar(texturas.fatima), carregar(texturas.padrePio)]);
  const m4 = new THREE.Matrix4();
  const contaGeo = new THREE.SphereGeometry(0.0055, 8, 6);
  function expositorTercos(x, z, ang) {
    const g = new THREE.Group();
    caixa(0.38, 0.02, 0.14, M.escura(), 0, 0.01, 0, g);
    for (const s of [-1, 1]) caixa(0.02, 0.36, 0.02, M.escura(), s * 0.17, 0.19, 0, g);
    caixa(0.36, 0.015, 0.015, M.ouro, 0, 0.36, 0, g);
    [0x6b4226, 0xf3efe6, 0x5b8fd4, 0xa3121a].forEach((c, k) => {
      const cx = -0.12 + k * 0.08;
      const pts = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        pts.push([cx + Math.sin(a) * 0.024, 0.29 - Math.cos(a) * 0.07, 0.012]);
      }
      for (let i = 1; i <= 4; i++) pts.push([cx, 0.22 - i * 0.012, 0.012]);
      const im = new THREE.InstancedMesh(contaGeo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 }), pts.length);
      pts.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2])));
      g.add(im);
      caixa(0.006, 0.032, 0.004, M.ouro, cx, 0.15, 0.012, g);
      caixa(0.02, 0.005, 0.004, M.ouro, cx, 0.158, 0.012, g);
    });
    g.position.set(x, topoBalcao, z);
    g.rotation.y = ang;
    cena.add(g);
  }
  function miniFatima(x, z, ang, alt = 0.32) {
    if (!texFat) return;
    const mesh = new THREE.Mesh(superficieCurva((alt * 262) / 710, alt, 0.03, 12, 4), new THREE.MeshStandardMaterial({
      map: texFat, transparent: true, alphaTest: 0.3, roughness: 0.5, emissive: 0xffffff, emissiveMap: texFat, emissiveIntensity: 0.25,
    }));
    mesh.position.set(x, topoBalcao + alt / 2, z);
    mesh.rotation.y = ang;
    cena.add(mesh);
  }
  function quadrinho(x, z, ang) {
    const g = new THREE.Group();
    caixa(0.17, 0.21, 0.015, new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.7, roughness: 0.35 }), 0, 0.105, 0, g);
    if (texPP) {
      const q = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.175), new THREE.MeshStandardMaterial({ map: texPP, roughness: 0.4 }));
      q.position.set(0, 0.105, 0.0085);
      g.add(q);
    }
    g.position.set(x, topoBalcao, z);
    g.rotation.set(0, ang, 0);
    g.rotateX(-0.18);
    cena.add(g);
  }
  function crucifixoPequeno(x, z, ang, alt = 0.3) {
    const g = new THREE.Group();
    caixa(0.11, 0.02, 0.07, M.escura(), 0, 0.01, 0, g);
    caixa(0.022, alt, 0.016, M.escura(), 0, alt / 2 + 0.02, 0, g);
    caixa(alt * 0.5, 0.022, 0.016, M.escura(), 0, alt * 0.74, 0, g);
    caixa(0.013, alt * 0.34, 0.01, M.pano, 0, alt * 0.56, 0.013, g);
    caixa(alt * 0.4, 0.008, 0.008, M.pano, 0, alt * 0.71, 0.013, g);
    g.position.set(x, topoBalcao, z);
    g.rotation.y = ang;
    cena.add(g);
  }
  function grupoVelas(x, z) {
    for (const [dx, dz, h, c] of [[0, 0, 0.16, 0xf5efe2], [0.075, 0.03, 0.12, 0x9c1c22], [-0.07, 0.035, 0.1, 0x5b8fd4]]) {
      const v = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h, 16), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })));
      v.position.set(x + dx, topoBalcao + h / 2, z + dz);
      cena.add(v);
    }
  }
  const zSul = LOJ.z1 + 0.38, zNorte = LOJ.z0 - 0.38, xLeste = LOJ.x1 - 0.38;
  expositorTercos(cxL + 0.05, zSul, 0);
  grupoVelas(LOJ.x0 + 0.3, zSul);
  miniFatima(LOJ.x0 + 0.35, zNorte, Math.PI);
  quadrinho(cxL + 0.85, zNorte, Math.PI);
  crucifixoPequeno(cxL + 1.25, zNorte, Math.PI);
  miniFatima(xLeste, LOJ.z0 - 0.8, -Math.PI / 2, 0.28);
  grupoVelas(xLeste, czL - 0.95);
  // iluminação quente da lojinha
  for (const [x, z] of [[-2.9, czL + 0.6], [-1.6, czL - 0.6]]) {
    const sp = new THREE.SpotLight(0xffd9a8, 9, 5, 1.1, 0.8, 2);
    sp.position.set(x, LOJ.h - 0.05, z);
    sp.target.position.set(x, 0, z);
    cena.add(sp, sp.target);
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.07, 18), M.luz(0xffe2b8, 6));
    d.rotation.x = Math.PI / 2;
    d.position.set(x, LOJ.h - 0.01, z);
    cena.add(d);
  }
  const luzLoja = new THREE.PointLight(0xffcf9a, 2.2, 5, 2);
  luzLoja.position.set(cxL, 2.2, czL);
  cena.add(luzLoja);

  // ---------- luz geral de fim de tarde ----------
  cena.add(new THREE.HemisphereLight(0x9fb4e0, 0x4a3a30, 1.1));
  const sol = new THREE.DirectionalLight(0xffd2b0, 0.55);
  sol.position.set(-10, 12, 16);
  sol.target.position.set(0, 0, -4);
  if (alta) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
    sol.shadow.bias = -0.0005;
  }
  cena.add(sol, sol.target);
  // luz ambiente interna suave (preenche sombras da nave)
  const preenche = new THREE.PointLight(0xffd6a8, 3, 16, 1.6);
  preenche.position.set(0, 3.2, -7);
  cena.add(preenche);

  // ---------- pós-processamento ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(cena, camera));
  let gtao = null;
  if (alta) {
    gtao = new GTAOPass(cena, camera, 1280, 720);
    gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 16 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    gtao.blendIntensity = 0.85;
    // objetos transparentes (brilhos, vidro, letreiros, a foto recortada de Nossa Senhora) ficam fora do AO
    const esconder = gtao.overrideVisibility.bind(gtao);
    gtao.overrideVisibility = () => {
      esconder();
      cena.traverse((o) => { if (o.isMesh && o.material && o.material.transparent) o.visible = false; });
    };
    composer.addPass(gtao);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 288), 0.42, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- câmera ----------
  const cr = (p0, p1, p2, p3, u) => {
    const u2 = u * u, u3 = u2 * u;
    return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
  };
  function amostrar(chaves, t, idx) {
    let i = 0;
    while (i < chaves.length - 2 && t > chaves[i + 1][0]) i++;
    const k0 = chaves[Math.max(0, i - 1)], k1 = chaves[i], k2 = chaves[i + 1], k3 = chaves[Math.min(chaves.length - 1, i + 2)];
    const u = Math.min(1, Math.max(0, (t - k1[0]) / (k2[0] - k1[0])));
    return [0, 1, 2].map((c) => cr(k0[idx][c], k1[idx][c], k2[idx][c], k3[idx][c], u));
  }
  const alvo = new THREE.Vector3();
  function posicionar(t) {
    const tom = TOMADAS.find((s) => t >= s.ini && t < s.fim) || TOMADAS[TOMADAS.length - 1];
    camera.position.set(...amostrar(tom.chaves, t, 1));
    alvo.set(...amostrar(tom.chaves, t, 2));
    camera.lookAt(alvo);
  }

  function tamanho(w, h, dpr = 1) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 78 : 60;
    camera.updateProjectionMatrix();
  }

  function render(t) {
    for (const v of velas) {
      const f = 0.85 + 0.15 * Math.sin(t * 13 + v.fase) * Math.sin(t * 7.3 + v.fase * 2);
      v.lv.intensity = 0.8 * f;
      v.chama.scale.set(1, 1.8 * f, 1);
    }
    posicionar(Math.min(t, DURACAO));
    composer.render();
  }

  function renderVista(pos, alvoVista, fov) {
    camera.position.set(...pos);
    camera.lookAt(...alvoVista);
    if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    composer.render();
  }

  return { render, renderVista, tamanho, renderer, DURACAO };
}
