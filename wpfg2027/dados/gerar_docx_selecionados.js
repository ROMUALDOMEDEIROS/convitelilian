const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,PageOrientation,
 Table,TableRow,TableCell,WidthType,ShadingType,BorderStyle,PageNumber,Footer}=require('docx');
const sel=JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-convitelilian/a2eeed33-af2d-5364-8b30-09e1267e3793/scratchpad/selecionados.json','utf8'));
const AZUL='1F3864',CINZA='F2F2F2',VERM='C00000',AMB='FFF2CC';
const C=AlignmentType.CENTER;
const P=(t,o={})=>new Paragraph({spacing:{after:o.after??100,line:264},alignment:o.align??AlignmentType.JUSTIFIED,
 children:Array.isArray(t)?t:[new TextRun({text:t,size:20,font:'Calibri'})]});
const H=(t,l)=>new Paragraph({heading:l,spacing:{before:240,after:120},
 children:[new TextRun({text:t,bold:true,color:AZUL,font:'Calibri',size:l===HeadingLevel.HEADING_1?28:24})]});
const cell=(txt,{w,bold,fill,align,color,size}={})=>new TableCell({
 width:{size:w,type:WidthType.DXA},
 shading:fill?{type:ShadingType.CLEAR,fill,color:'auto'}:undefined,
 margins:{top:60,bottom:60,left:80,right:80},
 children:[new Paragraph({alignment:align??AlignmentType.LEFT,spacing:{after:0},
  children:[new TextRun({text:String(txt),bold:!!bold,size:size??18,font:'Calibri',
   color:color??(fill===AZUL?'FFFFFF':'000000')})]})]});
const mkTable=(widths,header,body)=>new Table({columnWidths:widths,
 width:{size:widths.reduce((a,b)=>a+b,0),type:WidthType.DXA},
 borders:['top','bottom','left','right','insideHorizontal','insideVertical']
   .reduce((o,k)=>{o[k]={style:BorderStyle.SINGLE,size:2,color:'BFBFBF'};return o;},{}),
 rows:[new TableRow({tableHeader:true,children:header.map((h,i)=>cell(h.t,{w:widths[i],bold:true,fill:AZUL,align:h.a}))}),
  ...body.map((r,ri)=>new TableRow({children:r.map((c,i)=>
    cell(c.t,{w:widths[i],align:c.a,bold:c.b,color:c.c,fill:c.f??(ri%2?CINZA:undefined)}))}))]});

const MES=['Out/25','Nov/25','Dez/25','Mar/26','Abr/26','Ago/26'];
const ordenado=[...sel].sort((a,b)=>(b.pct??-1)-(a.pct??-1));
const w=[500,2200,1000,3800,800,870,900,900,900,900,900,900]; // soma 14570 = largura util em paisagem
const corpo=ordenado.map(r=>{
  const ni=r.pct===null, zero=r.pct===0;
  const f=ni?AMB:undefined;
  const base=[{t:r.n,a:C,f},{t:r.apelido,f},{t:r.faixa,a:C,f},
    {t:ni?'NÃO IDENTIFICADO — preencher':r.folha,c:ni?VERM:undefined,b:ni,f},
    {t:ni?'—':r.pct+'%',a:C,b:true,c:ni?VERM:(zero?VERM:undefined),f},
    {t:ni?'—':`${r.p}/${r.base}`,a:C,f}];
  (r.meses??['—','—','—','—','—','—']).forEach(m=>base.push({t:m,a:C,f}));
  return base;
});
const A4={width:11906,height:16838}, marg={top:1134,right:1134,bottom:1134,left:1134};
const rodape=new Footer({children:[new Paragraph({alignment:C,
 children:[new TextRun({children:['Página ',PageNumber.CURRENT,' de ',PageNumber.TOTAL_PAGES],size:16,color:'595959',font:'Calibri'})]})]});

const s1=[
 new Paragraph({alignment:C,spacing:{after:60},children:[new TextRun({text:'FREQUÊNCIA DOS ATLETAS SELECIONADOS',bold:true,size:30,color:AZUL,font:'Calibri'})]}),
 new Paragraph({alignment:C,spacing:{after:240},children:[new TextRun({text:'World Police and Fire Games (WPFG) 2027 — 28 atletas indicados',size:22,color:'595959',font:'Calibri'})]}),
 P('Quadro de frequência dos 28 atletas selecionados, apurado sobre as folhas mensais de controle de presença da equipe: 40 sessões documentadas em outubro, novembro e dezembro de 2025 e março, abril e agosto de 2026. Não há folha de janeiro, fevereiro, maio, junho e julho de 2026.'),
 P('As colunas mensais indicam presenças sobre sessões do mês; "0" significa mês sem presença. O percentual é calculado sobre as sessões dos meses em que o nome constava da relação.'),
 mkTable(w,[{t:'#',a:C},{t:'Selecionado'},{t:'Faixa (anos)',a:C},{t:'Nome na folha de presença'},{t:'Freq.',a:C},{t:'Pres.',a:C},...MES.map(m=>({t:m,a:C}))],corpo),
 P('',{after:120}),
 P([new TextRun({text:'Atenção: ',bold:true,size:20,font:'Calibri',color:VERM}),
    new TextRun({text:'dois selecionados não puderam ser identificados na folha e estão destacados no quadro. "Mata" corresponde a Cristiano Rodrigues Alves Da Mata ou a Renan Victor Cavalcante Da Mata. "Dias" admite oito correspondências na relação. A identificação depende de confirmação da coordenação.',size:20,font:'Calibri'})]),
];
const s2=[
 H('Observações',HeadingLevel.HEADING_1),
 H('1. Distribuição da frequência entre os selecionados',HeadingLevel.HEADING_2),
 mkTable([5000,1800,2838],
  [{t:'Faixa de frequência'},{t:'Atletas',a:C},{t:'Proporção',a:C}],
  [['50% ou mais','4','15%'],['25% a 49%','5','19%'],['10% a 24%','4','15%'],
   ['1% a 9%','7','27%'],['Nenhuma presença registrada','6','23%'],
   ['Não identificados na folha','2','—']].map((r,i)=>r.map((t,j)=>({t,a:j?C:undefined,b:i>=4})))),
 P('',{after:120}),
 P('Os 26 selecionados identificados somam 200 das 351 presenças registradas pela equipe no período, o equivalente a 57% do total.'),
 H('2. Selecionados sem presença registrada',HeadingLevel.HEADING_2),
 P('Seis selecionados não registram presença em nenhuma das 40 sessões documentadas: Jose Lindomar Neres Junior, Uendel Dourado Gomes, Joviano Fernandes Borges, Avanir De Alecrim Silva, Flavia Meirelles De Souza e Thalita Cabral Lima. Outros sete registram entre uma e três presenças.'),
 P('A ausência de registro não equivale a ausência de treinamento. As folhas disponíveis podem não abranger todos os grupos, modalidades ou locais de treino da equipe, e atletas de categorias máster e de modalidades individuais frequentemente treinam fora do coletivo. A justificativa individual desses atletas deve, portanto, apoiar-se em fundamento próprio — desempenho competitivo, índice obtido, representação anterior da corporação ou treinamento em outro grupo —, declarado de forma expressa, e não em frequência que a documentação não ampara.'),
 H('3. Ausência no mês mais recente',HeadingLevel.HEADING_2),
 P('Aline Venturelli Ferreira Antonio, com a maior frequência do grupo (70%) e presença integral em março e abril de 2026, não registra presença em agosto de 2026. A situação requer esclarecimento antes de qualquer afirmação sobre assiduidade atual.'),
 H('4. Homonímia na relação',HeadingLevel.HEADING_2),
 P('Além dos dois selecionados não identificados, registre-se que "Da Cunha" foi associado a Alexandre Tavares Da Cunha, único portador desse sobrenome com presença registrada; constam ainda na folha André Luiz Da Cunha Nascimento Dias e Diego Machado Cunha. A folha de presença não registra idade nem matrícula, o que impede a desambiguação automática. Recomenda-se a adoção de nome completo e matrícula nos controles futuros.'),
 P('',{after:240}),
 new Paragraph({spacing:{before:200},border:{top:{style:BorderStyle.SINGLE,size:4,color:'BFBFBF'}},
  children:[new TextRun({text:'Apurado a partir das folhas mensais de controle de presença da equipe. Dados extraídos, planilha consolidada e scripts de leitura arquivados para conferência.',size:16,italics:true,color:'595959',font:'Calibri'})]}),
];
const doc=new Document({creator:'Frequência dos Selecionados WPFG 2027',title:'Frequência dos Atletas Selecionados — WPFG 2027',
 sections:[
  {properties:{page:{size:{...A4,orientation:PageOrientation.LANDSCAPE},margin:marg}},footers:{default:rodape},children:s1},
  {properties:{page:{size:A4,margin:marg}},footers:{default:rodape},children:s2}]});
Packer.toBuffer(doc).then(b=>{fs.writeFileSync('/home/user/convitelilian/wpfg2027/Frequencia-Selecionados-WPFG2027.docx',b);console.log('gerado',b.length,'bytes |',sel.length,'selecionados');});
