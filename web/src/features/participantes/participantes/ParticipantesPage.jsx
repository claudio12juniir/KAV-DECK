import { Badge } from "../../../components/ui/Badge.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { participantesApi, tornarCliente, tornarFornecedor } from "./api.js";

const fields = [
  {
    name: "tipoPessoa",
    label: "Tipo de pessoa",
    type: "select",
    required: true,
    default: "JURIDICA",
    options: [
      { value: "JURIDICA", label: "Pessoa jurídica" },
      { value: "FISICA", label: "Pessoa física" },
    ],
  },
  { name: "razaoSocial", label: "Razão social / nome", required: true },
  { name: "nomeFantasia", label: "Nome fantasia (opcional)" },
  { name: "cpfCnpj", label: "CPF/CNPJ", required: true },
  { name: "ie", label: "Inscrição estadual (opcional)" },
  { name: "limiteCredito", label: "Limite de crédito", type: "number" },
  { name: "isProdutorRural", label: "É produtor rural", type: "checkbox" },
  { name: "ativo", label: "Ativo", type: "checkbox", default: true },
];

function PromoverAcoes({ participanteId }) {
  const toast = useToast();

  async function handleTornarCliente() {
    try {
      await tornarCliente(participanteId);
      toast.success("Participante agora é cliente.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível promover a cliente.");
    }
  }

  async function handleTornarFornecedor() {
    try {
      await tornarFornecedor(participanteId);
      toast.success("Participante agora é fornecedor.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível promover a fornecedor.");
    }
  }

  return (
    <div className="crud-row-actions">
      <button type="button" className="autocomplete-trocar" onClick={handleTornarCliente}>
        Tornar cliente
      </button>
      <button type="button" className="autocomplete-trocar" onClick={handleTornarFornecedor}>
        Tornar fornecedor
      </button>
    </div>
  );
}

const columns = [
  { key: "razaoSocial", label: "Nome" },
  { key: "cpfCnpj", label: "CPF/CNPJ" },
  { key: "tipoPessoa", label: "Tipo", render: (row) => (row.tipoPessoa === "JURIDICA" ? "Jurídica" : "Física") },
  {
    key: "ativo",
    label: "Situação",
    render: (row) => <Badge tone={row.ativo ? "success" : "neutral"}>{row.ativo ? "Ativo" : "Inativo"}</Badge>,
  },
  { key: "_promover", label: "", render: (row) => <PromoverAcoes participanteId={row.id} /> },
];

export function ParticipantesPage() {
  return (
    <SimpleCrudManager
      title="Participantes"
      description="Cadastro-base de clientes e fornecedores. Depois de criado, promova para cliente e/ou fornecedor."
      api={participantesApi}
      fields={fields}
      columns={columns}
      searchable
    />
  );
}
