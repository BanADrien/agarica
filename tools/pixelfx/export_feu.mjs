// Feu de camp pixelfx -> 36 images (3 s en boucle à 12 i/s), recadrées autour du feu, x10 sans lissage.
import { pathToFileURL } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
const root = "E:/projet/pixelfx/";
const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(root + "src/fx/fire/campfire-agarica.js"));
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));
const out = process.argv[2], K = 10, W = 128, H = 128, N = 36, FPS = 12;
const X0 = 30, X1 = 98, Y0 = 26, Y1 = 119, cw = X1 - X0, ch = Y1 - Y0, FADE = 12;
mkdirSync(out, { recursive: true });
const inst = core.createFx(fx, { x: 64, y: 112, light: 0.45 });
for (let i = 0; i < N; i++) {
  if (i) for (let s = 0; s < 10; s++) inst.update(1 / (FPS * 10));
  const frame = core.createFrame(W, H);
  core.clearFrame(frame);
  inst.draw(frame);
  const small = core.composite(frame, new Uint8ClampedArray(W * H * 4), null);
  const big = new Uint8ClampedArray(cw * K * ch * K * 4);
  for (let y = 0; y < ch * K; y++) for (let x = 0; x < cw * K; x++) {
    const sx = X0 + (x / K | 0), sy = Y0 + (y / K | 0), a = (sy * W + sx) * 4, b = (y * cw * K + x) * 4;
    // bords fondus : la fumée et la lueur ne sont pas coupées net
    const e = Math.min(1, (sy - Y0 + 0.5) / FADE, (sx - X0 + 0.5) / FADE, (X1 - sx - 0.5) / FADE);
    // sous le sol (y > 112) : seulement le bois, pas la lueur (sinon le feu flotte : le jeu pose le bas visible au sol)
    const al = sy > 112 && small[a + 3] < 250 ? 0 : small[a + 3] * e;
    big[b] = small[a]; big[b + 1] = small[a + 1]; big[b + 2] = small[a + 2]; big[b + 3] = al;
  }
  writeFileSync(`${out}/feu_${i}.png`, encodePNG(cw * K, ch * K, big));
}
console.log("ok", cw * K, ch * K);
