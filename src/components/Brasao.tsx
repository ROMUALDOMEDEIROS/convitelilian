/**
 * Emblema estilizado nas cores do brasão da unidade: coroa imperial dourada
 * com cruz, livro aberto com cruz ornamentada, e coroa de louro verde em volta.
 *
 * É uma REPRESENTAÇÃO aproximada, não a arte oficial: a imagem enviada não
 * chegou como arquivo ao ambiente, então este desenho serve de marcador.
 * Para usar o brasão de verdade, ver o README, seção "Trocar o brasão".
 */

const R = 30;
const CX = 41;
const CY = 52;

/** Ponto sobre o círculo do louro, em coordenadas de tela (y para baixo). */
function ponto(grausDaVertical: number) {
  const a = ((grausDaVertical - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

/** Até onde o ramo sobe. Para abaixo de 180° para os louros não invadirem a
 *  coroa no topo — deixa o vão aberto, como no brasão. */
const TOPO = 132;

/** Folhas de um ramo, distribuídas ao longo do arco. `sinal` +1 = lado direito. */
function folhas(sinal: 1 | -1) {
  const angs = [16, 38, 60, 82, 104, 126];
  return angs.map((base) => {
    const g = 90 + sinal * base; // 90° = base do arco (embaixo)
    const p = ponto(g);
    const rot = sinal > 0 ? g - 90 : g + 90;
    return { ...p, rot };
  });
}

export default function Brasao({ size = 56 }: { size?: number }) {
  const dir = folhas(1);
  const esq = folhas(-1);
  const topoDir = ponto(90 + TOPO);
  const topoEsq = ponto(90 - TOPO);

  return (
    <svg
      width={size}
      height={size * 1.16}
      viewBox="0 0 82 95"
      role="img"
      aria-label="Emblema da guarda"
      fill="none"
    >
      {/* coroa de louro: dois ramos */}
      <path
        d={`M41 82 A ${R} ${R} 0 0 0 ${topoEsq.x.toFixed(1)} ${topoEsq.y.toFixed(1)}`}
        stroke="var(--green-700)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={`M41 82 A ${R} ${R} 0 0 1 ${topoDir.x.toFixed(1)} ${topoDir.y.toFixed(1)}`}
        stroke="var(--green-700)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g fill="var(--green-700)">
        {[...esq, ...dir].map((f, i) => (
          <ellipse
            key={i}
            cx={f.x}
            cy={f.y}
            rx="4.2"
            ry="1.8"
            transform={`rotate(${f.rot.toFixed(1)} ${f.x.toFixed(2)} ${f.y.toFixed(2)})`}
          />
        ))}
      </g>
      {/* frutos vermelhos junto às pontas de cima */}
      <g fill="var(--red-600)">
        <circle cx={topoEsq.x} cy={topoEsq.y} r="1.7" />
        <circle cx={topoDir.x} cy={topoDir.y} r="1.7" />
        <circle cx={topoEsq.x + 2} cy={topoEsq.y + 3} r="1.4" />
        <circle cx={topoDir.x - 2} cy={topoDir.y + 3} r="1.4" />
      </g>
      {/* laço na base */}
      <path d="M37 82 L41 86 L45 82 L43 90 L41 88 L39 90 Z" fill="var(--gold)" />

      {/* coroa imperial */}
      {/* touca vermelha em cúpula */}
      <path d="M29 25 Q41 8 53 25 Z" fill="var(--red-700)" />
      {/* arcos dourados sobre a cúpula */}
      <path d="M29 25 Q41 9 53 25" stroke="var(--gold)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M35 25 Q41 15 47 25" stroke="var(--gold)" strokeWidth="1.6" fill="none" />
      {/* aro com pedras */}
      <rect x="27" y="24.5" width="28" height="6" rx="2.4" fill="var(--gold)" stroke="var(--red-800)" strokeWidth="0.5" />
      <circle cx="34" cy="27.5" r="1.6" fill="var(--red-600)" />
      <circle cx="41" cy="27.5" r="1.8" fill="var(--red-600)" />
      <circle cx="48" cy="27.5" r="1.6" fill="var(--red-600)" />
      {/* pérolas nas pontas do aro */}
      <circle cx="28.5" cy="24.5" r="1.5" fill="var(--gold-soft)" />
      <circle cx="53.5" cy="24.5" r="1.5" fill="var(--gold-soft)" />
      {/* cruz no alto */}
      <g fill="var(--gold)">
        <rect x="40" y="4" width="2" height="8" rx="0.6" />
        <rect x="37" y="6.5" width="8" height="2" rx="0.6" />
      </g>

      {/* campo vermelho arredondado atrás do livro */}
      <path
        d="M25 38 H57 V52 C57 63 50 68 41 71 C32 68 25 63 25 52 Z"
        fill="var(--red-700)"
        stroke="var(--gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* livro aberto */}
      <path d="M28 46 Q34.5 43.5 40 45.5 V60 Q34.5 58 28 60.5 Z" fill="#f6efe0" />
      <path d="M54 46 Q47.5 43.5 42 45.5 V60 Q47.5 58 54 60.5 Z" fill="#f6efe0" />
      <path d="M41 45 V60" stroke="var(--muted)" strokeWidth="1" />

      {/* cruz ornamentada sobre o livro */}
      <g fill="var(--red-800)">
        <path d="M40 36 h2 v6 h6 v2 h-6 v6 h-2 v-6 h-6 v-2 h6 z" />
        <circle cx="41" cy="35.5" r="1.3" />
        <circle cx="41" cy="50.5" r="1.3" />
        <circle cx="33.5" cy="43" r="1.3" />
        <circle cx="48.5" cy="43" r="1.3" />
      </g>
    </svg>
  );
}
