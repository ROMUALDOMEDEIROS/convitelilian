import { useMemo, useRef, useState } from 'react';
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
import type { Listas } from '../lib/lists';
import type { TableDef } from '../schema';

interface Props {
  table: TableDef;
  listas: Listas;
  /** Como esta folha é chamada nos botões. "Tabela 1" e "Tabela 2" não diziam
   *  nada a quem opera; o nome do arquivo gerado segue sendo tabela1.pdf e
   *  tabela2.pdf, como pede a especificação. */
  label: string;
  state: TableState;
  actions: TableActions;
}

export default function TableCard({ table, label, listas, state, actions }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { report, error, rows, header, restored } = state;
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
    <section className="mb-10">
      <header className="mb-2">
        <h2 className="text-base font-bold">{table.title}</h2>
        <p className="text-xs text-gray-500">
          {table.columns.map((c) => c.label).join(' · ')}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xlsm,.xls"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void actions.importFrom(file);
            // permite reimportar o mesmo arquivo
            event.target.value = '';
          }}
        />
        <button
          type="button"
          className="border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100"
          onClick={() => inputRef.current?.click()}
        >
          Importar planilha de {label}
        </button>
        <button
          type="button"
          className="border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100"
          onClick={actions.addRow}
        >
          + Adicionar linha
        </button>
        <button
          type="button"
          className="border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100"
          onClick={exportar}
        >
          {DEMO ? 'Ver folha em A4' : `Exportar PDF (${table.fileName})`}
        </button>
        {DEMO && (
          <button
            type="button"
            className="border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100"
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

      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}

      {restored && !report && (
        <p className="mb-2 text-xs text-gray-500">
          Conteúdo restaurado deste navegador. Use “Limpar” para começar um turno novo.
        </p>
      )}

      {report && !error && (
        <p className="mb-2 text-xs text-gray-500">
          {report.fileName} — aba {report.sheetName}, cabeçalho na linha {report.headerRow}
          {report.mergedHeader && ' (montado com a linha acima)'}
          {report.separator && `, separador "${report.separator}"`}
          {report.encoding && `, ${report.encoding}`}
          {report.skippedBlank > 0 && `, ${report.skippedBlank} linha(s) vazia(s) descartada(s)`}
          {report.headerFound.length > 0 &&
            `. Cabeçalho lido do arquivo: ${report.headerFound.join(', ')}`}
        </p>
      )}

      <SyncBar status={sync} intervaloMs={intervaloMs} onSalvar={salvarAgora} />

      <FormHeader table={table} header={header} actions={actions} />

      <DataTable table={table} rows={rows} actions={actions} listas={listas} />

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
