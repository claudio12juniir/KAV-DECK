import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { contasBancariasApi } from "./api.js";

const fields = [
  { name: "banco", label: "Banco", required: true },
  { name: "agencia", label: "Agência", required: true },
  { name: "conta", label: "Conta", required: true },
];

export function ContasBancariasPage() {
  return (
    <SimpleCrudManager
      title="Contas bancárias"
      description="Usadas em cheques emitidos e movimentos de caixa."
      api={contasBancariasApi}
      resource="/financeiro/contas-bancarias"
      fields={fields}
    />
  );
}
