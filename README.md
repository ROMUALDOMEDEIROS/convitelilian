# Registro da Guarda

Substitui a planilha `PLANILHA_DE_REGISTRO.xlsm` por um aplicativo que roda no
navegador, na rede interna da unidade.

Duas folhas de registro:

- **Controle de Entrada e Saída de Viaturas** — Entrada, Saída, Interna, Externa, Condutor
- **Controle de Entrada de Pais / Responsáveis** — Hora, Pais/Responsáveis, Aluno, Série/Turma, Destino, Autorizado por

O que ele faz:

- **cadastro de viaturas e condutores** já preenchido com as 22 viaturas e os 68
  condutores da aba `Dados`, editável e com **autopreenchimento** ao digitar;
- **digita direto na tela**, com adicionar e excluir linha;
- **carimba a hora da saída** ao lançar a viatura, sem digitar — e sem
  sobrescrever a hora que você tiver posto à mão;
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

O programa precisa do **Node.js** (o motor que o faz rodar). Dois jeitos:

- **Com o instalador** (`.msi`) — o comum, mas **pede senha de administrador**.
- **Sem administrador** (recomendado se você não tem a senha): baixe em
  **https://nodejs.org** o arquivo **"Windows Binary (.zip)" 64-bit** (é um
  `.zip`, não o instalador) e **descompacte** em qualquer uma destas pastas:

  | Pasta |
  |---|
  | `%USERPROFILE%\node` (ex.: `C:\Users\seu-usuario\node`) |
  | `%USERPROFILE%\Downloads` ou `%USERPROFILE%\Desktop` |
  | a própria pasta do programa (junto do `INICIAR.bat`) |

  **Não precisa renomear nada.** A pasta pode continuar com o nome que o `.zip`
  cria (`node-v24.19.0-win-x64`) — o `INICIAR.bat` procura os dois formatos e
  põe o Node no caminho sozinho.

### 2. Baixar esta pasta

Na página do projeto no GitHub: botão verde **Code** → **Download ZIP**.
Descompacte, por exemplo, em `C:\registro-guarda`.

### 3. Usar

Dê **dois cliques em `INICIAR.bat`**.

Na primeira vez ele instala e prepara tudo (leva alguns minutos e precisa de
internet **apenas nesta vez**). Depois abre sozinho o navegador em
**`http://localhost:4000`**.

> **Abre UMA janela preta: SERVIDOR.** Mantenha-a aberta enquanto estiver
> usando; para encerrar, feche essa janela. O aplicativo e o banco de dados
> rodam juntos nela.

**Atualizou o programa** (baixou uma versão nova)? Rode o **`ATUALIZAR.bat`**
uma vez antes de usar — ele recompila o aplicativo.

---

## Uso no dia a dia

1. Dois cliques em `INICIAR.bat` (abre em `http://localhost:4000`).
2. Preencher **DATA** (já vem com hoje), **CMT. DA GUARDA**, **VIGILANTE** e,
   na folha de pais, **ALA DE SERVIÇO**.
3. Clicar em **+ Adicionar linha** e lançar os registros. As horas são aceitas
   em qualquer formato: digitar `7:5` grava `07:05`; `1:30 PM` grava `13:30`.
4. Ao fim do turno, **Exportar** gera o PDF para imprimir e arquivar.
5. **Limpar** encerra o turno e devolve a data para hoje.

### A hora da saída se preenche sozinha

Na folha de viaturas, ao lançar a viatura em **Interna** ou **Externa**, a
coluna **Saída** recebe a **hora do relógio** naquele instante. Digitou
`APS 240`, saiu da célula, a hora do movimento já está gravada — sem digitar.

Duas garantias que valem conhecer:

- **Hora digitada à mão nunca é sobrescrita.** Se você preencher a Saída antes
  de lançar a viatura, ela fica como está. O carimbo só age em célula vazia.
- **Corrigir a viatura depois não mexe na hora.** Trocou `APS 240` por
  `APS 241` na mesma linha? A Saída continua a do primeiro lançamento.

Para lançar um horário diferente do relógio — um movimento anotado no papel e
digitado depois, por exemplo — é só escrever por cima: a coluna continua
editável como qualquer outra.

> Quer o carimbo na coluna **Entrada** em vez de Saída, ou nas duas? É uma
> linha em `src/schema.ts` (`carimbaHoraEm`), me avise.

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

**Cadastrar direto da folha, sem subir ao painel:** ao digitar na coluna
*Interna*, *Externa*, *Condutor* ou *Autorizado por* um nome que ainda não
existe, o menu mostra **“+ Acrescentar «nome» ao cadastro”**. Um clique (ou
seta até ele e Enter) e o nome entra na lista, já disponível nas próximas
linhas. É a forma mais rápida de incluir uma viatura ou condutor novo — não
precisa de arquivo nem de abrir o painel.

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

**Fechei a janela SERVIDOR sem querer. E agora?**
O aplicativo para de responder. É só rodar o `INICIAR.bat` de novo — nada é
perdido, os dados estão no banco. Enquanto o servidor está no ar, se você só
fechar o navegador, reabra em `http://localhost:4000` que o turno continua lá.

**Aparece uma data que não é a de hoje. Está errado?**
Não — é proposital. Significa que essa folha é de outro dia: você reabriu um
turno anterior. Abaixo do campo aparece "não é a data de hoje". Se quer começar
um turno novo, clique em **Limpar**.

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

**O `INICIAR.bat` cospe erros como `'cho' não é reconhecido` ou `'/d' não é
reconhecido`, e no fim diz que não achou o Node.**
Você está com uma **cópia antiga** do programa. Aqueles `.bat` foram gravados
com quebra de linha do Unix (LF); o `cmd.exe` lê o arquivo desalinhado e come
os primeiros caracteres de cada linha — `@echo off` vira `cho`, `cd /d` vira
`/d`. Não é problema da sua máquina nem do Node. **Baixe o ZIP de novo** (o
projeto agora força CRLF nesses arquivos, via `.gitattributes`) e rode outra vez.

**O `npm install` do servidor falha pedindo Visual Studio (`node-gyp`,
`Could not find any Visual Studio installation`).**
Não acontece mais: os scripts instalam o servidor com `--ignore-scripts`, porque
o `better-sqlite3` já traz o binário pronto para Windows (`prebuilds/win32-x64.node`)
e não precisa compilar nada. Se você estiver instalando na mão, use
`npm install --prefix server --ignore-scripts`.

**Onde ficam os dados?**
No arquivo `server/data/registro.sqlite`, na própria máquina. Nada vai para a
internet. Os registros dos turnos e o cadastro de viaturas e condutores ficam
os dois no banco.

---

## Para quem cuida da máquina

### Sobe sozinho **sem senha de administrador** — recomendado

Se você não tem a senha de administrador da máquina, ainda dá para o app subir
sozinho, sem janela preta aberta. Dois cliques em **`INICIAR-COM-O-WINDOWS.bat`**.

Ele põe um lançador na **pasta de Inicialização do seu usuário**
(`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`), que é sua e não
exige administrador. A partir do próximo login, o servidor sobe escondido.

Para desfazer, rode **`REMOVER-DO-WINDOWS.bat`** (também sem administrador).

| | Sem admin (Inicialização) | Com admin (serviço) |
|---|---|---|
| Sobe quando | **você faz login** | **a máquina liga**, antes de qualquer login |
| Pede senha | não | sim, uma vez |
| Janela aberta | nenhuma | nenhuma |
| Arquivo | `INICIAR-COM-O-WINDOWS.bat` | `INSTALAR-SERVICO.bat` |

A diferença prática é só essa: pela Inicialização, a máquina precisa chegar até
a tela logada para o app estar no ar. Numa portaria onde o computador fica
sempre logado no mesmo usuário, dá no mesmo.

> **Nada é "instalado" em nenhum dos dois casos.** O Node.js portátil é uma
> pasta com arquivos — sem instalador, sem registro do Windows. Para remover
> tudo, apague as pastas e rode o `REMOVER-DO-WINDOWS.bat`.

### Rodar como serviço (sobe sozinho ao ligar a máquina, com administrador)

Para a máquina da portaria não depender de ninguém deixar a janela aberta,
instale o Registro da Guarda como serviço. Ele passa a subir **sozinho toda vez
que a máquina liga**, em segundo plano.

1. Clique com o botão **direito** em **`INSTALAR-SERVICO.bat`** e escolha
   **"Executar como administrador"**.
2. Ele instala, compila (se ainda não), registra o serviço e já o inicia.
3. Acesse `http://localhost:4000`.

A partir daí, ligou a máquina, o app está no ar — sem clicar em nada. Para
remover, rode **`DESINSTALAR-SERVICO.bat`** como administrador.

> Por baixo, é uma **Tarefa Agendada do Windows** que sobe o servidor oculto
> (via `servidor-oculto.vbs`) na inicialização. Não precisa baixar nada além do
> Node.js. O registro do que o serviço faz fica em `server\servico.log`.

O serviço roda como **SYSTEM**, que tem um `PATH` diferente do seu usuário e
não enxergaria um Node portátil descompactado dentro da sua pasta pessoal. Por
isso o `INSTALAR-SERVICO.bat` anota a pasta do Node num arquivo `node-dir.txt`,
e o `servidor-oculto.vbs` a coloca no `PATH` antes de subir o servidor. Se você
**mudar o Node de lugar**, rode o `INSTALAR-SERVICO.bat` de novo para reanotar.

O instalador só diz **PRONTO** depois de confirmar que o servidor respondeu de
verdade em `http://localhost:4000`. Se ele avisar que não respondeu, o motivo
está em `server\servico.log`.

Se preferir nenhum dos dois modos automáticos, o `INICIAR.bat` continua
funcionando (com a janela aberta).

### Backup — importante

Os dados ficam em `server/data/`. **Copie os três arquivos juntos**
(`registro.sqlite`, `registro.sqlite-wal`, `registro.sqlite-shm`), ou pare o
servidor antes de copiar apenas o `.sqlite`.

Copiar só o `.sqlite` com o servidor ligado traz um banco quase vazio: as
gravações recentes ainda estão no arquivo `-wal`.

### Rodar em rede, com outras máquinas da portaria

O aplicativo e o banco rodam juntos numa porta só. **Numa máquina** (a que
guarda o banco), rode o `INICIAR.bat` normalmente. As **outras máquinas** da
rede interna acessam pelo navegador, sem instalar nada:

```
http://IP-DA-MAQUINA-DO-BANCO:4000
```

(descubra o IP com `ipconfig` na máquina do banco). Todas veem os mesmos dados,
porque falam com o mesmo servidor.

Detalhes de configuração, rotas da API e recuperação de versões antigas estão em
[`server/README.md`](server/README.md).

### Cadastro compartilhado, e reconciliação de conflitos

O cadastro de viaturas e condutores é uma linha única na tabela `listas`, com
controle otimista de versão: quem grava informa em que versão se baseou, e o
servidor recusa com `409` se outra máquina gravou antes. A tela então funde as
duas versões (união, sem duplicar) e regrava. Cada gravação também é anexada em
`listas_version`, então nenhuma alteração se perde no histórico.

### Trocar o brasão pelo oficial

A tela usa um emblema desenhado como marcador. Para colocar o brasão oficial,
**basta soltar o arquivo na pasta — sem mexer em código:**

1. Salve a imagem do brasão em `src/assets/` com o nome **`brasao.png`**
   (também aceita `.jpg`, `.jpeg`, `.webp` ou `.svg`). PNG com fundo
   transparente fica melhor.
2. Pare e reinicie o app (feche e abra o `INICIAR.bat`).

Pronto: o cabeçalho passa a mostrar o brasão de verdade. O app detecta o
arquivo sozinho; enquanto ele não existir, mostra o emblema desenhado. Há um
`LEIA-ME.txt` dentro de `src/assets/` com essa mesma instrução.

As cores da interface saíram do próprio brasão (vermelho heráldico `#a81e22`,
dourado `#c8a13a`, verde louro `#2e7d32`) e ficam em `src/index.css`, no bloco
`:root`. Mudou o brasão e quer ajustar o tom do vermelho? É lá.

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
- **Pelo `INICIAR.bat`, o servidor depende da janela aberta.** Para a máquina
  da portaria, prefira um dos modos automáticos acima: sem senha de
  administrador, `INICIAR-COM-O-WINDOWS.bat`; com senha,
  `INSTALAR-SERVICO.bat`. Nos dois, o servidor sobe sozinho e escondido.

### Estrutura

```
INICIAR.bat               dois cliques: app + banco na porta 4000, janela aberta
ATUALIZAR.bat             recompila o app depois de baixar uma versão nova
INICIAR-COM-O-WINDOWS.bat sobe sozinho no login, SEM senha de administrador
REMOVER-DO-WINDOWS.bat    desfaz o de cima
INSTALAR-SERVICO.bat      sobe ao ligar a máquina; pede administrador uma vez
DESINSTALAR-SERVICO.bat   remove o serviço
servidor-oculto.vbs       lançador sem janela, usado pelos dois modos automáticos
src/               a tela (React + TypeScript)
server/            o servidor: banco de dados + entrega do app (Node + SQLite)
dist/              o app compilado (gerado pelo build; não vai para o Git)
fixtures/          arquivo de exemplo para testar a importação de listas
```

### Testes

```bash
npm --prefix server test    # 24 testes do banco e da API
npm run build               # confere que a tela compila
```
