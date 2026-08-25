import type { ColumnDef } from '../schema';
import { normalizeHora, parseNumeroBR, squish } from './text';

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

// A formatação de exibição mora em shared/formato.js, para o servidor gerar
// os PDFs do arquivamento com exatamente as mesmas regras.
export { formatCell, isNumericColumn } from '../../shared/formato.js';
