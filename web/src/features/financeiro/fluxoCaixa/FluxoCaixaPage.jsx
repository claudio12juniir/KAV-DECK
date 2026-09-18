import { useEffect, useState } from "react";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { projetarFluxoCaixa } from "./api.js";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarDataBr(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function daquiA30DiasIso() {
  const data = new Date();
  data.setDate(data.getDate() + 30);
  return data.toISOString().slice(0, 10);
}

const columns = [
  { key: "data", label: "Vencimento", render: (row) => formatarDataBr(row.data) },
  { key: "entradas", label: "Entradas", render: (row) => formatarMoeda(row.entradas) },
  { key: "saidas", label: "Saídas", render: (row) => formatarMoeda(row.saidas) },
  { key: "saldoDia", label: "Saldo do dia", render: (row) => formatarMoeda(row.saldoDia) },
  { key: "saldoAcumulado", label: "Saldo acumulado", render: (row) => formatarMoeda(row.saldoAcumulado) },
];

export function FluxoCaixaPage() {
  const toast = useToast();
  const [dataInicial, setDataInicial] = useState(hojeIso());
  const [dataFinal, setDataFinal] = useState(daquiA30DiasIso());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const resultado = await projetarFluxoCaixa({ dataInicial, dataFinal });
      setDados(resultado);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o fluxo de caixa.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicial, dataFinal]);

  return (
    <div>
      <h1>Fluxo de Caixa</h1>
      <p>Projeção de entradas e saídas com base nos títulos ainda em aberto, por dia de vencimento.</p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", margin: "20px 0" }}>
        <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
      </div>

      {dados && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
          <Card style={{ flex: "1 1 200px", padding: "16px" }}>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Entradas no período</p>
            <h2 style={{ margin: 0 }}>{formatarMoeda(dados.totais.entradas)}</h2>
          </Card>
          <Card style={{ flex: "1 1 200px", padding: "16px" }}>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Saídas no período</p>
            <h2 style={{ margin: 0 }}>{formatarMoeda(dados.totais.saidas)}</h2>
          </Card>
          <Card style={{ flex: "1 1 200px", padding: "16px" }}>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Saldo do período</p>
            <h2 style={{ margin: 0 }}>{formatarMoeda(dados.totais.saldo)}</h2>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={dados?.dias ?? []}
        loading={carregando}
        emptyMessage="Nenhum título em aberto vencendo no período selecionado."
      />
    </div>
  );
}
