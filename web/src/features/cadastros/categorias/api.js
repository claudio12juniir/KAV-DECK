import { apiClient } from "../../../lib/apiClient.js";

export const categoriasApi = {
  list: (params) => apiClient.get("/cadastros/categorias", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/cadastros/categorias", data),
  update: (id, data) => apiClient.patch(`/cadastros/categorias/${id}`, data),
  remove: (id) => apiClient.delete(`/cadastros/categorias/${id}`),
};

export function listCategoriasOptions() {
  return categoriasApi.list().then(({ items }) => items.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.nome}` })));
}
