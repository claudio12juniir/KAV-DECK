import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { listCfopOptions } from "../cfop/api.js";
import { naturezasOperacaoApi } from "./api.js";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cfopPadraoId", label: "CFOP padrão", type: "select", required: true, options: listCfopOptions },
];

export function NaturezasOperacaoPage() {
  return (
    <SimpleCrudManager
      title="Naturezas de operação"
      description="Usadas para classificar cada nota fiscal emitida."
      api={naturezasOperacaoApi}
      resource="/fiscal/naturezas-operacao"
      fields={fields}
      columns={[{ key: "descricao", label: "Descrição" }]}
    />
  );
}
