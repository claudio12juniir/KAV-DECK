import { apiClient } from "../../../lib/apiClient.js";

export const assinaturaApi = {
  obterDashboard: () => apiClient.get("/sistema/assinatura"),
  comprarAcesso: (data) => apiClient.post("/sistema/assinatura/acessos", data),
  cancelarPonto: (pontoId) => apiClient.delete(`/sistema/assinatura/pontos/${pontoId}`),
  trocarFormaPagamento: (data) => apiClient.post("/sistema/assinatura/forma-pagamento", data),
};
