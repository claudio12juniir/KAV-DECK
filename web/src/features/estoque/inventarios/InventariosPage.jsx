import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HistoricoModal, UltimaEdicaoCelula, useUltimasEdicoes } from "../../../components/audit/Historico.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { logsApi } from "../../cadastros/logs/api.js";
import { listInventarios } from "./api.js";

const ENTIDADE = "inventario-fisico";

function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

export function InventariosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [inventarios, setInventarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [verLogsDe, setVerLogsDe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

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

  const ids = useMemo(() => inventarios.map((r) => r.id), [inventarios]);
  const { mapa: ultimasEdicoes, carregando: carregandoUltimas } = useUltimasEdicoes(ENTIDADE, ids);

  async function abrirLogs(id) {
    setVerLogsDe(id);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list(ENTIDADE, id);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  const columns = [
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
    { key: "itens", label: "Itens", render: (row) => row._count?.itens ?? "—" },
    {
      key: "_ultimaEdicao",
      label: "Última edição",
      render: (row) => (
        <UltimaEdicaoCelula
          info={ultimasEdicoes[row.id]}
          carregando={carregandoUltimas && ultimasEdicoes[row.id] === undefined}
          onClick={(e) => {
            e.stopPropagation();
            abrirLogs(row.id);
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="crud-header">
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Inventário Físico</h1>
          <p>Histórico de contagens — cada uma ajusta o estoque por lote automaticamente ao ser finalizada.</p>
        </div>
        <Link to="/estoque/inventarios/novo">
          <Button>+ Novo</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={inventarios}
        loading={carregando}
        onRowClick={(row) => navigate(`/estoque/inventarios/${row.id}`)}
        emptyMessage="Nenhum inventário encontrado."
      />

      <HistoricoModal
        open={Boolean(verLogsDe)}
        onClose={() => setVerLogsDe(null)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={{ status: "Status", ajustesAplicados: "Ajustes aplicados" }}
      />
    </div>
  );
}
