"""Monde V2, Bosquet d'Émeraude : le robot joue la région au clavier simulé (PathBot),
sans téléportation ni triche.

    python tools/robot/v2_bosquet.py prologue   du menu « Zones de test » au bannissement
                                                 et à l'écran « Suite en construction »
    python tools/robot/v2_bosquet.py caves      caves et retour à la source (formes données
                                                 par drapeaux : grizzly, singe, pieuvre)
    python tools/robot/v2_bosquet.py sauvegarde une partie V2 se recharge ; l'ancienne
                                                 sauvegarde reste identique à l'octet près

Variable d'environnement PORT (défaut 9762). Code de sortie 1 si un point échoue.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pilot import Game  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
# PathBot relâche Espace si le saut n'a pas démarré au bout de 160 ms : sur une machine chargée
# (images lentes), ce délai coupe le saut. Ici on lui laisse plus de marge, sans toucher au fichier.
PATHBOT = open(os.path.join(HERE, 'pathbot.js'), encoding='utf-8').read().replace('now - jumpHold.at > 160', 'now - jumpHold.at > 600')
PORT = int(os.environ.get('PORT', '9762'))

# Petits sauts du couloir bas (hauts du bosquet) : un appui bref sur Espace, comme un joueur.
PETITS_SAUTS = r"""
(() => {
  const press = (ms) => {
    const ev = (type) => {
      const e = new KeyboardEvent(type, { code: 'Space', key: ' ', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'keyCode', { get: () => 32 });
      Object.defineProperty(e, 'which', { get: () => 32 });
      window.dispatchEvent(e);
    };
    ev('keydown');
    setTimeout(() => ev('keyup'), ms);
  };
  const st = { a: false, b: false, sauts: [] };
  window.__v2PetitsSauts = st;
  window.__v2Timer = setInterval(() => {
    const sc = currentLevelScene;
    const p = sc && sc.player;
    if (!p || !p.body) return;
    if (!st.a && p.body.blocked.down && p.x < 1136 && p.y > 440) { st.a = true; st.sauts.push(['bosse 1', Math.round(p.x)]); press(130); }
    if (st.a && !st.b && p.body.blocked.down && p.x < 992 && p.y < 392) { st.b = true; st.sauts.push(['bosse 2', Math.round(p.x)]); press(90); }
  }, 16);
})()
"""

V1_ALLER = [
    {'walk': 2534, 'tol': 8, 'timeout': 40000},
    {'face': 'left'},
    {'attack': 3, 'every': 450},
    {'waitFor': "storyGet('break_v2_village_ronces_est')", 'timeout': 6000},
    {'walk': 1376, 'tol': 8, 'timeout': 40000},
    {'face': 'left'},
    {'attack': 3, 'every': 450},
    {'waitFor': "storyGet('break_v2_village_ronces_ouest')", 'timeout': 6000},
    {'walk': 800, 'tol': 20, 'timeout': 20000},
    {'face': 'left'},
    {'press': 'KeyE', 'after': 900},
    {'waitFor': "storyGet('talismanOurs') && p.unlockedSkills.has('ours')", 'timeout': 40000},
    {'wait': 1500},
    {'walk': 60, 'timeout': 20000},
    {'leave': -1, 'timeout': 15000},
]

SOURCE = [
    {'waitFor': "sc.scene.key === 'V2SourceScene' && p.body.blocked.down", 'timeout': 12000},
    {'wait': 600},
    {'walk': 1480, 'timeout': 20000},
    {'walk': 1190, 'tol': 10, 'timeout': 20000},
    {'hop': [832, 1024, 256]},
    {'walk': 980, 'tol': 12},
    {'hop': [576, 768, 192]},
    {'walk': 730, 'tol': 12},
    {'hop': [320, 512, 128], 'edge': 100},
    {'walk': 400, 'tol': 8},
    {'hop': [128, 320, 0], 'edge': 200},
    {'walk': 240, 'tol': 12},
    {'hop': [448, 1152, -64], 'edge': 140},
    {'js': 'window.PathBot.autoFight = true;'},
    {'walk': 896, 'tol': 12, 'timeout': 40000},
    {'js': 'window.PathBot.autoFight = false;'},
    {'waitFor': 'p.body.blocked.down', 'timeout': 4000},
    {'wait': 300},
    {'skill': 'KeyA', 'after': 1800},
    {'waitFor': "storyGet('v2SourceLibree')", 'timeout': 20000},
    {'wait': 1200},
    {'hop': [960, 1152, -64], 'edge': 200},
    {'walk': 1250, 'tol': 10, 'timeout': 15000},
    {'hop': [1344, 1536, 128], 'edge': 100},
    {'walk': 1510, 'tol': 12},
    {'hop': [1600, 1728, 0], 'edge': 100},
    {'walk': 1700, 'tol': 12},
    {'hop': [1792, 1920, -128], 'edge': 100},
    {'leave': 1, 'timeout': 15000},
]

V1_RETOUR = [
    {'waitFor': "sc.scene.key === 'V2VillageScene' && p.body.blocked.down", 'timeout': 12000},
    {'wait': 500},
    {'walk': 720, 'tol': 20, 'timeout': 20000},
    {'face': 'right'},
    {'press': 'KeyE', 'after': 900},
    {'waitFor': "storyGet('v2Nuit')", 'timeout': 60000},
    {'wait': 1500},
    {'walk': 1450, 'tol': 12, 'timeout': 25000},
    {'hop': [1472, 1600, 384], 'edge': 80},
    {'walk': 1586, 'tol': 8},
    {'hop': [1664, 1856, 256], 'edge': 100},
    {'walk': 1840, 'tol': 8},
    {'hop': [1920, 2112, 128], 'edge': 100},
    {'walk': 2016, 'tol': 12},
    {'jumpAt': 2016, 'to': 2016, 'timeout': 8000},
]

HAUTS = [
    {'waitFor': "sc.scene.key === 'V2HautsBosquetScene' && p.body.blocked.down", 'timeout': 12000},
    {'wait': 500},
    {'js': PETITS_SAUTS},
    {'walk': 720, 'tol': 8, 'timeout': 20000, 'noFight': True},
    {'js': 'clearInterval(window.__v2Timer);'},
    {'hop': [448, 640, 320], 'edge': 120},
    {'walk': 480, 'tol': 8},
    {'hop': [320, 448, 192], 'edge': 200},
    {'walk': 400, 'tol': 8},
    {'hop': [512, 1216, 64], 'edge': 140},
    {'walk': 1200, 'tol': 8, 'timeout': 15000},
    {'jumpAt': 1200, 'to': 1400, 'timeout': 8000},
    {'walk': 1560, 'tol': 8, 'timeout': 15000},
    {'hop': [1600, 1728, -64], 'edge': 100},
    {'walk': 1650, 'tol': 8},
    {'hop': [1728, 1920, -192], 'edge': 100},
    {'walk': 1760, 'tol': 8},
    {'hop': [128, 1664, -320], 'edge': 120},
    {'walk': 905, 'tol': 6, 'timeout': 20000},
    {'waitFor': "storyGet('idoleVolee')", 'timeout': 60000},
    {'waitFor': "storyGet('banished')", 'timeout': 90000},
]

FIN = [
    {'wait': 1500},
    {'walk': 3600, 'timeout': 25000},
    {'walk': 3800, 'timeout': 25000},
]


def attendre_bot(g, timeout):
    t0 = time.time()
    while time.time() - t0 < timeout:
        st = g.js("window.PathBot.state && { done: window.PathBot.state.done, ok: window.PathBot.state.ok, k: window.PathBot.state.k, n: window.PathBot.state.steps.length }")
        if st and st['done']:
            return st['ok']
        time.sleep(0.25)
    return False


def phase(g, nom, steps, timeout=240):
    g.js("(steps) => window.PathBot.start(steps)", steps)
    ok = attendre_bot(g, timeout)
    # Relâche tout (une étape finie en plein saut laisserait Espace enfoncée).
    g.js("() => window.PathBot.stop()")
    etat = g.js("(() => { const s = window.PathBot.state; const sc = currentLevelScene; const p = sc && sc.player; return { k: s.k, n: s.steps.length, zone: sc && sc.scene.key, x: p && Math.round(p.x), y: p && Math.round(p.y), coeurs: p && p.hearts, log: s.log.slice(-6) }; })()")
    print(f"{nom} : {'OK' if ok else 'ÉCHEC'} {json.dumps(etat, ensure_ascii=False)}", flush=True)
    return ok


def titre_vers_prologue(g):
    g.js("""() => { localStorage.clear(); const gm = window.__game;
        for (const s of gm.scene.getScenes(true)) gm.scene.stop(s.scene.key);
        gm.scene.start('TitleScene', {}); }""")
    time.sleep(1.5)
    g.js("() => { window.__game.scene.getScene('TitleScene').showTestMenu(); }")
    time.sleep(0.6)
    index = g.js("() => window.__game.scene.getScene('TitleScene').testItems.findIndex((it) => it.label.startsWith('Monde V2'))")
    for _ in range(index):
        g.page.keyboard.press('ArrowDown')
        time.sleep(0.12)
    choisi = g.js("() => { const t = window.__game.scene.getScene('TitleScene'); return t.testItems[t.testIndex].label; }")
    print('menu :', choisi, flush=True)
    g.page.keyboard.press('Enter')
    t0 = time.time()
    while time.time() - t0 < 30:
        cle = g.js("() => { const a = window.__game.scene.getScenes(true).map((s) => s.scene.key); return a.join(','); }")
        if 'V2VillageScene' in cle:
            break
        if 'PrologueScene' in cle:
            g.page.keyboard.press('Enter')
        time.sleep(0.7)
    time.sleep(2.5)
    g.page.evaluate(PATHBOT)
    return g.js("() => !!window.__game.scene.getScene('V2VillageScene').player")


def prologue():
    g = Game(port=PORT)
    bilan = {}
    try:
        bilan['menu -> prologue -> village'] = titre_vers_prologue(g)
        bilan['cle de sauvegarde V2'] = g.js("() => saveStorageKey()") == 'agarica-save-monde-v2'
        for nom, steps in [('village aller', V1_ALLER), ('source', SOURCE), ('village retour', V1_RETOUR), ('hauts', HAUTS)]:
            bilan[nom] = phase(g, nom, steps)
            if not bilan[nom]:
                break
        else:
            # Dernière marche : la porte de l'Est quitte le niveau, le robot n'a plus de joueur à piloter.
            g.js("(steps) => window.PathBot.start(steps)", FIN)
            t0 = time.time()
            while time.time() - t0 < 70:
                if 'V2SuiteScene' in g.js("() => window.__game.scene.getScenes(true).map((s) => s.scene.key).join(',')"):
                    break
                time.sleep(0.3)
            g.js("() => window.PathBot.stop()")
            time.sleep(1.2)
            bilan['ecran suite'] = 'V2SuiteScene' in g.js("() => window.__game.scene.getScenes(true).map((s) => s.scene.key).join(',')")
            g.page.screenshot(path=os.path.join(os.environ.get('V2_SHOTS', os.environ.get('TEMP', '.')), 'v2_suite.png'))
            sauts = g.js("() => window.__v2PetitsSauts")
            print('petits sauts :', sauts, flush=True)
            valeurs = g.js("() => { const v = JSON.parse(localStorage.getItem('agarica-save-monde-v2')).values; return { banished: v.banished, talisman: v.talismanOurs, source: v.v2SourceLibree, nuit: v.v2Nuit, idole: v.idoleVolee, ancienne: localStorage.getItem('agarica-save-v1') }; }")
            print('sauvegarde V2 :', valeurs, flush=True)
            bilan['sauvegarde V2 complete'] = bool(valeurs['banished'] and valeurs['talisman'] and valeurs['source'] and valeurs['nuit'])
            bilan['ancienne sauvegarde intacte (absente)'] = valeurs['ancienne'] is None
        if g.errors:
            print('ERREURS JS :', g.errors[:6], flush=True)
        bilan['aucune erreur JS'] = not g.errors
    finally:
        g.close()
    return bilan


CAVES_FLAGS = {
    'talismanOurs': True, 'banished': True, 'idoleVolee': True, 'v2Nuit': True, 'v2SourceLibree': True,
    'break_v2_source_bouchon': True,
    'hasGrizzlyForm': True, 'hasMonkeyForm': True, 'hasOctopusForm': True, 'airForm': 'monkey',
    'equippedForms': ['grizzly', 'monkey', 'octopus'],
    'unlockedSkills': ['ours'], 'skillSlots': ['ours', None, None], 'inventory': ['talisman_ours'],
}


def touche(g, code, ms):
    g.page.keyboard.down(code)
    time.sleep(ms / 1000)
    g.page.keyboard.up(code)


def joueur(g):
    return g.js("() => { const p = currentLevelScene.player; return { x: Math.round(p.x), y: Math.round(p.y), sol: p.body.blocked.down, coeurs: p.hearts, forme: p.form }; }")


def nager_au_coffre(g):
    """Depuis le replat : on entre dans l'eau, on descend à la nage, on ouvre le coffre, on ressort."""
    t0 = time.time()
    while time.time() - t0 < 4 and not joueur(g)['sol']:
        time.sleep(0.05)
    # À la surface, la pieuvre flotte : on avance au-dessus de l'eau, puis on plonge.
    g.page.keyboard.down('ArrowLeft')
    t0 = time.time()
    while time.time() - t0 < 5 and joueur(g)['x'] > 1120:
        time.sleep(0.05)
    g.page.keyboard.up('ArrowLeft')
    g.page.keyboard.down('ArrowDown')
    t0 = time.time()
    while time.time() - t0 < 5 and joueur(g)['y'] < 376:
        time.sleep(0.05)
    g.page.keyboard.up('ArrowDown')
    for _ in range(30):
        x = joueur(g)['x']
        if abs(x - 1088) < 24:
            break
        touche(g, 'ArrowRight' if x < 1088 else 'ArrowLeft', 90)
    print('au fond :', joueur(g), flush=True)
    touche(g, 'e', 150)  # tenue assez longtemps pour que le jeu voie l'appui
    time.sleep(1)
    ouvert = g.js("() => !!storyGet('chest_v2_source_coffre_bassin')")
    # Remontée à la surface, puis saut vers le replat.
    g.page.keyboard.down('ArrowUp')
    t0 = time.time()
    while time.time() - t0 < 5 and joueur(g)['y'] > 296:
        time.sleep(0.05)
    g.page.keyboard.down('ArrowRight')
    g.page.keyboard.down('Space')
    time.sleep(0.35)
    g.page.keyboard.up('ArrowUp')
    g.page.keyboard.up('Space')
    t0 = time.time()
    while time.time() - t0 < 5 and not (joueur(g)['sol'] and joueur(g)['y'] <= 256):
        time.sleep(0.05)
    g.page.keyboard.up('ArrowRight')
    print('sorti de l\'eau :', joueur(g), flush=True)
    return ouvert and joueur(g)['y'] <= 256


def caves():
    g = Game(port=PORT)
    bilan = {}
    try:
        g.start('V2CavesScene', CAVES_FLAGS, wait=3)
        g.page.evaluate(PATHBOT)
        # Charge du grizzly contre le mur fissuré, depuis la piste d'élan (Maj + flèche).
        bilan['mur fissure (grizzly)'] = phase(g, 'charge', [
            {'wait': 800},
            {'walk': 2960, 'sprint': True, 'tol': 30, 'timeout': 9000},
            {'waitFor': "storyGet('break_v2_caves_mur_est')", 'timeout': 2000},
        ], 40)
        if not bilan['mur fissure (grizzly)']:
            return bilan
        bilan['papillon 12, panda, pere, porte'] = phase(g, 'caves', [
            {'wait': 800},
            {'walk': 2320, 'tol': 12, 'timeout': 25000},
            {'hop': [2112, 2240, 320], 'edge': 120},
            {'walk': 2150, 'tol': 8},
            {'hop': [2304, 2496, 256], 'edge': 100},
            {'walk': 2400, 'tol': 10},
            {'js': "window.__papillonsAvant = papillonsCount();"},
            {'attack': 3, 'aim': 'up', 'every': 500},
            {'waitFor': "papillonsCount() > window.__papillonsAvant", 'timeout': 5000},
            {'walk': 2010, 'timeout': 20000},
            {'jumpAt': 1950, 'to': 1740, 'timeout': 8000},
            {'walk': 1120, 'timeout': 25000},
            {'hop': [768, 1024, 384], 'edge': 100},
            {'walk': 896, 'tol': 12},
            {'press': 'KeyE', 'after': 1200},
            {'waitFor': "inventoryHas('talisman_panda') && p.unlockedSkills.has('panda')", 'timeout': 8000},
            {'walk': 720, 'timeout': 12000},
            {'waitFor': "storyGet('trig_v2_caves_pere_plancher')", 'timeout': 12000},
            {'wait': 1500},
            {'walk': 150, 'tol': 12, 'timeout': 20000},
            {'press': 'KeyE', 'after': 800},
            {'waitFor': "storyGet('v2PorteCavesOuverte')", 'timeout': 6000},
            {'leave': -1, 'timeout': 15000},
        ])
        if not bilan['papillon 12, panda, pere, porte']:
            return bilan
        ok = phase(g, 'vers le replat', [
            {'waitFor': "sc.scene.key === 'V2SourceScene' && p.body.blocked.down", 'timeout': 10000},
            {'wait': 500},
            {'walk': 1240, 'tol': 8, 'timeout': 20000},
        ], 40)
        bilan['coffre (pieuvre)'] = ok and nager_au_coffre(g)
        bilan['coeur (second saut)'] = phase(g, 'coeur', [
            {'walk': 1190, 'tol': 8},
            {'hop': [832, 1024, 256]},
            {'walk': 980, 'tol': 12},
            {'hop': [576, 768, 192]},
            {'walk': 730, 'tol': 12},
            {'hop': [320, 512, 128], 'edge': 100},
            {'walk': 400, 'tol': 8},
            {'hop': [128, 320, 0], 'edge': 200},
            {'walk': 240, 'tol': 12},
            {'hop': [448, 1152, -64], 'edge': 140},
            {'js': 'window.PathBot.autoFight = true;'},
            {'walk': 700, 'tol': 14, 'timeout': 25000},
            {'waitFor': 'sc.enemies.getChildren().every((e) => !e.active || e.defeated)', 'timeout': 20000},
            {'js': 'window.PathBot.autoFight = false;'},
            {'walk': 470, 'tol': 12, 'timeout': 8000},
            {'jumpAt': 505, 'to': 640, 'second': True, 'secondDelay': 420, 'timeout': 8000},
            {'walk': 640, 'tol': 14, 'timeout': 3000},
            {'waitFor': "storyGet('treasure_v2_source_coeur_source')", 'timeout': 4000},
        ], 90)
        bilan['aucun cul-de-sac : retour au replat'] = phase(g, 'retour', [
            {'walk': 760, 'tol': 12, 'timeout': 5000},
            {'waitFor': 'p.body.blocked.down', 'timeout': 3000},
            {'js': 'window.PathBot.autoFight = true;'},
            {'walk': 1200, 'tol': 20, 'timeout': 30000},
            {'js': 'window.PathBot.autoFight = false;'},
            {'waitFor': 'p.body.blocked.down && p.y <= 256 && p.x > 1150', 'timeout': 6000},
        ], 70)
        if g.errors:
            print('ERREURS JS :', g.errors[:6], flush=True)
        bilan['aucune erreur JS'] = not g.errors
    finally:
        g.close()
    return bilan


def sauvegarde():
    g = Game(port=PORT)
    bilan = {}
    try:
        ancienne = json.dumps({'version': 1, 'savedAt': 1234567890123, 'values': {'lastZone': 'foret_sombre_1', 'lastEnterId': None, 'xaraMet': True, 'hearts': 2}}, separators=(',', ':'))
        g.js("(txt) => { localStorage.clear(); localStorage.setItem('agarica-save-v1', txt); }", ancienne)
        g.js("""() => { const gm = window.__game; for (const s of gm.scene.getScenes(true)) gm.scene.stop(s.scene.key); gm.scene.start('TitleScene', {}); }""")
        time.sleep(1.5)
        g.js("() => { const t = window.__game.scene.getScene('TitleScene'); mondeV2Lancer(t); }")
        time.sleep(1.5)
        g.page.keyboard.press('Enter')
        time.sleep(0.7)
        for _ in range(5):
            if 'V2VillageScene' in g.js("() => window.__game.scene.getScenes(true).map((s) => s.scene.key).join(',')"):
                break
            g.page.keyboard.press('Enter')
            time.sleep(0.8)
        time.sleep(2.5)
        # Un fait de partie V2, écrit par le jeu lui-même, puis retour au titre.
        g.js("() => { storySet('v2TemoinSauvegarde', 'present'); saveGame(currentLevelScene, { silent: true }); }")
        v2 = g.js("() => localStorage.getItem('agarica-save-monde-v2')")
        bilan['partie V2 ecrite sous sa cle'] = bool(v2) and 'v2TemoinSauvegarde' in v2
        bilan['ancienne sauvegarde identique (en jeu)'] = g.js("() => localStorage.getItem('agarica-save-v1')") == ancienne
        g.js("() => { const gm = window.__game; for (const s of gm.scene.getScenes(true)) gm.scene.stop(s.scene.key); gm.scene.start('TitleScene', {}); }")
        time.sleep(1.5)
        bilan['titre : ancienne partie revenue'] = g.js("() => storyGet('lastZone') === 'foret_sombre_1' && storyGet('v2TemoinSauvegarde') === undefined && !mondeV2Actif()")
        bilan['ancienne sauvegarde identique (titre)'] = g.js("() => localStorage.getItem('agarica-save-v1')") == ancienne
        g.js("() => { const t = window.__game.scene.getScene('TitleScene'); mondeV2Lancer(t); }")
        time.sleep(3.5)
        bilan['partie V2 rechargee'] = g.js("() => currentLevelScene && currentLevelScene.scene.key === 'V2VillageScene' && storyGet('v2TemoinSauvegarde') === 'present' && mondeV2Actif()")
        bilan['ancienne sauvegarde identique (fin)'] = g.js("() => localStorage.getItem('agarica-save-v1')") == ancienne
        if g.errors:
            print('ERREURS JS :', g.errors[:6], flush=True)
        bilan['aucune erreur JS'] = not g.errors
    finally:
        g.close()
    return bilan


if __name__ == '__main__':
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, 'reconfigure'):
            st.reconfigure(encoding='utf-8', errors='replace')
    quoi = sys.argv[1] if len(sys.argv) > 1 else 'prologue'
    res = {'prologue': prologue, 'caves': caves, 'sauvegarde': sauvegarde}[quoi]()
    print('BILAN', res, flush=True)
    sys.exit(0 if res and all(res.values()) else 1)
