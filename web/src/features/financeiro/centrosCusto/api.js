import { apiClient } from "../../../lib/apiClient.js";

export const centrosCustoApi = {
  list: (params) => apiClient.get("/financeiro/centros-custo", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/financeiro/centros-custo", data),
  update: (id, data) => apiClient.patch(`/financeiro/centros-custo/${id}`, data),
  remove: (id) => apiClient.delete(`/financeiro/centros-custo/${id}`),
};
