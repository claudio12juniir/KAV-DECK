import { RegraFiscalPage } from "./RegraFiscalPage.jsx";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cstOrigem", label: "CST origem", required: true, placeholder: "0, 1, 2..." },
  { name: "cstTributacao", label: "CST tributação", required: true, placeholder: "00, 10, 20..." },
  { name: "aliquota", label: "Alíquota (%)", type: "number", required: true },
  { name: "baseCalculo", label: "Redução da base de cálculo (%)", type: "number", required: true },
  { name: "modalidade", label: "Modalidade", required: true, placeholder: "Valor da operação, pauta..." },
];

export function IcmsPage() {
  return (
    <RegraFiscalPage
      title="ICMS"
      description="Regras de ICMS usadas na tributação de produtos por CFOP."
      resource="/cadastros/regras-icms"
      fields={fields}
    />
  );
}
