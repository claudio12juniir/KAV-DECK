import { auditarAtualizacao, auditarCriacao, auditarExclusao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "preco-compra";

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
  const antes = await service.getByChave({
    empresaId: req.user.empresaId,
    fornecedorId: req.body.fornecedorId,
    produtoId: req.body.produtoId,
  });
  const preco = await service.upsert({ empresaId: req.user.empresaId, ...req.body });
  if (antes) {
    await auditarAtualizacao({
      empresaId: req.user.empresaId,
      entidade: ENTIDADE,
      entidadeId: preco.id,
      usuarioId: req.user.id,
      antes,
      depois: preco,
    });
  } else {
    await auditarCriacao({
      empresaId: req.user.empresaId,
      entidade: ENTIDADE,
      entidadeId: preco.id,
      usuarioId: req.user.id,
      registro: preco,
    });
  }
  res.status(200).json(preco);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  await auditarExclusao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: req.params.id,
    usuarioId: req.user.id,
  });
  res.status(204).send();
});
