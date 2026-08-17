import TableCard from './components/TableCard';
import { useTableState } from './hooks/useTableState';
import { TABELA1, TABELA2 } from './schema';

export default function App() {
  const [state1, actions1] = useTableState(TABELA1);
  const [state2, actions2] = useTableState(TABELA2);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-bold">Registro da Guarda</h1>

      <TableCard table={TABELA1} label="Tabela 1" state={state1} actions={actions1} />
      <TableCard table={TABELA2} label="Tabela 2" state={state2} actions={actions2} />
    </main>
  );
}
