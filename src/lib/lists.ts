import * as XLSX from 'xlsx';
import { LISTAS_INICIAIS } from './listas-iniciais';
import { normalizeHeader, squish } from './text';

export type ListKey = 'vtr' | 'condutor';

export interface ListDef {
  key: ListKey;
  titulo: string;
  /** o que o campo de adicionar sugere */
  exemplo: string;
  /** nomes de coluna aceitos ao importar de planilha */
  colunas: string[];
}

export const LISTAS: ListDef[] = [
  {
    key: 'vtr',
    titulo: 'Viaturas',
    exemplo: 'ex.: AO 42',
    colunas: ['VTR', 'VIATURA', 'VIATURAS', 'PREFIXO'],
  },
  {
    key: 'condutor',
    titulo: 'Condutores',
    exemplo: 'ex.: MATIAS SGT',
    colunas: ['CONDUTOR', 'CONDUTORES', 'MOTORISTA', 'NOME'],
  },
];

export type Listas = Record<ListKey, string[]>;

const STORAGE_KEY = 'registro-guarda:listas';
const VERSION = 1;
const MAX_ITENS = 2000;
const MAX_TAMANHO = 120;

/** Chave de comparação: sem acento, sem pontuação, maiúscula. Serve para
 *  detectar duplicata e para o autopreenchimento casar "vania" com "VANIA ST". */
export function chave(valor: string): string {
  return normalizeHeader(valor);
}

/** Tira espaços sobrando, descarta vazios e duplicados e ordena
 *  alfabeticamente ignorando acento. */
export function limpar(itens: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];

  for (const bruto of itens) {
    const item = squish(bruto).slice(0, MAX_TAMANHO);
    if (item === '') continue;
    const k = chave(item);
    if (k === '' || vistos.has(k)) continue;
    vistos.add(k);
    saida.push(item);
    if (saida.length >= MAX_ITENS) break;
  }

  return saida.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

export function listasIniciais(): Listas {
  return {
    vtr: limpar(LISTAS_INICIAIS.vtr),
    condutor: limpar(LISTAS_INICIAIS.condutor),
  };
}

/** Itens que casam com o que foi digitado, por trecho e sem acento.
 *  Digitar "vania" acha "VANIA ST"; digitar "sgt" acha todos os sargentos. */
export function sugestoes(itens: string[], digitado: string, limite = 8): string[] {
  const alvo = chave(digitado);
  if (alvo === '') return itens.slice(0, limite);

  const comeca: string[] = [];
  const contem: string[] = [];
  for (const item of itens) {
    const k = chave(item);
    if (k.startsWith(alvo)) comeca.push(item);
    else if (k.includes(alvo)) contem.push(item);
    if (comeca.length >= limite) break;
  }
  return [...comeca, ...contem].slice(0, limite);
}

export function salvarListas(listas: Listas): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, ...listas }));
  } catch {
    // modo privado ou cota cheia: seguir sem persistir é melhor que derrubar a tela
  }
}

/** Lê as listas gravadas. Devolve null quando não há nada utilizável, para o
 *  chamador cair nas listas iniciais. */
export function carregarListas(): Listas | null {
  let bruto: string | null = null;
  try {
    bruto = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!bruto) return null;

  try {
    const lido = JSON.parse(bruto) as Record<string, unknown>;
    if (lido?.v !== VERSION) return null;

    const ler = (key: ListKey) =>
      Array.isArray(lido[key]) ? limpar((lido[key] as unknown[]).map((x) => String(x))) : [];

    const listas: Listas = { vtr: ler('vtr'), condutor: ler('condutor') };
    return listas;
  } catch {
    return null;
  }
}

export class ListImportError extends Error {}

export interface ListImportResult {
  itens: string[];
  aba: string;
  coluna: string;
}

/** Nomes de aba que indicam uma aba de listas, e não uma folha de lançamento. */
const ABAS_DE_LISTA = ['DADOS', 'LISTA', 'LISTAS', 'CADASTRO', 'CADASTROS', 'TABELAS'];

interface Candidato {
  itens: string[];
  aba: string;
  coluna: string;
  pontos: number;
}

function matriz(sheet: XLSX.WorkSheet): string[][] {
  return (
    XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
      raw: false,
    }) ?? []
  ).map((linha) => (linha ?? []).map((c) => squish(c)));
}

/**
 * Lê nomes de um arquivo para uma das listas.
 *
 * A escolha da coluna é pontuada, e não "a primeira que casar". O motivo é
 * concreto: no .xlsm original a folha de lançamento VIATURAS tem "Viatura" como
 * título de coluna (D6) e vem ANTES da aba "Dados", que é onde a lista de
 * verdade mora, na coluna "VTR". Pegando a primeira correspondência, a
 * importação trazia as viaturas lançadas no dia em vez do cadastro.
 *
 * Pontuação: aba com cara de cadastro pesa mais que qualquer outra, título
 * exato pesa mais que apelido, e entre iguais ganha a coluna com mais nomes.
 */
export async function importarLista(file: File, def: ListDef): Promise<ListImportResult> {
  const buffer = await file.arrayBuffer();
  const nome = file.name.toLowerCase();

  let wb: XLSX.WorkBook;
  if (nome.endsWith('.csv') || nome.endsWith('.txt')) {
    let texto: string;
    try {
      texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      texto = new TextDecoder('windows-1252').decode(buffer);
    }
    const separador =
      (texto.match(/;/g)?.length ?? 0) > (texto.match(/,/g)?.length ?? 0) ? ';' : ',';
    wb = XLSX.read(texto, { type: 'string', FS: separador, raw: false });
  } else {
    wb = XLSX.read(buffer, { type: 'array', raw: false });
  }

  const aceitos = def.colunas.map(normalizeHeader);
  const candidatos: Candidato[] = [];

  for (const aba of wb.SheetNames) {
    const grade = matriz(wb.Sheets[aba]);
    const abaDeLista = ABAS_DE_LISTA.includes(normalizeHeader(aba));

    for (let r = 0; r < Math.min(grade.length, 20); r++) {
      grade[r].forEach((celula, c) => {
        const posicao = aceitos.indexOf(normalizeHeader(celula));
        if (posicao === -1) return;

        const itens = limpar(grade.slice(r + 1).map((linha) => linha[c] ?? ''));
        if (itens.length === 0) return;

        candidatos.push({
          itens,
          aba,
          coluna: celula,
          pontos: (abaDeLista ? 1000 : 0) + (posicao === 0 ? 100 : 0) + itens.length,
        });
      });
    }
  }

  if (candidatos.length > 0) {
    candidatos.sort((a, b) => b.pontos - a.pontos);
    const escolhido = candidatos[0];
    return { itens: escolhido.itens, aba: escolhido.aba, coluna: escolhido.coluna };
  }

  // Sem nenhum título reconhecido: primeira coluna com conteúdo, que é o caso
  // de uma lista simples com um nome por linha.
  for (const aba of wb.SheetNames) {
    const grade = matriz(wb.Sheets[aba]);
    const largura = Math.max(0, ...grade.map((l) => l.length));
    for (let c = 0; c < largura; c++) {
      const coluna = grade.map((l) => l[c] ?? '').filter((v) => v !== '');
      const itens = limpar(coluna.filter((v) => !aceitos.includes(normalizeHeader(v))));
      if (itens.length > 0) return { itens, aba, coluna: `coluna ${c + 1}` };
    }
  }

  throw new ListImportError(
    `Não encontrei nomes em "${file.name}". ` +
      `Use uma planilha com a coluna "${def.colunas[0]}" ou um arquivo com um nome por linha.`,
  );
}
