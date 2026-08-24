import { RegraFiscalPage } from "./RegraFiscalPage.jsx";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cst", label: "CST", required: true, placeholder: "01, 06, 07..." },
  { name: "aliquota", label: "Alíquota (%)", type: "number", required: true },
];

export function CofinsPage() {
  return (
    <RegraFiscalPage
      title="COFINS"
      description="Regras de COFINS usadas na tributação de produtos por CFOP."
      resource="/cadastros/regras-cofins"
      fields={fields}
    />
  );
}
