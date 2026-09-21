import { auditarAtualizacao, auditarCriacao, auditarExclusao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

const ENTIDADE = "tributacao-produto";

export const list = asyncHandler(async (req, res) => {
  const items = await service.list({ empresaId: req.user.empresaId, produtoId: req.query.produtoId });
  res.json({ items });
});

export const create = asyncHandler(async (req, res) => {
  const item = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: item.id,
    usuarioId: req.user.id,
    registro: item,
  });
  res.status(201).json(item);
});

export const update = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const item = await service.update({ empresaId: req.user.empresaId, id: req.params.id, data: req.body });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: item.id,
    usuarioId: req.user.id,
    antes,
    depois: item,
  });
  res.json(item);
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
