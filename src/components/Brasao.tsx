/**
 * Emblema estilizado nas cores do brasão da unidade (coroa dourada, escudo
 * vermelho com livro aberto e cruz, ramos de louro verdes). É um MARCADOR, não
 * o brasão oficial: serve enquanto a imagem real não é colocada.
 *
 * Para usar o brasão de verdade: salve o arquivo como `src/assets/brasao.png`,
 * troque este componente por <img src={brasao} .../> (import do arquivo), e o
 * resto do layout continua igual. Ver README, seção "Trocar o brasão".
 */
export default function Brasao({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.14}
      viewBox="0 0 64 73"
      role="img"
      aria-label="Emblema da guarda"
      fill="none"
    >
      {/* ramos de louro */}
      <path
        d="M9 30 C4 40 8 54 20 62"
        stroke="var(--green-700)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M55 30 C60 40 56 54 44 62"
        stroke="var(--green-700)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g fill="var(--green-700)">
        <ellipse cx="7" cy="35" rx="3" ry="1.6" transform="rotate(-35 7 35)" />
        <ellipse cx="7" cy="43" rx="3" ry="1.6" transform="rotate(-20 7 43)" />
        <ellipse cx="9" cy="51" rx="3" ry="1.6" transform="rotate(-5 9 51)" />
        <ellipse cx="57" cy="35" rx="3" ry="1.6" transform="rotate(35 57 35)" />
        <ellipse cx="57" cy="43" rx="3" ry="1.6" transform="rotate(20 57 43)" />
        <ellipse cx="55" cy="51" rx="3" ry="1.6" transform="rotate(5 55 51)" />
      </g>

      {/* coroa */}
      <path
        d="M20 18 L23 10 L28 15 L32 7 L36 15 L41 10 L44 18 Z"
        fill="var(--gold)"
        stroke="var(--red-800)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="20" y="18" width="24" height="4.5" rx="1.4" fill="var(--gold)" />
      <circle cx="23" cy="10" r="1.6" fill="var(--red-700)" />
      <circle cx="32" cy="6.5" r="1.8" fill="var(--red-700)" />
      <circle cx="41" cy="10" r="1.6" fill="var(--red-700)" />

      {/* escudo */}
      <path
        d="M16 25 H48 V45 C48 58 40 64 32 68 C24 64 16 58 16 45 Z"
        fill="var(--red-700)"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* livro aberto */}
      <path d="M22 40 L31.2 38.5 V50 L22 51.5 Z" fill="#f5efe0" />
      <path d="M42 40 L32.8 38.5 V50 L42 51.5 Z" fill="#f5efe0" />
      <path d="M32 39 V50" stroke="var(--muted)" strokeWidth="1" />

      {/* cruz */}
      <g fill="var(--red-800)">
        <rect x="31" y="30.5" width="2" height="9" rx="0.6" />
        <rect x="28.5" y="33" width="7" height="2" rx="0.6" />
      </g>
    </svg>
  );
}
