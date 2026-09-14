const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageOrientation,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, PageNumber, Footer,
} = require('docx');

const CSV = '/home/user/convitelilian/wpfg2027/dados/frequencia-consolidada.csv';
const rows = (() => {
  const [head, ...body] = fs.readFileSync(CSV, 'utf8').trim().split('\n');
  const cols = head.split(',');
  return body.map(l => {
    const v = l.split(','); const o = {};
    cols.forEach((c, i) => o[c] = v[i]);
    return o;
  });
})();
const com = rows.filter(r => +r.presencas > 0);
const MESES = [['OUT_2025','Out/25',2],['NOV_2025','Nov/25',8],['DEZ_2025','Dez/25',7],
               ['MAR_2026','Mar/26',7],['ABR_2026','Abr/26',8],['AGO_2026','Ago/26',8]];

const AZUL = '1F3864', CINZA = 'F2F2F2';
const P = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 100, line: 264 },
  alignment: o.align ?? AlignmentType.JUSTIFIED,
  children: (Array.isArray(text) ? text : [new TextRun({ text, size: 20, font: 'Calibri' })]),
});
const H = (text, level) => new Paragraph({
  heading: level, spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, color: AZUL, font: 'Calibri',
                           size: level === HeadingLevel.HEADING_1 ? 28 : 24 })],
});
const cell = (txt, { w, bold, fill, align, size } = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
  margins: { top: 60, bottom: 60, left: 80, right: 80 },
  children: [new Paragraph({
    alignment: align ?? AlignmentType.LEFT, spacing: { after: 0 },
    children: [new TextRun({ text: String(txt), bold: !!bold, size: size ?? 18,
                             font: 'Calibri', color: bold && fill === AZUL ? 'FFFFFF' : '000000' })],
  })],
});
const table = (widths, header, body) => new Table({
  columnWidths: widths,
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  borders: ['top','bottom','left','right','insideHorizontal','insideVertical'].reduce((o, k) => {
    o[k] = { style: BorderStyle.SINGLE, size: 2, color: 'BFBFBF' }; return o; }, {}),
  rows: [
    new TableRow({ tableHeader: true, children: header.map((h, i) =>
      cell(h.t, { w: widths[i], bold: true, fill: AZUL, align: h.a })) }),
    ...body.map((r, ri) => new TableRow({ children: r.map((c, i) =>
      cell(c.t, { w: widths[i], align: c.a, bold: c.b, fill: ri % 2 ? CINZA : undefined })) })),
  ],
});
const C = AlignmentType.CENTER, R = AlignmentType.RIGHT;

/* ---------- Seção 1: retrato ---------- */
const s1 = [
  new Paragraph({ alignment: C, spacing: { after: 60 },
    children: [new TextRun({ text: 'LEVANTAMENTO DE FREQUÊNCIA NOS TREINOS',
                             bold: true, size: 30, color: AZUL, font: 'Calibri' })] }),
  new Paragraph({ alignment: C, spacing: { after: 240 },
    children: [new TextRun({ text: 'Indicação de atletas ao World Police and Fire Games (WPFG) 2027',
                             size: 22, color: '595959', font: 'Calibri' })] }),
  P([new TextRun({ text: 'Finalidade: ', bold: true, size: 20, font: 'Calibri' }),
     new TextRun({ text: 'subsidiar a indicação de atletas ao World Police and Fire Games (WPFG) 2027 quanto ao critério frequência de treinos.', size: 20, font: 'Calibri' })]),
  P([new TextRun({ text: 'Base documental: ', bold: true, size: 20, font: 'Calibri' }),
     new TextRun({ text: 'seis folhas mensais de controle de presença da equipe.', size: 20, font: 'Calibri' })], { after: 280 }),

  H('1. Período abrangido e metodologia', HeadingLevel.HEADING_1),
  P('As folhas cobrem seis meses, não consecutivos:'),
  table([3400, 1900, 1900, 2438],
    [{ t: 'Mês' }, { t: 'Sessões de treino', a: C }, { t: 'Nomes na folha', a: C }, { t: 'Atletas com presença', a: C }],
    [['Outubro/2025','2','187','21'], ['Novembro/2025','8','187','38'], ['Dezembro/2025','7','187','16'],
     ['Março/2026','7','139','28'], ['Abril/2026','8','139','18'], ['Agosto/2026','8','139','18'],
     ['TOTAL','40','188 distintos','59']]
      .map((r, i) => r.map((t, j) => ({ t, a: j ? C : undefined, b: i === 6 })))),
  P('', { after: 40 }),
  P([new TextRun({ text: 'Não há registro', bold: true, size: 20, font: 'Calibri' }),
     new TextRun({ text: ' de janeiro, fevereiro, maio, junho e julho de 2026, nem de setembro de 2026 até a data deste levantamento. Os percentuais a seguir referem-se, portanto, exclusivamente às 40 sessões documentadas.', size: 20, font: 'Calibri' })]),
  P([new TextRun({ text: 'Como o número de sessões de cada mês foi apurado. ', bold: true, size: 20, font: 'Calibri' }),
     new TextRun({ text: 'Não foi arbitrado: foi deduzido da própria taxa de presença constante das folhas. Em março de 2026, por exemplo, o atleta com 7 marcações registra 100% e o atleta com 3 marcações registra 43% (3÷7); logo, o mês teve 7 sessões. O mesmo cruzamento confirma o denominador nos seis meses. Isso permite afirmar "presente em 28 das 40 sessões" com respaldo documental.', size: 20, font: 'Calibri' })]),
  P([new TextRun({ text: 'Base de cálculo individual. ', bold: true, size: 20, font: 'Calibri' }),
     new TextRun({ text: 'O percentual de cada atleta é calculado sobre as sessões dos meses em que seu nome constava da folha. A composição da equipe mudou entre 2025 (187 nomes) e 2026 (139 nomes); assim, quem só figura nas folhas de 2025 é avaliado sobre 17 sessões, e não sobre 40, o que evita penalizar o atleta por meses em que sequer integrava a relação.', size: 20, font: 'Calibri' })], { after: 240 }),

  H('2. Quadro geral', HeadingLevel.HEADING_1),
  table([6200, 3438],
    [{ t: 'Faixa de frequência' }, { t: 'Atletas', a: C }],
    [['50% ou mais','4'], ['30% a 49%','5'], ['15% a 29%','11'], ['5% a 14%','25'],
     ['1% a 4%','14'], ['Nenhuma presença registrada','129'], ['Total de nomes nas folhas','188']]
      .map((r, i) => r.map((t, j) => ({ t, a: j ? C : undefined, b: i >= 5 })))),
  P('', { after: 40 }),
  P('Foram registradas 351 presenças nas 40 sessões. Entre os dois anos, 25 atletas treinaram em 2025 e em 2026; 20 apenas em 2025, sem treino em 2026; e 14 apenas em 2026, por ingresso posterior. Em agosto de 2026, mês mais recente documentado, 18 atletas registraram presença.', { after: 200 }),
];

/* ---------- Seção 2: paisagem, relação nominal ---------- */
const wN = [600, 4800, 900, 1300, 1162, 1162, 1162, 1162, 1161, 1161];
const corpo = com.map(r => {
  const linha = [
    { t: com.indexOf(r) + 1, a: C },
    { t: r.nome },
    { t: r.frequencia_pct + '%', a: C, b: true },
    { t: `${r.presencas}/${r.sessoes_em_que_constava}`, a: C },
  ];
  MESES.forEach(([k, , s]) => {
    const p = r[k + '_P'];
    linha.push({ t: p === '' ? '—' : (+p ? `${p}/${s}` : '0'), a: C });
  });
  return linha;
});
const s2 = [
  H('3. Relação nominal por frequência', HeadingLevel.HEADING_1),
  P('Os 59 atletas com ao menos uma presença, em ordem decrescente de frequência. As colunas mensais indicam presenças sobre sessões do mês; "0" significa mês sem presença e travessão significa mês em que o nome não constava da folha.'),
  table(wN,
    [{ t: '#', a: C }, { t: 'Atleta' }, { t: 'Freq.', a: C }, { t: 'Presenças', a: C },
     ...MESES.map(([, r]) => ({ t: r, a: C }))],
    corpo),
  P('', { after: 160 }),
  P('Os demais 129 nomes constantes das folhas não registraram presença em nenhuma das 40 sessões.'),
];

/* ---------- Seção 3: retrato, observações ---------- */
const s3 = [
  H('4. Observações necessárias à análise', HeadingLevel.HEADING_1),
  H('4.1. Leitura dos percentuais', HeadingLevel.HEADING_2),
  P('Os percentuais devem ser lidos contra as 40 sessões documentadas, e não contra o ciclo completo. Como cinco meses de 2026 não possuem folha, o atleta que tenha treinado regularmente nesses meses figura aqui com frequência inferior à real. Recomenda-se, se possível, juntar as folhas faltantes antes do envio à comissão.'),
  H('4.2. Ausência no mês mais recente', HeadingLevel.HEADING_2),
  P('Dois atletas do topo do quadro não registram presença em agosto de 2026: Aline Venturelli Ferreira Antonio, 1ª colocada, com 100% em março e abril; e Fernando Dias De Moura, 5º colocado, com 100% em outubro, março e abril. A ausência no mês mais recente precisa de esclarecimento (afastamento, missão, curso, licença médica ou desligamento) antes de qualquer afirmação sobre assiduidade atual.'),
  H('4.3. Presença concentrada em período específico', HeadingLevel.HEADING_2),
  P('Andressa Cristina Cardoso Aguiar registra 100% em novembro de 2025 (8 de 8), sem presença em dezembro e abril. Fabio Dos Santos Miranda, Ronaldo Lima De Medeiros e Natalia Britto Rocha concentram presença em 2025 e não registram treino em 2026. Já Natalia Cavalcanti Lopes Lima, Larissa Rodrigues Coqueiro e Ana Paula Moraes De Araújo só aparecem a partir de março de 2026, trajetória ascendente que o percentual global não evidencia.'),
  H('4.4. Inconsistências cadastrais', HeadingLevel.HEADING_2),
  P('Um registro consta apenas como "Jeyson", sem sobrenome, presente somente nas folhas de 2025. O nome de André Vieira Alves consta nas folhas com caractere irregular na letra "e", grafado "Andrė". Outubro de 2025 possui apenas 2 sessões registradas, número que destoa dos demais meses e pode indicar folha incompleta.'),
  H('4.5. Alcance deste levantamento', HeadingLevel.HEADING_2),
  P('Este levantamento cobre um único critério. Desempenho competitivo, qualidade técnica e engajamento nas atividades da equipe não constam das folhas de presença e demandam fonte própria.'),
  P('', { after: 300 }),
  new Paragraph({
    spacing: { before: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' } },
    children: [new TextRun({ text: 'Elaborado a partir das folhas mensais de controle de presença. Os dados extraídos, a planilha consolidada e os scripts de leitura estão arquivados para conferência.', size: 16, italics: true, color: '595959', font: 'Calibri' })],
  }),
];

const rodape = new Footer({ children: [new Paragraph({ alignment: C,
  children: [new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
                           size: 16, color: '595959', font: 'Calibri' })] })] });
const A4 = { width: 11906, height: 16838 };
const margens = { top: 1134, right: 1134, bottom: 1134, left: 1134 };

const doc = new Document({
  creator: 'Levantamento WPFG 2027', title: 'Levantamento de Frequência nos Treinos',
  sections: [
    { properties: { page: { size: A4, margin: margens } }, footers: { default: rodape }, children: s1 },
    { properties: { page: { size: { ...A4, orientation: PageOrientation.LANDSCAPE }, margin: margens } },
      footers: { default: rodape }, children: s2 },
    { properties: { page: { size: A4, margin: margens } }, footers: { default: rodape }, children: s3 },
  ],
});
Packer.toBuffer(doc).then(b => {
  fs.writeFileSync('/home/user/convitelilian/wpfg2027/Levantamento-Frequencia-WPFG2027.docx', b);
  console.log('gerado:', b.length, 'bytes |', com.length, 'atletas na tabela');
});
