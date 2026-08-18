# Registro da Guarda — servidor local

Backend do app de registro da portaria. Roda **numa máquina da rede interna da
unidade**; os dados não saem dessa rede.

Banco: SQLite, arquivo único — fácil de copiar para backup.

## Instalar e subir

```bash
cd server
npm install
npm start
```

Sobe em `http://0.0.0.0:4000`. O banco é criado sozinho em `server/data/registro.sqlite`.

## Configuração

Variáveis de ambiente, todas opcionais:

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `4000` | Porta da API |
| `HOST` | `0.0.0.0` | `0.0.0.0` aceita as outras máquinas da rede; `127.0.0.1` restringe à própria máquina |
| `DB_FILE` | `data/registro.sqlite` | Caminho do arquivo do banco |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5177` | Origens autorizadas em desenvolvimento (Vite). Em produção o app e a API ficam na mesma origem, então isto não é usado. |
| `STATIC_DIR` | `../dist` | Pasta do app compilado que o servidor entrega junto com a API |

Em produção o servidor entrega **o app e a API na mesma porta** (`4000` por
padrão): compile o app com `npm run build` na raiz e rode `npm --prefix server
start`. Abra `http://localhost:4000`. Outras máquinas da rede acessam por
`http://IP-DO-SERVIDOR:4000` — não há CORS, porque tudo vem da mesma origem.

`VITE_AUTOSAVE_MS` altera o intervalo do checkpoint automático (padrão 20 min).
`STATIC_DIR` aponta para outra pasta do app compilado, se necessário.

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/health` | Verifica se o servidor está de pé |
| `PUT` | `/api/snapshot/:tableId` | Grava o dia. Corpo: `{ dia, header, rows, origem }` |
| `GET` | `/api/snapshot/:tableId?dia=aaaa-mm-dd` | Lê o registro de um dia |
| `GET` | `/api/snapshot/:tableId/dias` | Lista os dias gravados |
| `GET` | `/api/listas` | Lê o cadastro de viaturas e condutores |
| `PUT` | `/api/listas` | Grava o cadastro. Corpo: `{ listas, baseVersao, forcar? }` |

`tableId` é `tabela1` (viaturas) ou `tabela2` (pais/responsáveis).

## Modelo de dados

- **`snapshot`** — um registro por (tabela, dia). O checkpoint automático
  sobrescreve o do dia corrente.
- **`listas`** — linha única (id=1) com o cadastro compartilhado de viaturas e
  condutores, versionado. `PUT /api/listas` usa controle otimista: `baseVersao`
  precisa bater com a gravada, senão responde `409` com o estado atual, para o
  cliente reconciliar. `forcar: true` sobrescreve.
- **`listas_version`** — histórico de todo o cadastro, como o de snapshots.
- **`snapshot_version`** — toda gravação também é anexada aqui. Se alguém
  apagar linhas por acidente e o auto-save disparar em seguida, o conteúdo
  anterior continua recuperável. São ~36 versões por turno de 12h, o que é
  irrelevante em espaço.

Recuperar uma versão anterior de um dia:

```sql
SELECT v.saved_at, v.origem, v.row_count, v.rows
  FROM snapshot_version v
  JOIN snapshot s ON s.id = v.snapshot_id
 WHERE s.table_id = 'tabela1' AND s.dia = '2026-08-17'
 ORDER BY v.id DESC;
```

## Segurança

Este servidor roda **sem autenticação**, por decisão de projeto: assume-se rede
interna fechada. O que ele faz:

- valida tudo que chega (tabela, data existente, tipos, tamanhos) e recusa o
  resto com `400` — o cliente nunca é confiável;
- usa **prepared statements** com parâmetros ligados, então texto vindo da rede
  nunca é interpretado como SQL;
- limita o corpo a 2 MB, 5000 linhas e 500 caracteres por célula;
- responde CORS **apenas** às origens de `ALLOWED_ORIGINS`;
- limita a 240 requisições por minuto por IP;
- **não registra o corpo das requisições em log**, porque os registros contêm
  nome de aluno e matrícula funcional.

O que ele **não** faz, e você deve considerar:

- Qualquer máquina que alcance a porta pode ler e gravar. Se a rede não for
  fisicamente isolada, restrinja por firewall ou volte ao assunto autenticação.
- Não há criptografia em trânsito (HTTP puro). Numa rede compartilhada, o
  tráfego é legível.
- **Backup é sua responsabilidade.** Copie `data/registro.sqlite` junto com os
  arquivos `-wal` e `-shm`, ou pare o servidor antes de copiar só o `.sqlite`.

## Testes

```bash
npm test
```

36 testes cobrindo gravação, sobrescrita do dia, histórico de versões,
isolamento entre tabelas, acentuação, validação, tentativa de SQL injection,
CORS, e o cadastro compartilhado com reconciliação de conflitos (409).
