import { useState } from "react";
import "./SimpleBarChart.css";

const ALTURA = 220;
const LARGURA = 640;
const MARGEM_INFERIOR = 28;

// Gráfico de barras simples (1 ou N séries) em SVG puro — sem lib externa.
// Segue a cartilha de dataviz do design system: barras finas com topo
// arredondado, grid recessivo, tooltip por barra, legenda só quando há mais
// de uma série, e uma tabela equivalente sempre visível logo abaixo (leitor
// de tela e daltonismo não dependem só da cor).
export function SimpleBarChart({ categorias, series, valueFormatter = (v) => v }) {
  const [ativo, setAtivo] = useState(null);

  const valorMaximo = Math.max(
    1,
    ...categorias.flatMap((cat) => series.map((s) => Number(cat.valores[s.key] ?? 0))),
  );
  const alturaUtil = ALTURA - MARGEM_INFERIOR;
  const larguraCategoria = LARGURA / categorias.length;
  const larguraBarra = Math.min(40, (larguraCategoria - 12) / series.length);

  return (
    <div className="simple-bar-chart">
      {series.length > 1 && (
        <div className="simple-bar-chart-legenda">
          {series.map((s) => (
            <span key={s.key} className="simple-bar-chart-legenda-item">
              <span className="simple-bar-chart-legenda-cor" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label="Gráfico de barras" style={{ width: "100%", height: "auto" }}>
        {[0.25, 0.5, 0.75, 1].map((fracao) => (
          <line
            key={fracao}
            x1={0}
            x2={LARGURA}
            y1={alturaUtil - alturaUtil * fracao}
            y2={alturaUtil - alturaUtil * fracao}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ))}

        {categorias.map((cat, catIndex) => {
          const inicioCategoria = catIndex * larguraCategoria;
          const larguraGrupo = larguraBarra * series.length;
          const inicioGrupo = inicioCategoria + (larguraCategoria - larguraGrupo) / 2;

          return (
            <g key={cat.label}>
              {series.map((s, sIndex) => {
                const valor = Number(cat.valores[s.key] ?? 0);
                const alturaBarra = valorMaximo === 0 ? 0 : (valor / valorMaximo) * alturaUtil;
                const x = inicioGrupo + sIndex * larguraBarra;
                const y = alturaUtil - alturaBarra;
                const chave = `${catIndex}-${s.key}`;
                return (
                  <rect
                    key={s.key}
                    x={x + 1}
                    y={y}
                    width={Math.max(0, larguraBarra - 2)}
                    height={Math.max(0, alturaBarra)}
                    rx={4}
                    fill={s.color}
                    opacity={ativo && ativo !== chave ? 0.45 : 1}
                    onMouseEnter={() => setAtivo(chave)}
                    onMouseLeave={() => setAtivo(null)}
                  >
                    <title>
                      {cat.label} — {s.label}: {valueFormatter(valor)}
                    </title>
                  </rect>
                );
              })}
              <text
                x={inicioCategoria + larguraCategoria / 2}
                y={ALTURA - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-text-muted)"
              >
                {cat.label}
              </text>
            </g>
          );
        })}
      </svg>

      <table className="simple-bar-chart-tabela">
        <thead>
          <tr>
            <th>Período</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.label}>
              <td>{cat.label}</td>
              {series.map((s) => (
                <td key={s.key}>{valueFormatter(cat.valores[s.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
