import { buildTablePdf as build } from '../../shared/pdf.js';
import type { TableRow } from './rows';
import type { HeaderValues, TableDef } from '../schema';

/** Monta o documento. Separado de exportTablePdf para que o modo de
 *  demonstração possa exibi-lo na tela em vez de baixá-lo.
 *
 *  O layout mora em shared/pdf.js: o servidor usa o mesmo arquivo para gerar
 *  os PDFs do arquivamento, então a folha exportada aqui e a arquivada lá
 *  saem idênticas por construção. */
export function buildTablePdf(table: TableDef, header: HeaderValues, rows: TableRow[]) {
  return build(table, header, rows.map((row) => row.cells));
}

/**
 * Baixa o PDF da folha.
 *
 * `nomeArquivo` serve à consulta de dias anteriores: sem ele, baixar três dias
 * seguidos daria tabela1.pdf, tabela1 (1).pdf e tabela1 (2).pdf, e depois
 * ninguém saberia qual é de qual dia.
 */
export function exportTablePdf(
  table: TableDef,
  header: HeaderValues,
  rows: TableRow[],
  nomeArquivo: string = table.fileName,
): void {
  buildTablePdf(table, header, rows).save(nomeArquivo);
}
