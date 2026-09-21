import { auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "ocorrencia";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    pedidoVendaId: req.query.pedidoVendaId,
    clienteId: req.query.clienteId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const ocorrencia = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(ocorrencia);
});

export const create = asyncHandler(async (req, res) => {
  const ocorrencia = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: ocorrencia.id,
    usuarioId: req.user.id,
    registro: ocorrencia,
  });
  res.status(201).json(ocorrencia);
});

export const listarOpcoes = asyncHandler(async (req, res) => {
  const opcoes = await service.listarOpcoes({ empresaId: req.user.empresaId });
  res.json(opcoes);
});
