import { apiClient } from "../../../lib/apiClient.js";

export function listFornecedores(params) {
  return apiClient.get("/participantes/fornecedores", { pageSize: 100, ...params });
}
