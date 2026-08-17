import { Badge } from "../../../components/ui/Badge.jsx";

const STATUS_MAP = {
  EM_DIGITACAO: { label: "Em digitação", tone: "neutral" },
  EM_PROCESSAMENTO: { label: "Em processamento", tone: "warning" },
  AUTORIZADO: { label: "Autorizado", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
  USO_DENEGADO: { label: "Uso denegado", tone: "danger" },
  REJEICAO: { label: "Rejeitado", tone: "danger" },
  ARQUIVO_CRIADO: { label: "Arquivo criado", tone: "neutral" },
};

export function StatusNotaBadge({ status }) {
  const info = STATUS_MAP[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
