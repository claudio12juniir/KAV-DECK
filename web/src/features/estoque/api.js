import { apiClient } from "../../lib/apiClient.js";

export function listLotes({ produtoId, page, pageSize } = {}) {
  return apiClient.get("/estoque/lotes", { produtoId, page, pageSize });
}

export function listMovimentos({ produtoId, loteId, page, pageSize } = {}) {
  return apiClient.get("/estoque/movimentos", { produtoId, loteId, page, pageSize });
}

export function ajustarEstoque({ loteId, quantidade, motivo }) {
  return apiClient.post("/estoque/movimentos/ajustes", { loteId, quantidade, motivo });
}

export function listRastreabilidadeLotes({ produtoId, page, pageSize } = {}) {
  return apiClient.get("/estoque/rastreabilidade/lotes", { produtoId, page, pageSize });
}

export function getRastreabilidadePorLote(loteId) {
  return apiClient.get(`/estoque/rastreabilidade/lotes/${loteId}`);
}

export function listRecebimento({ fornecedorId, produtoId, departamentoId, dataInicial, dataFinal, apenasPendente, page, pageSize } = {}) {
  return apiClient.get("/estoque/recebimento", {
    fornecedorId,
    produtoId,
    departamentoId,
    dataInicial,
    dataFinal,
    apenasPendente,
    page,
    pageSize,
  });
}
