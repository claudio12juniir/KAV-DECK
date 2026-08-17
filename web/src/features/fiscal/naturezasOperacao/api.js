import { apiClient } from "../../../lib/apiClient.js";

export const naturezasOperacaoApi = {
  list: (params) => apiClient.get("/fiscal/naturezas-operacao", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/fiscal/naturezas-operacao", data),
  update: (id, data) => apiClient.patch(`/fiscal/naturezas-operacao/${id}`, data),
  remove: (id) => apiClient.delete(`/fiscal/naturezas-operacao/${id}`),
};

export function listNaturezasOperacaoOptions() {
  return naturezasOperacaoApi.list().then(({ items }) => items.map((n) => ({ value: n.id, label: n.descricao })));
}
