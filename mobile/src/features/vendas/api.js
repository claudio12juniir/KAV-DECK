import { apiClient } from "../../lib/apiClient.js";

export function listPedidosVenda({ status, separadorId, page, pageSize } = {}) {
  return apiClient.get("/vendas/pedidos", { status, separadorId, page, pageSize });
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

// Marca o pedido como "em separação" e (opcionalmente) quem pegou pra
// separar — é o que dá sentido ao Terminal de Separadores no backend
// (permite listar/filtrar por separadorId depois).
export function separarPedidoVenda(id, separadorId) {
  return apiClient.post(`/vendas/pedidos/${id}/separar`, separadorId ? { separadorId } : {});
}

// "Finalizar separação" na prática é faturar: cada item recebe o lote e a
// quantidade fisicamente separados, o que já baixa o estoque e gera o
// título — não tem um passo intermediário "separação concluída" à parte.
export function faturarPedidoVenda(id, itens) {
  return apiClient.post(`/vendas/pedidos/${id}/faturar`, { itens });
}
