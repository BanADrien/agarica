"""Pose CHAQUE élément du catalogue dans une zone, le déplace, tire ses poignées, joue la zone,
enregistre (dossier d'essai) et relit : aucune erreur JS, aucun élément sans boîte."""
import json, os, sys, time, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

PORT = 9785
ZONE = 'foret_sombre_1'
POSER = """() => {
  const E = Editeur; const sc = E.etat.scene; const out = [];
  const liste = E.etat.elements.filter((e) => e.genre);
  let x = 200;
  for (const e of liste) {
    const n0 = (E.etat.donnees[e.genre] || []).length;
    let ok = false; let err = null;
    try { ok = E.poser(e, x, 300); } catch (ex) { err = String(ex); }
    out.push({ id: e.id, genre: e.genre, ok, err, index: n0 });
    x += 14; if (x > 3000) x = 200;
  }
  E.choisirOutil(null);
  return out;
}"""
VERIFIER = """(poses) => {
  const E = Editeur; const sc = E.etat.scene; const sans = []; const noms = [];
  for (const p of poses) {
    const el = (E.etat.donnees[p.genre] || [])[p.index];
    if (!el) { sans.push(p.id + ' (absent)'); continue; }
    if (!sc.boiteDe(p.genre, p.index)) sans.push(p.id + ' (sans boîte)');
    const nom = E.nomElement(p.genre, el);
    const attendu = E.etat.elements.find((e) => e.id === p.id).nom;
    if (nom !== attendu) noms.push(p.id + ' : ' + nom + ' / ' + attendu);
  }
  return { sans, noms, erreurRendu: sc.erreurRendu ? String(sc.erreurRendu) : null, boites: sc.boites.length };
}"""
BOUGER = """(poses) => {
  const E = Editeur; const sc = E.etat.scene; const pb = [];
  for (const p of poses) {
    const g = EDITEUR_GENRES[p.genre]; const geo = EDITEUR_GEOS[g.geo];
    const el = E.copie(E.etat.donnees[p.genre][p.index]);
    try {
      const a = geo.ancre(sc, el, g);
      geo.deplacer(sc, el, a.x + 70, a.y - 20, g);
      for (const hd of (geo.poignees ? geo.poignees(sc, el, g, sc.boiteDe(p.genre, p.index)) : [])) geo.tirer(sc, el, hd.id, hd.x + 48, hd.y + 48, g);
      const fautif = EditeurEcriture.nonEnregistrable(el);
      if (fautif) pb.push(p.id + ' : ' + fautif);
      E.remplacerElement(p.genre, p.index, el);
    } catch (ex) { pb.push(p.id + ' : ' + ex); }
  }
  return pb;
}"""
# Tous les champs de réglage de chaque genre, lus dans le panneau (rien ne doit planter à l'affichage).
PANNEAUX = """(poses) => {
  const E = Editeur; const pb = []; let champs = 0;
  for (const p of poses) {
    try { E.selectionner(p.genre, p.index); champs += document.querySelectorAll('#ed-reglages .ed-champ, #ed-reglages .ed-case').length;
      if (!document.querySelector('#ed-reglages h3')) pb.push(p.id + ' : panneau vide'); } catch (ex) { pb.push(p.id + ' : ' + ex); }
  }
  E.selectionner(null);
  return { pb, champs };
}"""
with h.serveur_essai(PORT, nom='donnees_catalogue') as dossier:
    with h.session(port=PORT, query=f'editor&muet&zone={ZONE}', w=1366, h=768, server=False, wait_boot=False) as (page, errors, logs):
        if not h.attendre_editeur(page, errors): sys.exit(1)
        ev = page.evaluate
        ev(f"try {{ localStorage.removeItem('agarica-editeur-v2:brouillon:{ZONE}'); }} catch (e) {{}}")

        def pret():
            time.sleep(0.3)
            for _ in range(400):
                if ev("!!(Editeur.etat.scene && Editeur.etat.scene.pret && Editeur.etat.scene.tempsDePose <= 0)"): break
                time.sleep(0.05)
            time.sleep(0.2)

        pret()
        poses = ev(POSER); pret()
        rates = [p for p in poses if not p['ok']]
        print(f"{len(poses)} éléments du catalogue posés ; refusés : {rates}")
        v = ev(VERIFIER, poses)
        print('après pose :', json.dumps(v, ensure_ascii=False))
        pan = ev(PANNEAUX, poses)
        print(f"panneaux de réglages affichés : {len(poses)} éléments, {pan['champs']} champs, problèmes : {pan['pb']}")
        pb = ev(BOUGER, poses); pret()
        print('déplacés + poignées tirées ; problèmes :', pb)
        v2 = ev(VERIFIER, poses)
        print('après déplacement :', json.dumps(v2, ensure_ascii=False))
        page.screenshot(path=os.path.join(h.S, 'catalogue_tout_pose.png'))
        print('contrôles :', ev("Editeur.etat.problemes.length"), 'problème(s) signalé(s)')
        # Jouer la zone avec tout le catalogue dedans (sans les scènes d'histoire), 4 s.
        n_err = len(errors)
        ev("Editeur.reglage('sansHistoire', true); Editeur.jouer()")
        time.sleep(5)
        actif = ev("window.__game.scene.getScenes(true).map((s) => s.scene.key)")
        print('en jeu :', actif, '; erreurs JS pendant le jeu :', errors[n_err:][:5])
        page.screenshot(path=os.path.join(h.S, 'catalogue_en_jeu.png'))
        page.keyboard.press('Escape'); pret()
        ev("Editeur.reglage('sansHistoire', false)")
        # Enregistrer puis relire.
        ev("Editeur.enregistrer()")
        for _ in range(200):
            if ev("Editeur.etat.enregistrement") in ('propre', 'erreur'): break
            time.sleep(0.05)
        print('enregistrement :', ev("Editeur.etat.enregistrement"), '|', ev("Editeur.etat.message"))
        attendu = ev("Editeur.etat.json")
        e1 = list(errors)
    with h.session(port=PORT, query=f'editor&muet&zone={ZONE}', w=1366, h=768, server=False, wait_boot=False) as (page, errors, logs):
        ok = h.attendre_editeur(page, errors)
        relu = page.evaluate(f"JSON.stringify({ZONE.upper()}_DATA)") if ok else None
        print('fichier relu identique à la zone de l\'éditeur :', relu == attendu, '; éditeur rouvert sans erreur :', ok and not errors)
        e1 += list(errors)
print('erreurs JS :', e1[:8])
print('src/data intact :', subprocess.run(['git', 'status', '--porcelain', 'src/data'], capture_output=True, text=True, cwd=h.ROOT).stdout.strip() or 'oui')
