import { apiClient } from "../../../lib/apiClient.js";

export function listChequesTerceiros(params) {
  return apiClient.get("/financeiro/cheques-terceiros", { pageSize: 100, ...params });
}

export function criarChequeTerceiro(data) {
  return apiClient.post("/financeiro/cheques-terceiros", data);
}

export function atualizarStatusChequeTerceiro(id, status) {
  return apiClient.patch(`/financeiro/cheques-terceiros/${id}/status`, { status });
}
