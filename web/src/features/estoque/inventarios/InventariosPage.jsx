import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { listInventarios } from "./api.js";

function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

export function InventariosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [inventarios, setInventarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    listInventarios()
      .then(({ items }) => {
        if (ativo) setInventarios(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os inventários.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useRealtimeInvalidate("/estoque/inventarios", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
  ];

  return (
    <div>
      <div className="crud-header">
        <div>
          <h1>Inventários físicos</h1>
          <p>Contagem de estoque por lote e ajuste automático das diferenças.</p>
        </div>
        <Link to="/estoque/inventarios/novo">
          <Button>Novo inventário</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={inventarios}
        loading={carregando}
        onRowClick={(row) => navigate(`/estoque/inventarios/${row.id}`)}
        emptyMessage="Nenhum inventário encontrado."
      />
    </div>
  );
}
