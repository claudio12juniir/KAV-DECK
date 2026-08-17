import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { listTransportadorasOptions } from "../transportadoras/api.js";
import { rotasEntregaApi } from "./api.js";

const fields = [
  { name: "nome", label: "Nome", required: true },
  { name: "transportadoraId", label: "Transportadora (opcional)", type: "select", options: listTransportadorasOptions },
];

export function RotasEntregaPage() {
  return (
    <SimpleCrudManager
      title="Rotas de entrega"
      description="Usadas nos pedidos de venda para organizar a entrega."
      api={rotasEntregaApi}
      fields={fields}
    />
  );
}
