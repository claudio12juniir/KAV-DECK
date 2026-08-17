import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { listDepartamentosOptions } from "../departamentos/api.js";
import { categoriasApi } from "./api.js";

const fields = [
  { name: "codigo", label: "Código", required: true },
  { name: "nome", label: "Nome", required: true },
  { name: "departamentoId", label: "Departamento", type: "select", required: true, options: listDepartamentosOptions },
];

const columns = [
  { key: "codigo", label: "Código" },
  { key: "nome", label: "Nome" },
];

export function CategoriasPage() {
  return (
    <SimpleCrudManager
      title="Categorias"
      description="Usadas para classificar os produtos e nos relatórios de curva ABC."
      api={categoriasApi}
      fields={fields}
      columns={columns}
    />
  );
}
