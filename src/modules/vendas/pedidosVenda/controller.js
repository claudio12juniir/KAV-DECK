import { auditarAtualizacao, auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "pedido-venda";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    status: req.query.status,
    filtro: req.query.filtro,
    separadorId: req.query.separadorId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const pedido = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(pedido);
});

export const create = asyncHandler(async (req, res) => {
  const pedido = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: pedido.id,
    usuarioId: req.user.id,
    registro: pedido,
  });
  res.status(201).json(pedido);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const pedido = await service.updateStatus({
    empresaId: req.user.empresaId,
    id: req.params.id,
    status: req.body.status,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: pedido.id,
    usuarioId: req.user.id,
    antes: { status: antes.status },
    depois: { status: pedido.status },
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

export const faturar = asyncHandler(async (req, res) => {
  const pedido = await service.faturar({
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

export const agruparNF = asyncHandler(async (req, res) => {
  const nota = await service.agruparNF({ empresaId: req.user.empresaId, ...req.body });
  res.status(201).json(nota);
});

export const separar = asyncHandler(async (req, res) => {
  const pedido = await service.separar({
    empresaId: req.user.empresaId,
    id: req.params.id,
    separadorId: req.body.separadorId,
  });
  res.json(pedido);
});

export const aplicarDesconto = asyncHandler(async (req, res) => {
  const pedido = await service.aplicarDesconto({
    empresaId: req.user.empresaId,
    id: req.params.id,
    desconto: req.body.desconto,
  });
  res.json(pedido);
});

export const dividir = asyncHandler(async (req, res) => {
  const resultado = await service.dividir({
    empresaId: req.user.empresaId,
    id: req.params.id,
    itemIds: req.body.itemIds,
  });
  res.status(201).json(resultado);
});

export const atribuirItinerario = asyncHandler(async (req, res) => {
  const pedido = await service.atribuirItinerario({
    empresaId: req.user.empresaId,
    id: req.params.id,
    rotaEntregaId: req.body.rotaEntregaId,
    turno: req.body.turno,
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

export const atualizarVendedor = asyncHandler(async (req, res) => {
  const pedido = await service.atualizarVendedor({
    empresaId: req.user.empresaId,
    id: req.params.id,
    vendedorId: req.body.vendedorId,
  });
  res.json(pedido);
});

export const atualizarCliente = asyncHandler(async (req, res) => {
  const pedido = await service.atualizarCliente({
    empresaId: req.user.empresaId,
    id: req.params.id,
    clienteId: req.body.clienteId,
  });
  res.json(pedido);
});

export const favoritos = asyncHandler(async (req, res) => {
  const items = await service.favoritos({
    empresaId: req.user.empresaId,
    clienteId: req.query.clienteId,
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
