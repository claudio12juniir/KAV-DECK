import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { baixarLoteTitulos, listTitulos } from "./api.js";
import { FORMA_BAIXA_LABEL, FORMAS_BAIXA } from "./formaBaixa.js";
import { StatusTituloBadge } from "./StatusTituloBadge.jsx";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Baixa de Títulos a Pagar — layout copiado da referência (gravação Desktop
// 2026-09-15 16:15): busca por participante + período, seleção múltipla de
// títulos em aberto, forma/data de baixa aplicada a todos de uma vez,
// "Baixar Selecionados" chama o endpoint de baixa em lote que já existe no
// backend (baixarLote — ver financeiro/titulos/service.js).
//
// Gap conhecido: a referência organiza a baixa em "Lotes" (agrupamentos
// nomeados, com histórico próprio) — aqui simplificado pra uma seleção
// direta na lista de títulos em aberto, sem o conceito de lote nomeado
// (BaixaTitulo no schema não tem essa entidade "lote", só data/forma por
// baixa individual).
export function BaixaTitulosPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState(hoje());
  const [formaBaixa, setFormaBaixa] = useState("BOLETO");
  const [dataBaixa, setDataBaixa] = useState(hoje());
  const [titulos, setTitulos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionados, setSelecionados] = useState(new Set());
  const [baixando, setBaixando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    const timeout = setTimeout(() => {
      listTitulos({
        tipo: "PAGAR",
        status: "ABERTO",
        q: q.trim() || undefined,
        vencimentoInicial: dataInicial || undefined,
        vencimentoFinal: dataFinal || undefined,
        pageSize: 200,
      })
        .then(({ items }) => ativo && setTitulos(items))
        .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os títulos."))
        .finally(() => ativo && setCarregando(false));
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dataInicial, dataFinal, refreshKey]);

  useRealtimeInvalidate("/financeiro/titulos", () => setRefreshKey((k) => k + 1));

  function alternarSelecao(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const emAberto = titulos.reduce((soma, t) => soma + Number(t.valor), 0);
  const valorSelecao = titulos.filter((t) => selecionados.has(t.id)).reduce((soma, t) => soma + Number(t.valor), 0);

  async function handleBaixar() {
    if (selecionados.size === 0) return;
    setBaixando(true);
    try {
      const baixas = titulos
        .filter((t) => selecionados.has(t.id))
        .map((t) => ({ tituloId: t.id, valorBaixado: String(t.valor), formaBaixa, dataBaixa }));
      const resultado = await baixarLoteTitulos(baixas);
      toast.success(`${resultado.processados} título(s) baixado(s).`);
      setSelecionados(new Set());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível baixar os títulos selecionados.");
    } finally {
      setBaixando(false);
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
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.participante.razaoSocial },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Contas à Pagar</span>
          <h1>Baixa de Títulos a Pagar</h1>
        </div>
        <Button onClick={handleBaixar} loading={baixando} disabled={selecionados.size === 0}>
          Baixar Selecionados
        </Button>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <Input label="Nome da pessoa/empresa" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por fornecedor ou número..." />
        <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <Select label="Forma de baixa" value={formaBaixa} onChange={(e) => setFormaBaixa(e.target.value)}>
          {FORMAS_BAIXA.map((f) => (
            <option key={f} value={f}>
              {FORMA_BAIXA_LABEL[f]}
            </option>
          ))}
        </Select>
        <Input label="Data da baixa" type="date" value={dataBaixa} onChange={(e) => setDataBaixa(e.target.value)} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <strong>Títulos ({titulos.length})</strong>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ color: "var(--color-danger)" }}>
            Em Aberto: <strong>{formatarMoeda(emAberto)}</strong>
          </span>
          <span style={{ color: "var(--color-accent-hover)" }}>
            Valor Seleção: <strong>{formatarMoeda(valorSelecao)}</strong>
          </span>
        </div>
      </div>

      <DataTable columns={columns} rows={titulos} loading={carregando} emptyMessage="Nenhum título em aberto para este filtro." />
    </div>
  );
}
