import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { centrosCustoApi } from "./api.js";

const fields = [
  { name: "codigo", label: "Código", required: true },
  { name: "nome", label: "Nome", required: true },
];

export function CentrosCustoPage() {
  return (
    <SimpleCrudManager
      title="Centros de custo"
      description="Usados para rateio de despesas nos relatórios financeiros."
      api={centrosCustoApi}
      resource="/financeiro/centros-custo"
      fields={fields}
    />
  );
}
