"""Captures de chaque onglet sur de vraies zones, à une taille d'écran donnée."""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1366, 768)
PORT = 9784
out = os.path.join(h.S, 'captures')
os.makedirs(out, exist_ok=True)
with h.serveur_essai(PORT, nom='donnees_captures') as dossier:
    with h.session(port=PORT, query='editor&muet&zone=bosquet', w=W, h=H, server=False, wait_boot=False) as (page, errors, logs):
        if not h.attendre_editeur(page, errors):
            sys.exit(1)
        ev = page.evaluate

        def pret(t=0.5):
            time.sleep(0.25)
            for _ in range(300):
                if ev("!!(Editeur.etat.scene && Editeur.etat.scene.pret && Editeur.etat.scene.tempsDePose <= 0)"): break
                time.sleep(0.05)
            time.sleep(t)

        def ouvrir(zone, onglet):
            ev(f"Editeur.ouvrirZone('{zone}')"); pret()
            page.click(f'.ed-onglet[data-onglet="{onglet}"]'); time.sleep(0.2)

        def page_de(wx, wy):
            return ev("([x, y]) => { const sc = Editeur.etat.scene; const p = sc.versPage(x, y); const r = sc.game.canvas.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }", [wx, wy])

        def shot(nom):
            page.screenshot(path=os.path.join(out, f'{nom}_{W}x{H}.png'))
            deb = ev("""Array.from(document.querySelectorAll('#ed-barre, #ed-etat, #ed-reglages, .ed-bande-haut')).map((n) => [n.id || n.className, n.scrollWidth - n.clientWidth]).filter((x) => x[1] > 0)""")
            hors = ev("""Array.from(document.querySelectorAll('#ed-barre *, #ed-etat *, #ed-reglages *')).filter((n) => { const r = n.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.bottom > window.innerHeight + 0.5); }).length""")
            print(f'{nom}: débordements {deb or "aucun"}, éléments hors écran {hors}', flush=True)

        # 1. Terrain : racines du grand arbre (branches, troncs), une branche choisie.
        ouvrir('grand_arbre_racines', 'terrain')
        ev("Editeur.selectionner('branches', 2)");
        ev("(() => { const b = Editeur.etat.scene.boiteDe('branches', 2); Editeur.etat.scene.centrerSur(b.x + b.w / 2, b.y + 60); })()"); time.sleep(0.4)
        shot('1_terrain_branche')
        # 1b. peinture du sol en cours + diagonale signalée (forêt sombre 2)
        ouvrir('foret_sombre_1', 'terrain')
        page.click('.ed-vig[data-id="sol"]')
        ev("Editeur.etat.scene.poserVue(700, 270, 1)"); time.sleep(0.2)
        # rangée 5, colonnes 10 à 13 : la case (10,5) ne touche le tronc couché (9,6) que par un coin
        a = page_de(10 * 64 + 32, 5 * 64 + 32); b = page_de(13 * 64 + 32, 5 * 64 + 32)
        page.mouse.move(*a); page.mouse.down()
        for i in range(1, 7): page.mouse.move(a[0] + (b[0] - a[0]) * i / 6, a[1]); time.sleep(0.03)
        shot('1b_terrain_peinture_en_cours')
        page.mouse.up(); pret()
        page.mouse.move(*page_de(15 * 64, 2 * 64)); time.sleep(0.2)
        shot('1c_terrain_diagonale_signalee')
        print('   problèmes :', ev("Editeur.etat.problemes.map((p) => p.texte)"))
        page.hover('.ed-controles'); time.sleep(0.2)
        page.keyboard.press('Control+z'); pret(); page.keyboard.press('Escape')
        # 2. Décors : bosquet, un décor choisi.
        ouvrir('bosquet', 'decors')
        ev("Editeur.etat.scene.poserVue(1500, 270, 1)"); time.sleep(0.2)
        i = ev("Editeur.etat.donnees.props.findIndex((p) => Math.abs(p.x - 1500) < 420)")
        ev(f"Editeur.selectionner('props', {i})"); time.sleep(0.4)
        shot('2_decors_selection')
        page.fill('.ed-cherche input', 'mous'); time.sleep(0.4)
        shot('2b_decors_recherche')
        page.fill('.ed-cherche input', ''); time.sleep(0.2)
        # 3. Créatures : forêt corrompue, une créature choisie (patrouille).
        ouvrir('foret_corrompue_1', 'creatures')
        e = ev("Editeur.etat.donnees.enemies[0]")
        ev(f"Editeur.etat.scene.poserVue({e['x']} + 100, 270, 1)"); time.sleep(0.2)
        ev("Editeur.selectionner('enemies', 0)"); time.sleep(0.4)
        shot('3_creatures_selection')
        # 4. Objets : forêt flottante 1, un courant d'air choisi ; image en main.
        ouvrir('foret_flottante_1', 'objets')
        ev("(() => { const b = Editeur.etat.scene.boiteDe('windCurrents', 0) || Editeur.etat.scene.boites[0]; Editeur.selectionner(b.genre, b.index); Editeur.etat.scene.centrerSur(b.x + b.w / 2, b.y + b.h / 2); })()"); time.sleep(0.4)
        shot('4_objets_selection')
        page.click('.ed-vig[data-id="coffre"]')
        c = ev("Editeur.etat.scene.vueActuelle()")
        page.mouse.move(*page_de(c['x'] - 150, c['y'] + 40)); time.sleep(0.3)
        shot('4b_objets_image_en_main')
        page.keyboard.press('Escape')
        # 5. Zone : îles flottantes ; vue d'ensemble.
        ouvrir('foret_flottante_2', 'zone')
        shot('5_zone')
        ev("Editeur.etat.scene.cadrerZone()"); time.sleep(0.5)
        shot('5b_zone_vue_entiere')
        ouvrir('foret_sombre_1', 'terrain')
        ev("Editeur.etat.scene.cadrerZone()"); time.sleep(0.5)
        shot('5c_foret_sombre_vue_entiere')
        # 6. Menus : jouer, aide.
        page.click('.ed-btn-fleche'); time.sleep(0.2)
        shot('6_menu_jouer')
        page.click('.ed-btn-rond'); time.sleep(0.2)
        shot('6b_aide')
        print('erreurs JS :', errors)
