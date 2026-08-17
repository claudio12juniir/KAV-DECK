import { apiClient } from "../../lib/apiClient.js";

export function listLotes({ produtoId, page, pageSize } = {}) {
  return apiClient.get("/estoque/lotes", { produtoId, page, pageSize });
}
