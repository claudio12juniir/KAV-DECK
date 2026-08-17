import { apiClient } from "../../lib/apiClient.js";

export function listPedidosVenda({ status, page, pageSize } = {}) {
  return apiClient.get("/vendas/pedidos", { status, page, pageSize });
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
