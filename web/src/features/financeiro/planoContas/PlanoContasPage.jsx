import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { planoContasApi, listPlanoContasOptions } from "./api.js";

const fields = [
  { name: "codigo", label: "Código", required: true },
  { name: "nome", label: "Nome", required: true },
  { name: "tipo", label: "Tipo", required: true, placeholder: "Receita, Despesa..." },
  { name: "contaPaiId", label: "Conta pai (opcional)", type: "select", options: listPlanoContasOptions },
];

export function PlanoContasPage() {
  return (
    <SimpleCrudManager
      title="Plano de contas"
      description="Estrutura hierárquica usada nos relatórios financeiros."
      api={planoContasApi}
      resource="/financeiro/plano-contas"
      fields={fields}
    />
  );
}
