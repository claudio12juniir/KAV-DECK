import { apiClient } from "../../../lib/apiClient.js";

export function listNotasFiscais({ tipoOperacao, status, page, pageSize } = {}) {
  return apiClient.get("/fiscal/notas", { tipoOperacao, status, page, pageSize });
}

export function getNotaFiscal(id) {
  return apiClient.get(`/fiscal/notas/${id}`);
}

export function createNotaFiscal(data) {
  return apiClient.post("/fiscal/notas", data);
}

export function updateNotaFiscalStatus(id, status, chaveAcesso) {
  return apiClient.patch(`/fiscal/notas/${id}/status`, { status, ...(chaveAcesso ? { chaveAcesso } : {}) });
}

export function addManifestacao(id, tipoEvento) {
  return apiClient.post(`/fiscal/notas/${id}/manifestacoes`, { tipoEvento });
}
