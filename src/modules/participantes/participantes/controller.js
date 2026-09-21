import { auditarAtualizacao, auditarCriacao, auditarExclusao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "participante";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const ativo = req.query.ativo === undefined ? undefined : req.query.ativo === "true";
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    ativo,
    q: req.query.q,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const participante = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(participante);
});

export const create = asyncHandler(async (req, res) => {
  const participante = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: participante.id,
    usuarioId: req.user.id,
    registro: participante,
  });
  res.status(201).json(participante);
});

export const update = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const participante = await service.update({
    empresaId: req.user.empresaId,
    id: req.params.id,
    data: req.body,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: participante.id,
    usuarioId: req.user.id,
    antes,
    depois: participante,
  });
  res.json(participante);
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

export const addEndereco = asyncHandler(async (req, res) => {
  const endereco = await service.addEndereco({
    empresaId: req.user.empresaId,
    participanteId: req.params.id,
    data: req.body,
  });
  res.status(201).json(endereco);
});

export const removeEndereco = asyncHandler(async (req, res) => {
  await service.removeEndereco({
    empresaId: req.user.empresaId,
    participanteId: req.params.id,
    enderecoId: req.params.enderecoId,
  });
  res.status(204).send();
});

export const promoteToCliente = asyncHandler(async (req, res) => {
  const cliente = await service.promoteToCliente({
    empresaId: req.user.empresaId,
    participanteId: req.params.id,
    data: req.body,
  });
  res.status(201).json(cliente);
});

export const promoteToFornecedor = asyncHandler(async (req, res) => {
  const fornecedor = await service.promoteToFornecedor({
    empresaId: req.user.empresaId,
    participanteId: req.params.id,
  });
  res.status(201).json(fornecedor);
});
