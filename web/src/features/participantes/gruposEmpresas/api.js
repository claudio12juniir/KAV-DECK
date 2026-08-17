import { apiClient } from "../../../lib/apiClient.js";

export const gruposEmpresasApi = {
  list: (params) => apiClient.get("/participantes/grupos-empresas", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/participantes/grupos-empresas", data),
  update: (id, data) => apiClient.patch(`/participantes/grupos-empresas/${id}`, data),
  remove: (id) => apiClient.delete(`/participantes/grupos-empresas/${id}`),
};
