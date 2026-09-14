import csv, os, json
W='/home/user/convitelilian/wpfg2027/dados'
rows={r['nome']:r for r in csv.DictReader(open(os.path.join(W,'frequencia-consolidada.csv'),encoding='utf-8'))}

# (ordem, nome na lista, faixa etaria, nome na folha, status do pareamento)
SEL=[
(1,'Gabriel Soares','30 a 34','Gabriel Vicente Soares','ok'),
(2,'Cézar','35 a 39','Cézar Souza Barbosa','ok'),
(3,'Da Cunha','35 a 39','Alexandre Tavares Da Cunha','presumido'),
(4,'Hugo Souza','35 a 39','Hugo Joseir Souza E Silva','ok'),
(5,'LINDOMAR','35 a 39','Jose Lindomar Neres Junior','ok'),
(6,'Mata','35 a 39',None,'ambiguo'),
(7,'Vinícius Peixoto','35 a 39','Vinicius Peixoto Teixeira','ok'),
(8,'Dantas','40 a 44','Fernando Dantas Santos','ok'),
(9,'Ezio','40 a 44','Ezio Fernandes Feitosa','ok'),
(10,'ROMUALDO','45 a 49','Romualdo Lima De Medeiros','ok'),
(11,'Uendel','45 a 49','Uendel Dourado Gomes','ok'),
(12,'G. Marques','50 a 54','Gilberto Marques Da Silva','ok'),
(13,'Joviano','55 a 59','Joviano Fernandes Borges','ok'),
(14,'Alecrim','60 a 64','Avanir De Alecrim Silva','ok'),
(15,'Dias','75 ou mais',None,'ambiguo'),
(16,'Daniele Coimbra','30 a 34','Daniele Coimbra Silva','ok'),
(17,'A. Cardoso','30 a 34','Andressa Cristina Cardoso Aguiar','ok'),
(18,'Flavia Meirelles','30 a 34','Flavia Meirelles De Souza','ok'),
(19,'Thalita Lima','30 a 34','Thalita Cabral Lima','ok'),
(20,'E. Ferreira','35 a 39','Ester Ferreira Santos','ok'),
(21,'Larissa Coqueiro','35 a 39','Larissa Rodrigues Coqueiro','ok'),
(22,'Ludmila','36 a 39','Ludmila Gualberto Andrade','ok'),
(23,'N. Cavalcanti','35 a 39','Natalia Cavalcanti Lopes Lima','ok'),
(24,'Sílvia','35 a 39','Sílvia De Araújo Jácomo','ok'),
(25,'Venturelli','35 a 39','Aline Venturelli Ferreira Antonio','ok'),
(26,'Ingrid','40 a 44','Ingrid Pereira Viana','ok'),
(27,'Josilene','50 a 54','Josilene De Sousa Santos','ok'),
(28,'Paula Dini','50 a 54','Paula Cristina De Deus Dini','ok'),
]
MES=[('OUT_2025','Out/25',2),('NOV_2025','Nov/25',8),('DEZ_2025','Dez/25',7),
     ('MAR_2026','Mar/26',7),('ABR_2026','Abr/26',8),('AGO_2026','Ago/26',8)]

saida=[]
for n,apelido,faixa,folha,st in SEL:
    if folha is None:
        saida.append(dict(n=n,apelido=apelido,faixa=faixa,folha='—',st=st,pct=None)); continue
    r=rows[folha]
    saida.append(dict(n=n,apelido=apelido,faixa=faixa,folha=folha,st=st,
                      pct=int(r['frequencia_pct']),p=int(r['presencas']),
                      base=int(r['sessoes_em_que_constava']),
                      meses=[('—' if r[k+'_P']=='' else ('0' if r[k+'_P']=='0' else f"{r[k+'_P']}/{s}")) for k,_,s in MES]))
json.dump(saida,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'selecionados.json'),'w'),ensure_ascii=False)

print("| # | Selecionado | Faixa | Nome na folha | Freq. | Pres. | " + " | ".join(m[1] for m in MES) + " |")
print("|---:|---|---|---|---:|---:|" + ":---:|"*6)
for r in saida:
    if r['pct'] is None:
        print(f"| {r['n']} | {r['apelido']} | {r['faixa']} | **não identificado** | — | — |" + " — |"*6); continue
    print(f"| {r['n']} | {r['apelido']} | {r['faixa']} | {r['folha']} | **{r['pct']}%** | {r['p']}/{r['base']} | " + " | ".join(r['meses']) + " |")

com=[r for r in saida if r['pct'] is not None]
print(f"\n\nRESUMO: {len(com)} identificados de {len(saida)}")
for lo,hi,rot in [(50,101,'50% ou mais'),(25,50,'25% a 49%'),(10,25,'10% a 24%'),(1,10,'1% a 9%'),(0,1,'ZERO presenca')]:
    g=[r for r in com if lo<=r['pct']<hi]
    if g: print(f"  {rot:<14} {len(g):>2}: " + ", ".join(f"{x['apelido']} ({x['pct']}%)" for x in sorted(g,key=lambda x:-x['pct'])))
tot=sum(r['p'] for r in com)
print(f"\n  Presencas somadas dos selecionados: {tot} de 351 registradas ({round(tot*100/351)}% do total da equipe)")
