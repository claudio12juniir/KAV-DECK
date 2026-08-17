import { apiClient } from "../../../lib/apiClient.js";

export const caixasEmbalagemApi = {
  list: (params) => apiClient.get("/estoque/caixas-embalagem", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/estoque/caixas-embalagem", data),
  update: (id, data) => apiClient.patch(`/estoque/caixas-embalagem/${id}`, data),
  remove: (id) => apiClient.delete(`/estoque/caixas-embalagem/${id}`),
};

export function registrarMovimentoComodato(tipoCaixaEmbalagemId, data) {
  return apiClient.post(`/estoque/caixas-embalagem/${tipoCaixaEmbalagemId}/movimentos`, data);
}
