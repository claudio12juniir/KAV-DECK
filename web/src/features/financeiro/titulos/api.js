import { apiClient } from "../../../lib/apiClient.js";

export function listTitulos({
  tipo,
  status,
  q,
  vencimentoInicial,
  vencimentoFinal,
  ordenarPor,
  ordem,
  page,
  pageSize,
} = {}) {
  return apiClient.get("/financeiro/titulos", {
    tipo,
    status,
    q,
    vencimentoInicial,
    vencimentoFinal,
    ordenarPor,
    ordem,
    page,
    pageSize,
  });
}

export function getTitulo(id) {
  return apiClient.get(`/financeiro/titulos/${id}`);
}

export function baixarTitulo(id, { valorBaixado, formaBaixa, dataBaixa }) {
  return apiClient.post(`/financeiro/titulos/${id}/baixas`, { valorBaixado, formaBaixa, dataBaixa });
}

export function cancelarTitulo(id) {
  return apiClient.patch(`/financeiro/titulos/${id}/cancelar`);
}
