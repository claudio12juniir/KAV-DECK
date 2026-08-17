import { apiClient } from "../../../lib/apiClient.js";

export const colaboradoresApi = {
  list: (params) => apiClient.get("/participantes/colaboradores", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/participantes/colaboradores", data),
  update: (id, data) => apiClient.patch(`/participantes/colaboradores/${id}`, data),
  remove: (id) => apiClient.delete(`/participantes/colaboradores/${id}`),
};
