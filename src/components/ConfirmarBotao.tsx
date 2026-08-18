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
        className="rg-btn rg-btn-danger"
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
        className="rg-btn rg-btn-xs rg-btn-primary font-bold"
        onClick={() => {
          setPerguntando(false);
          onConfirm();
        }}
      >
        {confirmar}
      </button>
      <button
        type="button"
        className="rg-btn rg-btn-xs"
        onClick={() => setPerguntando(false)}
      >
        Cancelar
      </button>
    </span>
  );
}
