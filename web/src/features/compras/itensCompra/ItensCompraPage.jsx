import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { FornecedorAutocomplete } from "../components/FornecedorAutocomplete.jsx";
import { listItensCompra } from "../api.js";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// Consulta de Itens de Compra / Terminal de Preços de Compra — mesma tabela
// de itens de pedido de compra vista por dois ângulos de filtro (mesmo
// componente único já usado em Vendas > ItensVendaPage.jsx para o mesmo
// caso). Colunas copiadas da referência (gravação Desktop 2026-09-15
// 16:15): QTD/UND/PRODUTO/VALOR/T.PARCIAL/FORNECEDOR/NÚMERO/DATA EMISS.
//
// Gap conhecido: OBS.PRODUTO/OBS.PEDIDO da referência não têm campo
// equivalente — ItemPedidoCompra não guarda observação (diferente de
// ItemPedidoVenda, que tem), e PedidoCompra não tem observação de cabeçalho.
export function ItensCompraPage({ variante, titulo, descricao }) {
  const toast = useToast();
  const comValorZero = variante === "precos";

  const [dataInicial, setDataInicial] = useState(hoje());
  const [dataFinal, setDataFinal] = useState(hoje());
  const [fornecedor, setFornecedor] = useState(null);
  const [produto, setProduto] = useState("");
  const [valorZero, setValorZero] = useState(comValorZero);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listItensCompra({
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
      fornecedorId: fornecedor?.participanteId,
      produto: produto || undefined,
      ...(comValorZero ? { valorZero: valorZero || undefined } : {}),
      pageSize: 200,
    })
      .then(({ items, total: totalRecebido }) => {
        if (!ativo) return;
        setItens(items);
        setTotal(totalRecebido ?? items.length);
      })
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os itens."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicial, dataFinal, fornecedor, produto, valorZero, refreshKey]);

  const columns = [
    { key: "quantidade", label: "Qtd." },
    { key: "und", label: "Und.", render: (row) => row.produto.unidadeMedida?.sigla ?? "—" },
    { key: "produto", label: "Produto", render: (row) => `${row.produto.codigo} — ${row.produto.descricao}` },
    {
      key: "valor",
      label: "Valor",
      render: (row) => (
        <>
          {formatarMoeda(row.precoUnitario)}
          {Number(row.precoUnitario) === 0 && <div style={{ color: "var(--color-warning)", fontSize: "var(--text-xs)" }}>Valor zero</div>}
        </>
      ),
    },
    {
      key: "parcial",
      label: "T. parcial",
      render: (row) => formatarMoeda(Number(row.quantidade) * Number(row.precoUnitario)),
    },
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.pedidoCompra.fornecedor.participante.razaoSocial },
    {
      key: "numero",
      label: "Número",
      render: (row) => <Link to={`/compras/${row.pedidoCompra.id}`}>{row.pedidoCompra.id.slice(0, 8)}</Link>,
    },
    { key: "dataEmiss", label: "Data emiss.", render: (row) => formatarData(row.pedidoCompra.dataEmissao) },
  ];

  return (
    <div>
      <div>
        <span className="eyebrow">Compra</span>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <div style={{ minWidth: "240px" }}>
          <FornecedorAutocomplete selecionado={fornecedor} onSelecionar={setFornecedor} onLimpar={() => setFornecedor(null)} />
        </div>
        <Input label="Produto" value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Buscar por descrição..." />
        {comValorZero && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={valorZero} onChange={(e) => setValorZero(e.target.checked)} />
            Valor igual a 0
          </label>
        )}
      </div>

      {comValorZero && valorZero && (
        <div style={{ marginBottom: "16px" }}>
          <Badge tone="warning">Mostrando só itens comprados por R$ 0,00 — confira antes de considerar erro.</Badge>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <strong>
          Itens ({itens.length ? 1 : 0} - {Math.min(total, itens.length)})
        </strong>
        <button type="button" className="icon-btn" title="Atualizar" onClick={() => setRefreshKey((k) => k + 1)}>
          <FiRefreshCw />
        </button>
      </div>

      <DataTable columns={columns} rows={itens} loading={carregando} emptyMessage="Nenhum item encontrado para este filtro." />
    </div>
  );
}
