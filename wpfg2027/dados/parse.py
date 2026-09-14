import re, glob, os, json, unicodedata
from collections import defaultdict

MESES = {
 'de035647-2025_10':'2025-10 OUT/2025','e6d32edb-2025_12':'2025-12 DEZ/2025',
 '4c3cdd4c-2603':'2026-03 MAR/2026','d14e3d63-2604':'2026-04 ABR/2026',
 '0c3a4bff-2608':'2026-08 AGO/2026'}
ORDEM = ['2025-10 OUT/2025','2025-12 DEZ/2025','2026-03 MAR/2026','2026-04 ABR/2026','2026-08 AGO/2026']

S = os.path.dirname(os.path.abspath(__file__))
dados = defaultdict(dict)   # nome -> mes -> (presencas, taxa)
sessoes = {}

linha_re = re.compile(r'^(?P<nome>\S.*?\S)\s{2,}(?P<meio>.*?)(?P<taxa>\d+)%\s*$')

for f in glob.glob(os.path.join(S,'pdf','*.txt')):
    key = os.path.basename(f)[:-4]
    mes = MESES[key]
    maxp = 0
    for ln in open(f, encoding='utf-8'):
        ln = ln.rstrip('\n')
        m = linha_re.match(ln)
        if not m: continue
        nome = m.group('nome').strip()
        if 'Athlete' in nome or 'Taxa' in nome: continue
        if not re.match(r'^[A-Za-zÀ-ÿ]', nome): continue
        meio = m.group('meio')
        p = len(re.findall(r'\bP\b', meio))
        taxa = int(m.group('taxa'))
        dados[nome][mes] = (p, taxa)
        if taxa > 0:
            est = round(p*100/taxa)
            maxp = max(maxp, est)
    sessoes[mes] = maxp

print("SESSOES ESTIMADAS POR MES (denominador da taxa):")
for m in ORDEM: print(f"  {m}: ~{sessoes.get(m,'?')} sessoes")
print(f"\nTOTAL DE NOMES DISTINTOS: {len(dados)}")
for m in ORDEM:
    n = sum(1 for v in dados.values() if m in v)
    ativos = sum(1 for v in dados.values() if v.get(m,(0,0))[1] > 0)
    print(f"  {m}: {n} nomes na lista, {ativos} com ao menos 1 presenca")

json.dump({n:{m:list(v) for m,v in d.items()} for n,d in dados.items()},
          open(os.path.join(S,'presencas.json'),'w'), ensure_ascii=False, indent=1)
