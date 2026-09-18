import { Badge } from "../../../components/ui/Badge.jsx";
import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { departamentosApi } from "./api.js";

const fields = [
  { name: "codigo", label: "Código", required: true },
  { name: "nome", label: "Nome", required: true },
  { name: "ativo", label: "Ativo", type: "checkbox", default: true },
];

const columns = [
  { key: "nome", label: "Nome" },
  {
    key: "ativo",
    label: "Ativo",
    render: (row) => <Badge tone={row.ativo ? "success" : "neutral"}>{row.ativo ? "Sim" : "Não"}</Badge>,
  },
];

export function DepartamentosPage() {
  return (
    <SimpleCrudManager
      title="Departamentos"
      description="Classificação de produtos independente da categoria, usada em relatórios e filtros."
      api={departamentosApi}
      resource="/cadastros/departamentos"
      fields={fields}
      columns={columns}
      entidade="departamento"
    />
  );
}
