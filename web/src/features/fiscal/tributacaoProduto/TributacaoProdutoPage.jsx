import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { listProdutosOptions } from "../../cadastros/produtos/api.js";
import {
  listRegrasCofinsOptions,
  listRegrasIcmsOptions,
  listRegrasIpiOptions,
  listRegrasPisOptions,
} from "../../cadastros/regrasFiscais/api.js";
import { listCfopOptions } from "../cfop/api.js";
import { tributacaoProdutoApi } from "./api.js";

const fields = [
  { name: "produtoId", label: "Produto", type: "select", required: true, options: listProdutosOptions },
  { name: "cfopId", label: "CFOP", type: "select", required: true, options: listCfopOptions },
  { name: "icmsId", label: "Regra de ICMS", type: "select", options: listRegrasIcmsOptions },
  { name: "ipiId", label: "Regra de IPI", type: "select", options: listRegrasIpiOptions },
  { name: "pisId", label: "Regra de PIS", type: "select", options: listRegrasPisOptions },
  { name: "cofinsId", label: "Regra de COFINS", type: "select", options: listRegrasCofinsOptions },
];

const columns = [
  { key: "produto", label: "Produto", render: (row) => `${row.produto.codigo} — ${row.produto.descricao}` },
  { key: "cfop", label: "CFOP", render: (row) => `${row.cfop.codigo} — ${row.cfop.descricao}` },
  { key: "icms", label: "ICMS", render: (row) => (row.icms ? `${row.icms.descricao} (${row.icms.aliquota}%)` : "—") },
  { key: "ipi", label: "IPI", render: (row) => (row.ipi ? `${row.ipi.descricao} (${row.ipi.aliquota}%)` : "—") },
  { key: "pis", label: "PIS", render: (row) => (row.pis ? `${row.pis.descricao} (${row.pis.aliquota}%)` : "—") },
  {
    key: "cofins",
    label: "COFINS",
    render: (row) => (row.cofins ? `${row.cofins.descricao} (${row.cofins.aliquota}%)` : "—"),
  },
];

// Diz qual regra de ICMS/IPI/PIS/COFINS vale quando um produto sai por um
// CFOP específico — sem um registro aqui pra essa combinação, o item de
// NF-e continua indo com os valores de imposto zerados/manuais (ver
// src/modules/fiscal/notasFiscais/service.js).
export function TributacaoProdutoPage() {
  return (
    <SimpleCrudManager
      title="Tributação de produtos"
      description="Vincula cada produto, por CFOP, às regras de ICMS/IPI/PIS/COFINS usadas no cálculo automático da NF-e."
      api={tributacaoProdutoApi}
      resource="/fiscal/tributacao-produto"
      fields={fields}
      columns={columns}
    />
  );
}
