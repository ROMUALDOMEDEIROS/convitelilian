/** Normaliza um rótulo de coluna para comparação: sem acento, sem pontuação, maiúsculo.
 *  "PAIS / RESPONSÁVEIS" e "Pais/Responsaveis" colidem no mesmo valor. */
export function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Colapsa espaços internos e remove os das pontas. */
export function squish(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/** Converte número no padrão brasileiro ("1.234,56", "R$ 1.234,56", "-1.234,56")
 *  para float. Devolve null quando não há número reconhecível. */
export function parseNumeroBR(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const raw = squish(value);
  if (raw === '') return null;

  // remove símbolo de moeda, espaços e o sinal de percentual
  let s = raw.replace(/R\$/gi, '').replace(/\s/g, '');

  const negative = /^\(.*\)$/.test(s) || s.startsWith('-');
  s = s.replace(/[()]/g, '').replace(/^-/, '');

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > -1 && lastComma > lastDot) {
    // vírgula é o separador decimal (padrão BR): pontos são de milhar
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastComma > -1 && lastDot > -1) {
    // ponto é o decimal e a vírgula é de milhar
    s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    s = s.replace(',', '.');
  } else if (lastDot > -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.234" sem decimais: ponto é separador de milhar
    s = s.replace(/\./g, '');
  }

  if (!/^\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** 1234.56 -> "1.234,56" */
export function formatNumeroBR(n: number, decimals = 2): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 1234.56 -> "R$ 1.234,56" */
export function formatMoedaBR(n: number): string {
  return `R$ ${formatNumeroBR(n, 2)}`;
}

/** Normaliza hora para "HH:MM". Aceita Date, fração de dia do Excel (0,3125),
 *  "07:37", "7:37:09", "7:30:35 AM". Texto irreconhecível é devolvido intacto. */
export function normalizeHora(value: unknown): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const frac = value - Math.floor(value);
    const total = Math.round(frac * 24 * 60);
    return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
  }

  const raw = squish(value);
  if (raw === '') return '';

  const m = raw.match(/^(\d{1,2})[:h.](\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
  if (!m) return raw;

  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const suffix = m[4]?.toUpperCase();

  if (suffix === 'PM' && hours < 12) hours += 12;
  if (suffix === 'AM' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return raw;

  return `${pad(hours)}:${pad(minutes)}`;
}
