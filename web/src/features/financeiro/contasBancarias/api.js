import { apiClient } from "../../../lib/apiClient.js";

export const contasBancariasApi = {
  list: (params) => apiClient.get("/financeiro/contas-bancarias", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/financeiro/contas-bancarias", data),
  update: (id, data) => apiClient.patch(`/financeiro/contas-bancarias/${id}`, data),
  remove: (id) => apiClient.delete(`/financeiro/contas-bancarias/${id}`),
};

export function listContasBancariasOptions() {
  return contasBancariasApi
    .list()
    .then(({ items }) => items.map((c) => ({ value: c.id, label: `${c.banco} — ag. ${c.agencia} / cc ${c.conta}` })));
}
