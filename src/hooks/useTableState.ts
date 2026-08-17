import { useCallback, useEffect, useState } from 'react';
import { defaultHeaderValues } from '../lib/header';
import { ImportError, importFile, type ImportReport } from '../lib/import';
import { normalizeCell } from '../lib/normalize';
import { emptyRow, toTableRows, type TableRow } from '../lib/rows';
import { clearTable, loadTable, saveTable } from '../lib/storage';
import type { HeaderValues, TableDef } from '../schema';

export interface TableState {
  header: HeaderValues;
  rows: TableRow[];
  report: ImportReport | null;
  error: string | null;
  /** true quando o conteúdo veio do localStorage ao abrir a tela */
  restored: boolean;
}

export interface TableActions {
  importFrom: (file: File) => Promise<void>;
  editHeader: (fieldKey: string, value: string) => void;
  editCell: (rowId: string, columnKey: string, value: string) => void;
  commitCell: (rowId: string, columnKey: string) => void;
  addRow: () => void;
  deleteRow: (rowId: string) => void;
  clearAll: () => void;
}

export function useTableState(table: TableDef): [TableState, TableActions] {
  const [state, setState] = useState<TableState>(() => {
    const restored = loadTable(table);
    return {
      header: restored?.header ?? defaultHeaderValues(table),
      rows: restored ? toTableRows(restored.rows) : [],
      report: null,
      error: null,
      restored: restored !== null,
    };
  });

  // Grava a cada mudança. É sincrono e o payload é pequeno, então não uso
  // debounce: qualquer atraso abriria uma janela de perda se o navegador
  // fechasse no meio de um lançamento.
  useEffect(() => {
    saveTable(
      table,
      state.header,
      state.rows.map((row) => row.cells),
    );
  }, [table, state.header, state.rows]);

  const importFrom = useCallback(
    async (file: File) => {
      try {
        const report = await importFile(file, table);
        setState({
          header: report.header,
          rows: toTableRows(report.rows),
          report,
          error: null,
          restored: false,
        });
        console.log(`[${table.id}] importado`, report);
      } catch (error) {
        if (error instanceof ImportError) {
          // erro previsto (coluna ausente): a mensagem vai para a tela, não para o console
          setState((current) => ({ ...current, rows: [], report: null, error: error.message }));
          return;
        }
        setState((current) => ({
          ...current,
          rows: [],
          report: null,
          error: `Falha ao ler "${file.name}": ${(error as Error).message}`,
        }));
        console.error(`[${table.id}] falha inesperada na importação`, error);
      }
    },
    [table],
  );

  const editHeader = useCallback((fieldKey: string, value: string) => {
    setState((current) => ({ ...current, header: { ...current.header, [fieldKey]: value } }));
  }, []);

  /** Digitação: guarda o texto cru, sem interferir enquanto o usuário escreve. */
  const editCell = useCallback((rowId: string, columnKey: string, value: string) => {
    setState((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === rowId ? { ...row, cells: { ...row.cells, [columnKey]: value } } : row,
      ),
    }));
  }, []);

  /** Saída da célula: aplica a mesma normalização da importação. */
  const commitCell = useCallback(
    (rowId: string, columnKey: string) => {
      const column = table.columns.find((c) => c.key === columnKey);
      if (!column) return;

      setState((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                cells: { ...row.cells, [columnKey]: normalizeCell(row.cells[columnKey], column) },
              }
            : row,
        ),
      }));
    },
    [table],
  );

  const addRow = useCallback(() => {
    setState((current) => ({ ...current, rows: [...current.rows, emptyRow(table.columns)] }));
  }, [table]);

  const deleteRow = useCallback((rowId: string) => {
    setState((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== rowId) }));
  }, []);

  /** Encerra o turno: apaga o que está gravado e volta a data para hoje. */
  const clearAll = useCallback(() => {
    clearTable(table);
    setState({
      header: defaultHeaderValues(table),
      rows: [],
      report: null,
      error: null,
      restored: false,
    });
  }, [table]);

  return [
    state,
    { importFrom, editHeader, editCell, commitCell, addRow, deleteRow, clearAll },
  ];
}
