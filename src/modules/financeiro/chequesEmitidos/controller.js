import { auditarAtualizacao, auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "cheque-emitido";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    status: req.query.status,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const cheque = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(cheque);
});

export const create = asyncHandler(async (req, res) => {
  const cheque = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: cheque.id,
    usuarioId: req.user.id,
    registro: cheque,
  });
  res.status(201).json(cheque);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const cheque = await service.updateStatus({
    empresaId: req.user.empresaId,
    id: req.params.id,
    status: req.body.status,
    dataCompensacao: req.body.dataCompensacao,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: cheque.id,
    usuarioId: req.user.id,
    antes,
    depois: cheque,
  });
  res.json(cheque);
});
