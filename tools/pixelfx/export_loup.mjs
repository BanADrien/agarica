// Effets pixelfx du loup et du talisman (2026-11-15) -> images du jeu, sans lissage.
//   wolf-bite.js   -> assets/vfx/vfx_croc_frames/vfx_croc_row0_<0..4>.png : le croc du loup, attaque de base
//                     (1 px de l'effet = 3 px ; affichées à 1/3 : 1 px d'écran, le grain de l'arc de la dague). Mêmes noms que l'ancien art.
//   wolf-claws.js  -> assets/vfx/loup_frames/griffes_<0..4>.png : le coup de patte vers le bas (x2)
//   talisman-awaken.js -> assets/vfx/loup_frames/talisman_<0..29>.png          (x2, 20 i/s)
// Écrit aussi src/data/loup_fx.js (tailles, ancrages, cadence) et change le numéro de src/data/asset_version.js.
//   node tools/pixelfx/export_loup.mjs            (depuis la racine du jeu)
import { pathToFileURL, fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { root, installFx } from "./racine.mjs";

const game = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const core = await import(pathToFileURL(root + "src/core/index.js"));
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));
const load = async (file, cat) => import(pathToFileURL(installFx(file, cat)) + "?v=" + Date.now());

// Rend l'effet à l'instant t (s), agrandi K fois, sur une toile de (W, H) px de l'effet.
function render(fx, t, K, outW, outH, opts = {}) {
  const [W, H] = fx.meta.size, [ox, oy] = fx.meta.origin;
  const inst = core.createFx(fx, { x: ox, y: oy, ...opts });
  for (let s = 0; s < Math.round(t * 240); s++) inst.update(1 / 240);
  const frame = core.createFrame(W, H);
  core.clearFrame(frame);
  inst.draw(frame);
  const small = core.composite(frame, new Uint8ClampedArray(W * H * 4), null);
  const w = outW || W * K, h = outH || H * K, big = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < Math.min(h, H * K); y++) for (let x = 0; x < Math.min(w, W * K); x++) {
    const a = ((y / K | 0) * W + (x / K | 0)) * 4, b = (y * w + x) * 4;
    // lueur trop faible : retirée (elle élargirait la zone visible, donc la zone qui touche)
    const al = small[a + 3] < 40 ? 0 : small[a + 3];
    big[b] = small[a]; big[b + 1] = small[a + 1]; big[b + 2] = small[a + 2]; big[b + 3] = al;
  }
  return encodePNG(w, h, big);
}

const bite = await load("wolf-bite.js", "melee");
const claws = await load("wolf-claws.js", "melee");
const talisman = await load("talisman-awaken.js", "arcane");

// Croc : élan (gueule grande ouverte), 2 images actives (claquement blanc, puis fermée), 2 d'effacement.
// 2026-11-15 : le croc et les griffes du jeu sont maintenant ceux dessinés par Codex (tools/import_loup_codex.py).
// Ce script ne les réécrit QUE si on le lance avec --loup ; sinon il ne rend que le talisman.
const LOUP = process.argv.includes("--loup");
const crocDir = resolve(game, "assets/vfx/vfx_croc_frames");
if (LOUP) [0.03, 0.095, 0.135, 0.198, 0.236].forEach((t, i) => writeFileSync(`${crocDir}/vfx_croc_row0_${i}.png`, render(bite, t, 3)));
// Griffes du coup de patte : mêmes cinq moments.
const T5 = [0.035, 0.09, 0.14, 0.185, 0.225];

const dir = "assets/vfx/loup_frames";
mkdirSync(resolve(game, dir), { recursive: true });
const K = 2;
if (LOUP) T5.forEach((t, i) => writeFileSync(resolve(game, dir, `griffes_${i}.png`), render(claws, t, K)));
const FPS = talisman.meta.fps, N = Math.round(talisman.meta.duration * FPS);
for (let i = 0; i < N; i++) writeFileSync(resolve(game, dir, `talisman_${i}.png`), render(talisman, (i + 0.5) / FPS, K));

const entry = (fx, prefix, frames, extra = {}) => ({ dir, prefix, frames, w: fx.meta.size[0] * K, h: fx.meta.size[1] * K,
  ox: fx.meta.origin[0] * K, oy: fx.meta.origin[1] * K, ...extra });
const fxFile = resolve(game, "src/data/loup_fx.js");
const old = existsSync(fxFile) ? JSON.parse(/const LOUP_FX = (\{[\s\S]*\});/.exec(readFileSync(fxFile, "utf8"))[1]) : {};
const data = {
  // crocs : 1 px de l'effet = 3 px d'image ; échelle d'affichage pour 1 px d'écran
  croc: { scale: 1 / 3 },
  griffes: LOUP || !old.griffes ? entry(claws, "griffes", T5.length) : old.griffes,
  talisman: entry(talisman, "talisman", N, { fps: FPS }),
};
writeFileSync(resolve(game, "src/data/loup_fx.js"),
  `// GÉNÉRÉ par tools/pixelfx/export_loup.mjs -- ne pas modifier à la main.\n// Effets pixelfx du loup (crocs, griffes) et de l'éveil du talisman : images de ${dir}/ et de\n// assets/vfx/vfx_croc_frames/, tailles en px d'écran, (ox, oy) = point d'ancrage dans l'image.\nconst LOUP_FX = ${JSON.stringify(data, null, 1)};\n`);
writeFileSync(resolve(game, "src/data/asset_version.js"),
  `// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\nconst ASSET_VERSION = '${Date.now()}';\n`);
console.log(LOUP ? "ok : 5 images du croc, 5 du coup de patte," : "ok (croc et griffes de Codex gardés) :", N, "images du talisman");
