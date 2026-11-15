"""Gestes joués à la souris et au clavier dans le nouvel éditeur, avec contrôle des données.
poser, déplacer, régler, supprimer, annuler, refaire, peindre, diagonale, Jouer puis retour, enregistrer."""
import json, os, sys, time, filecmp, glob, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

PORT = 9783
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1366, 768)
bilan = []


def note(nom, ok, detail=''):
    bilan.append((nom, bool(ok)))
    print(('OK   ' if ok else 'ÉCHEC'), nom, detail, flush=True)


with h.serveur_essai(PORT, nom='donnees_gestes') as dossier:
    with h.session(port=PORT, query='editor&muet&zone=foret_sombre_1', w=W, h=H, server=False, wait_boot=False) as (page, errors, logs):
        if not h.attendre_editeur(page, errors):
            sys.exit(1)
        page.evaluate("try { localStorage.removeItem('agarica-editeur-v2:brouillon:foret_sombre_1'); } catch (e) {}")
        ev = page.evaluate

        def pret():
            time.sleep(0.25)
            for _ in range(200):
                if ev("!!(Editeur.etat.scene && Editeur.etat.scene.pret && Editeur.etat.scene.tempsDePose <= 0)"): break
                time.sleep(0.05)
            time.sleep(0.15)

        def page_de(wx, wy):
            return ev("([x, y]) => { const sc = Editeur.etat.scene; const p = sc.versPage(x, y); const r = sc.game.canvas.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }", [wx, wy])

        def clic_monde(wx, wy, bouton='left'):
            x, y = page_de(wx, wy)
            page.mouse.move(x, y); page.mouse.down(button=bouton); page.mouse.up(button=bouton)

        def glisser_monde(a, b, bouton='left', pas=8):
            x0, y0 = page_de(*a); x1, y1 = page_de(*b)
            page.mouse.move(x0, y0); page.mouse.down(button=bouton)
            for i in range(1, pas + 1):
                page.mouse.move(x0 + (x1 - x0) * i / pas, y0 + (y1 - y0) * i / pas); time.sleep(0.02)
            page.mouse.up(button=bouton)

        shot = lambda nom: page.screenshot(path=os.path.join(h.S, f'{nom}_{W}.png'))
        pret()
        note('serveur du projet détecté', ev("Editeur.etat.serveur === true"))
        n0 = ev("Editeur.etat.donnees.props.length")
        json0 = ev("Editeur.etat.json")

        # --- POSER : onglet Décors, image de la fougère, clic dans le niveau ---
        page.click('.ed-onglet[data-onglet="decors"]')
        page.click('.ed-vig[data-id="decor:foret_sombre_fougere_sombre"]')
        note('outil en main', ev("Editeur.etat.outil && Editeur.etat.outil.id") == 'decor:foret_sombre_fougere_sombre')
        x, y = page_de(700, 300)
        page.mouse.move(x, y); time.sleep(0.3)
        shot('geste_1_fantome')
        clic_monde(700, 300); pret()
        d = ev("({ n: Editeur.etat.donnees.props.length, dernier: Editeur.etat.donnees.props[Editeur.etat.donnees.props.length - 1], sel: Editeur.etat.selection })")
        note('poser : un décor de plus, calé sur le sol (y 448)', d['n'] == n0 + 1 and d['dernier']['type'] == 'foret_sombre_fougere_sombre' and abs(d['dernier']['x'] - 700) <= 2 and d['dernier']['y'] == 448, json.dumps(d['dernier']))
        note('poser : le nouveau décor est sélectionné', d['sel'] == {'genre': 'props', 'index': n0})
        page.keyboard.press('Escape'); time.sleep(0.1)
        note('Échap range l\'outil', ev("Editeur.etat.outil === null"))
        shot('geste_2_pose_selectionne')

        # --- DÉPLACER à la souris ---
        b = ev(f"Editeur.etat.scene.boiteDe('props', {n0})")
        centre = (b['x'] + b['w'] / 2, b['y'] + b['h'] / 2)
        glisser_monde(centre, (centre[0] + 180, centre[1] - 60)); pret()
        p = ev(f"Editeur.etat.donnees.props[{n0}]")
        note('déplacer : x + 180, toujours au sol', abs(p['x'] - 880) <= 3 and p['y'] == 448, json.dumps(p))

        # --- RÉGLER : curseur Taille, case Retourné, position ---
        page.eval_on_selector('#ed-reglages input[type=range]', "(n) => { n.value = '0.5'; n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })); }")
        pret()
        page.click('#ed-reglages .ed-case >> nth=0'); pret()
        p = ev(f"Editeur.etat.donnees.props[{n0}]")
        note('régler : taille 0,5 et retourné', p.get('scale') == 0.5 and p.get('flipX') is True, json.dumps(p))
        shot('geste_3_regle')
        page.click('#ed-reglages .ed-case >> nth=0'); pret()
        note('régler : décocher retire la clé', 'flipX' not in ev(f"Editeur.etat.donnees.props[{n0}]"))

        # --- SUPPRIMER, ANNULER, REFAIRE ---
        page.keyboard.press('Delete'); pret()
        note('supprimer (Suppr)', ev("Editeur.etat.donnees.props.length") == n0 and ev("Editeur.etat.selection") is None)
        page.keyboard.press('Control+z'); pret()
        p = ev(f"Editeur.etat.donnees.props[{n0}]")
        note('annuler (Ctrl+Z) : le décor revient, avec ses réglages', ev("Editeur.etat.donnees.props.length") == n0 + 1 and p and p.get('scale') == 0.5 and abs(p['x'] - 880) <= 3)
        page.keyboard.press('Control+y'); pret()
        note('refaire (Ctrl+Y)', ev("Editeur.etat.donnees.props.length") == n0)
        for _ in range(12): page.keyboard.press('Control+z'); time.sleep(0.05)
        pret()
        note('tout annuler : zone identique au fichier, plus rien à enregistrer', ev("Editeur.etat.json") == json0 and ev("Editeur.etat.modifie") is False)
        for _ in range(12): page.keyboard.press('Control+y'); time.sleep(0.05)
        pret()
        page.keyboard.press('Control+z'); pret()   # le décor réglé est de retour
        note('refaire en série puis un retour : le décor est là', ev("Editeur.etat.donnees.props.length") == n0 + 1)

        # --- CRÉATURE : poser un loup, patrouille réglée à la souris ---
        page.click('.ed-onglet[data-onglet="creatures"]')
        shot('onglet_creatures')
        ne = ev("(Editeur.etat.donnees.enemies || []).length")
        page.click('.ed-vig[data-id="creature:loup"]')
        clic_monde(420, 380); pret(); page.keyboard.press('Escape')
        e = ev(f"Editeur.etat.donnees.enemies[{ne}]")
        note('créature posée avec sa patrouille', e and e['type'] == 'loup' and e['patrolMinX'] == e['x'] - 150 and e['patrolMaxX'] == e['x'] + 150 and e['y'] == 400, json.dumps(e))
        hd = ev("Editeur.etat.scene.poigneesSelection().find((p) => p.id === 'pmax')")
        glisser_monde((hd['x'], hd['y']), (hd['x'] + 120, hd['y'])); pret()
        e2 = ev(f"Editeur.etat.donnees.enemies[{ne}]")
        note('patrouille réglée à la souris (+120)', abs(e2['patrolMaxX'] - (e['patrolMaxX'] + 120)) <= 3 and e2['x'] == e['x'], json.dumps(e2))
        shot('geste_4_creature_patrouille')

        # --- PEINDRE le sol : clic glissé ; clic droit : effacer ---
        page.click('.ed-onglet[data-onglet="terrain"]')
        page.click('.ed-vig[data-id="sol"]')
        c0 = ev("Editeur.etat.donnees.groundCells.length")
        x0, y0 = page_de(10 * 64 + 32, 6 * 64 + 32); x1, y1 = page_de(13 * 64 + 32, 6 * 64 + 32)
        page.mouse.move(x0, y0); page.mouse.down()
        for i in range(1, 9): page.mouse.move(x0 + (x1 - x0) * i / 8, y0); time.sleep(0.02)
        shot('geste_5_peinture_en_cours')
        page.mouse.up(); pret()
        cells = ev("Editeur.etat.donnees.groundCells.filter((c) => c[1] === 6 && c[0] >= 10 && c[0] <= 13).length")
        note('peindre : 4 cases posées au clic glissé', cells == 4 and ev("Editeur.etat.donnees.groundCells.length") == c0 + 4)
        shot('geste_6_sol_peint')
        glisser_monde((12 * 64 + 32, 6 * 64 + 32), (13 * 64 + 32, 6 * 64 + 32), bouton='right'); pret()
        note('clic droit glissé : 2 cases effacées', ev("Editeur.etat.donnees.groundCells.length") == c0 + 2)

        # --- CONTRÔLE : une case qui ne touche le sol que par un coin ---
        note('aucun problème avant', ev("Editeur.etat.problemes.length") == 0, str(ev("Editeur.etat.problemes.map((p) => p.texte)")))
        clic_monde(12 * 64 + 32, 5 * 64 + 32); pret()
        pb = ev("Editeur.etat.problemes")
        note('diagonale signalée (case 12,5 contre 11,6)', len(pb) == 1 and pb[0]['type'] == 'diagonale', json.dumps(pb, ensure_ascii=False)[:300])
        note('diagonale dite dans la barre d\'état', 'problème' in page.inner_text('.ed-controles'))
        page.mouse.move(*page_de(9 * 64, 2 * 64)); time.sleep(0.2)
        shot('geste_7_diagonale')
        clic_monde(12 * 64 + 32, 6 * 64 + 32); pret()
        note('case du coin ajoutée : plus de problème', ev("Editeur.etat.problemes.length") == 0)

        # --- Élément posé dans le sol ---
        page.keyboard.press('Escape')
        page.click('.ed-onglet[data-onglet="objets"]')
        shot('onglet_objets')
        page.evaluate(f"Editeur.selectionner('enemies', {ne}); Editeur.regler('y', 470)"); pret()
        pb = ev("Editeur.etat.problemes.map((p) => p.texte)")
        note('créature dans le sol signalée', len(pb) == 1 and 'dans le sol' in pb[0], str(pb))
        shot('geste_8_dans_le_sol')
        page.keyboard.press('Control+z'); pret()

        # --- JOUER puis retour au même endroit ---
        page.keyboard.press('Escape'); page.keyboard.press('Escape')
        ev("Editeur.etat.scene.poserVue(900, 270, 1)")
        vue0 = ev("Editeur.etat.scene.vueActuelle()")
        attendu = ev("({ props: Editeur.etat.donnees.props.length, sol: Editeur.etat.donnees.groundCells.length, ennemis: Editeur.etat.donnees.enemies.length })")
        sauvegarde0 = ev("localStorage.getItem('agarica-save-v1')")
        page.click('#ed-jouer')
        for _ in range(200):
            if ev("(() => { const s = window.__game.scene.getScene('ForetSombre1Scene'); return !!(s && s.sys.isActive() && s.player && s.player.body); })()"): break
            time.sleep(0.05)
        time.sleep(1.5)
        j = ev("""(() => { const s = window.__game.scene.getScene('ForetSombre1Scene');
          return { actif: s.sys.isActive(), props: s.props.length, ennemis: s.enemies.getChildren().length, sol: s.__groundRender.cells.length,
            editeurActif: window.__game.scene.getScene('EditeurScene').sys.isActive(), joueurX: s.player.x, barreCachee: getComputedStyle(document.getElementById('ed-barre')).display,
            canvas: (() => { const r = window.__game.canvas.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })() }; })()""")
        solAttendu = ev("zoneGroundCells(Editeur.etat.jeu.donnees).length")
        note('Jouer : la vraie scène tourne avec la zone de l\'éditeur', j['actif'] and not j['editeurActif'] and j['props'] == attendu['props'] and j['ennemis'] == attendu['ennemis'] and j['sol'] == solAttendu, json.dumps(j))
        note('Jouer : interface cachée, jeu en plein écran', j['barreCachee'] == 'none' and (j['canvas'][0] >= W - 2 or j['canvas'][1] >= H - 2), str(j['canvas']))
        shot('geste_9_jouer')
        page.keyboard.press('Escape')
        for _ in range(100):
            if ev("!!(Editeur.etat.scene && Editeur.etat.scene.pret)"): break
            time.sleep(0.05)
        pret()
        vue1 = ev("Editeur.etat.scene.vueActuelle()")
        r = ev("({ jeu: Editeur.etat.jeu, actives: window.__game.scene.getScenes(true).map((s) => s.scene.key), barre: getComputedStyle(document.getElementById('ed-barre')).display, registre: Object.keys(window.__game.registry.getAll()).filter((k) => !k.startsWith('__')) })")
        note('retour (Échap) : éditeur seul actif, au même endroit', r['jeu'] is None and r['actives'] == ['EditeurScene'] and r['barre'] != 'none' and abs(vue1['x'] - vue0['x']) < 1 and abs(vue1['y'] - vue0['y']) < 1 and vue1['zoom'] == vue0['zoom'], json.dumps([vue0, vue1, r['actives']]))
        note('retour : registre du jeu vidé (seuls les réglages de départ du joueur), vraie sauvegarde intacte', set(r['registre']) <= {'equippedForms', 'airForm'} and ev("localStorage.getItem('agarica-save-v1')") == sauvegarde0, str(r['registre'])[:200])
        note('retour : la zone de l\'éditeur n\'a pas bougé', ev("Editeur.etat.donnees.props.length") == attendu['props'] and ev("Editeur.etat.donnees.groundCells.length") == attendu['sol'])
        shot('geste_10_retour')

        # --- JOUER depuis le milieu de l'écran, sans les scènes d'histoire : les touches du jeu répondent ---
        ev("Editeur.reglage('sansHistoire', true)")
        ev("Editeur.etat.scene.poserVue(1700, 270, 1)")
        ev("Editeur.jouer({ ici: true })")
        for _ in range(200):
            if ev("(() => { const s = window.__game.scene.getScene('ForetSombre1Scene'); return !!(s && s.sys.isActive() && s.player && s.player.body); })()"): break
            time.sleep(0.05)
        time.sleep(1.6)
        xa = ev("window.__game.scene.getScene('ForetSombre1Scene').player.x")
        note("Jouer ici : Agarica part du milieu de l écran", abs(xa - 1700) < 30, f'x {xa:.0f}')
        page.keyboard.down('ArrowRight'); time.sleep(1.0); page.keyboard.up('ArrowRight'); time.sleep(0.2)
        xb = ev("window.__game.scene.getScene('ForetSombre1Scene').player.x")
        note('Jouer : Agarica marche (touches du jeu actives)', xb > xa + 40, f'{xa:.0f} -> {xb:.0f}')
        page.click('#ed-retour button')
        for _ in range(100):
            if ev("!!(Editeur.etat.scene && Editeur.etat.scene.pret)"): break
            time.sleep(0.05)
        pret()
        note('retour par le bouton : éditeur de nouveau là, zone inchangée', ev("Editeur.etat.jeu === null") and ev("Editeur.etat.donnees.props.length") == attendu['props'] and ev("Editeur.etat.donnees.playerSpawn.x") == 140)
        ev("Editeur.reglage('sansHistoire', false)")

        # --- BROUILLON gardé, puis ENREGISTRER (dossier d'essai) ---
        time.sleep(0.6)
        note('brouillon gardé dans le navigateur', ev("!!localStorage.getItem('agarica-editeur-v2:brouillon:foret_sombre_1')") and ev("Editeur.etat.modifie") is True)
        avant = open(os.path.join(dossier, 'foret_sombre_1_data.js'), encoding='utf-8').read()
        page.keyboard.press('Control+s')
        for _ in range(100):
            if ev("Editeur.etat.enregistrement") in ('propre', 'erreur'): break
            time.sleep(0.05)
        time.sleep(0.3)
        st = ev("({ e: Editeur.etat.enregistrement, m: Editeur.etat.message, modifie: Editeur.etat.modifie, brouillon: localStorage.getItem('agarica-editeur-v2:brouillon:foret_sombre_1') })")
        apres = open(os.path.join(dossier, 'foret_sombre_1_data.js'), encoding='utf-8').read()
        note('enregistrer (Ctrl+S) : fichier écrit, état « Enregistré », brouillon retiré', st['e'] == 'propre' and not st['modifie'] and st['brouillon'] is None and apres != avant, st['m'])
        sec = glob.glob(os.path.join(dossier, '_backup', 'foret_sombre_1_data.*.js.bak'))
        note('copie de secours créée, identique à l\'ancien fichier', len(sec) == 1 and open(sec[0], encoding='utf-8').read() == avant, str([os.path.basename(s) for s in sec]))
        note('en-tête du fichier gardé, sol en rangées', apres.startswith(avant[:400]) and '...groundRow(' in apres and 'const FORET_SOMBRE_1_SURFACE_Y = 448;' in apres)
        shot('geste_11_enregistre')
        donnees_editeur = ev("Editeur.etat.json")
        e_gestes = list(errors)
    # Rechargement : la page lit le fichier ÉCRIT ; il doit redonner la zone de l'éditeur.
    with h.session(port=PORT, query='editor&muet&zone=foret_sombre_1', w=W, h=H, server=False, wait_boot=False) as (page, errors, logs):
        ok = h.attendre_editeur(page, errors)
        relu = page.evaluate("JSON.stringify(FORET_SOMBRE_1_DATA)") if ok else None
        note('après rechargement : le fichier écrit redonne exactement la zone de l\'éditeur', relu == donnees_editeur)
        note('après rechargement : pas de brouillon, zone « Enregistré »', ok and page.evaluate("Editeur.etat.modifie === false && Editeur.etat.brouillonRepris === false"))
        e_gestes += list(errors)
note('aucune erreur JS pendant tout l\'essai', not e_gestes, str(e_gestes[:5]))
print('src/data intact :', subprocess.run(['git', 'status', '--porcelain', 'src/data'], capture_output=True, text=True, cwd=h.ROOT).stdout.strip() or 'oui')
print(f"\nBILAN : {sum(1 for _, ok in bilan if ok)}/{len(bilan)}")
sys.exit(0 if all(ok for _, ok in bilan) else 1)
