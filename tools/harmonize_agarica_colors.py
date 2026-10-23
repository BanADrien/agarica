"""Usage : python tools/harmonize_agarica_colors.py [--dry] [--repartir] [--planche] [--debug DIR]

Harmonise les couleurs de TOUTES les images d'Agarica sur une référence unique :
l'idle (assets/sprites/agarica_frames/agarica_row0_*.png), ce que le joueur voit le
plus. Les feuilles viennent de générations Codex différentes : cheveux, cape, peau,
tunique... n'ont ni la même teinte ni la même luminosité d'une animation à l'autre.
Écrit EN PLACE (mêmes noms, même taille, alpha intact). Les originaux sont copiés
une fois dans %TEMP%/couleurs/originaux/ (ils sont aussi dans git).

Méthode (transfert de couleur PAR MATIÈRE, en Lab) :
1. Sur l'idle, chaque pixel opaque est rangé dans une matière par des règles
   Lab simples (cheveux, cape, peau, tunique, cuir, sombre = pantalon + mitaines,
   tatouage rouge, métal/blancs, yeux) ; chaque matière est modélisée par 1 à 3
   gaussiennes (mélange de gaussiennes = « où vit cette matière dans l'espace
   couleur ») + sa plage de teinte et sa chroma maximale. Les contours quasi
   noirs (L < 14) ne sont jamais touchés.
2. Pour chaque feuille (= une génération), le mélange de l'idle est ADAPTÉ (EM,
   moyennes seules, rappel vers l'idle, dérive bornée) : on retrouve où sont
   passés les cheveux, la cape... de cette feuille. Une composante « hors
   modèle » uniforme absorbe ce qui sort des plages (ailes violettes, tentacules,
   verts hyper-saturés) : ces pixels ne bougent pas. L'idle passe lui-même par
   cette adaptation, pour que les deux côtés soient mesurés pareil.
3. Par matière : moyenne et écart-type (L, a, b) dans la feuille et dans l'idle
   -> x' = moy_idle + (x - moy_feuille) * (écart_idle / écart_feuille)
   (rapport borné à 0.9-1.12) : ombres et reflets dessinés gardent leur place.
4. Chaque pixel reçoit la moyenne de ces corrections pondérée par sa probabilité
   d'appartenir à chaque matière : la correction est une fonction LISSE de la
   couleur (pas de frontière dure => pas de taches), atténuée vers les noirs.
   Pas de correction des yeux ni du métal (gris quelconques).

Par image (GROUPES) : `matieres` restreint les matières corrigées, `zones` la
zone (rectangles en fraction de l'image, bords adoucis, ou {'hors': [...]}),
`passes` combine plusieurs (matières, zones). Sert aux transformations (seules
les parties humaines bougent ; frames 100 % animales non listées) et aux VFX
verts qui ont la couleur exacte d'une cape (arc de l'attaque, gants de
l'incantation). Les planches sources (agarica_extra*.png...) reçoivent la même
correction que leurs frames (calculée sur les frames, ce que voit le joueur),
pour qu'un futur import_codex_assets.py redonne les mêmes couleurs ; pour les
planches de transformation, chaque frame est retrouvée dans la planche
(corrélation de l'alpha) et ses zones y sont reportées. agarica_frames
rangées 1-2 (même génération que l'idle) : mesurées, laissées intactes.

Options :
  --dry        n'écrit rien (mesures seules)
  --repartir   relit les ORIGINAUX sauvegardés (relance reproductible ; sans
               cette option, on repart des images en place)
  --planche    écrit docs/production/agarica_couleurs_avant_apres.png
  --debug DIR  par frame : original | matières | amplitude | résultat
  --seul TXT   ne traite que les groupes dont le nom contient TXT
Mesures (dE par matière, avant/après) : %TEMP%/couleurs/mesures.json.
"""
import argparse
import glob
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.cluster.vq import kmeans2

ROOT = Path(__file__).resolve().parents[1]
SAUVEGARDE = Path(os.environ.get('TEMP', '/tmp')) / 'couleurs' / 'originaux'
PLANCHE = ROOT / 'docs' / 'production' / 'agarica_couleurs_avant_apres.png'

SP = 'assets/sprites/'
REF = [f'{SP}agarica_frames/agarica_row0_{i}.png' for i in range(6)]

MATIERES = ['cheveux', 'cape', 'peau', 'tunique', 'cuir', 'sombre', 'tatouage', 'metal', 'yeux']
# Nombre de gaussiennes par matière (les matières larges ont ombre / ton / reflet).
N_COMPOSANTES = {'cheveux': 3, 'cape': 3, 'peau': 2, 'tunique': 2, 'cuir': 2,
                 'sombre': 2, 'tatouage': 1, 'metal': 1, 'yeux': 1}
# Les yeux servent seulement à « capter » les verts vifs (yeux, gemme, VFX) pour
# qu'ils n'aillent pas fausser la cape ; le métal (gris clairs : dague, blancs des
# yeux) capte n'importe quel gris : on ne corrige ni l'un ni l'autre.
NON_CORRIGEES = {'yeux', 'metal'}
FIGEES = {'yeux'}

L_NOIR = (14.0, 24.0)       # contours : aucune correction sous 14, pleine au-dessus de 24
ALPHA_STATS = 200           # pixels comptés dans les statistiques
DERIVE_MAX = 22.0           # dérive max (Lab) d'une gaussienne adaptée vs idle
DELTA_MAX = 32.0            # correction max par pixel (Lab)
MIN_PIXELS = 250            # en dessous, la matière n'est pas mesurée dans ce groupe
# Bornes du rapport des écarts-types (contraste interne d'une matière) : étroites,
# car une matière mal triée (bottes rangées avec les cheveux) serait sinon
# « tassée » vers la moyenne de l'autre matière.
RAPPORT_ECART = (0.9, 1.12)
POIDS_HORS_MODELE = 0.04
DENSITE_HORS_MODELE = 1.0 / (100.0 * 200.0 * 200.0)
INFLATION_COV = 1.5         # tolérance du mélange adapté (les feuilles sont plus variées)
RAPPEL = 40.0               # poids (en pixels) du rappel des moyennes vers l'idle
MARGE_TEINTE = 12.0         # degrés ajoutés à la plage de teinte de chaque matière
# La cape de l'idle est d'un vert très étroit (122-127°) alors que d'autres feuilles
# ont un revers vert-bleu (jusqu'à 170° dans extra p4) : marge large, qui écarte
# encore les violets (ailes ~290°) et les bleus (tentacules ~250°).
MARGE_TEINTE_MATIERE = {'cape': 45.0}
# Plancher de chroma : la cape de l'idle n'est jamais grise (chroma >= 16) ; sans
# plancher, une gaussienne de cape peut dériver vers la fourrure grise du loup
# (chroma ~5-7, teinte alors sans effet) et la verdir.
CHROMA_MIN = {'cape': 12.0}
MARGE_CHROMA = 12.0         # chroma ajoutée au 99e centile de chaque matière


# --------------------------------------------------------------------------- couleur
_M = np.array([[0.4124564, 0.3575761, 0.1804375],
               [0.2126729, 0.7151522, 0.0721750],
               [0.0193339, 0.1191920, 0.9503041]])
_MI = np.linalg.inv(_M)
_W = np.array([0.95047, 1.0, 1.08883])
_D = 6 / 29


def rgb_vers_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    xyz = (c @ _M.T) / _W
    f = np.where(xyz > _D ** 3, np.cbrt(xyz), xyz / (3 * _D * _D) + 4 / 29)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]),
                     200 * (f[..., 1] - f[..., 2])], -1)


def lab_vers_rgb(lab):
    fy = (lab[..., 0] + 16) / 116
    f = np.stack([fy + lab[..., 1] / 500, fy, fy - lab[..., 2] / 200], -1)
    xyz = np.where(f > _D, f ** 3, 3 * _D * _D * (f - 4 / 29)) * _W
    c = np.clip(xyz @ _MI.T, 0, 1)
    c = np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)
    return c * 255.0


def lissage(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------- matières (règles, idle seulement)
def regles_matieres(lab):
    """Matière de chaque pixel de l'IDLE (-1 = ignoré). Seuils lus sur l'idle :
    cheveux Lab~(50,31,37), cuir ~(41,22,30), tunique ~(67,8,22), peau ~(86,9,25),
    cape ~(43,-20,28), pantalon ~(26,2,8), tatouage rouge (teinte < 38°)."""
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    h = np.degrees(np.arctan2(b, a)) % 360
    m = np.full(L.shape, -1)
    neutre = C < 13
    m[neutre & (L < 38)] = MATIERES.index('sombre')
    m[neutre & (L >= 38)] = MATIERES.index('metal')
    vert = ~neutre & (h >= 95) & (h < 170)
    cape = vert & (L < 52) & (C < 48)
    m[cape] = MATIERES.index('cape')
    m[vert & ~cape] = MATIERES.index('yeux')
    chaud = ~neutre & ((h < 95) | (h >= 340))
    rouge = chaud & ((h < 38) | (h >= 340)) & (C > 35)
    m[rouge] = MATIERES.index('tatouage')
    reste = chaud & ~rouge
    m[reste & (L >= 75)] = MATIERES.index('peau')
    tun = reste & (L < 75) & (L >= 38) & (C < 26)
    m[tun] = MATIERES.index('tunique')
    chev = reste & (L < 75) & ~tun & ((C >= 40) | ((C >= 30) & (L >= 45)))
    m[chev] = MATIERES.index('cheveux')
    m[reste & (L < 75) & ~tun & ~chev] = MATIERES.index('cuir')
    m[L < L_NOIR[0]] = -1
    return m


# --------------------------------------------------------------------------- mélange de gaussiennes
def teinte_chroma(x):
    return np.degrees(np.arctan2(x[:, 2], x[:, 1])) % 360, np.hypot(x[:, 1], x[:, 2])


def plage_couleur(x, neutre, marge=MARGE_TEINTE):
    """Plage d'une matière de l'idle : (centre, demi-largeur) de teinte en degrés
    (None pour les matières neutres, dont la teinte ne veut rien dire) et chroma
    maximale. Le plafond de chroma écarte les verts hyper-saturés des VFX (arc
    de l'attaque, lueur de l'incantation) que la cape capterait sinon."""
    h, c = teinte_chroma(x)
    cmax = float(np.percentile(c, 99)) + MARGE_CHROMA
    h = h[c > 10]
    if neutre or len(h) < 50:
        return None, None, cmax
    r = np.radians(h)
    centre = np.degrees(np.arctan2(np.sin(r).mean(), np.cos(r).mean())) % 360
    ecart = np.abs((h - centre + 180) % 360 - 180)
    return centre, float(np.percentile(ecart, 97.5)) + marge, cmax


class Melange:
    """Mélange de gaussiennes en Lab ; chaque composante appartient à une matière.
    `teinte[k]` = plage de teinte de sa matière : hors plage, la vraisemblance
    chute (ailes violettes, tentacules bleus ne peuvent pas devenir « cape »),
    sauf pour les couleurs presque grises dont la teinte ne veut rien dire."""

    def __init__(self, moy, cov, poids, matiere, teinte):
        self.moy, self.cov, self.poids, self.matiere = moy, cov, poids, np.asarray(matiere)
        self.teinte = teinte

    def copie(self):
        return Melange(self.moy.copy(), self.cov.copy(), self.poids.copy(), self.matiere.copy(), self.teinte)

    def log_dens(self, x):
        out = np.empty((len(x), len(self.moy) + 1))
        h, c = teinte_chroma(x)
        t_chroma = lissage(c, 6.0, 14.0)
        for k in range(len(self.moy)):
            ch = np.linalg.cholesky(self.cov[k])
            z = (x - self.moy[k]) @ np.linalg.inv(ch).T
            out[:, k] = (np.log(self.poids[k]) - np.log(np.diag(ch)).sum() - 1.5 * np.log(2 * np.pi)
                         - 0.5 * np.einsum('ij,ij->i', z, z))
            centre, demi, cmax = self.teinte[k]
            if centre is not None:
                hors = np.maximum(0, np.abs((h - centre + 180) % 360 - 180) - demi)
                out[:, k] -= t_chroma * 0.5 * (hors / 8.0) ** 2
            out[:, k] -= 0.5 * (np.maximum(0, c - cmax) / 6.0) ** 2
            cmin = CHROMA_MIN.get(MATIERES[self.matiere[k]])
            if cmin:
                out[:, k] -= 0.5 * (np.maximum(0, cmin - c) / 1.5) ** 2
        out[:, -1] = np.log(POIDS_HORS_MODELE * DENSITE_HORS_MODELE)
        return out

    def posteriors(self, x, bloc=200000):
        """Probabilités par composante (+ dernière colonne = hors modèle)."""
        res = []
        for i in range(0, len(x), bloc):
            ld = self.log_dens(x[i:i + bloc])
            ld -= ld.max(1, keepdims=True)
            p = np.exp(ld)
            res.append(p / p.sum(1, keepdims=True))
        return np.concatenate(res) if res else np.zeros((0, len(self.moy) + 1))

    def par_matiere(self, post):
        """(N, nb matières) : somme des composantes de chaque matière."""
        out = np.zeros((len(post), len(MATIERES)))
        for k, m in enumerate(self.matiere):
            out[:, m] += post[:, k]
        return out


def em_matiere(x, k, iters=25):
    """Petit EM à covariance pleine pour UNE matière de l'idle."""
    if len(x) > 60000:
        x = x[np.random.RandomState(0).choice(len(x), 60000, replace=False)]
    if k == 1:
        return x.mean(0)[None], np.cov(x.T)[None] + np.eye(3), np.ones(1)
    moy, lbl = kmeans2(x, k, minit='++', seed=7, iter=30)
    cov = np.array([np.cov(x[lbl == j].T) + np.eye(3) if (lbl == j).sum() > 5 else np.eye(3) * 25
                    for j in range(k)])
    w = np.array([(lbl == j).mean() + 1e-3 for j in range(k)])
    for _ in range(iters):
        ld = np.stack([np.log(w[j]) - 0.5 * np.einsum('ni,ij,nj->n', x - moy[j], np.linalg.inv(cov[j]), x - moy[j])
                       - 0.5 * np.log(np.linalg.det(cov[j])) for j in range(k)], 1)
        ld -= ld.max(1, keepdims=True)
        r = np.exp(ld)
        r /= r.sum(1, keepdims=True)
        n = r.sum(0) + 1e-6
        moy = (r.T @ x) / n[:, None]
        cov = np.array([((r[:, j, None] * (x - moy[j])).T @ (x - moy[j])) / n[j] + np.eye(3) for j in range(k)])
        w = n / n.sum()
    return moy, cov, w


def _rects(shape, rects, flou):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    out = np.zeros((h, w))
    for x0, y0, x1, y1 in rects:
        dx = np.minimum(xx - x0 * w, x1 * w - xx)
        dy = np.minimum(yy - y0 * h, y1 * h - yy)
        out = np.maximum(out, np.clip(np.minimum(dx, dy) / flou + 0.5, 0, 1))
    return out


def masque_zones(shape, zones, flou=12):
    """Rectangles (fractions x0, y0, x1, y1 de l'image) aux bords adoucis ;
    zones=None => toute l'image ; {'hors': [...]} => toute l'image SAUF ces
    rectangles (lueurs vertes des gants, de la couleur exacte d'une cape)."""
    h, w = shape
    if zones is None:
        return np.ones((h, w))
    if isinstance(zones, dict):
        dans = np.ones((h, w)) if zones.get('dans') is None else _rects(shape, zones['dans'], flou)
        return dans * (1 - _rects(shape, zones.get('hors', []), 3))
    return _rects(shape, zones, flou)


def passes_de(opts):
    """Passes d'une image : [(matières ou None = toutes, zones ou None = partout)].
    Plusieurs passes = matières différentes selon la zone (ex. cheveux sur la tête
    seulement, cape et tunique sur le corps, jamais la fourrure)."""
    if 'passes' in opts:
        return opts['passes']
    return [(opts.get('matieres'), opts.get('zones'))]


def collecte(arr, opts):
    """Pixels Lab d'une image comptés dans les statistiques, et pour chacun le
    poids d'autorisation de chaque matière (zone de la passe qui la corrige)."""
    ok = arr[..., 3] >= ALPHA_STATS
    lab = rgb_vers_lab(arr[..., :3][ok].astype(float))
    autorise = np.zeros((len(lab), len(MATIERES)))
    for mats, zones in passes_de(opts):
        z = masque_zones(arr.shape[:2], zones)[ok]
        for n in (MATIERES if mats is None else mats):
            i = MATIERES.index(n)
            autorise[:, i] = np.maximum(autorise[:, i], z)
    garde = (lab[:, 0] >= L_NOIR[0]) & (autorise.max(1) > 0.5)
    return lab[garde], autorise[garde]


def echantillon(x, n, graine=1):
    """Sous-échantillon aléatoire fixe (les statistiques n'ont pas besoin de tout)."""
    if len(x) <= n:
        return np.arange(len(x))
    return np.random.RandomState(graine).choice(len(x), n, replace=False)


def modele_reference():
    x = np.concatenate([collecte(charge(p), {})[0] for p in REF])
    regle = regles_matieres(x)
    moy, cov, poids, mat, teinte = [], [], [], [], []
    for mi, nom in enumerate(MATIERES):
        xm = x[regle == mi]
        if len(xm) < 20:
            continue
        k = min(N_COMPOSANTES[nom], max(1, len(xm) // 400))
        mo, co, w = em_matiere(xm, k)
        pl = plage_couleur(xm, nom in ('sombre', 'metal'), MARGE_TEINTE_MATIERE.get(nom, MARGE_TEINTE))
        moy += list(mo)
        cov += list(co)
        poids += list(w * len(xm) / len(x))
        mat += [mi] * len(mo)
        teinte += [pl] * len(mo)
    mel = Melange(np.array(moy), np.array(cov), np.array(poids) / sum(poids), mat, teinte)
    return mel, x


def adapte(ref, x, autorise=None, iters=20):
    """EM sur les pixels d'une feuille, initialisé par l'idle : moyennes et poids
    seuls (covariances de l'idle élargies), rappel vers l'idle, dérive bornée
    (une gaussienne ne peut pas « partir » vers une autre matière). Un pixel ne
    déplace une gaussienne que si sa matière est autorisée à cet endroit (la
    fourrure d'ours, couleur cheveux, ne tire pas la gaussienne des cheveux).
    `mel.n` = nombre de pixels (autorisés) vus par chaque gaussienne."""
    mel = ref.copie()
    mel.cov = ref.cov * INFLATION_COV
    # Les « yeux » (verts vifs) restent où l'idle les a mis : libres, ils iraient
    # capter la cape émeraude d'une feuille, qui ne serait alors plus corrigée.
    fige = np.isin(ref.matiere, [MATIERES.index(m) for m in FIGEES])
    idx = echantillon(x, 50000)
    echelle = len(x) / max(1, len(idx))
    x = x[idx]
    au = autorise[idx][:, ref.matiere] if autorise is not None else 1.0
    for _ in range(iters):
        post = mel.posteriors(x)[:, :-1]
        n_tous = post.sum(0)
        post = post * au
        n = post.sum(0)
        moy = (post.T @ x + RAPPEL * ref.moy) / (n + RAPPEL)[:, None]
        d = moy - ref.moy
        nd = np.linalg.norm(d, axis=1, keepdims=True)
        mel.moy = ref.moy + d * np.minimum(1, DERIVE_MAX / np.maximum(nd, 1e-6))
        mel.moy[fige] = ref.moy[fige]
        w = (n_tous + 1e-3 * len(x)) / (n_tous + 1e-3 * len(x)).sum()
        w[fige] = ref.poids[fige]
        mel.poids = w / w.sum()
    mel.n = n * echelle
    return mel


def stats_matieres(mel, x, autorise=None):
    """Moyenne, écart-type et effectif (pondérés) de chaque matière. Effectifs
    ramenés à la taille réelle quand on sous-échantillonne."""
    idx = echantillon(x, 120000, 2)
    w = mel.par_matiere(mel.posteriors(x[idx])) * (len(x) / max(1, len(idx)))
    if autorise is not None:
        w *= autorise[idx]
    x = x[idx]
    out = {}
    for mi, nom in enumerate(MATIERES):
        s = w[:, mi].sum()
        if s < 1:
            out[nom] = None
            continue
        mu = (w[:, mi, None] * x).sum(0) / s
        sd = np.sqrt((w[:, mi, None] * (x - mu) ** 2).sum(0) / s) + 0.5
        out[nom] = {'moy': mu, 'ecart': sd, 'n': float(s)}
    return out


# --------------------------------------------------------------------------- correction
def correction(mel, st_feuille, st_ref, matieres=None):
    """Fonction lab -> lab de la feuille vers l'idle (voir en-tête, étapes 3-4).
    Par MATIÈRE et non par gaussienne : quand toute une matière glisse (cheveux
    +10 en L), une gaussienne « reflet » capterait toute la chevelure et la
    garderait claire ; la moyenne de la matière, elle, suit le glissement."""
    actives = []
    for mi, nom in enumerate(MATIERES):
        a, r = st_feuille.get(nom), st_ref.get(nom)
        if nom in NON_CORRIGEES or a is None or r is None or a['n'] < MIN_PIXELS:
            continue
        if matieres is not None and nom not in matieres:
            continue
        k = np.clip(r['ecart'] / a['ecart'], *RAPPORT_ECART)
        actives.append((mi, a['moy'], r['moy'], k))

    def f(lab):
        if not actives or len(lab) == 0:
            return lab.copy()
        w = mel.par_matiere(mel.posteriors(lab))
        delta = np.zeros_like(lab)
        for mi, mu_a, mu_r, k in actives:
            delta += w[:, mi, None] * (mu_r + (lab - mu_a) * k - lab)
        n = np.linalg.norm(delta, axis=1, keepdims=True)
        delta *= np.minimum(1, DELTA_MAX / np.maximum(n, 1e-6))
        delta *= lissage(lab[:, 0], *L_NOIR)[:, None]
        return lab + delta
    return f


def applique(arr, f, masque=None, force=1.0):
    """Applique la correction f aux pixels visibles (alpha > 0), pondérée par le
    masque de zone et la force. Alpha et pixels transparents intacts."""
    out = arr.copy()
    m = arr[..., 3] > 0
    if masque is not None:
        m &= masque > 0.001
    if not m.any():
        return out
    rgb = arr[..., :3][m].astype(float)
    # Une même couleur => une même correction : on ne calcule que les couleurs uniques.
    uniq, inv = np.unique(arr[..., :3][m], axis=0, return_inverse=True)
    neuf = lab_vers_rgb(f(rgb_vers_lab(uniq.astype(float))))[inv.ravel()]
    t = force * (masque[m][:, None] if masque is not None else 1.0)
    out[..., :3][m] = np.clip(np.round(rgb + (neuf - rgb) * t), 0, 255).astype(np.uint8)
    return out


class Correcteur:
    """Corrections d'un groupe, une par jeu de matières (mises en cache)."""

    def __init__(self, mel, st, st_ref, force):
        self.mel, self.st, self.st_ref, self.force, self.cache = mel, st, st_ref, force, {}

    def f(self, mats):
        cle = tuple(mats) if mats else None
        if cle not in self.cache:
            self.cache[cle] = correction(self.mel, self.st, self.st_ref, mats)
        return self.cache[cle]

    def image(self, arr, opts):
        out = arr
        for mats, zones in passes_de(opts):
            m = masque_zones(arr.shape[:2], zones) if zones is not None else None
            out = applique(out, self.f(mats), m, self.force)
        return out


# --------------------------------------------------------------------------- fichiers
def charge(rel):
    return np.array(Image.open(ROOT / rel).convert('RGBA'))


def fft_correl(a, k):
    H, W = a.shape[0] + k.shape[0] - 1, a.shape[1] + k.shape[1] - 1
    r = np.fft.irfft2(np.fft.rfft2(a, (H, W)) * np.fft.rfft2(k[::-1, ::-1], (H, W)), (H, W))
    return r[k.shape[0] - 1:a.shape[0], k.shape[1] - 1:a.shape[1]]


def situe(planche, frame):
    """Décalage (dy, dx) de la frame dans sa planche (frames = découpes de la
    planche, à 1-2 niveaux près) : corrélation des masques alpha (numpy FFT)."""
    ys, xs = np.where(frame[..., 3] > 0)
    y0, x0 = ys.min(), xs.min()
    crop = frame[y0:ys.max() + 1, x0:xs.max() + 1, 3] > 0
    c = fft_correl((planche[..., 3] > 0) * 2.0 - 1, crop * 2.0 - 1)
    py, px = np.unravel_index(np.argmax(c), c.shape)
    return py - y0, px - x0


def verifie_position(planche, frame, dy, dx, p, pl, vus):
    """La frame doit retomber sur ses propres pixels (écart moyen < 3 niveaux) et
    deux frames ne peuvent pas partager la même place (poses quasi identiques)."""
    fh, fw = frame.shape[:2]
    y0, x0 = max(0, dy), max(0, dx)
    y1, x1 = min(planche.shape[0], dy + fh), min(planche.shape[1], dx + fw)
    f = frame[y0 - dy:y1 - dy, x0 - dx:x1 - dx].astype(int)
    s = planche[y0:y1, x0:x1].astype(int)
    m = (f[..., 3] > 250) & (s[..., 3] > 250)
    ecart = np.abs(f[m][:, :3] - s[m][:, :3]).mean() if m.any() else 999
    if ecart > 3 or (dy, dx) in vus:
        raise SystemExit(f'{p} mal située dans {pl} (écart {ecart:.1f}, position {dy},{dx})')
    vus.add((dy, dx))


def frames(motif):
    return sorted(str(Path(p).relative_to(ROOT)).replace('\\', '/') for p in glob.glob(str(ROOT / motif)))


def ex(motif, **opts):
    return [(p, opts) for p in frames(motif)]


def lignes(prefixe, rangees):
    return sum((ex(f'{prefixe}{r}_*.png') for r in rangees), [])


# Matières humaines sans la cape : les transformations singe / papillon
# s'enroulent dans des feuilles vertes vives qui se confondraient avec elle.
SANS_CAPE = ['cheveux', 'peau', 'tunique', 'cuir', 'sombre', 'tatouage', 'metal']
# ... ni le tatouage : pétales roses du papillon.
SANS_CAPE_NI_ROSE = ['cheveux', 'peau', 'tunique', 'cuir', 'sombre', 'metal']
# Aigle : pas de tatouage visible ; les jambes violet sombre ressemblent à du rouge.
AIGLE = ['cheveux', 'peau', 'tunique', 'cuir']
EX = f'{SP}agarica_extra_frames/agarica_extra_row'
TR = f'{SP}transformation/'
NON_CAPE = [m for m in MATIERES if m != 'cape']


def cape_seulement(zones):
    """Toutes les matières partout, sauf la cape limitée à `zones` : les VFX verts
    (arc de l'attaque, lueur des gants) ont exactement les couleurs d'une cape."""
    return {'passes': [(NON_CAPE, None), (['cape'], zones)]}


AT = f'{SP}agarica_attack_frames/agarica_attack_'

# Un groupe = une génération Codex (mêmes couleurs) : statistiques calculées sur
# ses frames (ce que voit le joueur), correction appliquée aux frames ET à la
# planche source. Frames non listées (formes 100 % animales) : intactes.
GROUPES = [
    # Même génération (même planche d'origine) que l'idle : écart mesuré au niveau
    # du bruit de pose (dE ~1.5) -> mesurées mais laissées intactes.
    {'nom': 'agarica_frames marche', 'frames': lignes(f'{SP}agarica_frames/agarica_row', [1]), 'mesure_seule': True},
    {'nom': 'agarica_frames course', 'frames': lignes(f'{SP}agarica_frames/agarica_row', [2]), 'mesure_seule': True},
    {'nom': 'agarica_walk', 'frames': ex(f'{SP}agarica_walk_frames/*.png')},
    {'nom': 'agarica_attack', 'frames': [
        (f'{AT}0.png', {}),
        (f'{AT}1.png', cape_seulement([(0.44, 0.12, 0.63, 0.58)])),
        (f'{AT}2.png', cape_seulement([(0.47, 0.10, 0.65, 0.85)])),
        (f'{AT}3.png', cape_seulement([(0.44, 0.10, 0.65, 0.90)])),
        (f'{AT}4.png', {}),
    ],
     # planche d'origine (4 poses, autre cadrage que les frames) : cape de chaque pose
     'planches': [(f'{SP}agarica_attack.png', cape_seulement(
         [(0.0, 0.30, 0.12, 0.78), (0.17, 0.30, 0.31, 0.60), (0.37, 0.30, 0.50, 0.70), (0.77, 0.30, 0.90, 0.75)]))],
     'apercu': [f'{SP}agarica_attack_frames/agarica_attack_0.png', f'{SP}agarica_attack_frames/agarica_attack_2.png']},
    {'nom': 'extra p1 saut/chute/blessée', 'frames': lignes(EX, [0, 1, 2]), 'planches': [f'{SP}agarica_extra.png']},
    {'nom': 'extra p2 mort/parle/triste', 'frames': lignes(EX, [3, 4, 5]), 'planches': [f'{SP}agarica_extra_p2.png']},
    # Incantation : les gants s'illuminent du vert d'une cape -> cape exclue autour des gants.
    {'nom': 'extra p3 lianes/incantation', 'frames': lignes(EX, [6, 7]) + [
        (f'{EX}8_0.png', {}),
        (f'{EX}8_1.png', cape_seulement({'hors': [(0.56, 0.47, 0.78, 0.59)]})),
        (f'{EX}8_2.png', cape_seulement({'hors': [(0.35, 0.29, 0.47, 0.41), (0.70, 0.29, 0.83, 0.41)]})),
        (f'{EX}8_3.png', cape_seulement({'hors': [(0.35, 0.30, 0.47, 0.41), (0.71, 0.29, 0.83, 0.41)]})),
        (f'{EX}8_4.png', cape_seulement({'hors': [(0.55, 0.63, 0.65, 0.74), (0.71, 0.62, 0.83, 0.72)]})),
    ], 'planches_situees': [f'{SP}agarica_extra_p3.png']},
    {'nom': 'extra p4 objet reçu', 'frames': lignes(EX, [9]), 'planches': [f'{SP}agarica_extra_p4.png']},
    {'nom': 'slash', 'frames': ex(f'{SP}agarica_slash_frames/*.png'), 'planches': [f'{SP}agarica_slash.png']},
    {'nom': 'transfo singe', 'tout': True, 'frames': [
        (f'{SP}transfo_singe_frames/transfo_singe_row0_0.png', {'matieres': SANS_CAPE}),
        # mi-singe : seulement les cheveux et le visage (fourrure brune = animal)
        (f'{SP}transfo_singe_frames/transfo_singe_row0_1.png', {'matieres': ['cheveux', 'peau'], 'zones': [(0.40, 0.25, 0.92, 0.60)]}),
    ], 'planches_situees': [f'{SP}transfo_singe.png']},
    {'nom': 'transfo papillon', 'tout': True, 'frames': [
        (f'{SP}transfo_papillon_frames/transfo_papillon_row0_0.png', {'matieres': SANS_CAPE_NI_ROSE}),
        (f'{SP}transfo_papillon_frames/transfo_papillon_row0_1.png', {'matieres': ['cheveux'], 'zones': [(0.55, 0.30, 0.86, 0.62)]}),
    ], 'planches_situees': [f'{SP}transfo_papillon.png']},
    # Aigle : la cape devient les ailes -> corrigée seulement là où elle est encore une cape.
    {'nom': 'transfo aigle', 'tout': True, 'frames': [
        (f'{TR}transfo_frames/transfo_row0_1.png', {'passes': [
            (AIGLE, None), (['cape'], [(0.10, 0.30, 0.70, 0.66)])]}),
        (f'{TR}transfo_frames/transfo_row0_2.png', {'matieres': AIGLE}),
        (f'{TR}transfo_frames/transfo_row1_1.png', {'matieres': AIGLE}),
    ]},
    {'nom': 'transfo loup 1', 'tout': True, 'frames': [
        (f'{TR}transfo_loup_frames/transfoloup_1.png', {'passes': [
            (['cheveux', 'peau'], [(0.55, 0.0, 1.0, 0.40)]),
            (['cape', 'tunique'], [(0.08, 0.10, 0.72, 0.50)])]})]},
    {'nom': 'transfo loup 2', 'tout': True, 'frames': [
        (f'{TR}transfo_loup_frames/transfoloup_2.png', {'passes': [
            (['cheveux'], [(0.60, 0.15, 0.95, 0.45)]),
            (['cape'], [(0.30, 0.18, 0.85, 0.50)])]})]},
    {'nom': 'transfo ours', 'tout': True, 'frames': [
        (f'{TR}transfo_ours_frames/transfo_ours_row0_0.png', {}),
        (f'{TR}transfo_ours_frames/transfo_ours_row0_1.png', {'passes': [
            (['cheveux', 'peau'], [(0.42, 0.0, 0.78, 0.33)]),
            (['cape', 'tunique', 'tatouage'], [(0.20, 0.25, 0.78, 0.85)])]}),
    ], 'planches_situees': [f'{TR}transfo_ours.png']},
    {'nom': 'transfo pieuvre', 'tout': True, 'frames': [
        (f'{TR}transfo_pieuvre_frames/transfopieuvre_0.png', {}),
        (f'{TR}transfo_pieuvre_frames/transfopieuvre_1.png', {'passes': [
            (['cheveux', 'peau'], [(0.0, 0.0, 0.62, 0.40)]),
            (['cape', 'tunique'], [(0.25, 0.30, 0.95, 0.75)])]}),
    ]},
    # Portrait : plus détaillé (dessiné à part), corrigé à moitié seulement.
    {'nom': 'portrait', 'tout': True, 'frames': [('assets/_codex_src/portrait_agarica.png', {})],
     'planches': ['assets/ui/portraits/agarica.png'], 'force': 0.5},
]


def tous_les_fichiers():
    out = []
    for g in GROUPES:
        out += [p for p, _ in g['frames']] + g.get('planches_situees', [])
        out += [pl[0] if isinstance(pl, tuple) else pl for pl in g.get('planches', [])]
    return out


def sauvegarde(fichiers):
    for rel in fichiers + REF:
        dst = SAUVEGARDE / rel
        if not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / rel, dst)


def ecrit(arr, rel):
    """Écriture via un fichier temporaire + remplacement (un PNG lu au même moment
    par le jeu ou l'antivirus peut refuser l'ouverture : on réessaie)."""
    dst = ROOT / rel
    tmp = dst.with_name(dst.stem + '.tmp_couleurs.png')
    for essai in range(5):
        try:
            Image.fromarray(arr, 'RGBA').save(tmp)
            os.replace(tmp, dst)
            return
        except OSError:
            if essai == 4:
                raise
            time.sleep(1.0 + essai)


def charge_source(rel, repartir):
    src = (SAUVEGARDE / rel) if repartir and (SAUVEGARDE / rel).exists() else (ROOT / rel)
    return np.array(Image.open(src).convert('RGBA'))


# --------------------------------------------------------------------------- mesures
def delta_e(st, st_ref):
    out = {}
    for nom in MATIERES:
        a, r = st.get(nom), st_ref.get(nom)
        if nom in NON_CORRIGEES or a is None or r is None or a['n'] < MIN_PIXELS:
            continue
        out[nom] = round(float(np.linalg.norm(a['moy'] - r['moy'])), 1)
    return out


def analyse(ref, images):
    """Mélange adapté + statistiques par matière d'un lot d'images (avec leurs passes)."""
    cs = [collecte(arr, o) for arr, o in images]
    x = np.concatenate([c[0] for c in cs])
    au = np.concatenate([c[1] for c in cs])
    mel = adapte(ref, x, au)
    return mel, stats_matieres(mel, x, au)


# --------------------------------------------------------------------------- planche
def vignette(arr, h, wmax):
    im = Image.fromarray(arr, 'RGBA')
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    s = min(h / im.height, wmax / im.width)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def ecrit_planche(entrees, idle, chemin, bilan=None):
    H, CW, cols = 190, 180, 3
    cell_w = 3 * CW + 2 * 6
    try:
        fnt = ImageFont.truetype('arial.ttf', 13)
    except OSError:
        fnt = ImageFont.load_default()
    rows = (len(entrees) + cols - 1) // cols
    W = cols * (cell_w + 20) + 20
    mats = [m for m in MATIERES if m not in NON_CORRIGEES]
    Ht = 46 + rows * (H + 46) + ((len(bilan) + 3) * 18 + 10 if bilan else 0)
    P = Image.new('RGBA', (W, Ht), (52, 48, 64, 255))
    d = ImageDraw.Draw(P)
    d.text((20, 8), "Couleurs d'Agarica : pour chaque animation  [ idle (référence) | AVANT | APRÈS ]", fill=(255, 255, 255), font=fnt)
    d.text((20, 24), "dE = écart moyen des matières vs l'idle (Lab, CIE76), avant -> après ; produit par tools/harmonize_agarica_colors.py",
           fill=(200, 200, 200), font=fnt)
    iv = vignette(idle, H, CW)
    for i, (titre, avant, apres, de0, de1) in enumerate(entrees):
        x = 20 + (i % cols) * (cell_w + 20)
        y = 46 + (i // cols) * (H + 46)
        d.rectangle([x - 6, y - 2, x + cell_w + 6, y + H + 38], fill=(78, 72, 96, 255))
        for j, im in enumerate((iv, vignette(avant, H, CW), vignette(apres, H, CW))):
            cx = x + j * (CW + 6)
            P.alpha_composite(im, (cx + (CW - im.width) // 2, y + 14 + H - im.height))
        d.text((x, y), titre[:70], fill=(255, 235, 200), font=fnt)
        d.text((x, y + H + 20), f'dE {de0:.1f} -> {de1:.1f}', fill=(190, 255, 190), font=fnt)
    if bilan:
        # Tableau : dE (Lab) de chaque matière vs l'idle, avant -> après, par groupe.
        y = 46 + rows * (H + 46) + 4
        d.text((20, y), "dE par matière vs l'idle (avant -> après) ; vide = matière absente ou non corrigée dans ce groupe",
               fill=(255, 255, 255), font=fnt)
        y += 22
        col0, colw = 250, (W - 270) // len(mats)
        for j, m in enumerate(mats):
            d.text((20 + col0 + j * colw, y), m, fill=(255, 235, 200), font=fnt)
        for nom, v in bilan.items():
            y += 18
            d.text((20, y), nom[:34], fill=(220, 220, 220), font=fnt)
            for j, m in enumerate(mats):
                if m in v['avant']:
                    a, b = v['avant'][m], v['apres'].get(m, float('nan'))
                    coul = (190, 255, 190) if b <= max(2.5, a * 0.5) else (255, 220, 150)
                    d.text((20 + col0 + j * colw, y), f'{a:4.1f} -> {b:4.1f}', fill=coul, font=fnt)
    chemin.parent.mkdir(parents=True, exist_ok=True)
    P.convert('RGB').save(chemin)


def ecrit_debug(dbg, mel, g, src, res):
    """Par frame : original | matières (blanc = hors modèle) | amplitude x4 | résultat."""
    dbg.mkdir(parents=True, exist_ok=True)
    pal = np.array([[255, 140, 0], [0, 200, 0], [255, 220, 200], [200, 180, 120], [140, 70, 20],
                    [70, 70, 90], [255, 0, 120], [180, 220, 255], [0, 255, 255]])
    fond = np.array([90, 90, 100])

    def sur_fond(x):
        al = x[..., 3:] / 255.0
        return (x[..., :3] * al + fond * (1 - al)).astype(np.uint8)

    for p, _ in g['frames']:
        a = src[p]
        ok = a[..., 3] > 100
        uniq, inv = np.unique(a[..., :3][ok], axis=0, return_inverse=True)
        lab = rgb_vers_lab(uniq.astype(float))
        post = mel.posteriors(lab)
        cls = np.where(post[:, -1] > 0.5, -1, mel.par_matiere(post).argmax(1))
        cls = np.where(lab[:, 0] < L_NOIR[0], -2, cls)[inv.ravel()]
        vis = np.zeros(a.shape[:2] + (3,), np.uint8) + 30
        v = np.zeros((ok.sum(), 3), np.uint8)
        v[cls >= 0] = pal[cls[cls >= 0]]
        v[cls == -1] = 255
        vis[ok] = v
        diff = np.abs(res[p][..., :3].astype(int) - a[..., :3].astype(int)).sum(-1)
        dv = np.clip(diff * 4, 0, 255).astype(np.uint8)
        trio = np.concatenate([sur_fond(a), vis, np.stack([dv] * 3, -1), sur_fond(res[p])], 1)
        Image.fromarray(trio).save(dbg / (Path(p).stem + '.png'))


# --------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--repartir', action='store_true')
    ap.add_argument('--planche', nargs='?', const=str(PLANCHE), help='chemin (défaut docs/production/...)')
    ap.add_argument('--debug')
    ap.add_argument('--seul', help='ne traiter que les groupes dont le nom contient ce texte')
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')

    if not args.dry:
        sauvegarde(tous_les_fichiers())
    ref, xref = modele_reference()
    # L'idle passe par la MÊME adaptation que les feuilles : sur lui-même la
    # correction est exactement nulle, et les moyennes comparées sont homogènes.
    mel_idle = adapte(ref, xref)
    st_ref = stats_matieres(mel_idle, xref)
    print('Idle (référence) :')
    for nom in MATIERES:
        s = st_ref[nom]
        if s:
            pl = ref.teinte[list(ref.matiere).index(MATIERES.index(nom))]
            print(f"  {nom:9s} n={s['n']:7.0f}  Lab=({s['moy'][0]:5.1f},{s['moy'][1]:5.1f},{s['moy'][2]:5.1f})"
                  f"  écart=({s['ecart'][0]:4.1f},{s['ecart'][1]:4.1f},{s['ecart'][2]:4.1f})"
                  + (f"  teinte {pl[0]:3.0f}°±{pl[1]:2.0f}" if pl[0] is not None else '') + f"  chroma<{pl[2]:3.0f}")
    bilan, entrees, n_ecrits = {}, [], 0
    for g in GROUPES:
        if args.seul and args.seul not in g['nom']:
            continue
        src = {p: charge_source(p, args.repartir) for p, _ in g['frames']}
        mel, st = analyse(ref, [(src[p], o) for p, o in g['frames']])
        cor = Correcteur(mel, st, st_ref, g.get('force', 1.0))
        if g.get('mesure_seule'):
            res = dict(src)
        else:
            res = {p: cor.image(src[p], o) for p, o in g['frames']}
        # Mesure APRÈS indépendante : le mélange est ré-adapté sur les images corrigées.
        if g.get('mesure_seule'):
            st_apres = st
        else:
            _, st_apres = analyse(ref, [(res[p], o) for p, o in g['frames']])
        de_avant, de_apres = delta_e(st, st_ref), delta_e(st_apres, st_ref)
        planches = {}
        for pl in g.get('planches', []):
            pl, o = pl if isinstance(pl, tuple) else (pl, {})
            planches[pl] = cor.image(charge_source(pl, args.repartir), o)
        for pl in g.get('planches_situees', []):
            a = charge_source(pl, args.repartir)
            out = a.copy()
            vus_pos = set()
            for p, o in g['frames']:
                dy, dx = situe(a, src[p])
                verifie_position(a, src[p], dy, dx, p, pl, vus_pos)
                fh, fw = src[p].shape[:2]
                y0, x0, y1, x1 = max(0, dy), max(0, dx), min(a.shape[0], dy + fh), min(a.shape[1], dx + fw)
                contenu = src[p][y0 - dy:y1 - dy, x0 - dx:x1 - dx, 3] > 0
                for mats, zones in passes_de(o):
                    # la zone de la frame, reportée dans la planche (limitée à son contenu)
                    m = np.zeros(a.shape[:2])
                    m[y0:y1, x0:x1] = masque_zones((fh, fw), zones)[y0 - dy:y1 - dy, x0 - dx:x1 - dx] * contenu
                    out = applique(out, cor.f(mats), m, cor.force)
            planches[pl] = out
        moy0 = float(np.mean(list(de_avant.values()))) if de_avant else 0.0
        moy1 = float(np.mean(list(de_apres.values()))) if de_apres else 0.0
        print(f"\n[{g['nom']}]  dE moyen {moy0:.1f} -> {moy1:.1f}" + ('  (non modifié)' if g.get('mesure_seule') else ''))
        for nom in MATIERES:
            if nom in de_avant or nom in de_apres:
                print(f"  {nom:9s} {de_avant.get(nom, float('nan')):5.1f} -> {de_apres.get(nom, float('nan')):5.1f}")
        bilan[g['nom']] = {'avant': de_avant, 'apres': de_apres, 'moyen': [round(moy0, 1), round(moy1, 1)]}
        if not args.dry and not g.get('mesure_seule'):
            for p, arr in list(res.items()) + list(planches.items()):
                ecrit(arr, p)
                n_ecrits += 1
        # planche : une frame représentative par rangée (ou la liste `apercu`)
        vus = set()
        for p, o in g['frames']:
            cle = re.sub(r'_\d+$', '', Path(p).stem)
            if g.get('apercu') is not None:
                if p not in g['apercu']:
                    continue
            elif cle in vus and not g.get('tout'):
                continue
            vus.add(cle)
            titre = f"{g['nom']} : {Path(p).stem}" + ("  (intacte)" if g.get('mesure_seule') else '')
            entrees.append((titre, src[p], res[p], moy0, moy1))
        if args.debug:
            ecrit_debug(Path(args.debug), mel, g, src, res)
    if args.planche:
        ecrit_planche(entrees, charge(REF[0]), Path(args.planche), bilan)
        print('\nplanche :', args.planche)
    out = SAUVEGARDE.parent / 'mesures.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(bilan, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'\n{n_ecrits} image(s) écrite(s) ; mesures : {out}')


if __name__ == '__main__':
    main()
