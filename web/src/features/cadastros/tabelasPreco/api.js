import { apiClient } from "../../../lib/apiClient.js";

export const tabelasPrecoApi = {
  list: (params) => apiClient.get("/cadastros/tabelas-preco", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/cadastros/tabelas-preco", data),
  update: (id, data) => apiClient.patch(`/cadastros/tabelas-preco/${id}`, data),
  remove: (id) => apiClient.delete(`/cadastros/tabelas-preco/${id}`),
};

export function getTabelaPreco(id) {
  return apiClient.get(`/cadastros/tabelas-preco/${id}`);
}

export function upsertItemTabelaPreco(tabelaId, produtoId, preco) {
  return apiClient.post(`/cadastros/tabelas-preco/${tabelaId}/itens`, { produtoId, preco });
}

export function removeItemTabelaPreco(tabelaId, produtoId) {
  return apiClient.delete(`/cadastros/tabelas-preco/${tabelaId}/itens/${produtoId}`);
}

export function listTabelasPrecoOptions() {
  return tabelasPrecoApi.list().then(({ items }) => items.map((t) => ({ value: t.id, label: t.nome })));
}
