import { apiClient } from "../../../lib/apiClient.js";

export function listChequesEmitidos(params) {
  return apiClient.get("/financeiro/cheques-emitidos", { pageSize: 100, ...params });
}

export function criarChequeEmitido(data) {
  return apiClient.post("/financeiro/cheques-emitidos", data);
}

export function atualizarStatusChequeEmitido(id, status) {
  return apiClient.patch(`/financeiro/cheques-emitidos/${id}/status`, { status });
}
