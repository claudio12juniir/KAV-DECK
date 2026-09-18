import { apiClient } from "../../../lib/apiClient.js";

export function projetarFluxoCaixa({ dataInicial, dataFinal }) {
  return apiClient.get("/financeiro/fluxo-caixa", { dataInicial, dataFinal });
}
