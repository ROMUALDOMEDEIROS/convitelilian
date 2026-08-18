import { DEMO } from '../lib/demo';
import type { SyncStatus } from '../hooks/useDbSync';

interface Props {
  status: SyncStatus;
  intervaloMs: number;
  onSalvar: () => void;
}

const CORES: Record<SyncStatus['estado'], string> = {
  nunca: 'text-gray-500',
  salvando: 'text-blue-700',
  salvo: 'text-green-700',
  pendente: 'text-amber-700',
  erro: 'text-red-700',
  demo: 'text-gray-600',
};

const ROTULOS: Record<SyncStatus['estado'], string> = {
  nunca: 'ainda não gravado no banco',
  salvando: 'gravando no banco...',
  salvo: 'gravado no banco',
  pendente: 'aguardando envio ao banco',
  erro: 'falha ao gravar',
  demo: 'banco de dados indisponível nesta versão de teste',
};

/** O rótulo do intervalo precisa aguentar valores abaixo de um minuto, já que
 *  VITE_AUTOSAVE_MS pode encurtá-lo em desenvolvimento. */
function intervalo(ms: number): string {
  return ms >= 60_000 ? `${Math.round(ms / 60000)} min` : `${Math.round(ms / 1000)} s`;
}

function relogio(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function SyncBar({ status, intervaloMs, onSalvar }: Props) {
  const { estado, ultimoSalvo, mensagem, pendente, proximoEm } = status;

  // Havendo edição não enviada, o rótulo não pode dizer "gravado no banco":
  // seria contraditório com o marcador de pendência ao lado.
  const efetivo = pendente && estado === 'salvo' ? 'pendente' : estado;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e4ddd1] bg-[#faf8f3] px-3 py-2 text-xs">
      <button
        type="button"
        className="rg-btn rg-btn-primary rg-btn-xs"
        onClick={onSalvar}
        disabled={DEMO || estado === 'salvando'}
        title={DEMO ? 'Disponível na versão instalada na unidade' : undefined}
      >
        Salvar no banco
      </button>

      <span className={`font-bold ${CORES[efetivo]}`} role="status">
        {pendente && estado !== 'salvando' ? '●' : '○'} {ROTULOS[efetivo]}
      </span>

      {ultimoSalvo && <span className="text-gray-600">último às {hora(ultimoSalvo)}</span>}

      {!DEMO && (
        <span className="text-gray-500">
          checkpoint automático a cada {intervalo(intervaloMs)} — próximo em {relogio(proximoEm)}
        </span>
      )}

      {mensagem && <span className={`w-full ${CORES[efetivo]}`}>{mensagem}</span>}
    </div>
  );
}
