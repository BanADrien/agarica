"""Prépare un prompt Codex à partir d'un document `docs/production/PROMPT_CODEX_<n>.md`, pour le
lancer sans fenêtre (`codex exec`), en ne gardant que certaines images du lot.

    python tools/codex_prompt.py 14 --images 1            -> prompt de la seule image n°1
    python tools/codex_prompt.py 14 --images 2 3 4        -> images 2, 3 et 4
    python tools/codex_prompt.py 14                       -> tout le lot

Le document doit suivre le gabarit des prompts n°12 à 14 : un bloc de code après le titre
« Prompt à coller dans Codex », des images numérotées « 1) chemin… », puis « À LA FIN ».
Le prompt est écrit dans le dossier temporaire du système ; son chemin est affiché.

Lancement (Codex de l'extension VS Code ; il utilise le compte et le quota de l'utilisateur) :
    codex exec -C <racine du jeu> --approve-for-me -o <fichier bilan> - < <prompt>
Un seul Codex à la fois sur le projet, jamais en même temps qu'une session Codex de VS Code.
"""
import argparse
import os
import re
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


def main():
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, 'reconfigure'):
            st.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lot')
    ap.add_argument('--images', nargs='*', type=int, default=[])
    a = ap.parse_args()
    doc = open(os.path.join(ROOT, 'docs', 'production', f'PROMPT_CODEX_{a.lot}.md'), encoding='utf-8').read().replace('\r\n', '\n')
    i = doc.index('## Prompt à coller dans Codex')
    m = re.search(r'```\n(.*?)\n```', doc[i:], re.S)
    if not m:
        sys.exit('bloc de prompt introuvable')
    prompt = m.group(1)
    # Découpe : en-tête (règles, références, blocs communs), images numérotées, fin.
    parts = re.split(r'(?m)^(?=\d+\) )', prompt)
    head, items = parts[0], parts[1:]
    tail = ''
    if items and 'À LA FIN' in items[-1]:
        last, tail = items[-1].split('À LA FIN', 1)
        items[-1] = last
        tail = 'À LA FIN' + tail
    nums = {int(re.match(r'(\d+)\)', it).group(1)): it for it in items}
    wanted = a.images or sorted(nums)
    missing = [n for n in wanted if n not in nums]
    if missing:
        sys.exit(f'images inconnues : {missing} (le lot a {sorted(nums)})')
    out = head
    if a.images:
        out += (f"ATTENTION : ne génère dans cette session QUE les images n°{', '.join(str(n) for n in wanted)} ci-dessous "
                f"(le lot en compte {len(nums)} ; les autres seront demandées plus tard). "
                "N'en génère aucune autre et ne touche à aucun autre fichier image.\n\n")
    out += ''.join(nums[n] for n in wanted)
    if a.images:
        out += ("\nÀ LA FIN\n- Lance l'import indiqué sous chaque image générée.\n"
                "- Ne fais ni commit ni push.\n"
                "- Termine par un bilan court en français : pour chaque image, le fichier écrit, sa taille en pixels, "
                "le nombre de frames trouvées à l'import, et tout problème rencontré. "
                "Si tu n'as pas pu générer une image (outil d'images indisponible dans ce mode), dis-le clairement.\n")
    else:
        out += tail + "\n- Ne fais ni commit ni push. Termine par un bilan court en français, image par image.\n"
    path = os.path.join(tempfile.gettempdir(), f"agarica_codex_{a.lot}_{'_'.join(str(n) for n in wanted) if a.images else 'tout'}.txt")
    open(path, 'w', encoding='utf-8', newline='\n').write(out)
    print(f'{path} ({len(out)} caractères, images {wanted})')


if __name__ == '__main__':
    main()
