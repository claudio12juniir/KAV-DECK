import { apiClient } from "../../../lib/apiClient.js";

export const analyticsApi = {
  curvaAbcProdutos: (params) => apiClient.get("/gerenciais/analytics/curva-abc-produtos", params),
  curvaAbcClientes: (params) => apiClient.get("/gerenciais/analytics/curva-abc-clientes", params),
  curvaAbcFornecedores: (params) => apiClient.get("/gerenciais/analytics/curva-abc-fornecedores", params),
};
