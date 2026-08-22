import { apiClient } from "../../../lib/apiClient.js";

export const relatoriosApi = {
  principal: ({ dataInicial, dataFinal }) =>
    apiClient.get("/gerenciais/relatorios/principal", { dataInicial, dataFinal }),
};
