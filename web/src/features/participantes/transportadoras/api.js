import { apiClient } from "../../../lib/apiClient.js";

export const transportadorasApi = {
  list: (params) => apiClient.get("/participantes/transportadoras", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/participantes/transportadoras", data),
  update: (id, data) => apiClient.patch(`/participantes/transportadoras/${id}`, data),
  remove: (id) => apiClient.delete(`/participantes/transportadoras/${id}`),
};

export function listTransportadorasOptions() {
  return transportadorasApi.list().then(({ items }) => items.map((t) => ({ value: t.id, label: t.razaoSocial })));
}
