import { apiClient } from "../../lib/apiClient.js";

export function listPedidosCompra({ status, filtro, page, pageSize } = {}) {
  return apiClient.get("/compras/pedidos", { status, filtro, page, pageSize });
}

export function arquivarPedidoCompra(id, arquivado) {
  return apiClient.patch(`/compras/pedidos/${id}/arquivar`, { arquivado });
}

export function getPedidoCompra(id) {
  return apiClient.get(`/compras/pedidos/${id}`);
}

export function createPedidoCompra(data) {
  return apiClient.post("/compras/pedidos", data);
}

export function updatePedidoCompraStatus(id, status) {
  return apiClient.patch(`/compras/pedidos/${id}/status`, { status });
}

export function searchFornecedores(q) {
  return apiClient.get("/participantes/fornecedores", { q, pageSize: 10 });
}

export function receberPedidoCompra(id, itens) {
  return apiClient.post(`/compras/pedidos/${id}/recebimento`, { itens });
}
