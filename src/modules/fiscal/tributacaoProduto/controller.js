import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const items = await service.list({ empresaId: req.user.empresaId, produtoId: req.query.produtoId });
  res.json({ items });
});

export const create = asyncHandler(async (req, res) => {
  const item = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(item);
});

export const update = asyncHandler(async (req, res) => {
  const item = await service.update({ empresaId: req.user.empresaId, id: req.params.id, data: req.body });
  res.json(item);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(204).send();
});
