# Registro da Guarda

Substitui a planilha `PLANILHA_DE_REGISTRO.xlsm` por um aplicativo que roda no
navegador, na rede interna da unidade.

Duas folhas de registro:

- **Controle de Entrada e Saída de Viaturas** — Entrada, Saída, Interna, Externa, Condutor
- **Controle de Entrada de Pais / Responsáveis** — Hora, Pais/Responsáveis, Aluno, Série/Turma, Destino, Autorizado por

O que ele faz:

- **importa** as planilhas atuais (`.csv`, `.xlsx` e o próprio `.xlsm`), achando
  as colunas pelo nome — inclusive o cabeçalho de duas alturas da folha de viaturas;
- **cadastro de viaturas e condutores** já preenchido com as 22 viaturas e os 68
  condutores da aba `Dados`, editável e com **autopreenchimento** ao digitar;
- **digita direto na tela**, com adicionar e excluir linha;
- **data automática**, preenchida com o dia de hoje mas gravada como valor fixo:
  ela não se reescreve sozinha como o `=HOJE()` da planilha antiga;
- **gera os dois PDFs** em A4 (viaturas em retrato, pais em paisagem), com
  cabeçalho repetido em toda página e "Página X de Y";
- **salva sozinho** no navegador a cada tecla digitada;
- **grava no banco de dados** da unidade, manualmente ou a cada 20 minutos,
  com reenvio automático se a rede cair.

---

## Instalar (uma vez só)

### 1. Instalar o Node.js

Baixe em **https://nodejs.org**, opção **LTS**, e instale normalmente
(next, next, finish). É o motor que roda o programa.

### 2. Baixar esta pasta

Na página do projeto no GitHub: botão verde **Code** → **Download ZIP**.
Descompacte, por exemplo, em `C:\registro-guarda`.

### 3. Usar

Dê **dois cliques em `INICIAR.bat`**.

Na primeira vez ele instala tudo (leva alguns minutos e precisa de internet
**apenas nesta vez**). Depois disso abre sozinho o navegador em
`http://localhost:5173`.

> **Duas janelas negras vão abrir: BANCO DE DADOS e TELA.**
> Mantenha as duas abertas enquanto estiver usando. Para encerrar, feche as duas.

---

## Uso no dia a dia

1. Dois cliques em `INICIAR.bat`.
2. Preencher **DATA** (já vem com hoje), **CMT. DA GUARDA**, **VIGILANTE** e,
   na folha de pais, **ALA DE SERVIÇO**.
3. Clicar em **+ Adicionar linha** e lançar os registros. As horas são aceitas
   em qualquer formato: digitar `7:5` grava `07:05`; `1:30 PM` grava `13:30`.
4. Ao fim do turno, **Exportar** gera o PDF para imprimir e arquivar.
5. **Limpar** encerra o turno e devolve a data para hoje.

### Cadastro de viaturas e condutores

No topo da tela, em **Cadastro de viaturas e condutores**, ficam as duas listas
que alimentam o autopreenchimento das colunas *Interna*, *Externa*, *Condutor* e
*Autorizado por*. Já vêm com os nomes da planilha antiga.

- **Acrescentar**: digite e tecle Enter. Nome repetido é recusado, comparando
  sem acento e sem maiúsculas — `ao 42` não entra se `AO 42` já existe.
- **Editar**: clique no nome e corrija. A ordem alfabética é refeita ao sair.
- **Excluir**: botão `✕` da linha.
- **Importar lista**: aceita `.csv`, `.txt`, `.xlsx` e `.xlsm`. Procura a coluna
  `VTR` ou `CONDUTOR`; um arquivo com um nome por linha também serve. Jogando o
  `.xlsm` antigo, ele acha a aba `Dados` sozinho — e o aviso diz de qual aba e
  coluna leu, para você conferir.
- **Restaurar original**: volta aos nomes da planilha antiga.

Ao digitar numa célula dessas colunas, aparece a lista filtrada. **Acento não
atrapalha**: `aragao` acha `ARAGÃO SGT`, `ademesio` acha `ADEMÉSIO SGT`. Também
dá para procurar por parte do nome — `sgt` traz todos os sargentos. Use as setas
e Enter, ou clique.

> **A lista sugere, não obriga.** Um condutor que não está cadastrado pode ser
> digitado normalmente. Nada é bloqueado.

**As listas ficam no banco da unidade, iguais em todas as máquinas.** O cabeçalho
do painel mostra o estado: `● gravado no banco da unidade` quando está tudo
sincronizado. Se o banco estiver fora do ar, você continua editando e as
mudanças sobem sozinhas quando ele voltar.

Se duas máquinas editarem o cadastro ao mesmo tempo, **as duas versões são
unidas** — ninguém perde o que acrescentou.

### A barra de sincronização

Cada folha tem uma barra cinza no topo:

| O que aparece | O que significa |
|---|---|
| `○ ainda não gravado no banco` | Nada foi enviado ainda nesta folha |
| `● aguardando envio ao banco` | Há lançamento novo que o banco ainda não recebeu |
| `○ gravado no banco` | Tudo que está na tela já está no banco |
| `● falha ao gravar` | O envio falhou — a mensagem ao lado diz o motivo |

O botão **Salvar no banco** envia na hora. Sozinho, o programa envia **a cada
20 minutos**, e o relógio ao lado mostra quanto falta para o próximo.

> **Se a rede cair, nada é perdido.** O que está na tela continua salvo neste
> navegador, e o envio é repetido automaticamente quando a rede voltar.

---

## Perguntas comuns

**O programa some se eu fechar o navegador sem querer?**
Não. Ele grava neste navegador a cada tecla digitada. Ao reabrir, o turno volta,
com um aviso de que o conteúdo foi restaurado.

**Aparece uma data que não é a de hoje. Está errado?**
Não — é proposital. Significa que essa folha é de outro dia (você reabriu um
turno anterior ou importou um arquivo antigo). Abaixo do campo aparece
"não é a data de hoje". Se quer começar um turno novo, clique em **Limpar**.

**Os nomes dos condutores mudaram. Onde eu altero?**
Em **Cadastro de viaturas e condutores**, no topo. Acrescente, corrija ou exclua
ali, e o autopreenchimento das folhas passa a usar a lista nova na hora.

**Posso usar em dois computadores ao mesmo tempo?**
Sim, mas com um cuidado: **cada máquina tem a sua própria cópia na tela**.
Quem salvar por último sobrescreve o registro daquele dia no banco. Para dois
postos lançando ao mesmo tempo, fale comigo — precisa de um tratamento
específico.

**Preciso de internet?**
Só na primeira instalação. Depois, apenas a rede interna da unidade.

**Onde ficam os dados?**
No arquivo `server/data/registro.sqlite`, na própria máquina. Nada vai para a
internet. Os registros dos turnos e o cadastro de viaturas e condutores ficam
os dois no banco.

---

## Para quem cuida da máquina

### Backup — importante

Os dados ficam em `server/data/`. **Copie os três arquivos juntos**
(`registro.sqlite`, `registro.sqlite-wal`, `registro.sqlite-shm`), ou pare o
servidor antes de copiar apenas o `.sqlite`.

Copiar só o `.sqlite` com o servidor ligado traz um banco quase vazio: as
gravações recentes ainda estão no arquivo `-wal`.

### Rodar em rede, com a tela em outra máquina

Por padrão tudo funciona numa máquina só. Para outras máquinas acessarem:

```bat
rem no computador que guarda o banco (ex.: 10.0.0.20)
set ALLOWED_ORIGINS=http://10.0.0.20:5173
npm --prefix server start

rem a tela, aceitando conexões da rede
set VITE_API_URL=http://10.0.0.20:4000
npm run dev -- --host
```

Detalhes de configuração, rotas da API e recuperação de versões antigas estão em
[`server/README.md`](server/README.md).

### Cadastro compartilhado, e reconciliação de conflitos

O cadastro de viaturas e condutores é uma linha única na tabela `listas`, com
controle otimista de versão: quem grava informa em que versão se baseou, e o
servidor recusa com `409` se outra máquina gravou antes. A tela então funde as
duas versões (união, sem duplicar) e regrava. Cada gravação também é anexada em
`listas_version`, então nenhuma alteração se perde no histórico.

### Sobre o cadastro copiado da planilha

As listas iniciais saíram da aba `Dados` do `.xlsm`, com os espaços sobrando
removidos (`AGATANGELO  PTTC`, `SGT JARDELINE `, `ULHOA TC `, `MAJ DOUGLAS `) e
a ordem alfabética refeita. **Nenhum nome foi reescrito.** Ficaram como estavam
as inconsistências de padrão que já existiam: a maioria é `NOME + POSTO`
(`MATIAS SGT`), mas há `SGT JARDELINE` e `MAJ DOUGLAS` invertidos,
`GEOVANE MAJ PTTC` com dois postos, e `CARMONA`, `ELIEZER`, `STEVES` e
`MATIOLLI` sem posto. Corrija pela tela se quiser padronizar.

### Limitações que você deve conhecer

- **Não há autenticação.** Qualquer máquina que alcance a porta 4000 lê e grava
  tudo, inclusive os nomes dos alunos. Isso foi uma decisão de projeto assumindo
  rede interna fechada. Se a rede não for isolada, restrinja por firewall.
- **O tráfego não é criptografado** (HTTP puro). Em rede compartilhada, é legível.
- **O `INICIAR.bat` usa o servidor de desenvolvimento.** Funciona bem, mas para
  uma instalação definitiva o correto é gerar a versão otimizada (`npm run build`)
  e servi-la, além de transformar o banco em serviço do Windows, que sobe junto
  com a máquina e não depende de janela aberta.

### Estrutura

```
INICIAR.bat        inicia tudo com dois cliques
src/               a tela (React + TypeScript)
server/            o banco de dados (Node + SQLite)
fixtures/          arquivos de exemplo para testar a importação
```

### Testes

```bash
npm --prefix server test    # 24 testes do banco e da API
npm run build               # confere que a tela compila
```
