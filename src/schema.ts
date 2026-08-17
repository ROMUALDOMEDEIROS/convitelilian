// Esquema das duas tabelas, extraído do formulário PLANILHA_DE_REGISTRO.xlsm.
//
// Aba VIATURAS  (linhas 8-88, área de impressão B1:F88, retrato)
// Aba PAIS-VISITANTES (linhas 8-85, área de impressão B1:G85, paisagem)

export type ColumnType = 'texto' | 'hora' | 'numero' | 'moeda' | 'data';

export interface ColumnDef {
  /** chave interna, usada no estado */
  key: string;
  /** rótulo exibido na tela e no PDF; é por ele que a importação mapeia */
  label: string;
  type: ColumnType;
  /** grafias alternativas aceitas na importação, além de `label` */
  aliases?: string[];
  /** largura da coluna no PDF, em mm */
  pdfWidth: number;
}

export interface TableDef {
  id: 'tabela1' | 'tabela2';
  title: string;
  orientation: 'portrait' | 'landscape';
  fileName: string;
  columns: ColumnDef[];
}

export const TABELA1: TableDef = {
  id: 'tabela1',
  title: 'CONTROLE DE ENTRADA E SAÍDA DE VIATURAS',
  orientation: 'portrait',
  fileName: 'tabela1.pdf',
  columns: [
    { key: 'entrada', label: 'Entrada', type: 'hora', pdfWidth: 25 },
    { key: 'saida', label: 'Saída', type: 'hora', pdfWidth: 25 },
    { key: 'interna', label: 'Interna', type: 'texto', pdfWidth: 40 },
    { key: 'externa', label: 'Externa', type: 'texto', pdfWidth: 40 },
    { key: 'condutor', label: 'Condutor', type: 'texto', pdfWidth: 50 },
  ],
};

export const TABELA2: TableDef = {
  id: 'tabela2',
  title: 'CONTROLE DE ENTRADA DE PAIS / RESPONSÁVEIS',
  orientation: 'landscape',
  fileName: 'tabela2.pdf',
  // soma = 267mm = 297 (A4 paisagem) - 2 x 15mm de margem
  columns: [
    { key: 'hora', label: 'HORA', type: 'hora', pdfWidth: 22 },
    { key: 'responsavel', label: 'PAIS / RESPONSÁVEIS', type: 'texto', pdfWidth: 62 },
    { key: 'aluno', label: 'ALUNO', type: 'texto', pdfWidth: 57 },
    { key: 'serieTurma', label: 'SÉRIE/TURMA', type: 'texto', pdfWidth: 30 },
    { key: 'destino', label: 'DESTINO', type: 'texto', pdfWidth: 52 },
    { key: 'autorizadoPor', label: 'AUTORIZADO POR', type: 'texto', pdfWidth: 44 },
  ],
};

export const TABLES: TableDef[] = [TABELA1, TABELA2];

/** Uma linha de dados: chave da coluna -> conteúdo já normalizado, sempre string. */
export type Row = Record<string, string>;
