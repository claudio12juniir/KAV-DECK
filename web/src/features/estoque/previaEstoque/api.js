import { apiClient } from "../../../lib/apiClient.js";

export function consultarPreviaEstoque({ produtoId } = {}) {
  return apiClient.get("/estoque/previa", { produtoId });
}
