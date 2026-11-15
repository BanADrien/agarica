"""Sert le dossier du jeu en local SANS cache navigateur.

    python tools/serveur_sans_cache.py [port]        (8790 par défaut) -> http://localhost:8790/

Pourquoi : `python -m http.server` n'envoie aucune consigne de cache ; le navigateur garde alors
des heures un script qui n'avait pas bougé depuis longtemps, et un fichier modifié n'arrive pas
(2026-11-15 : la musique du menu ne démarrait pas, TitleScene.js venait du cache). Ici chaque
réponse porte `Cache-Control: no-store` : un simple rechargement reprend tout.
"""
import http.server
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    with http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler) as srv:
        print(f'Legend of Agarica : http://localhost:{port}/ (sans cache)', flush=True)
        srv.serve_forever()
