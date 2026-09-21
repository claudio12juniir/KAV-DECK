import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HistoricoModal } from "../../components/audit/Historico.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Select } from "../../components/ui/Select.jsx";
import { SkeletonLines } from "../../components/ui/Skeleton.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { logsApi } from "../cadastros/logs/api.js";
import { ProdutoAutocomplete } from "../shared/ProdutoAutocomplete.jsx";
import {
  addItemPedidoCompra,
  aplicarFretePedidoCompra,
  arquivarPedidoCompra,
  createPedidoCompra,
  duplicarPedidoCompra,
  getPedidoCompra,
  importarItensPedidoCompra,
  listColaboradores,
  listFavoritosCompra,
  listPedidosCompra,
  listTransportadoras,
  removeItemPedidoCompra,
  updatePedidoCompraStatus,
} from "./api.js";
import { FornecedorAutocomplete } from "./components/FornecedorAutocomplete.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";

const ROTULOS_TRANSICAO = { APROVADO: "Aprovar pedido", CANCELADO: "Cancelar pedido" };

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

function DropdownMenu({ items, onSelect, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 4px)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 10,
        minWidth: "220px",
      }}
      onMouseLeave={onClose}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="autocomplete-trocar"
          style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px" }}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// Terminal de Compra — layout copiado da referência Space Soft (gravação em
// Desktop, 2026-09-15 16:15): barra de topo Novo/Atualizar/Imprimir/Opções,
// cabeçalho Fornecedor/Emissão/Comprador/Transportadora, barra de
// ferramentas da grid (Adicionar itens/Favoritos/Importar) e rodapé com
// valor total. "novo" reaproveita a mesma tela pro estado em branco, igual
// ao Terminal de Venda (PedidoVendaDetailPage.jsx) — mesmo raciocínio,
// mesma técnica: o pedido só é criado de verdade no back quando o
// fornecedor é escolhido.
//
// Gaps conhecidos vs. a referência (sem campo equivalente no schema hoje):
// "Carregador" (papel de colaborador distinto de Comprador/Transportadora),
// "Fatura de produtor" (toggle no cabeçalho), Observação/Desconto por item,
// e as colunas granulares de custo (Frete/Descarga/Comissão Transp./Custo
// Fixo/Caixa/Custo Bruto/TF, Volumes) — ItemPedidoCompra só tem
// produto/quantidade/preço/lote. Nota fiscal (toggle do rodapé) também não
// tem contrapartida — emissão de NF-e é um módulo fiscal separado.
export function PedidoCompraDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const modoCriacao = id === "novo";
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [transicaoEmAndamento, setTransicaoEmAndamento] = useState(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const [arquivando, setArquivando] = useState(false);
  const [duplicando, setDuplicando] = useState(false);

  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);
  const [fornecedorNovo, setFornecedorNovo] = useState(null);
  const [trocandoFornecedor, setTrocandoFornecedor] = useState(false);

  const [mostrarAdicionarItem, setMostrarAdicionarItem] = useState(false);
  const [produtoNovo, setProdutoNovo] = useState(null);
  const [quantidadeNova, setQuantidadeNova] = useState("1");
  const [precoNovo, setPrecoNovo] = useState("0");
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [removendoItemId, setRemovendoItemId] = useState(null);

  const [mostrarImprimir, setMostrarImprimir] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState([]);

  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [pedidosParaImportar, setPedidosParaImportar] = useState([]);
  const [pedidoOrigemId, setPedidoOrigemId] = useState("");
  const [importando, setImportando] = useState(false);

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [compradores, setCompradores] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [compradorEditar, setCompradorEditar] = useState("");
  const [transportadoraEditar, setTransportadoraEditar] = useState("");
  const [valorFreteEditar, setValorFreteEditar] = useState("0");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  async function abrirHistorico() {
    setHistoricoAberto(true);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list("pedido-compra", id);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  async function carregar() {
    if (modoCriacao) {
      setPedido(null);
      setErroCarregar("");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErroCarregar("");
    try {
      const dados = await getPedidoCompra(id);
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

  useRealtimeInvalidate("/compras/pedidos", carregar);

  useEffect(() => {
    if (!modalEditarAberto) return;
    listColaboradores({ tipo: "COMPRADOR", pageSize: 100 }).then(({ items }) => setCompradores(items));
    listTransportadoras({ pageSize: 100 }).then(({ items }) => setTransportadoras(items));
  }, [modalEditarAberto]);

  function stub(nomeRecurso) {
    return () => {
      toast.error(`${nomeRecurso} ainda não implementado nesta versão do KAV DECK.`);
      setMostrarImprimir(false);
      setMostrarOpcoes(false);
    };
  }

  async function handleTrocarFornecedor() {
    if (!fornecedorNovo) return;
    setTrocandoFornecedor(true);
    try {
      if (modoCriacao) {
        const pedidoNovo = await createPedidoCompra({ fornecedorId: fornecedorNovo.participanteId });
        toast.success("Pedido criado — agora é só adicionar os itens.");
        setModalFornecedorAberto(false);
        setFornecedorNovo(null);
        navigate(`/compras/${pedidoNovo.id}`, { replace: true });
        return;
      }
      toast.error("Trocar fornecedor de um pedido já criado ainda não implementado nesta versão do KAV DECK.");
      setModalFornecedorAberto(false);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar o fornecedor.");
    } finally {
      setTrocandoFornecedor(false);
    }
  }

  async function handleAdicionarItem() {
    if (!produtoNovo) return;
    setAdicionandoItem(true);
    try {
      await addItemPedidoCompra(id, {
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

  async function handleRemoverItem(itemId) {
    setRemovendoItemId(itemId);
    try {
      await removeItemPedidoCompra(id, itemId);
      toast.success("Item removido do pedido.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível remover o item.");
    } finally {
      setRemovendoItemId(null);
    }
  }

  async function abrirFavoritos() {
    setMostrarFavoritos((v) => !v);
    if (!favoritos.length && pedido?.fornecedorId) {
      try {
        const items = await listFavoritosCompra({ fornecedorId: pedido.fornecedorId, limite: 10 });
        setFavoritos(items);
      } catch (err) {
        toast.error(err.message ?? "Não foi possível carregar os favoritos.");
      }
    }
  }

  async function adicionarFavorito(favorito) {
    setMostrarFavoritos(false);
    setAdicionandoItem(true);
    try {
      await addItemPedidoCompra(id, {
        produtoId: favorito.produtoId,
        quantidade: "1",
        precoUnitario: String(favorito.ultimoPreco ?? 0),
      });
      toast.success("Item adicionado ao pedido.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível adicionar o item.");
    } finally {
      setAdicionandoItem(false);
    }
  }

  async function abrirModalImportar() {
    setMostrarOpcoes(false);
    setModalImportarAberto(true);
    setPedidoOrigemId("");
    try {
      const { items } = await listPedidosCompra({ pageSize: 50 });
      setPedidosParaImportar(items.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os pedidos.");
    }
  }

  async function handleImportarItens() {
    if (!pedidoOrigemId) return;
    setImportando(true);
    try {
      await importarItensPedidoCompra(id, pedidoOrigemId);
      toast.success("Itens importados com sucesso.");
      setModalImportarAberto(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível importar os itens.");
    } finally {
      setImportando(false);
    }
  }

  function abrirModalEditar() {
    setCompradorEditar(pedido.compradorId ?? "");
    setTransportadoraEditar(pedido.transportadoraId ?? "");
    setValorFreteEditar(String(pedido.valorFrete ?? 0));
    setModalEditarAberto(true);
  }

  async function handleSalvarEdicao() {
    setSalvandoEdicao(true);
    try {
      if (transportadoraEditar || Number(valorFreteEditar) > 0) {
        await aplicarFretePedidoCompra(id, {
          transportadoraId: transportadoraEditar || undefined,
          valorFrete: String(valorFreteEditar || 0),
        });
      }
      toast.success("Pedido de compra atualizado.");
      setModalEditarAberto(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o pedido.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function aplicarTransicao(novoStatus) {
    setTransicaoEmAndamento(novoStatus);
    try {
      await updatePedidoCompraStatus(id, novoStatus);
      toast.success("Status atualizado com sucesso.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o status.");
    } finally {
      setTransicaoEmAndamento(null);
      setConfirmarCancelamento(false);
    }
  }

  async function handleDuplicar() {
    setDuplicando(true);
    try {
      const novoPedido = await duplicarPedidoCompra(id);
      toast.success("Pedido duplicado com sucesso.");
      navigate(`/compras/${novoPedido.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível duplicar o pedido.");
    } finally {
      setDuplicando(false);
    }
  }

  async function handleAlternarArquivamento() {
    setArquivando(true);
    try {
      await arquivarPedidoCompra(id, !pedido.arquivado);
      toast.success(pedido.arquivado ? "Pedido desarquivado." : "Pedido arquivado.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o arquivamento.");
    } finally {
      setArquivando(false);
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

  if (!pedido && !modoCriacao) return null;

  const TRANSICOES = {
    ABERTO: ["APROVADO", "CANCELADO"],
    APROVADO: ["CANCELADO"],
    RECEBIDO_PARCIAL: ["CANCELADO"],
    RECEBIDO: [],
    CANCELADO: [],
  };
  const transicoesDisponiveis = pedido ? TRANSICOES[pedido.status] ?? [] : [];
  const podeReceber = pedido && ["APROVADO", "RECEBIDO_PARCIAL"].includes(pedido.status);
  const podeEditarItens = pedido?.status === "ABERTO";

  const itensPedido = pedido?.itens ?? [];
  const valorTotal = itensPedido.reduce((soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario), 0);

  const columns = [
    { key: "quantidade", label: "Qtd." },
    { key: "und", label: "Und.", render: () => "UN" },
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.precoUnitario) },
    {
      key: "parcial",
      label: "T. parcial",
      render: (row) => formatarMoeda(Number(row.quantidade) * Number(row.precoUnitario)),
    },
    ...(podeEditarItens
      ? [
          {
            key: "_acoes",
            label: "",
            render: (row) => (
              <Button variant="ghost" onClick={() => handleRemoverItem(row.id)} loading={removendoItemId === row.id} disabled={Boolean(removendoItemId)}>
                Remover
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/compras" title="Ver consulta de pedidos">
            ☰ Consulta
          </Link>
          <h2 style={{ margin: 0 }}>Terminal de Compra</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link to="/compras/novo">
            <Button variant="secondary">+ Novo</Button>
          </Link>
          <Button variant="ghost" onClick={carregar} disabled={modoCriacao}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={abrirHistorico} disabled={modoCriacao}>
            Histórico
          </Button>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarImprimir((v) => !v)} disabled={modoCriacao}>
              Imprimir ▾
            </Button>
            {mostrarImprimir && <DropdownMenu items={["Padrão"]} onSelect={stub("Impressão")} onClose={() => setMostrarImprimir(false)} />}
          </div>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarOpcoes((v) => !v)} disabled={modoCriacao}>
              Opções ▾
            </Button>
            {mostrarOpcoes && pedido && (
              <DropdownMenu
                items={["Importar pedidos", "Exibir preços"]}
                onSelect={(item) => (item === "Importar pedidos" ? abrirModalImportar() : stub(item)())}
                onClose={() => setMostrarOpcoes(false)}
              />
            )}
          </div>
        </div>
      </div>

      {pedido && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <button type="button" className="autocomplete-trocar" onClick={handleDuplicar} disabled={duplicando}>
            {duplicando ? "Duplicando..." : "Duplicar pedido"}
          </button>
          <button type="button" className="autocomplete-trocar" onClick={handleAlternarArquivamento} disabled={arquivando}>
            {pedido.arquivado ? "Desarquivar" : "Arquivar"}
          </button>
        </div>
      )}

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Fornecedor</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button type="button" className="icon-btn" title="Alterar fornecedor" onClick={() => setModalFornecedorAberto(true)}>
                <FiEdit2 />
              </button>
              {pedido ? (
                <div>
                  <div style={{ fontWeight: 700 }}>{pedido.fornecedor.participante.razaoSocial}</div>
                  <div>{pedido.fornecedor.participante.cpfCnpj}</div>
                </div>
              ) : (
                <div style={{ color: "var(--color-text-faint)" }}>Selecionar fornecedor</div>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Emissão</div>
            <div>{formatarData(pedido ? pedido.dataEmissao : new Date().toISOString())}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Comprador</div>
            <div>{pedido?.comprador?.nome ?? "Não atribuído"}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase", marginTop: "8px" }}>
              Transportadora
            </div>
            <div>{pedido?.transportadora?.razaoSocial ?? "Não atribuída"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            {pedido && (
              <button type="button" className="icon-btn" title="Editar Pedido de Compra" onClick={abrirModalEditar}>
                <FiEdit2 />
              </button>
            )}
            {pedido && <StatusBadge status={pedido.status} />}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>Itens ({itensPedido.length})</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {podeEditarItens && (
              <Button variant={mostrarAdicionarItem ? "secondary" : "ghost"} onClick={() => setMostrarAdicionarItem((v) => !v)}>
                + Adicionar itens
              </Button>
            )}
            <div style={{ position: "relative" }}>
              <Button variant="ghost" onClick={abrirFavoritos} disabled={!pedido}>
                Favoritos
              </Button>
              {mostrarFavoritos && (
                <DropdownMenu
                  items={favoritos.length ? favoritos.map((f) => `${f.produto.descricao} (${f.vezesComprado}x)`) : ["Nenhum favorito para este fornecedor"]}
                  onSelect={(label) => {
                    const favorito = favoritos.find((f) => `${f.produto.descricao} (${f.vezesComprado}x)` === label);
                    if (favorito) adicionarFavorito(favorito);
                  }}
                  onClose={() => setMostrarFavoritos(false)}
                />
              )}
            </div>
            <Button variant="ghost" onClick={abrirModalImportar} disabled={!pedido}>
              Importar
            </Button>
          </div>
        </div>

        <DataTable columns={columns} rows={itensPedido} emptyMessage="Pedido sem itens." />

        {mostrarAdicionarItem && podeEditarItens && (
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
            <h4 style={{ marginTop: 0 }}>Adicionar Item ao Pedido Manualmente</h4>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input label="Qtd." type="number" style={{ width: "90px" }} value={quantidadeNova} onChange={(e) => setQuantidadeNova(e.target.value)} />
              <div style={{ flex: 1, minWidth: "240px" }}>
                <ProdutoAutocomplete
                  label="Produto"
                  onSelecionar={(produto) => {
                    setProdutoNovo(produto);
                    setPrecoNovo(String(produto.precoReferencia ?? 0));
                  }}
                />
                {produtoNovo && (
                  <div style={{ marginTop: "4px", fontSize: "var(--text-sm)" }}>
                    Selecionado: {produtoNovo.codigo} — {produtoNovo.descricao}
                  </div>
                )}
              </div>
              <Input label="Valor unitário" type="number" style={{ width: "120px" }} value={precoNovo} onChange={(e) => setPrecoNovo(e.target.value)} />
              <Button onClick={handleAdicionarItem} loading={adicionandoItem} disabled={!produtoNovo}>
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "24px", color: "var(--color-text-faint)" }}>
            <span>Volumes: —</span>
            <span>Peso líquido: —</span>
            <span>Peso bruto: —</span>
            <span>Frete: {formatarMoeda(pedido?.valorFrete ?? 0)}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            Valor dos produtos: <strong style={{ fontSize: "var(--text-lg)" }}>{formatarMoeda(valorTotal)}</strong>
          </div>
        </div>
      </Card>

      {pedido && (podeReceber || transicoesDisponiveis.length > 0) && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {podeReceber && (
            <Link to={`/compras/${id}/recebimento`}>
              <Button>Receber mercadoria</Button>
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

      <Modal
        open={modalFornecedorAberto}
        onClose={() => {
          setModalFornecedorAberto(false);
          setFornecedorNovo(null);
        }}
        title={modoCriacao ? "Selecionar Fornecedor" : "Alterar Fornecedor"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalFornecedorAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTrocarFornecedor} loading={trocandoFornecedor} disabled={!fornecedorNovo}>
              {modoCriacao ? "Criar pedido" : "Confirmar"}
            </Button>
          </>
        }
      >
        <FornecedorAutocomplete selecionado={fornecedorNovo} onSelecionar={setFornecedorNovo} onLimpar={() => setFornecedorNovo(null)} />
      </Modal>

      <Modal
        open={modalEditarAberto}
        onClose={() => setModalEditarAberto(false)}
        title="Editar Pedido de Compra"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalEditarAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicao} loading={salvandoEdicao}>
              Salvar
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Select label="Comprador" value={compradorEditar} onChange={(e) => setCompradorEditar(e.target.value)} disabled>
            <option value="">Não atribuído</option>
            {compradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Select label="Transportadora" value={transportadoraEditar} onChange={(e) => setTransportadoraEditar(e.target.value)}>
            <option value="">Não atribuída</option>
            {transportadoras.map((t) => (
              <option key={t.id} value={t.id}>
                {t.razaoSocial}
              </option>
            ))}
          </Select>
          <Input label="Valor do frete" type="number" min="0" step="0.01" value={valorFreteEditar} onChange={(e) => setValorFreteEditar(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        title="Importar itens de outro pedido"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalImportarAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportarItens} loading={importando} disabled={!pedidoOrigemId}>
              Importar
            </Button>
          </>
        }
      >
        <Select label="Pedido de origem" value={pedidoOrigemId} onChange={(e) => setPedidoOrigemId(e.target.value)}>
          <option value="">Selecione...</option>
          {pedidosParaImportar.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fornecedor.participante.razaoSocial} — {formatarData(p.dataEmissao)}
            </option>
          ))}
        </Select>
      </Modal>

      <HistoricoModal
        open={historicoAberto}
        onClose={() => setHistoricoAberto(false)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={{ status: "Status" }}
      />
    </div>
  );
}
