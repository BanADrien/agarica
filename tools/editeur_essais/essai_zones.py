"""Ouvre CHAQUE zone du jeu dans le nouvel éditeur : erreurs JS, temps de reconstruction, contrôles."""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

seules = sys.argv[1:]
OUVRIR = """async (zone) => {
  const t0 = performance.now();
  Editeur.ouvrirZone(zone);
  const attendre = (depuis) => new Promise((r) => { const f = () => ((Editeur.etat.scene && Editeur.etat.scene.pret && performance.now() - depuis > 60) || performance.now() - depuis > 15000 ? r() : setTimeout(f, 16)); setTimeout(f, 50); });
  await attendre(t0);
  if (!(Editeur.etat.scene && Editeur.etat.scene.pret)) return { zone, bloque: true, ouverture: -1, reconstruction: -1, boites: 0, objets: 0, erreurRendu: 'scène jamais prête', problemes: [], lectureSeule: null, modifie: false };
  const t1 = performance.now();
  await new Promise((r) => setTimeout(r, 900));
  const sc = Editeur.etat.scene;
  // seconde reconstruction (cas d'une modification) : temps mesuré à part
  const t2 = performance.now();
  sc.scene.restart();
  await attendre(t2);
  const t3 = performance.now();
  await new Promise((r) => setTimeout(r, 300));
  const s2 = Editeur.etat.scene;
  return {
    zone, ouverture: Math.round(t1 - t0), reconstruction: Math.round(t3 - t2), boites: s2.boites.length,
    objets: s2.children.list.length, erreurRendu: s2.erreurRendu ? String(s2.erreurRendu) : null,
    problemes: Editeur.etat.problemes.map((p) => p.texte), lectureSeule: Editeur.etat.lectureSeule,
    modifie: Editeur.etat.modifie,
  };
}"""
with h.session(port=9781, query='editor&muet', w=1366, h=768, wait_boot=False) as (page, errors, logs):
    if not h.attendre_editeur(page, errors):
        sys.exit(1)
    zones = page.evaluate("Editeur.etat.zones.map((z) => z.id)")
    if seules: zones = [z for z in zones if z in seules]
    res = []
    for z in zones:
        n0 = len(errors)
        r = page.evaluate(OUVRIR, z)
        r['erreurs'] = errors[n0:]
        res.append(r)
        print(f"{z:22s} ouverture {r['ouverture']:5d} ms  reconstruction {r['reconstruction']:5d} ms  éléments {r['boites']:3d}  objets {r['objets']:5d}"
              f"  problèmes {len(r['problemes'])}  {'ERREUR ' + str(r['erreurs'][:2]) if r['erreurs'] else ''}{' RENDU ' + r['erreurRendu'] if r['erreurRendu'] else ''}"
              f"{' LECTURE SEULE' if r['lectureSeule'] else ''}{' MODIFIÉ?' if r['modifie'] else ''}", flush=True)
    json.dump(res, open(os.path.join(h.S, 'essai_zones.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    bad = [r for r in res if r['erreurs'] or r['erreurRendu']]
    print(f"\n{len(res)} zones ouvertes, {len(bad)} avec erreur ; erreurs JS au total : {len(errors)}")
    for r in res:
        for p in r['problemes'][:6]: print('  ', r['zone'], ':', p)
    avert = [l for l in logs if 'Failed to load' not in l]
    print('avertissements :', len(avert)); [print('   ', a[:200]) for a in avert[:12]]
    sys.exit(1 if errors else 0)
