import { apiClient } from "../../../lib/apiClient.js";

export const utilitariosFiscaisApi = {
  porCfop: (params) => apiClient.get("/fiscal/utilitarios/por-cfop", params),
  porCfopUf: (params) => apiClient.get("/fiscal/utilitarios/por-cfop-uf", params),
  porProduto: (params) => apiClient.get("/fiscal/utilitarios/por-produto", params),
};
