import { apiClient } from "../../../lib/apiClient.js";

export const tributacaoProdutoApi = {
  list: (params) => apiClient.get("/fiscal/tributacao-produto", params),
  create: (data) => apiClient.post("/fiscal/tributacao-produto", data),
  update: (id, data) => apiClient.patch(`/fiscal/tributacao-produto/${id}`, data),
  remove: (id) => apiClient.delete(`/fiscal/tributacao-produto/${id}`),
};
