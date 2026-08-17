import { apiClient } from "../../../lib/apiClient.js";

export const rotasEntregaApi = {
  list: (params) => apiClient.get("/participantes/rotas-entrega", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/participantes/rotas-entrega", data),
  update: (id, data) => apiClient.patch(`/participantes/rotas-entrega/${id}`, data),
  remove: (id) => apiClient.delete(`/participantes/rotas-entrega/${id}`),
};

export function listRotasEntregaOptions() {
  return rotasEntregaApi.list().then(({ items }) => items.map((r) => ({ value: r.id, label: r.nome })));
}
