// Courant d'air ascendant (pixelfx, weather/updraft) -> 2 plans x 24 images 256x256 (x2, sans lissage) :
// courant_avant_<i>.png et courant_fond_<i>.png. Cases qui se répètent sans raccord dans les deux sens ;
// le jeu les pose en mosaïque sur la colonne et les fait défiler vers le haut (src/entities/CourantAir.js).
//   node tools/pixelfx/export_courant.mjs assets/vfx/courant_frames
import { pathToFileURL } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
import { root, installFx } from "./racine.mjs";

const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(installFx("updraft.js", "weather")) + "?v=" + Date.now());
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));
const out = process.argv[2], K = 2, W = 128, H = 128, N = 24, FPS = 10;
mkdirSync(out, { recursive: true });
for (const layer of ["avant", "fond"]) {
  for (let i = 0; i < N; i++) {
    const inst = core.createFx(fx, { x: 0, y: 0, layer });
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
    writeFileSync(`${out}/courant_${layer}_${i}.png`, encodePNG(W * K, H * K, big));
  }
}
console.log("ok");
