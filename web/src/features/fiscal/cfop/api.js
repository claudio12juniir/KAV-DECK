import { apiClient } from "../../../lib/apiClient.js";

export function listCfop(params) {
  return apiClient.get("/fiscal/cfop", { pageSize: 100, ...params });
}

// A tabela CFOP tem ~600 códigos e o backend limita pageSize a 100 (ver
// MAX_PAGE_SIZE em src/utils/pagination.js) — pagina até esgotar em vez de
// devolver só a primeira página pro <select> de CFOP.
export async function listCfopOptions() {
  const todos = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { items, pagination } = await listCfop({ page, pageSize: 100 });
    todos.push(...items);
    if (page >= pagination.totalPages) break;
    page += 1;
  }
  return todos.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.descricao}` }));
}
