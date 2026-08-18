import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { departamentosApi } from "./api.js";

const fields = [
  { name: "codigo", label: "Código", required: true },
  { name: "nome", label: "Nome", required: true },
];

export function DepartamentosPage() {
  return (
    <SimpleCrudManager
      title="Departamentos"
      description="Agrupamento de categorias de produtos."
      api={departamentosApi}
      resource="/cadastros/departamentos"
      fields={fields}
    />
  );
}
