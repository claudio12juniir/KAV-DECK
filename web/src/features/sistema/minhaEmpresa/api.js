import { apiClient } from "../../../lib/apiClient.js";

export const minhaEmpresaApi = {
  obter: () => apiClient.get("/sistema/minha-empresa"),
  atualizar: (data) => apiClient.patch("/sistema/minha-empresa", data),
};
