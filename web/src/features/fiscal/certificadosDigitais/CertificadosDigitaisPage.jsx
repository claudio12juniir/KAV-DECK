import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { certificadosDigitaisApi } from "./api.js";

const fields = [
  { name: "nome", label: "Nome", required: true },
  { name: "dataVencimento", label: "Data de vencimento", type: "date", required: true },
];

export function CertificadosDigitaisPage() {
  return (
    <SimpleCrudManager
      title="Certificados digitais"
      description="Cadastro do certificado A1 usado na assinatura das notas fiscais. Sem exposição de conteúdo/senha."
      api={certificadosDigitaisApi}
      fields={fields}
    />
  );
}
