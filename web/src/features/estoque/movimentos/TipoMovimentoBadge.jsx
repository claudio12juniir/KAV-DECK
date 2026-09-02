import { Badge } from "../../../components/ui/Badge.jsx";

const TIPO_MAP = {
  ENTRADA: { label: "Entrada", tone: "success" },
  SAIDA: { label: "Saída", tone: "danger" },
  TRANSFERENCIA: { label: "Transferência", tone: "neutral" },
  PERDA: { label: "Perda", tone: "danger" },
  AJUSTE_INVENTARIO: { label: "Ajuste (inventário)", tone: "warning" },
  AJUSTE_MANUAL: { label: "Ajuste manual", tone: "warning" },
};

export function TipoMovimentoBadge({ tipo }) {
  const info = TIPO_MAP[tipo] ?? { label: tipo, tone: "neutral" };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
