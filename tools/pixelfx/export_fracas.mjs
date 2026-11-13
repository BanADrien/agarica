// Fracas de l'ours (pixelfx, impacts/bear-slam) -> images du jeu, sans lissage, 1 px de l'effet = 2 px d'écran :
//   assets/vfx/fracas_frames/fracas_impact_<i>.png : poussière et pierres de l'impact (symétrique) ;
//   assets/vfx/fracas_frames/fracas_griffe_<i>.png : traînée du coup de patte (ours tourné vers la droite).
// Écrit aussi src/data/fracas_fx.js (nombre d'images, cadence, point d'ancrage : le jeu les lit là, rien
// d'autre à changer dans le code) et change le numéro de src/data/asset_version.js.
// Les réglages (couleurs, nombre de pierres, taille, durée) sont en tête de tools/pixelfx/bear-slam.js.
//   node tools/pixelfx/export_fracas.mjs            (depuis la racine du jeu)
//   node tools/pixelfx/export_fracas.mjs <dossier>  (rendu d'essai ailleurs : n'écrit alors que les images)
import { pathToFileURL, fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { root, installFx } from "./racine.mjs";

const game = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(installFx("bear-slam.js", "impacts")) + "?v=" + Date.now());
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));

const trial = !!process.argv[2];
const dir = "assets/vfx/fracas_frames";
const out = trial ? resolve(process.argv[2]) : resolve(game, dir);
const K = 2, FPS = fx.meta.fps;
const O = fx.meta.options;
// Cadre de chaque partie (px de l'effet) et point d'ancrage dans ce cadre : les pattes arrière de l'ours
// pour la traînée, le point d'impact au sol pour la poussière.
const [W, H] = fx.meta.size, [OX, OY] = fx.meta.origin;
const cx = Math.min(O.clawFrom[0], O.clawTo[0]) - 14, cw = Math.abs(O.clawTo[0] - O.clawFrom[0]) * 1.6 + 44;
const cy = Math.min(O.clawFrom[1], O.clawTo[1]) - 12, ch = Math.abs(O.clawTo[1] - O.clawFrom[1]) + 26;
const parts = {
  impact: { w: W, h: H, ox: OX, oy: OY, seconds: fx.meta.duration },
  griffe: { w: Math.ceil(cw), h: Math.ceil(ch), ox: Math.round(-cx), oy: Math.round(-cy), seconds: O.clawTime },
};

mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/^fracas_(impact|griffe)_\d+\.png$/.test(f)) unlinkSync(resolve(out, f));
const data = { px: K };
for (const [part, c] of Object.entries(parts)) {
  const n = Math.max(1, Math.round(c.seconds * FPS));
  for (let i = 0; i < n; i++) {
    const inst = core.createFx(fx, { x: c.ox, y: c.oy, part });
    // milieu de la case de temps : la première image montre déjà l'éclair, la dernière n'est pas vide
    const steps = Math.round(((i + 0.5) / FPS) * 120);
    for (let s = 0; s < steps; s++) inst.update(1 / 120);
    const frame = core.createFrame(c.w, c.h);
    core.clearFrame(frame);
    inst.draw(frame);
    const small = core.composite(frame, new Uint8ClampedArray(c.w * c.h * 4), null);
    const big = new Uint8ClampedArray(c.w * K * c.h * K * 4);
    for (let y = 0; y < c.h * K; y++) for (let x = 0; x < c.w * K; x++) {
      const a = ((y / K | 0) * c.w + (x / K | 0)) * 4, b = (y * c.w * K + x) * 4;
      big[b] = small[a]; big[b + 1] = small[a + 1]; big[b + 2] = small[a + 2]; big[b + 3] = small[a + 3];
    }
    writeFileSync(`${out}/fracas_${part}_${i}.png`, encodePNG(c.w * K, c.h * K, big));
  }
  data[part] = { dir, prefix: `fracas_${part}`, frames: n, fps: FPS, w: c.w * K, h: c.h * K, ox: c.ox * K, oy: c.oy * K };
}
if (!trial) {
  const lines = Object.entries(data).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join("\n");
  writeFileSync(resolve(game, "src/data/fracas_fx.js"),
    `// GÉNÉRÉ par tools/pixelfx/export_fracas.mjs -- ne pas modifier à la main.\n// Effets du fracas de l'ours (pixelfx) : images de ${dir}/, tailles en px d'écran,\n// (ox, oy) = point d'ancrage dans l'image. Réglages : tools/pixelfx/bear-slam.js.\nconst FRACAS_FX = {\n${lines}\n};\n`);
  writeFileSync(resolve(game, "src/data/asset_version.js"),
    `// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\nconst ASSET_VERSION = '${Date.now()}';\n`);
}
console.log("ok", JSON.stringify(data));
