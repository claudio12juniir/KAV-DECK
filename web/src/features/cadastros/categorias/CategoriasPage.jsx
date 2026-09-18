import { Badge } from "../../../components/ui/Badge.jsx";
import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { categoriasApi } from "./api.js";

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

export function CategoriasPage() {
  return (
    <SimpleCrudManager
      title="Categorias"
      description="Usadas para classificar os produtos e nos relatórios de curva ABC."
      api={categoriasApi}
      resource="/cadastros/categorias"
      fields={fields}
      columns={columns}
      entidade="categoria"
    />
  );
}
