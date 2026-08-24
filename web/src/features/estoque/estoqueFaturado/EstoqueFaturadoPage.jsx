import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { consultarEstoqueFaturado } from "./api.js";

export function EstoqueFaturadoPage() {
  const toast = useToast();
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    consultarEstoqueFaturado()
      .then(({ items }) => {
        if (ativo) setLinhas(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar o estoque faturado.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useRealtimeInvalidate("/estoque/faturado", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "produto", label: "Produto", render: (row) => `${row.descricao} (${row.codigo})` },
    { key: "unidade", label: "UM", render: (row) => row.unidadeMedida?.sigla ?? "—" },
    { key: "fatorConversao", label: "Fator de conversão", render: (row) => row.unidadeMedida?.fatorConversao ?? "—" },
    { key: "saldo", label: "Saldo físico" },
    { key: "minimo", label: "Mínimo" },
    { key: "maximo", label: "Máximo" },
    { key: "previstoVenda", label: "Comprometido em vendas" },
    {
      key: "saldoPrevisto",
      label: "Saldo previsto",
      render: (row) => (
        <Badge tone={Number(row.saldoPrevisto) < Number(row.minimo) ? "danger" : "success"}>
          {row.saldoPrevisto}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <h1>Estoque faturado</h1>
      <p>Confronta o saldo físico com o mínimo/máximo cadastrado e com o que já está comprometido em pedidos de venda ainda não faturados.</p>

      <DataTable columns={columns} rows={linhas} loading={carregando} emptyMessage="Nenhum produto encontrado." />
    </div>
  );
}
