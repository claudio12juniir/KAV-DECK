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
