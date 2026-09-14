import json, os, csv
S=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(S,'presencas.json')))
ORDEM=['2025-10 OUT/2025','2025-12 DEZ/2025','2026-03 MAR/2026','2026-04 ABR/2026','2026-08 AGO/2026']
SESS={'2025-10 OUT/2025':2,'2025-12 DEZ/2025':7,'2026-03 MAR/2026':7,'2026-04 ABR/2026':8,'2026-08 AGO/2026':8}
rows=[]
for nome,meses in d.items():
    p=sum(meses[m][0] for m in meses)
    disp=sum(SESS[m] for m in meses)
    r={'nome':nome,'presencas_total':p,'sessoes_disponiveis':disp,
       'taxa_global_pct':round(p/disp*100) if disp else 0,
       'meses_com_presenca':sum(1 for m in meses if meses[m][0]>0)}
    for m in ORDEM:
        tag=m.split()[1].replace('/','_')
        r[f'{tag}_presencas']=meses[m][0] if m in meses else ''
        r[f'{tag}_taxa_pct']=meses[m][1] if m in meses else ''
    rows.append(r)
rows.sort(key=lambda r:(-r['presencas_total'],-r['taxa_global_pct'],r['nome']))
out=os.path.join(os.environ['W'],'dados','frequencia-consolidada.csv')
with open(out,'w',newline='',encoding='utf-8') as fh:
    w=csv.DictWriter(fh,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(out, len(rows),'linhas')
