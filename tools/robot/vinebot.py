"""Helper Python du bot de liane (vinebot.js, documenté en tête de fichier).

    from pilot import Game
    import vinebot as vb
    g = Game(port=8905)
    g.start('EpreuveSingeScene', flags=vb.MONKEY_FLAGS); g.quiet()
    res = vb.run_route(g, route, start=(x, y), opts={'seed': 3, 'jitterMs': 80})
    print(vb.summary(res))
    stats = vb.trials(g, route, start=(x, y), n=5, opts={...})   # n essais, graines 1..n
    vb.windows(g, 3, {'vine': 4})   # fenêtres de lâcher mesurées, sans jouer

route : liste d'étapes ({'vine': i}, {'ledge': [x1, x2, y]}, {'walk': x},
{'wait': 'expr JS (sc, p, t)'}, {'press': 'KeyE'}, {'checkpoint': True}).
"""
import os
import time

from pilot import reset_at

HERE = os.path.dirname(os.path.abspath(__file__))
BOT_JS = os.path.join(HERE, 'vinebot.js')

MONKEY_FLAGS = {
    'hasMonkeyForm': True, 'airForm': 'monkey', 'equippedForms': ['wolf', 'monkey', None],
    'hasWolfForm': True, 'xaraMet': True, 'kainatiDefeated': True, 'mondeSpirituelFini': True,
}


def inject(g):
    """(Ré)injecte vinebot.js dans la page (prend la dernière version du fichier)."""
    with open(BOT_JS, encoding='utf-8') as f:
        g.page.add_script_tag(content=f.read())


def run_route(g, route, start=None, opts=None, timeout_ms=60000, settle=0.35):
    inject(g)
    if start:
        reset_at(g, start[0], start[1], settle=settle)
    return g.page.evaluate("([r, o, tm]) => window.VineBot.run(r, o, tm)", [route, opts or {}, timeout_ms])


def trials(g, route, start, n=5, opts=None, timeout_ms=40000, prep=None):
    """n essais (graines 1..n) ; `prep(g, i)` éventuel avant chaque essai.
    -> (réussites, résultats)."""
    out = []
    for i in range(1, n + 1):
        o = dict(opts or {})
        o.setdefault('seed', i)
        if prep:
            prep(g, i)
        out.append(run_route(g, route, start=start, opts=o, timeout_ms=timeout_ms))
    return sum(1 for r in out if r.get('ok')), out


def windows(g, vine_index, target, opts=None):
    inject(g)
    return g.page.evaluate("([i, t, o]) => window.VineBot.windows(i, t, o)", [vine_index, target, opts or {}])


def summary(res, events=True):
    s = f"ok={res.get('ok')} raison={res.get('reason')} t={res.get('t')}ms étape={res.get('k')} chutes={res.get('falls')}"
    if events:
        lines = [s]
        for e in res.get('events', []):
            if e['type'] in ('release', 'jump', 'jump2', 'fall', 'done', 'plan', 'skip') or e['type'].startswith('plan'):
                lines.append('   ' + str(e))
        return '\n'.join(lines)
    return s
