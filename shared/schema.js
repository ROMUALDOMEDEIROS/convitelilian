// Definição das duas folhas, extraída do formulário PLANILHA_DE_REGISTRO.xlsm.
//
// Aba VIATURAS        (linhas 8-88, área de impressão B1:F88, retrato)
// Aba PAIS-VISITANTES (linhas 8-85, área de impressão B1:G85, paisagem)
//
// Fica em shared/ porque o servidor também lê estas definições: é com elas que
// ele monta o PDF de arquivamento, sem depender do navegador. Os tipos ficam
// em src/schema.ts, que reexporta estes valores já tipados.

/** @typedef {import('../src/schema').TableDef} TableDef */

/** @type {TableDef} */
export const TABELA1 = {
  id: 'tabela1',
  title: 'CONTROLE DE ENTRADA E SAÍDA DE VIATURAS',
  orientation: 'portrait',
  fileName: 'tabela1.pdf',
  // usado para nomear o PDF do arquivamento: 2026-08-19-viaturas.pdf
  slug: 'viaturas',
  headerFields: [
    { key: 'data', label: 'DATA', type: 'data' },
    { key: 'cmt', label: 'CMT. DA GUARDA', type: 'texto', aliases: ['CMT DA GUARDA'] },
    { key: 'vigilante', label: 'VIGILANTE', type: 'texto' },
  ],
  columns: [
    { key: 'entrada', label: 'Entrada', type: 'hora', pdfWidth: 25 },
    { key: 'saida', label: 'Saída', type: 'hora', pdfWidth: 25 },
    { key: 'interna', label: 'Interna', type: 'texto', lista: 'vtr', carimbaHoraEm: 'saida', pdfWidth: 40 },
    { key: 'externa', label: 'Externa', type: 'texto', lista: 'vtr', carimbaHoraEm: 'saida', pdfWidth: 40 },
    { key: 'condutor', label: 'Condutor', type: 'texto', lista: 'condutor', pdfWidth: 50 },
  ],
};

/** @type {TableDef} */
export const TABELA2 = {
  id: 'tabela2',
  title: 'CONTROLE DE ENTRADA DE PAIS / RESPONSÁVEIS',
  orientation: 'landscape',
  fileName: 'tabela2.pdf',
  slug: 'pais-responsaveis',
  headerFields: [
    { key: 'data', label: 'DATA', type: 'data' },
    { key: 'cmt', label: 'CMT. DA GUARDA', type: 'texto', aliases: ['CMT DA GUARDA'] },
    { key: 'vigilante', label: 'VIGILANTE', type: 'texto' },
    { key: 'ala', label: 'ALA DE SERVIÇO', type: 'texto' },
  ],
  // soma = 267mm = 297 (A4 paisagem) - 2 x 15mm de margem
  columns: [
    { key: 'hora', label: 'HORA', type: 'hora', pdfWidth: 22 },
    { key: 'responsavel', label: 'PAIS / RESPONSÁVEIS', type: 'texto', pdfWidth: 62 },
    { key: 'aluno', label: 'ALUNO', type: 'texto', pdfWidth: 57 },
    { key: 'serieTurma', label: 'SÉRIE/TURMA', type: 'texto', pdfWidth: 30 },
    { key: 'destino', label: 'DESTINO', type: 'texto', pdfWidth: 52 },
    { key: 'autorizadoPor', label: 'AUTORIZADO POR', type: 'texto', lista: 'condutor', pdfWidth: 44 },
  ],
};

/** @type {TableDef[]} */
export const TABLES = [TABELA1, TABELA2];

/** Devolve a definição pelo id, ou null se o id não existir. */
export function tabelaPorId(id) {
  return TABLES.find((t) => t.id === id) ?? null;
}
