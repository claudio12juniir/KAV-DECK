import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { caixasEmbalagemApi } from "./api.js";
import { MovimentoComodatoAcao } from "./MovimentoComodatoAcao.jsx";

const fields = [
  { name: "nome", label: "Nome", required: true },
  { name: "capacidade", label: "Capacidade (opcional)", type: "number" },
];

const columns = [
  { key: "nome", label: "Nome" },
  { key: "capacidade", label: "Capacidade" },
  { key: "_movimento", label: "", render: (row) => <MovimentoComodatoAcao tipoCaixaEmbalagemId={row.id} /> },
];

export function CaixasEmbalagemPage() {
  return (
    <SimpleCrudManager
      title="Caixas e embalagens"
      description="Controle de comodato de paletes e caixas plásticas com clientes e fornecedores."
      api={caixasEmbalagemApi}
      fields={fields}
      columns={columns}
    />
  );
}
