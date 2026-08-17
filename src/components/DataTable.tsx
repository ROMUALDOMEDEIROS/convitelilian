import { isNumericColumn } from '../lib/normalize';
import type { TableRow } from '../lib/rows';
import type { TableDef } from '../schema';
import type { TableActions } from '../hooks/useTableState';

interface Props {
  table: TableDef;
  rows: TableRow[];
  actions: TableActions;
}

export default function DataTable({ table, rows, actions }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        Nenhuma linha. Importe um arquivo ou clique em “Adicionar linha”.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-300">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black text-white">
            {table.columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="border border-gray-600 px-2 py-1.5 text-center font-bold whitespace-nowrap"
              >
                {column.label}
              </th>
            ))}
            <th
              scope="col"
              aria-label="Excluir"
              className="w-12 border border-gray-600 px-2 py-1.5"
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className={index % 2 === 1 ? 'bg-gray-50' : undefined}>
              {table.columns.map((column) => (
                <td key={column.key} className="border border-gray-300 p-0">
                  <input
                    type="text"
                    value={row.cells[column.key] ?? ''}
                    aria-label={`${column.label}, linha ${index + 1}`}
                    className={`w-full min-w-[6rem] bg-transparent px-2 py-1.5 outline-none focus:bg-yellow-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                      isNumericColumn(column) ? 'text-right' : 'text-left'
                    }`}
                    onChange={(event) => actions.editCell(row.id, column.key, event.target.value)}
                    onBlur={() => actions.commitCell(row.id, column.key)}
                  />
                </td>
              ))}
              <td className="border border-gray-300 text-center">
                <button
                  type="button"
                  title={`Excluir linha ${index + 1}`}
                  aria-label={`Excluir linha ${index + 1}`}
                  className="px-2 py-1 text-gray-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => actions.deleteRow(row.id)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
