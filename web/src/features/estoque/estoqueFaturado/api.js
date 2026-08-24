import { apiClient } from "../../../lib/apiClient.js";

export function consultarEstoqueFaturado({ produtoId } = {}) {
  return apiClient.get("/estoque/faturado", { produtoId });
}
