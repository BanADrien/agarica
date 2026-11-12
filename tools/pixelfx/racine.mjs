// Où se trouve pixelfx (https://github.com/patch-gg/pixelfx) sur ce PC :
// 1. la variable d'environnement PIXELFX_ROOT ;
// 2. un dossier `pixelfx` à côté du jeu (…/projet/agarica et …/projet/pixelfx) ;
// 3. E:/projet/pixelfx (premier PC).
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [process.env.PIXELFX_ROOT, resolve(here, "../../../pixelfx"), "E:/projet/pixelfx"].filter(Boolean);
const found = candidates.find((d) => existsSync(join(d, "src/core/index.js")));
if (!found) {
  console.error("pixelfx introuvable. Le cloner à côté du jeu :\n  git clone https://github.com/patch-gg/pixelfx.git\nCherché dans : " + candidates.join(", "));
  process.exit(1);
}
export const root = found.replace(/\\/g, "/").replace(/\/?$/, "/");

// Copie un de nos effets (tools/pixelfx/<fichier>) dans pixelfx (src/fx/<catégorie>/), là où ses
// imports relatifs fonctionnent, et renvoie son chemin.
export function installFx(file, category) {
  const dir = join(root, "src/fx", category);
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, file);
  copyFileSync(join(here, file), dest);
  return dest;
}
