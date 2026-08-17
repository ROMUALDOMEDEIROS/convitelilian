import { useRef } from 'react';
import DataTable from './DataTable';
import FormHeader from './FormHeader';
import { exportTablePdf } from '../lib/pdf';
import type { TableActions, TableState } from '../hooks/useTableState';
import type { TableDef } from '../schema';

interface Props {
  table: TableDef;
  label: string;
  state: TableState;
  actions: TableActions;
}

export default function TableCard({ table, label, state, actions }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { report, error, rows, header, restored } = state;

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
          Importar {label}
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
          onClick={() => exportTablePdf(table, header, rows)}
        >
          Exportar {label}
        </button>
        <button
          type="button"
          className="border border-gray-400 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          onClick={() => {
            const aviso =
              rows.length > 0
                ? `Apagar as ${rows.length} linha(s) e o cabeçalho de "${table.title}"? Isso não pode ser desfeito.`
                : `Limpar o cabeçalho de "${table.title}"?`;
            if (window.confirm(aviso)) actions.clearAll();
          }}
        >
          Limpar
        </button>
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

      <FormHeader table={table} header={header} actions={actions} />

      <DataTable table={table} rows={rows} actions={actions} />
    </section>
  );
}
