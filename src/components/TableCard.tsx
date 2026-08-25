import { useMemo, useState } from 'react';
import ConfirmarBotao from './ConfirmarBotao';
import DataTable from './DataTable';
import FormHeader from './FormHeader';
import SheetPreview from './SheetPreview';
import SyncBar from './SyncBar';
import { exportTablePdf } from '../lib/pdf';
import { DEMO } from '../lib/demo';
import { EXEMPLOS } from '../lib/exemplo';
import { useDbSync } from '../hooks/useDbSync';
import type { TableActions, TableState } from '../hooks/useTableState';
import type { ListKey, Listas } from '../lib/lists';
import type { TableDef } from '../schema';

interface Props {
  table: TableDef;
  listas: Listas;
  onCadastrar: (key: ListKey, valor: string) => void;
  state: TableState;
  actions: TableActions;
}

export default function TableCard({ table, listas, onCadastrar, state, actions }: Props) {
  const { rows, header, restored } = state;
  // memoizado para não gerar um array novo a cada render do card
  const cells = useMemo(() => rows.map((row) => row.cells), [rows]);
  const { status: sync, salvarAgora, intervaloMs } = useDbSync(table, header, cells);
  // No modo demonstração a página roda num iframe com sandbox, onde o leitor de
  // PDF do navegador não abre. Em vez do arquivo, mostra a prévia em HTML.
  const [mostrarPreview, setMostrarPreview] = useState(false);

  function exportar() {
    if (DEMO) setMostrarPreview(true);
    else exportTablePdf(table, header, rows);
  }

  return (
    <section className="rg-card mb-6 p-4 sm:p-5">
      <header className="mb-3">
        <h2 className="text-base font-bold" style={{ color: 'var(--red-800)' }}>
          {table.title}
        </h2>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {table.columns.map((c) => c.label).join(' · ')}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          type="button"
          className="rg-btn"
          onClick={actions.addRow}
        >
          + Adicionar linha
        </button>
        <button
          type="button"
          className="rg-btn rg-btn-primary"
          onClick={exportar}
        >
          {DEMO ? 'Ver folha em A4' : `Exportar PDF (${table.fileName})`}
        </button>
        {DEMO && (
          <button
            type="button"
            className="rg-btn"
            onClick={() => actions.loadExample(EXEMPLOS[table.id])}
          >
            Carregar exemplo
          </button>
        )}
        <ConfirmarBotao
          label="Limpar"
          pergunta={
            rows.length > 0
              ? `Apagar ${rows.length} linha(s) e o cabeçalho? Não pode ser desfeito.`
              : 'Limpar o cabeçalho desta folha?'
          }
          confirmar="Sim, limpar"
          onConfirm={actions.clearAll}
        />
        <span className="text-xs text-gray-500">
          {rows.length} linha{rows.length === 1 ? '' : 's'}
        </span>
      </div>

      {restored && (
        <p className="mb-2 text-xs text-gray-500">
          Conteúdo restaurado deste navegador. Use “Limpar” para começar um turno novo.
        </p>
      )}

      <SyncBar status={sync} intervaloMs={intervaloMs} onSalvar={salvarAgora} />

      <FormHeader table={table} header={header} actions={actions} />

      <DataTable
        table={table}
        rows={rows}
        actions={actions}
        listas={listas}
        onCadastrar={onCadastrar}
      />

      {DEMO && mostrarPreview && (
        <SheetPreview
          table={table}
          header={header}
          rows={rows}
          onFechar={() => setMostrarPreview(false)}
        />
      )}

    </section>
  );
}
