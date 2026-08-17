import { apiClient } from "../../../lib/apiClient.js";

export function listCfop(params) {
  return apiClient.get("/fiscal/cfop", { pageSize: 100, ...params });
}

export function listCfopOptions() {
  return listCfop().then(({ items }) => items.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.descricao}` })));
}
