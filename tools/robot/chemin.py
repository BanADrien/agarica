"""Chemin critique au clavier simulé, zone par zone (PathBot / VineBot).
Chaque segment démarre sa zone avec l'état d'histoire attendu à ce moment,
joue la zone au clavier (dialogues avancés à E) et vérifie qu'on arrive dans
la zone suivante. Usage : python chemin.py seg1 [seg2 ...] (ou 'tout')."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pilot import Game, reset_at  # noqa: E402
import vinebot as vb  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
PATHBOT = open(os.path.join(HERE, 'pathbot.js'), encoding='utf-8').read()

BASE1 = {'talismanOurs': True, 'aideFaite': True, 'idoleVolee': True, 'amaniteCouverte': True, 'banished': True,
         'unlockedSkills': ['ours'], 'skillSlots': ['ours', None, None], 'inventory': ['talisman_ours']}
FS2 = dict(BASE1, xaraMet=True)
RAC = dict(FS2, hasWolfForm=True, equippedForms=['wolf', None, None], planteVue=True)
ARENE = dict(RAC, kainatiDefeated=True)
MS = dict(ARENE)
FF1 = dict(ARENE, hasMonkeyForm=True, airForm='monkey', equippedForms=['wolf', 'monkey', None], mondeSpirituelFini=True)
FF2 = dict(FF1, geraltMet=True, inventory=['talisman_ours', 'carte_geralt'])
CLA = dict(FF2, amaniteMet=True, hasEagleForm=True, airForm='eagle', equippedForms=['wolf', 'eagle', None],
           inventory=['talisman_ours', 'carte_geralt', 'totem_poche_casse'])
HUT = dict(CLA, fleurPrelevee=True, clairiereArrivee=True, inventory=CLA['inventory'] + ['fleur_resistante'])
FC1 = dict(HUT, morgatVue=True, crashDone=True, inventory=['talisman_ours', 'carte_geralt', 'totem_poche_casse', 'repulsif'])

SEGMENTS = {
    # Écran titre (sans sauvegarde) -> Nouvelle partie -> prologue -> bosquet.
    'titre': dict(scene='TitleScene', flags={}, next='BosquetScene', fight=False, phases=['title']),
    'bosquet': dict(scene='BosquetScene', flags={}, next='ForetSombre1Scene', fight=True, phases=[
        [{'walk': 1800}, {'wait': 600}, {'walk': 1890, 'tol': 8}, {'face': 'right'}, {'attack': 3},
         {'walk': 2010, 'tol': 8}, {'face': 'right'}, {'attack': 3}, {'walk': 2130, 'tol': 8}, {'face': 'right'}, {'attack': 3},
         {'waitFor': "sc.__acte1 && sc.__acte1.creature", 'timeout': 30000}],
        'kill_creature',
        [{'waitFor': "storyGet('aideFaite')", 'timeout': 20000}, {'walk': 2770}, {'press': 'KeyE', 'after': 800},
         {'waitFor': "storyGet('talismanOurs')", 'timeout': 30000}, {'walk': 3190, 'tol': 14, 'timeout': 300000},
         {'waitFor': "storyGet('banished')", 'timeout': 300000}, {'wait': 800}, {'walk': 3800, 'timeout': 40000}],
    ]),
    'fs1': dict(scene='ForetSombre1Scene', flags=dict(BASE1), next='ForetSombre2Scene', fight=True, phases=[
        [{'walk': 2650, 'timeout': 80000}, {'waitFor': "p.unlockedSkills.has('ours')", 'timeout': 20000},
         {'walk': 2680, 'tol': 10}, {'face': 'right'}, {'skill': 'KeyA', 'after': 2500},
         {'waitFor': "storyGet('moss_foret_sombre_1_amas_racines')", 'timeout': 8000},
         {'walk': 3700, 'timeout': 40000}, {'leave': 1, 'timeout': 20000}],
    ]),
    'fs2': dict(scene='ForetSombre2Scene', flags=dict(FS2), next='GrandArbreRacinesScene', fight=True, phases=[
        [{'walk': 880}, {'press': 'KeyE', 'after': 3500}, {'waitFor': "storyGet('hasWolfForm')", 'timeout': 5000},
         {'walk': 1150}, {'jumpAt': 1250, 'to': 1700, 'sprint': True, 'hold': 160},
         {'walk': 2700, 'timeout': 40000},
         {'jumpAt': 2800, 'to': 3060, 'sprint': True, 'hold': 160}, {'jumpAt': 3120, 'to': 3330, 'sprint': True, 'hold': 160},
         {'jumpAt': 3380, 'to': 3460, 'sprint': True},
         {'walk': 3800, 'timeout': 40000}, {'walk': 5300, 'timeout': 60000}, {'leave': 1, 'timeout': 30000}],
    ]),
    'racines': dict(scene='GrandArbreRacinesScene', flags=dict(RAC), next='GrandArbreAreneScene', fight=True, phases=[
        [{'walk': 1360, 'timeout': 60000}, {'hop': [1408, 1536, 320]}, {'hop': [1280, 1344, 256], 'edge': 90},
         {'hop': [900, 1280, 192]}, {'walk': 1240}, {'hop': [1344, 1728, 64]}, {'walk': 1700},
         {'hop': [1856, 2048, -64]}, {'walk': 2020}, {'hop': [2176, 2944, -192]}, {'walk': 2860, 'tol': 40, 'timeout': 60000},
         {'waitFor': "storyGet('hasMonkeyForm') || (window.__eTap = (window.__eTap || 0) + 1, window.__eTap % 40 === 1 && PathBot.pressE(), false)", 'timeout': 20000},
         {'wait': 4000}, {'walk': 2900, 'tol': 8}, {'wait': 800}],
        ('vine', [{'vine': 2, 'r': 170}, {'vine': 3, 'r': 170}, {'ledge': [3584, 3840, -192]}]),
        [{'leave': 1, 'timeout': 15000}],
    ]),
    'arene': dict(scene='GrandArbreAreneScene', flags=dict(RAC, hasMonkeyForm=True, airForm='monkey', equippedForms=['wolf', 'monkey', None], totemSingeActif=True, kainatiIntroSeen=True),
                  next='ForetFlottante1Scene', fight=False, data={'enterId': 'from_racines'}, phases=[
        'fight_kainati',
        [{'waitFor': "storyGet('kainatiDefeated') && !window.__game.scene.isActive('DialogueScene') && !sc.__cutsceneLock", 'timeout': 120000}, {'wait': 1500},
         {'walk': 1700, 'timeout': 40000}, {'leave': 1, 'timeout': 15000}],
    ]),
    'ff1': dict(scene='ForetFlottante1Scene', flags=dict(FF1), next='ForetFlottante2Scene', fight=False, phases=[
        'duel',
        [{'waitFor': "storyGet('geraltMet') && !window.__game.scene.isActive('DialogueScene') && !sc.__cutsceneLock", 'timeout': 90000}, {'wait': 1500}],
        ('vine', [{'walk': 1880}] + [{'ledge': p} for p in [[1920, 2112, 256], [2240, 2432, 128], [2560, 2752, -64], [2880, 3072, -192], [2560, 2752, -320],
                                         [2240, 2432, -448], [2560, 2752, -640], [2880, 3072, -768], [3200, 3584, -896]]]),
        [{'leave': 1, 'timeout': 40000}],
    ]),
    'ff2': dict(scene='ForetFlottante2Scene', flags=dict(FF2), next='ClairierePlanteScene', fight=True, phases=[
        [{'hop': [512, 704, 384]}, {'hop': [768, 960, 256]}, {'hop': [1088, 1408, 320]}, {'walk': 1216, 'tol': 10},
         {'press': 'KeyE', 'after': 2500}, {'walk': 1400}, {'hop': [1536, 2176, 384]}, {'walk': 1800, 'timeout': 60000},
         {'waitFor': "storyGet('amaniteMet')", 'timeout': 60000}, {'wait': 1500}, {'walk': 2150, 'timeout': 30000},
         {'hop': [2240, 2496, 192], 'second': True}, {'walk': 2400, 'tol': 10}, {'press': 'KeyE', 'after': 3500},
         {'waitFor': "storyGet('hasEagleForm')", 'timeout': 5000}, {'walk': 2470},
         # 2026-11-09 : T2 deux cases plus loin et une rangée plus haut (x 3008, y 128).
         {'jumpAt': 2480, 'to': 3070, 'second': True, 'secondDelay': 420, 'timeout': 15000},
         # T2 collée à T3 (marche descendante) : on la traverse sans s'arrêter sous le corbeau.
         {'walk': 3340, 'timeout': 30000}, {'waitFor': "storyGet('trig_foret_flottante_2_envol')", 'timeout': 20000}, {'wait': 1200},
         # Envol depuis T3 : on plane jusqu'à l'île du bord droit, puis on sort à pied.
         {'jumpAt': 3440, 'to': 4030, 'second': True, 'secondDelay': 420, 'timeout': 20000},
         {'leave': 1, 'timeout': 15000}],
    ]),
    'clairiere': dict(scene='ClairierePlanteScene', flags=dict(CLA), next='HutteMorgatScene', fight=True, data={'enterId': 'from_ff2'}, phases=[
        [{'waitFor': 'p.body.blocked.down', 'timeout': 20000}, {'wait': 1000}, {'walk': 1180, 'timeout': 30000}, {'press': 'KeyE', 'after': 1500},
         {'waitFor': "storyGet('fleurPrelevee') && !window.__game.scene.isActive('DialogueScene')", 'timeout': 60000}, {'wait': 800},
         {'walk': 2100, 'timeout': 40000}, {'leave': 1, 'timeout': 15000}],
    ]),
    'hutte': dict(scene='HutteMorgatScene', flags=dict(HUT), next='ForetCorrompue1Scene', fight=False, data={'enterId': 'from_clairiere'}, phases=[
        [{'walk': 1110, 'timeout': 40000}, {'press': 'KeyE', 'after': 1500},
         {'waitFor': "storyGet('morgatVue') && !window.__game.scene.isActive('DialogueScene')", 'timeout': 90000}, {'wait': 800},
         {'walk': 2640, 'timeout': 40000}, {'waitFor': "storyGet('crashDone')", 'timeout': 60000}],
    ]),
    'fc1': dict(scene='ForetCorrompue1Scene', flags=dict(FC1), next='AreneGhiltScene', fight=True, data={'enterId': 'from_crash'}, phases=[
        [{'waitFor': "storyGet('fc1Reveil') && !window.__game.scene.isActive('DialogueScene')", 'timeout': 60000},
         {'walk': 1712, 'tol': 22, 'timeout': 60000}, {'face': 'right'}, {'js': 'p.energy = p.maxEnergy;'}, {'skill': 'KeyA', 'after': 2500},
         {'waitFor': "storyGet('moss_foret_corrompue_1_amas_galerie')", 'timeout': 8000},
         {'walk': 3075, 'tol': 20, 'timeout': 60000}, {'press': 'KeyE', 'after': 3000},
         {'waitFor': "storyGet('mosswall_foret_corrompue_1_mur_coeur')", 'timeout': 8000},
         {'walk': 4000, 'timeout': 60000}, {'leave': 1, 'timeout': 15000}],
    ]),
    'ghilt1': dict(scene='AreneGhiltScene', flags=dict(FC1, fc1Reveil=True, fc1MousseFermee=True), next='TrouSombreScene', fight=False,
                   data={'enterId': 'from_foret_corrompue'}, phases=['fight_ghilt']),
    'trou': dict(scene='TrouSombreScene', flags=dict(FC1, ghiltPhase=2, ghiltHpPhase2=12, ghiltIntroVu=True), next='AreneGhiltScene', fight=False,
                 data={'enterId': 'from_arene'}, phases=[
        [{'waitFor': 'sc.__exits && sc.__exits.length > 0', 'timeout': 120000}, {'wait': 800},
         {'hop': [448, 640, 320]}, {'hop': [704, 896, 192]}, {'hop': [1024, 1344, 64]}, {'leave': 1, 'timeout': 20000}],
    ]),
    'ghilt2': dict(scene='AreneGhiltScene', flags=dict(FC1, ghiltPhase=2, ghiltHpPhase2=12, ghiltIntroVu=True, trouSombreFait=True,
                   unlockedSkills=['ours', 'papillon'], skillSlots=['ours', 'papillon', None], hasButterflyForm=True,
                   inventory=['talisman_ours', 'carte_geralt', 'repulsif', 'totem_poche_actif']),
                   next='BosquetRetourScene', fight=False, data={'enterId': 'from_trou'}, phases=['fight_ghilt']),
    'retour': dict(scene='BosquetRetourScene', flags=dict(FC1, ghiltHealed=True), next='EndScreenScene', fight=False,
                   data={'enterId': 'from_arene'}, phases=[[{'waitFor': "storyGet('demoFinished')", 'timeout': 240000}]]),
}


def fight_kainati(g, react=300, timeout=420):
    """Combat complet joué au clavier (HumanBot du lot Joueur : réflexe humain)."""
    g.js(open(os.path.join(HERE, 'kain', 'humanbot.js'), encoding='utf-8').read())
    g.js("(r) => window.FightBot.start({ noClimb: true, react: r })", react)
    t0 = time.time()
    while time.time() - t0 < timeout:
        time.sleep(0.5)
        done = g.js("() => !!storyGet('kainatiDefeated')")
        if done:
            g.js("() => { try { window.FightBot.stop && window.FightBot.stop(); } catch (e) {} return true; }")
            return True
    return False


def fight_ghilt(g, timeout=420):
    """Ghil't : s'approcher et frapper (K) ; affaibli en phase 2 -> nuée de
    papillons (F/R). Assistance de test : cœurs remis au maximum (le combat se
    joue au clavier, seule la survie est aidée)."""
    g.page.add_script_tag(content=PATHBOT)
    t0 = time.time()
    while time.time() - t0 < timeout:
        st = g.js("""() => { const sc = window.__drv.levelScene(); if (!sc || !sc.player) return { scene: null };
            const p = sc.player; if (p.hearts < p.maxHearts - 1) { p.hearts = p.maxHearts; sc.registry.set('hearts', p.hearts); }
            const dl = window.__game.scene.getScene('DialogueScene');
            const gh = sc.__ghilt && sc.__ghilt.boss;
            return { scene: sc.scene.key, bx: gh && gh.active ? Math.round(gh.x) : null, state: gh ? gh.state : null, hp: gh ? gh.hp : null,
              px: Math.round(p.x), lock: !!sc.__cutsceneLock, healed: !!storyGet('ghiltHealed'), bot: !PathBot.state || PathBot.state.done,
              energy: Math.round(p.energy), dlg: window.__game.scene.isActive('DialogueScene') ? [dl.index, dl.typing, dl.finished] : null }; }""")
        if g.js("() => window.__game.scene.isActive('DialogueScene')"):
            g.js("() => { window.__drv.key('keydown', 'KeyE'); setTimeout(() => window.__drv.key('keyup', 'KeyE'), 60); return true; }")
        it = locals().get('it', 0) + 1
        if it % 25 == 1:
            print('     ghilt', round(time.time() - t0), st, flush=True)
        if st['scene'] != 'AreneGhiltScene' or st['healed']:
            print('   fin du combat', st, flush=True)
            return True
        if st['bx'] is not None and st['bot'] and not st['lock']:
            side = -1 if st['px'] < st['bx'] else 1
            face = 'right' if side < 0 else 'left'
            if st['state'] == 'weakened':
                g.js(f"() => {{ p = window.__drv.levelScene().player; p.energy = p.maxEnergy; PathBot.start([{{walk: {st['bx'] + side * 120}, tol: 30, timeout: 2000}}, {{face: '{face}'}}, {{skill: 'KeyF', after: 900}}, {{skill: 'KeyR', after: 900}}]); return true; }}")
            else:
                g.js(f"() => {{ PathBot.start([{{walk: {st['bx'] + side * 150}, tol: 40, timeout: 1500}}, {{face: '{face}'}}, {{attack: 3, every: 330}}]); return true; }}")
        time.sleep(0.4)
    return False


def set_state(g, flags):
    g.js("""(f) => { const reg = window.__game.registry; for (const [k, v] of Object.entries(f)) reg.set(k, v); return true; }""", flags)


def run_pathbot(g, steps, fight, timeout=600):
    g.page.add_script_tag(content=PATHBOT)
    g.js("([s, f]) => { PathBot.autoFight = f; PathBot.start(s); return true; }", [steps, fight])
    t0 = time.time()
    while time.time() - t0 < timeout:
        st = g.js("() => PathBot.state && { done: PathBot.state.done, ok: PathBot.state.ok, k: PathBot.state.k, log: PathBot.state.log.slice(-3) }")
        if st and st['done']:
            return st
        time.sleep(0.5)
    g.js("() => PathBot.stop()")
    return {'done': False, 'ok': False, 'k': None, 'log': ['timeout python']}


def kill_creature(g):
    """Bosquet : la créature sort de l'amas ; on la frappe jusqu'à ce qu'elle tombe."""
    for _ in range(60):
        info = g.js("() => { const sc = window.__drv.levelScene(); const c = sc.__acte1 && sc.__acte1.creature; return c ? { x: c.x, dead: !!(c.defeated || !c.active) } : null; }")
        if not info or info['dead']:
            return True
        g.page.add_script_tag(content=PATHBOT)
        g.js("(x) => { PathBot.autoFight = true; PathBot.fightRange = 120; PathBot.start([{walk: x - 70, tol: 30, timeout: 2500}, {face: 'right'}, {attack: 2}]); return true; }", info['x'])
        time.sleep(1.5)
    return False


def duel(g):
    """FF1 : duel de Geralt au clavier (DuelBot : esquive + frappe)."""
    g.page.add_script_tag(content=PATHBOT)
    g.js("() => { PathBot.autoFight = false; PathBot.start([{walk: 960, timeout: 20000}]); return true; }")
    t1 = time.time()
    while time.time() - t1 < 12 and not g.js("() => { const sc = window.__drv.levelScene(); return sc.player.x > 935 || window.__game.scene.isActive('DialogueScene'); }"):
        time.sleep(0.2)
    g.page.add_script_tag(content=open(os.path.join(HERE, 'duelbot.js'), encoding='utf-8').read())
    g.js("""() => { PathBot.stop(); const st = {}; const t0 = performance.now();
        window.__duelT = setInterval(() => { const sc = window.__drv.levelScene(); if (sc && sc.player) window.DuelBot.step(sc, sc.player, performance.now() - t0, window.__drv.key, st); }, 16);
        window.__duelSt = st; return true; }""")
    t0 = time.time()
    while time.time() - t0 < 240:
        if g.js("() => { const sc = window.__drv.levelScene(); return !!storyGet('geraltMet') && !(sc.__a2 && sc.__a2.duel && sc.__a2.duel.active); }"):
            g.js("() => { clearInterval(window.__duelT); return true; }")
            return True
        time.sleep(0.5)
    g.js("() => { clearInterval(window.__duelT); return true; }")
    print('   duel état', g.js("() => { const sc = window.__drv.levelScene(); const d = sc.__a2 && sc.__a2.duel; return { hits: d && d.hits, st: d && d.G && d.G.state, px: Math.round(sc.player.x), h: sc.player.hearts, log: (window.__duelSt.log || []).slice(-8) }; }"), flush=True)
    return False


def run_segment(g, name):
    seg = SEGMENTS[name]
    t0 = time.time()
    flags = dict(seg['flags'])
    # État propre : le registre survit d'une scène à l'autre (segments précédents).
    g.js("() => { try { if (window.PathBot) PathBot.stop(); } catch (e) {} window.__game.registry.reset(); return true; }")
    g.start(seg['scene'], flags=flags, data=seg.get('data'), wait=3.0)
    if os.environ.get('TRACE'):
        g.js("""() => { window.__tr = []; const tick = () => { const sc = window.__drv.levelScene(); if (sc && sc.player) window.__tr.push([Math.round(performance.now()/100)/10, Math.round(sc.player.x), Math.round(sc.player.y), sc.player.hearts, sc.scene.key.slice(0, 6)]); }; setInterval(tick, 700); return true; }""")
    for ph in seg['phases']:
        if ph == 'kill_creature':
            ok = kill_creature(g)
            print('   créature vaincue' if ok else '   créature TOUJOURS LÀ', flush=True)
        elif ph == 'title':
            for i in range(60):
                keys = g.js("() => window.__game.scene.getScenes(true).map((s) => s.scene.key)")
                if 'BosquetScene' in keys:
                    break
                g.js("() => { window.__drv.key('keydown', 'Enter'); setTimeout(() => window.__drv.key('keyup', 'Enter'), 80); return true; }")
                time.sleep(0.8)
            print('   titre -> prologue -> bosquet en', i, 'appuis', flush=True)
        elif ph == 'fight_ghilt':
            ok = fight_ghilt(g)
            print('   combat de Ghil\'t fini' if ok else '   combat de Ghil\'t NON fini', flush=True)
        elif ph == 'fight_kainati':
            ok = fight_kainati(g)
            print('   combat de Kainati fini' if ok else '   combat de Kainati NON fini', flush=True)
        elif ph == 'duel':
            ok = duel(g)
            print('   duel terminé' if ok else '   duel NON terminé', flush=True)
        elif isinstance(ph, tuple) and ph[0] == 'vine':
            g.js("() => { const sc = window.__drv.levelScene(); sc.vines = sc.vines || []; return true; }")
            res = vb.run_route(g, ph[1], start=None, opts={'jitterMs': 80, 'autoDialogue': True, 'retry': True, 'stepTimeoutMs': 25000}, timeout_ms=150000)
            print('   VineBot', vb.summary(res, events=False), flush=True)
        else:
            st = run_pathbot(g, ph, seg.get('fight', False))
            print('   PathBot', 'OK' if st.get('ok') else 'ÉCHEC', st.get('k'), st.get('log'), flush=True)
    # Arrivée dans la zone suivante ?
    t1 = time.time()
    scene = None
    while time.time() - t1 < 40:
        keys = g.js("() => window.__game.scene.getScenes(true).map((s) => s.scene.key)")
        scene = seg['next'] if seg['next'] in keys else ','.join(keys)
        if scene == seg['next']:
            break
        time.sleep(0.5)
    g.js("() => { try { if (window.PathBot) PathBot.stop(); } catch (e) {} return true; }")
    hearts = g.js("() => { const sc = window.__drv.levelScene(); return sc && sc.player ? sc.player.hearts : null; }")
    ok = scene == seg['next']
    if os.environ.get('TRACE'):
        print('   trace', g.js("() => window.__tr"))
    print(f"{name}: {'OK' if ok else 'ÉCHEC'} -> {scene} (attendu {seg['next']}), {round(time.time() - t0)} s réels, cœurs {hearts}", flush=True)
    return ok


if __name__ == '__main__':
    names = sys.argv[1:] or ['tout']
    if names == ['tout']:
        names = list(SEGMENTS)
    g = Game(port=int(os.environ.get('PORT', '8901')))
    results = {}
    try:
        for n in names:
            try:
                results[n] = run_segment(g, n)
            except Exception as e:  # noqa: BLE001
                print(n, 'EXCEPTION', e, flush=True)
                results[n] = False
        print('BILAN', results)
        print('erreurs', g.errors)
    finally:
        g.close()
