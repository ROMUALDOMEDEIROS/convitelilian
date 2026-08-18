import Brasao from './Brasao';

/**
 * Procura um brasão que o usuário tenha colocado em `src/assets/brasao.*`.
 * Havendo arquivo, o cabeçalho o usa automaticamente; senão, cai no emblema
 * desenhado. Assim, para pôr o brasão oficial, basta soltar o arquivo na pasta
 * — nenhuma edição de código. Ver `src/assets/LEIA-ME.txt`.
 */
const arquivosBrasao = import.meta.glob('../assets/brasao.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const brasaoUrl = Object.values(arquivosBrasao)[0];

/** Cabeçalho de identidade: brasão + título, faixa vermelha com fio dourado. */
export default function AppHeader() {
  return (
    <header className="mb-6">
      <div
        className="flex items-center gap-4 rounded-xl px-4 py-4 sm:px-6"
        style={{
          background: 'linear-gradient(180deg, var(--surface), var(--paper))',
          border: '1px solid var(--line)',
          borderTop: '4px solid var(--red-700)',
          boxShadow: '0 2px 10px rgba(33,29,26,.06)',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '6px' }}
        >
          {brasaoUrl ? (
            <img
              src={brasaoUrl}
              alt="Brasão da unidade"
              className="block h-[62px] w-auto object-contain"
            />
          ) : (
            <Brasao size={54} />
          )}
        </div>

        <div className="min-w-0">
          <h1
            className="text-lg font-bold leading-tight tracking-wide sm:text-2xl"
            style={{ color: 'var(--red-800)' }}
          >
            REGISTRO DA GUARDA
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Controle de entrada e saída de viaturas e de pais / responsáveis
          </p>
          <div
            className="mt-1.5 h-0.5 w-24 rounded"
            style={{ background: 'var(--gold)' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </header>
  );
}
