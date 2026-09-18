import { apiClient } from "../../../lib/apiClient.js";

export const configuracaoFinanceiraApi = {
  obter: () => apiClient.get("/financeiro/configuracao"),
  atualizar: (contaBancariaPadraoBoletoId) =>
    apiClient.patch("/financeiro/configuracao", { contaBancariaPadraoBoletoId }),
};
