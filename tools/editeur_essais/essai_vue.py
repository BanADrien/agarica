"""Vue : molette (zoom sous la souris), clic du milieu, Espace + glisser, flèches, glisser dans le vide ;
saisie dans un champ (les touches du jeu ne la bloquent pas) ; copie (Ctrl+D) ; flèches sur un élément."""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

bilan = []


def note(nom, ok, detail=''):
    bilan.append(bool(ok))
    print(('OK   ' if ok else 'ÉCHEC'), nom, detail, flush=True)


with h.session(port=9788, query='editor&muet&zone=bosquet', w=1366, h=768, wait_boot=False) as (page, errors, logs):
    assert h.attendre_editeur(page, errors)
    ev = page.evaluate
    ev("try { localStorage.removeItem('agarica-editeur-v2:brouillon:bosquet'); } catch (e) {}")
    ev("Editeur.ouvrirZone('bosquet')"); time.sleep(1.8)
    r = ev("(() => { const r = Editeur.etat.scene.game.canvas.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
    cx, cy = r[0] + r[2] * 0.3, r[1] + r[3] * 0.6
    monde = lambda: ev("([x, y]) => { const sc = Editeur.etat.scene; const r = sc.game.canvas.getBoundingClientRect(); return sc.versMonde((x - r.left) * 960 / r.width, (y - r.top) * 540 / r.height); }", [cx, cy])
    vue = lambda: ev("Editeur.etat.scene.vueActuelle()")
    ev("Editeur.etat.scene.poserVue(1500, 270, 1)")
    # molette : le point sous la souris ne bouge pas
    page.mouse.move(cx, cy); time.sleep(0.1)
    p0 = monde(); page.mouse.wheel(0, -300); time.sleep(0.3); p1 = monde(); v = vue()
    note('molette : zoom avant, le point sous la souris reste en place', v['zoom'] > 1.1 and abs(p0['x'] - p1['x']) < 1.5 and abs(p0['y'] - p1['y']) < 1.5, f"zoom {v['zoom']:.2f}")
    page.mouse.wheel(0, 300); time.sleep(0.15); page.mouse.wheel(0, 300); time.sleep(0.3); v = vue()
    note('molette : zoom arrière', v['zoom'] < 1, f"zoom {v['zoom']:.2f}")
    page.keyboard.press('0'); time.sleep(0.2)
    note('touche 0 : retour à 100 %', vue()['zoom'] == 1)
    # clic du milieu
    ev("Editeur.etat.scene.poserVue(1500, 270, 1)"); v0 = vue()
    page.mouse.move(cx, cy); page.mouse.down(button='middle'); page.mouse.move(cx - 200, cy, steps=5); page.mouse.up(button='middle'); time.sleep(0.2)
    v1 = vue(); k = 960 / r[2]
    note('clic du milieu + glisser : la vue suit', abs((v1['x'] - v0['x']) - 200 * k) < 3, f"{v1['x'] - v0['x']:.0f} px monde")
    # Espace + glisser (même sur un élément)
    v0 = vue(); page.keyboard.down('Space'); page.mouse.move(cx, cy); page.mouse.down(); page.mouse.move(cx + 150, cy + 40, steps=5); page.mouse.up(); page.keyboard.up('Space'); time.sleep(0.2)
    v1 = vue()
    note('Espace + glisser : la vue suit, rien n\'est sélectionné ni déplacé', abs((v0['x'] - v1['x']) - 150 * k) < 3 and ev("Editeur.etat.selection") is None and ev("Editeur.etat.modifie") is False, f"{v0['x'] - v1['x']:.0f} px monde")
    # flèches sans sélection
    v0 = vue(); page.keyboard.down('ArrowRight'); time.sleep(0.5); page.keyboard.up('ArrowRight'); time.sleep(0.1); v1 = vue()
    note('flèches : la vue se déplace', v1['x'] > v0['x'] + 100, f"{v1['x'] - v0['x']:.0f} px")
    # élément : sélection, flèches = pousser, Ctrl+D = copie
    ev("Editeur.etat.scene.poserVue(1500, 270, 1)"); time.sleep(0.2)
    i = ev("Editeur.etat.donnees.props.findIndex((p) => Math.abs(p.x - 1500) < 300)")
    b = ev(f"Editeur.etat.scene.boiteDe('props', {i})")
    px = ev("([x, y]) => { const sc = Editeur.etat.scene; const p = sc.versPage(x, y); const r = sc.game.canvas.getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }", [b['x'] + b['w'] / 2, b['y'] + b['h'] / 2])
    page.mouse.move(*px); page.mouse.down(); page.mouse.up(); time.sleep(0.2)
    sel = ev("Editeur.etat.selection")
    note('clic sur un élément : il est choisi', sel is not None and sel['genre'] == 'props', json.dumps(sel))
    x0 = ev("Editeur.elementSelectionne().x")
    for _ in range(5): page.keyboard.press('ArrowRight')
    time.sleep(1.2)
    note('flèches sur un élément choisi : il avance de 5 px (une seule entrée d\'historique)', ev("Editeur.elementSelectionne().x") == x0 + 5 and ev("Editeur.etat.annuler.length") == 1)
    n = ev("Editeur.etat.donnees.props.length")
    page.keyboard.press('Control+d'); time.sleep(1.2)
    note('Ctrl+D : copie posée à côté et choisie', ev("Editeur.etat.donnees.props.length") == n + 1 and ev("Editeur.etat.selection.index") == n and ev("Editeur.elementSelectionne().x") == x0 + 5 + 64)
    # saisie dans un champ : lettres du jeu (z, q, s, d, k, e, espace) non bloquées, Suppr n'efface pas l'élément
    page.click('.ed-onglet[data-onglet="zone"]'); page.keyboard.press('Escape'); page.keyboard.press('Escape'); time.sleep(0.2)
    champ = page.locator('#ed-reglages input[type=text]').first
    champ.click(); champ.fill(''); page.keyboard.type('Bosquet des zeks dq')
    page.keyboard.press('Backspace'); page.keyboard.press('Enter'); time.sleep(1.2)
    note('saisie d\'un titre : toutes les lettres passent, Entrée valide', ev("Editeur.etat.donnees.zoneName") == 'Bosquet des zeks d', ev("Editeur.etat.donnees.zoneName"))
    note('la saisie n\'a rien supprimé dans le niveau', ev("Editeur.etat.donnees.props.length") == n + 1)
    # recherche dans la bande
    page.click('.ed-onglet[data-onglet="decors"]'); page.fill('.ed-cherche input', 'puits'); time.sleep(0.3)
    noms = ev("Array.from(document.querySelectorAll('#ed-bande .ed-vig-nom')).map((n) => n.textContent)")
    note('recherche « puits » : une seule image', noms == ['Puits'], str(noms))
    page.fill('.ed-cherche input', 'fougere'); time.sleep(0.3)
    noms = ev("Array.from(document.querySelectorAll('#ed-bande .ed-vig-nom')).map((n) => n.textContent)")
    note('recherche sans accent « fougere » : trouve « Fougère sombre »', noms == ['Fougère sombre'], str(noms))
    ev("Editeur.abandonnerBrouillon()"); time.sleep(1)
    note('aucune erreur JS', not errors, str(errors[:3]))
print(f"\nBILAN : {sum(bilan)}/{len(bilan)}")
