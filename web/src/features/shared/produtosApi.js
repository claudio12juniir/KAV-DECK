import { apiClient } from "../../lib/apiClient.js";

export function searchProdutos(q) {
  return apiClient.get("/cadastros/produtos", { q, ativo: "true", pageSize: 10 });
}
