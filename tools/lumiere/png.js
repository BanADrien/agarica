'use strict';
/*
 * Lecture / écriture PNG sans dépendance (Node seul : zlib intégré), pour tools/sections.js et
 * tools/lumiere/. Pourquoi pas pngjs ou sharp : le jeu n'a pas de package à installer (CLAUDE.md :
 * pas de build/npm) ; sharp n'existe que dans le sous-module tools/pixel-fixer, à installer à part.
 *
 * Lecture : tous les types de couleur (gris, RVB, palette, gris + alpha, RVBA), 1 à 16 bits,
 * transparence tRNS ; sortie RGBA 8 bits sans gestion de couleur (gAMA / iCCP ignorés), comme
 * `Image.open(...).convert("RGBA")` de Pillow (16 bits : octet de poids fort). Pas d'entrelacement
 * (Adam7) : erreur claire (aucune image du jeu n'en a).
 * Écriture : RGBA 8 bits, filtre choisi ligne par ligne (somme des écarts minimale), deflate 9.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE_CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decoder(buf, nom) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${nom} : pas un PNG`);
  let pos = 8, ihdr = null, palette = null, trns = null;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (type === 'IHDR') {
      ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), bits: data[8], type: data[9], entrelace: data[12] };
    } else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  if (!ihdr) throw new Error(`${nom} : en-tête PNG absent`);
  const { w, h, bits, type } = ihdr;
  if (ihdr.entrelace) throw new Error(`${nom} : PNG entrelacé non pris en charge (le réenregistrer sans entrelacement)`);
  const canaux = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!canaux) throw new Error(`${nom} : type de couleur PNG ${type} inconnu`);
  const bpp = Math.max(1, (canaux * bits) >> 3);          // octets par pixel pour les filtres
  const ligne = Math.ceil((w * canaux * bits) / 8);
  const brut = zlib.inflateSync(Buffer.concat(idat));
  if (brut.length < h * (ligne + 1)) throw new Error(`${nom} : données PNG tronquées`);
  const px = Buffer.alloc(h * ligne);
  for (let y = 0; y < h; y++) {
    const f = brut[y * (ligne + 1)], src = y * (ligne + 1) + 1, dst = y * ligne;
    for (let x = 0; x < ligne; x++) {
      const v = brut[src + x];
      const a = x >= bpp ? px[dst + x - bpp] : 0;
      const b = y > 0 ? px[dst - ligne + x] : 0;
      const c = x >= bpp && y > 0 ? px[dst - ligne + x - bpp] : 0;
      let r;
      if (f === 0) r = v;
      else if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else if (f === 4) r = v + paeth(a, b, c);
      else throw new Error(`${nom} : filtre PNG ${f} inconnu`);
      px[dst + x] = r & 255;
    }
  }
  // échantillon n° i d'une ligne (bits quelconques), ramené sur 8 bits
  const max = (1 << Math.min(bits, 8)) - 1;
  const lire = (dst, i) => {
    if (bits === 8) return px[dst + i];
    if (bits === 16) return px[dst + 2 * i];
    const bit = i * bits, o = px[dst + (bit >> 3)];
    return (o >> (8 - bits - (bit & 7))) & max;
  };
  const brutVal = (dst, i) => (bits === 16 ? px.readUInt16BE(dst + 2 * i) : lire(dst, i));
  const vers8 = (v) => (bits >= 8 ? v : Math.round((v * 255) / max));
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const dst = y * ligne;
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (type === 3) {
        const k = lire(dst, x);
        if (!palette || 3 * k + 2 >= palette.length) throw new Error(`${nom} : indice de palette hors palette`);
        out[o] = palette[3 * k]; out[o + 1] = palette[3 * k + 1]; out[o + 2] = palette[3 * k + 2];
        out[o + 3] = trns && k < trns.length ? trns[k] : 255;
      } else if (type === 0 || type === 4) {
        const g = vers8(lire(dst, x * canaux));
        out[o] = out[o + 1] = out[o + 2] = g;
        if (type === 4) out[o + 3] = lire(dst, x * 2 + 1);
        else out[o + 3] = trns && trns.length >= 2 && brutVal(dst, x) === trns.readUInt16BE(0) ? 0 : 255;
      } else {
        for (let k = 0; k < 3; k++) out[o + k] = lire(dst, x * canaux + k);
        if (type === 6) out[o + 3] = lire(dst, x * 4 + 3);
        else {
          const transparent = trns && trns.length >= 6 && [0, 1, 2].every((k) => brutVal(dst, x * 3 + k) === trns.readUInt16BE(2 * k));
          out[o + 3] = transparent ? 0 : 255;
        }
      }
    }
  }
  return { width: w, height: h, data: out };
}

function bloc(type, data) {
  const t = Buffer.from(type, 'latin1');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encoder(img) {
  const { width: w, height: h } = img;
  const d = img.data, ligne = w * 4;
  const brut = Buffer.alloc(h * (ligne + 1));
  const essai = Buffer.alloc(ligne);
  for (let y = 0; y < h; y++) {
    const src = y * ligne;
    let meilleur = -1, score = Infinity, choix = null;
    for (let f = 0; f <= 4; f++) {
      let s = 0;
      for (let x = 0; x < ligne; x++) {
        const v = d[src + x];
        const a = x >= 4 ? d[src + x - 4] : 0;
        const b = y > 0 ? d[src - ligne + x] : 0;
        const c = x >= 4 && y > 0 ? d[src - ligne + x - 4] : 0;
        const p = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c);
        const r = (v - p) & 255;
        essai[x] = r;
        s += r < 128 ? r : 256 - r;
      }
      if (s < score) { score = s; meilleur = f; choix = Buffer.from(essai); }
    }
    brut[y * (ligne + 1)] = meilleur;
    choix.copy(brut, y * (ligne + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([SIGNATURE, bloc('IHDR', ihdr), bloc('IDAT', zlib.deflateSync(brut, { level: 9 })), bloc('IEND', Buffer.alloc(0))]);
}

// image = { width, height, data: Uint8Array RGBA }
function lirePng(file) {
  return decoder(fs.readFileSync(file), file);
}
function ecrirePng(img, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encoder(img));
}

module.exports = { lirePng, ecrirePng, decoder, encoder };
