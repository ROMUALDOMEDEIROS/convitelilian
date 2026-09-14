import json, os
S=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(S,'presencas.json')))
ORDEM=['2025-10 OUT/2025','2025-12 DEZ/2025','2026-03 MAR/2026','2026-04 ABR/2026','2026-08 AGO/2026']
SESS={'2025-10 OUT/2025':2,'2025-12 DEZ/2025':7,'2026-03 MAR/2026':7,'2026-04 ABR/2026':8,'2026-08 AGO/2026':8}
TOT=sum(SESS.values())

linhas=[]
for nome,meses in d.items():
    p=sum(meses[m][0] for m in meses)
    # meses em que o atleta consta na lista
    disp=sum(SESS[m] for m in meses)
    meses_ativos=sum(1 for m in meses if meses[m][0]>0)
    linhas.append((p, p/disp*100 if disp else 0, meses_ativos, nome, {m:meses[m] for m in ORDEM if m in meses}))
linhas.sort(key=lambda x:(-x[0],-x[1],x[3]))

print(f"{'#':>3} {'PRESENÇAS':>9} {'TAXA':>6} {'MESES':>5}  NOME")
print(f"    (de {TOT} sessões registradas nos 5 meses enviados)")
print("-"*95)
for i,(p,t,ma,nome,det) in enumerate(linhas,1):
    if p==0: break
    print(f"{i:>3} {p:>9} {t:>5.0f}% {ma:>4}/5  {nome}")
n0=sum(1 for l in linhas if l[0]==0)
print("-"*95)
print(f"+ {n0} nomes com ZERO presença nos 5 meses enviados.")

print("\n\nDETALHE MÊS A MÊS (só quem tem ao menos 1 presença) — presenças/taxa")
print(f"{'NOME':<38} " + " ".join(f"{m.split()[1][:3]:>7}" for m in ORDEM))
for p,t,ma,nome,det in linhas:
    if p==0: break
    cel=[]
    for m in ORDEM:
        if m in det: cel.append(f"{det[m][0]}/{det[m][1]}%")
        else: cel.append("  --")
    print(f"{nome[:38]:<38} " + " ".join(f"{c:>7}" for c in cel))
