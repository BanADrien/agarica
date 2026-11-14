// Pics de glace de l'ours polaire (pixelfx, ice/polar-spike) -> images du jeu, sans lissage, 1 px de l'effet =
// 2 px d'écran : assets/vfx/glace_frames/glace_petit_<i>.png (pics de la rangée) et glace_gros_<i>.png (gros pic
// du bout). Écrit aussi src/data/glace_fx.js (nombre d'images, cadence, ancrage : le jeu les lit là) et change
// le numéro de src/data/asset_version.js. Réglages : en tête de tools/pixelfx/polar-spike.js ; hauteurs ci-dessous
// (moitié de POLAR_TUNING.spikeH / bigH de src/entities/Ursides.js).
//   node tools/pixelfx/export_glace.mjs            (depuis la racine du jeu)
//   node tools/pixelfx/export_glace.mjs <dossier>  (rendu d'essai : n'écrit que les images)
import { pathToFileURL, fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { root, installFx } from "./racine.mjs";

const game = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(installFx("polar-spike.js", "ice")) + "?v=" + Date.now());
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));

const trial = !!process.argv[2];
const dir = "assets/vfx/glace_frames";
const out = trial ? resolve(process.argv[2]) : resolve(game, dir);
const K = 2, FPS = fx.meta.fps;
const parts = {
  petit: { w: 72, h: 60, ox: 36, oy: 52, opts: { height: 24, width: 9, big: false, seed: 4 } },
  gros: { w: 110, h: 92, ox: 55, oy: 84, opts: { height: 48, width: 15, big: true, seed: 7 } },
};
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/^glace_(petit|gros)_\d+\.png$/.test(f)) unlinkSync(resolve(out, f));
const data = { px: K };
for (const [part, c] of Object.entries(parts)) {
  const n = Math.round(fx.meta.duration * FPS);
  for (let i = 0; i < n; i++) {
    const inst = core.createFx(fx, { x: c.ox, y: c.oy, ...c.opts });
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
    writeFileSync(`${out}/glace_${part}_${i}.png`, encodePNG(c.w * K, c.h * K, big));
  }
  data[part] = { dir, prefix: `glace_${part}`, frames: n, fps: FPS, w: c.w * K, h: c.h * K, ox: c.ox * K, oy: c.oy * K };
}
if (!trial) {
  const lines = Object.entries(data).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join("\n");
  writeFileSync(resolve(game, "src/data/glace_fx.js"),
    `// GÉNÉRÉ par tools/pixelfx/export_glace.mjs -- ne pas modifier à la main.\n// Pics de glace de l'ours polaire (pixelfx) : images de ${dir}/, tailles en px d'écran,\n// (ox, oy) = pied du pic dans l'image. Réglages : tools/pixelfx/polar-spike.js.\nconst GLACE_FX = {\n${lines}\n};\n`);
  writeFileSync(resolve(game, "src/data/asset_version.js"),
    `// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\nconst ASSET_VERSION = '${Date.now()}';\n`);
}
console.log("ok", Object.entries(data).filter(([k]) => k !== "px").map(([k, v]) => `${k} ${v.frames} images ${v.w}x${v.h}`).join(", "));
