import { Badge } from "../../../components/ui/Badge.jsx";

const STATUS_MAP = {
  ABERTO: { label: "Aberto", tone: "neutral" },
  BAIXADO: { label: "Baixado", tone: "success" },
  VENCIDO: { label: "Vencido", tone: "danger" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
};

export function StatusTituloBadge({ status }) {
  const info = STATUS_MAP[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
