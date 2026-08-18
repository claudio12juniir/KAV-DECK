import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge.jsx";
import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { tabelasPrecoApi } from "./api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

const fields = [
  { name: "nome", label: "Nome", required: true },
  { name: "vigenciaInicio", label: "Início da vigência", type: "date", required: true },
  { name: "vigenciaFim", label: "Fim da vigência (opcional)", type: "date" },
  { name: "ativa", label: "Ativa", type: "checkbox", default: true },
];

const columns = [
  { key: "nome", label: "Nome" },
  { key: "vigenciaInicio", label: "Início", render: (row) => formatarData(row.vigenciaInicio) },
  { key: "vigenciaFim", label: "Fim", render: (row) => formatarData(row.vigenciaFim) },
  {
    key: "ativa",
    label: "Situação",
    render: (row) => <Badge tone={row.ativa ? "success" : "neutral"}>{row.ativa ? "Ativa" : "Inativa"}</Badge>,
  },
  {
    key: "_itens",
    label: "",
    render: (row) => (
      <Link to={`/cadastros/tabelas-preco/${row.id}/itens`} className="autocomplete-trocar">
        Gerenciar preços
      </Link>
    ),
  },
];

export function TabelasPrecoPage() {
  return (
    <SimpleCrudManager
      title="Tabelas de preço"
      description="Listas de preço independentes do cadastro de produto."
      api={tabelasPrecoApi}
      resource="/cadastros/tabelas-preco"
      fields={fields}
      columns={columns}
    />
  );
}
