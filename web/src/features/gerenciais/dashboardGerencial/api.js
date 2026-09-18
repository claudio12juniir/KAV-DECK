import { apiClient } from "../../../lib/apiClient.js";

export const dashboardGerencialApi = {
  faturamento: (ano) => apiClient.get("/gerenciais/dashboard/faturamento", { ano }),
  titulosAnual: (anos) => apiClient.get("/gerenciais/dashboard/titulos-anual", { anos: anos.join(",") }),
};
