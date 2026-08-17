import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { SkeletonLines } from "../../components/ui/Skeleton.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { getPedidoVenda, updatePedidoVendaStatus } from "./api.js";
import { StatusBadge } from "./components/StatusBadge.jsx";

const TRANSICOES = {
  ABERTO: ["SEPARACAO", "CANCELADO"],
  SEPARACAO: ["CANCELADO"],
  FATURADO: [],
  CANCELADO: [],
};

const ROTULOS_TRANSICAO = {
  SEPARACAO: "Enviar para separação",
  CANCELADO: "Cancelar pedido",
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PedidoVendaDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [transicaoEmAndamento, setTransicaoEmAndamento] = useState(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErroCarregar("");
    try {
      const dados = await getPedidoVenda(id);
      setPedido(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar este pedido.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function aplicarTransicao(novoStatus) {
    setTransicaoEmAndamento(novoStatus);
    try {
      await updatePedidoVendaStatus(id, novoStatus);
      toast.success("Status atualizado com sucesso.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o status.");
    } finally {
      setTransicaoEmAndamento(null);
      setConfirmarCancelamento(false);
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

  if (!pedido) return null;

  const transicoesDisponiveis = TRANSICOES[pedido.status] ?? [];
  const podeFaturar = pedido.status === "SEPARACAO";

  const columns = [
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "quantidade", label: "Qtd." },
    { key: "precoUnitario", label: "Preço unit.", render: (row) => formatarMoeda(row.precoUnitario) },
    { key: "desconto", label: "Desconto", render: (row) => formatarMoeda(row.desconto) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div>
          <h1>{pedido.cliente.participante.razaoSocial}</h1>
          <p>{pedido.cliente.participante.cpfCnpj}</p>
        </div>
        <StatusBadge status={pedido.status} />
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Itens</h3>
        <DataTable columns={columns} rows={pedido.itens} emptyMessage="Pedido sem itens." />
      </Card>

      {(podeFaturar || transicoesDisponiveis.length > 0) && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {podeFaturar && (
            <Link to={`/vendas/${id}/faturar`}>
              <Button>Faturar pedido</Button>
            </Link>
          )}
          {transicoesDisponiveis.map((status) =>
            status === "CANCELADO" ? (
              <Button
                key={status}
                variant="danger"
                onClick={() => setConfirmarCancelamento(true)}
                loading={transicaoEmAndamento === status}
                disabled={Boolean(transicaoEmAndamento)}
              >
                {ROTULOS_TRANSICAO[status]}
              </Button>
            ) : (
              <Button
                key={status}
                variant="secondary"
                onClick={() => aplicarTransicao(status)}
                loading={transicaoEmAndamento === status}
                disabled={Boolean(transicaoEmAndamento)}
              >
                {ROTULOS_TRANSICAO[status] ?? status}
              </Button>
            ),
          )}
        </div>
      )}

      <Modal
        open={confirmarCancelamento}
        onClose={() => setConfirmarCancelamento(false)}
        title="Cancelar este pedido?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarCancelamento(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={() => aplicarTransicao("CANCELADO")} loading={transicaoEmAndamento === "CANCELADO"}>
              Sim, cancelar
            </Button>
          </>
        }
      >
        Essa ação não pode ser desfeita. O pedido ficará marcado como cancelado.
      </Modal>
    </div>
  );
}
