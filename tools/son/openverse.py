#!/usr/bin/env python3
"""Chercher et télécharger des sons CC0 sur Openverse, pour le jeu.

  python tools/son/openverse.py chercher "sword whoosh" --max 8
  python tools/son/openverse.py telecharger <identifiant> --vers assets/audio/sfx/dague_arc
  python tools/son/openverse.py noter assets/audio/sfx/saut.ogg --source "earshot sfx render ui_pop/soft --seed 2"
  python tools/son/openverse.py retirer assets/audio/sfx/dague_arc.ogg

Pourquoi cet outil : Openverse n'a rien à installer, mais son API anonyme est limitée
(20 requêtes par minute, 200 par jour). Une recherche = UNE requête, un téléchargement =
une requête + le fichier. La licence est verrouillée sur CC0 ici, pas dans la tête de celui
qui lance la commande : rien d'autre ne peut entrer dans le jeu par ce chemin.

Tout son rangé dans assets/audio/ est inscrit dans assets/audio/CREDITS.md. Un essai
téléchargé hors du projet (dossier temporaire, pour comparer trois versions) n'y est pas
inscrit : seul le son retenu l'est, au moment où on le télécharge à sa place.
"""
import argparse
import datetime
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
BIBLIOTHEQUE = RACINE / "assets" / "audio"
REGISTRE = BIBLIOTHEQUE / "CREDITS.md"
API = "https://api.openverse.org/v1/audio/"
# Nom générique exprès : ni le nom du projet, ni une adresse e-mail.
AGENT = "sfx-search-script/1.0"
TAILLE_MAX = 40 * 1024 * 1024          # un bruitage ne pèse pas 40 Mo : au-delà, c'est une erreur de cible
# Freesound publie chaque aperçu en mp3 ET en ogg ; Openverse ne donne que le mp3.
APERCU_FREESOUND = re.compile(r"^https://cdn\.freesound\.org/previews/\d+/\d+_\d+-hq\.mp3$")
EN_TETE = """# Sons du jeu : registre des sources

Chaque son de `assets/audio/` a sa ligne ici. `tools/son/openverse.py` l'écrit tout seul
(`telecharger` pour un son CC0 d'Openverse, `noter` pour un son fabriqué par code ou venu
d'ailleurs, `retirer` pour enlever le son et sa ligne). Licence acceptée : CC0 uniquement.

| Fichier | Titre d'origine | Auteur | Licence | Source | Page ou commande | Ajouté le |
|---|---|---|---|---|---|---|
"""


def stop(message):
    sys.exit("openverse: " + message)


def appel(url):
    """Une requête JSON. Les refus de l'API sont rendus en une ligne lisible."""
    req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            reste = r.headers.get("x-ratelimit-available-anon_sustained")
            return json.loads(r.read().decode("utf-8")), reste
    except urllib.error.HTTPError as e:
        if e.code == 429:
            stop("limite de l'API atteinte (20 requêtes par minute, 200 par jour) : attendre avant de relancer")
        if e.code == 404:
            stop("identifiant inconnu d'Openverse")
        stop(f"refus de l'API (HTTP {e.code})")
    except (urllib.error.URLError, TimeoutError) as e:
        stop(f"API injoignable ({e})")


def recevoir(url, vers):
    """Télécharge un fichier dans `vers`. False si le serveur ne l'a pas."""
    req = urllib.request.Request(url, headers={"User-Agent": AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60) as src, open(vers, "wb") as dst:
            total = 0
            while True:
                bloc = src.read(65536)
                if not bloc:
                    return True
                total += len(bloc)
                if total > TAILLE_MAX:
                    stop("fichier de plus de 40 Mo : abandonné")
                dst.write(bloc)
    except (urllib.error.URLError, TimeoutError):
        return False


def ffmpeg():
    """FFmpeg du PATH, sinon celui que winget a posé : une session ouverte avant
    l'installation ne voit pas encore le nouveau PATH."""
    p = shutil.which("ffmpeg")
    if p:
        return p
    local = os.environ.get("LOCALAPPDATA", "")
    trouve = glob.glob(os.path.join(local, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg*", "*", "bin", "ffmpeg.exe"))
    if trouve:
        return trouve[0]
    stop("FFmpeg introuvable (winget install Gyan.FFmpeg, puis rouvrir le terminal)")


def duree(ms):
    return "?" if not ms else f"{ms / 1000:.1f} s"


def propre(texte, n=60):
    """Une case de tableau ou une colonne de liste : une seule ligne, sans barre verticale."""
    t = re.sub(r"\s+", " ", str(texte or "")).replace("|", "/").strip()
    return t if len(t) <= n else t[: n - 1] + "…"


def chemin_relatif(p):
    return p.resolve().relative_to(RACINE).as_posix()


def dans_bibliotheque(p):
    try:
        p.resolve().relative_to(BIBLIOTHEQUE)
        return True
    except ValueError:
        return False


# ----------------------------------------------------------------------------- registre
def lire_registre():
    if not REGISTRE.exists():
        return EN_TETE.splitlines()
    return REGISTRE.read_text(encoding="utf-8").splitlines()


def ecrire_registre(lignes):
    BIBLIOTHEQUE.mkdir(parents=True, exist_ok=True)
    REGISTRE.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def sans_ligne(lignes, rel):
    return [l for l in lignes if not l.startswith(f"| `{rel}` |")]


def inscrire(fichier, titre, auteur, licence, source, page):
    rel = chemin_relatif(fichier)
    lignes = sans_ligne(lire_registre(), rel)     # un son remplacé ne garde pas deux lignes
    jour = datetime.date.today().isoformat()
    lignes.append(f"| `{rel}` | {propre(titre, 80)} | {propre(auteur, 40)} | {licence} | {propre(source, 30)} | "
                  f"{propre(page, 200)} | {jour} |")
    ecrire_registre(lignes)


# ----------------------------------------------------------------------------- commandes
def chercher(a):
    q = {"q": a.requete, "license": "cc0", "page_size": max(1, min(a.max, 20)), "page": a.page}
    if a.source:
        q["source"] = a.source
    if a.categorie:
        q["category"] = a.categorie
    if a.longueur:
        q["length"] = a.longueur
    data, reste = appel(API + "?" + urllib.parse.urlencode(q))
    res = data.get("results", [])
    if a.duree_max:
        res = [r for r in res if r.get("duration") and r["duration"] <= a.duree_max * 1000]
    if not res:
        print(f"aucun son CC0 pour « {a.requete} » (essayer en anglais, des mots plus simples, ou --page 2)")
        return
    for r in res:
        # la licence est filtrée par l'API ; on l'affiche quand même, c'est elle qui fait foi au téléchargement
        print(f"{r['id']}  {propre(r.get('title'), 44):44s}  {duree(r.get('duration')):>7s}  "
              f"{str(r.get('license', '?')).upper():4s}  {propre(r.get('creator'), 24)}  ({r.get('source', '?')})")
    print(f"{len(res)} affichés sur {data.get('result_count', '?')} (page {a.page}) ; "
          f"requêtes restantes aujourd'hui : {reste or '?'}")


def telecharger(a):
    cible = Path(a.vers)
    cible = cible if cible.is_absolute() else RACINE / cible
    cible = cible.with_suffix(".ogg")
    if cible.exists() and not a.force:
        stop(f"{cible} existe déjà (--force pour le remplacer)")
    r, _ = appel(API + urllib.parse.quote(a.identifiant.strip()) + "/")
    licence = str(r.get("license", "")).lower()
    if licence != "cc0":
        stop(f"refusé : « {propre(r.get('title'))} » est sous licence {licence.upper() or 'inconnue'}, "
             "seul le CC0 entre dans le jeu")
    url = r.get("url")
    if not url or not url.lower().startswith("https://"):
        stop("ce résultat n'a pas de fichier téléchargeable en https")
    ff = ffmpeg()
    cible.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        brut, recu = Path(tmp) / "source.ogg", False
        if APERCU_FREESOUND.match(url):
            # l'aperçu ogg évite de recompresser un mp3 en ogg (deux pertes de suite)
            recu = recevoir(url[:-4] + ".ogg", brut)
        if not recu:
            brut = Path(tmp) / ("source." + re.sub(r"[^a-z0-9]", "", str(r.get("filetype") or "bin").lower())[:5])
            if not recevoir(url, brut):
                stop("téléchargement impossible (le fichier ne répond pas)")
        cmd = [ff, "-v", "error", "-y", "-nostdin"]
        if a.debut:
            cmd += ["-ss", f"{a.debut:g}"]
        if a.fin:
            cmd += ["-to", f"{a.fin:g}"]
        # -map_metadata -1 : pas d'étiquettes de l'auteur dans le fichier du jeu, le registre suffit.
        # Un ogg pris en entier est recopié tel quel ; tout le reste est encodé en Vorbis.
        codec = ["-c:a", "copy"] if brut.suffix == ".ogg" and not (a.debut or a.fin) else ["-c:a", "libvorbis", "-q:a", "5"]
        cmd += ["-i", str(brut), "-vn", "-map_metadata", "-1", *codec, str(cible)]
        p = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
        if p.returncode != 0 or not cible.exists():
            stop("conversion FFmpeg ratée : " + (p.stderr.strip().splitlines() or ["?"])[-1])
    ko = cible.stat().st_size / 1024
    coupe = f", coupé {a.debut or 0:g}-{a.fin:g} s" if a.fin else (f", à partir de {a.debut:g} s" if a.debut else "")
    if dans_bibliotheque(cible):
        inscrire(cible, r.get("title"), r.get("creator"), "CC0 1.0", f"Openverse / {r.get('source', '?')}",
                 r.get("foreign_landing_url") or r.get("detail_url"))
        suite = "inscrit dans assets/audio/CREDITS.md"
    else:
        suite = "hors de assets/audio/ : essai, non inscrit au registre"
    print(f"ok  {cible}  ({ko:.0f} Ko, {duree(r.get('duration'))} à l'origine{coupe})  "
          f"« {propre(r.get('title'))} » de {propre(r.get('creator'), 30)}, CC0 ; {suite}")


def noter(a):
    f = Path(a.fichier)
    f = f if f.is_absolute() else RACINE / f
    if not f.is_file():
        stop(f"fichier introuvable : {f}")
    if not dans_bibliotheque(f):
        stop("le registre ne couvre que assets/audio/")
    inscrire(f, a.titre or f.stem, a.auteur, a.licence, a.origine, a.source)
    print(f"ok  {chemin_relatif(f)} inscrit dans assets/audio/CREDITS.md")


def retirer(a):
    f = Path(a.fichier)
    f = f if f.is_absolute() else RACINE / f
    if not dans_bibliotheque(f):
        stop("retirer ne touche qu'à assets/audio/")
    rel = chemin_relatif(f)
    avant = lire_registre()
    apres = sans_ligne(avant, rel)
    present = f.is_file()
    if present:
        f.unlink()
    if REGISTRE.exists() and apres != avant:
        ecrire_registre(apres)
    print(f"ok  {rel} : fichier {'supprimé' if present else 'déjà absent'}, "
          f"{len(avant) - len(apres)} ligne(s) retirée(s) du registre")


def main():
    for flux in (sys.stdout, sys.stderr):           # un titre hors de la page de codes ne doit pas planter l'affichage
        if hasattr(flux, "reconfigure"):
            flux.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Sons CC0 d'Openverse pour le jeu")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("chercher", help="une ligne par son CC0 trouvé")
    c.add_argument("requete", help="mots en anglais de préférence")
    c.add_argument("--max", type=int, default=8, help="nombre de résultats (20 au plus)")
    c.add_argument("--page", type=int, default=1)
    c.add_argument("--duree-max", type=float, help="ne garder que les sons de moins de N secondes")
    c.add_argument("--longueur", choices=["shortest", "short", "medium", "long"],
                   help="filtre de l'API : shortest = moins de 30 s")
    c.add_argument("--categorie", choices=["sound_effect", "music", "audiobook", "podcast", "news", "pronunciation"])
    c.add_argument("--source", help="freesound, wikimedia_audio, jamendo…")
    c.set_defaults(func=chercher)
    t = sub.add_parser("telecharger", help="télécharge un son CC0, le met en .ogg et l'inscrit au registre")
    t.add_argument("identifiant")
    t.add_argument("--vers", required=True, help="chemin sans extension, ex. assets/audio/sfx/loup_morsure")
    t.add_argument("--debut", type=float, help="couper : début en secondes")
    t.add_argument("--fin", type=float, help="couper : fin en secondes")
    t.add_argument("--force", action="store_true", help="remplacer un fichier existant")
    t.set_defaults(func=telecharger)
    n = sub.add_parser("noter", help="inscrit au registre un son fabriqué par code ou venu d'ailleurs")
    n.add_argument("fichier")
    n.add_argument("--source", required=True, help="adresse de la page, ou commande qui a fabriqué le son")
    n.add_argument("--origine", default="earshot (fabriqué par code)")
    n.add_argument("--auteur", default="projet")
    n.add_argument("--licence", default="original")
    n.add_argument("--titre")
    n.set_defaults(func=noter)
    x = sub.add_parser("retirer", help="supprime un son de assets/audio/ et sa ligne du registre")
    x.add_argument("fichier")
    x.set_defaults(func=retirer)
    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
