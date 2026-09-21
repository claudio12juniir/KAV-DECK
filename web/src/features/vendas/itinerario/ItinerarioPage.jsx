import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HistoricoModal } from "../../../components/audit/Historico.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { logsApi } from "../../cadastros/logs/api.js";
import {
  atualizarItinerario,
  consultarItinerarios,
  criarItinerario,
  gerarAutomaticoItinerario,
  gerarFaturaItinerario,
  listRotasEntrega,
} from "../api.js";

const TURNOS = ["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Roteiro de entrega — entidade persistida (mapeamento SpaceSoft seção 14).
// "Gerar automático" monta um itinerário por rota a partir dos pedidos já
// faturados do dia; "Adicionar itinerário" cria um registro manual vazio
// pra anexar pedidos depois. Selecionar itinerários da mesma transportadora
// e gerar a fatura de frete fecha o ciclo com Contas a Pagar.
export function ItinerarioPage() {
  const toast = useToast();
  const [data, setData] = useState(hoje());
  const [periodo, setPeriodo] = useState("");
  const [rotaEntregaId, setRotaEntregaId] = useState("");
  const [rotas, setRotas] = useState([]);
  const [itinerarios, setItinerarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selecionados, setSelecionados] = useState(new Set());
  const [gerandoAutomatico, setGerandoAutomatico] = useState(false);
  const [gerandoFatura, setGerandoFatura] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [rotaManual, setRotaManual] = useState("");
  const [placaManual, setPlacaManual] = useState("");
  const [criandoManual, setCriandoManual] = useState(false);
  const [verLogsDe, setVerLogsDe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  async function abrirLogs(id) {
    setVerLogsDe(id);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list("itinerario", id);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  useEffect(() => {
    listRotasEntrega({ pageSize: 100 }).then(({ items }) => setRotas(items));
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    consultarItinerarios({
      dataInicial: data || undefined,
      dataFinal: data || undefined,
      periodo: periodo || undefined,
      rotaEntregaId: rotaEntregaId || undefined,
    })
      .then(({ items }) => ativo && setItinerarios(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os itinerários."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, periodo, rotaEntregaId, refreshKey]);

  function alternarSelecao(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function handleGerarAutomatico() {
    setGerandoAutomatico(true);
    try {
      const { items } = await gerarAutomaticoItinerario({ data, periodo: periodo || undefined });
      toast.success(`${items.length} itinerário(s) gerado(s) automaticamente.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível gerar o itinerário automaticamente.");
    } finally {
      setGerandoAutomatico(false);
      setMostrarMenu(false);
    }
  }

  async function handleCriarManual() {
    if (!rotaManual) return;
    setCriandoManual(true);
    try {
      await criarItinerario({ data, periodo: periodo || undefined, rotaEntregaId: rotaManual, placaVeiculo: placaManual || undefined });
      toast.success("Itinerário criado.");
      setMostrarFormManual(false);
      setRotaManual("");
      setPlacaManual("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível criar o itinerário.");
    } finally {
      setCriandoManual(false);
    }
  }

  async function handleAtualizarCampo(id, campo, valor) {
    try {
      await atualizarItinerario(id, { [campo]: valor });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o itinerário.");
    }
  }

  async function handleGerarFatura() {
    if (selecionados.size === 0) return;
    setGerandoFatura(true);
    try {
      const titulo = await gerarFaturaItinerario([...selecionados]);
      toast.success(`Fatura de frete gerada: ${formatarMoeda(titulo.valor)}.`);
      setSelecionados(new Set());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível gerar a fatura de frete.");
    } finally {
      setGerandoFatura(false);
    }
  }

  const valorSelecionado = itinerarios
    .filter((it) => selecionados.has(it.id))
    .reduce((soma, it) => soma + Number(it.valorFrete || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1>Itinerário</h1>
          <p>Roteiro de entrega do dia, agrupado por rota — monte automaticamente ou anexe pedidos manualmente.</p>
        </div>
        <div style={{ position: "relative" }}>
          <Button onClick={() => setMostrarMenu((v) => !v)}>Menu ▾</Button>
          {mostrarMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.15))",
                zIndex: 10,
                minWidth: "220px",
              }}
            >
              <button type="button" className="autocomplete-trocar" style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px" }} onClick={() => { setMostrarFormManual(true); setMostrarMenu(false); }}>
                Adicionar itinerário
              </button>
              <button type="button" className="autocomplete-trocar" style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px" }} onClick={handleGerarAutomatico} disabled={gerandoAutomatico}>
                {gerandoAutomatico ? "Gerando..." : "Gerar automático"}
              </button>
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Select label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="">Todos</option>
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="Rota" value={rotaEntregaId} onChange={(e) => setRotaEntregaId(e.target.value)}>
            <option value="">Todas</option>
            {rotas.map((rota) => (
              <option key={rota.id} value={rota.id}>
                {rota.nome}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {mostrarFormManual && (
        <Card style={{ marginBottom: "24px" }}>
          <h3 style={{ marginTop: 0 }}>Adicionar itinerário</h3>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <Select label="Rota" value={rotaManual} onChange={(e) => setRotaManual(e.target.value)}>
              <option value="">Selecione...</option>
              {rotas.map((rota) => (
                <option key={rota.id} value={rota.id}>
                  {rota.nome}
                </option>
              ))}
            </Select>
            <Input label="Placa do veículo (opcional)" value={placaManual} onChange={(e) => setPlacaManual(e.target.value)} />
            <Button onClick={handleCriarManual} loading={criandoManual} disabled={!rotaManual}>
              Adicionar
            </Button>
            <Button variant="ghost" onClick={() => setMostrarFormManual(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {selecionados.size > 0 && (
        <Card style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span>
            {selecionados.size} itinerário(s) selecionado(s) — Valor do frete: <strong>{formatarMoeda(valorSelecionado)}</strong>
          </span>
          <Button onClick={handleGerarFatura} loading={gerandoFatura}>
            Gerar Fatura
          </Button>
        </Card>
      )}

      {carregando && <p>Carregando...</p>}
      {!carregando && itinerarios.length === 0 && <p>Nenhum itinerário encontrado para este filtro.</p>}

      {!carregando &&
        itinerarios.map((it) => (
          <Card key={it.id} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={selecionados.has(it.id)}
                  onChange={() => alternarSelecao(it.id)}
                  disabled={!it.transportadoraId || it.faturaGerada}
                  style={{ marginTop: "6px" }}
                />
                <div>
                  <h3 style={{ margin: 0 }}>{it.rotaEntrega.nome}</h3>
                  <p style={{ margin: "4px 0 0" }}>
                    {new Date(it.data).toLocaleDateString("pt-BR")} {it.periodo ? `— ${it.periodo}` : ""}
                    {" · "}
                    {it.transportadora?.razaoSocial ?? "Sem transportadora"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {it.faturaGerada && <Badge tone="success">Fatura gerada</Badge>}
                <button type="button" className="autocomplete-trocar" onClick={() => abrirLogs(it.id)}>
                  Histórico
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
              <Input
                label="Placa"
                defaultValue={it.placaVeiculo ?? ""}
                onBlur={(e) => e.target.value !== (it.placaVeiculo ?? "") && handleAtualizarCampo(it.id, "placaVeiculo", e.target.value)}
                style={{ width: "140px" }}
              />
              <Input
                label="Valor do frete"
                type="number"
                defaultValue={it.valorFrete}
                onBlur={(e) => Number(e.target.value) !== Number(it.valorFrete) && handleAtualizarCampo(it.id, "valorFrete", e.target.value)}
                style={{ width: "140px" }}
                disabled={it.faturaGerada}
              />
            </div>

            <div style={{ marginTop: "12px" }}>
              <strong>Pedidos ({it.pedidos.length})</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
                {it.pedidos.map((pedido) => (
                  <li key={pedido.id}>
                    <Link to={`/vendas/${pedido.id}`}>{pedido.cliente.participante.razaoSocial}</Link>
                  </li>
                ))}
                {it.pedidos.length === 0 && <li>Nenhum pedido vinculado ainda.</li>}
              </ul>
            </div>
          </Card>
        ))}

      <HistoricoModal
        open={Boolean(verLogsDe)}
        onClose={() => setVerLogsDe(null)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={{ placaVeiculo: "Placa", valorFrete: "Valor do frete" }}
      />
    </div>
  );
}
