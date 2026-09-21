import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HistoricoModal } from "../../../components/audit/Historico.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { logsApi } from "../../cadastros/logs/api.js";
import { fecharInventario, getInventario } from "./api.js";

const ENTIDADE = "inventario-fisico";

export function InventarioDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [inventario, setInventario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [confirmarFechamento, setConfirmarFechamento] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [auditoriaAberta, setAuditoriaAberta] = useState(false);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await getInventario(id);
      setInventario(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar este inventário.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtimeInvalidate("/estoque/inventarios", carregar);

  async function abrirAuditoria() {
    setAuditoriaAberta(true);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list(ENTIDADE, id);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar a auditoria.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  async function handleFechar() {
    setFechando(true);
    try {
      const resultado = await fecharInventario(id);
      toast.success(`Inventário fechado. ${resultado.ajustesAplicados} ajuste(s) aplicado(s).`);
      setConfirmarFechamento(false);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível fechar o inventário.");
    } finally {
      setFechando(false);
    }
  }

  if (carregando) {
    return (
      <Card>
        <SkeletonLines count={6} />
      </Card>
    );
  }

  if (erroCarregar) {
    return (
      <Card>
        <p style={{ color: "var(--color-danger)", margin: 0 }}>{erroCarregar}</p>
      </Card>
    );
  }

  const columns = [
    { key: "und", label: "Und.", render: (row) => row.produto.unidadeMedida?.sigla ?? "—" },
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "saldoEst", label: "Saldo est.", render: (row) => row.quantidadeSistema },
    { key: "qtdInv", label: "Qtd. inv.", render: (row) => row.quantidadeContada },
    {
      key: "diferenca",
      label: "Diferença",
      render: (row) => {
        const diferenca = Number(row.quantidadeContada) - Number(row.quantidadeSistema);
        return (
          <span style={{ color: diferenca === 0 ? "inherit" : diferenca > 0 ? "var(--color-success)" : "var(--color-danger)" }}>
            {diferenca > 0 ? "+" : ""}
            {diferenca}
          </span>
        );
      },
    },
    {
      key: "ajuste",
      label: "Ajuste",
      render: (row) => (Number(row.quantidadeContada) !== Number(row.quantidadeSistema) ? "Pendente" : "—"),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Inventário Físico</h1>
          <p>{new Date(inventario.data).toLocaleString("pt-BR")}</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link to="/estoque/inventarios/novo">
            <Button variant="secondary">+ Novo</Button>
          </Link>
          <Button variant="ghost" onClick={() => setConfirmarFechamento(true)}>
            Finalizar
          </Button>
          <Button variant="ghost" onClick={abrirAuditoria}>
            Auditoria
          </Button>
          <Link to="/estoque/inventarios">
            <Button variant="ghost">Histórico</Button>
          </Link>
        </div>
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0 }}>Itens ({inventario.itens.length})</h3>
        <DataTable columns={columns} rows={inventario.itens} emptyMessage="Nenhum item neste inventário." />
      </Card>

      <Modal
        open={confirmarFechamento}
        onClose={() => setConfirmarFechamento(false)}
        title="Fechar este inventário?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarFechamento(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleFechar} loading={fechando}>
              Sim, fechar
            </Button>
          </>
        }
      >
        Isso gera ajustes reais de estoque para as diferenças entre a contagem e o sistema. Essa ação não pode ser
        desfeita.
      </Modal>

      <HistoricoModal
        open={auditoriaAberta}
        onClose={() => setAuditoriaAberta(false)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={{ status: "Status", ajustesAplicados: "Ajustes aplicados" }}
      />
    </div>
  );
}
