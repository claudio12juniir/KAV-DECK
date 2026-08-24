import { RegraFiscalPage } from "./RegraFiscalPage.jsx";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cst", label: "CST", required: true, placeholder: "00, 49, 50..." },
  { name: "aliquota", label: "Alíquota (%)", type: "number", required: true },
];

export function IpiPage() {
  return (
    <RegraFiscalPage
      title="IPI"
      description="Regras de IPI usadas na tributação de produtos por CFOP."
      resource="/cadastros/regras-ipi"
      fields={fields}
    />
  );
}
