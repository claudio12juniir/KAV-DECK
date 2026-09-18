import { apiClient } from "../../../lib/apiClient.js";

export const configuracaoFiscalApi = {
  obter: () => apiClient.get("/fiscal/configuracoes"),
  salvar: (data) => apiClient.patch("/fiscal/configuracoes", data),
};
