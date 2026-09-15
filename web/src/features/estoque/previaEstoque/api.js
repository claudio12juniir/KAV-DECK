import { apiClient } from "../../../lib/apiClient.js";

export function consultarPreviaEstoque({ produtoId, departamentoId, produto, exibirSemMovimento } = {}) {
  return apiClient.get("/estoque/previa", { produtoId, departamentoId, produto, exibirSemMovimento });
}
