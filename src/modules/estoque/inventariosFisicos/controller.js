import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const inventario = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(inventario);
});

export const create = asyncHandler(async (req, res) => {
  const inventario = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(inventario);
});

export const fechar = asyncHandler(async (req, res) => {
  const resultado = await service.fechar({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(resultado);
});
