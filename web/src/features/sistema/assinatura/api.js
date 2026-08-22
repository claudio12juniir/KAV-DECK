import { apiClient } from "../../../lib/apiClient.js";

export const assinaturaApi = {
  obterDashboard: () => apiClient.get("/sistema/assinatura"),
  comprarPonto: () => apiClient.post("/sistema/assinatura/pontos"),
  cancelarPonto: (pontoId) => apiClient.delete(`/sistema/assinatura/pontos/${pontoId}`),
};
