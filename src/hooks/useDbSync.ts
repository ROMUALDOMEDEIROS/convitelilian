import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, saveSnapshot, type SaveOrigin } from '../lib/api';
import { todayISO } from '../lib/header';
import { hasContent } from '../lib/storage';
import type { HeaderValues, Row, TableDef } from '../schema';

/** Intervalo do checkpoint automático. 20 minutos por padrão; VITE_AUTOSAVE_MS
 *  permite encurtar em desenvolvimento e testes. */
export const AUTO_INTERVAL_MS = Number(
  (import.meta.env.VITE_AUTOSAVE_MS as string | undefined) ?? 20 * 60 * 1000,
);

/** De quanto em quanto tempo uma gravação que falhou é tentada de novo. */
const RETRY_MS = Math.min(60_000, AUTO_INTERVAL_MS);

export type SyncState = 'nunca' | 'salvando' | 'salvo' | 'pendente' | 'erro';

export interface SyncStatus {
  estado: SyncState;
  /** ISO da última gravação bem-sucedida no banco */
  ultimoSalvo: string | null;
  mensagem: string | null;
  /** true quando há mudança local ainda não confirmada pelo servidor */
  pendente: boolean;
  /** segundos até o próximo checkpoint automático */
  proximoEm: number;
}

interface Snapshot {
  dia: string;
  header: HeaderValues;
  rows: Row[];
}

/**
 * Sincroniza o snapshot do dia com o banco da unidade.
 *
 * Não existe fila de várias requisições: cada gravação envia o dia inteiro e o
 * servidor faz upsert, então basta reenviar sempre o snapshot MAIS RECENTE até
 * um envio dar certo. Isso elimina ordenação de fila e risco de duplicar
 * linhas, que é o que uma fila item-a-item traria aqui.
 */
export function useDbSync(table: TableDef, header: HeaderValues, rows: Row[]) {
  const [status, setStatus] = useState<SyncStatus>({
    estado: 'nunca',
    ultimoSalvo: null,
    mensagem: null,
    pendente: false,
    proximoEm: Math.round(AUTO_INTERVAL_MS / 1000),
  });

  /** Snapshot corrente, em ref para o timer não capturar valor velho. */
  const snapshotRef = useRef<Snapshot>({ dia: todayISO(), header, rows });
  /** Assinatura do que já está confirmado no servidor. */
  const savedSignatureRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const deadlineRef = useRef(Date.now() + AUTO_INTERVAL_MS);

  const dia = (header.data ?? '') !== '' ? header.data : todayISO();
  const signature = JSON.stringify({ dia, header, rows });
  const vazio = !hasContent(table, header, rows);

  // Depende só da ASSINATURA (string estável por valor), nunca dos objetos
  // header/rows: eles têm identidade nova a cada render, e incluí-los aqui
  // fazia o efeito rodar sempre, com o setStatus provocando novo render em
  // laço infinito. O retorno do mesmo objeto quando nada muda garante que o
  // React aborte o re-render mesmo se o efeito for reexecutado.
  useEffect(() => {
    snapshotRef.current = { dia, header, rows };
    const pendente = !vazio && savedSignatureRef.current !== signature;
    setStatus((current) => (current.pendente === pendente ? current : { ...current, pendente }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature resume dia+header+rows
  }, [signature]);

  const executar = useCallback(
    async (origem: SaveOrigin): Promise<boolean> => {
      if (inFlightRef.current) return false;

      const snapshot = snapshotRef.current;
      const assinatura = JSON.stringify(snapshot);

      if (!hasContent(table, snapshot.header, snapshot.rows)) {
        setStatus((current) => ({ ...current, pendente: false, mensagem: null }));
        return true;
      }
      if (savedSignatureRef.current === assinatura) {
        setStatus((current) => ({ ...current, pendente: false }));
        return true;
      }

      inFlightRef.current = true;
      setStatus((current) => ({ ...current, estado: 'salvando', mensagem: null }));

      try {
        const result = await saveSnapshot(
          table,
          snapshot.dia,
          snapshot.header,
          snapshot.rows,
          origem,
        );
        savedSignatureRef.current = assinatura;
        // se algo mudou durante o envio, continua pendente para o próximo ciclo
        const aindaPendente = JSON.stringify(snapshotRef.current) !== assinatura;
        setStatus({
          estado: aindaPendente ? 'pendente' : 'salvo',
          ultimoSalvo: result.savedAt,
          mensagem: `${result.rowCount} linha(s) gravada(s) no dia ${snapshot.dia} (versão ${result.versao})`,
          pendente: aindaPendente,
          proximoEm: Math.round(AUTO_INTERVAL_MS / 1000),
        });
        return true;
      } catch (error) {
        const apiError = error instanceof ApiError ? error : null;
        const transitorio = apiError?.retryable ?? true;
        setStatus((current) => ({
          ...current,
          estado: transitorio ? 'pendente' : 'erro',
          pendente: true,
          mensagem: transitorio
            ? `${apiError?.message ?? 'falha ao gravar'} — os dados estão salvos neste navegador e o envio será repetido`
            : `${apiError?.message ?? 'falha ao gravar'} — corrija e salve novamente`,
        }));
        return false;
      } finally {
        inFlightRef.current = false;
      }
    },
    [table],
  );

  /** Botão "Salvar no banco": mesmo caminho do automático. */
  const salvarAgora = useCallback(async () => {
    deadlineRef.current = Date.now() + AUTO_INTERVAL_MS;
    await executar('manual');
  }, [executar]);

  // Checkpoint automático + contagem regressiva na tela.
  useEffect(() => {
    const tick = setInterval(() => {
      const restante = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setStatus((current) =>
        current.proximoEm === restante ? current : { ...current, proximoEm: restante },
      );
      if (Date.now() >= deadlineRef.current) {
        deadlineRef.current = Date.now() + AUTO_INTERVAL_MS;
        void executar('automatico');
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [executar]);

  // Reenvio do que ficou pendente, e tentativa imediata quando a rede volta.
  useEffect(() => {
    const retry = setInterval(() => {
      if (!inFlightRef.current && savedSignatureRef.current !== JSON.stringify(snapshotRef.current)) {
        void executar('automatico');
      }
    }, RETRY_MS);

    const aoVoltarRede = () => void executar('automatico');
    window.addEventListener('online', aoVoltarRede);

    return () => {
      clearInterval(retry);
      window.removeEventListener('online', aoVoltarRede);
    };
  }, [executar]);

  return { status, salvarAgora, intervaloMs: AUTO_INTERVAL_MS };
}
