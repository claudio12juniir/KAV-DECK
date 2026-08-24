import { RegraFiscalPage } from "./RegraFiscalPage.jsx";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cst", label: "CST", required: true, placeholder: "01, 06, 07..." },
  { name: "aliquota", label: "Alíquota (%)", type: "number", required: true },
];

export function PisPage() {
  return (
    <RegraFiscalPage
      title="PIS"
      description="Regras de PIS usadas na tributação de produtos por CFOP."
      resource="/cadastros/regras-pis"
      fields={fields}
    />
  );
}
