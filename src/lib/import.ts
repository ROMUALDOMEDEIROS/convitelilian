import * as XLSX from 'xlsx';
import type { ColumnDef, Row, TableDef } from '../schema';
import {
  normalizeHeader,
  normalizeHora,
  parseNumeroBR,
  squish,
} from './text';

export interface ImportReport {
  fileName: string;
  sheetName: string;
  /** número da linha (base 1) onde o cabeçalho foi localizado */
  headerRow: number;
  /** true quando o cabeçalho foi montado juntando duas linhas mescladas */
  mergedHeader: boolean;
  separator?: ',' | ';';
  encoding?: 'utf-8' | 'windows-1252';
  rows: Row[];
  /** linhas totalmente vazias descartadas */
  skippedBlank: number;
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

/** Quantas linhas do topo são inspecionadas em busca do cabeçalho. */
const HEADER_SEARCH_DEPTH = 20;

function decodeCsv(buffer: ArrayBuffer): { text: string; encoding: 'utf-8' | 'windows-1252' } {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return { text, encoding: 'utf-8' };
  } catch {
    // CSV salvo pelo Excel em pt-BR costuma sair em ANSI
    return {
      text: new TextDecoder('windows-1252').decode(buffer),
      encoding: 'windows-1252',
    };
  }
}

/** Conta separadores fora de aspas nas primeiras linhas e escolhe o predominante. */
function detectSeparator(text: string): ',' | ';' {
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  let lines = 0;

  for (let i = 0; i < text.length && lines < 20; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (inQuotes) continue;
    else if (ch === ',') commas++;
    else if (ch === ';') semis++;
    else if (ch === '\n') lines++;
  }

  return semis > commas ? ';' : ',';
}

/** Uma aba lida como matriz de strings, preservando linhas vazias. */
function sheetToMatrix(sheet: XLSX.WorkSheet): string[][] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: true,
    defval: '',
    raw: false,
  });
  return matrix.map((row) => (row ?? []).map((cell) => squish(cell)));
}

interface HeaderMatch {
  /** índice base 0 na matriz */
  index: number;
  merged: boolean;
  /** chave da coluna -> índice na linha */
  positions: Map<string, number>;
  missing: ColumnDef[];
}

/** Todas as grafias aceitas para uma coluna, já normalizadas. */
function acceptedNames(column: ColumnDef): string[] {
  return [column.label, ...(column.aliases ?? [])].map(normalizeHeader);
}

function matchHeaderLine(cells: string[], columns: ColumnDef[]): HeaderMatch['positions'] {
  const normalized = cells.map(normalizeHeader);
  const positions = new Map<string, number>();

  for (const column of columns) {
    const names = acceptedNames(column);
    const index = normalized.findIndex(
      (cell, i) => cell !== '' && names.includes(cell) && !isTaken(positions, i),
    );
    if (index > -1) positions.set(column.key, index);
  }

  return positions;
}

function isTaken(positions: Map<string, number>, index: number): boolean {
  for (const value of positions.values()) if (value === index) return true;
  return false;
}

/** Preenche as células vazias de `row` com as da linha de cima.
 *  Resolve o cabeçalho em duas alturas da aba VIATURAS, em que "Condutor"
 *  está mesclado em F6:F7 e portanto ausente da linha 7. */
function mergeWithPrevious(row: string[], previous: string[]): string[] {
  const width = Math.max(row.length, previous.length);
  const merged: string[] = [];
  for (let i = 0; i < width; i++) {
    merged[i] = squish(row[i]) !== '' ? row[i] : (previous[i] ?? '');
  }
  return merged;
}

/** Procura a linha de cabeçalho que casa com o maior número de colunas. */
function findHeader(matrix: string[][], columns: ColumnDef[]): HeaderMatch {
  const depth = Math.min(matrix.length, HEADER_SEARCH_DEPTH);
  let best: HeaderMatch = {
    index: -1,
    merged: false,
    positions: new Map(),
    missing: columns,
  };

  for (let i = 0; i < depth; i++) {
    const candidates: Array<{ cells: string[]; merged: boolean }> = [
      { cells: matrix[i], merged: false },
    ];
    if (i > 0) {
      candidates.push({ cells: mergeWithPrevious(matrix[i], matrix[i - 1]), merged: true });
    }

    for (const candidate of candidates) {
      const positions = matchHeaderLine(candidate.cells, columns);
      if (positions.size > best.positions.size) {
        best = {
          index: i,
          merged: candidate.merged,
          positions,
          missing: columns.filter((c) => !positions.has(c.key)),
        };
      }
      if (best.missing.length === 0) return best;
    }
  }

  return best;
}

function normalizeCell(value: string, column: ColumnDef): string {
  const raw = squish(value);
  if (raw === '') return '';

  switch (column.type) {
    case 'hora':
      return normalizeHora(raw);
    case 'numero':
    case 'moeda': {
      const n = parseNumeroBR(raw);
      // valor canônico com ponto decimal; a formatação BR acontece na exibição
      return n === null ? raw : String(n);
    }
    case 'data':
    case 'texto':
    default:
      return raw;
  }
}

function extractRows(
  matrix: string[][],
  header: HeaderMatch,
  columns: ColumnDef[],
): { rows: Row[]; skippedBlank: number } {
  const rows: Row[] = [];
  let skippedBlank = 0;

  for (let i = header.index + 1; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    const row: Row = {};
    let hasContent = false;

    for (const column of columns) {
      const at = header.positions.get(column.key)!;
      const cell = normalizeCell(line[at] ?? '', column);
      row[column.key] = cell;
      if (cell !== '') hasContent = true;
    }

    if (hasContent) rows.push(row);
    else skippedBlank++;
  }

  return { rows, skippedBlank };
}

function isCsv(fileName: string): boolean {
  return /\.csv$/i.test(fileName);
}

/** Lê o arquivo e devolve as linhas mapeadas pelo NOME das colunas.
 *  Lança ImportError nomeando as colunas ausentes — nesse caso nada é importado. */
export async function importFile(file: File, table: TableDef): Promise<ImportReport> {
  const buffer = await file.arrayBuffer();
  const columns = table.columns;

  let workbook: XLSX.WorkBook;
  let separator: ImportReport['separator'];
  let encoding: ImportReport['encoding'];

  if (isCsv(file.name)) {
    const decoded = decodeCsv(buffer);
    encoding = decoded.encoding;
    separator = detectSeparator(decoded.text);
    workbook = XLSX.read(decoded.text, { type: 'string', FS: separator, raw: false });
  } else {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  }

  if (workbook.SheetNames.length === 0) {
    throw new ImportError(`O arquivo "${file.name}" não contém nenhuma planilha.`);
  }

  // O arquivo pode ser a pasta inteira exportada do .xlsm, com as três abas.
  // Usa a primeira aba cujo cabeçalho case com todas as colunas desta tabela.
  let bestSheet = workbook.SheetNames[0];
  let bestMatrix: string[][] = [];
  let bestHeader: HeaderMatch | null = null;

  for (const sheetName of workbook.SheetNames) {
    const matrix = sheetToMatrix(workbook.Sheets[sheetName]);
    const header = findHeader(matrix, columns);

    if (!bestHeader || header.positions.size > bestHeader.positions.size) {
      bestSheet = sheetName;
      bestMatrix = matrix;
      bestHeader = header;
    }
    if (bestHeader.missing.length === 0) break;
  }

  const header = bestHeader!;

  if (header.missing.length > 0) {
    const names = header.missing.map((c) => `"${c.label}"`).join(', ');
    const plural = header.missing.length > 1 ? 'as colunas' : 'a coluna';
    throw new ImportError(
      `Importação cancelada: não encontrei ${plural} ${names} em "${file.name}". ` +
        `Nenhuma linha foi importada.`,
    );
  }

  const { rows, skippedBlank } = extractRows(bestMatrix, header, columns);

  return {
    fileName: file.name,
    sheetName: bestSheet,
    headerRow: header.index + 1,
    mergedHeader: header.merged,
    separator,
    encoding,
    rows,
    skippedBlank,
  };
}
