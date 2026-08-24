import { apiClient } from "../../../lib/apiClient.js";

// As 6 regras fiscais (ICMS/IPI/PIS/COFINS/IBS/CBS) têm CRUD idêntico no
// backend (ver src/modules/cadastros/regrasFiscais/factory.js) — essa
// fábrica espelha isso no front em vez de repetir o mesmo api.js 6 vezes.
export function criarRegraFiscalApi(resource) {
  return {
    list: (params) => apiClient.get(resource, { pageSize: 200, ...params }),
    create: (data) => apiClient.post(resource, data),
    update: (id, data) => apiClient.patch(`${resource}/${id}`, data),
    remove: (id) => apiClient.delete(`${resource}/${id}`),
  };
}

function criarOptionsLoader(resource) {
  return () =>
    apiClient
      .get(resource, { pageSize: 100 })
      .then(({ items }) => items.map((r) => ({ value: r.id, label: `${r.descricao} (${r.aliquota}%)` })));
}

export const listRegrasIcmsOptions = criarOptionsLoader("/cadastros/regras-icms");
export const listRegrasIpiOptions = criarOptionsLoader("/cadastros/regras-ipi");
export const listRegrasPisOptions = criarOptionsLoader("/cadastros/regras-pis");
export const listRegrasCofinsOptions = criarOptionsLoader("/cadastros/regras-cofins");
