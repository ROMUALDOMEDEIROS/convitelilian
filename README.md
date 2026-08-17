# Registro da Guarda

Substitui a planilha `PLANILHA_DE_REGISTRO.xlsm` por um aplicativo que roda no
navegador, na rede interna da unidade.

Duas folhas de registro:

- **Controle de Entrada e Saída de Viaturas** — Entrada, Saída, Interna, Externa, Condutor
- **Controle de Entrada de Pais / Responsáveis** — Hora, Pais/Responsáveis, Aluno, Série/Turma, Destino, Autorizado por

O que ele faz:

- **importa** as planilhas atuais (`.csv`, `.xlsx` e o próprio `.xlsm`), achando
  as colunas pelo nome — inclusive o cabeçalho de duas alturas da folha de viaturas;
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

**Posso usar em dois computadores ao mesmo tempo?**
Sim, mas com um cuidado: **cada máquina tem a sua própria cópia na tela**.
Quem salvar por último sobrescreve o registro daquele dia no banco. Para dois
postos lançando ao mesmo tempo, fale comigo — precisa de um tratamento
específico.

**Preciso de internet?**
Só na primeira instalação. Depois, apenas a rede interna da unidade.

**Onde ficam os dados?**
No arquivo `server/data/registro.sqlite`, na própria máquina. Nada vai para a
internet.

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
