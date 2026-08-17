import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Select } from "../../components/ui/Select.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
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
  const [status, setStatus] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listPedidosCompra({ status: status || undefined })
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
  }, [status]);

  const columns = [
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor.participante.razaoSocial },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "dataEmissao", label: "Data", render: (row) => formatarData(row.dataEmissao) },
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
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="ABERTO">Aberto</option>
          <option value="APROVADO">Aprovado</option>
          <option value="RECEBIDO_PARCIAL">Recebido parcialmente</option>
          <option value="RECEBIDO">Recebido</option>
          <option value="CANCELADO">Cancelado</option>
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
