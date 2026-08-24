import { Badge } from "../../../components/ui/Badge.jsx";
import { SimpleCrudManager } from "../../../components/crud/SimpleCrudManager.jsx";
import { listCategoriasOptions } from "../categorias/api.js";
import { listUnidadesMedidaOptions } from "../unidadesMedida/api.js";
import { produtosApi } from "./api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const fields = [
  { name: "codigo", label: "Código", required: true },
  { name: "descricao", label: "Descrição", required: true },
  { name: "unidadeMedidaId", label: "Unidade de medida", type: "select", required: true, options: listUnidadesMedidaOptions },
  { name: "categoriaId", label: "Categoria", type: "select", required: true, options: listCategoriasOptions },
  { name: "precoReferencia", label: "Preço de referência", type: "number" },
  { name: "estoqueMinimo", label: "Estoque mínimo", type: "number" },
  { name: "estoqueMaximo", label: "Estoque máximo", type: "number" },
  { name: "perecivel", label: "Perecível", type: "checkbox" },
  { name: "controlaLote", label: "Controla por lote", type: "checkbox" },
  { name: "ativo", label: "Ativo", type: "checkbox", default: true },
];

const columns = [
  { key: "codigo", label: "Código" },
  { key: "descricao", label: "Descrição" },
  {
    key: "precoReferencia",
    label: "Preço ref.",
    render: (row) => (row.precoReferencia === undefined ? "—" : formatarMoeda(row.precoReferencia)),
  },
  {
    key: "ativo",
    label: "Situação",
    render: (row) => <Badge tone={row.ativo ? "success" : "neutral"}>{row.ativo ? "Ativo" : "Inativo"}</Badge>,
  },
];

export function ProdutosPage() {
  return (
    <SimpleCrudManager
      title="Produtos"
      description="Catálogo de produtos usado em pedidos de compra e venda."
      api={produtosApi}
      resource="/cadastros/produtos"
      fields={fields}
      columns={columns}
      searchable
    />
  );
}
