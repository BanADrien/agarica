#!/usr/bin/env python3
"""Serveur de dev local pour l'éditeur de niveau (index.html?editor), avec
auto-écriture des zones dans le vrai projet.

Retour utilisateur : "enregistre les a la place des actuel quand je fais
enregistrer comme une actualisation tu peux pas faire ça ?" -- une page web
ne peut JAMAIS écrire de fichiers sur le disque toute seule (sécurité
navigateur -- et l'utilisateur a déjà explicitement refusé
`showDirectoryPicker` plus tôt dans ce projet, cf. EditorScene.js). Mais CE
script, lui, tourne sur la machine de l'utilisateur et a donc un accès
disque normal : lancé à la place de `python -m http.server`, il sert les
fichiers exactement pareil, PLUS une route `POST /__save_zone` que le
bouton "Enregistrer" de l'éditeur appelle en plus du brouillon IndexedDB
habituel (gardé tel quel comme repli, cf. EditorScene.exportLevel). Cette
route écrit les vrais fichiers `src/data/<nom>_data.js` + `src/scenes/
<Nom>Scene.js` (même format que `EditorScene.buildZoneFiles`, utilisé par
le bouton "Télécharger pour le projet") et les câble dans index.html/
main.js -- l'équivalent du téléchargement + copier-coller à la main, fait
automatiquement à chaque sauvegarde.

Garde-fous (zones de l'histoire écrites à la main) : la scène n'est créée
que si elle n'existe pas encore (jamais réécrite) ; un fichier de données
existant est d'abord copié dans src/data/_backup/ (horodaté), la sauvegarde
est refusée si une de ses clés de premier niveau manque dans les données
envoyées, et seule l'instruction `const NOM_DATA = {...};` est remplacée.

Usage (à la place de `python -m http.server`) :

    python tools/dev_server.py [port, défaut 8791]

Sans ce serveur (fichier local, ou `python -m http.server` classique), le
jeu continue de fonctionner tel quel : l'appel fetch() côté client échoue
silencieusement et seul le brouillon IndexedDB (comportement d'avant) est
mis à jour -- rien de cassé, juste pas d'auto-écriture.

Une zone TOUTE NEUVE (jamais câblée avant) a besoin d'un rafraîchissement
de la page après CETTE PREMIÈRE sauvegarde pour que les nouvelles balises
<script> soient chargées (une balise <script> n'est lue qu'au chargement de
la page, jamais après coup) -- les sauvegardes SUIVANTES sur cette même
zone n'en ont plus besoin (`resolveZoneData` lit déjà l'IndexedDB en
priorité, cf. LevelKit.js -- déjà "live" sans rien de plus dès que la zone
a sa scène réelle une première fois).
"""
import http.server
import json
import re
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML = REPO_ROOT / 'index.html'
MAIN_JS = REPO_ROOT / 'src' / 'main.js'
DATA_DIR = REPO_ROOT / 'src' / 'data'
SCENES_DIR = REPO_ROOT / 'src' / 'scenes'
# Copies de sécurité des fichiers de données AVANT chaque écrasement (cf.
# write_data_file) -- les zones de l'histoire sont écrites à la main
# (commentaires, helpers groundRow...) et l'éditeur ne sait réécrire que du
# JSON : on ne perd jamais l'original. Les N plus récentes par zone sont gardées.
BACKUP_DIR = DATA_DIR / '_backup'
BACKUPS_KEPT_PER_ZONE = 20


def sanitize_level_name(raw):
    # Même recette que EditorScene.sanitizeLevelName côté client -- ce
    # serveur tourne en local pour l'auteur du projet, pas exposé, mais
    # autant éviter un nom qui produirait un chemin de fichier absurde.
    s = re.sub(r'[^a-z0-9]+', '_', (raw or '').strip().lower()).strip('_')
    if not s:
        s = 'level'
    if s[0].isdigit():
        s = f'level_{s}'
    return s


def to_pascal_case(snake_name):
    return ''.join(part[:1].upper() + part[1:] for part in snake_name.split('_') if part)


def build_zone_files(safe_name, data):
    # Même format que EditorScene.buildZoneFiles (JS) -- une zone câblée
    # par ce serveur doit être indiscernable d'une zone téléchargée puis
    # collée à la main.
    const_name = f'{safe_name.upper()}_DATA'
    scene_class = f'{to_pascal_case(safe_name)}Scene'
    data_content = f'const {const_name} = {json.dumps(data, indent=2, ensure_ascii=False)};\n'
    scene_content = (
        f"class {scene_class} extends Phaser.Scene {{\n"
        f"  constructor() {{\n    super('{scene_class}');\n  }}\n\n"
        f"  create(sceneData) {{\n"
        f"    resolveZoneData('{safe_name}', {const_name}).then((data) => buildLevelFromData(this, data, sceneData));\n"
        f"  }}\n\n"
        f"  update(time, delta) {{\n    updateLevelFromData(this, time, delta);\n  }}\n}}\n"
    )
    return const_name, scene_class, data_content, scene_content


def _skip_string_or_comment(src, i):
    """Si `src[i]` ouvre une chaîne ('"`) ou un commentaire (// /*), renvoie
    l'index juste après sa fin ; sinon None. Suffisant pour les fichiers de
    zone (pas de regex littérales dans ces fichiers)."""
    c = src[i]
    if c in '\'"`':
        j = i + 1
        while j < len(src):
            if src[j] == '\\':
                j += 2
                continue
            if src[j] == c:
                return j + 1
            j += 1
        return len(src)
    if src.startswith('//', i):
        j = src.find('\n', i)
        return len(src) if j < 0 else j + 1
    if src.startswith('/*', i):
        j = src.find('*/', i + 2)
        return len(src) if j < 0 else j + 2
    return None


def find_const_object_span(src, const_name):
    """(début, fin) de l'instruction `const NOM = { ... };` dans un fichier
    de zone (fin = après le `;` éventuel), ou None si introuvable."""
    m = re.search(rf'(^|\n)\s*const\s+{re.escape(const_name)}\s*=\s*', src)
    if not m:
        return None
    start = m.start() if m.group(1) == '' else m.start() + 1
    i = m.end()
    if i >= len(src) or src[i] != '{':
        return None
    depth = 0
    while i < len(src):
        skipped = _skip_string_or_comment(src, i)
        if skipped is not None:
            i = skipped
            continue
        c = src[i]
        if c in '{[(':
            depth += 1
        elif c in '}])':
            depth -= 1
            if depth == 0:
                end = i + 1
                k = end
                while k < len(src) and src[k] in ' \t':
                    k += 1
                if k < len(src) and src[k] == ';':
                    end = k + 1
                return start, end
        i += 1
    return None


def top_level_keys(src, span):
    """Clés de premier niveau de l'objet littéral `src[span]` (identifiants
    ou chaînes suivis de ':' , ou raccourcis `{ a, b }`). Sert de garde-fou :
    une sauvegarde ne doit jamais faire disparaître une clé du fichier."""
    start, end = span
    i = src.index('{', start)
    keys = []
    depth = 0
    prev_sig = ''
    while i < end:
        skipped = _skip_string_or_comment(src, i)
        if skipped is not None:
            if depth == 1 and prev_sig in '{,' and src[i] in '\'"':
                # Clé entre guillemets : 'nom': ...
                k = skipped
                while k < end and src[k] in ' \t\r\n':
                    k += 1
                if k < end and src[k] == ':':
                    keys.append(src[i + 1:skipped - 1])
            if src[i] in '\'"`':
                prev_sig = 's'
            i = skipped
            continue
        c = src[i]
        if c in ' \t\r\n':
            i += 1
            continue
        if c in '{[(':
            depth += 1
            prev_sig = c
            i += 1
            continue
        if c in '}])':
            depth -= 1
            prev_sig = c
            i += 1
            continue
        if depth == 1 and prev_sig in '{,' and (c.isalpha() or c in '_$'):
            j = i
            while j < end and (src[j].isalnum() or src[j] in '_$'):
                j += 1
            k = j
            while k < end and src[k] in ' \t\r\n':
                k += 1
            if k < end and src[k] in ':,}':
                keys.append(src[i:j])
            prev_sig = 'i'
            i = j
            continue
        prev_sig = c
        i += 1
    return keys


def backup_file(path, safe_name):
    """Copie `path` dans src/data/_backup/<nom>_data.<horodatage>.js.bak et
    ne garde que les BACKUPS_KEPT_PER_ZONE plus récentes de cette zone."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime('%Y%m%d-%H%M%S')
    dest = BACKUP_DIR / f'{safe_name}_data.{stamp}.js.bak'
    n = 1
    while dest.exists():
        n += 1
        dest = BACKUP_DIR / f'{safe_name}_data.{stamp}-{n}.js.bak'
    dest.write_bytes(path.read_bytes())
    olds = sorted(BACKUP_DIR.glob(f'{safe_name}_data.*.js.bak'), key=lambda p: p.stat().st_mtime)
    for old in olds[:-BACKUPS_KEPT_PER_ZONE]:
        old.unlink()
    return dest


def write_data_file(path, safe_name, const_name, data, force=False):
    """Écrit le fichier de données de la zone en toute sécurité :
    - fichier absent : créé (format JSON de l'éditeur) ;
    - fichier présent : refus si une clé de premier niveau du fichier manque
      dans `data` (sauf `force`), copie de sécurité horodatée, puis SEULE
      l'instruction `const NOM_DATA = {...};` est remplacée -- commentaires
      d'en-tête et constantes annexes (ex. ZONE3_SURFACE_Y) restent en place.
    Renvoie (écrit: bool, chemin_backup | None)."""
    json_literal = json.dumps(data, indent=2, ensure_ascii=False)
    statement = f'const {const_name} = {json_literal};'
    if not path.exists():
        path.write_text(statement + '\n', encoding='utf-8')
        return True, None
    original = path.read_text(encoding='utf-8')
    span = find_const_object_span(original, const_name)
    if span is not None:
        # `exit` (ancien format singulier) est converti en `exits` par l'éditeur.
        missing = [k for k in top_level_keys(original, span)
                   if k not in data and not (k == 'exit' and 'exits' in data)]
        if missing and not force:
            raise RuntimeError(
                f'Sauvegarde refusée : ces clés de {path.name} manquent dans les données envoyées '
                f'(elles seraient perdues) : {", ".join(missing)}')
        updated = original[:span[0]] + statement + original[span[1]:]
    else:
        updated = statement + '\n'
    if updated == original:
        return False, None
    backup = backup_file(path, safe_name)
    path.write_text(updated, encoding='utf-8')
    return True, backup


def insert_after_last_match(html, pattern, insertion):
    matches = list(re.finditer(pattern, html))
    if not matches:
        return None
    end = matches[-1].end()
    return html[:end] + insertion + html[end:]


def ensure_script_tags(data_src, scene_src):
    html = INDEX_HTML.read_text(encoding='utf-8')
    changed = False
    if f'src="{data_src}"' not in html:
        updated = insert_after_last_match(html, r'  <script src="src/data/[^"]+"></script>\n', f'  <script src="{data_src}"></script>\n')
        if updated is None:
            raise RuntimeError('No existing "src/data/*.js" script tag found in index.html to anchor the insertion.')
        html = updated
        changed = True
    if f'src="{scene_src}"' not in html:
        marker = '  <script src="src/main.js"></script>\n'
        if marker not in html:
            raise RuntimeError('Could not find the src/main.js script tag in index.html to anchor the insertion.')
        html = html.replace(marker, f'  <script src="{scene_src}"></script>\n{marker}')
        changed = True
    if changed:
        INDEX_HTML.write_text(html, encoding='utf-8')
    return changed


def ensure_scene_registered(scene_class):
    js = MAIN_JS.read_text(encoding='utf-8')
    if re.search(rf'\b{re.escape(scene_class)}\b', js):
        return False
    marker = '    EditorScene, PlaytestScene,\n'
    if marker not in js:
        raise RuntimeError('Could not find the "EditorScene, PlaytestScene," line in main.js to anchor the insertion.')
    js = js.replace(marker, f'    {scene_class},\n{marker}')
    MAIN_JS.write_text(js, encoding='utf-8')
    return True


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def log_message(self, format, *args):  # noqa: A002 -- signature imposée par la classe parent
        if self.path != '/__save_zone':
            super().log_message(format, *args)

    def do_POST(self):
        if self.path != '/__save_zone':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length))
            safe_name = sanitize_level_name(payload['name'])
            data = payload['data']

            if not isinstance(data, dict):
                raise RuntimeError('données de zone invalides (objet attendu)')

            const_name, scene_class, _data_content, scene_content = build_zone_files(safe_name, data)
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            SCENES_DIR.mkdir(parents=True, exist_ok=True)
            data_rel = f'src/data/{safe_name}_data.js'
            scene_rel = f'src/scenes/{scene_class}.js'
            data_written, backup = write_data_file(
                REPO_ROOT / data_rel, safe_name, const_name, data, force=bool(payload.get('force')))
            # Scène : créée SEULEMENT si absente -- une scène existante peut
            # contenir une logique spécifique (Zone4Scene, Zone2Scene...) que
            # le gabarit générique effacerait.
            scene_path = REPO_ROOT / scene_rel
            scene_created = not scene_path.exists()
            if scene_created:
                scene_path.write_text(scene_content, encoding='utf-8')

            newly_wired = ensure_script_tags(data_rel, scene_rel)
            newly_wired = ensure_scene_registered(scene_class) or newly_wired

            backup_rel = backup.relative_to(REPO_ROOT).as_posix() if backup else None
            print(f'[dev_server] {data_rel}: ' + ('écrit' if data_written else 'inchangé')
                  + (f' (copie de sécurité : {backup_rel})' if backup_rel else '')
                  + (f' ; scène créée : {scene_rel}' if scene_created else '')
                  + (' (nouvelle zone câblée, recharger la page une fois)' if newly_wired else ''))
            body = json.dumps({
                'ok': True, 'sceneClass': scene_class, 'newlyWired': newly_wired,
                'dataWritten': data_written, 'backup': backup_rel, 'sceneCreated': scene_created,
            }).encode('utf-8')
        except Exception as e:  # noqa: BLE001 -- renvoyer l'erreur au client plutôt que planter le serveur
            print(f'[dev_server] /__save_zone failed: {e}')
            body = json.dumps({'ok': False, 'error': str(e)}).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    # ThreadingHTTPServer (pas un simple http.server.HTTPServer / TCPServer
    # mono-thread) : la page charge ~20 balises <script> quasi en parallèle
    # au démarrage -- un serveur mono-thread ne pouvait en servir qu'une à
    # la fois, provoquant des ERR_CONNECTION_REFUSED sur certaines une fois
    # la file d'attente TCP saturée ("BootScene is not defined" observé en
    # test : ce script précis n'avait simplement jamais fini de charger).
    # `python -m http.server` (le serveur qu'il remplace) utilise déjà
    # ThreadingHTTPServer en interne depuis Python 3.7 -- aligné ici pour de
    # bon, pas juste une rustine.
    with http.server.ThreadingHTTPServer(('', port), Handler) as httpd:
        print(f'Serveur de dev (auto-écriture des zones activée) : http://localhost:{port}/index.html?editor')
        httpd.serve_forever()
