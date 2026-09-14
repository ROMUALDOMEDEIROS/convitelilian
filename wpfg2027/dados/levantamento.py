import re, os, csv, json
from collections import defaultdict

W = '/home/user/convitelilian/wpfg2027/dados'
MESES = [  # (arquivo, rotulo, ordem)
 ('frequencia-2025-10-outubro.txt',  'OUT/2025'),
 ('frequencia-2025-11-novembro.txt', 'NOV/2025'),
 ('frequencia-2025-12-dezembro.txt', 'DEZ/2025'),
 ('frequencia-2026-03-marco.txt',    'MAR/2026'),
 ('frequencia-2026-04-abril.txt',    'ABR/2026'),
 ('frequencia-2026-08-agosto.txt',   'AGO/2026'),
]
linha_re = re.compile(r'^(?P<nome>\S.*?\S)\s{2,}(?P<meio>.*?)(?P<taxa>\d+)%\s*$')

reg = defaultdict(dict)   # nome -> mes -> (P, taxa)
sessoes = {}
for arq, mes in MESES:
    maxs = 0
    for ln in open(os.path.join(W, arq), encoding='utf-8'):
        m = linha_re.match(ln.rstrip('\n'))
        if not m: continue
        nome = m.group('nome').strip()
        if 'Athlete' in nome or 'Taxa' in nome or not re.match(r'^[A-Za-zÀ-ÿ]', nome): continue
        p = len(re.findall(r'\bP\b', m.group('meio')))
        taxa = int(m.group('taxa'))
        reg[nome][mes] = (p, taxa)
        if taxa: maxs = max(maxs, round(p*100/taxa))
    sessoes[mes] = maxs

ordem = [m for _, m in MESES]
TOTAL = sum(sessoes[m] for m in ordem)
print("SESSOES POR MES (deduzidas da propria taxa da planilha):")
for m in ordem: print(f"   {m}: {sessoes[m]:>2} sessoes   ({sum(1 for v in reg.values() if m in v)} nomes na folha, "
                      f"{sum(1 for v in reg.values() if v.get(m,(0,))[0]>0)} com presenca)")
print(f"   TOTAL: {TOTAL} sessoes documentadas\n")

rows = []
for nome, mm in reg.items():
    p = sum(mm[m][0] for m in mm)
    disp = sum(sessoes[m] for m in mm)          # so os meses em que o nome consta na folha
    r = {'nome': nome, 'presencas': p, 'sessoes_em_que_constava': disp,
         'frequencia_pct': round(p/disp*100) if disp else 0,
         'frequencia_sobre_total_pct': round(p/TOTAL*100),
         'meses_na_folha': len(mm),
         'meses_com_presenca': sum(1 for m in mm if mm[m][0] > 0)}
    for m in ordem:
        t = m.replace('/', '_')
        r[t+'_P'] = mm[m][0] if m in mm else ''
        r[t+'_pct'] = mm[m][1] if m in mm else ''
    rows.append(r)
rows.sort(key=lambda r: (-r['frequencia_pct'], -r['presencas'], r['nome']))

out = os.path.join(W, 'frequencia-consolidada.csv')
with open(out, 'w', newline='', encoding='utf-8') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
json.dump({'sessoes': sessoes, 'total': TOTAL}, open(os.path.join(W,'sessoes.json'),'w'), ensure_ascii=False, indent=1)
print(f"{len(rows)} atletas -> {out}")
com = [r for r in rows if r['presencas'] > 0]
print(f"{len(com)} com ao menos uma presenca / {len(rows)-len(com)} zerados\n")
print(f"{'#':>3}  {'FREQ':>5} {'PRES':>7} {'MESES':>6}  NOME")
for i, r in enumerate(com, 1):
    print(f"{i:>3}  {r['frequencia_pct']:>4}% {r['presencas']:>3}/{r['sessoes_em_que_constava']:<3} "
          f"{r['meses_com_presenca']}/{r['meses_na_folha']:<4}  {r['nome']}")
