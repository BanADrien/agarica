"""Aller-retour ouvrir -> enregistrer de TOUTES les zones, dans un dossier d'essai."""
import json, os, sys, filecmp, glob, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h
PORT = 9782
LISTE = r"""(() => Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src').split('?')[0])
  .filter(s => /^src\/data\/.+_data\.js$/.test(s)).map(s => s.replace(/^src\/data\//,'').replace(/_data\.js$/,''))
  .filter(n => { try { return (new Function('return typeof ' + n.toUpperCase() + '_DATA !== "undefined"'))(); } catch (e) { return false; } }))()"""
ENREG = r"""async (zone) => {
  const C = zone.toUpperCase() + '_DATA';
  const data = (new Function('return ' + C))();
  const v = EditeurEcriture.verifier(C, data);
  if (v.erreur) return { zone, etape: 'ecriture', erreur: v.erreur };
  const post = async (corps) => (await fetch('/__editeur/enregistrer', { method: 'POST', body: JSON.stringify(corps) })).json();
  const essai = await post({ zone, instruction: v.texte, essai: true });
  if (!essai.ok) return { zone, etape: 'essai', erreur: essai.erreur };
  let relu;
  try { relu = EditeurEcriture.evaluer(essai.texte, C); } catch (e) { return { zone, etape: 'relecture', erreur: String(e) }; }
  const d = EditeurEcriture.difference(data, relu);
  if (d) return { zone, etape: 'comparaison', erreur: d };
  const r = await post({ zone, instruction: v.texte });
  if (!r.ok) return { zone, etape: 'enregistrement', erreur: r.erreur };
  return { zone, ok: true, ecrit: r.ecrit, secours: r.secours, json: JSON.stringify(data), lignes: v.texte.split('\n').length };
}"""
RELIRE = r"""([zone, avant]) => {
  const C = zone.toUpperCase() + '_DATA';
  const data = (new Function('return ' + C))();
  return EditeurEcriture.difference(JSON.parse(avant), data) || (JSON.stringify(data) === avant ? null : 'JSON différent');
}"""
with h.serveur_essai(PORT) as d:
    res = []
    with h.session(port=PORT, query='muet', server=False) as (page, errors, logs):
        page.add_script_tag(url='/src/editeur/ecriture.js')
        zones = page.evaluate(LISTE)
        for z in zones:
            res.append(page.evaluate(ENREG, z))
        e1 = list(errors)
    bad = [r for r in res if not r.get('ok')]
    print(f'{len(zones)} zones ; enregistrées : {sum(1 for r in res if r.get("ok"))} ; refusées : {len(bad)}')
    for r in bad: print('  REFUS', r)
    # Relecture : la page recharge les fichiers ÉCRITS (servis depuis le dossier d'essai).
    with h.session(port=PORT, query='muet', server=False) as (page, errors, logs):
        page.add_script_tag(url='/src/editeur/ecriture.js')
        diffs = {r['zone']: page.evaluate(RELIRE, [r['zone'], r['json']]) for r in res if r.get('ok')}
        e2 = list(errors)
    pb = {k: v for k, v in diffs.items() if v}
    print(f'relecture après rechargement : {len(diffs) - len(pb)}/{len(diffs)} zones strictement égales', pb or '')
    # Copies de secours : une par zone écrite, identique au fichier d'origine.
    ok_b = 0
    for r in res:
        if not r.get('ecrit'): continue
        b = r['secours']
        src = os.path.join(h.ROOT, 'src', 'data', r['zone'] + '_data.js')
        if os.path.isfile(b) and filecmp.cmp(b, src, shallow=False): ok_b += 1
        else: print('  SECOURS MANQUANT OU DIFFERENT', r['zone'], b)
    print(f'copies de secours identiques à l\'original : {ok_b}/{sum(1 for r in res if r.get("ecrit"))}')
    print('erreurs JS :', e1 + e2)
    print('lignes écrites :', {r['zone']: r['lignes'] for r in res if r.get('ok')})
print('src/data intact :', subprocess.run(['git', 'status', '--porcelain', 'src/data'], capture_output=True, text=True, cwd=h.ROOT).stdout.strip() or 'oui (aucun changement git)')
