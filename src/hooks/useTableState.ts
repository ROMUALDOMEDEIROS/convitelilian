import { useCallback, useEffect, useState } from 'react';
import { defaultHeaderValues } from '../lib/header';
import { normalizeCell } from '../lib/normalize';
import { normalizeHora } from '../lib/text';
import { emptyRow, toTableRows, type TableRow } from '../lib/rows';
import { clearTable, loadTable, saveTable } from '../lib/storage';
import type { HeaderValues, Row, TableDef } from '../schema';

export interface TableState {
  header: HeaderValues;
  rows: TableRow[];
  /** true quando o conteúdo veio do localStorage ao abrir a tela */
  restored: boolean;
}

export interface TableActions {
  editHeader: (fieldKey: string, value: string) => void;
  editCell: (rowId: string, columnKey: string, value: string) => void;
  commitCell: (rowId: string, columnKey: string) => void;
  addRow: () => void;
  loadExample: (rows: Row[]) => void;
  deleteRow: (rowId: string) => void;
  clearAll: () => void;
}

export function useTableState(table: TableDef): [TableState, TableActions] {
  const [state, setState] = useState<TableState>(() => {
    const restored = loadTable(table);
    return {
      header: restored?.header ?? defaultHeaderValues(table),
      rows: restored ? toTableRows(restored.rows) : [],
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

  /** Saída da célula: aplica a mesma normalização da importação e, quando a
   *  coluna pede, carimba a hora atual na coluna de destino. */
  const commitCell = useCallback(
    (rowId: string, columnKey: string) => {
      const column = table.columns.find((c) => c.key === columnKey);
      if (!column) return;

      setState((current) => ({
        ...current,
        rows: current.rows.map((row) => {
          if (row.id !== rowId) return row;

          const cells = {
            ...row.cells,
            [columnKey]: normalizeCell(row.cells[columnKey], column),
          };

          // Lançou a viatura, a hora do movimento fica registrada sozinha.
          // A condição de vazio é o que torna isto seguro: uma hora digitada
          // à mão, ou vinda de um arquivo importado, nunca é sobrescrita.
          const destino = column.carimbaHoraEm;
          if (destino && cells[columnKey] !== '' && (cells[destino] ?? '') === '') {
            cells[destino] = normalizeHora(new Date());
          }

          return { ...row, cells };
        }),
      }));
    },
    [table],
  );

  const addRow = useCallback(() => {
    setState((current) => ({ ...current, rows: [...current.rows, emptyRow(table.columns)] }));
  }, [table]);

  /** Usada apenas pelo botão de exemplo do modo demonstração. */
  const loadExample = useCallback((rows: Row[]) => {
    setState((current) => ({ ...current, rows: toTableRows(rows) }));
  }, []);

  const deleteRow = useCallback((rowId: string) => {
    setState((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== rowId) }));
  }, []);

  /** Encerra o turno: apaga o que está gravado e volta a data para hoje. */
  const clearAll = useCallback(() => {
    clearTable(table);
    setState({
      header: defaultHeaderValues(table),
      rows: [],
      restored: false,
    });
  }, [table]);

  return [
    state,
    { editHeader, editCell, commitCell, addRow, loadExample, deleteRow, clearAll },
  ];
}
