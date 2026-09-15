import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { DataTable } from "../../components/ui/Table.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { listRastreabilidadeLotes } from "./api.js";
import { consultarPreviaEstoque } from "./previaEstoque/api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

// "Controle de Estoque por Lote" — master-detail igual ao Controle de
// Estoque (MovimentosPage.jsx), mas a grid da direita é por LOTE em vez de
// por lançamento (MAPEAMENTO_ESTOQUE_SPACESOFT.md seção 2, modo Entradas).
//
// Gap conhecido: o modo "Saídas" da referência não é o espelho deste modo —
// é uma fila global de saídas ainda sem lote vinculado ("Vincular lote"),
// uma funcionalidade nova e maior (consumo de lote hoje já acontece
// automaticamente por FEFO no faturamento, ver pedidosVenda/service.js).
// Botão fica visível pra bater com o layout, mas avisa que não está
// implementado — não é um "modo B" trivial desta mesma tela.
export function LotesPage() {
  const toast = useToast();
  const [produtos, setProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [produtoId, setProdutoId] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [carregandoLotes, setCarregandoLotes] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregandoProdutos(true);
    consultarPreviaEstoque()
      .then(({ items }) => ativo && setProdutos(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os produtos."))
      .finally(() => ativo && setCarregandoProdutos(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (!produtoId) {
      setLotes([]);
      return undefined;
    }
    let ativo = true;
    setCarregandoLotes(true);
    listRastreabilidadeLotes({ produtoId, pageSize: 100 })
      .then(({ items }) => ativo && setLotes(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os lotes."))
      .finally(() => ativo && setCarregandoLotes(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoId, refreshKey]);

  useRealtimeInvalidate("/estoque/lotes", () => setRefreshKey((k) => k + 1));

  const produtosFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    return produtos
      .filter((p) => !termo || p.descricao.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo))
      .sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [produtos, termoBusca]);

  const produtoSelecionado = produtos.find((p) => p.produtoId === produtoId) ?? null;

  function stub(nomeRecurso) {
    return () => toast.error(`${nomeRecurso} ainda não implementado nesta versão do KAV DECK.`);
  }

  const columns = [
    { key: "saldo", label: "Saldo", render: (row) => row.quantidadeAtual },
    { key: "qtdEntrada", label: "Qtd. entr.", render: (row) => row.quantidadeInicial },
    { key: "dataEntrada", label: "Data entr.", render: (row) => formatarData(row.dataRecebimento) },
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor?.participante.razaoSocial ?? "—" },
    { key: "natureza", label: "Natureza", render: () => "Compra" },
    { key: "observacao", label: "Observação", render: () => "—" },
    {
      key: "pedido",
      label: "Pedido",
      render: (row) => (row.pedidoCompraId ? <a href={`/compras/${row.pedidoCompraId}`}>Ver pedido</a> : "—"),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Controle de Estoque por Lote</h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="ghost" onClick={stub("Impressão")}>
            Imprimir
          </Button>
          <Button variant="ghost" onClick={() => setRefreshKey((k) => k + 1)}>
            Atualizar
          </Button>
          <Button variant="danger" onClick={stub("Fila de vínculo de lote (Saídas)")}>
            Saídas
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <Card style={{ width: "300px", flexShrink: 0 }}>
          <h3 style={{ marginTop: 0 }}>Produtos em Estoque</h3>
          <div style={{ marginBottom: "12px" }}>
            <input
              className="field-control"
              placeholder="Buscar produto..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "560px", overflowY: "auto" }}>
            {carregandoProdutos && <p style={{ color: "var(--color-text-faint)" }}>Carregando...</p>}
            {!carregandoProdutos && produtosFiltrados.length === 0 && (
              <p style={{ color: "var(--color-text-faint)" }}>Nenhum produto encontrado.</p>
            )}
            {produtosFiltrados.map((p) => (
              <button
                key={p.produtoId}
                type="button"
                onClick={() => setProdutoId(p.produtoId)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  padding: "10px 12px",
                  border: "none",
                  borderLeft: p.produtoId === produtoId ? "3px solid var(--color-accent)" : "3px solid transparent",
                  background: p.produtoId === produtoId ? "var(--color-accent-soft)" : "transparent",
                  borderRadius: "4px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <strong style={{ color: p.produtoId === produtoId ? "var(--color-accent-hover)" : "var(--color-text)" }}>
                  {p.descricao}
                </strong>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                  Saldo {p.saldoAtual} {p.unidadeMedida?.sigla ?? ""}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div style={{ flex: 1, minWidth: 0 }}>
          {!produtoSelecionado ? (
            <Card>
              <p style={{ margin: 0, color: "var(--color-text-faint)" }}>Selecione um produto à esquerda para ver os lotes.</p>
            </Card>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>{produtoSelecionado.descricao}</h2>
              <DataTable columns={columns} rows={lotes} loading={carregandoLotes} emptyMessage="Nenhum lote encontrado para este produto." />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
