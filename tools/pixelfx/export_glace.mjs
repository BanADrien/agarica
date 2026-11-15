// Traînée de glace de l'ours polaire (pixelfx, ice/polar-spike) -> images du jeu, sans lissage, 1 px de l'effet =
// 2 px d'écran. Six segments qui se touchent et montent jusqu'au bout (croquis de l'utilisateur, 2026-11-14) :
//   assets/vfx/glace_frames/glace_<k>_<i>.png, k = 0..4 (segments de la rangée), puis glace_gros_<i>.png (le bout).
// Écrit aussi src/data/glace_fx.js (largeur, hauteur, ancrage et nombre d'images de chaque segment : le jeu les
// lit là) et change le numéro de src/data/asset_version.js. La largeur d'un segment suit l'écart entre deux
// pics du jeu (POLAR_TUNING.reach / POLAR_TUNING.spikes, src/entities/Ursides.js : 320 / 5 = 64 px d'écran).
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
// Largeur d'un segment (px de l'effet) : l'écart entre deux pics (32) et 2 de chevauchement de chaque côté.
const SPAN = 36;
// Hauteurs (px de l'effet ; x2 à l'écran) : elles montent d'un segment à l'autre, jusqu'au gros pic.
// (même hauteur moyenne partout : les tailles varient d'un cristal à l'autre, pas d'un segment à l'autre)
const LADDER = [17, 17, 17, 17, 17, 17];
const parts = {};
for (let k = 0; k < 5; k++) {
  const H = LADDER[k + 1];
  parts[k] = { w: SPAN + Math.ceil(H * 1.8) + 12, h: Math.ceil(H * 1.25) + 26, opts: { span: SPAN, from: LADDER[k], height: H, big: false, seed: 4 + k } };
}
// (2026-11-14 : le bout raccourci, 56 -> 42, « un peu trop grand »)
parts.gros = { w: 110, h: 86, opts: { span: 34, from: LADDER[5], height: 42, big: true, seed: 11 } };
for (const c of Object.values(parts)) { c.ox = Math.round(c.w / 2); c.oy = c.h - 12; }

// Glace NOIRE (2026-11-15) : la même traînée dans une palette presque noire à reflets violets, jouée quand
// le passif des ursidés de palier 5 est actif. Mêmes cadres, fichiers glacenoire_<k>_<i>.png, clé `noir`.
const NOIR = ["#030207", "#07060f", "#0e0b1c", "#17122e", "#241b48", "#3a2c74", "#6a55c0", "#c2b2ff"];
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/^glace(noire)?_\w+_\d+\.png$/.test(f)) unlinkSync(resolve(out, f));
const data = { px: K, rangee: [] };
for (const [part, c] of Object.entries(parts)) {
  const n = Math.round(fx.meta.duration * FPS);
  for (const [name, extra] of [["glace", {}], ["glacenoire", { palette: NOIR }]]) for (let i = 0; i < n; i++) {
    const inst = core.createFx(fx, { x: c.ox, y: c.oy, ...c.opts, ...extra });
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
    writeFileSync(`${out}/${name}_${part}_${i}.png`, encodePNG(c.w * K, c.h * K, big));
  }
  const entry = { key: `glace-${part}`, dir, prefix: `glace_${part}`, noir: `glacenoire-${part}`, noirPrefix: `glacenoire_${part}`, frames: n, fps: FPS, w: c.w * K, h: c.h * K, ox: c.ox * K, oy: c.oy * K,
    // largeur et hauteur visibles de la glace (px d'écran) : zone de dégâts du jeu
    span: c.opts.span * K, height: Math.round(c.opts.height * K) };
  if (part === "gros") data.gros = entry;
  else data.rangee.push(entry);
}
if (!trial) {
  writeFileSync(resolve(game, "src/data/glace_fx.js"),
    `// GÉNÉRÉ par tools/pixelfx/export_glace.mjs -- ne pas modifier à la main.\n// Traînée de glace de l'ours polaire (pixelfx) : images de ${dir}/, tailles en px d'écran,\n// (ox, oy) = pied du segment dans l'image. Réglages : tools/pixelfx/polar-spike.js.\nconst GLACE_FX = ${JSON.stringify(data, null, 1)};\n`);
  writeFileSync(resolve(game, "src/data/asset_version.js"),
    `// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\nconst ASSET_VERSION = '${Date.now()}';\n`);
}
console.log("ok", [...data.rangee, data.gros].map((v) => `${v.key} ${v.w}x${v.h}`).join(", "));
