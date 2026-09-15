import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { consultarPreviaEstoque } from "../previaEstoque/api.js";
import { ajustarEstoque, listLotes, listMovimentos } from "../api.js";
import { TipoMovimentoBadge } from "./TipoMovimentoBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function origemMovimento(row) {
  if (row.pedidoCompraId) return "Compra";
  if (row.pedidoVendaId) return "Venda";
  if (row.inventarioFisicoId) return "Inventário físico";
  return row.motivo ? "Ajuste manual" : "—";
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

// Kardex por produto — layout copiado do "Controle de Estoque" de
// referência (MAPEAMENTO_ESTOQUE_SPACESOFT.md seção 1): painel esquerdo com
// a lista de produtos + saldo (sem autocomplete ao vivo na referência — só
// filtra o que já foi carregado, replicado aqui igual), painel direito com
// 4 caixas de resumo (Anterior/Entrada/Saída/Saldo) e a grid de lançamentos.
//
// Gaps conhecidos vs. a referência: sem coluna EMPRESA (KAV DECK é
// single-tenant por empresa, não existe o conceito de filial/departamento
// visto lá) e sem QTD EST. (não existe distinção "estimado vs. recebido" no
// schema de movimento — só uma quantidade). "Anterior" é calculado no
// cliente a partir da janela de lançamentos carregada (saldo atual menos
// entradas mais saídas dessa janela), não é um valor histórico exato da
// data de corte — não existe endpoint de saldo-em-uma-data no backend.
export function MovimentosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [produtos, setProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [exibirZerados, setExibirZerados] = useState(true);
  const [produtoId, setProdutoId] = useState(null);
  const [movimentos, setMovimentos] = useState([]);
  const [carregandoMovimentos, setCarregandoMovimentos] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ordenacao, setOrdenacao] = useState("lancamento");

  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [mostrarImprimir, setMostrarImprimir] = useState(false);
  const [mostrarDownload, setMostrarDownload] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarOrdenar, setMostrarOrdenar] = useState(false);

  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);
  const [lotesDoProduto, setLotesDoProduto] = useState([]);
  const [loteEscolhido, setLoteEscolhido] = useState("");
  const [tipoAjuste, setTipoAjuste] = useState("ENTRADA");
  const [quantidadeAjuste, setQuantidadeAjuste] = useState("");
  const [motivoAjuste, setMotivoAjuste] = useState("");
  const [salvandoAjuste, setSalvandoAjuste] = useState(false);

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
      setMovimentos([]);
      return undefined;
    }
    let ativo = true;
    setCarregandoMovimentos(true);
    listMovimentos({ produtoId, pageSize: 100 })
      .then(({ items }) => ativo && setMovimentos(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os lançamentos."))
      .finally(() => ativo && setCarregandoMovimentos(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoId, refreshKey]);

  useRealtimeInvalidate("/estoque/movimentos", () => setRefreshKey((k) => k + 1));

  const produtosFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    return produtos
      .filter((p) => (exibirZerados ? true : Number(p.saldoAtual) !== 0))
      .filter((p) => !termo || p.descricao.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo))
      .sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [produtos, termoBusca, exibirZerados]);

  const produtoSelecionado = produtos.find((p) => p.produtoId === produtoId) ?? null;

  const movimentosOrdenados =
    ordenacao === "tipo" ? [...movimentos].sort((a, b) => a.tipo.localeCompare(b.tipo)) : movimentos;

  const totalEntrada = movimentos.reduce((soma, m) => {
    if (m.tipo === "ENTRADA") return soma + Number(m.quantidade);
    if (m.tipo.startsWith("AJUSTE") && Number(m.quantidade) > 0) return soma + Number(m.quantidade);
    return soma;
  }, 0);
  const totalSaida = movimentos.reduce((soma, m) => {
    if (m.tipo === "SAIDA") return soma + Number(m.quantidade);
    if (m.tipo.startsWith("AJUSTE") && Number(m.quantidade) < 0) return soma + Math.abs(Number(m.quantidade));
    return soma;
  }, 0);
  const saldoAtual = Number(produtoSelecionado?.saldoAtual ?? 0);
  const saldoAnterior = saldoAtual - totalEntrada + totalSaida;

  function stub(nomeRecurso) {
    return () => {
      toast.error(`${nomeRecurso} ainda não implementado nesta versão do KAV DECK.`);
      setMostrarImprimir(false);
      setMostrarDownload(false);
      setMostrarOpcoes(false);
    };
  }

  function handleLancarPedidoCompra() {
    setMostrarOpcoes(false);
    navigate("/compras/novo", { state: { produto: { id: produtoSelecionado.produtoId, codigo: produtoSelecionado.codigo, descricao: produtoSelecionado.descricao } } });
  }

  async function abrirModalAjuste() {
    setMostrarAjuste(false);
    setModalAjusteAberto(true);
    setLoteEscolhido("");
    setQuantidadeAjuste("");
    setMotivoAjuste("");
    try {
      const { items } = await listLotes({ produtoId, pageSize: 100 });
      setLotesDoProduto(items);
      setLoteEscolhido(items[0]?.id ?? "");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os lotes deste produto.");
    }
  }

  async function handleSalvarAjuste() {
    if (!loteEscolhido || !quantidadeAjuste || motivoAjuste.trim().length < 3) return;
    setSalvandoAjuste(true);
    try {
      const magnitude = Math.abs(Number(quantidadeAjuste));
      const quantidade = tipoAjuste === "SAIDA" ? -magnitude : magnitude;
      await ajustarEstoque({ loteId: loteEscolhido, quantidade: String(quantidade), motivo: motivoAjuste.trim() });
      toast.success("Ajuste registrado.");
      setModalAjusteAberto(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar o ajuste.");
    } finally {
      setSalvandoAjuste(false);
    }
  }

  const columns = [
    { key: "tipo", label: "Tipo", render: (row) => <TipoMovimentoBadge tipo={row.tipo} /> },
    { key: "quantidade", label: "Qtd." },
    { key: "und", label: "Und.", render: (row) => row.produto.unidadeMedida?.sigla ?? "—" },
    { key: "observacao", label: "Observação", render: (row) => row.motivo ?? "—" },
    { key: "natureza", label: "Natureza", render: origemMovimento },
    {
      key: "pedido",
      label: "Pedido",
      render: (row) => {
        if (row.pedidoCompraId) return <a href={`/compras/${row.pedidoCompraId}`}>Ver pedido</a>;
        if (row.pedidoVendaId) return <a href={`/vendas/${row.pedidoVendaId}`}>Ver pedido</a>;
        return "—";
      },
    },
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Controle de Estoque</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {produtoSelecionado && (
            <div style={{ position: "relative" }}>
              <Button variant="ghost" onClick={() => setMostrarAjuste((v) => !v)}>
                Ajuste ▾
              </Button>
              {mostrarAjuste && (
                <DropdownMenu items={["Adicionar ajuste"]} onSelect={abrirModalAjuste} onClose={() => setMostrarAjuste(false)} />
              )}
            </div>
          )}
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarImprimir((v) => !v)} disabled={!produtoSelecionado}>
              Imprimir ▾
            </Button>
            {mostrarImprimir && <DropdownMenu items={["Padrão"]} onSelect={stub("Impressão")} onClose={() => setMostrarImprimir(false)} />}
          </div>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarDownload((v) => !v)} disabled={!produtoSelecionado}>
              Download ▾
            </Button>
            {mostrarDownload && <DropdownMenu items={["Padrão"]} onSelect={stub("Download")} onClose={() => setMostrarDownload(false)} />}
          </div>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarOpcoes((v) => !v)} disabled={!produtoSelecionado}>
              Opções ▾
            </Button>
            {mostrarOpcoes && (
              <DropdownMenu
                items={["Exibir preços", "Lançar Pedido de Compra"]}
                onSelect={(item) => (item === "Lançar Pedido de Compra" ? handleLancarPedidoCompra() : stub(item)())}
                onClose={() => setMostrarOpcoes(false)}
              />
            )}
          </div>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarOrdenar((v) => !v)} disabled={!produtoSelecionado}>
              Ordenar ▾
            </Button>
            {mostrarOrdenar && (
              <DropdownMenu
                items={["Ordenar por lançamento", "Ordenar por tipo"]}
                onSelect={(item) => {
                  setOrdenacao(item === "Ordenar por tipo" ? "tipo" : "lancamento");
                  setMostrarOrdenar(false);
                }}
                onClose={() => setMostrarOrdenar(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <Card style={{ width: "300px", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <Input label="Pesquisar por produto" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} placeholder="Nome ou código..." />
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={exibirZerados} onChange={(e) => setExibirZerados(e.target.checked)} />
              Exibir itens zerados
            </label>
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
          {!produtoSelecionado && (
            <Card>
              <p style={{ margin: 0, color: "var(--color-text-faint)" }}>Selecione um produto à esquerda para ver o kardex.</p>
            </Card>
          )}

          {produtoSelecionado && (
            <>
              <h2 style={{ marginTop: 0 }}>
                {produtoSelecionado.descricao} ({produtoSelecionado.unidadeMedida?.sigla ?? "—"})
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <Card style={{ padding: "16px" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", textTransform: "uppercase" }}>Anterior</div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>{saldoAnterior}</div>
                </Card>
                <Card style={{ padding: "16px", borderColor: "var(--color-success)" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-success)", textTransform: "uppercase" }}>Entrada</div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-success)" }}>{totalEntrada}</div>
                </Card>
                <Card style={{ padding: "16px", borderColor: "var(--color-danger)" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", textTransform: "uppercase" }}>Saída</div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-danger)" }}>{totalSaida}</div>
                </Card>
                <Card style={{ padding: "16px", borderColor: "var(--color-accent-line)" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-accent-hover)", textTransform: "uppercase" }}>Saldo</div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-accent-hover)" }}>{saldoAtual}</div>
                </Card>
              </div>

              <DataTable
                columns={columns}
                rows={movimentosOrdenados}
                loading={carregandoMovimentos}
                emptyMessage="Nenhum lançamento encontrado para este produto."
              />
            </>
          )}
        </div>
      </div>

      <Modal
        open={modalAjusteAberto}
        onClose={() => setModalAjusteAberto(false)}
        title={`Adicionar ajuste — ${produtoSelecionado?.descricao ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAjusteAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarAjuste}
              loading={salvandoAjuste}
              disabled={!loteEscolhido || !quantidadeAjuste || motivoAjuste.trim().length < 3}
            >
              Salvar ajuste
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Select label="Lote" value={loteEscolhido} onChange={(e) => setLoteEscolhido(e.target.value)}>
            {lotesDoProduto.length === 0 && <option value="">Nenhum lote com saldo</option>}
            {lotesDoProduto.map((l) => (
              <option key={l.id} value={l.id}>
                Saldo {l.quantidadeAtual} — recebido em {formatarData(l.dataRecebimento)}
              </option>
            ))}
          </Select>
          <Select label="Tipo" value={tipoAjuste} onChange={(e) => setTipoAjuste(e.target.value)}>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </Select>
          <Input label="Quantidade" type="number" min="0" step="0.01" value={quantidadeAjuste} onChange={(e) => setQuantidadeAjuste(e.target.value)} />
          <Input label="Justificativa" value={motivoAjuste} onChange={(e) => setMotivoAjuste(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
