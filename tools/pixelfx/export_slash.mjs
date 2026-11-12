// Rend moon-crescent aux 3 instants du jeu, pour les 3 directions ; écrit des PNG 308x288 (x4, sans lissage).
import { pathToFileURL } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
import { root, installFx } from "./racine.mjs"; // pixelfx : à côté du jeu, sinon E:/projet/pixelfx
const core = await import(pathToFileURL(root + "src/core/index.js"));
const fx = await import(pathToFileURL(installFx("moon-crescent.js", "melee")));
const { encodePNG } = await import(pathToFileURL(root + "tools/lib/png.mjs"));
const out = process.argv[2], K = 4, W = 77, H = 72, TIMES = [0.05, 0.15, 0.24];
mkdirSync(out, { recursive: true });
["side", "up", "down"].forEach((dir, row) => {
  TIMES.forEach((t, i) => {
    const frame = core.createFrame(W, H);
    const inst = core.createFx(fx, { x: 38, y: 36, dir });
    for (let s = 0; s < Math.round(t * 120); s++) inst.update(1 / 120);
    core.clearFrame(frame);
    inst.draw(frame);
    const small = core.composite(frame, new Uint8ClampedArray(W * H * 4), null);
    const big = new Uint8ClampedArray(W * K * H * K * 4);
    for (let y = 0; y < H * K; y++) for (let x = 0; x < W * K; x++) {
      const a = ((y / K | 0) * W + (x / K | 0)) * 4, b = (y * W * K + x) * 4;
      big[b] = small[a]; big[b + 1] = small[a + 1]; big[b + 2] = small[a + 2]; big[b + 3] = small[a + 3];
    }
    writeFileSync(`${out}/vfx_slash_row${row}_${i}.png`, encodePNG(W * K, H * K, big));
  });
});
console.log("ok");
