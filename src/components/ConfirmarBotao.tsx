import { useState } from 'react';

interface Props {
  /** rótulo normal do botão */
  label: string;
  /** pergunta mostrada no lugar do botão, antes de confirmar */
  pergunta: string;
  confirmar: string;
  onConfirm: () => void;
}

/**
 * Confirmação feita na própria página, e não com window.confirm.
 *
 * O motivo é concreto: quando a página roda dentro de um iframe com sandbox
 * sem "allow-modals" — o caso do visualizador de artefatos —, o navegador
 * IGNORA window.confirm e ele devolve false. A ação nunca acontecia e o botão
 * parecia morto. Uma confirmação em HTML funciona em qualquer contexto.
 */
export default function ConfirmarBotao({ label, pergunta, confirmar, onConfirm }: Props) {
  const [perguntando, setPerguntando] = useState(false);

  if (!perguntando) {
    return (
      <button
        type="button"
        className="border border-gray-400 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
        onClick={() => setPerguntando(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 border border-red-300 bg-red-50 px-2 py-1">
      <span className="text-xs text-red-900">{pergunta}</span>
      <button
        type="button"
        className="border border-red-700 bg-red-700 px-2 py-1 text-xs font-bold text-white hover:bg-red-800"
        onClick={() => {
          setPerguntando(false);
          onConfirm();
        }}
      >
        {confirmar}
      </button>
      <button
        type="button"
        className="border border-gray-400 bg-white px-2 py-1 text-xs hover:bg-gray-100"
        onClick={() => setPerguntando(false)}
      >
        Cancelar
      </button>
    </span>
  );
}
