import { RegraFiscalPage } from "./RegraFiscalPage.jsx";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cst", label: "CST", required: true },
  { name: "aliquota", label: "Alíquota (%)", type: "number", required: true },
  { name: "vigenciaInicio", label: "Vigência — início", type: "date", required: true },
  { name: "vigenciaFim", label: "Vigência — fim", type: "date" },
];

// Mesma observação do IBS (ver IbsPage.jsx): cadastro preparatório da
// reforma tributária, ainda não usado no cálculo automático de imposto.
export function CbsPage() {
  return (
    <RegraFiscalPage
      title="CBS"
      description="Contribuição sobre Bens e Serviços (reforma tributária) — cadastro preparatório."
      resource="/cadastros/regras-cbs"
      fields={fields}
    />
  );
}
