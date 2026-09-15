import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { kanbanSeparadores, listColaboradores, separarPedidoVenda } from "../api.js";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarDataCurta(isoDia) {
  const [ano, mes, dia] = isoDia.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return `${dia}/${mes}/${ano} - ${data.toLocaleDateString("pt-BR", { weekday: "long" })}`;
}

const SEM_SEPARADOR = "SEM_SEPARADOR";

// Quadro kanban (mapeamento SpaceSoft seção 12) — único paradigma visual
// diferente da grade densa do resto do módulo de Vendas. Painel esquerdo
// lista os separadores cadastrados + o balde especial "Sem Separador";
// selecionar um mostra uma coluna por dia com os pedidos pendentes. Cartões
// são arrastáveis entre separadores (mesmo comportamento observado, embora
// não confirmado com certeza na sessão original de mapeamento).
export function TerminalSeparadoresPage() {
  const toast = useToast();
  const [separadores, setSeparadores] = useState([]);
  const [selecionado, setSelecionado] = useState(SEM_SEPARADOR);
  const [dataInicial, setDataInicial] = useState(hoje());
  const [dataFinal, setDataFinal] = useState(hoje());
  const [colunas, setColunas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [arrastando, setArrastando] = useState(null);

  useEffect(() => {
    listColaboradores({ tipo: "SEPARADOR", pageSize: 100 }).then(({ items }) => setSeparadores(items));
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    kanbanSeparadores({
      separadorId: selecionado === SEM_SEPARADOR ? undefined : selecionado,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
    })
      .then(({ colunas: dados }) => ativo && setColunas(dados))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar o quadro."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado, dataInicial, dataFinal, refreshKey]);

  async function atribuir(pedidoId, separadorId) {
    try {
      await separarPedidoVenda(pedidoId, separadorId);
      toast.success(separadorId ? "Pedido atribuído ao separador." : "Pedido movido para Sem Separador.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atribuir o pedido.");
    } finally {
      setArrastando(null);
    }
  }

  const totalPedidos = colunas.reduce((soma, coluna) => soma + coluna.pedidos.length, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1>Terminal de Separadores</h1>
          <p>Arraste um pedido para um separador na lista à esquerda pra atribuir o picking, ou clique num separador pra ver a agenda dele.</p>
        </div>
        <Button variant="ghost" onClick={() => toast.error("Impressão ainda não implementada nesta versão do KAV DECK.")}>
          Imprimir
        </Button>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <Card style={{ width: "220px", flexShrink: 0 }}>
          <h3 style={{ marginTop: 0 }}>Separadores</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
            <li>
              <button
                type="button"
                className="autocomplete-trocar"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: selecionado === SEM_SEPARADOR ? "var(--color-accent-soft)" : arrastando ? "var(--color-warning-soft)" : "transparent",
                }}
                onClick={() => setSelecionado(SEM_SEPARADOR)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => arrastando && atribuir(arrastando, undefined)}
              >
                Sem Separador
              </button>
            </li>
            {separadores.map((sep) => (
              <li key={sep.id}>
                <button
                  type="button"
                  className="autocomplete-trocar"
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: selecionado === sep.id ? "var(--color-accent-soft)" : arrastando ? "var(--color-warning-soft)" : "transparent",
                  }}
                  onClick={() => setSelecionado(sep.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => arrastando && atribuir(arrastando, sep.id)}
                >
                  {sep.nome}
                </button>
              </li>
            ))}
            {separadores.length === 0 && <li style={{ padding: "8px 12px", color: "var(--color-text-faint)" }}>Nenhum separador cadastrado.</li>}
          </ul>
        </Card>

        <div style={{ flex: 1, minWidth: "280px" }}>
          <Card style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
                <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong>
                  Pedidos ({totalPedidos ? 1 : 0} - {totalPedidos})
                </strong>
                <button type="button" className="icon-btn" title="Atualizar" onClick={() => setRefreshKey((k) => k + 1)}>
                  <FiRefreshCw />
                </button>
              </div>
            </div>
          </Card>

          {carregando && <p>Carregando...</p>}
          {!carregando && colunas.length === 0 && <p>Nenhum pedido pendente de separação neste período.</p>}

          {!carregando && colunas.length > 0 && (
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
              {colunas.map((coluna) => (
                <div key={coluna.data} style={{ minWidth: "240px", flexShrink: 0 }}>
                  <h4 style={{ marginBottom: "8px" }}>{formatarDataCurta(coluna.data)}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {coluna.pedidos.map((pedido) => (
                      <Card
                        key={pedido.pedidoId}
                        draggable
                        onDragStart={() => setArrastando(pedido.pedidoId)}
                        onDragEnd={() => setArrastando(null)}
                        style={{ cursor: "grab", padding: "12px" }}
                      >
                        <Link to={`/vendas/${pedido.pedidoId}`}>{pedido.cliente}</Link>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{pedido.status}</div>
                      </Card>
                    ))}
                    {coluna.pedidos.length === 0 && <p style={{ color: "var(--color-text-faint)" }}>—</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
