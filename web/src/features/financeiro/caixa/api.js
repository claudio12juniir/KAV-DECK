import { apiClient } from "../../../lib/apiClient.js";

export function listMovimentosCaixa(params) {
  return apiClient.get("/financeiro/caixa/movimentos", { pageSize: 100, ...params });
}

export function criarMovimentoCaixa(data) {
  return apiClient.post("/financeiro/caixa/movimentos", data);
}
