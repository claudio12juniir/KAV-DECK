import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { SkeletonLines } from "../../components/ui/Skeleton.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { ProdutoAutocomplete } from "../shared/ProdutoAutocomplete.jsx";
import {
  addItemPedidoVenda,
  arquivarPedidoVenda,
  getPedidoVenda,
  removeItemPedidoVenda,
  updatePedidoVendaStatus,
} from "./api.js";
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
  const [produtoNovo, setProdutoNovo] = useState(null);
  const [quantidadeNova, setQuantidadeNova] = useState("1");
  const [precoNovo, setPrecoNovo] = useState("0");
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [removendoItemId, setRemovendoItemId] = useState(null);
  const [arquivando, setArquivando] = useState(false);

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

  useRealtimeInvalidate("/vendas/pedidos", carregar);

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
  const podeEditarItens = pedido.status === "ABERTO";

  async function handleAdicionarItem() {
    if (!produtoNovo) return;
    setAdicionandoItem(true);
    try {
      await addItemPedidoVenda(id, {
        produtoId: produtoNovo.id,
        quantidade: String(quantidadeNova || 0),
        precoUnitario: String(precoNovo || 0),
      });
      toast.success("Item adicionado ao pedido.");
      setProdutoNovo(null);
      setQuantidadeNova("1");
      setPrecoNovo("0");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível adicionar o item.");
    } finally {
      setAdicionandoItem(false);
    }
  }

  async function handleAlternarArquivamento() {
    setArquivando(true);
    try {
      await arquivarPedidoVenda(id, !pedido.arquivado);
      toast.success(pedido.arquivado ? "Pedido desarquivado." : "Pedido arquivado.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o arquivamento.");
    } finally {
      setArquivando(false);
    }
  }

  async function handleRemoverItem(itemId) {
    setRemovendoItemId(itemId);
    try {
      await removeItemPedidoVenda(id, itemId);
      toast.success("Item removido do pedido.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível remover o item.");
    } finally {
      setRemovendoItemId(null);
    }
  }

  const columns = [
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "quantidade", label: "Qtd." },
    { key: "precoUnitario", label: "Preço unit.", render: (row) => formatarMoeda(row.precoUnitario) },
    { key: "desconto", label: "Desconto", render: (row) => formatarMoeda(row.desconto) },
    ...(podeEditarItens
      ? [
          {
            key: "_acoes",
            label: "",
            render: (row) => (
              <Button
                variant="ghost"
                onClick={() => handleRemoverItem(row.id)}
                loading={removendoItemId === row.id}
                disabled={Boolean(removendoItemId)}
              >
                Remover
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div>
          <h1>{pedido.cliente.participante.razaoSocial}</h1>
          <p>{pedido.cliente.participante.cpfCnpj}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <StatusBadge status={pedido.status} />
          <Button variant="ghost" onClick={handleAlternarArquivamento} loading={arquivando}>
            {pedido.arquivado ? "Desarquivar" : "Arquivar"}
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Itens</h3>
        <DataTable columns={columns} rows={pedido.itens} emptyMessage="Pedido sem itens." />

        {podeEditarItens && (
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ marginTop: 0 }}>Adicionar item</h4>
            <ProdutoAutocomplete
              onSelecionar={(produto) => {
                setProdutoNovo(produto);
                setPrecoNovo(String(produto.precoReferencia ?? 0));
              }}
            />
            {produtoNovo && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginTop: "12px", flexWrap: "wrap" }}>
                <span>{produtoNovo.codigo} — {produtoNovo.descricao}</span>
                <Input
                  label="Quantidade"
                  type="number"
                  value={quantidadeNova}
                  onChange={(e) => setQuantidadeNova(e.target.value)}
                />
                <Input
                  label="Preço unit."
                  type="number"
                  value={precoNovo}
                  onChange={(e) => setPrecoNovo(e.target.value)}
                />
                <Button onClick={handleAdicionarItem} loading={adicionandoItem}>
                  Adicionar
                </Button>
              </div>
            )}
          </div>
        )}
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
