import { apiClient } from "../../../lib/apiClient.js";

export const participantesApi = {
  list: (params) => apiClient.get("/participantes", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/participantes", data),
  update: (id, data) => apiClient.patch(`/participantes/${id}`, data),
  remove: (id) => apiClient.delete(`/participantes/${id}`),
};

export function tornarCliente(id) {
  return apiClient.post(`/participantes/${id}/cliente`, {});
}

export function tornarFornecedor(id) {
  return apiClient.post(`/participantes/${id}/fornecedor`, {});
}
