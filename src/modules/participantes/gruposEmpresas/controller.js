import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const grupo = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(grupo);
});

export const create = asyncHandler(async (req, res) => {
  const grupo = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(grupo);
});

export const update = asyncHandler(async (req, res) => {
  const grupo = await service.update({ empresaId: req.user.empresaId, id: req.params.id, data: req.body });
  res.json(grupo);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(204).send();
});
