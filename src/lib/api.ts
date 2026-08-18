import type { HeaderValues, Row, TableDef } from '../schema';
import type { Listas } from './lists';

/** Endereço do servidor da unidade. Configurável em build por VITE_API_URL
 *  quando o backend não estiver na mesma máquina do navegador. */
export const API_URL: string = (
  // Vazio = mesma origem do servidor que entregou a página (produção, uma porta
  // só). Em desenvolvimento, o Vite encaminha /api para o backend (ver
  // vite.config.ts). VITE_API_URL só é necessário se o app for servido de outra
  // máquina que não o banco.
  (import.meta.env.VITE_API_URL as string | undefined) ?? ''
).replace(/\/$/, '');

/** Tempo máximo de espera por resposta. Sem isso, uma rede que "pendura" a
 *  conexão deixaria o operador olhando "Salvando..." para sempre. */
const TIMEOUT_MS = 10_000;

export type SaveOrigin = 'manual' | 'automatico';

export interface SaveResult {
  savedAt: string;
  rowCount: number;
  versao: number;
}

export class ApiError extends Error {
  readonly status: number;
  /** true quando repetir a mesma requisição pode funcionar (rede, 5xx, 429).
   *  Um 400 é culpa do dado enviado: repetir não resolve. */
  readonly retryable: boolean;
  /** corpo JSON da resposta de erro, quando houver — usado no 409 das listas */
  readonly corpo: unknown;

  constructor(message: string, status: number, retryable: boolean, corpo: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryable = retryable;
    this.corpo = corpo;
  }
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch (error) {
    // rede fora, servidor desligado ou tempo esgotado: vale tentar de novo
    const motivo = (error as Error).name === 'AbortError' ? 'tempo esgotado' : 'sem conexão';
    throw new ApiError(`Servidor inacessível (${motivo})`, 0, true);
  } finally {
    clearTimeout(timer);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const mensagem =
      (typeof body === 'object' && body !== null && 'erro' in body
        ? String((body as { erro: unknown }).erro)
        : null) ?? `HTTP ${response.status}`;
    // 5xx e 429 são transitórios; 4xx de validação não são
    const retryable = response.status >= 500 || response.status === 429;
    throw new ApiError(mensagem, response.status, retryable, body);
  }

  return body;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request('/api/health');
    return true;
  } catch {
    return false;
  }
}

/** Grava o snapshot do dia. O mesmo caminho serve ao botão manual e ao
 *  checkpoint automático — só muda o campo `origem`. */
export async function saveSnapshot(
  table: TableDef,
  dia: string,
  header: HeaderValues,
  rows: Row[],
  origem: SaveOrigin,
): Promise<SaveResult> {
  const body = await request(`/api/snapshot/${table.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dia, header, rows, origem }),
  });

  const result = body as Partial<SaveResult>;
  return {
    savedAt: typeof result.savedAt === 'string' ? result.savedAt : new Date().toISOString(),
    rowCount: typeof result.rowCount === 'number' ? result.rowCount : rows.length,
    versao: typeof result.versao === 'number' ? result.versao : 0,
  };
}

export interface ListasRemotas {
  listas: Listas;
  versao: number;
  updatedAt: string | null;
}

export interface ConflitoListas extends ListasRemotas {
  conflito: true;
}

/** Lê o cadastro compartilhado. Devolve null quando o servidor está fora. */
export async function fetchListas(): Promise<ListasRemotas | null> {
  try {
    const body = (await request('/api/listas')) as Partial<ListasRemotas>;
    return {
      listas: (body.listas as Listas) ?? { vtr: [], condutor: [] },
      versao: typeof body.versao === 'number' ? body.versao : 0,
      updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : null,
    };
  } catch {
    return null;
  }
}

/**
 * Grava o cadastro. Em conflito (409) devolve o estado atual do servidor com
 * `conflito: true`, para a tela reconciliar em vez de estourar um erro. Falha
 * de rede propaga ApiError, para o chamador reagendar o envio.
 */
export async function putListas(
  listas: Listas,
  baseVersao: number,
  forcar = false,
): Promise<ListasRemotas | ConflitoListas> {
  try {
    const body = (await request('/api/listas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listas, baseVersao, forcar }),
    })) as Partial<ListasRemotas>;
    return {
      listas,
      versao: typeof body.versao === 'number' ? body.versao : baseVersao + 1,
      updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : null,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.corpo) {
      const c = error.corpo as Partial<ListasRemotas>;
      return {
        conflito: true,
        listas: (c.listas as Listas) ?? listas,
        versao: typeof c.versao === 'number' ? c.versao : baseVersao,
        updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : null,
      };
    }
    throw error;
  }
}
