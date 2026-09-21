import { auditarAtualizacao, auditarCriacao, auditarExclusao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "colaborador";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take, tipo: req.query.tipo });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const colaborador = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(colaborador);
});

export const create = asyncHandler(async (req, res) => {
  const colaborador = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: colaborador.id,
    usuarioId: req.user.id,
    registro: colaborador,
  });
  res.status(201).json(colaborador);
});

export const update = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const colaborador = await service.update({
    empresaId: req.user.empresaId,
    id: req.params.id,
    data: req.body,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: colaborador.id,
    usuarioId: req.user.id,
    antes,
    depois: colaborador,
  });
  res.json(colaborador);
});

export const remove = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  await auditarExclusao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: req.params.id,
    usuarioId: req.user.id,
    registro: antes,
  });
  res.status(204).send();
});
