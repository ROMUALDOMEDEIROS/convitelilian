import { useCallback, useEffect, useState } from 'react';
import SheetPreview from './SheetPreview';
import { fetchDias, fetchSnapshot, type DiaGravado, type TurnoGravado } from '../lib/api';
import { formatDataLonga } from '../lib/header';
import { exportTablePdf } from '../lib/pdf';
import { toTableRows } from '../lib/rows';
import { TABLES } from '../schema';
import type { TableDef } from '../schema';

/** Rótulo curto de cada folha, para as abas do painel. */
const APELIDO: Record<string, string> = {
  tabela1: 'Viaturas',
  tabela2: 'Pais / responsáveis',
};

function diaDeHoje(): string {
  const hoje = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoje.getFullYear()}-${p(hoje.getMonth() + 1)}-${p(hoje.getDate())}`;
}

/**
 * Consulta dos turnos já gravados no banco.
 *
 * O servidor guarda os últimos sete dias de cada folha; ao passar disso, o dia
 * vira um PDF na pasta `server/arquivo` e sai do banco. Por isso esta tela
 * mostra o que está no banco, e diz onde procurar o que já saiu dele.
 */
export default function HistoricoPanel() {
  const [aberto, setAberto] = useState(false);
  const [folha, setFolha] = useState<TableDef>(TABLES[0]);
  const [dias, setDias] = useState<DiaGravado[] | null>(null);
  const [carregandoDias, setCarregandoDias] = useState(false);
  const [turno, setTurno] = useState<TurnoGravado | null>(null);
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDias = useCallback(async (table: TableDef) => {
    setCarregandoDias(true);
    setErro(null);
    const lista = await fetchDias(table);
    setDias(lista);
    setCarregandoDias(false);
    if (lista === null) setErro('Não consegui falar com o banco da unidade.');
  }, []);

  useEffect(() => {
    if (!aberto) return;
    void carregarDias(folha);
    setTurno(null);
    setDiaAberto(null);
  }, [aberto, folha, carregarDias]);

  async function abrirDia(dia: string) {
    setErro(null);
    setDiaAberto(dia);
    const gravado = await fetchSnapshot(folha, dia);
    if (!gravado) {
      setTurno(null);
      setErro(`Não consegui ler o dia ${dia}. Ele pode já ter saído do banco.`);
      return;
    }
    setTurno(gravado);
  }

  const hoje = diaDeHoje();

  return (
    <section className="rg-card mb-6">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <h2 className="text-sm font-bold" style={{ color: 'var(--red-800)' }}>
          Consultar dias anteriores
          <span className="ml-2 font-normal" style={{ color: 'var(--muted)' }}>
            — os últimos 7 dias ficam no banco
          </span>
        </h2>
        <button
          type="button"
          className="text-xs underline"
          style={{ color: 'var(--muted)' }}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? 'fechar ▲' : 'abrir para consultar ▼'}
        </button>
      </header>

      {aberto && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {TABLES.map((table) => (
              <button
                key={table.id}
                type="button"
                className={table.id === folha.id ? 'rg-btn rg-btn-primary' : 'rg-btn'}
                onClick={() => setFolha(table)}
              >
                {APELIDO[table.id] ?? table.id}
              </button>
            ))}
          </div>

          {carregandoDias && <p className="text-sm text-gray-500">Carregando…</p>}

          {erro && <p className="mb-2 text-sm text-red-700">{erro}</p>}

          {!carregandoDias && dias !== null && dias.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhum dia gravado ainda nesta folha. Use “Salvar no banco” ao fim do turno.
            </p>
          )}

          {!carregandoDias && dias !== null && dias.length > 0 && (
            <ul className="mb-3 divide-y divide-gray-200 border border-gray-200">
              {dias.map((registro) => (
                <li
                  key={registro.dia}
                  className={
                    registro.dia === diaAberto
                      ? 'flex flex-wrap items-center justify-between gap-2 bg-yellow-50 px-3 py-2'
                      : 'flex flex-wrap items-center justify-between gap-2 px-3 py-2'
                  }
                >
                  <span className="text-sm">
                    {formatDataLonga(registro.dia)}
                    {registro.dia === hoje && (
                      <strong className="ml-2 text-xs" style={{ color: 'var(--red-800)' }}>
                        hoje
                      </strong>
                    )}
                    <span className="ml-2 text-xs text-gray-500">
                      {registro.rowCount} linha{registro.rowCount === 1 ? '' : 's'}
                    </span>
                  </span>
                  <button type="button" className="rg-btn" onClick={() => void abrirDia(registro.dia)}>
                    Ver folha
                  </button>
                </li>
              ))}
            </ul>
          )}

          {turno && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rg-btn rg-btn-primary"
                  onClick={() =>
                    // mesmo nome que o arquivamento usa em disco, para o dia
                    // ficar identificado no arquivo baixado
                    exportTablePdf(
                      folha,
                      turno.header,
                      toTableRows(turno.rows),
                      `${turno.dia}-${folha.slug}.pdf`,
                    )
                  }
                >
                  Baixar PDF deste dia
                </button>
                <span className="text-xs text-gray-500">
                  {formatDataLonga(turno.dia)} — {turno.rowCount} linha
                  {turno.rowCount === 1 ? '' : 's'}
                </span>
              </div>
              <SheetPreview
                table={folha}
                header={turno.header}
                rows={toTableRows(turno.rows)}
                onFechar={() => {
                  setTurno(null);
                  setDiaAberto(null);
                }}
              />
            </>
          )}

          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            Passados 7 dias, o turno sai do banco e fica guardado como PDF na pasta{' '}
            <code>server\arquivo</code> da máquina do servidor, com nome{' '}
            <code>2026-08-19-viaturas.pdf</code>. Nada é apagado sem essa cópia ter sido gravada
            antes.
          </p>
        </div>
      )}
    </section>
  );
}
