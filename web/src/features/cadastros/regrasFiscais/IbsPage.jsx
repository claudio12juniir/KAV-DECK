import { RegraFiscalPage } from "./RegraFiscalPage.jsx";

const fields = [
  { name: "descricao", label: "Descrição", required: true },
  { name: "cst", label: "CST", required: true },
  { name: "aliquota", label: "Alíquota (%)", type: "number", required: true },
  { name: "vigenciaInicio", label: "Vigência — início", type: "date", required: true },
  { name: "vigenciaFim", label: "Vigência — fim", type: "date" },
];

// IBS entra em vigor com a reforma tributária (Emenda Constitucional
// 132/2023) — o cadastro já existe pra deixar a base pronta, mas ainda não
// é usado no cálculo automático de imposto do item de NF-e (ver
// src/modules/fiscal/notasFiscais/service.js), só o ICMS/IPI/PIS/COFINS
// tradicionais são.
export function IbsPage() {
  return (
    <RegraFiscalPage
      title="IBS"
      description="Imposto sobre Bens e Serviços (reforma tributária) — cadastro preparatório."
      resource="/cadastros/regras-ibs"
      fields={fields}
    />
  );
}
