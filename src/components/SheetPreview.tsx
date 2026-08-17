import { formatHeaderValue } from '../lib/header';
import { formatCell, isNumericColumn } from '../lib/normalize';
import type { TableRow } from '../lib/rows';
import type { HeaderValues, TableDef } from '../schema';

interface Props {
  table: TableDef;
  header: HeaderValues;
  rows: TableRow[];
  onFechar: () => void;
}

/** 1mm em pixels a 96dpi, e 1pt em pixels — as mesmas medidas do PDF. */
const MM = 3.7795;
const PT = 4 / 3;
const MARGIN_MM = 15;

/**
 * Prévia da folha desenhada em HTML, nas proporções reais do A4 e com as
 * mesmas medidas do PDF (margem de 15mm, título 14pt, cabeçalho 10pt, corpo
 * 9pt, rodapé 8pt, larguras de coluna proporcionais).
 *
 * Existe porque o visualizador de artefatos roda a página num iframe com
 * sandbox, e ali o leitor de PDF do navegador não abre: um iframe apontando
 * para o blob do PDF renderiza uma caixa vazia. Na versão instalada na unidade
 * nada disso se aplica — o botão baixa o PDF de verdade.
 */
export default function SheetPreview({ table, header, rows, onFechar }: Props) {
  const retrato = table.orientation === 'portrait';
  const larguraFolha = (retrato ? 210 : 297) * MM;
  const larguraUtil = (retrato ? 210 - 2 * MARGIN_MM : 297 - 2 * MARGIN_MM) * MM;
  const somaColunas = table.columns.reduce((total, c) => total + c.pdfWidth, 0);

  const geradoEm = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString(
    'pt-BR',
    { hour: '2-digit', minute: '2-digit' },
  )}`;

  return (
    <div className="mt-3 border border-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-gray-50 px-3 py-1.5">
        <span className="text-xs">
          <strong>Prévia da folha</strong> — {table.fileName}, A4{' '}
          {retrato ? 'retrato' : 'paisagem'}. Na versão instalada, este botão baixa o PDF.
        </span>
        <button
          type="button"
          className="border border-gray-400 bg-white px-2 py-1 text-xs hover:bg-gray-100"
          onClick={onFechar}
        >
          Fechar
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-200 p-3">
        <div
          className="bg-white shadow"
          style={{
            width: `${larguraFolha}px`,
            padding: `${MARGIN_MM * MM}px`,
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#000',
          }}
        >
          <div style={{ fontSize: `${14 * PT}px`, fontWeight: 700, marginBottom: `${9 * MM}px` }}>
            {table.title}
          </div>

          <table
            style={{
              width: `${larguraUtil}px`,
              borderCollapse: 'collapse',
              fontSize: `${9 * PT}px`,
              marginBottom: `${4 * MM}px`,
            }}
          >
            <tbody>
              {table.headerFields.map((field) => (
                <tr key={field.key}>
                  <td
                    style={{
                      width: `${45 * MM}px`,
                      border: '0.5px solid #6e6e6e',
                      background: '#f0f0f0',
                      fontWeight: 700,
                      padding: `${1.5 * MM}px`,
                    }}
                  >
                    {field.label}
                  </td>
                  <td style={{ border: '0.5px solid #6e6e6e', padding: `${1.5 * MM}px` }}>
                    {formatHeaderValue(field, header[field.key] ?? '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <table
            style={{
              width: `${larguraUtil}px`,
              borderCollapse: 'collapse',
              fontSize: `${9 * PT}px`,
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th
                    key={column.key}
                    style={{
                      width: `${(column.pdfWidth / somaColunas) * 100}%`,
                      background: '#000',
                      color: '#fff',
                      fontSize: `${10 * PT}px`,
                      fontWeight: 700,
                      textAlign: 'center',
                      border: '0.5px solid #6e6e6e',
                      padding: `${1.5 * MM}px`,
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={table.columns.length}
                    style={{
                      border: '0.5px solid #6e6e6e',
                      padding: `${1.5 * MM}px`,
                      color: '#666',
                    }}
                  >
                    Nenhuma linha lançada.
                  </td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={row.id} style={index % 2 === 1 ? { background: '#f0f0f0' } : undefined}>
                  {table.columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        border: '0.5px solid #6e6e6e',
                        padding: `${1.5 * MM}px`,
                        textAlign: isNumericColumn(column) ? 'right' : 'left',
                        verticalAlign: 'middle',
                        wordBreak: 'break-word',
                      }}
                    >
                      {formatCell(row.cells[column.key] ?? '', column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: `${8 * PT}px`,
              marginTop: `${10 * MM}px`,
            }}
          >
            <span>Gerado em {geradoEm}</span>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </div>

      <p className="border-t border-gray-300 px-3 py-1.5 text-xs text-gray-600">
        Prévia contínua: no PDF as linhas são divididas em páginas A4, com o cabeçalho preto
        repetido em cada uma e “Página X de Y” no rodapé.
      </p>
    </div>
  );
}
