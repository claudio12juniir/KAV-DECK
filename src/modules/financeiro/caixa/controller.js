import { auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "movimento-caixa";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    contaBancariaId: req.query.contaBancariaId,
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

// Caixa é só lançamento (sem edição/exclusão) — audita apenas a criação,
// registrando quem lançou o movimento e quando.
export const create = asyncHandler(async (req, res) => {
  const movimento = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: movimento.id,
    usuarioId: req.user.id,
    registro: movimento,
  });
  res.status(201).json(movimento);
});
