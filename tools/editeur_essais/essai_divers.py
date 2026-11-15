"""Sans serveur du projet (brouillon), ancien éditeur toujours là, jeu normal intact, brouillon de l'ancien éditeur signalé."""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

bilan = []


def note(nom, ok, detail=''):
    bilan.append(bool(ok))
    print(('OK   ' if ok else 'ÉCHEC'), nom, detail, flush=True)


# a. Serveur simple (pas celui du projet) : l'éditeur le dit et garde le brouillon.
with h.session(port=9786, query='editor&muet&zone=zone3', w=1366, h=768, wait_boot=False) as (page, errors, logs):
    assert h.attendre_editeur(page, errors)
    ev = page.evaluate
    ev("try { localStorage.removeItem('agarica-editeur-v2:brouillon:zone3'); } catch (e) {}")
    ev("Editeur.ouvrirZone('zone3')"); time.sleep(1.5)
    n0 = ev("(Editeur.etat.donnees.props || []).length")
    ev("Editeur.poser(Editeur.etat.elements.find((e) => e.id === 'decor:bosquet_well'), 500, 300)"); time.sleep(1.5)
    note('sans serveur du projet : dit en clair', ev("Editeur.etat.serveur === false") and 'absent' in page.inner_text('.ed-pastille') and 'Serveur du projet absent' in page.inner_text('#ed-bandeau'), page.inner_text('.ed-pastille'))
    page.keyboard.press('Control+s'); time.sleep(1.2)
    note('sans serveur : Ctrl+S n\'écrit rien et l\'explique', ev("Editeur.etat.modifie === true") and 'brouillon' in ev("Editeur.etat.message"), ev("Editeur.etat.message"))
    page.screenshot(path=os.path.join(h.S, 'divers_sans_serveur.png'))
    time.sleep(0.6)
    page.reload()
    assert h.attendre_editeur(page, errors)
    r = ev("({ zone: Editeur.etat.zone, repris: Editeur.etat.brouillonRepris, n: (Editeur.etat.donnees.props || []).length, msg: Editeur.etat.message, modifie: Editeur.etat.modifie })")
    note('après rechargement : brouillon repris', r['zone'] == 'zone3' and r['repris'] and r['n'] == n0 + 1 and r['modifie'], json.dumps(r, ensure_ascii=False))
    page.click('.ed-onglet[data-onglet="zone"]'); time.sleep(0.3)
    page.screenshot(path=os.path.join(h.S, 'divers_brouillon_repris.png'))
    ev("Editeur.abandonnerBrouillon()"); time.sleep(1.5)
    note('« Revenir au fichier » : brouillon abandonné', ev("Editeur.etat.modifie === false") and ev("(Editeur.etat.donnees.props || []).length") == n0 and ev("localStorage.getItem('agarica-editeur-v2:brouillon:zone3')") is None)
    # Brouillon de l'ANCIEN éditeur (IndexedDB) : signalé, puis oublié sur demande.
    ev("""new Promise((res) => { const rq = indexedDB.open('legend-of-agarica-editor', 2);
      rq.onupgradeneeded = () => { if (!rq.result.objectStoreNames.contains('zones')) rq.result.createObjectStore('zones'); };
      rq.onsuccess = () => { const tx = rq.result.transaction('zones', 'readwrite'); tx.objectStore('zones').put({ levelWidth: 960 }, 'zone4'); tx.oncomplete = () => res(true); }; })""")
    ev("Editeur.ouvrirZone('zone4')"); time.sleep(1.5)
    note('brouillon de l\'ancien éditeur signalé', ev("Editeur.etat.ancienBrouillon === true"))
    ev("Editeur.oublierAncienBrouillon()"); time.sleep(0.8)
    note('… et oublié sur demande', ev("Editeur.etat.ancienBrouillon === false") and ev("getZoneDraft('zone4')") is None)
    note('aucune erreur JS (nouvel éditeur, sans serveur)', not errors, str(errors[:3]))

# b. Ancien éditeur : ?editor=ancien
with h.session(port=9786, query='editor=ancien&muet', w=1366, h=768) as (page, errors, logs):
    time.sleep(2)
    r = page.evaluate("""({ actives: window.__game.scene.getScenes(true).map((s) => s.scene.key), ancienUI: getComputedStyle(document.getElementById('editor-ui')).display,
      nouveau: !!document.getElementById('ed'), fichiers: typeof Editeur !== 'undefined', mode: document.body.className })""")
    note('?editor=ancien : ancien éditeur chargé (EditorScene, panneau #editor-ui), nouveau absent', r['actives'] == ['EditorScene'] and r['ancienUI'] == 'block' and not r['nouveau'] and not r['fichiers'], json.dumps(r))
    note('?editor=ancien : aucune erreur JS', not errors, str(errors[:3]))
    page.screenshot(path=os.path.join(h.S, 'divers_ancien_editeur.png'))

# c. Jeu normal : rien de l'éditeur n'est chargé.
with h.session(port=9786, query='muet', w=1366, h=768) as (page, errors, logs):
    time.sleep(1.5)
    r = page.evaluate("""({ actives: window.__game.scene.getScenes(true).map((s) => s.scene.key), nouveau: !!document.getElementById('ed'), fichiers: typeof Editeur !== 'undefined',
      scripts: Array.from(document.scripts).filter((s) => (s.src || '').includes('/editeur/')).length, resolve: String(resolveZoneData).includes('getZoneDraft') })""")
    note('jeu normal : écran-titre, aucun fichier de l\'éditeur chargé, moteur non retouché', r['actives'] == ['TitleScene'] and not r['nouveau'] and not r['fichiers'] and r['scripts'] == 0 and r['resolve'], json.dumps(r))
    note('jeu normal : aucune erreur JS', not errors, str(errors[:3]))
print(f"\nBILAN : {sum(bilan)}/{len(bilan)}")
