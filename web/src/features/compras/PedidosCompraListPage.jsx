import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Select } from "../../components/ui/Select.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { listPedidosCompra } from "./api.js";
import { StatusBadge } from "./components/StatusBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function PedidosCompraListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listPedidosCompra({ filtro: filtro || undefined })
      .then(({ items }) => {
        if (ativo) setPedidos(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os pedidos.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, refreshKey]);

  useRealtimeInvalidate("/compras/pedidos", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor.participante.razaoSocial },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "dataEmissao", label: "Data", render: (row) => formatarData(row.dataEmissao) },
    { key: "arquivado", label: "Arquivado", render: (row) => (row.arquivado ? "Sim" : "—") },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1>Pedidos de compra</h1>
          <p>Acompanhe e crie novos pedidos a fornecedores.</p>
        </div>
        <Link to="/compras/novo">
          <Button>Novo pedido</Button>
        </Link>
      </div>

      <div style={{ maxWidth: "260px", marginBottom: "24px" }}>
        <Select label="Filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos</option>
          <option value="EM_ABERTO">Em aberto</option>
          <option value="LIQUIDADO">Liquidado</option>
          <option value="CANCELADO">Cancelado</option>
          <option value="ARQUIVADO">Arquivado</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={pedidos}
        loading={carregando}
        onRowClick={(row) => navigate(`/compras/${row.id}`)}
        emptyMessage="Nenhum pedido de compra encontrado."
      />
    </div>
  );
}
