import { apiClient } from "../../../lib/apiClient.js";

export const precosCompraApi = {
  list: (params) => apiClient.get("/compras/precos", { pageSize: 100, ...params }),
  upsert: (data) => apiClient.patch("/compras/precos", data),
  remove: (id) => apiClient.delete(`/compras/precos/${id}`),
};
