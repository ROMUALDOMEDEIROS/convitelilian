import { useRef, useState } from 'react';
import ConfirmarBotao from './ConfirmarBotao';
import { LISTAS, type ListDef, type Listas } from '../lib/lists';
import type { ListsActions } from '../hooks/useLists';

interface Props {
  listas: Listas;
  erro: string | null;
  aviso: string | null;
  actions: ListsActions;
}

function Coluna({
  def,
  itens,
  actions,
}: {
  def: ListDef;
  itens: string[];
  actions: ListsActions;
}) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [novo, setNovo] = useState('');
  const [recusa, setRecusa] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');

  function acrescentar() {
    const mensagem = actions.adicionar(def.key, novo);
    setRecusa(mensagem);
    if (!mensagem) setNovo('');
  }

  const visiveis = itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => item.toLowerCase().includes(filtro.trim().toLowerCase()));

  return (
    <section className="flex min-w-0 flex-col border border-gray-300">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-gray-100 px-3 py-2">
        <h3 className="text-sm font-bold">
          {def.titulo} <span className="font-normal text-gray-500">({itens.length})</span>
        </h3>
        <div className="flex flex-wrap items-center gap-1">
          <input
            ref={arquivoRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xlsm,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void actions.importar(def, file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="border border-gray-400 bg-white px-2 py-1 text-xs hover:bg-gray-200"
            onClick={() => arquivoRef.current?.click()}
          >
            Importar lista
          </button>
          <button
            type="button"
            className="border border-gray-400 bg-white px-2 py-1 text-xs hover:bg-gray-200"
            title="Volta aos nomes que estavam na planilha original"
            onClick={() => actions.restaurar(def.key)}
          >
            Restaurar original
          </button>
          <ConfirmarBotao
            label="Esvaziar"
            pergunta={`Apagar os ${itens.length} nome(s) de ${def.titulo}?`}
            confirmar="Sim, esvaziar"
            onConfirm={() => actions.limparTudo(def.key)}
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 px-3 py-2">
        <input
          type="text"
          value={novo}
          placeholder={def.exemplo}
          aria-label={`Novo nome em ${def.titulo}`}
          className="min-w-0 flex-1 border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onChange={(e) => {
            setNovo(e.target.value);
            setRecusa(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              acrescentar();
            }
          }}
        />
        <button
          type="button"
          className="border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100"
          onClick={acrescentar}
        >
          Acrescentar
        </button>
      </div>

      {recusa && <p className="px-3 py-1 text-xs text-red-700">{recusa}</p>}

      {itens.length > 8 && (
        <div className="border-b border-gray-200 px-3 py-2">
          <input
            type="text"
            value={filtro}
            placeholder="Procurar na lista..."
            aria-label={`Procurar em ${def.titulo}`}
            className="w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      )}

      <ul className="max-h-72 overflow-y-auto">
        {itens.length === 0 && (
          <li className="px-3 py-3 text-sm text-gray-500">
            Lista vazia. Acrescente acima ou use “Importar lista”.
          </li>
        )}
        {itens.length > 0 && visiveis.length === 0 && (
          <li className="px-3 py-3 text-sm text-gray-500">Nenhum nome com “{filtro}”.</li>
        )}
        {visiveis.map(({ item, indice }) => (
          <li key={`${indice}-${item}`} className="flex items-center gap-1 border-b border-gray-100">
            <input
              type="text"
              value={item}
              aria-label={`${def.titulo}: ${item}`}
              className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm outline-none focus:bg-yellow-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onChange={(e) => actions.alterar(def.key, indice, e.target.value)}
              onBlur={() => actions.ordenar(def.key)}
            />
            <button
              type="button"
              title={`Excluir ${item}`}
              aria-label={`Excluir ${item}`}
              className="px-3 py-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => actions.remover(def.key, indice)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ListsPanel({ listas, erro, aviso, actions }: Props) {
  const [aberto, setAberto] = useState(false);
  const total = LISTAS.reduce((soma, def) => soma + listas[def.key].length, 0);

  return (
    <section className="mb-8">
      <button
        type="button"
        className="flex w-full items-center justify-between border border-gray-400 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        <span className="text-sm font-bold">
          Cadastro de viaturas e condutores{' '}
          <span className="font-normal text-gray-600">
            — {listas.vtr.length} viaturas, {listas.condutor.length} condutores
          </span>
        </span>
        <span className="text-xs text-gray-600">
          {aberto ? 'ocultar ▲' : 'abrir para editar ▼'}
        </span>
      </button>

      {aberto && (
        <div className="border border-t-0 border-gray-400 p-3">
          <p className="mb-3 text-xs text-gray-600">
            Estes nomes alimentam o autopreenchimento das colunas{' '}
            <strong>Interna</strong>, <strong>Externa</strong>, <strong>Condutor</strong> e{' '}
            <strong>Autorizado por</strong>. Digitar continua livre: a lista sugere, não obriga —
            dá para lançar um nome que não está cadastrado. As {total} entradas ficam salvas neste
            navegador.
          </p>

          {erro && <p className="mb-2 text-sm text-red-700">{erro}</p>}
          {aviso && !erro && <p className="mb-2 text-sm text-green-800">{aviso}</p>}

          <div className="grid gap-3 lg:grid-cols-2">
            {LISTAS.map((def) => (
              <Coluna key={def.key} def={def} itens={listas[def.key]} actions={actions} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
