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
          <strong>Versão de demonstração, para avaliar a tela.</strong> Aqui você pode importar
          uma planilha, digitar, adicionar e excluir linhas e ver os dois PDFs. Duas diferenças
          em relação à versão instalada na unidade: o botão <strong>Salvar no banco</strong> está
          desativado, porque o banco de dados fica num servidor da própria unidade; e{' '}
          <strong>Ver PDF</strong> mostra a folha desenhada na tela, nas medidas reais do A4, em vez
          de baixar o arquivo — este visualizador não permite downloads nem abrir PDF. Na versão
          instalada, o mesmo botão gera e baixa o PDF. Nada do que você digitar aqui sai deste
          navegador.
        </div>
      )}

      <TableCard table={TABELA1} label="Tabela 1" state={state1} actions={actions1} />
      <TableCard table={TABELA2} label="Tabela 2" state={state2} actions={actions2} />
    </main>
  );
}
