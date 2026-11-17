'use strict';
/*
 * Cœur du découpage en sections (port de sections.py, skill pixel-art-forge), SANS entrée-sortie :
 * il travaille sur des images { width, height, data: Uint8Array RGBA }. Partagé par
 * tools/sections.js (Node, PNG lus par tools/lumiere/png.js) et par la page
 * `npm run lumiere:apercu` (navigateur, images décodées par canvas), qui en embarque une copie :
 * le même code donne les mêmes cartes des deux côtés. Dépend de tools/lumiere/geo.js.
 * Rien ici ne doit utiliser fs, zlib, Buffer ni le DOM.
 */
(function (racine, fabrique) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrique(require('./geo.js'));
  else racine.SectionsCoeur = fabrique(racine.LumiereGeo);
})(typeof self !== 'undefined' ? self : this, function (GEO) {
  // ------------------------------------------------------------ outils (mêmes calculs que Python)
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const N8 = N4.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  const N8_ET_SOI = N8.concat([[0, 0]]);

  // round() de Python 3 : moitié vers le pair
  function pyRound(x) {
    const f = Math.floor(x), r = x - f;
    if (r > 0.5) return f + 1;
    if (r < 0.5) return f;
    return f % 2 === 0 ? f : f + 1;
  }
  const pyMod = (a, n) => ((a % n) + n) % n;

  // Counter de Python : ordre d'insertion ; most_common(1) = premier maximum inséré
  function compter(m, k, v) { m.set(k, (m.get(k) || 0) + (v === undefined ? 1 : v)); }
  function plusFrequent(m) {
    let bk, bv = -Infinity;
    for (const [k, v] of m) if (v > bv) { bk = k; bv = v; }
    return [bk, bv];
  }

  const LAB = new Map();
  function lin(c) { c /= 255.0; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lab(c) {   // c = entier 0xRRGGBB
    let v = LAB.get(c);
    if (v) return v;
    const r = lin((c >> 16) & 255), g = lin((c >> 8) & 255), b = lin(c & 255);
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);
    const fx = f(x), fy = f(y), fz = f(z);
    v = [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
    LAB.set(c, v);
    return v;
  }
  const dist3 = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  const hexc = (c) => c.toString(16).padStart(6, '0');
  const parseHex = (s) => parseInt(s.trim().replace(/^#/, '').slice(0, 6), 16);
  const rgbInt = (d, i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];

  // Ordre de parcours de sections.py : ses ensembles de pixels sont des `set` de tuples (x, y), parcourus
  // dans l'ordre de la table de hachage de CPython (3.12+, 64 bits). Les égalités (vote majoritaire,
  // remplissage des parties) se départagent dans cet ordre : on le reproduit pour que la sortie soit
  // celle du Python au pixel près (avec un simple ordre ligne par ligne : 5 à 15 % des sections
  // changeaient, sans être meilleures ni pires).
  const M64 = (1n << 64n) - 1n;
  const XXP1 = 11400714785074694791n, XXP2 = 14029467366897019727n, XXP5 = 2870177450012600261n;
  function hashTuple(x, y) {   // tuplehash() de CPython pour (x, y), hash(int) = int
    let acc = XXP5;
    for (const lane of [BigInt(x), BigInt(y)]) {
      acc = (acc + lane * XXP2) & M64;
      acc = ((acc << 31n) | (acc >> 33n)) & M64;
      acc = (acc * XXP1) & M64;
    }
    acc = (acc + (2n ^ (XXP5 ^ 3527539n))) & M64;
    return acc === M64 ? 1546275796n : acc;
  }
  function ordreSet(pixels, w) {   // pixels (indices y * w + x) dans l'ordre d'insertion -> ordre du set
    let mask = 7n, table = new Array(8).fill(null), fill = 0;
    const inserer = (tab, msk, e) => {   // set_insert_clean() : sondage linéaire de 9 puis perturbation
      let perturb = e.h, i = e.h & msk;
      for (;;) {
        if (tab[Number(i)] === null) { tab[Number(i)] = e; return; }
        if (i + 9n <= msk) for (let j = 1n; j <= 9n; j++) if (tab[Number(i + j)] === null) { tab[Number(i + j)] = e; return; }
        perturb >>= 5n;
        i = (i * 5n + 1n + perturb) & msk;
      }
    };
    for (const p of pixels) {
      inserer(table, mask, { p, h: hashTuple(p % w, (p - (p % w)) / w) });
      fill++;
      if (BigInt(fill) * 5n >= mask * 3n) {   // set_table_resize()
        const mini = fill > 50000 ? fill * 2 : fill * 4;
        let taille = 8;
        while (taille <= mini) taille *= 2;
        const old = table;
        mask = BigInt(taille - 1); table = new Array(taille).fill(null);
        for (const e of old) if (e) inserer(table, mask, e);
      }
    }
    return table.filter(Boolean).map((e) => e.p);
  }

  // ------------------------------------------------------------ table des sections
  // code -> (nom, couleur franche, direction dans le plan (x droite, y haut) ou null, inclinaison)
  // inclinaison : 0 = face au spectateur, 40 deg = incliné, 68 deg = rasant (bord tourné).
  const DIRS = [['droite', 0], ['haut-droite', 45], ['haut', 90], ['haut-gauche', 135],
    ['gauche', 180], ['bas-gauche', 225], ['bas', 270], ['bas-droite', 315]];
  const TILT_INC = 40.0, TILT_RAS = 68.0;
  const GBLUR_MIN = 4.0, GBLUR_REL = 0.1, GPAD = 12;
  const RAMP_SPAN = 48.0;
  const PART_DL = 12.0, PART_MIN = 20, PART_PART = 0.15;
  const W_GLOBAL = 0.7, W_PART = 0.55, W_SHADE = 0.3;

  function hsv(hdeg, s, v) {   // colorsys.hsv_to_rgb puis round()
    const h = pyMod(hdeg, 360) / 360.0;
    let i = Math.trunc(h * 6.0);
    const f = h * 6.0 - i, p = v * (1.0 - s), q = v * (1.0 - s * f), t = v * (1.0 - s * (1.0 - f));
    i %= 6;
    const rgb = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
    return rgb.map((c) => pyRound(c * 255));
  }
  const SECTIONS = [['face', [200, 200, 200], null, 0.0]];
  for (const [nom, ang] of DIRS) SECTIONS.push([nom + ' incline', hsv(ang, 0.55, 0.98), ang, TILT_INC]);
  for (const [nom, ang] of DIRS) SECTIONS.push([nom + ' rasant', hsv(ang, 0.95, 0.62), ang, TILT_RAS]);

  // Grands sprites (s > 1) : 17 sections ne donnent qu'une bague intermédiaire sur un sprite de
  // 300 px. Table FINE : la face (code 0) + 3 bagues (25, 50, 70 deg) x 12 azimuts (tous les 30 deg),
  // codes 17 à 52. Même code couleur : teinte = direction, de pâle (peu incliné) à foncé (rasant).
  const AZ_FIN = 12, TILTS_FIN = [[25.0, 'peu incline', 0.30, 1.0], [50.0, 'incline', 0.65, 0.92], [70.0, 'rasant', 0.95, 0.58]];
  const NOMS_AZ = { 0: 'droite', 90: 'haut', 180: 'gauche', 270: 'bas' };
  const FIN0 = SECTIONS.length;
  for (const [tilt, nomT, sat, val] of TILTS_FIN) {
    for (let k = 0; k < AZ_FIN; k++) {
      const ang = k * 360 / AZ_FIN;
      SECTIONS.push([`${NOMS_AZ[ang] || ang + ' deg'} ${nomT} (fin)`, hsv(ang, sat, val), ang, tilt]);
    }
  }
  const CODES_17 = SECTIONS.map((_, i) => i).filter((i) => i < FIN0);
  const CODES_FIN = [0].concat(SECTIONS.map((_, i) => i).filter((i) => i >= FIN0));

  function sectionNormal(code) {
    const [, , ang, tilt] = SECTIONS[code];
    if (ang === null) return [0.0, 0.0, 1.0];
    const t = tilt * Math.PI / 180, a = ang * Math.PI / 180;
    return [Math.sin(t) * Math.cos(a), Math.sin(t) * Math.sin(a), Math.cos(t)];
  }
  const encodeNormal = (n) => n.map((c) => Math.max(0, Math.min(255, pyRound((c * 0.5 + 0.5) * 255))));

  function quantize(nx, ny, fin) {
    const m = Math.hypot(nx, ny);
    if (fin) {   // face < 0,22 < 25 deg < 0,50 < 50 deg < 0,85 < 70 deg
      if (m < 0.22) return 0;
      const k = pyMod(pyRound(Math.atan2(ny, nx) * (180.0 / Math.PI) / (360 / AZ_FIN)), AZ_FIN);
      return FIN0 + (m < 0.50 ? 0 : m < 0.85 ? 1 : 2) * AZ_FIN + k;
    }
    if (m < 0.30) return 0;
    const k = pyMod(pyRound(Math.atan2(ny, nx) * (180.0 / Math.PI) / 45.0), 8);
    return m < 0.72 ? 1 + k : 9 + k;
  }
  // fin : table fine des grands sprites (sinon les 17 sections d'origine)
  function nearestCode(rgb, fin) {
    let best = 0, bv = Infinity;
    for (const i of fin ? CODES_FIN : CODES_17) {
      const c = SECTIONS[i][1];
      const v = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2;
      if (v < bv) { bv = v; best = i; }
    }
    return best;
  }

  // ------------------------------------------------------------ flou gaussien de Pillow (exact)
  // ImageFilter.GaussianBlur = 3 passes de flou-boîte à rayon fractionnaire (BoxBlur.c), en flottants
  // 32 bits et entiers 8 bits comme le C : la pente de la silhouette floutée sort identique au Python.
  const f32 = Math.fround;
  function rayonGauss(radius, passes) {
    const r = f32(radius);
    const sigma2 = f32(f32(r * r) / passes);
    const L = f32(Math.sqrt(12.0 * sigma2 + 1.0));
    const l = f32(Math.floor((L - 1.0) / 2.0));
    let a = f32(f32(f32(2 * l) + 1) * f32(f32(l * f32(l + 1)) - f32(3 * sigma2)));
    a = f32(a / f32(6 * f32(sigma2 - f32(f32(l + 1) * f32(l + 1)))));
    return f32(l + a);
  }
  function ligneBoite(lineIn, lineOut, lastx, radius, edgeA, edgeB, ww, fw) {
    let acc = lineIn[0] * (radius + 1);
    for (let x = 0; x < edgeA - 1; x++) acc += lineIn[x];
    acc += lineIn[lastx] * (radius - edgeA + 1);
    const save = (x, bulk) => { lineOut[x] = Math.floor((bulk + 8388608) / 16777216); };
    if (edgeA <= edgeB) {
      for (let x = 0; x < edgeA; x++) { acc += lineIn[x + radius] - lineIn[0]; save(x, acc * ww + (lineIn[0] + lineIn[x + radius + 1]) * fw); }
      for (let x = edgeA; x < edgeB; x++) {
        acc += lineIn[x + radius] - lineIn[x - radius - 1];
        save(x, acc * ww + (lineIn[x - radius - 1] + lineIn[x + radius + 1]) * fw);
      }
      for (let x = edgeB; x <= lastx; x++) {
        acc += lineIn[lastx] - lineIn[x - radius - 1];
        save(x, acc * ww + (lineIn[x - radius - 1] + lineIn[lastx]) * fw);
      }
    } else {
      for (let x = 0; x < edgeB; x++) { acc += lineIn[x + radius] - lineIn[0]; save(x, acc * ww + (lineIn[0] + lineIn[x + radius + 1]) * fw); }
      for (let x = edgeB; x < edgeA; x++) { acc += lineIn[lastx] - lineIn[0]; save(x, acc * ww + (lineIn[0] + lineIn[lastx]) * fw); }
      for (let x = edgeA; x <= lastx; x++) {
        acc += lineIn[lastx] - lineIn[x - radius - 1];
        save(x, acc * ww + (lineIn[x - radius - 1] + lineIn[lastx]) * fw);
      }
    }
  }
  function flouLignes(buf, W, H, floatRadius) {   // ImagingHorizontalBoxBlur, en place
    const radius = Math.trunc(floatRadius);
    const ww = Math.trunc(f32(16777216 / f32(f32(floatRadius * 2) + 1)));
    const fw = Math.floor((16777216 - (radius * 2 + 1) * ww) / 2);
    const edgeA = Math.min(radius + 1, W), edgeB = Math.max(W - radius - 1, 0);
    const lin = new Uint8Array(W), lout = new Uint8Array(W);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) lin[x] = buf[y * W + x];
      ligneBoite(lin, lout, W - 1, radius, edgeA, edgeB, ww, fw);
      for (let x = 0; x < W; x++) buf[y * W + x] = lout[x];
    }
  }
  function flouGaussien(src, W, H, radius) {   // image L (Uint8Array W*H) -> nouvelle image floutée
    const r = rayonGauss(radius, 3);
    const out = Uint8Array.from(src);
    if (r !== 0) for (let i = 0; i < 3; i++) flouLignes(out, W, H, r);
    if (r !== 0) {
      const t = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) t[x * H + y] = out[y * W + x];
      for (let i = 0; i < 3; i++) flouLignes(t, H, W, r);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = t[x * H + y];
    }
    return out;
  }

  // ------------------------------------------------------------ analyse des couleurs
  const hueDiff = (a, b) => { const d = pyMod(Math.abs(a - b), 360); return Math.min(d, 360 - d); };

  function clusterRamps(colors, counts, adj, dark, prot, forced) {
    const feat = new Map();
    for (const c of colors) {
      const [L, a, b] = lab(c);
      feat.set(c, [Math.atan2(b, a) * (180.0 / Math.PI), Math.hypot(a, b) / Math.max(L, 8.0), Math.hypot(a, b)]);
    }
    const parent = new Map(colors.map((c) => [c, c]));
    const find = (c) => {
      while (parent.get(c) !== c) { parent.set(c, parent.get(parent.get(c))); c = parent.get(c); }
      return c;
    };
    for (const group of forced) {
      const g = group.filter((c) => parent.has(c));
      for (const c of g.slice(1)) parent.set(find(c), find(g[0]));
    }
    const pool = colors.filter((c) => !dark.has(c) && !prot.has(c));
    const inPool = new Set(pool);
    const total = pool.reduce((s, c) => s + counts.get(c), 0) || 1;
    const rare = Math.max(6, Math.trunc(0.006 * total));
    const span = new Map(colors.map((c) => [c, [lab(c)[0], lab(c)[0]]]));
    const pairs = [];
    for (const [k, v] of adj) {
      const a = Math.floor(k / 16777216), b = k % 16777216;
      if (inPool.has(a) && inPool.has(b)) pairs.push([v / Math.sqrt(counts.get(a) * counts.get(b)), a, b]);
    }
    pairs.sort((p, q) => (q[0] - p[0]) || (q[1] - p[1]) || (q[2] - p[2]));
    for (const [s, a, b] of pairs) {
      if (counts.get(a) < rare || counts.get(b) < rare) continue;
      const fa = feat.get(a), fb = feat.get(b);
      const grey = fa[2] < 8 && fb[2] < 8;
      if (s > 0.06 && (grey || (hueDiff(fa[0], fb[0]) < 15 && Math.abs(fa[1] - fb[1]) < 0.17))) {
        const ra = find(a), rb = find(b);
        if (ra === rb) continue;
        const lo = Math.min(span.get(ra)[0], span.get(rb)[0]), hi = Math.max(span.get(ra)[1], span.get(rb)[1]);
        if (hi - lo > RAMP_SPAN) continue;
        parent.set(ra, rb);
        span.set(rb, [lo, hi]);
      }
    }
    // couleurs rares : rejoignent la rampe avec laquelle elles se touchent le plus
    const parCompte = pool.map((c, i) => [c, i]).sort((p, q) => (counts.get(p[0]) - counts.get(q[0])) || (p[1] - q[1]));
    for (const [c] of parCompte) {
      if (counts.get(c) >= rare) continue;
      const best = new Map();
      for (const [k, v] of adj) {
        const a = Math.floor(k / 16777216), b = k % 16777216;
        const o = a === c ? b : b === c ? a : null;
        if (o !== null && inPool.has(o) && counts.get(o) >= rare) compter(best, find(o), v);
      }
      if (best.size) parent.set(find(c), plusFrequent(best)[0]);
    }
    const ramps = new Map();
    for (const c of pool) {
      const r = find(c);
      if (!ramps.has(r)) ramps.set(r, []);
      ramps.get(r).push(c);
    }
    return [...ramps.values()];
  }

  function rampBase(ramp, counts) {
    const n = ramp.reduce((s, c) => s + counts.get(c), 0);
    const m = [0, 1, 2].map((i) => ramp.reduce((s, c) => s + lab(c)[i] * counts.get(c), 0) / n);
    let best = ramp[0], bv = Infinity;
    for (const c of ramp) { const v = dist3(lab(c), m); if (v < bv) { bv = v; best = c; } }
    return best;
  }

  // ------------------------------------------------------------ géométrie
  function offsetsTries(R) {
    const offs = [];
    for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) if (dx || dy) offs.push([dx, dy]);
    return offs.map((o, i) => [o, i]).sort((p, q) => (p[0][0] ** 2 + p[0][1] ** 2) - (q[0][0] ** 2 + q[0][1] ** 2) || p[1] - q[1]).map((p) => p[0]);
  }
  // Pour chaque pixel de cand : distance et vecteur pixel -> bord le plus proche (moyenne à égalité)
  function nearestVectors(w, isBorder, cand, R, D, VX, VY) {
    const offs = offsetsTries(R);
    for (const p of cand) {
      const x = p % w, y = (p - x) / w;
      let f0 = -1, sx = 0, sy = 0, n = 0;
      for (const [dx, dy] of offs) {
        if (isBorder(x + dx, y + dy, p)) {
          const d2 = dx * dx + dy * dy;
          if (f0 < 0) { f0 = d2; sx = dx; sy = dy; n = 1; } else if (d2 === f0) { sx += dx; sy += dy; n++; } else break;
        }
      }
      if (f0 < 0) { D[p] = R + 1; VX[p] = 0; VY[p] = 0; } else { D[p] = Math.sqrt(f0); VX[p] = sx / n; VY[p] = sy / n; }
    }
  }

  // Codes de section : Int32Array (-1 = absent) + ordre d'insertion (celui du dict Python)
  function heriterBord(codes, opq, w, h) {
    // le bord de la silhouette prend la section majoritaire des pixels INTERIEURS voisins
    const dans = (x, y) => x >= 0 && y >= 0 && x < w && y < h && opq[y * w + x];
    const ring = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) {
      if (!opq[p]) continue;
      const x = p % w, y = (p - x) / w;
      for (const [dx, dy] of N8) if (!dans(x + dx, y + dy)) { ring[p] = 1; break; }
    }
    const out = Int32Array.from(codes);
    for (let p = 0; p < w * h; p++) {
      if (!ring[p]) continue;
      const x = p % w, y = (p - x) / w;
      for (const r of [1, 2, 3]) {
        const cnt = new Map();
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const X = x + dx, Y = y + dy;
            if (dans(X, Y) && !ring[Y * w + X]) compter(cnt, codes[Y * w + X]);
          }
        }
        if (cnt.size) { out[p] = plusFrequent(cnt)[0]; break; }
      }
    }
    return out;
  }

  function modeFilter(codes, ordre, w, h, regall, keep, iters) {
    for (let it = 0; it < iters; it++) {
      const nw = Int32Array.from(codes);
      for (const p of ordre) {
        if (keep[p]) continue;
        const x = p % w, y = (p - x) / w, c = codes[p];
        const cnt = new Map();
        for (const [dx, dy] of N8_ET_SOI) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (codes[q] >= 0 && regall[q] === regall[p] && !keep[q]) compter(cnt, codes[q], dx === 0 && dy === 0 ? 2 : 1);
        }
        if (cnt.size) {
          const [best, v] = plusFrequent(cnt);
          if (v >= 5 && best !== c) nw[p] = best;
        }
      }
      codes = nw;
    }
    return codes;
  }

  function mergeSmall(codes, ordre, w, h, minsize, keep) {
    // zones (pixels connexes de même code) plus petites que minsize -> code voisin majoritaire
    const seen = new Uint8Array(w * h);
    for (const p of ordre) {
      if (seen[p] || keep[p]) continue;
      const c = codes[p];
      const comp = [p];
      seen[p] = 1;
      for (let k = 0; k < comp.length; k++) {
        const x = comp[k] % w, y = (comp[k] - x) / w;
        for (const [dx, dy] of N4) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const r = Y * w + X;
          if (codes[r] >= 0 && !seen[r] && codes[r] === c && !keep[r]) { seen[r] = 1; comp.push(r); }
        }
      }
      if (comp.length < minsize) {
        const cs = new Set(comp), cnt = new Map();
        for (const q of comp) {
          const x = q % w, y = (q - x) / w;
          for (const [dx, dy] of N4) {
            const X = x + dx, Y = y + dy;
            if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
            const r = Y * w + X;
            if (codes[r] >= 0 && !cs.has(r) && !keep[r]) compter(cnt, codes[r]);
          }
        }
        if (cnt.size) { const nc = plusFrequent(cnt)[0]; for (const r of comp) codes[r] = nc; }
      }
    }
    return codes;
  }

  // ------------------------------------------------------------ échelle du sprite
  // Réglages en pixels (zones, lissages, contour, carte contre-jour) pensés pour les sprites de la
  // démo (Agarica 67 x 94, loup, grizzly, crapaud : racine de la surface opaque 49 à 87 px). Un
  // sprite plus grand (Kainati, ~250) les multiplie par s = max(1, racine(surface opaque) / 96),
  // médiane sur les frames d'une animation ; s = 1 : calcul strictement identique à sections.py.
  const ECHELLE_REF = 96;
  function echelleSprite(ims) {
    const r = ims.map((im) => {
      let a = 0;
      for (let p = 0; p < im.width * im.height; p++) if (im.data[p * 4 + 3] >= 128) a++;
      return Math.sqrt(a);
    }).sort((x, y) => x - y);
    const m = r[Math.floor(r.length / 2)] || 0;
    return Math.max(1, Math.round((m / ECHELLE_REF) * 100) / 100);
  }
  // longueur (px) et surface (px²) à l'échelle s ; s = 1 : valeur d'origine telle quelle
  const aL = (v, s) => (s > 1 ? Math.round(v * s) : v);
  const aS = (v, s) => (s > 1 ? Math.round(v * s * s) : v);

  // ------------------------------------------------------------ analyse (sections.py analyse())
  function analyse(im, garder, rampes, peint, tailleRef, echelle) {
    const s = echelle > 1 ? echelle : 1;
    const w = im.width, h = im.height, d = im.data, NP = w * h;
    const opq = new Uint8Array(NP), ligneParLigne = [];
    const col = new Int32Array(NP).fill(-1);
    for (let p = 0; p < NP; p++) if (d[p * 4 + 3] >= 128) { opq[p] = 1; ligneParLigne.push(p); col[p] = rgbInt(d, p * 4); }
    const opqList = ordreSet(ligneParLigne, w);
    const dans = (x, y) => x >= 0 && y >= 0 && x < w && y < h && opq[y * w + x] === 1;
    const counts = new Map();
    for (const p of opqList) compter(counts, col[p]);
    const colors = [...counts.keys()];
    const adj = new Map();
    for (const p of opqList) {
      const x = p % w, y = (p - x) / w;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (!dans(x + dx, y + dy)) continue;
        const q = (y + dy) * w + x + dx;
        if (col[q] !== col[p]) {
          const a = Math.min(col[p], col[q]), b = Math.max(col[p], col[q]);
          compter(adj, a * 16777216 + b);
        }
      }
    }
    const L = new Map(colors.map((c) => [c, lab(c)[0]]));
    const chroma = new Map(colors.map((c) => [c, Math.hypot(lab(c)[1], lab(c)[2])]));
    const n = opqList.length;

    // lignes sombres : la ou les couleurs les plus sombres (contour + traits intérieurs)
    let darkest = colors[0];
    for (const c of colors) if (L.get(c) < L.get(darkest)) darkest = c;
    let lineC = null;
    for (const c of colors) if (L.get(c) < 22 && (lineC === null || counts.get(c) > counts.get(lineC))) lineC = c;
    if (lineC === null) lineC = darkest;
    const dark = new Set(colors.filter((c) => L.get(c) <= L.get(lineC) + 3.5));

    // détails gardés : couleurs rares et très saturées (œil) + couleurs rares collées à elles
    const prot = new Uint8Array(NP);
    const rare = Math.max(4, Math.trunc(0.01 * n));
    const chromas = opqList.map((p) => chroma.get(col[p])).sort((a, b) => a - b);
    const medC = chromas[Math.floor(n / 2)];
    const seeds = new Set(colors.filter((c) => counts.get(c) < rare && chroma.get(c) > Math.max(45, 1.4 * medC)));
    for (const g of garder) seeds.add(parseHex(g));
    let front = opqList.filter((p) => seeds.has(col[p]));
    for (const p of front) prot[p] = 1;
    for (let it = 0; it < 2; it++) {
      const nxt = new Set();
      for (const p of front) {
        const x = p % w, y = (p - x) / w;
        for (const [dx, dy] of N8) {
          if (!dans(x + dx, y + dy)) continue;
          const q = (y + dy) * w + x + dx;
          if (!prot[q] && counts.get(col[q]) < rare) nxt.add(q);
        }
      }
      for (const q of nxt) prot[q] = 1;
      front = [...nxt];
    }
    const pc = new Map();
    for (const p of opqList) if (prot[p]) compter(pc, col[p]);
    const protC = new Set([...pc].filter(([c, v]) => v === counts.get(c)).map(([c]) => c));
    const forced = rampes.map((g) => g.split(',').filter((t) => t.trim()).map(parseHex));
    const ramps = clusterRamps(colors, counts, adj, dark, protC, forced);
    const rampOf = new Map();
    ramps.forEach((r, i) => r.forEach((c) => rampOf.set(c, i)));
    const base = ramps.map((r) => rampBase(r, counts));

    const line = new Uint8Array(NP);
    for (const p of opqList) if (dark.has(col[p]) && !prot[p]) line[p] = 1;

    // matière de surface vs motif (taches) : un motif touche surtout une autre matière, peu les lignes
    const contact = ramps.map(() => new Map());
    for (const p of opqList) {
      if (line[p] || prot[p]) continue;
      const x = p % w, y = (p - x) / w, r = rampOf.get(col[p]);
      for (const [dx, dy] of N4) {
        if (!dans(x + dx, y + dy)) { compter(contact[r], 'vide'); continue; }
        const q = (y + dy) * w + x + dx;
        if (line[q]) compter(contact[r], 'ligne');
        else if (!prot[q] && rampOf.get(col[q]) !== r) compter(contact[r], rampOf.get(col[q]));
      }
    }
    let seg = ramps.map((_, i) => i);
    contact.forEach((cnt, r) => {
      const tot = [...cnt.values()].reduce((s, v) => s + v, 0) || 1;
      let bk = null, bv = -1;
      for (const [k, v] of cnt) if (typeof k === 'number' && v > bv) { bk = k; bv = v; }
      if (bk !== null && ((cnt.get('ligne') || 0) + (cnt.get('vide') || 0)) / tot < 0.35 && bv / tot > 0.45) seg[r] = bk;
    });
    for (let i = 0; i < seg.length; i++) seg = seg.map((s) => seg[s]);

    // parties : remplissage sur les pixels non-ligne, coupé par les lignes et les matières de surface
    const body = opqList.filter((p) => !line[p]);
    const inBody = new Uint8Array(NP);
    const segm = new Int32Array(NP).fill(-9);
    for (const p of body) { inBody[p] = 1; segm[p] = prot[p] ? -1 : seg[rampOf.get(col[p])]; }
    const barrier = Uint8Array.from(line);
    // traits épaissis d'1 px (fermer les fuites) ; grand sprite : de round(s) px (disque), les
    // traits de fourrure, mèches et plis y ont des trous de plusieurs pixels
    const rTrait = aL(1, s), voisTrait = [];
    for (let dy = -rTrait; dy <= rTrait; dy++) for (let dx = -rTrait; dx <= rTrait; dx++) if ((dx || dy) && (rTrait === 1 || dx * dx + dy * dy <= rTrait * rTrait)) voisTrait.push([dx, dy]);
    for (const p of opqList) {
      if (!line[p]) continue;
      const x = p % w, y = (p - x) / w;
      for (const [dx, dy] of rTrait === 1 ? N8 : voisTrait) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < w && Y < h && inBody[Y * w + X]) barrier[Y * w + X] = 1;
      }
    }
    if (s > 1) for (const p of massesOmbrage({ w, h, NP, s, body, prot, col, rampOf, ramps, L, counts, barrier })) barrier[p] = 1;
    const region = new Int32Array(NP).fill(-1);
    const regOrdre = [];
    let rid = 0;
    for (const p of body) {
      if (region[p] >= 0 || barrier[p]) continue;
      const stack = [p];
      region[p] = rid; regOrdre.push(p);
      while (stack.length) {
        const s = stack.pop(), x = s % w, y = (s - x) / w;
        for (const [dx, dy] of N4) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          // comparaison avec la GRAINE p (comme sections.py)
          if (inBody[q] && region[q] < 0 && !barrier[q] && (segm[q] === segm[p] || segm[q] === -1 || segm[p] === -1)) {
            region[q] = rid; regOrdre.push(q); stack.push(q);
          }
        }
      }
      rid++;
    }
    // Petites parties fondues dans leur voisine majoritaire, la plus petite d'abord (à taille égale :
    // la première apparue dans regOrdre), une à la fois, comme sections.py. Même résultat que de
    // tout recompter après chaque fusion, mais en tenant tailles et membres à jour (sinon le temps
    // explose sur un grand sprite : des milliers de fusions x tous les pixels).
    function absorb(minsize) {
      const pos = new Map(), taille = new Map(), premier = new Map(), membres = new Map();
      regOrdre.forEach((p, i) => {
        if (!pos.has(p)) pos.set(p, i);
        const r = region[p];
        compter(taille, r);
        if (!premier.has(r)) { premier.set(r, i); membres.set(r, []); }
      });
      for (const p of pos.keys()) membres.get(region[p]).push(p);
      for (;;) {
        const petites = [...taille].filter((e) => e[1] < minsize).map((e) => [e[0], e[1], premier.get(e[0])])
          .sort((x, y) => (x[1] - y[1]) || (x[2] - y[2]));
        let changed = false;
        for (const [r] of petites) {
          const members = membres.get(r).slice().sort((x, y) => pos.get(x) - pos.get(y));
          const cnt = new Map();
          for (const p of members) {
            const x = p % w, y = (p - x) / w;
            for (const [dx, dy] of N8) {
              const X = x + dx, Y = y + dy;
              if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
              const q = Y * w + X;
              if (region[q] >= 0 && region[q] !== r) compter(cnt, region[q]);
            }
          }
          if (cnt.size) {
            const nr = plusFrequent(cnt)[0];
            for (const p of members) region[p] = nr;
            taille.set(nr, taille.get(nr) + taille.get(r)); taille.delete(r);
            premier.set(nr, Math.min(premier.get(nr), premier.get(r))); premier.delete(r);
            for (const p of members) membres.get(nr).push(p);
            membres.delete(r);
            changed = true;
            break;
          }
        }
        if (!changed) return;
      }
    }
    absorb(aS(12, s));
    // pixels de la bordure épaissie : rendus à la partie voisine de même matière (sinon la plus proche)
    let todo = body.filter((p) => region[p] < 0);
    for (let it = 0; it < aL(4, s); it++) {
      const rest = [];
      for (const p of todo) {
        const x = p % w, y = (p - x) / w;
        const same = new Map(), other = new Map();
        for (const [dx, dy] of N8) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (region[q] >= 0) compter(segm[q] === segm[p] ? same : other, region[q]);
        }
        const pick = same.size ? same : other;
        if (pick.size) { region[p] = plusFrequent(pick)[0]; regOrdre.push(p); } else rest.push(p);
      }
      todo = rest;
    }
    for (const p of todo) { region[p] = rid++; regOrdre.push(p); }
    absorb(aS(12, s));

    // vecteurs vers le bord de la partie (bombé) et vers le vide (contour extérieur)
    const nD = new Float64Array(NP), nVX = new Float64Array(NP), nVY = new Float64Array(NP);
    nearestVectors(w, (X, Y, p) => {
      if (!dans(X, Y)) return true;
      const q = Y * w + X;
      if (line[q]) return true;
      return region[q] >= 0 && region[q] !== region[p];
    }, body, aL(7, s), nD, nVX, nVY);
    const oD = new Float64Array(NP), oVX = new Float64Array(NP), oVY = new Float64Array(NP);
    nearestVectors(w, (X, Y) => !dans(X, Y), opqList, aL(6, s), oD, oVX, oVY);
    const nReg = rid;
    const dmax = new Float64Array(nReg);
    for (const p of body) dmax[region[p]] = Math.max(dmax[region[p]], nD[p]);
    const dmaxPartie = s > 1 ? profondeurParties(region, body, w, h, nReg) : null;

    // indice d'ombrage : écart de luminance à la moyenne de la rampe, lissé dans la partie
    const rmean = [], rstd = [];
    ramps.forEach((r) => {
      const tot = r.reduce((s, c) => s + counts.get(c), 0);
      const m = r.reduce((s, c) => s + L.get(c) * counts.get(c), 0) / tot;
      const sd = Math.sqrt(r.reduce((s, c) => s + (L.get(c) - m) ** 2 * counts.get(c), 0) / tot) || 1.0;
      rmean.push(m); rstd.push(Math.max(sd, 6.0));
    });
    const off = new Float64Array(NP), hasOff = new Uint8Array(NP);
    for (const p of body) {
      if (prot[p]) continue;
      const r = rampOf.get(col[p]);
      off[p] = (L.get(col[p]) - rmean[r]) / rstd[r]; hasOff[p] = 1;
    }
    const soff = new Float64Array(NP), rso = aL(2, s);
    for (const p of body) {
      const x = p % w, y = (p - x) / w;
      let s = 0, k = 0;
      for (let dx = -rso; dx <= rso; dx++) {
        for (let dy = -rso; dy <= rso; dy++) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (hasOff[q] && region[q] === region[p]) { s += off[q]; k++; }
        }
      }
      soff[p] = k ? s / k : 0.0;
    }
    const regOff = new Float64Array(nReg), regN = new Float64Array(nReg);
    for (const p of body) { regOff[region[p]] += soff[p]; regN[region[p]] += 1; }
    const lx = -Math.sqrt(0.5), ly = Math.sqrt(0.5);   // lumière d'origine : haut-gauche (y haut)

    // volume d'ensemble : la silhouette floutée est une colline ; sa pente = bombé global
    const tr = tailleRef || [w, h];
    const gblur = Math.max(GBLUR_MIN * s, GBLUR_REL * Math.min(tr[0], tr[1]));
    const gp = Math.trunc(2.5 * gblur) + 2;
    const MW = w + 2 * gp, MH = h + 2 * gp;
    const mask = new Uint8Array(MW * MH);
    for (const p of opqList) { const x = p % w, y = (p - x) / w; mask[(y + gp) * MW + x + gp] = 255; }
    const hill = flouGaussien(mask, MW, MH, gblur);
    const gX = new Float64Array(NP), gY = new Float64Array(NP);
    const mags = [];
    for (const p of opqList) {
      const x = p % w, y = (p - x) / w, X = x + gp, Y = y + gp;
      gX[p] = -(hill[Y * MW + X + 1] - hill[Y * MW + X - 1]) / 2.0;
      gY[p] = (hill[(Y + 1) * MW + X] - hill[(Y - 1) * MW + X]) / 2.0;
      mags.push(Math.hypot(gX[p], gY[p]));
    }
    mags.sort((a, b) => a - b);
    const gmax = mags[Math.trunc(mags.length * 0.97)] || 1.0;

    // bombé de chaque partie : la partie (sans ses traits) floutée seule
    const pgX = new Float64Array(NP), pgY = new Float64Array(NP);
    const membres = Array.from({ length: nReg }, () => []);
    for (const p of regOrdre) membres[region[p]].push(p);
    const gpad = aL(GPAD, s);
    const PW = w + 2 * gpad, PH = h + 2 * gpad;
    // flou de la partie sur un rectangle autour d'elle seulement (le flou de Pillow est en entiers :
    // même résultat que sur toute l'image tant que la marge couvre son étalement, 3 passes)
    for (let r = 0; r < nReg; r++) {
      const ms = membres[r];
      if (!ms.length) continue;
      // grand sprite : dôme sur TOUTE la partie (rayon = moitié de sa profondeur réelle), plusieurs
      // bagues du bord vers le centre ; sinon bombé limité au bord (3 px), comme sections.py
      const rad = dmaxPartie ? Math.max(1.2 * s, 0.5 * dmaxPartie[r]) : Math.max(1.2 * s, Math.min(3.0 * s, dmax[r] * 0.6));
      let bx0 = w, by0 = h, bx1 = -1, by1 = -1;
      for (const p of ms) { const x = p % w, y = (p - x) / w; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
      const M = gpad + 3 * (Math.ceil(rad) + 2);
      const CX0 = Math.max(0, bx0 + gpad - M), CY0 = Math.max(0, by0 + gpad - M);
      const CW = Math.min(PW - 1, bx1 + gpad + M) - CX0 + 1, CH = Math.min(PH - 1, by1 + gpad + M) - CY0 + 1;
      const pm = new Uint8Array(CW * CH);
      for (const p of ms) { const x = p % w, y = (p - x) / w; pm[(y + gpad - CY0) * CW + x + gpad - CX0] = 255; }
      const ph = flouGaussien(pm, CW, CH, rad);
      let pmx = 0;
      for (const p of ms) {
        const x = p % w, y = (p - x) / w, X = x + gpad - CX0, Y = y + gpad - CY0;
        pgX[p] = -(ph[Y * CW + X + 1] - ph[Y * CW + X - 1]) / 2.0;
        pgY[p] = (ph[(Y + 1) * CW + X] - ph[(Y - 1) * CW + X]) / 2.0;
        pmx = Math.max(pmx, Math.hypot(pgX[p], pgY[p]));
      }
      pmx = pmx || 1.0;
      for (const p of ms) { pgX[p] /= pmx; pgY[p] /= pmx; }
    }

    let codes = new Int32Array(NP).fill(-1);
    const ordre = [];
    for (const p of body) {
      const r = region[p];
      const gx = gX[p], gy = gY[p];
      const gm = Math.min(1.0, Math.hypot(gx, gy) / gmax);
      const gn = Math.hypot(gx, gy) || 1.0;
      const gk = W_GLOBAL * Math.pow(gm, 0.8);
      let sh = 0.6 * soff[p] + 0.5 * regOff[r] / regN[r];
      sh = Math.max(-1.2, Math.min(1.2, sh));
      const wp = W_PART * Math.min(1.0, dmax[r] / (3.0 * s));   // petite partie : bombé propre atténué
      const ws = W_SHADE * (peint ? 0.6 : 1.0);           // image peinte : ombrage riche, moins suivi
      const nx = gx / gn * gk + wp * pgX[p] + ws * sh * lx;
      const ny = gy / gn * gk + wp * pgY[p] + ws * sh * ly;
      codes[p] = quantize(nx, ny, s > 1);
      ordre.push(p);
    }
    // contour extérieur : rasant, tourné vers l'extérieur ; traits intérieurs : comme leurs voisins
    const outline = new Uint8Array(NP);
    for (const p of ordreSet(opqList.filter((q) => line[q]), w)) {
      if (oD[p] <= 2.3 * s) {
        outline[p] = 1;
        const m = Math.hypot(oVX[p], oVY[p]) || 1;
        codes[p] = quantize(oVX[p] / m, -oVY[p] / m, s > 1);
        ordre.push(p);
      }
    }
    let pending = opqList.filter((p) => codes[p] < 0);
    for (let it = 0; it < aL(6, s) && pending.length; it++) {
      const rest = [];
      for (const p of pending) {
        const x = p % w, y = (p - x) / w;
        const cnt = new Map();
        for (const [dx, dy] of N8) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (codes[q] >= 0 && !outline[q]) compter(cnt, codes[q]);
        }
        if (cnt.size) { codes[p] = plusFrequent(cnt)[0]; ordre.push(p); } else rest.push(p);
      }
      pending = rest.filter((p) => codes[p] < 0);
    }
    for (const p of pending) { codes[p] = 0; ordre.push(p); }
    const regall = new Int32Array(NP).fill(-9);
    for (const p of opqList) regall[p] = region[p] >= 0 ? region[p] : outline[p] ? -2 : -3;
    codes = modeFilter(codes, ordre, w, h, regall, outline, aL(peint ? 5 : 3, s));
    codes = mergeSmall(codes, ordre, w, h, aS(peint ? 10 : 6, s), outline);
    codes = heriterBord(codes, opq, w, h);

    // neutre : chaque pixel prend la couleur de base de sa rampe ; grains isolés (1-2 px) absorbés
    const ridOf = new Int32Array(NP).fill(-1);
    const ridOrdre = body.filter((p) => !prot[p]);
    for (const p of ridOrdre) ridOf[p] = rampOf.get(col[p]);
    const seen = new Uint8Array(NP);
    for (const p of ridOrdre) {
      if (seen[p]) continue;
      const comp = [p];
      seen[p] = 1;
      for (let k = 0; k < comp.length; k++) {
        const x = comp[k] % w, y = (comp[k] - x) / w;
        for (const [dx, dy] of N4) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const t = Y * w + X;
          if (ridOf[t] >= 0 && !seen[t] && ridOf[t] === ridOf[p]) { seen[t] = 1; comp.push(t); }
        }
      }
      if (comp.length <= aS(2, s)) {
        const cnt = new Map();
        for (const q of comp) {
          const x = q % w, y = (q - x) / w;
          for (const [dx, dy] of N8) {
            const X = x + dx, Y = y + dy;
            if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
            const t = Y * w + X;
            if (ridOf[t] >= 0 && !comp.includes(t)) compter(cnt, ridOf[t]);
          }
        }
        if (cnt.size) {
          const nr = plusFrequent(cnt)[0];
          if (nr !== ridOf[p]) for (const t of comp) ridOf[t] = nr;
        }
      }
    }
    // même rampe, deux matières (peau claire et tunique beige d'Agarica) : 2-moyennes sur les parties
    const partBase = new Map();
    const acc = new Map();
    for (const p of ridOrdre) {
      const r = ridOf[p];
      if (rampOf.get(col[p]) !== r) continue;
      const k = region[p] * 4096 + r;
      if (!acc.has(k)) acc.set(k, [region[p], r, 0, 0, 0, 0]);
      const a = acc.get(k), l = lab(col[p]);
      a[2] += l[0]; a[3] += l[1]; a[4] += l[2]; a[5] += 1;
    }
    const parRampe = new Map();
    for (const a of acc.values()) {
      if (!parRampe.has(a[1])) parRampe.set(a[1], []);
      parRampe.get(a[1]).push(a);
    }
    for (const [r, parts] of parRampe) {
      const big = parts.filter((a) => a[5] >= aS(PART_MIN, s));
      if (big.length < 2) continue;
      const ls = big.map((a) => a[2] / a[5]), ws = big.map((a) => a[5]);
      let c1 = Math.min(...ls), c2 = Math.max(...ls), g1 = [], g2 = [];
      for (let it = 0; it < 20; it++) {
        g1 = ls.map((l, i) => i).filter((i) => Math.abs(ls[i] - c1) <= Math.abs(ls[i] - c2));
        g2 = ls.map((l, i) => i).filter((i) => !g1.includes(i));
        if (!g1.length || !g2.length) break;
        c1 = g1.reduce((s, i) => s + ls[i] * ws[i], 0) / g1.reduce((s, i) => s + ws[i], 0);
        c2 = g2.reduce((s, i) => s + ls[i] * ws[i], 0) / g2.reduce((s, i) => s + ws[i], 0);
      }
      const totW = parts.reduce((s, a) => s + a[5], 0);
      if (!g1.length || !g2.length || Math.abs(c2 - c1) < PART_DL ||
        Math.min(g1.reduce((s, i) => s + ws[i], 0), g2.reduce((s, i) => s + ws[i], 0)) < PART_PART * totW) continue;
      for (const g of [g1, g2]) {
        const sw = g.reduce((s, i) => s + big[i][5], 0);
        const m = [2, 3, 4].map((k) => g.reduce((s, i) => s + big[i][k], 0) / sw);
        let cb = ramps[r][0], bv = Infinity;
        for (const c of ramps[r]) { const v = dist3(lab(c), m); if (v < bv) { bv = v; cb = c; } }
        for (const i of g) partBase.set(big[i][0] * 4096 + r, cb);
      }
    }
    const neutral = new Int32Array(NP).fill(-1);
    for (const p of opqList) {
      if (line[p] || prot[p]) neutral[p] = col[p];
      else {
        const k = region[p] * 4096 + ridOf[p];
        neutral[p] = partBase.has(k) ? partBase.get(k) : base[ridOf[p]];
      }
    }
    if (s > 1) neutreDetaille(neutral, { w, h, NP, s, opqList, line, prot, col, rampOf, ridOf, ramps, L });
    const info = {
      ramps: ramps.map((r, i) => [hexc(base[i]), r.slice().sort((a, b) => L.get(a) - L.get(b)).map(hexc)]),
      lines: [...dark].map(hexc).sort(), protected: [...new Set(opqList.filter((p) => prot[p]).map((p) => hexc(col[p])))].sort(),
      parts: new Set(body.map((p) => region[p])).size, outline, rampOf,
    };
    return { opq, opqList, neutral, codes, info };
  }

  // Profondeur maximale de chaque partie (distance 8-voisins au bord de la partie, sans plafond)
  function profondeurParties(region, body, w, h, nReg) {
    const D = new Int32Array(w * h).fill(-1), file = [];
    for (const p of body) {
      const x = p % w, y = (p - x) / w;
      let bord = false;
      for (const [dx, dy] of N8) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h || region[Y * w + X] !== region[p]) { bord = true; break; }
      }
      if (bord) { D[p] = 1; file.push(p); }
    }
    for (let k = 0; k < file.length; k++) {
      const p = file[k], x = p % w, y = (p - x) / w;
      for (const [dx, dy] of N8) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (D[q] < 0 && region[q] === region[p]) { D[q] = D[p] + 1; file.push(q); }
      }
    }
    const out = new Float64Array(nReg);
    for (const p of body) if (region[p] >= 0) out[region[p]] = Math.max(out[region[p]], D[p]);
    return out;
  }

  // Masses d'un grand sprite (s > 1) : relief = ÉPAISSEUR du corps (distance chanfrein au bord ou
  // à un trait) + OMBRAGE à grande échelle de l'original (luminance ramenée à sa matière, écart type,
  // floutée : 3 passes de boîte de rayon 2 s, sigma ~ 3,5 s ; 2 s px par écart type). Partage des
  // eaux du haut vers le bas : chaque lobe (tête, bras, cuisse, torse) est un bassin ; les cols
  // (étranglements, creux d'ombre entre deux masses) deviennent des frontières de partie, comme les
  // traits. Deux bassins fusionnent si le moins marqué est peu profond (< max(s ; 15 % de son
  // sommet)) ou petit (< 80 s² px) : des masses assez grandes pour rester lisibles.
  function massesOmbrage(c) {
    const { w, h, NP, s, body, prot, col, rampOf, ramps, L, counts, barrier } = c;
    const rm = [], rs = [];
    ramps.forEach((r) => {
      const tot = r.reduce((a, cc) => a + counts.get(cc), 0);
      const m = r.reduce((a, cc) => a + L.get(cc) * counts.get(cc), 0) / tot;
      const sd = Math.sqrt(r.reduce((a, cc) => a + (L.get(cc) - m) ** 2 * counts.get(cc), 0) / tot) || 1.0;
      rm.push(m); rs.push(Math.max(sd, 6.0));
    });
    const val = new Float64Array(NP), poids = new Float64Array(NP), dans = new Uint8Array(NP);
    for (const p of body) {
      dans[p] = 1;
      if (prot[p]) continue;
      const r = rampOf.get(col[p]);
      val[p] = (L.get(col[p]) - rm[r]) / rs[r]; poids[p] = 1;
    }
    const rb = Math.max(1, Math.round(2 * s));
    const boite = (a) => {   // 3 passes horizontales puis verticales, bords à zéro
      let t = Float64Array.from(a);
      for (const [n, pas, lignes, lpas] of [[w, 1, h, w], [h, w, w, 1]]) {
        for (let it = 0; it < 3; it++) {
          const o = new Float64Array(NP);
          for (let l = 0; l < lignes; l++) {
            const base = l * lpas;
            let acc = 0;
            for (let i = -rb; i <= rb; i++) if (i >= 0 && i < n) acc += t[base + i * pas];
            for (let i = 0; i < n; i++) {
              o[base + i * pas] = acc / (2 * rb + 1);
              const sort = i - rb, entre = i + rb + 1;
              if (sort >= 0) acc -= t[base + sort * pas];
              if (entre < n) acc += t[base + entre * pas];
            }
          }
          t = o;
        }
      }
      return t;
    };
    const bv = boite(val), bp = boite(poids);
    // relief = épaisseur (distance au bord du corps ou à un trait, en px : les étranglements entre
    // deux lobes, cou, poignet, aisselle, sont des cols) + ombrage à grande échelle (2 s px par écart type)
    // c.vallees (méthode A) : traits intérieurs courts, creux d'épaisseur sans couper la masse
    const D = new Float64Array(NP).fill(1e9);
    for (let p = 0; p < NP; p++) if (!dans[p] || barrier[p] || (c.vallees && c.vallees[p])) D[p] = 0;
    for (const [y0, y1, sy, x0, x1, sx] of [[0, h, 1, 0, w, 1], [h - 1, -1, -1, w - 1, -1, -1]]) {
      for (let y = y0; y !== y1; y += sy) {
        for (let x = x0; x !== x1; x += sx) {
          const p = y * w + x;
          if (!D[p]) continue;
          for (const [dx, dy, k] of [[-sx, 0, 1], [0, -sy, 1], [-sx, -sy, 1.4142], [sx, -sy, 1.4142]]) {
            const X = x + dx, Y = y + dy;
            const v = X < 0 || Y < 0 || X >= w || Y >= h ? k : D[Y * w + X] + k;
            if (v < D[p]) D[p] = v;
          }
        }
      }
    }
    const B = new Float64Array(NP);
    for (const p of body) B[p] = D[p] + 2 * s * (bp[p] > 1e-9 ? bv[p] / bp[p] : 0);
    // partage des eaux par union-find, du plus clair au plus sombre (4 voisins)
    const ordre = body.slice().sort((a, b) => (B[b] - B[a]) || (a - b));
    const lab = new Int32Array(NP).fill(-1), parent = [], pic = [], aire = [];
    const racine = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const AMIN = c.amin || Math.round(80 * s * s);
    const plat = (r, v) => pic[r] - v < Math.max(s, (c.platRel || 0.15) * pic[r]);   // bassin peu marqué
    const bord = new Uint8Array(NP);
    for (const p of ordre) {
      const x = p % w, y = (p - x) / w, v = B[p];
      const voisins = new Set();
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (lab[q] >= 0) voisins.add(racine(lab[q]));
      }
      if (!voisins.size) { const i = parent.length; parent.push(i); pic.push(v); aire.push(1); lab[p] = i; continue; }
      let liste = [...voisins].sort((a, b) => (pic[b] - pic[a]) || (a - b));
      // fusion des bassins peu marqués ou petits dans le plus haut
      let garde = [liste[0]];
      for (const r of liste.slice(1)) {
        const ok = garde.find((g) => plat(r, v) || aire[r] < AMIN || plat(g, v) || aire[g] < AMIN);
        if (ok !== undefined) {
          const a = racine(ok), b = racine(r);
          if (a !== b) { parent[b] = a; aire[a] += aire[b]; pic[a] = Math.max(pic[a], pic[b]); }
        } else garde.push(r);
      }
      garde = [...new Set(garde.map(racine))];
      if (garde.length > 1) { bord[p] = 1; continue; }   // creux entre deux masses : frontière
      lab[p] = garde[0]; aire[garde[0]]++;
    }
    const out = [];
    for (const p of body) if (bord[p]) out.push(p);
    return out;
  }

  // Grand sprite (s > 1) : le neutre en aplats effaçait le dessin (mèches, nuances). On ne retire
  // que l'ombrage à GRANDE échelle : couleur de base de la matière + écart du pixel à la moyenne
  // locale de sa matière (luminance L*, fenêtre de 2 s px de rayon), ramené à la couleur de la rampe
  // la plus proche (palette du sprite : ça reste du pixel art). Puis chaque matière claire est
  // assombrie (même rapport pour toutes ses couleurs, détail gardé) pour que sa couleur la plus
  // claire reste sous 188 / 255 : x 1,36 (ambiance 0,36 + lampe 1) au palier max = blanc, les
  // paliers en dessous restent distincts au lieu de saturer.
  function neutreDetaille(neutral, c) {
    const { w, h, NP, s, opqList, line, prot, col, rampOf, ridOf, ramps, L } = c;
    const rho = aL(2, s);
    const nR = ramps.length;
    // tables de sommes (L et nombre) par matière, pixels de leur propre rampe seulement
    const W1 = w + 1;
    const sl = new Float64Array(nR * W1 * (h + 1)), sn = new Float64Array(nR * W1 * (h + 1));
    const propre = (p) => !line[p] && !prot[p] && ridOf[p] >= 0 && rampOf.get(col[p]) === ridOf[p];
    for (let r = 0; r < nR; r++) {
      const o = r * W1 * (h + 1);
      for (let y = 0; y < h; y++) {
        let al = 0, an = 0;
        for (let x = 0; x < w; x++) {
          const p = y * w + x;
          if (propre(p) && ridOf[p] === r) { al += L.get(col[p]); an++; }
          sl[o + (y + 1) * W1 + x + 1] = sl[o + y * W1 + x + 1] + al;
          sn[o + (y + 1) * W1 + x + 1] = sn[o + y * W1 + x + 1] + an;
        }
      }
    }
    const somme = (t, r, x0, y0, x1, y1) => {
      const o = r * W1 * (h + 1);
      return t[o + y1 * W1 + x1] - t[o + y0 * W1 + x1] - t[o + y1 * W1 + x0] + t[o + y0 * W1 + x0];
    };
    const out = Int32Array.from(neutral);
    for (const p of opqList) {
      if (!propre(p)) continue;
      const r = ridOf[p], x = p % w, y = (p - x) / w;
      const x0 = Math.max(0, x - rho), y0 = Math.max(0, y - rho), x1 = Math.min(w, x + rho + 1), y1 = Math.min(h, y + rho + 1);
      const n = somme(sn, r, x0, y0, x1, y1);
      if (!n) continue;
      const cible = L.get(neutral[p]) + (L.get(col[p]) - somme(sl, r, x0, y0, x1, y1) / n);
      let best = neutral[p], bv = Infinity;
      for (const cc of ramps[r]) { const v = Math.abs(L.get(cc) - cible); if (v < bv) { bv = v; best = cc; } }
      out[p] = best;
    }
    // marge sous le blanc, par matière
    const PLAFOND = 188;
    const maxi = new Map();
    for (const p of opqList) {
      if (line[p] || prot[p] || ridOf[p] < 0) continue;
      const c = out[p], m = Math.max((c >> 16) & 255, (c >> 8) & 255, c & 255);
      maxi.set(ridOf[p], Math.max(maxi.get(ridOf[p]) || 0, m));
    }
    for (const p of opqList) {
      if (line[p] || prot[p] || ridOf[p] < 0) { neutral[p] = out[p]; continue; }
      const k = Math.min(1, PLAFOND / (maxi.get(ridOf[p]) || 255)), c = out[p];
      neutral[p] = k >= 1 ? c : (pyRound(((c >> 16) & 255) * k) << 16) | (pyRound(((c >> 8) & 255) * k) << 8) | pyRound((c & 255) * k);
    }
  }

  // ============================================================ méthodes A, B, C (petits sprites détaillés)
  // Constat du 2026-11-17 (Agarica au repos, 65 x 92 px, s = 1) : à s = 1, analyse() est sections.py
  // tel quel, et les remèdes des grands sprites (neutreDetaille, massesOmbrage, dôme sur toute la
  // partie, table fine, filtres x s) ne jouent que si s > 1. D'où :
  //  - neutre en aplats : chaque pixel prend la couleur de base de sa rampe et les grains de 1-2 px
  //    sont absorbés (21 couleurs -> 11 : ombrage peint des cheveux, texture de la cape, nuances et
  //    œil du visage effacés) ;
  //  - matières confondues : clusterRamps() relie deux couleurs dès que leur lien dépasse 0,06 avec
  //    une teinte et une saturation voisines : la tunique beige (bba083) rejoint la peau claire
  //    (fadbc0) par 17 contacts, et le neutre montre un torse nu ; et la couleur de trait est la plus
  //    FRÉQUENTE sous L* 22 : tout le corps sombre de Xara (43283b, L* 20) passe pour un trait ;
  //  - sections en miettes : parties coupées par chaque trait et chaque changement de matière, bombé
  //    limité à 3 px, ombrage peint suivi au pixel près (2 px), 17 sections, zones de 6 px.
  // Les méthodes A, B, C (`--methode`, réglage `methode` de la page) partagent un SOCLE :
  //  - traits = les noirs du contour seulement (la plus SOMBRE des couleurs fréquentes) ;
  //  - matières : deux couleurs ne se relient que si leur lien vaut au moins 40 % du meilleur lien
  //    de chacune (tunique et peau se touchent peu, leurs ombres beaucoup), puis morceaux connexes :
  //    cheveux et bottes de même rampe restent deux matières ;
  //  - neutre détaillé : seul l'ombrage plus large que 2 px est retiré, dans chaque morceau de
  //    matière (moyenne du morceau + écart à sa moyenne locale) ; détails < 10 px gardés tels quels ;
  //    marge sous le blanc (188) comme les grands sprites ;
  //  - dôme sur toute la partie, table fine (face + 3 bagues x 12 directions), un peu de volume
  //    d'ensemble ; normales lissées d'une image à l'autre AVANT d'être arrondies ; parties de
  //    24 px et zones de 8 px au moins (aucune miette).
  // Elles diffèrent par le découpage en PARTIES :
  //  - A « masses » : partage des eaux sur l'épaisseur du corps + l'ombrage peint (massesOmbrage),
  //    seuls les longs traits coupent ; ignore les matières : tête, torse, bras, jambes, cape ;
  //  - B « matières » : une partie par morceau de matière (cheveux, visage, tunique, bras, cape,
  //    bottes), coupée aux étranglements ;
  //  - C « traits » : parties fermées par les traits intérieurs et le contour (trous de 1-2 px
  //    refermés), relief en coussin (bord arrondi sur 1,5 à 3,5 px, centre de face).
  // Grand sprite (s > 1) : toutes les méthodes gardent sa chaîne (analyse()), cartes inchangées.
  const METHODES = ['origine', 'A', 'B', 'C'];
  const NOMS_METHODES = { origine: 'actuelle', A: 'A - masses', B: 'B - matières', C: 'C - traits' };
  const V2 = {
    RHO: 2,           // neutre : rayon (px) de la moyenne locale ; l'ombrage plus large est retiré
    SEUIL_NEUTRE: 4,  // neutre : correction d'ombrage plus petite (L*) : couleur d'origine gardée
    DET_MIN: 10,      // morceau de matière plus petit : détail (œil, boucle), couleur gardée
    RAMP_REL: 0.4,    // lien gardé s'il vaut >= 40 % du meilleur lien de chacune des deux couleurs
    PART_MIN: 24,     // partie plus petite : fondue dans la voisine qui la touche le plus
    PART_MIN_C: 40,   // idem pour C
    ZONE_MIN: 8,      // zone de section plus petite : fondue (aucune miette)
    TRAIT_LONG: 12,   // A : trait intérieur qui coupe une masse (px)
    TRAIT_MIN: 4,     // C : trait intérieur plus court = texture, ne coupe pas
    MASSE_MIN: 50,    // A : bassin plus petit fondu dans son voisin (80 px pour un grand sprite)
    CREUX: 12,        // C : écart de L* d'un pixel de trait en creux avec ses deux voisins
    BORD: 18,         // C : écart Lab entre deux pixels voisins qui fait frontière (bord de couleur franc)
    GAIN_COUSSIN: 1.4, // C : pente du coussin x 1,4 (plafonnée) : liseré rasant sur 2 px
    W_GLOBAL: 0.45, W_PART: 0.75,
    VOISIN: 140,      // A, B : masque du dôme sur les parties voisines (255 = la partie, 0 = vide)
    // marge sous le blanc : 188 (grands sprites) grisait la peau d'Agarica (250 -> 188) ; à 220,
    // le 2e palier (x 1,03) reste sous le blanc, seul le dernier (x 1,36) sature
    PLAFOND: 220,
    TEMPS: 3,         // passes de lissage des normales d'une image à l'autre
  };
  const estV2 = (methode, echelle) => !!methode && methode !== 'origine' && !(echelle > 1);

  // Couleurs de trait : la plus SOMBRE des couleurs fréquentes (>= 1 % des pixels, L* < 12) et
  // celles à 3,5 de L* au plus ; plus les couleurs de TRAIT INTÉRIEUR (L* < 15) : presque jamais en
  // aplat (moins de 10 % de pixels entourés de leur couleur) et dessinées en creux (au moins 20 %
  // de pixels plus sombres de 8 L* que leurs deux voisins d'un même axe) : traits bruns de la
  // marche d'Agarica (291d13). Un corps sombre (Xara : 43283b, 2c1826) fait des aplats et des
  // dégradés, pas des creux. (sections.py prenait la plus fréquente sous L* 22 : le corps de Xara
  // devenait un trait.)
  function traitsV2(colors, counts, L, n, col, opqList, w, h) {
    let lineC = null;
    const freq = Math.max(8, 0.01 * n);
    for (const c of colors) if (L.get(c) < 12 && counts.get(c) >= freq && (lineC === null || L.get(c) < L.get(lineC))) lineC = c;
    if (lineC === null) { lineC = colors[0]; for (const c of colors) if (L.get(c) < L.get(lineC)) lineC = c; }
    const dark = new Set(colors.filter((c) => L.get(c) <= L.get(lineC) + 3.5));
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : col[y * w + x]);
    const plusClair = (x, y, l) => { const d = at(x, y); return d >= 0 && L.get(d) > l + 8; };
    const plein = new Map(), creux = new Map();
    for (const p of opqList) {
      const c = col[p], l = L.get(c);
      if (l >= 15 || dark.has(c)) continue;
      const x = p % w, y = (p - x) / w;
      if (at(x + 1, y) === c && at(x - 1, y) === c && at(x, y + 1) === c && at(x, y - 1) === c) compter(plein, c);
      if ([[1, 0], [0, 1], [1, 1], [1, -1]].some(([dx, dy]) => plusClair(x + dx, y + dy, l) && plusClair(x - dx, y - dy, l))) compter(creux, c);
    }
    for (const c of colors) {
      if (L.get(c) >= 15 || dark.has(c)) continue;
      if ((plein.get(c) || 0) <= 0.1 * counts.get(c) && (creux.get(c) || 0) >= 0.2 * counts.get(c)) dark.add(c);
    }
    return dark;
  }

  // clusterRamps() + lien RELATIF : deux couleurs ne se relient que si leur lien (contacts / racine
  // des surfaces) vaut au moins RAMP_REL fois le meilleur lien compatible de CHACUNE. Une ombre et
  // sa lumière se touchent partout (0,4 à 1) ; deux matières voisines, seulement à leur frontière
  // (tunique-peau d'Agarica : 0,13 contre 0,41 et 0,52 dans chacune).
  function clusterRampsV2(colors, counts, adj, dark, prot, forced) {
    const feat = new Map();
    for (const c of colors) {
      const [Lc, a, b] = lab(c);
      feat.set(c, [Math.atan2(b, a) * (180.0 / Math.PI), Math.hypot(a, b) / Math.max(Lc, 8.0), Math.hypot(a, b)]);
    }
    const parent = new Map(colors.map((c) => [c, c]));
    const find = (c) => {
      while (parent.get(c) !== c) { parent.set(c, parent.get(parent.get(c))); c = parent.get(c); }
      return c;
    };
    for (const group of forced) {
      const g = group.filter((c) => parent.has(c));
      for (const c of g.slice(1)) parent.set(find(c), find(g[0]));
    }
    const pool = colors.filter((c) => !dark.has(c) && !prot.has(c));
    const inPool = new Set(pool);
    const total = pool.reduce((s, c) => s + counts.get(c), 0) || 1;
    const rare = Math.max(6, Math.trunc(0.006 * total));
    const span = new Map(colors.map((c) => [c, [lab(c)[0], lab(c)[0]]]));
    // teinte et saturation voisines ; dans les tons sombres (L* < 25), le rapport chroma / L* s'affole
    // (Xara : 2c1826 et 3a2132, même violet, 1,20 contre 0,98) : on y compare le chroma lui-même
    const compatible = (a, b) => {
      const fa = feat.get(a), fb = feat.get(b);
      if (fa[2] < 8 && fb[2] < 8) return true;
      if (Math.min(lab(a)[0], lab(b)[0]) < 25) return hueDiff(fa[0], fb[0]) < 20 && Math.abs(fa[2] - fb[2]) < 12;
      return hueDiff(fa[0], fb[0]) < 15 && Math.abs(fa[1] - fb[1]) < 0.17;
    };
    const pairs = [], meilleur = new Map();
    for (const [k, v] of adj) {
      const a = Math.floor(k / 16777216), b = k % 16777216;
      if (!inPool.has(a) || !inPool.has(b)) continue;
      const s = v / Math.sqrt(counts.get(a) * counts.get(b));
      pairs.push([s, a, b]);
      if (compatible(a, b)) for (const c of [a, b]) meilleur.set(c, Math.max(meilleur.get(c) || 0, s));
    }
    pairs.sort((p, q) => (q[0] - p[0]) || (q[1] - p[1]) || (q[2] - p[2]));
    for (const [s, a, b] of pairs) {
      if (counts.get(a) < rare || counts.get(b) < rare) continue;
      if (s <= 0.06 || !compatible(a, b)) continue;
      if (s < V2.RAMP_REL * Math.min(meilleur.get(a) || 0, meilleur.get(b) || 0)) continue;
      const ra = find(a), rb = find(b);
      if (ra === rb) continue;
      const lo = Math.min(span.get(ra)[0], span.get(rb)[0]), hi = Math.max(span.get(ra)[1], span.get(rb)[1]);
      if (hi - lo > RAMP_SPAN) continue;
      parent.set(ra, rb);
      span.set(rb, [lo, hi]);
    }
    const parCompte = pool.map((c, i) => [c, i]).sort((p, q) => (counts.get(p[0]) - counts.get(q[0])) || (p[1] - q[1]));
    for (const [c] of parCompte) {
      if (counts.get(c) >= rare) continue;
      const best = new Map();
      for (const [k, v] of adj) {
        const a = Math.floor(k / 16777216), b = k % 16777216;
        const o = a === c ? b : b === c ? a : null;
        if (o !== null && inPool.has(o) && counts.get(o) >= rare) compter(best, find(o), v);
      }
      if (best.size) parent.set(find(c), plusFrequent(best)[0]);
    }
    const ramps = new Map();
    for (const c of pool) {
      const r = find(c);
      if (!ramps.has(r)) ramps.set(r, []);
      ramps.get(r).push(c);
    }
    return [...ramps.values()];
  }

  // Distance chanfrein (1 ; 1,4142) au bord d'une région : reg[p] (-1 = hors région) ; un pixel
  // d'une autre région, du vide ou hors de l'image est un bord.
  function distanceRegions(reg, w, h) {
    const NP = w * h, D = new Float64Array(NP).fill(1e9);
    for (let p = 0; p < NP; p++) if (reg[p] < 0) D[p] = 0;
    for (const [y0, y1, sy, x0, x1, sx] of [[0, h, 1, 0, w, 1], [h - 1, -1, -1, w - 1, -1, -1]]) {
      for (let y = y0; y !== y1; y += sy) {
        for (let x = x0; x !== x1; x += sx) {
          const p = y * w + x;
          if (!D[p]) continue;
          for (const [dx, dy, k] of [[-sx, 0, 1], [0, -sy, 1], [-sx, -sy, 1.4142], [sx, -sy, 1.4142]]) {
            const X = x + dx, Y = y + dy;
            const v = X < 0 || Y < 0 || X >= w || Y >= h || reg[Y * w + X] !== reg[p] ? k : D[Y * w + X] + k;
            if (v < D[p]) D[p] = v;
          }
        }
      }
    }
    return D;
  }

  // Pixels de `liste` sans région -> région voisine majoritaire (8 voisins), en plusieurs passes ;
  // `prefere(p, q)` : voisins favoris (même matière) d'abord. Restes : une région chacun.
  function remplirRegions(reg, liste, w, h, prefere) {
    let todo = liste.filter((p) => reg[p] < 0);
    let suivant = 0;
    for (let p = 0; p < reg.length; p++) suivant = Math.max(suivant, reg[p] + 1);
    for (let it = 0; it < 12 && todo.length; it++) {
      const pose = [], rest = [];
      for (const p of todo) {
        const x = p % w, y = (p - x) / w;
        const fav = new Map(), autre = new Map();
        for (const [dx, dy] of N8) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (reg[q] >= 0) compter(prefere && prefere(p, q) ? fav : autre, reg[q]);
        }
        const m = fav.size ? fav : autre;
        if (m.size) pose.push([p, plusFrequent(m)[0]]); else rest.push(p);
      }
      for (const [p, r] of pose) reg[p] = r;   // après la passe : pas de traînée dans un sens
      todo = rest;
    }
    for (const p of todo) reg[p] = suivant++;
  }

  // Régions de moins de `mini` px fondues dans la voisine qui les touche le plus (8 voisins ; sans
  // contact direct : à 2 px, à travers un trait), la plus petite d'abord. Renumérote 0..n-1.
  function fondreRegions(reg, w, h, mini) {
    const membres = new Map();
    for (let p = 0; p < reg.length; p++) if (reg[p] >= 0) { if (!membres.has(reg[p])) membres.set(reg[p], []); membres.get(reg[p]).push(p); }
    const contacts = (r, rayon) => {
      const cnt = new Map();
      for (const p of membres.get(r)) {
        const x = p % w, y = (p - x) / w;
        for (let dy = -rayon; dy <= rayon; dy++) {
          for (let dx = -rayon; dx <= rayon; dx++) {
            const X = x + dx, Y = y + dy;
            if ((!dx && !dy) || X < 0 || Y < 0 || X >= w || Y >= h) continue;
            const q = Y * w + X;
            if (reg[q] >= 0 && reg[q] !== r) compter(cnt, reg[q]);
          }
        }
      }
      return cnt;
    };
    // tas (taille, numéro) : la plus petite d'abord ; une région qui grossit y est remise
    const tas = [];
    const avant = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
    const pousser = (e) => {
      tas.push(e);
      for (let i = tas.length - 1; i > 0;) { const j = (i - 1) >> 1; if (!avant(tas[i], tas[j])) break; [tas[i], tas[j]] = [tas[j], tas[i]]; i = j; }
    };
    const tirer = () => {
      const top = tas[0], fin = tas.pop();
      if (tas.length) {
        tas[0] = fin;
        for (let i = 0; ;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < tas.length && avant(tas[l], tas[m])) m = l;
          if (r < tas.length && avant(tas[r], tas[m])) m = r;
          if (m === i) break;
          [tas[i], tas[m]] = [tas[m], tas[i]]; i = m;
        }
      }
      return top;
    };
    for (const [r, m] of membres) if (m.length < mini) pousser([m.length, r]);
    while (tas.length) {
      const [n, pr] = tirer();
      if (!membres.has(pr) || membres.get(pr).length !== n) continue;   // déjà fondue ou grossie
      let cnt = contacts(pr, 1);
      if (!cnt.size) cnt = contacts(pr, 2);
      if (!cnt.size) continue;   // isolée : reste telle quelle
      const nr = plusFrequent(cnt)[0];
      for (const p of membres.get(pr)) reg[p] = nr;
      membres.get(nr).push(...membres.get(pr));
      membres.delete(pr);
      if (membres.get(nr).length < mini) pousser([membres.get(nr).length, nr]);
    }
    const num = new Map();
    for (let p = 0; p < reg.length; p++) if (reg[p] >= 0) { if (!num.has(reg[p])) num.set(reg[p], num.size); reg[p] = num.get(reg[p]); }
    return num.size;
  }

  // Composantes 4-connexes des pixels de `liste` (et d'eux seuls) où ok(q, c) relie deux voisins
  function composantes(liste, w, h, NP, ok) {
    const reg = new Int32Array(NP).fill(-1), membre = new Uint8Array(NP);
    for (const p of liste) membre[p] = 1;
    let n = 0;
    for (const p0 of liste) {
      if (reg[p0] >= 0 || !ok(p0, p0)) continue;
      reg[p0] = n;
      const pile = [p0];
      while (pile.length) {
        const c = pile.pop(), x = c % w, y = (c - x) / w;
        for (const [dx, dy] of N4) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (membre[q] && reg[q] < 0 && ok(q, c)) { reg[q] = n; pile.push(q); }
        }
      }
      n++;
    }
    return reg;
  }

  // C : les traits intérieurs s'arrêtent souvent à 2-4 px d'un autre trait ou du contour (bras
  // contre le torse, jambe contre jambe) ; une partie « fermée par les traits » fuirait par ces
  // trous. Chaque bout de trait est prolongé jusqu'au trait (ou au vide) le plus proche DEVANT lui,
  // à PONT px au plus (segment de Bresenham). Renvoie les pixels du corps à ajouter à la barrière.
  const PONT = 4;
  function pontsTraits(line, garde, opq, w, h) {
    const NP = w * h, out = new Uint8Array(NP);
    const est = (x, y) => x >= 0 && y >= 0 && x < w && y < h && line[y * w + x] && garde(y * w + x);
    const vide = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !opq[y * w + x];
    for (let p = 0; p < NP; p++) {
      if (!line[p] || !garde(p)) continue;
      const x = p % w, y = (p - x) / w;
      let nv = 0, touche = false;
      for (const [dx, dy] of N8) { if (est(x + dx, y + dy)) nv++; if (vide(x + dx, y + dy)) touche = true; }
      if (nv !== 1 || touche) continue;   // bout de trait intérieur : un seul voisin trait
      // pixels du même trait à 5 pas au plus (exclus des cibles) ; direction = bout - leur centre
      const proches = new Set([p]);
      let front = [p];
      for (let k = 0; k < 5; k++) {
        const nx_ = [];
        for (const q of front) {
          const qx = q % w, qy = (q - qx) / w;
          for (const [dx, dy] of N8) { const X = qx + dx, Y = qy + dy; if (est(X, Y) && !proches.has(Y * w + X)) { proches.add(Y * w + X); nx_.push(Y * w + X); } }
        }
        front = nx_;
      }
      let cx = 0, cy = 0;
      for (const q of proches) { cx += q % w; cy += (q - (q % w)) / w; }
      cx /= proches.size; cy /= proches.size;
      let dx0 = x - cx, dy0 = y - cy;
      const m = Math.hypot(dx0, dy0);
      if (m < 0.5) continue;
      dx0 /= m; dy0 /= m;
      let best = null, bd = Infinity;
      for (let ty = y - PONT; ty <= y + PONT; ty++) {
        for (let tx = x - PONT; tx <= x + PONT; tx++) {
          const d = Math.hypot(tx - x, ty - y);
          if (d < 1.5 || d > PONT + 0.5 || ((tx - x) * dx0 + (ty - y) * dy0) / d < 0.5) continue;
          const cible = vide(tx, ty) || (est(tx, ty) && !proches.has(ty * w + tx));
          if (cible && d < bd) { bd = d; best = [tx, ty]; }
        }
      }
      if (!best) continue;
      // segment p -> cible (exclus), pixels du corps seulement
      const n = Math.max(Math.abs(best[0] - x), Math.abs(best[1] - y));
      for (let k = 1; k < n; k++) {
        const X = Math.round(x + (best[0] - x) * k / n), Y = Math.round(y + (best[1] - y) * k / n);
        if (!vide(X, Y) && !line[Y * w + X]) out[Y * w + X] = 1;
      }
    }
    return out;
  }

  // B : motif = morceau ENFERMÉ dans un autre plus grand (avec le contour extérieur) et qui le touche
  // directement sur au moins 30 % de son pourtour : taches de Xara, broderie. Il rejoint ce morceau
  // (du plus petit au plus grand). Un morceau seulement voisin (capuche sous les cheveux, séparée
  // du reste par des traits intérieurs) n'est pas enfermé : il reste une partie.
  function porterMotifs(reg, body, w, h, contour) {
    const taille = new Map(), cont = new Map(), peri = new Map();
    for (const p of body) compter(taille, reg[p]);
    for (const p of body) {
      const x = p % w, y = (p - x) / w, r = reg[p];
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy, q = Y * w + X;
        const autre = X < 0 || Y < 0 || X >= w || Y >= h || reg[q] !== r;
        if (!autre) continue;
        compter(peri, r);
        if (X >= 0 && Y >= 0 && X < w && Y < h && reg[q] >= 0) {
          if (!cont.has(r)) cont.set(r, new Map());
          compter(cont.get(r), reg[q]);
        }
      }
    }
    const membres = new Map();
    for (const p of body) { if (!membres.has(reg[p])) membres.set(reg[p], []); membres.get(reg[p]).push(p); }
    // part des pixels de r enfermés par o + contour (remplissage depuis le bord de la boîte de o)
    const enferme = (r, o) => {
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (const p of membres.get(o)) { const x = p % w, y = (p - x) / w; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      x0--; y0--; x1++; y1++;
      const BW = x1 - x0 + 1, BH = y1 - y0 + 1, vu = new Uint8Array(BW * BH), file = [];
      const mur = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (reg[y * w + x] === o || contour[y * w + x]);
      const graine = (x, y) => { const k = (y - y0) * BW + x - x0; if (!vu[k] && !mur(x, y)) { vu[k] = 1; file.push(k); } };
      for (let x = x0; x <= x1; x++) { graine(x, y0); graine(x, y1); }
      for (let y = y0; y <= y1; y++) { graine(x0, y); graine(x1, y); }
      for (let i = 0; i < file.length; i++) {
        const k = file[i], x = x0 + (k % BW), y = y0 + ((k - (k % BW)) / BW);
        if (x > x0) graine(x - 1, y);
        if (x < x1) graine(x + 1, y);
        if (y > y0) graine(x, y - 1);
        if (y < y1) graine(x, y + 1);
      }
      let dedans = 0;
      for (const p of membres.get(r)) {
        const x = p % w, y = (p - x) / w;
        if (x > x0 && x < x1 && y > y0 && y < y1 && !vu[(y - y0) * BW + x - x0]) dedans++;
      }
      return dedans / membres.get(r).length;
    };
    const parent = new Map();
    const racine = (r) => { while (parent.has(r)) r = parent.get(r); return r; };
    const ordre = [...taille.keys()].sort((a, b) => (taille.get(a) - taille.get(b)) || (a - b));
    for (const r of ordre) {
      const c = cont.get(r);
      if (!c) continue;
      const [o, v] = plusFrequent(c);
      if (taille.get(o) > taille.get(r) && v / peri.get(r) >= 0.3 && racine(o) !== r && enferme(r, o) >= 0.8) parent.set(r, o);
    }
    for (const p of body) reg[p] = racine(reg[p]);
  }

  // B : parties de 2 px d'épaisseur au plus (ceinture, lanière, liseré) fondues dans la voisine qui
  // les touche le plus : elles suivent le volume de ce qui les porte au lieu d'un dôme à elles
  function fondreMinces(reg, body, w, h) {
    const D = distanceRegions(reg, w, h), prof = new Map();
    for (const p of body) prof.set(reg[p], Math.max(prof.get(reg[p]) || 0, D[p]));
    const minces = new Set([...prof].filter(([, v]) => v < 2).map(([r]) => r));
    if (!minces.size) return new Set(body.map((p) => reg[p])).size;
    // chaque mince -> voisine non mince qui la touche le plus (8 voisins, puis à 2 px)
    for (const r of minces) {
      const cnt = new Map();
      for (const rayon of [1, 2]) {
        for (const p of body) {
          if (reg[p] !== r) continue;
          const x = p % w, y = (p - x) / w;
          for (let dy = -rayon; dy <= rayon; dy++) {
            for (let dx = -rayon; dx <= rayon; dx++) {
              const X = x + dx, Y = y + dy;
              if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
              const q = Y * w + X;
              if (reg[q] >= 0 && reg[q] !== r && !minces.has(reg[q])) compter(cnt, reg[q]);
            }
          }
        }
        if (cnt.size) break;
      }
      if (!cnt.size) continue;
      const nr = plusFrequent(cnt)[0];
      for (const p of body) if (reg[p] === r) reg[p] = nr;
    }
    return fondreRegions(reg, w, h, 1);
  }

  // B : coupe chaque partie à ses étranglements (partage des eaux sur l'épaisseur DANS la partie ;
  // deux bassins restent séparés si le moins haut dépasse le col de max(1 ; 30 %) et fait 40 px)
  function couperEtranglements(reg, liste, w, h) {
    const NP = w * h, D = distanceRegions(reg, w, h);
    const ordre = liste.filter((p) => reg[p] >= 0).sort((a, b) => (D[b] - D[a]) || (a - b));
    const lab_ = new Int32Array(NP).fill(-1), parent = [], pic = [], aire = [];
    const racine = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const AMIN = 40;
    const plat = (r, v) => pic[r] - v < Math.max(1, 0.3 * pic[r]);
    const col = new Uint8Array(NP);
    for (const p of ordre) {
      const x = p % w, y = (p - x) / w, v = D[p];
      const voisins = new Set();
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const q = Y * w + X;
        if (lab_[q] >= 0 && reg[q] === reg[p]) voisins.add(racine(lab_[q]));
      }
      if (!voisins.size) { const i = parent.length; parent.push(i); pic.push(v); aire.push(1); lab_[p] = i; continue; }
      const liste_ = [...voisins].sort((a, b) => (pic[b] - pic[a]) || (a - b));
      let garde = [liste_[0]];
      for (const r of liste_.slice(1)) {
        const ok = garde.find((g) => plat(r, v) || aire[r] < AMIN || plat(g, v) || aire[g] < AMIN);
        if (ok !== undefined) {
          const a = racine(ok), b = racine(r);
          if (a !== b) { parent[b] = a; aire[a] += aire[b]; pic[a] = Math.max(pic[a], pic[b]); }
        } else garde.push(r);
      }
      garde = [...new Set(garde.map(racine))];
      if (garde.length > 1) { col[p] = 1; continue; }
      lab_[p] = garde[0]; aire[garde[0]]++;
    }
    const out = new Int32Array(NP).fill(-1);
    for (const p of liste) if (lab_[p] >= 0) out[p] = racine(lab_[p]);
    remplirRegions(out, liste.filter((p) => col[p]), w, h, (p, q) => reg[p] === reg[q]);
    return out;
  }

  // Neutre du socle : dans chaque morceau de matière d'au moins DET_MIN px, cible = niveau du
  // morceau + (L* du pixel - moyenne locale du morceau, rayon RHO) : l'ombrage plus large que la
  // fenêtre part, les mèches, plis et textures restent. Couleur prise dans la rampe (palette du
  // sprite). Petits morceaux, traits et détails : couleur d'origine. Puis marge sous le blanc.
  // Niveau du morceau : sa moyenne, mise en commun avec les morceaux de même rampe et de moyenne
  // voisine (groupe de 6 L* d'étendue au plus, sans chaîne) : les cheveux de toutes les frames d'une
  // animation ont le MÊME niveau (sinon le neutre entier d'une matière change de teinte d'une frame
  // à l'autre quand sa forme change : clignotement) ; les bottes (même rampe, 15 L* plus sombres)
  // gardent le leur. Couleurs permises : celles du groupe (2 % de ses pixels au moins) : un morceau
  // ne prend jamais la couleur d'une autre matière restée dans la même rampe (marche d'Agarica :
  // peau et tunique dans une rampe, le visage devenait beige-gris).
  function neutreV2(c) {
    const { w, h, NP, opqList, col, ramps, L, inst, instRampe } = c;
    const neutral = new Int32Array(NP).fill(-1);
    for (const p of opqList) neutral[p] = col[p];
    const nI = instRampe.length, som = new Float64Array(nI), nb = new Float64Array(nI);
    for (const p of opqList) if (inst[p] >= 0) { som[inst[p]] += L.get(col[p]); nb[inst[p]]++; }
    const niveau = new Float64Array(nI), groupe = new Int32Array(nI).fill(-1);
    const parRampe = new Map();
    for (let i = 0; i < nI; i++) {
      if (nb[i] < V2.DET_MIN) continue;
      if (!parRampe.has(instRampe[i])) parRampe.set(instRampe[i], []);
      parRampe.get(instRampe[i]).push(i);
    }
    let ng = 0;
    for (const liste of parRampe.values()) {
      liste.sort((a, b) => (som[a] / nb[a] - som[b] / nb[b]) || (a - b));
      let debut = 0;
      for (let k = 1; k <= liste.length; k++) {
        if (k < liste.length && som[liste[k]] / nb[liste[k]] - som[liste[debut]] / nb[liste[debut]] <= 6) continue;
        const g = liste.slice(debut, k);
        const m = g.reduce((s, i) => s + som[i], 0) / g.reduce((s, i) => s + nb[i], 0);
        for (const i of g) { niveau[i] = m; groupe[i] = ng; }
        ng++;
        debut = k;
      }
    }
    const couleursG = Array.from({ length: ng }, () => new Map()), tailleG = new Float64Array(ng);
    for (const p of opqList) if (inst[p] >= 0 && groupe[inst[p]] >= 0) { compter(couleursG[groupe[inst[p]]], col[p]); tailleG[groupe[inst[p]]]++; }
    const permises = couleursG.map((m, g) => [...m].filter(([, v]) => v >= 0.02 * tailleG[g]).map(([cc]) => cc).sort((a, b) => L.get(a) - L.get(b) || a - b));
    // correction d'ombrage de chaque pixel : niveau du morceau - moyenne locale ; lissée d'une image à
    // l'autre comme les normales (un même point du corps garde la même correction, sinon le neutre
    // scintille) ; sous SEUIL_NEUTRE L*, le pixel garde sa couleur (le dessin n'est pas retouché pour
    // un ombrage négligeable, et l'arrondi à la palette ne bascule pas d'une frame à l'autre)
    const R = V2.RHO;
    const corr = new Float64Array(NP), zero = new Float64Array(NP), garde = new Uint8Array(NP);
    for (const p of opqList) {
      const i = inst[p];
      if (i < 0 || nb[i] < V2.DET_MIN) continue;
      const x = p % w, y = (p - x) / w;
      let s = 0, k = 0;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (inst[q] === i) { s += L.get(col[q]); k++; }
        }
      }
      corr[p] = niveau[i] - s / k;
      garde[p] = 1;
    }
    if (c.cadres) {
      const m = new Int32Array(NP).fill(-1);
      for (const p of opqList) if (garde[p]) m[p] = instRampe[inst[p]];
      lisserNormalesTemps(corr, zero, m, c.cadres, w, h);
    }
    for (const p of opqList) {
      if (!garde[p] || Math.abs(corr[p]) < V2.SEUIL_NEUTRE) continue;
      const cible = L.get(col[p]) + corr[p];
      let best = col[p], bv = Math.abs(L.get(col[p]) - cible);
      for (const cc of permises[groupe[inst[p]]]) { const v = Math.abs(L.get(cc) - cible); if (v < bv) { bv = v; best = cc; } }
      neutral[p] = best;
    }
    // marge sous le blanc, par rampe (même rapport pour toutes ses couleurs : détail gardé)
    const maxi = new Map();
    for (const p of opqList) {
      if (inst[p] < 0) continue;
      const cc = neutral[p], m = Math.max((cc >> 16) & 255, (cc >> 8) & 255, cc & 255);
      maxi.set(instRampe[inst[p]], Math.max(maxi.get(instRampe[inst[p]]) || 0, m));
    }
    for (const p of opqList) {
      if (inst[p] < 0) continue;
      const k = Math.min(1, V2.PLAFOND / (maxi.get(instRampe[inst[p]]) || 255)), cc = neutral[p];
      if (k < 1) neutral[p] = (pyRound(((cc >> 16) & 255) * k) << 16) | (pyRound(((cc >> 8) & 255) * k) << 8) | pyRound((cc & 255) * k);
    }
    return neutral;
  }

  // Normales : lissées d'une image à l'autre (mêmes pixels de même matière après recalage du corps
  // entier), AVANT d'être arrondies en sections : une orientation ne bascule plus pour un pixel.
  function lisserNormalesTemps(nx, ny, mat, cadres, w, h) {
    const { n, fw, gap } = cadres;
    if (!(n > 1)) return;
    const F = [];
    for (let i = 0; i < n; i++) {
      const a = new Int32Array(fw * h).fill(-1), liste = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < fw; x++) {
          const P = y * w + i * (fw + gap) + x;
          if (mat[P] >= 0) { a[y * fw + x] = mat[P]; liste.push(y * fw + x); }
        }
      }
      F.push({ a, liste });
    }
    const dec = new Map();
    for (let i = 0; i < n; i++) for (const j of [pyMod(i - 1, n), pyMod(i + 1, n)]) if (!dec.has(i * n + j)) dec.set(i * n + j, meilleurDecalage(F[i].a, F[j].a, fw, h, F[i].liste, 3, 1));
    for (let it = 0; it < V2.TEMPS; it++) {
      const ox = Float64Array.from(nx), oy = Float64Array.from(ny);
      for (let i = 0; i < n; i++) {
        for (const p of F[i].liste) {
          const x = p % fw, y = (p - x) / fw, P = y * w + i * (fw + gap) + x;
          let sx = ox[P], sy = oy[P], sw = 1;   // poids égaux : la frame et ses deux voisines
          for (const j of [pyMod(i - 1, n), pyMod(i + 1, n)]) {
            const [dx, dy] = dec.get(i * n + j), X = x + dx, Y = y + dy;
            if (X < 0 || Y < 0 || X >= fw || Y >= h || F[j].a[Y * fw + X] !== F[i].a[p]) continue;
            const Q = Y * w + j * (fw + gap) + X;
            sx += ox[Q]; sy += oy[Q]; sw++;
          }
          nx[P] = sx / sw; ny[P] = sy / sw;
        }
      }
    }
  }

  // Analyse d'une image (sprite seul ou mosaïque des frames d'une animation) par la méthode A, B ou
  // C. cadres : { n, fw, gap } si `im` est une mosaïque de n frames de fw px séparées de gap px.
  // Même sortie qu'analyse() (+ fin : table fine).
  function analyseV2(im, garder, rampes, tailleRef, methode, cadres) {
    const w = im.width, h = im.height, d = im.data, NP = w * h;
    const opq = new Uint8Array(NP), col = new Int32Array(NP).fill(-1), opqList = [];
    for (let p = 0; p < NP; p++) if (d[p * 4 + 3] >= 128) { opq[p] = 1; opqList.push(p); col[p] = rgbInt(d, p * 4); }
    const dans = (x, y) => x >= 0 && y >= 0 && x < w && y < h && opq[y * w + x] === 1;
    const counts = new Map();
    for (const p of opqList) compter(counts, col[p]);
    const colors = [...counts.keys()];
    const adj = new Map();
    for (const p of opqList) {
      const x = p % w, y = (p - x) / w;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (!dans(x + dx, y + dy)) continue;
        const q = (y + dy) * w + x + dx;
        if (col[q] !== col[p]) compter(adj, Math.min(col[p], col[q]) * 16777216 + Math.max(col[p], col[q]));
      }
    }
    const L = new Map(colors.map((c) => [c, lab(c)[0]]));
    const chroma = new Map(colors.map((c) => [c, Math.hypot(lab(c)[1], lab(c)[2])]));
    const n = opqList.length;
    const dark = traitsV2(colors, counts, L, n, col, opqList, w, h);

    // détails gardés (œil) : comme analyse()
    const prot = new Uint8Array(NP);
    const rare = Math.max(4, Math.trunc(0.01 * n));
    const chromas = opqList.map((p) => chroma.get(col[p])).sort((a, b) => a - b);
    const medC = chromas[Math.floor(n / 2)];
    const seeds = new Set(colors.filter((c) => counts.get(c) < rare && chroma.get(c) > Math.max(45, 1.4 * medC)));
    for (const g of garder) seeds.add(parseHex(g));
    let front = opqList.filter((p) => seeds.has(col[p]));
    for (const p of front) prot[p] = 1;
    for (let it = 0; it < 2; it++) {
      const nxt = new Set();
      for (const p of front) {
        const x = p % w, y = (p - x) / w;
        for (const [dx, dy] of N8) {
          if (!dans(x + dx, y + dy)) continue;
          const q = (y + dy) * w + x + dx;
          if (!prot[q] && counts.get(col[q]) < rare) nxt.add(q);
        }
      }
      for (const q of nxt) prot[q] = 1;
      front = [...nxt];
    }
    const pc = new Map();
    for (const p of opqList) if (prot[p]) compter(pc, col[p]);
    const protC = new Set([...pc].filter(([c, v]) => v === counts.get(c)).map(([c]) => c));
    const forced = rampes.map((g) => g.split(',').filter((t) => t.trim()).map(parseHex));
    const ramps = clusterRampsV2(colors, counts, adj, dark, protC, forced);
    const rampOf = new Map();
    ramps.forEach((r, i) => r.forEach((c) => rampOf.set(c, i)));
    const line = new Uint8Array(NP);
    for (const p of opqList) if (dark.has(col[p]) && !prot[p]) line[p] = 1;
    const body = opqList.filter((p) => !line[p]);
    const mat = new Int32Array(NP).fill(-1);   // matière (rampe) de chaque pixel du corps
    for (const p of body) if (!prot[p] && rampOf.has(col[p])) mat[p] = rampOf.get(col[p]);

    // morceaux de matière : composantes 4-connexes de même rampe (traits et détails exclus)
    const inst = composantes(body, w, h, NP, (q, c) => mat[q] >= 0 && mat[q] === mat[c]);
    const instRampe = [];
    for (const p of body) if (inst[p] >= 0) instRampe[inst[p]] = mat[p];
    const neutral = neutreV2({ w, h, NP, opqList, col, ramps, L, inst, instRampe, cadres });

    // contour extérieur (vecteurs vers le vide) ; traits intérieurs et leur longueur
    const oD = new Float64Array(NP), oVX = new Float64Array(NP), oVY = new Float64Array(NP);
    nearestVectors(w, (X, Y) => !dans(X, Y), opqList, 6, oD, oVX, oVY);
    const interieur = opqList.filter((p) => {
      if (!line[p]) return false;
      const x = p % w, y = (p - x) / w;
      for (const [dx, dy] of N8) if (!dans(x + dx, y + dy)) return false;
      return true;
    });
    const traitReg = composantes(interieur, w, h, NP, (q) => line[q] === 1 && oD[q] > 1.5);
    const longueur = new Map();
    for (const p of interieur) if (traitReg[p] >= 0) compter(longueur, traitReg[p]);
    // barrière : traits gardés, épaissis d'1 px (8 voisins) pour fermer les trous de 1-2 px
    const barriere = (garde) => {
      const b = new Uint8Array(NP);
      for (const p of opqList) {
        if (!line[p] || !garde(p)) continue;
        b[p] = 1;
        const x = p % w, y = (p - x) / w;
        for (const [dx, dy] of N8) if (dans(x + dx, y + dy)) b[(y + dy) * w + x + dx] = 1;
      }
      return b;
    };
    const exterieur = (p) => traitReg[p] < 0;   // contour et traits qui le touchent

    // ---- parties
    let part, barriereVue = null;
    if (methode === 'A') {
      // masses : partage des eaux sur l'épaisseur (au contour, aux longs traits ; les traits plus
      // courts creusent sans couper) + l'ombrage peint ; seuls le contour et les longs traits coupent
      const barrier = barriereVue = barriere((p) => exterieur(p) || longueur.get(traitReg[p]) >= V2.TRAIT_LONG);
      const vallees = new Uint8Array(NP);
      for (const p of opqList) if (line[p] && longueur.get(traitReg[p]) >= V2.TRAIT_MIN) vallees[p] = 1;
      for (const p of massesOmbrage({ w, h, NP, s: 1, body, prot, col, rampOf, ramps, L, counts, barrier, vallees, amin: V2.MASSE_MIN, platRel: 0.1 })) barrier[p] = 1;
      part = composantes(body, w, h, NP, (q) => !barrier[q]);
      remplirRegions(part, body, w, h, (p, q) => mat[p] === mat[q]);
    } else if (methode === 'C') {
      // traits : régions fermées par les traits (les très courts, texture, ne coupent pas), bouts
      // de traits prolongés jusqu'au trait ou au vide le plus proche (PONT px)
      const garde = (p) => exterieur(p) || longueur.get(traitReg[p]) >= V2.TRAIT_MIN;
      const barrier = barriereVue = barriere(garde);
      // traits dessinés dans une couleur de la matière (brun foncé entre bras et torse, mèches) :
      // pixels en CREUX, plus sombres de CREUX L* que leurs deux voisins d'un axe (trait de 1 ou 2
      // px) ; les points isolés (texture, moins de 3 px) ne coupent pas
      const Lp = (x, y) => (dans(x, y) ? L.get(col[y * w + x]) : null);
      const creux = new Uint8Array(NP);
      for (const p of body) {
        if (prot[p]) continue;
        const x = p % w, y = (p - x) / w, l = L.get(col[p]);
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
          const a = Lp(x - dx, y - dy), b = Lp(x + dx, y + dy), c2 = Lp(x + 2 * dx, y + 2 * dy);
          if (a === null || b === null) continue;
          if (a - l >= V2.CREUX && b - l >= V2.CREUX) { creux[p] = 1; break; }
          if (a - l >= V2.CREUX && Math.abs(b - l) <= 4 && c2 !== null && c2 - l >= V2.CREUX) { creux[p] = 1; creux[(y + dy) * w + x + dx] = 1; break; }
        }
      }
      const cc = composantes(body, w, h, NP, (q) => creux[q] === 1), tc = new Map();
      for (const p of body) if (cc[p] >= 0) compter(tc, cc[p]);
      const traits = Uint8Array.from(line);
      for (const p of body) if (cc[p] >= 0 && tc.get(cc[p]) >= 3) { traits[p] = 1; barrier[p] = 1; }
      const pts = pontsTraits(traits, (p) => !line[p] || garde(p), opq, w, h);
      for (let p = 0; p < NP; p++) if (pts[p]) barrier[p] = 1;
      // et les bords de couleur francs (écart Lab >= BORD) : ces sprites séparent souvent cheveux
      // et visage, cape et tunique par la couleur seule, sans trait
      part = composantes(body, w, h, NP, (q, c) => !barrier[q] && (q === c || dist3(lab(col[q]), lab(col[c])) < V2.BORD));
      remplirRegions(part, body, w, h, (p, q) => mat[p] === mat[q]);
    } else {
      // matières : un morceau = une partie, détails rendus au morceau voisin ; un MOTIF (taches de
      // Xara, boucle, broderie : morceau bordé surtout par un seul autre morceau, plus grand) fait
      // partie de celui qui le porte ; puis coupe aux étranglements
      part = Int32Array.from(inst);
      fondreRegions(part, w, h, V2.DET_MIN);
      remplirRegions(part, body, w, h, null);
      const contourExt = new Uint8Array(NP);
      for (const p of opqList) if (line[p] && exterieur(p)) contourExt[p] = 1;
      porterMotifs(part, body, w, h, contourExt);
      part = couperEtranglements(part, body, w, h);
    }
    // C : les bords de couleur francs découpent plus finement (fourrure, plis) : parties de 40 px au moins
    let nReg = fondreRegions(part, w, h, methode === 'C' ? V2.PART_MIN_C : V2.PART_MIN);
    // bandes minces (ceinture, lanière : 3 px d'épaisseur au plus) : suivent la partie qui les porte
    if (methode === 'B') nReg = fondreMinces(part, body, w, h);

    // ---- volume d'ensemble : silhouette floutée (comme analyse())
    const tr = tailleRef || [w, h];
    const gblur = Math.max(GBLUR_MIN, GBLUR_REL * Math.min(tr[0], tr[1]));
    const gp = Math.trunc(2.5 * gblur) + 2;
    const MW = w + 2 * gp, MH = h + 2 * gp;
    const mask = new Uint8Array(MW * MH);
    for (const p of opqList) { const x = p % w, y = (p - x) / w; mask[(y + gp) * MW + x + gp] = 255; }
    const hill = flouGaussien(mask, MW, MH, gblur);
    const gX = new Float64Array(NP), gY = new Float64Array(NP), mags = [];
    for (const p of opqList) {
      const x = p % w, y = (p - x) / w, X = x + gp, Y = y + gp;
      gX[p] = -(hill[Y * MW + X + 1] - hill[Y * MW + X - 1]) / 2.0;
      gY[p] = (hill[(Y + 1) * MW + X] - hill[(Y - 1) * MW + X]) / 2.0;
      mags.push(Math.hypot(gX[p], gY[p]));
    }
    mags.sort((a, b) => a - b);
    const gmax = mags[Math.trunc(mags.length * 0.97)] || 1.0;

    // ---- relief de chaque partie. Les traits INTÉRIEURS (poils du grizzly, plis) sont rendus à la
    // partie voisine pour le relief : sinon chacun fait un trou dans le masque flouté, et le dôme
    // se creuse en rigoles le long de chaque trait (sections en rayures)
    const rel = Int32Array.from(part);
    const traitsInt = opqList.filter((p) => line[p] && !exterieur(p));
    remplirRegions(rel, traitsInt, w, h, null);
    let nRel = nReg;
    for (const p of traitsInt) nRel = Math.max(nRel, rel[p] + 1);
    const pgX = new Float64Array(NP), pgY = new Float64Array(NP);
    const membres = Array.from({ length: nRel }, () => []);
    for (const p of opqList) if (rel[p] >= 0) membres[rel[p]].push(p);
    const D = distanceRegions(rel, w, h);
    for (let r = 0; r < nRel; r++) {
      const ms = membres[r];
      if (!ms.length) continue;
      let prof = 0, bx0 = w, by0 = h, bx1 = -1, by1 = -1;
      for (const p of ms) { const x = p % w, y = (p - x) / w; prof = Math.max(prof, D[p]); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
      // marge : étalement du flou (3 passes de boîte) autour de la partie
      const pad = 3 * (Math.ceil(Math.max(1.2, 0.5 * prof)) + 2) + 2;
      const CX0 = bx0 - pad, CY0 = by0 - pad, CW = bx1 - bx0 + 1 + 2 * pad, CH = by1 - by0 + 1 + 2 * pad;
      const H = new Float64Array(CW * CH);
      const at = (p) => { const x = p % w, y = (p - x) / w; return (y - CY0) * CW + x - CX0; };
      if (methode === 'C') {
        // coussin : profil circulaire sur R px depuis le bord, centre plat (de face)
        const R = Math.max(1.5, Math.min(6, 0.75 * prof));
        for (const p of ms) { const t = Math.min(1, D[p] / R); H[at(p)] = R * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))); }
        let pmx = 0;
        for (const p of ms) {
          const i = at(p);
          const gx = -(H[i + 1] - H[i - 1]) / 2.0, gy = (H[i + CW] - H[i - CW]) / 2.0;
          const m = Math.sqrt(1 + gx * gx + gy * gy);
          pgX[p] = gx / m; pgY[p] = gy / m;
          pmx = Math.max(pmx, Math.hypot(pgX[p], pgY[p]));
        }
        // bord ramené à 1 comme le dôme, puis x GAIN_COUSSIN (plafonné à 1) : le liseré du coussin
        // est RASANT sur 2 px (sinon, avec une seule bague de 70° d'1 px, le contre-jour n'atteint
        // presque jamais le dernier palier : test 11, crapaud, loup, grizzly)
        pmx = pmx || 1.0;
        for (const p of ms) {
          const k = V2.GAIN_COUSSIN / pmx, m = Math.hypot(pgX[p], pgY[p]) * k;
          const f = m > 1 ? k / m : k;
          pgX[p] *= f; pgY[p] *= f;
        }
      } else {
        // dôme sur toute la partie : masque flouté, rayon = moitié de sa profondeur. Les pixels des
        // AUTRES parties (corps) valent VOISIN, le vide et le contour 0 : le bord est rasant contre le
        // vide, seulement incliné contre une partie voisine (deux masses accolées, épaule et flanc du
        // grizzly, ne font pas un pli à angle droit : sinon des rayures d'ombre et de lumière)
        const rad = Math.max(1.2, 0.5 * prof);
        const pm = new Uint8Array(CW * CH);
        for (let y = Math.max(0, CY0); y < Math.min(h, CY0 + CH); y++) {
          for (let x = Math.max(0, CX0); x < Math.min(w, CX0 + CW); x++) {
            const q = y * w + x;
            if (rel[q] >= 0 && rel[q] !== r) pm[(y - CY0) * CW + x - CX0] = V2.VOISIN;
          }
        }
        for (const p of ms) pm[at(p)] = 255;
        const ph = flouGaussien(pm, CW, CH, rad);
        let pmx = 0;
        for (const p of ms) {
          const i = at(p);
          pgX[p] = -(ph[i + 1] - ph[i - 1]) / 2.0;
          pgY[p] = (ph[i + CW] - ph[i - CW]) / 2.0;
          pmx = Math.max(pmx, Math.hypot(pgX[p], pgY[p]));
        }
        pmx = pmx || 1.0;
        for (const p of ms) { pgX[p] /= pmx; pgY[p] /= pmx; }
      }
    }
    const nx = new Float64Array(NP), ny = new Float64Array(NP);
    for (const p of body) {
      const gn = Math.hypot(gX[p], gY[p]) || 1.0;
      const gk = V2.W_GLOBAL * Math.pow(Math.min(1.0, Math.hypot(gX[p], gY[p]) / gmax), 0.8);
      nx[p] = gX[p] / gn * gk + V2.W_PART * pgX[p];
      ny[p] = gY[p] / gn * gk + V2.W_PART * pgY[p];
    }
    if (cadres) {
      const m = new Int32Array(NP).fill(-1);
      for (const p of body) m[p] = mat[p] >= 0 ? mat[p] : 100000 + col[p];
      lisserNormalesTemps(nx, ny, m, cadres, w, h);
    }

    // ---- sections (table fine), contour, traits, filtres
    let codes = new Int32Array(NP).fill(-1);
    const ordre = [];
    for (const p of body) { codes[p] = quantize(nx[p], ny[p], true); ordre.push(p); }
    const outline = new Uint8Array(NP);
    for (const p of opqList) {
      if (!line[p] || oD[p] > 2.3) continue;
      outline[p] = 1;
      const m = Math.hypot(oVX[p], oVY[p]) || 1;
      codes[p] = quantize(oVX[p] / m, -oVY[p] / m, true);
      ordre.push(p);
    }
    let pending = opqList.filter((p) => codes[p] < 0);
    for (let it = 0; it < 6 && pending.length; it++) {
      const pose = [], rest = [];
      for (const p of pending) {
        const x = p % w, y = (p - x) / w;
        const cnt = new Map();
        for (const [dx, dy] of N8) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (codes[q] >= 0 && !outline[q]) compter(cnt, codes[q]);
        }
        if (cnt.size) pose.push([p, plusFrequent(cnt)[0]]); else rest.push(p);
      }
      for (const [p, c] of pose) { codes[p] = c; ordre.push(p); }
      pending = rest;
    }
    for (const p of pending) { codes[p] = 0; ordre.push(p); }
    const regall = new Int32Array(NP).fill(-9);
    for (const p of opqList) regall[p] = part[p] >= 0 ? part[p] : outline[p] ? -2 : -3;
    codes = modeFilter(codes, ordre, w, h, regall, outline, 2);
    codes = mergeSmall(codes, ordre, w, h, V2.ZONE_MIN, outline);
    codes = heriterBord(codes, opq, w, h);
    codes = sansMiettes(codes, opqList, w, h);

    const base = ramps.map((r) => rampBase(r, counts));
    const info = {
      ramps: ramps.map((r, i) => [hexc(base[i]), r.slice().sort((a, b) => L.get(a) - L.get(b)).map(hexc)]),
      lines: [...dark].map(hexc).sort(), protected: [...new Set(opqList.filter((p) => prot[p]).map((p) => hexc(col[p])))].sort(),
      parts: nReg, outline, rampOf, methode,
    };
    // part, inst, rel, barriere : pour les vues de diagnostic (morceaux de matière, parties, relief)
    return { opq, opqList, neutral, codes, info, fin: true, part, inst, barriere: barriereVue, rel };
  }

  // Dernière passe (après heriterBord, qui peut laisser un pixel isolé sur le bord) : plus aucune
  // zone sous ZONE_MIN, contour compris (au plus 3 tours de mergeSmall, sans pixel gardé)
  function sansMiettes(codes, liste, w, h) {
    const rien = new Uint8Array(w * h);
    for (let it = 0; it < 3; it++) codes = mergeSmall(codes, liste, w, h, V2.ZONE_MIN, rien);
    return codes;
  }

  // Aiguillage : méthode A, B ou C sur un petit sprite, sinon analyse() (sections.py, grands sprites)
  function analyser(im, garder, rampes, peint, tailleRef, echelle, methode, cadres) {
    if (estV2(methode, echelle)) return analyseV2(im, garder || [], rampes || [], tailleRef, methode, cadres);
    return analyse(im, garder || [], rampes || [], peint, tailleRef, echelle);
  }

  // ------------------------------------------------------------ images
  // PNG en RGBA 8 bits (palette, gris, 16 bits convertis), sans gestion de couleur, comme Pillow
  const nouvelle = (w, h) => ({ width: w, height: h, data: new Uint8Array(w * h * 4) });
  function boite(im, seuil) {   // getbbox() de l'alpha (>= seuil) : [x0, y0, x1, y1) ou null
    let x0 = im.width, y0 = im.height, x1 = -1, y1 = -1;
    for (let y = 0; y < im.height; y++) {
      for (let x = 0; x < im.width; x++) {
        if (im.data[(y * im.width + x) * 4 + 3] < seuil) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
  }
  function rogner(im, b) {
    const out = nouvelle(b[2] - b[0], b[3] - b[1]);
    for (let y = b[1]; y < b[3]; y++) {
      for (let x = b[0]; x < b[2]; x++) {
        if (x < 0 || y < 0 || x >= im.width || y >= im.height) continue;
        const s = (y * im.width + x) * 4, t = ((y - b[1]) * out.width + x - b[0]) * 4;
        for (let k = 0; k < 4; k++) out.data[t + k] = im.data[s + k];
      }
    }
    return out;
  }
  function coller(dst, src, ox, oy) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const X = x + ox, Y = y + oy;
        if (X < 0 || Y < 0 || X >= dst.width || Y >= dst.height) continue;
        const s = (y * src.width + x) * 4, t = (Y * dst.width + X) * 4;
        for (let k = 0; k < 4; k++) dst.data[t + k] = src.data[s + k];
      }
    }
  }

  function saveMaps(w, h, opq, neutral, codes) {
    const neu = nouvelle(w, h), sec = nouvelle(w, h), nor = nouvelle(w, h);
    for (let p = 0; p < w * h; p++) {
      nor.data[p * 4] = 128; nor.data[p * 4 + 1] = 128; nor.data[p * 4 + 2] = 255;
      if (!opq[p]) continue;
      const c = neutral[p], s = SECTIONS[codes[p]][1], nn = encodeNormal(sectionNormal(codes[p]));
      neu.data.set([(c >> 16) & 255, (c >> 8) & 255, c & 255, 255], p * 4);
      sec.data.set([s[0], s[1], s[2], 255], p * 4);
      nor.data.set([nn[0], nn[1], nn[2], 255], p * 4);
    }
    return { neu, sec, nor };
  }

  // ------------------------------------------------------------ carte contre-jour (v16, carte_cj de sections.py)
  // Les normales de face ne savent pas ce qui est exposé par l'ARRIÈRE : une carte dédiée le dit.
  // <nom>_cj.png (RGBA, taille native) : R, G = direction 2D du bord exposé (x droite, y HAUT,
  // v = c / 255 x 2 - 1 ; 128 = aucune) ; B = exposition arrière 0-255 ; A = 255 sur le sprite.
  // <nom>_cj-apercu.png : teinte = direction (0° rouge = droite, 90° = haut, sens trigo),
  // luminosité = exposition (noir = rien) ; retouchable, relu par --depuis-cj.
  const CJ_PORTEE = 12.0;   // px : longueur maximale de la décroissance, mesurée DANS la section
  const CJ_SOMBRE = 0.16;   // luminance du neutre sous laquelle un pixel est un trait sombre (= shader)
  const CJ_CONTOUR = 2;     // un trait sombre à <= 2 px du vide est le contour extérieur (laisse passer)
  const CJ_FRANGE = 2;      // adoucissement : 2 px dans la section voisine (x 0,5 par px), jamais à travers un trait
  const CJ_LISSE = 2;       // direction lissée sur (2 x 2 + 1)^2 pixels de la même zone

  // tas binaire ordonné comme les tuples de heapq : (d, p.x, p.y, s.x, s.y)
  function tasPlusPetit(a, b) {
    for (let k = 0; k < 5; k++) if (a[k] !== b[k]) return a[k] < b[k];
    return false;
  }
  function tasAjouter(t, e) {
    t.push(e);
    let i = t.length - 1;
    while (i > 0) {
      const j = (i - 1) >> 1;
      if (!tasPlusPetit(t[i], t[j])) break;
      [t[i], t[j]] = [t[j], t[i]];
      i = j;
    }
  }
  function tasRetirer(t) {
    const top = t[0], fin = t.pop();
    if (t.length) {
      t[0] = fin;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < t.length && tasPlusPetit(t[l], t[m])) m = l;
        if (r < t.length && tasPlusPetit(t[r], t[m])) m = r;
        if (m === i) break;
        [t[i], t[m]] = [t[m], t[i]];
        i = m;
      }
    }
    return top;
  }

  // math.hypot de Python (arrondi correct) : Math.hypot de V8 peut s'écarter du dernier bit, ce qui
  // changeait le signe de directions presque nulles (127 / 128 dans la carte contre-jour)
  function decomposer(v) {   // v > 0 fini -> [mantisse BigInt, exposant] avec v = m x 2^e
    const b = new DataView(new ArrayBuffer(8));
    b.setFloat64(0, v);
    const hi = b.getUint32(0), lo = b.getUint32(4);
    let e = (hi >>> 20) & 0x7ff;
    let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    if (e === 0) e = 1; else m |= 1n << 52n;
    return [m, e - 1075];
  }
  function voisinDouble(v, sens) {
    const b = new DataView(new ArrayBuffer(8));
    b.setFloat64(0, v);
    b.setBigUint64(0, b.getBigUint64(0) + BigInt(sens));
    return b.getFloat64(0);
  }
  function hypotPy(x, y) {
    x = Math.abs(x); y = Math.abs(y);
    if (!x || !y) return x + y;
    const [mx, ex] = decomposer(x), [my, ey] = decomposer(y);
    const h0 = Math.sqrt(x * x + y * y);
    const cands = [voisinDouble(h0, -1), h0, voisinDouble(h0, 1)];
    const parts = cands.map(decomposer);
    const E = Math.min(2 * ex, 2 * ey, ...parts.map((p) => 2 * p[1]));
    const S = ((mx * mx) << BigInt(2 * ex - E)) + ((my * my) << BigInt(2 * ey - E));
    let best = -1, bd = null;
    parts.forEach(([m, e], i) => {
      let d = ((m * m) << BigInt(2 * e - E)) - S;
      if (d < 0n) d = -d;
      if (bd === null || d < bd || (d === bd && (m & 1n) === 0n)) { bd = d; best = i; }
    });
    return cands[best];
  }

  // nat : sprite natif (silhouette), nor : normales, neu : neutre (traits sombres) ;
  // fin : sections de la table fine à s = 1 (méthodes A, B, C). La propagation y reste par section
  // EXACTE, comme sections.py : par direction (règle des grands sprites), le liseré s'élargissait
  // à toutes les bagues et l'anneau allumé à contre-jour dépassait 35 % (test 6, Agarica).
  function carteCj(nat, nor, neu, echelle, fin) {   // eslint-disable-line no-unused-vars
    const s = echelle > 1 ? echelle : 1;
    const contour = CJ_CONTOUR * s, frange = aL(CJ_FRANGE, s), lisse = aL(CJ_LISSE, s), portee = CJ_PORTEE * s;
    const demi = s > 1 ? Math.pow(0.5, 1 / s) : 0.5;   // même atténuation totale sur 2 s px
    const w = nat.width, h = nat.height, NP = w * h;
    const opqM = new Uint8Array(NP);
    for (let p = 0; p < NP; p++) opqM[p] = nat.data[p * 4 + 3] >= 128 ? 1 : 0;
    const g = GEO.geometrie(opqM, w, h), pad = g.pad, GW = g.width;
    const opq = [];
    for (let p = 0; p < NP; p++) if (nor.data[p * 4 + 3] >= 128) opq.push(p);
    const S = new Uint8Array(NP);
    for (const p of opq) S[p] = 1;
    const dans = (x, y) => x >= 0 && y >= 0 && x < w && y < h && S[y * w + x] === 1;
    const D = new Int32Array(NP), sec = new Int32Array(NP).fill(-1), pente = new Float64Array(NP), passe = new Uint8Array(NP);
    for (const p of opq) {
      const x = p % w, y = (p - x) / w;
      D[p] = (g.data[((y + pad) * GW + x + pad) * 4] / 16) | 0;
      sec[p] = rgbInt(nor.data, p * 4);
      // grand sprite (table fine, 3 bagues) : l'exposition passe d'une bague à l'autre dans la même
      // direction (la rasante continue en inclinée), sinon chaque bague étroite s'éteint tout de suite
      if (s > 1) {
        const nx = nor.data[p * 4] / 255 * 2 - 1, ny = nor.data[p * 4 + 1] / 255 * 2 - 1;
        sec[p] = Math.hypot(nx, ny) < 0.05 ? -2 : pyMod(Math.round(Math.atan2(ny, nx) * 180 / Math.PI / 30), 12);
      }
      const v = hypotPy(nor.data[p * 4] / 255 * 2 - 1, nor.data[p * 4 + 1] / 255 * 2 - 1) / 0.93;
      pente[p] = v < 0.05 ? 0.0 : Math.min(1.0, v);
      const lum = (0.3 * neu.data[p * 4] + 0.59 * neu.data[p * 4 + 1] + 0.11 * neu.data[p * 4 + 2]) / 255;
      passe[p] = lum >= CJ_SOMBRE || D[p] <= contour ? 1 : 0;
    }
    // normale extérieure aux sources (somme des directions vers le vide ; y vers le HAUT)
    const src = new Map();
    for (const p of opq) {
      if (D[p] !== 1 || !passe[p]) continue;
      const x = p % w, y = (p - x) / w;
      let vx = 0.0, vy = 0.0;
      for (const [dx, dy] of N8) {
        if (dans(x + dx, y + dy)) continue;
        const k = dx && dy ? 0.7071 : 1.0;
        vx += dx * k;
        vy -= dy * k;
      }
      const m = hypotPy(vx, vy);
      src.set(p, m > 1e-6 ? [vx / m, vy / m] : [0.0, 0.0]);
    }
    // distance géodésique dans la même section (Dijkstra, même ordre de sortie que heapq)
    const dist = new Map(), vdir = new Map();
    const tas = [];
    for (const p of src.keys()) { const x = p % w, y = (p - x) / w; tasAjouter(tas, [0.0, x, y, x, y]); }
    while (tas.length) {
      const [d, x, y, sx, sy] = tasRetirer(tas);
      const p = y * w + x;
      if (dist.has(p)) continue;
      dist.set(p, d);
      vdir.set(p, src.get(sy * w + sx));
      for (const [dx, dy] of N8) {
        const X = x + dx, Y = y + dy, q = Y * w + X;
        if (dans(X, Y) && !dist.has(q) && passe[q] && sec[q] === sec[p]) tasAjouter(tas, [d + (dx && dy ? 1.4142 : 1.0), X, Y, sx, sy]);
      }
    }
    // zones : pixels atteints, reliés dans la même section ; profondeur max de chaque zone
    const zone = new Map(), prof = [];
    for (const p of dist.keys()) {
      if (zone.has(p)) continue;
      const k = prof.length, pile = [p];
      let dm = 0.0;
      zone.set(p, k);
      while (pile.length) {
        const c = pile.pop(), cx = c % w, cy = (c - cx) / w;
        dm = Math.max(dm, dist.get(c));
        for (const [dx, dy] of N8) {
          const X = cx + dx, Y = cy + dy, q = Y * w + X;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          if (dist.has(q) && !zone.has(q) && sec[q] === sec[c]) { zone.set(q, k); pile.push(q); }
        }
      }
      prof.push(dm);
    }
    const ex = new Map(), dl = new Map();
    for (const [p, d] of dist) {
      const L = Math.min(prof[zone.get(p)] + 1.0, portee);
      const t = Math.min(1.0, d / L);
      ex.set(p, (1.0 - t * t * (3 - 2 * t)) * pente[p]);
      const x = p % w, y = (p - x) / w;
      let ax = 0.0, ay = 0.0;
      for (let a = -lisse; a <= lisse; a++) {
        for (let b = -lisse; b <= lisse; b++) {
          const X = x + a, Y = y + b;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const q = Y * w + X;
          if (zone.get(q) === zone.get(p)) { ax += vdir.get(q)[0]; ay += vdir.get(q)[1]; }
        }
      }
      const m = hypotPy(ax, ay);
      dl.set(p, m > 1e-6 ? [ax / m, ay / m] : vdir.get(p));
    }
    // frange d'adoucissement : chaque pixel reçoit au moins la moitié de son voisin le plus exposé
    // (2 passes : x 0,5 puis x 0,25), y compris dans une autre section, jamais à travers un trait
    for (let it = 0; it < frange; it++) {
      const ajout = new Map();
      for (const p of opq) {
        if (!passe[p]) continue;
        const x = p % w, y = (p - x) / w;
        let best = 0.0, bd = [0.0, 0.0];
        for (const [dx, dy] of N8) {
          const X = x + dx, Y = y + dy, q = Y * w + X;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          if (ex.has(q) && passe[q] && ex.get(q) > best) { best = ex.get(q); bd = dl.get(q); }
        }
        if (demi * best > (ex.has(p) ? ex.get(p) : 0.0)) ajout.set(p, [demi * best, dl.has(p) ? dl.get(p) : bd]);
      }
      for (const [p, [v, d]] of ajout) { ex.set(p, v); dl.set(p, d); }
    }
    const out = nouvelle(w, h);
    for (const p of opq) {
      const e = ex.has(p) ? ex.get(p) : 0.0;
      const [vx, vy] = e > 0 ? dl.get(p) : [0.0, 0.0];
      out.data.set([pyRound((vx * 0.5 + 0.5) * 255), pyRound((vy * 0.5 + 0.5) * 255), pyRound(255 * e), 255], p * 4);
    }
    return out;
  }

  // colorsys de Python (hsv_to_rgb, rgb_to_hsv), pour un aperçu identique à sections.py
  function pyModF(a, b) { let m = a % b; if (m && (m < 0) !== (b < 0)) m += b; return m; }
  function hsvVersRgb(hh, s, v) {
    if (s === 0.0) return [v, v, v];
    let i = Math.trunc(hh * 6.0);
    const f = (hh * 6.0) - i, p = v * (1.0 - s), q = v * (1.0 - s * f), t = v * (1.0 - s * (1.0 - f));
    i %= 6;
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
  }
  function rgbVersHsv(r, g, b) {
    const maxc = Math.max(r, g, b), minc = Math.min(r, g, b), rangec = maxc - minc, v = maxc;
    if (minc === maxc) return [0.0, 0.0, v];
    const s = rangec / maxc;
    const rc = (maxc - r) / rangec, gc = (maxc - g) / rangec, bc = (maxc - b) / rangec;
    let hh;
    if (r === maxc) hh = bc - gc;
    else if (g === maxc) hh = 2.0 + rc - bc;
    else hh = 4.0 + gc - rc;
    return [pyModF(hh / 6.0, 1.0), s, v];
  }

  // aperçu coloré retouchable : teinte = direction, luminosité = exposition, fond transparent
  function cjApercu(cj) {
    const out = nouvelle(cj.width, cj.height);
    for (let p = 0; p < cj.width * cj.height; p++) {
      const r = cj.data[p * 4], g = cj.data[p * 4 + 1], b = cj.data[p * 4 + 2];
      if (cj.data[p * 4 + 3] < 128) continue;
      const ang = pyModF(Math.atan2(g / 255 * 2 - 1, r / 255 * 2 - 1) * (180 / Math.PI), 360);
      const c = hsvVersRgb(ang / 360, 1.0, b / 255);
      out.data.set([pyRound(c[0] * 255), pyRound(c[1] * 255), pyRound(c[2] * 255), 255], p * 4);
    }
    return out;
  }
  // inverse : aperçu retouché à la main -> carte (gris ou noir = pas d'exposition)
  function cjDepuisApercu(ap) {
    const out = nouvelle(ap.width, ap.height);
    for (let p = 0; p < ap.width * ap.height; p++) {
      if (ap.data[p * 4 + 3] < 128) continue;
      const [hh, s, v] = rgbVersHsv(ap.data[p * 4] / 255, ap.data[p * 4 + 1] / 255, ap.data[p * 4 + 2] / 255);
      if (s < 0.2) { out.data.set([128, 128, 0, 255], p * 4); continue; }
      const ang = hh * 360 * (Math.PI / 180);
      out.data.set([pyRound((Math.cos(ang) * 0.5 + 0.5) * 255), pyRound((Math.sin(ang) * 0.5 + 0.5) * 255), pyRound(255 * v), 255], p * 4);
    }
    return out;
  }

  function normalesDepuisSections(sec, fin) {
    const nor = nouvelle(sec.width, sec.height), cache = new Map(), lues = new Set();
    for (let p = 0; p < sec.width * sec.height; p++) {
      nor.data.set([128, 128, 255, 0], p * 4);
      if (sec.data[p * 4 + 3] < 128) continue;
      const c = rgbInt(sec.data, p * 4);
      if (!cache.has(c)) cache.set(c, nearestCode([(c >> 16) & 255, (c >> 8) & 255, c & 255], fin));
      lues.add(SECTIONS[cache.get(c)][0]);
      const nn = encodeNormal(sectionNormal(cache.get(c)));
      nor.data.set([nn[0], nn[1], nn[2], 255], p * 4);
    }
    return { nor, lues };
  }

  function eclairer(neu, nor, ldir, steps = 4, amb = 0.45, inten = 0.85) {
    const out = nouvelle(neu.width, neu.height);
    const m = Math.hypot(...ldir), Ld = ldir.map((c) => c / m);
    for (let p = 0; p < neu.width * neu.height; p++) {
      if (neu.data[p * 4 + 3] < 128) continue;
      const nn = [0, 1, 2].map((k) => nor.data[p * 4 + k] / 255 * 2 - 1);
      let d = Math.max(0.0, nn[0] * Ld[0] + nn[1] * Ld[1] + nn[2] * Ld[2]);
      if (steps) d = Math.floor(d * (steps - 1) + 0.5) / (steps - 1);
      const f = amb + inten * d;
      for (let k = 0; k < 3; k++) out.data[p * 4 + k] = Math.min(255, pyRound(neu.data[p * 4 + k] * f));
      out.data[p * 4 + 3] = 255;
    }
    return out;
  }

  // planche : une colonne par sprite ; lignes origine, neutre, sections, éclairé à gauche, à droite
  function planche(colonnes, z = 4) {
    const w = colonnes[0].o.width, h = colonnes[0].o.height, pad = 4;
    const lignes = (c) => [c.o, c.neu, c.sec, eclairer(c.neu, c.nor, [-1, 0.5, 1.0]), eclairer(c.neu, c.nor, [1, 0.5, 1.0])];
    const b = nouvelle(colonnes.length * (w * z + pad) + pad, 5 * (h * z + pad) + pad);
    for (let i = 0; i < b.width * b.height; i++) b.data.set([13, 11, 26, 255], i * 4);
    colonnes.forEach((c, i) => {
      lignes(c).forEach((t, r) => {
        const ox = pad + i * (w * z + pad), oy = pad + r * (h * z + pad);
        for (let y = 0; y < t.height * z; y++) {
          for (let x = 0; x < t.width * z; x++) {
            const s = (((y / z) | 0) * t.width + ((x / z) | 0)) * 4;
            if (t.data[s + 3] < 128) continue;
            b.data.set([t.data[s], t.data[s + 1], t.data[s + 2], 255], ((oy + y) * b.width + ox + x) * 4);
          }
        }
      });
    });
    return b;
  }

  function miroir(im, inverserRouge) {
    const out = nouvelle(im.width, im.height);
    for (let y = 0; y < im.height; y++) {
      for (let x = 0; x < im.width; x++) {
        const s = (y * im.width + x) * 4, t = (y * im.width + im.width - 1 - x) * 4;
        for (let k = 0; k < 4; k++) out.data[t + k] = im.data[s + k];
        if (inverserRouge) out.data[t] = 255 - im.data[s];
      }
    }
    return out;
  }

  // ------------------------------------------------------------ image peinte (mode --echelle-jeu)
  function kmeans(items, k, iters = 12) {
    if (items.length <= k) return items.map((it) => it[0]);
    let best = items[0];
    for (const it of items) if (it[1] > best[1]) best = it;
    const cents = [best[0]];
    let dist = items.map((it) => dist3(it[0], cents[0]) ** 2 * it[1]);
    while (cents.length < k) {
      let i = 0;
      for (let j = 1; j < items.length; j++) if (dist[j] > dist[i]) i = j;
      cents.push(items[i][0]);
      dist = dist.map((dd, j) => Math.min(dd, dist3(items[j][0], cents[cents.length - 1]) ** 2 * items[j][1]));
    }
    let cs = cents;
    for (let it = 0; it < iters; it++) {
      const acc = cs.map(() => [0, 0, 0, 0]);
      for (const [l, wgt] of items) {
        let j = 0, bv = Infinity;
        cs.forEach((c, i) => { const v = dist3(l, c); if (v < bv) { bv = v; j = i; } });
        const a = acc[j];
        a[0] += l[0] * wgt; a[1] += l[1] * wgt; a[2] += l[2] * wgt; a[3] += wgt;
      }
      cs = acc.map((a, i) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cs[i]));
    }
    return cs;
  }
  function paletteLab(rgbs, ncol) {
    const cnt = new Map();
    for (const c of rgbs) compter(cnt, c);
    const bins = new Map();
    for (const [c, v] of cnt) {
      const key = (((c >> 16) & 255) >> 2) * 4096 + (((c >> 8) & 255) >> 2) * 64 + ((c & 255) >> 2);
      if (!bins.has(key)) bins.set(key, [0, 0, 0, 0]);
      const b = bins.get(key);
      b[0] += ((c >> 16) & 255) * v; b[1] += ((c >> 8) & 255) * v; b[2] += (c & 255) * v; b[3] += v;
    }
    const items = [];
    for (const b of bins.values()) {
      const rgb = (pyRound(b[0] / b[3]) << 16) | (pyRound(b[1] / b[3]) << 8) | pyRound(b[2] / b[3]);
      items.push([lab(rgb), b[3], rgb]);
    }
    let cents = kmeans(items, ncol);
    const proche = (l) => { let bc = cents[0], bv = Infinity; for (const c of cents) { const v = dist3(l, c); if (v < bv) { bv = v; bc = c; } } return bc; };
    const out = items.filter((it) => dist3(it[0], proche(it[0])) > 16);
    if (out.length) cents = cents.concat(kmeans(out, Math.min(4, out.length)));
    const idx = (l) => { let j = 0, bv = Infinity; cents.forEach((c, i) => { const v = dist3(l, c); if (v < bv) { bv = v; j = i; } }); return j; };
    const groups = new Map();
    for (const [l, wgt, rgb] of items) {
      const j = idx(l);
      if (!groups.has(j)) groups.set(j, [0, 0, 0, 0]);
      const g = groups.get(j);
      g[0] += ((rgb >> 16) & 255) * wgt; g[1] += ((rgb >> 8) & 255) * wgt; g[2] += (rgb & 255) * wgt; g[3] += wgt;
    }
    const colj = new Map([...groups].map(([j, g]) => [j, (pyRound(g[0] / g[3]) << 16) | (pyRound(g[1] / g[3]) << 8) | pyRound(g[2] / g[3])]));
    const remap = new Map();
    for (const c of cnt.keys()) {
      const l = lab(c);
      let bj = null, bv = Infinity;
      for (const j of colj.keys()) { const v = dist3(l, cents[j]); if (v < bv) { bv = v; bj = j; } }
      remap.set(c, colj.get(bj));
    }
    return remap;
  }
  function appliquerPalette(small, remap) {
    const out = nouvelle(small.width, small.height);
    for (let p = 0; p < small.width * small.height; p++) {
      if (small.data[p * 4 + 3] < 128) continue;
      const c = remap.get(rgbInt(small.data, p * 4));
      out.data.set([(c >> 16) & 255, (c >> 8) & 255, c & 255, 255], p * 4);
    }
    return out;
  }

  // ------------------------------------------------------------ facteur pixel-fixer
  // Calage de la grille de f px : décalage (pas de 0,5 px) qui rend chaque case la plus uniforme
  function phaseGrille(im, f, pas = 0.5) {
    const w = im.width, h = im.height, d = im.data;
    const dd = Math.max(1, Math.trunc(0.3 * f));
    const px = (x, y) => (y * w + x) * 4;
    const eq = (a, b) => d[a] === d[b] && d[a + 1] === d[b + 1] && d[a + 2] === d[b + 2] && d[a + 3] === d[b + 3];
    let best = [0.0, 0.0], bv = -1;
    const steps = [];
    for (let i = 0; i <= Math.trunc(f / pas); i++) if (i * pas < f) steps.push(i * pas);
    for (const ox of steps) {
      for (const oy of steps) {
        let v = 0;
        for (let y = oy + f / 2; y < h - dd; y += f) {
          for (let x = ox + f / 2; x < w - dd; x += f) {
            const cx = Math.trunc(x), cy = Math.trunc(y), c = px(cx, cy);
            if (d[c + 3] >= 128) v += eq(px(cx - dd, cy), c) + eq(px(cx + dd, cy), c) + eq(px(cx, cy - dd), c) + eq(px(cx, cy + dd), c);
          }
        }
        if (v > bv) { best = [ox, oy]; bv = v; }
      }
    }
    return best;
  }
  // 1 case de f px = 1 pixel (couleur du centre de la case) : résolution NATIVE, couleurs gardées
  function echantillonner(im, f, phase) {
    const [ox, oy] = phase;
    const w = im.width, h = im.height;
    const nw = Math.floor((w - ox) / f), nh = Math.floor((h - oy) / f);
    const out = nouvelle(nw, nh);
    for (let j = 0; j < nh; j++) {
      for (let i = 0; i < nw; i++) {
        const s = (Math.min(h - 1, Math.trunc(oy + (j + 0.5) * f)) * w + Math.min(w - 1, Math.trunc(ox + (i + 0.5) * f))) * 4;
        if (im.data[s + 3] >= 128) out.data.set([im.data[s], im.data[s + 1], im.data[s + 2], 255], (j * nw + i) * 4);
      }
    }
    return out;
  }

  // Où tombe chaque pixel natif dans l'image du jeu : colonne native = floor((x + 0,5 - gx) / f).
  // Départ : la phase trouvée ; puis affinage au 1/50e de px (les blocs de pixelfix.js sont arrondis
  // au px près) en comptant les pixels de l'image du jeu qui ont la couleur de leur pixel natif.
  function accord(hd, nat, fx, fy, gx, gy) {
    let ok = 0, tot = 0;
    for (let y = 0; y < hd.height; y++) {
      const j = Math.floor((y + 0.5 - gy) / fy);
      for (let x = 0; x < hd.width; x++) {
        const s = (y * hd.width + x) * 4, a = hd.data[s + 3] >= 128;
        const i = Math.floor((x + 0.5 - gx) / fx);
        const dansN = i >= 0 && j >= 0 && i < nat.width && j < nat.height;
        const t = dansN ? (j * nat.width + i) * 4 : -1;
        const b = dansN && nat.data[t + 3] >= 128;
        if (!a && !b) continue;
        tot++;
        if (a && b && hd.data[s] === nat.data[t] && hd.data[s + 1] === nat.data[t + 1] && hd.data[s + 2] === nat.data[t + 2]) ok++;
      }
    }
    return tot ? ok / tot : 0;
  }
  // Les bords de blocs de pixelfix.js tombent en round(g + i p) ; le pas réel p peut s'écarter un peu
  // du `f` du registre (3,782 pour 3,76 sur la marche d'Agarica : 1,5 px d'écart sur la largeur). On
  // cherche p (au 1/1000e) et g (au 1/100e) qui expliquent le plus de changements de couleur, axe
  // par axe, puis on numérote les blocs comme l'échantillonnage (centre de la case native 0 = bloc 0).
  function calerAxe(hd, f, centre0, vertical) {
    const W = hd.width, H = hd.height, d = hd.data, n = vertical ? H : W;
    const chg = new Float64Array(n);
    const cle = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] < 128 ? -1 : rgbInt(d, i); };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (vertical ? y === 0 : x === 0) continue;
        if (cle(x, y) !== (vertical ? cle(x, y - 1) : cle(x - 1, y))) chg[vertical ? y : x]++;
      }
    }
    let best = [], bv = -1;
    for (let kp = -40; kp <= 40; kp++) {
      const p = Math.round((f + kp * 0.001) * 1000) / 1000;
      for (let k = 0; k * 0.01 < p; k++) {
        const g = k * 0.01;
        let v = 0;
        for (let i = -1; g + i * p < n + 1; i++) {
          const b = Math.round(g + i * p);
          if (b > 0 && b < n) v += chg[b];
        }
        if (v > bv) { bv = v; best = [[p, g]]; } else if (v === bv) best.push([p, g]);
      }
    }
    const [p, g] = best[Math.floor(best.length / 2)];   // milieu du plateau
    return { p, g: g + Math.floor((centre0 + 0.5 - g) / p) * p };
  }
  function calerGrille(hd, nat, f, gx, gy) {
    if (f === 1) return { fx: 1, fy: 1, gx, gy, accord: accord(hd, nat, 1, 1, gx, gy) };
    // centre de la case native (0, 0) dans l'image du jeu (cf. echantillonner)
    const ax = calerAxe(hd, f, Math.trunc(gx + 0.5 * f), false);
    const ay = calerAxe(hd, f, Math.trunc(gy + 0.5 * f), true);
    return { fx: ax.p, fy: ay.p, gx: ax.g, gy: ay.g, accord: accord(hd, nat, ax.p, ay.p, ax.g, ay.g) };
  }

  // ------------------------------------------------------------ animation
  // pas > 1 (grand sprite) : un pixel sur pas compté, sinon (2 r + 1)² décalages x tous les pixels
  function meilleurDecalage(ca, cb, w, h, liste, r = 3, pas = 1) {
    let best = [0, 0], bv = -1;
    if (pas > 1) liste = liste.filter((_, i) => i % pas === 0);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        let v = 0;
        for (const p of liste) {
          const x = p % w + dx, y = ((p - p % w) / w) + dy;
          if (x >= 0 && y >= 0 && x < w && y < h && cb[y * w + x] === ca[p]) v++;
        }
        if (v > bv) { best = [dx, dy]; bv = v; }
      }
    }
    return best;
  }
  // Anti-clignotement : un pixel qui garde la même matière d'une frame à l'autre (après recalage du
  // corps entier, qui monte et descend en marchant) prend la direction majoritaire sur sa frame et ses
  // deux voisines (boucle).
  // zmin : zone minimale après le vote (méthodes A, B, C : V2.ZONE_MIN ; sinon 4 s² px)
  function lisserTemps(codes, cols, keep, listes, w, h, echelle, zmin) {
    const s = echelle > 1 ? echelle : 1;
    const n = codes.length, shifts = new Map();
    for (let i = 0; i < n; i++) {
      for (const j of [pyMod(i - 1, n), pyMod(i + 1, n)]) {
        if (!shifts.has(i * n + j)) shifts.set(i * n + j, meilleurDecalage(cols[i], cols[j], w, h, listes[i], aL(3, s), aS(1, s)));
      }
    }
    const aCote = (cds, j, x, y) => (x >= 0 && y >= 0 && x < w && y < h ? cds[y * w + x] : undefined);
    function taux(cds) {
      let diff = 0, tot = 0;
      for (let i = 0; i < n; i++) {
        const j = pyMod(i + 1, n), [dx, dy] = shifts.get(i * n + j);
        for (const p of listes[i]) {
          const x = p % w + dx, y = (p - p % w) / w + dy;
          if (keep[i][p] || aCote(cols[j], j, x, y) !== cols[i][p]) continue;
          tot++;
          diff += cds[i][p] !== cds[j][y * w + x];
        }
      }
      return diff / Math.max(1, tot);
    }
    const avant = taux(codes);
    const out = [];
    for (let i = 0; i < n; i++) {
      const nw = Int32Array.from(codes[i]);
      for (const p of listes[i]) {
        if (keep[i][p]) continue;
        const c = cols[i][p], votes = new Map([[codes[i][p], 1.0]]);
        for (const j of [pyMod(i - 1, n), pyMod(i + 1, n)]) {
          const [dx, dy] = shifts.get(i * n + j);
          for (const [ox, oy] of [[0, 0]].concat(N8)) {
            const x = p % w + dx + ox, y = (p - p % w) / w + dy + oy;
            if (aCote(cols[j], j, x, y) === c) compter(votes, codes[j][y * w + x], ox === 0 && oy === 0 ? 1.0 : 0.25);
          }
        }
        const [best, v] = plusFrequent(votes);
        if (v >= 2.0) nw[p] = best;
      }
      out.push(mergeSmall(nw, listes[i], w, h, zmin || aS(4, s), keep[i]));
    }
    return { codes: out, avant, apres: taux(out) };
  }


  // ------------------------------------------------------------ chaîne complète (CLI et page)
  // Sprite seul déjà en pixel art agrandi (f px par pixel dessiné ; f <= 0 : déjà natif) ->
  // résolution native, recadrée sur le sprite. ph : décalage de la grille ; b : boîte gardée.
  function natifSprite(hd, f) {
    if (!(f > 0)) return { nat: hd, ph: [0, 0], b: [0, 0, hd.width, hd.height] };
    const ph = phaseGrille(hd, f);
    let nat = echantillonner(hd, f, ph);
    const b = boite(nat, 1);
    if (!b) throw new Error('image vide (aucun pixel opaque)');
    nat = rogner(nat, b);
    return { nat, ph, b };
  }

  // Frames d'UNE animation -> même toile calée en bas au centre (origine (0,5 ; 1) du jeu), UNE
  // grille (phase de la 1re frame), puis recadrage sur l'union des boîtes. f <= 0 : pas de
  // rééchantillonnage (frames déjà natives, ou image peinte réduite ensuite).
  function natifsAnimation(hds, f) {
    const W = Math.max(...hds.map((i) => i.width)), H = Math.max(...hds.map((i) => i.height));
    const decal = hds.map((i) => [Math.floor((W - i.width) / 2), H - i.height]);
    let canv = hds.map((i, k) => { const c = nouvelle(W, H); coller(c, i, decal[k][0], decal[k][1]); return c; });
    let ph = [0, 0];
    if (f > 0) {
      ph = phaseGrille(canv[0], f);
      canv = canv.map((c) => echantillonner(c, f, ph));
    }
    const boxes = canv.map((c) => boite(c, 24)).filter(Boolean);
    if (!boxes.length) throw new Error('images vides (aucun pixel opaque)');
    const box = [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
    canv = canv.map((c) => rogner(c, box));
    return { canv, ph, box, decal };
  }

  // Sections d'une animation : UNE analyse sur la mosaïque des frames (mêmes matières), puis
  // lissage dans le temps (4 passes) et contour hérité. Renvoie, par frame, { opq, neutral, codes }.
  // methode : 'origine' (défaut, analyse()) ou 'A', 'B', 'C' (petits sprites, analyseV2()).
  function sectionsAnimation(canv, garder, rampes, peint, echelle, methode) {
    const s = echelle > 1 ? echelle : 1;
    const w = canv[0].width, h = canv[0].height, gap = 24;
    const mosa = nouvelle(canv.length * (w + gap) - gap, h);
    canv.forEach((c, i) => coller(mosa, c, i * (w + gap), 0));
    const v2 = estV2(methode, echelle);
    const res = analyser(mosa, garder, rampes, !!peint, [w, h], s, methode, { n: canv.length, fw: w, gap });
    const MW = mosa.width;
    const fc = [], fn = [], fcol = [], fkeep = [], listes = [], fmo = [];
    const mat = new Map();
    res.info.ramps.forEach(([, cs], idx) => cs.forEach((c) => mat.set(parseInt(c, 16), idx)));
    canv.forEach((c, i) => {
      const x0 = i * (w + gap);
      const cd = new Int32Array(w * h).fill(-1), nd = new Int32Array(w * h).fill(-1), cl = new Int32Array(w * h).fill(-1), kp = new Uint8Array(w * h);
      const mo = new Int32Array(w * h).fill(-1);   // morceau de matière (méthodes A, B, C ; -1 sinon)
      const liste = [];   // ordre du dict Python de la frame = ordre du set de la mosaïque
      for (const P of res.opqList) {
        const X = P % MW, y = (P - X) / MW, x = X - x0;
        if (x < 0 || x >= w) continue;
        const p = y * w + x;
        liste.push(p);
        cd[p] = res.codes[P]; nd[p] = res.neutral[P]; if (res.inst) mo[p] = res.inst[P];
        const col = rgbInt(mosa.data, P * 4);
        cl[p] = mat.has(col) ? mat.get(col) : 1000 + col;   // matière (rampe) ; lignes et détails : leur couleur
        kp[p] = res.info.outline[P];
      }
      fc.push(cd); fn.push(nd); fcol.push(cl); fkeep.push(kp); listes.push(liste); fmo.push(mo);
    });
    const zmin = v2 ? V2.ZONE_MIN : 0;
    let r = lisserTemps(fc, fcol, fkeep, listes, w, h, s, zmin);
    const avant = r.avant;
    for (let it = 0; it < 3; it++) r = lisserTemps(r.codes, fcol, fkeep, listes, w, h, s, zmin);
    const opqF = listes.map((l) => { const m = new Uint8Array(w * h); for (const p of l) m[p] = 1; return m; });
    const codesF = r.codes.map((c, i) => (v2 ? sansMiettes(heriterBord(c, opqF[i], w, h), listes[i], w, h) : heriterBord(c, opqF[i], w, h)));
    return { frames: canv.map((c, i) => ({ opq: opqF[i], neutral: fn[i], codes: codesF[i], fin: !!res.fin, inst: res.inst ? fmo[i] : null })), info: res.info, avant, apres: r.apres, fin: !!res.fin };
  }

  // Toutes les cartes d'un sprite natif analysé : neutre, sections, normales, contre-jour (+ aperçu)
  function cartes(nat, res, echelle) {
    const { neu, sec, nor } = saveMaps(nat.width, nat.height, res.opq, res.neutral, res.codes);
    const cj = carteCj(nat, nor, neu, echelle, res.fin);
    return { nat, neu, sec, nor, cj, cjAp: cjApercu(cj) };
  }

  // ------------------------------------------------------------ préparation d'une image quelconque (page)
  // Pixels transparents : couleur mise à 0 (le navigateur la perd au décodage : même entrée des deux
  // côtés) ; demi-transparents : opaques au-dessus de 128, transparents en dessous.
  function nettoyerAlpha(im) {
    const out = nouvelle(im.width, im.height);
    for (let p = 0; p < im.width * im.height; p++) {
      if (im.data[p * 4 + 3] < 128) continue;
      out.data.set([im.data[p * 4], im.data[p * 4 + 1], im.data[p * 4 + 2], 255], p * 4);
    }
    return out;
  }

  // Retire un fond UNI : couleur des 4 coins (s'ils s'accordent à `tol` près, écart max par canal),
  // effacée par remplissage depuis les bords (un blanc ENFERMÉ, comme un œil, reste). Renvoie
  // { im, fond: [r, g, b] | null, retires } ; fond null = coins différents ou déjà transparents.
  function retirerFond(im, tol) {
    const w = im.width, h = im.height, d = im.data;
    const coins = [0, w - 1, (h - 1) * w, h * w - 1];
    if (coins.some((p) => d[p * 4 + 3] < 128)) return { im, fond: null, retires: 0 };
    const ref = [0, 1, 2].map((k) => Math.round(coins.reduce((s, p) => s + d[p * 4 + k], 0) / 4));
    const proche = (p) => d[p * 4 + 3] >= 128 && Math.max(...[0, 1, 2].map((k) => Math.abs(d[p * 4 + k] - ref[k]))) <= tol;
    if (!coins.every(proche)) return { im, fond: null, retires: 0 };
    const out = { width: w, height: h, data: new Uint8Array(d) };
    const vu = new Uint8Array(w * h), file = [];
    const graine = (p) => { if (!vu[p] && proche(p)) { vu[p] = 1; file.push(p); } };
    for (let x = 0; x < w; x++) { graine(x); graine((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { graine(y * w); graine(y * w + w - 1); }
    for (let k = 0; k < file.length; k++) {
      const p = file[k], x = p % w, y = (p - x) / w;
      if (x > 0) graine(p - 1);
      if (x < w - 1) graine(p + 1);
      if (y > 0) graine(p - w);
      if (y < h - 1) graine(p + w);
    }
    for (const p of file) out.data.set([0, 0, 0, 0], p * 4);
    return { im: out, fond: ref, retires: file.length };
  }

  // Taille d'un pixel dessiné dans une image de pixel art agrandie (comme grid_reduce / pixel-fixer) :
  // les changements de couleur tombent sur une grille de pas f. Pour chaque f (1,5 à 32 px, au
  // centième), part p(f) des changements qui tombent sur la grille (meilleur décalage). Le vrai
  // pas est un PIC net : p(f) >= 0,6 et au moins 1,6 fois la médiane de p autour (de 0,8 f à
  // 1,2 f), alors qu'une grille quelconque n'attrape qu'à peu près 1 / f des changements. Les
  // multiples k f en attrapent 1 / k, les sous-multiples f / k presque tous : on prend le plus
  // GRAND pic dont p atteint 90 % du meilleur pic, puis le meilleur p à ±2 % (entier préféré à
  // égalité). Aucun pic : f = 1 (image native, ou pas en pixel art).
  // Renvoie { f, part } (part = p(f)).
  function detecterFacteur(im) {
    const w = im.width, h = im.height, d = im.data;
    const cle = (p) => (d[p * 4 + 3] < 128 ? -1 : rgbInt(d, p * 4));
    const chgX = new Float64Array(w + 1), chgY = new Float64Array(h + 1);
    let total = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = cle(y * w + x);
        if (x > 0 && c !== cle(y * w + x - 1)) { chgX[x]++; total++; }
        if (y > 0 && c !== cle((y - 1) * w + x)) { chgY[y]++; total++; }
      }
    }
    if (!total) return { f: 1, part: 1 };
    const axe = (chg, n, f) => {   // meilleur décalage : changements tombant sur round(g + i f)
      let best = 0;
      const pas = f < 4 ? 0.05 : 0.1;
      for (let g = 0; g < f; g += pas) {
        let v = 0;
        for (let i = 0; g + i * f < n + 1; i++) {
          const b = Math.round(g + i * f);
          if (b > 0 && b < n) v += chg[b];
        }
        if (v > best) best = v;
      }
      return best;
    };
    const scores = [];
    for (let k = 150; k <= 3200; k++) {
      const f = k / 100;
      if (f > Math.max(w, h) / 3) break;
      scores.push({ f, p: (axe(chgX, w, f) + axe(chgY, h, f)) / total });
    }
    const P = new Map(scores.map((x) => [Math.round(x.f * 100), x.p]));
    const pics = [];
    for (const x of scores) {
      if (x.p < 0.6) continue;
      const autour = [];
      for (let k = Math.ceil(x.f * 80); k <= Math.floor(x.f * 120); k++) {
        if (Math.abs(k / 100 - x.f) <= 0.05 * x.f || !P.has(k)) continue;
        autour.push(P.get(k));
      }
      if (autour.length < 5) continue;
      autour.sort((m, n) => m - n);
      if (x.p >= 1.6 * autour[autour.length >> 1]) pics.push(x);
    }
    if (!pics.length) return { f: 1, part: 1 };
    // les sous-multiples f / k du vrai pas expliquent aussi tout : le plus GRAND pic qui explique
    // presque autant que le meilleur (les multiples k f, eux, n'en expliquent que 1 / k)
    const pmax = Math.max(...pics.map((x) => x.p));
    const base = pics.filter((x) => x.p >= 0.9 * pmax).pop();
    const voisins = scores.filter((x) => Math.abs(x.f - base.f) <= 0.02 * base.f + 1e-9);
    const pm = Math.max(...voisins.map((x) => x.p));
    const entier = voisins.find((x) => Number.isInteger(x.f) && x.p >= pm - 0.01);
    if (entier) return { f: entier.f, part: entier.p };
    const meilleurs = voisins.filter((x) => x.p >= pm - 1e-9);
    const choix = meilleurs[Math.floor(meilleurs.length / 2)];
    return { f: choix.f, part: choix.p };
  }

  // Nombre de couleurs distinctes des pixels opaques
  function compterCouleurs(im) {
    const s = new Set();
    for (let p = 0; p < im.width * im.height; p++) if (im.data[p * 4 + 3] >= 128) s.add(rgbInt(im.data, p * 4));
    return s.size;
  }

  // Image peinte (trop de couleurs pour être du pixel art) : palette propre de n couleurs en Lab
  // (comme le mode --echelle-jeu de l'outil), commune à toutes les frames.
  function reduireCouleurs(ims, n) {
    const opq = [];
    for (const im of ims) for (let p = 0; p < im.width * im.height; p++) if (im.data[p * 4 + 3] >= 128) opq.push(rgbInt(im.data, p * 4));
    const remap = paletteLab(opq, n);
    return ims.map((im) => appliquerPalette(im, remap));
  }


  // ------------------------------------------------------------ image(s) de l'utilisateur (page d'aperçu)
  // Chaîne complète d'images quelconques déjà décodées (RGBA), dans l'ordre des frames :
  // fond uni retiré, taille d'un pixel dessiné détectée (ou imposée), retour à 1 pixel par case,
  // couleurs réduites si l'image est peinte, sections, normales, carte contre-jour.
  // reglages : { fond: true, tol: 24, facteur: 0 (= auto), methode: 'origine' | 'A' | 'B' | 'C' }.
  // Renvoie { f, auto, peint, messages, frames: [{ nat, neu, sec, nor, cj, cjAp, geo }] } ; erreur
  // claire si l'image ne convient pas.
  const PERSO_MAX = 400;          // px natifs au plus sur un côté (temps de calcul)
  const PERSO_COULEURS = 64;      // au-delà : image peinte, palette réduite à 32 couleurs
  function traiterImages(ims, reglages) {
    const reg = Object.assign({ fond: true, tol: 24, facteur: 0, methode: 'origine' }, reglages || {});
    const messages = [];
    let frames = ims.map(nettoyerAlpha);
    const aDuVide = (im) => { for (let p = 0; p < im.width * im.height; p++) if (im.data[p * 4 + 3] < 128) return true; return false; };
    if (reg.fond) {
      const r = frames.map((im) => retirerFond(im, reg.tol));
      if (r.some((x) => x.fond)) {
        frames = r.map((x) => x.im);
        const c = r.find((x) => x.fond).fond;
        messages.push(`Fond uni retiré (couleur des coins rgb(${c.join(', ')}), tolérance ${reg.tol}).`);
      }
    }
    if (!frames.some(aDuVide)) {
      messages.push('Aucune transparence et pas de fond uni à retirer : tout le cadre est pris comme sprite, le résultat sera mauvais (détourer l\'image avant, ou augmenter la tolérance).');
    }
    let f = reg.facteur, auto = false;
    if (!(f > 0)) {
      const d = detecterFacteur(frames[0]);
      f = d.f; auto = true;
      if (f <= 1) messages.push('Pas de grille de pixels détectée : image prise telle quelle (1 pixel = 1 pixel dessiné). Si c\'est du pixel art agrandi, indiquer la taille d\'un pixel.');
    }
    let canv;
    if (frames.length > 1) canv = natifsAnimation(frames, f > 1 ? f : 0).canv;
    else if (f > 1) canv = [natifSprite(frames[0], f).nat];
    else {
      const b = boite(frames[0], 1);
      if (!b) throw new Error('image vide (aucun pixel opaque)');
      canv = [rogner(frames[0], b)];
    }
    const w = canv[0].width, h = canv[0].height;
    if (Math.max(w, h) > PERSO_MAX) {
      throw new Error(`Sprite de ${w} x ${h} pixels dessinés : trop grand (${PERSO_MAX} au plus). Image en pixel art agrandie ? Indiquer la taille d'un pixel dessiné.`);
    }
    let peint = false;
    const n = Math.max(...canv.map(compterCouleurs));
    if (n > PERSO_COULEURS) {
      peint = true;
      canv = reduireCouleurs(canv, 32);
      messages.push(`${n} couleurs : image peinte plutôt que pixel art, ramenée à 32 couleurs ; le découpage en matières peut être moins net.`);
    }
    const ech = echelleSprite(canv);
    if (ech > 1) messages.push(`Grand sprite : réglages en pixels multipliés par ${ech} (zones, lissages, carte contre-jour, neutre détaillé).`);
    const methode = METHODES.includes(reg.methode) ? reg.methode : 'origine';
    if (estV2(methode, ech)) messages.push(`Méthode ${NOMS_METHODES[methode]}.`);
    else if (methode !== 'origine') messages.push(`Grand sprite : méthode ${methode} sans effet, chaîne des grands sprites gardée.`);
    const res = canv.length > 1 ? sectionsAnimation(canv, [], [], peint, ech, methode).frames : [analyser(canv[0], [], [], peint, null, ech, methode)];
    return {
      f, auto, peint, messages, s: ech, methode,
      frames: canv.map((nat, i) => {
        const c = cartes(nat, res[i], ech);
        const masque = new Uint8Array(nat.width * nat.height);
        for (let p = 0; p < masque.length; p++) masque[p] = nat.data[p * 4 + 3] >= 128 ? 1 : 0;
        const g = GEO.geometrie(masque, nat.width, nat.height);
        c.geo = { width: g.width, height: g.height, data: g.data };
        return c;
      }),
    };
  }

  return { METHODES, NOMS_METHODES, V2, estV2, analyseV2, analyser, clusterRampsV2, traitsV2, echelleSprite, ECHELLE_REF, neutreDetaille, traiterImages, natifSprite, natifsAnimation, sectionsAnimation, cartes, nettoyerAlpha, retirerFond, detecterFacteur, compterCouleurs, reduireCouleurs, N4, N8, N8_ET_SOI, pyRound, pyMod, compter, plusFrequent, LAB, lin, lab, dist3, hexc, parseHex, rgbInt, M64, XXP1, hashTuple, ordreSet, DIRS, TILT_INC, GBLUR_MIN, RAMP_SPAN, PART_DL, W_GLOBAL, hsv, SECTIONS, sectionNormal, encodeNormal, quantize, nearestCode, f32, rayonGauss, ligneBoite, flouLignes, flouGaussien, hueDiff, clusterRamps, rampBase, offsetsTries, nearestVectors, heriterBord, modeFilter, mergeSmall, analyse, nouvelle, boite, rogner, coller, saveMaps, CJ_PORTEE, CJ_SOMBRE, CJ_CONTOUR, CJ_FRANGE, CJ_LISSE, tasPlusPetit, tasAjouter, tasRetirer, decomposer, voisinDouble, hypotPy, carteCj, pyModF, hsvVersRgb, rgbVersHsv, cjApercu, cjDepuisApercu, normalesDepuisSections, eclairer, planche, miroir, kmeans, paletteLab, appliquerPalette, phaseGrille, echantillonner, accord, calerAxe, calerGrille, meilleurDecalage, lisserTemps };
});
