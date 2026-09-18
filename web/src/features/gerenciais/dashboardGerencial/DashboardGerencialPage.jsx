import { useEffect, useState } from "react";
import { Card } from "../../../components/ui/Card.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { SimpleBarChart } from "../../../components/charts/SimpleBarChart.jsx";
import { dashboardGerencialApi } from "./api.js";
import "../relatorios/RelatoriosPage.css";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function anoAtual() {
  return new Date().getFullYear();
}

function ultimosAnos(quantidade) {
  const atual = anoAtual();
  return Array.from({ length: quantidade }, (_, i) => atual - quantidade + 1 + i);
}

function Faturamento() {
  const toast = useToast();
  const [ano, setAno] = useState(anoAtual());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    dashboardGerencialApi
      .faturamento(ano)
      .then(setDados)
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar o faturamento."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano]);

  const categorias = (dados?.meses ?? MESES.map((label, i) => ({ mes: i + 1, valor: 0 }))).map((item, i) => ({
    label: MESES[i],
    valores: { faturamento: Number(item.valor) },
  }));

  return (
    <Card>
      <div className="relatorio-cabecalho-aba">
        <div>
          <h3>Faturamento mensal</h3>
          <p className="relatorio-periodo-print">Ano: {ano}</p>
        </div>
        <Select value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ maxWidth: "140px" }}>
          {ultimosAnos(6).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      {dados && (
        <p style={{ margin: "0 0 16px" }}>
          Total faturado no ano: <strong>{formatarMoeda(dados.total)}</strong>
        </p>
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <SimpleBarChart
          categorias={categorias}
          series={[{ key: "faturamento", label: "Faturamento", color: "var(--color-accent-hover)" }]}
          valueFormatter={formatarMoeda}
        />
      )}
    </Card>
  );
}

function TitulosAnual() {
  const toast = useToast();
  const [anos] = useState(ultimosAnos(4));
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    dashboardGerencialApi
      .titulosAnual(anos)
      .then(({ items }) => setDados(items))
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar os títulos por ano."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorias = dados.map((item) => ({
    label: String(item.ano),
    valores: { pagar: Number(item.totalPagar), receber: Number(item.totalReceber) },
  }));

  return (
    <Card>
      <div className="relatorio-cabecalho-aba">
        <div>
          <h3>Total de títulos a pagar e receber por ano</h3>
          <p className="relatorio-periodo-print">Comparativo dos últimos {anos.length} anos, por vencimento</p>
        </div>
      </div>

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <SimpleBarChart
          categorias={categorias}
          series={[
            { key: "pagar", label: "A pagar", color: "var(--color-warning)" },
            { key: "receber", label: "A receber", color: "var(--color-success)" },
          ]}
          valueFormatter={formatarMoeda}
        />
      )}
    </Card>
  );
}

export function DashboardGerencialPage() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1>Dashboards Gerenciais</h1>
        <p>Visão de faturamento e comparativo anual de títulos financeiros.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Faturamento />
        <TitulosAnual />
      </div>
    </div>
  );
}
