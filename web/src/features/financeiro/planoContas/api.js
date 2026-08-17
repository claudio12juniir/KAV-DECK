import { apiClient } from "../../../lib/apiClient.js";

export const planoContasApi = {
  list: (params) => apiClient.get("/financeiro/plano-contas", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/financeiro/plano-contas", data),
  update: (id, data) => apiClient.patch(`/financeiro/plano-contas/${id}`, data),
  remove: (id) => apiClient.delete(`/financeiro/plano-contas/${id}`),
};

export function listPlanoContasOptions() {
  return planoContasApi.list().then(({ items }) => items.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.nome}` })));
}
