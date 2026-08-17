import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { condicoesPagamentoApi } from "./api.js";

const fields = [
  { name: "descricao", label: "Descrição", required: true, placeholder: "Ex.: 30/60/90 dias" },
  { name: "numeroParcelas", label: "Número de parcelas", type: "number", required: true },
  { name: "intervaloDias", label: "Intervalo entre parcelas (dias)", type: "number", required: true },
];

export function CondicoesPagamentoPage() {
  return (
    <SimpleCrudManager
      title="Condições de pagamento"
      description="Usadas em pedidos de compra e venda para gerar os títulos."
      api={condicoesPagamentoApi}
      fields={fields}
    />
  );
}
