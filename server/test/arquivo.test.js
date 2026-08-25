import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { openDatabase } from '../src/db.js';
import {
  arquivarEExpurgar,
  diaDeCorte,
  diaISO,
  nomeDoArquivo,
  RETENCAO_DIAS,
} from '../src/arquivo.js';
import { TABELA1 } from '../../shared/schema.js';

const HOJE = new Date(2026, 7, 25); // 25/08/2026, meio local
const calado = () => {};

function pastaTemporaria() {
  return mkdtempSync(join(tmpdir(), 'arquivo-teste-'));
}

/** Banco em memória com um turno gravado em cada dia pedido. */
function bancoCom(dias, tableId = 'tabela1') {
  const store = openDatabase(':memory:');
  for (const dia of dias) {
    store.save({
      tableId,
      dia,
      header: { data: dia, cmt: 'ROMUALDO', vigilante: 'TESTE' },
      rows: [{ entrada: '', saida: '18:08', interna: 'APS 240', externa: '', condutor: 'ALVES' }],
      origem: 'manual',
    });
  }
  return store;
}

describe('janela de retenção', () => {
  it('mantém sete dias contando o de hoje', () => {
    // de 19 a 25 são sete dias; o corte é o 19, e tudo anterior vence
    assert.equal(diaDeCorte(HOJE, 7), '2026-08-19');
  });

  it('atravessa a virada do mês sem quebrar', () => {
    assert.equal(diaDeCorte(new Date(2026, 8, 3), 7), '2026-08-28');
  });

  it('usa o fuso local, o mesmo critério de dia da tela', () => {
    assert.equal(diaISO(new Date(2026, 7, 25, 23, 59)), '2026-08-25');
  });

  it('a retenção padrão é de sete dias', () => {
    assert.equal(RETENCAO_DIAS, 7);
  });
});

describe('arquivar e expurgar', () => {
  it('grava o PDF do dia vencido e o remove do banco', () => {
    const pasta = pastaTemporaria();
    const store = bancoCom(['2026-08-17', '2026-08-25']);

    const { arquivados, falhas } = arquivarEExpurgar({
      store,
      pasta,
      hoje: HOJE,
      onAviso: calado,
    });

    assert.deepEqual(falhas, []);
    assert.deepEqual(arquivados, ['2026-08-17-viaturas.pdf']);

    const pdf = readFileSync(join(pasta, '2026-08-17-viaturas.pdf'));
    assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    assert.ok(pdf.length > 1000, 'o PDF não pode sair vazio');

    assert.equal(store.load('tabela1', '2026-08-17'), null, 'o dia vencido saiu do banco');
    assert.ok(store.load('tabela1', '2026-08-25'), 'o dia de hoje continua no banco');

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('não toca em nenhum dos sete dias da janela', () => {
    const pasta = pastaTemporaria();
    const dias = ['2026-08-19', '2026-08-20', '2026-08-25'];
    const store = bancoCom(dias);

    const { arquivados } = arquivarEExpurgar({ store, pasta, hoje: HOJE, onAviso: calado });

    assert.deepEqual(arquivados, []);
    for (const dia of dias) {
      assert.ok(store.load('tabela1', dia), `${dia} devia continuar no banco`);
    }
    // sem nada a arquivar, nem a pasta chega a ser usada
    assert.equal(existsSync(join(pasta, '2026-08-19-viaturas.pdf')), false);

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('apaga o dia nas duas folhas, cada uma no seu arquivo', () => {
    const pasta = pastaTemporaria();
    const store = openDatabase(':memory:');
    for (const tableId of ['tabela1', 'tabela2']) {
      store.save({
        tableId,
        dia: '2026-08-10',
        header: { data: '2026-08-10' },
        rows: [{ hora: '08:00', responsavel: 'FULANO', interna: 'APS 240' }],
        origem: 'manual',
      });
    }

    const { arquivados } = arquivarEExpurgar({ store, pasta, hoje: HOJE, onAviso: calado });

    assert.deepEqual(arquivados.sort(), [
      '2026-08-10-pais-responsaveis.pdf',
      '2026-08-10-viaturas.pdf',
    ]);
    assert.equal(store.load('tabela1', '2026-08-10'), null);
    assert.equal(store.load('tabela2', '2026-08-10'), null);

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('leva o histórico de versões junto ao apagar o dia', () => {
    const pasta = pastaTemporaria();
    const store = bancoCom(['2026-08-10']);
    // segunda gravação do mesmo dia: agora são duas versões
    store.save({
      tableId: 'tabela1',
      dia: '2026-08-10',
      header: { data: '2026-08-10' },
      rows: [],
      origem: 'automatico',
    });

    const versoes = () =>
      store.db
        .prepare(
          `SELECT COUNT(*) AS total FROM snapshot_version v
             JOIN snapshot s ON s.id = v.snapshot_id
            WHERE s.table_id = 'tabela1' AND s.dia = '2026-08-10'`,
        )
        .get().total;

    assert.equal(versoes(), 2);
    arquivarEExpurgar({ store, pasta, hoje: HOJE, onAviso: calado });
    assert.equal(versoes(), 0, 'a cascata da chave estrangeira levou o histórico');

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('NÃO apaga o dia quando o PDF não pode ser gravado', () => {
    // A pasta de destino aponta para um ARQUIVO comum: o mkdir falha com
    // EEXIST e nada chega a ser escrito. Foi preciso provocar a falha assim, e
    // não com chmod, porque o teste roda como root em container — e root
    // escreve em pasta somente-leitura, o que faria este teste passar por
    // engano justamente no ambiente de CI.
    const base = pastaTemporaria();
    const pasta = join(base, 'isto-e-um-arquivo');
    writeFileSync(pasta, 'nao sou uma pasta');
    const store = bancoCom(['2026-08-10']);

    const { arquivados, falhas } = arquivarEExpurgar({
      store,
      pasta,
      hoje: HOJE,
      onAviso: calado,
    });

    assert.deepEqual(arquivados, [], 'nada pode ser dado como arquivado');
    assert.equal(falhas.length, 1);
    assert.match(falhas[0].arquivo, /2026-08-10-viaturas\.pdf/);
    assert.ok(
      store.load('tabela1', '2026-08-10'),
      'o dia TEM de continuar no banco quando o arquivamento falha',
    );

    store.close();
    rmSync(base, { recursive: true, force: true });
  });

  it('a falha de uma folha não impede o arquivamento da outra', () => {
    const pasta = pastaTemporaria();
    const store = bancoCom(['2026-08-10']);
    // ocupa o nome do arquivo com uma PASTA: o writeFile daquele dia falha,
    // e o outro dia tem de seguir normalmente
    mkdirSync(join(pasta, nomeDoArquivo(TABELA1, '2026-08-10')));
    store.save({
      tableId: 'tabela1',
      dia: '2026-08-11',
      header: { data: '2026-08-11' },
      rows: [],
      origem: 'manual',
    });

    const { arquivados, falhas } = arquivarEExpurgar({
      store,
      pasta,
      hoje: HOJE,
      onAviso: calado,
    });

    assert.deepEqual(arquivados, ['2026-08-11-viaturas.pdf']);
    assert.equal(falhas.length, 1);
    assert.ok(store.load('tabela1', '2026-08-10'), 'o que falhou continua no banco');
    assert.equal(store.load('tabela1', '2026-08-11'), null, 'o que deu certo saiu');

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('rodar duas vezes seguidas não estraga nada', () => {
    const pasta = pastaTemporaria();
    const store = bancoCom(['2026-08-10']);

    const primeira = arquivarEExpurgar({ store, pasta, hoje: HOJE, onAviso: calado });
    const segunda = arquivarEExpurgar({ store, pasta, hoje: HOJE, onAviso: calado });

    assert.deepEqual(primeira.arquivados, ['2026-08-10-viaturas.pdf']);
    assert.deepEqual(segunda.arquivados, [], 'na segunda passada já não há o que fazer');
    assert.deepEqual(segunda.falhas, []);

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('o PDF arquivado carrega o conteúdo do turno, não uma folha em branco', () => {
    const pasta = pastaTemporaria();
    const store = openDatabase(':memory:');
    store.save({
      tableId: 'tabela1',
      dia: '2026-08-10',
      header: { data: '2026-08-10', cmt: 'ROMUALDO', vigilante: 'TESTE' },
      rows: Array.from({ length: 60 }, (_, i) => ({
        entrada: '',
        saida: '08:00',
        interna: `APS ${200 + i}`,
        externa: '',
        condutor: 'ALVES PTTC',
      })),
      origem: 'manual',
    });

    arquivarEExpurgar({ store, pasta, hoje: HOJE, onAviso: calado });
    const pdf = readFileSync(join(pasta, '2026-08-10-viaturas.pdf'));

    // 60 linhas ocupam mais de uma página; o arquivo tem de refletir isso
    assert.ok(pdf.length > 5000, `PDF pequeno demais para 60 linhas: ${pdf.length} bytes`);

    store.close();
    rmSync(pasta, { recursive: true, force: true });
  });
});
