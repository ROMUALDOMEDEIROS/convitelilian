import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatHeaderValue } from './header';
import { formatCell, isNumericColumn } from './normalize';
import type { TableRow } from './rows';
import type { HeaderValues, TableDef } from '../schema';

/** Margem da folha, em mm, nos quatro lados. */
const MARGIN = 15;
/** Distância entre o fim da tabela e a margem inferior, para o rodapé caber. */
const BOTTOM_RESERVE = 8;

function timestamp(): string {
  const now = new Date();
  return `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Rodapé em todas as páginas: data de geração à esquerda, "Página X de Y" à
 *  direita. Só pode ser desenhado depois da tabela, quando o total de páginas
 *  é conhecido. */
function drawFooters(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const baseline = height - MARGIN + 4;
  const generatedAt = `Gerado em ${timestamp()}`;

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(generatedAt, MARGIN, baseline);
    doc.text(`Página ${page} de ${total}`, width - MARGIN, baseline, { align: 'right' });
  }
}

/** Largura do rótulo no bloco de cabeçalho, em mm. */
const LABEL_WIDTH = 45;

/** Bloco de cabeçalho do formulário (Data, Cmt. da Guarda, ...) em rótulo/valor
 *  empilhado, como nas linhas de topo da folha original. Devolve o Y do fim. */
function drawFormHeader(
  doc: jsPDF,
  table: TableDef,
  header: HeaderValues,
  usableWidth: number,
  startY: number,
): number {
  autoTable(doc, {
    body: table.headerFields.map((field) => [
      field.label,
      formatHeaderValue(field, header[field.key] ?? ''),
    ]),
    startY,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 1.5,
      overflow: 'linebreak',
      lineColor: [110, 110, 110],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: LABEL_WIDTH, fontStyle: 'bold', fillColor: [240, 240, 240] },
      1: { cellWidth: usableWidth - LABEL_WIDTH },
    },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function exportTablePdf(table: TableDef, header: HeaderValues, rows: TableRow[]): void {
  const doc = new jsPDF({ orientation: table.orientation, unit: 'mm', format: 'a4' });
  const usableWidth = doc.internal.pageSize.getWidth() - 2 * MARGIN;

  // Título apenas na primeira página.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(table.title, MARGIN, MARGIN + 5);

  const headerEndY = drawFormHeader(doc, table, header, usableWidth, MARGIN + 9);

  const columnStyles: Record<number, { cellWidth: number; halign: 'left' | 'right' }> = {};
  table.columns.forEach((column, index) => {
    columnStyles[index] = {
      cellWidth: column.pdfWidth,
      halign: isNumericColumn(column) ? 'right' : 'left',
    };
  });

  autoTable(doc, {
    head: [table.columns.map((column) => column.label)],
    body: rows.map((row) =>
      table.columns.map((column) => formatCell(row.cells[column.key] ?? '', column)),
    ),
    startY: headerEndY + 4,
    margin: {
      top: MARGIN,
      right: MARGIN,
      bottom: MARGIN + BOTTOM_RESERVE,
      left: MARGIN,
    },
    showHead: 'everyPage',
    // uma linha que não cabe migra inteira para a página seguinte; sem isso ela
    // é partida no rodapé e o resto aparece órfão abaixo do cabeçalho repetido
    rowPageBreak: 'avoid',
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 1.5,
      overflow: 'linebreak',
      lineColor: [110, 110, 110],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      fontSize: 10,
      fontStyle: 'bold',
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles,
  });

  drawFooters(doc);
  doc.save(table.fileName);
}
