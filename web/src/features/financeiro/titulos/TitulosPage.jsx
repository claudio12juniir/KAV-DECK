import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HistoricoModal, UltimaEdicaoCelula, useUltimasEdicoes } from "../../../components/audit/Historico.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { logsApi } from "../../cadastros/logs/api.js";
import { agruparTitulos, listTitulos } from "./api.js";
import { StatusTituloBadge } from "./StatusTituloBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_PILLS = [
  { status: "ABERTO", label: "Em aberto" },
  { status: "BAIXADO", label: "Baixado" },
  { status: "CANCELADO", label: "Cancelado" },
  { status: "SUBSTITUIDO", label: "Agrupado" },
];

// Títulos a Pagar / Títulos a Receber — layout copiado da referência
// (gravação Desktop 2026-09-15 16:15): toggles de status em vez de um
// único <select>, caixas de resumo (Valor total/Em Aberto/Vencidos/Baixado/
// Valor Seleção) e "Agrupar" operando sobre a seleção (mesmo endpoint já
// usado em Vendas > PedidosVendaListPage.jsx pra "Agrupar NF" — mesma ideia
// aplicada a título financeiro em vez de pedido).
//
// tipoFixo trava o filtro de tipo e esconde o seletor — usado pelas rotas
// dedicadas /financeiro/titulos/pagar e /financeiro/titulos/receber. Sem
// tipoFixo (rota genérica /financeiro/titulos) o usuário escolhe o tipo.
export function TitulosPage({ tipoFixo, titulo }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [titulos, setTitulos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [q, setQ] = useState("");
  const [statusAtivo, setStatusAtivo] = useState("ABERTO");
  const [selecionados, setSelecionados] = useState(new Set());
  const [agrupando, setAgrupando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [verLogsDe, setVerLogsDe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  const idsVisiveis = useMemo(() => titulos.map((t) => t.id), [titulos]);
  const { mapa: ultimasEdicoes, carregando: carregandoUltimas } = useUltimasEdicoes("titulo", idsVisiveis);

  async function abrirLogs(id) {
    setVerLogsDe(id);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list("titulo", id);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    const timeout = setTimeout(() => {
      listTitulos({
        tipo: tipoFixo,
        status: statusAtivo || undefined,
        q: q.trim() || undefined,
        ordenarPor: "vencimento",
        ordem: "asc",
        pageSize: 200,
      })
        .then(({ items }) => {
          if (ativo) setTitulos(items);
        })
        .catch((err) => {
          if (ativo) toast.error(err.message ?? "Não foi possível carregar os títulos.");
        })
        .finally(() => ativo && setCarregando(false));
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFixo, statusAtivo, q, refreshKey]);

  useRealtimeInvalidate("/financeiro/titulos", () => setRefreshKey((k) => k + 1));

  function alternarSelecao(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const hojeIso = new Date().toISOString().slice(0, 10);
  const valorTotal = titulos.reduce((soma, t) => soma + Number(t.valor), 0);
  const emAberto = titulos.filter((t) => t.status === "ABERTO").reduce((soma, t) => soma + Number(t.valor), 0);
  const vencidos = titulos
    .filter((t) => t.status === "ABERTO" && t.vencimento.slice(0, 10) < hojeIso)
    .reduce((soma, t) => soma + Number(t.valor), 0);
  const baixado = titulos.filter((t) => t.status === "BAIXADO").reduce((soma, t) => soma + Number(t.valor), 0);
  const valorSelecao = titulos.filter((t) => selecionados.has(t.id)).reduce((soma, t) => soma + Number(t.valor), 0);

  async function handleAgrupar() {
    if (selecionados.size < 2) {
      toast.error("Selecione pelo menos 2 títulos do mesmo participante pra agrupar.");
      return;
    }
    setAgrupando(true);
    try {
      await agruparTitulos([...selecionados]);
      toast.success("Títulos agrupados com sucesso.");
      setSelecionados(new Set());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível agrupar os títulos selecionados.");
    } finally {
      setAgrupando(false);
    }
  }

  const columns = [
    {
      key: "_check",
      label: "",
      render: (row) => (
        <input type="checkbox" checked={selecionados.has(row.id)} onChange={(e) => { e.stopPropagation(); alternarSelecao(row.id); }} onClick={(e) => e.stopPropagation()} />
      ),
    },
    { key: "status", label: "Status", render: (row) => <StatusTituloBadge status={row.status} /> },
    { key: "numero", label: "Número" },
    { key: "vencimento", label: "Vencim.", render: (row) => formatarData(row.vencimento) },
    { key: "participante", label: "Participante", render: (row) => row.participante.razaoSocial },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
    ...(!tipoFixo ? [{ key: "tipo", label: "Tipo", render: (row) => (row.tipo === "PAGAR" ? "A pagar" : "A receber") }] : []),
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Contas à {tipoFixo === "RECEBER" ? "Receber" : "Pagar"}</span>
          <h1>{titulo ?? "Títulos financeiros"}</h1>
          <p>Gerados automaticamente no recebimento de compras e faturamento de vendas.</p>
        </div>
        <Button onClick={handleAgrupar} loading={agrupando} disabled={selecionados.size < 2}>
          Agrupar
        </Button>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <Input label="Fornecedor" placeholder="Buscar por número ou participante..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {STATUS_PILLS.map((pill) => (
            <Button
              key={pill.status}
              variant={statusAtivo === pill.status ? "primary" : "ghost"}
              size="sm"
              onClick={() => setStatusAtivo(statusAtivo === pill.status ? "" : pill.status)}
            >
              {pill.label}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "16px" }}>
        <span>
          Valor total: <strong>{formatarMoeda(valorTotal)}</strong>
        </span>
        <span>
          Em Aberto: <strong>{formatarMoeda(emAberto)}</strong>
        </span>
        <span style={{ color: "var(--color-danger)" }}>
          Vencidos: <strong>{formatarMoeda(vencidos)}</strong>
        </span>
        <span style={{ color: "var(--color-success)" }}>
          Baixado: <strong>{formatarMoeda(baixado)}</strong>
        </span>
        <span style={{ color: "var(--color-accent-hover)" }}>
          Valor Seleção: <strong>{formatarMoeda(valorSelecao)}</strong>
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={titulos}
        loading={carregando}
        onRowClick={(row) => navigate(`/financeiro/titulos/${row.id}`)}
        emptyMessage="Nenhum título encontrado."
      />

      <HistoricoModal
        open={Boolean(verLogsDe)}
        onClose={() => setVerLogsDe(null)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={{ status: "Status", valor: "Valor", vencimento: "Vencimento", formaPagamento: "Forma de pagamento" }}
      />
    </div>
  );
}
