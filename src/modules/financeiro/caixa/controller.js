import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    contaBancariaId: req.query.contaBancariaId,
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const create = asyncHandler(async (req, res) => {
  const movimento = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(movimento);
});
