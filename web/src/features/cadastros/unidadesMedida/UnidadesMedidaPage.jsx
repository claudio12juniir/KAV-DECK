import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { unidadesMedidaApi } from "./api.js";

const fields = [
  { name: "sigla", label: "Sigla", required: true, placeholder: "KG, CX, UN..." },
  { name: "descricao", label: "Descrição", required: true },
  { name: "fatorConversao", label: "Fator de conversão", type: "number" },
];

export function UnidadesMedidaPage() {
  return (
    <SimpleCrudManager
      title="Unidades de medida"
      description="Usadas no cadastro de produtos."
      api={unidadesMedidaApi}
      fields={fields}
    />
  );
}
