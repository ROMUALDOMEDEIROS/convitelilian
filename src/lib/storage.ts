import { todayISO } from './header';
import type { HeaderValues, Row, TableDef } from '../schema';

/** Versão do formato gravado. Se o formato mudar, sobe o número e o que estiver
 *  gravado na versão antiga é ignorado em vez de quebrar a tela. */
const VERSION = 1;
const PREFIX = 'registro-guarda';

interface StoredTable {
  v: number;
  header: HeaderValues;
  rows: Row[];
}

export interface RestoredTable {
  header: HeaderValues;
  rows: Row[];
}

function keyFor(table: TableDef): string {
  return `${PREFIX}:${table.id}`;
}

/** Há algo que valha a pena guardar? Enquanto o formulário está intocado não
 *  gravamos nada — senão, ao abrir no dia seguinte, a data voltaria a do dia
 *  em que a tela foi aberta pela primeira vez e deixaria de ser automática. */
export function hasContent(table: TableDef, header: HeaderValues, rows: Row[]): boolean {
  if (rows.length > 0) return true;

  return table.headerFields.some((field) => {
    const value = header[field.key] ?? '';
    return field.type === 'data' ? value !== todayISO() : value !== '';
  });
}

export function saveTable(table: TableDef, header: HeaderValues, rows: Row[]): void {
  try {
    if (!hasContent(table, header, rows)) {
      window.localStorage.removeItem(keyFor(table));
      return;
    }
    const payload: StoredTable = { v: VERSION, header, rows };
    window.localStorage.setItem(keyFor(table), JSON.stringify(payload));
  } catch {
    // navegador em modo privado, cota cheia ou storage desativado: seguir sem
    // persistir é melhor do que derrubar a tela no meio de um lançamento
  }
}

export function clearTable(table: TableDef): void {
  try {
    window.localStorage.removeItem(keyFor(table));
  } catch {
    // idem
  }
}

/** Lê o que está gravado, reconstruindo os campos a partir do esquema atual:
 *  chave desconhecida é descartada e campo ausente vira ''. Assim uma coluna
 *  renomeada no schema não corrompe o que o operador tem na tela. */
export function loadTable(table: TableDef): RestoredTable | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(keyFor(table));
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearTable(table);
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    clearTable(table);
    return null;
  }

  const stored = parsed as Partial<StoredTable>;
  if (stored.v !== VERSION || !Array.isArray(stored.rows)) {
    clearTable(table);
    return null;
  }

  const storedHeader = (typeof stored.header === 'object' && stored.header !== null
    ? stored.header
    : {}) as Record<string, unknown>;

  const header: HeaderValues = {};
  for (const field of table.headerFields) {
    const value = storedHeader[field.key];
    header[field.key] = typeof value === 'string' ? value : '';
  }

  const rows: Row[] = [];
  for (const entry of stored.rows) {
    if (typeof entry !== 'object' || entry === null) continue;
    const cells = entry as Record<string, unknown>;
    const row: Row = {};
    for (const column of table.columns) {
      const value = cells[column.key];
      row[column.key] = typeof value === 'string' ? value : '';
    }
    rows.push(row);
  }

  return { header, rows };
}
