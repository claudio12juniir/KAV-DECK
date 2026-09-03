import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { consultarItinerario, listRotasEntrega } from "../api.js";

const TURNOS = ["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

// Roteiro do dia: agrupa pedidos faturados prontos pra entrega por
// rota e turno — o "Itinerário" é sempre derivado de rotaEntregaId/turno já
// gravados no pedido, não uma tela de montar sequência de paradas manual.
export function ItinerarioPage() {
  const toast = useToast();
  const [data, setData] = useState(hoje());
  const [turno, setTurno] = useState("");
  const [rotaEntregaId, setRotaEntregaId] = useState("");
  const [rotas, setRotas] = useState([]);
  const [itinerario, setItinerario] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    listRotasEntrega({ pageSize: 100 }).then(({ items }) => setRotas(items));
  }, []);

  useEffect(() => {
    if (!data) return undefined;
    let ativo = true;
    setCarregando(true);
    consultarItinerario({ data, turno: turno || undefined, rotaEntregaId: rotaEntregaId || undefined })
      .then(({ items }) => ativo && setItinerario(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar o itinerário."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, turno, rotaEntregaId]);

  return (
    <div>
      <h1>Itinerário</h1>
      <p>Pedidos faturados prontos pra entrega, agrupados por rota e turno.</p>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Select label="Turno" value={turno} onChange={(e) => setTurno(e.target.value)}>
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

      {carregando && <p>Carregando...</p>}

      {!carregando && itinerario.length === 0 && (
        <p>Nenhum pedido faturado com rota/turno definidos para esta data.</p>
      )}

      {!carregando &&
        itinerario.map((grupoRota) => (
          <Card key={grupoRota.rotaEntregaId} style={{ marginBottom: "16px" }}>
            <h3 style={{ marginTop: 0 }}>{grupoRota.rota}</h3>
            {grupoRota.turnos.map((grupoTurno) => (
              <div key={grupoTurno.turno} style={{ marginBottom: "12px" }}>
                <strong>{grupoTurno.turno === "SEM_TURNO" ? "Sem turno definido" : grupoTurno.turno}</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
                  {grupoTurno.pedidos.map((pedido) => (
                    <li key={pedido.pedidoId}>
                      <Link to={`/vendas/${pedido.pedidoId}`}>{pedido.cliente}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        ))}
    </div>
  );
}
