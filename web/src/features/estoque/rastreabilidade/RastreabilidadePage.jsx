import { useEffect, useState } from "react";
import { Card } from "../../../components/ui/Card.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { getRastreabilidadePorLote, listRastreabilidadeLotes } from "../api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

// Diferente do Space Soft (onde rastreabilidade depende de um passo manual
// "Gerar lotes"/"Vincular lotes" que na prática não é executado — ver
// MAPEAMENTO_ESTOQUE_SPACESOFT.md seção 8), aqui a árvore de movimentos por
// lote já existe automaticamente desde que o lote é criado no recebimento:
// esta tela só consulta o que já está lá, sem etapa de "publicar" nada.
export function RastreabilidadePage() {
  const toast = useToast();
  const [produto, setProduto] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [carregandoLotes, setCarregandoLotes] = useState(false);
  const [loteSelecionadoId, setLoteSelecionadoId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    if (!produto) {
      setLotes([]);
      return undefined;
    }
    let ativo = true;
    setCarregandoLotes(true);
    setLoteSelecionadoId(null);
    setDetalhe(null);
    listRastreabilidadeLotes({ produtoId: produto.id, pageSize: 100 })
      .then(({ items }) => {
        if (ativo) setLotes(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os lotes.");
      })
      .finally(() => ativo && setCarregandoLotes(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto]);

  function selecionarLote(loteId) {
    setLoteSelecionadoId(loteId);
    setCarregandoDetalhe(true);
    getRastreabilidadePorLote(loteId)
      .then(setDetalhe)
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar o histórico deste lote."))
      .finally(() => setCarregandoDetalhe(false));
  }

  const columnsLotes = [
    { key: "idLote", label: "Lote", render: (row) => row.id.slice(0, 8) },
    { key: "dataLote", label: "Data do lote", render: (row) => formatarData(row.dataRecebimento) },
    { key: "saldoDisponivel", label: "Saldo disponível", render: (row) => row.quantidadeAtual },
  ];

  const columnsMovimentos = [
    { key: "tipo", label: "Tipo" },
    { key: "quantidade", label: "Quantidade" },
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
    {
      key: "destino",
      label: "Origem / destino",
      render: (row) => {
        if (row.pedidoCompra) return `Compra — ${row.pedidoCompra.fornecedor.participante.razaoSocial}`;
        if (row.pedidoVenda) return `Venda — ${row.pedidoVenda.cliente.participante.razaoSocial}`;
        return row.motivo || "—";
      },
    },
  ];

  return (
    <div>
      <h1>Rastreabilidade</h1>
      <p>Busque um produto, escolha um lote e veja a linha do tempo completa: de onde entrou até todos os destinos.</p>

      <Card style={{ marginBottom: "24px" }}>
        {produto ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <strong>{produto.descricao}</strong>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{produto.codigo}</div>
            </div>
            <button type="button" className="autocomplete-trocar" onClick={() => setProduto(null)}>
              Trocar produto
            </button>
          </div>
        ) : (
          <ProdutoAutocomplete onSelecionar={setProduto} label="Buscar produto" />
        )}
      </Card>

      {produto && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)", gap: "24px", alignItems: "flex-start" }}>
          <div>
            <h3>Lotes</h3>
            <DataTable
              columns={columnsLotes}
              rows={lotes}
              loading={carregandoLotes}
              onRowClick={(row) => selecionarLote(row.id)}
              emptyMessage="Nenhum lote encontrado para este produto."
            />
          </div>

          <div>
            <h3>Linha do tempo do lote</h3>
            {!loteSelecionadoId && <p>Selecione um lote na lista ao lado.</p>}
            {loteSelecionadoId && carregandoDetalhe && (
              <Card>
                <SkeletonLines count={5} />
              </Card>
            )}
            {loteSelecionadoId && !carregandoDetalhe && detalhe && (
              <>
                <Card style={{ marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", fontSize: "var(--text-sm)" }}>
                    <div><strong>Fornecedor:</strong> {detalhe.lote.fornecedor?.participante.razaoSocial ?? "—"}</div>
                    <div><strong>Validade:</strong> {formatarData(detalhe.lote.dataValidade)}</div>
                    <div><strong>SIF:</strong> {detalhe.lote.sif ?? "—"}</div>
                    <div><strong>Temperatura de recebimento:</strong> {detalhe.lote.temperaturaRecebimento ?? "—"}</div>
                    <div><strong>Veículo:</strong> {detalhe.lote.veiculo ?? "—"}</div>
                    <div><strong>Saldo atual / inicial:</strong> {detalhe.lote.quantidadeAtual} / {detalhe.lote.quantidadeInicial}</div>
                  </div>
                </Card>
                <DataTable
                  columns={columnsMovimentos}
                  rows={detalhe.movimentos}
                  emptyMessage="Este lote ainda não tem movimentos registrados."
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
