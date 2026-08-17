import { Badge } from "../../../components/ui/Badge.jsx";

const STATUS_MAP = {
  ABERTO: { label: "Aberto", tone: "neutral" },
  APROVADO: { label: "Aprovado", tone: "accent" },
  RECEBIDO_PARCIAL: { label: "Recebido parcialmente", tone: "warning" },
  RECEBIDO: { label: "Recebido", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
};

export function StatusBadge({ status }) {
  const info = STATUS_MAP[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
