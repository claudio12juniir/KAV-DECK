import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { gruposEmpresasApi } from "./api.js";

const fields = [{ name: "nome", label: "Nome", required: true }];

export function GruposEmpresasPage() {
  return (
    <SimpleCrudManager
      title="Grupos de empresas"
      description="Agrupa participantes para consolidar limite de crédito."
      api={gruposEmpresasApi}
      fields={fields}
    />
  );
}
