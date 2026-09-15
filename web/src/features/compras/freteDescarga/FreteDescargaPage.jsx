import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { consultarFreteDescarga, gerarFaturaFrete, listTransportadoras } from "../api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Controle de Frete/Descarga — layout copiado da referência (gravação
// Desktop 2026-09-15 16:15): busca por Transportadora, grid de pedidos com
// frete pendente de fatura, seleção + "Gerar Fatura".
//
// Gap conhecido: a referência tem um toggle Frete/Descarga (dois modos
// distintos) — no KAV DECK só existe o conceito de frete no pedido de
// compra (campo valorFrete), sem um valor de "descarga" separado no schema,
// então o toggle não tem o que alternar; mantido só o modo Frete.
export function FreteDescargaPage() {
  const toast = useToast();
  const [transportadoraId, setTransportadoraId] = useState("");
  const [transportadoras, setTransportadoras] = useState([]);
  const [itens, setItens] = useState([]);
  const [valorTotal, setValorTotal] = useState("0.00");
  const [carregando, setCarregando] = useState(true);
  const [selecionados, setSelecionados] = useState(new Set());
  const [gerando, setGerando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listTransportadoras({ pageSize: 100 }).then(({ items }) => setTransportadoras(items));
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    consultarFreteDescarga({ transportadoraId: transportadoraId || undefined })
      .then(({ itens: lista, valorTotal: total }) => {
        if (!ativo) return;
        setItens(lista);
        setValorTotal(total);
      })
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os fretes."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportadoraId, refreshKey]);

  function alternarSelecao(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const valorSelecionado = itens.filter((i) => selecionados.has(i.id)).reduce((soma, i) => soma + Number(i.valorFrete), 0);

  async function handleGerarFatura() {
    if (selecionados.size === 0) return;
    setGerando(true);
    try {
      const titulo = await gerarFaturaFrete([...selecionados]);
      toast.success(`Fatura de frete gerada (título ${titulo.numero}).`);
      setSelecionados(new Set());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível gerar a fatura.");
    } finally {
      setGerando(false);
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
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor.participante.razaoSocial },
    { key: "dataPed", label: "Data ped.", render: (row) => formatarData(row.dataEmissao) },
    { key: "frete", label: "Valor frete", render: (row) => formatarMoeda(row.valorFrete) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Compra</span>
          <h1>Controle de Frete / Descarga</h1>
          <p>Fretes pendentes de fatura à transportadora — um pedido de compra por linha.</p>
        </div>
        <Button onClick={handleGerarFatura} loading={gerando} disabled={selecionados.size === 0}>
          Gerar Fatura
        </Button>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <Select label="Transportadora" value={transportadoraId} onChange={(e) => setTransportadoraId(e.target.value)} style={{ minWidth: "280px" }}>
          <option value="">Todas</option>
          {transportadoras.map((t) => (
            <option key={t.id} value={t.id}>
              {t.razaoSocial}
            </option>
          ))}
        </Select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <strong>Itens ({itens.length})</strong>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>
            Valor Total: <strong>{formatarMoeda(valorTotal)}</strong>
          </span>
          <span style={{ color: "var(--color-accent-hover)" }}>
            Valor Selecionado: <strong>{formatarMoeda(valorSelecionado)}</strong>
          </span>
        </div>
      </div>

      <DataTable columns={columns} rows={itens} loading={carregando} emptyMessage="Nenhum frete pendente de fatura." />
    </div>
  );
}
