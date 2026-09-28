import { useEffect, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiClipboard,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiGrid,
  FiList,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";
import { TbArrowsSort } from "react-icons/tb";
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
import { consultarPreviaEstoque } from "../estoque/previaEstoque/api.js";
import { searchProdutos } from "../shared/produtosApi.js";
import { ProdutoAutocomplete } from "../shared/ProdutoAutocomplete.jsx";
import {
  addItemPedidoVenda,
  aplicarDescontoPedidoVenda,
  arquivarPedidoVenda,
  atribuirItinerarioPedido,
  atualizarClientePedidoVenda,
  atualizarVendedorPedidoVenda,
  createPedidoVenda,
  dividirPedidoVenda,
  duplicarPedidoVenda,
  getPedidoVenda,
  importarItensPedidoVenda,
  listColaboradores,
  listFavoritosVenda,
  listPedidosVenda,
  listRotasEntrega,
  removeItemPedidoVenda,
  separarPedidoVenda,
  updatePedidoVendaStatus,
} from "./api.js";
import { ClienteAutocomplete } from "./components/ClienteAutocomplete.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import "./PedidoVendaDetailPage.css";

const ROTULOS_TRANSICAO = { CANCELADO: "Cancelar pedido" };
const TURNO_LABEL = { MANHA: "Manhã", TARDE: "Tarde", NOITE: "Noite", SOS: "SOS", RETIRA: "Retira" };

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

// Terminal de Venda — layout fiel ao mapeamento SpaceSoft (seção 2, mais o
// checklist detalhado que o usuário levantou olhando a aba de referência ao
// vivo): barra de topo com Novo/Atualizar/Imprimir/Download/Opções,
// cabeçalho com ícones de Cliente/Editar/Confirmar + Vendedor/Separador,
// barra de ferramentas da grid (Exibir estoque, Adicionar itens, Favoritos,
// Importar, Perfil do pedido, Aplicar preço, Configurações, Ordenar),
// colunas exatas (inclusive Embalado) e rodapé com Volumes/Peso.
//
// Nem todo botão tem motor por trás ainda — os que não têm (Favoritos,
// Importar, Perfil do pedido, Aplicar preço, Configurações, Importar
// pedidos, Aplicar outras despesas, Integração Filial, Logs, coluna
// Embalado, Volumes/Peso líquido/Peso bruto) ficam visíveis no layout igual
// à referência, mas avisam via toast que ainda não fazem nada nesta versão
// — o pedido explícito aqui foi "copie o layout", não inventar dado ou
// comportamento que o KAV DECK não tem de verdade.
//
// Imprimir/Download SÃO reais (ver `imprimirPedido` mais abaixo): usam a
// impressão nativa do navegador — "Salvar como PDF" é a própria opção de
// destino do diálogo — em vez de gerar PDF em JS, mesma estratégia de
// RelatoriosPage.css/UtilitariosFiscaisPage.jsx. Cada formato do menu
// (Padrão, Cupom, Pedido com canhoto, Recibo, Via Separador) troca as
// colunas da grid impressa e o bloco de fechamento via `formatoImpressao`,
// sempre a partir do MESMO pedido carregado em tela — ver PedidoVendaDetailPage.css.
export function PedidoVendaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  // "novo" reproduz o estado "em branco" do Terminal de Venda de referência
  // (mesma tela, :id = 0 — seção 2 do MAPEAMENTO_VENDAS_SPACESOFT.md): sem
  // pedido persistido ainda, cabeçalho mostra "Selecionar cliente" no lugar
  // do nome do cliente, e a grid de itens fica bloqueada até o pedido
  // existir de verdade. O backend exige clienteId pra criar um pedido
  // (schema.js: createPedidoVendaSchema não tem clienteId opcional), então
  // aqui o pedido só é criado de fato no back quando o usuário escolhe o
  // cliente (handleTrocarCliente) — depois disso, esta mesma tela reabre
  // pela URL /vendas/:id normal e passa a funcionar como qualquer pedido.
  const modoCriacao = id === "novo";
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [transicaoEmAndamento, setTransicaoEmAndamento] = useState(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const [confirmarSeparacao, setConfirmarSeparacao] = useState(false);

  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  async function abrirHistorico() {
    setHistoricoAberto(true);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list("pedido-venda", id);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  const [mostrarAdicionarItem, setMostrarAdicionarItem] = useState(false);
  const [produtoNovo, setProdutoNovo] = useState(null);
  const [quantidadeNova, setQuantidadeNova] = useState("1");
  const [precoNovo, setPrecoNovo] = useState("0");
  const [descontoNovo, setDescontoNovo] = useState("0");
  const [observacaoNova, setObservacaoNova] = useState("");
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [removendoItemId, setRemovendoItemId] = useState(null);

  // Loop de lançamento 100% por teclado (achado do MAPEAMENTO_VENDAS_SPACESOFT.md,
  // seção 17.2/17.7 — no balcão de referência é preciso mouse pra confirmar
  // cada item; aqui Enter avança Qtd → Produto → Valor → Desconto →
  // Observação → Adicionar, e o sucesso do Adicionar devolve o foco pro Qtd
  // pra emendar o próximo item sem tocar no mouse nenhuma vez).
  const qtdInputRef = useRef(null);
  const produtoAutocompleteRef = useRef(null);
  const valorInputRef = useRef(null);
  const descontoInputRef = useRef(null);
  const observacaoInputRef = useRef(null);

  function focarProximoCampo(e, ref) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    ref.current?.focus();
  }

  useEffect(() => {
    if (mostrarAdicionarItem) qtdInputRef.current?.focus();
  }, [mostrarAdicionarItem]);

  const [duplicando, setDuplicando] = useState(false);
  const [arquivando, setArquivando] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarImprimir, setMostrarImprimir] = useState(false);
  const [formatoImpressao, setFormatoImpressao] = useState("padrao");
  const [mostrarAplicarPreco, setMostrarAplicarPreco] = useState(false);
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);
  const [mostrarOrdenar, setMostrarOrdenar] = useState(false);
  const [ordenacao, setOrdenacao] = useState("lancamento");

  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState([]);

  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [pedidosParaImportar, setPedidosParaImportar] = useState([]);
  const [pedidoOrigemId, setPedidoOrigemId] = useState("");
  const [importando, setImportando] = useState(false);

  const [exibirEstoque, setExibirEstoque] = useState(false);
  const [saldosPorProduto, setSaldosPorProduto] = useState(new Map());

  const [modalDescontoAberto, setModalDescontoAberto] = useState(false);
  const [descontoLote, setDescontoLote] = useState("0");
  const [aplicandoDesconto, setAplicandoDesconto] = useState(false);

  const [modalDividirAberto, setModalDividirAberto] = useState(false);
  const [itensParaDividir, setItensParaDividir] = useState(new Set());
  const [dividindo, setDividindo] = useState(false);

  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [termoModalProduto, setTermoModalProduto] = useState("");
  const [resultadosModalProduto, setResultadosModalProduto] = useState([]);

  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [clienteNovo, setClienteNovo] = useState(null);
  const [trocandoCliente, setTrocandoCliente] = useState(false);

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [rotas, setRotas] = useState([]);
  const [vendedorEditar, setVendedorEditar] = useState("");
  const [turnoEditar, setTurnoEditar] = useState("");
  const [rotaEditar, setRotaEditar] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // `carregar()` é chamado depois de toda mutação (adicionar item, aplicar
  // desconto, trocar cliente, etc.), não só na entrada da tela — mostrar o
  // skeleton de página inteira (`carregando`) nesses refreshes fazia a tela
  // inteira piscar/desmontar a cada item lançado, destruindo o foco do
  // teclado no meio do loop de lançamento rápido. Só a primeira carga real
  // (pedido ainda não existe em memória) passa pelo skeleton; um refresh
  // depois de já ter pedido carregado atualiza os dados "quieto", sem
  // esconder a tela.
  async function carregar() {
    if (modoCriacao) {
      setPedido(null);
      setErroCarregar("");
      setCarregando(false);
      return;
    }
    const primeiraCarga = pedido === null;
    if (primeiraCarga) setCarregando(true);
    setErroCarregar("");
    try {
      const dados = await getPedidoVenda(id);
      setPedido(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar este pedido.");
    } finally {
      if (primeiraCarga) setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtimeInvalidate("/vendas/pedidos", carregar);

  // Atalho Ctrl+P (seção 3.4 do mapeamento) — abre o modal "Selecione um
  // Produto" de qualquer lugar da tela, igual ao original.
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setModalProdutoAberto(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!modalProdutoAberto) {
      setTermoModalProduto("");
      setResultadosModalProduto([]);
      return;
    }
    if (termoModalProduto.trim().length < 1) {
      setResultadosModalProduto([]);
      return undefined;
    }
    let ativo = true;
    searchProdutos(termoModalProduto.trim()).then(({ items }) => ativo && setResultadosModalProduto(items));
    return () => {
      ativo = false;
    };
  }, [termoModalProduto, modalProdutoAberto]);

  function escolherProdutoDoModal(produto) {
    setProdutoNovo(produto);
    setPrecoNovo(String(produto.precoReferencia ?? 0));
    setModalProdutoAberto(false);
  }

  // "Exibir estoque" (barra de ferramentas da grid) — busca o saldo físico
  // atual de todos os produtos uma vez só e casa por produtoId, em vez de
  // uma chamada por linha da grid.
  useEffect(() => {
    if (!exibirEstoque || saldosPorProduto.size > 0) return;
    consultarPreviaEstoque()
      .then(({ items }) => setSaldosPorProduto(new Map(items.map((i) => [i.produtoId, i.saldoAtual]))))
      .catch(() => toast.error("Não foi possível carregar o saldo de estoque."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exibirEstoque]);

  useEffect(() => {
    if (!modalEditarAberto) return;
    listColaboradores({ tipo: "VENDEDOR", pageSize: 100 }).then(({ items }) => setVendedores(items));
    listRotasEntrega({ pageSize: 100 }).then(({ items }) => setRotas(items));
  }, [modalEditarAberto]);

  function abrirModalEditar() {
    setVendedorEditar(pedido.vendedorId ?? "");
    setTurnoEditar(pedido.turno ?? "");
    setRotaEditar(pedido.rotaEntregaId ?? "");
    setModalEditarAberto(true);
  }

  async function handleSalvarEdicao() {
    setSalvandoEdicao(true);
    try {
      if ((pedido.vendedorId ?? "") !== vendedorEditar) {
        await atualizarVendedorPedidoVenda(id, vendedorEditar || null);
      }
      if (turnoEditar || rotaEditar) {
        await atribuirItinerarioPedido(id, { turno: turnoEditar || undefined, rotaEntregaId: rotaEditar || undefined });
      }
      toast.success("Pedido de venda atualizado.");
      setModalEditarAberto(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o pedido.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleTrocarCliente() {
    if (!clienteNovo) return;
    setTrocandoCliente(true);
    try {
      if (modoCriacao) {
        const pedidoNovo = await createPedidoVenda({ clienteId: clienteNovo.participanteId });
        toast.success("Pedido criado — agora é só adicionar os itens.");
        setModalClienteAberto(false);
        setClienteNovo(null);
        navigate(`/vendas/${pedidoNovo.id}`, { replace: true });
        return;
      }
      await atualizarClientePedidoVenda(id, clienteNovo.participanteId);
      toast.success("Cliente do pedido atualizado.");
      setModalClienteAberto(false);
      setClienteNovo(null);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar o cliente.");
    } finally {
      setTrocandoCliente(false);
    }
  }

  async function handleConfirmarSeparacao() {
    setTransicaoEmAndamento("SEPARACAO");
    try {
      await updatePedidoVendaStatus(id, "SEPARACAO");
      toast.success("Pedido marcado como pronto para separação.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o status.");
    } finally {
      setTransicaoEmAndamento(null);
      setConfirmarSeparacao(false);
    }
  }

  async function handleCancelar() {
    setTransicaoEmAndamento("CANCELADO");
    try {
      await updatePedidoVendaStatus(id, "CANCELADO");
      toast.success("Pedido cancelado.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível cancelar o pedido.");
    } finally {
      setTransicaoEmAndamento(null);
      setConfirmarCancelamento(false);
    }
  }

  const FORMATOS_IMPRESSAO = {
    Padrão: "padrao",
    Cupom: "cupom",
    "Pedido com canhoto": "canhoto",
    Recibo: "recibo",
    "Via Separador": "separador",
  };

  // Reaproveita a impressão nativa do navegador — "Salvar como PDF" já é a
  // própria opção de destino do diálogo — em vez de puxar jsPDF/html2canvas
  // ou montar um serviço de geração de PDF no backend só pra isso; mesma
  // estratégia de RelatoriosPage.css/UtilitariosFiscaisPage.jsx. O
  // setTimeout dá tempo do React aplicar `formatoImpressao` no DOM (troca
  // de colunas/bloco de fechamento) antes do window.print() tirar o
  // "retrato" da página.
  function imprimirPedido(formato) {
    setMostrarImprimir(false);
    setFormatoImpressao(formato);
    setTimeout(() => {
      const tituloOriginal = document.title;
      const numero = pedido ? pedido.id.slice(0, 8).toUpperCase() : "";
      document.title = `KAV DECK - Pedido de Venda ${numero}`.trim();
      window.print();
      document.title = tituloOriginal;
    }, 50);
  }

  function stub(nomeRecurso) {
    return () => {
      toast.error(`${nomeRecurso} ainda não implementado nesta versão do KAV DECK.`);
      setMostrarOpcoes(false);
      setMostrarImprimir(false);
      setMostrarAplicarPreco(false);
      setMostrarConfiguracoes(false);
    };
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

  const podeConfirmarSeparacao = pedido?.status === "ABERTO";
  const podeCancelar = pedido?.status === "ABERTO" || pedido?.status === "SEPARACAO";
  const podeFaturar = pedido?.status === "SEPARACAO";
  const podeEditarItens = pedido?.status === "ABERTO";

  async function handleAdicionarItem() {
    if (!produtoNovo) return;
    setAdicionandoItem(true);
    try {
      await addItemPedidoVenda(id, {
        produtoId: produtoNovo.id,
        quantidade: String(quantidadeNova || 0),
        precoUnitario: String(precoNovo || 0),
        desconto: String(descontoNovo || 0),
        observacao: observacaoNova.trim() || undefined,
      });
      toast.success("Item adicionado ao pedido.");
      setProdutoNovo(null);
      setQuantidadeNova("1");
      setPrecoNovo("0");
      setDescontoNovo("0");
      setObservacaoNova("");
      // Fecha o loop de lançamento rápido: volta o foco pro Qtd pra emendar
      // o próximo item sem precisar clicar de novo na barra inline.
      qtdInputRef.current?.focus();
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível adicionar o item.");
    } finally {
      setAdicionandoItem(false);
    }
  }

  async function handleDuplicar() {
    setDuplicando(true);
    try {
      const novoPedido = await duplicarPedidoVenda(id);
      toast.success("Pedido duplicado com sucesso.");
      navigate(`/vendas/${novoPedido.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível duplicar o pedido.");
    } finally {
      setDuplicando(false);
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

  async function abrirFavoritos() {
    setMostrarFavoritos((v) => !v);
    if (!favoritos.length && pedido?.clienteId) {
      try {
        const items = await listFavoritosVenda({ clienteId: pedido.clienteId, limite: 10 });
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
      await addItemPedidoVenda(id, {
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
    setModalImportarAberto(true);
    setPedidoOrigemId("");
    try {
      const { items } = await listPedidosVenda({ pageSize: 50 });
      setPedidosParaImportar(items.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os pedidos.");
    }
  }

  async function handleImportarItens() {
    if (!pedidoOrigemId) return;
    setImportando(true);
    try {
      await importarItensPedidoVenda(id, pedidoOrigemId);
      toast.success("Itens importados com sucesso.");
      setModalImportarAberto(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível importar os itens.");
    } finally {
      setImportando(false);
    }
  }

  async function handleTrocarSeparador() {
    const nome = window.prompt("ID do colaborador separador (deixe em branco para remover):", pedido.separadorId ?? "");
    if (nome === null) return;
    try {
      await separarPedidoVenda(id, nome.trim() || undefined);
      toast.success("Separador atualizado.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o separador.");
    }
  }

  async function handleAplicarDesconto() {
    setAplicandoDesconto(true);
    try {
      await aplicarDescontoPedidoVenda(id, String(descontoLote || 0));
      toast.success("Desconto aplicado a todos os itens.");
      setModalDescontoAberto(false);
      setDescontoLote("0");
      setMostrarOpcoes(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível aplicar o desconto.");
    } finally {
      setAplicandoDesconto(false);
    }
  }

  function alternarItemDividir(itemId) {
    setItensParaDividir((atual) => {
      const novo = new Set(atual);
      if (novo.has(itemId)) novo.delete(itemId);
      else novo.add(itemId);
      return novo;
    });
  }

  async function handleDividir() {
    setDividindo(true);
    try {
      const resultado = await dividirPedidoVenda(id, [...itensParaDividir]);
      toast.success("Pedido dividido com sucesso.");
      setModalDividirAberto(false);
      setItensParaDividir(new Set());
      setMostrarOpcoes(false);
      navigate(`/vendas/${resultado.pedidoNovo.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível dividir o pedido.");
    } finally {
      setDividindo(false);
    }
  }

  const itensPedido = pedido?.itens ?? [];
  const valorProdutos = itensPedido.reduce((soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario), 0);
  const valorDesconto = itensPedido.reduce((soma, item) => soma + Number(item.desconto || 0), 0);
  const valorTotal = valorProdutos - valorDesconto;

  const itensOrdenados =
    ordenacao === "produto" ? [...itensPedido].sort((a, b) => a.produto.descricao.localeCompare(b.produto.descricao)) : itensPedido;

  const columns = [
    { key: "quantidade", label: "Qtd." },
    { key: "und", label: "Und.", render: () => "UN" },
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.precoUnitario) },
    {
      key: "parcial",
      label: "T. parcial",
      render: (row) => formatarMoeda(Number(row.quantidade) * Number(row.precoUnitario) - Number(row.desconto || 0)),
    },
    { key: "observacao", label: "Observação do item", render: (row) => row.observacao ?? "—" },
    { key: "desconto", label: "Desconto", render: (row) => formatarMoeda(row.desconto) },
    { key: "lote", label: "Lote", render: () => "— (definido no faturamento)" },
    { key: "embalado", label: "Embalado", render: () => "—" },
    ...(exibirEstoque
      ? [{ key: "saldoEstoque", label: "Saldo em estoque", render: (row) => saldosPorProduto.get(row.produtoId) ?? "—" }]
      : []),
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

  // Grid impressa é um clone com colunas por formato — Cupom mostra só o
  // essencial de um comprovante de venda, Via Separador esconde preço/
  // desconto (quem separa mercadoria não precisa ver valor); Padrão/
  // Canhoto/Recibo levam a grid completa menos as colunas só-de-tela
  // (ações de remover item, saldo de estoque). Nunca aparece na tela —
  // fica em `.venda-print-only` (ver PedidoVendaDetailPage.css) — só entra
  // no papel/PDF quando o usuário efetivamente imprime.
  const CHAVES_IMPRESSAO = {
    cupom: ["quantidade", "und", "produto", "valor", "parcial"],
    separador: ["quantidade", "und", "produto", "observacao", "lote", "embalado"],
  };
  const colunasImpressao = CHAVES_IMPRESSAO[formatoImpressao]
    ? columns.filter((col) => CHAVES_IMPRESSAO[formatoImpressao].includes(col.key))
    : columns.filter((col) => !["_acoes", "saldoEstoque"].includes(col.key));

  return (
    <div>
      {/* Barra de topo — Novo/Atualizar/Imprimir/Download/Opções, seção 2.1 do mapeamento.
          Cluster de 3 ícones à esquerda (lista/grade/busca) copia a forma da
          referência; só "lista" tem função real hoje (voltar pra Consulta de
          Pedidos) — grade/busca ficam visíveis mas inertes, mesmo padrão de
          "copiar o layout sem inventar comportamento" já usado no resto do arquivo. */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Link to="/vendas" className="icon-btn" title="Ver consulta de pedidos">
              <FiList />
            </Link>
            <span className="icon-btn" style={{ cursor: "default", opacity: 0.5 }} title="Visualização em grade">
              <FiGrid />
            </span>
            <span className="icon-btn" style={{ cursor: "default", opacity: 0.5 }} title="Pesquisar por número">
              <FiSearch />
            </span>
          </div>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-accent-hover)" }}>
            <FiShoppingBag /> Terminal de Venda
          </h2>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link to="/vendas/novo">
            <Button variant="secondary">
              <FiPlus /> Novo
            </Button>
          </Link>
          <Button variant="ghost" onClick={carregar} disabled={modoCriacao}>
            <FiRefreshCw /> Atualizar
          </Button>
          <Button variant="ghost" onClick={abrirHistorico} disabled={modoCriacao}>
            Histórico
          </Button>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarImprimir((v) => !v)} disabled={modoCriacao}>
              <FiPrinter /> Imprimir ▾
            </Button>
            {mostrarImprimir && (
              <DropdownMenu
                items={Object.keys(FORMATOS_IMPRESSAO)}
                onSelect={(label) => imprimirPedido(FORMATOS_IMPRESSAO[label])}
                onClose={() => setMostrarImprimir(false)}
              />
            )}
          </div>
          <Button variant="ghost" onClick={() => imprimirPedido("padrao")} disabled={modoCriacao}>
            <FiDownload /> Download
          </Button>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarOpcoes((v) => !v)} disabled={modoCriacao}>
              <FiSettings /> Opções ▾
            </Button>
            {mostrarOpcoes && pedido && (
              <DropdownMenu
                items={["Importar pedidos", "Aplicar desconto", "Aplicar outras despesas", "Integração Filial", "Dividir", "Logs"]}
                onSelect={(item) => {
                  if (item === "Aplicar desconto") setModalDescontoAberto(true);
                  else if (item === "Dividir") setModalDividirAberto(true);
                  else stub(item)();
                  setMostrarOpcoes(false);
                }}
                onClose={() => setMostrarOpcoes(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* "Venda Nº" / "R$" — cabeçalho da referência acima do quadro do
          cliente. KAV DECK não tem numeração sequencial de pedido (só uuid),
          então mostramos os 8 primeiros caracteres do id como identificador
          curto em vez de inventar um número sequencial que não existe. */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
        <div style={{ fontWeight: 700, color: "var(--color-accent-hover)" }}>
          Venda Nº{pedido ? ` ${pedido.id.slice(0, 8).toUpperCase()}` : ""}
        </div>
        <div style={{ fontWeight: 700, color: "var(--color-accent-hover)" }}>R$</div>
      </div>

      {/* Duplicar/Arquivar não existem no menu Opções da referência (lá são
          ações da grid de consulta / não existem) — mantidos aqui como
          utilitários secundários do KAV DECK, fora da barra copiada 1:1.
          Não fazem sentido em modoCriacao (nada pra duplicar/arquivar ainda). */}
      {pedido && (
        <div className="no-print" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <button type="button" className="autocomplete-trocar" onClick={handleDuplicar} disabled={duplicando}>
            {duplicando ? "Duplicando..." : "Duplicar pedido"}
          </button>
          <button type="button" className="autocomplete-trocar" onClick={handleAlternarArquivamento} disabled={arquivando}>
            {pedido.arquivado ? "Desarquivar" : "Arquivar"}
          </button>
        </div>
      )}

      {/* Cabeçalho do quadro — ícones de Cliente/Editar/Confirmar, Emissão/
          Saída-Entrega, Vendedor/Separador (checklist do usuário) */}
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Cliente</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button type="button" className="icon-btn no-print" title="Alterar cliente" onClick={() => setModalClienteAberto(true)}>
                <FiUser />
              </button>
              {pedido ? (
                <div>
                  <div style={{ fontWeight: 700 }}>{pedido.cliente.participante.razaoSocial}</div>
                  <div>{pedido.cliente.participante.cpfCnpj}</div>
                </div>
              ) : (
                <div style={{ color: "var(--color-text-faint)" }}>Selecionar cliente</div>
              )}
            </div>
            <a href="/participantes/clientes" target="_blank" rel="noreferrer" className="no-print" style={{ fontSize: "var(--text-xs)" }}>
              + Novo cliente
            </a>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span className="icon-btn" style={{ cursor: "default" }} title="Emissão e saída/entrega">
              <FiEdit2 />
            </span>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Emissão</div>
              <div>{formatarData(pedido ? pedido.dataEmissao : new Date().toISOString())}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase", marginTop: "8px" }}>
                Saída / Entrega
              </div>
              <div>{pedido?.turno ? TURNO_LABEL[pedido.turno] ?? pedido.turno : "Não definido"}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Vendedor/Representante</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="icon-btn" style={{ cursor: "default", width: "24px", height: "24px", fontSize: "12px" }}>
                <FiUser />
              </span>
              <span>{pedido?.vendedor?.nome ?? "Não atribuído"}</span>
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase", marginTop: "8px" }}>
              Separador
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="icon-btn" style={{ cursor: "default", width: "24px", height: "24px", fontSize: "12px" }}>
                <FiUser />
              </span>
              <span>{pedido?.separador?.nome ?? "Não atribuído"}</span>
              {pedido && (
                <button type="button" className="autocomplete-trocar no-print" onClick={handleTrocarSeparador}>
                  Trocar
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            {pedido && (
              <div className="no-print" style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="icon-btn" title="Editar Pedido de Venda" onClick={abrirModalEditar}>
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Pedido pronto para separação"
                  disabled={!podeConfirmarSeparacao}
                  onClick={() => setConfirmarSeparacao(true)}
                  style={{ color: podeConfirmarSeparacao ? "var(--color-success)" : undefined, borderColor: podeConfirmarSeparacao ? "var(--color-success)" : undefined }}
                >
                  <FiCheckCircle />
                </button>
              </div>
            )}
            {pedido && <StatusBadge status={pedido.status} />}
          </div>
        </div>
      </Card>

      {/* Grid ITENS() + barra de ferramentas + barra inline de lançamento —
          seções 2.3/3 do mapeamento e checklist do usuário */}
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>Itens ({itensPedido.length})</h3>
          <div className="no-print" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant={exibirEstoque ? "secondary" : "ghost"} onClick={() => setExibirEstoque((v) => !v)}>
              Exibir estoque
            </Button>
            {podeEditarItens && (
              <Button variant={mostrarAdicionarItem ? "secondary" : "ghost"} onClick={() => setMostrarAdicionarItem((v) => !v)}>
                <FiPlus /> Adicionar itens
              </Button>
            )}
            <div style={{ position: "relative" }}>
              <Button variant="ghost" onClick={abrirFavoritos} disabled={!pedido}>
                <FiStar /> Favoritos
              </Button>
              {mostrarFavoritos && (
                <DropdownMenu
                  items={favoritos.length ? favoritos.map((f) => `${f.produto.descricao} (${f.vezesVendido}x)`) : ["Nenhum favorito para este cliente"]}
                  onSelect={(label) => {
                    const favorito = favoritos.find((f) => `${f.produto.descricao} (${f.vezesVendido}x)` === label);
                    if (favorito) adicionarFavorito(favorito);
                  }}
                  onClose={() => setMostrarFavoritos(false)}
                />
              )}
            </div>
            <Button variant="ghost" onClick={abrirModalImportar} disabled={!pedido}>
              <FiUpload /> Importar
            </Button>
            <Button variant="ghost" onClick={stub("Perfil do pedido")}>
              <FiClipboard /> Perfil do pedido
            </Button>
            <div style={{ position: "relative" }}>
              <Button variant="ghost" onClick={() => setMostrarAplicarPreco((v) => !v)}>
                <FiDollarSign /> Aplicar preço ▾
              </Button>
              {mostrarAplicarPreco && (
                <DropdownMenu items={["Cadastro", "Selecionar Tabela"]} onSelect={stub("Aplicar preço")} onClose={() => setMostrarAplicarPreco(false)} />
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Button variant="ghost" onClick={() => setMostrarConfiguracoes((v) => !v)}>
                <FiSettings /> ▾
              </Button>
              {mostrarConfiguracoes && (
                <DropdownMenu
                  items={["Exibir outras despesas", "Exibir tipo"]}
                  onSelect={stub("Essa configuração")}
                  onClose={() => setMostrarConfiguracoes(false)}
                />
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Button variant="ghost" onClick={() => setMostrarOrdenar((v) => !v)}>
                <TbArrowsSort /> ▾
              </Button>
              {mostrarOrdenar && (
                <DropdownMenu
                  items={["Ordenar por lançamento", "Ordenar por produto"]}
                  onSelect={(item) => {
                    setOrdenacao(item === "Ordenar por produto" ? "produto" : "lancamento");
                    setMostrarOrdenar(false);
                  }}
                  onClose={() => setMostrarOrdenar(false)}
                />
              )}
            </div>
          </div>
        </div>

        {pedido ? (
          <div className="no-print">
            <DataTable columns={columns} rows={itensOrdenados} emptyMessage="Pedido sem itens." />
          </div>
        ) : (
          <p className="no-print" style={{ color: "var(--color-text-faint)" }}>Selecione um cliente acima para começar a adicionar itens.</p>
        )}

        {/* Grid impressa — só existe dentro de @media print (.venda-print-only,
            ver PedidoVendaDetailPage.css), nunca aparece na tela. Colunas e
            bloco de fechamento variam com `formatoImpressao` (ver imprimirPedido
            e colunasImpressao acima). */}
        {pedido && (
          <div className="venda-print-only">
            {(formatoImpressao === "cupom" || formatoImpressao === "separador") && (
              <h4 style={{ marginTop: 0 }}>
                {formatoImpressao === "cupom" ? "Cupom não fiscal" : "Via separador — lista de separação"}
              </h4>
            )}
            <DataTable columns={colunasImpressao} rows={itensOrdenados} emptyMessage="Pedido sem itens." />
            {formatoImpressao === "canhoto" && (
              <div className="venda-canhoto">
                <div className="venda-canhoto-corte">
                  ✂ — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —
                </div>
                <p>
                  <strong>Canhoto de entrega</strong> — Pedido Nº {pedido.id.slice(0, 8).toUpperCase()}
                </p>
                <p>Cliente: {pedido.cliente.participante.razaoSocial}</p>
                <p>
                  Data: {formatarData(pedido.dataEmissao)} — Valor total: {formatarMoeda(valorTotal)}
                </p>
                <p>Declaro ter recebido os produtos acima descritos em perfeitas condições.</p>
                <p className="venda-assinatura">Assinatura: ______________________________ &nbsp;&nbsp; Data: ____/____/______</p>
              </div>
            )}
            {formatoImpressao === "recibo" && (
              <div className="venda-recibo">
                <p>
                  Recibo referente ao Pedido de Venda Nº {pedido.id.slice(0, 8).toUpperCase()}, cliente{" "}
                  {pedido.cliente.participante.razaoSocial}, emitido em {formatarData(pedido.dataEmissao)}, no valor de{" "}
                  <strong>{formatarMoeda(valorTotal)}</strong>.
                </p>
                <p className="venda-assinatura">
                  Assinatura do cliente: ______________________________ &nbsp;&nbsp; Data: ____/____/______
                </p>
              </div>
            )}
            {formatoImpressao === "separador" && (
              <p className="venda-assinatura">Separado por: ______________________________ &nbsp;&nbsp; Data: ____/____/______</p>
            )}
          </div>
        )}

        {mostrarAdicionarItem && podeEditarItens && (
          <div className="no-print" style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, color: "var(--color-accent-hover)" }}>Adicionar Item ao Pedido Manualmente</h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="icon-btn" style={{ cursor: "default", width: "28px", height: "28px", fontSize: "13px" }} title="Preferências do lançamento">
                  <FiSettings />
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: "28px", height: "28px", fontSize: "13px" }}
                  title="Fechar"
                  onClick={() => setMostrarAdicionarItem(false)}
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input
                ref={qtdInputRef}
                label="Qtd."
                type="number"
                style={{ width: "90px" }}
                value={quantidadeNova}
                onChange={(e) => setQuantidadeNova(e.target.value)}
                onKeyDown={(e) => focarProximoCampo(e, produtoAutocompleteRef)}
              />
              <div style={{ flex: 1, minWidth: "240px" }}>
                <ProdutoAutocomplete
                  ref={produtoAutocompleteRef}
                  label="Produto ((Ctrl+P) - Pesquisar produto)"
                  onSelecionar={(produto) => {
                    setProdutoNovo(produto);
                    setPrecoNovo(String(produto.precoReferencia ?? 0));
                    // Confirmar o produto já avança o foco pro próximo campo
                    // do loop — o vendedor nunca precisa voltar pro mouse.
                    valorInputRef.current?.focus();
                  }}
                />
                {produtoNovo && (
                  <div style={{ marginTop: "4px", fontSize: "var(--text-sm)" }}>
                    Selecionado: {produtoNovo.codigo} — {produtoNovo.descricao}
                  </div>
                )}
              </div>
              <Input
                ref={valorInputRef}
                label="Valor unitário"
                type="number"
                style={{ width: "120px" }}
                value={precoNovo}
                onChange={(e) => setPrecoNovo(e.target.value)}
                onKeyDown={(e) => focarProximoCampo(e, descontoInputRef)}
                hint={Number(precoNovo) === 0 ? "Item a R$ 0,00 — confira se é bonificação." : undefined}
              />
              <Input
                ref={descontoInputRef}
                label="Desconto"
                type="number"
                style={{ width: "110px" }}
                value={descontoNovo}
                onChange={(e) => setDescontoNovo(e.target.value)}
                onKeyDown={(e) => focarProximoCampo(e, observacaoInputRef)}
              />
              <Input
                ref={observacaoInputRef}
                label="Observação"
                style={{ width: "180px" }}
                value={observacaoNova}
                onChange={(e) => setObservacaoNova(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && produtoNovo) {
                    e.preventDefault();
                    handleAdicionarItem();
                  }
                }}
              />
              <Button onClick={handleAdicionarItem} loading={adicionandoItem} disabled={!produtoNovo}>
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Rodapé — Volumes/Peso líquido/Peso bruto (sem dado real, gap
          documentado no topo do arquivo) + toggles Fat. auto/Boleto auto
          (seção 2.4 do mapeamento — automação de faturamento/boleto que o
          KAV DECK ainda não implementa; mostrados desligados, iguais à
          referência, em vez de somem do layout) + equação de total (com
          dado real). */}
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "24px", color: "var(--color-text-faint)" }}>
            <span className="icon-btn" style={{ cursor: "default" }} title="Volumes / peso">
              <FiTruck />
            </span>
            <span>Volumes: —</span>
            <span>Peso líquido: —</span>
            <span>Peso bruto: —</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-danger)" }}>
              <FiX /> Fat. auto
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-danger)" }}>
              <FiX /> Boleto auto
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            Valor dos produtos: <strong>{formatarMoeda(valorProdutos)}</strong>
            {"  −  Desconto: "}
            <strong>{formatarMoeda(valorDesconto)}</strong>
            {"  =  Valor total: "}
            <strong style={{ fontSize: "var(--text-lg)" }}>{formatarMoeda(valorTotal)}</strong>
          </div>
        </div>
      </Card>

      {pedido && (podeFaturar || podeCancelar) && (
        <div className="no-print" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {podeFaturar && (
            <Link to={`/vendas/${id}/faturar`}>
              <Button>Faturar pedido</Button>
            </Link>
          )}
          {podeCancelar && (
            <Button
              variant="danger"
              onClick={() => setConfirmarCancelamento(true)}
              loading={transicaoEmAndamento === "CANCELADO"}
              disabled={Boolean(transicaoEmAndamento)}
            >
              {ROTULOS_TRANSICAO.CANCELADO}
            </Button>
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
            <Button variant="danger" onClick={handleCancelar} loading={transicaoEmAndamento === "CANCELADO"}>
              Sim, cancelar
            </Button>
          </>
        }
      >
        Essa ação não pode ser desfeita. O pedido ficará marcado como cancelado.
      </Modal>

      {/* Ícone de aprovação do cabeçalho — checklist do usuário: "Deseja
          informar que o pedido está pronto para separação?" */}
      <Modal
        open={confirmarSeparacao}
        onClose={() => setConfirmarSeparacao(false)}
        title="Confirmação"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarSeparacao(false)}>
              Voltar
            </Button>
            <Button onClick={handleConfirmarSeparacao} loading={transicaoEmAndamento === "SEPARACAO"}>
              Sim, confirmar
            </Button>
          </>
        }
      >
        Deseja informar que o pedido está pronto para separação?
      </Modal>

      {/* Ícone de perfil do cabeçalho — "ALTERAR CLIENTE" (seção 2.2 do
          mapeamento). Endereço de entrega e descrição livre da referência
          não têm campo equivalente no schema ainda — gap documentado. */}
      <Modal
        open={modalClienteAberto}
        onClose={() => {
          setModalClienteAberto(false);
          setClienteNovo(null);
        }}
        title={modoCriacao ? "Selecionar Cliente" : "Alterar Cliente"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalClienteAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTrocarCliente} loading={trocandoCliente} disabled={!clienteNovo}>
              {modoCriacao ? "Criar pedido" : "Confirmar"}
            </Button>
          </>
        }
      >
        {!modoCriacao && pedido.status !== "ABERTO" ? (
          <p style={{ color: "var(--color-danger)" }}>Só é possível trocar o cliente enquanto o pedido está aberto.</p>
        ) : (
          <ClienteAutocomplete selecionado={clienteNovo} onSelecionar={setClienteNovo} onLimpar={() => setClienteNovo(null)} />
        )}
      </Modal>

      {/* Ícone de edição do cabeçalho — "Editar Pedido de Venda", reconfirmado
          ao vivo: reaproveita o MESMO modal da criação do pedido na
          referência (Data emissão, Natureza, Grupo/Unidade, Observação, Tag,
          Data de saída, Período da entrega, Informações adicionais/NF,
          NF-Pedido de compra B2B, toggles de faturamento/boleto automático).
          Nenhum desses campos existe no schema do KAV DECK hoje, exceto
          Período da entrega (turno) — por isso o modal aqui foi montado com
          os campos que EXISTEM de verdade e valem a pena editar
          (Vendedor/Representante, Rota de entrega, além do Período), em vez
          de reproduzir campos sem dado por trás. */}
      <Modal
        open={modalEditarAberto}
        onClose={() => setModalEditarAberto(false)}
        title="Editar Pedido de Venda"
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
          <Select label="Vendedor/Representante" value={vendedorEditar} onChange={(e) => setVendedorEditar(e.target.value)}>
            <option value="">Não atribuído</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Select>
          <Select label="Saída/Entrega" value={turnoEditar} onChange={(e) => setTurnoEditar(e.target.value)}>
            <option value="">Não definido</option>
            {Object.entries(TURNO_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </Select>
          <Select label="Rota de entrega" value={rotaEditar} onChange={(e) => setRotaEditar(e.target.value)}>
            <option value="">Não definida</option>
            {rotas.map((rota) => (
              <option key={rota.id} value={rota.id}>
                {rota.nome}
              </option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* Modal "Selecione um Produto" — atalho Ctrl+P, seção 3.4 do mapeamento */}
      <Modal open={modalProdutoAberto} onClose={() => setModalProdutoAberto(false)} title="Selecione um Produto">
        <Input
          autoFocus
          placeholder="Buscar produto..."
          value={termoModalProduto}
          onChange={(e) => setTermoModalProduto(e.target.value)}
        />
        <div style={{ marginTop: "12px", maxHeight: "320px", overflowY: "auto" }}>
          <DataTable
            columns={[
              { key: "codigo", label: "Cód." },
              { key: "und", label: "Und.", render: () => "UN" },
              { key: "descricao", label: "Produto" },
            ]}
            rows={resultadosModalProduto}
            emptyMessage="Digite para buscar."
            onRowClick={escolherProdutoDoModal}
          />
        </div>
      </Modal>

      <Modal
        open={modalDescontoAberto}
        onClose={() => setModalDescontoAberto(false)}
        title="Aplicar desconto a todos os itens"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalDescontoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAplicarDesconto} loading={aplicandoDesconto}>
              Aplicar
            </Button>
          </>
        }
      >
        <Input label="Desconto (por item)" type="number" value={descontoLote} onChange={(e) => setDescontoLote(e.target.value)} />
      </Modal>

      <Modal
        open={modalDividirAberto}
        onClose={() => setModalDividirAberto(false)}
        title="Dividir pedido"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalDividirAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDividir} loading={dividindo} disabled={itensParaDividir.size === 0}>
              Dividir em novo pedido
            </Button>
          </>
        }
      >
        <p>Selecione os itens que devem sair deste pedido e formar um novo pedido em aberto:</p>
        {itensPedido.map((item) => (
          <label key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
            <input type="checkbox" checked={itensParaDividir.has(item.id)} onChange={() => alternarItemDividir(item.id)} />
            {item.produto.descricao} — {item.quantidade}
          </label>
        ))}
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
              {p.cliente.participante.razaoSocial} — {formatarData(p.dataEmissao)}
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
