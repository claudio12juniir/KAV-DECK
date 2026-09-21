import { apiClient } from "../../../lib/apiClient.js";

export const logsApi = {
  list: (entidade, entidadeId) => apiClient.get("/cadastros/logs", { entidade, entidadeId }),
  ultimas: (entidade, ids) =>
    apiClient.get("/cadastros/logs/ultimas", { entidade, ids: ids.join(",") }).then((r) => r.itens),
};
