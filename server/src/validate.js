/**
 * Validação de tudo que entra pela rede. O cliente nunca é confiável: mesmo
 * sem autenticação, o servidor recusa o que não estiver na forma esperada, em
 * vez de gravar lixo (ou payload gigante) no banco.
 */

export const TABLE_IDS = ['tabela1', 'tabela2'];

const MAX_ROWS = 5000;
const MAX_KEYS = 40;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 500;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export function assertTableId(value) {
  if (!TABLE_IDS.includes(value)) {
    throw new ValidationError(
      `tabela desconhecida: use ${TABLE_IDS.map((t) => `"${t}"`).join(' ou ')}`,
    );
  }
  return value;
}

/** Exige aaaa-mm-dd E que a data exista de fato (recusa 2026-02-30). */
export function assertDia(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError('"dia" deve estar no formato aaaa-mm-dd');
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ValidationError(`"dia" não é uma data existente: ${value}`);
  }
  return value;
}

function assertFlatStringMap(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${label} deve ser um objeto`);
  }

  const keys = Object.keys(value);
  if (keys.length > MAX_KEYS) {
    throw new ValidationError(`${label} tem ${keys.length} campos; o limite é ${MAX_KEYS}`);
  }

  const clean = {};
  for (const key of keys) {
    if (key.length > MAX_KEY_LENGTH) {
      throw new ValidationError(`${label}: nome de campo acima de ${MAX_KEY_LENGTH} caracteres`);
    }
    const item = value[key];
    if (typeof item !== 'string') {
      throw new ValidationError(`${label}.${key} deve ser texto`);
    }
    if (item.length > MAX_VALUE_LENGTH) {
      throw new ValidationError(
        `${label}.${key} tem ${item.length} caracteres; o limite é ${MAX_VALUE_LENGTH}`,
      );
    }
    clean[key] = item;
  }
  return clean;
}

export function assertHeader(value) {
  return assertFlatStringMap(value, 'header');
}

export function assertRows(value) {
  if (!Array.isArray(value)) throw new ValidationError('"rows" deve ser uma lista');
  if (value.length > MAX_ROWS) {
    throw new ValidationError(`"rows" tem ${value.length} linhas; o limite é ${MAX_ROWS}`);
  }
  return value.map((row, index) => assertFlatStringMap(row, `rows[${index}]`));
}

export function assertOrigem(value) {
  if (value === undefined) return 'manual';
  if (value !== 'manual' && value !== 'automatico') {
    throw new ValidationError('"origem" deve ser "manual" ou "automatico"');
  }
  return value;
}

const LISTAS_CHAVES = ['vtr', 'condutor'];
const MAX_LISTA = 2000;

function assertLista(valor, label) {
  if (!Array.isArray(valor)) throw new ValidationError(`${label} deve ser uma lista`);
  if (valor.length > MAX_LISTA) {
    throw new ValidationError(`${label} tem ${valor.length} nomes; o limite é ${MAX_LISTA}`);
  }
  return valor.map((item, i) => {
    if (typeof item !== 'string') throw new ValidationError(`${label}[${i}] deve ser texto`);
    if (item.length > MAX_VALUE_LENGTH) {
      throw new ValidationError(`${label}[${i}] passa de ${MAX_VALUE_LENGTH} caracteres`);
    }
    return item;
  });
}

/** Valida o corpo de um PUT /api/listas. */
export function assertListasBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('corpo da requisição deve ser um objeto JSON');
  }

  const bruto = body.listas;
  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) {
    throw new ValidationError('"listas" deve ser um objeto');
  }

  const listas = {};
  for (const chave of LISTAS_CHAVES) listas[chave] = assertLista(bruto[chave] ?? [], chave);

  const desconhecidas = Object.keys(bruto).filter((k) => !LISTAS_CHAVES.includes(k));
  if (desconhecidas.length > 0) {
    throw new ValidationError(`lista desconhecida: ${desconhecidas.join(', ')}`);
  }

  if (!Number.isInteger(body.baseVersao) || body.baseVersao < 0) {
    throw new ValidationError('"baseVersao" deve ser um inteiro a partir de zero');
  }

  return { listas, baseVersao: body.baseVersao, forcar: body.forcar === true };
}

/** Valida o corpo de um PUT /api/snapshot/:tableId e devolve dados limpos. */
export function assertSnapshotBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('corpo da requisição deve ser um objeto JSON');
  }
  return {
    dia: assertDia(body.dia),
    header: assertHeader(body.header),
    rows: assertRows(body.rows),
    origem: assertOrigem(body.origem),
  };
}
