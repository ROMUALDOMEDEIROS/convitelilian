import type { ColumnDef } from '../schema';
import { formatMoedaBR, formatNumeroBR, normalizeHora, parseNumeroBR, squish } from './text';

/** Normaliza o conteúdo de uma célula conforme o tipo da coluna.
 *  Usada tanto na importação quanto ao sair de uma célula editada, para que
 *  os dois caminhos produzam exatamente o mesmo valor armazenado. */
export function normalizeCell(value: string, column: ColumnDef): string {
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

/** Converte o valor armazenado para o texto exibido na tela e no PDF. */
export function formatCell(value: string, column: ColumnDef): string {
  if (value === '') return '';

  if (column.type === 'moeda') {
    const n = Number(value);
    return Number.isFinite(n) ? formatMoedaBR(n) : value;
  }
  if (column.type === 'numero') {
    const n = Number(value);
    return Number.isFinite(n) ? formatNumeroBR(n) : value;
  }
  return value;
}

/** Colunas numéricas são alinhadas à direita, o resto à esquerda. */
export function isNumericColumn(column: ColumnDef): boolean {
  return column.type === 'numero' || column.type === 'moeda';
}
