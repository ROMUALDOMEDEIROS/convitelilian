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
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5177` | Origens autorizadas a chamar a API, separadas por vírgula |

Quando o frontend for servido de outra máquina, informe a origem dele:

```bash
ALLOWED_ORIGINS=http://10.0.0.5:5173 npm start
```

E aponte o frontend para o servidor no build:

```bash
VITE_API_URL=http://10.0.0.20:4000 npm run build
```

`VITE_AUTOSAVE_MS` altera o intervalo do checkpoint automático (padrão 20 min).

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/health` | Verifica se o servidor está de pé |
| `PUT` | `/api/snapshot/:tableId` | Grava o dia. Corpo: `{ dia, header, rows, origem }` |
| `GET` | `/api/snapshot/:tableId?dia=aaaa-mm-dd` | Lê o registro de um dia |
| `GET` | `/api/snapshot/:tableId/dias` | Lista os dias gravados |

`tableId` é `tabela1` (viaturas) ou `tabela2` (pais/responsáveis).

## Modelo de dados

- **`snapshot`** — um registro por (tabela, dia). O checkpoint automático
  sobrescreve o do dia corrente.
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

24 testes cobrindo gravação, sobrescrita do dia, histórico de versões,
isolamento entre tabelas, acentuação, validação, tentativa de SQL injection e
CORS.
