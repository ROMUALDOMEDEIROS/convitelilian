import { useCallback, useEffect, useRef, useState } from 'react';
import { chave, sugestoes } from '../lib/lists';

interface Props {
  value: string;
  opcoes: string[];
  ariaLabel: string;
  className: string;
  onChange: (valor: string) => void;
  onCommit: () => void;
  /** Cadastra o nome digitado na lista. Ausente = sem opção de cadastrar. */
  onCadastrar?: (valor: string) => void;
}

interface Caixa {
  left: number;
  top: number;
  width: number;
}

type Linha = { tipo: 'opcao'; texto: string } | { tipo: 'cadastrar'; texto: string };

/**
 * Campo de texto com autopreenchimento a partir de uma lista.
 *
 * Digitar é livre: a lista sugere, não obriga. Quando o texto não está na lista
 * e `onCadastrar` foi passado, a última linha do menu vira um atalho para
 * cadastrar o nome ali mesmo, sem ir ao painel do topo.
 *
 * A lista suspensa usa position: fixed, medida a partir do campo, porque a
 * tabela vive num container com overflow-x-auto: uma lista posicionada de forma
 * absoluta dentro da célula seria cortada pela borda do container.
 */
export default function AutoCompleteCell({
  value,
  opcoes,
  ariaLabel,
  className,
  onChange,
  onCommit,
  onCadastrar,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(-1);
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [cadastrado, setCadastrado] = useState<string | null>(null);

  const texto = value.trim();
  const jaExiste = texto !== '' && opcoes.some((o) => chave(o) === chave(texto));
  const podeCadastrar = !!onCadastrar && texto !== '' && !jaExiste;

  const linhas: Linha[] = aberto
    ? [
        ...sugestoes(opcoes, value).map((o): Linha => ({ tipo: 'opcao', texto: o })),
        ...(podeCadastrar ? [{ tipo: 'cadastrar', texto } as Linha] : []),
      ]
    : [];

  const medir = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCaixa({ left: r.left, top: r.bottom, width: r.width });
  }, []);

  useEffect(() => {
    if (!aberto) return;
    medir();
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
    inputRef.current?.focus();
  }

  function cadastrar(nome: string) {
    onCadastrar?.(nome);
    setCadastrado(nome);
    window.setTimeout(() => setCadastrado(null), 1600);
    fechar();
    inputRef.current?.focus();
  }

  function acionar(linha: Linha) {
    if (linha.tipo === 'opcao') escolher(linha.texto);
    else cadastrar(linha.texto);
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!aberto) {
        abrir();
        return;
      }
      if (linhas.length === 0) return;
      const passo = evento.key === 'ArrowDown' ? 1 : -1;
      setDestacado((atual) => {
        const proximo = atual + passo;
        if (proximo < 0) return linhas.length - 1;
        if (proximo >= linhas.length) return 0;
        return proximo;
      });
      return;
    }

    if (evento.key === 'Enter' && aberto && destacado >= 0 && linhas[destacado]) {
      evento.preventDefault();
      acionar(linhas[destacado]);
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

      {aberto && linhas.length > 0 && caixa && (
        <ul
          role="listbox"
          className="fixed z-50 max-h-56 overflow-y-auto rounded-md border border-[#d3c9b8] bg-white shadow-lg"
          style={{ left: caixa.left, top: caixa.top, width: Math.max(caixa.width, 200) }}
        >
          {linhas.map((linha, i) => (
            <li key={linha.tipo === 'cadastrar' ? `+${linha.texto}` : linha.texto}>
              <button
                type="button"
                role="option"
                aria-selected={i === destacado}
                className={`block w-full px-2 py-1.5 text-left text-sm ${
                  i === destacado
                    ? 'bg-[#a81e22] text-white'
                    : linha.tipo === 'cadastrar'
                      ? 'text-[#a81e22] hover:bg-[#fbecec]'
                      : 'hover:bg-gray-100'
                } ${linha.tipo === 'cadastrar' ? 'border-t border-gray-200' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setDestacado(i)}
                onClick={() => acionar(linha)}
              >
                {linha.tipo === 'cadastrar' ? (
                  <>+ Acrescentar “{linha.texto}” ao cadastro</>
                ) : (
                  linha.texto
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {cadastrado && (
        <span
          role="status"
          className="pointer-events-none fixed z-50 mt-0.5 rounded bg-[#2e7d32] px-2 py-0.5 text-xs text-white shadow"
          style={caixa ? { left: caixa.left, top: caixa.top } : undefined}
        >
          ✓ “{cadastrado}” adicionado ao cadastro
        </span>
      )}
    </>
  );
}
