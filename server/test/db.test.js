import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { openDatabase } from '../src/db.js';

describe('openDatabase', () => {
  it('usa banco em memória de verdade, sem criar arquivo no disco', () => {
    const store = openDatabase(':memory:');
    store.save({
      tableId: 'tabela1',
      dia: '2026-08-17',
      header: {},
      rows: [{ condutor: 'GOMES PTTC' }],
      origem: 'manual',
    });
    assert.equal(store.load('tabela1', '2026-08-17').rowCount, 1);
    store.close();

    // o bug anterior criava um diretório/arquivo chamado literalmente ":memory:"
    assert.equal(existsSync(new URL('../:memory:', import.meta.url)), false);
  });
});
