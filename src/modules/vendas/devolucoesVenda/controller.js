import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    pedidoVendaId: req.query.pedidoVendaId,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const devolucao = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(devolucao);
});

export const create = asyncHandler(async (req, res) => {
  const devolucao = await service.create({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    pedidoVendaId: req.body.pedidoVendaId,
    motivo: req.body.motivo,
    itens: req.body.itens,
  });
  res.status(201).json(devolucao);
});
