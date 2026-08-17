import { useCallback, useEffect, useRef, useState } from 'react';
import { sugestoes } from '../lib/lists';

interface Props {
  value: string;
  opcoes: string[];
  ariaLabel: string;
  className: string;
  onChange: (valor: string) => void;
  onCommit: () => void;
}

interface Caixa {
  left: number;
  top: number;
  width: number;
}

/**
 * Campo de texto com autopreenchimento a partir de uma lista.
 *
 * Digitar é livre: a lista sugere, não obriga — um condutor novo pode ser
 * lançado sem estar cadastrado.
 *
 * A lista suspensa usa position: fixed, medida a partir do campo. Isso é
 * necessário porque a tabela vive num container com overflow-x-auto, e quando
 * um dos eixos rola o outro deixa de ser "visible": uma lista posicionada de
 * forma absoluta dentro da célula seria cortada pela borda do container.
 */
export default function AutoCompleteCell({
  value,
  opcoes,
  ariaLabel,
  className,
  onChange,
  onCommit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(-1);
  const [caixa, setCaixa] = useState<Caixa | null>(null);

  const lista = aberto ? sugestoes(opcoes, value) : [];

  const medir = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCaixa({ left: r.left, top: r.bottom, width: r.width });
  }, []);

  useEffect(() => {
    if (!aberto) return;
    medir();
    // rolagem em qualquer ancestral e mudança de tamanho movem o campo
    window.addEventListener('scroll', medir, true);
    window.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('scroll', medir, true);
      window.removeEventListener('resize', medir);
    };
  }, [aberto, medir]);

  function abrir() {
    setAberto(true);
    setDestacado(-1);
  }

  function fechar() {
    setAberto(false);
    setDestacado(-1);
  }

  function escolher(item: string) {
    onChange(item);
    fechar();
    // devolve o foco para o campo, para seguir com Tab para a próxima coluna
    inputRef.current?.focus();
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!aberto) {
        abrir();
        return;
      }
      if (lista.length === 0) return;
      const passo = evento.key === 'ArrowDown' ? 1 : -1;
      setDestacado((atual) => {
        const proximo = atual + passo;
        if (proximo < 0) return lista.length - 1;
        if (proximo >= lista.length) return 0;
        return proximo;
      });
      return;
    }

    if (evento.key === 'Enter' && aberto && destacado >= 0 && lista[destacado]) {
      evento.preventDefault();
      escolher(lista[destacado]);
      return;
    }

    if (evento.key === 'Escape' && aberto) {
      evento.preventDefault();
      fechar();
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
          setDestacado(-1);
        }}
        onFocus={abrir}
        onClick={abrir}
        onKeyDown={aoTeclar}
        onBlur={() => {
          fechar();
          onCommit();
        }}
      />

      {aberto && lista.length > 0 && caixa && (
        <ul
          role="listbox"
          className="fixed z-50 max-h-56 overflow-y-auto border border-gray-400 bg-white shadow-lg"
          style={{ left: caixa.left, top: caixa.top, width: Math.max(caixa.width, 180) }}
        >
          {lista.map((item, i) => (
            <li key={item}>
              <button
                type="button"
                role="option"
                aria-selected={i === destacado}
                className={`block w-full px-2 py-1.5 text-left text-sm ${
                  i === destacado ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
                // evita que o campo perca o foco antes do clique registrar
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setDestacado(i)}
                onClick={() => escolher(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
