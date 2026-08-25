// Monta o PDF de uma folha. Roda nos dois lados: no navegador, para o botão
// Exportar; e no servidor, para arquivar o dia antes de ele sair do banco.
// Uma implementação só, para as duas vias nunca divergirem de layout.

import { jsPDF } from 'jspdf';
import autoTableModule from 'jspdf-autotable';
import { formatCell, formatHeaderValue, isNumericColumn } from './formato.js';

// jspdf-autotable e um pacote CommonJS. O empacotador do navegador entrega a
// funcao direto no default; o Node entrega o namespace, com a funcao um nivel
// abaixo. Este desembrulho faz o mesmo arquivo servir aos dois.
const autoTable =
  typeof autoTableModule === 'function' ? autoTableModule : autoTableModule.default;

/** Margem da folha, em mm, nos quatro lados. */
const MARGIN = 15;
/** Distância entre o fim da tabela e a margem inferior, para o rodapé caber. */
const BOTTOM_RESERVE = 8;
/** Largura do rótulo no bloco de cabeçalho, em mm. */
const LABEL_WIDTH = 45;

function timestamp(agora) {
  return `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Rodapé em todas as páginas: data de geração à esquerda, "Página X de Y" à
 *  direita. Só pode ser desenhado depois da tabela, quando o total de páginas
 *  é conhecido. */
function drawFooters(doc, geradoEm) {
  const total = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const baseline = height - MARGIN + 4;
  const texto = `Gerado em ${timestamp(geradoEm)}`;

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(texto, MARGIN, baseline);
    doc.text(`Página ${page} de ${total}`, width - MARGIN, baseline, { align: 'right' });
  }
}

/** Bloco de cabeçalho do formulário (Data, Cmt. da Guarda, ...) em rótulo/valor
 *  empilhado, como nas linhas de topo da folha original. Devolve o Y do fim. */
function drawFormHeader(doc, table, header, usableWidth, startY) {
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

  return doc.lastAutoTable.finalY;
}

/**
 * Monta o documento e devolve o jsPDF, sem salvar.
 *
 * @param table   definição da folha (shared/schema.js)
 * @param header  valores do cabeçalho, por chave
 * @param linhas  array de objetos { chaveDaColuna: texto }
 * @param geradoEm data usada no rodapé; parametrizada para o teste ser estável
 */
export function buildTablePdf(table, header, linhas, geradoEm = new Date()) {
  const doc = new jsPDF({ orientation: table.orientation, unit: 'mm', format: 'a4' });
  const usableWidth = doc.internal.pageSize.getWidth() - 2 * MARGIN;

  // Título apenas na primeira página.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(table.title, MARGIN, MARGIN + 5);

  const headerEndY = drawFormHeader(doc, table, header, usableWidth, MARGIN + 9);

  const columnStyles = {};
  table.columns.forEach((column, index) => {
    columnStyles[index] = {
      cellWidth: column.pdfWidth,
      halign: isNumericColumn(column) ? 'right' : 'left',
    };
  });

  autoTable(doc, {
    head: [table.columns.map((column) => column.label)],
    body: linhas.map((cells) =>
      table.columns.map((column) => formatCell(cells[column.key] ?? '', column)),
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

  drawFooters(doc, geradoEm);
  return doc;
}
