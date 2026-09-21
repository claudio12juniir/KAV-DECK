import { auditarAtualizacao, auditarCriacao, auditarExclusao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "tabela-preco";

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
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: tabela.id,
    usuarioId: req.user.id,
    registro: tabela,
  });
  res.status(201).json(tabela);
});

export const update = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const tabela = await service.update({ empresaId: req.user.empresaId, id: req.params.id, data: req.body });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: tabela.id,
    usuarioId: req.user.id,
    antes,
    depois: tabela,
  });
  res.json(tabela);
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
