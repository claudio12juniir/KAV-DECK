import { apiClient } from "../../../lib/apiClient.js";

export const unidadesMedidaApi = {
  list: (params) => apiClient.get("/cadastros/unidades-medida", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/cadastros/unidades-medida", data),
  update: (id, data) => apiClient.patch(`/cadastros/unidades-medida/${id}`, data),
  remove: (id) => apiClient.delete(`/cadastros/unidades-medida/${id}`),
};

export function listUnidadesMedidaOptions() {
  return unidadesMedidaApi.list().then(({ items }) => items.map((u) => ({ value: u.id, label: `${u.sigla} — ${u.descricao}` })));
}
