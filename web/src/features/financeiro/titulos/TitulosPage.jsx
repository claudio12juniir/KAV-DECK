import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { listTitulos } from "./api.js";
import { StatusTituloBadge } from "./StatusTituloBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// tipoFixo trava o filtro de tipo e esconde o seletor — usado pelas rotas
// dedicadas /financeiro/titulos/pagar e /financeiro/titulos/receber. Sem
// tipoFixo (rota genérica /financeiro/titulos) o usuário escolhe o tipo.
export function TitulosPage({ tipoFixo, titulo }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [titulos, setTitulos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tipo, setTipo] = useState(tipoFixo ?? "");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [vencimentoInicial, setVencimentoInicial] = useState("");
  const [vencimentoFinal, setVencimentoFinal] = useState("");
  const [ordem, setOrdem] = useState("asc");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    const timeout = setTimeout(() => {
      listTitulos({
        tipo: tipo || undefined,
        status: status || undefined,
        q: q.trim() || undefined,
        vencimentoInicial: vencimentoInicial || undefined,
        vencimentoFinal: vencimentoFinal || undefined,
        ordenarPor: "vencimento",
        ordem,
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
  }, [tipo, status, q, vencimentoInicial, vencimentoFinal, ordem, refreshKey]);

  useRealtimeInvalidate("/financeiro/titulos", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "tipo", label: "Tipo", render: (row) => (row.tipo === "PAGAR" ? "A pagar" : "A receber") },
    { key: "participante", label: "Participante", render: (row) => row.participante.razaoSocial },
    { key: "numero", label: "Número" },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
    { key: "vencimento", label: "Vencimento", render: (row) => formatarData(row.vencimento) },
    { key: "status", label: "Status", render: (row) => <StatusTituloBadge status={row.status} /> },
  ];

  return (
    <div>
      <h1>{titulo ?? "Títulos financeiros"}</h1>
      <p>Gerados automaticamente no recebimento de compras e faturamento de vendas.</p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px", alignItems: "flex-end" }}>
        <div style={{ maxWidth: "260px", flex: 1 }}>
          <Input label="Buscar" placeholder="Número ou participante..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!tipoFixo && (
          <div style={{ maxWidth: "180px", flex: 1 }}>
            <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="PAGAR">A pagar</option>
              <option value="RECEBER">A receber</option>
            </Select>
          </div>
        )}
        <div style={{ maxWidth: "180px", flex: 1 }}>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ABERTO">Aberto</option>
            <option value="BAIXADO">Baixado</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
          </Select>
        </div>
        <div style={{ maxWidth: "170px", flex: 1 }}>
          <Input
            label="Vencimento de"
            type="date"
            value={vencimentoInicial}
            onChange={(e) => setVencimentoInicial(e.target.value)}
          />
        </div>
        <div style={{ maxWidth: "170px", flex: 1 }}>
          <Input
            label="Vencimento até"
            type="date"
            value={vencimentoFinal}
            onChange={(e) => setVencimentoFinal(e.target.value)}
          />
        </div>
        <div style={{ maxWidth: "180px", flex: 1 }}>
          <Select label="Ordenar por vencimento" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="asc">Mais próximo primeiro</option>
            <option value="desc">Mais distante primeiro</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={titulos}
        loading={carregando}
        onRowClick={(row) => navigate(`/financeiro/titulos/${row.id}`)}
        emptyMessage="Nenhum título encontrado."
      />
    </div>
  );
}
