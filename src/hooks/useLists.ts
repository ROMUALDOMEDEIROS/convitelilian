import { useCallback, useEffect, useState } from 'react';
import {
  ListImportError,
  carregarListas,
  importarLista,
  limpar,
  listasIniciais,
  salvarListas,
  type ListDef,
  type ListKey,
  type Listas,
} from '../lib/lists';

export interface ListsActions {
  adicionar: (key: ListKey, valor: string) => string | null;
  alterar: (key: ListKey, indice: number, valor: string) => void;
  ordenar: (key: ListKey) => void;
  remover: (key: ListKey, indice: number) => void;
  importar: (def: ListDef, file: File) => Promise<void>;
  restaurar: (key: ListKey) => void;
  limparTudo: (key: ListKey) => void;
}

export function useLists(): {
  listas: Listas;
  erro: string | null;
  aviso: string | null;
  actions: ListsActions;
} {
  const [listas, setListas] = useState<Listas>(() => carregarListas() ?? listasIniciais());
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    salvarListas(listas);
  }, [listas]);

  /** Devolve mensagem de recusa, ou null quando entrou. */
  const adicionar = useCallback((key: ListKey, valor: string): string | null => {
    const [item] = limpar([valor]);
    if (!item) return 'Digite um nome.';

    let mensagem: string | null = null;
    setListas((atual) => {
      const antes = atual[key];
      const depois = limpar([...antes, item]);
      if (depois.length === antes.length) {
        mensagem = `"${item}" já está na lista.`;
        return atual;
      }
      return { ...atual, [key]: depois };
    });
    return mensagem;
  }, []);

  /** Altera sem reordenar: reordenar durante a digitação faria o campo saltar
   *  de lugar debaixo do cursor. A ordem é refeita ao sair do campo. */
  const alterar = useCallback((key: ListKey, indice: number, valor: string) => {
    setListas((atual) => {
      const copia = [...atual[key]];
      copia[indice] = valor;
      return { ...atual, [key]: copia };
    });
  }, []);

  const ordenar = useCallback((key: ListKey) => {
    setListas((atual) => ({ ...atual, [key]: limpar(atual[key]) }));
  }, []);

  const remover = useCallback((key: ListKey, indice: number) => {
    setListas((atual) => ({ ...atual, [key]: atual[key].filter((_, i) => i !== indice) }));
  }, []);

  const importar = useCallback(async (def: ListDef, file: File) => {
    setErro(null);
    setAviso(null);
    try {
      const lido = await importarLista(file, def);
      setListas((atual) => ({ ...atual, [def.key]: lido.itens }));
      setAviso(
        `${lido.itens.length} nome(s) importado(s) para ${def.titulo}, ` +
          `da aba "${lido.aba}", coluna "${lido.coluna}".`,
      );
    } catch (error) {
      setErro(
        error instanceof ListImportError
          ? error.message
          : `Falha ao ler "${file.name}": ${(error as Error).message}`,
      );
    }
  }, []);

  const restaurar = useCallback((key: ListKey) => {
    setErro(null);
    setListas((atual) => ({ ...atual, [key]: listasIniciais()[key] }));
    setAviso('Lista restaurada com os nomes da planilha original.');
  }, []);

  const limparTudo = useCallback((key: ListKey) => {
    setListas((atual) => ({ ...atual, [key]: [] }));
    setAviso(null);
  }, []);

  return {
    listas,
    erro,
    aviso,
    actions: { adicionar, alterar, ordenar, remover, importar, restaurar, limparTudo },
  };
}
