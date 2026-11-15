// Feu du grizzly en charge (Legend of Agarica, passif des ursidés de palier 5) : une « rentrée dans
// l'atmosphère ». DESSIN REFAIT DE ZÉRO le 2026-11-15 (les versions en coque -- contour plein autour de
// l'ours -- étaient « trop denses », et rien ne passait sur lui) :
//  - plus de coque : des FILETS DE FLAMME, comme les lignes d'air autour d'un objet lancé à toute vitesse.
//    Ils naissent tous d'un petit point chaud devant le museau, s'écartent, puis filent droit vers
//    l'arrière : deux passent au-dessus du dos et sous le ventre, les autres glissent PAR-DESSUS l'ours ;
//  - chaque filet est fait de courtes flammes séparées qui reculent (tête claire, queue qui rougit), avec
//    de larges vides entre elles : l'effet reste léger, l'ours se voit en entier ;
//  - devant, un petit arc chaud qui bat, pas plus haut que le museau.
// Rien n'est tiré au hasard d'une image à l'autre : les flammes défilent et la boucle se referme sans à-coup.
// L'ours regarde à DROITE ; l'origine est le centre de son corps visible (72 x 47 px d'effet = 144 x 94 px
// d'écran, 1 px d'effet = 2 px d'écran). Rendu par tools/pixelfx/export_grizzly_feu.mjs.
import { fit, WHITE } from "../../core/index.js";

export const meta = {
  name: "Grizzly reentry",
  desc: "Thin streamlines of flame fan out from a hot point ahead of a charging beast and race straight back, around it and across its body, as short separate flames.",
  tags: ["fire", "aura", "charge", "reentry", "streamlines", "directional", "loop"],
  size: [180, 96],
  origin: [108, 49],
  duration: 0.4,
  loop: true,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#7a1606", "#c8280c", "#ff5a1a", "#ff9a2a", "#ffd45a", "#fff3b0"],   // du rouge sombre au jaune pâle
    half: 36,      // demi-longueur du corps
    top: 26,       // (lu par le script de rendu : hauteur du corps au-dessus du centre)
    bottom: 23,    // (idem, en dessous)
    tail: 30,      // les filets dépassent la croupe de tant de px
    nose: [47, 5], // le point chaud : devant le museau (tête basse), en px depuis le centre du corps
    // Les filets : [hauteur finale (px depuis le centre ; - = au-dessus), épaisseur, longueur d'une flamme,
    // écart entre deux flammes, décalage, vitesse (tours par boucle)]. Les deux premiers encadrent l'ours,
    // les autres passent sur lui (plus fins, plus espacés).
    lanes: [
      [-28, 2, 26, 14, 0, 1],
      [26, 2, 24, 16, 13, 1],
      [-17, 1, 12, 28, 22, 2],
      [-6, 1, 10, 30, 5, 1],
      [6, 1, 12, 28, 31, 2],
      [16, 1, 10, 30, 17, 1],
    ],
  },
};

const TAU = Math.PI * 2;

export function draw(p, t, o) {
  const C = fit(o.palette, 6);
  const phase = (t / meta.duration) % 1;
  const a = o.half, [NX, NY] = o.nose;
  const end = NX + a + o.tail;                              // longueur d'un filet, du point chaud à sa pointe
  // --- les filets ---
  for (const [lane, w, len, gap, off, turns] of o.lanes) {
    const period = len + gap;
    for (let q = 2; q <= end; q += 0.5) {                   // q : distance parcourue depuis le point chaud
      // la flamme recule : le motif glisse d'un nombre entier de périodes par boucle
      const m = (((q - phase * period * turns + off) % period) + period) % period;
      if (m >= len) continue;
      const k = m / len;                                    // 0 : tête de la flamme (côté museau), 1 : sa queue
      const far = q / end;                                  // 0 près du museau, 1 au bout
      // il quitte le point chaud et rejoint vite sa hauteur, puis file droit
      const x = NX - q, y = NY + (lane - NY) * (1 - Math.exp(-q / 9));
      // couleurs : tête claire, queue qui rougit ; tout refroidit vers l'arrière
      const heat = (1 - k) * (1 - far * 0.75);
      const col = heat > 0.8 ? C[5] : heat > 0.6 ? C[4] : heat > 0.4 ? C[3] : heat > 0.2 ? C[2] : C[1];
      // la flamme s'effile : pleine épaisseur en tête, 1 px en queue ; plus fine aussi vers le bout
      const thick = k < 0.45 && far < 0.7 ? w : 1;
      for (let d = 0; d < thick; d++) p.dot(x, y + (lane < NY ? -d : d), col, 1);
      if (w > 1 && k < 0.18 && far < 0.5) p.dot(x, y + (lane < NY ? 1 : -1), heat > 0.8 ? WHITE : C[5], 1);   // tête un peu renflée
    }
  }
  // --- le point chaud : un petit arc qui bat, devant le museau ---
  const beat = 0.5 + 0.5 * Math.sin(phase * TAU * 2);
  const R = 8;
  for (let th = -0.95; th <= 0.951; th += 0.04) {
    const c = Math.cos(th), s = Math.sin(th);
    const edge = Math.abs(th) > 0.6;
    p.dot(NX - R + R * c, NY + R * 1.25 * s, edge ? C[4] : WHITE, 1);
    p.dot(NX - R + (R + 1) * c, NY + (R + 1) * 1.25 * s, edge ? C[3] : C[5], 1);
    if (!edge || beat > 0.5) p.dot(NX - R + (R + 2) * c, NY + (R + 2) * 1.25 * s, edge ? C[2] : C[3], 1);
    if (Math.abs(th) < 0.35 && beat > 0.4) p.dot(NX - R + (R + 3) * c, NY + (R + 3) * 1.25 * s, C[2], 1);
  }
  p.glow(NX, NY, 12, C[3], 0.28 + 0.1 * beat);
}
