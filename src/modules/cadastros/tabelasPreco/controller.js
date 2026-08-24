import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const tabela = await service.getById({ empresaId: req.user.empresaId, id: req.params.id, usuario: req.user });
  res.json(tabela);
});

export const create = asyncHandler(async (req, res) => {
  const tabela = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(tabela);
});

export const update = asyncHandler(async (req, res) => {
  const tabela = await service.update({ empresaId: req.user.empresaId, id: req.params.id, data: req.body });
  res.json(tabela);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(204).send();
});

export const upsertItem = asyncHandler(async (req, res) => {
  const item = await service.upsertItem({
    empresaId: req.user.empresaId,
    tabelaPrecoId: req.params.id,
    produtoId: req.body.produtoId,
    preco: req.body.preco,
  });
  res.status(201).json(item);
});

export const removeItem = asyncHandler(async (req, res) => {
  await service.removeItem({
    empresaId: req.user.empresaId,
    tabelaPrecoId: req.params.id,
    produtoId: req.params.produtoId,
  });
  res.status(204).send();
});
