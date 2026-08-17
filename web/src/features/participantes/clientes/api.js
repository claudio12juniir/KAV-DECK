import { apiClient } from "../../../lib/apiClient.js";

export function listClientes(params) {
  return apiClient.get("/participantes/clientes", { pageSize: 100, ...params });
}

export function atualizarBloqueio(id, bloqueioFinanceiro) {
  return apiClient.patch(`/participantes/clientes/${id}/bloqueio`, { bloqueioFinanceiro });
}
