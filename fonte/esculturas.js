// Escultura do presbitério: o Cristo crucificado.
// As formas são "esculpidas" com funções de distância (SDF) e viram malha pelo método surface nets,
// o que dá superfícies orgânicas e suaves, como uma imagem de gesso ou madeira policromada.
// Este arquivo não importa o three.js: recebe THREE como parâmetro (o montar.js o embute no tour3d.js).

// ---------- primitivas SDF ----------
const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
function smin(a, b, k) {
  const h = lim(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b + (a - b) * h - k * h * (1 - h);
}
const smax = (a, b, k) => -smin(-a, -b, k);
const esfera = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;
function elipse(x, y, z, cx, cy, cz, rx, ry, rz) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.hypot(px, py, pz), k1 = Math.hypot(px / rx, py / ry, pz / rz);
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
// cápsula afunilada (raio varia de r1 a r2 ao longo do segmento)
function tcap(x, y, z, ax, ay, az, bx, by, bz, r1, r2) {
  const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = lim((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (r1 + (r2 - r1) * h);
}

// ---------- surface nets ----------
export function malhaSDF(THREE, sdf, cor, min, max, passo, refinar = true) {
  const [x0, y0, z0] = min;
  const nx = Math.ceil((max[0] - x0) / passo) + 1, ny = Math.ceil((max[1] - y0) / passo) + 1, nz = Math.ceil((max[2] - z0) / passo) + 1;
  const v = new Float32Array(nx * ny * nz);
  const B = 8;
  for (let bk = 0; bk < nz; bk += B) for (let bj = 0; bj < ny; bj += B) for (let bi = 0; bi < nx; bi += B) {
    const ie = Math.min(bi + B, nx), je = Math.min(bj + B, ny), ke = Math.min(bk + B, nz);
    const cx = x0 + ((bi + ie - 1) / 2) * passo, cy = y0 + ((bj + je - 1) / 2) * passo, cz = z0 + ((bk + ke - 1) / 2) * passo;
    const meia = 0.5 * passo * Math.hypot(ie - bi, je - bj, ke - bk);
    const dc = sdf(cx, cy, cz);
    const pular = Math.abs(dc) > 1.25 * meia + 2.5 * passo;
    for (let k = bk; k < ke; k++) for (let j = bj; j < je; j++) {
      let idx = bi + nx * (j + ny * k);
      for (let i = bi; i < ie; i++, idx++) v[idx] = pular ? dc : sdf(x0 + i * passo, y0 + j * passo, z0 + k * passo);
    }
  }
  const cx1 = nx - 1, cy1 = ny - 1;
  const celula = new Int32Array(cx1 * cy1 * (nz - 1)).fill(-1);
  const pos = [];
  const g = new Float32Array(8);
  const ARESTAS = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const val = v[(i + (c & 1)) + nx * ((j + ((c >> 1) & 1)) + ny * (k + ((c >> 2) & 1)))];
      g[c] = val;
      if (val < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of ARESTAS) {
      if ((g[a] < 0) === (g[b] < 0)) continue;
      const t = g[a] / (g[a] - g[b]);
      sx += (a & 1) + (((b & 1) - (a & 1)) * t);
      sy += ((a >> 1) & 1) + ((((b >> 1) & 1) - ((a >> 1) & 1)) * t);
      sz += ((a >> 2) & 1) + ((((b >> 2) & 1) - ((a >> 2) & 1)) * t);
      n++;
    }
    celula[i + cx1 * (j + cy1 * k)] = pos.length / 3;
    pos.push(x0 + (i + sx / n) * passo, y0 + (j + sy / n) * passo, z0 + (k + sz / n) * passo);
  }
  const ind = [];
  const C = (i, j, k) => celula[i + cx1 * (j + cy1 * k)];
  const quad = (a, b, c, d, dentro) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (dentro) ind.push(a, b, c, a, c, d); else ind.push(a, c, b, a, d, c);
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const p = i + nx * (j + ny * k);
    const d0 = v[p] < 0;
    if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1 && d0 !== (v[p + 1] < 0))
      quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k), d0);
    if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1 && d0 !== (v[p + nx] < 0))
      quad(C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1), d0);
    if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1 && d0 !== (v[p + nx * ny] < 0))
      quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k), d0);
  }
  // um passo de Newton leva cada vértice para a superfície exata
  const e = passo * 0.25;
  if (refinar) for (let q = 0; q < pos.length; q += 3) {
    const x = pos[q], y = pos[q + 1], z = pos[q + 2];
    const d = sdf(x, y, z);
    const gx = (sdf(x + e, y, z) - d) / e, gy = (sdf(x, y + e, z) - d) / e, gz = (sdf(x, y, z + e) - d) / e;
    const g2 = gx * gx + gy * gy + gz * gz;
    if (g2 > 1e-6) {
      const f = lim(d / g2, -passo, passo);
      pos[q] = x - gx * f; pos[q + 1] = y - gy * f; pos[q + 2] = z - gz * f;
    }
  }
  const cores = new Float32Array(pos.length);
  const tmp = new THREE.Color();
  for (let q = 0; q < pos.length; q += 3) {
    tmp.set(cor(pos[q], pos[q + 1], pos[q + 2])).convertSRGBToLinear();
    cores[q] = tmp.r; cores[q + 1] = tmp.g; cores[q + 2] = tmp.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  geo.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(ind, 1) : new THREE.Uint16BufferAttribute(ind, 1));
  geo.computeVertexNormals();
  return geo;
}

// ---------- Cristo crucificado ----------
// origem no centro do peito; braços em x, frente em +z; mãos em y ≈ 0,295
const RL = 0.3, PT = 0.2; // inclinação da cabeça (para a direita de Cristo) e para frente
const cR = Math.cos(RL), sR = Math.sin(RL), cP = Math.cos(PT), sP = Math.sin(PT);
function partesCristo(x, y, z) {
  let tronco = elipse(x, y, z, 0, 0.085, 0.056, 0.112, 0.124, 0.066);
  tronco = smin(tronco, elipse(x, y, z, 0.01, -0.055, 0.058, 0.084, 0.108, 0.056), 0.05);
  tronco = smin(tronco, elipse(x, y, z, 0.02, -0.17, 0.056, 0.09, 0.07, 0.056), 0.04);
  if (y > -0.02 && y < 0.16 && Math.abs(x) > 0.045) tronco += 0.0022 * Math.sin(y * 150) * Math.min(1, (Math.abs(x) - 0.045) * 40);
  let bracos = 1;
  for (const s of [-1, 1]) {
    bracos = smin(bracos, tcap(x, y, z, s * 0.095, 0.172, 0.05, s * 0.3, 0.244, 0.048, 0.043, 0.031), 0.03);
    bracos = smin(bracos, tcap(x, y, z, s * 0.3, 0.244, 0.048, s * 0.445, 0.29, 0.046, 0.031, 0.021), 0.02);
    bracos = smin(bracos, elipse(x, y, z, s * 0.482, 0.296, 0.047, 0.046, 0.025, 0.014), 0.012);
  }
  const pescoco = tcap(x, y, z, 0, 0.165, 0.05, -0.02, 0.225, 0.074, 0.034, 0.028);
  // cabeça em coordenadas locais inclinadas
  const hx0 = x + 0.036, hy0 = y - 0.262, hz0 = z - 0.088;
  const hx1 = cR * hx0 + sR * hy0, hy1 = -sR * hx0 + cR * hy0;
  const hy = cP * hy1 - sP * hz0, hz = sP * hy1 + cP * hz0, hx = hx1;
  let cabeca = elipse(hx, hy, hz, 0, 0, 0, 0.046, 0.059, 0.052);
  cabeca = smin(cabeca, elipse(hx, hy, hz, 0, -0.004, 0.05, 0.008, 0.017, 0.012), 0.008);
  const barba = elipse(hx, hy, hz, 0, -0.047, 0.026, 0.037, 0.036, 0.03);
  cabeca = smax(cabeca, -Math.min(esfera(hx, hy, hz, -0.018, 0.012, 0.052, 0.011), esfera(hx, hy, hz, 0.018, 0.012, 0.052, 0.011)), 0.006);
  let cabelo = elipse(hx, hy, hz, 0, 0.014, -0.02, 0.051, 0.064, 0.048);
  for (const s of [-1, 1]) cabelo = smin(cabelo, tcap(hx, hy, hz, s * 0.038, -0.005, -0.018, s * 0.05, -0.115, -0.03, 0.026, 0.016), 0.02);
  const qx = Math.hypot(hx, hz) - 0.056, qy = hy - 0.028;
  const coroa = Math.hypot(qx, qy) - 0.0085 - 0.0028 * Math.sin(Math.atan2(hx, hz) * 17) * Math.sin(hy * 300);
  let pano = elipse(x, y, z, 0.012, -0.205, 0.058, 0.106, 0.085, 0.07);
  pano += 0.0035 * Math.sin(x * 95 + y * 20);
  pano = smin(pano, tcap(x, y, z, 0.086, -0.16, 0.074, 0.1, -0.3, 0.078, 0.028, 0.016), 0.02);
  let pernas = 1;
  for (const s of [-1, 1]) {
    pernas = smin(pernas, tcap(x, y, z, s * 0.05 + 0.015, -0.2, 0.054, s * 0.03 + 0.012, -0.45, 0.086, 0.056, 0.038), 0.02);
    pernas = smin(pernas, tcap(x, y, z, s * 0.03 + 0.012, -0.45, 0.086, s * 0.012 + 0.004, -0.685, 0.062, 0.037, 0.024), 0.02);
  }
  const pes = Math.min(elipse(x, y, z, -0.004, -0.72, 0.072, 0.026, 0.055, 0.026), elipse(x, y, z, 0.01, -0.705, 0.094, 0.025, 0.052, 0.024));
  return { tronco, bracos, pescoco, cabeca, barba, cabelo, coroa, pano, pernas, pes };
}
function sdfCristo(x, y, z) {
  const p = partesCristo(x, y, z);
  let d = smin(p.tronco, p.bracos, 0.035);
  d = smin(d, p.pescoco, 0.02);
  d = smin(d, p.pernas, 0.03);
  d = smin(d, p.pes, 0.015);
  d = smin(d, smin(p.cabeca, p.barba, 0.015), 0.012);
  d = Math.min(d, p.cabelo);
  d = Math.min(d, p.coroa);
  d = smin(d, p.pano, 0.006);
  return d;
}
function corCristo(x, y, z) {
  const p = partesCristo(x, y, z);
  const lista = [['pele', Math.min(p.tronco, p.bracos, p.pescoco, p.cabeca, p.pernas, p.pes)], ['barba', p.barba], ['cabelo', p.cabelo], ['coroa', p.coroa], ['pano', p.pano]];
  let melhor = lista[0];
  for (const it of lista) if (it[1] < melhor[1] - 0.0015) melhor = it;
  if (melhor[0] === 'pele') {
    const chaga = Math.min(
      Math.hypot(Math.abs(x) - 0.482, y - 0.296) - 0.011,
      Math.hypot(x - 0.004, y + 0.712) - 0.012,
      Math.hypot(x + 0.07, y - 0.02) - 0.011,
    );
    if (chaga < 0 && z > 0.03) return '#8e1d18';
    return '#e8d5bb';
  }
  return { barba: '#5a3a22', cabelo: '#5a3a22', coroa: '#4f4128', pano: '#f2eee4' }[melhor[0]];
}

export function criarCrucificado(THREE, { passo = 0.004 } = {}) {
  const geo = malhaSDF(THREE, sdfCristo, corCristo, [-0.54, -0.78, -0.02], [0.54, 0.36, 0.17], passo);
  const corpo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }));
  corpo.castShadow = corpo.receiveShadow = true;
  const grupo = new THREE.Group();
  grupo.add(corpo);
  const ferro = new THREE.MeshStandardMaterial({ color: 0x2a2521, metalness: 0.6, roughness: 0.4 });
  for (const [x, y, z] of [[-0.482, 0.296, 0.064], [0.482, 0.296, 0.064], [0.004, -0.705, 0.12]]) {
    const prego = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10), ferro);
    prego.rotation.x = Math.PI / 2;
    prego.position.set(x, y, z);
    grupo.add(prego);
  }
  return grupo;
}
