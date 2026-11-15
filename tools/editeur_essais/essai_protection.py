"""Zone que l'éditeur ne saurait pas réécrire à l'identique : lecture seule, avec un message (essai sur des copies)."""
import json, os, sys, time, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h

PORT = 9789
bilan = []


def note(nom, ok, detail=''):
    bilan.append(bool(ok))
    print(('OK   ' if ok else 'ÉCHEC'), nom, detail, flush=True)


with h.serveur_essai(PORT, nom='donnees_protection') as dossier:
    # Copie de zone3 qui retouche sa constante APRÈS sa déclaration ; copie de zone4 avec une fonction dedans.
    p3 = os.path.join(dossier, 'zone3_data.js')
    open(p3, 'a', encoding='utf-8').write('\nZONE3_DATA.levelWidth = ZONE3_DATA.levelWidth + 64;\n')
    p4 = os.path.join(dossier, 'zone4_data.js')
    s = open(p4, encoding='utf-8').read()
    s = s.replace('const ZONE4_DATA = {', 'const ZONE4_DATA = {\n  calcul: () => 42,', 1)
    open(p4, 'w', encoding='utf-8').write(s)
    avant3, avant4 = open(p3, encoding='utf-8').read(), open(p4, encoding='utf-8').read()
    with h.session(port=PORT, query='editor&muet&zone=zone3', w=1366, h=768, server=False, wait_boot=False) as (page, errors, logs):
        assert h.attendre_editeur(page, errors)
        ev = page.evaluate
        for z in ('zone3', 'zone4'):
            ev(f"try {{ localStorage.removeItem('agarica-editeur-v2:brouillon:{z}'); }} catch (e) {{}}")
        ev("Editeur.ouvrirZone('zone3')"); time.sleep(2)
        r = ev("({ ls: Editeur.etat.lectureSeule, pastille: document.querySelector('.ed-pastille').textContent, bandeau: document.getElementById('ed-bandeau').textContent })")
        note('zone3 (fichier qui retouche la zone après coup) : lecture seule, dite à l\'écran', bool(r['ls']) and 'retouche' in r['ls'] and r['pastille'] == 'Lecture seule' and 'protégée' in r['bandeau'], r['ls'])
        ev("Editeur.poser(Editeur.etat.elements.find((e) => e.id === 'feu'), 500, 300)"); time.sleep(1.5)
        ok = ev("Editeur.enregistrer()"); time.sleep(0.5)
        note('zone3 : Enregistrer refuse, bouton grisé, fichier intact', ok is False and page.is_disabled('.ed-btn-lune') and open(p3, encoding='utf-8').read() == avant3, ev("Editeur.etat.message"))
        page.screenshot(path=os.path.join(h.S, 'protection_lecture_seule.png'))
        ev("Editeur.abandonnerBrouillon()"); time.sleep(1)
        ev("Editeur.ouvrirZone('zone4')"); time.sleep(2)
        r = ev("({ ls: Editeur.etat.lectureSeule, erreurRendu: !!Editeur.etat.scene.erreurRendu })")
        note('zone4 (une fonction dans la zone) : lecture seule avec la raison', bool(r['ls']) and 'fonction' in r['ls'], r['ls'])
        ev("Editeur.poser(Editeur.etat.elements.find((e) => e.id === 'feu'), 500, 300)"); time.sleep(1.5)
        ok = ev("Editeur.enregistrer()"); time.sleep(0.5)
        note('zone4 : Enregistrer refuse, fichier intact', ok is False and open(p4, encoding='utf-8').read() == avant4)
        ev("Editeur.abandonnerBrouillon()"); time.sleep(1)
        # Le serveur refuse aussi, même si on le lui demande directement.
        rep = ev("""fetch('/__editeur/enregistrer', { method: 'POST', body: JSON.stringify({ zone: 'zone3', instruction: 'const ZONE3_DATA = {\\n  levelWidth: 1,\\n};' }) }).then((r) => r.json())""")
        note('le serveur refuse lui aussi d\'écrire zone3', rep.get('ok') is False and 'retouche' in rep.get('erreur', ''), json.dumps(rep, ensure_ascii=False))
        rep = ev("""fetch('/__editeur/enregistrer', { method: 'POST', body: JSON.stringify({ zone: 'zone5', instruction: 'const ZONE5_DATA = {\\n  levelWidth: 1,\\n};' }) }).then((r) => r.json())""")
        note('le serveur refuse un texte où des clés du fichier ont disparu', rep.get('ok') is False and 'perdues' in rep.get('erreur', ''), json.dumps(rep, ensure_ascii=False)[:200])
        rep = ev("""fetch('/__editeur/enregistrer', { method: 'POST', body: JSON.stringify({ zone: '../main', instruction: 'x' }) }).then((r) => r.json())""")
        note('le serveur refuse un nom de zone qui sortirait du dossier', rep.get('ok') is False, json.dumps(rep, ensure_ascii=False))
        note('aucune erreur JS', not errors, str(errors[:3]))
print(f"\nBILAN : {sum(bilan)}/{len(bilan)}")
