// Gaine de feu du grizzly en charge (pixelfx, fire/grizzly-reentry) -> images du jeu, sans lissage,
// 1 px de l'effet = 2 px d'écran : assets/vfx/ursides_feu/grizzly_feu_<i>.png (boucle, ours tourné vers la droite).
// Écrit aussi src/data/grizzly_feu_fx.js (nombre d'images, cadence, taille, ancrage = centre du corps visible
// du grizzly) et change le numéro de src/data/asset_version.js. Réglages : tools/pixelfx/grizzly-reentry.js.
//   node tools/pixelfx/export_grizzly_feu.mjs            (depuis la racine du jeu)
import { pathToFileURL, fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { root, installFx } from "./racine.mjs";

const game = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(installFx("grizzly-reentry.js", "fire")) + "?v=" + Date.now());
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));

const dir = "assets/vfx/ursides_feu";
mkdirSync(resolve(game, dir), { recursive: true });
const K = 2, FPS = fx.meta.fps, [W, H] = fx.meta.size, [OX, OY] = fx.meta.origin;
const n = Math.round(fx.meta.duration * FPS);
for (let i = 0; i < n; i++) {
  const inst = core.createFx(fx, { x: OX, y: OY });
  const steps = Math.round((i / FPS) * 240);
  for (let s = 0; s < steps; s++) inst.update(1 / 240);
  const frame = core.createFrame(W, H);
  core.clearFrame(frame);
  inst.draw(frame);
  const small = core.composite(frame, new Uint8ClampedArray(W * H * 4), null);
  const big = new Uint8ClampedArray(W * K * H * K * 4);
  for (let y = 0; y < H * K; y++) for (let x = 0; x < W * K; x++) {
    const a = ((y / K | 0) * W + (x / K | 0)) * 4, b = (y * W * K + x) * 4;
    // lueur trop faible : retirée (pas de voile autour de l'ours)
    const al = small[a + 3] < 60 ? 0 : small[a + 3];
    big[b] = small[a]; big[b + 1] = small[a + 1]; big[b + 2] = small[a + 2]; big[b + 3] = al;
  }
  writeFileSync(resolve(game, dir, `grizzly_feu_${i}.png`), encodePNG(W * K, H * K, big));
}
const data = { dir, prefix: "grizzly_feu", frames: n, fps: FPS, w: W * K, h: H * K, ox: OX * K, oy: OY * K,
  // taille du corps visible pour laquelle l'effet est dessiné (px d'écran)
  bodyW: fx.meta.options.half * 2 * K, bodyH: (fx.meta.options.top - 3 + fx.meta.options.bottom) * K };
writeFileSync(resolve(game, "src/data/grizzly_feu_fx.js"),
  `// GÉNÉRÉ par tools/pixelfx/export_grizzly_feu.mjs -- ne pas modifier à la main.\n// Gaine de feu du grizzly en charge (passif des ursidés de palier 5) : images de ${dir}/, tailles en px\n// d'écran, (ox, oy) = centre du corps visible du grizzly dans l'image (ours tourné vers la droite).\nconst GRIZZLY_FEU_FX = ${JSON.stringify(data, null, 1)};\n`);
writeFileSync(resolve(game, "src/data/asset_version.js"),
  `// GÉNÉRÉ (tools/pixelfix.js et autres outils d'images) -- ne pas modifier à la main.\nconst ASSET_VERSION = '${Date.now()}';\n`);
console.log("ok", JSON.stringify(data));
