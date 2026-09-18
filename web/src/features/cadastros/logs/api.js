import { apiClient } from "../../../lib/apiClient.js";

export const logsApi = {
  list: (entidade, entidadeId) => apiClient.get("/cadastros/logs", { entidade, entidadeId }),
};
