// Esquema das duas tabelas, extraído do formulário PLANILHA_DE_REGISTRO.xlsm.
//
// Aba VIATURAS  (linhas 8-88, área de impressão B1:F88, retrato)
// Aba PAIS-VISITANTES (linhas 8-85, área de impressão B1:G85, paisagem)

import type { ListKey } from './lib/lists';

export type ColumnType = 'texto' | 'hora' | 'numero' | 'moeda' | 'data';

export interface ColumnDef {
  /** chave interna, usada no estado */
  key: string;
  /** rótulo exibido na tela e no PDF; é por ele que a importação mapeia */
  label: string;
  type: ColumnType;
  /** grafias alternativas aceitas na importação, além de `label` */
  aliases?: string[];
  /** quando presente, a célula autopreenche a partir desta lista cadastrada */
  lista?: ListKey;
  /** largura da coluna no PDF, em mm */
  pdfWidth: number;
}

/** Campo do bloco de cabeçalho do formulário (Data, Cmt. da Guarda, etc.). */
export interface HeaderFieldDef {
  key: string;
  label: string;
  /** 'data' guarda ISO (aaaa-mm-dd) e é preenchida com hoje ao abrir a tela */
  type: 'data' | 'texto';
  /** rótulos alternativos aceitos ao extrair o cabeçalho de um arquivo importado */
  aliases?: string[];
}

export interface TableDef {
  id: 'tabela1' | 'tabela2';
  title: string;
  orientation: 'portrait' | 'landscape';
  fileName: string;
  headerFields: HeaderFieldDef[];
  columns: ColumnDef[];
}

/** Valor de cabeçalho por chave. A data fica em ISO; o resto é texto livre. */
export type HeaderValues = Record<string, string>;

export const TABELA1: TableDef = {
  id: 'tabela1',
  title: 'CONTROLE DE ENTRADA E SAÍDA DE VIATURAS',
  orientation: 'portrait',
  fileName: 'tabela1.pdf',
  headerFields: [
    { key: 'data', label: 'DATA', type: 'data' },
    { key: 'cmt', label: 'CMT. DA GUARDA', type: 'texto', aliases: ['CMT DA GUARDA'] },
    { key: 'vigilante', label: 'VIGILANTE', type: 'texto' },
  ],
  columns: [
    { key: 'entrada', label: 'Entrada', type: 'hora', pdfWidth: 25 },
    { key: 'saida', label: 'Saída', type: 'hora', pdfWidth: 25 },
    { key: 'interna', label: 'Interna', type: 'texto', lista: 'vtr', pdfWidth: 40 },
    { key: 'externa', label: 'Externa', type: 'texto', lista: 'vtr', pdfWidth: 40 },
    { key: 'condutor', label: 'Condutor', type: 'texto', lista: 'condutor', pdfWidth: 50 },
  ],
};

export const TABELA2: TableDef = {
  id: 'tabela2',
  title: 'CONTROLE DE ENTRADA DE PAIS / RESPONSÁVEIS',
  orientation: 'landscape',
  fileName: 'tabela2.pdf',
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

export const TABLES: TableDef[] = [TABELA1, TABELA2];

/** Uma linha de dados: chave da coluna -> conteúdo já normalizado, sempre string. */
export type Row = Record<string, string>;
