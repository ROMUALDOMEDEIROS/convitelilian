// Formatação de valores para exibição — usada pela tela e pelo servidor.
// Vive aqui, e não em src/, porque o servidor também precisa dela para gerar
// os PDFs do arquivamento sem depender do navegador.

/** 1234.56 -> "1.234,56" */
export function formatNumeroBR(n, decimals = 2) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 1234.56 -> "R$ 1.234,56" */
export function formatMoedaBR(n) {
  return `R$ ${formatNumeroBR(n, 2)}`;
}

/** "2026-08-25" -> "terça-feira, 25 de agosto de 2026" */
export function formatDataLonga(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Converte o valor armazenado para o texto exibido na tela e no PDF. */
export function formatCell(value, column) {
  if (value === '') return '';

  if (column.type === 'moeda') {
    const n = Number(value);
    return Number.isFinite(n) ? formatMoedaBR(n) : value;
  }
  if (column.type === 'numero') {
    const n = Number(value);
    return Number.isFinite(n) ? formatNumeroBR(n) : value;
  }
  return value;
}

/** Colunas numéricas alinham à direita, na tela e no PDF. */
export function isNumericColumn(column) {
  return column.type === 'numero' || column.type === 'moeda';
}

/** Texto do campo de cabeçalho como vai para a tela e para o PDF. */
export function formatHeaderValue(field, value) {
  if (field.type === 'data') return value === '' ? '' : formatDataLonga(value);
  return value;
}
