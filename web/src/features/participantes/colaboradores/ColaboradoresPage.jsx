import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { colaboradoresApi } from "./api.js";

const fields = [
  { name: "nome", label: "Nome", required: true },
  {
    name: "tipo",
    label: "Função",
    type: "select",
    required: true,
    options: [
      { value: "COMPRADOR", label: "Comprador" },
      { value: "VENDEDOR", label: "Vendedor" },
      { value: "REPRESENTANTE", label: "Representante" },
      { value: "SEPARADOR", label: "Separador" },
    ],
  },
  { name: "ativo", label: "Ativo", type: "checkbox", default: true },
];

export function ColaboradoresPage() {
  return (
    <SimpleCrudManager
      title="Colaboradores"
      description="Compradores, vendedores, representantes e separadores vinculados a pedidos."
      api={colaboradoresApi}
      resource="/participantes/colaboradores"
      fields={fields}
    />
  );
}
