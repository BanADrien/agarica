import sys, subprocess, time, json
from pathlib import Path
sys.path.insert(0,'tools/son'); import openverse as ov, atelier
M=Path('E:/sons/musique'); OUT=ov.RACINE/'assets'/'audio'/'musique'; OUT.mkdir(parents=True,exist_ok=True)
briefs={}
for p in sorted(Path('E:/sons/ace').glob('briefs*.json')):
    briefs.update(json.loads(p.read_text(encoding='utf8')))
CHOIX=json.loads(sys.argv[1])
d=atelier.lire_sfx(); ff=ov.ffmpeg()
for jid,(brief,graines,vol) in CHOIX.items():
    for f in (d.get(jid) or {}).get('files',[]):
        p=ov.RACINE/f
        if p.exists(): p.unlink()
        ov.ecrire_registre(ov.sans_ligne(ov.lire_registre(), f))
    files=[]
    for n,g in enumerate(graines):
        src=M/brief/f'{brief}_lm_{g}.wav'
        cible=OUT/(f'{jid}.ogg' if n==0 else f'{jid}_{n+1}.ogg')
        subprocess.run([ff,'-v','error','-y','-i',str(src),'-af','loudnorm=I=-20:TP=-2:LRA=11','-ar','44100','-map_metadata','-1','-c:a','libvorbis','-q:a','5',str(cible)],check=True)
        ov.inscrire(cible, f'musique g\u00e9n\u00e9r\u00e9e : \u00ab {briefs[brief]["caption"][:120]}\u2026 \u00bb', 'projet (ACE-Step 1.5)', 'MIT (mod\u00e8le), usage commercial permis', 'ACE-Step 1.5 (local)', f'E:/sons/ace/genere_musique.py, graine {g}, module de composition 1.7B')
        files.append(ov.chemin_relatif(cible))
    d[jid]={'files':files,'volume':vol,'pitch':0,'cooldownMs':0,'v':int(time.time())}
    print(jid, files)
atelier.ecrire_sfx(d)
