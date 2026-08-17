import { apiClient } from "../../../lib/apiClient.js";

export function listInventarios(params) {
  return apiClient.get("/estoque/inventarios", { pageSize: 100, ...params });
}

export function getInventario(id) {
  return apiClient.get(`/estoque/inventarios/${id}`);
}

export function criarInventario(itens) {
  return apiClient.post("/estoque/inventarios", { itens });
}

export function fecharInventario(id) {
  return apiClient.post(`/estoque/inventarios/${id}/fechar`, {});
}
