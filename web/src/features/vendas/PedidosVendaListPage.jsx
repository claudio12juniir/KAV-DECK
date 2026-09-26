import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UltimaEdicaoCelula, useUltimasEdicoes } from "../../components/audit/Historico.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Select } from "../../components/ui/Select.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { listCfopOptions } from "../fiscal/cfop/api.js";
import { listNaturezasOperacaoOptions } from "../fiscal/naturezasOperacao/api.js";
import { agruparNfPedidosVenda, duplicarPedidoVenda, listColaboradores, listPedidosVenda, listRotasEntrega } from "./api.js";
import { StatusBadge } from "./components/StatusBadge.jsx";

const TURNO_LABEL = { MANHA: "Manhã", TARDE: "Tarde", NOITE: "Noite", SOS: "SOS", RETIRA: "Retira" };

// Baldes da barra rápida de status (seção 6 do mapeamento: três toggles
// independentes — Em aberto/Faturado ligados por padrão, Cancelado
// desligado — em vez de um <select> de seleção única).
const STATUS_CHIPS = [
  { valor: "ABERTO", label: "Em aberto" },
  { valor: "FATURADO", label: "Faturado" },
  { valor: "CANCELADO", label: "Cancelado" },
];

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Consulta de Pedidos — modo "grid" do Terminal de Venda (seção 6 do
// mapeamento): filtros rápidos + painel "Mais filtros" combinável (Cliente,
// Vendedor, Período de entrega, Rota/Região, situação financeira,
// arquivados), toggles de status independentes (não seleção única), seleção
// em lote com soma de valor, e as ações que operam sobre a seleção (Agrupar
// NF, Duplicar). "Estornar" foi deixado de fora de propósito — nem o sistema
// original testou essa ação (seção 6: "não testada"), e reverter um
// faturamento aqui mexeria em baixa de estoque e título já gerados;
// implementar isso às pressas seria arriscado. Ver relatório da sessão.
export function PedidosVendaListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [statusesLigados, setStatusesLigados] = useState(new Set(["ABERTO", "FATURADO"]));
  const [clienteTexto, setClienteTexto] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [periodo, setPeriodo] = useState("");

  const [mostrarMaisFiltros, setMostrarMaisFiltros] = useState(false);
  const [rotaEntregaId, setRotaEntregaId] = useState("");
  const [situacaoFinanceira, setSituacaoFinanceira] = useState("");
  const [exibirArquivados, setExibirArquivados] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [rotas, setRotas] = useState([]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [selecionados, setSelecionados] = useState(new Set());
  const [duplicandoId, setDuplicandoId] = useState(null);

  const [modalAgruparAberto, setModalAgruparAberto] = useState(false);
  const [naturezas, setNaturezas] = useState([]);
  const [cfops, setCfops] = useState([]);
  const [naturezaOperacaoId, setNaturezaOperacaoId] = useState("");
  const [cfopId, setCfopId] = useState("");
  const [serieNf, setSerieNf] = useState("1");
  const [numeroNf, setNumeroNf] = useState("");
  const [agrupando, setAgrupando] = useState(false);

  useEffect(() => {
    Promise.all([listColaboradores({ tipo: "VENDEDOR", pageSize: 100 }), listRotasEntrega({ pageSize: 100 })]).then(
      ([v, r]) => {
        setVendedores(v.items);
        setRotas(r.items);
      },
    );
  }, []);

  function alternarStatusChip(valor) {
    setStatusesLigados((atual) => {
      const novo = new Set(atual);
      if (novo.has(valor)) novo.delete(valor);
      else novo.add(valor);
      return novo;
    });
  }

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listPedidosVenda({
      statuses: statusesLigados.size ? [...statusesLigados].join(",") : undefined,
      filtro: situacaoFinanceira || undefined,
      clienteTexto: clienteTexto || undefined,
      vendedorId: vendedorId || undefined,
      periodo: periodo || undefined,
      rotaEntregaId: rotaEntregaId || undefined,
      arquivado: exibirArquivados || undefined,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
      pageSize: 100,
    })
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
  }, [
    statusesLigados,
    situacaoFinanceira,
    clienteTexto,
    vendedorId,
    periodo,
    rotaEntregaId,
    exibirArquivados,
    dataInicial,
    dataFinal,
    refreshKey,
  ]);

  useRealtimeInvalidate("/vendas/pedidos", () => setRefreshKey((k) => k + 1));

  function alternarSelecao(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function abrirModalAgrupar() {
    if (selecionados.size < 2) {
      toast.error("Selecione pelo menos 2 pedidos faturados do mesmo cliente para agrupar numa NF.");
      return;
    }
    if (!naturezas.length) {
      const [n, c] = await Promise.all([listNaturezasOperacaoOptions(), listCfopOptions()]);
      setNaturezas(n);
      setCfops(c);
    }
    setModalAgruparAberto(true);
  }

  async function handleAgruparNf() {
    setAgrupando(true);
    try {
      const nota = await agruparNfPedidosVenda({
        pedidoIds: [...selecionados],
        serie: serieNf,
        numero: numeroNf,
        naturezaOperacaoId,
        cfopId,
      });
      toast.success(`Nota fiscal agrupada criada (série ${nota.serie}/${nota.numero}).`);
      setModalAgruparAberto(false);
      setSelecionados(new Set());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível agrupar os pedidos numa NF.");
    } finally {
      setAgrupando(false);
    }
  }

  async function handleDuplicar(id) {
    setDuplicandoId(id);
    try {
      const novoPedido = await duplicarPedidoVenda(id);
      toast.success("Pedido duplicado com sucesso.");
      navigate(`/vendas/${novoPedido.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível duplicar o pedido.");
    } finally {
      setDuplicandoId(null);
    }
  }

  const valorSelecionado = pedidos.filter((p) => selecionados.has(p.id)).reduce((soma, p) => soma + Number(p.valorTotal || 0), 0);

  const ids = useMemo(() => pedidos.map((p) => p.id), [pedidos]);
  const { mapa: ultimasEdicoes, carregando: carregandoUltimas } = useUltimasEdicoes("pedido-venda", ids);

  const columns = [
    {
      key: "_check",
      label: "",
      render: (row) => (
        <input type="checkbox" checked={selecionados.has(row.id)} onChange={(e) => { e.stopPropagation(); alternarSelecao(row.id); }} onClick={(e) => e.stopPropagation()} />
      ),
    },
    { key: "cliente", label: "Cliente", render: (row) => row.cliente.participante.razaoSocial },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "dataEmissao", label: "Data", render: (row) => formatarData(row.dataEmissao) },
    { key: "valorTotal", label: "Valor total", render: (row) => formatarMoeda(row.valorTotal) },
    { key: "arquivado", label: "Arquivado", render: (row) => (row.arquivado ? "Sim" : "—") },
    {
      key: "_ultimaEdicao",
      label: "Última edição",
      render: (row) => (
        <UltimaEdicaoCelula
          info={ultimasEdicoes[row.id]}
          carregando={carregandoUltimas && ultimasEdicoes[row.id] === undefined}
          onClick={() => navigate(`/vendas/${row.id}`)}
        />
      ),
    },
    {
      key: "_acoes",
      label: "",
      render: (row) => (
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleDuplicar(row.id);
          }}
          loading={duplicandoId === row.id}
          disabled={Boolean(duplicandoId)}
        >
          Duplicar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1>Consulta de Pedidos</h1>
          <p>Acompanhe, filtre e crie novos pedidos de venda.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="secondary" onClick={abrirModalAgrupar}>
            Agrupar NF
          </Button>
          <Link to="/vendas/novo">
            <Button>Novo pedido</Button>
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "12px" }}>
        <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <Input
          label="Cliente"
          value={clienteTexto}
          onChange={(e) => setClienteTexto(e.target.value)}
          placeholder="Buscar por razão social ou CNPJ..."
          style={{ minWidth: "220px" }}
        />
        <div style={{ minWidth: "180px" }}>
          <Select label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ minWidth: "160px" }}>
          <Select label="Período da entrega" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(TURNO_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" onClick={() => setMostrarMaisFiltros((v) => !v)}>
          {mostrarMaisFiltros ? "Menos filtros ▴" : "Mais filtros ▾"}
        </Button>
      </div>

      {/* Toggles independentes de status — combináveis entre si, ao
          contrário do <select> de opção única anterior (seção 6 do
          mapeamento: "Em aberto"/"Faturado" ligados por padrão, "Cancelado"
          desligado, os três podendo estar ligados ao mesmo tempo). */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {STATUS_CHIPS.map((chip) => (
          <Button
            key={chip.valor}
            variant={statusesLigados.has(chip.valor) ? "secondary" : "ghost"}
            onClick={() => alternarStatusChip(chip.valor)}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      {mostrarMaisFiltros && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "flex-end",
            marginBottom: "16px",
            padding: "12px 16px",
            background: "var(--color-surface-alt, var(--color-accent-soft))",
            borderRadius: "8px",
          }}
        >
          <div style={{ minWidth: "180px" }}>
            <Select label="Rota / Região" value={rotaEntregaId} onChange={(e) => setRotaEntregaId(e.target.value)}>
              <option value="">Todas</option>
              {rotas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ minWidth: "180px" }}>
            <Select label="Situação financeira" value={situacaoFinanceira} onChange={(e) => setSituacaoFinanceira(e.target.value)}>
              <option value="">Todas</option>
              <option value="LIQUIDADO">Liquidado (títulos baixados)</option>
              <option value="AGRUPADO">Agrupado numa NF</option>
            </Select>
          </div>
          <Button variant={exibirArquivados ? "secondary" : "ghost"} onClick={() => setExibirArquivados((v) => !v)}>
            Exibir arquivados
          </Button>
        </div>
      )}

      {selecionados.size > 0 && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "var(--color-accent-soft)", borderRadius: "8px" }}>
          {selecionados.size} pedido(s) selecionado(s) — Valor da seleção: <strong>{formatarMoeda(valorSelecionado)}</strong>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={pedidos}
        loading={carregando}
        onRowClick={(row) => navigate(`/vendas/${row.id}`)}
        emptyMessage="Nenhum pedido de venda encontrado."
      />

      <Modal
        open={modalAgruparAberto}
        onClose={() => setModalAgruparAberto(false)}
        title="Agrupar pedidos numa nota fiscal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAgruparAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgruparNf} loading={agrupando} disabled={!naturezaOperacaoId || !cfopId || !numeroNf}>
              Gerar nota fiscal
            </Button>
          </>
        }
      >
        <p>{selecionados.size} pedido(s) selecionado(s) — todos precisam já estar faturados e ser do mesmo cliente.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select label="Natureza da operação" value={naturezaOperacaoId} onChange={(e) => setNaturezaOperacaoId(e.target.value)}>
            <option value="">Selecione...</option>
            {naturezas.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </Select>
          <Select label="CFOP" value={cfopId} onChange={(e) => setCfopId(e.target.value)}>
            <option value="">Selecione...</option>
            {cfops.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <div style={{ display: "flex", gap: "12px" }}>
            <Input label="Série" value={serieNf} onChange={(e) => setSerieNf(e.target.value)} />
            <Input label="Número" value={numeroNf} onChange={(e) => setNumeroNf(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
