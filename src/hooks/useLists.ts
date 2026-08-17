import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, fetchListas, putListas, type ConflitoListas } from '../lib/api';
import { DEMO } from '../lib/demo';
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

/** Espera após a última edição antes de gravar no banco: agrupa uma rajada de
 *  cliques numa gravação só. */
const DEBOUNCE_MS = 1500;
const RETRY_MS = 15_000;

export type SyncListas = 'local' | 'carregando' | 'salvando' | 'salvo' | 'pendente' | 'erro';

export interface ListsActions {
  adicionar: (key: ListKey, valor: string) => string | null;
  alterar: (key: ListKey, indice: number, valor: string) => void;
  ordenar: (key: ListKey) => void;
  remover: (key: ListKey, indice: number) => void;
  importar: (def: ListDef, file: File) => Promise<void>;
  restaurar: (key: ListKey) => void;
  limparTudo: (key: ListKey) => void;
}

/** União de duas listas, sem duplicar (comparação sem acento). Ao reconciliar
 *  um conflito ninguém perde o que cadastrou — cadastros só crescem. */
function unir(a: string[], b: string[]): string[] {
  return limpar([...a, ...b]);
}

export function useLists(): {
  listas: Listas;
  erro: string | null;
  aviso: string | null;
  sync: SyncListas;
  actions: ListsActions;
} {
  const [listas, setListas] = useState<Listas>(() => carregarListas() ?? listasIniciais());
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncListas>(DEMO ? 'local' : 'carregando');

  /** Versão em que a cópia local se baseia. -1 = ainda não sincronizou. */
  const versaoRef = useRef<number>(-1);
  const listasRef = useRef<Listas>(listas);
  listasRef.current = listas;
  const enviandoRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Espelho local imediato, como antes: o banco é uma camada acima disso.
  useEffect(() => {
    salvarListas(listas);
  }, [listas]);

  const gravar = useCallback(async () => {
    if (DEMO || enviandoRef.current || versaoRef.current < 0) return;

    const alvo = listasRef.current;
    enviandoRef.current = true;
    setSync('salvando');
    try {
      const r = await putListas(alvo, versaoRef.current);
      versaoRef.current = r.versao;

      if ((r as ConflitoListas).conflito) {
        // outra máquina gravou antes: funde o que veio com o que temos e
        // regrava, para as duas pontas convergirem sem perder nada
        const fundido: Listas = {
          vtr: unir(alvo.vtr, r.listas.vtr),
          condutor: unir(alvo.condutor, r.listas.condutor),
        };
        setListas(fundido);
        listasRef.current = fundido;
        setAviso('O cadastro havia mudado em outra máquina; as duas versões foram unidas.');
        enviandoRef.current = false;
        void gravar();
        return;
      }

      // algo mudou durante o envio? continua pendente
      const aindaPendente = JSON.stringify(listasRef.current) !== JSON.stringify(alvo);
      setSync(aindaPendente ? 'pendente' : 'salvo');
    } catch (error) {
      const api = error instanceof ApiError ? error : null;
      setSync(api && !api.retryable ? 'erro' : 'pendente');
    } finally {
      enviandoRef.current = false;
    }
  }, []);

  /** Agenda uma gravação após a rajada de edições. */
  const agendar = useCallback(() => {
    if (DEMO) return;
    setSync('pendente');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void gravar(), DEBOUNCE_MS);
  }, [gravar]);

  // Ao abrir: puxa o cadastro do banco. Vazio no banco (versão 0) e havendo
  // cadastro local, sobe o local — a primeira máquina semeia o servidor.
  useEffect(() => {
    if (DEMO) return;
    let vivo = true;
    (async () => {
      const remoto = await fetchListas();
      if (!vivo) return;

      if (!remoto) {
        setSync('erro');
        return;
      }

      const localTem = listasRef.current.vtr.length + listasRef.current.condutor.length > 0;
      if (remoto.versao === 0 && localTem) {
        versaoRef.current = 0;
        agendar();
        return;
      }

      versaoRef.current = remoto.versao;
      setListas(remoto.listas);
      setSync('salvo');
    })();
    return () => {
      vivo = false;
    };
  }, [agendar]);

  // Reenvio periódico do que ficou pendente e ao voltar a rede.
  useEffect(() => {
    if (DEMO) return;
    const t = setInterval(() => {
      if (!enviandoRef.current && versaoRef.current >= 0) {
        setSync((atual) => {
          if (atual === 'pendente' || atual === 'erro') void gravar();
          return atual;
        });
      }
    }, RETRY_MS);
    const online = () => void gravar();
    window.addEventListener('online', online);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', online);
    };
  }, [gravar]);

  const adicionar = useCallback(
    (key: ListKey, valor: string): string | null => {
      const [item] = limpar([valor]);
      if (!item) return 'Digite um nome.';

      let mensagem: string | null = null;
      setListas((atual) => {
        const depois = limpar([...atual[key], item]);
        if (depois.length === atual[key].length) {
          mensagem = `"${item}" já está na lista.`;
          return atual;
        }
        return { ...atual, [key]: depois };
      });
      if (!mensagem) agendar();
      return mensagem;
    },
    [agendar],
  );

  const alterar = useCallback((key: ListKey, indice: number, valor: string) => {
    setListas((atual) => {
      const copia = [...atual[key]];
      copia[indice] = valor;
      return { ...atual, [key]: copia };
    });
  }, []);

  const ordenar = useCallback(
    (key: ListKey) => {
      setListas((atual) => ({ ...atual, [key]: limpar(atual[key]) }));
      agendar();
    },
    [agendar],
  );

  const remover = useCallback(
    (key: ListKey, indice: number) => {
      setListas((atual) => ({ ...atual, [key]: atual[key].filter((_, i) => i !== indice) }));
      agendar();
    },
    [agendar],
  );

  const importar = useCallback(
    async (def: ListDef, file: File) => {
      setErro(null);
      setAviso(null);
      try {
        const lido = await importarLista(file, def);
        setListas((atual) => ({ ...atual, [def.key]: lido.itens }));
        setAviso(
          `${lido.itens.length} nome(s) importado(s) para ${def.titulo}, ` +
            `da aba "${lido.aba}", coluna "${lido.coluna}".`,
        );
        agendar();
      } catch (error) {
        setErro(
          error instanceof ListImportError
            ? error.message
            : `Falha ao ler "${file.name}": ${(error as Error).message}`,
        );
      }
    },
    [agendar],
  );

  const restaurar = useCallback(
    (key: ListKey) => {
      setErro(null);
      setListas((atual) => ({ ...atual, [key]: listasIniciais()[key] }));
      setAviso('Lista restaurada com os nomes da planilha original.');
      agendar();
    },
    [agendar],
  );

  const limparTudo = useCallback(
    (key: ListKey) => {
      setListas((atual) => ({ ...atual, [key]: [] }));
      setAviso(null);
      agendar();
    },
    [agendar],
  );

  return {
    listas,
    erro,
    aviso,
    sync,
    actions: { adicionar, alterar, ordenar, remover, importar, restaurar, limparTudo },
  };
}
