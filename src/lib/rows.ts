import type { ColumnDef, Row } from '../schema';

/** Uma linha na tela. O `id` é interno e existe só para o React manter o foco
 *  da célula ao adicionar ou excluir linhas — nunca vai para o PDF. */
export interface TableRow {
  id: string;
  cells: Row;
}

let counter = 0;

function nextId(): string {
  counter += 1;
  return `r${counter}`;
}

export function emptyRow(columns: ColumnDef[]): TableRow {
  const cells: Row = {};
  for (const column of columns) cells[column.key] = '';
  return { id: nextId(), cells };
}

export function toTableRows(rows: Row[]): TableRow[] {
  return rows.map((cells) => ({ id: nextId(), cells }));
}
