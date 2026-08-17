import { apiClient } from "../../../lib/apiClient.js";

export const produtosApi = {
  list: (params) => apiClient.get("/cadastros/produtos", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/cadastros/produtos", data),
  update: (id, data) => apiClient.patch(`/cadastros/produtos/${id}`, data),
  remove: (id) => apiClient.delete(`/cadastros/produtos/${id}`),
};
