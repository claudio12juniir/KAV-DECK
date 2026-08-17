import { apiClient } from "../../../lib/apiClient.js";

export const departamentosApi = {
  list: (params) => apiClient.get("/cadastros/departamentos", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/cadastros/departamentos", data),
  update: (id, data) => apiClient.patch(`/cadastros/departamentos/${id}`, data),
  remove: (id) => apiClient.delete(`/cadastros/departamentos/${id}`),
};

export function listDepartamentosOptions() {
  return departamentosApi
    .list()
    .then(({ items }) => items.map((d) => ({ value: d.id, label: `${d.codigo} — ${d.nome}` })));
}
