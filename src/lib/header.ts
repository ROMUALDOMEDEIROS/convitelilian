import type { HeaderFieldDef, HeaderValues, TableDef } from '../schema';
import { normalizeHeader, squish } from './text';

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Data de hoje em ISO (aaaa-mm-dd), no fuso local — não em UTC, senão o dia
 *  vira o anterior nas horas da noite no Brasil. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Cabeçalho inicial: data preenchida com hoje, demais campos em branco.
 *  É um valor fixo gravado no estado, não uma fórmula que se reescreve. */
export function defaultHeaderValues(table: TableDef): HeaderValues {
  const values: HeaderValues = {};
  for (const field of table.headerFields) {
    values[field.key] = field.type === 'data' ? todayISO() : '';
  }
  return values;
}

/** Interpreta uma data escrita de várias formas e devolve ISO, ou '' se não der:
 *  "2026-08-17", "17/08/2026", "17 de agosto de 2026",
 *  "segunda-feira, 17 de agosto de 2026", "agosto 17, 2026". */
export function parseDataToISO(value: unknown): string {
  const raw = squish(value);
  if (raw === '') return '';

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;

  const br = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (br) {
    const year = Number(br[3]) < 100 ? 2000 + Number(br[3]) : Number(br[3]);
    return `${year}-${pad(Number(br[2]))}-${pad(Number(br[1]))}`;
  }

  // por nome do mês, em qualquer ordem — cobre a data longa do Excel pt-BR
  const lower = raw.toLowerCase();
  const monthIndex = MESES.findIndex((m) => lower.includes(m));
  if (monthIndex > -1) {
    const year = lower.match(/\b(\d{4})\b/);
    // o dia é um número de 1 ou 2 dígitos que não seja o ano
    const day = lower.replace(/\b\d{4}\b/g, ' ').match(/\b(\d{1,2})\b/);
    if (year && day) {
      return `${year[1]}-${pad(monthIndex + 1)}-${pad(Number(day[1]))}`;
    }
  }

  return '';
}

/** ISO -> "segunda-feira, 17 de agosto de 2026", como na folha original. */
export function formatDataLonga(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Texto do campo como vai para o PDF. */
export function formatHeaderValue(field: HeaderFieldDef, value: string): string {
  if (field.type === 'data') return value === '' ? '' : formatDataLonga(value);
  return value;
}

function acceptedLabels(field: HeaderFieldDef): string[] {
  return [field.label, ...(field.aliases ?? [])].map(normalizeHeader);
}

/** Procura os campos do cabeçalho nas linhas acima da linha de colunas.
 *  Um campo é reconhecido por uma célula igual ao rótulo (com ou sem ":"),
 *  e o valor é a primeira célula não vazia à direita dela. */
export function extractHeaderValues(
  matrix: string[][],
  headerRowIndex: number,
  table: TableDef,
): { values: HeaderValues; found: string[] } {
  const values = defaultHeaderValues(table);
  const found: string[] = [];

  for (const field of table.headerFields) {
    const labels = acceptedLabels(field);

    for (let r = 0; r < headerRowIndex; r++) {
      const line = matrix[r] ?? [];
      const at = line.findIndex((cell) => labels.includes(normalizeHeader(cell)));
      if (at === -1) continue;

      const rest = line.slice(at + 1).find((cell) => squish(cell) !== '');
      if (rest === undefined) continue;

      if (field.type === 'data') {
        const iso = parseDataToISO(rest);
        if (iso === '') continue;
        values[field.key] = iso;
      } else {
        values[field.key] = squish(rest);
      }
      found.push(field.label);
      break;
    }
  }

  return { values, found };
}
