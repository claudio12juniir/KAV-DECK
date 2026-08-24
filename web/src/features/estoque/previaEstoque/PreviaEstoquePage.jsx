import { useEffect, useState } from "react";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { consultarPreviaEstoque } from "./api.js";

export function PreviaEstoquePage() {
  const toast = useToast();
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    consultarPreviaEstoque()
      .then(({ items }) => {
        if (ativo) setLinhas(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar a prévia de estoque.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useRealtimeInvalidate("/estoque/previa", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "produto", label: "Produto", render: (row) => `${row.descricao} (${row.codigo})` },
    { key: "unidade", label: "UM", render: (row) => row.unidadeMedida?.sigla ?? "—" },
    { key: "fatorConversao", label: "Fator de conversão", render: (row) => row.unidadeMedida?.fatorConversao ?? "—" },
    { key: "saldoAtual", label: "Saldo atual" },
    { key: "aReceber", label: "A receber (compras)" },
    { key: "aEntregar", label: "A entregar (vendas)" },
    { key: "saldoPrevisto", label: "Saldo previsto" },
  ];

  return (
    <div>
      <h1>Prévia de estoque</h1>
      <p>Saldo projetado: o que já está fisicamente em estoque, mais o que ainda vai entrar por compras em aberto, menos o que ainda vai sair por vendas em aberto.</p>

      <DataTable columns={columns} rows={linhas} loading={carregando} emptyMessage="Nenhum produto com movimentação pendente." />
    </div>
  );
}
