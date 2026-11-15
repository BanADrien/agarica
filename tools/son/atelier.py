#!/usr/bin/env python3
"""Atelier des sons de Legend of Agarica : écouter, régler, fabriquer et remplacer les sons du jeu.

  python tools/son/atelier.py            puis ouvrir http://localhost:8791
  python tools/son/atelier.py --port 8800

La page (tools/son/atelier.html) fait tout le travail du son dans le navigateur (synthèse,
coupe, « rendre juicy » : punch, grave, couche sourde, claquement, écho, fondu) et envoie le
résultat ici en WAV. Ce serveur ne fait que :
  - lister les sons que le jeu demande (playSfx dans src/) et ceux déjà rangés (AUDIO_SFX) ;
  - chercher sur Openverse (CC0 seulement, via openverse.py) et servir les aperçus ;
  - ranger un son : WAV -> assets/audio/sfx/<id>.ogg (FFmpeg), ligne dans assets/audio/CREDITS.md,
    entrée dans src/data/audio_sfx.js (avec un numéro `v` : le jeu ne ressort pas l'ancien son
    de la mémoire du navigateur) ;
  - enregistrer les réglages de jeu (volume, variation de hauteur, écart minimal).
Après un changement : recharger la page du jeu.
"""
import argparse
import base64
import json
import mimetypes
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import openverse as ov  # noqa: E402  (même dossier ; règles CC0 et registre partagés)

RACINE = ov.RACINE
ICI = Path(__file__).resolve().parent
SFX = RACINE / "assets" / "audio" / "sfx"
DONNEES = RACINE / "src" / "data" / "audio_sfx.js"
CACHE = Path(tempfile.gettempdir()) / "agarica_son" / "apercus"

ENTETE = """// Sons du jeu : identifiant `playSfx` -> fichiers de assets/audio/ (cf. SON_OUTILS.md, skill `son`).
// ÉCRIT par l'atelier des sons (python tools/son/atelier.py) ; on peut aussi le modifier à la main.
// Chaque son listé ici a sa ligne dans assets/audio/CREDITS.md. Le moteur (SFX_HOOKS['*'], LevelKit)
// joue un de ses fichiers au hasard, avec une légère variation de hauteur (guide gamedev « audio-design »).
//   id: { files: ['assets/audio/sfx/<id>.ogg', ...], volume: 0..1, pitch: écart de vitesse (0,05 = ±5 %),
//         cooldownMs: écart minimal entre deux lectures, v: numéro de version (cache du navigateur) }
"""

# Noms lisibles des sons les plus courants (les autres : leur identifiant).
NOMS = {
    "ours_slam": "Ours brun : fracas au sol", "owlbear_slam": "Ours-hibou : fracas au sol",
    "grizzly_crash": "Grizzly : choc de la charge", "ice_spike": "Ours polaire : pics de glace",
    "panda_heal": "Panda : soin", "jump": "Saut", "jump_air": "Double saut", "land": "Atterrissage",
    "slash": "Coup d'épée", "player_hurt": "Agarica touchée", "pickup": "Ramasser", "menu_move": "Menu : déplacer",
    "menu_ok": "Menu : valider", "heart_lost": "Cœur perdu", "heart_up": "Cœur gagné", "chest_open": "Coffre",
    "skill_denied": "Compétence refusée", "energy_full": "Énergie pleine", "dialogue_blip": "Dialogue : lettres",
}


# ----------------------------------------------------------------------------- AUDIO_SFX
def lire_sfx():
    if not DONNEES.exists():
        return {}
    s = DONNEES.read_text(encoding="utf-8")
    m = re.search(r"const AUDIO_SFX = (\{.*\});", s, re.S)
    if not m:
        return {}
    corps = m.group(1)
    corps = re.sub(r"//[^\n]*", "", corps)
    corps = re.sub(r"'([^']*)'", lambda x: json.dumps(x.group(1)), corps)
    corps = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', corps)
    corps = re.sub(r",(\s*[}\]])", r"\1", corps)
    return json.loads(corps)


def ecrire_sfx(d):
    lignes = [f"  {json.dumps(k)}: {json.dumps(d[k], ensure_ascii=False)}," for k in sorted(d)]
    DONNEES.write_text(ENTETE + "const AUDIO_SFX = {\n" + "\n".join(lignes) + "\n};\n", encoding="utf-8")


def ids_du_jeu():
    """Les identifiants que le code demande (playSfx('…')), plus ceux déjà rangés."""
    vus = set()
    for f in (RACINE / "src").rglob("*.js"):
        for m in re.finditer(r"playSfx\(\s*['\"`]([a-z0-9_]+)['\"`]", f.read_text(encoding="utf-8", errors="replace")):
            vus.add(m.group(1))
    vus.add("owlbear_slam")       # demandé par une condition (Player.js), pas par un texte
    return vus | set(lire_sfx())


# ----------------------------------------------------------------------------- Openverse
def detail(ident):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / f"{ident}.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    r, _ = ov.appel(ov.API + urllib.parse.quote(ident) + "/")
    if str(r.get("license", "")).lower() != "cc0":
        raise ValueError("ce son n'est pas CC0 : il n'entre pas dans le jeu")
    f.write_text(json.dumps(r), encoding="utf-8")
    return r


def apercu(ident):
    """Le fichier du son (aperçu ogg de Freesound si possible), gardé en cache."""
    for f in CACHE.glob(f"{ident}.audio.*"):
        return f
    r = detail(ident)
    url = r.get("url") or ""
    if not url.startswith("https://"):
        raise ValueError("pas de fichier téléchargeable")
    CACHE.mkdir(parents=True, exist_ok=True)
    if ov.APERCU_FREESOUND.match(url):
        f = CACHE / f"{ident}.audio.ogg"
        if ov.recevoir(url[:-4] + ".ogg", f):
            return f
    ext = re.sub(r"[^a-z0-9]", "", str(r.get("filetype") or "mp3").lower())[:5] or "mp3"
    f = CACHE / f"{ident}.audio.{ext}"
    if not ov.recevoir(url, f):
        raise ValueError("le fichier ne répond pas")
    return f


def chercher(q, court):
    params = {"q": q, "license": "cc0", "page_size": 20}
    if court:
        params["length"] = "shortest"
    data, reste = ov.appel(ov.API + "?" + urllib.parse.urlencode(params))
    res = [{"id": r["id"], "titre": r.get("title") or "?", "auteur": r.get("creator") or "?",
            "duree": (r.get("duration") or 0) / 1000, "source": r.get("source") or "?"}
           for r in data.get("results", [])]
    return {"resultats": res, "reste": reste}


# ----------------------------------------------------------------------------- ranger
def ranger(m):
    ident = m["id"]
    if not re.fullmatch(r"[a-z0-9_]+", ident):
        raise ValueError("identifiant invalide")
    d = lire_sfx()
    entree = d.get(ident) or {"files": [], "volume": 0.8, "pitch": 0.05}
    SFX.mkdir(parents=True, exist_ok=True)
    src = m.get("source") or {}
    origine = None
    if src.get("type") == "retouche":
        # un son du jeu retouché : on garde l'origine écrite sur sa ligne du registre
        for l in ov.lire_registre():
            if l.startswith(f"| `{src.get('fichier')}` |"):
                origine = [c.strip() for c in l.strip().strip("|").split("|")]
        if not origine or len(origine) < 6:
            raise ValueError("origine de ce son introuvable dans CREDITS.md")
    if m.get("mode") == "variante" and entree["files"]:
        n = 2
        while (SFX / f"{ident}_{n}.ogg").exists():
            n += 1
        cible = SFX / f"{ident}_{n}.ogg"
    else:
        cible = SFX / f"{ident}.ogg"
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "son.wav"
        wav.write_bytes(base64.b64decode(m["wav"]))
        sortie = Path(tmp) / "son.ogg"
        p = subprocess.run([ov.ffmpeg(), "-v", "error", "-y", "-nostdin", "-i", str(wav), "-map_metadata", "-1",
                            "-c:a", "libvorbis", "-q:a", "6", str(sortie)], capture_output=True, text=True, errors="replace")
        if p.returncode != 0:
            raise ValueError("FFmpeg : " + (p.stderr.strip().splitlines() or ["?"])[-1])
        if m.get("mode") != "variante":
            # remplacer : les anciens fichiers de ce son et leurs lignes du registre partent
            for vieux in entree["files"]:
                f = RACINE / vieux
                if f.exists() and ov.dans_bibliotheque(f):
                    f.unlink()
                ov.ecrire_registre(ov.sans_ligne(ov.lire_registre(), ov.chemin_relatif(f)))
            entree["files"] = []
        cible.write_bytes(sortie.read_bytes())
    retouche = m.get("retouche") or ""
    if origine:
        _, titre, auteur, licence, source, page = origine[:6]
        ov.inscrire(cible, titre, auteur, licence, source, f"{page.split(' ; retouché')[0]} ; retouché dans l'atelier : {retouche}")
    elif src.get("type") == "openverse":
        r = detail(src["ref"])
        ov.inscrire(cible, r.get("title"), r.get("creator"), "CC0 1.0", f"Openverse / {r.get('source', '?')}",
                    f"{r.get('foreign_landing_url') or r.get('detail_url')} ; retouché dans l'atelier : {retouche}")
    else:
        ov.inscrire(cible, f"synthèse « {src.get('nom', '?')} »", "projet", "original", "atelier des sons (synthèse)",
                    f"{src.get('reglages', '')} ; retouche : {retouche}")
    rel = ov.chemin_relatif(cible)
    if rel not in entree["files"]:
        entree["files"].append(rel)
    entree["v"] = int(time.time())
    d[ident] = entree
    ecrire_sfx(d)
    return {"ok": True, "fichier": rel}


def reglages(m):
    d = lire_sfx()
    if m["id"] not in d:
        raise ValueError("ce son n'a pas encore de fichier")
    e = d[m["id"]]
    for k, lo, hi in (("volume", 0, 1.5), ("pitch", 0, 0.5), ("cooldownMs", 0, 2000)):
        if k in m:
            e[k] = round(min(hi, max(lo, float(m[k]))), 3)
    ecrire_sfx(d)
    return {"ok": True}


def retirer(m):
    d = lire_sfx()
    e = d.get(m["id"])
    if not e or m["fichier"] not in e["files"]:
        raise ValueError("fichier inconnu")
    f = RACINE / m["fichier"]
    if f.exists() and ov.dans_bibliotheque(f):
        f.unlink()
    ov.ecrire_registre(ov.sans_ligne(ov.lire_registre(), m["fichier"]))
    e["files"].remove(m["fichier"])
    if e["files"]:
        e["v"] = int(time.time())
    else:
        del d[m["id"]]
    ecrire_sfx(d)
    return {"ok": True}


# ----------------------------------------------------------------------------- serveur
class Atelier(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def envoyer(self, code, corps, type_="application/json; charset=utf-8"):
        if isinstance(corps, (dict, list)):
            corps = json.dumps(corps, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", type_)
        self.send_header("Content-Length", str(len(corps)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corps)

    def erreur(self, e):
        msg = str(e.code if isinstance(e, SystemExit) else e)
        self.envoyer(400, {"erreur": msg.removeprefix("openverse: ")})

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        try:
            if u.path in ("/", "/atelier.html"):
                return self.envoyer(200, (ICI / "atelier.html").read_bytes(), "text/html; charset=utf-8")
            if u.path == "/api/etat":
                d = lire_sfx()
                ordre = list(NOMS)   # les ours d'abord, puis les sons courants, puis le reste par nom
                ids = sorted(ids_du_jeu(), key=lambda i: (ordre.index(i) if i in NOMS else len(ordre), i))
                return self.envoyer(200, {"sons": [{"id": i, "nom": NOMS.get(i, i), "def": d.get(i)} for i in ids]})
            if u.path == "/api/chercher":
                return self.envoyer(200, chercher(q.get("q", [""])[0], q.get("court", ["1"])[0] == "1"))
            if u.path.startswith("/api/apercu/"):
                f = apercu(u.path.rsplit("/", 1)[1])
                return self.envoyer(200, f.read_bytes(), mimetypes.guess_type(f.name)[0] or "audio/ogg")
            if u.path.startswith("/jeu/assets/"):
                f = (RACINE / urllib.parse.unquote(u.path[len("/jeu/"):])).resolve()
                if not f.is_relative_to(RACINE / "assets") or not f.is_file():
                    return self.envoyer(404, {"erreur": "introuvable"})
                return self.envoyer(200, f.read_bytes(), mimetypes.guess_type(f.name)[0] or "application/octet-stream")
            self.envoyer(404, {"erreur": "introuvable"})
        except (Exception, SystemExit) as e:
            self.erreur(e)

    def do_POST(self):
        try:
            m = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8"))
            action = {"/api/ranger": ranger, "/api/reglages": reglages, "/api/retirer": retirer}.get(self.path)
            if not action:
                return self.envoyer(404, {"erreur": "introuvable"})
            self.envoyer(200, action(m))
        except (Exception, SystemExit) as e:
            self.erreur(e)


def main():
    for flux in (sys.stdout, sys.stderr):
        if hasattr(flux, "reconfigure"):
            flux.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Atelier des sons du jeu")
    ap.add_argument("--port", type=int, default=8791)
    a = ap.parse_args()
    print(f"Atelier des sons : http://localhost:{a.port}  (Ctrl+C pour arrêter)")
    ThreadingHTTPServer(("127.0.0.1", a.port), Atelier).serve_forever()


if __name__ == "__main__":
    main()
