import { apiClient } from "../../../lib/apiClient.js";

export function consultarEstoqueFaturado({ produtoId, departamentoId, produto, ordenacao } = {}) {
  return apiClient.get("/estoque/faturado", { produtoId, departamentoId, produto, ordenacao });
}
