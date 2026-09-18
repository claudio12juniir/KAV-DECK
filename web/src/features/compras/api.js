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

export function addItemPedidoCompra(id, item) {
  return apiClient.post(`/compras/pedidos/${id}/itens`, item);
}

export function removeItemPedidoCompra(id, itemId) {
  return apiClient.delete(`/compras/pedidos/${id}/itens/${itemId}`);
}

export function duplicarPedidoCompra(id) {
  return apiClient.post(`/compras/pedidos/${id}/duplicar`);
}

export function importarItensPedidoCompra(id, pedidoOrigemId) {
  return apiClient.post(`/compras/pedidos/${id}/importar-itens`, { pedidoOrigemId });
}

export function aplicarFretePedidoCompra(id, { transportadoraId, valorFrete }) {
  return apiClient.patch(`/compras/pedidos/${id}/frete`, { transportadoraId, valorFrete });
}

export function listItensCompra(filtros = {}) {
  return apiClient.get("/compras/pedidos/itens", filtros);
}

export function listFavoritosCompra({ fornecedorId, limite }) {
  return apiClient.get("/compras/pedidos/favoritos", { fornecedorId, limite }).then(({ items }) => items);
}

export function listColaboradores({ tipo, page, pageSize } = {}) {
  return apiClient.get("/participantes/colaboradores", { tipo, page, pageSize });
}

export function listTransportadoras({ page, pageSize } = {}) {
  return apiClient.get("/participantes/transportadoras", { page, pageSize });
}

export function consultarFreteDescarga({ transportadoraId } = {}) {
  return apiClient.get("/compras/frete-descarga", { transportadoraId });
}

export function gerarFaturaFrete(pedidoIds) {
  return apiClient.post("/compras/frete-descarga/gerar-fatura", { pedidoIds });
}

export function consultarFaturaProdutor({ transportadoraId, dataInicial, dataFinal } = {}) {
  return apiClient.get("/compras/fatura-produtor", { transportadoraId, dataInicial, dataFinal });
}

export function gerarFaturaProdutor({ transportadoraId, dataInicial, dataFinal } = {}) {
  return apiClient.post("/compras/fatura-produtor/gerar", { transportadoraId, dataInicial, dataFinal });
}
