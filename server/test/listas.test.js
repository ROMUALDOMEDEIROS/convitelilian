import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';

const silent = { log() {}, error() {} };
let store, server, base;

async function api(path, options = {}) {
  const res = await fetch(`${base}${path}`, options);
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}
function putListas(payload) {
  return api('/api/listas', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

before(async () => {
  store = openDatabase(':memory:');
  server = createApp({ store, allowedOrigins: [], logger: silent }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); store.close(); });

describe('listas: banco compartilhado de viaturas e condutores', () => {
  it('começa vazio, na versão 0', async () => {
    const { status, body } = await api('/api/listas');
    assert.equal(status, 200);
    assert.equal(body.versao, 0);
    assert.deepEqual(body.listas, { vtr: [], condutor: [] });
  });

  it('grava e devolve versão 1', async () => {
    const { status, body } = await putListas({
      listas: { vtr: ['AO 42', 'AA 11'], condutor: ['MATIAS SGT'] },
      baseVersao: 0,
    });
    assert.equal(status, 200);
    assert.equal(body.versao, 1);
  });

  it('lê de volta o que foi gravado', async () => {
    const { body } = await api('/api/listas');
    assert.equal(body.versao, 1);
    assert.deepEqual(body.listas.vtr, ['AO 42', 'AA 11']);
    assert.deepEqual(body.listas.condutor, ['MATIAS SGT']);
  });

  it('grava por cima quando a base bate, subindo a versão', async () => {
    const { body } = await putListas({
      listas: { vtr: ['AO 42'], condutor: ['MATIAS SGT', 'GOMES PTTC'] },
      baseVersao: 1,
    });
    assert.equal(body.versao, 2);
  });

  it('RECUSA com 409 quando a base está velha, e devolve o estado atual', async () => {
    // simula uma segunda máquina que ainda tinha a versão 1
    const { status, body } = await putListas({
      listas: { vtr: ['LIXO'], condutor: [] },
      baseVersao: 1,
    });
    assert.equal(status, 409);
    assert.equal(body.versao, 2, 'informa a versão atual para a tela reconciliar');
    assert.deepEqual(body.listas.condutor, ['MATIAS SGT', 'GOMES PTTC']);

    // e não gravou o lixo
    const atual = await api('/api/listas');
    assert.equal(atual.body.versao, 2);
    assert.ok(!atual.body.listas.vtr.includes('LIXO'));
  });

  it('forcar: true sobrescreve mesmo com base velha', async () => {
    const { status, body } = await putListas({
      listas: { vtr: ['FORCADO'], condutor: [] },
      baseVersao: 0,
      forcar: true,
    });
    assert.equal(status, 200);
    assert.equal(body.versao, 3);
    const atual = await api('/api/listas');
    assert.deepEqual(atual.body.listas.vtr, ['FORCADO']);
  });

  it('mantém histórico de todas as versões', () => {
    const total = store.db.prepare('SELECT COUNT(*) AS n FROM listas_version').get().n;
    assert.equal(total, 3);
  });

  it('preserva acentos', async () => {
    await putListas({ listas: { vtr: [], condutor: ['ARAGÃO SGT', 'MENDONÇA PTTC'] }, baseVersao: 3 });
    const { body } = await api('/api/listas');
    assert.deepEqual(body.listas.condutor, ['ARAGÃO SGT', 'MENDONÇA PTTC']);
  });

  it('recusa lista desconhecida', async () => {
    const base = (await api('/api/listas')).body.versao;
    const { status, body } = await putListas({ listas: { motos: ['X'] }, baseVersao: base });
    assert.equal(status, 400);
    assert.match(body.erro, /desconhecida/);
  });

  it('recusa item não textual', async () => {
    const base = (await api('/api/listas')).body.versao;
    const { status } = await putListas({ listas: { vtr: [123], condutor: [] }, baseVersao: base });
    assert.equal(status, 400);
  });

  it('recusa baseVersao ausente ou negativa', async () => {
    assert.equal((await putListas({ listas: { vtr: [], condutor: [] } })).status, 400);
    assert.equal((await putListas({ listas: { vtr: [], condutor: [] }, baseVersao: -1 })).status, 400);
  });

  it('trata SQL injection como texto', async () => {
    const veneno = "'); DROP TABLE listas;--";
    const base = (await api('/api/listas')).body.versao;
    await putListas({ listas: { vtr: [veneno], condutor: [] }, baseVersao: base });
    const { body } = await api('/api/listas');
    assert.ok(body.listas.vtr.includes(veneno));
    const existe = store.db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='listas'`)
      .all();
    assert.equal(existe.length, 1);
  });
});
