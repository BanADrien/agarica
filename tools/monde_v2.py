"""Monde V2 : contrôle et dessin de la carte conçue dans docs/production/monde_v2/monde.json.

    python tools/monde_v2.py            # contrôles + carte.png
    python tools/monde_v2.py --texte    # contrôles seulement

Les contrôles servent à prouver la conception avant de construire une seule zone :
- géométrie : pas de zones qui se chevauchent, chaque passage relie deux zones qui se touchent ;
- on peut finir le jeu depuis le bannissement, et atteindre tout ce qui n'attend pas une forme future ;
- capacités obligatoires (sans elles, pas de fin) et prérequis de chacune (ce qui montre l'ordre libre) ;
- verrous VUS avant d'avoir la clé (le principe « Hollow Knight » demandé par l'utilisateur) ;
- deux formes du même emplacement (sol, air) demandées dans une zone : il faut un feu de camp tout près
  pour changer de forme, sinon le joueur est coincé.
Pillow est nécessaire pour la carte (le Python du PC l'a ; ne pas lancer avec -I).
"""
import json
import os
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER = os.path.join(RACINE, 'docs', 'production', 'monde_v2')
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

M = json.load(open(os.path.join(DOSSIER, 'monde.json'), encoding='utf-8'))
ZONES = {z['id']: z for z in M['zones']}
ALIAS = M.get('alias', {})
CAPA = M['capacites']


def satisfait(requiert, acquis):
    """`requiert` : liste d'alternatives, chacune une liste ET. `saut2` = S, A ou H."""
    if not requiert:
        return True
    for alt in requiert:
        ok = True
        for c in alt:
            if c in ALIAS:
                if not any(a in acquis for a in ALIAS[c]):
                    ok = False
            elif c not in acquis:
                ok = False
        if ok:
            return True
    return False


def aretes():
    """Passages orientés : (de, vers, requiert, passage)."""
    out = []
    for p in M['passages']:
        req = p.get('requiert', [[]])
        out.append((p['a'], p['b'], req, p))
        if p.get('sens') != 'a_vers_b':
            out.append((p['b'], p['a'], req, p))
    return out


ARETES = aretes()


def explorer(interdit=frozenset(), depart=None):
    """Point fixe : zones atteignables et capacités obtenues, sans jamais obtenir `interdit`."""
    d = depart or M['depart']
    acquis = set(d['capacites'])
    zones = {d['zone']}
    while True:
        avant = (len(acquis), len(zones))
        for de, vers, req, _ in ARETES:
            if de in zones and vers not in zones and satisfait(req, acquis):
                zones.add(vers)
        for c in M['contenu']:
            don = c.get('donne')
            if c['zone'] in zones and don and don not in interdit and satisfait(c.get('requiert'), acquis):
                acquis.add(don)
        # Zones qui ne s'ouvrent qu'après le prologue (village, hauts) : via `acces_apres_prologue`.
        if (len(acquis), len(zones)) == avant:
            return zones, acquis


def geometrie():
    pb = []
    zs = [z for z in M['zones'] if not z.get('poche')]
    for i, a in enumerate(zs):
        ax, ay, aw, ah = a['rect']
        for b in zs[i + 1:]:
            bx, by, bw, bh = b['rect']
            if ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah:
                pb.append(f"chevauchement : {a['id']} et {b['id']}")
    for p in M['passages']:
        if p.get('poche'):
            continue
        a, b = ZONES[p['a']], ZONES[p['b']]
        if contact(a['rect'], b['rect']) is None:
            pb.append(f"passage {p['a']} -> {p['b']} : les deux zones ne se touchent pas")
    return pb


def contact(r1, r2):
    """Segment commun (x0, y0, x1, y1) de deux rectangles qui se touchent, sinon None."""
    x1, y1, w1, h1 = r1
    x2, y2, w2, h2 = r2
    if x1 + w1 == x2 or x2 + w2 == x1:
        x = x2 if x1 + w1 == x2 else x1
        lo, hi = max(y1, y2), min(y1 + h1, y2 + h2)
        if hi > lo:
            return (x, lo, x, hi)
    if y1 + h1 == y2 or y2 + h2 == y1:
        y = y2 if y1 + h1 == y2 else y1
        lo, hi = max(x1, x2), min(x1 + w1, x2 + w2)
        if hi > lo:
            return (lo, y, hi, y)
    return None


def nom_capa(c):
    if c == 'saut2':
        return 'second saut'
    return CAPA[c]['nom'] if c in CAPA else c


def rapport():
    lignes = []
    geo = geometrie()
    lignes.append('GÉOMÉTRIE : ' + ('ok' if not geo else f'{len(geo)} problème(s)'))
    lignes += ['  - ' + g for g in geo]

    zones, acquis = explorer()
    fin = 'fin' in acquis
    lignes.append(f"FIN ATTEIGNABLE : {'oui' if fin else 'NON'}")
    hors = [z for z in ZONES if z not in zones]
    hors_ok = [z for z in hors if ZONES[z]['role'] == 'secret']
    hors_ko = [z for z in hors if ZONES[z]['role'] != 'secret']
    lignes.append(f"ZONES ATTEIGNABLES : {len(zones)} / {len(ZONES)} ; fermées (formes à venir, normal) : {', '.join(hors_ok) or 'aucune'}")
    if hors_ko:
        lignes.append('  ZONES INATTEIGNABLES (à corriger) : ' + ', '.join(hors_ko))
    rate = [c for c in M['contenu'] if c['zone'] in zones and not satisfait(c.get('requiert'), acquis)]
    rate += [c for c in M['contenu'] if c['zone'] not in zones and ZONES[c['zone']]['role'] != 'secret']
    if rate:
        lignes.append('  CONTENU INATTEIGNABLE : ' + '; '.join(f"{c['zone']} : {c['nom']}" for c in rate))

    # Capacités obligatoires : sans elles, plus de fin.
    donnees = sorted({c['donne'] for c in M['contenu'] if c.get('donne') and c['donne'] in CAPA})
    # Ce que le prologue donne (ours brun) est obligatoire par construction : il est déjà acquis au départ.
    prologue = [c for c in donnees if c in M['depart']['capacites']]
    oblig = prologue + [c for c in donnees if c not in prologue and 'fin' not in explorer(frozenset({c}))[1]]
    facult = [c for c in donnees if c not in oblig]
    lignes.append('OBLIGATOIRES : ' + ', '.join(nom_capa(c) + (' (prologue)' if c in prologue else '') for c in oblig))
    lignes.append('FACULTATIVES : ' + ', '.join(nom_capa(c) for c in facult))

    # Prérequis : X ne s'obtient plus si on interdit Y.
    lignes.append('PRÉREQUIS (ce qu\'il faut avant de pouvoir obtenir chaque capacité) :')
    objets = donnees + ['plante', 'defaite', 'fin']
    for x in objets:
        pre = [y for y in donnees + ['plante'] if y != x and x not in explorer(frozenset({y}))[1]]
        if x in ('fin',):
            continue
        lignes.append(f"  - {nom_capa(x)} : {', '.join(nom_capa(y) for y in pre) or 'rien'}")

    # Verrous vus avant la clé : passages ou contenus demandant X, dans une zone atteignable sans X.
    lignes.append('VERROUS VUS AVANT D\'AVOIR LA CLÉ :')
    for x in [c for c in CAPA if CAPA[c]['emplacement'] not in ('futur',) and c != 'PANDA']:
        zx, _ = explorer(frozenset({x}))
        vus = set()
        for p in M['passages']:
            if any(x in alt or (x in ALIAS.get('saut2', []) and 'saut2' in alt) for alt in p.get('requiert', [])):
                if p['a'] in zx or (p['b'] in zx and p.get('sens') != 'a_vers_b'):
                    vus.add(p['a'] if p['a'] in zx else p['b'])
        for c in M['contenu']:
            if c['zone'] in zx and any(x in alt or (x in ALIAS.get('saut2', []) and 'saut2' in alt) for alt in (c.get('requiert') or [])):
                vus.add(c['zone'])
        lignes.append(f"  - {nom_capa(x)} : vu dans {len(vus)} zone(s) avant de l'avoir ({', '.join(sorted(vus)) or '—'})")

    # Deux formes du même emplacement demandées dans une même zone : feu de camp tout près ?
    emp = {c: v['emplacement'] for c, v in CAPA.items()}
    feux = {c['zone'] for c in M['contenu'] if c['type'] == 'feu'}
    voisins = {}
    for de, vers, _, _ in ARETES:
        voisins.setdefault(de, set()).add(vers)
    lignes.append('CHANGEMENTS DE FORME (sol / air) :')
    alerte = False
    for zid in ZONES:
        demandes = set()
        for p in M['passages']:
            if zid in (p['a'], p['b']):
                for alt in p.get('requiert', []):
                    if len(p.get('requiert', [])) == 1:
                        demandes |= {c for c in alt if c in emp}
        for c in M['contenu']:
            if c['zone'] == zid and c.get('requiert') and len(c['requiert']) == 1:
                demandes |= {x for x in c['requiert'][0] if x in emp}
        for slot in ('sol', 'air'):
            meme = sorted(c for c in demandes if emp.get(c) == slot)
            if len(meme) > 1:
                pres = zid in feux or bool(voisins.get(zid, set()) & feux)
                alerte |= not pres
                lignes.append(f"  - {zid} demande {' et '.join(nom_capa(c) for c in meme)} : "
                              + ('feu de camp dans la zone ou à côté, ok' if pres else 'AUCUN FEU PROCHE'))
    if not alerte:
        lignes.append('  aucune zone sans feu proche')
    total = sum(z['minutes'] for z in M['zones'] if z['role'] == 'chemin')
    total_f = sum(z['minutes'] for z in M['zones'] if z['role'] == 'facultatif')
    lignes.append(f"DURÉE (premier passage, sans les allers-retours) : chemin {total} min, facultatif {total_f} min")
    return lignes, (not geo and fin and not hors_ko and not rate)


# ---------------------------------------------------------------- dessin
def dessiner(chemin):
    from PIL import Image, ImageDraw, ImageFont
    CW, CH, MG = 96, 58, 40
    xs = [z['rect'][0] for z in M['zones']] + [z['rect'][0] + z['rect'][2] for z in M['zones']]
    ys = [z['rect'][1] for z in M['zones']] + [z['rect'][1] + z['rect'][3] for z in M['zones']]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    LEG = 330
    W, H = (x1 - x0) * CW + 2 * MG, (y1 - y0) * CH + 2 * MG + LEG
    im = Image.new('RGB', (W, H), '#15121f')
    d = ImageDraw.Draw(im)
    F = lambda n, b=False: ImageFont.truetype('C:/Windows/Fonts/' + ('segoeuib.ttf' if b else 'segoeui.ttf'), n)
    SYM = lambda n: ImageFont.truetype('C:/Windows/Fonts/seguisym.ttf', n)
    px = lambda x: MG + (x - x0) * CW
    py = lambda y: MG + (y - y0) * CH

    # grille légère, et la surface (y = 0)
    for gx in range(x0, x1 + 1):
        d.line([(px(gx), py(y0)), (px(gx), py(y1))], fill='#1f1b2d')
    for gy in range(y0, y1 + 1):
        d.line([(px(x0), py(gy)), (px(x1), py(gy))], fill='#1f1b2d')
    d.line([(px(x0), py(0)), (px(x1), py(0))], fill='#3b3354', width=2)
    d.text((px(x0) + 4, py(0) - 18), 'surface de la forêt', font=F(13), fill='#6d6390')

    def eclaircir(h, k):
        r, g, b = int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)
        return tuple(int(c + (255 - c) * k) if k > 0 else int(c * (1 + k)) for c in (r, g, b))

    def tirets(p0, p1, coul, w=2, pas=8):
        import math
        (ax, ay), (bx, by) = p0, p1
        L = math.hypot(bx - ax, by - ay)
        n = max(1, int(L // pas))
        for i in range(0, n, 2):
            t0, t1 = i / n, min(1, (i + 1) / n)
            d.line([(ax + (bx - ax) * t0, ay + (by - ay) * t0), (ax + (bx - ax) * t1, ay + (by - ay) * t1)], fill=coul, width=w)

    ICONES = {  # type -> (symbole, couleur)
        'forme': ('★', '#ffd84a'), 'competence': ('◆', '#ff9be6'), 'coeur': ('♥', '#ff5a6a'),
        'papillon': ('ϒ', '#f3a8ff'), 'feu': ('▲', '#ff9a3c'), 'boss': ('☠', '#ffffff'),
        'carte': ('✉', '#9fe3ff'), 'objet': ('●', '#b6ff8a'), 'coffre': ('■', '#d9b36b'),
        'futur': ('?', '#cfcfcf'), 'pnj': None, 'histoire': None,
    }

    for z in M['zones']:
        x, y, w, h = z['rect']
        reg = M['regions'][z['region']]['couleur']
        box = [px(x) + 3, py(y) + 3, px(x + w) - 3, py(y + h) - 3]
        fond = eclaircir(reg, -0.45) if z['role'] != 'secret' else (52, 52, 58)
        d.rounded_rectangle(box, radius=8, fill=fond)
        bord = eclaircir(reg, 0.15)
        if z['role'] == 'chemin':
            d.rounded_rectangle(box, radius=8, outline=bord, width=4)
        else:
            for (a, b) in [((box[0], box[1]), (box[2], box[1])), ((box[2], box[1]), (box[2], box[3])),
                           ((box[2], box[3]), (box[0], box[3])), ((box[0], box[3]), (box[0], box[1]))]:
                tirets(a, b, bord, 3)
        nom = z['nom']
        f = F(15 if w >= 2 else 12, True)
        # nom sur deux lignes si besoin
        mots, lignes_nom, cur = nom.split(), [], ''
        for m in mots:
            essai = (cur + ' ' + m).strip()
            if d.textlength(essai, font=f) > (box[2] - box[0] - 12) and cur:
                lignes_nom.append(cur)
                cur = m
            else:
                cur = essai
        lignes_nom.append(cur)
        ty = box[1] + 4
        for ln in lignes_nom:
            d.text((box[0] + 7, ty), ln, font=f, fill='#f4eefc')
            ty += f.size + 3
        # icônes du contenu
        ix, iy = box[0] + 7, max(ty + 2, box[1] + 22)
        for c in M['contenu']:
            if c['zone'] != z['id']:
                continue
            ic = ICONES.get(c['type'])
            if not ic:
                continue
            s, coul = ic
            if ix > box[2] - 22:
                ix, iy = box[0] + 7, iy + 20
            d.text((ix, iy), s, font=SYM(17), fill=coul)
            ix += 21
        if z.get('poche'):
            d.text((box[0] + 7, box[3] - 20), '(monde des ancêtres)', font=F(11), fill='#bdb3d6')

    # passages
    LAB = {'SOL': 'ours', 'L': 'loup', 'MUR': 'grizzly', 'S': 'singe', 'A': 'aigle', 'H': 'hibou',
           'O': 'pieuvre', 'G': 'glace', 'T': 'pierre', 'R': 'mousse', 'P': 'papillon', 'saut2': '2e saut',
           'fin': 'fin', 'defaite': 'chute', 'insecte': 'SECRET', 'canide': 'SECRET', 'poisson': 'SECRET', 'felin': 'SECRET'}
    COUL = {'SOL': '#c08a55', 'L': '#7dfcd8', 'MUR': '#e07a3c', 'S': '#a8e07a', 'A': '#fff1c0', 'H': '#d0b48a',
            'O': '#9fe3ff', 'G': '#e8f6ff', 'T': '#c9c4d6', 'R': '#b6ff8a', 'P': '#f3a8ff', 'saut2': '#fff1c0',
            'fin': '#ffffff', 'defaite': '#ff6a6a'}
    deja = {}
    for p in M['passages']:
        a, b = ZONES[p['a']], ZONES[p['b']]
        req = [c for alt in p.get('requiert', [[]]) for c in alt]
        if p.get('poche'):
            ax, ay, aw, ah = a['rect']
            bx, by, bw, bh = b['rect']
            tirets((px(ax + aw / 2), py(ay)), (px(bx + bw / 2), py(by + bh)), '#a8e07a', 2, 10)
            cx, cy = (px(ax + aw / 2) + px(bx + bw / 2)) / 2, (py(ay) + py(by + bh)) / 2
        else:
            sx0, sy0, sx1, sy1 = contact(a['rect'], b['rect'])
            cle = (sx0, sy0, sx1, sy1)
            k = deja.get(cle, 0)
            deja[cle] = k + 1
            # Bord vertical : pastille aux deux tiers de la hauteur, sous le nom de la zone.
            cx, cy = px((sx0 + sx1) / 2), py(sy0 + (sy1 - sy0) * (0.66 if sx0 == sx1 else 0.5))
            if sx0 == sx1:
                cy += k * 22
            else:
                cx += k * 60
        if not req:
            d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill='#f4eefc', outline='#15121f', width=2)
        else:
            texte = ' + '.join(LAB.get(c, c) for c in req)
            coul = COUL.get(req[0], '#cfcfcf')
            if req[0] in ('insecte', 'canide', 'poisson', 'felin'):
                coul = '#cfcfcf'
            f = F(12, True)
            tw = d.textlength(texte, font=f)
            d.rounded_rectangle([cx - tw / 2 - 6, cy - 10, cx + tw / 2 + 6, cy + 10], radius=6, fill='#15121f', outline=coul, width=2)
            d.text((cx - tw / 2, cy - 9), texte, font=f, fill=coul)
        if p.get('sens') == 'a_vers_b':
            # petite flèche vers b
            bxc = px(b['rect'][0] + b['rect'][2] / 2)
            byc = py(b['rect'][1] + b['rect'][3] / 2)
            import math
            ang = math.atan2(byc - cy, bxc - cx)
            ox, oy = cx + math.cos(ang) * 26, cy + math.sin(ang) * 26
            pts = [(ox + math.cos(ang) * 9, oy + math.sin(ang) * 9),
                   (ox + math.cos(ang + 2.5) * 8, oy + math.sin(ang + 2.5) * 8),
                   (ox + math.cos(ang - 2.5) * 8, oy + math.sin(ang - 2.5) * 8)]
            d.polygon(pts, fill='#ffffff')

    # légende
    ly = py(y1) + 20
    d.text((MG, ly), 'Legend of Agarica : monde V2 (proposition du 2026-11-16)', font=F(22, True), fill='#f4eefc')
    ly += 36
    lx = MG
    for rid, r in M['regions'].items():
        d.rounded_rectangle([lx, ly + 3, lx + 18, ly + 19], radius=4, fill=eclaircir(r['couleur'], -0.45), outline=eclaircir(r['couleur'], 0.15), width=3)
        d.text((lx + 24, ly), r['nom'], font=F(14), fill='#e6def5')
        lx += 34 + d.textlength(r['nom'], font=F(14))
    ly += 32
    lx = MG
    for t, nomt in [('forme', 'totem de forme'), ('competence', 'talisman (compétence)'), ('coeur', 'cœur'),
                    ('papillon', 'papillon perdu'), ('feu', 'feu de camp'), ('boss', 'boss'), ('carte', 'morceau de carte'),
                    ('objet', 'objet de l\'histoire'), ('coffre', 'coffre'), ('futur', 'socle d\'une forme à venir')]:
        s, coul = ICONES[t]
        d.text((lx, ly - 2), s, font=SYM(18), fill=coul)
        d.text((lx + 24, ly), nomt, font=F(14), fill='#e6def5')
        lx += 44 + d.textlength(nomt, font=F(14))
    ly += 32
    d.text((MG, ly), 'Cadre plein : chemin de l\'histoire.   Cadre en tirets : facultatif.   Gris : zone cachée fermée par un bloc SECRET.   '
                     'Pastille : ce qu\'il faut pour passer (point blanc : rien).   Flèche : sens unique.   1 case = 1 écran (960 x 576 px).',
           font=F(14), fill='#bdb3d6')
    ly += 30
    lignes, _ = rapport()
    resume = [l for l in lignes if l.startswith(('FIN', 'OBLIG', 'FACULT', 'DURÉE'))]
    for l in resume:
        d.text((MG, ly), l, font=F(14), fill='#9fe3ff')
        ly += 22
    im.save(chemin)
    return chemin


if __name__ == '__main__':
    lignes, ok = rapport()
    print('\n'.join(lignes))
    if '--texte' not in sys.argv:
        print('carte :', dessiner(os.path.join(DOSSIER, 'carte.png')))
    sys.exit(0 if ok else 1)
