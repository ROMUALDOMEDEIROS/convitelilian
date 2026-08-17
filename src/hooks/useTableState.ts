import { useCallback, useState } from 'react';
import { ImportError, importFile, type ImportReport } from '../lib/import';
import { normalizeCell } from '../lib/normalize';
import { emptyRow, toTableRows, type TableRow } from '../lib/rows';
import type { TableDef } from '../schema';

export interface TableState {
  rows: TableRow[];
  report: ImportReport | null;
  error: string | null;
}

export interface TableActions {
  importFrom: (file: File) => Promise<void>;
  editCell: (rowId: string, columnKey: string, value: string) => void;
  commitCell: (rowId: string, columnKey: string) => void;
  addRow: () => void;
  deleteRow: (rowId: string) => void;
}

export function useTableState(table: TableDef): [TableState, TableActions] {
  const [state, setState] = useState<TableState>({ rows: [], report: null, error: null });

  const importFrom = useCallback(
    async (file: File) => {
      try {
        const report = await importFile(file, table);
        setState({ rows: toTableRows(report.rows), report, error: null });
        console.log(`[${table.id}] importado`, report);
      } catch (error) {
        if (error instanceof ImportError) {
          // erro previsto (coluna ausente): a mensagem vai para a tela, não para o console
          setState({ rows: [], report: null, error: error.message });
          return;
        }
        setState({
          rows: [],
          report: null,
          error: `Falha ao ler "${file.name}": ${(error as Error).message}`,
        });
        console.error(`[${table.id}] falha inesperada na importação`, error);
      }
    },
    [table],
  );

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

  return [state, { importFrom, editCell, commitCell, addRow, deleteRow }];
}
