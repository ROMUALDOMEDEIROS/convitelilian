import TableCard from './components/TableCard';
import { useTableState } from './hooks/useTableState';
import { DEMO } from './lib/demo';
import { TABELA1, TABELA2 } from './schema';

export default function App() {
  const [state1, actions1] = useTableState(TABELA1);
  const [state2, actions2] = useTableState(TABELA2);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-bold">Registro da Guarda</h1>

      {DEMO && (
        <div className="aviso-demo">
          <strong>Versão de demonstração, para avaliar a tela.</strong> Aqui você importa uma
          planilha, digita, adiciona e exclui linhas e vê como as duas folhas ficam impressas.
          Duas diferenças em relação à versão instalada na unidade: <strong>Salvar no banco</strong>{' '}
          está desativado, porque o banco de dados fica num servidor da própria unidade; e{' '}
          <strong>Ver folha em A4</strong> desenha a folha aqui na tela, nas medidas reais, porque
          este visualizador não permite baixar nem abrir arquivos PDF. Na versão instalada, esse
          mesmo botão vira <strong>Exportar PDF</strong> e baixa o arquivo. Nada do que você digitar
          aqui sai deste navegador.
        </div>
      )}

      <TableCard table={TABELA1} label="viaturas" state={state1} actions={actions1} />
      <TableCard table={TABELA2} label="pais / responsáveis" state={state2} actions={actions2} />
    </main>
  );
}
