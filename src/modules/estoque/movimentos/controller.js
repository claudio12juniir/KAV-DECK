import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    produtoId: req.query.produtoId,
    loteId: req.query.loteId,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const movimento = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(movimento);
});

export const ajustar = asyncHandler(async (req, res) => {
  const movimento = await service.ajustar({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    ...req.body,
  });
  res.status(201).json(movimento);
});

export const ajustarLote = asyncHandler(async (req, res) => {
  const movimentos = await service.ajustarLote({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    itens: req.body.itens,
  });
  res.status(201).json({ itens: movimentos });
});
