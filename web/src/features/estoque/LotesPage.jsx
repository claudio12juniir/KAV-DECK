import { useEffect, useState } from "react";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { listLotes } from "./api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

export function LotesPage() {
  const toast = useToast();
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    listLotes()
      .then(({ items }) => {
        if (ativo) setLotes(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os lotes.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useRealtimeInvalidate("/estoque/lotes", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "produto", label: "Produto", render: (row) => `${row.produto.descricao} (${row.produto.codigo})` },
    { key: "dataValidade", label: "Validade", render: (row) => formatarData(row.dataValidade) },
    { key: "quantidadeAtual", label: "Quantidade atual" },
    { key: "dataRecebimento", label: "Recebido em", render: (row) => formatarData(row.dataRecebimento) },
  ];

  return (
    <div>
      <h1>Estoque por lote</h1>
      <p>Consulta dos lotes ativos, ordenados por validade.</p>

      <DataTable columns={columns} rows={lotes} loading={carregando} emptyMessage="Nenhum lote encontrado." />
    </div>
  );
}
