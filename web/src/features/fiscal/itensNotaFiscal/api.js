import { apiClient } from "../../../lib/apiClient.js";

export function listItensNotaFiscal(params) {
  return apiClient.get("/fiscal/notas/itens", { pageSize: 100, ...params });
}
