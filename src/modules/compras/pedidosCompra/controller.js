import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    status: req.query.status,
    filtro: req.query.filtro,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const pedido = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(pedido);
});

export const create = asyncHandler(async (req, res) => {
  const pedido = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(pedido);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const pedido = await service.updateStatus({
    empresaId: req.user.empresaId,
    id: req.params.id,
    status: req.body.status,
  });
  res.json(pedido);
});

export const addItem = asyncHandler(async (req, res) => {
  const item = await service.addItem({
    empresaId: req.user.empresaId,
    pedidoId: req.params.id,
    data: req.body,
  });
  res.status(201).json(item);
});

export const removeItem = asyncHandler(async (req, res) => {
  await service.removeItem({
    empresaId: req.user.empresaId,
    pedidoId: req.params.id,
    itemId: req.params.itemId,
  });
  res.status(204).send();
});

export const receber = asyncHandler(async (req, res) => {
  const pedido = await service.receber({
    empresaId: req.user.empresaId,
    id: req.params.id,
    itens: req.body.itens,
  });
  res.json(pedido);
});

export const duplicar = asyncHandler(async (req, res) => {
  const pedido = await service.duplicar({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(201).json(pedido);
});

export const estornarLote = asyncHandler(async (req, res) => {
  const resultado = await service.estornarLote({
    empresaId: req.user.empresaId,
    pedidoIds: req.body.pedidoIds,
  });
  res.json(resultado);
});

export const listarItens = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.listarItens({
    empresaId: req.user.empresaId,
    skip,
    take,
    produtoId: req.query.produtoId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const favoritos = asyncHandler(async (req, res) => {
  const items = await service.favoritos({
    empresaId: req.user.empresaId,
    fornecedorId: req.query.fornecedorId,
    limite: req.query.limite,
  });
  res.json({ items });
});

export const importarItens = asyncHandler(async (req, res) => {
  const pedido = await service.importarItens({
    empresaId: req.user.empresaId,
    id: req.params.id,
    pedidoOrigemId: req.body.pedidoOrigemId,
  });
  res.json(pedido);
});

export const aplicarFrete = asyncHandler(async (req, res) => {
  const pedido = await service.aplicarFrete({
    empresaId: req.user.empresaId,
    id: req.params.id,
    transportadoraId: req.body.transportadoraId,
    valorFrete: req.body.valorFrete,
  });
  res.json(pedido);
});

export const arquivar = asyncHandler(async (req, res) => {
  const pedido = await service.arquivar({
    empresaId: req.user.empresaId,
    id: req.params.id,
    arquivado: req.body.arquivado,
  });
  res.json(pedido);
});
