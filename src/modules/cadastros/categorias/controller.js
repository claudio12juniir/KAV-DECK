import { registrarLog } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "categoria";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const categoria = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(categoria);
});

export const create = asyncHandler(async (req, res) => {
  const categoria = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await registrarLog({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: categoria.id,
    acao: "CRIACAO",
    usuarioId: req.user.id,
    dados: categoria,
  });
  res.status(201).json(categoria);
});

export const update = asyncHandler(async (req, res) => {
  const categoria = await service.update({
    empresaId: req.user.empresaId,
    id: req.params.id,
    data: req.body,
  });
  await registrarLog({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: categoria.id,
    acao: "ATUALIZACAO",
    usuarioId: req.user.id,
    dados: categoria,
  });
  res.json(categoria);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  await registrarLog({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: req.params.id,
    acao: "EXCLUSAO",
    usuarioId: req.user.id,
  });
  res.status(204).send();
});
