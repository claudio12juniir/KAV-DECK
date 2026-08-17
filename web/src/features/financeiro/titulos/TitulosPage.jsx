import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listTitulos } from "./api.js";
import { StatusTituloBadge } from "./StatusTituloBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TitulosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [titulos, setTitulos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listTitulos({ tipo: tipo || undefined, status: status || undefined })
      .then(({ items }) => {
        if (ativo) setTitulos(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os títulos.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, status]);

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
      <h1>Títulos financeiros</h1>
      <p>Gerados automaticamente no recebimento de compras e faturamento de vendas.</p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ maxWidth: "220px", flex: 1 }}>
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="PAGAR">A pagar</option>
            <option value="RECEBER">A receber</option>
          </Select>
        </div>
        <div style={{ maxWidth: "220px", flex: 1 }}>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ABERTO">Aberto</option>
            <option value="BAIXADO">Baixado</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
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
