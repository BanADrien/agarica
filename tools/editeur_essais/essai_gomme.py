"""La gomme de l'éditeur : le clic droit et Suppr enlèvent ce qui est sous le curseur, un
élément ou une case de sol (demande de l'utilisateur du 2026-11-15). Rien n'est enregistré.

    python tools/editeur_essais/essai_gomme.py [port]
"""
import json
import sys
import time

sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from h import session  # noqa: E402

JS = r"""
(async () => {
  const E = Editeur;
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 60 && !(E.scene && E.scene.pret); i++) await attendre(250);
  const s = E.scene;
  const d = () => E.etat.donnees;
  const total = () => Object.keys(EDITEUR_GENRES).reduce((n, g) => n + (Array.isArray(d()[g]) ? d()[g].length : 0), 0);
  const clicDroit = (x, y) => {
    const old = s.versMonde;
    s.versMonde = () => ({ x, y });
    s.appui({ x: 0, y: 0, rightButtonDown: () => true, middleButtonDown: () => false });
    s.relache({});
    s.versMonde = old;
  };
  const res = {};
  // 1. clic droit sur un élément : il part, le sol ne bouge pas
  let b = s.boites.find((x) => x.genre === 'enemies') || s.boites[0];
  let avant = [total(), d().groundCells.length];
  clicDroit(b.x + b.w / 2, b.y + b.h / 2);
  await attendre(1800);
  res.clic_droit_element = { avant, apres: [total(), d().groundCells.length] };
  // 2. clic droit sur une case de sol profonde, sans élément dessus : la case part
  const libre = d().groundCells.find(([gx, gy]) => !s.elementSous(gx * 64 + 32, gy * 64 + 32) && gy >= 8);
  avant = [total(), d().groundCells.length];
  clicDroit(libre[0] * 64 + 32, libre[1] * 64 + 32);
  await attendre(1800);
  res.clic_droit_sol = { avant, apres: [total(), d().groundCells.length] };
  // 3. Suppr sans sélection, curseur sur un élément
  b = s.boites.find((x) => x.genre === 'props') || s.boites[0];
  E.selectionner(null);
  s.pointeur = { x: b.x + b.w / 2, y: b.y + b.h / 2, dedans: true };
  avant = [total(), d().groundCells.length];
  const r3 = s.effacerSousCurseur();
  await attendre(1800);
  res.suppr_element = { retour: r3, avant, apres: [total(), d().groundCells.length] };
  // 4. Suppr sans sélection, curseur sur une case de sol
  const libre2 = d().groundCells.find(([gx, gy]) => !s.elementSous(gx * 64 + 32, gy * 64 + 32) && gy >= 8);
  s.pointeur = { x: libre2[0] * 64 + 32, y: libre2[1] * 64 + 32, dedans: true };
  avant = [total(), d().groundCells.length];
  const r4 = s.effacerSousCurseur();
  await attendre(1800);
  res.suppr_sol = { retour: r4, avant, apres: [total(), d().groundCells.length] };
  // 5. clic droit dans le vide : rien ne change
  avant = [total(), d().groundCells.length];
  clicDroit(200, -200);
  await attendre(600);
  res.clic_droit_vide = { avant, apres: [total(), d().groundCells.length] };
  // 6. quatre annulations remettent tout
  const debut = res.clic_droit_element.avant;
  for (let i = 0; i < 4; i++) { E.annuler(); await attendre(1500); }
  res.apres_annulations = { attendu: debut, obtenu: [total(), d().groundCells.length] };
  return res;
})()
"""

port = int(sys.argv[1]) if len(sys.argv) > 1 else 9785
with session(port=port, query='editor&zone=foret_sombre_1', w=1366, h=768) as (page, errors, logs):
    time.sleep(2)
    res = page.evaluate(JS)
ok = (res['clic_droit_element']['apres'][0] == res['clic_droit_element']['avant'][0] - 1
      and res['clic_droit_element']['apres'][1] == res['clic_droit_element']['avant'][1]
      and res['clic_droit_sol']['apres'][1] == res['clic_droit_sol']['avant'][1] - 1
      and res['suppr_element']['apres'][0] == res['suppr_element']['avant'][0] - 1
      and res['suppr_sol']['apres'][1] == res['suppr_sol']['avant'][1] - 1
      and res['clic_droit_vide']['apres'] == res['clic_droit_vide']['avant']
      and res['apres_annulations']['obtenu'] == res['apres_annulations']['attendu'])
print(json.dumps(res, ensure_ascii=False))
print('erreurs JS :', errors)
print('GOMME', 'OK' if ok and not errors else 'ECHEC')
sys.exit(0 if ok and not errors else 1)
