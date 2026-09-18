import { apiClient } from "../../lib/apiClient.js";

export function listPedidosVenda({ status, filtro, separadorId, dataInicial, dataFinal, page, pageSize } = {}) {
  return apiClient.get("/vendas/pedidos", { status, filtro, separadorId, dataInicial, dataFinal, page, pageSize });
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

export function listDevolucoes({ pedidoVendaId, dataInicial, dataFinal, page, pageSize } = {}) {
  return apiClient.get("/vendas/devolucoes", { pedidoVendaId, dataInicial, dataFinal, page, pageSize });
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

export function listRotasEntrega({ page, pageSize } = {}) {
  return apiClient.get("/participantes/rotas-entrega", { page, pageSize });
}

export function listTransportadoras({ page, pageSize } = {}) {
  return apiClient.get("/participantes/transportadoras", { page, pageSize });
}

export function listColaboradores({ tipo, page, pageSize } = {}) {
  return apiClient.get("/participantes/colaboradores", { tipo, page, pageSize });
}

// --- Terminal de Separadores (kanban) ---

export function kanbanSeparadores({ separadorId, dataInicial, dataFinal } = {}) {
  return apiClient.get("/vendas/separadores/kanban", { separadorId, dataInicial, dataFinal });
}

export function separarPedidoVenda(id, separadorId) {
  return apiClient.post(`/vendas/pedidos/${id}/separar`, { separadorId });
}

// --- Consulta de Itens / Listagem para Compra / Controle de Produção / Terminal de Preços ---
// As 4 telas usam o mesmo endpoint com combinações diferentes de filtro —
// ver seção 15 do MAPEAMENTO_VENDAS_SPACESOFT.md.

export function listItensVenda(filtros = {}) {
  return apiClient.get("/vendas/itens", filtros);
}

export function totaisItensVenda(filtros = {}) {
  return apiClient.get("/vendas/itens/totais", filtros);
}

export function marcarItemImpresso(id, impresso) {
  return apiClient.patch(`/vendas/itens/${id}/impresso`, { impresso });
}

// --- Ocorrências ---

export function opcoesOcorrencia() {
  return apiClient.get("/vendas/ocorrencias/opcoes");
}

// --- Itinerário (entidade persistida) ---

export function consultarItinerarios(filtros = {}) {
  return apiClient.get("/vendas/itinerario", filtros);
}

export function getItinerario(id) {
  return apiClient.get(`/vendas/itinerario/${id}`);
}

export function criarItinerario(data) {
  return apiClient.post("/vendas/itinerario", data);
}

export function gerarAutomaticoItinerario(data) {
  return apiClient.post("/vendas/itinerario/gerar-automatico", data);
}

export function vincularPedidoItinerario(id, pedidoId) {
  return apiClient.patch(`/vendas/itinerario/${id}/pedidos`, { pedidoId });
}

export function atualizarItinerario(id, data) {
  return apiClient.patch(`/vendas/itinerario/${id}`, data);
}

export function gerarFaturaItinerario(itinerarioIds) {
  return apiClient.post("/vendas/itinerario/gerar-fatura", { itinerarioIds });
}

// --- Ações do Terminal de Venda / Consulta de Pedidos (seção 16 do mapeamento) ---

export function aplicarDescontoPedidoVenda(id, desconto) {
  return apiClient.patch(`/vendas/pedidos/${id}/desconto`, { desconto });
}

export function dividirPedidoVenda(id, itemIds) {
  return apiClient.post(`/vendas/pedidos/${id}/dividir`, { itemIds });
}

export function agruparNfPedidosVenda(data) {
  return apiClient.post("/vendas/pedidos/agrupar-nf", data);
}

export function atribuirItinerarioPedido(id, data) {
  return apiClient.patch(`/vendas/pedidos/${id}/itinerario`, data);
}

export function atualizarVendedorPedidoVenda(id, vendedorId) {
  return apiClient.patch(`/vendas/pedidos/${id}/vendedor`, { vendedorId });
}

export function atualizarClientePedidoVenda(id, clienteId) {
  return apiClient.patch(`/vendas/pedidos/${id}/cliente`, { clienteId });
}

export function listFavoritosVenda({ clienteId, limite }) {
  return apiClient.get("/vendas/pedidos/favoritos", { clienteId, limite }).then(({ items }) => items);
}

export function importarItensPedidoVenda(id, pedidoOrigemId) {
  return apiClient.post(`/vendas/pedidos/${id}/importar-itens`, { pedidoOrigemId });
}
