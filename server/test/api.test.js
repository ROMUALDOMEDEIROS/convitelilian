import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';

const ORIGIN = 'http://localhost:5177';
const silent = { log() {}, error() {} };

let store;
let server;
let base;

async function api(path, options = {}) {
  const res = await fetch(`${base}${path}`, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body, headers: res.headers };
}

function put(tableId, payload, headers = {}) {
  return api(`/api/snapshot/${tableId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

const snapshotValido = {
  dia: '2026-08-17',
  header: { data: '2026-08-17', cmt: '1 SGT MATIAS - 1406213', vigilante: 'MAIANE DANTAS' },
  rows: [
    { entrada: '', saida: '07:37', interna: 'ETIOS APAM', externa: '', condutor: 'GOMES PTTC' },
    { entrada: '07:12', saida: '08:40', interna: '', externa: 'AO 42', condutor: 'MATIAS SGT' },
  ],
  origem: 'manual',
};

before(async () => {
  store = openDatabase(':memory:');
  const app = createApp({ store, allowedOrigins: [ORIGIN], logger: silent });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  store.close();
});

describe('health', () => {
  it('responde ok', async () => {
    const { status, body } = await api('/api/health');
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });
});

describe('gravar e ler snapshot', () => {
  it('grava e devolve contagem e versão', async () => {
    const { status, body } = await put('tabela1', snapshotValido);
    assert.equal(status, 200);
    assert.equal(body.rowCount, 2);
    assert.equal(body.versao, 1);
    assert.ok(body.savedAt);
  });

  it('lê de volta exatamente o que foi gravado', async () => {
    const { status, body } = await api('/api/snapshot/tabela1?dia=2026-08-17');
    assert.equal(status, 200);
    assert.deepEqual(body.header, snapshotValido.header);
    assert.deepEqual(body.rows, snapshotValido.rows);
    assert.equal(body.rowCount, 2);
  });

  it('sobrescreve o dia e incrementa a versão, sem duplicar o registro', async () => {
    const atualizado = {
      ...snapshotValido,
      origem: 'automatico',
      rows: [...snapshotValido.rows, { entrada: '09:05', saida: '', interna: 'APS 376', externa: '', condutor: 'VÂNIA ST' }],
    };
    const { body } = await put('tabela1', atualizado);
    assert.equal(body.rowCount, 3);
    assert.equal(body.versao, 2);

    const lido = await api('/api/snapshot/tabela1?dia=2026-08-17');
    assert.equal(lido.body.rowCount, 3);

    const dias = await api('/api/snapshot/tabela1/dias');
    assert.equal(dias.body.dias.length, 1, 'o mesmo dia não deve virar duas linhas');
  });

  it('guarda o histórico de versões para não perder conteúdo apagado por acidente', () => {
    const linhas = store.db
      .prepare(
        `SELECT v.row_count AS rowCount, v.origem
           FROM snapshot_version v
           JOIN snapshot s ON s.id = v.snapshot_id
          WHERE s.table_id = 'tabela1' AND s.dia = '2026-08-17'
          ORDER BY v.id`,
      )
      .all();
    assert.deepEqual(linhas, [
      { rowCount: 2, origem: 'manual' },
      { rowCount: 3, origem: 'automatico' },
    ]);
  });

  it('dias diferentes são registros diferentes', async () => {
    await put('tabela1', { ...snapshotValido, dia: '2026-08-18' });
    const { body } = await api('/api/snapshot/tabela1/dias');
    assert.deepEqual(
      body.dias.map((d) => d.dia),
      ['2026-08-18', '2026-08-17'],
    );
  });

  it('as duas tabelas não se misturam', async () => {
    await put('tabela2', { ...snapshotValido, rows: [{ hora: '07:45', responsavel: 'JOÃO' }] });
    const t1 = await api('/api/snapshot/tabela1?dia=2026-08-17');
    const t2 = await api('/api/snapshot/tabela2?dia=2026-08-17');
    assert.equal(t1.body.rowCount, 3);
    assert.equal(t2.body.rowCount, 1);
  });

  it('404 para dia sem registro', async () => {
    const { status, body } = await api('/api/snapshot/tabela1?dia=2001-01-01');
    assert.equal(status, 404);
    assert.match(body.erro, /nenhum registro/);
  });

  it('preserva acentos', async () => {
    await put('tabela2', {
      dia: '2026-08-19',
      header: { ala: 'C' },
      rows: [{ responsavel: 'JOÃO DA SILVA ÇÃO', destino: 'COORDENAÇÃO PEDAGÓGICA' }],
    });
    const { body } = await api('/api/snapshot/tabela2?dia=2026-08-19');
    assert.equal(body.rows[0].responsavel, 'JOÃO DA SILVA ÇÃO');
    assert.equal(body.rows[0].destino, 'COORDENAÇÃO PEDAGÓGICA');
  });
});

describe('validação: o servidor não confia no cliente', () => {
  it('recusa tabela desconhecida', async () => {
    const { status, body } = await put('tabela9', snapshotValido);
    assert.equal(status, 400);
    assert.match(body.erro, /tabela desconhecida/);
  });

  it('recusa dia fora do formato', async () => {
    const { status, body } = await put('tabela1', { ...snapshotValido, dia: '17/08/2026' });
    assert.equal(status, 400);
    assert.match(body.erro, /aaaa-mm-dd/);
  });

  it('recusa data inexistente', async () => {
    const { status, body } = await put('tabela1', { ...snapshotValido, dia: '2026-02-30' });
    assert.equal(status, 400);
    assert.match(body.erro, /não é uma data existente/);
  });

  it('recusa rows que não é lista', async () => {
    const { status } = await put('tabela1', { ...snapshotValido, rows: { a: 1 } });
    assert.equal(status, 400);
  });

  it('recusa valor não textual dentro de uma linha', async () => {
    const { status, body } = await put('tabela1', {
      ...snapshotValido,
      rows: [{ entrada: 123 }],
    });
    assert.equal(status, 400);
    assert.match(body.erro, /deve ser texto/);
  });

  it('recusa valor de célula acima do limite', async () => {
    const { status, body } = await put('tabela1', {
      ...snapshotValido,
      rows: [{ condutor: 'x'.repeat(501) }],
    });
    assert.equal(status, 400);
    assert.match(body.erro, /limite é 500/);
  });

  it('recusa mais linhas que o limite', async () => {
    const { status, body } = await put('tabela1', {
      ...snapshotValido,
      rows: Array.from({ length: 5001 }, () => ({ entrada: '07:00' })),
    });
    assert.equal(status, 400);
    assert.match(body.erro, /limite é 5000/);
  });

  it('recusa origem inválida', async () => {
    const { status } = await put('tabela1', { ...snapshotValido, origem: 'sei-la' });
    assert.equal(status, 400);
  });

  it('recusa JSON malformado', async () => {
    const { status, body } = await put('tabela1', '{quebrado');
    assert.equal(status, 400);
    assert.match(body.erro, /JSON inválido/);
  });

  it('trata tentativa de SQL injection como texto comum, sem executar nada', async () => {
    const veneno = "'); DROP TABLE snapshot;--";
    await put('tabela1', {
      dia: '2026-08-20',
      header: { cmt: veneno },
      rows: [{ condutor: veneno }],
    });
    const { body } = await api('/api/snapshot/tabela1?dia=2026-08-20');
    assert.equal(body.header.cmt, veneno, 'deve voltar literal');
    const tabelas = store.db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='snapshot'`)
      .all();
    assert.equal(tabelas.length, 1, 'a tabela snapshot deve continuar existindo');
  });
});

describe('CORS', () => {
  it('reflete apenas a origem autorizada', async () => {
    const permitida = await put('tabela1', snapshotValido, { Origin: ORIGIN });
    assert.equal(permitida.headers.get('access-control-allow-origin'), ORIGIN);

    const negada = await put('tabela1', snapshotValido, { Origin: 'http://intruso.example' });
    assert.equal(negada.headers.get('access-control-allow-origin'), null);
  });

  it('responde ao preflight', async () => {
    const res = await fetch(`${base}/api/snapshot/tabela1`, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'PUT' },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  });
});

describe('cabeçalhos e rotas', () => {
  it('não expõe X-Powered-By e envia nosniff', async () => {
    const { headers } = await api('/api/health');
    assert.equal(headers.get('x-powered-by'), null);
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
  });

  it('404 em rota inexistente', async () => {
    const { status } = await api('/api/qualquer-coisa');
    assert.equal(status, 404);
  });
});
