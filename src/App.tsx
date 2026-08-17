import { useRef, useState } from 'react';
import { ImportError, importFile, type ImportReport } from './lib/import';
import { TABELA1, TABELA2, type Row, type TableDef } from './schema';

interface TableState {
  rows: Row[];
  report: ImportReport | null;
  error: string | null;
}

const EMPTY: TableState = { rows: [], report: null, error: null };

function ImportPanel({
  table,
  state,
  onImport,
}: {
  table: TableDef;
  state: TableState;
  onImport: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="border p-4 mb-6">
      <h2 className="font-bold">{table.title}</h2>
      <p className="text-sm text-gray-600 mb-2">
        Colunas esperadas: {table.columns.map((c) => c.label).join(' · ')}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xlsm,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          // permite reimportar o mesmo arquivo
          event.target.value = '';
        }}
      />

      <button
        type="button"
        className="border px-3 py-1"
        onClick={() => inputRef.current?.click()}
      >
        Importar {table.id === 'tabela1' ? 'Tabela 1' : 'Tabela 2'}
      </button>

      {state.error && (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      )}

      {state.report && !state.error && (
        <div className="mt-2 text-sm">
          <p>
            <strong>{state.rows.length}</strong> linha(s) importada(s) de{' '}
            <code>{state.report.fileName}</code> — aba{' '}
            <code>{state.report.sheetName}</code>, cabeçalho na linha{' '}
            {state.report.headerRow}
            {state.report.mergedHeader && ' (montado com a linha acima)'}
            {state.report.separator && `, separador "${state.report.separator}"`}
            {state.report.encoding && `, ${state.report.encoding}`}.
          </p>
          <p className="text-gray-600">
            {state.report.skippedBlank} linha(s) vazia(s) descartada(s).
          </p>
          <pre className="mt-2 max-h-48 overflow-auto bg-gray-100 p-2 text-xs">
            {JSON.stringify(state.rows, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [tabela1, setTabela1] = useState<TableState>(EMPTY);
  const [tabela2, setTabela2] = useState<TableState>(EMPTY);

  async function handleImport(
    table: TableDef,
    file: File,
    setState: (state: TableState) => void,
  ) {
    try {
      const report = await importFile(file, table);
      setState({ rows: report.rows, report, error: null });
      console.log(`[${table.id}] importado`, report);
    } catch (error) {
      if (error instanceof ImportError) {
        // erro previsto (coluna ausente): a mensagem vai para a tela, não para o console
        setState({ ...EMPTY, error: error.message });
        return;
      }
      setState({
        ...EMPTY,
        error: `Falha ao ler "${file.name}": ${(error as Error).message}`,
      });
      console.error(`[${table.id}] falha inesperada na importação`, error);
    }
  }

  return (
    <main className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold mb-4">Registro da Guarda</h1>

      <ImportPanel
        table={TABELA1}
        state={tabela1}
        onImport={(file) => handleImport(TABELA1, file, setTabela1)}
      />
      <ImportPanel
        table={TABELA2}
        state={tabela2}
        onImport={(file) => handleImport(TABELA2, file, setTabela2)}
      />
    </main>
  );
}
