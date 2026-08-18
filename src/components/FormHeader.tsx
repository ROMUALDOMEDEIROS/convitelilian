import { formatDataLonga, todayISO } from '../lib/header';
import type { HeaderValues, TableDef } from '../schema';
import type { TableActions } from '../hooks/useTableState';

interface Props {
  table: TableDef;
  header: HeaderValues;
  actions: TableActions;
}

export default function FormHeader({ table, header, actions }: Props) {
  return (
    <div className="mb-2 grid gap-2 border border-gray-300 p-3 sm:grid-cols-2">
      {table.headerFields.map((field) => {
        const value = header[field.key] ?? '';
        const isDate = field.type === 'data';

        return (
          <label key={field.key} className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-gray-700">{field.label}</span>
            <input
              type={isDate ? 'date' : 'text'}
              value={value}
              className="border border-gray-300 px-2 py-1 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#c8a13a]"
              onChange={(event) => actions.editHeader(field.key, event.target.value)}
            />
            {isDate && (
              <span className="text-xs text-gray-500">
                {value === '' ? 'sem data' : formatDataLonga(value)}
                {value !== todayISO() && value !== '' && ' — não é a data de hoje'}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
