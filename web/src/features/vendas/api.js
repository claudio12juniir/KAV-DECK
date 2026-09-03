import { apiClient } from "../../lib/apiClient.js";

export function listPedidosVenda({ status, filtro, page, pageSize } = {}) {
  return apiClient.get("/vendas/pedidos", { status, filtro, page, pageSize });
}

export function arquivarPedidoVenda(id, arquivado) {
  return apiClient.patch(`/vendas/pedidos/${id}/arquivar`, { arquivado });
}

export function getPedidoVenda(id) {
  return apiClient.get(`/vendas/pedidos/${id}`);
}

export function createPedidoVenda(data) {
  return apiClient.post("/vendas/pedidos", data);
}

export function updatePedidoVendaStatus(id, status) {
  return apiClient.patch(`/vendas/pedidos/${id}/status`, { status });
}

export function searchClientes(q) {
  return apiClient.get("/participantes/clientes", { q, pageSize: 10 });
}

export function getOuCriarConsumidorFinal() {
  return apiClient.post("/participantes/clientes/consumidor-final");
}

export function duplicarPedidoVenda(id) {
  return apiClient.post(`/vendas/pedidos/${id}/duplicar`);
}

export function getCliente(id) {
  return apiClient.get(`/participantes/clientes/${id}`);
}

export function faturarPedidoVenda(id, itens) {
  return apiClient.post(`/vendas/pedidos/${id}/faturar`, { itens });
}

export function addItemPedidoVenda(id, item) {
  return apiClient.post(`/vendas/pedidos/${id}/itens`, item);
}

export function removeItemPedidoVenda(id, itemId) {
  return apiClient.delete(`/vendas/pedidos/${id}/itens/${itemId}`);
}

export function listDevolucoes({ pedidoVendaId, page, pageSize } = {}) {
  return apiClient.get("/vendas/devolucoes", { pedidoVendaId, page, pageSize });
}

export function createDevolucao(data) {
  return apiClient.post("/vendas/devolucoes", data);
}

export function listOcorrencias({ pedidoVendaId, clienteId, dataInicial, dataFinal, page, pageSize } = {}) {
  return apiClient.get("/vendas/ocorrencias", { pedidoVendaId, clienteId, dataInicial, dataFinal, page, pageSize });
}

export function createOcorrencia(data) {
  return apiClient.post("/vendas/ocorrencias", data);
}

export function consultarItinerario({ data, turno, rotaEntregaId }) {
  return apiClient.get("/vendas/itinerario", { data, turno, rotaEntregaId });
}

export function listRotasEntrega({ page, pageSize } = {}) {
  return apiClient.get("/participantes/rotas-entrega", { page, pageSize });
}
