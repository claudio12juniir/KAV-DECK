import { apiClient } from "../../../lib/apiClient.js";

export const condicoesPagamentoApi = {
  list: (params) => apiClient.get("/cadastros/condicoes-pagamento", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/cadastros/condicoes-pagamento", data),
  update: (id, data) => apiClient.patch(`/cadastros/condicoes-pagamento/${id}`, data),
  remove: (id) => apiClient.delete(`/cadastros/condicoes-pagamento/${id}`),
};

export function listCondicoesPagamentoOptions() {
  return condicoesPagamentoApi.list().then(({ items }) => items.map((c) => ({ value: c.id, label: c.descricao })));
}
