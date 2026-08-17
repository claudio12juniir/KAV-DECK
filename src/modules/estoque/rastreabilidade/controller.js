import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const entradas = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.entradas({
    empresaId: req.user.empresaId,
    skip,
    take,
    produtoId: req.query.produtoId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const saidas = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.saidas({
    empresaId: req.user.empresaId,
    skip,
    take,
    produtoId: req.query.produtoId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const lotes = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.lotes({
    empresaId: req.user.empresaId,
    skip,
    take,
    produtoId: req.query.produtoId,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const porLote = asyncHandler(async (req, res) => {
  const resultado = await service.porLote({ empresaId: req.user.empresaId, loteId: req.params.loteId });
  res.json(resultado);
});
