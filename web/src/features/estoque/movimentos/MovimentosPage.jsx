import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { listMovimentos } from "../api.js";
import { TipoMovimentoBadge } from "./TipoMovimentoBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// Kardex por produto: histórico bruto de movimentos (entrada, saída, ajuste)
// que já é escrito automaticamente por Compras/Vendas/Inventário — esta
// tela só consulta, não lança nada além do ajuste manual.
export function MovimentosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [produto, setProduto] = useState(null);
  const [movimentos, setMovimentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!produto) {
      setMovimentos([]);
      return undefined;
    }
    let ativo = true;
    setCarregando(true);
    listMovimentos({ produtoId: produto.id, pageSize: 100 })
      .then(({ items }) => {
        if (ativo) setMovimentos(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os movimentos.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto, refreshKey]);

  useRealtimeInvalidate("/estoque/movimentos", () => setRefreshKey((k) => k + 1));

  function handleLancarPedidoCompra() {
    navigate("/compras/novo", { state: { produto } });
  }

  const columns = [
    { key: "tipo", label: "Tipo", render: (row) => <TipoMovimentoBadge tipo={row.tipo} /> },
    { key: "quantidade", label: "Quantidade" },
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
    {
      key: "origem",
      label: "Origem",
      render: (row) => {
        if (row.pedidoCompraId) return `Pedido de compra`;
        if (row.pedidoVendaId) return `Pedido de venda`;
        if (row.inventarioFisicoId) return `Inventário físico`;
        return row.motivo || "—";
      },
    },
  ];

  return (
    <div>
      <h1>Movimentos de estoque</h1>
      <p>Busque um produto para ver o histórico de entradas, saídas e ajustes (kardex).</p>

      <Card style={{ marginBottom: "24px" }}>
        {produto ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <strong>{produto.descricao}</strong>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{produto.codigo}</div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button variant="secondary" onClick={handleLancarPedidoCompra}>
                Lançar pedido de compra
              </Button>
              <Button variant="ghost" onClick={() => setProduto(null)}>
                Trocar produto
              </Button>
            </div>
          </div>
        ) : (
          <ProdutoAutocomplete onSelecionar={setProduto} label="Buscar produto" />
        )}
      </Card>

      {produto && (
        <DataTable
          columns={columns}
          rows={movimentos}
          loading={carregando}
          emptyMessage="Nenhum movimento de estoque encontrado para este produto."
        />
      )}
    </div>
  );
}
