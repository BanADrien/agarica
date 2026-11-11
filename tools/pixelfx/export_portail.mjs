// Portail animé de l'arche de racines (pixelfx, arcane/root-portal) -> 24 images 440x300 (x5, sans lissage),
// même cadre que decor_arche_ouverte.png : à poser pile par-dessus l'arche.
import { pathToFileURL } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
const root = "E:/projet/pixelfx/";
const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(root + "src/fx/arcane/root-portal.js"));
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));
const out = process.argv[2], K = 5, W = 88, H = 60, N = 24, FPS = 10;
mkdirSync(out, { recursive: true });
for (let i = 0; i < N; i++) {
  const inst = core.createFx(fx, { x: 44, y: 58 });
  for (let s = 0; s < i * 12; s++) inst.update(1 / (FPS * 12));
  const frame = core.createFrame(W, H);
  core.clearFrame(frame);
  inst.draw(frame);
  const small = core.composite(frame, new Uint8ClampedArray(W * H * 4), null);
  const big = new Uint8ClampedArray(W * K * H * K * 4);
  for (let y = 0; y < H * K; y++) for (let x = 0; x < W * K; x++) {
    const a = ((y / K | 0) * W + (x / K | 0)) * 4, b = (y * W * K + x) * 4;
    big[b] = small[a]; big[b + 1] = small[a + 1]; big[b + 2] = small[a + 2]; big[b + 3] = small[a + 3];
  }
  writeFileSync(`${out}/portail_${i}.png`, encodePNG(W * K, H * K, big));
}
console.log("ok");
