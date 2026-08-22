import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { colaboradoresApi } from "./api.js";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function custoMensalTotal(colaborador) {
  return (
    Number(colaborador.valorSalario ?? 0) +
    Number(colaborador.valorValeAlimentacao ?? 0) +
    Number(colaborador.valorValeTransporte ?? 0) +
    Number(colaborador.valorInss ?? 0) +
    Number(colaborador.valorOutrosEncargos ?? 0)
  );
}

const TIPO_LABEL = {
  COMPRADOR: "Comprador",
  VENDEDOR: "Vendedor",
  REPRESENTANTE: "Representante",
  SEPARADOR: "Separador",
};

const fields = [
  { name: "nome", label: "Nome", required: true },
  {
    name: "tipo",
    label: "Função",
    type: "select",
    required: true,
    options: [
      { value: "COMPRADOR", label: "Comprador" },
      { value: "VENDEDOR", label: "Vendedor" },
      { value: "REPRESENTANTE", label: "Representante" },
      { value: "SEPARADOR", label: "Separador" },
    ],
  },
  { name: "valorSalario", label: "Salário (R$/mês)", type: "number", placeholder: "0,00" },
  { name: "valorValeAlimentacao", label: "Vale-alimentação (R$/mês)", type: "number", placeholder: "0,00" },
  { name: "valorValeTransporte", label: "Vale-transporte (R$/mês)", type: "number", placeholder: "0,00" },
  { name: "valorInss", label: "INSS (R$/mês)", type: "number", placeholder: "0,00" },
  { name: "valorOutrosEncargos", label: "Outros encargos (R$/mês)", type: "number", placeholder: "0,00" },
  { name: "ativo", label: "Ativo", type: "checkbox", default: true },
];

// Colunas customizadas na tabela (em vez de derivar 1:1 de `fields`) pra não
// mostrar todos os 5 valores individuais na listagem — só o total mensal,
// que é o que importa numa olhada rápida; o detalhamento fica no modal de
// edição.
const columns = [
  { key: "nome", label: "Nome" },
  { key: "tipo", label: "Função", render: (row) => TIPO_LABEL[row.tipo] ?? row.tipo },
  { key: "custoMensal", label: "Custo mensal", render: (row) => formatarMoeda(custoMensalTotal(row)) },
  {
    key: "ativo",
    label: "Status",
    render: (row) => (row.ativo ? "Ativo" : "Inativo"),
  },
];

export function ColaboradoresPage() {
  return (
    <SimpleCrudManager
      title="Colaboradores"
      description="Compradores, vendedores, representantes e separadores vinculados a pedidos."
      api={colaboradoresApi}
      resource="/participantes/colaboradores"
      fields={fields}
      columns={columns}
    />
  );
}
