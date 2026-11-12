"""Routes du bot pour l'épreuve du singe (données actuelles) : une par section,
départ à la lanterne de la section, + la traversée complète."""
SOL = "(sc.__epreuve ? sc.__epreuve.crumbles.map(k => k.zone.body) : [])"
# Pierres en rythme (S2) : on part juste après la chute du couloir B (le long de la liane).
RHYTHM_JUST_FELL = "(() => { const r = sc.__epreuve.rhythms[0]; const t1 = r.impacts[1]; return t >= t1 && t - t1 < 250; })()"
# Marée (S4) : on part quand elle commence à refluer.
TIDE_RECEDES = "(() => { const td = sc.__epreuve.tides[0]; return td.phase === 3 && td.t > 250; })()"

A = [3264, 3520, 320]
R1 = [3648, 4096, 320]
B = [4224, 4544, -64]
ISLET = [5696, 5824, -64]
C = [7552, 7808, -64]
REBORD = [8640, 8832, 256]
P = [8832, 9216, 384]
D = [9280, 9600, -64]
CRUMBLE = [10880, 11008, 96]
SUMMIT = [11840, 12288, -128]
START = [0, 448, 448]

S1 = [{'vine': i} for i in range(0, 8)] + [{'ledge': A}]
S2 = [{'ledge': R1}, {'walk': 3940}, {'wait': RHYTHM_JUST_FELL}, {'vine': 8}, {'ledge': B}]
S3 = [{'vine': 9}, {'vine': 10}, {'vine': 11}, {'ledge': ISLET}, {'vine': 12}, {'vine': 13}, {'vine': 14}, {'vine': 15}, {'ledge': C}]
S4 = [{'vine': 16}, {'vine': 17}, {'ledge': REBORD}, {'walk': 8800}, {'wait': TIDE_RECEDES}, {'ledge': P}, {'vine': 18}, {'ledge': D}]
S5 = [{'vine': 19}, {'vine': 20}, {'vine': 21}, {'ledge': CRUMBLE}, {'vine': 22}, {'vine': 23}, {'ledge': SUMMIT}]

STARTS = {'S1': (380, 444), 'S2': (3420, 316), 'S3': (4444, -68), 'S4': (7708, -68), 'S5': (9500, -68)}
SECTIONS = {'S1': S1, 'S2': S2, 'S3': S3, 'S4': S4, 'S5': S5}
LANTERNS = {'S1': (400, 448), 'S2': (3420, 320), 'S3': (4444, -64), 'S4': (7708, -64), 'S5': (9500, -64)}
TALISMAN_DONE = "storyGet('talismanSinge') && sc.__epreuveSommet && !isWorldFrozen(sc)"
FULL = []
for name in ('S1', 'S2', 'S3', 'S4', 'S5'):
    FULL += [{'checkpoint': True, 'at': list(LANTERNS[name])}] + SECTIONS[name]
FULL += [{'walk': 12088}, {'press': 'KeyE'}, {'wait': TALISMAN_DONE}]
# Liens (liane -> cible suivante) pour la mesure des fenêtres.
LINKS = []
for sec in (S1, S2, S3, S4, S5):
    for a, b in zip(sec, sec[1:]):
        if 'vine' in a and ('vine' in b or 'ledge' in b):
            LINKS.append((a['vine'], b))
