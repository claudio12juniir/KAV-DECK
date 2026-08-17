import { apiClient } from "../../../lib/apiClient.js";

export const certificadosDigitaisApi = {
  list: (params) => apiClient.get("/fiscal/certificados-digitais", { pageSize: 100, ...params }),
  create: (data) => apiClient.post("/fiscal/certificados-digitais", data),
  update: (id, data) => apiClient.patch(`/fiscal/certificados-digitais/${id}`, data),
  remove: (id) => apiClient.delete(`/fiscal/certificados-digitais/${id}`),
};

export function listCertificadosDigitaisOptions() {
  return certificadosDigitaisApi.list().then(({ items }) => items.map((c) => ({ value: c.id, label: c.nome })));
}
