import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    fornecedorId: req.query.fornecedorId,
    produtoId: req.query.produtoId,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const upsert = asyncHandler(async (req, res) => {
  const preco = await service.upsert({ empresaId: req.user.empresaId, ...req.body });
  res.status(200).json(preco);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(204).send();
});
