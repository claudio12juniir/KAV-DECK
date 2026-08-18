import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { transportadorasApi } from "./api.js";

const fields = [
  { name: "razaoSocial", label: "Razão social", required: true },
  { name: "cnpj", label: "CNPJ", required: true },
  { name: "ativo", label: "Ativa", type: "checkbox", default: true },
];

export function TransportadorasPage() {
  return (
    <SimpleCrudManager
      title="Transportadoras"
      description="Usadas nas rotas de entrega."
      api={transportadorasApi}
      resource="/participantes/transportadoras"
      fields={fields}
    />
  );
}
