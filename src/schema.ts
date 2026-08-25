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
  /**
   * Ao preencher esta coluna, carimba a hora atual na coluna indicada aqui.
   * Serve para o vigilante não ter que digitar o horário: lançou a viatura,
   * a hora do movimento fica registrada sozinha.
   *
   * Só carimba se a coluna de destino estiver **vazia** — uma hora lançada à
   * mão nunca é sobrescrita.
   */
  carimbaHoraEm?: string;
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
  /** nome curto usado no PDF do arquivamento: 2026-08-19-viaturas.pdf */
  slug: string;
  headerFields: HeaderFieldDef[];
  columns: ColumnDef[];
}

/** Valor de cabeçalho por chave. A data fica em ISO; o resto é texto livre. */
export type HeaderValues = Record<string, string>;

// Os valores vivem em shared/schema.js, em JavaScript puro, porque o servidor
// também os lê para montar o PDF de arquivamento. Aqui ficam só os tipos, e a
// reexportação para o resto da tela continuar importando de '../schema'.
export { TABELA1, TABELA2, TABLES, tabelaPorId } from '../shared/schema.js';


/** Uma linha de dados: chave da coluna -> conteúdo já normalizado, sempre string. */
export type Row = Record<string, string>;
