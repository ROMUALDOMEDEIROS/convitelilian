/** Substituto do módulo de PDF no build de demonstração.
 *  Ali a folha é desenhada em HTML (SheetPreview) e o jsPDF nunca é chamado,
 *  então mantê-lo no pacote só engordaria a página publicada. */
export function exportTablePdf(): void {
  throw new Error('Exportação de PDF não existe no build de demonstração.');
}
