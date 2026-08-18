import { Badge } from "./Badge.jsx";

const STATUS_VENDA = {
  ABERTO: { label: "Aberto", tone: "neutral" },
  SEPARACAO: { label: "Em separação", tone: "warning" },
  FATURADO: { label: "Faturado", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
};

const STATUS_COMPRA = {
  ABERTO: { label: "Aberto", tone: "neutral" },
  APROVADO: { label: "Aprovado", tone: "accent" },
  RECEBIDO_PARCIAL: { label: "Recebido parcialmente", tone: "warning" },
  RECEBIDO: { label: "Recebido", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
};

// Mesmos rótulos/tons do app web (StatusBadge de vendas e de compras).
export function StatusVendaBadge({ status }) {
  const info = STATUS_VENDA[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

export function StatusCompraBadge({ status }) {
  const info = STATUS_COMPRA[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
